export class ClaudeAPI {
  constructor(proxyUrl = 'http://127.0.0.1:3456') {
    this.proxyUrl = proxyUrl;
    this.sessionId = null;
    this.ws = null;
  }

  async request(endpoint, body = {}) {
    const res = await fetch(`${this.proxyUrl}${endpoint}`, {
      method: endpoint.startsWith('/api/') && !body._get ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: body._get ? undefined : JSON.stringify(body)
    });
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
    return this.request('/api/chat', {
      sessionId: this.sessionId,
      message,
      pageContext
    });
  }

  async runClaudeCode(command, workDir) {
    return this.request('/api/claude-code', { command, workDir });
  }

  async saveAutomation(automation) {
    return this.request('/api/automation', automation);
  }

  async getAutomations() {
    const res = await fetch(`${this.proxyUrl}/api/automations`);
    return res.json();
  }

  async deleteAutomation(id) {
    await fetch(`${this.proxyUrl}/api/automation/${id}`, { method: 'DELETE' });
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
    this.ws.send(JSON.stringify({
      type: 'stream_chat',
      sessionId: this.sessionId,
      message
    }));
  }

  async healthCheck() {
    const res = await fetch(`${this.proxyUrl}/health`);
    return res.json();
  }
}
