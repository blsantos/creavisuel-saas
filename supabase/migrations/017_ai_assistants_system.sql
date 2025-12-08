-- ===================================================
-- Migration 017: Système de Gestion des Assistants IA
-- Description: Tables et fonctions pour la gestion avancée des assistants
-- Date: 2025-12-08
-- ===================================================

-- ===== 1. Table des Assistants =====
CREATE TABLE IF NOT EXISTS ai_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('content', 'image', 'video', 'audio', 'chat', 'analysis')),

  -- Configuration IA
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  system_prompt TEXT NOT NULL,
  temperature DECIMAL(3, 2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000,
  top_p DECIMAL(3, 2) DEFAULT 1.0,
  frequency_penalty DECIMAL(3, 2) DEFAULT 0.0,
  presence_penalty DECIMAL(3, 2) DEFAULT 0.0,

  -- Capacités
  supports_images BOOLEAN DEFAULT FALSE,
  supports_audio BOOLEAN DEFAULT FALSE,
  supports_video BOOLEAN DEFAULT FALSE,
  supports_tools BOOLEAN DEFAULT FALSE,
  available_tools JSONB DEFAULT '[]', -- Array de tool IDs

  -- Visibilité
  is_public BOOLEAN DEFAULT FALSE, -- Disponible pour tous les tenants
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  icon TEXT, -- Emoji ou URL
  color TEXT, -- Couleur hex pour UI
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ===== 2. Table Assignment Assistants <-> Tenants =====
CREATE TABLE IF NOT EXISTS tenant_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,

  -- Configuration override par tenant
  custom_system_prompt TEXT, -- Override du system_prompt si défini
  custom_name TEXT, -- Nom personnalisé pour ce tenant
  is_enabled BOOLEAN DEFAULT TRUE,

  -- Stats
  usage_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,

  UNIQUE(tenant_id, assistant_id)
);

-- ===== 3. Table Versions des Prompts =====
CREATE TABLE IF NOT EXISTS assistant_prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  system_prompt TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_notes TEXT,
  is_active BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(assistant_id, version)
);

-- ===== 4. Table Stats d'Usage Assistants =====
CREATE TABLE IF NOT EXISTS assistant_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id UUID NOT NULL REFERENCES ai_assistants(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Détails requête
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost DECIMAL NOT NULL,
  model_used TEXT NOT NULL,
  latency_ms INTEGER, -- Temps de réponse en ms

  -- Metadata
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Indexes =====
CREATE INDEX idx_ai_assistants_slug ON ai_assistants(slug);
CREATE INDEX idx_ai_assistants_category ON ai_assistants(category);
CREATE INDEX idx_ai_assistants_is_public ON ai_assistants(is_public);
CREATE INDEX idx_ai_assistants_is_active ON ai_assistants(is_active);

CREATE INDEX idx_tenant_assistants_tenant_id ON tenant_assistants(tenant_id);
CREATE INDEX idx_tenant_assistants_assistant_id ON tenant_assistants(assistant_id);

CREATE INDEX idx_assistant_prompt_versions_assistant_id ON assistant_prompt_versions(assistant_id);
CREATE INDEX idx_assistant_prompt_versions_is_active ON assistant_prompt_versions(is_active);

CREATE INDEX idx_assistant_usage_logs_assistant_id ON assistant_usage_logs(assistant_id);
CREATE INDEX idx_assistant_usage_logs_tenant_id ON assistant_usage_logs(tenant_id);
CREATE INDEX idx_assistant_usage_logs_created_at ON assistant_usage_logs(created_at DESC);

-- ===== RLS Policies =====
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access ai_assistants" ON ai_assistants FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins full access tenant_assistants" ON tenant_assistants FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins full access assistant_prompt_versions" ON assistant_prompt_versions FOR ALL USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

CREATE POLICY "Admins view usage logs" ON assistant_usage_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_app_meta_data->>'role' = 'admin')
);

-- Public peut voir assistants publics actifs
CREATE POLICY "Public can view public assistants" ON ai_assistants FOR SELECT USING (
  is_public = TRUE AND is_active = TRUE
);

-- Tenants peuvent voir leurs assistants assignés
CREATE POLICY "Tenants can view their assistants" ON tenant_assistants FOR SELECT USING (
  tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
);

-- ===== Triggers =====
CREATE TRIGGER update_ai_assistants_updated_at
  BEFORE UPDATE ON ai_assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_assistants_updated_at
  BEFORE UPDATE ON tenant_assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour incrémenter usage_count
CREATE OR REPLACE FUNCTION increment_assistant_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrémenter sur ai_assistants
  UPDATE ai_assistants
  SET usage_count = usage_count + 1
  WHERE id = NEW.assistant_id;

  -- Incrémenter sur tenant_assistants si existe
  IF NEW.tenant_id IS NOT NULL THEN
    UPDATE tenant_assistants
    SET
      usage_count = usage_count + 1,
      total_tokens = total_tokens + NEW.input_tokens + NEW.output_tokens,
      total_cost = total_cost + NEW.cost,
      last_used_at = NOW()
    WHERE tenant_id = NEW.tenant_id
    AND assistant_id = NEW.assistant_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_assistant_usage
  AFTER INSERT ON assistant_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_assistant_usage();

