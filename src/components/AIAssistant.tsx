import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Bot, Loader } from 'lucide-react';
import { useAI } from '../context/AIContext';
import { useSettings } from '../context/SettingsContext';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'assistant', content: string}>>([
    { type: 'assistant', content: 'Hi! I\'m your AI assistant. How can I help you today?' }
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isProcessing, getAIResponse } = useAI();
  const { reducedMotion } = useSettings();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInput('');

    try {
      const response = await getAIResponse('Answer this question helpfully and concisely', userMessage);
      setMessages(prev => [...prev, { type: 'assistant', content: response || 'Sorry, I couldn\'t process that.' }]);
    } catch {
      setMessages(prev => [...prev, { type: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [messages, reducedMotion]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <>
      <motion.button
        onClick={toggleOpen}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 bg-primary text-primary-foreground rounded-2xl p-3 hover:opacity-90 transition-colors duration-200 z-20"
        whileHover={reducedMotion ? {} : { scale: 1.05 }}
        whileTap={reducedMotion ? {} : { scale: 0.95 }}
      >
        <Bot size={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            className="fixed bottom-24 right-4 lg:bottom-20 lg:right-8 w-[calc(100%-2rem)] max-w-md h-[500px] bg-card rounded-2xl flex flex-col z-20 border border-appBorder overflow-hidden shadow-warm"
          >
            <div className="flex justify-between items-center p-4 border-b border-appBorder">
              <h3 className="font-medium text-foreground">AI Assistant</h3>
              <button onClick={toggleOpen} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-2">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader size={16} className="animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-appBorder">
              <div className="flex items-center space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-background border border-appBorder rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className={`p-2 rounded-xl ${
                    !input.trim() || isProcessing
                      ? 'text-muted-foreground'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
