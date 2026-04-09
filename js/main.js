// ═══════════════════════════════════
//  APEX LAB — Main JavaScript
// ═══════════════════════════════════

// Mobile nav toggle
document.getElementById('nav-toggle').addEventListener('click', () => {
  document.getElementById('nav-links').classList.toggle('open');
});

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const answer = btn.nextElementSibling;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-a').style.maxHeight = null;
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
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('nav-links').classList.remove('open');
    }
  });
});

// Nav background on scroll
const navPill = document.querySelector('.nav-pill');
const hero = document.querySelector('.hero');

if (navPill && hero) {
  const observer = new IntersectionObserver(
    ([entry]) => {
      navPill.classList.toggle('scrolled', !entry.isIntersecting);
    },
    { threshold: 0.1 }
  );
  observer.observe(hero);
}

// Scroll reveal animations
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });

  // Step cards — scroll-progress-linked animation
  const stepsRow = document.querySelector('.steps-row');
  if (stepsRow) {
    const stepCards = Array.from(stepsRow.querySelectorAll('.step-card'));
    const line = stepsRow;

    // Position the connecting line dynamically based on image height
    const positionLine = () => {
      const firstImg = stepsRow.querySelector('.step-img');
      if (firstImg) {
        const imgHeight = firstImg.offsetHeight;
        stepsRow.style.setProperty('--line-top', (imgHeight + 16) + 'px');
      }
    };
    positionLine();
    window.addEventListener('resize', positionLine);

    const updateSteps = () => {
      const rect = stepsRow.getBoundingClientRect();
      const viewH = window.innerHeight;
      // Progress: 0 when section top enters bottom of viewport, 1 when top reaches 30% from top
      const start = viewH;
      const end = viewH * 0.2;
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));

      // Each card has its own progress range (staggered)
      // Card 1: 0–0.35, Card 2: 0.25–0.65, Card 3: 0.50–0.90
      stepCards.forEach((card, i) => {
        const cardStart = i * 0.25;
        const cardEnd = cardStart + 0.35;
        const cardProgress = Math.min(1, Math.max(0, (progress - cardStart) / (cardEnd - cardStart)));

        card.style.opacity = cardProgress;
        card.style.transform = `translateY(${(1 - cardProgress) * 40}px)`;
      });

      // Line syncs with the rightmost visible card
      // Line reaches card 1 center when card 1 is done, card 2 center when card 2 is done, etc.
      // Map: progress 0–0.35 → line to 33%, 0.35–0.65 → line to 66%, 0.65–0.90 → line to 100%
      let lineProgress = 0;
      for (let i = 0; i < stepCards.length; i++) {
        const cardStart = i * 0.25;
        const cardEnd = cardStart + 0.35;
        const cardProgress = Math.min(1, Math.max(0, (progress - cardStart) / (cardEnd - cardStart)));
        // Each card contributes 1/3 of the line
        lineProgress = (i + cardProgress) / stepCards.length;
        if (cardProgress < 1) break;
      }
      stepsRow.style.setProperty('--line-scale', Math.min(1, lineProgress));

      requestAnimationFrame(updateSteps);
    };

    requestAnimationFrame(updateSteps);
  }

  // Showcase staggered animation
  const showcase = document.querySelector('.showcase-animated');
  if (showcase) {
    const showcaseObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          showcase.classList.add('showcase-visible');
          showcaseObserver.unobserve(showcase);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    showcaseObserver.observe(showcase);
  }
}

// ═══════════════════════════════════
//  TAB SWITCHING (what-we-measure & FAQs)
// ═══════════════════════════════════
document.querySelectorAll('.tab-nav').forEach(nav => {
  const buttons = nav.querySelectorAll('button');
  const container = nav.closest('section') || nav.parentElement;
  const panels = container.querySelectorAll('.tab-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = container.querySelector(`#${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
});

// ═══════════════════════════════════
//  NAV FALLBACK FOR SUBPAGES
// ═══════════════════════════════════
// Subpages don't have .hero — apply scrolled state immediately
if (navPill && !hero) {
  navPill.classList.add('scrolled');
}

// Close mobile nav on page link clicks (not just anchor links)
document.querySelectorAll('.nav-links a[href]').forEach(link => {
  link.addEventListener('click', () => {
    const navLinks = document.getElementById('nav-links');
    if (navLinks) navLinks.classList.remove('open');
  });
});
