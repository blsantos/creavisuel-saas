import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  user_id: string | null;
  client_slug: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export const useConversations = (clientSlug?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user || !isSupabaseConfigured() || !supabase) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (clientSlug) {
        query = query.eq('client_slug', clientSlug);
      }

      const { data, error } = await query;

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, clientSlug]);

  const createConversation = useCallback(async (title?: string) => {
    if (!user || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          client_slug: clientSlug || null,
          title: title || 'Nouvelle conversation',
        })
        .select()
        .single();

      if (error) throw error;
      
      setConversations(prev => [data, ...prev]);
      setCurrentConversation(data);
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user, clientSlug]);

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, title } : c))
      );
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [currentConversation]);

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setCurrentConversation(conversation);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!user || !supabase) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchConversations]);

  return {
    conversations,
    currentConversation,
    isLoading,
    createConversation,
    updateConversationTitle,
    deleteConversation,
    selectConversation,
    refreshConversations: fetchConversations,
  };
};
