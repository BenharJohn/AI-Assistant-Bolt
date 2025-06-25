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
      {
        name: "navigateTo",
        description: "Use to navigate the user to a different page when they ask for a specific context. Examples: 'show me my journal', 'I want to learn something', 'open focus mode'.",
        parameters: { type: "OBJECT", properties: { path: { type: "STRING", description: "The path to navigate to. Must be one of: '/tasks', '/journal', '/focus', '/learning'." } }, required: ["path"] }
      }
    ]
  }
];

// --- Helper functions for the tools ---
async function handleCreateProject(args, supabase, genAI) {
  try {
    const { data: parentTaskData, error: parentError } = await supabase.from('tasks').insert({ title: args.title, due_date: args.due_date || null, status: 'pending', priority: 'high' }).select('id').single();
    if (parentError) throw parentError;
    const parentId = parentTaskData.id;
    const decompositionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const decompositionPrompt = `You are a project manager. Break down the project "${args.title}" into 3-5 logical subtasks. The final deadline is ${args.due_date || 'not set'}. If a date is provided, distribute subtask due dates realistically between today (${new Date().toISOString().split('T')[0]}) and the deadline. Respond ONLY with a valid JSON object in this format: {"subtasks": [{"title": "Subtask Title", "description": "A brief description", "due_date": "YYYY-MM-DD"}]}`;
    const result = await decompositionModel.generateContent(decompositionPrompt);
    let responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON for subtasks.");
    responseText = jsonMatch[0];
    const { subtasks } = JSON.parse(responseText);
    const subtasksToInsert = subtasks.map(subtask => ({ title: subtask.title, description: subtask.description || '', due_date: subtask.due_date || null, parent_task_id: parentId, status: 'pending', priority: 'medium' }));
    const { error: subtaskError } = await supabase.from('tasks').insert(subtasksToInsert);
    if (subtaskError) throw subtaskError;
    return { success: true, result: `I created the project "${args.title}" and broke it down into ${subtasks.length} sub-tasks for you.` };
  } catch (e) {
    console.error("Error in handleCreateProject:", e);
    return { success: false, error: "I had trouble breaking down the project into sub-tasks." };
  }
}

async function handleGetTodaysTasks(supabase) {
  try {
    const { data: tasks, error } = await supabase.from('tasks').select('title, priority').neq('status', 'completed').order('priority', { ascending: false });
    if (error) { console.error("Error fetching tasks for schedule:", error); return { success: false, error: "I couldn't access your task list." }; }
    if (!tasks || tasks.length === 0) { return { success: true, schedule: "You have no pending tasks today. A fresh start!" }; }
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

    // --- DYNAMIC BEHAVIOR BASED ON MODE ---
    if (mode === 'assistant') {
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools: assistantTools });
      systemInstruction = "You are FocusAssist, a friendly and proactive AI assistant. Your primary function is to understand the user's intent. If they want to perform an action (add task, see schedule, navigate), you MUST use a tool. If they want to talk about feelings or reflect, use the `navigateTo` tool to send them to the `/journal` page. If they want to learn, use `navigateTo` to send them to the `/learning` page.";
    } else { // Default to journal mode
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
