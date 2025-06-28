import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const location = useLocation();
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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const vadIntervalRef = useRef<number | null>(null);

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

  // Voice Activity Detection setup
  const setupVAD = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current) return;

    const source = audioContextRef.current.createMediaStreamSource(stream);
    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    
    source.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let silenceStart = 0;
    const SILENCE_THRESHOLD = 30; // Adjust based on testing
    const SILENCE_DURATION = 1500; // 1.5 seconds of silence before stopping

    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      
      if (average < SILENCE_THRESHOLD) {
        if (silenceStart === 0) {
          silenceStart = Date.now();
        } else if (Date.now() - silenceStart > SILENCE_DURATION) {
          // Stop recording due to silence
          stopListening();
          return;
        }
      } else {
        silenceStart = 0; // Reset silence timer on voice activity
      }
    };

    vadIntervalRef.current = window.setInterval(checkAudioLevel, 100);
  }, []);

  const cleanupVAD = useCallback(() => {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    analyserRef.current = null;
  }, []);

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

      // Setup Voice Activity Detection
      setupVAD(stream);

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
  }, [updateState, initializeAudio, setupVAD]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && state.isListening) {
      mediaRecorderRef.current.stop();
      updateState({ isListening: false, isProcessing: true });
    }
    
    cleanupVAD();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [state.isListening, updateState, cleanupVAD]);

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

      // Send to voice assistant with current page context
      const voiceResponse = await fetch('/api/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audio: base64Audio, 
          mode: location.pathname 
        })
      });

      // Handle non-successful responses by extracting detailed error message
      if (!voiceResponse.ok) {
        let errorMessage = 'Voice assistant request failed';
        try {
          const errorData = await voiceResponse.json();
          errorMessage = errorData.error || errorData.message || `HTTP ${voiceResponse.status}: ${voiceResponse.statusText}`;
        } catch {
          // If we can't parse the error response, fall back to status text
          errorMessage = `HTTP ${voiceResponse.status}: ${voiceResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const voiceData: VoiceAIResponse = await voiceResponse.json();
      
      if (voiceData.error) {
        throw new Error(voiceData.error);
      }

      // Handle navigation if needed
      if (voiceData.toolResult?.didNavigate && voiceData.toolResult.path) {
        navigate(voiceData.toolResult.path);
      }

      const textToSpeak = voiceData.reply || voiceData.toolResult?.result || 'I got your message';

      // Convert response text to speech
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
  }, [navigate, updateState, location.pathname]);

  const convertTextToSpeech = useCallback(async (text: string) => {
    try {
      updateState({ isPlaying: true });

      const ttsResponse = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!ttsResponse.ok) throw new Error('Text-to-speech failed');

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        updateState({ isPlaying: false });
        URL.revokeObjectURL(audioUrl);
        
        // AUTO-RESTART: Start listening again after AI finishes speaking
        // Only restart if we're on a page that benefits from continuous conversation
        const continuousPages = ['/', '/journal', '/companion'];
        if (continuousPages.includes(location.pathname)) {
          setTimeout(() => {
            if (!state.isProcessing && !state.isPlaying) {
              startListening();
            }
          }, 500); // Small delay to prevent immediate restart
        }
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
  }, [updateState, location.pathname, startListening, state.isProcessing, state.isPlaying]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupVAD();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [cleanupVAD]);

  return {
    ...state,
    toggleListening,
    clearError,
    isActive: state.isListening || state.isProcessing || state.isPlaying
  };
};