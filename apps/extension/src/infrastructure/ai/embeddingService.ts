/* ============================================================
   EMBEDDING SERVICE — High-level API over the embedding Web Worker
   ============================================================ */

let worker: Worker | null = null;
let ready = false;
let pendingCallbacks = new Map<string, {
  resolve: (embedding: number[]) => void;
  reject: (err: Error) => void;
}>();
let idCounter = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('./embedding.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { type, id, embedding, error } = event.data;

      if (type === 'READY') {
        ready = true;
        console.log('[EmbeddingService] Model loaded');
        return;
      }

      if (type === 'RESULT' && id) {
        const cb = pendingCallbacks.get(id);
        if (cb) {
          cb.resolve(embedding);
          pendingCallbacks.delete(id);
        }
        return;
      }

      if (type === 'ERROR' && id) {
        const cb = pendingCallbacks.get(id);
        if (cb) {
          cb.reject(new Error(error));
          pendingCallbacks.delete(id);
        }
        return;
      }
    };
  }
  return worker;
}

/** Initialize the embedding model (async, call early). */
export function initEmbedding(): void {
  getWorker().postMessage({ type: 'INIT' });
}

/** Whether the model is loaded and ready. */
export function isReady(): boolean {
  return ready;
}

/** Compute a 384-dim embedding for the given text. */
export function embed(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const id = `emb_${++idCounter}`;
    pendingCallbacks.set(id, { resolve, reject });
    getWorker().postMessage({ type: 'EMBED', id, text });
  });
}

/** Shut down the worker. */
export function terminate(): void {
  if (worker) {
    worker.terminate();
    worker = null;
    ready = false;
    pendingCallbacks.clear();
  }
}
