// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Enhanced tools with better generalization and intent recognition ---
const assistantTools = [
  {
    functionDeclarations: [
      {
        name: "getTodaysTasks",
        description: "Retrieves the user's current task list and schedule. Use when they ask about: their schedule, what's on their plate, what tasks they have, what's due, their workload, checking their to-do list, seeing what's pending, or any variation of wanting to know about their current responsibilities and commitments.",
        parameters: { type: "OBJECT", properties: {} }
      },
      {
        name: "createProjectWithSubtasks",
        description: "Creates a comprehensive project broken down into manageable steps. Use for any complex, multi-step endeavor that requires planning and organization. Examples include: academic work (essays, research, studying), personal projects (organizing spaces, planning events, learning skills), professional tasks (presentations, reports, job searching), life goals (fitness routines, habit building, travel planning), creative projects (writing, art, music), or any request that involves multiple steps or phases to complete.",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            title: { type: "STRING", description: "A clear, descriptive title for the main project goal." }, 
            due_date: { type: "STRING", description: "Optional deadline in YYYY-MM-DD format if the user mentions a specific date or timeframe." } 
          }, 
          required: ["title"] 
        }
      },
      {
        name: "addTask",
        description: "Creates a single, straightforward task or reminder. Use for simple actions, quick reminders, one-step activities, or individual items that don't require breaking down. Examples: making phone calls, sending emails, buying specific items, attending appointments, taking medication, paying bills, or any standalone action that can be completed in one session.",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            title: { type: "STRING", description: "A clear, actionable title for the task." }, 
            description: { type: "STRING", description: "Additional context or details about the task." }, 
            priority: { type: "STRING", description: "How urgent or important this is: 'low' for nice-to-have items, 'medium' for regular tasks, 'high' for urgent or important items.", enum: ["low", "medium", "high"] }, 
            due_date: { type: "STRING", description: "When this needs to be done, in YYYY-MM-DD format." } 
          }, 
          required: ["title"] 
        }
      },
      {
        name: "navigateTo",
        description: "Navigates the user to the most appropriate section of the app based on their needs and context. Use when they want to: reflect on their day/feelings/thoughts (journal), learn something new or get help understanding concepts (learning), start a focused work session or need concentration time (focus), or manage their tasks and projects (tasks). Look for emotional language, requests for explanation/learning, mentions of needing to focus/concentrate, or task management needs.",
        parameters: { 
          type: "OBJECT", 
          properties: { 
            path: { 
              type: "STRING", 
              description: "The destination: '/journal' for reflection, emotional processing, or talking about life; '/learning' for explanations, study help, or educational content; '/focus' for concentration, work sessions, or distraction-free time; '/tasks' for task management, project organization, or productivity planning." 
            } 
          }, 
          required: ["path"] 
        }
      },
      {
        name: "updateTask",
        description: "Modifies existing tasks based on user requests. Use when they want to: mark tasks complete/done, change task details, update priorities, modify due dates, add descriptions, or make any changes to tasks they've already created. Also use when they mention finishing, completing, or being done with something.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "The title or name of the task to find and modify." },
            updates: { type: "OBJECT", description: "The changes to make - can include status ('completed', 'pending', 'in-progress'), priority, description, or due_date fields." }
          },
          required: ["title", "updates"]
        }
      },
      {
        name: "deleteTask",
        description: "Removes tasks from the user's list. Use when they want to cancel, remove, delete, or get rid of tasks they no longer need or want to do. Also use when they mention that something is no longer relevant or they've changed their mind about doing it.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "The title or name of the task to remove." }
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
    const prompt = `Break down this project "${title}" into 3-5 specific, actionable subtasks. Each subtask should be a clear step that can be completed independently. Think about the logical flow and what someone would actually need to do to accomplish this goal. Respond with a JSON object like this:
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
      // Fallback to default subtasks based on the project title
      if (title.toLowerCase().includes('essay') || title.toLowerCase().includes('write')) {
        subtasks = [
          { title: "Research and gather sources", description: "Find reliable information and references" },
          { title: "Create detailed outline", description: "Organize main points and structure" },
          { title: "Write first draft", description: "Complete the initial version" },
          { title: "Review and edit", description: "Refine and polish the final version" }
        ];
      } else if (title.toLowerCase().includes('plan') || title.toLowerCase().includes('organize')) {
        subtasks = [
          { title: "Define goals and requirements", description: "Clarify what needs to be accomplished" },
          { title: "Research options and gather information", description: "Explore possibilities and collect details" },
          { title: "Create detailed plan", description: "Organize steps and timeline" },
          { title: "Execute and monitor progress", description: "Implement the plan and track results" }
        ];
      } else {
        subtasks = [
          { title: "Plan and research", description: "Gather information and create a strategy" },
          { title: "Begin implementation", description: "Start working on the main components" },
          { title: "Review and finalize", description: "Complete and review the work" }
        ];
      }
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
      result: `Perfect! I've created your "${title}" project with ${subtasks.length} organized steps. You can find everything in your task manager and start working through each piece at your own pace.`,
      mainTaskId: mainTask.id,
      subtaskCount: subtasks.length
    };

  } catch (error) {
    console.error('Error in handleCreateProject:', error);
    return { success: false, error: 'I had trouble setting up that project, but let me try a different approach.' };
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
        result: "You're all caught up! No pending tasks right now. This is a great time to either tackle something new or take a well-deserved break. How are you feeling about your productivity lately?" 
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
          taskInfo += ` - ⚠️ OVERDUE`;
        } else if (isToday) {
          taskInfo += ` - 📅 Due today`;
        } else {
          taskInfo += ` - Due ${dueDate.toLocaleDateString()}`;
        }
      }
      return taskInfo;
    }).join('\n');

    const encouragement = tasks.length <= 3 ? 
      "You've got a nice, manageable list!" : 
      tasks.length <= 6 ? 
      "You've got some good work ahead, but totally doable!" :
      "That's quite a list! Remember, you don't have to do everything at once.";

    return { 
      success: true, 
      result: `Here's what you're working with:\n\n${taskList}\n\nTotal: ${tasks.length} tasks remaining. ${encouragement} Would you like help prioritizing or breaking any of these down further?` 
    };

  } catch (error) {
    console.error('Error in handleGetTodaysTasks:', error);
    return { success: false, error: 'I had trouble getting your task list right now.' };
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
      systemInstruction = `You are FocusAssist, a warm, intelligent, and proactive AI companion designed to help people with ADHD, dyslexia, and focus challenges succeed in their daily lives. 

CORE PERSONALITY:
- Be conversational, encouraging, and genuinely helpful
- Understand context and read between the lines
- Celebrate small wins and offer gentle guidance for challenges
- Use tools proactively when you recognize user needs
- Be smart about user intent - if someone says "I want to talk about my day" or mentions emotions/feelings, navigate them to journal
- If they ask for explanations or want to learn something, guide them to learning tools
- When they mention needing to focus or concentrate, suggest the focus mode

TOOL USAGE INTELLIGENCE:
- Use tools immediately when you identify what the user needs - don't ask for clarification if you can reasonably infer their intent
- For complex projects (essays, vacation planning, organizing, studying, creative work), always use createProjectWithSubtasks
- For simple one-step tasks (calls, purchases, appointments), use addTask
- When users mention emotions, reflection, journaling, or "talking about" something personal, navigate to /journal
- When they want explanations, learning, or study help, navigate to /learning  
- When they mention focus, concentration, or distraction-free work, navigate to /focus
- Be proactive about navigation - don't wait for them to explicitly ask

RESPONSE STYLE:
- Match their energy and tone while staying supportive
- Use natural, conversational language
- Acknowledge their feelings and challenges
- Offer specific, actionable help
- Today's date is ${new Date().toLocaleDateString('en-CA')} - use this for date-sensitive responses

Remember: Your goal is to make their life easier and more manageable. Be the supportive friend who actually gets things done.`;
    } else { 
      model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      systemInstruction = `You are a compassionate, wise, and deeply empathetic AI companion - like talking to a trusted friend who truly listens. You create a safe, non-judgmental space for reflection and emotional processing.

CORE APPROACH:
- Always start responses with the symbol: ⟡
- Listen deeply and reflect back what you hear
- Ask thoughtful, open-ended questions that help users explore their feelings
- Validate their experiences without trying to "fix" everything
- Help them process emotions, thoughts, and daily experiences
- Be present with them in whatever they're feeling

CONVERSATION STYLE:
- Use warm, gentle language that feels natural and caring
- Show genuine curiosity about their inner world
- Help them notice patterns, insights, and growth
- Celebrate their self-awareness and courage in sharing
- Offer gentle perspective when helpful, but prioritize understanding over advice
- Remember that sometimes people just need to be heard

EMOTIONAL INTELLIGENCE:
- Recognize when someone is struggling and offer extra compassion
- Notice when they're excited or happy and share in that joy
- Help them explore difficult emotions without rushing to solutions
- Support their self-discovery journey
- Be comfortable with complexity and nuance in human experience

You're not just processing their words - you're connecting with their humanity. Be the friend who makes them feel truly seen and understood.`;
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
        toolResult = error ? { success: false, error: error.message } : { success: true, result: `Perfect! I've added "${call.args.title}" to your task list. You can find it in your task manager whenever you're ready to tackle it.` };
      } else if (call.name === 'createProjectWithSubtasks') {
        toolResult = await handleCreateProject(call.args, supabase, genAI);
      } else if (call.name === 'getTodaysTasks') {
        toolResult = await handleGetTodaysTasks(supabase);
      } else if (call.name === 'updateTask') {
        const { data } = await supabase.from('tasks').update(call.args.updates).eq('title', call.args.title).select().single();
        toolResult = data ? { success: true, result: "Great! I've updated that task for you. Nice work staying on top of things!" } : { success: false, error: "I couldn't find that specific task to update. Could you double-check the name?" };
      } else if (call.name === 'deleteTask') {
        const { error } = await supabase.from('tasks').delete().eq('title', call.args.title);
        toolResult = error ? { success: false, error: "I couldn't find that task to remove." } : { success: true, result: "Done! I've removed that task from your list. Sometimes it feels good to clear things out!" };
      } else {
        toolResult = { success: false, error: "I'm not sure how to help with that right now." };
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
    return new Response(JSON.stringify({ error: 'I\'m having a moment of confusion, but I\'m here to help. Could you try that again?' }), { status: 500 });
  }
};

export const config = { path: "/api/ask-assistant" };