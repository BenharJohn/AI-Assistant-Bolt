// File: /api/ask-assistant.js
import { createClient } from '@supabase/supabase-js';

// This modern syntax works with Netlify's latest function handlers.
export default async (req, context) => {
  // Check if the request method is POST.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { message: userInput } = await req.json();

    if (!userInput) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }

    // --- vvv NEW MEMORY LOGIC vvv ---

    // 1. Get Supabase credentials securely from environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("FATAL: Supabase environment variables are not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // 2. Create a Supabase client for this function call
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Fetch the last 6 messages from the journal to use as context
    const { data: history, error: historyError } = await supabase
      .from('journal_entries')
      .select('role, content')
      .order('created_at', { descending: true })
      .limit(6);

    if (historyError) {
      console.error("Supabase history fetch error:", historyError);
      // We can still proceed without history, but we should log the error.
    }

    // 4. Format the history for the prompt (and reverse it to be in chronological order)
    const formattedHistory = history ? history.reverse().map(entry => {
      return `${entry.role === 'user' ? 'User' : 'AI'}: ${entry.content}`;
    }).join('\n') : '';

    // --- ^^^ END OF NEW MEMORY LOGIC ^^^ ---

    const fullPrompt = `
      You are FocusAssist, a friendly, warm, and supportive AI companion.
      Keep responses concise and under 75 words.
      Maintain the context of the conversation. If the user asks a follow-up question, answer it directly.
      Start your responses with the symbol: ⟡

      Here is the recent conversation history:
      ${formattedHistory}

      The user has just sent a new message.
      User: "${userInput}"

      Your supportive and in-context response:
    `;

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Google AI API Error:', JSON.stringify(responseData));
      return new Response(JSON.stringify({ error: 'Failed to get response from AI.' }), { status: apiResponse.status });
    }

    const aiResponseText = responseData.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ reply: aiResponseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Critical error inside function handler:", error.message);
    return new Response(JSON.stringify({ error: 'A critical error occurred.' }), { status: 500 });
  }
};

export const config = {
  path: "/api/ask-assistant",
};
