const PROXY_URL = 'http://127.0.0.1:3456';
let currentSession = null;
let ws = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'claude-automate',
    title: 'Automate with Claude',
    contexts: ['page', 'selection', 'image', 'link']
  });
  chrome.contextMenus.create({
    id: 'claude-scrape',
    title: 'Scrape this element',
    contexts: ['page', 'selection']
  });
  chrome.contextMenus.create({
    id: 'claude-inspect',
    title: 'Inspect with Claude',
    contexts: ['page', 'selection']
  });
});

async function getSettings() {
  const defaults = {
    proxyUrl: PROXY_URL,
    signingSecret: '',
    enableSigning: false
  };
  const stored = await chrome.storage.local.get('settings');
  return { ...defaults, ...stored.settings };
}

async function makeRequest(endpoint, body = {}) {
  const settings = await getSettings();
  const url = `${settings.proxyUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };

  if (settings.enableSigning && settings.signingSecret) {
    const ts = Date.now().toString();
    const data = `${ts}:${JSON.stringify(body)}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(settings.signingSecret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    headers['x-signature'] = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    headers['x-timestamp'] = ts;
  }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function ensureSession(context = {}) {
  if (!currentSession) {
    const { sessionId } = await makeRequest('/api/session', { context });
    currentSession = sessionId;
  }
  return currentSession;
}

async function getPageContext(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        url: location.href,
        title: document.title,
        domSnippet: document.body?.innerText?.substring(0, 2000) || ''
      })
    });
    return result?.result || {};
  } catch {
    return {};
  }
}

async function executeAutomation(tabId, automation) {
  const results = [];
  for (const step of automation.steps || []) {
    try {
      let result;
      switch (step.action) {
        case 'script':
          [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: new Function(step.code)
          });
          results.push({ step: step.description, result: result?.result });
          break;

        case 'click':
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (sel) => document.querySelector(sel)?.click(),
            args: [step.selector]
          });
          results.push({ step: `Clicked ${step.selector}` });
          break;

        case 'fill':
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (sel, val) => {
              const el = document.querySelector(sel);
              if (el) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }
            },
            args: [step.selector, step.value]
          });
          results.push({ step: `Filled ${step.selector}` });
          break;

        case 'wait':
          await new Promise(resolve => {
            const timeout = step.timeout || 5000;
            const start = Date.now();
            const check = async () => {
              const [found] = await chrome.scripting.executeScript({
                target: { tabId },
                func: (sel) => !!document.querySelector(sel),
                args: [step.selector]
              });
              if (found?.result || Date.now() - start > timeout) resolve();
              else setTimeout(check, 200);
            };
            check();
          });
          results.push({ step: `Waited for ${step.selector}` });
          break;

        case 'extract':
          [result] = await chrome.scripting.executeScript({
            target: { tabId },
            func: (sel, fmt) => {
              const els = [...document.querySelectorAll(sel)];
              const data = els.map(el => ({
                text: el.textContent?.trim(),
                html: el.innerHTML,
                tag: el.tagName,
                attrs: Object.fromEntries([...el.attributes].map(a => [a.name, a.value]))
              }));
              if (fmt === 'csv') {
                const keys = Object.keys(data[0] || {});
                return [keys.join(','), ...data.map(d => keys.map(k => JSON.stringify(d[k] || '')).join(','))].join('\n');
              }
              return data;
            },
            args: [step.selector, step.format || 'json']
          });
          results.push({ step: `Extracted from ${step.selector}`, data: result?.result });
          break;

        case 'screenshot':
          result = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 80
          });
          results.push({ step: 'Screenshot captured', dataUrl: result });
          break;

        case 'navigate':
          await chrome.tabs.update(tabId, { url: step.url });
          await new Promise(r => {
            const listener = (id, info) => {
              if (id === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                r();
              }
            };
            chrome.tabs.onUpdated.addListener(listener);
          });
          results.push({ step: `Navigated to ${step.url}` });
          break;

        case 'download':
          await chrome.downloads.download({ url: step.url, filename: step.filename });
          results.push({ step: `Downloaded ${step.url}` });
          break;

        case 'inject_css':
          await chrome.scripting.insertCSS({
            target: { tabId },
            css: step.css
          });
          results.push({ step: 'CSS injected' });
          break;

        case 'scroll':
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (dir, amt) => {
              const y = dir === 'up' ? -amt : amt;
              window.scrollBy({ top: y, behavior: 'smooth' });
            },
            args: [step.direction || 'down', step.amount || 500]
          });
          results.push({ step: `Scrolled ${step.direction || 'down'}` });
          break;

        default:
          results.push({ step: `Unknown action: ${step.action}`, error: true });
      }
    } catch (err) {
      results.push({ step: step.description || step.action, error: err.message });
    }
  }
  return results;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg.type) {
        case 'chat': {
          const sessionId = await ensureSession();
          const tab = await chrome.tabs.query({ active: true, currentWindow: true });
          const pageContext = tab[0] ? await getPageContext(tab[0].id) : {};
          const result = await makeRequest('/api/chat', { sessionId, message: msg.message, pageContext });

          if (result.automation && tab[0]) {
            const execResults = await executeAutomation(tab[0].id, result.automation);
            sendResponse({ ...result, executionResults: execResults });
          } else {
            sendResponse(result);
          }
          break;
        }

        case 'execute_automation': {
          const tab = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab[0]) {
            const results = await executeAutomation(tab[0].id, msg.automation);
            sendResponse({ results });
          }
          break;
        }

        case 'execute_script': {
          const tab = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab[0]) {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tab[0].id },
              func: new Function('return (' + msg.code + ')();')
            });
            sendResponse({ result: result?.result });
          }
          break;
        }

        case 'claude_code': {
          const result = await makeRequest('/api/claude-code', {
            command: msg.command,
            workDir: msg.workDir
          });
          sendResponse(result);
          break;
        }

        case 'save_automation': {
          const result = await makeRequest('/api/automation', msg.automation);
          sendResponse(result);
          break;
        }

        case 'get_automations': {
          const settings = await getSettings();
          const res = await fetch(`${settings.proxyUrl}/api/automations`);
          sendResponse(await res.json());
          break;
        }

        case 'new_session': {
          currentSession = null;
          const sessionId = await ensureSession(msg.context || {});
          sendResponse({ sessionId });
          break;
        }

        case 'health_check': {
          const settings = await getSettings();
          const res = await fetch(`${settings.proxyUrl}/health`);
          sendResponse(await res.json());
          break;
        }

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (err) {
      sendResponse({ error: err.message });
    }
  })();
  return true;
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const sessionId = await ensureSession();
  const pageContext = await getPageContext(tab.id);
  let message = '';

  switch (info.menuItemId) {
    case 'claude-automate':
      message = info.selectionText
        ? `Create an automation for the selected text: "${info.selectionText}" on this page.`
        : `Suggest useful automations for this page: ${pageContext.url}`;
      break;
    case 'claude-scrape':
      message = info.selectionText
        ? `Scrape and extract data similar to this selection: "${info.selectionText}"`
        : `Scrape all meaningful data from this page and return as structured JSON.`;
      break;
    case 'claude-inspect':
      message = info.selectionText
        ? `Analyze this element/text: "${info.selectionText}"`
        : `Analyze this page structure and suggest what can be automated.`;
      break;
  }

  const result = await makeRequest('/api/chat', { sessionId, message, pageContext });

  if (result.automation) {
    await executeAutomation(tab.id, result.automation);
  }

  chrome.tabs.sendMessage(tab.id, {
    type: 'show_result',
    data: result
  });
});
