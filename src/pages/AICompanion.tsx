import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

type ConversationEntry = { type: 'user' | 'ai'; content: string };

const AICompanion: React.FC = () => {
  const [conversation, setConversation] = useState<Array<ConversationEntry>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { reducedMotion } = useSettings();

  useEffect(() => {
    const saved = localStorage.getItem('assistant-conversation-history');
    if (saved) {
      setConversation(JSON.parse(saved));
    } else {
      setConversation([{type: 'ai', content: 'How can I help you be more productive today?'}]);
    }
  }, []);

  useEffect(() => {
    if (conversation.length > 0) {
      localStorage.setItem('assistant-conversation-history', JSON.stringify(conversation));
    }
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isProcessing) return;

    const newUserEntry: ConversationEntry = { type: 'user', content: userMessage };
    const recentHistory = conversation.slice(-5);
    setConversation(prev => [...prev, newUserEntry]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: recentHistory, mode: 'assistant' }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const aiResponseContent = data.reply || "I had a problem with that request.";

      // --- NEW: Check if the AI wants to navigate ---
      if (data.toolResult && data.toolResult.didNavigate) {
        // Add the AI's confirmation message first
        const aiEntry: ConversationEntry = { type: 'ai', content: aiResponseContent };
        setConversation(prev => [...prev, aiEntry]);
        // Then perform the navigation after a short delay
        setTimeout(() => navigate(data.toolResult.path), 1200);
      } else {
        const aiEntry: ConversationEntry = { type: 'ai', content: aiResponseContent };
        setConversation(prev => [...prev, aiEntry]);
      }

    } catch (error) {
      console.error("Error fetching AI response:", error);
      const errorEntry: ConversationEntry = { type: 'ai', content: "⟡ An error occurred. Please try again." };
      setConversation(prev => [...prev, errorEntry]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground text-center mb-2">AI Assistant</h1>
        <p className="text-muted-foreground text-center mb-6">Ask me to create a task, break down a project, or open another page.</p>

        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-2xl border border-appBorder overflow-hidden shadow-warm h-[70vh]">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <AnimatePresence>
                  {conversation.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-4 items-start ${entry.type === 'user' ? 'justify-end' : ''}`}
                    >
                      {entry.type === 'ai' && <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />}
                      <div className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                        entry.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                      }`}>
                        <p className="text-base whitespace-pre-wrap">{entry.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isProcessing && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center space-x-2 text-muted-foreground pl-10">
                      <span className="text-sm">Thinking...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-appBorder bg-background/80 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., 'What is on my schedule today?'"
                    className="flex-1 w-full bg-background/50 border-appBorder rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none text-foreground placeholder-muted-foreground"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isProcessing}
                    aria-label="Send message"
                    className="p-3 rounded-xl transition-all duration-200 bg-primary hover:bg-primary-hover text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AICompanion;
