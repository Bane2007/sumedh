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

// Open-source ad-free stream & internet radio cassette player
function BeatsPlayer() {
  const [urlInput, setUrlInput] = useState('');
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Curated list of high-quality, open-source, ad-free internet radio and music streams (no AI songs)
  const initialStreams = [
    {
      title: "KCRW Eclectic24",
      artist: "LA Public Radio (Real Alternative/Indie)",
      url: "https://streams.kcrw.com/e24_mp3"
    },
    {
      title: "NTS Radio Channel 1",
      artist: "London Underground Broadcast",
      url: "http://stream-relay-geo.ntslive.net/stream"
    },
    {
      title: "Code Radio",
      artist: "freeCodeCamp Study Lofi",
      url: "https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3"
    },
    {
      title: "Groove Salad",
      artist: "SomaFM (Ambient Chill Beats)",
      url: "https://ice1.somafm.com/groovesalad-128-mp3"
    },
    {
      title: "Indie Pop Rocks!",
      artist: "SomaFM (Classic Indie Pop)",
      url: "https://ice1.somafm.com/indiepop-128-mp3"
    },
    {
      title: "Synth Zone",
      artist: "SomaFM (Synthwave/80s Retro)",
      url: "https://ice1.somafm.com/synthzone-128-mp3"
    },
    {
      title: "Radio Paradise (Mellow)",
      artist: "Listener-Supported Warm Chill",
      url: "https://stream.radioparadise.com/mellow-128"
    },
    {
      title: "Clair de Lune",
      artist: "Claude Debussy (Classical Masterpiece)",
      url: "https://archive.org/download/debussy-claire-de-lune/Debussy%20-%20Suite%20bergamasque%20-%20III.%20Clair%20de%20lune.mp3"
    },
    {
      title: "Gymnopédie No. 1",
      artist: "Erik Satie (Classical Ambient)",
      url: "https://archive.org/download/satie-gymnopedie-1/Satie%20-%20Gymnopedie%20No.%201.mp3"
    }
  ];

  const [tracks, setTracks] = useState(initialStreams);

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
    const target = urlInput.trim();
    let parsedUrl = target;
    let title = "Custom Stream";
    let artist = "Web Audio Link";

    // SomaFM URL parser (e.g., https://somafm.com/groovesalad/ or somafm.com/groovesalad)
    if (target.includes('somafm.com')) {
      const match = target.match(/somafm\.com\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const channel = match[1].toLowerCase();
        parsedUrl = `https://ice1.somafm.com/${channel}-128-mp3`;
        title = channel.charAt(0).toUpperCase() + channel.slice(1);
        artist = "SomaFM Stream";
      }
    }
    // Radio Paradise URL parser
    else if (target.includes('radioparadise.com')) {
      parsedUrl = "https://stream.radioparadise.com/musicmix-128";
      title = "Radio Paradise (Main Mix)";
      artist = "Radio Paradise Stream";
    }
    // Direct audio links
    else {
      try {
        const urlObj = new URL(target);
        const pathname = urlObj.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (filename) {
          title = decodeURIComponent(filename);
        }
      } catch (e) {
        title = "External Stream";
      }
    }

    const newTrack = {
      title: title,
      artist: artist,
      url: parsedUrl
    };

    setTracks(prev => {
      const updated = [...prev, newTrack];
      setCurrentTrackIdx(updated.length - 1);
      setIsPlaying(false);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.log("Audio play blocked: ", err));
        }
      }, 100);
      return updated;
    });

    setUrlInput('');
  };

  return (
    <div className="beats-player">
      <div className="beats-loader mono">
        <input 
          type="text" 
          placeholder="Paste SomaFM, Radio Paradise, or direct audio stream URL..." 
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
        />
        <button className="load-btn" onClick={loadMedia}>LOAD</button>
      </div>

      <div className="native-player-panel">
        <audio 
          ref={audioRef} 
          src={tracks[currentTrackIdx].url} 
          preload="auto"
          crossOrigin="anonymous"
          onEnded={() => handleTrackChange((currentTrackIdx + 1) % tracks.length)}
        />
        <div className="cassette-deck">
          <div className="cassette-label mono">
            {tracks[currentTrackIdx].title}
          </div>
          <div className="cassette-sublabel mono">
            {tracks[currentTrackIdx].artist}
          </div>
          <div className="cassette-spools">
            <div className={`cassette-spool ${isPlaying ? 'playing' : ''}`}></div>
            <div className={`cassette-spool ${isPlaying ? 'playing' : ''}`}></div>
          </div>
        </div>
        <div className="native-controls">
          <button 
            className="control-btn prev"
            onClick={() => handleTrackChange((currentTrackIdx - 1 + tracks.length) % tracks.length)}
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
            onClick={() => handleTrackChange((currentTrackIdx + 1) % tracks.length)}
          >
            NEXT &raquo;
          </button>
        </div>
        <div className="native-playlist mono">
          {tracks.map((track, idx) => (
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
    </div>
  );
}

// Logphile Suite - Game hub with Cinephile Plot Trivia & Movie Higher or Lower
function LoglineGame({ films }) {
  const [activeGame, setActiveGame] = useState('menu'); // 'menu', 'trivia', 'higherlower'
  
  // Game 1: Plot Trivia State
  const [triviaSource, setTriviaSource] = useState('global'); // 'global', 'letterboxd'
  const [triviaQuestion, setTriviaQuestion] = useState(null);
  const [triviaScore, setTriviaScore] = useState(0);
  const [triviaStreak, setTriviaStreak] = useState(0);
  const [triviaHasAnswered, setTriviaHasAnswered] = useState(false);
  const [triviaSelected, setTriviaSelected] = useState(null);
  const [triviaHardMode, setTriviaHardMode] = useState(true);
  const [showHint, setShowHint] = useState(false);

  // Game 2: Higher or Lower State
  const [hlCurrent, setHlCurrent] = useState(null);
  const [hlNext, setHlNext] = useState(null);
  const [hlScore, setHlScore] = useState(0);
  const [hlHighScore, setHlHighScore] = useState(0);
  const [hlStatus, setHlStatus] = useState('playing'); // 'playing', 'correct', 'gameover'
  const [hlSelectedAnswer, setHlSelectedAnswer] = useState(null);

  // Global Masterpieces Library
  const GLOBAL_MASTERPIECES = [
    { title: "The Godfather", year: "1972", rating: "9.2", director: "Francis Ford Coppola", plot: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son." },
    { title: "The Dark Knight", year: "2008", rating: "9.0", director: "Christopher Nolan", plot: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
    { title: "Pulp Fiction", year: "1994", rating: "8.9", director: "Quentin Tarantino", plot: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption." },
    { title: "Schindler's List", year: "1993", rating: "9.0", director: "Steven Spielberg", plot: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis." },
    { title: "12 Angry Men", year: "1957", rating: "9.0", director: "Sidney Lumet", plot: "The jury in a New York City murder trial is frustrated by a single member who prevents a unanimous verdict by forcing them to reconsider the evidence." },
    { title: "Fight Club", year: "1999", rating: "8.8", director: "David Fincher", plot: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more." },
    { title: "Inception", year: "2010", rating: "8.8", director: "Christopher Nolan", plot: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
    { title: "The Matrix", year: "1999", rating: "8.7", director: "Lana Wachowski", plot: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence." },
    { title: "Goodfellas", year: "1990", rating: "8.7", director: "Martin Scorsese", plot: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners Jimmy Conway and Tommy DeVito." },
    { title: "Seven", year: "1995", rating: "8.6", director: "David Fincher", plot: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives." },
    { title: "Interstellar", year: "2014", rating: "8.6", director: "Christopher Nolan", plot: "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival." },
    { title: "Spirited Away", year: "2001", rating: "8.6", director: "Hayao Miyazaki", plot: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits." },
    { title: "Parasite", year: "2019", rating: "8.5", director: "Bong Joon Ho", plot: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan." },
    { title: "The Shining", year: "1980", rating: "8.4", director: "Stanley Kubrick", plot: "A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence, while his psychic son sees horrific forebodings." },
    { title: "Whiplash", year: "2014", rating: "8.5", director: "Damien Chazelle", plot: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing." },
    { title: "Psycho", year: "1960", rating: "8.5", director: "Alfred Hitchcock", plot: "A Phoenix secretary embezzles $40,000, goes on the run, and checks into a remote motel run by a young man under the domination of his mother." },
    { title: "Rear Window", year: "1954", rating: "8.5", director: "Alfred Hitchcock", plot: "A wheelchair-bound photographer spies on his neighbors from his apartment window, and becomes convinced one of them has committed murder." },
    { title: "Citizen Kane", year: "1941", rating: "8.3", director: "Orson Welles", plot: "Following the death of publishing tycoon Charles Foster Kane, reporters scramble to uncover the meaning of his dying word: 'Rosebud'." },
    { title: "Casablanca", year: "1942", rating: "8.5", director: "Michael Curtiz", plot: "A cynical expatriate American cafe owner struggles to decide whether or not to help his former lover and her fugitive husband escape the Nazis." },
    { title: "2001: A Space Odyssey", year: "1968", rating: "8.3", director: "Stanley Kubrick", plot: "After uncovering a mysterious artifact buried beneath the Lunar surface, mankind sets off on a quest with the help of H.A.L. 9000." },
    { title: "Taxi Driver", year: "1976", rating: "8.2", director: "Martin Scorsese", plot: "A mentally unstable veteran works as a nighttime taxi driver in New York City, where the perceived decadence and sleaze fuels his urge for violent action." },
    { title: "Apocalypse Now", year: "1979", rating: "8.4", director: "Francis Ford Coppola", plot: "A U.S. Army officer serving in Vietnam is tasked with assassinating a renegade Special Forces Colonel who sees himself as a god." },
    { title: "Vertigo", year: "1958", rating: "8.3", director: "Alfred Hitchcock", plot: "A former San Francisco police detective juggles his personal demons with the obsession of a woman he was hired to tail." },
    { title: "Mulholland Drive", year: "2001", rating: "7.9", director: "David Lynch", plot: "After a car wreck on the winding road above Los Angeles, an amnesiac woman and a perky blonde actress search for clues." },
    { title: "Sunset Boulevard", year: "1950", rating: "8.4", director: "Billy Wilder", plot: "A screenwriter develops a dangerous relationship with a faded silent movie star who is determined to make a triumphant return." }
  ];

  // ==================== TRIVIA GAME LOGIC ====================
  const generateTriviaQuestion = () => {
    const pool = triviaSource === 'global' ? GLOBAL_MASTERPIECES : (films && films.length > 5 ? films.filter(f => f.plot && f.plot !== 'N/A') : GLOBAL_MASTERPIECES);
    if (pool.length < 4) return;

    const target = pool[Math.floor(Math.random() * pool.length)];
    
    // Mask film title
    let maskedPlot = target.plot;
    const titleRegex = new RegExp(target.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    maskedPlot = maskedPlot.replace(titleRegex, '______');

    if (triviaHardMode) {
      if (target.director && target.director !== 'N/A') {
        const dirParts = target.director.split(/\s+/).filter(p => p.length > 2);
        dirParts.forEach(part => {
          const r = new RegExp('\\b' + part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
          maskedPlot = maskedPlot.replace(r, '______');
        });
      }
      if (target.cast && target.cast !== 'N/A') {
        target.cast.split(',').map(a => a.trim()).forEach(actor => {
          actor.split(/\s+/).filter(p => p.length > 2).forEach(part => {
            const r = new RegExp('\\b' + part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'gi');
            maskedPlot = maskedPlot.replace(r, '______');
          });
        });
      }
    }

    // Get distractors
    const targetYear = parseInt(target.year) || 1990;
    let candidates = pool.filter(f => f.title !== target.title);
    let similar = candidates.filter(f => Math.abs((parseInt(f.year) || 1990) - targetYear) <= (triviaHardMode ? 10 : 20));
    if (similar.length < 3) similar = candidates;

    const distractors = [];
    const temp = [...similar];
    while (distractors.length < 3 && temp.length > 0) {
      const idx = Math.floor(Math.random() * temp.length);
      const chosen = temp.splice(idx, 1)[0];
      if (!distractors.some(d => d.title === chosen.title)) {
        distractors.push(chosen);
      }
    }

    const options = [target, ...distractors].sort(() => Math.random() - 0.5);
    setTriviaQuestion({ target, plot: maskedPlot, options });
    setTriviaHasAnswered(false);
    setTriviaSelected(null);
    setShowHint(false);
  };

  useEffect(() => {
    if (activeGame === 'trivia') generateTriviaQuestion();
  }, [activeGame, triviaSource, triviaHardMode]);

  const handleTriviaAnswer = (opt) => {
    if (triviaHasAnswered) return;
    setTriviaSelected(opt);
    setTriviaHasAnswered(true);
    if (opt.title === triviaQuestion.target.title) {
      const points = (triviaHardMode || !showHint) ? 1 : 0.5;
      setTriviaScore(s => s + points);
      setTriviaStreak(s => s + 1);
    } else {
      setTriviaStreak(0);
    }
  };

  // ==================== HIGHER OR LOWER LOGIC ====================
  const startHigherLower = () => {
    const pool = GLOBAL_MASTERPIECES;
    const currentIdx = Math.floor(Math.random() * pool.length);
    let nextIdx = Math.floor(Math.random() * pool.length);
    while (nextIdx === currentIdx) {
      nextIdx = Math.floor(Math.random() * pool.length);
    }
    setHlCurrent(pool[currentIdx]);
    setHlNext(pool[nextIdx]);
    setHlScore(0);
    setHlStatus('playing');
    setHlSelectedAnswer(null);
  };

  useEffect(() => {
    if (activeGame === 'higherlower') startHigherLower();
  }, [activeGame]);

  const handleHigherLowerGuess = (guess) => {
    if (hlStatus !== 'playing') return;
    setHlSelectedAnswer(guess);
    
    const curVal = parseFloat(hlCurrent.rating);
    const nextVal = parseFloat(hlNext.rating);
    
    let isCorrect = false;
    if (guess === 'higher' && nextVal >= curVal) isCorrect = true;
    if (guess === 'lower' && nextVal <= curVal) isCorrect = true;
    
    if (isCorrect) {
      setHlStatus('correct');
      setHlScore(s => {
        const nextScore = s + 1;
        if (nextScore > hlHighScore) setHlHighScore(nextScore);
        return nextScore;
      });
      setTimeout(() => {
        setHlCurrent(hlNext);
        const pool = GLOBAL_MASTERPIECES.filter(m => m.title !== hlNext.title);
        const newNext = pool[Math.floor(Math.random() * pool.length)];
        setHlNext(newNext);
        setHlStatus('playing');
        setHlSelectedAnswer(null);
      }, 1500);
    } else {
      setHlStatus('gameover');
    }
  };

  // ==================== RENDER SUITE SCREEN ====================
  if (activeGame === 'menu') {
    return (
      <div className="logphile-menu">
        <div className="logphile-logo mono">&lt; LOGPHILE TRIVIA DECK &gt;</div>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', fontStyle: 'italic', maxWidth: '360px', marginBottom: '15px' }}>
          Test your film IQ. Run classic plot riddles or play the higher-or-lower IMDb score match.
        </p>
        <button className="logphile-menu-btn" onClick={() => setActiveGame('trivia')}>
          1. MASTERPIECE LOGLINES
        </button>
        <button className="logphile-menu-btn" onClick={() => setActiveGame('higherlower')}>
          2. HIGHER OR LOWER (IMDb)
        </button>
      </div>
    );
  }

  if (activeGame === 'trivia') {
    if (!triviaQuestion) {
      return <div className="cinephile-loading mono">[ Loading Loglines... ]</div>;
    }
    return (
      <div className="cinephile-game" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="cinephile-hud mono">
            <button className="logphile-back-btn" onClick={() => setActiveGame('menu')}>&larr; MENU</button>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>SCORE: {triviaScore}</span>
              <span>STREAK: {triviaStreak} 🔥</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', gap: '15px' }}>
            <div className="mono" style={{ fontSize: '0.68rem', display: 'flex', gap: '6px' }}>
              <span>Source:</span>
              <button 
                className="hint-btn" 
                style={{ textDecoration: triviaSource === 'global' ? 'underline' : 'none', fontWeight: triviaSource === 'global' ? 'bold' : 'normal' }}
                onClick={() => setTriviaSource('global')}
              >
                Global Classics
              </button>
              {films && films.length > 5 && (
                <>
                  <span>|</span>
                  <button 
                    className="hint-btn" 
                    style={{ textDecoration: triviaSource === 'letterboxd' ? 'underline' : 'none', fontWeight: triviaSource === 'letterboxd' ? 'bold' : 'normal' }}
                    onClick={() => setTriviaSource('letterboxd')}
                  >
                    My Letterboxd
                  </button>
                </>
              )}
            </div>
            <label className="hard-mode-toggle-container">
              <input 
                type="checkbox" 
                checked={triviaHardMode}
                onChange={(e) => setTriviaHardMode(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>HARD MODE</span>
            </label>
          </div>
        </div>

        <div className="cinephile-card" style={{ margin: '10px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p className="cinephile-plot" style={{ fontSize: '1.05rem', lineHeight: '1.5' }}>
            &ldquo;{triviaQuestion.plot}&rdquo;
          </p>

          {triviaHardMode ? (
            <div className="cinephile-specs mono hint-locked" style={{ marginTop: '15px', color: 'var(--ink-soft)', fontStyle: 'italic', fontSize: '0.62rem' }}>
              [ HINTS DISABLED IN HARD MODE ]
            </div>
          ) : showHint ? (
            <div className="cinephile-specs mono hint-reveal" style={{ marginTop: '10px', fontSize: '0.75rem', display: 'flex', gap: '15px' }}>
              <span>YEAR: {triviaQuestion.target.year}</span>
              <span>DIRECTOR: {triviaQuestion.target.director}</span>
            </div>
          ) : (
            <div style={{ marginTop: '10px' }}>
              <button 
                className="hint-btn mono" 
                onClick={() => {
                  setShowHint(true);
                  setTriviaStreak(0);
                }}
                style={{ fontSize: '0.65rem' }}
              >
                [ REVEAL HINT (RESETS STREAK &amp; HALVES POINTS) ]
              </button>
            </div>
          )}
        </div>

        <div className="cinephile-options" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {triviaQuestion.options.map((opt, idx) => {
            let btnClass = "cinephile-opt-btn";
            if (triviaHasAnswered) {
              if (opt.title === triviaQuestion.target.title) {
                btnClass += " correct";
              } else if (triviaSelected && triviaSelected.title === opt.title) {
                btnClass += " incorrect";
              } else {
                btnClass += " disabled";
              }
            }
            return (
              <button 
                key={idx} 
                className={btnClass}
                onClick={() => handleTriviaAnswer(opt)}
                disabled={triviaHasAnswered}
                style={{ padding: '10px 14px', fontSize: '0.9rem', minHeight: '44px' }}
              >
                {opt.title} ({opt.year})
              </button>
            );
          })}
        </div>

        <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '10px' }}>
          {triviaHasAnswered && (
            <button className="cinephile-next-btn mono" onClick={generateTriviaQuestion} style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
              NEXT LOGLINE &raquo;
            </button>
          )}
        </div>
      </div>
    );
  }

  if (activeGame === 'higherlower') {
    if (!hlCurrent || !hlNext) return null;
    return (
      <div className="hl-container">
        <div className="cinephile-hud mono">
          <button className="logphile-back-btn" onClick={() => setActiveGame('menu')}>&larr; MENU</button>
          <div>
            <span>SCORE: {hlScore}</span>
            <span style={{ marginLeft: '15px' }}>BEST: {hlHighScore}</span>
          </div>
        </div>

        <div className="hl-cards-row">
          {/* Current Movie Card */}
          <div className="hl-card active-card">
            <div>
              <div className="hl-movie-title">{hlCurrent.title}</div>
              <div className="hl-movie-year">({hlCurrent.year})</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--ink-soft)', marginTop: '4px' }}>dir: {hlCurrent.director}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>IMDb RATING</div>
              <div className="hl-movie-value">{hlCurrent.rating}★</div>
            </div>
            <div style={{ height: '32px' }}></div>
          </div>

          {/* Next Movie Card */}
          <div className={`hl-card ${hlStatus === 'correct' ? 'correct-flash' : hlStatus === 'gameover' ? 'incorrect-flash' : ''}`}>
            <div>
              <div className="hl-movie-title">{hlNext.title}</div>
              <div className="hl-movie-year">({hlNext.year})</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--ink-soft)', marginTop: '4px' }}>dir: {hlNext.director}</div>
            </div>

            {hlStatus === 'playing' ? (
              <div className="hl-guess-btn-group">
                <button className="hl-guess-btn" onClick={() => handleHigherLowerGuess('higher')}>▲ HIGHER</button>
                <button className="hl-guess-btn" onClick={() => handleHigherLowerGuess('lower')}>▼ LOWER</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)', textTransform: 'uppercase' }}>IMDb RATING</div>
                <div className="hl-movie-value">{hlNext.rating}★</div>
              </div>
            )}

            <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hlStatus === 'correct' && <span className="mono" style={{ color: '#2eb85c', fontSize: '0.75rem', fontWeight: 'bold' }}>CORRECT!</span>}
              {hlStatus === 'gameover' && <span className="mono" style={{ color: '#e55353', fontSize: '0.75rem', fontWeight: 'bold' }}>GAME OVER</span>}
            </div>
          </div>
        </div>

        {hlStatus === 'gameover' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
            <button className="cineplay-reset-btn mono" onClick={startHigherLower} style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
              PLAY AGAIN &raquo;
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
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
  
  // CRT Monitor Simulation state
  const [crtEnabled, setCrtEnabled] = useState(true);

  useEffect(() => {
    if (crtEnabled) {
      document.body.classList.add('crt-effect');
      document.body.classList.add('crt-flicker');
    } else {
      document.body.classList.remove('crt-effect');
      document.body.classList.remove('crt-flicker');
    }
  }, [crtEnabled]);

  // Cabinet state
  const [category, setCategory] = useState('films');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedItem, setSelectedItem] = useState(null);
  const [displayBg, setDisplayBg] = useState('');
  const displayContentRef = useRef(null);

  // Pagination state for Cabinet list
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [category, search, sortBy]);

  // Add item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newRating, setNewRating] = useState('★★★★');
  const [newDirector, setNewDirector] = useState('');
  const [newGenres, setNewGenres] = useState('');

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item = {
      title: newTitle.trim(),
      year: newYear.trim() || new Date().getFullYear().toString(),
      image: "",
      rating: category === 'films' ? newRating : undefined,
      score: category !== 'films' ? parseFloat(newRating) || 8.0 : undefined,
      director: category === 'films' ? newDirector.trim() || 'N/A' : undefined,
      genres: category !== 'films' ? newGenres.split(',').map(g => g.trim()).filter(Boolean) : undefined,
      slug: category === 'films' ? newTitle.trim().toLowerCase().replace(/\s+/g, '-') : undefined,
      id: category !== 'films' ? Math.floor(Math.random() * 100000) : undefined,
      status: category !== 'films' ? 'completed' : undefined,
      episodes_watched: category === 'anime' ? 12 : undefined,
      chapters: category === 'manga' ? 50 : undefined,
      volumes: category === 'manga' ? 5 : undefined,
      start_date: 'N/A',
      finish_date: 'N/A',
      sort_date: new Date().toISOString().split('T')[0]
    };

    setMediaDb(prev => {
      const updated = {
        ...prev,
        [category]: [item, ...prev[category]]
      };
      return updated;
    });

    setSelectedItem(item);
    if (item.image) setDisplayBg(item.image);
    else setDisplayBg('');

    // Reset fields
    setNewTitle('');
    setNewYear('');
    setNewDirector('');
    setNewGenres('');
    setShowAddForm(false);
  };

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
      })
      .catch(err => {
        console.error(err);
        setDescription('Failed to load description.');
      })
      .finally(() => {
        setIsLoadingDesc(false);
      });
  }, [selectedItem, category]);

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
          <span>SumedhOS v2.0</span>
          <span>{currentTime}</span>
        </div>
        <div className="status-right">
          <span 
            onClick={() => setCrtEnabled(!crtEnabled)} 
            style={{ cursor: 'pointer', color: crtEnabled ? 'var(--oxblood-soft)' : 'var(--ink-soft)', fontWeight: 'bold' }}
            className="crt-toggle-status mono"
            title="Toggle CRT Screen Emulation"
          >
            [ CRT: {crtEnabled ? 'ON' : 'OFF'} ]
          </span>
          <span>System: Active</span>
          <span>CPU: 2%</span>
        </div>
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
            title="Interactive open-source stream & internet radio cassette player"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#ff4c5a' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 12H7v-2h10v2zm0-4H7V9h10v2z"/>
              </svg>
            </div>
            <span className="shortcut-label">Beats.app</span>
          </div>

          {/* Mini-app: Cinephile Hangman Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={() => openWindow('cineplay', 'Cineplay Hangman', 580, 500)}
            title="Guess the movie title letter-by-letter using dynamic titles"
          >
            <div className="shortcut-icon" style={{ backgroundColor: '#2d3748' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
            </div>
            <span className="shortcut-label">Cineplay.app</span>
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
              <section className="closet-section" aria-labelledby="closet-h" style={{ height: '100%', padding: 0 }}>
                <div className="closet-container" style={{ position: 'relative', height: '100%', minHeight: 'auto' }}>
                  <div 
                    className="closet-display-bg" 
                    style={{ 
                      backgroundImage: displayBg ? `url(${displayBg})` : 'none', 
                      opacity: displayBg ? 0.28 : 0,
                      borderRadius: '8px'
                    }}
                  ></div>

                  <div className="panel-list-view">
                    <div className="closet-nav" style={{ marginTop: 0, justifyContent: 'flex-start', marginBottom: '10px' }}>
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

                      <div className="sort-wrapper" style={{ display: 'flex', gap: '8px' }}>
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
                        <button className="add-entry-btn-trigger mono" onClick={() => setShowAddForm(true)}>
                          + LOG
                        </button>
                      </div>
                    </div>

                    {showAddForm ? (
                      <form onSubmit={handleAddNewItem} className="add-entry-form mono">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--oxblood-soft)' }}>[ Log New {category.slice(0, -1)} ]</span>
                          <button type="button" className="close-form-btn" onClick={() => setShowAddForm(false)}>[ CANCEL ]</button>
                        </div>
                        <div className="form-field-row">
                          <label>Title:</label>
                          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter title..." required />
                        </div>
                        <div className="form-field-row">
                          <label>Year:</label>
                          <input type="text" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="e.g. 2026" />
                        </div>
                        <div className="form-field-row">
                          <label>{category === 'films' ? 'Rating:' : 'Score (1-10):'}</label>
                          {category === 'films' ? (
                            <select value={newRating} onChange={(e) => setNewRating(e.target.value)}>
                              <option value="★★★★★">★★★★★ (10/10)</option>
                              <option value="★★★★½">★★★★½ (9/10)</option>
                              <option value="★★★★">★★★★ (8/10)</option>
                              <option value="★★★½">★★★½ (7/10)</option>
                              <option value="★★★">★★★ (6/10)</option>
                              <option value="★★½">★★½ (5/10)</option>
                              <option value="★★">★★ (4/10)</option>
                              <option value="★">★ (2/10)</option>
                            </select>
                          ) : (
                            <input type="number" min="1" max="10" step="0.5" value={newRating} onChange={(e) => setNewRating(e.target.value)} />
                          )}
                        </div>
                        {category === 'films' ? (
                          <div className="form-field-row">
                            <label>Director:</label>
                            <input type="text" value={newDirector} onChange={(e) => setNewDirector(e.target.value)} placeholder="Director name..." />
                          </div>
                        ) : (
                          <div className="form-field-row">
                            <label>Genres:</label>
                            <input type="text" value={newGenres} onChange={(e) => setNewGenres(e.target.value)} placeholder="Action, Sci-Fi..." />
                          </div>
                        )}
                        <button type="submit" className="submit-entry-btn">[ SAVE TO SHELF ]</button>
                      </form>
                    ) : (
                      <>
                        <div className="movie-grid">
                          {processedItems.length === 0 ? (
                            <div className="grid-empty-state mono">[ No matching titles found on the shelf ]</div>
                          ) : (
                            paginatedItems.map((item, index) => {
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
                        {processedItems.length > itemsPerPage && (
                          <div className="pagination-bar mono">
                            <button 
                              type="button"
                              disabled={currentPage === 1} 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className="page-btn"
                            >
                              &laquo; PREV
                            </button>
                            <span className="page-info">PAGE {currentPage} OF {totalPages}</span>
                            <button 
                              type="button"
                              disabled={currentPage === totalPages} 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className="page-btn"
                            >
                              NEXT &raquo;
                            </button>
                          </div>
                        )}
                      </>
                    )}
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
                            <>
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
                              {isLoadingDesc ? (
                                <p className="display-plot mono" style={{ marginTop: '1.25rem', fontSize: '0.72rem', opacity: 0.6 }}>
                                  [ Loading description... ]
                                </p>
                              ) : description && (
                                <p className="display-plot" style={{ marginTop: '1.25rem', fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--ink-soft)', lineHeight: 1.45 }}>
                                  {description.length > 180 ? description.slice(0, 180) + '...' : description}
                                </p>
                              )}
                            </>
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

            {/* CINEPLAY HANGMAN GAME CONTENT */}
            {win.id === 'cineplay' && <CineplayGame films={mediaDb.films} />}

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

// Cinephile Hangman Game (Guess the movie title from the media database)
function CineplayGame({ films }) {
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const maxWrong = 6;

  const startNewGame = () => {
    if (!films || films.length === 0) return;
    // Filter titles that are relatively short and contain only standard characters
    const validFilms = films.filter(f => f.title && f.title.length > 2 && f.title.length < 24);
    const chosen = validFilms[Math.floor(Math.random() * validFilms.length)];
    setWord(chosen.title.toUpperCase());
    setGuessed(new Set());
    setWrongCount(0);
  };

  useEffect(() => {
    startNewGame();
  }, [films]);

  const handleGuess = (letter) => {
    if (wrongCount >= maxWrong || isWon() || guessed.has(letter)) return;
    
    setGuessed(prev => {
      const next = new Set(prev);
      next.add(letter);
      return next;
    });

    if (!word.includes(letter)) {
      setWrongCount(prev => prev + 1);
    }
  };

  const isWon = () => {
    if (!word) return false;
    for (const char of word) {
      if (/[A-Z]/.test(char) && !guessed.has(char)) {
        return false;
      }
    }
    return true;
  };

  const isLost = wrongCount >= maxWrong;

  // Render the masked title
  const renderWord = () => {
    return word.split('').map((char, idx) => {
      if (/[A-Z]/.test(char)) {
        return (
          <span key={idx} className="hangman-letter-slot mono">
            {guessed.has(char) ? char : '_'}
          </span>
        );
      }
      // Reveal spaces and punctuation
      return (
        <span key={idx} className="hangman-letter-slot hangman-special mono">
          {char === ' ' ? '\u00A0\u00A0' : char}
        </span>
      );
    });
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="cineplay-game">
      <div className="cineplay-hud mono">
        <span>LIVES: {maxWrong - wrongCount} / {maxWrong} 🎬</span>
        <span>STATUS: {isWon() ? 'WON! 🎉' : isLost ? 'LOST 💀' : 'PLAYING'}</span>
      </div>

      <div className="hangman-visual">
        <div className="film-strip">
          {[...Array(maxWrong)].map((_, idx) => (
            <div 
              key={idx} 
              className={`film-frame ${idx < wrongCount ? 'burned' : ''}`}
              title={idx < wrongCount ? "Frame Burned" : "Frame Intact"}
            >
              <div className="sprocket sprocket-top"></div>
              <div className="frame-image">🎬</div>
              <div className="sprocket sprocket-bottom"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="hangman-word-container">
        {renderWord()}
      </div>

      {isLost && (
        <div className="hangman-reveal-text mono" style={{ marginBottom: '10px' }}>
          ANSWER: <span style={{ color: 'var(--oxblood-soft)' }}>{word}</span>
        </div>
      )}

      <div className="hangman-keyboard">
        {alphabet.map((letter) => {
          const hasGuessed = guessed.has(letter);
          const isCorrect = hasGuessed && word.includes(letter);
          let btnClass = "keyboard-btn mono";
          if (hasGuessed) {
            btnClass += isCorrect ? " correct" : " incorrect";
          }
          return (
            <button
              key={letter}
              className={btnClass}
              onClick={() => handleGuess(letter)}
              disabled={hasGuessed || isWon() || isLost}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {(isWon() || isLost) && (
        <div className="hangman-actions">
          <button className="cineplay-reset-btn mono" onClick={startNewGame}>
            PLAY AGAIN &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
