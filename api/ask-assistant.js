// File: /api/ask-assistant.js

// This is our serverless function. It runs on a server, not in the browser.
export default async function handler(req, res) {
  // 1. We only accept POST requests for security.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the user's message from the request sent by our React app.
  const userInput = req.body.message;

  if (!userInput) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // 3. This is our "Prompt Engineering". We give the LLM a personality and instructions.
  const fullPrompt = `
    You are FocusAssist, a friendly, warm, and supportive AI companion in a mental wellness and productivity app.
    Your goal is to help users with their thoughts, feelings, and tasks.
    - Be empathetic and validating.
    - Keep responses concise, helpful, and under 75 words.
    - If a user expresses severe distress, gently suggest they talk to a trusted person or a professional and provide a general crisis line number. Do not act as a therapist.
    - Start your responses with a special symbol: ⟡

    User's thought: "${userInput}"

    Your supportive response:
  `;

  try {
    // 4. We securely get our API key from the server's environment variables.
    const API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    // 5. We call the Google AI API.
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
      }),
    });

    if (!response.ok) {
      // If the API call fails, we send back an error.
      const errorText = await response.text();
      console.error('Google AI API Error:', errorText);
      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();

    // 6. We extract the AI's generated text from the response.
    const aiResponseText = data.candidates[0].content.parts[0].text;

    // 7. We send the AI's clean response back to our React app.
    res.status(200).json({ reply: aiResponseText });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}