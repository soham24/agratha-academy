/* ═══════════════════════════════════════════
   FORM BUILDER
   Turns a field list from assets/cms/schema.js into an editing form.
   The value object passed in is edited in place; `onChange` fires on
   every edit so the caller can track unsaved changes.
   ═══════════════════════════════════════════ */

import { esc } from '../assets/cms/format.js';
import { icon } from '../assets/cms/icons.js';

let uid = 0;
const nextId = () => `f${++uid}`;

/**
 * @param {Array} fields  schema fields
 * @param {object} value  object to edit (mutated)
 * @param {object} ctx    { onChange, media: { upload(file, kind), pick(kind) }, resolveUrl(url) }
 */
export function buildForm(fields, value, ctx) {
  const wrap = document.createElement('div');
  wrap.className = 'form-grid';
  for (const field of fields) {
    if (field.group) {
      const h = document.createElement('h3');
      h.className = 'form-group-title';
      h.textContent = field.group;
      wrap.append(h);
      continue;
    }
    wrap.append(buildField(field, value, ctx));
  }
  return wrap;
}

function buildField(field, obj, ctx) {
  const id = nextId();
  const row = document.createElement('div');
  row.className = `field field-${field.type}`;
  const help = field.help ? `<p class="field-help">${esc(field.help)}</p>` : '';
  const changed = () => ctx.onChange?.();

  switch (field.type) {
    case 'bool': {
      row.innerHTML = `
        <label class="switch" for="${id}">
          <input type="checkbox" id="${id}" ${obj[field.key] ? 'checked' : ''}>
          <span class="switch-ui" aria-hidden="true"></span>
          <span>${esc(field.label)}</span>
        </label>${help}`;
      row.querySelector('input').addEventListener('change', (e) => { obj[field.key] = e.target.checked; changed(); });
      return row;
    }

    case 'select':
    case 'icon': {
      const opts = field.options ?? [];
      const current = obj[field.key] ?? opts[0]?.value ?? '';
      if (obj[field.key] === undefined) obj[field.key] = current;
      row.innerHTML = `
        <label for="${id}">${esc(field.label)}</label>
        <div class="select-row">
          ${field.type === 'icon' ? `<span class="icon-preview">${icon(current)}</span>` : ''}
          <select id="${id}">
            ${opts.map((o) => `<option value="${esc(o.value)}" ${o.value === current ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}
          </select>
        </div>${help}`;
      row.querySelector('select').addEventListener('change', (e) => {
        obj[field.key] = e.target.value;
        const prev = row.querySelector('.icon-preview');
        if (prev) prev.innerHTML = icon(e.target.value);
        changed();
      });
      return row;
    }

    case 'number': {
      row.innerHTML = `<label for="${id}">${esc(field.label)}</label><input type="number" id="${id}" value="${esc(obj[field.key] ?? '')}">${help}`;
      row.querySelector('input').addEventListener('input', (e) => {
        obj[field.key] = e.target.value === '' ? '' : Number(e.target.value);
        changed();
      });
      return row;
    }

    case 'datetime': {
      row.innerHTML = `
        <label for="${id}">${esc(field.label)}</label>
        <div class="select-row">
          <input type="datetime-local" id="${id}" value="${esc(toLocalInput(obj[field.key]))}">
          <button type="button" class="btn-link" data-clear>Clear</button>
        </div>${help}`;
      const input = row.querySelector('input');
      input.addEventListener('change', () => { obj[field.key] = input.value ? new Date(input.value).toISOString() : null; changed(); });
      row.querySelector('[data-clear]').addEventListener('click', () => { input.value = ''; obj[field.key] = null; changed(); });
      return row;
    }

    case 'lines': {
      const text = Array.isArray(obj[field.key]) ? obj[field.key].join('\n') : (obj[field.key] ?? '');
      row.innerHTML = `<label for="${id}">${esc(field.label)}</label><textarea id="${id}" rows="${field.rows ?? 4}">${esc(text)}</textarea>${help}`;
      row.querySelector('textarea').addEventListener('input', (e) => {
        obj[field.key] = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
        changed();
      });
      return row;
    }

    case 'textarea':
    case 'rich': {
      row.innerHTML = `<label for="${id}">${esc(field.label)}</label><textarea id="${id}" rows="${field.rows ?? 4}">${esc(obj[field.key] ?? '')}</textarea>${help}`;
      row.querySelector('textarea').addEventListener('input', (e) => { obj[field.key] = e.target.value; changed(); });
      return row;
    }

    case 'image':
    case 'file':
    case 'video':
      return mediaField(field, obj, ctx, row, id, help);

    case 'list':
      return listField(field, obj, ctx, row);

    default: { // text, url
      row.innerHTML = `<label for="${id}">${esc(field.label)}</label><input type="${field.type === 'url' ? 'text' : 'text'}" id="${id}" value="${esc(obj[field.key] ?? '')}"${field.type === 'url' ? ' inputmode="url" spellcheck="false"' : ''}>${help}`;
      row.querySelector('input').addEventListener('input', (e) => { obj[field.key] = e.target.value; changed(); });
      return row;
    }
  }
}

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Image / file / video ─────────────────────────────────────────
const ACCEPT = { image: 'image/*', file: 'application/pdf,image/*', video: 'video/*' };

function mediaField(field, obj, ctx, row, id, help) {
  const kind = field.type;
  row.innerHTML = `
    <label for="${id}">${esc(field.label)}</label>
    <div class="media-input">
      <div class="media-preview"></div>
      <div class="media-controls">
        <input type="text" id="${id}" value="${esc(obj[field.key] ?? '')}" placeholder="${kind === 'video' ? 'Paste a YouTube link or upload a video' : 'Upload, choose from library, or paste a link'}" spellcheck="false">
        <div class="media-buttons">
          <label class="btn btn-small">
            ${icon('download', { size: 15, stroke: 2, attrs: 'style="transform:rotate(180deg)"' })} Upload
            <input type="file" accept="${ACCEPT[kind]}" hidden>
          </label>
          <button type="button" class="btn btn-small btn-light" data-pick>Library</button>
          <button type="button" class="btn-link" data-clear>Remove</button>
        </div>
        <div class="upload-status" role="status"></div>
      </div>
    </div>${help}`;

  const input = row.querySelector(`#${id}`);
  const preview = row.querySelector('.media-preview');
  const status = row.querySelector('.upload-status');

  const set = (url) => {
    obj[field.key] = url;
    input.value = url;
    renderPreview();
    ctx.onChange?.();
  };

  function renderPreview() {
    const url = input.value.trim();
    const resolved = ctx.resolveUrl ? ctx.resolveUrl(url) : url;
    if (!url) { preview.innerHTML = `<span class="media-empty">${icon(kind === 'video' ? 'play' : kind === 'file' ? 'document' : 'star', { size: 22 })}</span>`; return; }
    if (kind === 'image' || /\.(jpe?g|png|webp|gif|avif|svg)(\?|$)/i.test(url)) {
      preview.innerHTML = `<img src="${esc(resolved)}" alt="">`;
    } else if (kind === 'video') {
      preview.innerHTML = `<span class="media-empty">${icon('play', { size: 22 })}</span>`;
    } else {
      preview.innerHTML = `<a href="${esc(resolved)}" target="_blank" rel="noopener" class="media-empty" title="Open file">${icon('document', { size: 22 })}</a>`;
    }
  }
  renderPreview();

  input.addEventListener('input', () => { obj[field.key] = input.value.trim(); renderPreview(); ctx.onChange?.(); });
  row.querySelector('[data-clear]').addEventListener('click', () => set(''));
  row.querySelector('[data-pick]').addEventListener('click', async () => {
    const url = await ctx.media.pick(kind);
    if (url) set(url);
  });
  row.querySelector('input[type=file]').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    status.textContent = 'Uploading…';
    status.className = 'upload-status is-busy';
    try {
      const url = await ctx.media.upload(file, (msg) => { status.textContent = msg; });
      set(url);
      status.textContent = 'Uploaded ✓';
      status.className = 'upload-status is-ok';
    } catch (err) {
      status.textContent = err.message || 'Upload failed';
      status.className = 'upload-status is-error';
    }
  });
  return row;
}

