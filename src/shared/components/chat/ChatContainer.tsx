import { useRef, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ParticlesBackground } from './ParticlesBackground';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';
import logoCreaVisuel from '@/assets/logo-creavisuel.png';

interface ChatContainerProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  welcomeMessage?: string;
  welcomeSubtitle?: string;
  logoUrl?: string;
  companyName?: string;
}

export const ChatContainer = ({ 
  messages, 
  isLoading,
  welcomeMessage = 'Bonjour ! Comment puis-je vous aider ?',
  welcomeSubtitle = 'Posez-moi vos questions',
  logoUrl,
  companyName = 'CréaVisuel'
}: ChatContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 space-y-4"
    >
      <AnimatePresence mode="wait">
        {messages.length === 0 ? (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center h-full text-center px-4 relative"
          >
            <ParticlesBackground />
            {/* Logo with glow effect */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
              <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl glow-primary bg-card flex items-center justify-center relative z-10 ring-2 ring-border/50">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={companyName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={logoCreaVisuel} 
                    alt="CréaVisuel" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-foreground mt-6 mb-3"
            >
              {welcomeMessage}
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground max-w-md text-sm md:text-base leading-relaxed"
            >
              {welcomeSubtitle}
            </motion.p>

            {/* Quick action hints */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-2 mt-6 justify-center"
            >
              {['💬 Texte', '📷 Image', '🎥 Vidéo', '🎤 Vocal'].map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/50"
                >
                  {item}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {messages.map((message, index) => (
              <ChatMessage key={message.id} message={message} index={index} />
            ))}
            
            <AnimatePresence>
              {isLoading && <TypingIndicator />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
