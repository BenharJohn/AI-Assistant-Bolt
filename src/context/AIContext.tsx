import React, { createContext, useContext, useState } from 'react';
import { Task } from './TaskContext';

interface AIContextType {
  isProcessing: boolean;
  processUserInput: (input: string) => Promise<AIResponse>;
  generateTaskBreakdown: (taskDescription: string) => Promise<string[]>;
  analyzePriority: (taskDescription: string, existingTasks: Task[]) => Promise<'low' | 'medium' | 'high'>;
  summarizeContent: (content: string) => Promise<string>;
  explainConcept: (concept: string) => Promise<string>;
}

interface AIResponse {
  type: 'task' | 'explanation' | 'summary' | 'steps' | 'general';
  content: any;
  message: string;
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

  // This is a mock implementation - in a real app, this would connect to an AI service
  const processUserInput = async (input: string): Promise<AIResponse> => {
    setIsProcessing(true);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple keyword-based logic for demo purposes
      if (input.toLowerCase().includes('essay') || input.toLowerCase().includes('assignment')) {
        const steps = await generateTaskBreakdown(input);
        return {
          type: 'task',
          content: {
            title: `Task: ${input.slice(0, 30)}...`,
            steps,
            suggestedPriority: 'high',
            estimatedTime: '3 hours'
          },
          message: 'I\'ve broken down your task into manageable steps.'
        };
      } else if (input.toLowerCase().includes('explain') || input.toLowerCase().includes('what is')) {
        const explanation = await explainConcept(input);
        return {
          type: 'explanation',
          content: explanation,
          message: 'Here\'s an explanation of that concept.'
        };
      } else if (input.toLowerCase().includes('summarize')) {
        return {
          type: 'summary',
          content: 'This is a summary of the content you provided...',
          message: 'I\'ve summarized that for you.'
        };
      } else {
        return {
          type: 'general',
          content: 'I\'m not sure how to help with that specific request yet.',
          message: 'Could you try rephrasing or ask for a task breakdown, explanation, or summary?'
        };
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateTaskBreakdown = async (taskDescription: string): Promise<string[]> => {
    // Mock task breakdown logic
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (taskDescription.toLowerCase().includes('essay')) {
      return [
        'Understand the essay prompt',
        'Research relevant sources',
        'Create an outline',
        'Write introduction',
        'Develop body paragraphs',
        'Draft conclusion',
        'Edit for clarity and flow',
        'Proofread for grammar and spelling',
        'Format according to style guidelines',
        'Submit final draft'
      ];
    } else if (taskDescription.toLowerCase().includes('presentation')) {
      return [
        'Define presentation topic and goal',
        'Research key points',
        'Create slide outline',
        'Design visual elements',
        'Write presenter notes',
        'Practice delivery',
        'Get feedback',
        'Revise presentation',
        'Prepare handouts if needed',
        'Deliver final presentation'
      ];
    } else {
      return [
        'Define the scope of the task',
        'Break down into smaller components',
        'Prioritize components',
        'Set deadlines for each component',
        'Gather necessary resources',
        'Complete highest priority items first',
        'Review progress regularly',
        'Adjust plan as needed',
        'Finalize the task',
        'Review and reflect'
      ];
    }
  };

  const analyzePriority = async (
    taskDescription: string, 
    existingTasks: Task[]
  ): Promise<'low' | 'medium' | 'high'> => {
    // Mock priority analysis
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lowerDesc = taskDescription.toLowerCase();
    
    if (
      lowerDesc.includes('urgent') || 
      lowerDesc.includes('tomorrow') || 
      lowerDesc.includes('asap') ||
      lowerDesc.includes('test') ||
      lowerDesc.includes('exam')
    ) {
      return 'high';
    } else if (
      lowerDesc.includes('next week') || 
      lowerDesc.includes('important') ||
      lowerDesc.includes('project')
    ) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  const summarizeContent = async (content: string): Promise<string> => {
    // Mock content summarization
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    return `This is a summarized version of: "${content.slice(0, 30)}..."
    
Key points:
1. First important concept
2. Second important concept
3. Third important concept

The main idea is to understand the relationship between these concepts and how they apply to the broader context.`;
  };

  const explainConcept = async (concept: string): Promise<string> => {
    // Mock concept explanation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (concept.toLowerCase().includes('adhd')) {
      return `ADHD (Attention-Deficit/Hyperactivity Disorder) is a neurodevelopmental condition that affects both children and adults.

Key characteristics:
- Difficulty maintaining attention and focus
- Hyperactivity (excessive movement that is not fitting to the setting)
- Impulsivity (hasty actions without thinking)

ADHD brains process information differently, often with strengths in creativity, hyperfocus on interests, and thinking outside the box.

Management typically includes a combination of medication, behavioral therapy, organizational strategies, and lifestyle adjustments.`;
    } else if (concept.toLowerCase().includes('dyslexia')) {
      return `Dyslexia is a learning disorder characterized by difficulty reading due to problems identifying speech sounds and learning how they relate to letters and words.

Key characteristics:
- Difficulty with phonological processing (manipulating sounds)
- Challenges with decoding words and reading fluency
- Often affects spelling and writing
- NOT related to intelligence

People with dyslexia often have strong visual, creative and problem-solving abilities.

Accommodations often include specialized reading instruction, extra time for reading tasks, text-to-speech technology, and alternative formats for information.`;
    } else {
      return `I don't have specific information about "${concept}" yet, but I can help you break this down into a research task if you'd like to learn more about it.`;
    }
  };

  return (
    <AIContext.Provider
      value={{
        isProcessing,
        processUserInput,
        generateTaskBreakdown,
        analyzePriority,
        summarizeContent,
        explainConcept
      }}
    >
      {children}
    </AIContext.Provider>
  );
};