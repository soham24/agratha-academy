#!/usr/bin/env node
// Copies the current content from the admin panel's database into the
// static HTML of index.html and mandatory-public-disclosure.html.
//
// The pages still load live content with JavaScript; this keeps the HTML
// underneath up to date for search engines, link previews, visitors
// without JavaScript, and as the fallback if the database is unreachable.
//
// Run by .github/workflows/refresh-static.yml. Locally:
//   node scripts/prerender.mjs                 (fetch from the database)
//   node scripts/prerender.mjs --data file.json (use a saved {home, disclosure} payload)
//
// It never writes a page when the database returns nothing, so a
// database outage can't wipe the site.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The renderers were written for the browser; they only need location.host.
globalThis.location = { host: 'theagrathaacademy.in', origin: 'https://theagrathaacademy.in', search: '' };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { loadPage } = await import('../assets/cms/api.js');
const { renderSections, renderNav, renderFooter } = await import('../assets/cms/render-home.js');
const {
  renderDisclosureSections, renderDisclosureNav, renderDisclosureHeader, renderDisclaimer,
} = await import('../assets/cms/render-disclosure.js');
const { esc, inline, contentHash } = await import('../assets/cms/format.js');
const { DEFAULT_SITE, DEFAULT_DISCLOSURE } = await import('../assets/cms/defaults.js');

function replaceBetween(html, name, content) {
  const re = new RegExp(`(<!-- cms:${name} -->)[\\s\\S]*?(<!-- /cms:${name} -->)`);
  if (!re.test(html)) throw new Error(`Marker <!-- cms:${name} --> not found`);
  return html.replace(re, (_, open, close) => `${open}${content}${close}`);
}

/** Records which content the HTML was built from, so the page script can
 *  skip re-rendering when the database still has the same content. */
function setHash(html, payload) {
  const tag = `<meta name="cms-content-hash" content="${contentHash(payload)}">`;
  return /<meta name="cms-content-hash"[^>]*>/.test(html)
    ? html.replace(/<meta name="cms-content-hash"[^>]*>/, tag)
    : html.replace('</head>', `  ${tag}\n  </head>`);
}

function setMeta(html, s) {
  let out = html;
  if (s.seo_title) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(s.seo_title)}</title>`);
  if (s.seo_description) {
    out = out.replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => `${a}${esc(s.seo_description)}${b}`);
  }
  return out;
}

async function getPayloads() {
  const i = process.argv.indexOf('--data');
  if (i > 0) return JSON.parse(fs.readFileSync(process.argv[i + 1], 'utf8'));
  const [home, disclosure] = await Promise.all([
    loadPage('home', { announcements: true, timeoutMs: 20000 }),
    loadPage('disclosure', { timeoutMs: 20000 }),
  ]);
  return { home, disclosure };
}

function writeIfChanged(file, html) {
  const full = path.join(root, file);
  const before = fs.readFileSync(full, 'utf8');
  if (before === html) {
    console.log(`${file}: up to date`);
    return false;
  }
  fs.writeFileSync(full, html);
  console.log(`${file}: updated`);
  return true;
}

const { home, disclosure } = await getPayloads();
let changed = false;

if (home?.sections?.length) {
  const s = { ...DEFAULT_SITE, ...(home.settings?.site ?? {}) };
  const main = renderSections(home.sections, { announcements: home.announcements ?? [] });
  if (!main.trim()) throw new Error('Home page rendered empty; refusing to write it');
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  html = replaceBetween(html, 'main', `\n${main}\n    `);
  html = replaceBetween(html, 'nav', `\n${renderNav(s)}\n      `);
  html = replaceBetween(html, 'footer', renderFooter(s));
  html = replaceBetween(html, 'brand', `<span>\n          <strong>${esc(s.school_name)}</strong>\n          <small>${esc(s.school_tagline ?? '')}</small>\n        </span>`);
  html = setMeta(html, s);
  html = setHash(html, home);
  changed = writeIfChanged('index.html', html) || changed;
} else {
  console.warn('Home page: no content from the database, leaving index.html unchanged');
}

if (disclosure?.sections?.length) {
  const s = { ...DEFAULT_DISCLOSURE, ...(disclosure.settings?.disclosure ?? {}) };
  let html = fs.readFileSync(path.join(root, 'mandatory-public-disclosure.html'), 'utf8');
  html = replaceBetween(html, 'content', `${renderDisclosureSections(disclosure.sections)}\n      `);
  html = replaceBetween(html, 'sidenav', renderDisclosureNav(disclosure.sections));
  html = replaceBetween(html, 'header', renderDisclosureHeader(s));
  html = replaceBetween(html, 'disclaimer', renderDisclaimer(s));
  html = replaceBetween(html, 'footer', inline(s.footer));
  html = replaceBetween(html, 'brandline', esc(s.brand_line));
  html = setHash(html, disclosure);
  changed = writeIfChanged('mandatory-public-disclosure.html', html) || changed;
} else {
  console.warn('Disclosure page: no content from the database, leaving it unchanged');
}

// Tell search engines when the pages last changed.
if (changed) {
  const today = new Date().toISOString().slice(0, 10);
  const sitemapPath = path.join(root, 'sitemap.xml');
  const sitemap = fs.readFileSync(sitemapPath, 'utf8').replace(/<lastmod>[^<]*<\/lastmod>/g, `<lastmod>${today}</lastmod>`);
  fs.writeFileSync(sitemapPath, sitemap);
}
