// File: /api/text-to-speech.js

// This function does NOT use the GoogleGenerativeAI library.
// It calls the specific Google Cloud Text-to-Speech REST API endpoint directly.

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY; // We use the same Google AI API key
    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // This is the correct, dedicated endpoint for Google's Text-to-Speech API
    const API_URL = `https://texttospeech.googleapis.com/v1beta/text:synthesize?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // The request body must be structured specifically for the TTS API
      body: JSON.stringify({
        input: {
          text: text,
        },
        // We can select a specific voice. 'en-US-Studio-O' is a high-quality, friendly female voice.
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Studio-O',
        },
        audioConfig: {
          audioEncoding: 'MP3', // Request the audio in MP3 format
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google TTS API Error:', errorData);
      throw new Error('Failed to generate audio from Google TTS.');
    }

    const data = await response.json();
    
    // The API returns the audio as a base64 encoded string in the `audioContent` field
    const audioContent = data.audioContent;
    if (!audioContent) {
      throw new Error("No audio content was returned from the API.");
    }

    // Convert the base64 string into a binary Buffer
    const audioBuffer = Buffer.from(audioContent, 'base64');

    // Return the audio file directly to the browser
    return new Response(audioBuffer, {
      status: 200,
      headers: { 
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString()
      },
    });

  } catch (error) {
    console.error("Error in Google text-to-speech function:", error);
    return new Response(JSON.stringify({ 
        error: 'Failed to process text-to-speech.',
        details: error.message 
    }), { status: 500 });
  }
};

export const config = {
  path: "/api/text-to-speech",
};
