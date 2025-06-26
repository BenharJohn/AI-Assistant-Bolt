import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface VoiceAIResponse {
  reply?: string;
  toolResult?: {
    success: boolean;
    path?: string;
    didNavigate?: boolean;
    result?: string;
    error?: string;
  };
  error?: string;
}

interface VoiceAIState {
  isListening: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  error: string | null;
  lastResponse: string | null;
}

export const useVoiceAI = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<VoiceAIState>({
    isListening: false,
    isProcessing: false,
    isPlaying: false,
    error: null,
    lastResponse: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateState = useCallback((updates: Partial<VoiceAIState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const initializeAudio = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      return true;
    } catch (error) {
      console.error('Audio initialization failed:', error);
      updateState({ error: 'Could not initialize audio system' });
      return false;
    }
  }, [updateState]);

  const startListening = useCallback(async () => {
    try {
      updateState({ error: null });
      
      if (!(await initializeAudio())) return;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        processAudio();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      updateState({ isListening: true });

    } catch (error) {
      console.error('Microphone access failed:', error);
      updateState({ 
        error: 'Could not access microphone. Please check permissions.',
        isListening: false 
      });
    }
  }, [updateState, initializeAudio]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && state.isListening) {
      mediaRecorderRef.current.stop();
      updateState({ isListening: false, isProcessing: true });
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [state.isListening, updateState]);

  const processAudio = useCallback(async () => {
    try {
      if (audioChunksRef.current.length === 0) {
        updateState({ isProcessing: false, error: 'No audio recorded' });
        return;
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64 for API
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // STEP 1 & 2: Send to voice assistant for transcription and AI processing
      const voiceResponse = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: base64Audio
      });

      if (!voiceResponse.ok) throw new Error('Voice assistant request failed');

      const voiceData: VoiceAIResponse = await voiceResponse.json();
      
      if (voiceData.error) {
        throw new Error(voiceData.error);
      }

      // Handle navigation if needed
      if (voiceData.toolResult?.didNavigate && voiceData.toolResult.path) {
        navigate(voiceData.toolResult.path);
      }

      const textToSpeak = voiceData.reply || voiceData.toolResult?.result || 'I got your message';

      // STEP 3: Convert response text to speech using existing TTS API
      await convertTextToSpeech(textToSpeak);

      updateState({ 
        isProcessing: false,
        lastResponse: textToSpeak,
        error: null
      });

    } catch (error) {
      console.error('Audio processing failed:', error);
      updateState({ 
        isProcessing: false, 
        error: error instanceof Error ? error.message : 'Failed to process audio. Please try again.' 
      });
    }
  }, [navigate, updateState]);

  const convertTextToSpeech = useCallback(async (text: string) => {
    try {
      updateState({ isPlaying: true });

      // Use the existing text-to-speech API
      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!ttsResponse.ok) throw new Error('Text-to-speech failed');

      // Get audio blob from TTS response
      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        updateState({ isPlaying: false });
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        updateState({ isPlaying: false, error: 'Could not play audio response' });
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error('Text-to-speech failed:', error);
      updateState({ isPlaying: false, error: 'Could not generate speech response' });
    }
  }, [updateState]);

  const toggleListening = useCallback(() => {
    if (state.isListening) {
      stopListening();
    } else if (!state.isProcessing && !state.isPlaying) {
      startListening();
    }
  }, [state.isListening, state.isProcessing, state.isPlaying, startListening, stopListening]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  return {
    ...state,
    toggleListening,
    clearError,
    isActive: state.isListening || state.isProcessing || state.isPlaying
  };
};