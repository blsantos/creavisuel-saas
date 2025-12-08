import { motion } from 'framer-motion';

export const TypingIndicator = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -6 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start"
    >
      <div className="message-received rounded-2xl rounded-bl-md px-5 py-4 shadow-lg">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              variants={dotVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 0.4,
                repeat: Infinity,
                repeatType: 'reverse',
                delay: i * 0.15
              }}
              className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-primary/60"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
