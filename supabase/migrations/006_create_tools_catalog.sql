-- ===================================================
-- Migration 006: Create Tools Catalog Table
-- Description: Stores available tools/features catalog
-- ===================================================

-- Create tools_catalog table
CREATE TABLE IF NOT EXISTS tools_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- Unique identifier (e.g., 'audio')
  display_name TEXT NOT NULL, -- UI display (e.g., 'Audio Tools')
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('audio', 'video', 'image', 'code', 'media', 'storage', 'ffmpeg', 'ai', 'other')),
  endpoint TEXT, -- API endpoint (e.g., '/v1/audio')
  icon TEXT, -- Icon name or URL
  is_premium BOOLEAN DEFAULT FALSE,
  token_cost_multiplier DECIMAL DEFAULT 1.0, -- Multiplier for token usage
  is_active BOOLEAN DEFAULT TRUE,
  documentation_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_tools_catalog_name ON tools_catalog(name);
CREATE INDEX idx_tools_catalog_category ON tools_catalog(category);
CREATE INDEX idx_tools_catalog_is_premium ON tools_catalog(is_premium);
CREATE INDEX idx_tools_catalog_is_active ON tools_catalog(is_active);

-- Enable Row Level Security
ALTER TABLE tools_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tools_catalog table

-- Everyone can view tools catalog (it's public information)
CREATE POLICY "Anyone can view tools catalog"
  ON tools_catalog
  FOR SELECT
  USING (true);

-- Only admins can modify tools catalog
CREATE POLICY "Admins can insert tools"
  ON tools_catalog
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update tools"
  ON tools_catalog
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete tools"
  ON tools_catalog
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_tools_catalog_updated_at
  BEFORE UPDATE ON tools_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data: 8 tools from modern-clarity
INSERT INTO tools_catalog (name, display_name, description, category, endpoint, icon, is_premium, token_cost_multiplier, is_active)
VALUES
  (
    'audio',
    'Audio Tools',
    'Conversion et traitement audio (MP3, WAV, OGG, etc.)',
    'audio',
    '/v1/audio',
    'volume-2',
    false,
    1.0,
    true
  ),
  (
    'video',
    'Video Tools',
    'Conversion et édition vidéo (MP4, AVI, MKV, etc.)',
    'video',
    '/v1/video',
    'video',
    true,
    2.0,
    true
  ),
  (
    'image',
    'Image Tools',
    'Traitement et conversion d''images (JPG, PNG, WEBP, etc.)',
    'image',
    '/v1/image',
    'image',
    false,
    0.5,
    true
  ),
  (
    'code',
    'Code Tools',
    'Formatage et validation de code (JSON, XML, YAML)',
    'code',
    '/v1/code',
    'code-2',
    false,
    0.3,
    true
  ),
  (
    'media',
    'Media Tools',
    'Outils média multi-formats',
    'media',
    '/v1/media',
    'play-circle',
    false,
    1.0,
    true
  ),
  (
    'storage',
    'Storage Tools',
    'Gestion et optimisation de fichiers',
    'storage',
    '/v1/storage',
    'hard-drive',
    false,
    0.5,
    true
  ),
  (
    'ffmpeg',
    'FFmpeg Tools',
    'Conversion et manipulation avancée avec FFmpeg',
    'ffmpeg',
    '/v1/ffmpeg',
    'film',
    true,
    3.0,
    true
  ),
  (
    'ai',
    'AI Tools',
    'Outils d''intelligence artificielle (génération, analyse)',
    'ai',
    '/v1/ai',
    'sparkles',
    true,
    5.0,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE tools_catalog IS 'Catalog of available tools/features in the platform';
COMMENT ON COLUMN tools_catalog.name IS 'Unique tool identifier (slug)';
COMMENT ON COLUMN tools_catalog.token_cost_multiplier IS 'Multiplier applied to base token cost for this tool';
COMMENT ON COLUMN tools_catalog.is_premium IS 'If true, requires premium plan to access';
