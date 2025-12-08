-- Créer la table n8n_conversations pour la mémoire conversationnelle
-- Cette table stocke la mémoire court-terme et long-terme des conversations

CREATE TABLE IF NOT EXISTS public.n8n_conversations (
  -- Identifiant unique
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Session ID (lié à conversation_id dans la table conversations)
  session_id TEXT NOT NULL UNIQUE,

  -- Tenant ID pour multi-tenant
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Mémoire à court terme (contexte immédiat de la session)
  short_term_memory JSONB DEFAULT '{}'::jsonb,
  -- Structure suggérée :
  -- {
  --   "last_topic": "génération d'images",
  --   "last_user_message": "Je veux créer un logo",
  --   "last_ai_response": "Parfait ! Pour créer un logo...",
  --   "preferences": {
  --     "style": "moderne",
  --     "tone": "professionnel"
  --   },
  --   "context_window": [
  --     {"role": "user", "content": "...", "timestamp": "2025-12-08T10:00:00Z"},
  --     {"role": "assistant", "content": "...", "timestamp": "2025-12-08T10:00:05Z"}
  --   ]
  -- }

  -- Mémoire à long terme (connaissances persistantes)
  long_term_memory JSONB DEFAULT '{}'::jsonb,
  -- Structure suggérée :
  -- {
  --   "user_context": "Designer freelance, travaille pour PME",
  --   "key_facts": [
  --     "Préfère les designs épurés",
  --     "Utilise souvent des templates minimalistes"
  --   ],
  --   "important_instructions": [
  --     "Toujours suggérer haute résolution",
  --     "Préférer palettes sobres"
  --   ],
  --   "user_profile": {
  --     "name": "Bruno",
  --     "role": "Designer",
  --     "company": "Freelance"
  --   },
  --   "last_interaction": "2025-12-08T10:30:00Z"
  -- }

  -- Compteur de messages dans cette session
  message_count INTEGER DEFAULT 0,

  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_n8n_conversations_session_id
  ON public.n8n_conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_n8n_conversations_tenant_id
  ON public.n8n_conversations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_n8n_conversations_created_at
  ON public.n8n_conversations(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_n8n_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_n8n_conversations_updated_at
  BEFORE UPDATE ON public.n8n_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_n8n_conversations_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.n8n_conversations ENABLE ROW LEVEL SECURITY;

-- Policy : Les tenants peuvent gérer leurs propres conversations
CREATE POLICY "Tenants can manage their conversations"
  ON public.n8n_conversations
  FOR ALL
  TO authenticated
  USING (tenant_id IN (
    SELECT id FROM public.tenants
    WHERE id = tenant_id
  ))
  WITH CHECK (tenant_id IN (
    SELECT id FROM public.tenants
    WHERE id = tenant_id
  ));

-- Policy : Accès public pour anon (nécessaire pour N8N avec anon key)
CREATE POLICY "Allow anon access for N8N"
  ON public.n8n_conversations
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Commentaires pour documentation
COMMENT ON TABLE public.n8n_conversations IS
  'Stocke la mémoire conversationnelle (court et long terme) pour les agents IA N8N';

COMMENT ON COLUMN public.n8n_conversations.session_id IS
  'ID de session unique, correspond généralement à conversation_id';

COMMENT ON COLUMN public.n8n_conversations.short_term_memory IS
  'Mémoire à court terme : contexte immédiat de la session actuelle (derniers échanges, sujet en cours)';

COMMENT ON COLUMN public.n8n_conversations.long_term_memory IS
  'Mémoire à long terme : connaissances persistantes sur l''utilisateur (profil, préférences, instructions importantes)';

COMMENT ON COLUMN public.n8n_conversations.message_count IS
  'Nombre total de messages échangés dans cette session';

-- Exemple d'insertion
-- INSERT INTO public.n8n_conversations (session_id, tenant_id, short_term_memory, long_term_memory, message_count)
-- VALUES (
--   'conv-123-abc',
--   '66fd102d-d010-4d99-89ed-4e4f0336961e',
--   '{"last_topic": "logo design", "preferences": {"style": "moderne"}}'::jsonb,
--   '{"user_context": "Designer freelance", "key_facts": ["Préfère designs épurés"]}'::jsonb,
--   5
-- );

-- Afficher un résumé de la création
SELECT
  'Table n8n_conversations créée avec succès !' as status,
  (SELECT COUNT(*) FROM public.n8n_conversations) as total_conversations,
  NOW() as created_at;
