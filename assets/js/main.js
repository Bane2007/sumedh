(() => {
  'use strict';

  // --- INTERSECTION OBSERVER FOR REVEALS ---
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

  // --- DEFENSIVE DATABASE CHECK ---
  if (!window.mediaDatabase) {
    window.mediaDatabase = {
      films: [],
      anime: [],
      manga: [],
      currently: { watching: [], reading: [] }
    };
  }

  // === CURATED FEATURED FILMS DATABASE ===
  const filmData = {
    '2001': {
      title: '2001: A Space Odyssey',
      director: 'Stanley Kubrick',
      meta: '1968 &middot; 149 min &middot; United States',
      quote: '&ldquo;I&rsquo;m sorry, Dave. I&rsquo;m afraid I can&rsquo;t do that.&rdquo;',
      description: 'Stanley Kubrick&rsquo;s epic sci-fi masterwork traces humanity&rsquo;s evolutionary leap from prehistoric apes to the infinite cosmos, guided by mysterious black monoliths and a legendary, malfunctioning AI, HAL 9000.',
      cover: 'https://a.ltrbxd.com/resized/film-poster/5/1/5/2/2/51522-2001-a-space-odyssey-0-230-0-345-crop.jpg'
    },
    'shining': {
      title: 'The Shining',
      director: 'Stanley Kubrick',
      meta: '1980 &middot; 146 min &middot; United States',
      quote: '&ldquo;All work and no play makes Jack a dull boy.&rdquo;',
      description: 'As winter caretaker of the isolated Overlook Hotel, Jack Torrance falls prey to the hotel&rsquo;s supernatural, blood-drenched history, descending into violent madness that threatens his psychic son and terrified wife.',
      cover: 'https://a.ltrbxd.com/resized/film-poster/5/1/7/4/0/51740-the-shining-0-230-0-345-crop.jpg'
    },
    'mulholland': {
      title: 'Mulholland Dr.',
      director: 'David Lynch',
      meta: '2001 &middot; 147 min &middot; United States',
      quote: '&ldquo;No hay banda. It is all an illusion.&rdquo;',
      description: 'David Lynch&rsquo;s dreamlike neo-noir masterpiece descends through the dark underbelly of Hollywood as an aspiring actress and a mysterious amnesiac woman unfold a surreal, shifting mystery of identity.',
      cover: 'https://a.ltrbxd.com/resized/film-poster/5/1/5/4/0/51540-mulholland-dr-0-230-0-345-crop.jpg'
    },
    'whiplash': {
      title: 'Whiplash',
      director: 'Damien Chazelle',
      meta: '2014 &middot; 106 min &middot; United States',
      quote: '&ldquo;Not quite my tempo.&rdquo;',
      description: 'Under the brutal, abusive tuition of conservatory jazz instructor Terrence Fletcher, young drummer Andrew Neiman pushes himself beyond the brink of sanity and physical endurance in a manic drive for perfection.',
      cover: 'https://a.ltrbxd.com/resized/film-poster/1/7/5/6/5/4/175654-whiplash-0-230-0-345-crop.jpg'
    },
    'shawshank': {
      title: 'The Shawshank Redemption',
      director: 'Frank Darabont',
      meta: '1994 &middot; 142 min &middot; United States',
      quote: '&ldquo;Hope is a good thing, maybe the best of things, and no good thing ever dies.&rdquo;',
      description: 'Unjustly sentenced to life at Shawshank State Prison, banker Andy Dufresne uses his quiet intelligence, patience, and a small rock hammer to cultivate friendship, build a library, and plot a path to absolute freedom.',
      cover: 'https://a.ltrbxd.com/resized/film-poster/5/1/8/1/8/51818-the-shawshank-redemption-0-230-0-345-crop.jpg'
    }
  };

  // --- DYNAMIC fallback SVG generator ---
  const generateGenericCover = (title, year) => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hues = [15, 45, 200, 220, 342]; 
    const hue = hues[Math.abs(hash) % hues.length];
    
    return `<svg viewBox="0 0 140 200" class="svg-cover" style="width:100%; height:100%; display:block;">
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

  const scoreToStars = (score) => {
    if (!score) return 'Unrated';
    const stars = Math.floor(score / 2);
    const half = score % 2 ? '½' : '';
    return '★'.repeat(stars) + half;
  };

  // --- STATE VARIABLES ---
  let currentCategory = 'films'; 

  // --- DOM ELEMENTS ---
  const btnShelfView = document.getElementById('btn-shelf-view');
  const btnFilmsView = document.getElementById('btn-films-view');
  const btnAnimeView = document.getElementById('btn-anime-view');
  const btnMangaView = document.getElementById('btn-manga-view');
  
  const panelShelfView = document.getElementById('panel-shelf-view');
  const panelListView = document.getElementById('panel-list-view');

  const displayBox = document.getElementById('closet-display');
  const placeholder = displayBox ? displayBox.querySelector('.display-placeholder') : null;
  const content = displayBox ? displayBox.querySelector('.display-content') : null;
  const coverArt = displayBox ? displayBox.querySelector('#display-cover-art') : null;
  const titleEl = displayBox ? displayBox.querySelector('#display-title') : null;
  const directorEl = displayBox ? displayBox.querySelector('#display-director') : null;
  const metaEl = displayBox ? displayBox.querySelector('#display-meta') : null;
  const quoteEl = displayBox ? displayBox.querySelector('#display-quote') : null;
  const descEl = displayBox ? displayBox.querySelector('#display-description') : null;

  const movieGrid = document.getElementById('movie-grid');
  const movieSearch = document.getElementById('movie-search');
  const movieSort = document.getElementById('movie-sort');

  // --- SAFE IMAGE DISPLAY FUNCTION ---
  // Avoids inline onerror strings to prevent html/newline parsing crashes
  const displayCabinetImage = (imageUrl, title, year) => {
    if (!coverArt) return;
    coverArt.innerHTML = '';
    
    if (imageUrl) {
      const img = document.createElement('img');
      img.className = 'img-cover';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '2px';
      img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
      img.alt = title;
      
      img.onerror = () => {
        const fallback = document.createElement('div');
        fallback.className = 'card-fallback-svg-container';
        fallback.innerHTML = generateGenericCover(title, year);
        img.replaceWith(fallback);
      };
      
      img.src = imageUrl;
      coverArt.appendChild(img);
    } else {
      const fallback = document.createElement('div');
      fallback.className = 'card-fallback-svg-container';
      fallback.innerHTML = generateGenericCover(title, year);
      coverArt.appendChild(fallback);
    }
  };

  // --- DISPLAY CASE SYNC UPDATERS ---
  const updateDisplayWithLetterboxd = (film) => {
    if (!displayBox) return;
    content.style.display = 'grid';
    placeholder.style.display = 'none';

    displayCabinetImage(film.image, film.title, film.year);
    titleEl.innerHTML = film.title;
    directorEl.innerHTML = 'Letterboxd Diary';
    metaEl.innerHTML = `${film.year} &middot; Rated ${film.rating || 'No Rating'}`;
    quoteEl.style.display = 'none';
    
    descEl.innerHTML = `This film is part of Sumedh's watched history on Letterboxd. He rated it <strong>${film.rating || 'Unrated'}</strong>.<br><br>
      <a class="btn btn--filled" href="https://letterboxd.com/film/${film.slug}/" target="_blank" rel="noopener" style="margin-top: 0.5rem; display: inline-flex;">
        View on Letterboxd
      </a>`;

    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  const updateDisplayWithAnime = (anime) => {
    if (!displayBox) return;
    content.style.display = 'grid';
    placeholder.style.display = 'none';

    displayCabinetImage(anime.image, anime.title, anime.year);
    titleEl.innerHTML = anime.title;
    directorEl.innerHTML = 'MyAnimeList Entry';
    metaEl.innerHTML = `${anime.year} &middot; Completed &middot; Score: ${anime.score}/10 (${scoreToStars(anime.score)})`;
    quoteEl.style.display = 'none';
    
    const genreTags = anime.genres && anime.genres.length > 0 
      ? `<p class="display-genres" style="font-family: var(--mono); font-size: 0.65rem; color: var(--oxblood-soft); text-transform: uppercase; margin-top: 0.25rem;">${anime.genres.join(' &bull; ')}</p>` 
      : '';

    descEl.innerHTML = `Completed: TV series &bull; <strong>${anime.episodes}</strong> episodes.<br>${genreTags}<br>
      <a class="btn btn--filled" href="${anime.url}" target="_blank" rel="noopener" style="margin-top: 0.5rem; display: inline-flex;">
        View on MyAnimeList
      </a>`;

    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  const updateDisplayWithManga = (manga) => {
    if (!displayBox) return;
    content.style.display = 'grid';
    placeholder.style.display = 'none';

    displayCabinetImage(manga.image, manga.title, manga.year);
    titleEl.innerHTML = manga.title;
    directorEl.innerHTML = 'MyAnimeList Entry';
    metaEl.innerHTML = `${manga.year} &middot; Completed &middot; Score: ${manga.score}/10 (${scoreToStars(manga.score)})`;
    quoteEl.style.display = 'none';
    
    const genreTags = manga.genres && manga.genres.length > 0 
      ? `<p class="display-genres" style="font-family: var(--mono); font-size: 0.65rem; color: var(--oxblood-soft); text-transform: uppercase; margin-top: 0.25rem;">${manga.genres.join(' &bull; ')}</p>` 
      : '';

    descEl.innerHTML = `Completed: <strong>${manga.chapters}</strong> chapters &bull; <strong>${manga.volumes}</strong> volumes.<br>${genreTags}<br>
      <a class="btn btn--filled" href="${manga.url}" target="_blank" rel="noopener" style="margin-top: 0.5rem; display: inline-flex;">
        View on MyAnimeList
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

    displayCabinetImage(data.cover, data.title, 'N/A');
    titleEl.innerHTML = data.title;
    directorEl.innerHTML = data.director;
    metaEl.innerHTML = data.meta;
    
    quoteEl.style.display = 'block';
    quoteEl.innerHTML = data.quote;
    descEl.innerHTML = data.description;
    
    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  // --- FILTERING & SORTING COMPILATION ---
  const getFilteredAndSortedFilms = () => {
    if (!window.mediaDatabase) return [];

    let dataset = [];
    if (currentCategory === 'films') {
      dataset = window.mediaDatabase.films || [];
    } else if (currentCategory === 'anime') {
      dataset = window.mediaDatabase.anime || [];
    } else if (currentCategory === 'manga') {
      dataset = window.mediaDatabase.manga || [];
    }

    const query = movieSearch ? movieSearch.value.toLowerCase() : '';
    const sortBy = movieSort ? movieSort.value : 'default';

    // 1. Filter
    let result = dataset.filter(item => {
      const matchTitle = item.title && item.title.toLowerCase().includes(query);
      const matchYear = item.year && item.year.includes(query);
      const matchGenre = item.genres && item.genres.some(g => g.toLowerCase().includes(query));
      return matchTitle || matchYear || matchGenre;
    });

    // Rating value parser
    const getRatingValue = (item) => {
      if (currentCategory === 'films') {
        const mappings = {
          '★★★★★': 10, '★★★★½': 9, '★★★★': 8, '★★★½': 7, '★★★': 6,
          '★★½': 5, '★★': 4, '★½': 3, '★': 2, '½': 1
        };
        return mappings[item.rating] || 0;
      } else {
        return item.score || 0;
      }
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
      result.sort((a, b) => getRatingValue(b) - getRatingValue(a));
    }

    return result;
  };

  // --- GRID LIST RENDERER ---
  const renderList = () => {
    if (!movieGrid) return;
    movieGrid.innerHTML = '';
    const items = getFilteredAndSortedFilms();

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'grid-item-card';
      card.setAttribute('tabindex', '0');

      let displayRating = '';
      if (currentCategory === 'films') {
        displayRating = item.rating || 'No Rating';
      } else {
        displayRating = item.score ? `${item.score}/10` : 'Unrated';
      }

      if (item.image) {
        const img = document.createElement('img');
        img.className = 'card-poster-img';
        img.loading = 'lazy';
        img.alt = item.title;
        
        img.onerror = () => {
          const fallback = document.createElement('div');
          fallback.className = 'card-fallback-svg-container';
          fallback.innerHTML = generateGenericCover(item.title, item.year);
          img.replaceWith(fallback);
        };
        
        img.src = item.image;
        card.appendChild(img);
      } else {
        const fallback = document.createElement('div');
        fallback.className = 'card-fallback-svg-container';
        fallback.innerHTML = generateGenericCover(item.title, item.year);
        card.appendChild(fallback);
      }

      const overlay = document.createElement('div');
      overlay.className = 'card-hover-overlay';
      overlay.innerHTML = `
        <span class="card-hover-title">${item.title}</span>
        <span class="card-hover-year">${item.year}</span>
      `;
      card.appendChild(overlay);

      card.addEventListener('click', () => {
        const allCards = movieGrid.querySelectorAll('.grid-item-card');
        allCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        if (currentCategory === 'films') {
          updateDisplayWithLetterboxd(item);
        } else if (currentCategory === 'anime') {
          updateDisplayWithAnime(item);
        } else if (currentCategory === 'manga') {
          updateDisplayWithManga(item);
        }
      });

      card.addEventListener('focus', () => {
        card.click();
      });

      movieGrid.appendChild(card);
    });

    const isListActive = btnFilmsView.classList.contains('active') || 
                         btnAnimeView.classList.contains('active') || 
                         btnMangaView.classList.contains('active');

    if (isListActive && items.length > 0) {
      const firstCard = movieGrid.querySelector('.grid-item-card');
      if (firstCard) firstCard.click();
    }
  };

  // --- TAB TOGGLE CONTROLLER ---
  const activateTab = (activeBtn) => {
    [btnShelfView, btnFilmsView, btnAnimeView, btnMangaView].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
  };

  if (btnShelfView) {
    btnShelfView.addEventListener('click', () => {
      activateTab(btnShelfView);
      panelListView.style.display = 'none';
      panelShelfView.style.display = 'flex';
      
      const spines = panelShelfView.querySelectorAll('.spine-item');
      if (spines.length > 0) {
        spines[0].click();
      }
    });
  }

  const handleListTabClick = (category, placeholderText) => {
    currentCategory = category;
    activateTab(category === 'films' ? btnFilmsView : (category === 'anime' ? btnAnimeView : btnMangaView));
    panelShelfView.style.display = 'none';
    panelListView.style.display = 'flex';
    if (movieSearch) {
      movieSearch.value = '';
      movieSearch.placeholder = placeholderText;
    }
    renderList();
  };

  if (btnFilmsView) {
    btnFilmsView.addEventListener('click', () => {
      handleListTabClick('films', 'Search Letterboxd history...');
    });
  }
  if (btnAnimeView) {
    btnAnimeView.addEventListener('click', () => {
      handleListTabClick('anime', 'Search completed anime (title or genre)...');
    });
  }
  if (btnMangaView) {
    btnMangaView.addEventListener('click', () => {
      handleListTabClick('manga', 'Search completed manga (title or genre)...');
    });
  }

  // --- SHELF SPINES HANDLER ---
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

  // --- EVENT LISTENERS FOR SEARCH & SORT ---
  if (movieSearch) {
    movieSearch.addEventListener('input', renderList);
  }
  if (movieSort) {
    movieSort.addEventListener('change', renderList);
  }

  // --- INITIALIZATION ---
  if (spines.length > 0) {
    spines[0].classList.add('selected');
    updateDisplayWithFeatured('2001');
  }
  renderList();

  // --- DYNAMIC "CURRENTLY" STATUS SYSTEM ---
  const currentlyBody = document.querySelector('.currently__body');
  if (currentlyBody && window.mediaDatabase && window.mediaDatabase.currently) {
    const currently = window.mediaDatabase.currently;
    const parts = [];
    
    parts.push('writing the next thing');
    
    if (currently.reading && currently.reading.length > 0) {
      parts.push(`reading <em style="color: var(--ink); font-family: var(--serif); font-weight: 500;">${currently.reading[0]}</em>`);
    }
    if (currently.watching && currently.watching.length > 0) {
      parts.push(`watching <em style="color: var(--ink); font-family: var(--serif); font-weight: 500;">${currently.watching[0]}</em>`);
    }
    
    parts.push('second year, Energy Engineering, IIT Delhi Abu Dhabi');
    currentlyBody.innerHTML = parts.join(' &middot; ');
  }
})();
