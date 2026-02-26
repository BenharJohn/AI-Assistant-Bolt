import { useEffect, useRef, useState, useCallback } from 'react';

export type OfflineLLMStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

export interface OfflineLLMState {
  status: OfflineLLMStatus;
  /** Download progress 0-100 while loading */
  progress: number;
  /** Current file being downloaded */
  progressFile: string;
  error: string | null;
}

const AEVA_SYSTEM_PROMPT = `You are Aeva, a warm and supportive AI companion designed to help people with ADHD and focus challenges. You are running offline right now, so keep responses concise and helpful. Be encouraging, understanding, and practical. Do not use tools or navigate pages in offline mode — just have a natural conversation.`;

let workerSingleton: Worker | null = null;
let workerRefCount = 0;

export const useOfflineLLM = () => {
  const [state, setState] = useState<OfflineLLMState>({
    status: 'idle',
    progress: 0,
    progressFile: '',
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, { resolve: (text: string) => void; reject: (e: Error) => void }>>(new Map());

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
      } else if (msg.type === 'progress') {
        setState(s => ({ ...s, status: 'loading', progress: msg.value, progressFile: msg.file ?? '' }));
      } else if (msg.type === 'ready') {
        setState(s => ({ ...s, status: 'ready', progress: 100, error: null }));
      } else if (msg.type === 'result') {
        const pending = pendingRef.current.get(msg.id);
        if (pending) {
          pending.resolve(msg.text);
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
      // Keep worker alive — it's expensive to reload the model
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
    history: { type: 'user' | 'ai'; content: string }[] = []
  ): Promise<string> => {
    if (!workerRef.current || state.status !== 'ready') {
      throw new Error('Model not ready');
    }

    setState(s => ({ ...s, status: 'generating' }));

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: AEVA_SYSTEM_PROMPT },
      ...history.slice(-4).map(h => ({
        role: h.type === 'user' ? 'user' : 'assistant',
        content: h.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return new Promise<string>((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject });
      workerRef.current!.postMessage({ type: 'generate', payload: { messages, id } });
    });
  }, [state.status]);

  return { ...state, load, generate };
};
