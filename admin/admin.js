/* ═══════════════════════════════════════════
   THE AGRATHA ACADEMY — ADMIN PANEL
   ═══════════════════════════════════════════ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY, MEDIA_BUCKET } from '../assets/cms/config.js';
import {
  SECTION_TYPES, SITE_SETTINGS_FIELDS, DISCLOSURE_SETTINGS_FIELDS, ANNOUNCEMENT_FIELDS,
} from '../assets/cms/schema.js';
import {
  DEFAULT_SITE, DEFAULT_HOME_SECTIONS, DEFAULT_DISCLOSURE, DEFAULT_DISCLOSURE_SECTIONS,
} from '../assets/cms/defaults.js';
import { esc, slug, formatDate } from '../assets/cms/format.js';
import { buildForm } from './form.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
let user = null;
let dirty = false;

// ── Utilities ────────────────────────────────────────────────────
function toast(message, type = 'ok') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.setAttribute('role', type === 'error' ? 'alert' : 'status');
  t.textContent = message;
  $('#toasts').append(t);
  setTimeout(() => t.classList.add('is-leaving'), type === 'error' ? 6000 : 3000);
  setTimeout(() => t.remove(), type === 'error' ? 6500 : 3500);
}

function setDirty(v) {
  dirty = v;
  document.body.classList.toggle('is-dirty', v);
}
window.addEventListener('beforeunload', (e) => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

function confirmLeave() {
  if (!dirty) return true;
  const ok = confirm('You have unsaved changes. Leave without saving?');
  if (ok) setDirty(false);
  return ok;
}

/** Site-relative paths ("assets/…") need "../" when previewed from /admin/. */
function resolveUrl(url) {
  if (!url) return '';
  if (/^(https?:|data:|blob:|\/)/i.test(url)) return url;
  return `../${url}`;
}

function friendlyError(err) {
  const msg = err?.message || String(err);
  if (/row-level security|permission denied|violates/i.test(msg)) return 'You do not have permission to do that. Are you still logged in as an admin?';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server. Check your internet connection.';
  return msg;
}

async function run(promise, okMessage) {
  const { data, error } = await promise;
  if (error) { toast(friendlyError(error), 'error'); throw error; }
  if (okMessage) toast(okMessage);
  return data;
}

// ── Media: upload with automatic photo resizing ─────────────────
async function shrinkImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const MAX = 2000;
  const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const keepPng = file.type === 'image/png' && file.size < 3 * 1024 * 1024;
  const type = keepPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise((res) => canvas.toBlob(res, type, 0.84));
  if (!blob || blob.size >= file.size) return file;
  const name = file.name.replace(/\.\w+$/, keepPng ? '.png' : '.jpg');
  return new File([blob], name, { type });
}

function folderFor(type) {
  if (type.startsWith('image/')) return 'images';
  if (type.startsWith('video/')) return 'videos';
  return 'documents';
}

async function uploadFile(file, progress = () => {}) {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File is larger than 50 MB. For long videos, upload to YouTube and paste the link instead.');
  }
  progress('Preparing…');
  const prepared = await shrinkImage(file);
  const ext = (prepared.name.match(/\.(\w+)$/)?.[1] ?? 'bin').toLowerCase();
  const base = slug(prepared.name.replace(/\.\w+$/, '')) || 'file';
  const path = `${folderFor(prepared.type)}/${Date.now()}-${base}.${ext}`;
  progress(`Uploading ${(prepared.size / 1024 / 1024).toFixed(1)} MB…`);
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, prepared, {
    contentType: prepared.type, cacheControl: '31536000', upsert: false,
  });
  if (error) throw new Error(friendlyError(error));
  return sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function listMedia() {
  const folders = ['images', 'documents', 'videos'];
  const results = await Promise.all(folders.map((f) =>
    sb.storage.from(MEDIA_BUCKET).list(f, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })));
  const files = [];
  results.forEach(({ data, error }, i) => {
    if (error) return;
    for (const obj of data ?? []) {
      if (!obj.id) continue; // placeholder / sub-folder
      const path = `${folders[i]}/${obj.name}`;
      files.push({
        path,
        folder: folders[i],
        name: obj.name.replace(/^\d+-/, ''),
        size: obj.metadata?.size ?? 0,
        created: obj.created_at,
        url: sb.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl,
      });
    }
  });
  return files.sort((a, b) => String(b.created).localeCompare(String(a.created)));
}

const KIND_FOLDERS = { image: ['images'], file: ['documents', 'images'], video: ['videos'] };

function pickMedia(kind) {
  return new Promise(async (resolve) => {
    const dlg = document.createElement('div');
    dlg.className = 'modal';
    dlg.innerHTML = `
      <div class="modal-card modal-wide" role="dialog" aria-modal="true" aria-label="Choose a file">
        <div class="modal-head"><h2>Choose from library</h2><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
        <div class="modal-body"><p class="muted">Loading…</p></div>
      </div>`;
    document.body.append(dlg);
    const close = (val) => { dlg.remove(); resolve(val); };
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) close(null); });

    const files = (await listMedia()).filter((f) => KIND_FOLDERS[kind].includes(f.folder));
    const body = $('.modal-body', dlg);
    if (!files.length) {
      body.innerHTML = '<p class="muted">Nothing uploaded yet. Close this and use the Upload button.</p>';
      return;
    }
    body.innerHTML = `<div class="media-grid">${files.map((f, i) => mediaTile(f, i, true)).join('')}</div>`;
    body.querySelectorAll('[data-choose]').forEach((b) => b.addEventListener('click', () => close(files[Number(b.dataset.choose)].url)));
  });
}

