-- 🔧 FIX v3: Fonction UPSERT avec CTE (Common Table Expression)
-- Date: 2025-12-08
-- Solution finale: Utiliser un CTE pour éviter complètement l'ambiguïté

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS upsert_conversation_memory(TEXT, UUID, JSONB, JSONB, INTEGER);

-- Version avec CTE (pas de RETURNS TABLE)
CREATE OR REPLACE FUNCTION upsert_conversation_memory(
  p_session_id TEXT,
  p_tenant_id UUID,
  p_short_term_memory JSONB DEFAULT '{}'::jsonb,
  p_long_term_memory JSONB DEFAULT '{}'::jsonb,
  p_message_count INTEGER DEFAULT 1
)
RETURNS SETOF n8n_conversations
LANGUAGE sql
AS $$
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
  RETURNING *;
$$;

-- Test 1: INSERT (nouvelle session)
SELECT * FROM upsert_conversation_memory(
  'test-v3-new',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Premier test v3"}'::jsonb,
  '{}'::jsonb,
  1
);

-- Vérifier
SELECT session_id, message_count, created_at FROM n8n_conversations WHERE session_id = 'test-v3-new';

-- Test 2: UPDATE (session existante)
SELECT * FROM upsert_conversation_memory(
  'test-v3-new',
  '66fd102d-d010-4d99-89ed-4e4f0336961e'::uuid,
  '{"last_topic": "Deuxième message v3"}'::jsonb,
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
WHERE session_id = 'test-v3-new';

-- Clean up test
DELETE FROM n8n_conversations WHERE session_id LIKE 'test-v%';
