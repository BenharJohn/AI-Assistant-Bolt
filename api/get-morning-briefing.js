// File: /api/get-morning-briefing.js
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async (req, context) => {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!API_KEY || !supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 1. Fetch tasks that are not completed
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('title, priority')
      .neq('status', 'completed')
      .limit(5);

    if (error) {
      console.error("Error fetching tasks for briefing:", error);
      throw new Error("Could not fetch tasks.");
    }
    
    // 2. Create a dynamic prompt based on whether there are tasks
    const taskList = tasks.map(t => `- ${t.title} (${t.priority} priority)`).join('\n');
    const prompt = `You are FocusAssist, a friendly and encouraging AI companion. It's the morning. Create a short, warm, 1-2 sentence greeting for the user. Based on their tasks for today, give them a brief, motivating summary.
    
    Today's tasks:
    ${tasks.length > 0 ? taskList : "No tasks scheduled for today."}
    
    Your brief, motivating message:`;

    // 3. Get the briefing from the AI
    const result = await model.generateContent(prompt);
    const briefingText = result.response.text();

    return new Response(JSON.stringify({ briefing: briefingText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in get-morning-briefing function:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate briefing.' }), { status: 500 });
  }
};

export const config = {
  path: "/api/get-morning-briefing",
};
