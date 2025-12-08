import { motion } from 'framer-motion';
import { ImageIcon, Sparkles } from 'lucide-react';

interface ImageLoadingIndicatorProps {
  text?: string;
}

export const ImageLoadingIndicator = ({ text = "Création de l'image..." }: ImageLoadingIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-accent"
          style={{ width: 64, height: 64 }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center"
        >
          <ImageIcon className="w-7 h-7 text-primary" />
        </motion.div>
        <motion.div
          animate={{ 
            opacity: [0, 1, 0],
            y: [-5, -15],
            x: [0, 10]
          }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          className="absolute -top-1 -right-1"
        >
          <Sparkles className="w-4 h-4 text-accent" />
        </motion.div>
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-4 text-sm font-medium text-muted-foreground"
      >
        {text}
      </motion.p>
    </motion.div>
  );
};
