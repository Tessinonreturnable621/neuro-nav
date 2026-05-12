/* ============================================================
   P2P SERVICE — PeerJS WebRTC connection manager
   Manages peer lifecycle, connections, and message routing.
   ============================================================ */

import Peer, { type DataConnection } from 'peerjs';
import type { PeerInfo, P2PMessage, P2PMessageType } from '@/core/entities/Peer';
import { generatePeerId } from '@/core/entities/Peer';

type MessageHandler = (message: P2PMessage, peerId: string) => void;

// ---- State ----

let peer: Peer | null = null;
let myPeerId = '';
let myDisplayName = '';
const connections = new Map<string, DataConnection>();
const peerInfoMap = new Map<string, PeerInfo>();
const messageHandlers = new Map<P2PMessageType, MessageHandler[]>();

// ---- Initialization ----

/**
 * Initialize the PeerJS instance.
 * Uses the free PeerJS Cloud signaling server (0.peerjs.com).
 */
export function initP2P(displayName?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (peer && !peer.destroyed) {
      resolve(myPeerId);
      return;
    }

    const id = generatePeerId();
    myDisplayName = displayName ?? id;

    peer = new Peer(id, {
      // Use free PeerJS cloud signaling (Option B from spec)
      debug: 0,
    });

    peer.on('open', (assignedId) => {
      myPeerId = assignedId;
      console.log(`[P2P] Peer initialized: ${myPeerId}`);
      resolve(myPeerId);
    });

    peer.on('connection', (conn) => {
      handleIncomingConnection(conn);
    });

    peer.on('error', (err) => {
      console.error('[P2P] Peer error:', err);
      if (!myPeerId) reject(err);
    });

    peer.on('disconnected', () => {
      console.warn('[P2P] Disconnected from signaling server, reconnecting...');
      peer?.reconnect();
    });
  });
}

// ---- Connection Management ----

function handleIncomingConnection(conn: DataConnection) {
  conn.on('open', () => {
    registerConnection(conn);
    console.log(`[P2P] Incoming connection from: ${conn.peer}`);
  });
  setupConnectionListeners(conn);
}

/**
 * Connect to a remote peer by their ID.
 */
export function connectToPeer(remotePeerId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!peer) {
      reject(new Error('P2P not initialized'));
      return;
    }

    if (connections.has(remotePeerId)) {
      resolve(); // Already connected
      return;
    }

    // Update status to connecting
    peerInfoMap.set(remotePeerId, {
      peerId: remotePeerId,
      displayName: remotePeerId,
      status: 'connecting',
    });

    const conn = peer.connect(remotePeerId, { reliable: true });

    conn.on('open', () => {
      registerConnection(conn);
      console.log(`[P2P] Connected to: ${remotePeerId}`);
      resolve();
    });

    conn.on('error', (err) => {
      peerInfoMap.set(remotePeerId, {
        peerId: remotePeerId,
        displayName: remotePeerId,
        status: 'disconnected',
      });
      reject(err);
    });

    setupConnectionListeners(conn);
  });
}

function registerConnection(conn: DataConnection) {
  connections.set(conn.peer, conn);
  peerInfoMap.set(conn.peer, {
    peerId: conn.peer,
    displayName: conn.peer,
    status: 'connected',
    connectedAt: Date.now(),
  });
}

function setupConnectionListeners(conn: DataConnection) {
  conn.on('data', (raw) => {
    try {
      const message = raw as P2PMessage;
      // Update display name if the peer sent it
      if (message.from) {
        const info = peerInfoMap.get(conn.peer);
        if (info) info.displayName = message.from;
      }
      // Route to handlers
      const handlers = messageHandlers.get(message.type) ?? [];
      handlers.forEach((h) => h(message, conn.peer));
    } catch (err) {
      console.error('[P2P] Failed to parse message:', err);
    }
  });

  conn.on('close', () => {
    connections.delete(conn.peer);
    peerInfoMap.set(conn.peer, {
      peerId: conn.peer,
      displayName: peerInfoMap.get(conn.peer)?.displayName ?? conn.peer,
      status: 'disconnected',
    });
    console.log(`[P2P] Disconnected from: ${conn.peer}`);
  });

  conn.on('error', (err) => {
    console.error(`[P2P] Connection error with ${conn.peer}:`, err);
  });
}

// ---- Messaging ----

/**
 * Send a message to a specific peer.
 */
export function sendToPeer<T>(remotePeerId: string, type: P2PMessageType, payload: T): void {
  const conn = connections.get(remotePeerId);
  if (!conn || !conn.open) {
    console.warn(`[P2P] Cannot send to ${remotePeerId}: not connected`);
    return;
  }

  const message: P2PMessage<T> = {
    type,
    payload,
    from: myDisplayName,
    timestamp: Date.now(),
  };

  conn.send(message);
}

/**
 * Broadcast a message to all connected peers.
 */
export function broadcast<T>(type: P2PMessageType, payload: T): void {
  for (const peerId of connections.keys()) {
    sendToPeer(peerId, type, payload);
  }
}

/**
 * Register a handler for a specific message type.
 */
export function onMessage(type: P2PMessageType, handler: MessageHandler): () => void {
  const list = messageHandlers.get(type) ?? [];
  list.push(handler);
  messageHandlers.set(type, list);

  // Return unsubscribe function
  return () => {
    const idx = list.indexOf(handler);
    if (idx !== -1) list.splice(idx, 1);
  };
}

// ---- Queries ----

export function getMyPeerId(): string {
  return myPeerId;
}

export function getMyDisplayName(): string {
  return myDisplayName;
}

export function getConnectedPeers(): PeerInfo[] {
  return Array.from(peerInfoMap.values());
}

export function isConnected(): boolean {
  return connections.size > 0;
}

export function getPeerCount(): number {
  return connections.size;
}

// ---- Cleanup ----

export function disconnectPeer(remotePeerId: string): void {
  const conn = connections.get(remotePeerId);
  if (conn) {
    conn.close();
    connections.delete(remotePeerId);
  }
  peerInfoMap.delete(remotePeerId);
}

export function destroyP2P(): void {
  connections.forEach((conn) => conn.close());
  connections.clear();
  peerInfoMap.clear();
  peer?.destroy();
  peer = null;
  myPeerId = '';
}
