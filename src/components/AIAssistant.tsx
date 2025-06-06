import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, X, Bot, Loader, VolumeX, Volume2 } from 'lucide-react';
import { useAI } from '../context/AIContext';
import { useSettings } from '../context/SettingsContext';
import { useTask } from '../context/TaskContext';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{type: 'user' | 'assistant', content: string}>>([
    { type: 'assistant', content: 'Hi! I\'m your AI assistant. How can I help you today?' }
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const { isProcessing, processUserInput } = useAI();
  const { reducedMotion } = useSettings();
  const { addTask } = useTask();

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => {
        setInput('Help me write my history essay due next Friday');
        setIsListening(false);
      }, 3000);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInput('');

    try {
      const response = await processUserInput(userMessage);
      
      if (response.type === 'task') {
        addTask({
          title: response.content.title,
          description: userMessage,
          dueDate: null,
          priority: response.content.suggestedPriority,
          status: 'pending',
          steps: response.content.steps.map((step: string, index: number) => ({
            id: `${Date.now()}-${index}`,
            text: step,
            completed: false
          })),
          tags: ['AI-generated'],
        });
        
        setMessages(prev => [
          ...prev, 
          { 
            type: 'assistant', 
            content: `${response.message} I've created a task with these steps:\n\n${response.content.steps.map((step: string, i: number) => `${i+1}. ${step}`).join('\n')}` 
          }
        ]);
      } else {
        setMessages(prev => [...prev, { type: 'assistant', content: response.content }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { type: 'assistant', content: 'Sorry, I encountered an error processing your request.' }]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [messages, reducedMotion]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <>
      <motion.button
        onClick={toggleOpen}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 bg-indigo-600 text-white rounded-2xl p-3 hover:bg-indigo-700 transition-colors duration-200 z-20"
        whileHover={{ scale: reducedMotion ? 1 : 1.05 }}
        whileTap={{ scale: reducedMotion ? 1 : 0.95 }}
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
            className="fixed bottom-24 right-4 lg:bottom-20 lg:right-8 w-[calc(100%-2rem)] max-w-md h-[500px] bg-white dark:bg-gray-800 rounded-xl flex flex-col z-20 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium">AI Assistant</h3>
              <button onClick={toggleOpen} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2 ${
                      message.type === 'user'
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-gray-800 dark:text-gray-100'
                        : 'bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-2 text-gray-800 dark:text-gray-100">
                    <div className="flex items-center space-x-2">
                      <Loader size={16} className="animate-spin" />
                      <p className="text-sm">Thinking...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button 
                  type="button"
                  onClick={toggleListening}
                  className={`p-2 rounded-xl ${
                    isListening 
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                      : 'text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400'
                  }`}
                >
                  {isListening ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? 'Listening...' : 'Type a message...'}
                  disabled={isListening}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  className={`p-2 rounded-xl ${
                    !input.trim() || isProcessing
                      ? 'text-gray-400 dark:text-gray-600'
                      : 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
              {isListening && (
                <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                  Listening... Speak clearly into your microphone.
                </p>
              )}
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;