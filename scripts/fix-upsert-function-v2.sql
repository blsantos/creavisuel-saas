-- 🔧 FIX v2: Fonction UPSERT sans AUCUNE ambiguïté
-- Date: 2025-12-08
-- Solution: Utiliser des alias pour la table et éviter toute ambiguïté

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS upsert_conversation_memory(TEXT, UUID, JSONB, JSONB, INTEGER);

-- Version avec alias de table explicite
CREATE OR REPLACE FUNCTION upsert_conversation_memory(
  p_session_id TEXT,
  p_tenant_id UUID,
  p_short_term_memory JSONB DEFAULT '{}'::jsonb,
  p_long_term_memory JSONB DEFAULT '{}'::jsonb,
  p_message_count INTEGER DEFAULT 1
)
RETURNS TABLE (
  ret_id UUID,
  ret_session_id TEXT,
  ret_conversation_id TEXT,
  ret_tenant_id UUID,
  ret_short_term_memory JSONB,
  ret_long_term_memory JSONB,
  ret_message_count INTEGER,
  ret_created_at TIMESTAMPTZ,
  ret_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- UPSERT avec capture du résultat
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
    n8n_conversations.updated_at
  INTO v_result;

  -- Retourner avec des noms différents pour éviter l'ambiguïté
  RETURN QUERY SELECT
    v_result.id,
    v_result.session_id,
    v_result.conversation_id,
    v_result.tenant_id,
    v_result.short_term_memory,
    v_result.long_term_memory,
    v_result.message_count,
    v_result.created_at,
    v_result.updated_at;
END;
$$;

-- Test 1: INSERT (nouvelle session)
SELECT * FROM upsert_conversation_memory(
  'test-v2-new',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Premier test v2"}'::jsonb,
  '{}'::jsonb,
  1
);

-- Vérifier
SELECT session_id, message_count, created_at FROM n8n_conversations WHERE session_id = 'test-v2-new';

-- Test 2: UPDATE (session existante)
SELECT * FROM upsert_conversation_memory(
  'test-v2-new',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Deuxième message v2"}'::jsonb,
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
WHERE session_id = 'test-v2-new';
