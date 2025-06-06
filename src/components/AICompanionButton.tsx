import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';
import AICompanionString from './AICompanionString';

interface AICompanionButtonProps {
  onActivate: () => void;
}

const AICompanionButton: React.FC<AICompanionButtonProps> = ({ onActivate }) => {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { reducedMotion } = useSettings();

  const handleClick = () => {
    if (!isActive) {
      setIsActive(true);
      return;
    }
    
    setIsListening(!isListening);
    onActivate();
  };

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{
        scale: isActive ? 1.1 : 1
      }}
      transition={{
        duration: 0.3,
        ease: "easeOut"
      }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-200/50 to-rose-300/50 dark:from-rose-800/20 dark:to-rose-900/20 blur-xl"
        animate={{
          scale: isActive ? 1.2 : 1,
          opacity: isActive ? 0.8 : 0.5,
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut"
        }}
      />

      {/* Morphing string animation */}
      <AICompanionString 
        isActive={isActive}
        isListening={isListening}
        onClick={handleClick}
      />

      {/* Pulse effect when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-rose-400 dark:border-rose-600"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.5, opacity: [0, 0.5, 0] }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AICompanionButton;