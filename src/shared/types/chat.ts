export interface ChatMessage {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string;
  sender: 'user' | 'bot';
  mediaUrl?: string;
  mimeType?: string;
  timestamp: Date;
}

export interface WebhookResponse {
  message?: string | unknown;
  Response?: string;
  output?: string;
  text?: string;
  imageUrl?: string;
  image?: string;
}
