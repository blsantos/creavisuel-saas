-- ===================================================
-- Migration 013: Lier content_library aux conversations
-- Description: Permet de sauvegarder automatiquement les contenus créés via chat
-- Date: 2025-12-08
-- ===================================================

-- Ajouter colonne conversation_id à content_library
ALTER TABLE content_library
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_content_library_conversation_id ON content_library(conversation_id);

-- Fonction pour créer du contenu depuis une conversation
CREATE OR REPLACE FUNCTION save_chat_content_to_library(
  p_conversation_id UUID,
  p_message_id UUID,
  p_tenant_id UUID,
  p_user_id UUID,
  p_type TEXT, -- 'post', 'image', 'video', 'audio', 'document'
  p_title TEXT,
  p_content TEXT DEFAULT NULL,
  p_media_url TEXT DEFAULT NULL,
  p_thumbnail_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_content_id UUID;
BEGIN
  -- Insérer dans content_library
  INSERT INTO content_library (
    tenant_id,
    user_id,
    conversation_id,
    type,
    title,
    content,
    media_url,
    thumbnail_url,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_conversation_id,
    p_type,
    p_title,
    p_content,
    p_media_url,
    p_thumbnail_url,
    jsonb_build_object(
      'source', 'chat',
      'message_id', p_message_id,
      'created_via', 'ai_assistant'
    ) || p_metadata
  )
  RETURNING id INTO v_content_id;

  RETURN v_content_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON FUNCTION save_chat_content_to_library IS 'Sauvegarde automatiquement le contenu créé via chat dans la bibliothèque';
COMMENT ON COLUMN content_library.conversation_id IS 'Lien vers la conversation qui a créé ce contenu';
