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

// Spotify, SoundCloud & YouTube Embed Music Player + Native Radio Player
function BeatsPlayer() {
  const [urlInput, setUrlInput] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [playerMode, setPlayerMode] = useState('native'); // 'native' | 'embed'
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Curated list of songs from favorite movies (Whiplash, 2001: A Space Odyssey) playing natively
  const nativeTracks = [
    {
      title: "Caravan (Jazz Session)",
      artist: "Whiplash Favorite",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
      title: "Also sprach Zarathustra",
      artist: "2001: A Space Odyssey",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    },
    {
      title: "Whiplash Theme (Extended Drums)",
      artist: "Hank Levy (Cover)",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    }
  ];

  const handleNativePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.log("Audio play blocked: ", err));
    }
  };

  const handleTrackChange = (idx) => {
    setCurrentTrackIdx(idx);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.load();
      setTimeout(() => {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.log("Play failed: ", err));
      }, 100);
    }
  };

  const loadMedia = () => {
    if (!urlInput.trim()) return;
    let target = urlInput.trim();
    setPlayerMode('embed');
    
    // SoundCloud parser
    if (target.includes('soundcloud.com')) {
      const escaped = encodeURIComponent(target);
      setEmbedUrl(`https://w.soundcloud.com/player/?url=${escaped}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`);
    }
    // Spotify playlist parser
    else if (target.includes('open.spotify.com/playlist/')) {
      const id = target.split('playlist/')[1].split('?')[0];
      setEmbedUrl(`https://open.spotify.com/embed/playlist/${id}`);
    } 
    // Spotify album parser
    else if (target.includes('open.spotify.com/album/')) {
      const id = target.split('album/')[1].split('?')[0];
      setEmbedUrl(`https://open.spotify.com/embed/album/${id}`);
    }
    // YouTube playlist parser
    else if (target.includes('youtube.com/playlist?list=')) {
      const id = target.split('list=')[1].split('&')[0];
      setEmbedUrl(`https://www.youtube.com/embed/videoseries?list=${id}`);
    }
    // YouTube watch parser
    else if (target.includes('youtube.com/watch?v=')) {
      const id = target.split('v=')[1].split('&')[0];
      setEmbedUrl(`https://www.youtube.com/embed/${id}`);
    }
    else {
      setEmbedUrl(target);
    }
  };

  const switchToNative = () => {
    setPlayerMode('native');
  };

  return (
    <div className="beats-player">
      <div className="beats-loader mono">
        <input 
          type="text" 
          placeholder="Paste SoundCloud, Spotify, or YouTube URL..." 
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <button className="load-btn" onClick={loadMedia}>LOAD</button>
        {playerMode === 'embed' && (
          <button className="switch-btn" onClick={switchToNative}>RADIO</button>
        )}
      </div>

      {playerMode === 'native' ? (
        <div className="native-player-panel">
          <audio 
            ref={audioRef} 
            src={nativeTracks[currentTrackIdx].url} 
            preload="auto"
            onEnded={() => handleTrackChange((currentTrackIdx + 1) % nativeTracks.length)}
          />
          <div className="cassette-deck">
            <div className="cassette-label mono">
              {nativeTracks[currentTrackIdx].title}
            </div>
            <div className="cassette-sublabel mono">
              {nativeTracks[currentTrackIdx].artist}
            </div>
            <div className="cassette-spools">
              <div className={`cassette-spool ${isPlaying ? 'playing' : ''}`}></div>
              <div className={`cassette-spool ${isPlaying ? 'playing' : ''}`}></div>
            </div>
          </div>
          <div className="native-controls">
            <button 
              className="control-btn prev"
              onClick={() => handleTrackChange((currentTrackIdx - 1 + nativeTracks.length) % nativeTracks.length)}
            >
              &laquo; PREV
            </button>
            <button 
              className={`control-btn play-pause-btn ${isPlaying ? 'active' : ''}`}
              onClick={handleNativePlayPause}
            >
              {isPlaying ? "PAUSE" : "PLAY"}
            </button>
            <button 
              className="control-btn next"
              onClick={() => handleTrackChange((currentTrackIdx + 1) % nativeTracks.length)}
            >
              NEXT &raquo;
            </button>
          </div>
          <div className="native-playlist mono">
            {nativeTracks.map((track, idx) => (
              <div 
                key={idx} 
                className={`playlist-item ${idx === currentTrackIdx ? 'current' : ''}`}
                onClick={() => handleTrackChange(idx)}
              >
                <span>{idx + 1}. {track.title}</span>
                <span>{track.artist}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="beats-frame-wrapper">
          <iframe 
            src={embedUrl} 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; gyroscope"
            loading="lazy"
            title="External audio stream player"
          ></iframe>
        </div>
      )}
    </div>
  );
}

// Letterboxd-Powered Movie Trivia Game (Decade-specific distractor filters for harder difficulty)
function LoglineGame({ films }) {
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const generateQuestion = () => {
    if (!films || films.length < 5) return;
    
    // Filter films with valid plots and directors
    const candidates = films.filter(f => f.plot && f.plot !== 'N/A' && f.director && f.director !== 'N/A');
    if (candidates.length === 0) return;

    // Pick target film
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Mask film title in plot
    let maskedPlot = target.plot;
    const titleRegex = new RegExp(target.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    maskedPlot = maskedPlot.replace(titleRegex, '______');

    // Filter distractors from the same decade (within 10 years) for harder difficulty
    const targetYear = parseInt(target.year) || 2020;
    let similarFilms = candidates.filter(f => 
      f.title !== target.title && 
      Math.abs((parseInt(f.year) || 2020) - targetYear) <= 10
    );

    // Fallback if not enough similar era films
    if (similarFilms.length < 3) {
      similarFilms = candidates.filter(f => f.title !== target.title);
    }

    // Pick 3 distractors
    const distractors = [];
    const tempSimilar = [...similarFilms];
    while (distractors.length < 3 && tempSimilar.length > 0) {
      const randIdx = Math.floor(Math.random() * tempSimilar.length);
      const chosen = tempSimilar.splice(randIdx, 1)[0];
      if (!distractors.some(d => d.title === chosen.title)) {
        distractors.push(chosen);
      }
    }

    // Shuffle options
    const options = [target, ...distractors].sort(() => Math.random() - 0.5);

    setQuestion({
      target,
      plot: maskedPlot,
      options
    });
    setHasAnswered(false);
    setSelectedAnswer(null);
    setShowHint(false);
  };

  useEffect(() => {
    generateQuestion();
  }, [films]);

  const handleAnswer = (option) => {
    if (hasAnswered) return;
    setSelectedAnswer(option);
    setHasAnswered(true);
    if (option.title === question.target.title) {
      setScore(s => s + 1);
      setStreak(st => st + 1);
    } else {
      setStreak(0);
    }
  };

  if (!question) {
    return <div className="cinephile-loading mono">[ Loading Loglines... ]</div>;
  }

  return (
    <div className="cinephile-game">
      <div className="cinephile-hud mono">
        <span>SCORE: {score}</span>
        <span>STREAK: {streak} 🔥</span>
      </div>

      <div className="cinephile-card">
        <p className="cinephile-plot">
          &ldquo;{question.plot}&rdquo;
        </p>

        {showHint ? (
          <div className="cinephile-specs mono hint-reveal">
            <span>YEAR: {question.target.year}</span>
            <span>DIRECTOR: {question.target.director}</span>
          </div>
        ) : (
          <div style={{ marginTop: '15px' }}>
            <button 
              className="hint-btn mono" 
              onClick={() => setShowHint(true)}
            >
              [ REVEAL HINT (DIRECTOR &amp; YEAR) ]
            </button>
          </div>
        )}
      </div>

      <div className="cinephile-options">
        {question.options.map((opt, idx) => {
          let btnClass = "cinephile-opt-btn";
          if (hasAnswered) {
            if (opt.title === question.target.title) {
              btnClass += " correct";
            } else if (selectedAnswer && selectedAnswer.title === opt.title) {
              btnClass += " incorrect";
            } else {
              btnClass += " disabled";
            }
          }
          return (
            <button 
              key={idx} 
              className={btnClass}
              onClick={() => handleAnswer(opt)}
              disabled={hasAnswered}
            >
              {opt.title}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div className="cinephile-next-container">
          <button className="cinephile-next-btn mono" onClick={generateQuestion}>
            NEXT LOGLINE &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

// Draggable Window Component
function OSWindow({ id, title, width, height, onClose, zIndex, onFocus, children, defaultPos }) {
  const [position, setPosition] = useState(defaultPos || { x: 100, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(window.innerWidth <= 768);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef(null);

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
    if (isMaximized) return;
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
          <span>SumedhOS v1.5</span>
          <span>{currentTime}</span>
        </div>
        <div className="status-right">
          <span>System: Active</span>
          <span>CPU: 2%</span>
        </div>
      </div>

      {/* Parallax Floating Origami Cranes */}
      <div className="bg-cranes">
        <div className="bg-cranes__crane bg-cranes__crane--a"></div>
        <div className="bg-cranes__crane bg-cranes__crane--b"></div>
        <div className="bg-cranes__crane bg-cranes__crane--c"></div>
      </div>

      {/* Main Desktop Space with Portrait Wallpaper */}
      <div className="desktop" style={wallpaperStyle}>
        
        {/* Desktop Shortcuts (App Icons on screen) */}
        <div className="desktop-shortcuts">
          {/* Media Cabinet Shortcut */}
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

          {/* About Me Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={() => openWindow('about', 'About Me', 680, 480)}
            title="Biographical details and technical profile"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#e08a82' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <span className="shortcut-label">About Me</span>
          </div>

          {/* Mini-app: Cinephile Trivia Game Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={() => openWindow('cinephile', 'Logline Trivia', 580, 500)}
            title="Guess the movie using screenplay loglines"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#4a3222' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 2h-2v-2h2v2zm0-4h-2V7h2v5z"/>
              </svg>
            </div>
            <span className="shortcut-label">Logline.app</span>
          </div>

          {/* Mini-app: Beats Player Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={() => openWindow('beats', 'Beats Player', 640, 480)}
            title="Interactive custom Spotify, SoundCloud & YouTube stream player"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#ff4c5a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12H7v-2h10v2zm0-4H7V9h10v2z"/>
              </svg>
            </div>
            <span className="shortcut-label">Beats.app</span>
          </div>

          {/* Contact Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={() => openWindow('contact', 'Contact Links', 420, 220)}
            title="External portfolios, social networks and profiles"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#120e0b' }}>
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

                  <div className="panel-list-view">
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

                  <div className="closet-display">
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
              <div className="about-window-content" style={{ padding: '0.5rem 1rem' }}>
                <p className="about__body" style={{ fontSize: '1.15rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  I&rsquo;m a second-year Energy Engineering student at IIT Delhi Abu Dhabi. Most of my spare time goes to writing. When I&rsquo;m not at a script, I&rsquo;ve got a movie on, a show running, or a game I&rsquo;m halfway through. I read in between.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h3 className="roles__subhead" style={{ margin: 0, fontSize: '0.95rem' }}>positions</h3>
                    <ul className="roles__list" style={{ marginTop: '0.75rem', gap: '0.75rem' }}>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2025:</span> Marketing &amp; Creatives Head, IITDAD Coding Club</li>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2025:</span> Core Member, Digital Arts &amp; Design Club</li>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2025:</span> Millennium Fellow, UN Academic Impact &amp; MCN</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="roles__subhead" style={{ margin: 0, fontSize: '0.95rem' }}>competitions</h3>
                    <ul className="roles__list" style={{ marginTop: '0.75rem', gap: '0.75rem' }}>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2025:</span> Best Audio, Best Storytelling, Audience Choice &middot; University Film Festival</li>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2026:</span> 2nd Place, Hyperloop &middot; TRYST</li>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2026:</span> 2nd Place, Titan &middot; TRYST</li>
                      <li style={{ fontSize: '0.88rem' }}><span className="mono" style={{ fontSize: '0.8rem' }}>2026:</span> 3rd Place, Casecation &middot; TRYST</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* CASSETTE BEATS PLAYER CONTENT */}
            {win.id === 'beats' && <BeatsPlayer />}

            {/* LOGLINE TRIVIA GAME CONTENT */}
            {win.id === 'cinephile' && <LoglineGame films={mediaDb.films} />}

            {/* CONTACT WINDOW CONTENT */}
            {win.id === 'contact' && (
              <div className="contact-window-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifycontent: 'center', height: '100%' }}>
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
