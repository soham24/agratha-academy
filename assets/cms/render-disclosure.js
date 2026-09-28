/* ═══════════════════════════════════════════
   MANDATORY PUBLIC DISCLOSURE — renderers
   Same markup as the hand-written disclosure page.
   ═══════════════════════════════════════════ */

import { esc, inline, rich, safeUrl } from './format.js';
import { ICONS } from './icons.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const svg = (name) => `<svg viewBox="0 0 24 24">${(ICONS[name] ?? ICONS.document).d}</svg>`;
const DOWNLOAD = '<svg viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>';

function frame(section, letter, body) {
  const d = section.data ?? {};
  return `
    <div class="disclosure-section"${section.anchor ? ` id="${esc(section.anchor)}"` : ''}>
      <div class="ds-header">
        <div class="ds-letter">${letter}</div>
        <div>
          <h2>${esc(d.title)}</h2>
          ${d.subtitle ? `<p>${esc(d.subtitle)}</p>` : ''}
        </div>
      </div>
      <div class="ds-body">${body}</div>
    </div>`;
}

function infoTable(rows, extraStyle = '') {
  if (!rows?.length) return '';
  return `
    <table class="info-table"${extraStyle ? ` style="${extraStyle}"` : ''}>
      <tbody>
        ${rows.map((r) => `<tr${r.highlight ? ' class="highlight"' : ''}><td>${esc(r.label)}</td><td>${inline(r.value)}</td></tr>`).join('')}
      </tbody>
    </table>`;
}

function miniStats(stats) {
  if (!stats?.length) return '';
  return `<div class="mini-stats">${stats.map((s) => `<div class="mini-stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join('')}</div>`;
}

function subhead(text) {
  return text ? `<div class="disc-subhead"><strong>${esc(text)}</strong></div>` : '';
}

const R = {
  disc_info: (d) => infoTable(d.rows),

  disc_documents: (d) => (d.items ?? []).map((doc) => {
    const files = (doc.files ?? []).filter((f) => f.url).map((f) =>
      `<a class="doc-btn" href="${esc(safeUrl(f.url))}" target="_blank" rel="noopener">${DOWNLOAD}${esc(f.label || 'View PDF')}</a>`);
    return `
      <div class="doc-row">
        <div class="doc-icon-wrap">${svg(doc.icon)}</div>
        <div class="doc-row-info"><strong>${esc(doc.title)}</strong>${doc.text ? `<span>${esc(doc.text)}</span>` : ''}</div>
        ${files.length > 1 ? `<div class="doc-btns">${files.join('')}</div>` : files.join('')}
      </div>`;
  }).join(''),

  disc_results: (d) => `
    ${miniStats(d.stats)}
    ${d.rows?.length ? `
    <table class="result-table">
      <thead><tr><th>Class</th><th>Stream</th><th>Students Registered</th><th>Students Passed</th><th>Pass Rate</th><th>Academic Year</th></tr></thead>
      <tbody>
        ${d.rows.map((r) => `
        <tr${r.highlight ? ' class="highlight-row"' : ''}>
          <td><strong>${esc(r.class)}</strong></td><td>${esc(r.stream)}</td><td>${esc(r.registered)}</td>
          <td>${esc(r.passed)}</td><td${r.highlight ? ' class="pass-rate"' : ''}>${esc(r.rate)}</td><td>${esc(r.year)}</td>
        </tr>`).join('')}
      </tbody>
    </table>` : ''}
    ${d.note ? `<div class="disc-note"><p>${inline(d.note)}</p></div>` : ''}`,

  disc_staff: (d) => {
    const pill = (role) => {
      const r = String(role ?? '').toLowerCase();
      const cls = r === 'pgt' ? 'rp-pgt' : r === 'tgt' ? 'rp-tgt' : r === 'prt' ? 'rp-prt' : 'rp-oth';
      return role ? `<span class="role-pill ${cls}">${esc(role)}</span>` : '';
    };
    return `
      ${miniStats(d.stats)}
      ${d.principals?.length ? `
        ${subhead(d.principal_label)}
        <table class="faculty-table">
          <thead><tr><th>Name</th><th>Designation</th><th>Qualification</th></tr></thead>
          <tbody>${d.principals.map((p) => `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.designation)}</td><td>${esc(p.qualification)}</td></tr>`).join('')}</tbody>
        </table>` : ''}
      ${d.staff?.length ? `
        ${subhead(d.staff_label)}
        <table class="faculty-table">
          <thead><tr><th>#</th><th>Name</th><th>Qualification</th><th>Role</th></tr></thead>
          <tbody>${d.staff.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.name)}</td><td>${esc(s.qualification)}</td><td>${pill(s.role)}</td></tr>`).join('')}</tbody>
        </table>` : ''}`;
  },

  disc_infra: (d) => `
    ${d.items?.length ? `
    <div class="infra-grid">
      ${d.items.map((it) => `
      <div class="infra-item">
        <strong>${esc(it.title)}</strong>
        <span>${it.check ? `<span class="check">${esc(it.check)}</span>${it.value ? ' — ' : ''}` : ''}${esc(it.value)}</span>
      </div>`).join('')}
    </div>` : ''}
    ${infoTable(d.rows, 'border-top:1px solid var(--line);')}`,

  disc_text: (d) => `<div class="disc-rich">${rich(d.body)}</div>`,
};

export function renderDisclosureSections(sections) {
  let n = 0;
  return sections.map((s) => {
    const fn = R[s.type];
    if (!fn) return '';
    return frame(s, LETTERS[n++ % 26], fn(s.data ?? {}));
  }).join('');
}

export function renderDisclosureNav(sections) {
  let n = 0;
  return `<div class="sidebar-nav-title">Jump to Section</div>` + sections
    .filter((s) => R[s.type])
    .map((s) => {
      const letter = LETTERS[n++ % 26];
      const label = s.label || s.data?.title || '';
      return s.anchor ? `<a href="#${esc(s.anchor)}"><span class="sec-label">${letter}</span> ${esc(label)}</a>` : '';
    }).join('');
}
