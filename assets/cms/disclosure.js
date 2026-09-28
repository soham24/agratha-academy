/* Mandatory Public Disclosure page boot — same strategy as site.js:
   cached content first, then fresh content, static HTML as fallback. */

import { loadPage, readCache, writeCache } from './api.js';
import { renderDisclosureSections, renderDisclosureNav } from './render-disclosure.js';
import { esc, inline } from './format.js';
import { DEFAULT_DISCLOSURE } from './defaults.js';
import { IS_PREVIEW, startPreview } from './preview-mode.js';

const root = document.documentElement;
const reveal = () => root.classList.remove('cms-pending');
const revealTimer = setTimeout(reveal, 2500);

function paint(payload) {
  const content = document.querySelector('.content');
  if (!content || !payload?.sections?.length) return false;
  const s = { ...DEFAULT_DISCLOSURE, ...(payload.settings?.disclosure ?? {}) };

  content.innerHTML = renderDisclosureSections(payload.sections, { preview: IS_PREVIEW });
  const nav = document.querySelector('.sidebar-nav');
  if (nav) nav.innerHTML = renderDisclosureNav(payload.sections);

  const brand = document.querySelector('.top-bar-brand span');
  if (brand && s.brand_line) brand.textContent = s.brand_line;

  const head = document.querySelector('.page-header-inner');
  if (head) {
    head.innerHTML = `
      ${s.badge ? `<div class="page-badge">${esc(s.badge)}</div>` : ''}
      <h1>${esc(s.title)}</h1>
      ${s.intro ? `<p>${inline(s.intro)}</p>` : ''}
      ${s.updated ? `<div class="updated-tag">Last Updated: <span>${esc(s.updated)}</span></div>` : ''}`;
  }

  const disclaimer = document.querySelector('.sidebar-disclaimer');
  if (disclaimer) disclaimer.innerHTML = `<strong>${esc(s.sidebar_title)}</strong>${inline(s.sidebar_text)}`;

  const footer = document.querySelector('.page-footer');
  if (footer && s.footer) footer.innerHTML = inline(s.footer);
  return true;
}

async function boot() {
  const cached = readCache('disclosure');
  const paintedFromCache = paint(cached);
  if (paintedFromCache) { clearTimeout(revealTimer); reveal(); }

  const fresh = await loadPage('disclosure');
  if (fresh?.sections?.length && JSON.stringify(fresh) !== JSON.stringify(cached)) {
    writeCache('disclosure', fresh);
    if (!paintedFromCache || window.scrollY < 200) paint(fresh);
  }
  clearTimeout(revealTimer);
  reveal();
  if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

if (IS_PREVIEW) {
  clearTimeout(revealTimer);
  startPreview(paint);
} else {
  boot();
}
