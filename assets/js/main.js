(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealables = document.querySelectorAll(
    '.about__body, .cabinet-curiosities, .sadako__grid, .sadako__pullquote, .currently, .roles__grid, .contact__list, .colophon, .crane-divider'
  );

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('reveal', 'is-visible'));
  } else {
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
  }

  // Cabinet of Curiosities Interaction
  const curioBtns = document.querySelectorAll('.curio-btn');
  const curioDisplayText = document.querySelector('.curio-display__text');
  
  if (curioBtns && curioDisplayText) {
    const defaultText = 'Explore the cutting room floor...';
    curioDisplayText.innerHTML = defaultText;
    
    curioBtns.forEach(btn => {
      const showQuote = () => {
        const quote = btn.getAttribute('data-quote');
        curioDisplayText.style.opacity = 0;
        setTimeout(() => {
          curioDisplayText.innerHTML = quote;
          curioDisplayText.style.opacity = 1;
        }, 100);
      };
      
      const resetQuote = () => {
        curioDisplayText.style.opacity = 0;
        setTimeout(() => {
          curioDisplayText.innerHTML = defaultText;
          curioDisplayText.style.opacity = 0.85;
        }, 100);
      };
      
      btn.addEventListener('mouseenter', showQuote);
      btn.addEventListener('focus', showQuote);
      
      btn.addEventListener('mouseleave', resetQuote);
      btn.addEventListener('blur', resetQuote);
    });
  }
})();
