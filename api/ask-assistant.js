// File: /api/ask-assistant.js

// No longer need to import Supabase here!

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // 1. Get BOTH the new message and the history from the request body
    const { message: userInput, history } = await req.json();

    if (!userInput) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }

    // 2. Format the history that was passed in from the frontend
    const formattedHistory = (history || []).map(entry => {
        return `${entry.type === 'user' ? 'User' : 'AI'}: ${entry.content}`;
    }).join('\n');


    // 3. The rest of the logic is the same, but now it uses the correct, up-to-date history!
    const fullPrompt = `
      You are FocusAssist, a friendly, warm, and supportive AI companion.
      Keep responses concise and under 75 words.
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
