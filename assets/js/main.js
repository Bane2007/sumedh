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

  // --- DEFENSIVE DATABASE CHECK ---
  if (!window.mediaDatabase) {
    window.mediaDatabase = {
      films: [],
      anime: [],
      manga: []
    };
  }



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

  const cleanString = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // --- STATE VARIABLES ---
  let currentCategory = 'films'; 

  // --- DOM ELEMENTS ---
  const btnFilmsView = document.getElementById('btn-films-view');
  const btnAnimeView = document.getElementById('btn-anime-view');
  const btnMangaView = document.getElementById('btn-manga-view');
  
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
  // Renders the fallback cover first, then asynchronously replaces it on load
  const displayCabinetImage = (imageUrl, title, year, category) => {
    if (!coverArt) return;
    coverArt.innerHTML = '';
    
    const fallback = document.createElement('div');
    fallback.className = 'card-fallback-svg-container';
    fallback.innerHTML = generateGenericCover(title, year);
    coverArt.appendChild(fallback);
    
    if (imageUrl) {
      const img = document.createElement('img');
      img.className = 'img-cover';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '2px';
      img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
      img.alt = title;
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.onload = () => {
        fallback.replaceWith(img);
      };
      img.src = imageUrl;
    }
  };

  // --- DISPLAY CASE SYNC UPDATERS ---
  const updateDisplayWithLetterboxd = (film) => {
    if (!displayBox) return;
    content.style.display = '';
    placeholder.style.display = 'none';

    displayCabinetImage(film.image, film.title, film.year, 'films');
    titleEl.innerHTML = `<a href="https://letterboxd.com/film/${film.slug}/" target="_blank" rel="noopener">${film.title}</a>`;
    directorEl.innerHTML = 'Letterboxd Record';
    
    const ratingStars = film.rating ? `<span class="rating-stars">${film.rating}</span>` : '<span style="color: var(--ink-soft); font-style: italic;">Unrated</span>';
    metaEl.innerHTML = `${film.year} &middot; ${ratingStars}`;
    quoteEl.style.display = 'none';
    
    const watchRow = film.watched_date && film.watched_date !== 'N/A' 
      ? `<div><dt>Watched</dt><dd>${film.watched_date}</dd></div>` 
      : '';

    descEl.innerHTML = `
      <dl class="display-specs mono">
        ${watchRow}
      </dl>
    `;

    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  const updateDisplayWithAnime = (anime) => {
    if (!displayBox) return;
    content.style.display = '';
    placeholder.style.display = 'none';

    displayCabinetImage(anime.image, anime.title, anime.year, 'anime');
    titleEl.innerHTML = `<a href="${anime.url}" target="_blank" rel="noopener">${anime.title}</a>`;
    
    const animeStatusStr = anime.status === 'watching' ? 'Watching' : 'Completed';
    directorEl.innerHTML = 'MyAnimeList Record';
    
    const scoreStars = anime.score ? '★'.repeat(Math.round(anime.score / 2)) + (anime.score % 2 >= 1 ? '½' : '') : '';
    const ratingDisplay = anime.score ? `<span class="rating-stars">${anime.score}/10 ${scoreStars ? '(' + scoreStars + ')' : ''}</span>` : '<span style="color: var(--ink-soft); font-style: italic;">Unrated</span>';
    metaEl.innerHTML = `${anime.year} &middot; ${animeStatusStr} &middot; ${ratingDisplay}`;
    quoteEl.style.display = 'none';
    
    const genreTags = anime.genres && anime.genres.length > 0 
      ? anime.genres.join(', ') 
      : 'N/A';

    const finishDateStr = anime.status === 'watching' ? 'Watching' : (anime.finish_date || 'N/A');

    descEl.innerHTML = `
      <dl class="display-specs mono">
        <div><dt>Episodes</dt><dd>${anime.episodes || 'N/A'}</dd></div>
        <div><dt>Genres</dt><dd style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${genreTags}</dd></div>
        <div><dt>Started</dt><dd>${anime.start_date || 'N/A'}</dd></div>
        <div><dt>Finished</dt><dd>${finishDateStr}</dd></div>
      </dl>
    `;

    content.style.animation = 'none';
    content.offsetHeight; 
    content.style.animation = null;
  };

  const updateDisplayWithManga = (manga) => {
    if (!displayBox) return;
    content.style.display = '';
    placeholder.style.display = 'none';

    displayCabinetImage(manga.image, manga.title, manga.year, 'manga');
    titleEl.innerHTML = `<a href="${manga.url}" target="_blank" rel="noopener">${manga.title}</a>`;
    
    const mangaStatusStr = manga.status === 'reading' ? 'Reading' : 'Completed';
    directorEl.innerHTML = 'MyAnimeList Record';
    
    const scoreStars = manga.score ? '★'.repeat(Math.round(manga.score / 2)) + (manga.score % 2 >= 1 ? '½' : '') : '';
    const ratingDisplay = manga.score ? `<span class="rating-stars">${manga.score}/10 ${scoreStars ? '(' + scoreStars + ')' : ''}</span>` : '<span style="color: var(--ink-soft); font-style: italic;">Unrated</span>';
    metaEl.innerHTML = `${manga.year} &middot; ${mangaStatusStr} &middot; ${ratingDisplay}`;
    quoteEl.style.display = 'none';
    
    const genreTags = manga.genres && manga.genres.length > 0 
      ? manga.genres.join(', ') 
      : 'N/A';

    const finishDateStr = manga.status === 'reading' ? 'Reading' : (manga.finish_date || 'N/A');

    descEl.innerHTML = `
      <dl class="display-specs mono">
        <div><dt>Chapters</dt><dd>${manga.chapters || 'N/A'}</dd></div>
        <div><dt>Genres</dt><dd style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${genreTags}</dd></div>
        <div><dt>Started</dt><dd>${manga.start_date || 'N/A'}</dd></div>
        <div><dt>Finished</dt><dd>${finishDateStr}</dd></div>
      </dl>
    `;

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
    const cleanQuery = cleanString(query);
    const sortBy = movieSort ? movieSort.value : 'default';

    // 1. Filter
    let result = dataset.filter(item => {
      const matchTitle = cleanString(item.title).includes(cleanQuery);
      const matchEng = item.title_eng && cleanString(item.title_eng).includes(cleanQuery);
      const matchRomaji = item.title_romaji && cleanString(item.title_romaji).includes(cleanQuery);
      const matchLocalized = item.title_localized && cleanString(item.title_localized).includes(cleanQuery);
      
      const matchYear = item.year && String(item.year).includes(query);
      const matchGenre = item.genres && item.genres.some(g => g && String(g).toLowerCase().includes(query));
      
      return matchTitle || matchEng || matchRomaji || matchLocalized || matchYear || matchGenre;
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

      const inner = document.createElement('div');
      inner.className = 'card-inner';

      // Create fallback immediately inside the DOM
      const fallback = document.createElement('div');
      fallback.className = 'card-fallback-svg-container';
      fallback.innerHTML = generateGenericCover(item.title, item.year);
      inner.appendChild(fallback);

      if (item.image) {
        const img = document.createElement('img');
        img.className = 'card-poster-img';
        img.loading = 'lazy';
        img.alt = item.title;
        img.setAttribute('referrerpolicy', 'no-referrer');
        img.style.position = 'absolute';
        img.style.top = '0';
        img.style.left = '0';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.opacity = '0';
        img.style.transition = 'opacity 300ms ease';

        img.onload = () => {
          img.style.opacity = '1';
          fallback.style.display = 'none';
        };
        img.src = item.image;
        inner.appendChild(img);
      }

      const overlay = document.createElement('div');
      overlay.className = 'card-hover-overlay';
      overlay.innerHTML = `
        <span class="card-hover-title">${item.title}</span>
        <span class="card-hover-year">${item.year}</span>
      `;
      inner.appendChild(overlay);

      card.appendChild(inner);

      card.addEventListener('click', (e) => {
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

        if (e && e.isTrusted && window.innerWidth <= 768 && displayBox) {
          displayBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      card.addEventListener('focus', () => {
        card.click();
      });

      movieGrid.appendChild(card);
    });

    if (items.length > 0) {
      placeholder.style.display = 'none';
      content.style.display = '';
      const firstCard = movieGrid.querySelector('.grid-item-card');
      if (firstCard) firstCard.click();
    } else {
      content.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.innerHTML = 'No matches found';
    }
  };

  // --- TAB TOGGLE CONTROLLER ---
  const activateTab = (activeBtn) => {
    [btnFilmsView, btnAnimeView, btnMangaView].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
  };

  const handleListTabClick = (category, placeholderText) => {
    currentCategory = category;
    activateTab(category === 'films' ? btnFilmsView : (category === 'anime' ? btnAnimeView : btnMangaView));
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
      handleListTabClick('anime', 'Search completed & watching anime...');
    });
  }
  if (btnMangaView) {
    btnMangaView.addEventListener('click', () => {
      handleListTabClick('manga', 'Search completed & reading manga...');
    });
  }

  // --- EVENT LISTENERS FOR SEARCH & SORT ---
  if (movieSearch) {
    movieSearch.addEventListener('input', renderList);
    movieSearch.addEventListener('search', renderList);
  }
  if (movieSort) {
    movieSort.addEventListener('change', renderList);
  }

  // --- INITIALIZATION ---
  renderList();
})();
