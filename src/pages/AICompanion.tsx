import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const AICompanion: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([
    { type: 'ai', content: 'Hello. I\'m here to listen and chat with you.' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useSettings();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: reducedMotion ? 'auto' : 'smooth' 
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, reducedMotion]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setInput("Tell me about your day");
        setIsListening(false);
      }, 2000);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI response with delay
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        type: 'ai', 
        content: "I understand. Would you like to explore that thought further?" 
      }]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-rose-100 dark:from-gray-900 dark:to-rose-900/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl relative">
        {/* Ambient background pattern */}
        <motion.div 
          className="absolute inset-0 opacity-20 dark:opacity-30 pointer-events-none"
          animate={{ 
            scale: [1, 1.02, 1],
            opacity: [0.2, 0.25, 0.2] 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-300 to-rose-200 dark:from-rose-800 dark:to-rose-900 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-lg border border-rose-100/50 dark:border-rose-500/20 overflow-hidden">
            <div className="h-[600px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        duration: reducedMotion ? 0.1 : 0.4,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                          message.type === 'user' 
                            ? 'bg-rose-100 dark:bg-rose-900/30 text-gray-800 dark:text-gray-100' 
                            : 'bg-white dark:bg-gray-700/50 text-gray-700 dark:text-gray-200'
                        }`}
                      >
                        <p className="text-lg">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2 text-rose-500 dark:text-rose-400"
                    >
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-sm">Thinking...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-rose-100 dark:border-rose-500/20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      isListening
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 scale-110'
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {isListening ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full bg-transparent border-0 focus:ring-0 text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <motion.div 
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-200 dark:bg-rose-700 origin-left"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: input ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      !input.trim() || isProcessing
                        ? 'text-gray-300 dark:text-gray-600'
                        : 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/30 scale-100 hover:scale-105'
                    }`}
                  >
                    <Mic size={24} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICompanion;