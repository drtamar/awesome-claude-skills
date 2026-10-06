export class ClaudeAPI {
  // signingSecret is required: the proxy rejects unsigned requests. Pass the
  // same value as SIGNING_SECRET in the proxy .env file.
  constructor(proxyUrl = 'http://127.0.0.1:3456', signingSecret = '') {
    this.proxyUrl = proxyUrl;
    this.signingSecret = signingSecret;
    this.sessionId = null;
    this.ws = null;
  }

  async #hmac(payload) {
    if (!this.signingSecret) {
      throw new Error('signingSecret is required (paste SIGNING_SECRET from the proxy .env).');
    }
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(this.signingSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async request(endpoint, body = {}, method = 'POST') {
    const ts = Date.now().toString();
    const bodyString = ['GET', 'DELETE'].includes(method) ? '' : JSON.stringify(body);
    const sig = await this.#hmac(`${ts}:${method.toUpperCase()}:${endpoint}:${bodyString}`);
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', 'x-signature': sig, 'x-timestamp': ts }
    };
    if (!['GET', 'DELETE'].includes(method)) opts.body = JSON.stringify(body);

    const res = await fetch(`${this.proxyUrl}${endpoint}`, opts);
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    return res.json();
  }

  async createSession(context = {}) {
    const { sessionId } = await this.request('/api/session', { context });
    this.sessionId = sessionId;
    return sessionId;
  }

  async chat(message, pageContext = null) {
    if (!this.sessionId) await this.createSession();
    return this.request('/api/chat', { sessionId: this.sessionId, message, pageContext });
  }

  async runClaudeCode(command, workDir) {
    return this.request('/api/claude-code', { command, workDir });
  }

  async saveAutomation(automation) {
    return this.request('/api/automation', automation);
  }

  async getAutomations() {
    return this.request('/api/automations', {}, 'GET');
  }

  async deleteAutomation(id) {
    return this.request(`/api/automation/${id}`, {}, 'DELETE');
  }

  connectWebSocket(onMessage) {
    const wsUrl = this.proxyUrl.replace(/^http/, 'ws') + '/ws';
    this.ws = new WebSocket(wsUrl);
    this.ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    this.ws.onerror = (e) => console.error('WS error:', e);
    return this.ws;
  }

  async streamChat(message, onChunk) {
    if (!this.sessionId) await this.createSession();
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket((msg) => {
        if (msg.type === 'chunk') onChunk(msg.text, false);
        else if (msg.type === 'done') onChunk(msg.fullResponse, true);
        else if (msg.type === 'error') onChunk(`Error: ${msg.error}`, true);
      });
      await new Promise((r) => { this.ws.onopen = r; });
    }
    // Each WS message is individually signed: ts:WS:sessionId:message
    const ts = Date.now().toString();
    const sig = await this.#hmac(`${ts}:WS:${this.sessionId}:${message}`);
    this.ws.send(JSON.stringify({ type: 'stream_chat', sessionId: this.sessionId, message, ts, sig }));
  }

  async healthCheck() {
    const res = await fetch(`${this.proxyUrl}/health`);
    return res.json();
  }
}
