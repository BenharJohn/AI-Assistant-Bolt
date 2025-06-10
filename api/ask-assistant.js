// File: /api/ask-assistant.js

// 1. We now need to import the Supabase client library
import { createClient } from '@supabase/supabase-js';

// The overall structure of the function remains the same
export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { message: userInput } = await req.json();

    if (!userInput) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }

    // --- vvv NEW MEMORY LOGIC vvv ---

    // 2. Get Supabase credentials from Netlify environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    let formattedHistory = ''; // Default to an empty history string

    // 3. Only try to fetch history if the credentials are provided
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Fetch the last 6 messages, most recent first
      const { data: history, error: historyError } = await supabase
        .from('journal_entries')
        .select('role, content')
        .order('created_at', { descending: true })
        .limit(6);
      
      if (historyError) {
        // If there's an error, log it but don't stop the function.
        // The AI can still respond without history.
        console.error("Supabase history fetch error:", historyError.message);
      } else if (history) {
        // 4. Format the history into a simple string for the prompt
        // We reverse the array so it's in chronological order
        formattedHistory = history.reverse().map(entry => {
          return `${entry.role === 'user' ? 'User' : 'AI'}: ${entry.content}`;
        }).join('\n');
      }
    } else {
      console.log("Info: Supabase environment variables not set. Proceeding without history.");
    }

    // --- ^^^ END OF NEW MEMORY LOGIC ^^^ ---


    // 5. Update the prompt to include the conversation history
    const fullPrompt = `
      You are FocusAssist, a friendly, warm, and supportive AI companion.
      Keep responses concise, helpful, and under 75 words.
      Maintain the context of the conversation. If the user asks a follow-up question, answer it directly based on the history.
      Start your responses with the symbol: ⟡

      Here is the recent conversation history:
      ${formattedHistory}

      The user has just sent a new message.
      User: "${userInput}"

      Your supportive and in-context response:
    `;

    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY environment variable is not set on Netlify.");
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

    // This part remains the same
    const aiResponseText = data.candidates[0].content.parts[0].text;

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
