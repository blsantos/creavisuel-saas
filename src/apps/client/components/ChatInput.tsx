import { useState, useRef } from 'react';
import { Send, Paperclip, Mic, X, Image, Video, StopCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendMedia: (file: File, type: 'image' | 'video' | 'audio') => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput = ({ 
  onSendText, 
  onSendMedia, 
  isLoading,
  placeholder = 'Écrivez votre message...'
}: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTypeRef = useRef<'image' | 'video'>('image');

  const {
    isRecording,
    formattedTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendText(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (type: 'image' | 'video') => {
    fileTypeRef.current = type;
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
      fileInputRef.current.click();
    }
    setShowMediaMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = fileTypeRef.current === 'image' ? 10 : 50; // MB
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`Le fichier est trop volumineux (max ${maxSize}MB)`);
        return;
      }
      onSendMedia(file, fileTypeRef.current);
    }
    e.target.value = '';
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      toast.error('Impossible d\'accéder au microphone');
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioFile = await stopRecording();
      onSendMedia(audioFile, 'audio');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-strong rounded-2xl p-3 md:p-4 shadow-lg"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {isRecording ? (
          <motion.div
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-4"
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </motion.div>
            
            <div className="flex-1 flex items-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-destructive"
              />
              <span className="text-sm font-medium text-foreground font-mono">
                {formattedTime}
              </span>
              <div className="flex-1 flex items-center gap-1">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: [8, Math.random() * 20 + 8, 8],
                    }}
                    transition={{ 
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                    className="w-1 bg-gradient-to-t from-primary/50 to-primary rounded-full"
                  />
                ))}
              </div>
            </div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleStopRecording}
                className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 shadow-lg"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                Envoyer
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-end gap-2 md:gap-3"
          >
            <div className="relative">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMediaMenu(!showMediaMenu)}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
              </motion.div>

              <AnimatePresence>
                {showMediaMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="absolute bottom-full left-0 mb-2 glass-strong rounded-xl p-2 shadow-xl min-w-[140px]"
                  >
                    <motion.button
                      whileHover={{ backgroundColor: 'hsl(var(--secondary))' }}
                      onClick={() => handleFileSelect('image')}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <Image className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Image</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ backgroundColor: 'hsl(var(--secondary))' }}
                      onClick={() => handleFileSelect('video')}
                      className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <Video className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Vidéo</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className={cn(
                  'w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm md:text-base',
                  'placeholder:text-muted-foreground resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50',
                  'max-h-32 scrollbar-thin transition-all border border-transparent',
                  'focus:border-primary/30'
                )}
                style={{
                  minHeight: '46px',
                  height: 'auto',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                }}
              />
            </div>

            <AnimatePresence mode="wait">
              {message.trim() ? (
                <motion.div
                  key="send"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-11 w-11 p-0 glow-primary shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartRecording}
                    disabled={isLoading}
                    className="text-accent hover:text-accent hover:bg-accent/10 h-11 w-11 rounded-full"
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
