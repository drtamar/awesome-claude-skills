import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { createHmac, timingSafeEqual } from 'crypto';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const PORT = parseInt(process.env.PROXY_PORT || '3456');
const HOST = process.env.PROXY_HOST || '127.0.0.1';
const SIGNING_SECRET = process.env.SIGNING_SECRET || '';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT || '60');
// Comma-separated extension IDs allowed to call the proxy. "*" allows any
// chrome-extension origin but still blocks regular web pages. For strong
// isolation, set this to your extension's exact ID (shown on chrome://extensions).
const ALLOWED_EXTENSION_IDS = (process.env.ALLOWED_EXTENSION_IDS || '*')
  .split(',').map(s => s.trim()).filter(Boolean);
// /api/claude-code runs the Claude Code CLI on this machine. OFF by default
// and must be explicitly opted into — treat it as remote command execution.
const ALLOW_CLAUDE_CODE_EXEC = process.env.ALLOW_CLAUDE_CODE_EXEC === 'true';

// Fail closed: refuse to start without a real signing secret. Without one, a
// malicious web page could drive the proxy regardless of CORS.
const WEAK_SECRETS = new Set(['', 'change-me', 'change-me-to-a-random-secret', 'secret']);
if (WEAK_SECRETS.has(SIGNING_SECRET) || SIGNING_SECRET.length < 32) {
  console.error('\n[FATAL] SIGNING_SECRET is missing, default, or shorter than 32 chars.');
  console.error('Generate one, put it in .env, and paste the same value into the');
  console.error('extension Options page. Example:');
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
  process.exit(1);
}

function isAllowedExtensionOrigin(origin) {
  // Only chrome-extension:// origins are ever permitted; web pages cannot
  // reach the proxy even if they know its URL.
  if (!origin || !origin.startsWith('chrome-extension://')) return false;
  if (ALLOWED_EXTENSION_IDS.includes('*')) return true;
  const id = origin.slice('chrome-extension://'.length).replace(/\/.*$/, '');
  return ALLOWED_EXTENSION_IDS.includes(id);
}

const app = express();
const server = createServer(app);
// noServer=true so we can gate the upgrade ourselves (origin check).
const wss = new WebSocketServer({ noServer: true });

const sessions = new Map();
const automations = new Map();

app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: (origin, cb) => {
    if (isAllowedExtensionOrigin(origin)) return cb(null, true);
    const err = new Error('Origin not allowed');
    err.status = 403;
    cb(err);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-signature', 'x-timestamp']
}));

// Turn CORS and body-parser errors into clean JSON instead of an HTML stack trace.
app.use((err, _req, res, next) => {
  if (err?.message === 'Origin not allowed') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (err && typeof err.status === 'number' && err.status < 500) {
    return res.status(err.status).json({ error: err.message || 'Bad request' });
  }
  next(err);
});

const limiter = rateLimit({
  windowMs: 60_000,
  max: RATE_LIMIT_MAX,
  message: { error: 'Rate limit exceeded' }
});
// Rate limit only /api so /health polling doesn't burn the budget.
app.use('/api', limiter);

