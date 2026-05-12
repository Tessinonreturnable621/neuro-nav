/* ============================================================
   WORKSPACE SHARING — Share/receive workspaces via P2P
   ============================================================ */

import type { SharedWorkspace } from '@/core/entities/Peer';
import * as p2p from '@/infrastructure/p2p/peerService';

/**
 * Share the current window's tabs as a workspace to a peer.
 */
export async function shareCurrentTabs(
  remotePeerId: string,
  workspaceName: string
): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const snapshot: SharedWorkspace = {
    name: workspaceName,
    tabs: tabs
      .filter((t) => t.url?.startsWith('http'))
      .map((t) => ({
        url: t.url!,
        title: t.title ?? '',
        favicon: t.favIconUrl ?? '',
      })),
    sharedBy: p2p.getMyDisplayName(),
    sharedAt: Date.now(),
  };

  p2p.sendToPeer(remotePeerId, 'SHARE_WORKSPACE', snapshot);
}

/**
 * Broadcast current tabs to all connected peers.
 */
export async function broadcastCurrentTabs(workspaceName: string): Promise<void> {
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const snapshot: SharedWorkspace = {
    name: workspaceName,
    tabs: tabs
      .filter((t) => t.url?.startsWith('http'))
      .map((t) => ({
        url: t.url!,
        title: t.title ?? '',
        favicon: t.favIconUrl ?? '',
      })),
    sharedBy: p2p.getMyDisplayName(),
    sharedAt: Date.now(),
  };

  p2p.broadcast('SHARE_WORKSPACE', snapshot);
}

/**
 * Open a received workspace: creates tabs for all URLs.
 */
export async function openSharedWorkspace(workspace: SharedWorkspace): Promise<void> {
  for (const tab of workspace.tabs) {
    await chrome.tabs.create({ url: tab.url, active: false });
  }
}
