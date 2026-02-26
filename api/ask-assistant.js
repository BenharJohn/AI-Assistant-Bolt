// File: /api/ask-assistant.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const OFFLINE_RESPONSES = {
  assistant: "I'm having trouble connecting right now — my AI brain needs the internet to work fully. You can still use all the other features of the app! Try again in a moment.",
  journal: "⟡ I'm having trouble connecting right now. But journaling on your own is just as powerful — sometimes writing without a response helps you find your own answers. I'll be back soon.",
};

const assistantTools = [
  {
    functionDeclarations: [
      {
        name: "navigateTo",
        description: "CRITICAL: Use this tool immediately when users request to go somewhere or want to access specific functionality. Trigger phrases include: 'show me my journal', 'go to journal', 'i want to journal', 'talk about my day/feelings', 'i need to focus', 'focus mode', 'start focusing', 'help me learn', 'explain something', 'show me tasks', 'task manager', 'add a task', 'check my tasks', or ANY similar request for a specific section/feature.",
        parameters: {
          type: "OBJECT",
          properties: {
            path: {
              type: "STRING",
              description: "Where to navigate: '/journal' for any mention of journaling, reflection, emotions, feelings, talking about day/life; '/learning' for explanations, learning, studying, help understanding; '/focus' for focus, concentration, work sessions, distraction-free time; '/tasks' for task management, adding tasks, checking schedule.",
              enum: ["/journal", "/learning", "/focus", "/tasks"]
            }
          },
          required: ["path"]
        }
      }
    ]
  }
];

export default async (req, context) => {
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });

  try {
    const { message: userInput, history, mode = 'journal' } = await req.json();
    if (!userInput) return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400 });

    const API_KEY = process.env.GEMINI_API_KEY;

    // Offline fallback — no API key configured
    if (!API_KEY) {
      return new Response(JSON.stringify({ reply: OFFLINE_RESPONSES[mode] || OFFLINE_RESPONSES.assistant }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let genAI, model, systemInstruction;

    try {
      genAI = new GoogleGenerativeAI(API_KEY);

      if (mode === 'assistant') {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools: assistantTools });
        systemInstruction = `You are Aeva, a warm, intelligent, and proactive AI companion designed to help people with ADHD, dyslexia, and focus challenges succeed in their daily lives.

CRITICAL NAVIGATION RULES - FOLLOW THESE EXACTLY:
🔥 ALWAYS use the navigateTo tool when users say ANY of these phrases:
   - "show me my journal" → /journal
   - "go to journal" → /journal
   - "i want to journal" → /journal
   - "talk about my day" → /journal
   - "i'm feeling" → /journal
   - "i wanna focus" → /focus
   - "i need to focus" → /focus
   - "focus mode" → /focus
   - "start focusing" → /focus
   - "help me learn" → /learning
   - "explain" → /learning
   - "show me tasks" → /tasks
   - "my tasks" → /tasks
   - "task manager" → /tasks

🔥 NEVER ask for clarification on navigation - if someone mentions any of the above, USE THE TOOL IMMEDIATELY.

CORE PERSONALITY:
- Be conversational, encouraging, and genuinely helpful
- Understand context and read between the lines
- Celebrate small wins and offer gentle guidance for challenges

RESPONSE STYLE:
- After using navigateTo, tell them you're taking them there
- Match their energy and tone while staying supportive
- Use natural, conversational language
- Today's date is ${new Date().toLocaleDateString('en-CA')}`;
      } else {
        model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        systemInstruction = `You are Aeva, a compassionate, wise, and deeply empathetic AI companion - like talking to a trusted friend who truly listens. You create a safe, non-judgmental space for reflection and emotional processing.

CORE APPROACH:
- Always start responses with the symbol: ⟡
- Listen deeply and reflect back what you hear
- Ask thoughtful, open-ended questions that help users explore their feelings
- Validate their experiences without trying to "fix" everything
- Help them process emotions, thoughts, and daily experiences

CONVERSATION STYLE:
- Use warm, gentle language that feels natural and caring
- Show genuine curiosity about their inner world
- Offer gentle perspective when helpful, but prioritize understanding over advice
- Remember that sometimes people just need to be heard`;
      }
    } catch (initError) {
      console.error('Failed to initialize Gemini:', initError);
      return new Response(JSON.stringify({ reply: OFFLINE_RESPONSES[mode] || OFFLINE_RESPONSES.assistant }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const firstUserIndex = (history || []).findIndex(entry => entry.type === 'user');
    const validHistory = firstUserIndex === -1 ? [] : history.slice(firstUserIndex);
    const conversationHistory = validHistory.map(entry => ({ role: entry.type === 'user' ? 'user' : 'model', parts: [{ text: entry.content }] }));

    const chat = model.startChat({ history: conversationHistory, systemInstruction: { role: "system", parts: [{ text: systemInstruction }] } });

    let result;
    try {
      result = await chat.sendMessage(userInput);
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError);
      return new Response(JSON.stringify({ reply: OFFLINE_RESPONSES[mode] || OFFLINE_RESPONSES.assistant }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let toolResult;

      if (call.name === 'navigateTo') {
        toolResult = { success: true, path: call.args.path, didNavigate: true };
      } else {
        toolResult = { success: false, error: "I'm not sure how to help with that right now." };
      }

      let result2;
      try {
        result2 = await chat.sendMessage([{ functionResponse: { name: call.name, response: { content: JSON.stringify(toolResult) } } }]);
      } catch (apiError) {
        console.error('Gemini follow-up call failed:', apiError);
        return new Response(JSON.stringify({ reply: OFFLINE_RESPONSES[mode] || OFFLINE_RESPONSES.assistant, toolResult }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const finalResponseText = result2.response.text();
      return new Response(JSON.stringify({ reply: finalResponseText, toolResult }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      const aiResponseText = response.text();
      return new Response(JSON.stringify({ reply: aiResponseText }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error("Critical error in ask-assistant:", error);
    return new Response(JSON.stringify({ reply: "I'm having a moment of confusion. Could you try that again?" }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: "/api/ask-assistant" };
