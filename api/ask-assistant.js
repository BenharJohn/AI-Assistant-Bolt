// File: /api/ask-assistant.js

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { message: userInput } = await req.json();

    if (!userInput) {
      return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });
    }

    const fullPrompt = `
      You are FocusAssist, a friendly, warm, and supportive AI companion.
      Keep responses concise and under 75 words. Start responses with the symbol: ⟡

      User's thought: "${userInput}"
      Your supportive response:
    `;

    // --- vvv THIS IS THE ONLY LINE THAT HAS CHANGED vvv ---
    const API_KEY = process.env.GEMINI_API_KEY;
    // --- ^^^ THIS IS THE ONLY LINE THAT HAS CHANGED ^^^ ---

    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY environment variable is not set on Netlify.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

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