function mediaTile(f, i, choosing = false) {
  const thumb = f.folder === 'images'
    ? `<img src="${esc(f.url)}" loading="lazy" alt="">`
    : `<span class="media-file-icon">${f.folder === 'videos' ? '▶' : 'PDF'}</span>`;
  return `
    <figure class="media-tile">
      ${choosing ? `<button type="button" class="media-thumb" data-choose="${i}">${thumb}</button>` : `<a class="media-thumb" href="${esc(f.url)}" target="_blank" rel="noopener">${thumb}</a>`}
      <figcaption>
        <span class="media-name" title="${esc(f.name)}">${esc(f.name)}</span>
        <span class="muted">${(f.size / 1024 / 1024).toFixed(2)} MB · ${esc(formatDate(f.created))}</span>
        ${choosing ? '' : `<span class="media-actions"><button type="button" class="btn-link" data-copy="${i}">Copy link</button><button type="button" class="btn-link danger" data-delete="${i}">Delete</button></span>`}
      </figcaption>
    </figure>`;
}

const formCtx = (onChange) => ({ onChange, resolveUrl, media: { upload: uploadFile, pick: pickMedia } });

// ═════════════════════════════════════════════════════════════════
// AUTH SCREENS
// ═════════════════════════════════════════════════════════════════
function authShell(inner) {
  app.innerHTML = `
    <main class="auth-screen">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="../assets/photos/agratha-academy-logo.png" alt="">
          <div><strong>The Agratha Academy</strong><span>Website admin</span></div>
        </div>
        ${inner}
      </div>
      <a class="auth-back" href="../">← Back to website</a>
    </main>`;
}

function showLogin(mode = 'login', notice = '') {
  const titles = { login: 'Log in', signup: 'Create admin account', forgot: 'Reset password' };
  authShell(`
    <h1>${titles[mode]}</h1>
    ${notice ? `<p class="auth-notice">${esc(notice)}</p>` : ''}
    ${mode === 'signup' ? '<p class="muted small">Only e-mail addresses invited by an existing admin can manage the website.</p>' : ''}
    <form id="auth-form" novalidate>
      <label for="email">E-mail</label>
      <input id="email" type="email" autocomplete="email" required>
      ${mode !== 'forgot' ? `
      <label for="password">Password</label>
      <input id="password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" minlength="8" required>
      ${mode === 'signup' ? '<p class="muted small">At least 8 characters.</p>' : ''}` : ''}
      <button class="btn btn-primary btn-block" type="submit">${mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}</button>
      <p class="auth-error" role="alert"></p>
    </form>
    <div class="auth-links">
      ${mode !== 'login' ? '<button type="button" class="btn-link" data-mode="login">Back to log in</button>' : ''}
      ${mode === 'login' ? '<button type="button" class="btn-link" data-mode="forgot">Forgot password?</button><button type="button" class="btn-link" data-mode="signup">First time? Create account</button>' : ''}
    </div>`);

  app.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => showLogin(b.dataset.mode)));
  const form = $('#auth-form');
  const errorEl = $('.auth-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';
    const email = $('#email').value.trim().toLowerCase();
    const password = $('#password')?.value ?? '';
    if (!email) { errorEl.textContent = 'Please enter your e-mail.'; return; }
    if (mode !== 'forgot' && password.length < (mode === 'signup' ? 8 : 1)) {
      errorEl.textContent = mode === 'signup' ? 'Password must be at least 8 characters.' : 'Please enter your password.';
      return;
    }
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const redirectTo = location.origin + location.pathname;
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
        if (error) throw error;
        if (!data.session) {
          showLogin('login', 'Account created. Check your e-mail and click the confirmation link, then log in here.');
        }
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        showLogin('login', 'If that e-mail has an account, a reset link is on its way.');
      }
    } catch (err) {
      const msg = err.message || String(err);
      errorEl.textContent = /invalid login/i.test(msg) ? 'Wrong e-mail or password.'
        : /not confirmed/i.test(msg) ? 'Please confirm your e-mail first (check your inbox).'
          : msg;
    } finally {
      btn.disabled = false;
    }
  });
}

function showSetPassword() {
  authShell(`
    <h1>Choose a new password</h1>
    <form id="pw-form">
      <label for="pw">New password</label>
      <input id="pw" type="password" autocomplete="new-password" minlength="8" required>
      <button class="btn btn-primary btn-block" type="submit">Save password</button>
      <p class="auth-error" role="alert"></p>
    </form>`);
  $('#pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#pw').value;
    if (pw.length < 8) { $('.auth-error').textContent = 'At least 8 characters, please.'; return; }
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) { $('.auth-error').textContent = error.message; return; }
    toast('Password updated');
    history.replaceState(null, '', location.pathname);
    start();
  });
}

