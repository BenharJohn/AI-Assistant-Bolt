import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceAI } from '../hooks/useVoiceAI';
import { useSettings } from '../context/SettingsContext';

interface LiveVoiceShapeProps {
  className?: string;
}

const LiveVoiceShape: React.FC<LiveVoiceShapeProps> = ({ className = '' }) => {
  const { reducedMotion } = useSettings();
  const {
    isListening,
    isProcessing,
    isPlaying,
    error,
    toggleListening,
    isActive
  } = useVoiceAI();

  const [isHovered, setIsHovered] = useState(false);

  // Generate organic shape path based on state
  const generatePath = () => {
    const baseTime = Date.now() * 0.001;
    
    if (isListening) {
      // More active, wavy shape when listening
      return `M 25 50 Q 35 ${45 + Math.sin(baseTime * 2) * 8}, 50 ${40 + Math.sin(baseTime * 1.5) * 10} T 75 50 Q 65 ${55 + Math.cos(baseTime * 2) * 8}, 50 50 T 25 50`;
    } else if (isProcessing) {
      // Pulsing, thinking pattern
      return `M 25 50 Q 35 ${48 + Math.sin(baseTime * 3) * 5}, 50 ${45 + Math.sin(baseTime * 2.5) * 7} T 75 50 Q 65 ${52 + Math.cos(baseTime * 3) * 5}, 50 50 T 25 50`;
    } else if (isPlaying) {
      // Rhythmic, speaking pattern
      return `M 25 50 Q 35 ${47 + Math.sin(baseTime * 4) * 6}, 50 ${42 + Math.sin(baseTime * 3) * 8} T 75 50 Q 65 ${53 + Math.cos(baseTime * 4) * 6}, 50 50 T 25 50`;
    } else if (isHovered) {
      // Gentle hover state
      return `M 25 50 Q 35 ${49 + Math.sin(baseTime) * 3}, 50 ${47 + Math.sin(baseTime * 0.8) * 4} T 75 50 Q 65 ${51 + Math.cos(baseTime) * 3}, 50 50 T 25 50`;
    } else {
      // Calm, idle state
      return `M 25 50 Q 35 50, 50 48 T 75 50 Q 65 52, 50 50 T 25 50`;
    }
  };

  const getShapeColor = () => {
    if (error) return 'text-red-500';
    if (isListening) return 'text-blue-500';
    if (isProcessing) return 'text-yellow-500';
    if (isPlaying) return 'text-green-500';
    if (isHovered) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getGlowIntensity = () => {
    if (isActive) return 'drop-shadow-lg';
    if (isHovered) return 'drop-shadow-md';
    return 'drop-shadow-sm';
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`w-32 h-32 cursor-pointer ${getGlowIntensity()}`}
        onClick={toggleListening}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        whileTap={reducedMotion ? {} : { scale: 0.95 }}
      >
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full ${getShapeColor()} transition-colors duration-300`}
        >
          <motion.path
            d={generatePath()}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              d: generatePath(),
              strokeWidth: isActive ? [2, 3, 2] : 2,
              opacity: error ? [1, 0.3, 1] : 1
            }}
            transition={{
              d: { duration: 2, ease: "easeInOut", repeat: Infinity },
              strokeWidth: { duration: 1, ease: "easeInOut", repeat: Infinity },
              opacity: { duration: 0.5, repeat: error ? Infinity : 0 }
            }}
          />
          
          {/* Center indicator */}
          <motion.circle
            cx="50"
            cy="50"
            r={isActive ? "3" : "2"}
            fill="currentColor"
            animate={{
              r: isActive ? [2, 4, 2] : 2,
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity
            }}
          />
        </svg>

        {/* Ambient particles when active */}
        <AnimatePresence>
          {isActive && !reducedMotion && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-1 h-1 ${getShapeColor().replace('text-', 'bg-')} rounded-full opacity-60`}
                  initial={{ 
                    opacity: 0,
                    scale: 0,
                    x: "50%",
                    y: "50%"
                  }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: ["50%", `${50 + Math.cos(i * 60 * Math.PI / 180) * 60}%`],
                    y: ["50%", `${50 + Math.sin(i * 60 * Math.PI / 180) * 60}%`]
                  }}
                  exit={{ 
                    opacity: 0,
                    scale: 0
                  }}
                  transition={{ 
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status tooltip */}
      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10"
          >
            {error ? 'Error - Tap to retry' :
             isListening ? 'Listening...' :
             isProcessing ? 'Processing...' :
             isPlaying ? 'Speaking...' :
             'Tap to talk'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveVoiceShape;