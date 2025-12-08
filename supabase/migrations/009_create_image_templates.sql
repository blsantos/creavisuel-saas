-- ===================================================
-- Migration 009: Create Image Templates Table
-- Description: Stores visual templates created in Image Studio
-- ===================================================

-- Create image_templates table
CREATE TABLE IF NOT EXISTS image_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'custom' CHECK (category IN ('social_media', 'banner', 'thumbnail', 'custom')),
  config JSONB NOT NULL, -- Stores { width, height, layers }
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_image_templates_category ON image_templates(category);
CREATE INDEX idx_image_templates_created_at ON image_templates(created_at DESC);

-- GIN index for config JSONB queries
CREATE INDEX idx_image_templates_config ON image_templates USING GIN (config);

-- Enable Row Level Security
ALTER TABLE image_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for image_templates table

-- Public access for reading (admin-only in practice, but simpler policy)
CREATE POLICY "Anyone can view image templates"
  ON image_templates
  FOR SELECT
  USING (true);

-- Anyone can create templates (admin-only in practice)
CREATE POLICY "Anyone can create image templates"
  ON image_templates
  FOR INSERT
  WITH CHECK (true);

-- Anyone can update their templates
CREATE POLICY "Anyone can update image templates"
  ON image_templates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Anyone can delete templates
CREATE POLICY "Anyone can delete image templates"
  ON image_templates
  FOR DELETE
  USING (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_templates_updated_at
  BEFORE UPDATE ON image_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_image_templates_updated_at();

-- Sample data (optional - commented out)
-- INSERT INTO image_templates (name, category, config) VALUES
-- (
--   'Instagram Post Cyber',
--   'social_media',
--   '{"width": 1080, "height": 1080, "layers": []}'
-- );