function showNotAllowed() {
  authShell(`
    <h1>Not authorised yet</h1>
    <p>You are logged in as <strong>${esc(user.email)}</strong>, but this e-mail is not on the admin list.</p>
    <p class="muted">Ask an existing admin to add this e-mail under <em>Admins → Invite</em>, then log in again.</p>
    <button type="button" class="btn btn-primary btn-block" id="retry">Check again</button>
    <button type="button" class="btn btn-light btn-block" id="logout">Log out</button>`);
  $('#retry').addEventListener('click', start);
  $('#logout').addEventListener('click', () => sb.auth.signOut());
}

// ═════════════════════════════════════════════════════════════════
// APP SHELL
// ═════════════════════════════════════════════════════════════════
const NAV = [
  { route: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { route: 'announcements', label: 'Announcements', icon: '📣' },
  { route: 'home', label: 'Home page', icon: '▦' },
  { route: 'disclosure', label: 'Disclosure page', icon: '§' },
  { route: 'settings', label: 'Menu, footer & site', icon: '⚙' },
  { route: 'media', label: 'Photos & files', icon: '🖼' },
  { route: 'admins', label: 'Admins', icon: '👤' },
];

function shell() {
  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar" id="sidebar">
        <div class="side-brand">
          <img src="../assets/photos/agratha-academy-logo.png" alt="">
          <div><strong>Agratha Admin</strong><span>${esc(user.email)}</span></div>
        </div>
        <nav class="side-nav">
          ${NAV.map((n) => `<a href="#/${n.route}" data-route="${n.route}"><span class="side-icon" aria-hidden="true">${n.icon}</span>${n.label}</a>`).join('')}
        </nav>
        <div class="side-foot">
          <a class="btn btn-light btn-block" href="../" target="_blank" rel="noopener">View website ↗</a>
          <button type="button" class="btn-link" id="logout">Log out</button>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="Menu">☰</button>
          <span class="topbar-title" id="topbar-title"></span>
          <span class="unsaved-pill">Unsaved changes</span>
        </header>
        <div class="view" id="view"></div>
      </div>
    </div>`;
  $('#logout').addEventListener('click', async () => {
    if (!confirmLeave()) return;
    await sb.auth.signOut();
  });
  $('#menu-btn').addEventListener('click', () => $('#sidebar').classList.toggle('is-open'));
  $('#sidebar').addEventListener('click', (e) => { if (e.target.closest('a')) $('#sidebar').classList.remove('is-open'); });
}

let currentHash = '';
window.addEventListener('hashchange', () => {
  if (!user) return;
  if (location.hash === currentHash) return;
  if (!confirmLeave()) { history.replaceState(null, '', currentHash); return; }
  route();
});

function route() {
  currentHash = location.hash || '#/dashboard';
  const [, name = 'dashboard', id] = currentHash.split('/');
  document.querySelectorAll('.side-nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.route === name));
  const nav = NAV.find((n) => n.route === name);
  $('#topbar-title').textContent = nav?.label ?? '';
  const view = $('#view');
  view.innerHTML = '<p class="muted pad">Loading…</p>';
  setDirty(false);
  window.scrollTo(0, 0);
  const views = {
    dashboard: viewDashboard,
    announcements: id ? () => viewAnnouncementEdit(view, id) : () => viewAnnouncements(view),
    home: id ? () => viewSectionEdit(view, 'home', id) : () => viewSections(view, 'home'),
    disclosure: id ? () => viewSectionEdit(view, 'disclosure', id) : () => viewSections(view, 'disclosure'),
    settings: () => viewSettings(view),
    media: () => viewMedia(view),
    admins: () => viewAdmins(view),
  };
  (views[name] ?? viewDashboard)(view).catch?.((err) => {
    console.error(err);
    view.innerHTML = `<div class="pad"><p class="error-box">${esc(friendlyError(err))}</p></div>`;
  });
}

function go(hash) {
  location.hash = hash;
}

// ═════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════
async function viewDashboard(view = $('#view')) {
  const [{ count: homeCount }, { data: anns }] = await Promise.all([
    sb.from('aa_sections').select('id', { count: 'exact', head: true }).eq('page', 'home'),
    sb.from('aa_announcements').select('*').order('created_at', { ascending: false }).limit(50),
  ]);
  const live = (anns ?? []).filter((a) => annStatus(a).key === 'live');
  const popup = live.find((a) => a.show_popup);

  view.innerHTML = `
    <div class="pad">
      <h1 class="page-title">Welcome 👋</h1>
      <p class="muted">Everything you change here appears on the website straight away, for every visitor.</p>

      ${!homeCount ? `
      <div class="callout callout-warn">
        <strong>The website content has not been loaded into the database yet.</strong>
        <p>Click below to copy the current website's text, photos and documents in, so you can start editing.</p>
        <button type="button" class="btn btn-primary" id="seed">Load current website content</button>
      </div>` : ''}

      <div class="card-grid">
        <a class="quick-card" href="#/announcements/new?popup=1">
          <span class="quick-icon">💬</span><strong>Post a pop-up announcement</strong><span>Shows when someone opens the website</span>
        </a>
        <a class="quick-card" href="#/announcements/new">
          <span class="quick-icon">📣</span><strong>Post a notice</strong><span>Notice board and scrolling notice bar</span>
        </a>
        <a class="quick-card" href="#/home">
          <span class="quick-icon">▦</span><strong>Edit home page</strong><span>Text, photos, add / remove / reorder sections</span>
        </a>
        <a class="quick-card" href="#/media">
          <span class="quick-icon">🖼</span><strong>Upload photos & PDFs</strong><span>Photo library for the whole site</span>
        </a>
      </div>

      <div class="panel">
        <div class="panel-head"><h2>Live right now</h2><a href="#/announcements" class="btn-link">All announcements →</a></div>
        <ul class="simple-list">
          <li><span>Pop-up</span><strong>${popup ? esc(popup.title) : '<span class="muted">None</span>'}</strong></li>
          <li><span>Live announcements</span><strong>${live.length}</strong></li>
          <li><span>Home page sections</span><strong>${homeCount ?? 0}</strong></li>
        </ul>
      </div>

      <div class="panel">
        <h2>Formatting tips</h2>
        <ul class="tips">
          <li><code>*words*</code> → <em>highlighted / italic</em> (in headings this gives the gold or maroon accent)</li>
          <li><code>**words**</code> → <strong>bold</strong></li>
          <li><code>[text](https://example.com)</code> → a link. Phone: <code>[Call us](tel:+919537331834)</code></li>
          <li>Leave an empty line between paragraphs.</li>
          <li>Section links in menus use the section's <em>Link ID</em>, e.g. <code>#contact</code>.</li>
        </ul>
      </div>
    </div>`;

  $('#seed')?.addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      await seedDefaults();
      toast('Website content loaded');
      viewDashboard(view);
    } catch { e.target.disabled = false; }
  });
}

async function seedDefaults({ pages = ['home', 'disclosure'] } = {}) {
  const rows = [];
  if (pages.includes('home')) {
    DEFAULT_HOME_SECTIONS.forEach((s, i) => rows.push({ page: 'home', position: (i + 1) * 10, visible: true, ...structuredClone(s) }));
  }
  if (pages.includes('disclosure')) {
    DEFAULT_DISCLOSURE_SECTIONS.forEach((s, i) => rows.push({ page: 'disclosure', position: (i + 1) * 10, visible: true, ...structuredClone(s) }));
  }
  await run(sb.from('aa_sections').insert(rows));
  await run(sb.from('aa_settings').upsert([
    { key: 'site', data: DEFAULT_SITE },
    { key: 'disclosure', data: DEFAULT_DISCLOSURE },
  ], { onConflict: 'key', ignoreDuplicates: true }));
}

// ═════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═════════════════════════════════════════════════════════════════
function annStatus(a) {
  const now = Date.now();
  if (!a.active) return { key: 'draft', label: 'Hidden' };
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return { key: 'scheduled', label: `Starts ${formatDate(a.starts_at)}` };
  if (a.ends_at && new Date(a.ends_at).getTime() <= now) return { key: 'expired', label: 'Expired' };
  return { key: 'live', label: 'Live' };
}

async function viewAnnouncements(view) {
  const anns = await run(sb.from('aa_announcements').select('*')
    .order('pinned', { ascending: false }).order('created_at', { ascending: false }));
  view.innerHTML = `
    <div class="pad">
      <div class="page-head">
        <div>
          <h1 class="page-title">Announcements</h1>
          <p class="muted">Pop-ups, the scrolling notice bar and the notice board all come from here.</p>
        </div>
        <a class="btn btn-primary" href="#/announcements/new">+ New announcement</a>
      </div>
      ${anns.length ? `
      <div class="rows">
        ${anns.map((a) => {
          const st = annStatus(a);
          return `
          <div class="row-card">
            <div class="row-main">
              <a class="row-title" href="#/announcements/${a.id}">${a.pinned ? '📌 ' : ''}${esc(a.title)}</a>
              <div class="tags">
                <span class="tag tag-${st.key}">${esc(st.label)}</span>
                ${a.show_popup ? '<span class="tag">Pop-up</span>' : ''}
                ${a.show_ticker ? '<span class="tag">Notice bar</span>' : ''}
                ${a.show_on_board ? '<span class="tag">Notice board</span>' : ''}
                ${a.ends_at ? `<span class="tag tag-muted">Until ${esc(formatDate(a.ends_at))}</span>` : ''}
              </div>
            </div>
            <div class="row-actions">
              <label class="switch small" title="Show on website">
                <input type="checkbox" data-toggle="${a.id}" ${a.active ? 'checked' : ''}>
                <span class="switch-ui"></span>
              </label>
              <a class="btn btn-small btn-light" href="#/announcements/${a.id}">Edit</a>
              <button type="button" class="icon-btn danger" data-del="${a.id}" title="Delete">✕</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : `
      <div class="empty">
        <p>No announcements yet.</p>
        <a class="btn btn-primary" href="#/announcements/new?popup=1">Create your first pop-up</a>
      </div>`}
    </div>`;

  view.querySelectorAll('[data-toggle]').forEach((cb) => cb.addEventListener('change', async () => {
    await run(sb.from('aa_announcements').update({ active: cb.checked }).eq('id', cb.dataset.toggle), cb.checked ? 'Now showing on the website' : 'Hidden from the website');
    viewAnnouncements(view);
  }));
  view.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    const a = anns.find((x) => x.id === b.dataset.del);
    if (!confirm(`Delete “${a.title}”? This cannot be undone.`)) return;
    await run(sb.from('aa_announcements').delete().eq('id', a.id), 'Deleted');
    viewAnnouncements(view);
  }));
}

async function viewAnnouncementEdit(view, rawId) {
  const [id, query = ''] = rawId.split('?');
  const isNew = id === 'new';
  let record;
  if (isNew) {
    const popup = new URLSearchParams(query).get('popup') === '1';
    record = {
      title: '', body: '', image_url: '', link_url: '', link_label: '',
      show_popup: popup, show_ticker: true, show_on_board: true, pinned: false, active: true,
      starts_at: null, ends_at: null,
    };
  } else {
    record = await run(sb.from('aa_announcements').select('*').eq('id', id).single());
  }

  view.innerHTML = `
    <div class="pad narrow">
      <a class="back-link" href="#/announcements">← Announcements</a>
      <h1 class="page-title">${isNew ? 'New announcement' : 'Edit announcement'}</h1>
      <div class="panel" id="form-slot"></div>
      <div class="panel preview-panel">
        <h2>Preview</h2>
        <div id="ann-preview"></div>
      </div>
    </div>
    <div class="save-bar">
      <a class="btn btn-light" href="#/announcements">Cancel</a>
      <button type="button" class="btn btn-primary" id="save">Save & publish</button>
    </div>`;

  const renderPreview = () => {
    $('#ann-preview').innerHTML = `
      <div class="ann-preview">
        ${record.image_url ? `<img src="${esc(resolveUrl(record.image_url))}" alt="">` : ''}
        <strong>${esc(record.title || 'Title')}</strong>
        <p>${esc(record.body || '').replace(/\n/g, '<br>')}</p>
        ${record.link_url ? `<span class="btn btn-small btn-primary">${esc(record.link_label || 'Learn more')}</span>` : ''}
      </div>`;
  };
  $('#form-slot').append(buildForm(ANNOUNCEMENT_FIELDS, record, formCtx(() => { setDirty(true); renderPreview(); })));
  renderPreview();

  $('#save').addEventListener('click', async (e) => {
    if (!record.title?.trim()) { toast('Please add a title', 'error'); return; }
    if (record.show_popup && record.active) {
      const others = await run(sb.from('aa_announcements').select('id,title').eq('show_popup', true).eq('active', true).neq('id', isNew ? '00000000-0000-0000-0000-000000000000' : id));
      if (others.length && !confirm(`Only one pop-up is shown at a time (the newest). “${others[0].title}” is also a pop-up. Continue?`)) return;
    }
    e.target.disabled = true;
    const payload = { ...record };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    try {
      if (isNew) await run(sb.from('aa_announcements').insert(payload), 'Announcement published');
      else await run(sb.from('aa_announcements').update(payload).eq('id', id), 'Saved');
      setDirty(false);
      go('#/announcements');
    } catch {
      e.target.disabled = false;
    }
  });
}

// ═════════════════════════════════════════════════════════════════
// PAGE SECTIONS
// ═════════════════════════════════════════════════════════════════
const PAGE_INFO = {
  home: { title: 'Home page', url: '../', blurb: 'Sections appear on the website in this order. Use the ↑ ↓ arrows to move them, and the switch to show or hide one.' },
  disclosure: { title: 'Disclosure page', url: '../mandatory-public-disclosure.html', blurb: 'CBSE Mandatory Public Disclosure. Sections are lettered A, B, C… automatically.' },
};

async function viewSections(view, page) {
  const types = SECTION_TYPES[page];
  const info = PAGE_INFO[page];
  const sections = await run(sb.from('aa_sections').select('id,type,label,anchor,visible,position').eq('page', page).order('position'));

  view.innerHTML = `
    <div class="pad">
      <div class="page-head">
        <div>
          <h1 class="page-title">${info.title}</h1>
          <p class="muted">${info.blurb}</p>
        </div>
        <div class="head-actions">
          <a class="btn btn-light" href="${info.url}" target="_blank" rel="noopener">View page ↗</a>
          <button type="button" class="btn btn-primary" id="add">+ Add section</button>
        </div>
      </div>
      ${page === 'disclosure' ? '<div class="panel" id="disc-settings"></div>' : ''}
      ${sections.length ? `
      <div class="rows" id="rows">
        ${sections.map((s, i) => `
        <div class="row-card${s.visible ? '' : ' is-hidden'}">
          <div class="row-order">
            <button type="button" class="icon-btn" data-move="-1" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
            <button type="button" class="icon-btn" data-move="1" data-i="${i}" ${i === sections.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
          </div>
          <div class="row-main">
            <a class="row-title" href="#/${page}/${s.id}">${esc(s.label || types[s.type]?.label || s.type)}</a>
            <div class="tags">
              <span class="tag tag-muted">${esc(types[s.type]?.label ?? s.type)}</span>
              ${s.anchor ? `<span class="tag tag-muted">#${esc(s.anchor)}</span>` : ''}
              ${s.visible ? '' : '<span class="tag tag-draft">Hidden</span>'}
            </div>
          </div>
          <div class="row-actions">
            <label class="switch small" title="Show on website">
              <input type="checkbox" data-vis="${s.id}" ${s.visible ? 'checked' : ''}>
              <span class="switch-ui"></span>
            </label>
            <a class="btn btn-small btn-light" href="#/${page}/${s.id}">Edit</a>
            <button type="button" class="icon-btn" data-dup="${s.id}" title="Duplicate">⧉</button>
            <button type="button" class="icon-btn danger" data-del="${s.id}" title="Delete">✕</button>
          </div>
        </div>`).join('')}
      </div>` : `
      <div class="empty">
        <p>This page has no sections yet.</p>
        <button type="button" class="btn btn-primary" id="seed">Load the original ${info.title.toLowerCase()} content</button>
      </div>`}
    </div>`;

  if (page === 'disclosure') await mountSettingsForm($('#disc-settings'), 'disclosure', DISCLOSURE_SETTINGS_FIELDS, DEFAULT_DISCLOSURE, 'Page header, sidebar & footer');

  $('#seed')?.addEventListener('click', async () => {
    await seedDefaults({ pages: [page] });
    toast('Content loaded');
    viewSections(view, page);
  });

  $('#add').addEventListener('click', () => chooseSectionType(page, async (type) => {
    const def = types[type];
    const last = sections[sections.length - 1]?.position ?? 0;
    const label = def.label.replace(/\s*\(.*\)$/, '');
    const anchorBase = slug(label) || type;
    const taken = new Set(sections.map((s) => s.anchor));
    let anchor = anchorBase;
    for (let n = 2; taken.has(anchor); n++) anchor = `${anchorBase}-${n}`;
    const [row] = await run(sb.from('aa_sections').insert({
      page, type, label, anchor, position: last + 10, visible: false, data: structuredClone(def.defaults ?? {}),
    }).select('id'));
    toast('Section added (hidden until you switch it on)');
    go(`#/${page}/${row.id}`);
  }));

  view.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', async () => {
    const i = Number(b.dataset.i);
    const j = i + Number(b.dataset.move);
    const order = sections.slice();
    [order[i], order[j]] = [order[j], order[i]];
    await Promise.all(order.map((s, k) => (s.position !== (k + 1) * 10
      ? sb.from('aa_sections').update({ position: (k + 1) * 10 }).eq('id', s.id)
      : null)).filter(Boolean));
    viewSections(view, page);
  }));
  view.querySelectorAll('[data-vis]').forEach((cb) => cb.addEventListener('change', async () => {
    await run(sb.from('aa_sections').update({ visible: cb.checked }).eq('id', cb.dataset.vis), cb.checked ? 'Section is now visible' : 'Section hidden');
    viewSections(view, page);
  }));
  view.querySelectorAll('[data-dup]').forEach((b) => b.addEventListener('click', async () => {
    const src = await run(sb.from('aa_sections').select('*').eq('id', b.dataset.dup).single());
    const idx = sections.findIndex((s) => s.id === src.id);
    const nextPos = sections[idx + 1]?.position ?? src.position + 10;
    await run(sb.from('aa_sections').insert({
      page, type: src.type, label: `${src.label || 'Section'} (copy)`, anchor: src.anchor ? `${src.anchor}-copy` : '',
      position: Math.floor((src.position + nextPos) / 2) === src.position ? src.position + 1 : Math.floor((src.position + nextPos) / 2),
      visible: false, data: src.data,
    }), 'Duplicated (hidden until you switch it on)');
    viewSections(view, page);
  }));
  view.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    const s = sections.find((x) => x.id === b.dataset.del);
    if (!confirm(`Delete the “${s.label || s.type}” section? This cannot be undone.\n\nTip: you can hide it instead with the switch.`)) return;
    await run(sb.from('aa_sections').delete().eq('id', s.id), 'Section deleted');
    viewSections(view, page);
  }));
}

