import { useCallback } from 'react';
import { ChatMessage } from '@/types/chat';

const N8N_WORKFLOW_URL = 'https://n8n.lecoach.digital/webhook/cvbaserow';

interface ChatHistoryPayload {
  action: 'save_chat';
  clientSlug: string;
  sessionId: string;
  messages: Array<{
    type: string;
    content: string;
    sender: string;
    timestamp: string;
    mediaUrl?: string;
  }>;
}

export const useChatHistory = (clientSlug: string) => {
  const saveHistory = useCallback(async (messages: ChatMessage[], sessionId: string) => {
    if (messages.length === 0) return;

    const payload: ChatHistoryPayload = {
      action: 'save_chat',
      clientSlug,
      sessionId,
      messages: messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        sender: msg.sender,
        timestamp: msg.timestamp.toISOString(),
        mediaUrl: msg.mediaUrl,
      })),
    };

    try {
      await fetch(N8N_WORKFLOW_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      console.log('Chat history saved via n8n');
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [clientSlug]);

  return { saveHistory };
};
