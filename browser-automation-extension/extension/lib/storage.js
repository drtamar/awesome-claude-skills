export const Storage = {
  async get(key, defaultValue = null) {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? defaultValue;
  },

  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },

  async remove(key) {
    await chrome.storage.local.remove(key);
  },

  async getSettings() {
    return this.get('settings', {
      proxyUrl: 'http://127.0.0.1:3456',
      enableSigning: false,
      signingSecret: '',
      timeout: 30000,
      maxConcurrent: 5,
      autoExecute: true,
      notifyComplete: true,
      enableDownloads: true,
      downloadDir: 'claude-browser'
    });
  },

  async saveSettings(settings) {
    await this.set('settings', settings);
  },

  async addToHistory(entry) {
    const history = await this.get('history', []);
    history.unshift({ ...entry, time: Date.now() });
    if (history.length > 200) history.length = 200;
    await this.set('history', history);
  },

  async getHistory() {
    return this.get('history', []);
  },

  async clearHistory() {
    await this.set('history', []);
  },

  async saveSnippet(snippet) {
    const snippets = await this.get('snippets', []);
    snippets.push({ ...snippet, id: crypto.randomUUID(), created: Date.now() });
    await this.set('snippets', snippets);
  },

  async getSnippets() {
    return this.get('snippets', []);
  },

  async deleteSnippet(id) {
    const snippets = await this.get('snippets', []);
    await this.set('snippets', snippets.filter(s => s.id !== id));
  }
};