function chooseSectionType(page, onPick) {
  const types = SECTION_TYPES[page];
  const dlg = document.createElement('div');
  dlg.className = 'modal';
  dlg.innerHTML = `
    <div class="modal-card modal-wide" role="dialog" aria-modal="true" aria-label="Add a section">
      <div class="modal-head"><h2>Add a section</h2><button type="button" class="icon-btn" data-close aria-label="Close">✕</button></div>
      <div class="modal-body">
        <div class="type-grid">
          ${Object.entries(types).map(([key, t]) => `
          <button type="button" class="type-card" data-type="${key}">
            <strong>${esc(t.label)}</strong>
            <span>${esc(t.description ?? '')}</span>
          </button>`).join('')}
        </div>
      </div>
    </div>`;
  document.body.append(dlg);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-close]')) dlg.remove();
    const card = e.target.closest('[data-type]');
    if (card) { dlg.remove(); onPick(card.dataset.type); }
  });
}

async function viewSectionEdit(view, page, id) {
  const section = await run(sb.from('aa_sections').select('*').eq('id', id).single());
  const def = SECTION_TYPES[page][section.type];
  if (!def) {
    view.innerHTML = `<div class="pad"><p class="error-box">Unknown section type “${esc(section.type)}”.</p></div>`;
    return;
  }
  const meta = { label: section.label ?? '', anchor: section.anchor ?? '', visible: section.visible };
  const data = { ...structuredClone(def.defaults ?? {}), ...(section.data ?? {}) };

  view.innerHTML = `
    <div class="pad narrow">
      <a class="back-link" href="#/${page}">← ${PAGE_INFO[page].title}</a>
      <h1 class="page-title">${esc(meta.label || def.label)}</h1>
      <p class="muted">${esc(def.label)} — ${esc(def.description ?? '')}</p>
      <div class="panel" id="meta-slot"><h2>Section settings</h2></div>
      <div class="panel" id="form-slot"><h2>Content</h2></div>
    </div>
    <div class="save-bar">
      <a class="btn btn-light" href="${PAGE_INFO[page].url}${meta.anchor ? '#' + esc(meta.anchor) : ''}" target="_blank" rel="noopener">View ↗</a>
      <button type="button" class="btn btn-primary" id="save">Save</button>
    </div>`;

  const onChange = () => setDirty(true);
  $('#meta-slot').append(buildForm([
    { key: 'label', label: 'Section name (only shown in admin & menus)', type: 'text' },
    { key: 'anchor', label: 'Link ID', type: 'text', help: 'Used for menu links, e.g. “contact” makes #contact scroll here. Letters, numbers and dashes only.' },
    { key: 'visible', label: 'Show this section on the website', type: 'bool' },
  ], meta, formCtx(onChange)));
  $('#form-slot').append(buildForm(def.fields, data, formCtx(onChange)));

  $('#save').addEventListener('click', async (e) => {
    const anchor = slug(meta.anchor);
    e.target.disabled = true;
    try {
      await run(sb.from('aa_sections').update({ label: meta.label, anchor, visible: meta.visible, data }).eq('id', id), 'Saved — live on the website');
      setDirty(false);
      meta.anchor = anchor;
      $('.page-title').textContent = meta.label || def.label;
    } finally {
      e.target.disabled = false;
    }
  });
}

