// File: /api/ask-assistant.js

export default async function handler(req, res) {
  // 1. We only accept POST requests.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get the user's message.
  const userInput = req.body.message;

  if (!userInput) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // 3. Define the prompt for the AI.
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
    // 4. Securely get the API key from server environment variables.
    const API_KEY = process.env.GEMINI_API_KEY;

    // Check if the API key is missing. This is a common deployment error.
    if (!API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set.");
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;

    // 5. Call the Google AI API.
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
      const errorText = await response.text();
      console.error('Google AI API Error:', errorText);
      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();

    // 6. Extract the AI's response text.
    const aiResponseText = data.candidates[0].content.parts[0].text;

    // 7. Send the response back to the app.
    res.status(200).json({ reply: aiResponseText });

  } catch (error) {
    console.error("Error in serverless function:", error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}
