import { useEffect, useRef, useState, useCallback } from 'react';

export type OfflineLLMStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

export interface OfflineLLMState {
  status: OfflineLLMStatus;
  progress: number;
  progressFile: string;
  error: string | null;
  device: string;
}

const AEVA_SYSTEM_PROMPT = `You are Aeva, a helpful AI companion. Be concise, encouraging, and practical.`;

const AEVA_JOURNAL_PROMPT = `You are Aeva, a compassionate journal companion. Start responses with ⟡. Be warm, ask open-ended questions.`;

let workerSingleton: Worker | null = null;
let workerRefCount = 0;

export const useOfflineLLM = () => {
  const [state, setState] = useState<OfflineLLMState>({
    status: 'idle',
    progress: 0,
    progressFile: '',
    error: null,
    device: 'wasm',
  });

  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, {
    resolve: () => void;
    reject: (e: Error) => void;
    onToken: (token: string) => void;
  }>>(new Map());

  useEffect(() => {
    if (!workerSingleton) {
      workerSingleton = new Worker(new URL('../workers/llm.worker.ts', import.meta.url), { type: 'module' });
    }
    workerRef.current = workerSingleton;
    workerRefCount++;

    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === 'loading') {
        setState(s => ({ ...s, status: 'loading', progress: 0 }));
      } else if (msg.type === 'device') {
        setState(s => ({ ...s, device: msg.device }));
      } else if (msg.type === 'progress') {
        setState(s => ({ ...s, status: 'loading', progress: msg.value, progressFile: msg.file ?? '' }));
      } else if (msg.type === 'ready') {
        setState(s => ({ ...s, status: 'ready', progress: 100, error: null }));
      } else if (msg.type === 'token') {
        const pending = pendingRef.current.get(msg.id);
        if (pending) {
          pending.onToken(msg.token);
        }
      } else if (msg.type === 'result') {
        const pending = pendingRef.current.get(msg.id);
        if (pending) {
          pending.resolve();
          pendingRef.current.delete(msg.id);
        }
        setState(s => ({ ...s, status: 'ready' }));
      } else if (msg.type === 'error') {
        const pending = pendingRef.current.get(msg.id);
        if (pending) {
          pending.reject(new Error(msg.error));
          pendingRef.current.delete(msg.id);
        }
        setState(s => ({ ...s, status: msg.id ? 'ready' : 'error', error: msg.error }));
      }
    };

    workerRef.current.addEventListener('message', handleMessage);

    return () => {
      workerRef.current?.removeEventListener('message', handleMessage);
      workerRefCount--;
    };
  }, []);

  const load = useCallback(() => {
    if (state.status === 'idle' || state.status === 'error') {
      setState(s => ({ ...s, status: 'loading', progress: 0, error: null }));
      workerRef.current?.postMessage({ type: 'load' });
    }
  }, [state.status]);

  const generate = useCallback(async (
    userMessage: string,
    history: { type: 'user' | 'ai'; content: string }[] = [],
    mode: 'assistant' | 'journal' = 'assistant',
    onToken?: (token: string) => void,
  ): Promise<void> => {
    if (!workerRef.current || state.status !== 'ready') {
      throw new Error('Model not ready');
    }

    setState(s => ({ ...s, status: 'generating' }));

    const systemPrompt = mode === 'journal' ? AEVA_JOURNAL_PROMPT : AEVA_SYSTEM_PROMPT;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-4).map(h => ({
        role: h.type === 'user' ? 'user' : 'assistant',
        content: h.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return new Promise<void>((resolve, reject) => {
      pendingRef.current.set(id, {
        resolve,
        reject,
        onToken: onToken ?? (() => {}),
      });
      workerRef.current!.postMessage({ type: 'generate', payload: { messages, id } });
    });
  }, [state.status]);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' });
  }, []);

  return { ...state, load, generate, stop };
};