// ═════════════════════════════════════════════════════════════════
// SETTINGS
// ═════════════════════════════════════════════════════════════════
async function mountSettingsForm(slot, key, fields, defaults, title) {
  const row = await run(sb.from('aa_settings').select('data').eq('key', key).maybeSingle());
  const data = { ...structuredClone(defaults), ...(row?.data ?? {}) };
  slot.innerHTML = `<div class="panel-head"><h2>${esc(title)}</h2><button type="button" class="btn btn-primary btn-small" data-save>Save</button></div>`;
  slot.append(buildForm(fields, data, formCtx(() => setDirty(true))));
  slot.querySelector('[data-save]').addEventListener('click', async (e) => {
    e.target.disabled = true;
    try {
      await run(sb.from('aa_settings').upsert({ key, data }, { onConflict: 'key' }), 'Saved — live on the website');
      setDirty(false);
    } finally {
      e.target.disabled = false;
    }
  });
}

async function viewSettings(view) {
  view.innerHTML = `
    <div class="pad narrow">
      <h1 class="page-title">Menu, footer & site settings</h1>
      <p class="muted">School name and logo, top menu, footer, the WhatsApp button and Google search text.</p>
      <div class="panel" id="site-settings"></div>
    </div>`;
  await mountSettingsForm($('#site-settings'), 'site', SITE_SETTINGS_FIELDS, DEFAULT_SITE, 'Site settings');
}