-- ===== 5. Fonction pour Créer une Version de Prompt =====
CREATE OR REPLACE FUNCTION create_prompt_version(
  p_assistant_id UUID,
  p_system_prompt TEXT,
  p_changed_by UUID,
  p_change_notes TEXT
)
RETURNS UUID AS $$
DECLARE
  v_version_id UUID;
  v_next_version INTEGER;
BEGIN
  -- Obtenir le prochain numéro de version
  SELECT COALESCE(MAX(version), 0) + 1 INTO v_next_version
  FROM assistant_prompt_versions
  WHERE assistant_id = p_assistant_id;

  -- Désactiver l'ancienne version active
  UPDATE assistant_prompt_versions
  SET is_active = FALSE
  WHERE assistant_id = p_assistant_id
  AND is_active = TRUE;

  -- Créer la nouvelle version
  INSERT INTO assistant_prompt_versions (
    assistant_id,
    version,
    system_prompt,
    changed_by,
    change_notes,
    is_active
  )
  VALUES (
    p_assistant_id,
    v_next_version,
    p_system_prompt,
    p_changed_by,
    p_change_notes,
    TRUE
  )
  RETURNING id INTO v_version_id;

  -- Mettre à jour le prompt dans ai_assistants
  UPDATE ai_assistants
  SET system_prompt = p_system_prompt
  WHERE id = p_assistant_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql;

-- ===== 6. Fonction Stats Assistant =====
CREATE OR REPLACE FUNCTION get_assistant_statistics(
  p_assistant_id UUID,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_uses BIGINT,
  total_tenants BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL,
  avg_latency_ms NUMERIC,
  success_rate NUMERIC,
  most_used_model TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_uses,
    COUNT(DISTINCT tenant_id) AS total_tenants,
    SUM(input_tokens + output_tokens) AS total_tokens,
    SUM(cost) AS total_cost,
    AVG(latency_ms) AS avg_latency_ms,
    (COUNT(*) FILTER (WHERE success = TRUE)::NUMERIC / NULLIF(COUNT(*), 0) * 100) AS success_rate,
    mode() WITHIN GROUP (ORDER BY model_used) AS most_used_model
  FROM assistant_usage_logs
  WHERE assistant_id = p_assistant_id
  AND created_at >= NOW() - INTERVAL '1 day' * p_period_days;
END;
$$ LANGUAGE plpgsql;

-- ===== 7. Seed Data - Assistants Prédéfinis =====
INSERT INTO ai_assistants (
  name,
  slug,
  description,
  category,
  model,
  system_prompt,
  temperature,
  supports_images,
  is_public,
  icon,
  color
)
VALUES
  (
    'Assistant Général',
    'general-assistant',
    'Assistant polyvalent pour toutes les tâches',
    'chat',
    'gpt-4o-mini',
    'Tu es un assistant IA professionnel et créatif. Tu aides les utilisateurs à créer du contenu de qualité pour leurs réseaux sociaux et leur marketing. Tu es concis, pertinent et toujours positif.',
    0.7,
    TRUE,
    TRUE,
    '🤖',
    '#06b6d4'
  ),
  (
    'Créateur de Posts',
    'post-creator',
    'Spécialisé dans la création de posts pour réseaux sociaux',
    'content',
    'gpt-4o',
    'Tu es un expert en création de contenu pour les réseaux sociaux. Tu crées des posts engageants, avec des hooks accrocheurs et des CTAs efficaces. Tu adaptes le ton selon la plateforme (LinkedIn professionnel, Instagram créatif, etc.).',
    0.8,
    FALSE,
    TRUE,
    '✍️',
    '#8b5cf6'
  ),
  (
    'Analyste de Performance',
    'performance-analyst',
    'Analyse les performances et donne des recommandations',
    'analysis',
    'gpt-4o',
    'Tu es un analyste marketing expert. Tu interprètes les données de performance, identifies les tendances et donnes des recommandations concrètes pour améliorer les résultats.',
    0.3,
    TRUE,
    TRUE,
    '📊',
    '#10b981'
  ),
  (
    'Générateur d''Images',
    'image-generator',
    'Crée des prompts optimisés pour DALL-E',
    'image',
    'gpt-4o-mini',
    'Tu es un expert en création de prompts pour DALL-E. Tu transformes les idées des utilisateurs en prompts détaillés et optimisés pour générer des images de haute qualité.',
    0.9,
    TRUE,
    TRUE,
    '🎨',
    '#f59e0b'
  )
ON CONFLICT (slug) DO NOTHING;

-- ===== Commentaires =====
COMMENT ON TABLE ai_assistants IS 'Catalogue des assistants IA disponibles';
COMMENT ON TABLE tenant_assistants IS 'Assignment des assistants aux tenants avec config personnalisée';
COMMENT ON TABLE assistant_prompt_versions IS 'Versioning des prompts système pour tracking des changements';
COMMENT ON TABLE assistant_usage_logs IS 'Logs détaillés d''utilisation des assistants';
COMMENT ON FUNCTION create_prompt_version IS 'Crée une nouvelle version d''un prompt système';
COMMENT ON FUNCTION get_assistant_statistics IS 'Statistiques d''usage d''un assistant';
