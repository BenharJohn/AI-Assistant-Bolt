type WorkerMessage =
  | { type: 'load'; skipWarmup?: boolean; preferLargeModel?: boolean }
  | { type: 'generate'; payload: { messages: { role: string; content: string }[]; id: string } }
  | { type: 'stop' };

// Engine state
let engine: any = null;
let currentId: string | null = null;
let shouldStop = false;
let activeModel = '';

// Models — 1B for normal devices, 3B for powerful ones
const MODEL_1B = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const MODEL_3B = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

async function hasWebGPU(): Promise<boolean> {
  try {
    if ('gpu' in navigator) {
      const gpu = (navigator as any).gpu;
      if (gpu) {
        const adapter = await gpu.requestAdapter();
        return !!adapter;
      }
    }
  } catch {}
  return false;
}

async function detectBestModel(): Promise<string> {
  try {
    const gpu = (navigator as any).gpu;
    if (!gpu) return MODEL_1B;

    const adapter = await gpu.requestAdapter();
    if (!adapter) return MODEL_1B;

    // Check available VRAM via adapter limits
    const maxBufferSize = (adapter as any).limits?.maxBufferSize ?? 0;
    const maxStorageBufferSize = (adapter as any).limits?.maxStorageBufferBindingSize ?? 0;

    // 3B model needs ~1.5GB VRAM — use it if device reports enough capacity
    // maxBufferSize > 1GB is a reasonable heuristic for capable GPUs
    const hasEnoughVRAM = maxBufferSize > 1_000_000_000 || maxStorageBufferSize > 500_000_000;

    // Also check device memory (RAM) if available
    const deviceMemory = (navigator as any).deviceMemory ?? 4; // defaults to 4GB if unknown

    if (hasEnoughVRAM && deviceMemory >= 6) {
      return MODEL_3B;
    }

    return MODEL_1B;
  } catch {
    return MODEL_1B;
  }
}

async function loadModel(preferLargeModel = false) {
  self.postMessage({ type: 'loading', progress: 0 });

  try {
    const webgpuAvailable = await hasWebGPU();

    if (!webgpuAvailable) {
      self.postMessage({
        type: 'error',
        id: null,
        error: 'WebGPU is not available in this browser. Please use Chrome 113+ or Edge 113+ for offline AI.',
      });
      return;
    }

    self.postMessage({ type: 'device', device: 'webgpu' });

    // Pick model based on device capability
    const selectedModel = preferLargeModel ? MODEL_3B : await detectBestModel();
    activeModel = selectedModel;
    const modelLabel = selectedModel === MODEL_3B ? '3B' : '1B';

    self.postMessage({ type: 'model', model: modelLabel });

    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    engine = await CreateMLCEngine(selectedModel, {
      initProgressCallback: (progress: any) => {
        const pct = Math.round((progress.progress ?? 0) * 100);
        self.postMessage({ type: 'progress', value: pct, file: progress.text ?? '' });
      },
    });

    self.postMessage({ type: 'ready' });
  } catch (err: any) {
    console.error('Model loading failed:', err);
    const message = err?.message ?? 'Failed to load model';
    const isOOM = message.toLowerCase().includes('memory') ||
                  message.toLowerCase().includes('oom') ||
                  message.toLowerCase().includes('allocation') ||
                  err?.name === 'RangeError';
    const errorMsg = isOOM
      ? 'Not enough memory for this model. Try closing other tabs or using a device with more RAM.'
      : message;
    self.postMessage({ type: 'error', id: null, error: errorMsg });
  }
}

async function generateResponse(messages: { role: string; content: string }[], id: string) {
  if (!engine) {
    self.postMessage({ type: 'error', id, error: 'Model not loaded' });
    return;
  }

  currentId = id;
  shouldStop = false;

  try {
    const maxTokens = activeModel === MODEL_3B ? 300 : 200;

    const chunks = await engine.chat.completions.create({
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of chunks) {
      if (shouldStop) {
        engine.interruptGenerate();
        break;
      }
      const token = chunk.choices[0]?.delta?.content ?? '';
      if (token) {
        self.postMessage({ type: 'token', id, token });
      }
    }

    self.postMessage({ type: 'result', id });
  } catch (err: any) {
    if (!shouldStop) {
      self.postMessage({ type: 'error', id, error: err?.message ?? 'Generation failed' });
    }
  }

  currentId = null;
  shouldStop = false;
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'load') {
    await loadModel(msg.preferLargeModel);
  } else if (msg.type === 'generate') {
    await generateResponse(msg.payload.messages, msg.payload.id);
  } else if (msg.type === 'stop') {
    shouldStop = true;
    if (engine) {
      try { engine.interruptGenerate(); } catch {}
    }
    if (currentId) {
      self.postMessage({ type: 'result', id: currentId });
    }
  }
});
