import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Maximize2, Minimize2, Send, WifiOff, Square } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useOfflineLLM } from '../hooks/useOfflineLLM';

type JournalEntry = {
  type: 'user' | 'ai';
  content: string;
};

const STORAGE_KEY = 'aeva_journal_entries';

const loadJournalFromStorage = (): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveJournalToStorage = (entries: JournalEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.error('Failed to save journal entries');
  }
};

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<Array<JournalEntry>>([]);
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useSettings();
  const offlineLLM = useOfflineLLM();

  // Load entries from localStorage
  useEffect(() => {
    const saved = loadJournalFromStorage();
    if (saved.length > 0) {
      setEntries(saved);
    } else {
      setEntries([{ type: 'ai', content: '⟡ Welcome to your safe space. How are you feeling today?' }]);
    }
  }, []);

  // Save entries when they change
  useEffect(() => {
    if (entries.length > 0) {
      saveJournalToStorage(entries);
    }
  }, [entries]);

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

    // Try Gemini API first
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
      const isOfflineReply = data.reply?.includes("trouble connecting") || data.reply?.includes("internet to work");

      if (isOfflineReply) {
        throw new Error('API offline');
      }

      setIsOffline(false);
      const aiResponseContent = data.reply || "⟡ I'm having trouble thinking right now.";
      setEntries(prev => [...prev, { type: 'ai', content: aiResponseContent }]);

    } catch (error) {
      // Gemini unavailable — fall back to offline LLM
      setIsOffline(true);

      if (offlineLLM.status === 'idle' || offlineLLM.status === 'error') {
        offlineLLM.load();
        setEntries(prev => [...prev, {
          type: 'ai',
          content: "⟡ I'm switching to offline mode — downloading my local AI so we can keep journaling. This only happens once!",
        }]);
        setIsProcessing(false);
        return;
      }

      if (offlineLLM.status === 'loading') {
        setEntries(prev => [...prev, {
          type: 'ai',
          content: `⟡ Still loading the offline model... ${offlineLLM.progress}% done. I'll be with you shortly.`,
        }]);
        setIsProcessing(false);
        return;
      }

      if (offlineLLM.status === 'ready') {
        try {
          // Stream tokens into an empty AI entry
          setEntries(prev => [...prev, { type: 'ai', content: '' }]);
          await offlineLLM.generate(userEntryContent, recentHistory, 'journal', (token) => {
            setEntries(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.type === 'ai') {
                updated[updated.length - 1] = { ...last, content: last.content + token };
              }
              return updated;
            });
          });
        } catch {
          setEntries(prev => [...prev, { type: 'ai', content: "⟡ I had trouble responding. Let's try again." }]);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    offlineLLM.stop();
    setIsProcessing(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`container mx-auto px-4 py-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-serif text-foreground">Reflective Journal</h1>
          <div className="flex items-center gap-2">
            {isOffline && (
              <span className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400">
                <WifiOff size={12} />
                Offline
              </span>
            )}
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors duration-200"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
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
                    <span className="text-sm font-serif">
                      {offlineLLM.status === 'generating' ? 'Reflecting offline...' : 'Reflecting...'}
                    </span>
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
                {isProcessing || offlineLLM.status === 'generating' ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label="Stop generating"
                    className="p-3 rounded-xl transition-colors duration-200 text-red-500 hover:bg-red-500/10"
                  >
                    <Square size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || offlineLLM.status === 'loading'}
                    aria-label="Send message"
                    className={`p-3 rounded-xl transition-colors duration-200 ${
                      !input.trim()
                        ? 'text-muted-foreground/50 cursor-not-allowed'
                        : 'text-primary hover:bg-primary/10'
                    }`}
                  >
                    <Send size={20} />
                  </button>
                )}
              </form>

              <div className="text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  {isOffline && offlineLLM.status === 'ready'
                    ? '🔵 Journaling with local AI'
                    : '💭 Share your thoughts and feelings in this safe space'}
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
