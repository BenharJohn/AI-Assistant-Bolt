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

    // Initialize Gemini AI client with the Live model
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Use Gemini 2.5 Flash Live model for audio generation
    const model = genAI.getGenerativeModel({ 
      model: "gemini-live-2.5-flash-preview"
    });

    // Generate audio from text using the Live model
    const result = await model.generateContent([
      {
        text: `Please convert the following text to natural-sounding speech: "${text}"`
      }
    ]);

    const response = result.response;
    
    // Check if we have audio data in the response
    if (!response.candidates || !response.candidates[0] || !response.candidates[0].content) {
      throw new Error('No audio content generated');
    }

    // Look for audio data in the response parts
    const parts = response.candidates[0].content.parts;
    let audioData = null;
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.startsWith('audio/')) {
        audioData = part.inlineData;
        break;
      }
    }
    
    if (!audioData || !audioData.data) {
      throw new Error('No audio data found in response');
    }

    // Convert base64 audio data to binary
    const audioBuffer = Buffer.from(audioData.data, 'base64');

    // Determine the content type based on the mime type
    const contentType = audioData.mimeType || 'audio/wav';

    // Return the audio file directly to the browser
    return new Response(audioBuffer, {
      status: 200,
      headers: { 
        'Content-Type': contentType,
        'Content-Length': audioBuffer.length.toString()
      },
    });

  } catch (error) {
    console.error("Error in Gemini Live text-to-speech function:", error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process text-to-speech.',
      details: error.message 
    }), { status: 500 });
  }
};

export const config = {
  path: "/api/text-to-speech",
};