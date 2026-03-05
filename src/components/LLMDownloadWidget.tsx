import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Brain, X } from 'lucide-react';
import foxIcon from '../assets/fox.png';
import { useOfflineLLM } from '../hooks/useOfflineLLM';

const LLMDownloadWidget: React.FC = () => {
  const { status, progress } = useOfflineLLM();
  const [dismissed, setDismissed] = useState(false);

  const isReady = status === 'ready';

  // Auto-dismiss 5s after ready
  useEffect(() => {
    if (isReady && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isReady, dismissed]);

  // Don't show if idle, dismissed, or already generating
  if (status === 'idle' || status === 'generating' || dismissed) return null;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 80 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40"
        >
          <div className="relative flex items-center gap-3 bg-card border border-appBorder rounded-2xl shadow-lg px-4 py-3 min-w-[200px]">
            {/* Close button */}
            {isReady && (
              <button
                onClick={() => setDismissed(true)}
                className="absolute -top-2 -right-2 bg-muted rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}

            {/* Fox avatar with progress ring */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={status === 'loading' ? {
                  rotate: [0, 5, -5, 0],
                } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img src={foxIcon} alt="Aeva" className="w-10 h-10 object-contain" />
              </motion.div>

              {/* Circular progress ring */}
              {status === 'loading' && (
                <svg className="absolute -inset-1 w-12 h-12" viewBox="0 0 48 48">
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-muted/30"
                  />
                  <circle
                    cx="24" cy="24" r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="text-primary"
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                    transform="rotate(-90 24 24)"
                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                  />
                </svg>
              )}

              {/* Ready checkmark */}
              {isReady && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5"
                >
                  <Check size={10} className="text-white" />
                </motion.div>
              )}

              {/* Error indicator */}
              {status === 'error' && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
                  <X size={10} className="text-white" />
                </div>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              {status === 'loading' && (
                <>
                  <p className="text-xs font-medium text-foreground truncate">
                    Preparing offline AI
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{progress}%</span>
                  </div>
                </>
              )}
              {isReady && (
                <div className="flex items-center gap-1.5">
                  <Brain size={12} className="text-green-500" />
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    Offline AI ready!
                  </p>
                </div>
              )}
              {status === 'error' && (
                <p className="text-xs font-medium text-red-500">
                  Download failed
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LLMDownloadWidget;
