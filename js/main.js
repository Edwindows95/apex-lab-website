// ═══════════════════════════════════
//  APEX LAB — Main JavaScript
// ═══════════════════════════════════

// Mobile nav — bottom-sheet menu with backdrop
const navToggle   = document.getElementById('nav-toggle');
const navLinks    = document.getElementById('nav-links');
const navBackdrop = document.getElementById('nav-backdrop');

function setNavOpen(open) {
  if (!navLinks) return;
  navLinks.classList.toggle('open', open);
  navBackdrop?.classList.toggle('is-open', open);
  navToggle?.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    setNavOpen(!navLinks.classList.contains('open'));
  });
}

navBackdrop?.addEventListener('click', () => setNavOpen(false));

// Close sheet when any link is tapped
navLinks?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setNavOpen(false));
});

// Escape key closes sheet
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks?.classList.contains('open')) setNavOpen(false);
});

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.parentElement;
    const answer = btn.nextElementSibling;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      const a = i.querySelector('.faq-a');
      if (a) a.style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// Smooth scroll + close mobile nav
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (navLinks) navLinks.classList.remove('open');
    }
  });
});

// Nav background on scroll — toggles .scrolled when the hero leaves the viewport.
// Primary: IntersectionObserver. Fallback: scroll-driven rect check (covers envs
// where IO doesn't fire reliably).
const navPill = document.querySelector('.nav-pill');
const hero    = document.querySelector('.hero');

if (navPill && hero) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => navPill.classList.toggle('scrolled', !entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(hero);
  }
  // Scroll fallback — hero height × 0.1 is the threshold mark
  const checkNav = () => {
    const rect = hero.getBoundingClientRect();
    const stillVisible = rect.bottom > rect.height * 0.1;
    navPill.classList.toggle('scrolled', !stillVisible);
  };
  window.addEventListener('scroll', checkNav, { passive: true });
  if (window.__lenis && typeof window.__lenis.on === 'function') {
    try { window.__lenis.on('scroll', checkNav); } catch (e) {}
  } else {
    let tries = 0;
    const retry = setInterval(() => {
      if (window.__lenis && typeof window.__lenis.on === 'function') {
        try { window.__lenis.on('scroll', checkNav); } catch (e) {}
        clearInterval(retry);
      } else if (++tries > 40) clearInterval(retry);
    }, 50);
  }
  checkNav();
}

// Scroll reveal + stagger containers
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Standalone stagger containers (not inside .reveal)
  document.querySelectorAll('.stagger').forEach(el => {
    if (!el.closest('.reveal')) revealObserver.observe(el);
  });
}

// Lenis smooth scroll (momentum wheel)
(function initLenis() {
  if (prefersReducedMotion) return;
  let tries = 0;
  const boot = () => {
    if (typeof window.Lenis === 'undefined') {
      if (tries++ < 40) return setTimeout(boot, 50);
      return;
    }
    const lenis = new window.Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    // Replace the existing smooth-scroll anchor handler with Lenis
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -20, duration: 1.1 });
        if (navLinks) navLinks.classList.remove('open');
      }, { capture: true });
    });

    window.__lenis = lenis;
  };
  boot();
})();

