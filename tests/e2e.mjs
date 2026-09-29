// End-to-end browser tests for the public pages and the admin panel.
// Runs against a fake Supabase backend, so no network or real data is needed.
//
//   npm install && npm test
//
// Screenshots are written to tests/screenshots/ (git-ignored).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.OUT || path.join(ROOT, 'tests', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const { DEFAULT_SITE, DEFAULT_HOME_SECTIONS, DEFAULT_DISCLOSURE, DEFAULT_DISCLOSURE_SECTIONS } = await import('../assets/cms/defaults.js');

// ── static server ──
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8765);

// ── fake database ──
let n = 0;
const id = () => `00000000-0000-0000-0000-${String(++n).padStart(12, '0')}`;
const db = {
  aa_settings: [{ key: 'site', data: DEFAULT_SITE }, { key: 'disclosure', data: DEFAULT_DISCLOSURE }],
  aa_sections: [
    ...DEFAULT_HOME_SECTIONS.map((s, i) => ({ id: id(), page: 'home', position: (i + 1) * 10, visible: true, ...s })),
    ...DEFAULT_DISCLOSURE_SECTIONS.map((s, i) => ({ id: id(), page: 'disclosure', position: (i + 1) * 10, visible: true, ...s })),
  ],
  aa_announcements: [
    { id: id(), title: 'Admissions open for 2026–27', body: 'Forms available at the school office.\n\nCall us for details.', image_url: '', link_url: 'tel:+919537331834', link_label: 'Call now', show_popup: true, show_ticker: true, show_on_board: true, active: true, pinned: true, starts_at: null, ends_at: null, created_at: '2026-09-20T10:00:00Z', updated_at: '2026-09-20T10:00:00Z' },
    { id: id(), title: 'Navratri holidays 1–3 Oct', body: 'School closed.', show_popup: false, show_ticker: true, show_on_board: true, active: true, pinned: false, created_at: '2026-09-25T10:00:00Z', updated_at: '2026-09-25T10:00:00Z' },
  ],
  aa_admins: [{ user_id: 'u1', email: 'admin@example.com', created_at: '2026-01-01' }],
  aa_admin_invites: [{ email: 'admin@example.com', invited_at: '2026-01-01' }],
  aa_revisions: [],
};
let revSeq = 0;
const recordRevision = (r, action) => db.aa_revisions.push({ id: ++revSeq, target: 'section', target_id: r.id, page: r.page, action, row: structuredClone(r), created_at: new Date().toISOString(), created_by: 'u1' });
const writes = [];

function applyFilters(rows, params) {
  for (const [k, v] of params) {
    if (['select', 'order', 'limit', 'on_conflict', 'columns'].includes(k)) continue;
    const [op, ...rest] = v.split('.');
    const val = rest.join('.');
    rows = rows.filter((r) => {
      if (op === 'eq') return String(r[k]) === val;
      if (op === 'neq') return String(r[k]) !== val;
      if (op === 'is') return String(r[k] ?? null) === (val === 'null' ? 'null' : val);
      return true;
    });
  }
  const order = params.get('order');
  if (order) {
    const keys = order.split(',').map((o) => o.split('.'));
    rows = rows.slice().sort((a, b) => {
      for (const [k, dir] of keys) {
        const x = a[k] ?? '', y = b[k] ?? '';
        if (x < y) return dir === 'desc' ? 1 : -1;
        if (x > y) return dir === 'desc' ? -1 : 1;
      }
      return 0;
    });
  }
  return rows;
}

async function fakeSupabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  const p = url.pathname;
  const json = (body, status = 200, headers = {}) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*', ...headers }, body: JSON.stringify(body) });
  if (req.method() === 'OPTIONS') return json({});

  if (p.startsWith('/auth/v1/token')) {
    const body = JSON.parse(req.postData() || '{}');
    if (body.password !== 'correct-horse') return json({ error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', code: 'invalid_credentials' }, 400);
    const now = Math.floor(Date.now() / 1000);
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'u1', role: 'authenticated', exp: now + 3600, email: body.email })}.sig`;
    return json({ access_token: jwt, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token: 'r', user: { id: 'u1', email: body.email, aud: 'authenticated', role: 'authenticated' } });
  }
  if (p.startsWith('/auth/v1/user')) return json({ id: 'u1', email: 'admin@example.com', aud: 'authenticated', role: 'authenticated' });
  if (p.startsWith('/auth/v1/logout')) return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
  if (p === '/rest/v1/rpc/aa_claim_admin') return json(true);

  if (p.startsWith('/storage/v1/object/list/')) return json([]);
  if (p.startsWith('/storage/v1/object/')) return json({ Key: 'x' });

  const table = p.replace('/rest/v1/', '');
  if (!db[table]) return json({ message: 'no table ' + table }, 404);
  const params = url.searchParams;
  const method = req.method();
  const prefer = req.headers()['prefer'] || '';
  if (method === 'GET' || method === 'HEAD') {
    let rows = applyFilters(db[table], params);
    const single = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': `0-${rows.length - 1}/${rows.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': '*' } });
    return json(single ? rows[0] : rows, 200, { 'content-range': `0-${rows.length - 1}/${rows.length}` });
  }
  const body = JSON.parse(req.postData() || 'null');
  writes.push({ method, table, params: params.toString(), body });
  if (method === 'POST') {
    const list = (Array.isArray(body) ? body : [body]).map((r) => ({ id: id(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...r }));
    for (const r of list) {
      const key = table === 'aa_settings' ? 'key' : table === 'aa_admin_invites' ? 'email' : 'id';
      const i = db[table].findIndex((x) => x[key] === r[key]);
      if (i >= 0) db[table][i] = { ...db[table][i], ...r }; else db[table].push(r);
    }
    return json(prefer.includes('return=representation') ? list : null, 201);
  }
  if (method === 'PATCH') {
    const rows = applyFilters(db[table], params);
    if (table === 'aa_sections' && Object.keys(body).some((k) => k !== 'position')) rows.forEach((r) => recordRevision(r, 'update'));
    rows.forEach((r) => Object.assign(r, body, { updated_at: new Date().toISOString() }));
    return json(prefer.includes('return=representation') ? rows : null, 200);
  }
  if (method === 'DELETE') {
    const rows = new Set(applyFilters(db[table], params));
    if (table === 'aa_sections') rows.forEach((r) => recordRevision(r, 'delete'));
    db[table] = db[table].filter((r) => !rows.has(r));
    return json(null, 204);
  }
  return json({}, 400);
}

const umdPath = process.env.SUPABASE_UMD || createRequire(import.meta.url).resolve('@supabase/supabase-js/dist/umd/supabase.js');
const umd = fs.readFileSync(umdPath, 'utf8');
const shim = `${umd}\nexport const createClient = supabase.createClient;`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
async function newPage(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('https://mwmkvfezqxxdkzkhtkfl.supabase.co/**', fakeSupabase);
  await ctx.route('https://cdn.jsdelivr.net/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: shim, headers: { 'access-control-allow-origin': '*' } }));
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  // Keep the test offline: stand-ins for YouTube thumbnails / players.
  await ctx.route(/https:\/\/(img\.youtube\.com|www\.youtube-nocookie\.com|player\.vimeo\.com)\//, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '' }));
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
  return page;
}

let failures = 0;
const check = (cond, label) => {
  if (!cond) failures++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
};

// ── 1. Home page ──
{
  const page = await newPage();
  await page.goto('http://localhost:8765/');
  await page.waitForSelector('.announce-modal:not([hidden])', { timeout: 5000 }).catch(() => {});
  check(await page.isVisible('.announce-modal:not([hidden])'), 'pop-up announcement shows');
  check((await page.textContent('#announce-title'))?.includes('Admissions open'), 'pop-up has title');
  await page.screenshot({ path: `${OUT}/home-popup.png` });
  await page.click('.announce-close');
  check(await page.isHidden('.announce-modal'), 'pop-up closes');
  check(await page.isVisible('.notice-ticker'), 'ticker bar shows');
  check((await page.$$('main > section, main > div')).length >= 13, `sections rendered (${(await page.$$('main > section, main > div')).length})`);
  check(await page.isVisible('#notices .notice-card'), 'notice board lists announcements');
  check((await page.$$eval('.primary-nav a', (a) => a.map((x) => x.textContent))).includes('Notices'), 'nav from settings');
  check(!(await page.evaluate(() => document.documentElement.classList.contains('cms-pending'))), 'page revealed');
  await page.screenshot({ path: `${OUT}/home-top.png` });
  await page.evaluate(() => document.querySelectorAll('.animate-in').forEach((e) => e.classList.add('is-visible')));
  await page.screenshot({ path: `${OUT}/home-full.png`, fullPage: true });
  // notice "read more"
  await page.locator('.ticker-item').first().dispatchEvent('click');
  check(await page.isVisible('.announce-modal:not([hidden])'), 'notice opens in modal');
  await page.keyboard.press('Escape');
}

// ── 1b. Up-to-date HTML is not re-rendered (no flicker); stale HTML is ──
{
  const page = await newPage();
  await page.goto('http://localhost:8765/');
  await page.waitForTimeout(800);
  const hash = await page.evaluate(async () => {
    const { contentHash } = await import('/assets/cms/format.js');
    return contentHash(JSON.parse(localStorage.getItem('agratha-cms:home')));
  });
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const [label, metaHash, expectRepaint] of [['matching', hash, false], ['stale', 'deadbeef', true]]) {
    const p2 = await newPage();
    await p2.route('http://localhost:8765/', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html.replace(/(<meta name="cms-content-hash" content=")[^"]*/, `$1${metaHash}`) }));
    await p2.addInitScript(() => {
      window.__mainMutations = 0;
      document.addEventListener('DOMContentLoaded', () => {
        new MutationObserver((m) => { window.__mainMutations += m.length; }).observe(document.querySelector('main'), { childList: true });
      });
    });
    await p2.goto('http://localhost:8765/');
    await p2.waitForTimeout(900);
    const n = await p2.evaluate(() => window.__mainMutations);
    check(expectRepaint ? n > 0 : n === 0, `${label} fingerprint → ${expectRepaint ? 'repainted' : 'left untouched'} (${n} changes)`);
  }
}

// ── 2. Mobile home ──
{
  const page = await newPage({ width: 390, height: 844 });
  await page.goto('http://localhost:8765/');
  await page.waitForTimeout(800);
  await page.click('.announce-close').catch(() => {});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, `no horizontal scroll on mobile (${overflow})`);
  await page.screenshot({ path: `${OUT}/home-mobile.png` });
}

// ── 3. Database down → static fallback ──
{
  const ctx = await browser.newContext();
  await ctx.route('https://mwmkvfezqxxdkzkhtkfl.supabase.co/**', (r) => r.abort());
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  await page.goto('http://localhost:8765/');
  await page.waitForTimeout(1500);
  check(await page.isVisible('#about h2'), 'static fallback visible when DB unreachable');
}

// ── 3b. JavaScript turned off → prerendered HTML is readable ──
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  await page.goto('http://localhost:8765/');
  const op = await page.locator('#about .about-text').evaluate((el) => getComputedStyle(el).opacity);
  check(op === '1', `no-JS: content visible (opacity ${op})`);
  check((await page.locator('main > section, main > div').count()) >= 13, 'no-JS: all sections in HTML');
  check((await page.locator('.primary-nav a').count()) === 7, 'no-JS: nav in HTML');
  await page.screenshot({ path: `${OUT}/nojs-home.png`, fullPage: false });
  await page.goto('http://localhost:8765/mandatory-public-disclosure.html');
  check((await page.locator('#staff .faculty-table tbody tr').count()) === 49, 'no-JS: disclosure staff table in HTML');
}

// ── 4. Disclosure page ──
{
  const page = await newPage();
  await page.goto('http://localhost:8765/mandatory-public-disclosure.html');
  await page.waitForTimeout(800);
  check((await page.$$('.disclosure-section')).length === 5, 'disclosure sections rendered');
  check((await page.$$('#staff .faculty-table tbody tr')).length === 49, 'staff rows rendered');
  check((await page.textContent('.sidebar-nav'))?.includes('Infrastructure'), 'sidebar nav rendered');
  await page.screenshot({ path: `${OUT}/disclosure.png` });
}

// ── 5. Admin panel ──
{
  const page = await newPage();
  await page.goto('http://localhost:8765/admin/');
  await page.waitForSelector('#auth-form', { timeout: 6000 }).catch(async () => {
    console.log('ADMIN BODY:', (await page.textContent('body')).slice(0, 300));
    console.log(errors.join('\n'));
    process.exit(1);
  });
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'wrong');
  await page.click('#auth-form button[type=submit]');
  await page.waitForTimeout(500);
  check((await page.textContent('.auth-error'))?.includes('Wrong'), 'wrong password rejected');
  await page.fill('#password', 'correct-horse');
  await page.click('#auth-form button[type=submit]');
  await page.waitForSelector('.layout', { timeout: 5000 });
  check(true, 'logged in → dashboard');
  await page.screenshot({ path: `${OUT}/admin-dashboard.png` });

  // ── Home page builder ──
  const sorted = () => db.aa_sections.filter((s) => s.page === 'home').sort((a, b) => a.position - b.position);
  await page.goto('http://localhost:8765/admin/#/home');
  await page.waitForSelector('.sec-row');
  await page.waitForSelector('.pv.is-ready', { timeout: 8000 });
  const frame = page.frameLocator('.pv iframe');
  await page.waitForTimeout(500);
  check(await frame.locator('[data-cms-id]').count() === 13, 'preview shows all 13 sections');
  await page.click('.sec-row:nth-child(3) .sec-main');
  await page.waitForTimeout(300);
  check(await frame.locator('.cms-block.is-focused #about').count() === 1, 'clicking a row highlights it in preview');
  await page.screenshot({ path: `${OUT}/admin-sections.png` });

  // click inside preview → opens that section's editor
  await frame.locator('#campus .section-head').click();
  await page.waitForSelector('#form-slot textarea');
  const campusId = db.aa_sections.find((s) => s.anchor === 'campus').id;
  check(page.url().endsWith(campusId), 'clicking the preview opens that section');

  // edit About with live preview
  const aboutId = db.aa_sections.find((s) => s.anchor === 'about').id;
  await page.goto(`http://localhost:8765/admin/#/home/${aboutId}`);
  await page.waitForSelector('#form-slot textarea');
  await page.waitForSelector('.pv.is-ready', { timeout: 8000 });
  const heading = page.locator('#form-slot .field-textarea textarea').first();
  await heading.fill('A Century of Learning.\n*Edited by admin.*');
  await page.waitForTimeout(500);
  check((await frame.locator('#about h2').textContent())?.includes('Edited by admin'), 'preview updates while typing (before saving)');
  check(db.aa_sections.find((s) => s.id === aboutId).data.heading.includes('Edited') === false, 'not saved until Save is pressed');
  check(await page.isEnabled('#save'), 'Save button enabled after edit');
  await page.screenshot({ path: `${OUT}/admin-edit.png` });
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(400);
  check(db.aa_sections.find((s) => s.id === aboutId).data.heading.includes('Edited by admin'), 'Ctrl+S saves to DB');
  check((await page.textContent('#save-state')).includes('Saved'), 'shows saved state');

  // An edit made while Save is in flight must stay unsaved until a second Save.
  let releaseSave;
  let signalSave;
  const saveStarted = new Promise((resolve) => { signalSave = resolve; });
  const saveGate = new Promise((resolve) => { releaseSave = resolve; });
  let delayNextSave = true;
  const delaySectionSave = async (route) => {
    if (delayNextSave && route.request().method() === 'PATCH' && route.request().url().includes(`id=eq.${aboutId}`)) {
      delayNextSave = false;
      signalSave();
      await saveGate;
      await fakeSupabase(route);
    } else {
      await route.fallback();
    }
  };
  await page.route('**/rest/v1/aa_sections?**', delaySectionSave);
  await heading.fill('First change before Save');
  await page.click('#save');
  await saveStarted;
  await heading.fill('Second change while saving');
  releaseSave();
  await page.waitForFunction((sectionId) => document.querySelector('#save-state')?.textContent?.includes('still unsaved'), aboutId);
  check(db.aa_sections.find((s) => s.id === aboutId).data.heading === 'First change before Save', 'first save writes its original snapshot');
  check(await page.isEnabled('#save') && await page.locator('body.is-dirty').count() === 1, 'newer edits stay unsaved after earlier save completes');
  await page.click('#save');
  await page.waitForFunction((sectionId) => document.querySelector('#save-state')?.textContent?.includes('Saved at'), aboutId);
  check(db.aa_sections.find((s) => s.id === aboutId).data.heading === 'Second change while saving', 'second save publishes newer edits');
  await page.unroute('**/rest/v1/aa_sections?**', delaySectionSave);
  await heading.fill('A Century of Learning.\n*Edited by admin.*');
  await page.click('#save');
  await page.waitForFunction(() => document.querySelector('#save-state')?.textContent?.includes('Saved at'));

  // undo
  await heading.fill('Something wrong');
  page.once('dialog', (d) => d.accept());
  await page.click('#discard');
  await page.waitForSelector('#form-slot textarea');
  await page.waitForTimeout(300);
  check((await page.locator('#form-slot .field-textarea textarea').first().inputValue()).includes('Edited by admin'), 'Undo changes restores saved text');

  // add a section below row 2 via ⋯ menu
  await page.goto('http://localhost:8765/admin/#/home');
  await page.waitForSelector('.sec-row');
  await page.click('.sec-row:nth-child(2) [data-act="menu"]');
  await page.click('.sec-row:nth-child(2) [data-act="add-below"]');
  await page.click('[data-type="video"]');
  await page.waitForSelector('#form-slot');
  await page.waitForTimeout(400);
  const vid = db.aa_sections.find((s) => s.type === 'video');
  check(!!vid && sorted()[2]?.id === vid.id, 'new section inserted at chosen position (3rd)');
  await page.locator('#form-slot .field-video input').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  await page.waitForTimeout(400);
  check(await frame.locator('.cms-video-section iframe').count() === 1, 'video appears in preview');
  await page.click('#save');
  await page.waitForTimeout(400);
  check(vid.visible === true && vid.data.video.includes('dQw4w9WgXcQ'), 'video section saved & visible');

  // drag and drop: move the video (row 3) to the bottom
  await page.goto('http://localhost:8765/admin/#/home');
  await page.waitForSelector('.sec-row');
  const rows = page.locator('.sec-row');
  const count = await rows.count();
  await page.evaluate(() => { window.__ev = []; ['pointerdown','dragstart','dragover','drop','dragend'].forEach((t) => document.addEventListener(t, (e) => { if (window.__ev.at(-1) !== t) window.__ev.push(t); }, true)); });
  await rows.nth(2).locator('.drag-handle').hover();
  await page.mouse.down();
  const lastBox = await rows.nth(5).boundingBox();
  await page.mouse.move(lastBox.x + 50, lastBox.y + lastBox.height - 5, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  console.log('drag events:', await page.evaluate(() => window.__ev.join(',')), 'order:', sorted().map((x) => x.type).join(','));
  check(sorted()[5]?.id === vid.id, 'drag and drop reorders sections');

  // hide via switch
  await page.locator(`.sec-row[data-id="${vid.id}"] .switch`).click();
  await page.waitForTimeout(400);
  check(vid.visible === false, 'visibility switch hides a section');
  check(await frame.locator(`.cms-block.is-hidden-section[data-cms-id="${vid.id}"]`).count() === 1, 'hidden section shown dimmed in preview');
  await page.locator(`.sec-row[data-id="${vid.id}"] .switch`).click();
  await page.waitForTimeout(400);

  // ── Conditional fields (leadership) ──
  const leaderId = db.aa_sections.find((s) => s.type === 'leadership').id;
  await page.goto(`http://localhost:8765/admin/#/home/${leaderId}`);
  await page.waitForSelector('#form-slot .list-item');
  await page.locator('#form-slot .list-toggle').first().click();
  const firstItem = page.locator('#form-slot .list-item').first();
  const headingField = firstItem.locator('.field', { has: page.locator('label', { hasText: /^Heading$/ }) });
  check(await headingField.isVisible(), 'feature layout shows Heading field');
  await firstItem.locator('select').first().selectOption('member');
  check(await headingField.isHidden(), 'committee-member layout hides Heading field');
  page.once('dialog', (d) => d.accept());
  await page.click('#discard');
  await page.waitForSelector('#form-slot .list-item');

  // ── Video link validation ──
  await page.goto(`http://localhost:8765/admin/#/home/${vid.id}`);
  const vInput = page.locator('#form-slot .field-video input');
  await vInput.fill('hello there');
  check(await page.locator('.field-video .upload-status.is-error').isVisible(), 'bad video link shows a warning');
  await vInput.fill('https://youtu.be/dQw4w9WgXcQ');
  check((await page.locator('.field-video .upload-status').textContent()).includes('YouTube video'), 'YouTube link confirmed');
  check((await page.locator('.field-video .media-preview img').getAttribute('src'))?.includes('img.youtube.com'), 'YouTube thumbnail shown');
  check(await page.locator('.field-video input[type=file], .field-video [data-pick]').count() === 0, 'video field has no upload / library option');
  await page.locator('.field-video').screenshot({ path: `${OUT}/admin-video-field.png` });
  await vInput.fill('https://vimeo.com/123456');
  check(await page.locator('.field-video .upload-status.is-error').isVisible(), 'non-YouTube link rejected');
  page.once('dialog', (d) => d.accept());
  await page.click('#discard');
  await page.waitForTimeout(300);

  // ── Draft survives a reload ──
  await page.goto(`http://localhost:8765/admin/#/home/${aboutId}`);
  await page.waitForSelector('#form-slot textarea');
  await page.locator('#form-slot .field-textarea textarea').first().fill('Draft heading *not saved*');
  await page.waitForTimeout(700);
  await page.evaluate(() => { window.onbeforeunload = null; });
  page.once('dialog', (d) => d.accept());
  await page.reload();
  await page.waitForSelector('#form-slot textarea');
  check(await page.isVisible('#draft-banner'), 'draft banner offered after reload');
  await page.click('[data-draft="restore"]');
  check((await page.locator('#form-slot .field-textarea textarea').first().inputValue()).startsWith('Draft heading'), 'draft restored into form');
  await page.click('#save');
  await page.waitForTimeout(400);
  check(db.aa_sections.find((s) => s.id === aboutId).data.heading.startsWith('Draft heading'), 'restored draft saved');
  await page.reload();
  await page.waitForSelector('#form-slot textarea');
  check(await page.isHidden('#draft-banner'), 'no draft banner after saving');

  // ── History: load the version before the last save ──
  await page.click('#history');
  await page.waitForSelector('.rev-list li');
  check(await page.locator('.rev-list li').count() >= 2, 'history lists earlier versions');
  check(await page.locator('.pv.is-ready').count() === 1, 'preview ready after reload');
  await page.screenshot({ path: `${OUT}/admin-history.png` });
  await page.locator('[data-rev="0"]').click();
  await page.waitForTimeout(300);
  check((await page.locator('#form-slot .field-textarea textarea').first().inputValue()).includes('Edited by admin'), 'older version loaded into form');
  await page.click('#save');
  await page.waitForTimeout(400);
  check(db.aa_sections.find((s) => s.id === aboutId).data.heading.includes('Edited by admin'), 'older version saved back');

  // ── Delete and restore a section ──
  await page.goto('http://localhost:8765/admin/#/home');
  await page.waitForSelector('.sec-row');
  const testiId = db.aa_sections.find((s) => s.type === 'testimonials').id;
  const testiRow = page.locator(`.sec-row[data-id="${testiId}"]`);
  await testiRow.locator('[data-act="menu"]').click();
  page.once('dialog', (d) => d.accept());
  await testiRow.locator('[data-act="del"]').click();
  await page.waitForTimeout(500);
  check(!db.aa_sections.some((s) => s.id === testiId), 'section deleted');
  await page.waitForSelector('#trash:not([hidden])');
  await page.click('#trash');
  await page.click('[data-restore="0"]');
  await page.waitForTimeout(500);
  check(db.aa_sections.some((s) => s.id === testiId), 'deleted section restored with same id');
  check(await page.locator(`.sec-row[data-id="${testiId}"]`).count() === 1, 'restored section back in the list');

  // disclosure builder
  await page.goto('http://localhost:8765/admin/#/disclosure');
  await page.waitForSelector('.sec-row');
  await page.waitForSelector('.pv.is-ready', { timeout: 8000 });
  await page.waitForTimeout(400);
  check(await frame.locator('[data-cms-id]').count() === 5, 'disclosure preview shows 5 sections');
  await page.screenshot({ path: `${OUT}/admin-disclosure.png` });

  // settings with live preview
  await page.goto('http://localhost:8765/admin/#/settings');
  await page.waitForSelector('#site-settings .field input');
  await page.waitForSelector('.pv.is-ready', { timeout: 8000 });
  await page.locator('#site-settings .field input').first().fill('Agratha Academy (test)');
  await page.waitForTimeout(500);
  check((await frame.locator('.brand strong').textContent()) === 'Agratha Academy (test)', 'settings preview updates live');
  await page.screenshot({ path: `${OUT}/admin-settings.png` });
  page.once('dialog', (d) => d.accept());

  // announcement
  await page.goto('http://localhost:8765/admin/#/announcements/new?popup=1');
  await page.waitForSelector('#form-slot input');
  await page.locator('#form-slot input[type=text]').first().fill('Sports day on 10 Oct');
  await page.locator('#form-slot textarea').first().fill('All parents are welcome.');
  page.once('dialog', (d) => d.accept());
  await page.click('#save');
  await page.waitForSelector('.row-card', { timeout: 5000 });
  check(db.aa_announcements.some((a) => a.title === 'Sports day on 10 Oct'), 'announcement created');
  await page.screenshot({ path: `${OUT}/admin-announcements.png` });


  // admins
  await page.goto('http://localhost:8765/admin/#/admins');
  await page.waitForSelector('#invite-email');
  await page.fill('#invite-email', 'Principal@School.in');
  await page.click('#invite-form button');
  await page.waitForTimeout(400);
  check(db.aa_admin_invites.some((i) => i.email === 'principal@school.in'), 'invite added (lower-cased)');

  // mobile admin
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:8765/admin/#/home');
  await page.waitForSelector('.sec-row');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/admin-mobile.png` });
  await page.goto(`http://localhost:8765/admin/#/home/${aboutId}`);
  await page.waitForSelector('#form-slot textarea');
  await page.click('[data-tab="preview"]');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/admin-mobile-preview.png` });
  await page.goto('http://localhost:8765/admin/#/home');
  await page.waitForSelector('.sec-row');
  await page.click('#menu-btn');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/admin-mobile-menu.png` });
  await page.click('.side-nav a[data-route="announcements"]');
  await page.waitForTimeout(600);

  // public page now shows the new video section
  const pub = await newPage();
  await pub.goto('http://localhost:8765/');
  await pub.waitForTimeout(800);
  check(await pub.isVisible('.cms-video-section iframe'), 'video section renders on site');
  check((await pub.textContent('#about h2'))?.includes('Edited by admin'), 'edited heading renders on site');
  await pub.click('.announce-close').catch(() => {});
  await pub.evaluate(() => document.querySelectorAll('.animate-in').forEach((e) => e.classList.add('is-visible')));
  await pub.waitForTimeout(1200);
  await pub.locator('#notices').screenshot({ path: `${OUT}/sec-notices.png` });
  await pub.locator('.cms-video-section').screenshot({ path: `${OUT}/sec-video.png` });
  await pub.locator('.site-footer').screenshot({ path: `${OUT}/sec-footer.png` });
}

// The only expected console error is the deliberate wrong-password login (HTTP 400).
const unexpected = errors.filter((e) => !e.includes('status of 400'));
console.log(`\n${failures} failed; unexpected errors:`, unexpected.length ? '\n' + unexpected.join('\n') : 'none');
await browser.close();
server.close();
process.exit(failures || unexpected.length ? 1 : 0);
