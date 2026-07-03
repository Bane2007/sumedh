(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const revealables = document.querySelectorAll(
    '.about__body, .closet-section, .sadako__grid, .sadako__pullquote, .currently, .roles__grid, .contact__list, .colophon, .crane-divider'
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

  // === CINEMA CLOSET SHELF DATA ===
  const filmData = {
    '2001': {
      title: '2001: A Space Odyssey',
      director: 'Stanley Kubrick',
      meta: '1968 &middot; 149 min &middot; United States',
      quote: '&ldquo;I&rsquo;m sorry, Dave. I&rsquo;m afraid I can&rsquo;t do that.&rdquo;',
      description: 'Stanley Kubrick&rsquo;s epic sci-fi masterwork traces humanity&rsquo;s evolutionary leap from prehistoric apes to the infinite cosmos, guided by mysterious black monoliths and a legendary, malfunctioning AI, HAL 9000.',
      cover: `<svg viewBox="0 0 140 200" class="svg-cover">
        <defs>
          <radialGradient id="halEye" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffeb3b"/>
            <stop offset="35%" stop-color="#ff5722"/>
            <stop offset="65%" stop-color="#d84315"/>
            <stop offset="100%" stop-color="#0c0c0c"/>
          </radialGradient>
        </defs>
        <rect width="140" height="200" fill="#080808"/>
        <circle cx="70" cy="100" r="18" fill="url(#halEye)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
        <circle cx="70" cy="100" r="4.5" fill="#fff" opacity="0.6"/>
        <text x="70" y="35" text-anchor="middle" fill="#fff" font-family="var(--mono)" font-size="7" letter-spacing="0.28em">2001</text>
      </svg>`
    },
    'shining': {
      title: 'The Shining',
      director: 'Stanley Kubrick',
      meta: '1980 &middot; 146 min &middot; United States',
      quote: '&ldquo;All work and no play makes Jack a dull boy.&rdquo;',
      description: 'As winter caretaker of the isolated Overlook Hotel, Jack Torrance falls prey to the hotel&rsquo;s supernatural, blood-drenched history, descending into violent madness that threatens his psychic son and terrified wife.',
      cover: `<svg viewBox="0 0 140 200" class="svg-cover">
        <rect width="140" height="200" fill="#2d1612"/>
        <path d="M0 40 L35 15 L70 40 L105 15 L140 40 L140 70 L105 45 L70 70 L35 45 L0 70 Z M0 110 L35 85 L70 110 L105 85 L140 110 L140 140 L105 115 L70 140 L35 115 L0 140 Z" fill="#872820" opacity="0.4" stroke="#c8615a" stroke-width="0.8"/>
        <text x="70" y="180" text-anchor="middle" fill="var(--oxblood-soft)" font-family="var(--serif)" font-size="7" font-weight="500" letter-spacing="0.1em">THE SHINING</text>
      </svg>`
    },
    'mulholland': {
      title: 'Mulholland Dr.',
      director: 'David Lynch',
      meta: '2001 &middot; 147 min &middot; United States',
      quote: '&ldquo;No hay banda. It is all an illusion.&rdquo;',
      description: 'David Lynch&rsquo;s dreamlike neo-noir masterpiece descends through the dark underbelly of Hollywood as an aspiring actress and a mysterious amnesiac woman unfold a surreal, shifting mystery of identity.',
      cover: `<svg viewBox="0 0 140 200" class="svg-cover">
        <rect width="140" height="200" fill="#091225"/>
        <circle cx="70" cy="100" r="10" fill="none" stroke="#ffeb3b" stroke-width="1.2"/>
        <line x1="80" y1="100" x2="110" y2="100" stroke="#ffeb3b" stroke-width="1.2"/>
        <line x1="95" y1="100" x2="95" y2="108" stroke="#ffeb3b" stroke-width="1.2"/>
        <line x1="105" y1="100" x2="105" y2="108" stroke="#ffeb3b" stroke-width="1.2"/>
        <text x="70" y="35" text-anchor="middle" fill="#ece4d3" font-family="var(--serif)" font-style="italic" font-size="9" letter-spacing="0.05em">Mulholland Dr.</text>
      </svg>`
    },
    'whiplash': {
      title: 'Whiplash',
      director: 'Damien Chazelle',
      meta: '2014 &middot; 106 min &middot; United States',
      quote: '&ldquo;Not quite my tempo.&rdquo;',
      description: 'Under the brutal, abusive tuition of conservatory jazz instructor Terrence Fletcher, young drummer Andrew Neiman pushes himself beyond the brink of sanity and physical endurance in a manic drive for perfection.',
      cover: `<svg viewBox="0 0 140 200" class="svg-cover">
        <rect width="140" height="200" fill="#0a0503"/>
        <line x1="20" y1="50" x2="120" y2="150" stroke="#fff" stroke-width="1.5" opacity="0.9"/>
        <line x1="120" y1="50" x2="20" y2="150" stroke="#fff" stroke-width="1.5" opacity="0.9"/>
        <circle cx="70" cy="100" r="26" fill="none" stroke="#e65100" stroke-width="1"/>
        <circle cx="70" cy="100" r="26" fill="#e65100" opacity="0.15"/>
        <text x="70" y="180" text-anchor="middle" fill="#9c9182" font-family="var(--mono)" font-size="7" letter-spacing="0.1em">BPM 290</text>
      </svg>`
    },
    'shawshank': {
      title: 'The Shawshank Redemption',
      director: 'Frank Darabont',
      meta: '1994 &middot; 142 min &middot; United States',
      quote: '&ldquo;Hope is a good thing, maybe the best of things, and no good thing ever dies.&rdquo;',
      description: 'Unjustly sentenced to life at Shawshank State Prison, banker Andy Dufresne uses his quiet intelligence, patience, and a small rock hammer to cultivate friendship, build a library, and plot a path to absolute freedom.',
      cover: `<svg viewBox="0 0 140 200" class="svg-cover">
        <rect width="140" height="200" fill="#202735"/>
        <line x1="0" y1="40" x2="140" y2="40" stroke="#161c27" stroke-width="2.5"/>
        <line x1="0" y1="80" x2="140" y2="80" stroke="#161c27" stroke-width="2.5"/>
        <line x1="0" y1="120" x2="140" y2="120" stroke="#161c27" stroke-width="2.5"/>
        <line x1="0" y1="160" x2="140" y2="160" stroke="#161c27" stroke-width="2.5"/>
        <!-- Minimal hammer -->
        <path d="M40 70 L55 55 L58 60 L48 70 M48 70 L25 93" stroke="#9c9182" stroke-width="1.2" fill="none"/>
        <text x="70" y="185" text-anchor="middle" fill="#ece4d3" font-family="var(--serif)" font-size="7.5" letter-spacing="0.12em">SHAWSHANK</text>
      </svg>`
    }
  };

  const spines = document.querySelectorAll('.spine-item');
  const displayBox = document.getElementById('closet-display');
  
  if (spines && displayBox) {
    const placeholder = displayBox.querySelector('.display-placeholder');
    const content = displayBox.querySelector('.display-content');
    const coverArt = displayBox.querySelector('#display-cover-art');
    const titleEl = displayBox.querySelector('#display-title');
    const directorEl = displayBox.querySelector('#display-director');
    const metaEl = displayBox.querySelector('#display-meta');
    const quoteEl = displayBox.querySelector('#display-quote');
    const descEl = displayBox.querySelector('#display-description');

    const updateDisplay = (filmKey) => {
      const data = filmData[filmKey];
      if (!data) return;

      content.style.display = 'grid';
      placeholder.style.display = 'none';

      coverArt.innerHTML = data.cover;
      titleEl.innerHTML = data.title;
      directorEl.innerHTML = data.director;
      metaEl.innerHTML = data.meta;
      quoteEl.innerHTML = data.quote;
      descEl.innerHTML = data.description;
      
      // Force repaint to re-trigger reveal animation
      content.style.animation = 'none';
      content.offsetHeight; // trigger reflow
      content.style.animation = null;
    };

    spines.forEach(spine => {
      const selectSpine = () => {
        spines.forEach(s => s.classList.remove('selected'));
        spine.classList.add('selected');
        const filmKey = spine.getAttribute('data-film');
        updateDisplay(filmKey);
      };

      spine.addEventListener('click', selectSpine);
      spine.addEventListener('mouseenter', selectSpine);
      spine.addEventListener('focus', selectSpine);
    });

    // Auto-select first spine on load (2001)
    if (spines.length > 0) {
      spines[0].classList.add('selected');
      updateDisplay('2001');
    }
  }
})();