// ═══════════════════════════════════
//  PLATFORM — 3D scroll-tilt (21st.dev pattern)
//  As the scroll-container passes through the viewport, compute progress 0→1
//  and set --scroll-progress on the section. CSS handles the transform.
//  Listens to BOTH native scroll AND Lenis scroll to survive any scroll mode.
// ═══════════════════════════════════
(function initPlatformScrollTilt() {
  const platform = document.getElementById('platform');
  if (!platform) return;
  const container = platform.querySelector('.platform-scroll-container');
  if (!container) return;

  // Progress: 0 when container just enters from below (fully tilted),
  //           1 when container is fully in view / centered (flat).
  // Stays at 1 after — card remains flat while the user reads it and scrolls past.
  // This differs from Framer Motion's default useScroll (which only reaches 1 after
  // the section exits the top); that pattern leaves the card tilted at eye-level.
  function computeProgress() {
    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight;
    // Target "flat" moment = when container is vertically centered in viewport
    //   rect.top at that moment = max(0, (vh - rect.height) / 2)
    const targetTop = Math.max(0, (vh - rect.height) / 2);
    const range = vh - targetTop;
    if (range <= 0) return 1;
    const scrolled = vh - rect.top;
    return Math.max(0, Math.min(1, scrolled / range));
  }

  let rafId = null;
  function update() {
    rafId = null;
    const p = computeProgress();
    platform.style.setProperty('--scroll-progress', p.toFixed(4));
  }

  function schedule() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(update);
  }

  // Direct handler in case rAF is stalled (preview envs, background tabs)
  function directUpdate() {
    const p = computeProgress();
    platform.style.setProperty('--scroll-progress', p.toFixed(4));
  }

  // Native scroll events
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });

  // Hook Lenis if it shows up (it uses rAF internally and may not dispatch native scroll)
  const hookLenis = () => {
    if (window.__lenis && typeof window.__lenis.on === 'function') {
      window.__lenis.on('scroll', directUpdate);
      return true;
    }
    return false;
  };
  if (!hookLenis()) {
    let tries = 0;
    const retry = setInterval(() => {
      if (hookLenis() || ++tries > 40) clearInterval(retry);
    }, 50);
  }

  // Also run once per rAF as a belt-and-suspenders update (cheap — rect read + var set)
  (function loop() {
    directUpdate();
    requestAnimationFrame(loop);
  })();

  update();
})();

// ═══════════════════════════════════
//  MANIFESTO — per-word scroll reveal
//  Each .word gets .revealed as it enters the viewport's middle zone.
//  Works independent of any scroll mechanism (native, Lenis, touch).
// ═══════════════════════════════════
(function initManifestoReveal() {
  const words = document.querySelectorAll('.manifesto-body .word');
  if (!words.length) return;

  // rootMargin '-35% 0px -35% 0px' narrows the intersection root to the middle
  // ~30% of the viewport — words reveal when they cross into eye-level.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

  words.forEach((w) => io.observe(w));
})();

// ═══════════════════════════════════
//  CLIENTS — per-word scroll reveal for the hero quote (orbai pattern)
//  Primary: IntersectionObserver. Fallback: scroll-driven rect check
//  (covers environments where IO is unreliable — e.g., some preview tools).
// ═══════════════════════════════════
(function initClientsQuoteReveal() {
  const words = Array.from(document.querySelectorAll('.client-quote-card .q-word'));
  if (!words.length) return;

  const reveal = (el) => el.classList.add('revealed');

  // Primary: IntersectionObserver
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: 0 });
    words.forEach((w) => io.observe(w));
  }

  // Fallback: scroll-driven check (also catches the case where IO doesn't fire)
  const zone = () => {
    const vh = window.innerHeight;
    return { top: vh * 0.30, bottom: vh * 0.70 };
  };
  const check = () => {
    const z = zone();
    for (let i = words.length - 1; i >= 0; i--) {
      const w = words[i];
      if (w.classList.contains('revealed')) continue;
      const r = w.getBoundingClientRect();
      if (r.bottom >= z.top && r.top <= z.bottom) reveal(w);
    }
  };
  let rafId = null;
  const schedule = () => { if (rafId !== null) return; rafId = requestAnimationFrame(() => { rafId = null; check(); }); };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', schedule);
  if (window.__lenis && typeof window.__lenis.on === 'function') {
    try { window.__lenis.on('scroll', check); } catch (e) {}
  } else {
    let tries = 0;
    const retry = setInterval(() => {
      if (window.__lenis && typeof window.__lenis.on === 'function') {
        try { window.__lenis.on('scroll', check); } catch (e) {}
        clearInterval(retry);
      } else if (++tries > 40) clearInterval(retry);
    }, 50);
  }
  check();
})();

