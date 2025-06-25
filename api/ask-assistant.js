// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Define all tools the Assistant can use ---
const assistantTools = [
  {
    functionDeclarations: [
      {
        name: "getTodaysTasks",
        description: "Gets the user's list of tasks that are not yet completed for today, to check their schedule.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "createProjectWithSubtasks",
        description: "Use for large, multi-step projects or goals. Examples: 'plan my vacation', 'write my history essay'.",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the main project." }, due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } }, required: ["title"] }
      },
      {
        name: "addTask",
        description: "Use for simple, single-step tasks or reminders. e.g., 'Call the dentist tomorrow', 'buy milk'",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the task." }, description: { type: "STRING", description: "Optional description." }, priority: { type: "STRING", description: "Priority can be 'low', 'medium', or 'high'.", enum: ["low", "medium", "high"] }, due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } }, required: ["title"] }
      },
      {
        name: "navigateTo",
        description: "Use to navigate the user to a page when they ask for a specific context. Examples: 'show me my journal', 'I want to learn something'.",
        parameters: { type: "OBJECT", properties: { path: { type: "STRING", description: "The path to navigate to. Must be one of: '/tasks', '/journal', '/focus', '/learning'." } }, required: ["path"] }
      },
      // --- vvv NEW TOOLS ADDED HERE vvv ---
      {
        name: "updateTask",
        description: "Modifies an existing task. Use this to add details, change priority, or mark a task as complete.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "The title of the task to find and update." },
            updates: { type: "OBJECT", description: "An object containing the fields to update, like { description: 'new details' } or { status: 'completed' }." }
          },
          required: ["title", "updates"]
        }
      },
      {
        name: "deleteTask",
        description: "Deletes a task from the user's list. Use when the user wants to remove or cancel a task.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "The title of the task to delete." }
          },
          required: ["title"]
        }
      }
      // --- ^^^ END OF NEW TOOLS ^^^ ---
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
      systemInstruction = "You are FocusAssist, a friendly and proactive AI assistant. Your primary function is to understand the user's intent and use tools to help them. If a user asks to do something with a task (add, create, update, delete, check schedule) or navigate the app, you MUST use a tool. Do not ask for clarifying details if a tool can be used. Today's date is " + new Date().toLocaleDateString('en-CA') + ".";
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

      // --- vvv UPDATED LOGIC TO HANDLE ALL TOOLS vvv ---
      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
      } else if (call.name === 'addTask') {
        const { error } = await supabase.from('tasks').insert([{ ...call.args, status: 'pending' }]);
        toolResult = error ? { success: false, error: error.message } : { success: true, result: `Task "${call.args.title}" was added.` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
      } else if (call.name === 'getTodaysTasks') {
        toolResult = await handleGetTodaysTasks(supabase);
      } else if (call.name === 'updateTask') {
        const { data } = await supabase.from('tasks').update(call.args.updates).eq('title', call.args.title).select().single();
        toolResult = data ? { success: true, result: "I've updated the task for you." } : { success: false, error: "I couldn't find that task to update." };
      } else if (call.name === 'deleteTask') {
        const { error } = await supabase.from('tasks').delete().eq('title', call.args.title);
        toolResult = error ? { success: false, error: "I couldn't find that task to delete." } : { success: true, result: "I've deleted the task." };
      } else {
        toolResult = { success: false, error: "Unknown tool requested." };
      }
      // --- ^^^ END OF UPDATED LOGIC ^^^ ---

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
