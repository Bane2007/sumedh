(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // === PARTICLE CANVAS ===
  // Drifting fireflies / dust motes. Canvas-based for guaranteed visibility.
  const canvas = document.querySelector('.bg-particles');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w, h;
    const COUNT = 28;
    const particles = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(Math.random() * 0.45 + 0.15),
        r: Math.random() * 2.5 + 2.5,
        op: Math.random() * 0.3 + 0.7,
        phase: Math.random() * Math.PI * 2
      });
    }

    let t = 0;
    function frame() {
      ctx.clearRect(0, 0, w, h);
      t += 0.012;
      for (const p of particles) {
        p.x += p.vx + Math.sin(t + p.phase) * 0.28;
        p.y += p.vy;
        if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        halo.addColorStop(0, `rgba(247, 239, 222, ${p.op * 0.85})`);
        halo.addColorStop(0.4, `rgba(247, 239, 222, ${p.op * 0.3})`);
        halo.addColorStop(1, 'rgba(247, 239, 222, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 248, 232, ${Math.min(p.op * 1.2, 1)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    frame();
  }

  const revealables = document.querySelectorAll(
    '.about__body, .sadako__grid, .sadako__pullquote, .currently, .roles__grid, .contact__list, .colophon, .crane-divider'
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
