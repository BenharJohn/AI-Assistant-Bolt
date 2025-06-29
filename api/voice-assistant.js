// File: /api/voice-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Enhanced tools for voice interactions
const voiceAssistantTools = [
  {
    functionDeclarations: [
      {
        name: "getTodaysTasks",
        description: "Retrieves the user's current task list and schedule. Use when they ask about their schedule, tasks, or workload.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "createProjectWithSubtasks",
        description: "Creates a comprehensive project broken down into steps. Use for complex, multi-step endeavors.",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            title: { type: "STRING", description: "Clear project title." }, 
            due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format." } 
          }, 
          required: ["title"] 
        }
      },
      {
        name: "addTask",
        description: "Creates a single, straightforward task. Use for simple actions or reminders.",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            title: { type: "STRING", description: "Clear, actionable task title." }, 
            description: { type: "STRING", description: "Additional context." }, 
            priority: { type: "STRING", description: "low, medium, or high", enum: ["low", "medium", "high"] }, 
            due_date: { type: "STRING", description: "YYYY-MM-DD format." } 
          }, 
          required: ["title"] 
        }
      },
      {
        name: "navigateTo",
        description: "Navigate user to specific sections. Use immediately for navigation requests.",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            path: { 
              type: "STRING", 
              description: "Navigation destination",
              enum: ["/journal", "/learning", "/focus", "/tasks"]
            } 
          }, 
          required: ["path"] 
        }
      },
      {
        name: "updateTask",
        description: "Modify existing tasks - completion, details, priorities.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Task to modify." },
            updates: { type: "OBJECT", description: "Changes to make." }
          },
          required: ["title", "updates"]
        }
      },
      {
        name: "deleteTask",
        description: "Remove tasks from the user's list.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Task to remove." }
          },
          required: ["title"]
        }
      }
    ]
  }
];

// Helper functions (optimized for voice responses)
async function handleCreateProject(args, supabase, genAI) {
  try {
    const { title, due_date } = args;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `Break down this project "${title}" into 3-5 specific, actionable subtasks. Response as JSON: {"subtasks": [{"title": "...", "description": "..."}]}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    let subtasks = [];
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        subtasks = parsed.subtasks || [];
      }
    } catch (parseError) {
      // Fallback subtasks
      subtasks = [
        { title: "Plan and research", description: "Gather information and create strategy" },
        { title: "Begin implementation", description: "Start working on main components" },
        { title: "Review and finalize", description: "Complete and review the work" }
      ];
    }

    // Create main task
    const { data: mainTask, error: mainTaskError } = await supabase
      .from('tasks')
      .insert([{
        title: title,
        description: `Project with ${subtasks.length} subtasks`,
        priority: 'medium',
        status: 'pending',
        due_date: due_date || null,
        tags: ['project', 'AI-generated', 'voice-created']
      }])
      .select()
      .single();

    if (mainTaskError) {
      return { success: false, error: mainTaskError.message };
    }

    // Create subtasks
    const subtaskInserts = subtasks.map(subtask => ({
      title: subtask.title,
      description: subtask.description || null,
      priority: 'medium',
      status: 'pending',
      parent_task_id: mainTask.id,
      tags: ['subtask', 'AI-generated', 'voice-created']
    }));

    const { error: subtasksError } = await supabase
      .from('tasks')
      .insert(subtaskInserts);

    if (subtasksError) {
      return { 
        success: true, 
        result: `Created project "${title}" but had some issues with subtasks.`,
        mainTaskId: mainTask.id 
      };
    }

    return { 
      success: true, 
      result: `Perfect! I've created your "${title}" project with ${subtasks.length} organized steps. You can find everything in your task manager.`,
      mainTaskId: mainTask.id,
      subtaskCount: subtasks.length
    };

  } catch (error) {
    return { success: false, error: 'I had trouble setting up that project.' };
  }
}

async function handleGetTodaysTasks(supabase) {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('title, priority, due_date, status')
      .neq('status', 'completed')
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!tasks || tasks.length === 0) {
      return { 
        success: true, 
        result: "You're all caught up! No pending tasks right now. Great job staying on top of things!" 
      };
    }

    const taskList = tasks.slice(0, 5).map(task => {
      let taskInfo = `${task.title} - ${task.priority} priority`;
      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const isOverdue = dueDate < today;
        const isToday = dueDate.toDateString() === today.toDateString();
        
        if (isOverdue) {
          taskInfo += ` - overdue`;
        } else if (isToday) {
          taskInfo += ` - due today`;
        } else {
          taskInfo += ` - due ${dueDate.toLocaleDateString()}`;
        }
      }
      return taskInfo;
    }).join('. ');

    const remainingCount = tasks.length > 5 ? ` Plus ${tasks.length - 5} more tasks.` : '';

    return { 
      success: true, 
      result: `Here's what you're working with: ${taskList}.${remainingCount} Total: ${tasks.length} tasks remaining. Would you like help with any of these?` 
    };

  } catch (error) {
    return { success: false, error: 'I had trouble getting your task list.' };
  }
}