// ═══════════════════════════════════
//  MAGNETIC GLOW + 1° TILT on cards
// ═══════════════════════════════════
const supportsHover = window.matchMedia('(hover: hover)').matches;
if (supportsHover && !prefersReducedMotion) {
  const tiltCards = document.querySelectorAll('.benefit-card, .feature-card, .client-quote-card, .client-image-card, .client-card, .how-card');
  const TILT_DEG = 1;

  tiltCards.forEach(card => {
    const onMove = (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top)  / rect.height;
      const nx = (px - 0.5) * 2;
      const ny = (py - 0.5) * 2;
      card.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
      card.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);
      card.style.transform =
        `rotateX(${(-ny * TILT_DEG).toFixed(3)}deg) ` +
        `rotateY(${( nx * TILT_DEG).toFixed(3)}deg) ` +
        `translateY(-3px)`;
    };
    const reset = () => { card.style.transform = ''; };
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', reset);
  });
  window.__tiltBound = true;
}

// ═══════════════════════════════════
//  PIN SECTION — scroll-driven beat switcher + accordion
//  Sticky stage stays in view while the outer track scrolls.
//  Beat index = floor(progress * beats), clamped.
// ═══════════════════════════════════
(function initPinSection() {
  const section = document.getElementById('inside-apex');
  if (!section) return;

  // Desktop-only scroll-driven beat switcher. At ≤900px the section is hidden
  // via CSS and a static .beats-mobile stack renders instead.
  const desktopMq = window.matchMedia('(min-width: 901px)');
  let initialized = false;
  let cleanupFns = [];
  let lenisRetry = null;

  const teardown = () => {
    cleanupFns.forEach((fn) => { try { fn(); } catch (e) {} });
    cleanupFns = [];
    if (lenisRetry) { clearInterval(lenisRetry); lenisRetry = null; }
    initialized = false;
  };

  const init = () => {
    if (initialized) return;
    initialized = true;

    const track = section.querySelector('.pin-track');
    const beats = parseInt(track?.dataset.beats || '3', 10);
    const bgs   = section.querySelectorAll('.pin-bg-img');
    const slides = section.querySelectorAll('.pin-slide');
    const navs  = section.querySelectorAll('.pin-nav-item');
    const fileLabelCount = section.querySelector('.pin-filelabel-count');
    const fileLabelName  = section.querySelector('.pin-filelabel-name');

    // Group mapping: when there are more image beats than text groups,
    // spread them across the text groups proportionally (e.g., 11 images → 3 groups).
    const groupCount = slides.length || 1;
    const groupFor = (idx) => Math.min(groupCount - 1, Math.floor(idx * groupCount / beats));

    let currentBeat = -1;

    const setBeat = (idx) => {
      if (idx === currentBeat) return;
      currentBeat = idx;
      bgs.forEach((el, i) => el.classList.toggle('is-active', i === idx));
      const group = groupFor(idx);
      slides.forEach((el, i) => el.classList.toggle('is-active', i === group));
      navs.forEach((el, i) => el.classList.toggle('is-active', i === group));
      if (fileLabelCount && fileLabelName && bgs[idx]) {
        const total = String(beats).padStart(2, '0');
        const cur   = String(idx + 1).padStart(2, '0');
        fileLabelCount.textContent = `${cur} / ${total}`;
        fileLabelName.textContent  = bgs[idx].dataset.filename || '';
      }
    };

    // Click a nav item to jump to the middle of that group's scroll range
    navs.forEach((nav, i) => {
      nav.addEventListener('click', () => {
        const rect = track.getBoundingClientRect();
        const trackTop = window.pageYOffset + rect.top;
        const trackRange = track.offsetHeight - window.innerHeight;
        const progress = (i + 0.5) / groupCount;
        const targetY = trackTop + trackRange * progress;
        if (window.__lenis && window.__lenis.scrollTo) window.__lenis.scrollTo(targetY, { duration: 1.1 });
        else window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

    const update = () => {
      const rect = track.getBoundingClientRect();
      const range = track.offsetHeight - window.innerHeight;
      if (range <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / range));
      const idx = Math.min(beats - 1, Math.floor(progress * beats * 0.9999));
      setBeat(idx);
    };

    let rafId = null;
    const schedule = () => { if (rafId !== null) return; rafId = requestAnimationFrame(() => { rafId = null; update(); }); };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', schedule);
    cleanupFns.push(
      () => window.removeEventListener('scroll', schedule),
      () => window.removeEventListener('scroll', update),
      () => window.removeEventListener('resize', schedule)
    );

    const hookLenis = () => {
      if (window.__lenis && typeof window.__lenis.on === 'function') {
        window.__lenis.on('scroll', update);
        cleanupFns.push(() => {
          if (window.__lenis && typeof window.__lenis.off === 'function') {
            window.__lenis.off('scroll', update);
          }
        });
        return true;
      }
      return false;
    };
    if (!hookLenis()) {
      let tries = 0;
      lenisRetry = setInterval(() => { if (hookLenis() || ++tries > 40) { clearInterval(lenisRetry); lenisRetry = null; } }, 50);
    }

    update();

    // Accordion (scoped to this section). Safe to attach even on mobile —
    // section is display:none so clicks never reach these buttons.
    section.querySelectorAll('.pin-acc-q').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const answer = btn.nextElementSibling;
        const isOpen = item.classList.contains('open');
        section.querySelectorAll('.pin-acc-item').forEach(i => {
          i.classList.remove('open');
          const a = i.querySelector('.pin-acc-a');
          if (a) a.style.maxHeight = null;
        });
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  };

  if (desktopMq.matches) init();
  desktopMq.addEventListener('change', (e) => {
    if (e.matches) init();
    else teardown();
  });
})();

// ── Gallery Strip ──────────────────────────────────────────
(function () {
  const strip = document.querySelector('.gallery-strip');
  if (!strip) return;

  const items = Array.from(strip.querySelectorAll('.gallery-item'));
  const modal = document.getElementById('gallery-modal');
  if (!modal) return;

  const modalImg     = modal.querySelector('.gallery-modal-img');
  const modalCounter = modal.querySelector('.gallery-modal-counter');
  const closeBtn     = modal.querySelector('.gallery-modal-close');
  const prevBtn      = modal.querySelector('.gallery-modal-prev');
  const nextBtn      = modal.querySelector('.gallery-modal-next');
  const srcs         = items.map(el => el.dataset.src);
  let current        = null;

  function openModal(index) {
    current = index;
    if (modalImg) modalImg.src = srcs[index];
    if (modalCounter) modalCounter.textContent = `${index + 1} / ${srcs.length}`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    current = null;
  }

  function navigate(dir) {
    if (current === null) return;
    current = (current + dir + srcs.length) % srcs.length;
    openModal(current);
  }

  // rAF-based flex-grow animation — reliable across all browsers
  let activeIndex = 0;
  const grows = items.map(() => 1);
  let rafId = null;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateTo(targets) {
    const from = grows.slice();
    const start = performance.now();
    const duration = 500;
    if (rafId) cancelAnimationFrame(rafId);
    function tick(now) {
      const t = easeOut(Math.min((now - start) / duration, 1));
      items.forEach((el, i) => {
        grows[i] = from[i] + (targets[i] - from[i]) * t;
        el.style.flexGrow = grows[i];
      });
      if (t < 1) rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function expandTo(index) {
    animateTo(items.map((_, j) => j === index ? 2.2 : 0.4));
  }

  expandTo(activeIndex);

  items.forEach((item, i) => {
    item.addEventListener('mouseenter', () => expandTo(i));
  });

  strip.addEventListener('mouseleave', () => expandTo(activeIndex));

  items.forEach((item, i) => item.addEventListener('click', () => {
    activeIndex = i;
    openModal(i);
  }));
  closeBtn?.addEventListener('click', closeModal);
  prevBtn?.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
  nextBtn?.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  });
})();
