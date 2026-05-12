/* ============================================================
   WORKSPACE ENTITY — A saved set of tabs
   ============================================================ */

import type { TabSnapshot } from './Tab';

export interface WorkspaceEntity {
  id: string;
  name: string;
  tabs: TabSnapshot[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
  color: string;
  icon: string;
}

const WORKSPACE_COLORS = [
  'hsl(252 87% 68%)',    // purple
  'hsl(192 90% 56%)',    // cyan
  'hsl(340 82% 62%)',    // pink
  'hsl(152 68% 52%)',    // green
  'hsl(38 92% 60%)',     // amber
  'hsl(16 80% 60%)',     // orange
] as const;

const WORKSPACE_ICONS = ['💻', '🚀', '📚', '🔬', '🎯', '⚡', '🛠️', '📊'] as const;

export function createWorkspace(
  name: string,
  tabs: TabSnapshot[],
  tags: string[] = []
): WorkspaceEntity {
  return {
    id: crypto.randomUUID(),
    name,
    tabs,
    tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color: WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)],
    icon: WORKSPACE_ICONS[Math.floor(Math.random() * WORKSPACE_ICONS.length)],
  };
}
