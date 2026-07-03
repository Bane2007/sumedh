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

  const generateGenericCover = (title, year) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [15, 45, 200, 220, 342]; 
    const hue = hues[Math.abs(hash) % hues.length];
    
    return `<svg viewBox="0 0 140 200" class="svg-cover">
      <rect width="140" height="200" fill="hsl(${hue}, 20%, 8%)"/>
      <rect x="5" y="5" width="130" height="190" fill="none" stroke="hsl(${hue}, 22%, 18%)" stroke-width="1"/>
      <foreignObject x="10" y="45" width="120" height="110">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #ece4d3; font-family: var(--serif); font-size: 9px; text-align: center; line-height: 1.35; font-weight: 500; font-style: italic; display: flex; align-items: center; justify-content: center; height: 100%;">
          ${title}
        </div>
      </foreignObject>
      <text x="70" y="180" text-anchor="middle" fill="hsl(${hue}, 25%, 40%)" font-family="var(--mono)" font-size="6" letter-spacing="0.1em">${year}</text>
    </svg>`;
  };

  // Tab View Swapping
  const btnShelfView = document.getElementById('btn-shelf-view');
  const btnListView = document.getElementById('btn-list-view');
  const panelShelfView = document.getElementById('panel-shelf-view');
  const panelListView = document.getElementById('panel-list-view');

  // Display Box Elements
  const displayBox = document.getElementById('closet-display');
  const placeholder = displayBox ? displayBox.querySelector('.display-placeholder') : null;
  const content = displayBox ? displayBox.querySelector('.display-content') : null;
  const coverArt = displayBox ? displayBox.querySelector('#display-cover-art') : null;
  const titleEl = displayBox ? displayBox.querySelector('#display-title') : null;
  const directorEl = displayBox ? displayBox.querySelector('#display-director') : null;
  const metaEl = displayBox ? displayBox.querySelector('#display-meta') : null;
  const quoteEl = displayBox ? displayBox.querySelector('#display-quote') : null;
  const descEl = displayBox ? displayBox.querySelector('#display-description') : null;

  const updateDisplayWithLetterboxd = (film) => {
    if (!displayBox) return;
    content.style.display = 'grid';
    placeholder.style.display = 'none';

    coverArt.innerHTML = generateGenericCover(film.title, film.year);
    titleEl.innerHTML = film.title;
    directorEl.innerHTML = 'Letterboxd Diary';
    metaEl.innerHTML = `${film.year} &middot; Rated ${film.rating}`;
    
    // Hide quote element for dynamic letterboxd entries
    quoteEl.style.display = 'none';
    
    descEl.innerHTML = `This film is part of Sumedh's watched history on Letterboxd. He rated it <strong>${film.rating}</strong>.<br><br>
      <a class="btn btn--filled" href="https://letterboxd.com/film/${film.slug}/" target="_blank" rel="noopener" style="margin-top: 0.5rem; display: inline-flex;">
        View on Letterboxd
      </a>`;

    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  const updateDisplayWithFeatured = (filmKey) => {
    if (!displayBox) return;
    const data = filmData[filmKey];
    if (!data) return;

    content.style.display = 'grid';
    placeholder.style.display = 'none';

    coverArt.innerHTML = data.cover;
    titleEl.innerHTML = data.title;
    directorEl.innerHTML = data.director;
    metaEl.innerHTML = data.meta;
    
    // Show quote element for custom curated films
    quoteEl.style.display = 'block';
    quoteEl.innerHTML = data.quote;
    
    descEl.innerHTML = data.description;
    
    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  // Movie List Sorting & Filtering Logic
  const movieGrid = document.getElementById('movie-grid');
  const movieSearch = document.getElementById('movie-search');
  const movieSort = document.getElementById('movie-sort');

  const getFilteredAndSortedFilms = () => {
    if (!window.letterboxdFilms) return [];

    const query = movieSearch ? movieSearch.value.toLowerCase() : '';
    const sortBy = movieSort ? movieSort.value : 'default';

    // 1. Filter
    let result = window.letterboxdFilms.filter(film => {
      return film.title.toLowerCase().includes(query) || film.year.includes(query);
    });

    // Rating value helper
    const getRatingValue = (ratingStr) => {
      const mappings = {
        '★★★★★': 10, '★★★★½': 9, '★★★★': 8, '★★★½': 7, '★★★': 6,
        '★★½': 5, '★★': 4, '★½': 3, '★': 2, '½': 1
      };
      return mappings[ratingStr] || 0;
    };

    // 2. Sort
    if (sortBy === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'year-desc') {
      result.sort((a, b) => {
        const ya = parseInt(a.year) || 0;
        const yb = parseInt(b.year) || 0;
        return yb - ya;
      });
    } else if (sortBy === 'year-asc') {
      result.sort((a, b) => {
        const ya = parseInt(a.year) || 0;
        const yb = parseInt(b.year) || 0;
        return ya - yb;
      });
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => getRatingValue(b.rating) - getRatingValue(a.rating));
    }

    return result;
  };

  const renderList = () => {
    if (!movieGrid) return;
    movieGrid.innerHTML = '';
    const films = getFilteredAndSortedFilms();

    films.forEach(film => {
      const card = document.createElement('div');
      card.className = 'grid-item-card';
      card.setAttribute('data-slug', film.slug);
      card.setAttribute('tabindex', '0');

      card.innerHTML = `
        <span class="card-mini-title">${film.title}</span>
        <div class="card-mini-meta">
          <span>${film.year}</span>
          <span class="card-mini-rating">${film.rating || 'No Rating'}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        const allCards = movieGrid.querySelectorAll('.grid-item-card');
        allCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        updateDisplayWithLetterboxd(film);
      });

      card.addEventListener('focus', () => {
        card.click();
      });

      movieGrid.appendChild(card);
    });

    // Auto-select first matching card if list view is active
    if (btnListView && btnListView.classList.contains('active') && films.length > 0) {
      const firstCard = movieGrid.querySelector('.grid-item-card');
      if (firstCard) firstCard.click();
    }
  };

  // Setup tab event listeners
  if (btnShelfView && btnListView && panelShelfView && panelListView) {
    btnShelfView.addEventListener('click', () => {
      btnListView.classList.remove('active');
      btnShelfView.classList.add('active');
      panelListView.style.display = 'none';
      panelShelfView.style.display = 'flex';
      
      const spines = panelShelfView.querySelectorAll('.spine-item');
      if (spines.length > 0) {
        spines[0].click();
      }
    });

    btnListView.addEventListener('click', () => {
      btnShelfView.classList.remove('active');
      btnListView.classList.add('active');
      panelShelfView.style.display = 'none';
      panelListView.style.display = 'flex';

      renderList();
    });
  }

  // Interactivity for shelf spines
  const spines = document.querySelectorAll('.spine-item');
  spines.forEach(spine => {
    const selectSpine = () => {
      spines.forEach(s => s.classList.remove('selected'));
      spine.classList.add('selected');
      const filmKey = spine.getAttribute('data-film');
      updateDisplayWithFeatured(filmKey);
    };

    spine.addEventListener('click', selectSpine);
    spine.addEventListener('mouseenter', selectSpine);
    spine.addEventListener('focus', selectSpine);
  });

  // Attach search and sort listeners
  if (movieSearch) {
    movieSearch.addEventListener('input', renderList);
  }
  if (movieSort) {
    movieSort.addEventListener('change', renderList);
  }

  // Initialize: Auto-select first shelf spine on load
  if (spines.length > 0) {
    spines[0].classList.add('selected');
    updateDisplayWithFeatured('2001');
  }

  // Render the initial Letterboxd list in the background panel
  renderList();
})();
