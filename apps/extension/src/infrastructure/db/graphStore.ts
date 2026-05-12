/* ============================================================
   GRAPH STORE — IndexedDB persistence for navigation graph
   ============================================================ */

const DB_NAME = 'neuro-nav-graph';
const DB_VERSION = 1;
const NODES_STORE = 'nodes';
const EDGES_STORE = 'edges';

import type { GraphNode, GraphEdge } from '@/core/entities/Graph';

function openGraphDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NODES_STORE)) {
        db.createObjectStore(NODES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(EDGES_STORE)) {
        const edgeStore = db.createObjectStore(EDGES_STORE, { autoIncrement: true });
        edgeStore.createIndex('source', 'source', { unique: false });
        edgeStore.createIndex('target', 'target', { unique: false });
        edgeStore.createIndex('source_target', ['source', 'target'], { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---- Node operations ----

export async function upsertNode(node: GraphNode): Promise<void> {
  const db = await openGraphDB();
  const tx = db.transaction(NODES_STORE, 'readwrite');
  tx.objectStore(NODES_STORE).put(node);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getNode(id: string): Promise<GraphNode | undefined> {
  const db = await openGraphDB();
  const tx = db.transaction(NODES_STORE, 'readonly');
  const req = tx.objectStore(NODES_STORE).get(id);
  return new Promise<GraphNode | undefined>((resolve, reject) => {
    req.onsuccess = () => { db.close(); resolve(req.result as GraphNode | undefined); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function getAllNodes(): Promise<GraphNode[]> {
  const db = await openGraphDB();
  const tx = db.transaction(NODES_STORE, 'readonly');
  const req = tx.objectStore(NODES_STORE).getAll();
  return new Promise<GraphNode[]>((resolve, reject) => {
    req.onsuccess = () => { db.close(); resolve(req.result as GraphNode[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ---- Edge operations ----

export async function recordTransition(source: string, target: string): Promise<void> {
  const db = await openGraphDB();
  const tx = db.transaction(EDGES_STORE, 'readwrite');
  const store = tx.objectStore(EDGES_STORE);
  const idx = store.index('source_target');

  const existing = await new Promise<GraphEdge & { key?: IDBValidKey } | undefined>((resolve) => {
    const req = idx.get([source, target]);
    req.onsuccess = () => resolve(req.result as (GraphEdge & { key?: IDBValidKey }) | undefined);
    req.onerror = () => resolve(undefined);
  });

  if (existing) {
    existing.weight += 1;
    existing.lastTransition = Date.now();
    // We need the key from the cursor, but getAll doesn't give keys easily
    // Use openCursor instead
    const cursor = idx.openCursor([source, target]);
    await new Promise<void>((resolve) => {
      cursor.onsuccess = () => {
        if (cursor.result) {
          cursor.result.update({
            source,
            target,
            weight: existing.weight,
            lastTransition: existing.lastTransition,
          });
        }
        resolve();
      };
      cursor.onerror = () => resolve();
    });
  } else {
    store.add({
      source,
      target,
      weight: 1,
      lastTransition: Date.now(),
    });
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAllEdges(): Promise<GraphEdge[]> {
  const db = await openGraphDB();
  const tx = db.transaction(EDGES_STORE, 'readonly');
  const req = tx.objectStore(EDGES_STORE).getAll();
  return new Promise<GraphEdge[]>((resolve, reject) => {
    req.onsuccess = () => { db.close(); resolve(req.result as GraphEdge[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
