type WorkerMessage =
  | { type: 'load'; skipWarmup?: boolean }
  | { type: 'generate'; payload: { messages: { role: string; content: string }[]; id: string } }
  | { type: 'stop' };

// Engine state
let webllmEngine: any = null;
let transformersGenerator: any = null;
let useWebLLM = false;
let currentId: string | null = null;
let shouldStop = false;

const WEBLLM_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const TRANSFORMERS_MODEL = 'onnx-community/Llama-3.2-1B-Instruct';

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

async function loadModel(skipWarmup = false) {
  self.postMessage({ type: 'loading', progress: 0 });

  try {
    const webgpuAvailable = await hasWebGPU();

    if (webgpuAvailable) {
      // ── WebLLM (WebGPU) — fast, GPU-accelerated ──
      useWebLLM = true;
      self.postMessage({ type: 'device', device: 'webgpu' });

      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

      webllmEngine = await CreateMLCEngine(WEBLLM_MODEL, {
        initProgressCallback: (progress: any) => {
          const pct = Math.round((progress.progress ?? 0) * 100);
          self.postMessage({ type: 'progress', value: pct, file: progress.text ?? '' });
        },
      });

      self.postMessage({ type: 'ready' });
    } else {
      // ── Transformers.js (WASM) — fallback for no WebGPU ──
      useWebLLM = false;
      self.postMessage({ type: 'device', device: 'wasm' });

      const { pipeline, TextStreamer } = await import('@huggingface/transformers');

      transformersGenerator = await pipeline('text-generation', TRANSFORMERS_MODEL, {
        dtype: 'q4f16',
        device: 'wasm',
        session_options: { graphOptimizationLevel: 'all' },
        progress_callback: (info: any) => {
          if (info.status === 'progress') {
            self.postMessage({ type: 'progress', value: Math.round(info.progress ?? 0), file: info.file });
          } else if (info.status === 'done') {
            self.postMessage({ type: 'progress', value: 100, file: info.file });
          }
        },
      });

      // Warm-up inference (skip on mobile to save memory)
      if (!skipWarmup) {
        await transformersGenerator([{ role: 'user', content: 'hi' }], { max_new_tokens: 1 });
      }

      self.postMessage({ type: 'ready' });
    }
  } catch (err: any) {
    console.error('Model loading failed:', err);
    const message = err?.message ?? 'Failed to load model';
    const isOOM = message.toLowerCase().includes('memory') ||
                  message.toLowerCase().includes('oom') ||
                  message.toLowerCase().includes('allocation') ||
                  err?.name === 'RangeError';
    const errorMsg = isOOM
      ? 'Not enough memory to load the AI model. Try closing other tabs or using a desktop browser.'
      : message;
    self.postMessage({ type: 'error', id: null, error: errorMsg });
  }
}

async function generateWebLLM(messages: { role: string; content: string }[], id: string) {
  try {
    const chunks = await webllmEngine.chat.completions.create({
      messages,
      max_tokens: 200,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of chunks) {
      if (shouldStop) {
        webllmEngine.interruptGenerate();
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
}

async function generateTransformers(messages: { role: string; content: string }[], id: string) {
  try {
    const { TextStreamer } = await import('@huggingface/transformers');

    const streamer = new TextStreamer(transformersGenerator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token: string) => {
        if (shouldStop) return false;
        self.postMessage({ type: 'token', id, token });
      },
    });

    await transformersGenerator(messages, {
      max_new_tokens: 150,
      temperature: 0.7,
      do_sample: true,
      repetition_penalty: 1.1,
      streamer,
    });

    self.postMessage({ type: 'result', id });
  } catch (err: any) {
    if (!shouldStop) {
      self.postMessage({ type: 'error', id, error: err?.message ?? 'Generation failed' });
    }
  }
}

async function generate(messages: { role: string; content: string }[], id: string) {
  if (useWebLLM && !webllmEngine) {
    self.postMessage({ type: 'error', id, error: 'Model not loaded' });
    return;
  }
  if (!useWebLLM && !transformersGenerator) {
    self.postMessage({ type: 'error', id, error: 'Model not loaded' });
    return;
  }

  currentId = id;
  shouldStop = false;

  if (useWebLLM) {
    await generateWebLLM(messages, id);
  } else {
    await generateTransformers(messages, id);
  }

  currentId = null;
  shouldStop = false;
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'load') {
    await loadModel(msg.skipWarmup);
  } else if (msg.type === 'generate') {
    await generate(msg.payload.messages, msg.payload.id);
  } else if (msg.type === 'stop') {
    shouldStop = true;
    if (useWebLLM && webllmEngine) {
      try { webllmEngine.interruptGenerate(); } catch {}
    }
    if (currentId) {
      self.postMessage({ type: 'result', id: currentId });
    }
  }
});
