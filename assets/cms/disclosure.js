/* Mandatory Public Disclosure page boot — same strategy as site.js:
   prerendered HTML first, newer cached/fresh content only if it differs. */

import { loadPage, readCache, writeCache } from './api.js';
import {
  renderDisclosureSections, renderDisclosureNav, renderDisclosureHeader, renderDisclaimer,
} from './render-disclosure.js';
import { inline, contentHash } from './format.js';
import { DEFAULT_DISCLOSURE } from './defaults.js';
import { IS_PREVIEW, startPreview } from './preview-mode.js';


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
  if (head) head.innerHTML = renderDisclosureHeader(s);

  const disclaimer = document.querySelector('.sidebar-disclaimer');
  if (disclaimer) disclaimer.innerHTML = renderDisclaimer(s);

  const footer = document.querySelector('.page-footer');
  if (footer && s.footer) footer.innerHTML = inline(s.footer);
  return true;
}

async function boot() {
  const staticHash = document.querySelector('meta[name="cms-content-hash"]')?.content ?? '';
  let shown = staticHash;

  const cached = readCache('disclosure');
  if (cached?.sections?.length && contentHash(cached) !== staticHash && paint(cached)) shown = contentHash(cached);

  const fresh = await loadPage('disclosure');
  if (fresh?.sections?.length) {
    writeCache('disclosure', fresh);
    if (contentHash(fresh) !== shown && (shown === staticHash || window.scrollY < 200)) paint(fresh);
  }
  if (location.hash.length > 1) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

if (IS_PREVIEW) {
  startPreview(paint);
} else {
  boot();
}
