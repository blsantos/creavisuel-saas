-- ===================================================
-- Migration 002: Create Tenant Configs Table
-- Description: Stores branding, AI configuration, and PWA settings per tenant
-- ===================================================

-- Create tenant_configs table
CREATE TABLE IF NOT EXISTS tenant_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branding JSONB NOT NULL DEFAULT '{}',
  ai_config JSONB NOT NULL DEFAULT '{}',
  pwa_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index on tenant_id for fast lookups
CREATE INDEX idx_tenant_configs_tenant_id ON tenant_configs(tenant_id);

-- Enable Row Level Security
ALTER TABLE tenant_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_configs table

-- Admins can view all configs
CREATE POLICY "Admins can view all tenant configs"
  ON tenant_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert configs
CREATE POLICY "Admins can insert tenant configs"
  ON tenant_configs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update configs
CREATE POLICY "Admins can update tenant configs"
  ON tenant_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Tenant owners can view their config
CREATE POLICY "Owners can view their tenant config"
  ON tenant_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_configs.tenant_id
      AND tenants.owner_id = auth.uid()
    )
  );

-- Tenant owners can update their config
CREATE POLICY "Owners can update their tenant config"
  ON tenant_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_configs.tenant_id
      AND tenants.owner_id = auth.uid()
    )
  );

-- Public can view configs (for branding on public-facing pages)
CREATE POLICY "Public can view tenant configs"
  ON tenant_configs
  FOR SELECT
  USING (true);

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_tenant_configs_updated_at
  BEFORE UPDATE ON tenant_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate branding JSONB structure
CREATE OR REPLACE FUNCTION validate_branding_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check required fields exist
  IF NOT (config ? 'primaryColor' AND config ? 'companyName' AND config ? 'assistantName') THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate AI config JSONB structure
CREATE OR REPLACE FUNCTION validate_ai_config(config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check required fields exist
  IF NOT (config ? 'webhookUrl' AND config ? 'systemPrompt') THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert seed data: Default admin tenant config
INSERT INTO tenant_configs (tenant_id, branding, ai_config)
SELECT
  t.id,
  jsonb_build_object(
    'primaryColor', '#00d4ff',
    'accentColor', '#8a2be2',
    'backgroundColor', '#0a0e27',
    'foregroundColor', '#ffffff',
    'companyName', 'CréaVisuel',
    'assistantName', 'Assistant IA',
    'welcomeMessage', 'Bienvenue sur CréaVisuel Admin'
  ),
  jsonb_build_object(
    'webhookUrl', '',
    'systemPrompt', 'Tu es un assistant IA pour la plateforme CréaVisuel.',
    'tone', 'professional',
    'temperature', 0.7,
    'maxTokens', 2000
  )
FROM tenants t
WHERE t.slug = 'admin'
ON CONFLICT (tenant_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE tenant_configs IS 'Stores branding, AI config, and PWA settings for each tenant';
COMMENT ON COLUMN tenant_configs.branding IS 'JSON object with colors, logos, fonts, assistant name, welcome message';
COMMENT ON COLUMN tenant_configs.ai_config IS 'JSON object with webhook URL, system prompt, model settings';
COMMENT ON COLUMN tenant_configs.pwa_config IS 'JSON object with PWA manifest configuration';
