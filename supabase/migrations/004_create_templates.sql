-- ===================================================
-- Migration 004: Create Templates Table
-- Description: Stores content generation templates with dynamic forms
-- ===================================================

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for global templates
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('social_post', 'blog', 'email', 'image', 'video', 'audio', 'custom')),
  prompt_template TEXT NOT NULL, -- e.g., "Create a {tone} post about {topic} for {platform}"
  form_schema JSONB NOT NULL, -- JSON Schema for dynamic form generation
  is_global BOOLEAN DEFAULT FALSE, -- Available to all tenants
  is_premium BOOLEAN DEFAULT FALSE, -- Requires premium plan
  thumbnail_url TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_templates_tenant_id ON templates(tenant_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_is_global ON templates(is_global);
CREATE INDEX idx_templates_is_premium ON templates(is_premium);
CREATE INDEX idx_templates_is_active ON templates(is_active);
CREATE INDEX idx_templates_usage_count ON templates(usage_count DESC);

-- GIN index for form_schema JSONB queries
CREATE INDEX idx_templates_form_schema ON templates USING GIN (form_schema);

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates table

-- Admins can view all templates
CREATE POLICY "Admins can view all templates"
  ON templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert templates
CREATE POLICY "Admins can insert templates"
  ON templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update templates
CREATE POLICY "Admins can update templates"
  ON templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can delete templates
CREATE POLICY "Admins can delete templates"
  ON templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view global templates and their tenant templates
CREATE POLICY "Users can view available templates"
  ON templates
  FOR SELECT
  USING (
    is_global = TRUE
    OR tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can create templates for their tenant
CREATE POLICY "Users can create templates for their tenant"
  ON templates
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can update their tenant's templates
CREATE POLICY "Users can update their tenant templates"
  ON templates
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their tenant's templates
CREATE POLICY "Users can delete their tenant templates"
  ON templates
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at on row updates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate form_schema JSONB structure
CREATE OR REPLACE FUNCTION validate_form_schema(schema JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check that schema has a 'fields' array
  IF NOT (schema ? 'fields' AND jsonb_typeof(schema->'fields') = 'array') THEN
    RETURN FALSE;
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add foreign key for content_library template_id (deferred from 003)
ALTER TABLE content_library
ADD CONSTRAINT fk_content_library_template_id
FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;

-- Insert seed data: Global templates
INSERT INTO templates (name, description, category, prompt_template, form_schema, is_global, is_premium, is_active)
VALUES
  (
    'Post Instagram Promo',
    'Générer un post promotionnel pour Instagram',
    'social_post',
    'Créer un post {tone} pour Instagram qui promeut {product} avec un appel à l''action {cta}',
    '{"fields": [
      {"name": "tone", "label": "Ton", "type": "select", "required": true, "options": [
        {"label": "Professionnel", "value": "professional"},
        {"label": "Amical", "value": "friendly"},
        {"label": "Créatif", "value": "creative"}
      ]},
      {"name": "product", "label": "Produit/Service", "type": "text", "required": true, "placeholder": "Ex: Nouvelle coupe tendance"},
      {"name": "cta", "label": "Call-to-Action", "type": "text", "required": true, "placeholder": "Ex: Prenez RDV maintenant"}
    ], "submitLabel": "Générer le post"}',
    true,
    false,
    true
  ),
  (
    'Post Facebook Event',
    'Générer un post d''annonce d''événement pour Facebook',
    'social_post',
    'Créer un post {tone} pour Facebook qui annonce l''événement {event_name} le {event_date} avec les détails {event_details}',
    '{"fields": [
      {"name": "tone", "label": "Ton", "type": "select", "required": true, "options": [
        {"label": "Professionnel", "value": "professional"},
        {"label": "Amical", "value": "friendly"},
        {"label": "Enthousiaste", "value": "enthusiastic"}
      ]},
      {"name": "event_name", "label": "Nom de l''événement", "type": "text", "required": true},
      {"name": "event_date", "label": "Date de l''événement", "type": "date", "required": true},
      {"name": "event_details", "label": "Détails", "type": "textarea", "required": true, "placeholder": "Horaires, lieu, prix, etc."}
    ], "submitLabel": "Générer le post"}',
    true,
    false,
    true
  ),
  (
    'Article de Blog',
    'Générer un article de blog optimisé SEO',
    'blog',
    'Écrire un article de blog de {length} mots sur {topic} avec le ton {tone}, incluant une introduction, {sections} sections principales, et une conclusion',
    '{"fields": [
      {"name": "topic", "label": "Sujet", "type": "text", "required": true, "placeholder": "Ex: Les tendances coiffure 2025"},
      {"name": "length", "label": "Longueur (mots)", "type": "number", "required": true, "defaultValue": 800, "validation": {"min": 300, "max": 3000}},
      {"name": "tone", "label": "Ton", "type": "select", "required": true, "options": [
        {"label": "Professionnel", "value": "professional"},
        {"label": "Informatif", "value": "informative"},
        {"label": "Conversationnel", "value": "conversational"}
      ]},
      {"name": "sections", "label": "Nombre de sections", "type": "number", "required": true, "defaultValue": 3, "validation": {"min": 2, "max": 10}}
    ], "submitLabel": "Générer l''article"}',
    true,
    true,
    true
  );

-- Comments for documentation
COMMENT ON TABLE templates IS 'Content generation templates with dynamic form schemas';
COMMENT ON COLUMN templates.prompt_template IS 'Template string with {variable} placeholders for form data';
COMMENT ON COLUMN templates.form_schema IS 'JSON Schema defining form fields for template';
COMMENT ON COLUMN templates.is_global IS 'If true, template is available to all tenants';
COMMENT ON COLUMN templates.is_premium IS 'If true, requires tenant to have premium plan';
COMMENT ON COLUMN templates.usage_count IS 'Number of times template has been used (all tenants)';
