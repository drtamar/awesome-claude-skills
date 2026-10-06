import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHmac } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const PORT = process.env.PROXY_PORT || 3456;
const HOST = process.env.PROXY_HOST || '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;
const SECRET = process.env.SIGNING_SECRET || '';
// The proxy only accepts calls from chrome-extension:// origins; the test
// client spoofs one (valid because it also presents a correct signature).
const ORIGIN = 'chrome-extension://test-suite';

// Signed fetch matching the proxy canonical payload: ts:METHOD:path:body
async function signedFetch(path, { method = 'POST', body } = {}) {
  const ts = Date.now().toString();
  const bodyString = ['GET', 'DELETE'].includes(method) ? '' : JSON.stringify(body ?? {});
  const sig = createHmac('sha256', SECRET).update(`${ts}:${method}:${path}:${bodyString}`).digest('hex');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'x-signature': sig, 'x-timestamp': ts, 'Origin': ORIGIN }
  };
  if (!['GET', 'DELETE'].includes(method)) opts.body = JSON.stringify(body ?? {});
  return fetch(`${BASE}${path}`, opts);
}

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
  if (!SECRET) {
    console.error('SIGNING_SECRET not set in .env — run setup first.\n');
    process.exit(1);
  }

  await test('Health check', async () => {
    const res = await fetch(`${BASE}/health`, { headers: { 'Origin': ORIGIN } });
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Bad status');
  });

  await test('Health check from a web origin is rejected', async () => {
    const res = await fetch(`${BASE}/health`, { headers: { 'Origin': 'https://evil.example.com' } });
    if (res.ok) throw new Error('Should reject non-extension origin');
  });

  await test('Unsigned request is rejected (401)', async () => {
    const res = await fetch(`${BASE}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
      body: JSON.stringify({ context: {} })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  let sessionId;
  await test('Create session (signed)', async () => {
    const res = await signedFetch('/api/session', { body: { context: { test: true } } });
    const data = await res.json();
    sessionId = data.sessionId;
    if (!sessionId) throw new Error('No session ID');
  });

  await test('Chat (requires API key)', async () => {
    const res = await signedFetch('/api/chat', {
      body: {
        sessionId,
        message: 'Generate a simple script to get the page title',
        pageContext: { url: 'https://example.com', title: 'Example' }
      }
    });
    const data = await res.json();
    if (data.error && data.error.includes('API')) {
      console.log('    (API key not configured - set ANTHROPIC_API_KEY in .env)');
      return;
    }
    if (!data.response) throw new Error('No response');
  });

  await test('Save automation (signed)', async () => {
    const res = await signedFetch('/api/automation', {
      body: { name: 'Test Automation', steps: [{ action: 'script', code: 'return document.title;' }] }
    });
    const data = await res.json();
    if (!data.automationId) throw new Error('No automation ID');
  });

  await test('List automations (signed)', async () => {
    const res = await signedFetch('/api/automations', { method: 'GET' });
    const data = await res.json();
    if (!Array.isArray(data.automations)) throw new Error('Not an array');
  });

  await test('Claude Code exec is gated (403 unless enabled)', async () => {
    const res = await signedFetch('/api/claude-code', { body: { command: 'echo hi' } });
    if (process.env.ALLOW_CLAUDE_CODE_EXEC === 'true') {
      if (!res.ok) throw new Error('Expected success when exec enabled');
    } else if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  console.log('\nDone!\n');
}

run().catch(err => {
  console.error(`\nConnection failed: ${err.message}`);
  console.error('Make sure the proxy server is running: npm start\n');
  process.exit(1);
});