// ═════════════════════════════════════════════════════════════════
// MEDIA LIBRARY
// ═════════════════════════════════════════════════════════════════
async function viewMedia(view) {
  view.innerHTML = `
    <div class="pad">
      <div class="page-head">
        <div>
          <h1 class="page-title">Photos & files</h1>
          <p class="muted">Upload once, use anywhere. Large photos are resized automatically. Max 50 MB per file.</p>
        </div>
        <label class="btn btn-primary">
          + Upload files
          <input type="file" id="uploader" multiple accept="image/*,application/pdf,video/*" hidden>
        </label>
      </div>
      <div class="upload-log" id="upload-log"></div>
      <div class="filter-tabs" role="tablist">
        <button type="button" class="chip is-active" data-f="all">All</button>
        <button type="button" class="chip" data-f="images">Photos</button>
        <button type="button" class="chip" data-f="documents">PDFs</button>
        <button type="button" class="chip" data-f="videos">Videos</button>
      </div>
      <div id="media-list"><p class="muted">Loading…</p></div>
    </div>`;

  let files = [];
  let filter = 'all';
  const draw = () => {
    const shown = filter === 'all' ? files : files.filter((f) => f.folder === filter);
    $('#media-list').innerHTML = shown.length
      ? `<div class="media-grid">${shown.map((f) => mediaTile(f, files.indexOf(f))).join('')}</div>`
      : '<div class="empty"><p>Nothing here yet.</p></div>';
  };
  const load = async () => { files = await listMedia(); draw(); };

  $('#media-list').addEventListener('click', async (e) => {
    const copy = e.target.closest('[data-copy]');
    const del = e.target.closest('[data-delete]');
    if (copy) {
      await navigator.clipboard.writeText(files[Number(copy.dataset.copy)].url).catch(() => {});
      toast('Link copied');
    }
    if (del) {
      const f = files[Number(del.dataset.delete)];
      if (!confirm(`Delete “${f.name}”?\n\nAny page or announcement still using it will show a broken image/link.`)) return;
      await run(sb.storage.from(MEDIA_BUCKET).remove([f.path]), 'Deleted');
      load();
    }
  });
  view.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f;
    view.querySelectorAll('[data-f]').forEach((x) => x.classList.toggle('is-active', x === b));
    draw();
  }));
  $('#uploader').addEventListener('change', async (e) => {
    const list = [...e.target.files];
    e.target.value = '';
    const log = $('#upload-log');
    for (const file of list) {
      const line = document.createElement('div');
      line.textContent = `${file.name}: starting…`;
      log.append(line);
      try {
        await uploadFile(file, (msg) => { line.textContent = `${file.name}: ${msg}`; });
        line.textContent = `${file.name}: uploaded ✓`;
        line.className = 'ok';
      } catch (err) {
        line.textContent = `${file.name}: ${err.message}`;
        line.className = 'error';
      }
    }
    load();
  });
  await load();
}

