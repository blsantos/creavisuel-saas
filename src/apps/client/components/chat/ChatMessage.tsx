import { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Play, Pause, Check, CheckCheck } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChatMessageProps {
  message: ChatMessageType;
  index?: number;
}

// Regex patterns for media detection
const IMAGE_URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+\.(?:png|jpg|jpeg|gif|webp|bmp)(?:\?[^\s<>"{}|\\^`[\]]*)?)/gi;
const VIDEO_URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+\.(?:mp4|webm|mov|avi)(?:\?[^\s<>"{}|\\^`[\]]*)?)/gi;
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;

export const ChatMessage = ({ message, index = 0 }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioProgress(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Extract and render media from text content
  const renderTextWithMedia = (text: string) => {
    let processedText = text;
    const mediaElements: React.ReactNode[] = [];
    
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];
    
    // Extract from markdown links first
    let markdownMatch;
    while ((markdownMatch = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
      const url = markdownMatch[2];
      if (/\.(png|jpg|jpeg|gif|webp|bmp)/i.test(url)) {
        imageUrls.push(url);
        processedText = processedText.replace(markdownMatch[0], '');
      } else if (/\.(mp4|webm|mov|avi)/i.test(url)) {
        videoUrls.push(url);
        processedText = processedText.replace(markdownMatch[0], '');
      }
    }
    
    MARKDOWN_LINK_REGEX.lastIndex = 0;
    
    // Extract plain image URLs
    let imageMatch;
    while ((imageMatch = IMAGE_URL_REGEX.exec(processedText)) !== null) {
      if (!imageUrls.includes(imageMatch[1])) {
        imageUrls.push(imageMatch[1]);
      }
    }
    IMAGE_URL_REGEX.lastIndex = 0;
    
    // Extract plain video URLs
    let videoMatch;
    while ((videoMatch = VIDEO_URL_REGEX.exec(processedText)) !== null) {
      if (!videoUrls.includes(videoMatch[1])) {
        videoUrls.push(videoMatch[1]);
      }
    }
    VIDEO_URL_REGEX.lastIndex = 0;
    
    // Remove media URLs from text
    imageUrls.forEach(url => {
      processedText = processedText.replace(url, '');
    });
    videoUrls.forEach(url => {
      processedText = processedText.replace(url, '');
    });
    
    // Clean up text
    processedText = processedText.replace(/\n{3,}/g, '\n\n').trim();
    
    // Build media elements
    imageUrls.forEach((url, idx) => {
      mediaElements.push(
        <motion.div 
          key={`img-${idx}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-3 relative overflow-hidden rounded-xl"
        >
          {!imageLoaded && (
            <div className="image-placeholder w-full h-48" />
          )}
          <img
            src={url}
            alt="Image partagée"
            className={cn(
              "rounded-xl max-w-full max-h-72 object-cover cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
              !imageLoaded && "absolute opacity-0"
            )}
            onClick={() => window.open(url, '_blank')}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </motion.div>
      );
    });
    
    videoUrls.forEach((url, idx) => {
      mediaElements.push(
        <motion.video
          key={`vid-${idx}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          src={url}
          controls
          className="rounded-xl max-w-full max-h-72 mt-3"
        />
      );
    });
    
    return (
      <>
        {processedText && (
          <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {processedText}
          </p>
        )}
        {mediaElements}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.35, 
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400 }}
        className={cn(
          'max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 relative',
          isUser
            ? 'message-sent rounded-br-sm'
            : 'message-received rounded-bl-sm'
        )}
      >
        {message.type === 'text' && renderTextWithMedia(message.content)}

        {message.type === 'image' && message.mediaUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            {!imageLoaded && (
              <div className="image-placeholder w-64 h-48 rounded-xl" />
            )}
            <img
              src={message.mediaUrl}
              alt={message.content}
              className={cn(
                "rounded-xl max-w-full max-h-72 object-cover cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                !imageLoaded && "absolute opacity-0"
              )}
              onClick={() => window.open(message.mediaUrl, '_blank')}
              onLoad={() => setImageLoaded(true)}
            />
            {message.content && message.content !== message.mediaUrl && message.content !== 'Image générée' && (
              <p className="text-sm opacity-80">{message.content}</p>
            )}
          </motion.div>
        )}

        {message.type === 'video' && message.mediaUrl && (
          <div className="space-y-2">
            <video
              src={message.mediaUrl}
              controls
              className="rounded-xl max-w-full max-h-72"
            />
            {message.content && message.content !== message.mediaUrl && (
              <p className="text-sm opacity-80">{message.content}</p>
            )}
          </div>
        )}

        {message.type === 'audio' && message.mediaUrl && (
          <div className="flex items-center gap-3 min-w-[220px]">
            <motion.button
              onClick={toggleAudio}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg',
                isUser
                  ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                  : 'bg-primary/20 hover:bg-primary/30'
              )}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>
            <div className="flex-1">
              <div className="h-1.5 bg-current/20 rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    isUser ? 'bg-primary-foreground' : 'bg-primary'
                  )}
                  style={{ width: `${audioProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <p className="text-xs mt-1.5 opacity-70">Message vocal</p>
            </div>
            <audio
              ref={audioRef}
              src={message.mediaUrl}
              onEnded={handleAudioEnded}
              onTimeUpdate={handleTimeUpdate}
              className="hidden"
            />
          </div>
        )}

        <div className={cn(
          'flex items-center gap-1.5 mt-2',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <span className="text-xs opacity-50">
            {formatTime(new Date(message.timestamp))}
          </span>
          {isUser && (
            <CheckCheck className="w-3.5 h-3.5 opacity-50" />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
