import { pipeline } from '@huggingface/transformers';

type WorkerMessage =
  | { type: 'load' }
  | { type: 'generate'; payload: { messages: { role: string; content: string }[]; id: string } };

let generator: any = null;

const MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct';

async function loadModel() {
  self.postMessage({ type: 'loading', progress: 0 });

  try {
    generator = await pipeline('text-generation', MODEL_ID, {
      dtype: 'q4',
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
    const result = await generator(messages, {
      max_new_tokens: 256,
      temperature: 0.7,
      do_sample: true,
      repetition_penalty: 1.1,
    });

    const output = Array.isArray(result) ? result[0] : result;
    const generated = output?.generated_text;

    let text = '';
    if (Array.isArray(generated)) {
      const last = generated[generated.length - 1];
      text = last?.content ?? '';
    } else if (typeof generated === 'string') {
      text = generated;
    }

    self.postMessage({ type: 'result', id, text });
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