// ═════════════════════════════════════════════════════════════════
// ADMINS
// ═════════════════════════════════════════════════════════════════
async function viewAdmins(view) {
  const [admins, invites] = await Promise.all([
    run(sb.from('aa_admins').select('*').order('created_at')),
    run(sb.from('aa_admin_invites').select('*').order('invited_at')),
  ]);
  const activeEmails = new Set(admins.map((a) => a.email));
  view.innerHTML = `
    <div class="pad narrow">
      <h1 class="page-title">Admins</h1>
      <p class="muted">People who can log in and change the website.</p>

      <div class="panel">
        <h2>Invite someone</h2>
        <p class="muted small">Add their e-mail here, then ask them to open <strong>${esc(location.origin + location.pathname)}</strong>, click <em>First time? Create account</em>, and sign up with this same e-mail.</p>
        <form id="invite-form" class="inline-form">
          <input type="email" id="invite-email" placeholder="name@example.com" required aria-label="E-mail to invite">
          <button class="btn btn-primary" type="submit">Invite</button>
        </form>
      </div>

      <div class="panel">
        <h2>Allowed e-mails</h2>
        <ul class="simple-list">
          ${invites.map((i) => `
          <li>
            <span>${esc(i.email)}</span>
            <span class="row-actions">
              ${activeEmails.has(i.email) ? '<span class="tag tag-live">Active</span>' : '<span class="tag tag-scheduled">Not signed up yet</span>'}
              ${i.email === user.email ? '<span class="tag tag-muted">You</span>' : `<button type="button" class="icon-btn danger" data-remove="${esc(i.email)}" title="Remove access">✕</button>`}
            </span>
          </li>`).join('')}
        </ul>
      </div>

      <div class="panel">
        <h2>Your account</h2>
        <form id="pw-change" class="inline-form">
          <input type="password" id="new-pw" placeholder="New password (8+ characters)" minlength="8" autocomplete="new-password" aria-label="New password">
          <button class="btn btn-light" type="submit">Change password</button>
        </form>
      </div>
    </div>`;

  $('#invite-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#invite-email').value.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Please enter a valid e-mail', 'error'); return; }
    await run(sb.from('aa_admin_invites').upsert({ email, invited_by: user.id }, { onConflict: 'email' }), `${email} can now create an admin account`);
    viewAdmins(view);
  });
  view.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
    const email = b.dataset.remove;
    if (!confirm(`Remove admin access for ${email}?`)) return;
    await run(sb.from('aa_admin_invites').delete().eq('email', email));
    await run(sb.from('aa_admins').delete().eq('email', email), 'Access removed');
    viewAdmins(view);
  }));
  $('#pw-change').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#new-pw').value;
    if (pw.length < 8) { toast('At least 8 characters, please', 'error'); return; }
    await run(sb.auth.updateUser({ password: pw }), 'Password changed');
    $('#new-pw').value = '';
  });
}

// ═════════════════════════════════════════════════════════════════
// BOOT
// ═════════════════════════════════════════════════════════════════
let recovering = /type=recovery/.test(location.hash);

async function start() {
  const { data: { session } } = await sb.auth.getSession();
  user = session?.user ?? null;
  if (!user) { showLogin(); return; }
  if (recovering) { showSetPassword(); recovering = false; return; }

  const { data: isAdmin, error } = await sb.rpc('aa_claim_admin');
  if (error) {
    authShell(`<h1>Something went wrong</h1><p class="error-box">${esc(friendlyError(error))}</p><button class="btn btn-primary btn-block" onclick="location.reload()">Try again</button>`);
    return;
  }
  if (!isAdmin) { showNotAllowed(); return; }

  shell();
  if (!location.hash.startsWith('#/')) history.replaceState(null, '', '#/dashboard');
  route();
}

sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') { recovering = true; user = session?.user ?? null; showSetPassword(); return; }
  if (event === 'SIGNED_IN' && !app.querySelector('.layout')) setTimeout(start, 0);
  if (event === 'SIGNED_OUT') { user = null; setDirty(false); showLogin(); }
});

start();
