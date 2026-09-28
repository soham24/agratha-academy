/* ═══════════════════════════════════════════
   HOME PAGE RENDERERS
   Each function takes a section's `data` and returns HTML that uses
   the same markup/classes as the original hand-written page.
   ═══════════════════════════════════════════ */

import { esc, inline, paragraphs, rich, lines, initials, safeUrl, videoEmbed, formatDate } from './format.js';
import { icon } from './icons.js';

const idAttr = (anchor) => (anchor ? ` id="${esc(anchor)}"` : '');
const src = (url) => esc(safeUrl(url));

function linkAttrs(href, newTab) {
  const h = safeUrl(href) || '#';
  const blank = newTab || (/^https?:/i.test(h) && !h.includes(location.host)) || /\.pdf$/i.test(h);
  return `href="${esc(h)}"${blank ? ' target="_blank" rel="noopener"' : ''}`;
}

function kicker(text, light = false) {
  return text ? `<p class="kicker${light ? ' kicker-light' : ''}">${inline(text)}</p>` : '';
}

function sectionHead(d, light = false) {
  if (!d.kicker && !d.heading && !d.intro) return '';
  return `
    <div class="section-head animate-in">
      <div>
        ${kicker(d.kicker, light)}
        ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
      </div>
      ${d.intro ? `<p>${inline(d.intro)}</p>` : ''}
    </div>`;
}

// ── Individual section types ─────────────────────────────────────

function hero(d, anchor) {
  const bg = d.background
    ? ` style="background-image: linear-gradient(105deg, rgba(100,20,20,0.93) 0%, rgba(100,20,20,0.72) 45%, rgba(40,10,10,0.35) 100%), url('${src(d.background)}')"`
    : '';
  const buttons = (d.buttons ?? []).map((b) => {
    const isTel = /^tel:/i.test(b.href ?? '');
    const ico = isTel ? icon('phone', { size: 16, stroke: 2.5 }) : '';
    const arrow = !isTel && (b.href ?? '').startsWith('#') ? icon('arrowDown', { size: 16, stroke: 2.5 }) : '';
    return `<a class="btn btn-${b.style === 'ghost' ? 'ghost' : 'saffron'}" ${linkAttrs(b.href)}>${ico}${esc(b.label)}${arrow}</a>`;
  }).join('\n');
  const badges = (d.badges ?? []).map((b) => `
    <div class="hero-badge"><strong>${esc(b.value)}</strong><span>${esc(b.label)}</span></div>`)
    .join('<div class="hero-badge-sep" aria-hidden="true"></div>');
  const next = anchor === 'top' ? '#about' : '#main';
  return `
    <section${idAttr(anchor)} class="hero" aria-label="${esc(d.heading?.replace(/[*\n]/g, ' '))}">
      <div class="hero-bg" aria-hidden="true"${bg}></div>
      <div class="hero-content">
        ${d.tagline ? `<p class="hero-tagline"><span aria-hidden="true">✦</span>${esc(d.tagline)}<span aria-hidden="true">✦</span></p>` : ''}
        <h1>${inline(d.heading)}</h1>
        ${d.subtitle ? `<p class="hero-sub">${inline(d.subtitle)}</p>` : ''}
        ${buttons ? `<div class="hero-actions">${buttons}</div>` : ''}
        ${badges ? `<div class="hero-badges" aria-label="Key highlights">${badges}</div>` : ''}
      </div>
      <a class="scroll-cue" href="${next}" aria-label="Scroll down"><span></span></a>
    </section>`;
}

function stats(d, anchor) {
  const items = (d.items ?? []).map((s) => {
    const n = Number(s.number);
    const counter = Number.isFinite(n) ? ` data-counter data-target="${n}" data-suffix="${esc(s.suffix ?? '')}"` : '';
    return `<div class="stat"${counter}><strong>${esc(s.number)}${esc(s.suffix ?? '')}</strong><span>${esc(s.label)}</span></div>`;
  }).join('\n');
  return `
    <div${idAttr(anchor)} class="stats-band" aria-label="School at a glance">
      <div class="stats-grid">${items}</div>
    </div>`;
}

