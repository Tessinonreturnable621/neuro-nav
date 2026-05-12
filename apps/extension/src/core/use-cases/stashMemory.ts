/* ============================================================
   STASH MEMORY — Use-cases for stashing/popping tab state
   ============================================================ */

import type { TabSnapshot } from '@/core/entities/Tab';
import * as db from '@/infrastructure/db/database';

export interface StashEntry {
  id: number;
  tabs: TabSnapshot[];
  createdAt: number;
  message: string;
}

/** Stash all current tabs and return the entry. */
export async function stashTabs(
  tabs: TabSnapshot[],
  message = ''
): Promise<void> {
  if (tabs.length === 0) {
    throw new Error('No tabs to stash');
  }
  await db.pushStash(tabs, message);
}

/** Pop the most recent stash and return the tabs to restore. */
export async function popStash(): Promise<StashEntry | null> {
  const entry = await db.popStash();
  if (!entry) return null;
  return entry as StashEntry;
}

/** List all stash entries (oldest first). */
export async function listStash(): Promise<StashEntry[]> {
  const entries = await db.listStash();
  return entries as StashEntry[];
}
