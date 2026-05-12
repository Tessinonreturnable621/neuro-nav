#!/usr/bin/env node
/* ============================================================
   NAV-CLI — Terminal interface for Neuro-Nav
   Usage: nav <command> [args]
   ============================================================ */

import WebSocket from 'ws';

const SERVER_URL = process.env.NAV_SERVER ?? 'ws://127.0.0.1:9500';
const RESPONSE_TIMEOUT_MS = 10_000;

// ---- Colors (ANSI escape codes — no dependency) ----

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

// ---- CLI Helpers ----

function logo() {
  console.log(`${c.magenta}${c.bold}⚡ Neuro-Nav CLI${c.reset} ${c.dim}v3.0.0${c.reset}`);
  console.log();
}

function usage() {
  logo();
  console.log(`${c.bold}USAGE${c.reset}`);
  console.log(`  nav <command> [args]`);
  console.log();
  console.log(`${c.bold}COMMANDS${c.reset}`);
  console.log(`  ${c.cyan}branch list${c.reset}              List all branches`);
  console.log(`  ${c.cyan}branch checkout <name>${c.reset}   Switch to a branch`);
  console.log(`  ${c.cyan}branch create <name>${c.reset}     Create and activate a new branch`);
  console.log(`  ${c.cyan}branch delete <id>${c.reset}       Delete a branch by ID`);
  console.log(`  ${c.cyan}workspace list${c.reset}           List saved workspaces`);
  console.log(`  ${c.cyan}stash${c.reset}                    Stash current tabs`);
  console.log(`  ${c.cyan}stash pop${c.reset}                Pop the latest stash`);
  console.log(`  ${c.cyan}stash list${c.reset}               List stash entries`);
  console.log(`  ${c.cyan}ping${c.reset}                     Test connection`);
  console.log();
  console.log(`${c.bold}ENVIRONMENT${c.reset}`);
  console.log(`  NAV_SERVER    WebSocket URL (default: ${SERVER_URL})`);
}

// ---- WebSocket Communication ----

