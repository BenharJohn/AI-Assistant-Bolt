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

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error("FATAL: GEMINI_API_KEY not set.");
      return new Response(JSON.stringify({ error: 'Server configuration error.' }), { status: 500 });
    }

    // Initialize Gemini AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Use Gemini TTS model - TTS models automatically output audio
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-tts"
      // No generationConfig needed - TTS models automatically return audio
    });

    // Generate audio from text - TTS models expect direct text input
    const result = await model.generateContent(text);

    const response = result.response;
    
    // Check if we have audio data
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
      throw new Error('No audio content generated');
    }

    // Extract audio data from the response
    const audioData = response.candidates[0].content.parts[0];
    
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