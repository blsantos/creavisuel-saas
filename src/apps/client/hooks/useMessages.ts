import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';

interface DBMessage {
  id: string;
  conversation_id: string;
  type: string;
  content: string;
  sender: string;
  media_url: string | null;
  created_at: string;
}

const mapDBMessageToChat = (msg: DBMessage): ChatMessage => ({
  id: msg.id,
  type: msg.type as ChatMessage['type'],
  content: msg.content,
  sender: msg.sender === 'assistant' ? 'bot' : (msg.sender as 'user' | 'bot'),
  timestamp: new Date(msg.created_at),
  mediaUrl: msg.media_url || undefined,
});

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !isSupabaseConfigured() || !supabase) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(mapDBMessageToChat));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const addMessage = useCallback(async (
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage | null> => {
    if (!conversationId || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          type: message.type,
          content: message.content,
          sender: message.sender === 'bot' ? 'assistant' : message.sender,
          media_url: message.mediaUrl || null,
        })
        .select()
        .single();

      if (error) throw error;

      const chatMessage = mapDBMessageToChat(data);
      setMessages(prev => [...prev, chatMessage]);

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return chatMessage;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [conversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId || !supabase) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = mapDBMessageToChat(payload.new as DBMessage);
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    messages,
    isLoading,
    addMessage,
    clearMessages,
    refreshMessages: fetchMessages,
  };
};
