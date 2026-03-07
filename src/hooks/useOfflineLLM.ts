import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

export type OfflineLLMStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

export interface OfflineLLMState {
  status: OfflineLLMStatus;
  progress: number;
  progressFile: string;
  error: string | null;
  device: string;
  modelSize: string; // '1B' | '3B' | ''
}

const AEVA_SYSTEM_PROMPT = `You are Aeva, a helpful AI companion. Be concise, encouraging, and practical.`;

const AEVA_JOURNAL_PROMPT = `You are Aeva, a compassionate journal companion. Start responses with ⟡. Be warm, ask open-ended questions.`;

// ── Shared singleton state (survives tab switches) ──
let workerSingleton: Worker | null = null;
let sharedState: OfflineLLMState = {
  status: 'idle',
  progress: 0,
  progressFile: '',
  error: null,
  device: 'webgpu',
  modelSize: '',
};
let listeners: Set<() => void> = new Set();

function setSharedState(updater: (s: OfflineLLMState) => OfflineLLMState) {
  sharedState = updater(sharedState);
  listeners.forEach(l => l());
}

function getSnapshot() {
  return sharedState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getWorker(): Worker {
  if (!workerSingleton) {
    workerSingleton = new Worker(new URL('../workers/llm.worker.ts', import.meta.url), { type: 'module' });

    workerSingleton.addEventListener('message', (event: MessageEvent) => {
      const msg = event.data;

      if (msg.type === 'loading') {
        setSharedState(s => ({ ...s, status: 'loading', progress: 0 }));
      } else if (msg.type === 'device') {
        setSharedState(s => ({ ...s, device: msg.device }));
      } else if (msg.type === 'model') {
        setSharedState(s => ({ ...s, modelSize: msg.model }));
      } else if (msg.type === 'progress') {
        setSharedState(s => ({ ...s, status: 'loading', progress: msg.value, progressFile: msg.file ?? '' }));
      } else if (msg.type === 'ready') {
        setSharedState(s => ({ ...s, status: 'ready', progress: 100, error: null }));
      } else if (msg.type === 'token') {
        pendingCallbacks.get(msg.id)?.onToken(msg.token);
      } else if (msg.type === 'result') {
        pendingCallbacks.get(msg.id)?.resolve();
        pendingCallbacks.delete(msg.id);
        setSharedState(s => ({ ...s, status: 'ready' }));
      } else if (msg.type === 'error') {
        const cb = pendingCallbacks.get(msg.id);
        if (cb) {
          cb.reject(new Error(msg.error));
          pendingCallbacks.delete(msg.id);
        }
        setSharedState(s => ({ ...s, status: msg.id ? 'ready' : 'error', error: msg.error }));
      }
    });
  }
  return workerSingleton;
}

// Shared pending callbacks (generation promises)
const pendingCallbacks = new Map<string, {
  resolve: () => void;
  reject: (e: Error) => void;
  onToken: (token: string) => void;
}>();

export const useOfflineLLM = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = getWorker();
  }, []);

  const load = useCallback(() => {
    const s = getSnapshot();
    if (s.status === 'idle' || s.status === 'error') {
      setSharedState(prev => ({ ...prev, status: 'loading', progress: 0, error: null }));
      getWorker().postMessage({ type: 'load' });
    }
  }, []);

  const generate = useCallback(async (
    userMessage: string,
    history: { type: 'user' | 'ai'; content: string }[] = [],
    mode: 'assistant' | 'journal' = 'assistant',
    onToken?: (token: string) => void,
  ): Promise<void> => {
    const s = getSnapshot();
    if (s.status !== 'ready') {
      throw new Error('Model not ready');
    }

    setSharedState(prev => ({ ...prev, status: 'generating' }));

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
      pendingCallbacks.set(id, {
        resolve,
        reject,
        onToken: onToken ?? (() => {}),
      });
      getWorker().postMessage({ type: 'generate', payload: { messages, id } });
    });
  }, []);

  const stop = useCallback(() => {
    getWorker().postMessage({ type: 'stop' });
  }, []);

  return { ...state, load, generate, stop };
};
