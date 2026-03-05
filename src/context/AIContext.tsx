import React, { createContext, useContext, useState } from 'react';
import { useOfflineLLM } from '../hooks/useOfflineLLM';

export interface Flashcard {
  question: string;
  answer: string;
}

interface AIContextType {
  isProcessing: boolean;
  getAIResponse: (prompt: string, content?: string) => Promise<string | null>;
  generateFlashcards: (topic: string) => Promise<Flashcard[] | null>;
}

const AIContext = createContext<AIContextType | null>(null);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const offlineLLM = useOfflineLLM();

  // Try Gemini API first, fall back to offline LLM
  const getAIResponse = async (prompt: string, content?: string): Promise<string | null> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${prompt}: "${content || ''}"`,
          mode: 'learning'
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const reply = data.reply || '';

      // Detect offline fallback from server
      if (reply.includes("trouble connecting") || reply.includes("internet to work")) {
        throw new Error('API offline');
      }

      return reply;
    } catch {
      // Fall back to offline LLM
      if (offlineLLM.status === 'ready') {
        try {
          let result = '';
          await offlineLLM.generate(
            `${prompt}: "${content || ''}"`,
            [],
            'assistant',
            (token) => { result += token; }
          );
          return result || "I generated a response but it was empty. Please try again.";
        } catch {
          return "Sorry, the offline AI had trouble with that. Please try again.";
        }
      }
      if (offlineLLM.status === 'loading') {
        return "The offline AI model is still downloading. Please try again in a moment.";
      }
      return "I'm offline right now. The AI model is being prepared — try again shortly.";
    } finally {
      setIsProcessing(false);
    }
  };

  const generateFlashcards = async (topic: string): Promise<Flashcard[] | null> => {
    setIsProcessing(true);
    const prompt = `You are a study expert. Based on the topic "${topic}", generate 3-5 flashcards for studying. Each flashcard should have a "question" and a concise "answer". Respond ONLY with a valid JSON object in this exact format: {"flashcards": [{"question": "Question 1", "answer": "Answer 1"}, ...]}`;

    try {
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, mode: 'learning' }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      let responseText = (await response.json()).reply || '';

      if (responseText.includes("trouble connecting") || responseText.includes("internet to work")) {
        throw new Error('API offline');
      }

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseText = jsonMatch[0];
      } else {
        return null;
      }

      const data = JSON.parse(responseText);
      return data.flashcards || [];
    } catch {
      // Fall back to offline LLM for flashcards
      if (offlineLLM.status === 'ready') {
        try {
          let result = '';
          await offlineLLM.generate(prompt, [], 'assistant', (token) => { result += token; });
          const jsonMatch = result.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.flashcards || [];
          }
        } catch {
          // LLM couldn't produce valid JSON
        }
      }
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AIContext.Provider value={{ isProcessing, getAIResponse, generateFlashcards }}>
      {children}
    </AIContext.Provider>
  );
};