function sendCommand(type: string, payload?: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    let responded = false;

    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true;
        ws.close();
        reject(new Error('Timeout waiting for response'));
      }
    }, RESPONSE_TIMEOUT_MS);

    ws.on('open', () => {
      // Identify as CLI
      ws.send(JSON.stringify({ source: 'cli', type: 'IDENTIFY' }));
    });

    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());

      // Skip the CONNECTED ack, then send the actual command
      if (msg.type === 'CONNECTED') {
        ws.send(JSON.stringify({
          source: 'cli',
          type,
          payload,
          requestId: crypto.randomUUID(),
        }));
        return;
      }

      // This is the response from the extension
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        ws.close();
        resolve(msg);
      }
    });

    ws.on('error', (err) => {
      if (!responded) {
        responded = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

// ---- Command Handlers ----

async function handleBranch(args: string[]) {
  const sub = args[0];

  if (!sub || sub === 'list') {
    const res = await sendCommand('BRANCH_LIST') as { data?: Array<{ name: string; isActive: boolean; tabs: unknown[]; updatedAt: number }> };
    if (!res.data?.length) {
      console.log(`${c.dim}No branches${c.reset}`);
      return;
    }
    console.log(`${c.bold}Branches:${c.reset}`);
    for (const b of res.data) {
      const indicator = b.isActive ? `${c.green}● ` : `${c.dim}○ `;
      const active = b.isActive ? ` ${c.green}(active)${c.reset}` : '';
      console.log(`  ${indicator}${c.bold}${b.name}${c.reset}${active} — ${b.tabs.length} tabs`);
    }
    return;
  }

  if (sub === 'checkout') {
    const name = args[1];
    if (!name) { console.log(`${c.red}Usage: nav branch checkout <name>${c.reset}`); return; }
    console.log(`${c.cyan}Checking out ${c.bold}${name}${c.reset}...`);
    const res = await sendCommand('BRANCH_CHECKOUT', { name }) as { data?: { name: string } };
    console.log(`${c.green}✓ Switched to ${c.bold}${res.data?.name}${c.reset}`);
    return;
  }

  if (sub === 'create') {
    const name = args[1];
    if (!name) { console.log(`${c.red}Usage: nav branch create <name>${c.reset}`); return; }
    console.log(`${c.cyan}Creating branch ${c.bold}${name}${c.reset}...`);
    const res = await sendCommand('BRANCH_CREATE', { name }) as { data?: { name: string } };
    console.log(`${c.green}✓ Created and activated ${c.bold}${res.data?.name}${c.reset}`);
    return;
  }

  if (sub === 'delete') {
    const id = args[1];
    if (!id) { console.log(`${c.red}Usage: nav branch delete <id>${c.reset}`); return; }
    await sendCommand('BRANCH_DELETE', { id });
    console.log(`${c.green}✓ Branch deleted${c.reset}`);
    return;
  }

  console.log(`${c.red}Unknown branch subcommand: ${sub}${c.reset}`);
}

async function handleStash(args: string[]) {
  const sub = args[0];

  if (!sub) {
    console.log(`${c.cyan}Stashing current tabs...${c.reset}`);
    await sendCommand('STASH_PUSH');
    console.log(`${c.green}✓ Tabs stashed${c.reset}`);
    return;
  }

  if (sub === 'pop') {
    console.log(`${c.cyan}Popping stash...${c.reset}`);
    const res = await sendCommand('STASH_POP') as { success: boolean; error?: string };
    if (!res.success) {
      console.log(`${c.yellow}${res.error ?? 'Stash is empty'}${c.reset}`);
      return;
    }
    console.log(`${c.green}✓ Stash popped${c.reset}`);
    return;
  }

  if (sub === 'list') {
    const res = await sendCommand('STASH_LIST') as { data?: Array<{ id: number; tabs: unknown[]; createdAt: number }> };
    if (!res.data?.length) {
      console.log(`${c.dim}Stash is empty${c.reset}`);
      return;
    }
    console.log(`${c.bold}Stash (${res.data.length}):${c.reset}`);
    for (const entry of res.data) {
      const time = new Date(entry.createdAt).toLocaleString();
      console.log(`  ${c.dim}#${entry.id}${c.reset} — ${entry.tabs.length} tabs — ${c.dim}${time}${c.reset}`);
    }
    return;
  }

  console.log(`${c.red}Unknown stash subcommand: ${sub}${c.reset}`);
}

async function handleWorkspace(args: string[]) {
  const sub = args[0];
  if (!sub || sub === 'list') {
    const res = await sendCommand('WORKSPACE_LIST') as { data?: Array<{ name: string; tabs: unknown[] }> };
    if (!res.data?.length) {
      console.log(`${c.dim}No saved workspaces${c.reset}`);
      return;
    }
    console.log(`${c.bold}Workspaces:${c.reset}`);
    for (const ws of res.data) {
      console.log(`  ${c.cyan}${ws.name}${c.reset} — ${ws.tabs.length} tabs`);
    }
    return;
  }

  console.log(`${c.red}Unknown workspace subcommand: ${sub}${c.reset}`);
}

// ---- Main ----

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    usage();
    return;
  }

  try {
    switch (command) {
      case 'branch':
        await handleBranch(args.slice(1));
        break;
      case 'stash':
        await handleStash(args.slice(1));
        break;
      case 'workspace':
        await handleWorkspace(args.slice(1));
        break;
      case 'ping':
        console.log(`${c.cyan}Pinging...${c.reset}`);
        await sendCommand('PING');
        console.log(`${c.green}✓ Connection OK${c.reset}`);
        break;
      default:
        console.log(`${c.red}Unknown command: ${command}${c.reset}`);
        console.log(`Run ${c.cyan}nav help${c.reset} for usage`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('ECONNREFUSED')) {
      console.log(`${c.red}✗ Cannot connect to nav-server at ${SERVER_URL}${c.reset}`);
      console.log(`  Start the server: ${c.cyan}npx @neuro-nav/server${c.reset}`);
    } else {
      console.error(`${c.red}Error: ${msg}${c.reset}`);
    }
    process.exit(1);
  }
}

main();
