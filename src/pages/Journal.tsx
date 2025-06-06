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
    // For a real app, you'd integrate the SpeechRecognition API here
    if (!isListening) {
      // Simulate voice input after a delay
      setTimeout(() => {
        setInput("I'm feeling a bit overwhelmed with all my tasks today");
        setIsListening(false);
      }, 2000);
    }
  };

  // --- vvv THIS IS THE MAIN EDITED SECTION vvv ---
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userEntry = input.trim();
    // 1. Add user's message to the chat immediately for a responsive feel.
    setEntries(prev => [...prev, { type: 'user', content: userEntry }]);
    setInput('');
    setIsProcessing(true); // Show the "Reflecting..." indicator

    // 2. Call our secure serverless function.
    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userEntry }), // Send the user's message
      });

      if (!response.ok) {
        // If the server responds with an error (e.g., 500), we'll catch it here.
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      // 3. Use the AI's reply from the server, with a fallback message just in case.
      const aiResponse = data.reply || "I'm having trouble thinking right now. Let's try again in a moment.";

      // Add the real AI's response to the chat
      setEntries(prev => [...prev, { type: 'ai', content: aiResponse }]);

    } catch (error) {
      // 4. If anything goes wrong with the fetch call, show a friendly error.
      console.error("Failed to fetch AI response:", error);
      setEntries(prev => [...prev, { type: 'ai', content: "⟡ I'm sorry, I seem to be having a little trouble connecting right now." }]);
    } finally {
      // 5. No matter what happens (success or failure), stop showing "Reflecting...".
      setIsProcessing(false);
    }
  };
  // --- ^^^ END OF EDITED SECTION ^^^ ---


  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // The rest of the JSX remains the same as your themed version
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
                <button
                  type="button"
                  onClick={toggleListening}
                  aria-label={isListening ? "Stop listening" : "Start listening"}
                  className={`p-3 rounded-xl transition-colors duration-200 ${
                    isListening
                      ? 'bg-primary/80 text-primary-foreground'
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
