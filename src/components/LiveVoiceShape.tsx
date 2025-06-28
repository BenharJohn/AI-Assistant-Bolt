import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useVoiceAI } from '../hooks/useVoiceAI';
import { useSettings } from '../context/SettingsContext';

interface LiveVoiceShapeProps {
  className?: string;
}

const LiveVoiceShape: React.FC<LiveVoiceShapeProps> = ({ className = '' }) => {
  const { reducedMotion } = useSettings();
  const location = useLocation();
  const {
    isListening,
    isProcessing,
    isPlaying,
    error,
    toggleListening,
    isActive
  } = useVoiceAI();

  const [isHovered, setIsHovered] = useState(false);
  const [pathAnimation, setPathAnimation] = useState(0);

  // Animate the path continuously
  useEffect(() => {
    if (reducedMotion) return;
    
    const interval = setInterval(() => {
      setPathAnimation(prev => prev + 0.02);
    }, 50);
    
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Generate organic shape path based on state
  const generatePath = () => {
    const time = pathAnimation;
    
    if (isListening) {
      // More active, wavy shape when listening
      return `M 25 50 Q 35 ${45 + Math.sin(time * 3) * 8}, 50 ${40 + Math.sin(time * 2.5) * 10} T 75 50 Q 65 ${55 + Math.cos(time * 3) * 8}, 50 50 T 25 50`;
    } else if (isProcessing) {
      // Pulsing, thinking pattern
      return `M 25 50 Q 35 ${48 + Math.sin(time * 4) * 5}, 50 ${45 + Math.sin(time * 3.5) * 7} T 75 50 Q 65 ${52 + Math.cos(time * 4) * 5}, 50 50 T 25 50`;
    } else if (isPlaying) {
      // Rhythmic, speaking pattern
      return `M 25 50 Q 35 ${47 + Math.sin(time * 5) * 6}, 50 ${42 + Math.sin(time * 4) * 8} T 75 50 Q 65 ${53 + Math.cos(time * 5) * 6}, 50 50 T 25 50`;
    } else if (isHovered) {
      // Gentle hover state
      return `M 25 50 Q 35 ${49 + Math.sin(time * 1.5) * 3}, 50 ${47 + Math.sin(time * 1.2) * 4} T 75 50 Q 65 ${51 + Math.cos(time * 1.5) * 3}, 50 50 T 25 50`;
    } else {
      // Calm, idle state
      return `M 25 50 Q 35 ${50 + Math.sin(time * 0.8) * 2}, 50 ${48 + Math.sin(time * 0.6) * 2} T 75 50 Q 65 ${50 + Math.cos(time * 0.8) * 2}, 50 50 T 25 50`;
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

  const getStatusText = () => {
    if (error) return 'Error - Tap to retry';
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isPlaying) return 'Speaking...';
    
    // Context-aware prompt based on current page
    switch (location.pathname) {
      case '/journal':
        return 'Share your thoughts';
      case '/focus':
        return 'Focus check-in';
      case '/learning':
        return 'Ask me anything';
      case '/tasks':
        return 'Manage your tasks';
      default:
        return 'Tap to talk';
    }
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
            strokeWidth={isActive ? "3" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={{
              strokeWidth: isActive ? [2, 3, 2] : 2,
              opacity: error ? [1, 0.3, 1] : 1
            }}
            transition={{
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
            {getStatusText()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveVoiceShape;