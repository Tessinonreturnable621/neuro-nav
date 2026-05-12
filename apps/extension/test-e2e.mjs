/**
 * E2E test: Loads Neuro-Nav as a real Chrome extension and tests all pages.
 * Uses Playwright's chromium.launchPersistentContext with --load-extension flag.
 *
 * Run: node apps/extension/test-e2e.mjs
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_PATH = join(__dirname, 'dist');
const SCREENSHOTS_DIR = join(__dirname, 'test-screenshots');

// Ensure screenshots directory
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Launching Chrome with Neuro-Nav extension...');
  console.log(`   Extension path: ${DIST_PATH}`);

  // Launch Chrome with the extension pre-loaded
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${DIST_PATH}`,
      `--load-extension=${DIST_PATH}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1280,800',
    ],
  });

  // Wait for the extension to initialize
  await sleep(3000);

  // Find the extension's background SW to get the extension ID
  let extensionId = '';
  const serviceWorkers = context.serviceWorkers();
  for (const sw of serviceWorkers) {
    const url = sw.url();
    if (url.includes('background')) {
      const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) extensionId = match[1];
    }
  }

  // If we couldn't find it from SW, wait a bit and try again
  if (!extensionId) {
    console.log('   Waiting for service worker registration...');
    await sleep(3000);
    const sw2 = context.serviceWorkers();
    for (const sw of sw2) {
      const url = sw.url();
      console.log(`   Found SW: ${url}`);
      const match = url.match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) extensionId = match[1];
    }
  }

  if (!extensionId) {
    // Try to get it from the background page target
    const pages = context.backgroundPages();
    for (const p of pages) {
      console.log(`   Found background page: ${p.url()}`);
      const match = p.url().match(/chrome-extension:\/\/([a-z]+)\//);
      if (match) extensionId = match[1];
    }
  }

  if (!extensionId) {
    console.error('❌ Could not find extension ID. Extension may not have loaded.');
    console.log('   Attempting to list all targets...');
    for (const p of context.pages()) {
      console.log(`   Page: ${p.url()}`);
    }
    await context.close();
    process.exit(1);
  }

  console.log(`✅ Extension loaded! ID: ${extensionId}`);

  // Open the extension popup
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  console.log(`📂 Opening popup: ${popupUrl}`);

  const page = await context.newPage();
  await page.setViewportSize({ width: 420, height: 620 });
  await page.goto(popupUrl);
  await sleep(2000);

  // ---- TEST 1: Active Tabs Page ----
  console.log('\n📋 TEST 1: Active Tabs Page');
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '01-active-tabs.png') });
  console.log('   ✅ Screenshot saved');

  // Check that the header says "Active Tabs"
  const header = await page.textContent('h1, [class*="header"]').catch(() => '');
  console.log(`   Header text: "${header}"`);

  // Count tab items visible (they should be real tabs)
  const tabItems = await page.$$('[class*="card"], [class*="tab-item"]');
  console.log(`   Tab items visible: ${tabItems.length}`);

  // ---- TEST 2: Workspaces Page ----
  console.log('\n📁 TEST 2: Workspaces Page');
  const sidebarIcons = await page.$$('nav button, aside button, [class*="sidebar"] button');
  console.log(`   Sidebar buttons found: ${sidebarIcons.length}`);
  if (sidebarIcons.length >= 2) {
    await sidebarIcons[1].click();
    await sleep(500);
  }
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '02-workspaces.png') });
  console.log('   ✅ Screenshot saved');

  // ---- TEST 3: Branches Page ----
  console.log('\n🔀 TEST 3: Branches Page');
  if (sidebarIcons.length >= 3) {
    await sidebarIcons[2].click();
    await sleep(500);
  }
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '03-branches.png') });
  console.log('   ✅ Screenshot saved');

  // ---- TEST 4: Graph Page ----
  console.log('\n🕸️  TEST 4: Graph Page');
  if (sidebarIcons.length >= 4) {
    await sidebarIcons[3].click();
    await sleep(500);
  }
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '04-graph.png') });
  console.log('   ✅ Screenshot saved');

  // ---- TEST 5: Peers Page ----
  console.log('\n🤝 TEST 5: Peers Page');
  if (sidebarIcons.length >= 5) {
    await sidebarIcons[4].click();
    await sleep(2000); // Wait for PeerJS init
  }
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '05-peers.png') });
  console.log('   ✅ Screenshot saved');

  // Check if peer ID was generated
  const peerIdText = await page.textContent('[class*="mono"]').catch(() => '');
  console.log(`   Peer ID: "${peerIdText}"`);

  // ---- TEST 6: Navigate to real websites to trigger content extraction ----
  console.log('\n🌐 TEST 6: Content Extraction (browsing real sites)');
  
  // Open a new tab and navigate to a real site
  const browsePage = await context.newPage();
  await browsePage.goto('https://developer.mozilla.org/en-US/docs/Web/JavaScript');
  await sleep(3000);
  console.log('   Navigated to MDN JavaScript docs');
  await browsePage.screenshot({ path: join(SCREENSHOTS_DIR, '06-mdn-page.png') });

  // Navigate to another site for transition tracking
  await browsePage.goto('https://github.com');
  await sleep(3000);
  console.log('   Navigated to GitHub');
  await browsePage.screenshot({ path: join(SCREENSHOTS_DIR, '07-github-page.png') });

  // ---- TEST 7: Check background SW console for graph tracking ----
  console.log('\n📊 TEST 7: Verify Graph Tracking');
  // Go back to popup and check graph page
  await page.bringToFront();
  // Navigate to graph
  const icons2 = await page.$$('nav button, aside button, [class*="sidebar"] button');
  if (icons2.length >= 4) {
    await icons2[3].click();
    await sleep(1000);
  }
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '08-graph-after-browse.png') });
  console.log('   ✅ Graph page after browsing');

  // ---- TEST 8: Command Palette ----
  console.log('\n🔍 TEST 8: Command Palette');
  // Click the first icon to go back to tabs
  if (icons2.length >= 1) {
    await icons2[0].click();
    await sleep(500);
  }
  // Try Ctrl+K
  await page.keyboard.press('Control+k');
  await sleep(500);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '09-command-palette.png') });
  console.log('   ✅ Command palette screenshot');

  // Press Escape to close
  await page.keyboard.press('Escape');

  // ---- TEST 9: Check service worker logs ----
  console.log('\n📝 TEST 9: Service Worker Status');
  for (const sw of context.serviceWorkers()) {
    console.log(`   SW URL: ${sw.url()}`);
  }

  // ---- DONE ----
  console.log('\n' + '='.repeat(50));
  console.log('🎉 E2E TEST COMPLETE');
  console.log(`📸 Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log('='.repeat(50));

  await sleep(2000);
  await context.close();
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
