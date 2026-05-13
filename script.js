/* ═══════════════════════════════════════════
   THE AGRATHA ACADEMY — SITE SCRIPTS
   ═══════════════════════════════════════════ */

// ── HEADER SCROLL BEHAVIOUR ─────────────────
const header    = document.querySelector('[data-header]');
const nav       = document.querySelector('[data-nav]');
const navToggle = document.querySelector('[data-nav-toggle]');

function syncHeader() {
  header?.classList.toggle('is-scrolled', window.scrollY > 36);
}
window.addEventListener('scroll', syncHeader, { passive: true });
syncHeader();

navToggle?.addEventListener('click', () => {
  const open = nav?.classList.toggle('is-open') ?? false;
  navToggle.setAttribute('aria-expanded', String(open));
});

nav?.addEventListener('click', (e) => {
  if (e.target instanceof HTMLAnchorElement) {
    nav.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
});

// Close nav on outside click
document.addEventListener('click', (e) => {
  if (!header?.contains(e.target)) {
    nav?.classList.remove('is-open');
    navToggle?.setAttribute('aria-expanded', 'false');
  }
});

// ── FACULTY FILTER ───────────────────────────
const chips       = document.querySelectorAll('[data-filter]');
const facultyCards = document.querySelectorAll('[data-role]');

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const filter = chip.dataset.filter ?? 'all';
    chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    facultyCards.forEach((card) => {
      const show = filter === 'all' || card.dataset.role === filter;
      card.classList.toggle('is-hidden', !show);
    });
  });
});

// ── SCROLL-IN ANIMATIONS ─────────────────────
const animObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.animate-in').forEach((el) => animObserver.observe(el));

// ── COUNTER ANIMATION ────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target ?? '0', 10);
  const suffix = el.dataset.suffix ?? '';
  const strong = el.querySelector('strong');
  if (!strong || strong.dataset.counted) return;
  strong.dataset.counted = '1';

  const duration = 1400;
  const start    = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value    = Math.round(easeOutCubic(progress) * target);
    strong.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

document.querySelectorAll('[data-counter]').forEach((el) => counterObserver.observe(el));

// ── GALLERY LIGHTBOX ─────────────────────────
const lightbox    = document.querySelector('[data-lightbox-overlay]');
const lbImg       = lightbox?.querySelector('[data-lightbox-img]');
const lbCap       = lightbox?.querySelector('[data-lightbox-cap]');
const lbClose     = lightbox?.querySelector('[data-lightbox-close]');

function openLightbox(src, alt, caption) {
  if (!lightbox || !lbImg) return;
  lbImg.src = src;
  lbImg.alt = alt;
  if (lbCap) lbCap.textContent = caption ?? '';
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lbClose?.focus();
}

function closeLightbox() {
  if (!lightbox) return;
  lightbox.hidden = true;
  document.body.style.overflow = '';
}

document.querySelectorAll('[data-lightbox]').forEach((figure) => {
  figure.setAttribute('role', 'button');
  figure.setAttribute('tabindex', '0');
  figure.style.cursor = 'pointer';

  const open = () => {
    const img     = figure.querySelector('img');
    const caption = figure.querySelector('figcaption');
    if (img) openLightbox(img.src, img.alt, caption?.textContent ?? '');
  };

  figure.addEventListener('click', open);
  figure.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
});

lbClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// ── HERO PARALLAX (subtle) ───────────────────
const heroBg = document.querySelector('.hero-bg');
if (heroBg) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroBg.style.transform = `scale(1.03) translateY(${y * 0.18}px)`;
    }
  }, { passive: true });
}

// ── ACTIVE NAV HIGHLIGHT ON SCROLL ──────────
const sections = document.querySelectorAll('section[id], div[id]');
const navLinks  = document.querySelectorAll('.primary-nav a[href^="#"]');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-current', active);
      });
    }
  });
}, { rootMargin: '-40% 0px -50% 0px' });

sections.forEach((s) => sectionObserver.observe(s));
