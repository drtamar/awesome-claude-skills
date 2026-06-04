import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { createHmac } from 'crypto';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });

const PORT = parseInt(process.env.PROXY_PORT || '3456');
const HOST = process.env.PROXY_HOST || '127.0.0.1';
const SIGNING_SECRET = process.env.SIGNING_SECRET || 'change-me';
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT || '60');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const sessions = new Map();
const automations = new Map();

app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: (_origin, cb) => cb(null, true),
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 60_000,
  max: RATE_LIMIT_MAX,
  message: { error: 'Rate limit exceeded' }
});
app.use(limiter);

function verifySignature(req, res, next) {
  if (process.env.ENABLE_REQUEST_SIGNING !== 'true') return next();
  const sig = req.headers['x-signature'];
  const ts = req.headers['x-timestamp'];
  if (!sig || !ts) return res.status(401).json({ error: 'Missing signature' });
  if (Math.abs(Date.now() - parseInt(ts)) > 30_000) return res.status(401).json({ error: 'Request expired' });
  const expected = createHmac('sha256', SIGNING_SECRET)
    .update(`${ts}:${JSON.stringify(req.body)}`)
    .digest('hex');
  if (sig !== expected) return res.status(401).json({ error: 'Invalid signature' });
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

    let parsed = null;
    try {
      const jsonMatch = assistantMsg.match(/```json\n([\s\S]*?)\n```/) || assistantMsg.match(/(\{[\s\S]*\})/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[1]);
    } catch {}

    res.json({ response: assistantMsg, automation: parsed, sessionId });
  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/claude-code', verifySignature, async (req, res) => {
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

app.get('/api/automations', (_req, res) => {
  res.json({ automations: [...automations.values()] });
});

app.delete('/api/automation/:id', (req, res) => {
  automations.delete(req.params.id);
  res.json({ ok: true });
});

app.post('/api/automation/:id/run', (req, res) => {
  const auto = automations.get(req.params.id);
  if (!auto) return res.status(404).json({ error: 'Not found' });
  const runId = randomUUID();
  auto.runs.push({ runId, started: Date.now(), status: 'pending' });
  res.json({ runId, automation: auto });
});

wss.on('connection', (ws) => {
  const clientId = randomUUID();
  console.log(`WebSocket client connected: ${clientId}`);

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'stream_chat') {
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
});