// Canonical signed payload covers method + path so a signature cannot be
// replayed against a different endpoint.
function verifyHmac(ts, sig, method, path, bodyString) {
  if (!sig || !ts) return false;
  if (Math.abs(Date.now() - parseInt(ts)) > 30_000) return false;
  const expected = createHmac('sha256', SIGNING_SECRET)
    .update(`${ts}:${method.toUpperCase()}:${path}:${bodyString}`)
    .digest('hex');
  try {
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}

// Mandatory, fail-closed signature check for every /api route.
function verifySignature(req, res, next) {
  const bodyString = ['GET', 'DELETE'].includes(req.method) ? '' : JSON.stringify(req.body ?? {});
  const ok = verifyHmac(
    req.headers['x-timestamp'],
    req.headers['x-signature'],
    req.method,
    req.path,
    bodyString
  );
  if (!ok) return res.status(401).json({ error: 'Invalid or missing signature' });
  next();
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a browser automation assistant embedded in a Chrome extension. You generate executable JavaScript code and automation sequences based on user requests.

Your capabilities:
1. **Web Scraping**: Extract data from pages - text, tables, links, images, metadata. Output as JSON/CSV.
2. **Page Control**: Click elements, fill forms, navigate, scroll, handle popups, manage tabs, take screenshots.
3. **Code Injection**: Inject and execute JS/CSS on any page, modify DOM, intercept network requests.
4. **Download Management**: Download files, manage download queues, trigger installations.
5. **Automation Sequences**: Chain multiple actions into reusable workflows.

When generating code:
- Return valid JavaScript that runs in a content script context
- Use document.querySelector/querySelectorAll for DOM access
- For multi-step automations, return an array of action objects
- Handle errors gracefully with try/catch
- Include waits/delays for dynamic content

Response format for automations:
{
  "type": "automation",
  "name": "descriptive name",
  "steps": [
    { "action": "script", "code": "...", "description": "what this does" },
    { "action": "wait", "selector": "...", "timeout": 5000 },
    { "action": "click", "selector": "..." },
    { "action": "extract", "selector": "...", "format": "json" },
    { "action": "screenshot", "fullPage": true },
    { "action": "navigate", "url": "..." },
    { "action": "download", "url": "..." },
    { "action": "inject_css", "css": "..." },
    { "action": "fill", "selector": "...", "value": "..." },
    { "action": "scroll", "direction": "down", "amount": 500 }
  ]
}

For simple code execution, return:
{ "type": "script", "code": "...", "description": "..." }

For data extraction, return:
{ "type": "extraction", "code": "...", "format": "json|csv|text" }`;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size, automations: automations.size });
});

app.post('/api/session', verifySignature, (req, res) => {
  const id = randomUUID();
  sessions.set(id, {
    id,
    created: Date.now(),
    messages: [],
    context: req.body.context || {}
  });
  res.json({ sessionId: id });
});

app.post('/api/chat', verifySignature, async (req, res) => {
  const { sessionId, message, pageContext } = req.body;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  const session = sessions.get(sessionId);
  const contextMsg = pageContext
    ? `\n\n[Current page: ${pageContext.url}]\n[Title: ${pageContext.title}]\n[DOM snippet: ${pageContext.domSnippet || 'N/A'}]`
    : '';

  session.messages.push({ role: 'user', content: message + contextMsg });

  try {
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '8192'),
      system: SYSTEM_PROMPT,
      messages: session.messages
    });

    const assistantMsg = response.content[0].text;
    session.messages.push({ role: 'assistant', content: assistantMsg });

    // Prefer a fenced ```json block; the previous greedy brace fallback
    // misparsed responses containing prose plus multiple JSON blocks.
    let parsed = null;
    const fenced = assistantMsg.match(/```json\n([\s\S]*?)\n```/);
    if (fenced) {
      try { parsed = JSON.parse(fenced[1]); } catch {}
    }

    res.json({ response: assistantMsg, automation: parsed, sessionId });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/claude-code', verifySignature, async (req, res) => {
  if (!ALLOW_CLAUDE_CODE_EXEC) {
    return res.status(403).json({
      error: 'Claude Code execution is disabled. Set ALLOW_CLAUDE_CODE_EXEC=true in .env to enable (effectively grants the extension command execution on this machine).'
    });
  }
  const { command, workDir } = req.body;
  const cliPath = process.env.CLAUDE_CODE_PATH || 'claude';
  const cwd = workDir || process.env.CLAUDE_WORK_DIR || process.cwd();

  const resolvedCwd = cwd.replace(/^~/, process.env.HOME || '/home/user');
  if (!existsSync(resolvedCwd)) mkdirSync(resolvedCwd, { recursive: true });

  try {
    const result = await new Promise((resolve, reject) => {
      const proc = spawn(cliPath, ['--print', command], {
        cwd: resolvedCwd,
        timeout: (parseInt(process.env.SESSION_TIMEOUT || '30')) * 60_000,
        env: { ...process.env }
      });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => {
        if (code === 0) resolve(stdout);
        else reject(new Error(stderr || `Exit code ${code}`));
      });
      proc.on('error', reject);
    });
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/automation', verifySignature, (req, res) => {
  const { name, steps, schedule } = req.body;
  const id = randomUUID();
  automations.set(id, { id, name, steps, schedule, created: Date.now(), runs: [] });
  res.json({ automationId: id, automation: automations.get(id) });
});

app.get('/api/automations', verifySignature, (_req, res) => {
  res.json({ automations: [...automations.values()] });
});

app.delete('/api/automation/:id', verifySignature, (req, res) => {
  automations.delete(req.params.id);
  res.json({ ok: true });
});

app.post('/api/automation/:id/run', verifySignature, (req, res) => {
  const auto = automations.get(req.params.id);
  if (!auto) return res.status(404).json({ error: 'Not found' });
  const runId = randomUUID();
  auto.runs.push({ runId, started: Date.now(), status: 'pending' });
  res.json({ runId, automation: auto });
});

// Gate the WebSocket upgrade: refuse anything that is not an allowed
// chrome-extension origin before the socket is ever established.
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws' || !isAllowedExtensionOrigin(req.headers.origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

wss.on('connection', (ws) => {
  const clientId = randomUUID();
  console.log(`WebSocket client connected: ${clientId}`);

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'stream_chat') {
        // Each WS message must be individually signed. Canonical payload: ts:WS:sessionId:message
        const ok = verifyHmac(msg.ts, msg.sig, 'WS', msg.sessionId || '', msg.message || '');
        if (!ok) { ws.send(JSON.stringify({ type: 'error', error: 'Invalid or missing signature' })); return; }

        const session = sessions.get(msg.sessionId);
        if (!session) { ws.send(JSON.stringify({ error: 'Invalid session' })); return; }

        session.messages.push({ role: 'user', content: msg.message });

        const stream = anthropic.messages.stream({
          model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
          max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '8192'),
          system: SYSTEM_PROMPT,
          messages: session.messages
        });

        let fullResponse = '';
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.text) {
            fullResponse += event.delta.text;
            ws.send(JSON.stringify({ type: 'chunk', text: event.delta.text }));
          }
        }
        session.messages.push({ role: 'assistant', content: fullResponse });
        ws.send(JSON.stringify({ type: 'done', fullResponse }));
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'error', error: err.message }));
    }
  });

  ws.on('close', () => console.log(`Client disconnected: ${clientId}`));
});

server.listen(PORT, HOST, () => {
  console.log(`Claude Browser Automation Proxy running at http://${HOST}:${PORT}`);
  console.log(`WebSocket available at ws://${HOST}:${PORT}/ws`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`CORS limited to extension IDs: ${ALLOWED_EXTENSION_IDS.join(', ')}`);
  console.log(`Claude Code CLI exec: ${ALLOW_CLAUDE_CODE_EXEC ? 'ENABLED (dangerous)' : 'disabled'}`);
});
