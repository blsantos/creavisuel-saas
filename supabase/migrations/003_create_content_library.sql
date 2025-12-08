-- ===================================================
-- Migration 003: Create Content Library Table
-- Description: Stores all generated content (posts, images, videos, audio)
-- ===================================================

-- Create content_library table
CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('post', 'image', 'video', 'audio', 'document')),
  title TEXT NOT NULL,
  content TEXT, -- Caption/text content
  media_url TEXT, -- URL to Supabase Storage
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  template_id UUID, -- Will reference templates table (created next)
  published_to JSONB DEFAULT '[]', -- Array of platforms ['facebook', 'instagram']
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes for fast queries
CREATE INDEX idx_content_library_tenant_id ON content_library(tenant_id);
CREATE INDEX idx_content_library_user_id ON content_library(user_id);
CREATE INDEX idx_content_library_type ON content_library(type);
CREATE INDEX idx_content_library_template_id ON content_library(template_id);
CREATE INDEX idx_content_library_created_at ON content_library(created_at DESC);
CREATE INDEX idx_content_library_archived ON content_library(is_archived);

-- GIN index for metadata JSONB queries
CREATE INDEX idx_content_library_metadata ON content_library USING GIN (metadata);

-- GIN index for published_to JSONB queries
CREATE INDEX idx_content_library_published_to ON content_library USING GIN (published_to);

-- Enable Row Level Security
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_library table

-- Admins can view all content
CREATE POLICY "Admins can view all content"
  ON content_library
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert content
CREATE POLICY "Admins can insert content"
  ON content_library
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update content
CREATE POLICY "Admins can update content"
  ON content_library
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can delete content
CREATE POLICY "Admins can delete content"
  ON content_library
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view content from their tenant
CREATE POLICY "Users can view their tenant content"
  ON content_library
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can insert content to their tenant
CREATE POLICY "Users can insert content to their tenant"
  ON content_library
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can update their tenant's content
CREATE POLICY "Users can update their tenant content"
  ON content_library
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their tenant's content
CREATE POLICY "Users can delete their tenant content"
  ON content_library
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_content_library_updated_at
  BEFORE UPDATE ON content_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get content statistics for a tenant
CREATE OR REPLACE FUNCTION get_content_statistics(p_tenant_id UUID, p_period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_count BIGINT,
  by_type JSONB,
  recent_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_count,
    jsonb_object_agg(type, type_count) AS by_type,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days) AS recent_count
  FROM (
    SELECT
      type,
      COUNT(*) AS type_count
    FROM content_library
    WHERE tenant_id = p_tenant_id
    AND is_archived = FALSE
    GROUP BY type
  ) stats;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE content_library IS 'Stores all generated content (posts, images, videos, audio) for all tenants';
COMMENT ON COLUMN content_library.type IS 'Content type: post, image, video, audio, document';
COMMENT ON COLUMN content_library.metadata IS 'JSON object with platform, campaign, tags, dimensions, duration, format, etc.';
COMMENT ON COLUMN content_library.published_to IS 'JSON array of platform names where content was published';
COMMENT ON COLUMN content_library.is_archived IS 'Soft delete flag - archived content is not shown in library';
