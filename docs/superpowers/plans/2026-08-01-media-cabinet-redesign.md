# Media Cabinet Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Media Cabinet's cramped two-panel layout with a full-bleed poster grid + slide-in detail/add drawer, and split it out of the 3,100-line `App.jsx` into its own `src/apps/MediaCabinet/` module.

**Architecture:** A `useMediaDb` hook owns all Media Cabinet data/derived state (fetch, category, search/filter/sort, stats, add/delete). Three presentational components (`Toolbar`, `PosterGrid`, `DetailDrawer`) consume that state via props. `MediaCabinet.jsx` is the shell that wires them together and is the only thing `App.jsx` renders for the `cabinet` window.

**Tech Stack:** React 19 (function components + hooks, no new dependencies), plain CSS (matches existing project convention — no CSS modules, one stylesheet per new module), Vite.

## Global Constraints

- No test framework exists in this repo (confirmed: no `test` script in `package.json`). Verification is manual: `vite build` after every task (catches syntax/import errors), and full interactive verification (dev server + click-through) at the end of Task 7.
- Do not modify `scripts/update_media.py`, `.github/workflows/update_films.yml`, or the shape of `public/assets/data/media.js` — sync was already fixed and verified separately (commit `ac3f5dc`).
- Do not touch any of the other 7 apps (`BeatsPlayer`, `PhotosApp`, `LoglineGame`, `CineplayGame`, Debt Desk, About, Contact) beyond the two `films={...}` prop call-sites named explicitly in Task 7.
- `mediaDb.films` must remain available to `LoglineGame`/`CineplayGame` after the refactor — same data, fetched independently (see Task 7).
- Reuse existing CSS custom properties from `src/index.css` `:root` (`--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--oxblood`, `--oxblood-soft`, `--hairline`, `--serif`, `--mono`) — do not invent a new color palette.
- Base path for static assets is `import.meta.env.BASE_URL` (e.g. `${import.meta.env.BASE_URL}assets/data/media.js`) — do not hardcode `/sumedh/`.

---

### Task 1: `mediaUtils.js` — shared poster/rating helpers

**Files:**
- Create: `src/apps/MediaCabinet/mediaUtils.jsx`

**Interfaces:**
- Produces: `generateGenericCover(title: string, year: string|number): string` (returns an SVG string for `dangerouslySetInnerHTML`), `renderStars(rating: string|number): JSX.Element|null`

These are moved verbatim from the top of `src/App.jsx` (lines 4–37 today), which is where they currently live unused by anything except the Media Cabinet JSX block. They stay in `App.jsx` for now (removed only in Task 7, once nothing there calls them anymore) — this task only adds the new copy.

Note: this file contains JSX (`renderStars` returns `<span>`), so it must have a `.jsx` extension, not `.js`, for Vite's esbuild transform to handle it.

- [ ] **Step 1: Create the file**

```jsx
// src/apps/MediaCabinet/mediaUtils.jsx

// Generates a generic cover fallback SVG
export const generateGenericCover = (title, year) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const initial = title ? title.charAt(0).toUpperCase() : '?';
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="100%" height="100%">
      <defs>
        <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 20%, 15%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360}, 25%, 6%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${hash})" />
      <rect x="8" y="8" width="184" height="284" fill="none" stroke="rgba(236,228,211,0.06)" stroke-width="1" />
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="'EB Garamond', Georgia, serif" font-size="72" fill="rgba(236,228,211,0.18)" font-weight="500">${initial}</text>
      <text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="9" fill="rgba(236,228,211,0.35)" letter-spacing="0.1em">${year || 'N/A'}</text>
    </svg>
  `;
};

