/* ═══════════════════════════════════════════
   Text helpers shared by the public site and the admin panel.
   Admin-entered text is always escaped; a tiny markup is supported:
     *italic*          → <em>italic</em>   (the gold/maroon accent in headings)
     **bold**          → <strong>bold</strong>
     [label](url)      → link
     line break        → <br>
   ═══════════════════════════════════════════ */

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow http(s), mailto, tel, relative and in-page links. */
export function safeUrl(url) {
  const u = String(url ?? '').trim();
  if (!u) return '';
  if (/^(https?:|mailto:|tel:|#|\/|\.{0,2}\/)/i.test(u)) return u;
  if (/^[\w.-]+\.(html?|pdf|jpe?g|png|webp|gif|mp4)(\?.*)?$/i.test(u)) return u;
  if (/^[\w-]+\//.test(u)) return u; // e.g. assets/docs/x.pdf
  return '';
}

function isExternal(url) {
  return /^https?:/i.test(url) && !url.includes(location.host);
}

/** Inline markup, single line or multi-line (newlines become <br>). */
export function inline(text) {
  // Links are swapped for placeholders first so that * or ** inside a URL
  // can't be turned into <em>/<strong> tags inside the href.
  const links = [];
  let out = esc(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const href = safeUrl(url.replace(/&amp;/g, '&'));
    if (!href) return label;
    const ext = isExternal(href) || /\.pdf$/i.test(href);
    links.push({ open: `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>` });
    return `\u0000${links.length - 1}\u0001${label}\u0002`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\r?\n/g, '<br>');
  out = out.replace(/\u0000(\d+)\u0001/g, (_, i) => links[Number(i)].open).replace(/\u0002/g, '</a>');
  return out;
}

/** Split text on blank lines into <p> tags. */
export function paragraphs(text, cls = '') {
  const attr = cls ? ` class="${cls}"` : '';
  return String(text ?? '')
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${attr}>${inline(p)}</p>`)
    .join('\n');
}

/**
 * Rich text: paragraphs, "- " bullet lists, "1. " numbered lists and
 * "## " sub-headings, plus the inline markup above.
 */
export function rich(text) {
  const blocks = String(text ?? '').split(/\r?\n\s*\r?\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split(/\r?\n/);
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      return `<ol>${lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>`).join('')}</ol>`;
    }
    if (/^#{2,3}\s+/.test(block) && lines.length === 1) {
      return `<h3>${inline(block.replace(/^#{2,3}\s+/, ''))}</h3>`;
    }
    return `<p>${inline(block)}</p>`;
  }).join('\n');
}

/** One entry per non-empty line. */
export function lines(text) {
  if (Array.isArray(text)) return text.filter(Boolean);
  return String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

export function initials(name) {
  return String(name ?? '')
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function slug(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Turn a YouTube / Vimeo / Google Drive link into an embeddable URL. */
export function videoEmbed(url) {
  const u = String(url ?? '').trim();
  if (!u) return null;
  let m = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (m) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}?rel=0` };
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (m) return { kind: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };
  const safe = safeUrl(u);
  if (!safe) return null;
  return { kind: 'video', src: safe };
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Short fingerprint of some content (FNV-1a), used to tell whether the
 *  prerendered HTML already matches what the database returns. */
export function contentHash(value) {
  const str = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
