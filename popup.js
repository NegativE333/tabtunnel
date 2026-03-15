// popup.js — TabTunnel v1.2

const QR_SIZE = 192;
let mode      = 'url';
let tabUrl    = '';
let selection = '';

// ── Utilities ─────────────────────────────────────────

const isMac = () => navigator.platform.toUpperCase().includes('MAC');

function setShortcut() {
  const el = document.getElementById('kbds');
  if (!el) return;
  el.innerHTML = isMac()
    ? `<kbd>⌘</kbd><kbd>⇧</kbd><kbd>T</kbd>`
    : `<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>T</kbd>`;
}

function fmtUrl(url, max = 50) {
  try {
    const u = new URL(url);
    const s = u.hostname + (u.pathname.length > 1 ? u.pathname : '');
    return s.length > max ? s.slice(0, max) + '…' : s;
  } catch {
    return url.length > max ? url.slice(0, max) + '…' : url;
  }
}

function fmtText(t, max = 50) {
  const s = t.replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max) + '…' : s;
}

const isBlocked = url => !url ||
  ['chrome://', 'chrome-extension://', 'about:', 'edge://'].some(p => url.startsWith(p));

// ── QR ────────────────────────────────────────────────

function renderQR(content, snap = false) {
  const wrap = document.getElementById('qr-wrap');
  const tile = document.getElementById('qr-tile');
  wrap.innerHTML = '';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  QRCode.toCanvas(canvas, content, {
    width: QR_SIZE, margin: 1,
    color: { dark: '#e8e8e8', light: '#141416' },
    errorCorrectionLevel: 'M',
  }, err => {
    if (err) return showQRError('Could not generate QR');
    if (snap) {
      tile.classList.remove('re-snap');
      void tile.offsetWidth;
      tile.classList.add('re-snap');
      tile.addEventListener('animationend', () => tile.classList.remove('re-snap'), { once: true });
    }
  });
}

function showQRError(msg) {
  document.getElementById('qr-wrap').innerHTML = `
    <div class="qr-err">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#333336" stroke-width="1.5"/>
        <path d="M12 8v4M12 15.5h.01" stroke="#333336" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>${msg}</span>
    </div>`;
}

// ── Copy ──────────────────────────────────────────────

function bindCopy(content) {
  const old = document.getElementById('copy-btn');
  const btn = old.cloneNode(true);
  old.replaceWith(btn);
  const ICON_COPY = `<svg width="11" height="11" viewBox="0 0 16 16" fill="none">
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
    <path d="M10.5 5.5V3.5a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;
  const ICON_CHECK = `<svg width="11" height="11" viewBox="0 0 16 16" fill="none">
    <path d="M3 8.5l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      btn.classList.add('copied');
      btn.innerHTML = ICON_CHECK;
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = ICON_COPY; }, 1800);
    } catch (_) {}
  });
}

// ── Favicon ───────────────────────────────────────────

function setFavicon(url) {
  if (!url) return;
  const wrap = document.getElementById('fav-wrap');
  const img = new Image();
  img.className = 'fav';
  img.src = url;
  img.onload = () => { wrap.innerHTML = ''; wrap.appendChild(img); };
}

// ── Mode switch ───────────────────────────────────────

function switchMode(next) {
  if (next === mode) return;
  mode = next;

  const chipUrl      = document.getElementById('chip-url');
  const chipText     = document.getElementById('chip-text');
  const bottomVal    = document.getElementById('bottom-val');

  if (!chipUrl || !chipText || !bottomVal) return;

  if (mode === 'text') {
    chipUrl.classList.remove('active');
    chipText.classList.add('active');
    bottomVal.textContent = fmtText(selection);
    bindCopy(selection);
    renderQR(selection, true);
  } else {
    chipUrl.classList.add('active');
    chipText.classList.remove('active');
    bottomVal.textContent = fmtUrl(tabUrl);
    bindCopy(tabUrl);
    renderQR(tabUrl, true);
  }
}

// ── Init ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  setShortcut();

  // Title appears immediately
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs?.[0]) return;
    const { title, favIconUrl } = tabs[0];
    if (title) {
      const t = title;
      document.getElementById('tab-name').innerHTML =
        `<b>${t.slice(0, 55)}${t.length > 55 ? '…' : ''}</b>`;
    }
    if (favIconUrl) setFavicon(favIconUrl);
  });

  chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB' }, res => {
    if (chrome.runtime.lastError || !res || res.error) {
      document.getElementById('tab-name').textContent = 'Unable to read tab';
      showQRError('No URL available');
      return;
    }

    const { url, title, favIconUrl, selection: sel } = res;
    tabUrl    = url;
    selection = (sel || '').trim();

    if (title) {
      document.getElementById('tab-name').innerHTML =
        `<b>${title.slice(0, 55)}${title.length > 55 ? '…' : ''}</b>`;
    }
    if (favIconUrl) setFavicon(favIconUrl);

    // Enable text chip if we have a selection
    const chipText = document.getElementById('chip-text');
    if (selection.length > 0) {
      chipText.classList.remove('dimmed');
    }

    // Wire chips
    document.getElementById('chip-url').addEventListener('click',  () => switchMode('url'));
    document.getElementById('chip-text').addEventListener('click', () => switchMode('text'));

    // Bottom bar default
    document.getElementById('bottom-val').textContent = isBlocked(url) ? url : fmtUrl(url);
    bindCopy(url);

    if (isBlocked(url)) {
      showQRError("Can't send browser pages");
      return;
    }

    // Render URL QR first, then auto-switch to text if there's a selection
    renderQR(url);
    if (selection.length > 0) {
      setTimeout(() => switchMode('text'), 300);
    }
  });
});