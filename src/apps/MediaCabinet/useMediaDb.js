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
