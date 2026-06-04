export class AutomationEngine {
  constructor() {
    this.running = new Map();
    this.maxConcurrent = 5;
  }

  async executeStep(tabId, step) {
    switch (step.action) {
      case 'script':
        return this.executeScript(tabId, step.code);
      case 'click':
        return this.click(tabId, step.selector);
      case 'fill':
        return this.fill(tabId, step.selector, step.value);
      case 'wait':
        return this.waitFor(tabId, step.selector, step.timeout);
      case 'extract':
        return this.extract(tabId, step.selector, step.format);
      case 'screenshot':
        return this.screenshot();
      case 'navigate':
        return this.navigate(tabId, step.url);
      case 'download':
        return this.download(step.url, step.filename);
      case 'inject_css':
        return this.injectCSS(tabId, step.css);
      case 'scroll':
        return this.scroll(tabId, step.direction, step.amount);
      case 'delay':
        return new Promise(r => setTimeout(r, step.ms || 1000));
      case 'keyboard':
        return this.keyboard(tabId, step.key, step.modifiers);
      case 'select':
        return this.selectOption(tabId, step.selector, step.value);
      case 'hover':
        return this.hover(tabId, step.selector);
      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  async executeScript(tabId, code) {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: new Function(code)
    });
    return result?.result;
  }

  async click(tabId, selector) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element not found: ${sel}`);
        el.click();
      },
      args: [selector]
    });
  }

  async fill(tabId, selector, value) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element not found: ${sel}`);
        el.focus();
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      args: [selector, value]
    });
  }

  async waitFor(tabId, selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const [found] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (sel) => !!document.querySelector(sel),
        args: [selector]
      });
      if (found?.result) return;
      await new Promise(r => setTimeout(r, 200));
    }
    throw new Error(`Timeout waiting for: ${selector}`);
  }

  async extract(tabId, selector, format = 'json') {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel, fmt) => {
        const els = [...document.querySelectorAll(sel)];
        const data = els.map(el => ({
          text: el.textContent?.trim(),
          html: el.innerHTML,
          tag: el.tagName.toLowerCase(),
          href: el.href || null,
          src: el.src || null,
          attrs: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
        }));
        if (fmt === 'csv') {
          if (!data.length) return '';
          const keys = Object.keys(data[0]);
          return [keys.join(','), ...data.map(d => keys.map(k => JSON.stringify(d[k] ?? '')).join(','))].join('\n');
        }
        if (fmt === 'text') return data.map(d => d.text).join('\n');
        return data;
      },
      args: [selector, format]
    });
    return result?.result;
  }

  async screenshot() {
    return chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 80 });
  }

  async navigate(tabId, url) {
    await chrome.tabs.update(tabId, { url });
    return new Promise(resolve => {
      const listener = (id, info) => {
        if (id === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  async download(url, filename) {
    return chrome.downloads.download({ url, filename });
  }

  async injectCSS(tabId, css) {
    return chrome.scripting.insertCSS({ target: { tabId }, css });
  }

  async scroll(tabId, direction = 'down', amount = 500) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (dir, amt) => window.scrollBy({ top: dir === 'up' ? -amt : amt, behavior: 'smooth' }),
      args: [direction, amount]
    });
  }

  async keyboard(tabId, key, modifiers = {}) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (k, mods) => {
        document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', {
          key: k, ctrlKey: mods.ctrl, shiftKey: mods.shift, altKey: mods.alt, metaKey: mods.meta, bubbles: true
        }));
      },
      args: [key, modifiers]
    });
  }

  async selectOption(tabId, selector, value) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element not found: ${sel}`);
        el.value = val;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      args: [selector, value]
    });
  }

  async hover(tabId, selector) {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (sel) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`Element not found: ${sel}`);
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      },
      args: [selector]
    });
  }

  async run(tabId, automation) {
    const id = automation.id || crypto.randomUUID();
    if (this.running.size >= this.maxConcurrent) {
      throw new Error('Max concurrent automations reached');
    }

    this.running.set(id, { status: 'running', startedAt: Date.now() });
    const results = [];

    try {
      for (const step of automation.steps || []) {
        const result = await this.executeStep(tabId, step);
        results.push({ action: step.action, description: step.description, result, status: 'ok' });
      }
      this.running.get(id).status = 'completed';
    } catch (err) {
      results.push({ error: err.message, status: 'failed' });
      this.running.get(id).status = 'failed';
    }

    this.running.get(id).results = results;
    this.running.get(id).completedAt = Date.now();
    return results;
  }
}
