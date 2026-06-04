(() => {
  let overlay = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'claude-automation-overlay';
    overlay.innerHTML = `
      <style>
        #claude-automation-overlay {
          position: fixed; bottom: 20px; right: 20px; z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .claude-toast {
          background: #1a1a2e; color: #e0e0e0; border: 1px solid #6c5ce7;
          border-radius: 12px; padding: 16px; max-width: 400px; margin-top: 8px;
          box-shadow: 0 8px 32px rgba(108,92,231,0.3); animation: claude-slide-in 0.3s ease;
        }
        .claude-toast-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .claude-toast-icon { width: 20px; height: 20px; background: #6c5ce7; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 12px; }
        .claude-toast-title { font-weight: 600; font-size: 13px; color: #6c5ce7; }
        .claude-toast-body { font-size: 12px; line-height: 1.5; max-height: 200px; overflow-y: auto; }
        .claude-toast-close { position: absolute; top: 8px; right: 10px; cursor: pointer;
          color: #666; font-size: 16px; background: none; border: none; }
        .claude-toast-close:hover { color: #fff; }
        .claude-toast pre { background: #0d0d1a; padding: 8px; border-radius: 6px;
          overflow-x: auto; font-size: 11px; margin: 8px 0; }
        .claude-toast code { color: #a8e6cf; }
        .claude-toast-actions { display: flex; gap: 6px; margin-top: 10px; }
        .claude-toast-btn { padding: 4px 12px; border-radius: 6px; font-size: 11px;
          cursor: pointer; border: 1px solid #6c5ce7; background: transparent; color: #6c5ce7; }
        .claude-toast-btn:hover { background: #6c5ce7; color: #fff; }
        .claude-toast-btn-primary { background: #6c5ce7; color: #fff; }
        @keyframes claude-slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .claude-highlight { outline: 2px solid #6c5ce7 !important;
          outline-offset: 2px; background: rgba(108,92,231,0.1) !important; }
        .claude-selector-mode * { cursor: crosshair !important; }
      </style>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function showToast(title, body, actions = []) {
    const container = createOverlay();
    const toast = document.createElement('div');
    toast.className = 'claude-toast';
    toast.style.position = 'relative';

    let actionsHtml = '';
    if (actions.length) {
      actionsHtml = '<div class="claude-toast-actions">' +
        actions.map((a, i) => `<button class="claude-toast-btn ${a.primary ? 'claude-toast-btn-primary' : ''}" data-action="${i}">${a.label}</button>`).join('') +
        '</div>';
    }

    toast.innerHTML = `
      <button class="claude-toast-close">&times;</button>
      <div class="claude-toast-header">
        <div class="claude-toast-icon">C</div>
        <div class="claude-toast-title">${title}</div>
      </div>
      <div class="claude-toast-body">${body}</div>
      ${actionsHtml}
    `;

    toast.querySelector('.claude-toast-close').onclick = () => toast.remove();
    actions.forEach((a, i) => {
      const btn = toast.querySelector(`[data-action="${i}"]`);
      if (btn) btn.onclick = () => { a.handler(); toast.remove(); };
    });

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 15000);
  }

  function getElementSelector(el) {
    if (el.id) return `#${el.id}`;
    const path = [];
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).filter(c => !c.startsWith('claude-')).slice(0, 2);
        if (classes.length) selector += '.' + classes.join('.');
      }
      const siblings = el.parentElement ? [...el.parentElement.children].filter(s => s.tagName === el.tagName) : [];
      if (siblings.length > 1) selector += `:nth-of-type(${siblings.indexOf(el) + 1})`;
      path.unshift(selector);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  function scrapePage(options = {}) {
    const result = {
      url: location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      meta: {},
      headings: [],
      links: [],
      images: [],
      tables: [],
      text: ''
    };

    document.querySelectorAll('meta').forEach(m => {
      const key = m.getAttribute('name') || m.getAttribute('property');
      if (key) result.meta[key] = m.content;
    });

    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
      result.headings.push({ level: parseInt(h.tagName[1]), text: h.textContent.trim() });
    });

    if (options.links !== false) {
      document.querySelectorAll('a[href]').forEach(a => {
        result.links.push({ text: a.textContent.trim(), href: a.href });
      });
    }

    if (options.images !== false) {
      document.querySelectorAll('img').forEach(img => {
        result.images.push({ src: img.src, alt: img.alt, width: img.naturalWidth, height: img.naturalHeight });
      });
    }

    document.querySelectorAll('table').forEach(table => {
      const rows = [];
      table.querySelectorAll('tr').forEach(tr => {
        const cells = [];
        tr.querySelectorAll('td,th').forEach(cell => cells.push(cell.textContent.trim()));
        rows.push(cells);
      });
      result.tables.push(rows);
    });

    result.text = document.body?.innerText?.substring(0, 50000) || '';
    return result;
  }

  let selectorMode = false;
  let highlightedEl = null;

  function enableSelectorMode(callback) {
    selectorMode = true;
    document.body.classList.add('claude-selector-mode');

    const onMove = (e) => {
      if (highlightedEl) highlightedEl.classList.remove('claude-highlight');
      highlightedEl = e.target;
      highlightedEl.classList.add('claude-highlight');
    };

    const onClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectorMode = false;
      document.body.classList.remove('claude-selector-mode');
      document.removeEventListener('mousemove', onMove, true);
      document.removeEventListener('click', onClick, true);
      if (highlightedEl) highlightedEl.classList.remove('claude-highlight');
      callback(getElementSelector(e.target), e.target);
    };

    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'show_result':
        if (msg.data?.response) {
          showToast('Claude Automation', msg.data.response.substring(0, 500));
        }
        break;

      case 'scrape_page':
        sendResponse(scrapePage(msg.options || {}));
        break;

      case 'get_selector':
        enableSelectorMode((selector, element) => {
          sendResponse({
            selector,
            tag: element.tagName,
            text: element.textContent?.substring(0, 200),
            html: element.outerHTML?.substring(0, 500)
          });
        });
        return true;

      case 'get_page_info':
        sendResponse({
          url: location.href,
          title: document.title,
          domain: location.hostname,
          html: document.documentElement.outerHTML.substring(0, 10000)
        });
        break;

      case 'execute_code':
        try {
          const fn = new Function(msg.code);
          const result = fn();
          sendResponse({ result });
        } catch (err) {
          sendResponse({ error: err.message });
        }
        break;

      case 'inject_css':
        const style = document.createElement('style');
        style.textContent = msg.css;
        style.setAttribute('data-claude', 'injected');
        document.head.appendChild(style);
        sendResponse({ ok: true });
        break;

      case 'remove_injected_css':
        document.querySelectorAll('style[data-claude="injected"]').forEach(s => s.remove());
        sendResponse({ ok: true });
        break;

      case 'highlight_elements':
        document.querySelectorAll(msg.selector).forEach(el => el.classList.add('claude-highlight'));
        sendResponse({ count: document.querySelectorAll(msg.selector).length });
        break;

      case 'clear_highlights':
        document.querySelectorAll('.claude-highlight').forEach(el => el.classList.remove('claude-highlight'));
        sendResponse({ ok: true });
        break;
    }
  });

  window.__claudeAutomation = {
    scrape: scrapePage,
    select: enableSelectorMode,
    toast: showToast,
    getSelector: getElementSelector
  };
})();
