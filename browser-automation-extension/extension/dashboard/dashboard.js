document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(`tab-${item.dataset.tab}`).classList.add('active');
  });
});

async function loadAutomations() {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'get_automations' });
    const grid = document.getElementById('automation-grid');
    const empty = document.getElementById('empty-automations');

    if (!resp.automations?.length) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = resp.automations.map(a => `
      <div class="automation-card" data-id="${a.id}">
        <h4>${a.name}</h4>
        <p>${a.steps?.length || 0} steps</p>
        <div class="meta">
          <span>${new Date(a.created).toLocaleDateString()}</span>
          <span>${a.runs?.length || 0} runs</span>
        </div>
        <div style="margin-top:10px;display:flex;gap:6px">
          <button class="btn btn-primary btn-small run-auto" data-id="${a.id}">Run</button>
          <button class="btn btn-danger btn-small del-auto" data-id="${a.id}">Delete</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.run-auto').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const auto = resp.automations.find(a => a.id === btn.dataset.id);
        if (auto) {
          const result = await chrome.runtime.sendMessage({ type: 'execute_automation', automation: auto });
          addHistory(auto.name, result.results ? 'success' : 'error');
        }
      });
    });

    grid.querySelectorAll('.del-auto').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const settings = await chrome.storage.local.get('settings');
        const proxyUrl = settings.settings?.proxyUrl || 'http://127.0.0.1:3456';
        await fetch(`${proxyUrl}/api/automation/${btn.dataset.id}`, { method: 'DELETE' });
        loadAutomations();
      });
    });
  } catch (err) {
    console.error('Failed to load automations:', err);
  }
}

document.getElementById('btn-new-automation').addEventListener('click', () => {
  const name = prompt('Automation name:');
  if (!name) return;
  const stepsJson = prompt('Paste automation steps JSON (or leave empty):');
  let steps = [];
  try { if (stepsJson) steps = JSON.parse(stepsJson); } catch {}
  chrome.runtime.sendMessage({
    type: 'save_automation',
    automation: { name, steps }
  }, () => loadAutomations());
});

document.getElementById('btn-scrape').addEventListener('click', async () => {
  const url = document.getElementById('scrape-url').value;
  const selector = document.getElementById('scrape-selector').value;
  const format = document.getElementById('scrape-format').value;

  const message = selector
    ? `Scrape elements matching "${selector}" from ${url || 'the current page'} and return as ${format}.`
    : `Scrape all meaningful data from ${url || 'the current page'} and return as ${format}.`;

  const resp = await chrome.runtime.sendMessage({ type: 'chat', message });
  const resultsCard = document.getElementById('scrape-results-card');
  const resultsEl = document.getElementById('scrape-results');
  resultsCard.style.display = 'block';
  resultsEl.textContent = resp.response || resp.error || 'No results';
  addHistory(`Scrape: ${url || 'current page'}`, resp.error ? 'error' : 'success');
});

document.getElementById('btn-copy-results').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('scrape-results').textContent);
});

document.getElementById('btn-download-results').addEventListener('click', () => {
  const text = document.getElementById('scrape-results').textContent;
  const format = document.getElementById('scrape-format').value;
  const ext = { json: 'json', csv: 'csv', text: 'txt' }[format] || 'txt';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: `scrape-results.${ext}` });
});

document.getElementById('btn-inject-js').addEventListener('click', async () => {
  const code = document.getElementById('inject-js').value;
  const resp = await chrome.runtime.sendMessage({ type: 'execute_script', code: `function() { ${code} }` });
  const output = document.getElementById('inject-output');
  output.style.display = 'block';
  output.textContent = resp.error || JSON.stringify(resp.result, null, 2) || 'Executed (no return value)';
  addHistory('JS Injection', resp.error ? 'error' : 'success');
});

document.getElementById('btn-inject-css').addEventListener('click', async () => {
  const css = document.getElementById('inject-css').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { type: 'inject_css', css });
    addHistory('CSS Injection', 'success');
  }
});

document.getElementById('btn-remove-css').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: 'remove_injected_css' });
});

document.getElementById('btn-ai-generate').addEventListener('click', async () => {
  const prompt = document.getElementById('ai-code-prompt').value;
  if (!prompt) return;
  const resp = await chrome.runtime.sendMessage({
    type: 'chat',
    message: `Generate JavaScript code that does the following on the current page: ${prompt}. Return only the code, no explanation.`
  });
  const output = document.getElementById('ai-generated-code');
  output.style.display = 'block';
  output.textContent = resp.response || resp.error;
});

document.getElementById('btn-bulk-download').addEventListener('click', () => {
  const urls = document.getElementById('download-urls').value.split('\n').map(u => u.trim()).filter(Boolean);
  urls.forEach(url => {
    chrome.downloads.download({ url });
    appendDownloadItem(url);
  });
  addHistory(`Bulk download: ${urls.length} files`, 'success');
});

document.getElementById('btn-dl-images').addEventListener('click', async () => {
  const resp = await chrome.runtime.sendMessage({
    type: 'execute_script',
    code: `function() { return [...document.querySelectorAll('img')].map(i => i.src).filter(Boolean); }`
  });
  (resp.result || []).forEach(url => {
    chrome.downloads.download({ url });
    appendDownloadItem(url);
  });
});

document.getElementById('btn-dl-links').addEventListener('click', async () => {
  const resp = await chrome.runtime.sendMessage({
    type: 'execute_script',
    code: `function() { return [...document.querySelectorAll('a[href]')].map(a => a.href).filter(h => /\\.(pdf|zip|doc|xls|csv|txt|png|jpg)$/i.test(h)); }`
  });
  (resp.result || []).forEach(url => {
    chrome.downloads.download({ url });
    appendDownloadItem(url);
  });
});

document.getElementById('btn-dl-media').addEventListener('click', async () => {
  const resp = await chrome.runtime.sendMessage({
    type: 'execute_script',
    code: `function() { return [...document.querySelectorAll('video source, audio source, video[src], audio[src]')].map(el => el.src || el.getAttribute('src')).filter(Boolean); }`
  });
  (resp.result || []).forEach(url => {
    chrome.downloads.download({ url });
    appendDownloadItem(url);
  });
});

function appendDownloadItem(url) {
  const list = document.getElementById('download-list');
  const item = document.createElement('div');
  item.className = 'download-item';
  item.innerHTML = `<span style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:80%">${url}</span><span class="action-status status-success">downloading</span>`;
  list.appendChild(item);
}

