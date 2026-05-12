/* ============================================================
   DATABASE — IndexedDB wrapper using idb
   Single source of truth for all local persistence
   ============================================================ */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { WorkspaceEntity } from '@/core/entities/Workspace';
import type { BranchEntity } from '@/core/entities/Branch';

// ---- Schema ----

interface NeuroNavDB extends DBSchema {
  workspaces: {
    key: string;
    value: WorkspaceEntity;
    indexes: { 'by-name': string; 'by-created': number };
  };
  branches: {
    key: string;
    value: BranchEntity;
    indexes: { 'by-name': string; 'by-active': number };
  };
  stash: {
    key: number;
    value: {
      id: number;
      tabs: { url: string; title: string; favIconUrl: string; pinned: boolean; index: number }[];
      createdAt: number;
      message: string;
    };
  };
  history: {
    key: string;
    value: {
      id: string;
      url: string;
      title: string;
      visitedAt: number;
      fromTabId: number | null;
      tags: string[];
    };
    indexes: { 'by-visited': number; 'by-url': string };
  };
}

const DB_NAME = 'neuro-nav';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<NeuroNavDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<NeuroNavDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NeuroNavDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Workspaces store
      if (!db.objectStoreNames.contains('workspaces')) {
        const ws = db.createObjectStore('workspaces', { keyPath: 'id' });
        ws.createIndex('by-name', 'name');
        ws.createIndex('by-created', 'createdAt');
      }

      // Branches store
      if (!db.objectStoreNames.contains('branches')) {
        const br = db.createObjectStore('branches', { keyPath: 'id' });
        br.createIndex('by-name', 'name');
        br.createIndex('by-active', 'isActive');
      }

      // Stash store (auto-increment key for stack behavior)
      if (!db.objectStoreNames.contains('stash')) {
        db.createObjectStore('stash', { keyPath: 'id', autoIncrement: true });
      }

      // History store
      if (!db.objectStoreNames.contains('history')) {
        const hist = db.createObjectStore('history', { keyPath: 'id' });
        hist.createIndex('by-visited', 'visitedAt');
        hist.createIndex('by-url', 'url');
      }
    },
  });

  return dbInstance;
}

// ---- Workspace Operations ----

export async function getAllWorkspaces(): Promise<WorkspaceEntity[]> {
  const db = await getDB();
  return db.getAllFromIndex('workspaces', 'by-created');
}

export async function getWorkspace(id: string): Promise<WorkspaceEntity | undefined> {
  const db = await getDB();
  return db.get('workspaces', id);
}

export async function saveWorkspace(workspace: WorkspaceEntity): Promise<void> {
  const db = await getDB();
  await db.put('workspaces', workspace);
}

export async function deleteWorkspace(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workspaces', id);
}

// ---- Branch Operations ----

export async function getAllBranches(): Promise<BranchEntity[]> {
  const db = await getDB();
  return db.getAll('branches');
}

export async function saveBranch(branch: BranchEntity): Promise<void> {
  const db = await getDB();
  await db.put('branches', branch);
}

export async function deleteBranch(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('branches', id);
}

export async function getActiveBranch(): Promise<BranchEntity | undefined> {
  const db = await getDB();
  const all = await db.getAll('branches');
  return all.find((b) => b.isActive);
}

// ---- Stash Operations ----

export async function pushStash(
  tabs: { url: string; title: string; favIconUrl: string; pinned: boolean; index: number }[],
  message = ''
): Promise<void> {
  const db = await getDB();
  await db.add('stash', {
    id: Date.now(),
    tabs,
    createdAt: Date.now(),
    message,
  });
}

export async function popStash() {
  const db = await getDB();
  const all = await db.getAll('stash');
  if (all.length === 0) return null;
  const latest = all[all.length - 1];
  await db.delete('stash', latest.id);
  return latest;
}

export async function listStash() {
  const db = await getDB();
  return db.getAll('stash');
}

// ---- History / Pruning ----

export async function pruneOldRecords(maxAgeDays = 30): Promise<number> {
  const db = await getDB();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const tx = db.transaction('history', 'readwrite');
  const index = tx.store.index('by-visited');

  let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
  let deleted = 0;

  while (cursor) {
    await cursor.delete();
    deleted++;
    cursor = await cursor.continue();
  }

  await tx.done;
  return deleted;
}
