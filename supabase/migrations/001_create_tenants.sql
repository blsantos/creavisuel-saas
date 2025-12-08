-- ===================================================
-- Migration 001: Create Tenants Table
-- Description: Core tenant (client) table for multi-tenant SaaS
-- ===================================================

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  plan_id UUID, -- Will reference pricing_plans table (created later)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create index on slug for fast subdomain lookups
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Create index on owner_id for user queries
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);

-- Create index on status for filtering
CREATE INDEX idx_tenants_status ON tenants(status);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table

-- Admins can see all tenants
CREATE POLICY "Admins can view all tenants"
  ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert tenants
CREATE POLICY "Admins can insert tenants"
  ON tenants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update tenants
CREATE POLICY "Admins can update tenants"
  ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Owners can view their own tenant
CREATE POLICY "Owners can view their tenant"
  ON tenants
  FOR SELECT
  USING (owner_id = auth.uid());

-- Owners can update their own tenant (limited fields via application logic)
CREATE POLICY "Owners can update their tenant"
  ON tenants
  FOR UPDATE
  USING (owner_id = auth.uid());

-- Public can read tenant by slug (for subdomain routing)
-- This allows anyone to fetch tenant branding info
CREATE POLICY "Public can view tenant by slug"
  ON tenants
  FOR SELECT
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data: Default admin tenant
INSERT INTO tenants (slug, name, status, created_at)
VALUES ('admin', 'CréaVisuel Admin', 'active', NOW())
ON CONFLICT (slug) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE tenants IS 'Core tenant table for multi-tenant SaaS - stores client companies';
COMMENT ON COLUMN tenants.slug IS 'Unique subdomain identifier (e.g., jeffterra for jeffterra.creavisuel.pro)';
COMMENT ON COLUMN tenants.status IS 'Tenant subscription status: active, suspended, trial, cancelled';
COMMENT ON COLUMN tenants.owner_id IS 'User ID from auth.users who owns this tenant';
