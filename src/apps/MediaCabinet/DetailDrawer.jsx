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
