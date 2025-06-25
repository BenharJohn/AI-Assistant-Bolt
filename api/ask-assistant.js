// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const assistantTools = [
  {
    functionDeclarations: [
      {
        name: "createProjectWithSubtasks",
        description: "Use for large, multi-step projects or goals that need to be broken down. Examples: 'plan my vacation', 'write my history essay'.",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the main project." }, due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } }, required: ["title"] }
      },
      // --- vvv THIS IS THE TOOL WE ARE UPGRADING vvv ---
      {
        name: "addTask",
        description: "Use for simple, single-step tasks or reminders. e.g., 'Call the dentist tomorrow', 'buy milk'",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            title: { type: "STRING", description: "The title of the task." }, 
            description: { type: "STRING", description: "Optional description." }, 
            priority: { type: "STRING", description: "Priority can be 'low', 'medium', or 'high'.", enum: ["low", "medium", "high"] },
            // --- NEW PARAMETER ---
            due_date: { type: "STRING", description: "An optional deadline for the task in YYYY-MM-DD format. The AI should infer this from phrases like 'tomorrow', 'next week', etc." }
          }, 
          required: ["title"] 
        }
      },
      // --- ^^^ END OF UPGRADE ^^^ ---
      {
        name: "navigateTo",
        description: "Use to navigate the user to a page when they ask for a specific context. Examples: 'show me my journal', 'I want to learn something'.",
        parameters: { type: "OBJECT", properties: { path: { type: "STRING", description: "The path to navigate to. Must be one of: '/tasks', '/journal', '/focus', '/learning'." } }, required: ["path"] }
      },
      {
        name: "getTodaysTasks",
        description: "Gets the user's list of tasks that are not yet completed for today, to check their schedule.",
        parameters: { type: "OBJECT", properties: {} }
      },
    ]
  }
];

// --- Helper functions for the tools ---
async function handleCreateProject(args, supabase, genAI) { /* ... same as before ... */ }
async function handleGetTodaysTasks(supabase) { /* ... same as before ... */ }

// --- Main handler function ---
export default async (req, context) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

  try {
    const { message: userInput, history, mode = 'journal' } = await req.json();
    if (!userInput) return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });

    const API_KEY = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!API_KEY || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let model;
    let systemInstruction = "";

    if (mode === 'assistant') {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools: assistantTools });
      systemInstruction = "You are FocusAssist, a proactive and efficient personal assistant. Today's date is " + new Date().toLocaleDateString('en-CA') + ". You MUST use the provided tools to fulfill user requests. Do not ask for clarifying details if the tool's required parameters are met. Directly use the tool.";
    } else { 
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      systemInstruction = "You are an empathetic, non-judgmental friend. Your goal is to listen and help the user explore their thoughts. Start your responses with the symbol: ⟡";
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

      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
      } else if (call.name === 'addTask') {
        // Now the addTask tool can handle due_date
        const { error } = await supabase.from('tasks').insert([{ 
          title: call.args.title,
          description: call.args.description || null,
          priority: call.args.priority || 'medium',
          due_date: call.args.due_date || null,
          status: 'pending' 
        }]);
        toolResult = error ? { success: false, error: error.message } : { success: true, result: `Task "${call.args.title}" was added.` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
      } else if (call.name === 'getTodaysTasks') {
        toolResult = await handleGetTodaysTasks(supabase);
      } else {
        toolResult = { success: false, error: "Unknown tool requested." };
      }

      const result2 = await chat.sendMessage([{ functionResponse: { name: call.name, response: { content: JSON.stringify(toolResult) } } }]);
      const finalResponseText = result2.response.text();
      
      return new Response(JSON.stringify({ reply: finalResponseText, toolResult: toolResult }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      const aiResponseText = response.text();
      return new Response(JSON.stringify({ reply: aiResponseText }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error("Critical error in function handler:", error);
    return new Response(JSON.stringify({ error: 'A critical error occurred.' }), { status: 500 });
  }
};

export const config = { path: "/api/ask-assistant" };
