// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- This section for Assistant Tools remains the same ---
const assistantTools = [
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



      {
        name: "navigateTo",
        description: "Use this to navigate the user to a different page within the application when they ask to see something. For example: 'show me my tasks', 'open my journal'.",
        parameters: {
          type: "OBJECT",
          properties: {
            path: {
              type: "STRING",
              description: "The path to navigate to. Must be one of: '/tasks', '/journal', '/focus', '/learning', '/settings'."
            }
          },
          required: ["path"]
        }
      }



      
    ]
  }
];
async function handleCreateProject(args, supabase, genAI) {
  try {
    const { data: parentTaskData, error: parentError } = await supabase.from('tasks').insert({ title: args.title, due_date: args.due_date || null, status: 'pending', priority: 'high' }).select('id').single();
    if (parentError) throw parentError;

    const parentId = parentTaskData.id;
    const decompositionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const decompositionPrompt = `You are a project manager. Break down the project "${args.title}" into a list of 3-5 logical subtasks. The final project deadline is ${args.due_date || 'not set'}. If a date is provided, distribute the subtask due dates realistically between today (${new Date().toISOString().split('T')[0]}) and the final deadline. Respond ONLY with a valid JSON object in this exact format: {"subtasks": [{"title": "Subtask Title", "description": "A brief description", "due_date": "YYYY-MM-DD"}]}`;
    
    const result = await decompositionModel.generateContent(decompositionPrompt);
    let responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON for subtasks.");
    responseText = jsonMatch[0];

    const { subtasks } = JSON.parse(responseText);
    const subtasksToInsert = subtasks.map(subtask => ({ title: subtask.title, description: subtask.description || '', due_date: subtask.due_date || null, parent_task_id: parentId, status: 'pending', priority: 'medium' }));

    const { error: subtaskError } = await supabase.from('tasks').insert(subtasksToInsert);
    if (subtaskError) throw subtaskError;
    
    return { success: true, result: `I have created the project "${args.title}" and broken it down into ${subtasks.length} sub-tasks for you.` };
  } catch (e) {
    console.error("Error in handleCreateProject:", e);
    return { success: false, error: "I had trouble breaking down the project into sub-tasks." };
  }
}
// --- End of Assistant Tools section ---

export default async (req, context) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

  try {
    const { message: userInput, history, mode = 'journal' } = await req.json();
    if (!userInput) return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });

    const API_KEY = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // --- NEW: LOGIC TO HANDLE LEARNING TOOLS ---
    // If the prompt is a direct command from the learning tools, handle it and exit early.
    const isLearningToolCommand = userInput.startsWith('Explain the following concept:') || 
                                userInput.startsWith('Summarize the following text:') || 
                                userInput.startsWith('You are a study expert.');

    if (isLearningToolCommand) {
        console.log("Handling direct command for Learning Tools.");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent(userInput);
        const response = result.response;
        const aiResponseText = response.text();
        return new Response(JSON.stringify({ reply: aiResponseText }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // --- END OF NEW LOGIC ---

    // If it's not a learning tool command, proceed with the conversational agent logic
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
      systemInstruction = "You are FocusAssist, a proactive and efficient personal assistant. You MUST use the provided tools to fulfill user requests. Do not ask for clarifying details if the tool's required parameters are met. Directly use the tool.";
    } else { 
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      systemInstruction = "You are an empathetic, non-judgmental friend. Your goal is to listen, ask insightful follow-up questions, and help the user explore their thoughts. Start your responses with the symbol: ⟡";
    }
    
    const firstUserIndex = (history || []).findIndex(entry => entry.type === 'user');
    const validHistory = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);

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
      return new Response(JSON.stringify({ reply: finalResponse }), { status: 200, headers: { 'Content-Type': 'application/json' } });

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
