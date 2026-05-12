/* ============================================================
   EMBEDDING WORKER — Runs @huggingface/transformers in a Web Worker
   to compute 384-dim embeddings without blocking the UI.

   Communication:
     postMessage({ type: 'EMBED', id, text }) → onmessage({ type: 'RESULT', id, embedding })
     postMessage({ type: 'INIT' })             → onmessage({ type: 'READY' })
   ============================================================ */

import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

let extractor: FeatureExtractionPipeline | null = null;
let initializing = false;

async function init() {
  if (extractor || initializing) return;
  initializing = true;

  try {
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        // Use WASM backend (works in extension workers)
        device: 'wasm',
        dtype: 'q8',
      }
    );
    self.postMessage({ type: 'READY' });
  } catch (err) {
    console.error('[EmbeddingWorker] Init failed:', err);
    self.postMessage({ type: 'ERROR', error: String(err) });
  } finally {
    initializing = false;
  }
}

self.onmessage = async (event: MessageEvent) => {
  const { type, id, text } = event.data;

  if (type === 'INIT') {
    await init();
    return;
  }

  if (type === 'EMBED') {
    if (!extractor) {
      await init();
    }

    if (!extractor) {
      self.postMessage({ type: 'ERROR', id, error: 'Extractor not ready' });
      return;
    }

    try {
      // Truncate text to ~256 tokens worth (~1200 chars)
      const truncated = (text as string).slice(0, 1200);
      const output = await extractor(truncated, { pooling: 'mean', normalize: true });
      const embedding = Array.from(output.data as Float32Array);
      self.postMessage({ type: 'RESULT', id, embedding });
    } catch (err) {
      self.postMessage({ type: 'ERROR', id, error: String(err) });
    }
  }
};
