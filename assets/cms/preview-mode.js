/* ═══════════════════════════════════════════
   ADMIN LIVE PREVIEW
   When a public page is opened inside the admin panel with ?cms-preview,
   it does not load content itself. The admin panel sends the (possibly
   unsaved) content with postMessage and the page re-renders instantly.
   Clicking a section tells the admin panel which one to edit.
   ═══════════════════════════════════════════ */

export const IS_PREVIEW =
  new URLSearchParams(location.search).has('cms-preview') && window.parent !== window;

function send(msg) {
  window.parent.postMessage(msg, location.origin);
}

function focusBlock(id, scroll) {
  document.querySelectorAll('.cms-block.is-focused').forEach((b) => b.classList.remove('is-focused'));
  if (!id) return;
  const block = document.querySelector(`[data-cms-id="${CSS.escape(id)}"]`);
  const el = block?.firstElementChild;
  if (!el) return;
  block.classList.add('is-focused');
  if (scroll) {
    const top = el.getBoundingClientRect().top + window.scrollY - 70;
    window.scrollTo({ top: Math.max(0, top), behavior: scroll === 'smooth' ? 'smooth' : 'instant' });
  }
}

/** @param {(payload: object) => void} paint */
export function startPreview(paint) {
  const root = document.documentElement;
  root.classList.add('cms-preview');
  root.style.scrollBehavior = 'auto';

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./preview.css', import.meta.url).href;
  document.head.append(css);

  let lastFocus = null;
  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data) return;
    if (e.data.type === 'cms-render') {
      const y = window.scrollY;
      paint(e.data.payload);
      // Show final numbers straight away instead of the count-up animation.
      document.querySelectorAll('[data-counter] strong').forEach((el) => { el.dataset.counted = '1'; });
      // Keep the reader's place while typing; jump only when asked.
      if (e.data.scroll && e.data.focus !== lastFocus) {
        focusBlock(e.data.focus, e.data.scroll);
      } else {
        window.scrollTo({ top: y, behavior: 'instant' });
        focusBlock(e.data.focus, false);
      }
      lastFocus = e.data.focus;
    }
    if (e.data.type === 'cms-focus') {
      focusBlock(e.data.id, e.data.smooth ? 'smooth' : true);
      lastFocus = e.data.id;
    }
  });

  // Links must not navigate away inside the preview; a click selects the section.
  document.addEventListener('click', (e) => {
    const block = e.target.closest('[data-cms-id]');
    if (e.target.closest('a, button')) e.preventDefault();
    if (block) {
      e.stopPropagation();
      send({ type: 'cms-select', id: block.dataset.cmsId });
    }
  }, true);

  send({ type: 'cms-preview-ready' });
}
