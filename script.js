/* ═══════════════════════════════════════════
   THE AGRATHA ACADEMY — SITE SCRIPTS
   Page-wide listeners are attached once. Content behaviours live in
   init(), which the CMS calls again whenever it re-renders <main>.
   ═══════════════════════════════════════════ */

(() => {
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

  // ── FACULTY FILTER (delegated) ───────────────
  document.addEventListener('click', (e) => {
    const chip = e.target.closest?.('[data-filter]');
    if (!chip) return;
    const scope = chip.closest('section') ?? document;
    const filter = chip.dataset.filter ?? 'all';
    scope.querySelectorAll('[data-filter]').forEach((c) => c.classList.toggle('is-active', c === chip));
    scope.querySelectorAll('[data-role]').forEach((card) => {
      const show = filter === 'all' || card.dataset.role === filter;
      card.classList.toggle('is-hidden', !show);
    });
  });

  // ── GALLERY LIGHTBOX ─────────────────────────
  const lightbox = document.querySelector('[data-lightbox-overlay]');
  const lbImg    = lightbox?.querySelector('[data-lightbox-img]');
  const lbCap    = lightbox?.querySelector('[data-lightbox-cap]');
  const lbClose  = lightbox?.querySelector('[data-lightbox-close]');

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
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  function openFigure(figure) {
    const img     = figure.querySelector('img');
    const caption = figure.querySelector('figcaption');
    if (img) openLightbox(img.src, img.alt, caption?.textContent ?? '');
  }

  document.addEventListener('click', (e) => {
    const figure = e.target.closest?.('[data-lightbox]');
    if (figure) openFigure(figure);
  });
  document.addEventListener('keydown', (e) => {
    const figure = e.target.closest?.('[data-lightbox]');
    if (figure && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openFigure(figure); }
    if (e.key === 'Escape') closeLightbox();
  });
  lbClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

  // ── HERO PARALLAX (subtle) ───────────────────
  window.addEventListener('scroll', () => {
    const heroBg = document.querySelector('.hero-bg');
    const y = window.scrollY;
    if (heroBg && y < window.innerHeight) {
      heroBg.style.transform = `scale(1.03) translateY(${y * 0.18}px)`;
    }
  }, { passive: true });

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

  // ── PER-CONTENT BEHAVIOURS ───────────────────
  let observers = [];

  function init() {
    observers.forEach((o) => o.disconnect());
    observers = [];

    // Scroll-in animations
    const animObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          animObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.animate-in').forEach((el) => animObserver.observe(el));

    // Counters
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-counter]').forEach((el) => counterObserver.observe(el));

    // Lightbox figures are keyboard-focusable
    document.querySelectorAll('[data-lightbox]').forEach((figure) => {
      figure.setAttribute('role', 'button');
      figure.setAttribute('tabindex', '0');
      figure.style.cursor = 'pointer';
    });

    // Active nav highlight on scroll
    const sections = document.querySelectorAll('main section[id], main div[id]');
    const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('is-current', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach((s) => sectionObserver.observe(s));

    observers = [animObserver, counterObserver, sectionObserver];

    // Honour a #hash in the URL once content exists
    if (location.hash.length > 1) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      target?.scrollIntoView();
    }
  }

  window.AgrathaSite = { init };
  init();
})();
