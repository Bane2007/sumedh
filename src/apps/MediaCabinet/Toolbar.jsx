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
