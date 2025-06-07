// File: /api/ask-assistant.js

// This modern syntax works with Netlify's latest function handlers.
export default async (req, context) => {
  // A simple log at the very top. If we don't see this, the function isn't running at all.
  console.log("Function 'ask-assistant' was invoked.");

  // Check if the request method is POST.
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { message: userInput } = await req.json();

    if (!userInput) {
      console.log("Error: No message was provided in the request body.");
      return new Response(JSON.stringify({ error: 'No message provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullPrompt = `
      You are FocusAssist, a friendly, warm, and supportive AI companion.
      Keep responses concise and under 75 words. Start responses with the symbol: ⟡

      User's thought: "${userInput}"
      Your supportive response:
    `;

    // Access the environment variable. Note: it's context.env, not process.env
    const API_KEY = context.env.get('GEMINI_API_KEY');

    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log("API Key found. Preparing to call Google AI.");
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
      return new Response(JSON.stringify({ error: 'Failed to get response from AI.' }), {
        status: apiResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const aiResponseText = responseData.candidates[0].content.parts[0].text;
    console.log("Successfully received response from AI.");

    return new Response(JSON.stringify({ reply: aiResponseText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Critical error inside function handler:", error.message);
    return new Response(JSON.stringify({ error: 'A critical error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// This config helps Netlify route requests correctly.
export const config = {
  path: "/api/ask-assistant",
};