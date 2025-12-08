export type MessageType = 'text' | 'image' | 'video' | 'audio';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  mediaUrl?: string;
  mimeType?: string;
}

export interface WebhookResponse {
  Response?: string;  // n8n workflow format
  output?: string;
  message?: string | { Response?: string; [key: string]: unknown };
  text?: string;
  imageUrl?: string;  // Image URL from bot
  image?: string;     // Base64 image data
  [key: string]: unknown;
}
