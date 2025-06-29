// File: /api/text-to-speech.js

// This function calls the Gemini Text-to-Speech API endpoint directly
// using the Gemini TTS models (gemini-2.5-flash-preview-tts)

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // Use the correct Gemini TTS API endpoint
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: text
          }]
        }],
        generationConfig: {
          // For TTS models, we don't specify response_mime_type
          // The model automatically returns audio content
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini TTS API Error:', response.status, errorText);
      throw new Error(`Failed to generate audio: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract audio data from the response
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('No audio content generated');
    }

    const audioData = data.candidates[0].content.parts[0];
    
    if (!audioData.inlineData || !audioData.inlineData.data) {
      throw new Error('No audio data found in response');
    }

    // Convert base64 audio data to binary
    const audioBuffer = Buffer.from(audioData.inlineData.data, 'base64');

    // Return the audio file directly to the browser
    return new Response(audioBuffer, {
      status: 200,
      headers: { 
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString()
      },
    });

  } catch (error) {
    console.error("Error in Gemini text-to-speech function:", error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process text-to-speech.',
      details: error.message 
    }), { status: 500 });
  }
};

export const config = {
  path: "/api/text-to-speech",
};