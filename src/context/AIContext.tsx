import React, { createContext, useContext, useState } from 'react';
import { Task } from './TaskContext'; // Assuming Task type might be needed in the future

// Define the shape of a Flashcard
export interface Flashcard {
  question: string;
  answer: string;
}

// Define the functions our AI context will provide
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

  // A single, flexible function to get different kinds of responses from our AI
  const getAIResponse = async (prompt: string, content?: string): Promise<string | null> => {
    setIsProcessing(true);
    try {
      // We use our single API endpoint for these specific learning tasks
      const response = await fetch('/api/ask-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            // We create a very direct command for the AI to follow
            message: `${prompt}: "${content || ''}"`,
            // We use 'learning' mode to get a direct answer without tools
            mode: 'learning' 
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      return data.reply || "Sorry, I couldn't process that.";

    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      return "An error occurred while trying to connect.";
    } finally {
      setIsProcessing(false);
    }
  };
  
  // New function to generate flashcards from a topic
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

        // Clean the response to extract only the JSON part
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseText = jsonMatch[0];
        } else {
            // If no JSON is found, return null
            console.error("AI did not return valid JSON for flashcards", responseText);
            return null;
        }

        const data = JSON.parse(responseText);
        return data.flashcards || [];

    } catch (error) {
        console.error("Failed to generate flashcards:", error);
        return null;
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        isProcessing,
        getAIResponse,
        generateFlashcards,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};