function about(d, anchor) {
  const values = lines(d.values).map((v) => `<span>${esc(v)}</span>`).join('');
  const badge = d.badge_small || d.badge_big || d.badge_sub
    ? `<div class="about-badge">
        ${d.badge_small ? `<span>${esc(d.badge_small)}</span>` : ''}
        ${d.badge_big ? `<strong>${esc(d.badge_big)}</strong>` : ''}
        ${d.badge_sub ? `<em>${esc(d.badge_sub)}</em>` : ''}
      </div>` : '';
  return `
    <section${idAttr(anchor)} class="section about-section">
      <div class="about-grid${d.image ? '' : ' no-image'}">
        <div class="about-text animate-in">
          ${kicker(d.kicker)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.lead ? `<p class="about-lead">${inline(d.lead)}</p>` : ''}
          ${paragraphs(d.body)}
          ${values ? `<div class="value-strip" aria-label="Core values">${values}</div>` : ''}
        </div>
        ${d.image ? `
        <div class="about-image animate-in delay-1">
          <img src="${src(d.image)}" alt="${esc(d.image_alt)}">
          ${badge}
        </div>` : ''}
      </div>
    </section>`;
}

function vision(d, anchor) {
  const cards = (d.cards ?? []).map((c) => `
    <article class="mission-card">
      <div class="m-icon">${icon(c.icon)}</div>
      <h3>${esc(c.title)}</h3>
      <p>${inline(c.text)}</p>
    </article>`).join('');
  return `
    <section${idAttr(anchor)} class="vision-band">
      <div class="vision-inner">
        <div class="vision-head animate-in">
          ${kicker(d.kicker, true)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.description ? `<p class="vision-desc">${inline(d.description)}</p>` : ''}
        </div>
        ${cards ? `<div class="mission-grid animate-in delay-1">${cards}</div>` : ''}
      </div>
    </section>`;
}

function leaderPhoto(b, extraCap = '') {
  const pos = b.photo_position ? ` style="object-position: ${esc(b.photo_position)};"` : '';
  return `<img src="${src(b.photo)}" alt="${esc(b.name)}${b.role ? ', ' + esc(b.role) : ''}"${pos}>${extraCap}`;
}

function leadership(d, anchor) {
  const blocks = d.blocks ?? [];
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const divider = out.length ? ' leadership-divider' : '';
    if (b.layout === 'member') {
      const group = [];
      while (i < blocks.length && blocks[i].layout === 'member') group.push(blocks[i++]);
      i--;
      out.push(`
        <div class="committee-row${divider}">
          ${group.map((m, k) => `
          <div class="committee-card animate-in${k % 2 ? ' delay-1' : ''}">
            <div class="principal-photo">
              ${leaderPhoto(m)}
              <div class="principal-photo-cap committee-photo-cap">
                <strong>${esc(m.name)}</strong>
                <span>${esc(m.role)}</span>
                ${m.quote ? `<p class="committee-cap-quote">${inline(m.quote)}</p>` : ''}
              </div>
            </div>
          </div>`).join('')}
        </div>`);
    } else if (b.layout === 'compact') {
      out.push(`
        <div class="sub-leaders animate-in${divider}">
          <div class="sub-leader-card">
            ${b.photo ? `<div class="sub-leader-photo">${leaderPhoto(b)}</div>` : ''}
            <div class="sub-leader-info">
              ${kicker(b.kicker)}
              ${b.heading ? `<h3>${inline(b.heading)}</h3>` : ''}
              ${b.quote ? `<p>${inline(b.quote)}</p>` : ''}
              ${paragraphs(b.body)}
              <div class="sub-leader-name"><strong>${esc(b.name)}</strong><span>${esc(b.role)}</span></div>
            </div>
          </div>
        </div>`);
    } else {
      const reverse = b.layout === 'feature-reverse' ? ' principal-grid-reverse' : '';
      out.push(`
        <div class="principal-grid${reverse}${divider}">
          <div class="principal-photo animate-in">
            ${leaderPhoto(b)}
            <div class="principal-photo-cap"><strong>${esc(b.name)}</strong><span>${esc(b.role)}</span></div>
          </div>
          <div class="principal-copy animate-in delay-1">
            ${kicker(b.kicker)}
            ${b.heading ? `<h2>${inline(b.heading)}</h2>` : ''}
            ${b.quote ? `<blockquote class="pull-quote"><p>${inline(b.quote)}</p></blockquote>` : ''}
            ${paragraphs(b.body)}
          </div>
        </div>`);
    }
  }
  return `<section${idAttr(anchor)} class="section principal-section">${out.join('')}</section>`;
}

