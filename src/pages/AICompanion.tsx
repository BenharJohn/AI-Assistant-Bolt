import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Mic, WifiOff, Download, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import VoiceAI from '../components/VoiceAI';
import { useOfflineLLM } from '../hooks/useOfflineLLM';

type ConversationEntry = { type: 'user' | 'ai'; content: string };

const AICompanion: React.FC = () => {
  const [conversation, setConversation] = useState<Array<ConversationEntry>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { reducedMotion } = useSettings();
  const offlineLLM = useOfflineLLM();

  useEffect(() => {
    const saved = localStorage.getItem('assistant-conversation-history');
    if (saved) {
      setConversation(JSON.parse(saved));
    } else {
      setConversation([{ type: 'ai', content: 'How can I help you be more productive today?' }]);
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
    e?.preventDefault();
    const userMessage = input.trim();
    if (!userMessage || isProcessing) return;

    const newUserEntry: ConversationEntry = { type: 'user', content: userMessage };
    const recentHistory = conversation.slice(-5);
    setConversation(prev => [...prev, newUserEntry]);
    setInput('');
    setIsProcessing(true);

    // Try Gemini API first
    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: recentHistory, mode: 'assistant' }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      // If server returned an offline fallback message, switch to local LLM instead
      const isOfflineReply = data.reply?.includes("trouble connecting") || data.reply?.includes("internet to work");

      if (isOfflineReply) {
        throw new Error('API offline');
      }

      setIsOffline(false);
      const aiResponseContent = data.reply || "I had a problem with that request.";

      if (data.toolResult && data.toolResult.didNavigate) {
        setConversation(prev => [...prev, { type: 'ai', content: aiResponseContent }]);
        setTimeout(() => navigate(data.toolResult.path), 1200);
      } else {
        setConversation(prev => [...prev, { type: 'ai', content: aiResponseContent }]);
      }

    } catch (error) {
      // Gemini unavailable — fall back to offline LLM
      setIsOffline(true);

      if (offlineLLM.status === 'idle' || offlineLLM.status === 'error') {
        // Model not loaded yet — load it now
        offlineLLM.load();
        setConversation(prev => [...prev, {
          type: 'ai',
          content: "I'm offline right now — downloading my local AI model (~500MB) so I can still help you. This only happens once! I'll respond as soon as it's ready.",
        }]);
        setIsProcessing(false);
        return;
      }

      if (offlineLLM.status === 'loading') {
        setConversation(prev => [...prev, {
          type: 'ai',
          content: `Still downloading the offline model... ${offlineLLM.progress}% complete. Hang tight!`,
        }]);
        setIsProcessing(false);
        return;
      }

      if (offlineLLM.status === 'ready') {
        try {
          // Add empty AI entry, then stream tokens into it
          setConversation(prev => [...prev, { type: 'ai', content: '' }]);
          await offlineLLM.generate(userMessage, recentHistory, 'assistant', (token) => {
            setConversation(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.type === 'ai') {
                updated[updated.length - 1] = { ...last, content: last.content + token };
              }
              return updated;
            });
          });
        } catch {
          setConversation(prev => [...prev, { type: 'ai', content: "Sorry, I had trouble generating a response. Please try again." }]);
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

  const handleLoadOfflineModel = () => {
    offlineLLM.load();
  };

  const offlineStatusText = () => {
    if (offlineLLM.status === 'loading') {
      return `Downloading offline model... ${offlineLLM.progress}%${offlineLLM.progressFile ? ` (${offlineLLM.progressFile.split('/').pop()})` : ''}`;
    }
    if (offlineLLM.status === 'ready') return 'Offline model ready';
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-foreground text-center mb-2">AI Assistant</h1>
      <p className="text-muted-foreground text-center mb-6">Ask me anything — I'll help you stay focused and productive.</p>

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-3xl mx-auto mb-4 flex items-center gap-3 bg-muted border border-appBorder rounded-xl px-4 py-3 text-sm text-foreground"
          >
            <WifiOff size={16} className="flex-shrink-0" />
            <span className="flex-1">
              {offlineStatusText() ?? 'Running offline. Responses come from a local AI model.'}
            </span>
            {offlineLLM.status === 'idle' && (
              <button
                onClick={handleLoadOfflineModel}
                className="flex items-center gap-1 bg-secondary/50 rounded-lg px-2 py-1 text-xs font-medium hover:bg-secondary transition-colors"
              >
                <Download size={12} />
                Load model
              </button>
            )}
            {offlineLLM.status === 'loading' && (
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${offlineLLM.progress}%` }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl border border-appBorder overflow-hidden shadow-soft h-[calc(100vh-13rem)] lg:h-[70vh]">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
              <AnimatePresence>
                {conversation.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.3 }}
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
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center space-x-2 text-muted-foreground pl-10">
                    <span className="text-sm">
                      {offlineLLM.status === 'generating' ? 'Thinking offline...' : 'Thinking...'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-appBorder bg-background/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  className="p-3 rounded-xl transition-all duration-200 bg-secondary hover:bg-secondary-hover text-secondary-foreground"
                  aria-label="Voice input"
                >
                  <Mic size={20} />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isOffline ? "Ask me anything (offline mode)..." : "e.g., 'What is on my schedule today?'"}
                  className="flex-1 w-full bg-background/50 border-appBorder rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/50 focus:outline-none text-foreground placeholder-muted-foreground"
                />
                {isProcessing || offlineLLM.status === 'generating' ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    aria-label="Stop generating"
                    className="p-3 rounded-xl transition-all duration-200 bg-primary hover:bg-primary-hover text-primary-foreground"
                  >
                    <Square size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || offlineLLM.status === 'loading'}
                    aria-label="Send message"
                    className="p-3 rounded-xl transition-all duration-200 bg-primary hover:bg-primary-hover text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                )}
              </form>

              <p className="text-xs text-muted-foreground text-center mt-2">
                {isOffline
                  ? offlineLLM.status === 'ready' ? '🔵 Running on local AI model' : '⏳ Loading offline model...'
                  : '💡 Try the voice button for natural conversation'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <VoiceAI
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        variant="floating"
      />
    </div>
  );
};

export default AICompanion;
