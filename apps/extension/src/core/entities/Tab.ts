/* ============================================================
   TAB ENTITY — Domain model for browser tabs
   ============================================================ */

export interface TabEntity {
  id: number;
  url: string;
  title: string;
  favIconUrl: string;
  windowId: number;
  index: number;
  active: boolean;
  pinned: boolean;
  lastAccessed: number;
  tags: string[];
}

export interface TabSnapshot {
  url: string;
  title: string;
  favIconUrl: string;
  pinned: boolean;
  index: number;
}

/** Convert a chrome.tabs.Tab to our domain entity. */
export function fromChromeTab(tab: chrome.tabs.Tab): TabEntity {
  return {
    id: tab.id ?? 0,
    url: tab.url ?? '',
    title: tab.title ?? 'Untitled',
    favIconUrl: tab.favIconUrl ?? '',
    windowId: tab.windowId,
    index: tab.index,
    active: tab.active,
    pinned: tab.pinned ?? false,
    lastAccessed: tab.lastAccessed ?? Date.now(),
    tags: [],
  };
}

/** Convert a TabEntity to a snapshot for persistence. */
export function toSnapshot(tab: TabEntity): TabSnapshot {
  return {
    url: tab.url,
    title: tab.title,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned,
    index: tab.index,
  };
}