// ── Repeating lists ──────────────────────────────────────────────
function listField(field, obj, ctx, row) {
  if (!Array.isArray(obj[field.key])) obj[field.key] = [];
  const items = obj[field.key];
  const openSet = new WeakSet();

  row.innerHTML = `
    <div class="list-head">
      <span class="list-title">${esc(field.label)}</span>
      <span class="list-count"></span>
    </div>
    ${field.help ? `<p class="field-help">${esc(field.help)}</p>` : ''}
    <div class="list-items"></div>
    <button type="button" class="btn btn-small btn-light list-add">+ Add ${esc(singular(field.label))}</button>`;

  const box = row.querySelector('.list-items');
  const count = row.querySelector('.list-count');

  const titleOf = (item, i) => {
    const t = item?.[field.itemLabel] ?? '';
    const text = String(t).replace(/[*\n]/g, ' ').trim();
    return text || `${singular(field.label)} ${i + 1}`;
  };

  function render() {
    count.textContent = items.length ? `${items.length}` : '';
    box.innerHTML = '';
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'list-item';
      if (openSet.has(item)) card.classList.add('is-open');
      card.innerHTML = `
        <div class="list-item-head">
          <button type="button" class="list-toggle" aria-expanded="${openSet.has(item)}">
            <span class="chev" aria-hidden="true">▸</span>
            <span class="list-item-title">${esc(titleOf(item, i))}</span>
          </button>
          <div class="list-item-actions">
            <button type="button" class="icon-btn" data-act="up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="icon-btn" data-act="down" title="Move down" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="icon-btn" data-act="copy" title="Duplicate">⧉</button>
            <button type="button" class="icon-btn danger" data-act="remove" title="Remove">✕</button>
          </div>
        </div>
        <div class="list-item-body"></div>`;
      const body = card.querySelector('.list-item-body');
      if (openSet.has(item)) body.append(buildForm(field.fields, item, {
        ...ctx,
        onChange: () => {
          card.querySelector('.list-item-title').textContent = titleOf(item, i);
          ctx.onChange?.();
        },
      }));

      card.querySelector('.list-toggle').addEventListener('click', () => {
        if (openSet.has(item)) openSet.delete(item); else openSet.add(item);
        render();
      });
      card.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
        if (act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
        if (act === 'copy') {
          const clone = structuredClone(item);
          items.splice(i + 1, 0, clone);
          openSet.add(clone);
        }
        if (act === 'remove') {
          if (!confirm(`Remove “${titleOf(item, i)}”?`)) return;
          items.splice(i, 1);
        }
        ctx.onChange?.();
        render();
      }));
      box.append(card);
    });
  }

  row.querySelector('.list-add').addEventListener('click', () => {
    const blank = {};
    for (const f of field.fields) {
      if (f.type === 'list' || f.type === 'lines') blank[f.key] = [];
      else if (f.type === 'bool') blank[f.key] = false;
      else if (f.type === 'select' || f.type === 'icon') blank[f.key] = f.options?.[0]?.value ?? '';
      else blank[f.key] = '';
    }
    items.push(blank);
    openSet.add(blank);
    ctx.onChange?.();
    render();
    box.lastElementChild?.querySelector('input, textarea, select')?.focus();
  });

  render();
  return row;
}

function singular(label) {
  const l = String(label).toLowerCase().replace(/\s*\(.*\)$/, '');
  if (l.endsWith('ies')) return l.slice(0, -3) + 'y';
  if (/(ss|sh|ch|x)es$/.test(l)) return l.slice(0, -2);
  if (l.endsWith('s') && !l.endsWith('ss')) return l.slice(0, -1);
  return 'item';
}
