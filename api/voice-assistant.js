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

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // STEP 1: Get the audio data from the request
    const audio_base64 = await req.text();
    
    if (!audio_base64) {
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

    // STEP 2: Use Gemini for Speech-to-Text AND AI Logic in one call
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest", 
      tools: voiceAssistantTools 
    });

    const chat = model.startChat({
      systemInstruction: `You are FocusAssist, a warm, intelligent voice AI companion designed to help people with ADHD, dyslexia, and focus challenges succeed in their daily lives.

VOICE INTERACTION GUIDELINES:
- Speak naturally and conversationally, as if you're a helpful friend
- Keep responses concise but warm (aim for 15-30 seconds of speech)
- Use natural speech patterns with appropriate pauses and intonation
- Be encouraging and supportive in your tone
- Respond immediately and naturally - don't ask for confirmation unless absolutely necessary

CRITICAL NAVIGATION - Use tools immediately for:
- "show me my journal" or "I want to journal" → /journal
- "I want to focus" or "focus mode" → /focus  
- "help me learn" or "explain something" → /learning
- "show my tasks" or "task manager" → /tasks

TOOL USAGE INTELLIGENCE:
- Use tools proactively when you recognize needs
- For complex projects (essays, vacation planning, organizing), use createProjectWithSubtasks
- For simple tasks (calls, errands, appointments), use addTask
- ALWAYS use navigateTo immediately for navigation requests - don't ask for clarification

PERSONALITY FOR VOICE:
- Warm, encouraging, genuinely helpful
- Celebrate wins with enthusiasm: "That's fantastic!" "You're doing great!"
- Offer gentle guidance for challenges: "Let's break this down together"
- Use natural conversational fillers: "So...", "Alright...", "Perfect..."
- Match their energy level but stay positive
- Today's date: ${new Date().toLocaleDateString('en-CA')}

Remember: This is a voice conversation, so be natural, immediate, and conversational. Don't over-explain - just be helpful and warm.`
    });

    // Send audio data for transcription and initial response
    const result = await chat.sendMessage([
      "Transcribe this audio and then follow the user's command.",
      { 
        inlineData: { 
          mimeType: "audio/webm", 
          data: audio_base64 
        } 
      }
    ]);

    const response = result.response;
    const functionCalls = response.functionCalls();

    // STEP 3: Handle any tool calls and get final text response
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

      // Get the final response after executing the tool
      const result2 = await chat.sendMessage([{ 
        functionResponse: { 
          name: call.name, 
          response: { content: JSON.stringify(toolResult) } 
        } 
      }]);

      finalResponseText = result2.response.text();
    } else {
      // No tools needed, use direct response
      finalResponseText = response.text();
    }

    // STEP 4: Return the TEXT to be spoken
    // The frontend will send this to the text-to-speech API
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