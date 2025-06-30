import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useVoiceAI } from '../hooks/useVoiceAI';
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
  
  // Use the real voice AI hook
  const {
    isListening,
    isProcessing: voiceProcessing,
    isPlaying,
    error: voiceError,
    toggleListening,
    clearError,
    isActive: voiceActive
  } = useVoiceAI();

  // Fetch entries on load
  useEffect(() => {
    const fetchEntries = async () => {
      // Fetch all entries from the 'journal_entries' table, ordered by creation time
      const { data, error } = await supabase
        .from('journal_entries')
        .select('role, content')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching journal entries:', error);
        // If fetching fails, still provide the welcome message.
        setEntries([{ type: 'ai', content: '⟡ Welcome! I couldn\'t load our past conversation, but we can start fresh.' }]);
      } else if (data && data.length > 0) {
        // We need to cast the role to fit our JournalEntry type
        const formattedEntries = data.map(entry => ({
          type: entry.role as 'user' | 'ai',
          content: entry.content
        }));
        setEntries(formattedEntries);
      } else {
        // If there are no entries in the database, add the initial welcome message
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

    // Get the last 5 entries from the current state to send as history
    const recentHistory = entries.slice(-5);

    // Optimistically update UI
    setEntries(prev => [...prev, userEntry]);
    setInput('');
    setIsProcessing(true);

    try {
      // Send both the new message AND the recent history
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

  // Get the appropriate mic button state and styling
  const getMicButtonState = () => {
    if (voiceError) return { icon: Mic, className: 'text-red-500 hover:bg-red-50', disabled: false };
    if (voiceProcessing || isProcessing) return { icon: Sparkles, className: 'text-primary animate-pulse', disabled: true };
    if (isListening) return { icon: VolumeX, className: 'bg-primary/80 text-primary-foreground', disabled: false };
    if (isPlaying) return { icon: Volume2, className: 'bg-secondary/80 text-secondary-foreground animate-pulse', disabled: true };
    return { icon: Mic, className: 'text-muted-foreground hover:bg-muted/60', disabled: false };
  };

  const micState = getMicButtonState();
  const MicIcon = micState.icon;

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
                {(isProcessing || voiceProcessing) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2 text-muted-foreground pl-1"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                    <span className="text-sm font-serif">
                      {voiceProcessing ? 'Processing your voice...' : 'Reflecting...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-appBorder bg-background/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    if (voiceError) {
                      clearError();
                    }
                    toggleListening();
                  }}
                  disabled={micState.disabled}
                  aria-label={
                    voiceError ? "Clear error and try again" :
                    isListening ? "Stop listening" : 
                    isPlaying ? "AI is speaking" :
                    "Start voice input"
                  }
                  className={`p-3 rounded-xl transition-colors duration-200 disabled:cursor-not-allowed ${micState.className}`}
                  title={
                    voiceError ? `Error: ${voiceError}` :
                    isListening ? "Listening to your voice..." :
                    isPlaying ? "AI is speaking..." :
                    voiceProcessing ? "Processing your voice..." :
                    "Click to start voice input"
                  }
                >
                  <MicIcon size={20} />
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      isListening ? "Listening..." :
                      voiceProcessing ? "Processing voice..." :
                      isPlaying ? "AI is responding..." :
                      "What's on your mind?"
                    }
                    disabled={isListening || voiceProcessing || isPlaying}
                    className="w-full bg-transparent border-0 focus:ring-0 font-serif text-lg text-foreground placeholder-muted-foreground disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing || voiceProcessing || isListening || isPlaying}
                  aria-label="Send message"
                  className={`p-3 rounded-xl transition-colors duration-200 ${
                    !input.trim() || isProcessing || voiceProcessing || isListening || isPlaying
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  <Mic size={20} />
                </button>
              </form>
              
              {/* Voice status indicator */}
              {(voiceActive || voiceError) && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    {voiceError ? (
                      <span className="text-red-500">Voice error: {voiceError}</span>
                    ) : isListening ? (
                      <span className="text-primary">🎤 Listening... Speak into your microphone</span>
                    ) : voiceProcessing ? (
                      <span className="text-primary">🤔 Processing your voice...</span>
                    ) : isPlaying ? (
                      <span className="text-secondary">🔊 AI is responding...</span>
                    ) : null}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;