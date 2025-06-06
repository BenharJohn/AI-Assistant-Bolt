import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Volume2, VolumeX, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Journal: React.FC = () => {
  const [entries, setEntries] = useState<Array<{ type: 'user' | 'ai'; content: string }>>([
    { type: 'ai', content: '⟡ Welcome to your safe space. How are you feeling today?' }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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
  }, [entries, reducedMotion]);

  const toggleListening = () => {
    setIsListening(!isListening);
    // For a real app, you'd integrate SpeechRecognition API here
    if (!isListening) {
      // Simulate voice input after a delay
      setTimeout(() => {
        setInput("I'm feeling a bit overwhelmed with all my tasks today");
        setIsListening(false);
      }, 2000);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userEntry = input.trim();
    setEntries(prev => [...prev, { type: 'user', content: userEntry }]);
    setInput('');
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "⟡ I hear that you're feeling overwhelmed. Let's break this down together. What's the most pressing task on your mind?",
        "⟡ It's perfectly normal to feel this way. Would you like to try a quick breathing exercise to help center yourself?",
        "⟡ I'm here to listen. Could you tell me more about what's contributing to these feelings?",
      ];
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      setEntries(prev => [...prev, { type: 'ai', content: randomResponse }]);
      setIsProcessing(false);
    }, 1500);
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
            ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[600px]'}`} // Using themed shadow
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
                      className={`inline-block text-left font-serif text-lg rounded-xl px-3 py-2 ${ // Added some padding and rounding to entries
                        entry.type === 'user'
                          ? 'bg-primary/10 text-foreground' // User entries with a light primary tint
                          : 'text-muted-foreground pl-1' // AI entries are more muted, adjusted padding
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
                    className="flex items-center space-x-2 text-muted-foreground pl-1" // Adjusted padding
                  >
                    <Sparkles className="w-4 h-4 animate-pulse text-primary" /> {/* Themed Sparkle */}
                    <span className="text-sm font-serif">Reflecting...</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-appBorder bg-background/80 backdrop-blur-sm"> {/* Themed border and bg */}
              <form onSubmit={handleSubmit} className="flex items-end space-x-3">
                <button
                  type="button"
                  onClick={toggleListening}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
                  className={`p-3 rounded-xl transition-colors duration-200 ${
                    isListening
                      ? 'bg-primary/80 text-primary-foreground' // Themed active listening state
                      : 'text-muted-foreground hover:bg-muted/60'
                  }`}
                >
                  {isListening ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent border-0 focus:ring-0 font-serif text-lg text-foreground placeholder-muted-foreground" // Themed text and placeholder
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isProcessing}
                  aria-label="Send message"
                  className={`p-3 rounded-xl transition-colors duration-200 ${
                    !input.trim() || isProcessing
                      ? 'text-muted-foreground/50 cursor-not-allowed' // More muted for disabled
                      : 'text-primary hover:bg-primary/10' // Themed enabled state
                  }`}
                >
                  <Mic size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;
