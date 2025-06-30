import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Maximize2, Minimize2, Send } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../supabaseClient';

// Define the type for our journal entries for clarity
type JournalEntry = {
  type: 'user' | 'ai';
  content: string;
};

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<Array<JournalEntry>>([]); // Start with an empty array
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useSettings();

  // Fetch entries on load
  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('role, content')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching journal entries:', error);
        setEntries([{ type: 'ai', content: '⟡ Welcome! I couldn\'t load our past conversation, but we can start fresh.' }]);
      } else if (data && data.length > 0) {
        const formattedEntries = data.map(entry => ({
          type: entry.role as 'user' | 'ai',
          content: entry.content
        }));
        setEntries(formattedEntries);
      } else {
        setEntries([{ type: 'ai', content: '⟡ Welcome to your safe space. How are you feeling today?' }]);
      }
    };

    fetchEntries();
  }, []);

  // Scroll to bottom effect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entries, reducedMotion]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userEntryContent = input.trim();
    const userEntry: JournalEntry = { type: 'user', content: userEntryContent };

    const recentHistory = entries.slice(-5);

    setEntries(prev => [...prev, userEntry]);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userEntryContent,
          history: recentHistory,
          mode: 'journal'
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      const aiResponseContent = data.reply || "I'm having trouble thinking right now.";
      const aiEntry: JournalEntry = { type: 'ai', content: aiResponseContent };
      
      setEntries(prev => [...prev, aiEntry]);

      // Save to Supabase
      const { error: insertError } = await supabase.from('journal_entries').insert([
        { role: 'user', content: userEntryContent },
        { role: 'ai', content: aiResponseContent }
      ]);

      if (insertError) {
        console.error('Error saving entries to Supabase:', insertError);
      }

    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      const errorEntry: JournalEntry = { type: 'ai', content: "⟡ I'm sorry, I'm having a little trouble connecting." };
      setEntries(prev => [...prev, errorEntry]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`container mx-auto px-4 py-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-serif text-foreground">Reflective Journal</h1>
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>

        <div
          className={`bg-card rounded-2xl border border-appBorder overflow-hidden shadow-warm
            ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reducedMotion ? 0 : -20 }}
                    transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
                    className={`max-w-[85%] ${entry.type === 'user' ? 'ml-auto text-right' : ''}`}
                  >
                    <div
                      className={`inline-block text-left font-serif text-lg rounded-xl px-3 py-2 ${
                        entry.type === 'user'
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground pl-1'
                      }`}
                    >
                      {entry.content.startsWith('⟡') && <span className="text-primary mr-1.5">{entry.content[0]}</span>}
                      {entry.content.startsWith('⟡') ? entry.content.substring(1).trimStart() : entry.content}
                    </div>
                  </motion.div>
                ))}
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2 text-muted-foreground pl-1"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                    <span className="text-sm font-serif">Reflecting...</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-appBorder bg-background/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent border-0 focus:ring-0 font-serif text-lg text-foreground placeholder-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  aria-label="Send message"
                  className={`p-3 rounded-xl transition-colors duration-200 ${
                    !input.trim() || isProcessing
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  <Send size={20} />
                </button>
              </form>
              
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  💭 Share your thoughts and feelings in this safe space
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;