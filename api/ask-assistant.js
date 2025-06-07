// File: /api/ask-assistant.js

// 1. We are now explicitly using the 'node-fetch' package
const fetch = require('node-fetch');

// 2. We are using the standard AWS Lambda handler format
exports.handler = async function(event, context) {
  // 3. The request method and body are now inside the 'event' object
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { message: userInput } = JSON.parse(event.body);

    if (!userInput) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No message provided' })
      };
    }
    
    const fullPrompt = `
      You are FocusAssist, a friendly, warm, and supportive AI companion.
      Your goal is to help users with their thoughts. Keep responses concise and under 75 words.
      If a user expresses severe distress, gently suggest they talk to a trusted person or a professional.
      Start your responses with the symbol: ⟡

      User's thought: "${userInput}"

      Your supportive response:
    `;

    // 4. Accessing the environment variable is still the same
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY environment variable is not set.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error.' })
      };
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    const apiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('Google AI API Error:', errorText);
      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({ error: 'Failed to get response from AI.' })
      };
    }

    const data = await apiResponse.json();
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // 5. The successful response format is also different
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: aiResponseText }),
      headers: { 'Content-Type': 'application/json' }
    };

  } catch (error) {
    console.error("Error inside handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while processing your request.' })
    };
  }
};