import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader, AlertCircle, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useVoiceAI } from '../hooks/useVoiceAI';
import { useSettings } from '../context/SettingsContext';

interface VoiceAIProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'floating' | 'inline';
  className?: string;
}

const VoiceAI: React.FC<VoiceAIProps> = ({ 
  isOpen, 
  onClose, 
  variant = 'floating',
  className = '' 
}) => {
  const { reducedMotion } = useSettings();
  const location = useLocation();
  const {
    isListening,
    isProcessing,
    isPlaying,
    error,
    lastResponse,
    toggleListening,
    clearError,
    isActive
  } = useVoiceAI();

  // Auto-close error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const getStatusText = () => {
    if (error) return 'Error occurred';
    if (isListening) return 'Listening...';
    if (isProcessing) return 'Processing...';
    if (isPlaying) return 'Speaking...';
    
    // Context-aware prompt based on current page
    switch (location.pathname) {
      case '/journal':
        return 'Share your thoughts';
      case '/focus':
        return 'Need help focusing?';
      case '/learning':
        return 'What would you like to learn?';
      case '/tasks':
        return 'Manage your tasks';
      default:
        return 'How can I help you?';
    }
  };

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isActive) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getMicIcon = () => {
    if (isProcessing) return <Loader size={24} className="animate-spin" />;
    if (isPlaying) return <Volume2 size={24} />;
    if (isListening) return <MicOff size={24} />;
    return <Mic size={24} />;
  };

  const getPageSpecificHint = () => {
    switch (location.pathname) {
      case '/journal':
        return "I'm here to listen and help you process your thoughts";
      case '/focus':
        return "I'll keep responses brief to help you stay focused";
      case '/learning':
        return "I can explain concepts and help you understand new topics";
      case '/tasks':
        return "I can help you add, update, and organize your tasks";
      default:
        return "I can help with tasks, learning, journaling, or focus";
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <motion.button
          onClick={toggleListening}
          disabled={isProcessing || isPlaying}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-lg
            ${isActive 
              ? 'bg-primary text-primary-foreground scale-110' 
              : 'bg-card hover:bg-muted text-card-foreground hover:scale-105'
            }
            ${(isProcessing || isPlaying) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
          `}
          whileTap={reducedMotion ? {} : { scale: 0.95 }}
        >
          {getMicIcon()}
          
          {/* Pulse animation when listening */}
          <AnimatePresence>
            {isListening && !reducedMotion && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
          </AnimatePresence>
        </motion.button>

        <div className="text-center">
          <p className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </p>
          
          {!isActive && !error && (
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              {getPageSpecificHint()}
            </p>
          )}
          
          {lastResponse && !error && (
            <p className="text-xs text-muted-foreground mt-2 max-w-xs">
              {lastResponse}
            </p>
          )}
          
          {error && (
            <div className="flex items-center justify-center mt-2 text-red-500">
              <AlertCircle size={16} className="mr-1" />
              <p className="text-xs">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Floating variant (modal-like)
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={onClose}
          />
          
          {/* Voice AI Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-2xl shadow-warm border border-appBorder p-8 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-card-foreground">Voice Assistant</h2>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center space-y-6">
                {/* Main voice button */}
                <motion.button
                  onClick={toggleListening}
                  disabled={isProcessing || isPlaying}
                  className={`
                    relative w-32 h-32 rounded-full flex items-center justify-center
                    transition-all duration-300 shadow-xl
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                    }
                    ${(isProcessing || isPlaying) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                  `}
                  whileHover={reducedMotion ? {} : { scale: 1.05 }}
                  whileTap={reducedMotion ? {} : { scale: 0.95 }}
                >
                  <div className="text-4xl">
                    {getMicIcon()}
                  </div>
                  
                  {/* Animated rings when listening */}
                  <AnimatePresence>
                    {isListening && !reducedMotion && (
                      <>
                        {[0, 0.5, 1].map((delay) => (
                          <motion.div
                            key={delay}
                            className="absolute inset-0 rounded-full border-2 border-primary/30"
                            initial={{ scale: 1, opacity: 0.8 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            exit={{ scale: 1, opacity: 0 }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay,
                              ease: "easeOut"
                            }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Status text */}
                <div className="text-center space-y-2">
                  <p className={`text-lg font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </p>
                  
                  {!isActive && !error && (
                    <p className="text-sm text-muted-foreground">
                      {getPageSpecificHint()}
                    </p>
                  )}
                  
                  {lastResponse && !error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20"
                    >
                      <p className="text-sm text-foreground">{lastResponse}</p>
                    </motion.div>
                  )}
                  
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center justify-center text-red-600 dark:text-red-400">
                        <AlertCircle size={16} className="mr-2" />
                        <p className="text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoiceAI;