/* ============================================================
   MANAGE BRANCHES — Use-cases for Git-inspired session branching
   ============================================================ */

import type { BranchEntity } from '@/core/entities/Branch';
import { createBranch } from '@/core/entities/Branch';
import type { TabSnapshot } from '@/core/entities/Tab';
import * as db from '@/infrastructure/db/database';

/** List all branches. */
export async function listBranches(): Promise<BranchEntity[]> {
  return db.getAllBranches();
}

/** Get the currently active branch, or null. */
export async function getActiveBranch(): Promise<BranchEntity | null> {
  return (await db.getActiveBranch()) ?? null;
}

/**
 * Create a new branch from the given tabs.
 * If `activate` is true, deactivates the current branch and activates this one.
 */
export async function createNewBranch(
  name: string,
  currentTabs: TabSnapshot[],
  activate = false
): Promise<BranchEntity> {
  const existing = await db.getAllBranches();
  if (existing.some((b) => b.name === name)) {
    throw new Error(`Branch "${name}" already exists`);
  }

  const activeBranch = existing.find((b) => b.isActive);
  const branch = createBranch(name, currentTabs, activeBranch?.name ?? null);

  if (activate) {
    // Deactivate current
    if (activeBranch) {
      activeBranch.isActive = false;
      activeBranch.updatedAt = Date.now();
      await db.saveBranch(activeBranch);
    }
    branch.isActive = true;
  }

  await db.saveBranch(branch);
  return branch;
}

/**
 * Checkout a branch by name.
 * Saves the current tabs into the active branch, then restores the target branch's tabs.
 * Returns the tabs that should be opened.
 */
export async function checkoutBranch(
  targetName: string,
  currentTabs: TabSnapshot[]
): Promise<{ branch: BranchEntity; tabsToOpen: TabSnapshot[] }> {
  const branches = await db.getAllBranches();
  const target = branches.find((b) => b.name === targetName);
  if (!target) {
    throw new Error(`Branch "${targetName}" not found`);
  }

  if (target.isActive) {
    return { branch: target, tabsToOpen: target.tabs };
  }

  // Save current tabs to the active branch
  const activeBranch = branches.find((b) => b.isActive);
  if (activeBranch) {
    activeBranch.tabs = currentTabs;
    activeBranch.isActive = false;
    activeBranch.updatedAt = Date.now();
    await db.saveBranch(activeBranch);
  }

  // Activate the target
  target.isActive = true;
  target.updatedAt = Date.now();
  await db.saveBranch(target);

  return { branch: target, tabsToOpen: target.tabs };
}

/** Delete a branch by ID. Cannot delete the active branch. */
export async function deleteBranchById(id: string): Promise<void> {
  const branch = (await db.getAllBranches()).find((b) => b.id === id);
  if (!branch) return;
  if (branch.isActive) {
    throw new Error('Cannot delete the active branch');
  }
  await db.deleteBranch(id);
}

/** Rename a branch. */
export async function renameBranch(id: string, newName: string): Promise<BranchEntity> {
  const branches = await db.getAllBranches();
  const branch = branches.find((b) => b.id === id);
  if (!branch) throw new Error('Branch not found');
  if (branches.some((b) => b.name === newName && b.id !== id)) {
    throw new Error(`Branch "${newName}" already exists`);
  }
  branch.name = newName;
  branch.updatedAt = Date.now();
  await db.saveBranch(branch);
  return branch;
}
