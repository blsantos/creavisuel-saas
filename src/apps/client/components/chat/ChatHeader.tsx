import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { motion } from 'framer-motion';
import logoCreaVisuel from '@/assets/logo-creavisuel.png';

interface ChatHeaderProps {
  isLoading: boolean;
  onOpenSettings: () => void;
  logoUrl?: string;
  assistantName?: string;
  companyName?: string;
}

export const ChatHeader = ({ 
  isLoading, 
  onOpenSettings,
  logoUrl,
  assistantName = 'Assistant',
  companyName = 'CréaVisuel'
}: ChatHeaderProps) => {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-strong rounded-2xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-full overflow-hidden shadow-lg glow-primary bg-card ring-2 ring-border/30"
            >
              <img 
                src={logoUrl || logoCreaVisuel} 
                alt={companyName} 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.span
              animate={isLoading ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: isLoading ? Infinity : 0 }}
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-card ${
                isLoading ? 'bg-warning' : 'bg-success'
              }`}
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {companyName} <span className="text-primary">{assistantName}</span>
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    En train de répondre
                  </motion.span>
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  >
                    ...
                  </motion.span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  En ligne
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
};