// Simple helper to render stars
export const renderStars = (rating) => {
  if (!rating) return null;
  if (typeof rating === 'string' && (rating.includes('★') || rating.includes('½'))) {
    return <span className="rating-stars">{rating}</span>;
  }
  const score = parseFloat(rating);
  if (isNaN(score)) return null;
  if (score === 0) return <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>Unrated</span>;

  const starsCount = Math.round(score / 2);
  const starsStr = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
  return <span className="rating-stars">{starsStr} <span style={{ fontSize: '0.62rem', opacity: 0.65 }}>({score}/10)</span></span>;
};
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds (this file isn't imported anywhere yet, so it just needs to parse cleanly — confirm by also running `npx eslint src/apps/MediaCabinet/mediaUtils.jsx` if eslint is configured, otherwise the build step alone is sufficient since nothing references it yet).

- [ ] **Step 3: Commit**

```bash
git add src/apps/MediaCabinet/mediaUtils.jsx
git commit -m "Add shared poster/rating helpers for Media Cabinet redesign"
```

---

### Task 2: `useMediaDb.js` — data + derived state hook

**Files:**
- Create: `src/apps/MediaCabinet/useMediaDb.js`

**Interfaces:**
- Consumes: nothing from earlier tasks (standalone).
- Produces:
  - `fetchMediaDatabase(): Promise<{films: Array, anime: Array, manga: Array}>` — standalone async function, also used directly by `App.jsx` in Task 7.
  - `useMediaDb(): { mediaDb, category, setCategory(cat), search, setSearch(s), sortBy, setSortBy(s), selectedGenre, setSelectedGenre(g), selectedDecade, setSelectedDecade(d), availableGenres: string[], availableDecades: string[], processedItems: Array, stats: {averageRating: string, topGenre: string}, addItem(targetCategory, item), removeItem(targetCategory, itemToRemove) }`

This absorbs the Media Cabinet state and logic currently spread across `App.jsx`'s `mediaDb`/`category`/`search`/`sortBy`/`selectedGenre`/`selectedDecade` state, `getAvailableGenres`/`getAvailableDecades`/`getAverageRating`/`getTopGenre`/`getProcessedItems`, and the add/delete handlers (`handleAddNewItem`/`handleRemoveItem`), all of which are removed from `App.jsx` in Task 7.

- [ ] **Step 1: Create the file**

```js
// src/apps/MediaCabinet/useMediaDb.js
import { useState, useEffect, useCallback, useMemo } from 'react';

const CUSTOM_KEYS = {
  films: 'sumedh_custom_films',
  anime: 'sumedh_custom_anime',
  manga: 'sumedh_custom_manga'
};

function loadCustomItems() {
  try {
    return {
      films: JSON.parse(localStorage.getItem(CUSTOM_KEYS.films) || '[]'),
      anime: JSON.parse(localStorage.getItem(CUSTOM_KEYS.anime) || '[]'),
      manga: JSON.parse(localStorage.getItem(CUSTOM_KEYS.manga) || '[]')
    };
  } catch (e) {
    console.error('Local storage corruption detected. Resetting session state:', e);
    return { films: [], anime: [], manga: [] };
  }
}

export async function fetchMediaDatabase() {
  const res = await fetch(`${import.meta.env.BASE_URL}assets/data/media.js`);
  const text = await res.text();
  return JSON.parse(text.replace('window.mediaDatabase = ', ''));
}

function mergeDatabases(custom, fetched) {
  return {
    films: [...custom.films, ...fetched.films.filter(item => !custom.films.some(c => c.slug === item.slug))],
    anime: [...custom.anime, ...fetched.anime.filter(item => !custom.anime.some(c => c.id === item.id))],
    manga: [...custom.manga, ...fetched.manga.filter(item => !custom.manga.some(c => c.id === item.id))]
  };
}

function itemMatches(category, item, target) {
  return category === 'films' ? item.slug === target.slug : item.id === target.id;
}

function getStarScore(str) {
  if (!str) return 0;
  return (str.split('★').length - 1) + (str.includes('½') ? 0.5 : 0);
}

export function useMediaDb() {
  const [mediaDb, setMediaDb] = useState(() => {
    const custom = loadCustomItems();
    return { films: custom.films, anime: custom.anime, manga: custom.manga };
  });

  const [category, setCategoryState] = useState('films');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');

  useEffect(() => {
    fetchMediaDatabase()
      .then(db => setMediaDb(() => mergeDatabases(loadCustomItems(), db)))
      .catch(err => console.error('Failed to load media database:', err));
  }, []);

  const setCategory = useCallback((cat) => {
    setCategoryState(cat);
    setSearch('');
    setSelectedGenre('');
    setSelectedDecade('');
  }, []);

  const items = mediaDb[category] || [];

  const availableGenres = useMemo(() => {
    const set = new Set();
    items.forEach(item => {
      if (Array.isArray(item.genres)) item.genres.forEach(g => set.add(g));
      else if (item.genre) set.add(item.genre);
    });
    return Array.from(set).sort();
  }, [items]);

  const availableDecades = useMemo(() => {
    const set = new Set();
    items.forEach(item => {
      const yr = parseInt(item.year || 0);
      if (yr) set.add(`${Math.floor(yr / 10) * 10}s`);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [items]);

  const processedItems = useMemo(() => {
    let result = [...items];

    if (selectedGenre) {
      result = result.filter(item =>
        Array.isArray(item.genres) ? item.genres.includes(selectedGenre) : item.genre === selectedGenre
      );
    }
    if (selectedDecade) {
      result = result.filter(item => {
        const yr = parseInt(item.year || 0);
        return yr && `${Math.floor(yr / 10) * 10}s` === selectedDecade;
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.year && item.year.toString().includes(q)) ||
        (item.director && item.director.toLowerCase().includes(q)) ||
        (item.genres && item.genres.some(g => g.toLowerCase().includes(q)))
      );
    }

    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'chronological') {
      result.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
    } else if (sortBy === 'rating') {
      if (category === 'films') {
        result.sort((a, b) => {
          const aStars = getStarScore(a.rating);
          const bStars = getStarScore(b.rating);
          const aScore = aStars > 0 ? aStars * 2 : parseFloat(a.imdb_rating) || 0;
          const bScore = bStars > 0 ? bStars * 2 : parseFloat(b.imdb_rating) || 0;
          return bScore - aScore;
        });
      } else {
        result.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
      }
    } else {
      if (category === 'films') {
        const dated = result.filter(f => f.watched_date && f.watched_date !== 'N/A');
        const undated = result.filter(f => !f.watched_date || f.watched_date === 'N/A');
        dated.sort((a, b) => b.watched_date.localeCompare(a.watched_date));
        result = [...dated, ...undated];
      } else {
        result.sort((a, b) => (b.sort_date || '').localeCompare(a.sort_date || ''));
      }
    }

    return result;
  }, [items, category, selectedGenre, selectedDecade, search, sortBy]);

  const stats = useMemo(() => {
    if (processedItems.length === 0) return { averageRating: '0.0', topGenre: 'N/A' };

    let total = 0;
    const genreMap = {};
    processedItems.forEach(item => {
      if (category === 'films') {
        const starScore = getStarScore(item.rating);
        total += starScore > 0 ? starScore * 2 : parseFloat(item.imdb_rating) || 0;
      } else {
        const personal = parseFloat(item.my_rating);
        total += !isNaN(personal) ? personal : parseFloat(item.score || item.rating) || 8.0;
      }
      const genres = Array.isArray(item.genres) ? item.genres : (item.genre ? [item.genre] : []);
      genres.forEach(g => { genreMap[g] = (genreMap[g] || 0) + 1; });
    });

    let topGenre = 'N/A';
    let max = 0;
    Object.entries(genreMap).forEach(([g, count]) => {
      if (count > max) { max = count; topGenre = g; }
    });

    return { averageRating: (total / processedItems.length).toFixed(1), topGenre };
  }, [processedItems, category]);

  const addItem = useCallback((targetCategory, item) => {
    setMediaDb(prev => {
      const updated = { ...prev, [targetCategory]: [item, ...prev[targetCategory]] };
      const customKey = CUSTOM_KEYS[targetCategory];
      const existingCustom = JSON.parse(localStorage.getItem(customKey) || '[]');
      localStorage.setItem(customKey, JSON.stringify([item, ...existingCustom]));
      return updated;
    });

    fetch('/api/log-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: targetCategory, item })
    })
      .then(r => r.json())
      .then(data => { if (data.success) console.log('Local database disk file synced successfully!'); })
      .catch(() => console.warn('Production environment fallback: Local API write ignored. Saved in session memory.'));
  }, []);

  const removeItem = useCallback((targetCategory, itemToRemove) => {
    setMediaDb(prev => {
      const updatedList = prev[targetCategory].filter(item => !itemMatches(targetCategory, item, itemToRemove));
      const customKey = CUSTOM_KEYS[targetCategory];
      const existingCustom = JSON.parse(localStorage.getItem(customKey) || '[]');
      const filteredCustom = existingCustom.filter(item => !itemMatches(targetCategory, item, itemToRemove));
      localStorage.setItem(customKey, JSON.stringify(filteredCustom));
      return { ...prev, [targetCategory]: updatedList };
    });

    fetch('/api/delete-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: targetCategory, itemToRemove })
    })
      .then(r => r.json())
      .then(data => { if (data.success) console.log('Local database disk file synced successfully!'); })
      .catch(() => console.warn('Production environment fallback: Local API write ignored.'));
  }, []);

  return {
    mediaDb, category, setCategory, search, setSearch, sortBy, setSortBy,
    selectedGenre, setSelectedGenre, selectedDecade, setSelectedDecade,
    availableGenres, availableDecades, processedItems, stats, addItem, removeItem
  };
}
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds (pure JS, no JSX — `.js` extension is correct here).

- [ ] **Step 3: Commit**

```bash
git add src/apps/MediaCabinet/useMediaDb.js
git commit -m "Add useMediaDb hook for Media Cabinet data/filter/sort/stats state"
```

---

### Task 3: `PosterGrid.jsx` — full-bleed poster grid

**Files:**
- Create: `src/apps/MediaCabinet/PosterGrid.jsx`

**Interfaces:**
- Consumes: `generateGenericCover` from `./mediaUtils.jsx` (Task 1).
- Produces: default export `PosterGrid({ items, category, selectedItem, onSelectItem, onRemoveItem })` — `items` is the already-filtered/sorted array (from `useMediaDb().processedItems`), `selectedItem` is the currently-open-in-drawer item or `null`, `onSelectItem(item)` and `onRemoveItem(item)` are callbacks.

- [ ] **Step 1: Create the file**

```jsx
// src/apps/MediaCabinet/PosterGrid.jsx
import { generateGenericCover } from './mediaUtils.jsx';

function getCardRatingBadge(category, item) {
  if (category === 'films') {
    return item.rating || null;
  }
  const personal = parseFloat(item.my_rating);
  if (isNaN(personal)) return null;
  return '★'.repeat(Math.round(personal / 2));
}

function PosterGrid({ items, category, selectedItem, onSelectItem, onRemoveItem }) {
  if (items.length === 0) {
    return <div className="mc-grid-empty mono">[ No matching titles found on the shelf ]</div>;
  }

  return (
    <div className="mc-grid">
      {items.map((item, index) => {
        const isSelected = selectedItem && (
          category === 'films' ? selectedItem.slug === item.slug : selectedItem.id === item.id
        );
        const ratingBadge = getCardRatingBadge(category, item);

        return (
          <div
            key={category === 'films' ? item.slug : item.id}
            className={`mc-card ${isSelected ? 'mc-card--selected' : ''}`}
            style={{ animationDelay: `${index * 12}ms` }}
            tabIndex="0"
            onClick={() => onSelectItem(item)}
            onFocus={() => onSelectItem(item)}
          >
            {item.isCustom && (
              <button
                className="mc-card-delete-btn"
                onClick={(e) => { e.stopPropagation(); onRemoveItem(item); }}
                title="Delete custom entry"
              >
                DELETE
              </button>
            )}

            <div className="mc-card-poster">
              {item.image ? (
                <img src={item.image} alt={item.title} loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: generateGenericCover(item.title, item.year) }} />
              )}

              {(item.status === 'watching' || item.status === 'reading') && (
                <div className="mc-card-status mono">{item.status}</div>
              )}

              {ratingBadge && <div className="mc-card-rating mono">{ratingBadge}</div>}

              <div className="mc-card-hover-overlay">
                <span className="mc-card-hover-title">{item.title}</span>
                <span className="mc-card-hover-year">{item.year}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default PosterGrid;
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/MediaCabinet/PosterGrid.jsx
git commit -m "Add PosterGrid component for Media Cabinet redesign"
```

---

### Task 4: `DetailDrawer.jsx` — view + add-entry drawer

**Files:**
- Create: `src/apps/MediaCabinet/DetailDrawer.jsx`

**Interfaces:**
- Consumes: `generateGenericCover`, `renderStars` from `./mediaUtils.jsx` (Task 1).
- Produces: default export `DetailDrawer({ mode, category, item, onClose, onAddItem })` — `mode` is `'view' | 'add' | null` (`null` renders nothing), `item` is the selected item for `'view'` mode (ignored in `'add'` mode), `onClose()` closes the drawer, `onAddItem(category, item)` is called with a fully-built item object when the add form is submitted.

- [ ] **Step 1: Create the file**

```jsx
// src/apps/MediaCabinet/DetailDrawer.jsx
import { useState, useEffect } from 'react';
import { generateGenericCover, renderStars } from './mediaUtils.jsx';

function getMyRatingValue(item) {
  if (!item) return 'N/A';
  const personal = parseFloat(item.my_rating);
  return !isNaN(personal) ? personal.toFixed(1) + '/10' : 'N/A';
}

function getMalScoreValue(item) {
  if (!item) return 'N/A';
  const score = parseFloat(item.score);
  return !isNaN(score) ? score.toFixed(1) + '/10' : 'N/A';
}

function useItemDescription(item, category, mode) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mode !== 'view' || !item) {
      setDescription('');
      return;
    }
    if (category === 'films') {
      setDescription(item.plot || '');
      return;
    }

    setDescription('');
    setIsLoading(true);
    const cacheKey = `desc_${category}_${item.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setDescription(cached);
      setIsLoading(false);
      return;
    }

    fetch(`https://api.jikan.moe/v4/${category}/${item.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Jikan failed');
        return res.json();
      })
      .then(json => {
        const syn = json.data?.synopsis || 'No description available.';
        localStorage.setItem(cacheKey, syn);
        setDescription(syn);
        setIsLoading(false);
      })
      .catch(() => {
        setDescription('Failed to load description.');
        setIsLoading(false);
      });
  }, [item, category, mode]);

  return { description, isLoading };
}

