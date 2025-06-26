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
    ]
  }
];

// --- Helper function to create a project with subtasks ---
async function handleCreateProject(args, supabase, genAI) {
  try {
    const { title, due_date } = args;
    
    // Use AI to break down the project into subtasks
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Break down this project "${title}" into 3-5 specific, actionable subtasks. Each subtask should be a clear step that can be completed independently. Respond with a JSON object like this:
    {
      "subtasks": [
        {"title": "Research topic", "description": "Find reliable sources and gather information"},
        {"title": "Create outline", "description": "Organize main points and structure"}
      ]
    }`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    let subtasks = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        subtasks = parsed.subtasks || [];
      }
    } catch (parseError) {
      console.error('Failed to parse AI response for subtasks:', parseError);
      // Fallback to default subtasks
      subtasks = [
        { title: "Plan and research", description: "Gather information and create a plan" },
        { title: "Begin implementation", description: "Start working on the main components" },
        { title: "Review and finalize", description: "Complete and review the work" }
      ];
    }

    // Create the main project task
    const { data: mainTask, error: mainTaskError } = await supabase
      .from('tasks')
      .insert([{
        title: title,
        description: `Project with ${subtasks.length} subtasks`,
        priority: 'medium',
        status: 'pending',
        due_date: due_date || null,
        tags: ['project', 'AI-generated']
      }])
      .select()
      .single();

    if (mainTaskError) {
      console.error('Error creating main task:', mainTaskError);
      return { success: false, error: mainTaskError.message };
    }

    // Create subtasks with the main task as parent
    const subtaskInserts = subtasks.map(subtask => ({
      title: subtask.title,
      description: subtask.description || null,
      priority: 'medium',
      status: 'pending',
      parent_task_id: mainTask.id,
      tags: ['subtask', 'AI-generated']
    }));

    const { error: subtasksError } = await supabase
      .from('tasks')
      .insert(subtaskInserts);

    if (subtasksError) {
      console.error('Error creating subtasks:', subtasksError);
      return { 
        success: true, 
        result: `Created project "${title}" but had issues creating some subtasks.`,
        mainTaskId: mainTask.id 
      };
    }

    return { 
      success: true, 
      result: `Created project "${title}" with ${subtasks.length} subtasks. You can find it in your task manager.`,
      mainTaskId: mainTask.id,
      subtaskCount: subtasks.length
    };

  } catch (error) {
    console.error('Error in handleCreateProject:', error);
    return { success: false, error: 'Failed to create project with subtasks.' };
  }
}

// --- Helper function to get today's tasks ---
async function handleGetTodaysTasks(supabase) {
  try {
    // Get all incomplete tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('title, priority, due_date, status')
      .neq('status', 'completed')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return { success: false, error: error.message };
    }

    if (!tasks || tasks.length === 0) {
      return { 
        success: true, 
        result: "You have no pending tasks today. Great job staying on top of things!" 
      };
    }

    // Format tasks for the AI to understand
    const taskList = tasks.map(task => {
      let taskInfo = `- ${task.title} (${task.priority} priority)`;
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        if (isOverdue) {
          taskInfo += ` - OVERDUE`;
        } else if (isToday) {
          taskInfo += ` - Due today`;
        } else {
          taskInfo += ` - Due ${dueDate.toLocaleDateString()}`;
        }
      }
      return taskInfo;
    }).join('\n');

    return { 
      success: true, 
      result: `Here are your current tasks:\n\n${taskList}\n\nTotal: ${tasks.length} tasks remaining.` 
    };

  } catch (error) {
    console.error('Error in handleGetTodaysTasks:', error);
    return { success: false, error: 'Failed to retrieve tasks.' };
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
      systemInstruction = "You are FocusAssist, a friendly and proactive AI assistant. Your primary function is to understand the user's intent and use tools to help them. If a user asks to do something with a task (add, create, update, delete, check schedule) or navigate the app, you MUST use a tool. Do not ask for clarifying details if a tool can be used. For complex projects like 'write my history essay' or 'plan my vacation', use createProjectWithSubtasks. For simple tasks like 'call dentist' or 'buy milk', use addTask. Today's date is " + new Date().toLocaleDateString('en-CA') + ".";
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
        const { error } = await supabase.from('tasks').insert([{ 
          title: call.args.title,
          description: call.args.description || null,
          priority: call.args.priority || 'medium',
          due_date: call.args.due_date || null,
          status: 'pending',
          tags: ['AI-generated']
        }]);
        toolResult = error ? { success: false, error: error.message } : { success: true, result: `Task "${call.args.title}" was added successfully.` };
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