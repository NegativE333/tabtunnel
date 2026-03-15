// popup.js — TabTunnel with URL / Selection mode

const QR_SIZE = 192;
let currentMode = 'url'; // 'url' | 'text'
let tabUrl = '';
let selectedText = '';

// ── Utilities ────────────────────────────────────────

function isMac() {
  return navigator.platform.toUpperCase().includes('MAC');
}

function setShortcut() {
  const el = document.getElementById('kbd-row');
  if (!el) return;
  el.innerHTML = isMac()
    ? `<kbd>⌘</kbd><kbd>⇧</kbd><kbd>P</kbd>`
    : `<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>P</kbd>`;
}

function truncateUrl(url, max = 46) {
  try {
    const u = new URL(url);
    const s = u.hostname + (u.pathname.length > 1 ? u.pathname : '');
    return s.length > max ? s.slice(0, max) + '…' : s;
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url;
  }
}

function truncateText(text, max = 46) {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function isBlocked(url) {
  return !url ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:') ||
    url.startsWith('edge://');
}

// ── QR rendering ─────────────────────────────────────

function renderQR(content, reSnap = false) {
  const wrap = document.getElementById('qr-canvas-wrapper');
  const card = document.getElementById('qr-card');

  wrap.innerHTML = '';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);

  QRCode.toCanvas(canvas, content, {
    width: QR_SIZE,
    margin: 1,
    color: { dark: '#f0f0f0', light: '#1a1a1d' },
    errorCorrectionLevel: 'M',
  }, (err) => {
    if (err) showQRError('Could not generate QR code');
    else if (reSnap) triggerReSnap(card);
  });
}

function triggerReSnap(card) {
  card.classList.remove('re-snap');
  void card.offsetWidth; // force reflow
  card.classList.add('re-snap');
  card.addEventListener('animationend', () => card.classList.remove('re-snap'), { once: true });
}

function showQRError(msg) {
  document.getElementById('qr-canvas-wrapper').innerHTML = `
    <div class="qr-err">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#555558" stroke-width="1.4"/>
        <path d="M12 8v4M12 15.5h.01" stroke="#555558" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <span>${msg}</span>
    </div>`;
}

// ── Mode switching ────────────────────────────────────

function setMode(mode) {
  if (mode === currentMode) return;
  currentMode = mode;

  const track     = document.getElementById('toggle-track');
  const btnUrl    = document.getElementById('btn-url');
  const btnText   = document.getElementById('btn-text');
  const brackets  = document.getElementById('brackets');
  const hint      = document.getElementById('hint');
  const urlBar    = document.getElementById('url-bar');
  const urlDisp   = document.getElementById('url-display');

  if (mode === 'text') {
    track.classList.add('text-active');
    btnUrl.classList.remove('active');
    btnText.classList.add('active');
    brackets.classList.add('text-mode');
    hint.classList.add('text-mode');
    urlBar.classList.add('text-mode');

    // bottom bar shows text preview
    urlDisp.textContent = truncateText(selectedText);

    // copy btn copies selected text
    setupCopyBtn(selectedText);

    renderQR(selectedText, true);
  } else {
    track.classList.remove('text-active');
    btnUrl.classList.add('active');
    btnText.classList.remove('active');
    brackets.classList.remove('text-mode');
    hint.classList.remove('text-mode');
    urlBar.classList.remove('text-mode');

    urlDisp.textContent = truncateUrl(tabUrl);
    setupCopyBtn(tabUrl);
    renderQR(tabUrl, true);
  }
}

// ── Copy button ───────────────────────────────────────

function setupCopyBtn(content) {
  const btn = document.getElementById('copy-btn');
  // clone to remove old listeners
  const fresh = btn.cloneNode(true);
  btn.parentNode.replaceChild(fresh, btn);
  fresh.addEventListener('click', () => copyContent(content));
}

async function copyContent(content) {
  const btn = document.getElementById('copy-btn');
  try {
    await navigator.clipboard.writeText(content);
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9A1.5 1.5 0 0 0 3.5 10.5H5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>`;
    }, 1800);
  } catch (_) {}
}

// ── Favicon ───────────────────────────────────────────

function setFavicon(url) {
  if (!url) return;
  const wrap = document.getElementById('fav-wrap');
  const img = new Image();
  img.className = 'tab-fav';
  img.src = url;
  img.onload = () => { wrap.innerHTML = ''; wrap.appendChild(img); };
}

// ── Selection state ───────────────────────────────────

function applySelectionState(text) {
  selectedText = text ? text.trim() : '';
  const hasSelection = selectedText.length > 0;

  const modeBar = document.getElementById('mode-bar');
  const badge   = document.getElementById('mode-bar');

  // Show the toggle bar (always once loaded)
  modeBar.style.display = 'block';

  if (hasSelection) {
    // Mark mode-bar so badge is visible
    document.getElementById('mode-bar').classList.add('has-selection');

    // Fill preview (first 60 chars)
    const preview = selectedText.length > 60
      ? selectedText.slice(0, 60) + '…'
      : selectedText;
    document.getElementById('selection-preview').textContent = preview;

    // Auto-switch to text mode
    setMode('text');
  }

  // Wire up toggle buttons
  document.getElementById('btn-url').addEventListener('click', () => setMode('url'));
  document.getElementById('btn-text').addEventListener('click', () => {
    if (!hasSelection) return; // no-op if no selection
    setMode('text');
  });

  // Dim the Selection button if nothing selected
  if (!hasSelection) {
    document.getElementById('btn-text').style.opacity = '0.38';
    document.getElementById('btn-text').style.cursor = 'default';
  }
}

// ── Main ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setShortcut();

  // Show tab title immediately
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs?.[0]) return;
    const tab = tabs[0];
    if (tab.title) {
      const t = tab.title;
      document.getElementById('tab-label').innerHTML =
        `<strong>${t.slice(0, 52)}${t.length > 52 ? '…' : ''}</strong>`;
    }
    if (tab.favIconUrl) setFavicon(tab.favIconUrl);
  });

  // Get tab URL + selected text in parallel
  chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB' }, (res) => {
    if (chrome.runtime.lastError || !res || res.error) {
      document.getElementById('tab-label').textContent = 'Unable to read tab';
      showQRError('No URL available');
      return;
    }

    const { url, title, favIconUrl, selection } = res;

    tabUrl = url;

    if (title) {
      const t = title;
      document.getElementById('tab-label').innerHTML =
        `<strong>${t.slice(0, 52)}${t.length > 52 ? '…' : ''}</strong>`;
    }

    setFavicon(favIconUrl);

    document.getElementById('url-display').textContent = truncateUrl(url);
    setupCopyBtn(url);

    if (isBlocked(url)) {
      showQRError("Browser pages can't be sent");
      document.getElementById('mode-bar').style.display = 'block';
      applySelectionState('');
      return;
    }

    // Render URL QR first
    renderQR(url);

    // Then apply selection state (may switch to text mode)
    applySelectionState(selection || '');
  });
});