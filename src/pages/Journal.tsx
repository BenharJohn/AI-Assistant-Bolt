import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, Sparkles, Maximize2, Minimize2, MicOff, Loader } from 'lucide-react';
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
  
  // Voice AI integration
  const {
    isListening,
    isProcessing: isVoiceProcessing,
    isPlaying,
    error: voiceError,
    toggleListening,
    clearError,
    convertTextToSpeech,
    isActive: isVoiceActive
  } = useVoiceAI();

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

  // Handle voice input completion
  useEffect(() => {
    // This will be handled by the voice AI hook automatically
    // The hook handles transcription and sends to the appropriate API
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing || isVoiceActive) return;

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

      // Convert AI response to speech
      try {
        await convertTextToSpeech(aiResponseContent);
      } catch (speechError) {
        console.log('Speech synthesis failed, continuing without audio:', speechError);
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

  const getMicIcon = () => {
    if (isVoiceProcessing) return <Loader size={20} className="animate-spin" />;
    if (isPlaying) return <Volume2 size={20} />;
    if (isListening) return <MicOff size={20} />;
    return <Mic size={20} />;
  };

  const getMicButtonClass = () => {
    if (voiceError) return 'bg-red-500 text-white hover:bg-red-600';
    if (isListening) return 'bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse';
    if (isVoiceProcessing) return 'bg-secondary text-secondary-foreground';
    if (isPlaying) return 'bg-accent text-accent-foreground animate-pulse';
    return 'text-muted-foreground hover:bg-muted/60 hover:text-foreground';
  };

  const getVoiceStatusText = () => {
    if (voiceError) return 'Tap to retry';
    if (isListening) return 'Listening...';
    if (isVoiceProcessing) return 'Processing...';
    if (isPlaying) return 'Speaking...';
    return 'Tap to speak';
  };

  const handleVoiceClick = () => {
    if (voiceError) {
      clearError();
    }
    toggleListening();
  };

  // Handle replaying AI responses
  const handleReplayResponse = async (content: string) => {
    if (!isVoiceActive) {
      try {
        await convertTextToSpeech(content);
      } catch (error) {
        console.log('Speech synthesis failed:', error);
      }
    }
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
                    className={`max-w-[85%] group ${entry.type === 'user' ? 'ml-auto text-right' : ''}`}
                  >
                    <div
                      className={`inline-block text-left font-serif text-lg rounded-xl px-3 py-2 relative ${
                        entry.type === 'user'
                          ? 'bg-primary/10 text-foreground'
                          : 'text-muted-foreground pl-1'
                      }`}
                    >
                      {entry.content.startsWith('⟡') && <span className="text-primary mr-1.5">{entry.content[0]}</span>}
                      {entry.content.startsWith('⟡') ? entry.content.substring(1).trimStart() : entry.content}
                      
                      {/* Playback button for AI responses */}
                      {entry.type === 'ai' && (
                        <button
                          onClick={() => handleReplayResponse(entry.content)}
                          disabled={isVoiceActive}
                          className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full bg-primary/20 hover:bg-primary/30 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Play this response"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                {(isProcessing || isVoiceProcessing) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center space-x-2 text-muted-foreground pl-1"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                    <span className="text-sm font-serif">
                      {isVoiceProcessing ? 'Processing your voice...' : 'Reflecting...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-appBorder bg-background/80 backdrop-blur-sm">
              {/* Voice status indicator */}
              <AnimatePresence>
                {isVoiceActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 text-center"
                  >
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full text-sm text-primary">
                      {getMicIcon()}
                      <span>{getVoiceStatusText()}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Voice error display */}
              <AnimatePresence>
                {voiceError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 text-center"
                  >
                    <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-full text-sm text-red-600 dark:text-red-400">
                      <span>⚠️ {voiceError}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <motion.button
                  type="button"
                  onClick={handleVoiceClick}
                  disabled={isProcessing && !voiceError}
                  aria-label={getVoiceStatusText()}
                  className={`p-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${getMicButtonClass()}`}
                  whileHover={reducedMotion ? {} : { scale: 1.05 }}
                  whileTap={reducedMotion ? {} : { scale: 0.95 }}
                >
                  {getMicIcon()}
                </motion.button>
                
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isVoiceActive ? "Voice input active..." : "What's on your mind?"}
                    disabled={isVoiceActive}
                    className="w-full bg-transparent border-0 focus:ring-0 font-serif text-lg text-foreground placeholder-muted-foreground disabled:opacity-60"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing || isVoiceActive}
                  aria-label="Send message"
                  className={`p-3 rounded-xl transition-colors duration-200 ${
                    !input.trim() || isProcessing || isVoiceActive
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  <Sparkles size={20} />
                </button>
              </form>
              
              {/* Helpful hints */}
              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  💡 Hold the mic to speak naturally, or type your thoughts
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