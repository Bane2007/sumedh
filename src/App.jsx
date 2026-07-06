import { useState, useEffect, useRef } from 'react';

// Generates a generic cover fallback SVG
const generateGenericCover = (title, year) => {
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  const initial = title ? title.charAt(0).toUpperCase() : '?';
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="100%" height="100%">
      <defs>
        <linearGradient id="grad-${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue}, 25%, 20%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360}, 30%, 8%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad-${hash})" />
      <rect x="10" y="10" width="180" height="280" fill="none" stroke="rgba(236,228,211,0.1)" stroke-width="1.5" />
      <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" font-family="'EB Garamond', Georgia, serif" font-size="64" fill="rgba(236,228,211,0.2)" font-weight="500">${initial}</text>
      <text x="50%" y="82%" dominant-baseline="middle" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="10" fill="rgba(236,228,211,0.4)" letter-spacing="0.1em">${year || 'N/A'}</text>
    </svg>
  `;
};

// Simple helper to render stars
const renderStars = (rating) => {
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

// Draggable Window Component
function OSWindow({ id, title, width, height, onClose, zIndex, onFocus, children, defaultPos }) {
  const [position, setPosition] = useState(defaultPos || { x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(window.innerWidth <= 768);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

  // Re-check mobile size on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMaximized(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e) => {
    if (isMaximized) return; // Disable drag if maximized
    // Only drag on header bar click, not on close button or content
    if (e.target.classList.contains('window-header') || e.target.classList.contains('window-title')) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      onFocus();
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && !isMaximized) {
        const newX = Math.max(10, Math.min(window.innerWidth - 100, e.clientX - dragStart.current.x));
        const newY = Math.max(30, Math.min(window.innerHeight - 100, e.clientY - dragStart.current.y));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isMaximized]);

  return (
    <div 
      className={`window window--${id} ${isMaximized ? 'maximized' : ''}`} 
      ref={windowRef} 
      style={{ 
        zIndex, 
        left: isMaximized ? '0' : `${position.x}px`, 
        top: isMaximized ? '24px' : `${position.y}px`,
        width: isMaximized ? '100vw' : (typeof width === 'number' ? `${width}px` : width),
        height: isMaximized ? 'calc(100vh - 24px - 10px)' : (typeof height === 'number' ? `${height}px` : height),
        position: 'absolute'
      }}
      onMouseDown={onFocus}
    >
      <div className="window-header" onMouseDown={handleMouseDown}>
        <span className="window-title">{title}</span>
        <div className="window-controls">
          <div 
            className="window-maximize" 
            title={isMaximized ? 'Restore' : 'Maximize'}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (window.innerWidth > 768) {
                setIsMaximized(!isMaximized);
              }
            }}
          ></div>
          <div className="window-close" title="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}></div>
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  const [mediaDb, setMediaDb] = useState({ films: [], anime: [], manga: [] });
  
  // Cabinet state
  const [category, setCategory] = useState('films');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedItem, setSelectedItem] = useState(null);
  const [displayBg, setDisplayBg] = useState('');
  const displayContentRef = useRef(null);

  // OS Windows state
  const [windows, setWindows] = useState([]);
  const [maxZ, setMaxZ] = useState(20);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load database
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}assets/data/media.js`)
      .then(res => res.text())
      .then(text => {
        const jsonStr = text.replace("window.mediaDatabase = ", "");
        const db = JSON.parse(jsonStr);
        setMediaDb(db);
        
        const initialItem = db.films && db.films.length > 0 ? db.films[0] : null;
        setSelectedItem(initialItem);
        if (initialItem && initialItem.image) {
          setDisplayBg(initialItem.image);
        }
      })
      .catch(err => console.error("Failed to load media database:", err));
  }, []);

  // Handle open/focus window
  const openWindow = (id, title, width, height) => {
    const existing = windows.find(w => w.id === id);
    if (existing) {
      focusWindow(id);
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const winW = Math.min(width, w - 40);
    const winH = Math.min(height, h - 100);
    const x = (w - winW) / 2 + (windows.length * 20);
    const y = (h - winH) / 2 + (windows.length * 15);

    const newWindow = { id, title, width: winW, height: winH, x, y, zIndex: maxZ + 1 };
    setWindows([...windows, newWindow]);
    setMaxZ(prev => prev + 1);
  };

  const closeWindow = (id) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const focusWindow = (id) => {
    setMaxZ(prev => prev + 1);
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: maxZ + 1 } : w
    ));
  };

  // Filter & Sort Logic for Cabinet
  const getProcessedItems = () => {
    let items = [];
    if (category === 'films') items = [...mediaDb.films];
    else if (category === 'anime') items = [...mediaDb.anime];
    else if (category === 'manga') items = [...mediaDb.manga];

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.year && item.year.toString().includes(q)) ||
        (item.director && item.director.toLowerCase().includes(q)) ||
        (item.genres && item.genres.some(g => g.toLowerCase().includes(q)))
      );
    }

    if (sortBy === 'title') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'chronological') {
      items.sort((a, b) => parseInt(b.year || 0) - parseInt(a.year || 0));
    } else if (sortBy === 'rating') {
      if (category === 'films') {
        items.sort((a, b) => {
          const aStars = (a.rating || '').split('★').length - 1 + ((a.rating || '').includes('½') ? 0.5 : 0);
          const bStars = (b.rating || '').split('★').length - 1 + ((b.rating || '').includes('½') ? 0.5 : 0);
          const aIMDb = parseFloat(a.imdb_rating) || 0;
          const bIMDb = parseFloat(b.imdb_rating) || 0;
          const aScore = aStars > 0 ? aStars * 2 : aIMDb;
          const bScore = bStars > 0 ? bStars * 2 : bIMDb;
          return bScore - aScore;
        });
      } else {
        items.sort((a, b) => parseFloat(b.score || 0) - parseFloat(a.score || 0));
      }
    } else {
      if (category === 'films') {
        const dated = items.filter(f => f.watched_date && f.watched_date !== 'N/A');
        const undated = items.filter(f => !f.watched_date || f.watched_date === 'N/A');
        dated.sort((a, b) => b.watched_date.localeCompare(a.watched_date));
        items = [...dated, ...undated];
      } else {
        items.sort((a, b) => b.sort_date.localeCompare(a.sort_date));
      }
    }

    return items;
  };

  const processedItems = getProcessedItems();

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSearch('');
    const dbItems = mediaDb[cat] || [];
    if (dbItems.length > 0) {
      setSelectedItem(dbItems[0]);
      if (dbItems[0].image) setDisplayBg(dbItems[0].image);
    } else {
      setSelectedItem(null);
      setDisplayBg('');
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    if (item.image) setDisplayBg(item.image);
    else setDisplayBg('');
    if (displayContentRef.current) {
      displayContentRef.current.style.animation = 'none';
      void displayContentRef.current.offsetHeight;
      displayContentRef.current.style.animation = '';
    }
  };

  // Dynamic wallpaper setup using user portrait with dark editorial styling
  const wallpaperStyle = {
    backgroundImage: `linear-gradient(rgba(18, 14, 11, 0.45), rgba(18, 14, 11, 0.78)), url(${import.meta.env.BASE_URL}assets/img/portrait.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center 20%',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <>
      {/* Top Status Bar */}
      <div className="status-bar">
        <div className="status-left">
          <span>SumedhOS v1.2</span>
          <span>{currentTime}</span>
        </div>
        <div className="status-right">
          <span>System: Active</span>
          <span>CPU: 2%</span>
        </div>
      </div>

      <div className="rec-light" aria-hidden="true">
        <span className="rec-light__dot"></span>
        <span className="rec-light__label">REC</span>
      </div>

      {/* Parallax Floating Origami Cranes */}
      <div className="bg-cranes">
        <div className="bg-cranes__crane bg-cranes__crane--a"></div>
        <div className="bg-cranes__crane bg-cranes__crane--b"></div>
        <div className="bg-cranes__crane bg-cranes__crane--c"></div>
      </div>

      {/* Main Desktop Space with Custom Portrait Wallpaper */}
      <div className="desktop" style={wallpaperStyle}>
        
        {/* Desktop Shortcuts (App Icons on screen) */}
        <div className="desktop-shortcuts">
          <div 
            className="shortcut-item" 
            onClick={() => openWindow('cabinet', 'Media Cabinet', 1080, 680)}
            title="Open film, anime, and manga lists"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#c8615a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
              </svg>
            </div>
            <span className="shortcut-label">Media Cabinet</span>
          </div>

          <div 
            className="shortcut-item" 
            onClick={() => openWindow('about', 'About Me', 520, 420)}
            title="Biographical details and technical profile"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#e08a82' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <span className="shortcut-label">About Me</span>
          </div>

          <div 
            className="shortcut-item" 
            onClick={() => openWindow('sadako', 'Sadako (2025)', 850, 620)}
            title="Details on the award-winning stop-motion film"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#9c9182' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
              </svg>
            </div>
            <span className="shortcut-label">Sadako (2025)</span>
          </div>

          <div 
            className="shortcut-item" 
            onClick={() => openWindow('contact', 'Contact Links', 420, 220)}
            title="External portfolios, social networks and profiles"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#4a3222' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <span className="shortcut-label">Contact</span>
          </div>
        </div>

        {/* Brand Overlay / Watermark */}
        <div className="desktop-brand">
          <div className="brand-title">SUMEDH JAMSANDEKAR</div>
          <div className="brand-subtitle mono">WRITER / DIRECTOR / ENGINEER</div>
        </div>

        {/* Windows Rendering */}
        {windows.map((win) => (
          <OSWindow
            key={win.id}
            id={win.id}
            title={win.title}
            width={win.width}
            height={win.height}
            zIndex={win.zIndex}
            defaultPos={{ x: win.x, y: win.y }}
            onClose={() => closeWindow(win.id)}
            onFocus={() => focusWindow(win.id)}
          >
            {/* CABINET CONTENT */}
            {win.id === 'cabinet' && (
              <section className="closet-section" aria-labelledby="closet-h" style={{ minHeight: 'auto', padding: 0 }}>
                <div className="closet-nav" style={{ marginTop: 0 }}>
                  <button 
                    className={`closet-toggle-btn ${category === 'films' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('films')}
                  >
                    Films
                  </button>
                  <button 
                    className={`closet-toggle-btn ${category === 'anime' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('anime')}
                  >
                    Anime
                  </button>
                  <button 
                    className={`closet-toggle-btn ${category === 'manga' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('manga')}
                  >
                    Manga
                  </button>
                </div>

                <div className="closet-container" style={{ position: 'relative', height: 'calc(100% - 40px)', minHeight: 'auto' }}>
                  <div 
                    className="closet-display-bg" 
                    style={{ 
                      backgroundImage: displayBg ? `url(${displayBg})` : 'none', 
                      opacity: displayBg ? 0.28 : 0,
                      borderRadius: '8px'
                    }}
                  ></div>

                  <div className="movie-grid-container">
                    <div className="search-bar-row">
                      <div className="search-wrapper">
                        <input 
                          type="search" 
                          className="search-input mono" 
                          placeholder={category === 'films' ? 'Search Letterboxd history...' : (category === 'anime' ? 'Search completed & watching...' : 'Search completed & reading...')}
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="search-count mono">
                          Showing {processedItems.length} / {category === 'films' ? mediaDb.films.length : (category === 'anime' ? mediaDb.anime.length : mediaDb.manga.length)}
                        </div>
                      </div>

                      <div className="sort-wrapper">
                        <select 
                          id="media-sort" 
                          className="sort-select mono"
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="recent">Sort: Recent Log</option>
                          <option value="title">Sort: Alphabetical</option>
                          <option value="chronological">Sort: Release Year</option>
                          <option value="rating">Sort: Personal Rating</option>
                        </select>
                      </div>
                    </div>

                    <div className="movie-grid">
                      {processedItems.length === 0 ? (
                        <div className="grid-empty-state mono">[ No matching titles found on the shelf ]</div>
                      ) : (
                        processedItems.map((item, index) => {
                          const isSelected = selectedItem && (
                            (category === 'films' && selectedItem.slug === item.slug) ||
                            (category !== 'films' && selectedItem.id === item.id)
                          );
                          
                          return (
                            <div 
                              key={category === 'films' ? item.slug : item.id}
                              className={`grid-item-card ${isSelected ? 'selected' : ''}`}
                              style={{ animationDelay: `${index * 12}ms` }}
                              tabIndex="0"
                              onClick={() => handleItemSelect(item)}
                              onFocus={() => handleItemSelect(item)}
                            >
                              <div className="card-inner">
                                {item.image ? (
                                  <img 
                                    className="card-poster-img"
                                    src={item.image} 
                                    alt={item.title} 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div 
                                    className="card-fallback-svg-container"
                                    dangerouslySetInnerHTML={{ __html: generateGenericCover(item.title, item.year) }}
                                  />
                                )}

                                <div className="card-hover-overlay">
                                  <span className="card-hover-title">{item.title}</span>
                                  <span className="card-hover-year">{item.year}</span>
                                </div>

                                {(item.status === 'watching' || item.status === 'reading') && (
                                  <div className="card-status-badge mono">
                                    {item.status}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="display-box">
                    <div 
                      className="display-content" 
                      ref={displayContentRef}
                      style={{ display: selectedItem ? 'block' : 'none' }}
                    >
                      {selectedItem && (
                        <>
                          <div className="display-header-row">
                            {selectedItem.image ? (
                              <img 
                                className="cover-art" 
                                src={selectedItem.image} 
                                alt={selectedItem.title} 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div 
                                className="cover-art"
                                style={{ width: '140px', height: '200px' }}
                                dangerouslySetInnerHTML={{ __html: generateGenericCover(selectedItem.title, selectedItem.year) }}
                              />
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                              <h3 className="display-title">
                                {category === 'films' ? (
                                  <a href={`https://letterboxd.com/film/${selectedItem.slug}/`} target="_blank" rel="noopener">
                                    {selectedItem.title}
                                  </a>
                                ) : (
                                  <a href={selectedItem.url || '#'} target="_blank" rel="noopener">
                                    {selectedItem.title}
                                  </a>
                                )}
                              </h3>
                              
                              <p className="display-director mono">
                                {category === 'films' ? (
                                  selectedItem.director && selectedItem.director !== 'N/A' ? `Directed by ${selectedItem.director}` : 'Letterboxd Record'
                                ) : (
                                  selectedItem.status === 'watching' || selectedItem.status === 'reading' ? (
                                    <span className="status-watching-highlight">Currently {selectedItem.status}</span>
                                  ) : (
                                    'Completed Title'
                                  )
                                )}
                              </p>

                              <div className="display-meta mono">
                                {selectedItem.year} &middot; {renderStars(category === 'films' ? selectedItem.rating : selectedItem.score)}
                                {category === 'films' && selectedItem.imdb_rating && selectedItem.imdb_rating !== 'N/A' && (
                                  <> &middot; <span style={{ color: '#ffb400', fontWeight: 'bold' }}>{selectedItem.imdb_rating}/10 (IMDb)</span></>
                                )}
                              </div>
                            </div>
                          </div>

                          {category === 'films' ? (
                            <>
                              <dl className="display-specs mono">
                                {selectedItem.watched_date && selectedItem.watched_date !== 'N/A' && (
                                  <div><dt>Watched</dt><dd>{selectedItem.watched_date}</dd></div>
                                )}
                                {selectedItem.cast && selectedItem.cast !== 'N/A' && (
                                  <div>
                                    <dt>Cast</dt>
                                    <dd title={selectedItem.cast}>{selectedItem.cast}</dd>
                                  </div>
                                )}
                              </dl>
                              {selectedItem.plot && selectedItem.plot !== 'N/A' && (
                                <p className="display-plot" style={{ marginTop: '1.25rem', fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                                  {selectedItem.plot.length > 180 ? selectedItem.plot.slice(0, 180) + '...' : selectedItem.plot}
                                </p>
                              )}
                            </>
                          ) : (
                            <dl className="display-specs mono">
                              <div><dt>Status</dt><dd>{selectedItem.status}</dd></div>
                              {category === 'anime' ? (
                                <div><dt>Progress</dt><dd>{selectedItem.episodes_watched} eps</dd></div>
                              ) : (
                                <>
                                  <div><dt>Chapters</dt><dd>{selectedItem.chapters || 0} chs</dd></div>
                                  <div><dt>Volumes</dt><dd>{selectedItem.volumes || 0} vols</dd></div>
                                </>
                              )}
                              {selectedItem.start_date && selectedItem.start_date !== 'N/A' && (
                                <div><dt>Started</dt><dd>{selectedItem.start_date}</dd></div>
                              )}
                              {selectedItem.finish_date && selectedItem.finish_date !== 'N/A' && (
                                <div><dt>Finished</dt><dd>{selectedItem.finish_date}</dd></div>
                              )}
                              {selectedItem.genres && selectedItem.genres.length > 0 && (
                                <div style={{ gridColumn: 'span 2' }}>
                                  <dt>Genres</dt>
                                  <dd style={{ whiteSpace: 'normal', maxHeight: '40px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedItem.genres.join(', ')}>
                                    {selectedItem.genres.join(', ')}
                                  </dd>
                                </div>
                              )}
                            </dl>
                          )}
                        </>
                      )}
                    </div>
                    <div className="display-placeholder mono" style={{ display: selectedItem ? 'none' : 'block' }}>
                      [ Select a title from the shelf to view details ]
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ABOUT WINDOW CONTENT */}
            {win.id === 'about' && (
              <div className="about-window-content">
                <p className="about__body" style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                  I&rsquo;m a second-year Energy Engineering student at IIT Delhi Abu Dhabi. Most of my spare time goes to writing. <em>Sadako</em> (2025) was the first short film I finished. When I&rsquo;m not at a script, I&rsquo;ve got a movie on, a show running, or a game I&rsquo;m halfway through. I read in between.
                </p>
                <div style={{ marginTop: '2rem', borderTop: '1px dashed var(--glass-border)', paddingTop: '1rem' }}>
                  <h4 style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--oxblood-soft)' }}>Technical Roles</h4>
                  <ul className="mono" style={{ fontSize: '0.75rem', listStyle: 'square', paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--ink-soft)' }}>
                    <li>2026—: Hyperloop Team &middot; IIT Delhi Abu Dhabi</li>
                    <li>2025—: Webmaster &middot; IIT Delhi Abu Dhabi</li>
                    <li>2025: Technical Lead &middot; Intercollegiate Programming</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SADAKO WINDOW CONTENT */}
            {win.id === 'sadako' && (
              <div className="sadako-window-content">
                <div className="sadako__grid" style={{ gap: '1.5rem' }}>
                  <figure className="sadako__poster" style={{ position: 'static' }}>
                    <img src="assets/img/poster.jpg" alt="Sadako poster" />
                  </figure>
                  <div className="sadako__info">
                    <p className="sadako__title" style={{ fontSize: '1.8rem', margin: 0 }}><span className="smallcaps">Sadako</span> <span className="sadako__year">(2025)</span></p>
                    <blockquote className="sadako__logline" style={{ margin: '1rem 0', fontSize: '0.85rem' }}>
                      A young girl who loves origami sits down with a single sheet of paper and begins to fold. With every careful crease, a quiet stop-motion story takes shape, one about perseverance, hope, and wishes made on paper.
                    </blockquote>
                    <p className="sadako__credit" style={{ fontSize: '0.78rem' }}><span className="mono">a film by</span> Sumedh Jamsandekar &middot; Evan Tobias &middot; Joel Jobi</p>
                    
                    <p className="sadako__awards mono" style={{ fontSize: '0.7rem', borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', padding: '0.5rem 0', margin: '1rem 0' }}>
                      <span>Best Audio</span> &middot; <span>Best Storytelling</span> &middot; <span>Audience Choice</span><br />
                      <span className="dim">University Film Festival 2025</span>
                    </p>

                    <div className="sadako__buttons" style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                      <a className="btn btn--filled" href="https://www.youtube.com/watch?v=bSUdWw-3dmE" target="_blank" rel="noopener" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true" style={{ marginRight: '4px' }}><path d="M8 5v14l11-7z"/></svg>
                        Watch on YouTube
                      </a>
                      <a className="btn btn--ghost" href="https://www.imdb.com/title/tt39732610/" target="_blank" rel="noopener" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>View on IMDb</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTACT WINDOW CONTENT */}
            {win.id === 'contact' && (
              <div className="contact-window-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <ul className="contact__list" style={{ gap: '1rem 2rem' }}>
                  <li><a href="https://www.imdb.com/name/nm18199394/" target="_blank" rel="noopener">IMDb</a></li>
                  <li><a href="https://github.com/Bane2007" target="_blank" rel="noopener">GitHub</a></li>
                  <li><a href="https://letterboxd.com/Bane_snj/" target="_blank" rel="noopener">Letterboxd</a></li>
                  <li><a href="https://app.thestorygraph.com/profile/sumed_nj" target="_blank" rel="noopener">StoryGraph</a></li>
                  <li><a href="https://www.instagram.com/sumed_nj/" target="_blank" rel="noopener">Instagram</a></li>
                </ul>
              </div>
            )}
          </OSWindow>
        ))}
      </div>
    </>
  );
}

export default App;
