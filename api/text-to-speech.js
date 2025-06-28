// File: /api/text-to-speech.js

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    const API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!API_KEY) {
      console.error("FATAL: ELEVENLABS_API_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // You can find different voice IDs on the ElevenLabs website. 'Rachel' has a clear, friendly voice.
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; 
    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      console.error('ElevenLabs API Error:', await response.text());
      throw new Error('Failed to generate audio.');
    }

    // Return the audio file directly to the browser
    const audioBlob = await response.blob();
    return new Response(audioBlob, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(JSON.stringify({ error: 'Failed to process text-to-speech.' }), { status: 500 });
  }
};

export const config = {
  path: "/api/text-to-speech",
};
