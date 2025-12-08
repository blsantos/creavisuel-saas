-- 🔧 FIX: Fonction UPSERT sans ambiguïté de colonnes
-- Date: 2025-12-08
-- Erreur corrigée: "column reference 'session_id' is ambiguous"

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS upsert_conversation_memory(TEXT, UUID, JSONB, JSONB, INTEGER);

-- Créer la fonction corrigée
CREATE OR REPLACE FUNCTION upsert_conversation_memory(
  p_session_id TEXT,
  p_tenant_id UUID,
  p_short_term_memory JSONB DEFAULT '{}'::jsonb,
  p_long_term_memory JSONB DEFAULT '{}'::jsonb,
  p_message_count INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  conversation_id TEXT,
  tenant_id UUID,
  short_term_memory JSONB,
  long_term_memory JSONB,
  message_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO n8n_conversations (
    session_id,
    conversation_id,
    tenant_id,
    short_term_memory,
    long_term_memory,
    message_count
  )
  VALUES (
    p_session_id,
    p_session_id,
    p_tenant_id,
    p_short_term_memory,
    p_long_term_memory,
    p_message_count
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    short_term_memory = EXCLUDED.short_term_memory,
    long_term_memory = EXCLUDED.long_term_memory,
    message_count = EXCLUDED.message_count,
    updated_at = NOW()
  RETURNING
    n8n_conversations.id,
    n8n_conversations.session_id,
    n8n_conversations.conversation_id,
    n8n_conversations.tenant_id,
    n8n_conversations.short_term_memory,
    n8n_conversations.long_term_memory,
    n8n_conversations.message_count,
    n8n_conversations.created_at,
    n8n_conversations.updated_at;
END;
$$;

-- Tester la fonction
SELECT * FROM upsert_conversation_memory(
  'test-fix-ambiguous',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Test fix"}'::jsonb,
  '{}'::jsonb,
  1
);

-- Vérifier que c'est créé
SELECT
  session_id,
  message_count,
  short_term_memory->>'last_topic' as last_topic,
  created_at
FROM n8n_conversations
WHERE session_id = 'test-fix-ambiguous';

-- Tester UPDATE (re-exécuter avec message_count = 2)
SELECT * FROM upsert_conversation_memory(
  'test-fix-ambiguous',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Test fix updated"}'::jsonb,
  '{"user_name": "Bruno"}'::jsonb,
  2
);

-- Vérifier que c'est mis à jour
SELECT
  session_id,
  message_count,
  short_term_memory->>'last_topic' as last_topic,
  long_term_memory->>'user_name' as user_name,
  created_at,
  updated_at
FROM n8n_conversations
WHERE session_id = 'test-fix-ambiguous';
