import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

type ConversationEntry = {
  type: 'user' | 'ai';
  content: string;
};

const AICompanion: React.FC = () => {
  const [conversation, setConversation] = useState<Array<ConversationEntry>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- vvv THIS IS THE FIX FOR SAVING HISTORY vvv ---
  // Load conversation from localStorage when the component first loads
  useEffect(() => {
    const savedConversation = localStorage.getItem('assistant-conversation-history');
    if (savedConversation) {
      setConversation(JSON.parse(savedConversation));
    } else {
      // If nothing is saved, start with the default welcome message
      setConversation([{ type: 'ai', content: 'How can I help you be more productive today?' }]);
    }
  }, []); // The empty array ensures this runs only once

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    // We don't save the initial empty state
    if (conversation.length > 0) {
      localStorage.setItem('assistant-conversation-history', JSON.stringify(conversation));
    }
  }, [conversation]);
  // --- ^^^ END OF FIX ^^^ ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    const newUserEntry: ConversationEntry = { type: 'user', content: userMessage };
    
    // We use the current state as history, which now persists across reloads
    const recentHistory = conversation.slice(-5);

    setConversation(prev => [...prev, newUserEntry]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: recentHistory,
          mode: 'assistant'
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const aiResponseContent = data.reply || "I'm having a little trouble with that request.";
      const aiEntry: ConversationEntry = { type: 'ai', content: aiResponseContent };
      
      setConversation(prev => [...prev, aiEntry]);

    } catch (error) {
      console.error("Failed to fetch AI agent response:", error);
      const errorEntry: ConversationEntry = { type: 'ai', content: "⟡ An error occurred. Please try again." };
      setConversation(prev => [...prev, errorEntry]);
    } finally {
      setIsProcessing(false);
    }
  };

  // The rest of the JSX is unchanged...
  return (
    // ...
  );
};

export default AICompanion;
```
*(For brevity, I've truncated the unchanged JSX part