import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const PORT = process.env.PROXY_PORT || 3456;
const HOST = process.env.PROXY_HOST || '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.log(`  ✗ ${name}: ${err.message}`);
  }
}

async function run() {
  console.log(`\nTesting proxy at ${BASE}...\n`);

  await test('Health check', async () => {
    const res = await fetch(`${BASE}/health`);
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Bad status');
  });

  let sessionId;
  await test('Create session', async () => {
    const res = await fetch(`${BASE}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { test: true } })
    });
    const data = await res.json();
    sessionId = data.sessionId;
    if (!sessionId) throw new Error('No session ID');
  });

  await test('Chat (requires API key)', async () => {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: 'Generate a simple script to get the page title',
        pageContext: { url: 'https://example.com', title: 'Example' }
      })
    });
    const data = await res.json();
    if (data.error && data.error.includes('API')) {
      console.log('    (API key not configured - set ANTHROPIC_API_KEY in .env)');
      return;
    }
    if (!data.response) throw new Error('No response');
  });

  await test('Save automation', async () => {
    const res = await fetch(`${BASE}/api/automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Automation',
        steps: [{ action: 'script', code: 'return document.title;' }]
      })
    });
    const data = await res.json();
    if (!data.automationId) throw new Error('No automation ID');
  });

  await test('List automations', async () => {
    const res = await fetch(`${BASE}/api/automations`);
    const data = await res.json();
    if (!Array.isArray(data.automations)) throw new Error('Not an array');
  });

  console.log('\nDone!\n');
}

run().catch(err => {
  console.error(`\nConnection failed: ${err.message}`);
  console.error('Make sure the proxy server is running: npm start\n');
  process.exit(1);
});