// Dynamic system instructions based on page context
function getSystemInstruction(mode) {
  const baseDate = `Today's date: ${new Date().toLocaleDateString('en-CA')}`;

  switch (mode) {
    case '/journal':
      return `You are Aeva, a compassionate AI companion for journaling. Listen deeply, ask thoughtful questions, and help users process emotions. Keep responses warm and gentle (20-45 seconds). ${baseDate}`;

    case '/focus':
      return `You are Aeva, a calm, minimally intrusive AI for focus mode. Keep responses brief (10-20 seconds) and avoid breaking concentration. Be a quiet, encouraging presence. ${baseDate}`;

    case '/learning':
      return `You are Aeva, an intelligent AI tutor. Explain concepts clearly, break down complex ideas, and encourage learning. Speak clearly at a good pace (20-40 seconds). ${baseDate}`;

    case '/tasks':
      return `You are Aeva, an efficient AI task manager. Help with adding, updating, and organizing tasks. Be direct and action-oriented (15-30 seconds). Use tools proactively. ${baseDate}`;

    default:
      return `You are Aeva, a warm AI companion helping people with ADHD and focus challenges. Be conversational, encouraging, and helpful (20-40 seconds). Use navigation tools when users mention specific features. ${baseDate}`;

  }
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // Parse JSON body to get both audio and mode
    const body = await req.json();
    const { audio: audio_base64, mode = '/' } = body;
    
    if (!audio_base64) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), { status: 400 });
    }

    // Get environment variables with fallbacks and better error reporting
    const API_KEY = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Detailed error checking
    if (!API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Voice assistant requires Google AI API key. Please set GEMINI_API_KEY in environment variables.' 
      }), { status: 500 });
    }

    if (!supabaseUrl) {
      console.error('Missing Supabase URL environment variable');
      return new Response(JSON.stringify({ 
        error: 'Missing Supabase URL configuration.' 
      }), { status: 500 });
    }

    if (!supabaseServiceKey) {
      console.error('Missing Supabase service key environment variable');
      return new Response(JSON.stringify({ 
        error: 'Missing Supabase service key configuration.' 
      }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Use gemini-1.5-pro for superior reasoning and complex understanding
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",  // CHANGED: Using the best model for complex reasoning
      tools: voiceAssistantTools
    });

    // STEP 2: Get dynamic system instruction with explicit transcription instruction
    const systemInstruction = getSystemInstruction(mode);

    const chat = model.startChat({
      systemInstruction: {
        role: "system",
        parts: [{ text: systemInstruction }]
      }
    });

    // Send audio data for transcription and intelligent response
    const result = await chat.sendMessage([
      "Listen to this audio message, transcribe it accurately, and then respond appropriately based on your instructions.",
      { 
        inlineData: { 
          mimeType: "audio/webm", 
          data: audio_base64 
        } 
      }
    ]);

    const response = result.response;
    const functionCalls = response.functionCalls();

    // STEP 3: Handle any tool calls first
    let finalResponseText;
    let toolResult = null;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
      } else if (call.name === 'addTask') {
        const { error } = await supabase.from('tasks').insert([{ 
          title: call.args.title,
          description: call.args.description || null,
          priority: call.args.priority || 'medium',
          due_date: call.args.due_date || null,
          status: 'pending',
          tags: ['AI-generated', 'voice-created']
        }]);
        toolResult = error ? 
          { success: false, error: error.message } : 
          { success: true, result: `Added "${call.args.title}" to your tasks. You're all set!` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
      } else if (call.name === 'getTodaysTasks') {
        toolResult = await handleGetTodaysTasks(supabase);
      } else if (call.name === 'updateTask') {
        const { data } = await supabase.from('tasks').update(call.args.updates).eq('title', call.args.title).select().single();
        toolResult = data ? 
          { success: true, result: "Perfect! I've updated that task for you." } : 
          { success: false, error: "I couldn't find that specific task to update." };
      } else if (call.name === 'deleteTask') {
        const { error } = await supabase.from('tasks').delete().eq('title', call.args.title);
        toolResult = error ? 
          { success: false, error: "I couldn't find that task to remove." } : 
          { success: true, result: "Done! I've removed that task from your list." };
      } else {
        toolResult = { success: false, error: "I'm not sure how to help with that right now." };
      }

      // Get the final text response after executing the tool
      const result2 = await chat.sendMessage([{ 
        functionResponse: { 
          name: call.name, 
          response: { content: JSON.stringify(toolResult) } 
        } 
      }]);

      finalResponseText = result2.response.text();
    } else {
      // No tools needed, use direct text response
      finalResponseText = response.text();
    }

    // STEP 4: Return ONLY the TEXT to be spoken
    // The frontend will send this to the separate text-to-speech API
    return new Response(JSON.stringify({ 
      reply: finalResponseText, 
      toolResult: toolResult 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in voice assistant:", error);
    return new Response(JSON.stringify({ 
      error: 'I had trouble processing that. Could you try speaking again?' 
    }), { status: 500 });
  }
};

export const config = { path: "/api/voice-assistant" };