function academics(d, anchor) {
  const schedules = (d.schedules ?? []).map((s) => `
    <article class="schedule-card ${s.color === 'maroon' ? 'maroon' : 'saffron'}-top">
      ${s.badge ? `<div class="schedule-badge">${esc(s.badge)}</div>` : ''}
      <h3>${esc(s.title)}</h3>
      ${s.days ? `<p class="schedule-days">${esc(s.days)}</p>` : ''}
      ${s.time ? `<div class="schedule-time">${esc(s.time)}</div>` : ''}
      ${s.note ? `<p class="schedule-note">${inline(s.note)}</p>` : ''}
    </article>`).join('');
  const results = (d.results ?? []).map((r) => `
    <div class="result-item"><strong>${esc(r.value)}</strong><span>${esc(r.label)}</span>${r.note ? `<em>${esc(r.note)}</em>` : ''}</div>`).join('');
  return `
    <section${idAttr(anchor)} class="academics-band">
      <div class="academics-inner">
        ${sectionHead(d, true)}
        ${schedules ? `<div class="schedule-grid animate-in delay-1">${schedules}</div>` : ''}
        ${results ? `
        <div class="results-block animate-in delay-2">
          ${d.results_label ? `<p class="results-label">${esc(d.results_label)}</p>` : ''}
          <div class="results-row">${results}</div>
        </div>` : ''}
      </div>
    </section>`;
}

function admissions(d, anchor) {
  const ages = (d.ages ?? []).map((a) => `<div class="age-row"><span>${esc(a.class)}</span><span>${esc(a.age)}</span></div>`).join('');
  const steps = (d.steps ?? []).map((s, i) => `
    <li class="adm-tl-item">
      <div class="adm-tl-num">${i + 1}</div>
      <div class="adm-tl-body"><strong>${esc(s.title)}</strong><p>${inline(s.text)}</p></div>
    </li>`).join('');
  const cards = (d.cards ?? []).map((c) => `
    <article class="admission-card">
      <div class="adm-icon">${icon(c.icon)}</div>
      <div><strong>${esc(c.title)}</strong><span>${inline(c.text)}</span></div>
    </article>`).join('');
  const tel = (d.phone ?? '').replace(/[^\d+]/g, '');
  return `
    <section${idAttr(anchor)} class="admissions-section">
      <div class="adm-wrapper">
        <div class="adm-section-head animate-in">
          ${kicker(d.kicker)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.lead ? `<p class="adm-lead">${inline(d.lead)}</p>` : ''}
        </div>
        <div class="admissions-grid">
          <div class="admissions-copy animate-in">
            ${ages ? `
            <div class="adm-block">
              ${d.age_label ? `<p class="adm-block-label">${esc(d.age_label)}</p>` : ''}
              <div class="age-table">
                <div class="age-row age-row-head"><span>Class</span><span>Minimum Age</span></div>
                ${ages}
              </div>
              ${d.age_note ? `<p class="adm-note">${inline(d.age_note)}</p>` : ''}
            </div>` : ''}
            ${steps ? `
            <div class="adm-block">
              ${d.process_label ? `<p class="adm-block-label">${esc(d.process_label)}</p>` : ''}
              <ol class="adm-timeline">${steps}</ol>
            </div>` : ''}
            ${d.cta_label ? `<a class="btn btn-maroon" ${linkAttrs(d.cta_href)}>${esc(d.cta_label)}</a>` : ''}
          </div>
          <div class="admission-cards animate-in delay-1">
            ${d.badge ? `<div class="adm-cards-badge"><span class="adm-badge-dot"></span>${esc(d.badge)}</div>` : ''}
            ${cards}
            ${d.hours || d.phone ? `
            <div class="adm-contact-strip">
              ${icon('phone', { size: 16, stroke: 1.8 })}
              ${d.hours ? `<span>${esc(d.hours)}</span>` : ''}
              ${d.phone ? `<a href="tel:${esc(tel)}">${esc(d.phone)}</a>` : ''}
            </div>` : ''}
          </div>
        </div>
      </div>
    </section>`;
}

function stars(n) {
  const count = Math.max(0, Math.min(5, Number(n) || 0));
  return count ? `<div class="tcard-stars" aria-label="${count} stars">${'★'.repeat(count)}</div>` : '';
}

