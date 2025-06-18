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
        parameters: { type: "OBJECT", properties: {} } // No parameters needed
      },
      {
        name: "createProjectWithSubtasks",
        description: "Use for large, multi-step projects or goals. Examples: 'plan my vacation', 'write my history essay'.",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the main project." }, due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } }, required: ["title"] }
      },
      {
        name: "addTask",
        description: "Use for simple, single-step tasks or reminders. e.g., 'Call the dentist', 'buy milk'",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the task." }, description: { type: "STRING", description: "Optional description." }, priority: { type: "STRING", description: "Priority: 'low', 'medium', or 'high'.", enum: ["low", "medium", "high"] } }, required: ["title"] }
      },
      {
        name: "navigateTo",
        description: "Use to navigate the user to a page when they ask for a specific context. Examples: 'show me my journal', 'I want to learn something'.",
        parameters: { type: "OBJECT", properties: { path: { type: "STRING", description: "The path to navigate to. Must be one of: '/tasks', '/journal', '/focus', '/learning'." } }, required: ["path"] }
      }
    ]
  }
];

// --- Helper function for the createProject tool ---
async function handleCreateProject(args, supabase, genAI) { /* ... same as before ... */ }

// --- NEW: Helper function for the getTodaysTasks tool ---
async function handleGetTodaysTasks(supabase) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('title, priority')
      .neq('status', 'completed')
      .order('priority', { ascending: false });

    if (error) {
      console.error("Error fetching tasks for schedule:", error);
      return { success: false, error: "I couldn't access your task list." };
    }
    if (!tasks || tasks.length === 0) {
      return { success: true, schedule: "You have no pending tasks today. A fresh start!" };
    }
    const taskList = tasks.map(t => `- ${t.title} (${t.priority})`).join('\n');
    return { success: true, schedule: `Here are your top tasks for today:\n${taskList}` };
  } catch(e) {
    console.error("Error in handleGetTodaysTasks:", e);
    return { success: false, error: "I had trouble fetching your schedule." };
  }
}

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
      // --- Improved System Instruction for the Assistant ---
      systemInstruction = "You are FocusAssist, a friendly and proactive AI assistant. Your primary function is to understand the user's intent and use tools to help them. If a user asks about their schedule or 'what's next', you MUST call the `getTodaysTasks` tool. If they ask to create a task or project, you MUST use the `addTask` or `createProjectWithSubtasks` tools. If they ask to go to a different part of the app, you MUST use the `navigateTo` tool. Do not ask for clarifying details if a tool can be used.";
    } else { 
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      systemInstruction = "You are an empathetic, non-judgmental friend. Your goal is to listen, ask insightful follow-up questions, and help the user explore their thoughts. Start your responses with the symbol: ⟡";
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

      // Handle all the different tools the AI can now use
      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
      } else if (call.name === 'addTask') {
        const { error } = await supabase.from('tasks').insert([{ ...call.args, status: 'pending' }]);
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
