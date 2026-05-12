/* ============================================================
   PEER ENTITY — Data models for P2P collaboration
   ============================================================ */

export interface PeerInfo {
  /** PeerJS peer ID */
  peerId: string;
  /** Human-readable display name */
  displayName: string;
  /** Connection status */
  status: 'connected' | 'connecting' | 'disconnected';
  /** When the connection was established */
  connectedAt?: number;
}

export type P2PMessageType =
  | 'SHARE_WORKSPACE'
  | 'REQUEST_TABS'
  | 'SYNC_BRANCH'
  | 'CHAT'
  | 'PING'
  | 'PONG';

export interface P2PMessage<T = unknown> {
  type: P2PMessageType;
  payload: T;
  from: string;
  timestamp: number;
}

export interface SharedWorkspace {
  name: string;
  tabs: { url: string; title: string; favicon?: string }[];
  sharedBy: string;
  sharedAt: number;
}

/** Generate a short, human-readable peer ID. */
export function generatePeerId(): string {
  const adjectives = ['swift', 'bold', 'calm', 'deep', 'keen', 'warm', 'cool', 'fast'];
  const nouns = ['fox', 'owl', 'elk', 'ray', 'orb', 'gem', 'arc', 'hub'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${adj}-${noun}-${num}`;
}
