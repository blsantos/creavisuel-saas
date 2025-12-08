import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

interface Message {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string;
  sender: 'user' | 'bot';
  mediaUrl?: string;
  mimeType?: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isBot = message.sender === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isBot ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
      }`}>
        {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      <div className={`flex-1 max-w-[70%] ${isBot ? '' : 'flex justify-end'}`}>
        <div className={`glass-card p-4 rounded-2xl ${
          isBot ? 'rounded-tl-sm' : 'rounded-tr-sm'
        }`}>
          {message.type === 'text' && (
            <p className="text-white whitespace-pre-wrap">{message.content}</p>
          )}

          {message.type === 'image' && message.mediaUrl && (
            <div>
              <img 
                src={message.mediaUrl} 
                alt={message.content}
                className="rounded-lg max-w-full"
              />
              {message.content && message.content !== 'Image générée' && (
                <p className="text-white mt-2">{message.content}</p>
              )}
            </div>
          )}

          {message.type === 'video' && message.mediaUrl && (
            <video 
              src={message.mediaUrl} 
              controls 
              className="rounded-lg max-w-full"
            />
          )}

          {message.type === 'audio' && message.mediaUrl && (
            <audio 
              src={message.mediaUrl} 
              controls 
              className="w-full"
            />
          )}

          <div className="text-xs text-slate-400 mt-2">
            {new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};