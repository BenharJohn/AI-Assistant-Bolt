import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Sunrise, Volume2 } from 'lucide-react';

type ConversationEntry = { type: 'user' | 'ai'; content: string };

const AICompanion: React.FC = () => {
  const [conversation, setConversation] = useState<Array<ConversationEntry>>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const audioPlayer = useRef<HTMLAudioElement | null>(null);

  const handleSubmit = async (e?: React.FormEvent, prompt?: string) => {
    if (e) e.preventDefault();
    const userMessage = prompt || input.trim();
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
      const aiEntry: ConversationEntry = { type: 'ai', content: aiResponseContent };
      setConversation(prev => [...prev, aiEntry]);
    } catch (error) {
      // ... error handling
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleGetBriefing = async () => {
      // Logic to test the morning briefing
      const res = await fetch('/api/get-morning-briefing');
      const data = await res.json();
      setConversation(prev => [...prev, {type: 'ai', content: data.briefing}]);
  };

  const handleTestTTS = async () => {
      // Logic to test ElevenLabs text-to-speech
      const res = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({text: "Hello! This is a test of the text to speech audio."})
      });
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioPlayer.current) {
          audioPlayer.current.src = audioUrl;
          audioPlayer.current.play();
      }
  };


  return (
    <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground text-center mb-2">AI Agent Workshop</h1>
        <p className="text-muted-foreground text-center mb-6">Use this page to test the AI's new abilities before building the final UI.</p>

        {/* --- Buttons for Testing New Features --- */}
        <div className="flex justify-center gap-4 mb-6">
            <button onClick={handleGetBriefing} className="btn-secondary flex items-center gap-2"><Sunrise size={16}/> Test Morning Briefing</button>
            <button onClick={handleTestTTS} className="btn-secondary flex items-center gap-2"><Volume2 size={16}/> Test Text-to-Speech</button>
        </div>
        
        {/* The rest of the chat UI remains the same */}
        <div className="max-w-3xl mx-auto">
             {/* ... existing chat UI from previous AICompanion.tsx version ... */}
        </div>
        <audio ref={audioPlayer} />
    </div>
  );
};

export default AICompanion;
