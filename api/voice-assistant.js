// File: /api/voice-assistant.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const OFFLINE_REPLY = "I'm having trouble connecting right now. Please check your connection and try again in a moment.";

const voiceAssistantTools = [
  {
    functionDeclarations: [
      {
        name: "navigateTo",
        description: "Navigate user to specific sections. Use immediately for navigation requests.",
        parameters: {
          type: "OBJECT",
          properties: {
            path: {
              type: "STRING",
              description: "Navigation destination",
              enum: ["/journal", "/learning", "/focus", "/tasks"]
            }
          },
          required: ["path"]
        }
      }
    ]
  }
];

function getSystemInstruction(mode) {
  const baseDate = `Today's date: ${new Date().toLocaleDateString('en-CA')}`;

  switch (mode) {
    case '/journal':
      return `You are Aeva, a compassionate AI companion for journaling. Listen deeply, ask thoughtful questions, and help users process emotions. Keep responses warm and gentle (20-45 seconds). ${baseDate}`;
    case '/focus':
      return `You are Aeva, a calm, minimally intrusive AI for focus mode. Keep responses brief (10-20 seconds) and avoid breaking concentration. Be a quiet, encouraging presence. ${baseDate}`;
    case '/learning':
      return `You are Aeva, an intelligent AI tutor. Explain concepts clearly, break down complex ideas, and encourage learning. Speak clearly at a good pace (20-40 seconds). ${baseDate}`;
    case '/tasks':
      return `You are Aeva, an efficient AI task manager. Help with organizing and planning tasks. Be direct and action-oriented (15-30 seconds). ${baseDate}`;
    default:
      return `You are Aeva, a warm AI companion helping people with ADHD and focus challenges. Be conversational, encouraging, and helpful (20-40 seconds). Use navigation tools when users mention specific features. ${baseDate}`;
  }
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { audio: audio_base64, mode = '/' } = body;

    if (!audio_base64) {
      return new Response(JSON.stringify({ error: 'No audio data provided' }), { status: 400 });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    // Offline fallback — no API key configured
    if (!API_KEY) {
      console.error('Missing GEMINI_API_KEY environment variable');
      return new Response(JSON.stringify({ reply: OFFLINE_REPLY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let genAI, model;
    try {
      genAI = new GoogleGenerativeAI(API_KEY);
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        tools: voiceAssistantTools
      });
    } catch (initError) {
      console.error('Failed to initialize Gemini:', initError);
      return new Response(JSON.stringify({ reply: OFFLINE_REPLY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const systemInstruction = getSystemInstruction(mode);
    const chat = model.startChat({
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] }
    });

    let result;
    try {
      result = await chat.sendMessage([
        "Listen to this audio message, transcribe it accurately, and then respond appropriately based on your instructions.",
        { inlineData: { mimeType: "audio/webm", data: audio_base64 } }
      ]);
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError);
      return new Response(JSON.stringify({ reply: OFFLINE_REPLY }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = result.response;
    const functionCalls = response.functionCalls();

    let finalResponseText;
    let toolResult = null;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
      } else {
        toolResult = { success: false, error: "I'm not sure how to help with that right now." };
      }

      let result2;
      try {
        result2 = await chat.sendMessage([{
          functionResponse: { name: call.name, response: { content: JSON.stringify(toolResult) } }
        }]);
        finalResponseText = result2.response.text();
      } catch (apiError) {
        console.error('Gemini follow-up call failed:', apiError);
        return new Response(JSON.stringify({ reply: OFFLINE_REPLY, toolResult }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      finalResponseText = response.text();
    }

    return new Response(JSON.stringify({ reply: finalResponseText, toolResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in voice assistant:", error);
    return new Response(JSON.stringify({ reply: OFFLINE_REPLY }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: "/api/voice-assistant" };
