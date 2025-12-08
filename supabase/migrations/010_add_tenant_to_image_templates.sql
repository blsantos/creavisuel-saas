-- ===================================================
-- Migration 010: Add tenant_id to image_templates
-- Description: Associate image templates with specific tenants
-- ===================================================

-- Add tenant_id column (NULL = global template available to all)
ALTER TABLE image_templates
ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Create index for tenant filtering
CREATE INDEX idx_image_templates_tenant_id ON image_templates(tenant_id);

-- Update RLS policies to filter by tenant

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view image templates" ON image_templates;
DROP POLICY IF EXISTS "Anyone can create image templates" ON image_templates;
DROP POLICY IF EXISTS "Anyone can update image templates" ON image_templates;
DROP POLICY IF EXISTS "Anyone can delete image templates" ON image_templates;

-- Admins can view all templates
CREATE POLICY "Admins can view all image templates"
  ON image_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view global templates + their tenant's templates
CREATE POLICY "Users can view accessible templates"
  ON image_templates
  FOR SELECT
  USING (
    tenant_id IS NULL OR -- Global templates
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Admins can create templates
CREATE POLICY "Admins can create templates"
  ON image_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update all templates
CREATE POLICY "Admins can update all templates"
  ON image_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can update their tenant's templates
CREATE POLICY "Users can update their templates"
  ON image_templates
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Admins can delete all templates
CREATE POLICY "Admins can delete templates"
  ON image_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can delete their tenant's templates
CREATE POLICY "Users can delete their templates"
  ON image_templates
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );
