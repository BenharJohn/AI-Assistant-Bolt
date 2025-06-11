// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const tools = [
  {
    functionDeclarations: [
      {
        name: "createProjectWithSubtasks",
        description: "Use for large, multi-step projects or goals that need to be broken down. Examples: 'plan my vacation', 'write my history essay', 'learn a new skill'. Do NOT use for simple, one-step tasks.",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the main project. e.g., 'Complete history essay'" }, due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } }, required: ["title"] }
      },
      {
        name: "addTask",
        description: "Use for simple, single-step tasks or reminders. e.g., 'Call the dentist', 'buy milk'",
        parameters: { type: "OBJECT", properties: { title: { type: "STRING", description: "The title of the task." }, description: { type: "STRING", description: "Optional description." }, priority: { type: "STRING", description: "Priority can be 'low', 'medium', or 'high'. Defaults to 'medium'.", enum: ["low", "medium", "high"] } }, required: ["title"] }
      }
    ]
  }
];

async function handleCreateProject(args, supabase, genAI) {
  const { data: parentTaskData, error: parentError } = await supabase.from('tasks').insert({ title: args.title, due_date: args.due_date || null, status: 'pending', priority: 'high' }).select('id').single();
  if (parentError) { console.error("Error creating parent task:", parentError); return { success: false, error: "Failed to create the main project task." }; }
  
  const parentId = parentTaskData.id;
  const decompositionPrompt = `You are a project manager. Break down the project "${args.title}" into a list of 3-5 logical subtasks. The final project deadline is ${args.due_date || 'not set'}. If a date is provided, distribute the subtask due dates realistically between today (${new Date().toISOString().split('T')[0]}) and the final deadline. Respond ONLY with a valid JSON object in this exact format: {"subtasks": [{"title": "Subtask Title", "description": "A brief description", "due_date": "YYYY-MM-DD"}]}`;
  
  const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
  const result = await proModel.generateContent(decompositionPrompt);
  const responseText = result.response.text();
  
  try {
    const { subtasks } = JSON.parse(responseText.trim());
    const subtasksToInsert = subtasks.map(subtask => ({ title: subtask.title, description: subtask.description || '', due_date: subtask.due_date || null, parent_task_id: parentId, status: 'pending', priority: 'medium' }));
    const { error: subtaskError } = await supabase.from('tasks').insert(subtasksToInsert);
    if (subtaskError) throw subtaskError;
    
    return { success: true, result: `I have created the project "${args.title}" and broken it down into ${subtasks.length} sub-tasks for you.` };
  } catch (e) {
    console.error("Error parsing AI response for subtasks:", e, "Response was:", responseText);
    return { success: false, error: "I created the main project, but had trouble with the sub-tasks." };
  }
}

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
      systemInstruction = "You are FocusAssist, a proactive and efficient personal assistant...";
    } else { 
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      systemInstruction = "You are an empathetic, non-judgmental friend...";
    }

    // --- vvv THIS IS THE FIX vvv ---
    // Ensure the history always starts with a 'user' message, as required by the API.
    const firstUserIndex = (history || []).findIndex(entry => entry.type === 'user');
    const validHistory = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);
    // --- ^^^ END OF FIX ^^^ ---

    const conversationHistory = validHistory.map(entry => ({
        role: entry.type === 'user' ? 'user' : 'model',
        parts: [{ text: entry.content }]
    }));
    
    const chat = model.startChat({ history: conversationHistory, systemInstruction: { role: "system", parts: [{text: systemInstruction}]} });
    const result = await chat.sendMessage(userInput);
    const response = result.response;
    
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let toolResult;

      if (call.name === 'addTask') {
        const { error } = await supabase.from('tasks').insert([{ ...call.args, status: 'pending' }]);
        toolResult = error ? { success: false, error: error.message } : { success: true, result: `Task "${call.args.title}" was added.` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
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
    console.error("Critical error in function handler:", error.message, error.stack);
    return new Response(JSON.stringify({ error: 'A critical error occurred.' }), { status: 500 });
  }
};

export const config = { path: "/api/ask-assistant" };
 