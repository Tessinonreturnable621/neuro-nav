/* ============================================================
   NAV-SERVER — Companion WebSocket server
   Bridges CLI ↔ Chrome Extension on localhost:9500
   Auto-shuts down after 5 minutes of inactivity.
   ============================================================ */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = parseInt(process.env.NAV_PORT ?? '9500', 10);
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface NavMessage {
  source: 'cli' | 'extension';
  type: string;
  payload?: unknown;
  requestId?: string;
}

let idleTimer: ReturnType<typeof setTimeout> | null = null;

// Track connected clients by role
const clients = {
  cli: new Set<WebSocket>(),
  extension: new Set<WebSocket>(),
};

function resetIdleTimer(wss: WebSocketServer) {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    console.log('[nav-server] Idle timeout — shutting down');
    wss.close(() => process.exit(0));
  }, IDLE_TIMEOUT_MS);
}

function broadcast(target: 'cli' | 'extension', data: string) {
  for (const client of clients[target]) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

const wss = new WebSocketServer({ port: PORT, host: '127.0.0.1' });

wss.on('listening', () => {
  console.log(`[nav-server] Listening on ws://127.0.0.1:${PORT}`);
  resetIdleTimer(wss);
});

wss.on('connection', (ws) => {
  let role: 'cli' | 'extension' | null = null;

  ws.on('message', (raw) => {
    resetIdleTimer(wss);

    let msg: NavMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    // First message must identify the client
    if (!role) {
      if (msg.source === 'cli' || msg.source === 'extension') {
        role = msg.source;
        clients[role].add(ws);
        console.log(`[nav-server] ${role} connected (total: cli=${clients.cli.size}, ext=${clients.extension.size})`);
        ws.send(JSON.stringify({ type: 'CONNECTED', role }));
        return;
      }
      ws.send(JSON.stringify({ error: 'First message must include source: "cli" | "extension"' }));
      return;
    }

    // Route messages: CLI → Extension, Extension → CLI
    if (role === 'cli') {
      broadcast('extension', raw.toString());
    } else if (role === 'extension') {
      broadcast('cli', raw.toString());
    }
  });

  ws.on('close', () => {
    if (role) {
      clients[role].delete(ws);
      console.log(`[nav-server] ${role} disconnected`);
    }
  });

  ws.on('error', (err) => {
    console.error('[nav-server] WebSocket error:', err.message);
  });
});

wss.on('error', (err) => {
  if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
    console.log(`[nav-server] Port ${PORT} already in use — another instance may be running`);
    process.exit(0);
  }
  console.error('[nav-server] Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[nav-server] Shutting down...');
  wss.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  wss.close(() => process.exit(0));
});