function testimonials(d, anchor) {
  const cards = (d.items ?? []).map((t) => `
    <article class="testimonial-card">
      ${stars(t.stars)}
      <p>${inline(t.quote)}</p>
      <div class="tcard-author">
        <div class="tcard-avatar">${esc(initials(t.name))}</div>
        <div><strong>${esc(t.name)}</strong><span>${esc(t.role)}</span></div>
      </div>
    </article>`).join('');
  return `
    <section${idAttr(anchor)} class="testimonials-section">
      <div class="tst-wrapper">
        <div class="tst-header animate-in">
          ${kicker(d.kicker, true)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.subhead ? `<p class="tst-subhead">${inline(d.subhead)}</p>` : ''}
        </div>
        ${d.featured_quote ? `
        <blockquote class="tst-featured animate-in">
          <p>${inline(d.featured_quote)}</p>
          <footer class="tcard-author">
            <div class="tcard-avatar">${esc(initials(d.featured_name))}</div>
            <div><strong>${esc(d.featured_name)}</strong><span>${esc(d.featured_role)}</span></div>
          </footer>
        </blockquote>` : ''}
        ${cards ? `<div class="testimonials-grid animate-in delay-1">${cards}</div>` : ''}
      </div>
    </section>`;
}

function activities(d, anchor) {
  const items = (d.items ?? []).map((a) => `
    <article class="activity-card">
      <figure>
        <img src="${src(a.image)}" loading="lazy" alt="${esc(a.alt || a.title)}">
        <div class="activity-overlay">
          <h3>${esc(a.title)}</h3>
          ${a.text ? `<p>${inline(a.text)}</p>` : ''}
        </div>
      </figure>
    </article>`).join('');
  return `
    <section${idAttr(anchor)} class="activities-band">
      <div class="activities-inner">
        ${sectionHead(d, true)}
        <div class="activities-grid animate-in delay-1">${items}</div>
      </div>
    </section>`;
}

function campus(d, anchor) {
  const photos = (d.photos ?? []).map((p) => `<img src="${src(p.image)}" loading="lazy" alt="${esc(p.alt)}">`).join('');
  const facts = (d.facts ?? []).map((f) => `
    <article class="fact-card">
      <div class="fact-icon" aria-hidden="true">${icon(f.icon)}</div>
      <strong>${esc(f.title)}</strong>
      <span>${inline(f.text)}</span>
    </article>`).join('');
  return `
    <section${idAttr(anchor)} class="section campus-section">
      ${sectionHead(d)}
      <div class="campus-layout animate-in delay-1">
        ${photos ? `<div class="campus-photos">${photos}</div>` : ''}
        <div class="campus-facts">${facts}</div>
      </div>
    </section>`;
}

function gallery(d, anchor) {
  const items = (d.images ?? []).map((g) => `
    <figure class="g-item${g.size === 'wide' || g.size === 'tall' ? ' ' + g.size : ''}" data-lightbox>
      <img src="${src(g.image)}" loading="lazy" alt="${esc(g.caption)}">
      ${g.caption ? `<figcaption>${esc(g.caption)}</figcaption>` : ''}
    </figure>`).join('');
  return `
    <section${idAttr(anchor)} class="gallery-band">
      <div class="gallery-inner">
        ${sectionHead(d)}
        <div class="gallery-grid animate-in delay-1">${items}</div>
      </div>
    </section>`;
}