document.getElementById('btn-cc-run').addEventListener('click', async () => {
  const command = document.getElementById('cc-command').value;
  const workDir = document.getElementById('cc-workdir').value;
  if (!command) return;
  const output = document.getElementById('cc-output');
  output.style.display = 'block';
  output.textContent = 'Running...';

  const resp = await chrome.runtime.sendMessage({
    type: 'claude_code',
    command,
    workDir: workDir || undefined
  });
  output.textContent = resp.result || resp.error || 'No output';
  addHistory(`Claude Code: ${command.substring(0, 50)}`, resp.error ? 'error' : 'success');
});

document.getElementById('btn-clear-history').addEventListener('click', async () => {
  await chrome.storage.local.set({ history: [] });
  renderHistory();
});

function addHistory(name, status) {
  chrome.storage.local.get('history', ({ history = [] }) => {
    history.unshift({ name, status, time: Date.now() });
    if (history.length > 100) history = history.slice(0, 100);
    chrome.storage.local.set({ history }, renderHistory);
  });
}

function renderHistory() {
  chrome.storage.local.get('history', ({ history = [] }) => {
    const list = document.getElementById('history-list');
    const empty = document.getElementById('empty-history');

    if (!history.length) {
      list.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    list.style.display = 'flex';
    empty.style.display = 'none';
    list.innerHTML = history.map(h => `
      <div class="history-item">
        <div>
          <div class="action-name">${h.name}</div>
          <div class="action-time">${new Date(h.time).toLocaleString()}</div>
        </div>
        <span class="action-status ${h.status === 'success' ? 'status-success' : 'status-error'}">${h.status}</span>
      </div>
    `).join('');
  });
}

loadAutomations();
renderHistory();
