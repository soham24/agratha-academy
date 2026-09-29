/* ═══════════════════════════════════════════
   HOME PAGE BOOT
   index.html already contains the content as of the last prerender
   (scripts/prerender.mjs), stamped with a content fingerprint.
   1. If this browser has newer content cached, paint that straight away.
   2. Fetch the latest content; re-paint only if it differs from what is
      on screen, so an up-to-date page never flickers.
   3. If the database is unreachable, the HTML stays as it is.
   ═══════════════════════════════════════════ */

import { loadPage, readCache, writeCache } from './api.js';
import { renderSections, renderNav, renderFooter } from './render-home.js';
import { esc, inline, paragraphs, safeUrl, contentHash } from './format.js';
import { icon } from './icons.js';
import { DEFAULT_SITE } from './defaults.js';
import { IS_PREVIEW, startPreview } from './preview-mode.js';

const root = document.documentElement;
const main = document.getElementById('main');
let painted = null;


function applySettings(s) {
  const brand = document.querySelector('.site-header .brand');
  if (brand) {
    const img = brand.querySelector('img');
    if (img && s.logo) img.src = safeUrl(s.logo);
    const strong = brand.querySelector('strong');
    const small = brand.querySelector('small');
    if (strong && s.school_name) strong.textContent = s.school_name;
    if (small) small.textContent = s.school_tagline ?? '';
  }
  const nav = document.querySelector('[data-nav]');
  if (nav && s.nav?.length) nav.innerHTML = renderNav(s);

  const footer = document.querySelector('.site-footer');
  if (footer) footer.innerHTML = renderFooter(s);

  if (s.seo_title) document.title = s.seo_title;
  if (s.seo_description) document.querySelector('meta[name="description"]')?.setAttribute('content', s.seo_description);

  renderWhatsApp(s.whatsapp);
}

function paint(payload) {
  const settings = { ...DEFAULT_SITE, ...(payload.settings?.site ?? {}) };
  const html = renderSections(payload.sections, { announcements: payload.announcements, preview: IS_PREVIEW });
  if (!html.trim()) return false;
  main.innerHTML = html;
  applySettings(settings);
  window.AgrathaSite?.init();
  painted = payload;
  return settings;
}

// ── Scrolling notice bar ─────────────────────────────────────────
function renderTicker(settings, announcements) {
  document.querySelector('.notice-ticker')?.remove();
  document.body.classList.remove('has-ticker');
  if (settings.ticker_enabled === false) return;
  const items = announcements.filter((a) => a.show_ticker);
  if (!items.length) return;

  const entries = items.map((a) =>
    `<button type="button" class="ticker-item" data-notice-open="${esc(a.id)}">${esc(a.title)}</button>`,
  ).join('<span class="ticker-dot" aria-hidden="true">✦</span>');

  const bar = document.createElement('div');
  bar.className = 'notice-ticker';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Announcements');
  bar.innerHTML = `
    <span class="ticker-label">${icon('bell', { size: 14, stroke: 2 })}${esc(settings.ticker_label || 'Notice')}</span>
    <div class="ticker-viewport">
      <div class="ticker-track" style="--ticker-duration:${Math.max(18, items.length * 9)}s">
        <div class="ticker-group">${entries}</div>
        <div class="ticker-group" aria-hidden="true">${entries}</div>
      </div>
    </div>`;
  document.body.prepend(bar);
  document.body.classList.add('has-ticker');
}

// ── Announcement modal (pop-up + "read more") ────────────────────
let modal;
let lastFocus;

function ensureModal() {
  if (modal) return modal;
  modal = document.createElement('div');
  modal.className = 'announce-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'announce-title');
  modal.innerHTML = `
    <div class="announce-card" role="document">
      <button type="button" class="announce-close" data-announce-close aria-label="Close">${icon('close', { size: 20, stroke: 2.5 })}</button>
      <div class="announce-content"></div>
    </div>`;
  document.body.append(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-announce-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
  return modal;
}

function openModal(a, { kicker = '' } = {}) {
  const m = ensureModal();
  const link = safeUrl(a.link_url);
  m.querySelector('.announce-content').innerHTML = `
    ${a.image_url ? `<img class="announce-img" src="${esc(safeUrl(a.image_url))}" alt="">` : ''}
    <div class="announce-text">
      ${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}
      <h2 id="announce-title">${inline(a.title)}</h2>
      ${paragraphs(a.body)}
      ${link ? `<a class="btn btn-maroon" href="${esc(link)}"${/^https?:/i.test(link) || /\.pdf$/i.test(link) ? ' target="_blank" rel="noopener"' : ''}>${esc(a.link_label || 'Learn more')}</a>` : ''}
    </div>`;
  lastFocus = document.activeElement;
  m.hidden = false;
  document.body.style.overflow = 'hidden';
  m.querySelector('.announce-close').focus();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  lastFocus?.focus?.();
}

function maybeShowPopup(settings, announcements) {
  if (settings.popup_enabled === false) return;
  const popup = announcements.find((a) => a.show_popup);
  if (!popup) return;
  const key = `agratha-popup:${popup.id}:${popup.updated_at}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch { /* private mode – show anyway */ }
  setTimeout(() => openModal(popup, { kicker: 'Announcement' }), 600);
}

function wireNoticeLinks(announcements) {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-notice-open]');
    if (!btn) return;
    const a = announcements().find((x) => x.id === btn.dataset.noticeOpen);
    if (a) openModal(a);
  });
}

// ── Floating WhatsApp button ─────────────────────────────────────
function renderWhatsApp(number) {
  document.querySelector('.wa-float')?.remove();
  const digits = String(number ?? '').replace(/\D/g, '');
  if (digits.length < 10) return;
  const a = document.createElement('a');
  a.className = 'wa-float';
  a.href = `https://wa.me/${digits}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.setAttribute('aria-label', 'Chat on WhatsApp');
  a.innerHTML = icon('whatsapp', { size: 26, stroke: 2 });
  document.body.append(a);
}

// ── Boot ─────────────────────────────────────────────────────────
async function boot() {
  const staticHash = document.querySelector('meta[name="cms-content-hash"]')?.content ?? '';
  const onScreen = () => (painted ? contentHash(painted) : staticHash);

  const cached = readCache('home');
  if (cached?.sections?.length && contentHash(cached) !== staticHash) paint(cached);

  const fresh = await loadPage('home', { announcements: true });
  let data = painted;

  if (fresh?.sections?.length) {
    writeCache('home', fresh);
    // Don't yank the page out from under someone who is already reading.
    if (contentHash(fresh) !== onScreen() && (!painted || window.scrollY < 200)) paint(fresh);
    data = fresh;
  }

  if (!data) return; // database unreachable & nothing cached: the HTML stays
  const settings = { ...DEFAULT_SITE, ...(data.settings?.site ?? {}) };
  const announcements = data.announcements ?? [];
  renderWhatsApp(settings.whatsapp);
  renderTicker(settings, announcements);
  wireNoticeLinks(() => announcements);
  maybeShowPopup(settings, announcements);
}

if (IS_PREVIEW) {
  startPreview((payload) => {
    if (!paint(payload)) main.innerHTML = '<p style="padding:160px 24px;text-align:center;color:#7A6A6B">This page has no visible sections yet.</p>';
  });
} else {
  boot();
}
