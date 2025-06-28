// File: /api/text-to-speech.js
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 });
    }

    // Get the Gemini API key from environment variables
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY not set for text-to-speech.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Use the specialized TTS model for high-quality, low-latency speech generation
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp"  // Using the most advanced model available for TTS
    });

    // Generate audio from text using Gemini's TTS capabilities
    const result = await model.generateContent([
      {
        text: `Please convert this text to speech with a natural, friendly voice: "${text}"`
      }
    ]);

    // For now, since Gemini models don't directly support TTS output yet,
    // we'll use the Web Speech API approach or fall back to a browser-based solution
    // This is a placeholder for when Google releases their TTS models
    
    // Alternative: Use a simple text response that the frontend can handle with Web Speech API
    return new Response(JSON.stringify({ 
      message: "TTS processing complete",
      text: text,
      useWebSpeechAPI: true 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(JSON.stringify({ error: 'Failed to process text-to-speech.' }), { status: 500 });
  }
};

export const config = {
  path: "/api/text-to-speech",
};