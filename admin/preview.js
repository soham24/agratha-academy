/* ═══════════════════════════════════════════
   LIVE PREVIEW PANEL
   Shows the real public page (in "preview mode") in an iframe, scaled
   to fit, with a desktop / mobile toggle. Content is pushed in with
   postMessage, so unsaved edits appear instantly.
   ═══════════════════════════════════════════ */

const PAGE_URLS = { home: '../index.html', disclosure: '../mandatory-public-disclosure.html' };
const DEVICES = { desktop: 1280, mobile: 390 };

function savedDevice() {
  const fallback = window.innerWidth < 700 ? 'mobile' : 'desktop';
  try { return localStorage.getItem('agratha-admin:device') || fallback; } catch { return fallback; }
}

/**
 * @param {HTMLElement} container
 * @param {{ page: 'home'|'disclosure', onSelect?: (id: string) => void, hint?: string }} opts
 */
export function createPreview(container, { page, onSelect, hint = '' }) {
  let device = savedDevice();
  let ready = false;
  let pending = null;

  container.classList.add('pv');
  container.innerHTML = `
    <div class="pv-toolbar">
      <span class="pv-title"><span class="pv-dot" aria-hidden="true"></span>Live preview</span>
      ${hint ? `<span class="pv-hint">${hint}</span>` : ''}
      <div class="seg" role="group" aria-label="Preview size">
        <button type="button" data-dev="desktop" title="Computer">🖥<span> Computer</span></button>
        <button type="button" data-dev="mobile" title="Phone">📱<span> Phone</span></button>
      </div>
    </div>
    <div class="pv-stage">
      <div class="pv-device">
        <iframe title="Live preview of the website" src="${PAGE_URLS[page]}?cms-preview"></iframe>
      </div>
      <div class="pv-loading">Loading preview…</div>
    </div>`;

  const stage = container.querySelector('.pv-stage');
  const deviceBox = container.querySelector('.pv-device');
  const frame = container.querySelector('iframe');

  function layout() {
    const w = DEVICES[device];
    const availW = stage.clientWidth - (device === 'mobile' ? 32 : 0);
    const availH = stage.clientHeight - (device === 'mobile' ? 32 : 0);
    const scale = Math.min(1, availW / w);
    frame.style.width = `${w}px`;
    frame.style.height = `${Math.max(200, availH / scale)}px`;
    frame.style.transform = `scale(${scale})`;
    deviceBox.style.width = `${w * scale}px`;
    deviceBox.style.height = `${Math.max(200, availH)}px`;
    container.dataset.device = device;
    container.querySelectorAll('[data-dev]').forEach((b) => b.classList.toggle('is-active', b.dataset.dev === device));
  }

  container.querySelectorAll('[data-dev]').forEach((b) => b.addEventListener('click', () => {
    device = b.dataset.dev;
    try { localStorage.setItem('agratha-admin:device', device); } catch { /* ignore */ }
    layout();
  }));

  const ro = new ResizeObserver(layout);
  ro.observe(stage);
  layout();

  function post(msg) {
    frame.contentWindow?.postMessage(msg, location.origin);
  }

  function onMessage(e) {
    if (e.source !== frame.contentWindow || e.origin !== location.origin) return;
    if (e.data?.type === 'cms-preview-ready') {
      ready = true;
      container.classList.add('is-ready');
      if (pending) post(pending);
    }
    if (e.data?.type === 'cms-select') onSelect?.(e.data.id);
  }
  window.addEventListener('message', onMessage);

  return {
    /** Re-render the page with this content. */
    update(payload, { focus = null, scroll = false } = {}) {
      pending = { type: 'cms-render', payload, focus, scroll };
      if (ready) post(pending);
    },
    focus(id, smooth = true) {
      if (ready) post({ type: 'cms-focus', id, smooth });
      if (pending) pending.focus = id;
    },
    destroy() {
      ro.disconnect();
      window.removeEventListener('message', onMessage);
    },
  };
}
