import React from 'react';
import { motion } from 'framer-motion';
import foxIcon from '../assets/fox.png';
import aevaLogo from '../assets/aeva.png';

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 1, delay: 2.5 }} // Show for 2.5s then fade out over 1s
      onAnimationComplete={onAnimationComplete}
    >
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-primary/5 via-secondary/3 to-transparent"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      
      {/* Main content container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        className="flex flex-col items-center relative z-10"
      >
        {/* Fox icon with gentle floating animation */}
        <motion.div
          className="w-32 h-32 lg:w-40 lg:h-40 flex items-center justify-center mb-6"
          animate={{ 
            y: [0, -8, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <img 
            src={foxIcon} 
            alt="Aeva Fox" 
            className="w-full h-full object-contain drop-shadow-lg" 
          />
        </motion.div>
        
        {/* Aeva logo with slide-up animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="h-16 lg:h-20 flex items-center mb-4"
        >
          <img 
            src={aevaLogo} 
            alt="Aeva" 
            className="h-full object-contain drop-shadow-md" 
          />
        </motion.div>
        
        {/* Subtitle text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-muted-foreground text-lg lg:text-xl font-medium tracking-wide"
        >
          Your AI Companion
        </motion.p>
        
        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 1.6 }}
          className="mt-8 flex space-x-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </motion.div>
      </motion.div>
      
      {/* Subtle particles animation */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          initial={{ 
            opacity: 0,
            x: "50vw",
            y: "50vh"
          }}
          animate={{ 
            opacity: [0, 1, 0],
            x: `${50 + Math.cos(i * 60 * Math.PI / 180) * 30}vw`,
            y: `${50 + Math.sin(i * 60 * Math.PI / 180) * 30}vh`,
            scale: [0, 1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>
  );
};

export default SplashScreen;