const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

let isProcessing = false;

async function checkConnection() {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'health_check' });
    if (resp?.status === 'ok') {
      statusDot.className = 'status-dot connected';
      statusText.textContent = `Connected (${resp.sessions || 0} sessions)`;
      return true;
    }
  } catch {}
  statusDot.className = 'status-dot disconnected';
  statusText.textContent = 'Proxy offline - run: npm start';
  return false;
}

function addMessage(text, role) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;

  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  if (role === 'assistant' && text.includes('"type"')) {
    html += '<br><button class="run-btn" data-code="' + encodeURIComponent(text) + '">Run Automation</button>';
  }

  msg.innerHTML = html;

  msg.querySelectorAll('.run-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = decodeURIComponent(btn.dataset.code);
      try {
        const parsed = JSON.parse(code.match(/```json\n([\s\S]*?)\n```/)?.[1] || code.match(/(\{[\s\S]*\})/)?.[1] || '{}');
        executeAutomation(parsed);
      } catch (e) {
        addMessage(`Error parsing automation: ${e.message}`, 'assistant');
      }
    });
  });

  messagesEl.appendChild(msg);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.id = 'typing';
  typing.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  messagesEl.appendChild(typing);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing')?.remove();
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isProcessing) return;

  isProcessing = true;
  sendBtn.disabled = true;
  addMessage(text, 'user');
  inputEl.value = '';
  showTyping();

  try {
    const resp = await chrome.runtime.sendMessage({ type: 'chat', message: text });
    hideTyping();
    if (resp.error) {
      addMessage(`Error: ${resp.error}`, 'assistant');
    } else {
      addMessage(resp.response, 'assistant');
      if (resp.executionResults) {
        addMessage('Automation executed: ' + JSON.stringify(resp.executionResults, null, 2), 'assistant');
      }
    }
  } catch (err) {
    hideTyping();
    addMessage(`Connection error: ${err.message}`, 'assistant');
  }

  isProcessing = false;
  sendBtn.disabled = false;
  inputEl.focus();
}

async function executeAutomation(automation) {
  addMessage('Running automation...', 'assistant');
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'execute_automation', automation });
    addMessage('Results:\n```json\n' + JSON.stringify(resp.results, null, 2) + '\n```', 'assistant');
  } catch (err) {
    addMessage(`Execution error: ${err.message}`, 'assistant');
  }
}

document.querySelectorAll('.quick-action').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const prompts = {
      scrape: 'Scrape all meaningful data from this page and return as structured JSON.',
      screenshot: 'Take a full-page screenshot of the current page.',
      inspect: 'Analyze the DOM structure of this page and list the main interactive elements.',
      inject: 'Show me an example of injecting custom CSS to highlight all links on this page.'
    };
    inputEl.value = prompts[action] || '';
    sendMessage();
  });
});

sendBtn.addEventListener('click', sendMessage);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById('btn-dashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
});

document.getElementById('btn-settings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

checkConnection();
setInterval(checkConnection, 10000);
