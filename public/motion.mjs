function initReveals() {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches || !window.IntersectionObserver || !Element.prototype.animate) return;

  const tokens = getComputedStyle(document.documentElement);
  const duration = Number.parseFloat(tokens.getPropertyValue('--motion-reveal'));
  const easing = tokens.getPropertyValue('--motion-ease').trim();
  if (!Number.isFinite(duration) || !easing) return;

  const active = new Map();
  const interactive = 'a, button, input, select, textarea, summary';
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const target = entry.target;
      observer.unobserve(target);
      if (preference.matches || target.matches(':focus-within')) continue;

      // Keep hit areas still; only non-interactive content moves slightly.
      const still = target.matches(interactive) || target.querySelector(interactive);
      const frames = still
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }];
      const animation = target.animate(frames, { duration, easing });
      active.set(target, animation);
      const forget = () => active.delete(target);
      animation.finished.then(forget, forget);
    }
  }, { rootMargin: '0px 0px 24px 0px', threshold: 0 });

  const targets = document.querySelectorAll([
    '.halls-intro', '.hall-option', '.section-heading', '.gallery-item',
    '.menu-heading', '.menu-copy', '#planning h2', '.planning-steps > li',
    '.enquiry-copy', '.faq-grid > div', '.contact-copy', '.contact-photo',
  ].join(', '));
  for (const target of targets) {
    if (target.getBoundingClientRect().top >= window.innerHeight) observer.observe(target);
  }

  // No hidden classes or filled animations: interrupted effects reveal normal content.
  const stop = () => {
    observer.disconnect();
    for (const animation of active.values()) animation.cancel();
    active.clear();
  };
  preference.addEventListener('change', event => { if (event.matches) stop(); });
  window.addEventListener('beforeprint', stop);
  document.addEventListener('focusin', event => {
    for (const [target, animation] of active) {
      if (target.contains(event.target)) animation.cancel();
    }
  });
}

initReveals();
