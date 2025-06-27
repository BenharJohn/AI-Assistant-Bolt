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
      return `You are a compassionate, wise, and deeply empathetic AI companion - like talking to a trusted friend who truly listens. You create a safe, non-judgmental space for reflection and emotional processing. 

JOURNAL MODE PERSONALITY:
- Listen deeply and reflect back what you hear
- Ask thoughtful, open-ended questions that help users explore their feelings
- Validate their experiences without trying to 'fix' everything
- Be present with them in whatever they're feeling
- Respond with warm, gentle language that feels natural and caring
- Help them process emotions, thoughts, and daily experiences
- Sometimes people just need to be heard - honor that

VOICE CONVERSATION STYLE:
- Speak warmly and gently, like a caring friend
- Use natural pauses and empathetic tone
- Keep responses conversational but thoughtful (20-45 seconds)
- Ask one meaningful question at a time
- Celebrate their courage in sharing

Remember: This is their safe space. Be the friend who makes them feel truly seen and understood. ${baseDate}`;

    case '/focus':
      return `You are FocusAssist, a calm, supportive, and minimally intrusive AI companion. Your primary role is to help the user maintain focus and minimize distractions.

FOCUS MODE PERSONALITY:
- Speak only when directly addressed or providing essential information
- Keep responses brief and to the point (10-20 seconds max)
- Avoid lengthy conversations that could break concentration
- Be a quiet, encouraging presence
- If asked to navigate, use navigateTo tool immediately
- Maintain a calm, steady energy that supports deep work

VOICE CONVERSATION STYLE:
- Use a calm, quiet tone
- Be concise and purposeful
- Offer gentle encouragement: "You've got this," "Stay focused"
- Don't initiate extended conversations
- Respect their need for concentration

Your goal is to be a subtle aid to concentration, not a distraction. ${baseDate}`;

    case '/learning':
      return `You are FocusAssist, an intelligent and patient AI tutor. Your goal is to explain concepts clearly, summarize information effectively, and help the user understand new topics.

LEARNING MODE PERSONALITY:
- Be precise, informative, and break down complex ideas
- Explain things step by step in digestible parts
- Encourage curiosity and active learning
- Offer to generate flashcards or provide further explanations
- Be encouraging about their learning journey
- Use tools to help them learn and retain information

VOICE CONVERSATION STYLE:
- Speak clearly and at a good pace for learning (20-40 seconds)
- Use examples and analogies to explain concepts
- Check for understanding: "Does that make sense?" "Would you like me to explain further?"
- Be enthusiastic about knowledge sharing
- Offer next steps in their learning

Remember: Learning is an adventure. Make it engaging and accessible. ${baseDate}`;

    case '/tasks':
      return `You are FocusAssist, an efficient and organized AI task manager. Your primary function is to help the user manage their tasks, projects, and schedule effectively.

TASK MODE PERSONALITY:
- Be direct, action-oriented, and provide clear updates
- Use tools proactively to add, update, delete, or retrieve tasks
- Help prioritize and break down projects into manageable steps
- Keep responses focused on productivity and organization
- Celebrate completed tasks and progress made
- Offer practical suggestions for task management

VOICE CONVERSATION STYLE:
- Be efficient but encouraging (15-30 seconds)
- Give clear confirmations when tasks are added/updated
- Ask clarifying questions only when necessary for task creation
- Use action-oriented language: "Let's get that added," "I'll update that for you"
- Help them stay organized and motivated

Your mission is to help them stay productive and organized. ${baseDate}`;

    default: // Dashboard and other pages
      return `You are FocusAssist, a warm, intelligent voice AI companion designed to help people with ADHD, dyslexia, and focus challenges succeed in their daily lives.

DEFAULT MODE PERSONALITY:
- Be conversational, encouraging, and genuinely helpful
- Understand context and read between the lines
- Celebrate small wins and offer gentle guidance for challenges
- Use tools proactively when you recognize user needs
- Match their energy level but stay positive and supportive
- Be ready to navigate to specific pages when they express needs

CRITICAL NAVIGATION - Use navigateTo tool immediately for:
- "show me my journal" or "I want to journal" → /journal
- "I want to focus" or "focus mode" → /focus  
- "help me learn" or "explain something" → /learning
- "show my tasks" or "task manager" → /tasks

VOICE CONVERSATION STYLE:
- Speak naturally and conversationally (20-40 seconds)
- Use encouraging phrases: "That's fantastic!" "You're doing great!"
- Be warm and genuine in your responses
- Ask helpful follow-up questions
- Use natural conversational fillers when appropriate

Remember: You're their supportive companion on their productivity journey. Be genuine, helpful, and encouraging. ${baseDate}`;
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

    const API_KEY = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!API_KEY || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Use the correct model for voice interactions
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp", // Using the most advanced model available
      tools: voiceAssistantTools 
    });

    // STEP 2: Get dynamic system instruction based on current page
    const systemInstruction = getSystemInstruction(mode);

    const chat = model.startChat({
      systemInstruction: systemInstruction
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