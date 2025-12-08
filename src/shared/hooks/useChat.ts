import { useState, useCallback } from 'react';
import { ChatMessage, WebhookResponse } from '@/types/chat';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Validation constants
const MAX_MESSAGE_LENGTH = 10000;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Validation schemas
const textMessageSchema = z.object({
  message: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  type: z.literal('text'),
});

const mediaMessageSchema = z.object({
  type: z.enum(['image', 'video', 'audio']),
  fileSize: z.number().max(MAX_FILE_SIZE_BYTES),
});

export const useChat = (webhookUrl: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: generateId(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendToWebhook = useCallback(async (payload: {
    message?: string;
    type: string;
    mediaData?: string;
    mediaDataFull?: string;
    mimeType?: string;
    fileName?: string;
    fileSize?: number;
  }) => {
    if (!webhookUrl) {
      toast({
        title: "Configuration requise",
        description: "Veuillez configurer l'URL du webhook dans les paramètres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payload,
          sessionId: 'chat-session-' + Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur de communication avec le serveur');
      }

      const responseText = await response.text();
      console.log('Raw webhook response:', responseText);
      
      let data: WebhookResponse;
      try {
        const parsed = JSON.parse(responseText);
        // Handle root-level array response (e.g., [{"Response":"..."}])
        if (Array.isArray(parsed)) {
          data = parsed[0] || {};
        } else {
          data = parsed;
        }
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        addMessage({
          type: 'text',
          content: responseText || 'Message reçu',
          sender: 'bot',
        });
        return;
      }
      
      // Handle bot response - support various n8n response formats
      let botMessage = 'Message reçu';
      let imageUrl: string | undefined;
      
      // Check for message as array (from n8n Respond to Webhook with allIncomingItems)
      if (Array.isArray(data.message)) {
        const firstItem = data.message[0] as Record<string, unknown>;
        if (firstItem?.Response && typeof firstItem.Response === 'string') {
          botMessage = firstItem.Response;
        }
        if (firstItem?.imageUrl && typeof firstItem.imageUrl === 'string') {
          imageUrl = firstItem.imageUrl;
        }
        if (firstItem?.image && typeof firstItem.image === 'string') {
          imageUrl = firstItem.image;
        }
      } else if (data.message && typeof data.message === 'object') {
        const msgObj = data.message as Record<string, unknown>;
        if ('Response' in msgObj && typeof msgObj.Response === 'string') {
          botMessage = msgObj.Response;
        }
        if ('imageUrl' in msgObj && typeof msgObj.imageUrl === 'string') {
          imageUrl = msgObj.imageUrl;
        }
        if ('image' in msgObj && typeof msgObj.image === 'string') {
          imageUrl = msgObj.image;
        }
      } else if (typeof data.Response === 'string') {
        botMessage = data.Response;
      } else if (typeof data.output === 'string') {
        botMessage = data.output;
      } else if (typeof data.message === 'string') {
        botMessage = data.message;
      } else if (typeof data.text === 'string') {
        botMessage = data.text;
      }
      
      // Check for image at root level
      if (data.imageUrl) imageUrl = data.imageUrl as string;
      if (data.image) imageUrl = data.image as string;
      
      // Extract image URL from markdown links in text (e.g., [Voir le visuel](https://...))
      if (!imageUrl && botMessage) {
        const markdownLinkMatch = botMessage.match(/\[.*?\]\((https?:\/\/[^\s)]+\.(png|jpg|jpeg|gif|webp)[^\s)]*)\)/i);
        if (markdownLinkMatch) {
          imageUrl = markdownLinkMatch[1];
          // Remove the markdown link from the text
          botMessage = botMessage.replace(markdownLinkMatch[0], '').trim();
        }
      }
      
      // Add text message if present
      if (botMessage && botMessage !== 'Message reçu') {
        addMessage({
          type: 'text',
          content: botMessage,
          sender: 'bot',
        });
      }
      
      // Add image message if present
      if (imageUrl) {
        addMessage({
          type: 'image',
          content: 'Image générée',
          sender: 'bot',
          mediaUrl: imageUrl,
        });
      } else if (botMessage === 'Message reçu' && !imageUrl) {
        addMessage({
          type: 'text',
          content: botMessage,
          sender: 'bot',
        });
      }

    } catch (error) {
      console.error('Webhook error:', error);
      toast({
        title: "Erreur de connexion",
        description: "Le webhook ne répond pas. Vérifiez qu'il est actif et accessible.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [webhookUrl, addMessage]);

  const sendTextMessage = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    
    // Validate text message
    const validation = textMessageSchema.safeParse({ message: trimmedText, type: 'text' });
    if (!validation.success) {
      if (trimmedText.length > MAX_MESSAGE_LENGTH) {
        toast({
          title: "Message trop long",
          description: `Le message ne peut pas dépasser ${MAX_MESSAGE_LENGTH.toLocaleString()} caractères.`,
          variant: "destructive",
        });
      }
      return;
    }
    
    addMessage({
      type: 'text',
      content: trimmedText,
      sender: 'user',
    });

    await sendToWebhook({ message: trimmedText, type: 'text' });
  }, [addMessage, sendToWebhook]);

  const sendMediaMessage = useCallback(async (
    file: File,
    type: 'image' | 'video' | 'audio'
  ) => {
    // Validate file size
    const validation = mediaMessageSchema.safeParse({ type, fileSize: file.size });
    if (!validation.success) {
      toast({
        title: "Fichier trop volumineux",
        description: `La taille du fichier ne peut pas dépasser ${MAX_FILE_SIZE_MB} Mo.`,
        variant: "destructive",
      });
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async () => {
      const fullBase64 = reader.result as string;
      const mediaUrl = URL.createObjectURL(file);
      
      // Extract pure base64 without the data URL prefix for n8n compatibility
      const base64Pure = fullBase64.split(',')[1] || fullBase64;
      
      addMessage({
        type,
        content: type === 'audio' ? 'Message vocal' : file.name,
        sender: 'user',
        mediaUrl,
        mimeType: file.type,
      });

      await sendToWebhook({
        type,
        mediaData: base64Pure,
        mediaDataFull: fullBase64, // Keep full data URL for compatibility
        mimeType: file.type,
        fileName: file.name,
        fileSize: file.size,
        message: type === 'audio' ? 'Message vocal' : file.name,
      });
    };

    reader.readAsDataURL(file);
  }, [addMessage, sendToWebhook]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendTextMessage,
    sendMediaMessage,
    clearMessages,
  };
};
