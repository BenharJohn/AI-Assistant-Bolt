// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Define all tools the Assistant can use ---
const assistantTools = [
  {
    functionDeclarations: [
      {
        name: "createProjectWithSubtasks",
        description: "Use for large, multi-step projects or goals that need to be broken down. Examples: 'plan my vacation', 'write my history essay'.",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the main project." }, due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } }, required: ["title"] }
      },
      {
        name: "addTask",
        description: "Use for simple, single-step tasks or reminders. e.g., 'Call the dentist', 'buy milk'",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the task." }, description: { type: "STRING", description: "Optional description." }, priority: { type: "STRING", description: "Priority: 'low', 'medium', or 'high'.", enum: ["low", "medium", "high"] } }, required: ["title"] }
      },
      {
        name: "navigateTo",
        description: "Use to navigate the user to a page when they ask to see something. Examples: 'show me my tasks', 'open my journal'.",
        parameters: { type: "OBJECT", properties: { path: { type: "STRING", description: "The path to navigate to. Must be one of: '/tasks', '/journal', '/focus', '/learning', '/settings'." } }, required: ["path"] }
      },
      {
        name: "saveFlashcards",
        description: "Saves a generated set of flashcards to the user's collection for later study.",
        parameters: {
            type: "OBJECT",
            properties: {
                topic: { type: "STRING", description: "The main topic of the flashcard set. e.g., 'The Cold War'" },
                cards: {
                    type: "ARRAY",
                    description: "An array of flashcard objects.",
                    items: {
                        type: "OBJECT",
                        properties: {
                            question: { type: "STRING", description: "The question on the front of the card." },
                            answer: { type: "STRING", description: "The answer on the back of the card." }
                        },
                        required: ["question", "answer"]
                    }
                }
            },
            required: ["topic", "cards"]
        }
      }
    ]
  }
];

// --- Helper function for the createProject tool ---
async function handleCreateProject(args, supabase, genAI) {
    // ... This function's logic remains the same
}

// --- NEW: Helper function for the saveFlashcards tool ---
async function handleSaveFlashcards(args, supabase) {
    try {
        const { topic, cards } = args;
        if (!topic || !cards || !Array.isArray(cards) || cards.length === 0) {
            return { success: false, error: "Invalid data provided for flashcards." };
        }

        const { data: setData, error: setError } = await supabase
            .from('flashcard_sets')
            .insert({ topic: topic })
            .select('id')
            .single();

        if (setError || !setData) throw setError;
        
        const setId = setData.id;
        const flashcardsToInsert = cards.map(card => ({
            question: card.question,
            answer: card.answer,
            set_id: setId
        }));

        const { error: cardsError } = await supabase.from('flashcards').insert(flashcardsToInsert);
        if (cardsError) throw cardsError;

        return { success: true, result: `I've saved the flashcard set about "${topic}" for you.` };
    } catch (e) {
        console.error("Error in handleSaveFlashcards:", e);
        return { success: false, error: "I had trouble saving the flashcards." };
    }
}


// --- Main handler function ---
export default async (req, context) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

  try {
    const { message: userInput, history, mode = 'journal' } = await req.json();
    if (!userInput) return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });

    const API_KEY = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // --- Logic for Direct Learning Tool Commands ---
    const isLearningToolCommand = userInput.startsWith('Explain the following concept:') || 
                                  userInput.startsWith('Summarize the following text:') || 
                                  userInput.startsWith('You are a study expert.');

    if (isLearningToolCommand) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(userInput);
        const aiResponseText = result.response.text();
        return new Response(JSON.stringify({ reply: aiResponseText }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    // --- Main Conversational/Agent Logic ---
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let model;
    let systemInstruction = "";

    if (mode === 'assistant') {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools: assistantTools });
      systemInstruction = "You are FocusAssist, a proactive and efficient personal assistant. You MUST use the provided tools to fulfill user requests...";
    } else { 
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      systemInstruction = "You are an empathetic, non-judgmental friend...";
    }
    
    const firstUserIndex = (history || []).findIndex(entry => entry.type === 'user');
    const validHistory = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);
    const conversationHistory = validHistory.map(entry => ({ role: entry.type === 'user' ? 'user' : 'model', parts: [{ text: entry.content }] }));
    
    const chat = model.startChat({ history: conversationHistory, systemInstruction: { role: "system", parts: [{text: systemInstruction}]} });
    const result = await chat.sendMessage(userInput);
    const response = result.response;
    
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let toolResult;

      // Clean `if/else if` chain to handle all possible tools
      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
        const result2 = await chat.sendMessage([{ functionResponse: { name: call.name, response: { content: JSON.stringify(toolResult) } } }]);
        const finalResponseText = result2.response.text();
        return new Response(JSON.stringify({ reply: finalResponseText, toolResult: toolResult }), { status: 200 });
      } else if (call.name === 'addTask') {
        const { error } = await supabase.from('tasks').insert([{ ...call.args, status: 'pending' }]);
        toolResult = error ? { success: false, error: error.message } : { success: true, result: `Task "${call.args.title}" was added.` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
      } else if (call.name === 'saveFlashcards') {
        toolResult = await handleSaveFlashcards(call.args, supabase);
      } else {
        toolResult = { success: false, error: "Unknown tool requested." };
      }

      const result2 = await chat.sendMessage([{ functionResponse: { name: call.name, response: toolResult } }]);
      const finalResponse = result2.response.text();
      return new Response(JSON.stringify({ reply: finalResponse }), { status: 200 });

    } else {
      const aiResponseText = response.text();
      return new Response(JSON.stringify({ reply: aiResponseText }), { status: 200 });
    }

  } catch (error) {
    console.error("Critical error in function handler:", error);
    return new Response(JSON.stringify({ error: 'A critical error occurred.' }), { status: 500 });
  }
};

export const config = { path: "/api/ask-assistant" };
