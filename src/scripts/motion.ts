/**
 * Site motion: scroll reveals, the pinned capability section, and stat
 * count-ups. Everything here is an enhancement — with JS off or reduced
 * motion on, the page renders complete and static.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll reveals ---------- */
function initReveals() {
  const targets = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  if (!targets.length) return;

  if (reducedMotion) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ---------- Pinned capability section ---------- */
function initPinnedSection() {
  const section = document.querySelector<HTMLElement>('[data-pinned]');
  if (!section) return;

  const triggers = [...section.querySelectorAll<HTMLElement>('[data-pinned-trigger]')];
  const panels = [...section.querySelectorAll<HTMLElement>('[data-pinned-panel]')];
  const railItems = [...section.querySelectorAll<HTMLElement>('[data-pinned-rail]')];
  if (!triggers.length || !panels.length) return;

  let active = -1;

  const setActive = (index: number) => {
    if (index === active || index < 0 || index >= panels.length) return;
    active = index;
    panels.forEach((panel, i) => panel.classList.toggle('is-active', i === index));
    railItems.forEach((item, i) => {
      const on = i === index;
      item.classList.toggle('border-accent', on);
      item.classList.toggle('border-transparent', !on);
      item.classList.toggle('text-charcoal', on);
      item.classList.toggle('text-muted', !on);
      item.setAttribute('aria-selected', String(on));
    });
  };

  setActive(0);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = Number((entry.target as HTMLElement).dataset.index ?? 0);
        setActive(index);
      }
    },
    { rootMargin: '-30% 0px -55% 0px' }
  );

  triggers.forEach((trigger) => observer.observe(trigger));

  // The rail is a real tablist: clicking scrolls to the matching trigger.
  railItems.forEach((item, i) => {
    item.addEventListener('click', () => {
      triggers[i]?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center',
      });
    });
  });
}

/* ---------- Stat count-up ---------- */
function initCountUps() {
  const stats = document.querySelectorAll<HTMLElement>('[data-countup]');
  if (!stats.length) return;

  if (reducedMotion) {
    stats.forEach((el) => (el.textContent = el.dataset.countup ?? el.textContent));
    return;
  }

  const animate = (el: HTMLElement) => {
    const raw = el.dataset.countup ?? '';
    // Split into leading number and any suffix/prefix so "1,090" and "184" and
    // "~30" all animate their numeric part only.
    const match = raw.match(/^(\D*)([\d,.]+)(.*)$/);
    if (!match) {
      el.textContent = raw;
      return;
    }
    const [, prefix, numStr, suffix] = match;
    const target = parseFloat(numStr.replace(/,/g, ''));
    if (!Number.isFinite(target)) {
      el.textContent = raw;
      return;
    }
    const hasComma = numStr.includes(',');
    const duration = 800;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${hasComma ? value.toLocaleString('en-US') : value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animate(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.4 }
  );

  stats.forEach((el) => observer.observe(el));
}

/* ---------- Hero video: play only while visible ---------- */
function initHeroVideo() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  if (!video) return;

  // Reduced motion keeps the poster frame and never plays.
  if (reducedMotion) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            /* autoplay refused — poster stays, no error surfaced */
          });
        } else {
          video.pause();
        }
      }
    },
    { threshold: 0.5 }
  );

  observer.observe(video);
}

function init() {
  initReveals();
  initPinnedSection();
  initCountUps();
  initHeroVideo();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