function video(d, anchor) {
  const v = videoEmbed(d.video);
  let player = '<div class="cms-video-empty">No video added yet.</div>';
  if (v?.kind === 'iframe') {
    player = `<iframe src="${esc(v.src)}" title="${esc((d.heading ?? 'Video').replace(/[*\n]/g, ' '))}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
  } else if (v?.kind === 'video') {
    player = `<video controls preload="metadata" playsinline${d.poster ? ` poster="${src(d.poster)}"` : ''}><source src="${esc(v.src)}"></video>`;
  }
  const dark = d.theme !== 'light';
  return `
    <section${idAttr(anchor)} class="cms-video-section${dark ? ' is-dark' : ''}">
      <div class="cms-inner">
        <div class="cms-video-head animate-in">
          ${kicker(d.kicker, dark)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.text ? `<div class="cms-video-text">${paragraphs(d.text)}</div>` : ''}
        </div>
        <div class="cms-video-frame animate-in delay-1">${player}</div>
      </div>
    </section>`;
}

function text(d, anchor) {
  const theme = ['cream', 'dark'].includes(d.theme) ? d.theme : 'light';
  const img = d.image ? `<div class="cms-text-image animate-in delay-1"><img src="${src(d.image)}" loading="lazy" alt=""></div>` : '';
  return `
    <section${idAttr(anchor)} class="cms-text-section theme-${theme}">
      <div class="cms-inner cms-text-grid${d.image ? ' has-image' : ''}${d.image_side === 'left' ? ' image-left' : ''}">
        <div class="cms-text-body animate-in">
          ${kicker(d.kicker, theme === 'dark')}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          <div class="cms-rich">${rich(d.body)}</div>
          ${d.button_label ? `<a class="btn ${theme === 'dark' ? 'btn-saffron' : 'btn-maroon'}" ${linkAttrs(d.button_href)}>${esc(d.button_label)}</a>` : ''}
        </div>
        ${img}
      </div>
    </section>`;
}

function notices(d, anchor, ctx) {
  const limit = Number(d.limit) || 6;
  const list = (ctx.announcements ?? []).filter((a) => a.show_on_board).slice(0, limit);
  const cards = list.map((a) => `
    <article class="notice-card${a.pinned ? ' is-pinned' : ''}">
      ${a.image_url ? `<button type="button" class="notice-img" data-notice-open="${esc(a.id)}"><img src="${src(a.image_url)}" loading="lazy" alt=""></button>` : ''}
      <div class="notice-body">
        <div class="notice-meta">
          ${a.pinned ? '<span class="notice-pin">Pinned</span>' : ''}
          <time datetime="${esc(a.starts_at || a.created_at)}">${esc(formatDate(a.starts_at || a.created_at))}</time>
        </div>
        <h3>${esc(a.title)}</h3>
        ${a.body ? `<div class="notice-text">${paragraphs(a.body)}</div>` : ''}
        <div class="notice-actions">
          ${a.link_url ? `<a class="notice-link" ${linkAttrs(a.link_url)}>${esc(a.link_label || 'Open')} →</a>` : ''}
          ${(a.body?.length ?? 0) > 180 || a.image_url ? `<button type="button" class="notice-more" data-notice-open="${esc(a.id)}">Read more</button>` : ''}
        </div>
      </div>
    </article>`).join('');
  return `
    <section${idAttr(anchor)} class="section notices-section">
      ${sectionHead(d)}
      ${cards ? `<div class="notice-grid animate-in delay-1">${cards}</div>` : `<p class="notice-empty">${esc(d.empty_text)}</p>`}
    </section>`;
}

function downloads(d, anchor) {
  const items = (d.items ?? []).map((f) => `
    <div class="dl-row">
      <div class="dl-icon">${icon('document')}</div>
      <div class="dl-info"><strong>${esc(f.title)}</strong>${f.text ? `<span>${esc(f.text)}</span>` : ''}</div>
      ${f.file ? `<a class="dl-btn" ${linkAttrs(f.file, true)}>${icon('download', { size: 16, stroke: 2 })}${esc(f.button || 'Download')}</a>` : ''}
    </div>`).join('');
  return `
    <section${idAttr(anchor)} class="section downloads-section">
      ${sectionHead(d)}
      <div class="dl-list animate-in delay-1">${items}</div>
    </section>`;
}

function faculty(d, anchor) {
  const staff = d.staff ?? [];
  const roles = [...new Set(staff.map((s) => (s.role ?? '').trim()).filter(Boolean))];
  const roleKey = (r) => r.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const badgeCls = (r) => (['pgt', 'tgt', 'prt', 'pti'].includes(roleKey(r)) ? roleKey(r) : 'other');
  const chips = roles.length > 1
    ? `<div class="faculty-filters" role="group" aria-label="Filter staff by role">
        <button class="chip is-active" type="button" data-filter="all">All</button>
        ${roles.map((r) => `<button class="chip" type="button" data-filter="${esc(roleKey(r))}">${esc(r)}</button>`).join('')}
      </div>` : '';
  const cards = staff.map((s) => `
    <article data-role="${esc(roleKey(s.role ?? ''))}">
      <strong>${esc(s.name)}</strong>
      ${s.detail ? `<span>${esc(s.detail)}</span>` : ''}
      ${s.role ? `<em class="role-badge ${badgeCls(s.role)}">${esc(s.role)}</em>` : ''}
    </article>`).join('');
  return `
    <section${idAttr(anchor)} class="section faculty-section">
      ${sectionHead(d)}
      ${chips}
      <div class="faculty-grid animate-in delay-1">${cards}</div>
    </section>`;
}

function cta(d, anchor) {
  return `
    <section${idAttr(anchor)} class="disclosure-cta-section">
      <div class="disclosure-cta animate-in">
        <div class="disclosure-cta-text">
          ${kicker(d.kicker, true)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.text ? `<p>${inline(d.text)}</p>` : ''}
        </div>
        ${d.button_label ? `
        <a class="disclosure-cta-btn" ${linkAttrs(d.button_href, d.new_tab)}>
          ${icon('document', { size: 20, stroke: 2 })}
          ${esc(d.button_label)}
          ${d.new_tab ? icon('external', { size: 16, stroke: 2.5 }) : ''}
        </a>` : ''}
      </div>
    </section>`;
}

function contact(d, anchor) {
  const buttons = (d.buttons ?? []).map((b) => `
    <a class="contact-btn${b.primary ? ' primary' : ''}" ${linkAttrs(b.href)}>
      <div class="cbtn-icon">${icon(b.icon || 'phone', { stroke: 2 })}</div>
      <div><span>${esc(b.label)}</span><strong>${esc(b.value)}</strong></div>
    </a>`).join('');
  const map = /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(d.map_embed ?? '')
    ? `<div class="contact-map animate-in"><iframe src="${esc(d.map_embed)}" title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
    : '';
  return `
    <section${idAttr(anchor)} class="contact-band">
      <div class="contact-inner">
        <div class="contact-text animate-in">
          ${kicker(d.kicker, true)}
          ${d.heading ? `<h2>${inline(d.heading)}</h2>` : ''}
          ${d.text ? `<p>${inline(d.text)}</p>` : ''}
          ${d.address ? `<address class="contact-address">${icon('map', { size: 18 })}${inline(d.address)}</address>` : ''}
        </div>
        <div class="contact-btns animate-in delay-1">${buttons}</div>
      </div>
      ${map}
    </section>`;
}

function embed(d, anchor) {
  // Admin-authored embed code (Google Forms / Maps etc.). Only admins can
  // write section data (enforced by database row-level security).
  return `
    <section${idAttr(anchor)} class="section embed-section">
      ${sectionHead(d)}
      <div class="embed-frame animate-in delay-1">${d.code ?? ''}</div>
    </section>`;
}

export const HOME_RENDERERS = {
  hero, stats, about, vision, leadership, academics, admissions, testimonials,
  activities, campus, gallery, video, text, notices, downloads, faculty, cta, contact, embed,
};

export function renderSections(sections, ctx = {}) {
  return sections.map((s) => {
    const fn = HOME_RENDERERS[s.type];
    if (!fn) return '';
    try {
      return fn(s.data ?? {}, s.anchor || '', ctx);
    } catch (err) {
      console.error('Could not render section', s.type, err);
      return '';
    }
  }).join('\n');
}

// ── Header / footer ─────────────────────────────────────────────

export function renderNav(settings) {
  return (settings.nav ?? []).map((l) =>
    `<a ${linkAttrs(l.href, l.new_tab)}${l.highlight ? ' class="nav-cta"' : ''}>${esc(l.label)}</a>`,
  ).join('\n');
}

export function renderFooter(s) {
  const year = new Date().getFullYear();
  return `
    <div class="footer-main">
      <div class="footer-brand">
        ${s.logo ? `<img src="${src(s.logo)}" alt="${esc(s.school_name)} logo">` : ''}
        <div>
          <strong>${esc(s.footer_name || s.school_name)}</strong>
          ${lines(s.footer_lines).map((l) => `<span>${inline(l)}</span>`).join('')}
        </div>
      </div>
      <nav class="footer-nav" aria-label="Footer navigation">
        ${(s.footer_nav ?? []).map((l) => `<a ${linkAttrs(l.href, l.new_tab)}>${esc(l.label)}</a>`).join('\n')}
      </nav>
      <div class="footer-motto">
        ${s.motto ? `<em lang="sa">${esc(s.motto)}</em>` : ''}
        ${s.motto_translation ? `<span>${esc(s.motto_translation)}</span>` : ''}
        ${s.footer_tagline ? `<span class="footer-cbse">${esc(s.footer_tagline)}</span>` : ''}
      </div>
    </div>
    <div class="footer-bottom">
      <span>${esc((s.copyright || '').replace('{year}', year))}</span>
      <a href="#top">Back to Top &uarr;</a>
    </div>`;
}