const FILM_STAR_OPTIONS = [
  ['★★★★★', '★★★★★ (10/10)'],
  ['★★★★½', '★★★★½ (9/10)'],
  ['★★★★', '★★★★ (8/10)'],
  ['★★★½', '★★★½ (7/10)'],
  ['★★★', '★★★ (6/10)'],
  ['★★½', '★★½ (5/10)'],
  ['★★', '★★ (4/10)'],
  ['★', '★ (2/10)']
];

function buildEmptyForm(category) {
  return { title: '', year: '', image: '', rating: category === 'films' ? '★★★★★' : '8.0', personalRating: '8.5', director: '', genres: '' };
}

function AddItemForm({ category, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => buildEmptyForm(category));
  const [jikanSearch, setJikanSearch] = useState('');
  const [jikanResults, setJikanResults] = useState([]);
  const [searchingJikan, setSearchingJikan] = useState(false);

  useEffect(() => {
    setForm(buildEmptyForm(category));
    setJikanSearch('');
    setJikanResults([]);
  }, [category]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const searchJikan = async () => {
    if (!jikanSearch.trim()) return;
    setSearchingJikan(true);
    setJikanResults([]);
    try {
      const type = category === 'anime' ? 'anime' : 'manga';
      const res = await fetch(`https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(jikanSearch)}&limit=5`);
      if (res.ok) {
        const json = await res.json();
        setJikanResults(json.data || []);
      }
    } catch (e) {
      console.error('Jikan API error:', e);
    } finally {
      setSearchingJikan(false);
    }
  };

  const selectJikanResult = (res) => {
    const yr = res.aired?.prop?.from?.year || res.published?.prop?.from?.year || '';
    setForm(f => ({
      ...f,
      title: res.title,
      year: yr ? yr.toString() : '',
      genres: res.genres?.map(g => g.name).join(', ') || '',
      rating: res.score ? res.score.toString() : '8.0',
      image: res.images?.jpg?.large_image_url || res.images?.jpg?.image_url || ''
    }));
    setJikanResults([]);
    setJikanSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const item = {
      title: form.title.trim(),
      year: form.year.trim() || new Date().getFullYear().toString(),
      image: form.image.trim() || '',
      rating: category === 'films' ? form.rating : undefined,
      score: category !== 'films' ? parseFloat(form.rating) || 8.0 : undefined,
      my_rating: category !== 'films' ? parseFloat(form.personalRating) || 8.5 : undefined,
      director: category === 'films' ? form.director.trim() || 'N/A' : undefined,
      genres: category !== 'films' ? form.genres.split(',').map(g => g.trim()).filter(Boolean) : undefined,
      slug: category === 'films' ? form.title.trim().toLowerCase().replace(/\s+/g, '-') : undefined,
      id: category !== 'films' ? Math.floor(Math.random() * 100000) : undefined,
      status: category !== 'films' ? 'completed' : undefined,
      episodes_watched: category === 'anime' ? 12 : undefined,
      chapters: category === 'manga' ? 50 : undefined,
      volumes: category === 'manga' ? 5 : undefined,
      start_date: 'N/A',
      finish_date: 'N/A',
      sort_date: new Date().toISOString().split('T')[0],
      isCustom: true
    };

    onSubmit(item);
  };

  return (
    <form onSubmit={handleSubmit} className="mc-add-form mono">
      <div className="mc-drawer-header-row">
        <span className="mc-drawer-title-label">[ Log New {category.slice(0, -1)} ]</span>
        <button type="button" className="mc-drawer-close" onClick={onCancel}>[ CANCEL ]</button>
      </div>

      {category !== 'films' && (
        <div className="mc-jikan-assist">
          <div className="mc-jikan-assist-label">[ AUTO-COMPLETE FROM MYANIMELIST ]</div>
          <div className="mc-jikan-assist-row">
            <input
              type="text"
              value={jikanSearch}
              onChange={(e) => setJikanSearch(e.target.value)}
              placeholder="Search e.g. Naruto..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchJikan(); } }}
            />
            <button type="button" onClick={searchJikan}>{searchingJikan ? '...' : 'SEARCH'}</button>
          </div>
          {jikanResults.length > 0 && (
            <div className="mc-jikan-results">
              {jikanResults.map(res => (
                <div key={res.mal_id} className="mc-jikan-result" onClick={() => selectJikanResult(res)}>
                  {res.title} ({res.aired?.prop?.from?.year || res.published?.prop?.from?.year || 'N/A'})
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mc-form-row">
        <label>Title:</label>
        <input type="text" value={form.title} onChange={set('title')} placeholder="Enter title..." required />
      </div>
      <div className="mc-form-row">
        <label>Cover URL:</label>
        <input type="url" value={form.image} onChange={set('image')} placeholder="https://..." />
      </div>
      <div className="mc-form-row">
        <label>Year:</label>
        <input type="text" value={form.year} onChange={set('year')} placeholder="e.g. 2026" />
      </div>
      <div className="mc-form-row">
        <label>{category === 'films' ? 'Rating:' : 'Scores (1-10):'}</label>
        {category === 'films' ? (
          <select value={form.rating} onChange={set('rating')}>
            {FILM_STAR_OPTIONS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        ) : (
          <div className="mc-form-dual">
            <span>General: <input type="number" min="1" max="10" step="0.1" value={form.rating} onChange={set('rating')} /></span>
            <span>Mine: <input type="number" min="1" max="10" step="0.1" value={form.personalRating} onChange={set('personalRating')} /></span>
          </div>
        )}
      </div>
      {category === 'films' ? (
        <div className="mc-form-row">
          <label>Director:</label>
          <input type="text" value={form.director} onChange={set('director')} placeholder="Director name..." />
        </div>
      ) : (
        <div className="mc-form-row">
          <label>Genres:</label>
          <input type="text" value={form.genres} onChange={set('genres')} placeholder="Action, Sci-Fi..." />
        </div>
      )}
      <button type="submit" className="mc-submit-btn">[ SAVE TO SHELF ]</button>
    </form>
  );
}

function DetailView({ item, category }) {
  const { description, isLoading } = useItemDescription(item, category, 'view');

  return (
    <div className="mc-detail-view">
      {item.image ? (
        <img className="mc-detail-poster" src={item.image} alt={item.title} referrerPolicy="no-referrer" />
      ) : (
        <div className="mc-detail-poster" dangerouslySetInnerHTML={{ __html: generateGenericCover(item.title, item.year) }} />
      )}

      <h3 className="mc-detail-title">
        {category === 'films' ? (
          <a href={`https://letterboxd.com/film/${item.slug}/`} target="_blank" rel="noopener">{item.title}</a>
        ) : (
          <a href={item.url || '#'} target="_blank" rel="noopener">{item.title}</a>
        )}
      </h3>

      <p className="mc-detail-subline mono">
        {category === 'films'
          ? (item.director && item.director !== 'N/A' ? `Directed by ${item.director}` : 'Letterboxd Record')
          : (item.status === 'watching' || item.status === 'reading'
              ? <span className="mc-status-highlight">Currently {item.status}</span>
              : 'Completed Title')}
      </p>

      <div className="mc-detail-meta mono">
        {item.year} &middot; {category === 'films' ? renderStars(item.rating) : <span>MAL Score: {getMalScoreValue(item)}</span>}
        {category === 'films' && item.imdb_rating && item.imdb_rating !== 'N/A' && (
          <> &middot; <span className="mc-imdb-badge">{item.imdb_rating}/10 (IMDb)</span></>
        )}
      </div>

      <dl className="mc-detail-specs mono">
        <div><dt>Status</dt><dd>{item.status || (category === 'films' ? 'watched' : 'completed')}</dd></div>
        {category === 'anime' && <div><dt>Progress</dt><dd>{item.episodes_watched} eps</dd></div>}
        {category === 'manga' && (
          <>
            <div><dt>Chapters</dt><dd>{item.chapters || 0} chs</dd></div>
            <div><dt>Volumes</dt><dd>{item.volumes || 0} vols</dd></div>
          </>
        )}
        {item.start_date && item.start_date !== 'N/A' && <div><dt>Started</dt><dd>{item.start_date}</dd></div>}
        {item.finish_date && item.finish_date !== 'N/A' && <div><dt>Finished</dt><dd>{item.finish_date}</dd></div>}
        {category !== 'films' && <div><dt>My Rating</dt><dd>{getMyRatingValue(item)}</dd></div>}
      </dl>

      {item.genres && item.genres.length > 0 && (
        <div className="mc-detail-row mono"><span className="mc-detail-row-label">Genres:</span>{item.genres.join(', ')}</div>
      )}
      {category === 'films' && item.cast && item.cast !== 'N/A' && (
        <div className="mc-detail-row mono"><span className="mc-detail-row-label">Cast:</span>{item.cast}</div>
      )}

      <div className="mc-detail-description">
        {category === 'films'
          ? (item.plot && item.plot !== 'N/A' && <p>{item.plot}</p>)
          : (isLoading ? <p className="mc-detail-loading">[ Loading description from MyAnimeList... ]</p> : description && <p>{description}</p>)}
      </div>
    </div>
  );
}

function DetailDrawer({ mode, category, item, onClose, onAddItem }) {
  useEffect(() => {
    if (!mode) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, onClose]);

  if (!mode) return null;

  return (
    <>
      <div className="mc-drawer-scrim" onClick={onClose} />
      <div className={`mc-drawer ${mode === 'add' ? 'mc-drawer--add' : ''}`}>
        {mode === 'view' && item && (
          <>
            <button className="mc-drawer-close-x" onClick={onClose} aria-label="Close">×</button>
            <DetailView item={item} category={category} />
          </>
        )}
        {mode === 'add' && (
          <AddItemForm category={category} onSubmit={(newItem) => onAddItem(category, newItem)} onCancel={onClose} />
        )}
      </div>
    </>
  );
}

export default DetailDrawer;
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/MediaCabinet/DetailDrawer.jsx
git commit -m "Add DetailDrawer component (view + add-entry modes) for Media Cabinet"
```

---

### Task 5: `Toolbar.jsx` — category tabs, search, filters, sort, stats, LOG button

**Files:**
- Create: `src/apps/MediaCabinet/Toolbar.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure presentational).
- Produces: default export `Toolbar({ category, onCategoryChange, search, onSearchChange, selectedGenre, onGenreChange, availableGenres, selectedDecade, onDecadeChange, availableDecades, sortBy, onSortChange, stats, totalCount, onOpenAddForm })`.

- [ ] **Step 1: Create the file**

```jsx
// src/apps/MediaCabinet/Toolbar.jsx

function Toolbar({
  category, onCategoryChange,
  search, onSearchChange,
  selectedGenre, onGenreChange, availableGenres,
  selectedDecade, onDecadeChange, availableDecades,
  sortBy, onSortChange,
  stats, totalCount,
  onOpenAddForm
}) {
  const searchPlaceholder = category === 'films'
    ? 'Search Letterboxd history...'
    : category === 'anime' ? 'Search completed & watching...' : 'Search completed & reading...';

  return (
    <div className="mc-toolbar">
      <div className="mc-toolbar-tabs">
        {['films', 'anime', 'manga'].map(cat => (
          <button
            key={cat}
            className={`mc-tab-btn ${category === cat ? 'mc-tab-btn--active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="mc-toolbar-search">
        <input
          type="search"
          className="mono"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <select className="mc-toolbar-select mono" value={selectedGenre} onChange={(e) => onGenreChange(e.target.value)}>
        <option value="">All Genres</option>
        {availableGenres.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      <select className="mc-toolbar-select mono" value={selectedDecade} onChange={(e) => onDecadeChange(e.target.value)}>
        <option value="">All Decades</option>
        {availableDecades.map(d => <option key={d} value={d}>{d}</option>)}
      </select>

      <select className="mc-toolbar-select mono" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
        <option value="recent">Sort: Recent Log</option>
        <option value="title">Sort: Alphabetical</option>
        <option value="chronological">Sort: Release Year</option>
        <option value="rating">Sort: Personal Rating</option>
      </select>

      <div className="mc-toolbar-stats mono">
        <span>{totalCount} watched</span>
        <span>{stats.averageRating}/10 avg</span>
        <span>{stats.topGenre}</span>
      </div>

      <button className="mc-log-btn mono" onClick={onOpenAddForm}>+ LOG</button>
    </div>
  );
}

export default Toolbar;
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/MediaCabinet/Toolbar.jsx
git commit -m "Add Toolbar component for Media Cabinet redesign"
```

---

### Task 6: `MediaCabinet.jsx` shell + `MediaCabinet.css`

**Files:**
- Create: `src/apps/MediaCabinet/MediaCabinet.jsx`
- Create: `src/apps/MediaCabinet/MediaCabinet.css`

**Interfaces:**
- Consumes: `useMediaDb` (Task 2), `Toolbar` (Task 5), `PosterGrid` (Task 3), `DetailDrawer` (Task 4).
- Produces: default export `MediaCabinet()` — a complete, self-contained React component with no required props. `App.jsx` (Task 7) renders `<MediaCabinet />` for the `cabinet` window with no props passed.

- [ ] **Step 1: Create `MediaCabinet.jsx`**

```jsx
// src/apps/MediaCabinet/MediaCabinet.jsx
import { useState } from 'react';
import { useMediaDb } from './useMediaDb';
import Toolbar from './Toolbar';
import PosterGrid from './PosterGrid';
import DetailDrawer from './DetailDrawer';
import './MediaCabinet.css';

function MediaCabinet() {
  const {
    category, setCategory, search, setSearch, sortBy, setSortBy,
    selectedGenre, setSelectedGenre, selectedDecade, setSelectedDecade,
    availableGenres, availableDecades, processedItems, stats, addItem, removeItem
  } = useMediaDb();

  const [drawer, setDrawer] = useState({ mode: null, item: null });

  const handleSelectItem = (item) => setDrawer({ mode: 'view', item });
  const handleOpenAddForm = () => setDrawer({ mode: 'add', item: null });
  const handleCloseDrawer = () => setDrawer({ mode: null, item: null });

  const handleAddItem = (targetCategory, item) => {
    addItem(targetCategory, item);
    handleCloseDrawer();
  };

  const handleRemoveItem = (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}" from your shelf?`)) return;
    removeItem(category, item);
    const isOpenInDrawer = drawer.mode === 'view' && drawer.item &&
      (category === 'films' ? drawer.item.slug === item.slug : drawer.item.id === item.id);
    if (isOpenInDrawer) handleCloseDrawer();
  };

  return (
    <section className="mc-root">
      <Toolbar
        category={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        availableGenres={availableGenres}
        selectedDecade={selectedDecade}
        onDecadeChange={setSelectedDecade}
        availableDecades={availableDecades}
        sortBy={sortBy}
        onSortChange={setSortBy}
        stats={stats}
        totalCount={processedItems.length}
        onOpenAddForm={handleOpenAddForm}
      />

      <PosterGrid
        items={processedItems}
        category={category}
        selectedItem={drawer.mode === 'view' ? drawer.item : null}
        onSelectItem={handleSelectItem}
        onRemoveItem={handleRemoveItem}
      />

      <DetailDrawer
        mode={drawer.mode}
        category={category}
        item={drawer.item}
        onClose={handleCloseDrawer}
        onAddItem={handleAddItem}
      />
    </section>
  );
}

export default MediaCabinet;
```

- [ ] **Step 2: Create `MediaCabinet.css`**

```css
/* src/apps/MediaCabinet/MediaCabinet.css */

.mc-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* Toolbar */
.mc-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--hairline);
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.mc-toolbar-tabs { display: flex; gap: 6px; }

.mc-tab-btn {
  background: transparent;
  border: 1px solid var(--hairline);
  color: var(--ink-soft);
  font-family: var(--mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 5px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 150ms ease;
}
.mc-tab-btn:hover { color: var(--ink); border-color: var(--oxblood-soft); }
.mc-tab-btn--active { background: var(--oxblood); border-color: var(--oxblood); color: var(--paper-deep); font-weight: bold; }

.mc-toolbar-search { flex: 1; min-width: 160px; }
.mc-toolbar-search input {
  width: 100%;
  background: var(--paper-deep);
  border: 1px solid var(--hairline);
  color: var(--ink);
  padding: 6px 10px;
  font-size: 0.8rem;
  border-radius: 3px;
  outline: none;
  box-sizing: border-box;
}
.mc-toolbar-search input:focus { border-color: var(--oxblood-soft); }

.mc-toolbar-select {
  background: var(--paper-deep);
  border: 1px solid var(--hairline);
  color: var(--ink-soft);
  font-size: 0.65rem;
  padding: 5px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.mc-toolbar-stats { display: flex; gap: 10px; font-size: 0.6rem; color: var(--ink-soft); white-space: nowrap; }
.mc-toolbar-stats span { border: 1px solid var(--hairline); padding: 3px 7px; border-radius: 3px; }

.mc-log-btn {
  background: var(--oxblood);
  border: none;
  color: var(--paper-deep);
  font-weight: bold;
  font-size: 0.68rem;
  padding: 6px 14px;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
}
.mc-log-btn:hover { background: var(--oxblood-soft); }

/* Poster grid */
.mc-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
  padding: 16px;
  align-content: start;
}

.mc-grid-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 0.75rem;
}

.mc-card {
  position: relative;
  aspect-ratio: 2 / 3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid transparent;
  transition: transform 180ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 180ms ease, border-color 180ms ease;
  animation: mc-card-in 260ms ease backwards;
}
@keyframes mc-card-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mc-card:hover, .mc-card:focus { transform: scale(1.05); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55); outline: none; }
.mc-card--selected { border-color: var(--oxblood); }

.mc-card-poster { position: relative; width: 100%; height: 100%; background: var(--paper-deep); }
.mc-card-poster img, .mc-card-poster > div { width: 100%; height: 100%; object-fit: cover; display: block; }

.mc-card-status {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(255, 76, 90, 0.92);
  color: #fff;
  font-size: 0.52rem;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.04em;
}

.mc-card-rating {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffb400;
  font-size: 0.55rem;
  padding: 2px 5px;
  border-radius: 3px;
}

.mc-card-hover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.15) 55%, transparent 100%);
  opacity: 0;
  transition: opacity 180ms ease;
}
.mc-card:hover .mc-card-hover-overlay, .mc-card:focus .mc-card-hover-overlay { opacity: 1; }
.mc-card-hover-title { font-family: var(--serif); font-size: 0.78rem; color: var(--ink); line-height: 1.2; }
.mc-card-hover-year { font-family: var(--mono); font-size: 0.6rem; color: var(--ink-soft); margin-top: 2px; }

.mc-card-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  background: rgba(255, 23, 68, 0.95);
  color: #fff;
  border: none;
  border-radius: 3px;
  font-size: 0.52rem;
  padding: 2px 5px;
  cursor: pointer;
  font-family: var(--mono);
  font-weight: bold;
}

/* Detail drawer */
.mc-drawer-scrim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 40;
  animation: mc-scrim-in 180ms ease;
}
@keyframes mc-scrim-in { from { opacity: 0; } to { opacity: 1; } }

.mc-drawer {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 90%;
  background: var(--paper-deep);
  border-left: 1px solid var(--hairline);
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.5);
  z-index: 41;
  overflow-y: auto;
  padding: 20px;
  box-sizing: border-box;
  animation: mc-drawer-in 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes mc-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

.mc-drawer-close-x {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: var(--ink-soft);
  font-size: 1.3rem;
  cursor: pointer;
  line-height: 1;
}
.mc-drawer-close-x:hover { color: var(--oxblood); }

.mc-detail-view { display: flex; flex-direction: column; gap: 14px; }
.mc-detail-poster { width: 160px; height: 228px; border-radius: 4px; object-fit: cover; align-self: center; }
.mc-detail-title { font-family: var(--serif); font-size: 1.4rem; margin: 0; text-align: center; }
.mc-detail-title a { color: var(--ink); text-decoration: none; }
.mc-detail-title a:hover { color: var(--oxblood-soft); }
.mc-detail-subline { text-align: center; font-size: 0.68rem; color: var(--ink-soft); margin: 0; }
.mc-status-highlight { color: var(--oxblood-soft); }
.mc-detail-meta { text-align: center; font-size: 0.68rem; color: var(--ink-soft); }
.mc-imdb-badge { color: #ffb400; font-weight: bold; }

.mc-detail-specs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  font-size: 0.62rem;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  padding: 10px 0;
  margin: 0;
}
.mc-detail-specs dt { color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; }
.mc-detail-specs dd { margin: 2px 0 0 0; color: var(--ink); }

.mc-detail-row { font-size: 0.65rem; }
.mc-detail-row-label { color: var(--ink-soft); text-transform: uppercase; margin-right: 6px; }

.mc-detail-description { font-size: 0.85rem; line-height: 1.55; color: var(--ink); }
.mc-detail-loading { opacity: 0.6; font-style: italic; }

/* Add-entry form (rendered inside the same drawer) */
.mc-add-form { display: flex; flex-direction: column; gap: 10px; }
.mc-drawer-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.mc-drawer-title-label { color: var(--oxblood); font-size: 0.75rem; font-weight: bold; }
.mc-drawer-close { background: none; border: none; color: var(--oxblood-soft); cursor: pointer; font-size: 0.62rem; }

.mc-jikan-assist { background: rgba(255, 255, 255, 0.03); border: 1px dashed var(--hairline); padding: 8px; border-radius: 4px; }
.mc-jikan-assist-label { font-size: 0.6rem; color: var(--ink-soft); margin-bottom: 4px; }
.mc-jikan-assist-row { display: flex; gap: 8px; }
.mc-jikan-assist-row input { flex: 1; background: var(--paper); border: 1px solid var(--hairline); color: var(--ink); padding: 3px 6px; font-size: 0.72rem; }
.mc-jikan-assist-row button { background: var(--paper); border: 1px solid var(--hairline); color: var(--ink); padding: 2px 8px; font-size: 0.65rem; cursor: pointer; }
.mc-jikan-results { background: #000; border: 1px solid var(--hairline); margin-top: 6px; max-height: 100px; overflow-y: auto; }
.mc-jikan-result { padding: 4px; border-bottom: 1px solid var(--hairline); font-size: 0.65rem; cursor: pointer; }
.mc-jikan-result:hover { background: rgba(255, 255, 255, 0.05); }

.mc-form-row { display: flex; align-items: center; font-size: 0.72rem; gap: 8px; }
.mc-form-row label { width: 80px; flex-shrink: 0; color: var(--ink-soft); }
.mc-form-row input, .mc-form-row select { flex: 1; background: var(--paper); border: 1px solid var(--hairline); color: var(--ink); padding: 4px 8px; }
.mc-form-dual { display: flex; gap: 14px; flex: 1; font-size: 0.7rem; color: var(--ink-soft); }
.mc-form-dual input { width: 70px; margin-left: 6px; background: var(--paper); border: 1px solid var(--hairline); color: var(--ink); padding: 4px 6px; }

.mc-submit-btn {
  background: var(--oxblood);
  border: none;
  color: var(--paper-deep);
  font-weight: bold;
  padding: 8px 12px;
  font-size: 0.72rem;
  cursor: pointer;
  border-radius: 3px;
  margin-top: 4px;
}
.mc-submit-btn:hover { background: var(--oxblood-soft); }

/* Narrow window: drawer becomes a bottom sheet */
@media (max-width: 768px) {
  .mc-toolbar { padding: 8px 10px; }
  .mc-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; padding: 10px; }
  .mc-drawer {
    top: auto;
    left: 0;
    right: 0;
    width: auto;
    max-width: 100%;
    height: 75%;
    border-left: none;
    border-top: 1px solid var(--hairline);
    border-radius: 12px 12px 0 0;
    animation: mc-drawer-in-bottom 220ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes mc-drawer-in-bottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
}
```

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/apps/MediaCabinet/MediaCabinet.jsx src/apps/MediaCabinet/MediaCabinet.css
git commit -m "Add MediaCabinet shell component wiring toolbar, grid, and drawer"
```

---

### Task 7: Integrate into `App.jsx`, remove dead code, verify end-to-end

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `MediaCabinet` (default export, Task 6), `fetchMediaDatabase` (named export, Task 2).
- Produces: nothing further downstream — this is the final integration task.

This task removes everything Media-Cabinet-specific from `App.jsx` and replaces it with `<MediaCabinet />`. Because state declarations, effects, handlers, and JSX are removed together, do these edits in the order below within a single pass (do not run `vite build` between individual sub-steps — only after all of them, in Step 9).

- [ ] **Step 1: Add imports**

At the top of `src/App.jsx`, change:

```js
import { useState, useEffect, useRef } from 'react';
```

to:

```js
import { useState, useEffect, useRef } from 'react';
import MediaCabinet from './apps/MediaCabinet/MediaCabinet.jsx';
import { fetchMediaDatabase } from './apps/MediaCabinet/useMediaDb.js';
```

- [ ] **Step 2: Remove `generateGenericCover` and `renderStars`**

Delete these two module-level functions from the top of `src/App.jsx` (originally lines 4–37, right after the imports and before `function BeatsPlayer()`):

```js
// Generates a generic cover fallback SVG
const generateGenericCover = (title, year) => {
  ...
};

// Simple helper to render stars
const renderStars = (rating) => {
  ...
};
```

(Full original content is reproduced in Task 1, Step 1 — delete that exact block. It now lives in `src/apps/MediaCabinet/mediaUtils.jsx`.)

- [ ] **Step 3: Remove `mediaDb` state and replace with `filmsForGames`**

Find:

```js
  const [mediaDb, setMediaDb] = useState(() => {
    try {
      const customFilms = JSON.parse(localStorage.getItem('sumedh_custom_films') || '[]');
      const customAnime = JSON.parse(localStorage.getItem('sumedh_custom_anime') || '[]');
      const customManga = JSON.parse(localStorage.getItem('sumedh_custom_manga') || '[]');
      return {
        films: Array.isArray(customFilms) ? customFilms : [],
        anime: Array.isArray(customAnime) ? customAnime : [],
        manga: Array.isArray(customManga) ? customManga : []
      };
    } catch (e) {
      console.error("Local storage corruption detected. Resetting session states:", e);
      return { films: [], anime: [], manga: [] };
    }
  });
```

Replace with:

```js
  // Films data for LoglineGame / CineplayGame (Media Cabinet fetches its own copy independently)
  const [filmsForGames, setFilmsForGames] = useState([]);
  useEffect(() => {
    fetchMediaDatabase()
      .then(db => setFilmsForGames(db.films))
      .catch(err => console.error('Failed to load films for trivia games:', err));
  }, []);
```

- [ ] **Step 4: Remove Cabinet state block and description-fetch effect**

Delete this entire block (originally around lines 1571–1624):

```js
  // Cabinet state
  const [category, setCategory] = useState('films');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedItem, setSelectedItem] = useState(null);
  const [displayBg, setDisplayBg] = useState('');
  const displayContentRef = useRef(null);




  const [description, setDescription] = useState('');
  const [isLoadingDesc, setIsLoadingDesc] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setDescription('');
      return;
    }

    if (category === 'films') {
      setDescription(selectedItem.plot || '');
      return;
    }

    // Fetch from Jikan API for anime/manga
    setDescription('');
    setIsLoadingDesc(true);
    const type = category === 'anime' ? 'anime' : 'manga';
    const cacheKey = `desc_${type}_${selectedItem.id}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setDescription(cached);
      setIsLoadingDesc(false);
      return;
    }

    fetch(`https://api.jikan.moe/v4/${type}/${selectedItem.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Jikan failed");
        return res.json();
      })
      .then(json => {
        const syn = json.data?.synopsis || 'No description available.';
        localStorage.setItem(cacheKey, syn);
        setDescription(syn);
        setIsLoadingDesc(false);
      })
      .catch(() => {
        setDescription('Failed to load description.');
        setIsLoadingDesc(false);
      });
  }, [selectedItem, category]);
```

Do not delete anything else in this area — the `// OS Windows state` block that follows (`windows`, `closingWindows`, `maxZ`, `currentTime`) stays.

- [ ] **Step 5: Remove the `media.js` fetch from the "Load database" effect**

Inside the existing effect that starts with `// Load database` (the one that also does the local-storage star-rating sanitization and debts polling), find this portion at the end of the effect body, just before `return () => { clearInterval(debtsInterval); };`:

```js
    fetch(`${import.meta.env.BASE_URL}assets/data/media.js`)
      .then(res => res.text())
      .then(text => {
        const jsonStr = text.replace("window.mediaDatabase = ", "");
        const db = JSON.parse(jsonStr);

        console.log("Static database loaded. Anime:", db.anime.length, "Manga:", db.manga.length);

        setMediaDb(prev => {
          const merged = {
            films: [...prev.films, ...db.films.filter(item => !prev.films.some(c => c.slug === item.slug))],
            anime: [...prev.anime, ...db.anime.filter(item => !prev.anime.some(c => c.id === item.id))],
            manga: [...prev.manga, ...db.manga.filter(item => !prev.manga.some(c => c.id === item.id))]
          };
          return merged;
        });

        setSelectedItem(prev => {
          if (prev) return prev;
          const customFilms = JSON.parse(localStorage.getItem('sumedh_custom_films') || '[]');
          const allFilms = [...customFilms, ...db.films];
          if (allFilms.length > 0) {
            if (allFilms[0].image) setDisplayBg(allFilms[0].image);
            return allFilms[0];
          }
          return null;
        });
      })
      .catch(err => console.error("Failed to load media database:", err));

    return () => {
      clearInterval(debtsInterval);
    };
```

Replace with just:

```js
    return () => {
      clearInterval(debtsInterval);
    };
```

(The `media.js` fetch is now handled by Media Cabinet's own `useMediaDb` hook and by the `filmsForGames` effect added in Step 3 — this effect no longer needs it.)

- [ ] **Step 6: Remove Log Item Form state, Jikan search handlers, add/remove item handlers**

Delete this entire block (originally lines 1721–1879, from `// Log Item Form states` through the end of `handleRemoveItem`):

```js
  // Log Item Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newRating, setNewRating] = useState('★★★★★');
  const [newDirector, setNewDirector] = useState('');
  const [newGenres, setNewGenres] = useState('');
  const [newPersonalRating, setNewPersonalRating] = useState('8.5');
  const [newImage, setNewImage] = useState('');
  const [jikanSearch, setJikanSearch] = useState('');
  const [jikanResults, setJikanResults] = useState([]);
  const [searchingJikan, setSearchingJikan] = useState(false);

  const searchJikan = async () => { ... };

  const selectJikanResult = (resItem) => { ... };

  const handleAddNewItem = (e) => { ... };

  const handleRemoveItem = (itemToRemove, e) => { ... };
```

(Full original content was read from the file during planning — delete everything from `// Log Item Form states` through the closing `};` of `handleRemoveItem`, i.e. up to but not including the following `// Media Cabinet Filter states` comment.)

- [ ] **Step 7: Remove filter state, stats/filter helper functions, `getProcessedItems`/`processedItems`, `handleOpenAddForm`, rating-value helpers, `handleCategoryChange`, `handleItemSelect`**

Delete each of the following (all originally between lines 1881–2158, in this order):

```js
  // Media Cabinet Filter states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');

  const getAvailableGenres = () => { ... };

  const getAvailableDecades = () => { ... };

  const getAverageRating = () => { ... };

  const getTopGenre = () => { ... };
```

```js
  const getProcessedItems = () => { ... };

  const processedItems = getProcessedItems();

  const handleOpenAddForm = () => { ... };

  const getMyRatingValue = (item) => { ... };

  const getMalScoreValue = (item) => { ... };

  const handleCategoryChange = (cat) => { ... };

  const handleItemSelect = (item) => { ... };
```

Leave `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `restoreWindow`, `toggleMinimizeWindow` (which sit in between these two deleted chunks) untouched — they are window-manager functions used by all 8 apps, not Media Cabinet-specific.

- [ ] **Step 8: Replace the Media Cabinet JSX block**

Find the block starting with:

```jsx
            {win.id === 'cabinet' && (
              <section className="closet-section" aria-labelledby="closet-h" style={{ height: '100%', padding: 0 }}>
```

and ending with the matching:

```jsx
                </div>
              </section>
            )}
```

(This is the full block originally spanning lines 2658–3045, immediately before the `{/* ABOUT WINDOW CONTENT */}` comment.) Replace the entire block with:

```jsx
            {win.id === 'cabinet' && <MediaCabinet />}
```

Then find the two trivia game render lines:

```jsx
            {win.id === 'cinephile' && <LoglineGame films={mediaDb.films} />}
```

```jsx
            {win.id === 'cineplay' && <CineplayGame films={mediaDb.films} />}
```

and change both to:

```jsx
            {win.id === 'cinephile' && <LoglineGame films={filmsForGames} />}
```

```jsx
            {win.id === 'cineplay' && <CineplayGame films={filmsForGames} />}
```

- [ ] **Step 9: Verify the build**

Run: `npx vite build`
Expected: build succeeds with no errors (this is the first build check since Step 1 — if it fails, the error will point at a leftover reference to a removed variable/function; search `src/App.jsx` for `mediaDb`, `category`, `selectedItem`, `processedItems`, `handleAddNewItem`, etc. — every remaining reference outside the deleted block must be fixed or was missed in Steps 3–8).

- [ ] **Step 10: Remove dead CSS from `src/index.css`**

For each of the following selectors, run a check and delete the rule if it's now unused:

```bash
cd src
for cls in closet-section closet-container closet-display-bg panel-list-view closet-nav closet-toggle-btn search-bar-row search-wrapper search-input search-count sort-wrapper sort-select add-entry-btn-trigger cabinet-stats-hud stat-badge add-entry-form movie-grid grid-item-card grid-empty-state card-inner card-poster-img card-fallback-svg-container card-hover-overlay card-hover-title card-hover-year card-status-badge custom-item-delete-btn closet-display display-content display-split-layout display-left-panel cover-art display-specs display-right-panel display-title display-director display-meta display-description-box display-description display-placeholder form-field-row close-form-btn submit-entry-btn status-watching-highlight rating-stars; do
  count=$(grep -c "$cls" App.jsx)
  echo "$cls: $count"
done
```

Every selector should now report `0` (they were all confirmed cabinet-only during planning). For each `0`-count selector, find and delete its full CSS rule block in `src/index.css` (open the file, search for the class name, delete from the selector through its closing `}`), including:
- The responsive override block around line 927–935 (`@media (max-width: 768px) { .closet-container { ... } .panel-list-view { ... } }`).
- The `.window--cabinet .closet-section` / `.closet-container` / `.panel-list-view` override block around line 1690–1720.
- The `.panel-list-view::before` pseudo-element rule.

If any selector reports a nonzero count, stop and check what's still referencing it before deleting — do not delete CSS for a class still in use.

- [ ] **Step 11: Full manual verification**

Run: `npm run dev`, open the printed local URL in a browser.

Verify each of the following (per the design spec's testing section):
1. Open Media Cabinet: toolbar renders (Films/Anime/Manga tabs, search, genre/decade/sort dropdowns, stats strip, + LOG), poster grid fills the window and is full-bleed (no cramped narrow column).
2. Switch between Films / Anime / Manga tabs — grid repopulates correctly for each.
3. Type in search — grid narrows to matches; clear search — grid returns to full list.
4. Change genre filter, decade filter, and sort dropdown — grid reorders/narrows correctly for each.
5. Click a poster — drawer slides in from the right with correct title/year/rating/genres/synopsis for that item; stats strip numbers reflect the current filtered set.
6. Press Escape — drawer closes. Click the scrim (outside the drawer) — drawer closes.
7. Click "+ LOG" — drawer opens in add mode with the form; submit a test entry — it appears in the grid and the drawer closes.
8. Resize the browser window below 768px width (or use dev tools device emulation) — drawer becomes a bottom sheet instead of a side panel.
9. Open Logline.app (Logline trivia) — confirm questions load and answering doesn't crash (proves `filmsForGames` is wired correctly in place of the old `mediaDb.films`).
10. Open the browser console — confirm no new errors were introduced (some Jikan/OMDb 429/504 warnings from external APIs are expected and pre-existing, not a regression).

Run: `npx vite build`
Expected: succeeds with no errors or new warnings beyond what existed before this change.

- [ ] **Step 12: Commit**

```bash
git add src/App.jsx src/index.css
git commit -m "Wire MediaCabinet into App.jsx, remove old inline implementation and dead CSS"
```
