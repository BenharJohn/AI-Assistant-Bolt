import React, { useRef, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

interface AICompanionStringProps {
  isActive: boolean;
  isListening: boolean;
  onClick: () => void;
}

const AICompanionString: React.FC<AICompanionStringProps> = ({ isActive, isListening, onClick }) => {
  const pathRef = useRef<SVGPathElement>(null);
  const controls = useAnimation();
  const { reducedMotion } = useSettings();

  // Base path data for different states with smoother curves
  const paths = {
    idle: "M 25 50 Q 35 50, 50 35 T 75 50 Q 65 65, 50 50 T 25 50",
    active: "M 25 50 Q 35 50, 50 40 T 75 50 Q 65 60, 50 50 T 25 50",
    listening: "M 25 50 Q 35 50, 50 45 T 75 50 Q 65 55, 50 50 T 25 50"
  };

  useEffect(() => {
    if (reducedMotion) return;

    const animate = async () => {
      if (isListening) {
        // Gentle wave-like motion when listening
        await controls.start({
          d: [
            paths.listening,
            "M 25 50 Q 35 50, 50 55 T 75 50 Q 65 45, 50 50 T 25 50",
            paths.listening
          ],
          transition: {
            duration: 3,
            ease: [0.45, 0, 0.55, 1],
            repeat: Infinity,
            repeatType: "mirror"
          }
        });
      } else if (isActive) {
        // Subtle breathing motion when active
        await controls.start({
          d: paths.active,
          transition: {
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1]
          }
        });
      } else {
        // Return to idle state
        await controls.start({
          d: paths.idle,
          transition: {
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1]
          }
        });
      }
    };

    animate();
  }, [isActive, isListening, controls, reducedMotion]);

  return (
    <div className="relative w-32 h-32 cursor-pointer" onClick={onClick}>
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full ${
          isListening 
            ? 'text-rose-500 dark:text-rose-400' 
            : 'text-gray-600 dark:text-gray-300'
        }`}
      >
        <motion.path
          ref={pathRef}
          initial={{ d: paths.idle }}
          animate={controls}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>

      {/* Ambient particles */}
      <AnimatePresence>
        {isActive && !reducedMotion && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-rose-400/30 rounded-full"
                initial={{ 
                  opacity: 0,
                  scale: 0,
                  x: "50%",
                  y: "50%"
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: ["50%", `${50 + Math.cos(i * 60) * 40}%`],
                  y: ["50%", `${50 + Math.sin(i * 60) * 40}%`]
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
    </div>
  );
};

export default AICompanionString;