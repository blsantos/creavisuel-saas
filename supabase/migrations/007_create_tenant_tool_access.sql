-- ===================================================
-- Migration 007: Create Tenant Tool Access Table
-- Description: Controls which tools each tenant can access
-- ===================================================

-- Create tenant_tool_access table
CREATE TABLE IF NOT EXISTS tenant_tool_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools_catalog(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT TRUE,
  token_limit INTEGER, -- Monthly limit for this tool (NULL = unlimited)
  tokens_used INTEGER DEFAULT 0, -- Current month usage
  custom_config JSONB DEFAULT '{}', -- Tool-specific configuration
  expires_at TIMESTAMPTZ, -- For trial access
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(tenant_id, tool_id)
);

-- Create indexes
CREATE INDEX idx_tenant_tool_access_tenant_id ON tenant_tool_access(tenant_id);
CREATE INDEX idx_tenant_tool_access_tool_id ON tenant_tool_access(tool_id);
CREATE INDEX idx_tenant_tool_access_is_enabled ON tenant_tool_access(is_enabled);
CREATE INDEX idx_tenant_tool_access_expires_at ON tenant_tool_access(expires_at);

-- GIN index for custom_config JSONB queries
CREATE INDEX idx_tenant_tool_access_custom_config ON tenant_tool_access USING GIN (custom_config);

-- Enable Row Level Security
ALTER TABLE tenant_tool_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_tool_access table

-- Admins can view all access records
CREATE POLICY "Admins can view all tenant tool access"
  ON tenant_tool_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert access records
CREATE POLICY "Admins can insert tenant tool access"
  ON tenant_tool_access
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update access records
CREATE POLICY "Admins can update tenant tool access"
  ON tenant_tool_access
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can delete access records
CREATE POLICY "Admins can delete tenant tool access"
  ON tenant_tool_access
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view their tenant's tool access
CREATE POLICY "Users can view their tenant tool access"
  ON tenant_tool_access
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_tenant_tool_access_updated_at
  BEFORE UPDATE ON tenant_tool_access
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if tenant has access to a tool
CREATE OR REPLACE FUNCTION check_tool_access(p_tenant_id UUID, p_tool_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_access BOOLEAN;
BEGIN
  SELECT
    (tta.is_enabled = TRUE AND (tta.expires_at IS NULL OR tta.expires_at > NOW()))
  INTO v_has_access
  FROM tenant_tool_access tta
  JOIN tools_catalog tc ON tc.id = tta.tool_id
  WHERE tta.tenant_id = p_tenant_id
  AND tc.name = p_tool_name;

  RETURN COALESCE(v_has_access, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Function to get available tools for a tenant
CREATE OR REPLACE FUNCTION get_tenant_tools(p_tenant_id UUID)
RETURNS TABLE (
  tool_id UUID,
  tool_name TEXT,
  display_name TEXT,
  category TEXT,
  is_premium BOOLEAN,
  is_enabled BOOLEAN,
  tokens_used INTEGER,
  token_limit INTEGER,
  usage_percent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id AS tool_id,
    tc.name AS tool_name,
    tc.display_name,
    tc.category,
    tc.is_premium,
    tta.is_enabled,
    tta.tokens_used,
    tta.token_limit,
    CASE
      WHEN tta.token_limit IS NULL THEN 0::DECIMAL
      WHEN tta.token_limit = 0 THEN 100::DECIMAL
      ELSE (tta.tokens_used::DECIMAL / tta.token_limit::DECIMAL * 100)::DECIMAL
    END AS usage_percent
  FROM tools_catalog tc
  LEFT JOIN tenant_tool_access tta ON tta.tool_id = tc.id AND tta.tenant_id = p_tenant_id
  WHERE tc.is_active = TRUE
  AND (tta.is_enabled = TRUE OR tta.is_enabled IS NULL)
  AND (tta.expires_at IS NULL OR tta.expires_at > NOW())
  ORDER BY tc.category, tc.name;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly token usage (to be called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_token_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE tenant_tool_access
  SET tokens_used = 0;
END;
$$ LANGUAGE plpgsql;

-- Insert seed data: Grant admin tenant access to all free tools
INSERT INTO tenant_tool_access (tenant_id, tool_id, is_enabled, token_limit)
SELECT
  t.id,
  tc.id,
  true,
  NULL -- Unlimited for admin
FROM tenants t
CROSS JOIN tools_catalog tc
WHERE t.slug = 'admin'
AND tc.is_premium = FALSE
ON CONFLICT (tenant_id, tool_id) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE tenant_tool_access IS 'Controls which tools each tenant can access and their usage limits';
COMMENT ON COLUMN tenant_tool_access.is_enabled IS 'Whether tenant has access to this tool';
COMMENT ON COLUMN tenant_tool_access.token_limit IS 'Monthly token limit for this tool (NULL = unlimited)';
COMMENT ON COLUMN tenant_tool_access.tokens_used IS 'Tokens used this month (reset monthly)';
COMMENT ON COLUMN tenant_tool_access.custom_config IS 'Tool-specific configuration (API keys, settings, etc.)';
COMMENT ON COLUMN tenant_tool_access.expires_at IS 'Expiration date for trial/temporary access';
