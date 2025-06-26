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

// Helper functions (same as text version but with voice-optimized responses)
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

    const taskList = tasks.map(task => {
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

    return { 
      success: true, 
      result: `Here's what you're working with: ${taskList}. Total: ${tasks.length} tasks remaining. Would you like help with any of these?` 
    };

  } catch (error) {
    return { success: false, error: 'I had trouble getting your task list.' };
  }
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { audioData, mode = 'assistant', history } = await req.json();
    
    if (!audioData) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!API_KEY || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use the native audio dialog model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      tools: voiceAssistantTools,
      systemInstruction: `You are FocusAssist, a warm, intelligent voice AI companion designed to help people with ADHD, dyslexia, and focus challenges.

VOICE INTERACTION GUIDELINES:
- Speak naturally and conversationally
- Keep responses concise but warm
- Use natural speech patterns, not formal text
- Be encouraging and supportive

CRITICAL NAVIGATION - Use tools immediately for:
- "show me my journal" → /journal
- "I want to focus" → /focus  
- "help me learn" → /learning
- "show my tasks" → /tasks

TOOL USAGE:
- Use tools proactively when you recognize needs
- For complex projects, use createProjectWithSubtasks
- For simple tasks, use addTask
- Always use navigateTo for navigation requests

PERSONALITY:
- Warm, encouraging, genuinely helpful
- Celebrate wins, offer gentle guidance
- Natural, conversational tone
- Today's date: ${new Date().toLocaleDateString('en-CA')}`
    });

    // Start a chat session with the audio
    const chat = model.startChat({
      history: history || []
    });

    // Convert base64 audio data to the format Gemini expects
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    const result = await chat.sendMessage([
      {
        inlineData: {
          mimeType: "audio/wav",
          data: audioData
        }
      }
    ]);

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
          tags: ['AI-generated', 'voice-created']
        }]);
        toolResult = error ? 
          { success: false, error: error.message } : 
          { success: true, result: `Added "${call.args.title}" to your tasks.` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
      } else if (call.name === 'getTodaysTasks') {
        toolResult = await handleGetTodaysTasks(supabase);
      } else if (call.name === 'updateTask') {
        const { data } = await supabase.from('tasks').update(call.args.updates).eq('title', call.args.title).select().single();
        toolResult = data ? 
          { success: true, result: "Updated that task for you!" } : 
          { success: false, error: "Couldn't find that task." };
      } else if (call.name === 'deleteTask') {
        const { error } = await supabase.from('tasks').delete().eq('title', call.args.title);
        toolResult = error ? 
          { success: false, error: "Couldn't remove that task." } : 
          { success: true, result: "Removed that task from your list!" };
      } else {
        toolResult = { success: false, error: "Not sure how to help with that." };
      }

      const result2 = await chat.sendMessage([{ 
        functionResponse: { 
          name: call.name, 
          response: { content: JSON.stringify(toolResult) } 
        } 
      }]);

      // Get the audio response
      const finalResponse = result2.response;
      const audioResponse = finalResponse.audio; // This should contain the audio data

      return new Response(JSON.stringify({ 
        audioResponse: audioResponse,
        textResponse: finalResponse.text(),
        toolResult: toolResult 
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });

    } else {
      // Direct audio response without tools
      const audioResponse = response.audio;
      const textResponse = response.text();
      
      return new Response(JSON.stringify({ 
        audioResponse: audioResponse,
        textResponse: textResponse
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

  } catch (error) {
    console.error("Error in voice assistant:", error);
    return new Response(JSON.stringify({ 
      error: 'I had trouble processing that. Could you try again?' 
    }), { status: 500 });
  }
};

export const config = { path: "/api/voice-assistant" };