// File: /api/text-to-speech.js

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { text, useWebSpeech = false } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    // If Web Speech API is requested, return instruction to use browser TTS
    if (useWebSpeech) {
      return new Response(JSON.stringify({ 
        useWebSpeech: true,
        text: text 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      console.error("FATAL: ELEVENLABS_API_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // Using Rachel voice (21m00Tcm4TlvDq8ikWAM) - a friendly female voice
    const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
    const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2', // Fast, high-quality model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Eleven Labs API Error:', errorText);
      
      // Return fallback instruction instead of throwing error
      return new Response(JSON.stringify({ 
        useWebSpeech: true,
        text: text,
        error: 'Eleven Labs failed, using fallback'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Eleven Labs returns audio directly as binary stream
    const audioBuffer = await response.arrayBuffer();

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error("No audio content was returned from Eleven Labs API.");
    }

    // Return the audio file directly to the browser
    return new Response(audioBuffer, {
      status: 200,
      headers: { 
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString()
      },
    });

  } catch (error) {
    console.error("Error in Eleven Labs text-to-speech function:", error);
    
    // Return fallback instruction instead of error
    return new Response(JSON.stringify({ 
      useWebSpeech: true,
      text: text || 'Hello',
      error: 'TTS service unavailable, using browser fallback'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/text-to-speech",
};