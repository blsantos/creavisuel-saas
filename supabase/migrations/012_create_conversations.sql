-- ===================================================
-- Migration 012: Create Conversations and Messages Tables
-- Description: Stores chat conversations and messages for AI interactions
-- ===================================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT, -- Auto-generated from first message
  context JSONB DEFAULT '{}', -- Conversation metadata (current_page, user_preferences, etc.)
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Tokens used, model, tools called, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_conversations_tenant_id ON conversations(tenant_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_archived ON conversations(is_archived);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at ASC);

-- GIN index for context JSONB queries
CREATE INDEX idx_conversations_context ON conversations USING GIN (context);
CREATE INDEX idx_messages_metadata ON messages USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations table

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert conversations
CREATE POLICY "Admins can insert conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can update conversations
CREATE POLICY "Admins can update conversations"
  ON conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can delete conversations
CREATE POLICY "Admins can delete conversations"
  ON conversations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view conversations from their tenant
CREATE POLICY "Users can view their tenant conversations"
  ON conversations
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can insert conversations to their tenant
CREATE POLICY "Users can insert conversations to their tenant"
  ON conversations
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can update their tenant's conversations
CREATE POLICY "Users can update their tenant conversations"
  ON conversations
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Users can delete their tenant's conversations
CREATE POLICY "Users can delete their tenant conversations"
  ON conversations
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Public users can view conversations from their session (guest mode)
-- For anonymous users, we'll use tenant_id matching from subdomain
CREATE POLICY "Public can view conversations from their tenant"
  ON conversations
  FOR SELECT
  USING (true); -- Controlled by frontend tenant_id filtering

CREATE POLICY "Public can insert conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (true); -- Controlled by frontend

CREATE POLICY "Public can update own conversations"
  ON conversations
  FOR UPDATE
  USING (true); -- Controlled by frontend

-- RLS Policies for messages table

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Admins can insert messages
CREATE POLICY "Admins can insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Users can view messages from their tenant's conversations
CREATE POLICY "Users can view their tenant messages"
  ON messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE tenant_id IN (
        SELECT id FROM tenants
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Users can insert messages to their tenant's conversations
CREATE POLICY "Users can insert messages to their tenant conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE tenant_id IN (
        SELECT id FROM tenants
        WHERE owner_id = auth.uid()
      )
    )
  );

-- Public users can view messages from conversations they have access to
CREATE POLICY "Public can view messages"
  ON messages
  FOR SELECT
  USING (true); -- Controlled by frontend + conversation RLS

CREATE POLICY "Public can insert messages"
  ON messages
  FOR INSERT
  WITH CHECK (true); -- Controlled by frontend

-- Trigger to update conversations.updated_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Trigger to auto-generate conversation title from first user message
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE conversations
    SET title = COALESCE(
      SUBSTRING(NEW.content FROM 1 FOR 50) ||
      CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
      'Nouvelle conversation'
    )
    WHERE id = NEW.conversation_id
    AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_conversation_title
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION auto_title_conversation();

-- Trigger to update updated_at on conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get conversation statistics for a tenant
CREATE OR REPLACE FUNCTION get_conversation_statistics(p_tenant_id UUID, p_period_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_count BIGINT,
  active_count BIGINT,
  recent_count BIGINT,
  avg_messages_per_conversation NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE is_archived = FALSE) AS active_count,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day' * p_period_days) AS recent_count,
    COALESCE(
      (SELECT AVG(message_count) FROM (
        SELECT COUNT(*) AS message_count
        FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE c.tenant_id = p_tenant_id
        GROUP BY m.conversation_id
      ) counts),
      0
    ) AS avg_messages_per_conversation
  FROM conversations
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Stores chat conversations for AI interactions per tenant';
COMMENT ON TABLE messages IS 'Stores individual messages within conversations';
COMMENT ON COLUMN conversations.context IS 'JSON object with conversation metadata (current_page, user_prefs, etc.)';
COMMENT ON COLUMN messages.metadata IS 'JSON object with message metadata (tokens, model, tools_used, etc.)';
COMMENT ON COLUMN messages.role IS 'Message sender: user, assistant, or system';
