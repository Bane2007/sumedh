(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealables = document.querySelectorAll(
    '.about__grid, .sadako__grid, .sadako__pullquote, .currently, .roles__grid, .contact__list, .colophon, .crane-divider'
  );

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('reveal', 'is-visible'));
    return;
  }

  revealables.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealables.forEach(el => io.observe(el));
})();
