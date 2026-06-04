const fields = {
  proxyUrl: document.getElementById('proxy-url'),
  enableSigning: document.getElementById('enable-signing'),
  signingSecret: document.getElementById('signing-secret'),
  timeout: document.getElementById('timeout'),
  maxConcurrent: document.getElementById('max-concurrent'),
  autoExecute: document.getElementById('auto-execute'),
  notifyComplete: document.getElementById('notify-complete'),
  enableDownloads: document.getElementById('enable-downloads'),
  downloadDir: document.getElementById('download-dir')
};

const statusEl = document.getElementById('status');

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = `status show ${type}`;
  setTimeout(() => statusEl.className = 'status', 3000);
}

chrome.storage.local.get('settings', ({ settings = {} }) => {
  fields.proxyUrl.value = settings.proxyUrl || 'http://127.0.0.1:3456';
  fields.enableSigning.checked = settings.enableSigning || false;
  fields.signingSecret.value = settings.signingSecret || '';
  fields.timeout.value = settings.timeout || 30000;
  fields.maxConcurrent.value = settings.maxConcurrent || 5;
  fields.autoExecute.checked = settings.autoExecute !== false;
  fields.notifyComplete.checked = settings.notifyComplete !== false;
  fields.enableDownloads.checked = settings.enableDownloads !== false;
  fields.downloadDir.value = settings.downloadDir || 'claude-browser';
  toggleSigningSecret();
});

fields.enableSigning.addEventListener('change', toggleSigningSecret);

function toggleSigningSecret() {
  document.getElementById('signing-secret-group').style.display =
    fields.enableSigning.checked ? 'block' : 'none';
}

document.getElementById('btn-save').addEventListener('click', () => {
  const settings = {
    proxyUrl: fields.proxyUrl.value || 'http://127.0.0.1:3456',
    enableSigning: fields.enableSigning.checked,
    signingSecret: fields.signingSecret.value,
    timeout: parseInt(fields.timeout.value) || 30000,
    maxConcurrent: parseInt(fields.maxConcurrent.value) || 5,
    autoExecute: fields.autoExecute.checked,
    notifyComplete: fields.notifyComplete.checked,
    enableDownloads: fields.enableDownloads.checked,
    downloadDir: fields.downloadDir.value
  };
  chrome.storage.local.set({ settings }, () => showStatus('Settings saved!', 'success'));
});

document.getElementById('btn-test').addEventListener('click', async () => {
  try {
    const resp = await chrome.runtime.sendMessage({ type: 'health_check' });
    if (resp?.status === 'ok') {
      showStatus(`Connected! ${resp.sessions || 0} active sessions, ${resp.automations || 0} automations.`, 'success');
    } else {
      showStatus('Proxy responded but returned unexpected data.', 'error');
    }
  } catch (err) {
    showStatus(`Connection failed: ${err.message}`, 'error');
  }
});
