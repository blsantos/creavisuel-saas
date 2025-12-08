import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from './use-toast';
import { useTenant } from '../contexts/TenantContext';

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  user_id?: string;
  title?: string;
  context?: Record<string, unknown>;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
}

interface UseChatWithSupabaseOptions {
  conversationId?: string;
  webhookUrl?: string;
  aiConfig?: {
    systemPrompt?: string;
    tone?: string;
    model?: string;
  };
}

export const useChatWithSupabase = (options: UseChatWithSupabaseOptions = {}) => {
  const { tenant } = useTenant();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  const conversationId = options.conversationId || conversation?.id;

  // Load or create conversation
  useEffect(() => {
    if (!tenant?.id) return;

    const initConversation = async () => {
      if (options.conversationId) {
        // Load existing conversation
        await loadConversation(options.conversationId);
      } else if (!conversation) {
        // Create new conversation
        await createConversation();
      }
    };

    initConversation();
  }, [tenant?.id, options.conversationId]);

  // Create a new conversation
  const createConversation = async () => {
    if (!tenant?.id) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenant.id,
          context: options.aiConfig || {},
          is_archived: false,
        })
        .select()
        .single();

      if (error) throw error;

      setConversation(data);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer une nouvelle conversation',
        variant: 'destructive',
      });
    }
  };

  // Load existing conversation
  const loadConversation = async (convId: string) => {
    setIsFetchingHistory(true);
    try {
      // Load conversation metadata
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', convId)
        .single();

      if (convError) throw convError;
      setConversation(convData);

      // Load messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la conversation',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingHistory(false);
    }
  };

  // Add message to Supabase
  const addMessage = async (
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<Message | null> => {
    if (!conversationId) {
      toast({
        title: 'Erreur',
        description: 'Aucune conversation active',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata: metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Failed to add message:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le message',
        variant: 'destructive',
      });
      return null;
    }
  };

  // Send message to webhook (if configured) and save response
  const sendToWebhook = async (userMessage: string): Promise<string | null> => {
    const webhookUrl = options.webhookUrl || tenant?.config?.ai_config?.webhookUrl;

    if (!webhookUrl) {
      // No webhook configured, return default AI response
      return 'Je suis votre assistant IA. Configurez un webhook pour activer l\'IA conversationnelle.';
    }

    try {
      // Get last 10 messages for context
      const recentMessages = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatInput: userMessage,
          message: userMessage,
          type: 'text',
          sessionId: conversationId,
          conversationHistory: recentMessages,
          tenant: {
            id: tenant?.id,
            slug: tenant?.slug,
            name: tenant?.name,
            aiConfig: {
              systemPrompt: options.aiConfig?.systemPrompt || tenant?.config?.ai_config?.system_prompt,
              tone: options.aiConfig?.tone || tenant?.config?.ai_config?.tone || 'professional',
              model: options.aiConfig?.model || 'gpt-4o-mini',
              ...options.aiConfig,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Webhook error');
      }

      const responseText = await response.text();
      let data: any;

      try {
        const parsed = JSON.parse(responseText);
        data = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch {
        return responseText;
      }

      // Extract response text from various formats
      if (Array.isArray(data.message)) {
        const firstItem = data.message[0];
        if (firstItem?.Response) return firstItem.Response;
      } else if (data.message?.Response) {
        return data.message.Response;
      } else if (data.Response) {
        return data.Response;
      } else if (data.output) {
        return data.output;
      } else if (data.message) {
        return data.message;
      } else if (data.text) {
        return data.text;
      }

      return 'Message reçu';
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  };

  // Send user message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText || trimmedText.length > 10000) {
        toast({
          title: 'Message invalide',
          description: 'Le message doit contenir entre 1 et 10000 caractères',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      try {
        // 1. Save user message
        const userMessage = await addMessage('user', trimmedText);
        if (!userMessage) throw new Error('Failed to save user message');

        // 2. Call webhook for AI response
        try {
          const aiResponse = await sendToWebhook(trimmedText);

          // 3. Save AI response
          if (aiResponse) {
            await addMessage('assistant', aiResponse, {
              model: options.aiConfig?.model || 'webhook',
              timestamp: new Date().toISOString(),
            });
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);

          // Save error as assistant message
          await addMessage(
            'assistant',
            'Désolé, je ne peux pas répondre pour le moment. Vérifiez la configuration du webhook.',
            { error: true }
          );
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'envoyer le message',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, options.webhookUrl, tenant, options.aiConfig]
  );

  // Archive conversation
  const archiveConversation = async () => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: true })
        .eq('id', conversationId);

      if (error) throw error;

      toast({
        title: 'Conversation archivée',
        description: 'La conversation a été archivée avec succès',
      });

      setConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'archiver la conversation',
        variant: 'destructive',
      });
    }
  };

  // Clear messages (for new conversation)
  const clearAndStartNew = async () => {
    await createConversation();
  };

  return {
    messages,
    conversation,
    isLoading,
    isFetchingHistory,
    sendMessage,
    archiveConversation,
    clearAndStartNew,
    createConversation,
    loadConversation,
  };
};
