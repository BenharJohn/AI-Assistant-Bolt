import { pipeline, TextStreamer } from '@huggingface/transformers';

type WorkerMessage =
  | { type: 'load' }
  | { type: 'generate'; payload: { messages: { role: string; content: string }[]; id: string } };

let generator: any = null;

const MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct';

async function loadModel() {
  self.postMessage({ type: 'loading', progress: 0 });

  try {
    // Try WebGPU first (10-20x faster), fall back to WASM
    let device: string = 'wasm';
    try {
      if ('gpu' in navigator) {
        const gpu = (navigator as any).gpu;
        if (gpu) {
          const adapter = await gpu.requestAdapter();
          if (adapter) {
            device = 'webgpu';
          }
        }
      }
    } catch {
      // WebGPU not available, use WASM
    }

    self.postMessage({ type: 'device', device });

    generator = await pipeline('text-generation', MODEL_ID, {
      dtype: device === 'webgpu' ? 'fp16' : 'q4',
      device,
      progress_callback: (info: any) => {
        if (info.status === 'initiate') {
          self.postMessage({ type: 'progress', value: 0, file: info.file });
        } else if (info.status === 'progress') {
          self.postMessage({ type: 'progress', value: Math.round(info.progress ?? 0), file: info.file });
        } else if (info.status === 'done') {
          self.postMessage({ type: 'progress', value: 100, file: info.file });
        } else if (info.status === 'ready') {
          self.postMessage({ type: 'ready' });
        }
      },
    });
    self.postMessage({ type: 'ready' });
  } catch (err: any) {
    console.error('Model loading failed:', err);
    self.postMessage({ type: 'error', id: null, error: err?.message ?? 'Failed to load model' });
  }
}

async function generate(messages: { role: string; content: string }[], id: string) {
  if (!generator) {
    self.postMessage({ type: 'error', id, error: 'Model not loaded' });
    return;
  }

  try {
    // Stream tokens back as they are generated
    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token: string) => {
        self.postMessage({ type: 'token', id, token });
      },
    });

    await generator(messages, {
      max_new_tokens: 150,
      temperature: 0.7,
      do_sample: true,
      repetition_penalty: 1.1,
      streamer,
    });

    self.postMessage({ type: 'result', id });
  } catch (err: any) {
    self.postMessage({ type: 'error', id, error: err?.message ?? 'Generation failed' });
  }
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'load') {
    await loadModel();
  } else if (msg.type === 'generate') {
    await generate(msg.payload.messages, msg.payload.id);
  }
});
