/* ============================================================
   INTENT BLOCKER — Block distracting sites per-branch
   e.g., block social/media when on a feat/* branch
   ============================================================ */

import type { PageCategory } from '@/core/entities/PageDocument';
import { classifyPage } from '@/core/entities/PageDocument';

export interface BlockRule {
  /** Branch name pattern (glob-like: feat/*, bug/*, etc.) */
  branchPattern: string;
  /** Categories to block */
  blockedCategories: PageCategory[];
}

// Default rules — can be overridden in settings
const DEFAULT_RULES: BlockRule[] = [
  { branchPattern: 'feat/*', blockedCategories: ['social', 'media', 'shopping'] },
  { branchPattern: 'bug/*',  blockedCategories: ['social', 'media', 'shopping'] },
  { branchPattern: 'hotfix/*', blockedCategories: ['social', 'media', 'shopping'] },
];

// Whitelist — never block these URLs
const WHITELIST_PATTERNS = [
  /localhost/,
  /127\.0\.0\.1/,
  /chrome:\/\//,
  /chrome-extension:\/\//,
];

/**
 * Check if a branch name matches a glob pattern.
 * Supports trailing * (e.g., "feat/*" matches "feat/auth").
 */
function matchBranch(pattern: string, branchName: string): boolean {
  if (pattern === '*') return true;
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -1); // "feat/"
    return branchName.startsWith(prefix);
  }
  return pattern === branchName;
}

/**
 * Determine if a URL should be blocked given the current branch.
 * Returns the reason if blocked, or null if allowed.
 */
export function shouldBlock(
  url: string,
  title: string,
  activeBranch: string | null,
  customRules?: BlockRule[]
): { blocked: true; reason: string; category: PageCategory } | { blocked: false } {
  // No branch → no blocking
  if (!activeBranch) return { blocked: false };

  // Whitelisted URLs
  if (WHITELIST_PATTERNS.some((p) => p.test(url))) return { blocked: false };

  const category = classifyPage(url, title);
  const rules = customRules ?? DEFAULT_RULES;

  for (const rule of rules) {
    if (matchBranch(rule.branchPattern, activeBranch)) {
      if (rule.blockedCategories.includes(category)) {
        return {
          blocked: true,
          reason: `"${category}" sites are blocked on branch "${activeBranch}"`,
          category,
        };
      }
    }
  }

  return { blocked: false };
}
