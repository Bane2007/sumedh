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
  const [ytApiReady, setYtApiReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // deciseconds
  const [trackDuration, setTrackDuration] = useState(180); // seconds
  const [bitrate, setBitrate] = useState(320);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const tickRef = useRef(null);
  const [equalizerPreset, setEqualizerPreset] = useState('electronic');
  const [barHeights, setBarHeights] = useState(new Array(16).fill(4));
  const ytPlayerRef = useRef(null);

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('deck'); // 'deck', 'playlist', 'search'

  const initialStreams = [
    {
      title: "Back In Black",
      artist: "AC/DC",
      url: "pAgnJDJN4VA",
      isYt: true
    },
    {
      title: "Come As You Are",
      artist: "Nirvana",
      url: "hTWKbfoikeg",
      isYt: true
    },
    {
      title: "November Rain",
      artist: "Guns N' Roses",
      url: "8SbUC-UaAxE",
      isYt: true
    },
    {
      title: "Smells Like Teen Spirit",
      artist: "Nirvana",
      url: "hTWKbfoikeg",
      isYt: true
    },
    {
      title: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      url: "1w7OgIMMRc4",
      isYt: true
    },
    {
      title: "Thunderstruck",
      artist: "AC/DC",
      url: "v2AC41dglnM",
      isYt: true
    },
    {
      title: "Paranoid",
      artist: "Black Sabbath",
      url: "uk_wUT1CvWM",
      isYt: true
    },
    {
      title: "Dream On",
      artist: "Aerosmith",
      url: "qDRORiXn14E",
      isYt: true
    },
    {
      title: "Comfortably Numb",
      artist: "Pink Floyd",
      url: "_FrdVdKlxUk",
      isYt: true
    },
    {
      title: "Hey Jude",
      artist: "The Beatles",
      url: "A_MjCqQoU_M",
      isYt: true
    },
    {
      title: "Immigrant Song",
      artist: "Led Zeppelin",
      url: "RlNhD0oS5pk",
      isYt: true
    },
    {
      title: "T.N.T.",
      artist: "AC/DC",
      url: "fGDd8Qo8aLM",
      isYt: true
    },
    {
      title: "The Chain",
      artist: "Fleetwood Mac",
      url: "kBYHwJH15v8",
      isYt: true
    },
    {
      title: "Wish You Were Here",
      artist: "Pink Floyd",
      url: "IXdNemOvyYk",
      isYt: true
    },
    {
      title: "Yesterday",
      artist: "The Beatles",
      url: "wM0IDlaUJIY",
      isYt: true
    }
  ];

  const [tracks, setTracks] = useState(initialStreams);

  const currentTrack = tracks[currentTrackIdx];

  const searchSongs = async (query) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    const endpoints = [
      "https://yewtu.be/api/v1/search",
      "https://invidious.projectsegfaut.im/api/v1/search",
      "https://iv.melmac.space/api/v1/search"
    ];

    let success = false;
    for (const ep of endpoints) {
      if (success) break;
      try {
        const res = await fetch(`${ep}?q=${encodeURIComponent(query)}&type=video`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.slice(0, 5).map(item => ({
              title: item.title,
              artist: item.author || "YouTube Artist",
              url: item.videoId,
              isYt: true
            }));
            setSearchResults(formatted);
            success = true;
          }
        }
      } catch (err) {
        // Continue to next endpoint
      }
    }

    if (!success) {
      const mockItem = {
        title: query,
        artist: "YouTube Web Query",
        url: "pAgnJDJN4VA",
        isYt: true
      };
      setSearchResults([mockItem]);
    }
    setIsSearching(false);
  };

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    if (window.YT && window.YT.Player) {
      setYtApiReady(true);
    } else {
      const checkYt = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setYtApiReady(true);
          clearInterval(checkYt);
        }
      }, 250);
      return () => clearInterval(checkYt);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setBarHeights(prev => prev.map(() => {
          const maxVal = equalizerPreset === 'rock' ? 24 : (equalizerPreset === 'pop' ? 18 : 22);
          return Math.floor(Math.random() * maxVal) + 4;
        }));
      }, 100);
    } else {
      clearInterval(timerRef.current);
      setBarHeights(new Array(16).fill(4));
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, equalizerPreset]);

  useEffect(() => {
    if (isPlaying) {
      tickRef.current = setInterval(() => {
        if (currentTrack.isYt && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const curr = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 180;
            setElapsedTime(Math.floor(curr * 10));
            setTrackDuration(dur);
          } catch(e) {}
        }
      }, 200);
    } else {
      clearInterval(tickRef.current);
    }
    return () => clearInterval(tickRef.current);
  }, [isPlaying, currentTrackIdx, tracks]);

  const loadYtVideo = (videoId) => {
    if (!window.YT || !window.YT.Player) return;

    if (!ytPlayerRef.current) {
      ytPlayerRef.current = new window.YT.Player('beats-yt-player-iframe', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(isMuted ? 0 : volume * 100);
            event.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              handleTrackChange((currentTrackIdx + 1) % tracks.length);
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          }
        }
      });
    } else {
      try {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch(e) {
        console.log("Error loading video ID: ", e);
      }
    }
  };

  const handleNativePlayPause = () => {
    if (currentTrack.isYt) {
      if (!ytPlayerRef.current) {
        loadYtVideo(currentTrack.url);
      } else {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.log("Audio play blocked: ", err));
      }
    }
  };

  const handleTrackChange = (idx) => {
    setCurrentTrackIdx(idx);
    setIsPlaying(false);
    setElapsedTime(0);
    setBitrate([192, 256, 320][Math.floor(Math.random() * 3)]);

    const nextTrack = tracks[idx];
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }

    if (nextTrack.isYt) {
      setTimeout(() => {
        loadYtVideo(nextTrack.url);
      }, 200);
    } else {
      if (audioRef.current) {
        audioRef.current.load();
        setTimeout(() => {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.log("Play failed: ", err));
        }, 100);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!currentTrack.isYt && audioRef.current) {
      setElapsedTime(Math.floor(audioRef.current.currentTime * 10));
      if (audioRef.current.duration) {
        setTrackDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    const seekVal = parseFloat(e.target.value);
    setElapsedTime(Math.floor(seekVal * 10));
    if (currentTrack.isYt) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        ytPlayerRef.current.seekTo(seekVal, true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = seekVal;
      }
    }
  };

  const loadMedia = () => {
    if (!urlInput.trim()) return;
    const target = urlInput.trim();
    let parsedUrl = target;
    let title = "Custom Stream";
    let artist = "Web Audio Link";
    let isYt = false;

    const ytMatch = target.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      isYt = true;
      parsedUrl = ytMatch[1];
      title = "Custom YouTube Song";
      artist = "YouTube Music Stream";
    } else if (target.includes('somafm.com')) {
      const match = target.match(/somafm\.com\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const channel = match[1].toLowerCase();
        parsedUrl = "https://ice1.somafm.com/" + channel + "-128-mp3";
        title = channel.charAt(0).toUpperCase() + channel.slice(1);
        artist = "SomaFM Stream";
      }
    } else {
      try {
        const urlObj = new URL(target);
        const pathname = urlObj.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        if (filename) {
          title = decodeURIComponent(filename);
        }
      } catch {
        title = "External Stream";
      }
    }

    const newTrack = { title, artist, url: parsedUrl, isYt };
    setTracks(prev => {
      const updated = [...prev, newTrack];
      const newIdx = updated.length - 1;
      setTimeout(() => {
        handleTrackChange(newIdx);
      }, 100);
      return updated;
    });
    setUrlInput('');
  };

  const formatTime = (secondsCount) => {
    const mins = Math.floor(secondsCount / 600);
    const secs = Math.floor((secondsCount % 600) / 10);
    return mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  };

  const leftTapeScale = Math.max(0.4, 1.3 - (elapsedTime / 1800));
  const rightTapeScale = Math.min(1.3, 0.4 + (elapsedTime / 1800));

  return (
    <div className="beats-compact-console-layout" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '8px' }}>
      <audio 
        ref={audioRef} 
        src={currentTrack.isYt ? undefined : currentTrack.url}
        preload="auto"
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => handleTrackChange((currentTrackIdx + 1) % tracks.length)}
      />

      <div style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div id="beats-yt-player-iframe"></div>
      </div>

      {/* Tabs Header */}
      <div className="beats-tabs-header mono" style={{ display: 'flex', borderBottom: '1px solid rgba(255,23,68,0.2)', paddingBottom: '6px', marginBottom: '8px', gap: '6px', fontSize: '0.62rem' }}>
        <button 
          className={"control-action-btn " + (activeTab === 'deck' ? 'active' : '')} 
          onClick={() => setActiveTab('deck')}
          style={{ flex: 1, padding: '3px 8px' }}
        >
          📼 PLAYER DECK
        </button>
        <button 
          className={"control-action-btn " + (activeTab === 'playlist' ? 'active' : '')} 
          onClick={() => setActiveTab('playlist')}
          style={{ flex: 1, padding: '3px 8px' }}
        >
          📁 STATIONS SHELF ({tracks.length})
        </button>
        <button 
          className={"control-action-btn " + (activeTab === 'search' ? 'active' : '')} 
          onClick={() => setActiveTab('search')}
          style={{ flex: 1, padding: '3px 8px' }}
        >
          🔍 SEARCH &amp; ADD SONGS
        </button>
      </div>

      {/* Tab Contents */}
      <div className="beats-tab-body" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {activeTab === 'deck' && (
          <div className="beats-deck-pane" style={{ width: '100%', padding: 0 }}>
            {/* Green LCD Display Screen */}
            <div className="beats-lcd-screen" style={{ background: '#0a210a', color: '#3bf53b', padding: '10px', borderRadius: '4px', border: '1.5px solid #143e14', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#3bf53b', textTransform: 'uppercase' }}>
                {currentTrack.title}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#3bf53b', textTransform: 'uppercase' }}>
                {currentTrack.artist}
              </div>
              <div className="lcd-meta-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', marginTop: '4px', borderTop: '1px solid rgba(59,245,59,0.2)', paddingTop: '4px', color: '#3bf53b' }}>
                <span>{formatTime(elapsedTime)} / {formatTime(Math.floor(trackDuration * 10))}</span>
                <span>{bitrate}KBPS</span>
              </div>
              <div className="beats-timeline-wrapper" style={{ marginTop: '2px' }}>
                <input 
                  type="range"
                  min="0"
                  max={trackDuration || 100}
                  value={elapsedTime / 10}
                  onChange={handleSeek}
                  className="beats-timeline-slider"
                />
              </div>
              <div className="lcd-visualizer" style={{ display: 'flex', gap: '2px', height: '14px', alignItems: 'flex-end', marginTop: '2px' }}>
                {barHeights.map((h, i) => (
                  <div 
                    key={i} 
                    className="vis-bar" 
                    style={{ height: h + 'px', background: '#3bf53b', flex: 1 }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="beats-cassette-housing">
              {/* Spindle hubs protruding behind spool gears */}
              <div className="spindle-hub hub-l"></div>
              <div className="spindle-hub hub-r"></div>

              {/* Tape head mechanical mock blocks */}
              <div className="cassette-tape-head"></div>
              <div className="cassette-pinch-roller roller-l"></div>
              <div className="cassette-pinch-roller roller-r"></div>

              {/* Holographic tape shell overlay */}
              <div className="cassette-shell-casing">
                {/* Handwritten paper label strip */}
                <div className="cassette-label-sticker mono" style={{
                  width: '170px',
                  height: '18px',
                  background: 'rgba(250, 245, 230, 0.95)',
                  color: '#111',
                  border: '1px solid #c0b090',
                  borderRadius: '2px',
                  fontSize: '0.48rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  marginBottom: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  ✍️ NOW: {currentTrack.title.length > 22 ? currentTrack.title.slice(0, 22) + '...' : currentTrack.title}
                </div>
                
                <div className="cassette-window">
                  <div className="window-glass-reflection"></div>
                  <div className={"spool-circle spool-l " + (isPlaying ? 'spinning' : '')}>
                    <div className="tape-roll-fill" style={{ transform: "scale(" + leftTapeScale + ")" }}></div>
                  </div>
                  <div className={"spool-circle spool-r " + (isPlaying ? 'spinning' : '')}>
                    <div className="tape-roll-fill" style={{ transform: "scale(" + rightTapeScale + ")" }}></div>
                  </div>
                </div>
                <div className="cassette-bottom-strip">STUDIO SOUND DECK v2</div>
              </div>
            </div>

            <div className="beats-volume-row">
              <button className="mute-btn" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="volume-slider"
              />
            </div>

            <div className="beats-deck-controls" style={{ marginTop: '5px' }}>
              <button className="deck-btn btn-prev" onClick={() => handleTrackChange((currentTrackIdx - 1 + tracks.length) % tracks.length)}>PREV</button>
              <button className={"deck-btn btn-play-pause " + (isPlaying ? 'active' : '')} onClick={handleNativePlayPause}>{isPlaying ? 'PAUSE' : 'PLAY'}</button>
              <button className="deck-btn btn-next" onClick={() => handleTrackChange((currentTrackIdx + 1) % tracks.length)}>NEXT</button>
            </div>

            <div className="eq-presets" style={{ marginTop: '6px' }}>
              <span className="eq-label">PRESETS:</span>
              {['flat', 'rock', 'pop', 'electronic'].map((preset) => (
                <button 
                  key={preset}
                  className={"eq-preset-btn " + (equalizerPreset === preset ? 'active' : '')}
                  onClick={() => setEqualizerPreset(preset)}
                >
                  {preset.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'playlist' && (
          <div className="beats-playlist-pane" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="playlist-title">STATIONS SHELF</div>
            <div className="playlist-scroll-list" style={{ flex: 1, overflowY: 'auto' }}>
              {tracks.map((track, idx) => (
                <div 
                  key={idx} 
                  className={"playlist-row-item " + (idx === currentTrackIdx ? 'active' : '')}
                  onClick={() => { handleTrackChange(idx); setActiveTab('deck'); }}
                >
                  <div className="playlist-row-title">{idx + 1}. {track.title}</div>
                  <div className="playlist-row-artist">{track.artist}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="beats-search-pane" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '5px 0' }}>
            <div className="playlist-title">LOAD OR SEARCH SONGS</div>
            
            {/* Custom URL Loader */}
            <div className="beats-loader-box" style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                className="beats-url-input"
                placeholder="Paste YouTube or MP3 link..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="beats-url-load-btn" onClick={() => { loadMedia(); setActiveTab('deck'); }}>LOAD</button>
            </div>

            {/* YouTube Search utility */}
            <div className="beats-search-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  className="beats-url-input"
                  placeholder="Type song query &amp; press Enter..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      searchSongs(e.target.value);
                    }
                  }}
                  id="beats-search-input-field"
                  style={{ flex: 1 }}
                />
                <button className="beats-url-load-btn" onClick={() => {
                  const val = document.getElementById('beats-search-input-field').value;
                  searchSongs(val);
                }}>SEARCH</button>
              </div>
              {isSearching && <div className="mono" style={{ fontSize: '0.55rem', opacity: 0.7 }}>[ Querying mainframe database... ]</div>}
              
              <div className="beats-search-results-scroller" style={{ flex: 1, overflowY: 'auto', maxHeight: '140px' }}>
                {searchResults.length > 0 && (
                  <div className="beats-search-results" style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px' }}>
                    <div className="mono" style={{ fontSize: '0.55rem', color: '#ff1744', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>TOP SEARCH RESULTS:</div>
                    {searchResults.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.55rem', gap: '10px', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <span className="mono" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }} title={item.title + ' - ' + item.artist}>
                          {item.title}
                        </span>
                        <button 
                          className="control-action-btn" 
                          style={{ fontSize: '0.5rem', padding: '1px 6px' }}
                          onClick={() => {
                            setTracks(prev => {
                              const updated = [...prev, item];
                              setTimeout(() => {
                                handleTrackChange(updated.length - 1);
                                setActiveTab('deck');
                              }, 100);
                              return updated;
                            });
                            setSearchResults([]);
                            document.getElementById('beats-search-input-field').value = '';
                          }}
                        >
                          + ADD
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
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
function OSWindow({ id, title, width, height, onClose, zIndex, onFocus, children, defaultPos, isClosing, isMinimized, onMinimize, defaultMaximized }) {
  const [position, setPosition] = useState(defaultPos || { x: 100, y: 80 });
  const [size, setSize] = useState({
    width: typeof width === 'number' ? width : parseInt(width) || 500,
    height: typeof height === 'number' ? height : parseInt(height) || 400
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(defaultMaximized || window.innerWidth <= 768);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ w: 0, h: 0, x: 0, y: 0 });
  const windowRef = useRef(null);
  const positionRef = useRef(position);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMaximized(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = (e, action) => {
    if (isMaximized) return;
    onFocus();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (action === 'drag') {
      if (e.target.closest('.window-controls')) return;
      setIsDragging(true);
      dragStart.current = {
        x: clientX - positionRef.current.x,
        y: clientY - positionRef.current.y
      };
      if (e.cancelable) e.preventDefault();
    } else if (action === 'resize') {
      setIsResizing(true);
      resizeStart.current = {
        w: windowRef.current ? windowRef.current.offsetWidth : size.width,
        h: windowRef.current ? windowRef.current.offsetHeight : size.height,
        x: clientX,
        y: clientY
      };
      e.stopPropagation();
      if (e.cancelable) e.preventDefault();
    }
  };

  useEffect(() => {
    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (isDragging && !isMaximized) {
        const dx = clientX - dragStart.current.x;
        const dy = clientY - dragStart.current.y;
        
        const rect = windowRef.current ? windowRef.current.getBoundingClientRect() : { width: size.width, height: size.height };
        const newX = Math.max(0, Math.min(window.innerWidth - rect.width, dx));
        const newY = Math.max(0, Math.min(window.innerHeight - rect.height - 30, dy));
        
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = clientX - resizeStart.current.x;
        const deltaY = clientY - resizeStart.current.y;
        
        const newW = Math.max(300, Math.min(window.innerWidth - positionRef.current.x - 20, resizeStart.current.w + deltaX));
        const newH = Math.max(200, Math.min(window.innerHeight - positionRef.current.y - 45, resizeStart.current.h + deltaY));
        setSize({ width: newW, height: newH });
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, isResizing, isMaximized, size.width, size.height]);

  return (
    <div 
      className={`window window--${id} ${isMaximized ? 'maximized' : ''} ${isClosing ? 'closing' : ''} ${isMinimized ? 'minimized' : ''}`} 
      ref={windowRef} 
      style={{ 
        zIndex, 
        left: isMaximized ? '0' : `${position.x}px`, 
        top: isMaximized ? '0' : `${position.y}px`,
        width: isMaximized ? '100vw' : `${size.width}px`,
        height: isMaximized ? 'calc(100vh - 30px)' : `${size.height}px`,
        position: 'absolute',
        display: isMinimized ? 'none' : 'flex',
        flexDirection: 'column'
      }}
      onMouseDown={onFocus}
      onTouchStart={onFocus}
    >
      <div 
        className="window-header" 
        onMouseDown={(e) => handleStart(e, 'drag')}
        onTouchStart={(e) => handleStart(e, 'drag')}
        onDoubleClick={() => { if (window.innerWidth > 768) setIsMaximized(!isMaximized); }}
      >
        <span className="window-title">{title}</span>
        <div className="window-controls">
          <div className="window-minimize" title="Minimize" onClick={(e) => { e.stopPropagation(); onMinimize(); }}></div>
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
      <div className="window-content" style={{ position: 'relative', height: 'calc(100% - 30px)' }}>
        {children}
      </div>
      {!isMaximized && (
        <div 
          className="window-resize-handle" 
          onMouseDown={(e) => handleStart(e, 'resize')}
          onTouchStart={(e) => handleStart(e, 'resize')}
          style={{
            position: 'absolute',
            right: '0',
            bottom: '0',
            width: '14px',
            height: '14px',
            cursor: 'se-resize',
            zIndex: 100
          }}
        />
      )}
    </div>
  );
}

const PHOTO_GALLERY = [
  {
    id: "portrait",
    title: "sumedh_portrait.raw",
    date: "2025-10-15",
    camera: "Fujifilm X-T4",
    lens: "XF 56mm f/1.2 R WR",
    specs: "ISO 160 · f/1.2 · 1/160s",
    src: `${import.meta.env.BASE_URL}assets/img/portrait.jpg`,
    desc: "Official portrait headshot. Captured outdoors in natural morning ambient light."
  },
  {
    id: "poster",
    title: "film_poster.raw",
    date: "2026-01-20",
    camera: "Sony A7R V",
    lens: "FE 24-70mm f/2.8 GM II",
    specs: "ISO 100 · f/4.0 · 1/125s",
    src: `${import.meta.env.BASE_URL}assets/img/poster.jpg`,
    desc: "Official key art layout poster graphic design file."
  },
  {
    id: "film_still",
    title: "film_still_night.raw",
    date: "2026-03-12",
    camera: "Arri Alexa Mini",
    lens: "Cooke S4/i 35mm",
    specs: "ISO 800 · f/2.0 · 1/48s",
    src: `${import.meta.env.BASE_URL}assets/img/film_still.jpg`,
    desc: "Late night setup during the final scenes. Neon highlighting on the camera rig."
  },
  {
    id: "writing_desk",
    title: "golden_hour_script.raw",
    date: "2026-04-05",
    camera: "Leica M10-R",
    lens: "Summilux 50mm f/1.4",
    specs: "ISO 200 · f/1.4 · 1/250s",
    src: `${import.meta.env.BASE_URL}assets/img/writing_desk.jpg`,
    desc: "Golden hour sun hitting the screenwriting desk. Outlining drafts."
  }
];

function PhotosApp() {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [slideshowPlaying, setSlideshowPlaying] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none'); // 'none', 'sepia', 'mono', 'warm'

  useEffect(() => {
    let interval = null;
    if (slideshowPlaying) {
      interval = setInterval(() => {
        setSelectedPhoto(current => {
          const idx = PHOTO_GALLERY.findIndex(p => p.id === (current ? current.id : ''));
          const nextIdx = (idx + 1) % PHOTO_GALLERY.length;
          return PHOTO_GALLERY[nextIdx];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [slideshowPlaying]);

  const handleSlideshowToggle = () => {
    const nextState = !slideshowPlaying;
    setSlideshowPlaying(nextState);
    if (nextState) {
      setSelectedPhoto(PHOTO_GALLERY[0]);
    }
  };

  const selectPhotoDirect = (photo) => {
    setSelectedPhoto(photo);
    setSlideshowPlaying(false);
  };

  if (selectedPhoto) {
    return (
      <div className="photos-details-view">
        <div className="photos-header-row mono">
          <button className="logphile-back-btn" onClick={() => { setSelectedPhoto(null); setSlideshowPlaying(false); }} style={{ margin: 0 }}>
            &larr; BACK TO ALBUM
          </button>
          
          <div className="photos-controls-panel">
            <button className={"control-action-btn " + (slideshowPlaying ? "active" : "")} onClick={handleSlideshowToggle}>
              {slideshowPlaying ? "⏸ PAUSE SLIDESHOW" : "▶ PLAY SLIDESHOW"}
            </button>
            <div className="filter-select-group">
              <span style={{ color: "var(--ink-soft)" }}>FILTER:</span>
              {['none', 'mono', 'sepia', 'warm'].map(f => (
                <button 
                  key={f} 
                  className={"filter-btn " + (activeFilter === f ? "active" : "")}
                  onClick={() => setActiveFilter(f)}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="photos-detail-content">
          <div className="photo-large-container">
            <img 
              src={selectedPhoto.src} 
              alt={selectedPhoto.title} 
              className={"photo-large-img filter-" + activeFilter} 
            />
          </div>
          <div className="photo-meta-panel mono">
            <div style={{ borderBottom: '1px solid var(--hairline)', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--oxblood-soft)', textTransform: 'uppercase' }}>{selectedPhoto.title}</div>
              <div style={{ fontSize: '0.55rem', color: 'var(--ink-soft)' }}>EXIF METADATA RAW FILE</div>
            </div>
            <dl className="photo-exif-list">
              <div><dt>DATE</dt><dd>{selectedPhoto.date}</dd></div>
              <div><dt>CAMERA</dt><dd>{selectedPhoto.camera}</dd></div>
              <div><dt>LENS</dt><dd>{selectedPhoto.lens}</dd></div>
              <div><dt>EXPOSURE</dt><dd>{selectedPhoto.specs}</dd></div>
            </dl>
            <p className="photo-description">
              {selectedPhoto.desc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="photos-grid-view">
      <div className="photos-album-header mono">
        <span>ALBUM: /home/sumedh/photos</span>
        <button className="control-action-btn" onClick={handleSlideshowToggle} style={{ fontSize: '0.55rem', padding: '2px 8px' }}>
          ▶ PLAY SLIDESHOW
        </button>
        <span>4 RAW IMAGES</span>
      </div>
      <div className="photos-grid">
        {PHOTO_GALLERY.map(photo => (
          <div 
            key={photo.id} 
            className="photo-polaroid-card" 
            onClick={() => selectPhotoDirect(photo)}
          >
            <div className="polaroid-img-wrapper">
              <img src={photo.src} alt={photo.title} />
            </div>
            <div className="polaroid-caption mono">
              {photo.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [debts, setDebts] = useState(() => {
    try {
      const stored = localStorage.getItem('sumedh_debts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newDebtPerson, setNewDebtPerson] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtDesc, setNewDebtDesc] = useState('');
  const [newDebtDirection, setNewDebtDirection] = useState('them_owes_me');
  const [rawNotesInput, setRawNotesInput] = useState('');

  const handleAddDebt = (e) => {
    e.preventDefault();
    if (!newDebtPerson.trim() || !newDebtAmount) return;

    const item = {
      id: Math.floor(Math.random() * 1000000),
      direction: newDebtDirection,
      person: newDebtPerson.trim(),
      amount: parseFloat(newDebtAmount) || 0,
      description: newDebtDesc.trim() || 'No description',
      date: new Date().toISOString().split('T')[0]
    };

    setDebts(prev => {
      const updated = [item, ...prev];
      localStorage.setItem('sumedh_debts', JSON.stringify(updated));

      // Local disk sync POST
      fetch('/api/sync-debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});

      return updated;
    });

    setNewDebtPerson('');
    setNewDebtAmount('');
    setNewDebtDesc('');
  };

  const handleRemoveDebt = (id) => {
    setDebts(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('sumedh_debts', JSON.stringify(updated));

      // Local disk sync POST
      fetch('/api/sync-debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});

      return updated;
    });
  };

  const handleImportNotes = () => {
    if (!rawNotesInput.trim()) return;
    const lines = rawNotesInput.split('\n');
    const parsed = [];
    lines.forEach(line => {
      const t = line.trim();
      if (!t) return;
      const owesMe = t.match(/^([a-zA-Z0-9_\s]+)\s+owes\s+me\s+([0-9.]+)(?:\s+for\s+(.+))?/i);
      const oweThem = t.match(/^owe\s+([a-zA-Z0-9_\s]+)\s+([0-9.]+)(?:\s+for\s+(.+))?/i);
      const colon = t.match(/^([a-zA-Z0-9_\s]+)\s*[:\-]\s*([0-9.]+)(?:\s*\((.+)\))?/i);

      if (owesMe) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'them_owes_me',
          person: owesMe[1].trim(),
          amount: parseFloat(owesMe[2]),
          description: owesMe[3] ? owesMe[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (oweThem) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'i_owe_them',
          person: oweThem[1].trim(),
          amount: parseFloat(oweThem[2]),
          description: oweThem[3] ? oweThem[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (colon) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'them_owes_me',
          person: colon[1].trim(),
          amount: parseFloat(colon[2]),
          description: colon[3] ? colon[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (parsed.length > 0) {
      setDebts(prev => {
        const updated = [...parsed, ...prev];
        localStorage.setItem('sumedh_debts', JSON.stringify(updated));

        fetch('/api/sync-debts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(() => {});

        return updated;
      });
      setRawNotesInput('');
    }
  };

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

  // HAL 9000 Boot Sequence state
  const [booting, setBooting] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setBooting(false); }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Start Menu State
  const [startMenuOpen, setStartMenuOpen] = useState(false);

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

  // OS Windows state
  const [windows, setWindows] = useState([]);
  const [closingWindows, setClosingWindows] = useState([]);
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
    // Sanitize legacy local storage star ratings for Anime/Manga to prevent NaN
    ['sumedh_custom_anime', 'sumedh_custom_manga'].forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.map(item => {
              if (item.score && typeof item.score === 'string' && item.score.includes('★')) {
                const stars = item.score.split('★').length - 1 + (item.score.includes('½') ? 0.5 : 0);
                item.score = stars * 2;
              }
              if (item.my_rating && typeof item.my_rating === 'string' && item.my_rating.includes('★')) {
                const stars = item.my_rating.split('★').length - 1 + (item.my_rating.includes('½') ? 0.5 : 0);
                item.my_rating = stars * 2;
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(sanitized));
          }
        }
      } catch (e) {
        console.error("Local storage sanitization error:", e);
      }
    });

    // Poll debts database every 3 seconds for cross-device real-time sync
    const fetchDebts = () => {
      fetch(`${import.meta.env.BASE_URL}assets/data/debts.json?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setDebts(data);
        })
        .catch(err => console.log("Polling debts error:", err));
    };

    fetchDebts();
    const debtsInterval = setInterval(fetchDebts, 3000);

    console.log("=== LOCALSTORAGE SYSTEM DIAGNOSTIC DUMP ===");
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      console.log(`Key: ${k} | Length: ${localStorage.getItem(k).length} chars`);
    }

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
  }, []);

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
      console.error("Jikan API error:", e);
    } finally {
      setSearchingJikan(false);
    }
  };

  const selectJikanResult = (resItem) => {
    setNewTitle(resItem.title);
    const yr = resItem.aired?.prop?.from?.year || resItem.published?.prop?.from?.year || '';
    setNewYear(yr ? yr.toString() : '');
    setNewGenres(resItem.genres?.map(g => g.name).join(', ') || '');
    setNewRating(resItem.score ? resItem.score.toString() : '8.0');
    setNewImage(resItem.images?.jpg?.large_image_url || resItem.images?.jpg?.image_url || '');
    setJikanResults([]);
    setJikanSearch('');
  };

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item = {
      title: newTitle.trim(),
      year: newYear.trim() || new Date().getFullYear().toString(),
      image: newImage.trim() || "",
      rating: category === 'films' ? newRating : undefined,
      score: category !== 'films' ? parseFloat(newRating) || 8.0 : undefined,
      my_rating: category !== 'films' ? parseFloat(newPersonalRating) || 8.5 : undefined,
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
      sort_date: new Date().toISOString().split('T')[0],
      isCustom: true
    };

    setMediaDb(prev => {
      const updated = {
        ...prev,
        [category]: [item, ...prev[category]]
      };
      
      const customKey = `sumedh_custom_${category}`;
      const existingCustom = JSON.parse(localStorage.getItem(customKey) || '[]');
      localStorage.setItem(customKey, JSON.stringify([item, ...existingCustom]));
      
      return updated;
    });

    // Dev API server sync call
    fetch('/api/log-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, item })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        console.log("Local database disk file synced successfully!");
      }
    })
    .catch(e => console.warn("Production environment fallback: Local API write ignored. Saved in session memory."));

    setSelectedItem(item);
    setDisplayBg('');

    setSelectedGenre('');
    setSelectedDecade('');
    setSearch('');
    setNewTitle('');
    setNewYear('');
    setNewDirector('');
    setNewGenres('');
    setNewPersonalRating('8.5');
    setNewImage('');
    setJikanSearch('');
    setJikanResults([]);
    setShowAddForm(false);
  };

  const handleRemoveItem = (itemToRemove, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${itemToRemove.title}" from your shelf?`)) return;

    setMediaDb(prev => {
      const updatedList = prev[category].filter(item => {
        if (category === 'films') {
          return item.slug !== itemToRemove.slug;
        } else {
          return item.id !== itemToRemove.id;
        }
      });

      const updated = {
        ...prev,
        [category]: updatedList
      };

      const customKey = `sumedh_custom_${category}`;
      const existingCustom = JSON.parse(localStorage.getItem(customKey) || '[]');
      const filteredCustom = existingCustom.filter(item => {
        if (category === 'films') {
          return item.slug !== itemToRemove.slug;
        } else {
          return item.id !== itemToRemove.id;
        }
      });
      localStorage.setItem(customKey, JSON.stringify(filteredCustom));

      return updated;
    });

    // Dev API server sync call
    fetch('/api/delete-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, itemToRemove })
    })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        console.log("Local database disk file synced successfully!");
      }
    })
    .catch(e => console.warn("Production environment fallback: Local API write ignored."));

    setSelectedItem(null);
  };

  // Media Cabinet Filter states
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('');

  const getAvailableGenres = () => {
    const items = mediaDb[category] || [];
    const genresSet = new Set();
    items.forEach(item => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach(g => genresSet.add(g));
      } else if (item.genre) {
        genresSet.add(item.genre);
      }
    });
    return Array.from(genresSet).sort();
  };

  const getAvailableDecades = () => {
    const items = mediaDb[category] || [];
    const decadesSet = new Set();
    items.forEach(item => {
      const yr = parseInt(item.year || 0);
      if (yr) {
        const dec = Math.floor(yr / 10) * 10;
        decadesSet.add(dec.toString() + 's');
      }
    });
    return Array.from(decadesSet).sort((a, b) => b.localeCompare(a));
  };

  const getAverageRating = () => {
    const items = getProcessedItems();
    if (items.length === 0) return '0.0';
    let total = 0;
    items.forEach(item => {
      if (category === 'films') {
        const starsCount = (item.rating || '').split('★').length - 1 + ((item.rating || '').includes('½') ? 0.5 : 0);
        const score = starsCount > 0 ? starsCount * 2 : parseFloat(item.imdb_rating) || 0;
        total += score;
      } else {
        const personal = parseFloat(item.my_rating);
        const score = !isNaN(personal) ? personal : parseFloat(item.score || item.rating) || 8.0;
        total += score;
      }
    });
    return (total / items.length).toFixed(1);
  };

  const getTopGenre = () => {
    const items = getProcessedItems();
    if (items.length === 0) return 'N/A';
    const genreMap = {};
    items.forEach(item => {
      const list = item.genres && Array.isArray(item.genres) ? item.genres : (item.genre ? [item.genre] : []);
      list.forEach(g => {
        genreMap[g] = (genreMap[g] || 0) + 1;
      });
    });
    let top = 'N/A';
    let max = 0;
    Object.entries(genreMap).forEach(([g, count]) => {
      if (count > max) {
        max = count;
        top = g;
      }
    });
    return top;
  };

  // Handle open/focus window
  const openWindow = (id, title, width, height) => {
    const existing = windows.find(w => w.id === id);
    if (existing) {
      if (existing.isMinimized) {
        restoreWindow(id);
      } else {
        focusWindow(id);
      }
      return;
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const winW = Math.min(width, w - 40);
    const winH = Math.min(height, h - 100);
    
    const maxX = Math.max(10, w - winW - 20);
    const maxY = Math.max(30, h - winH - 60);
    const x = Math.min(Math.max(10, (w - winW) / 2 + (windows.length * 20)), maxX);
    const y = Math.min(Math.max(30, (h - winH) / 2 + (windows.length * 15)), maxY);

    setWindows(prev => {
      const maxZVal = prev.length > 0 ? Math.max(...prev.map(w => w.zIndex)) : 20;
      const nextZ = Math.max(maxZVal + 1, 20);
      const newWindow = { id, title, width: winW, height: winH, x, y, zIndex: nextZ, isMinimized: false };
      return [...prev, newWindow];
    });
    
  };

  const closeWindow = (id) => {
    setClosingWindows(prev => [...prev, id]);
    setTimeout(() => {
      setWindows(prev => prev.filter(w => w.id !== id));
      setClosingWindows(prev => prev.filter(item => item !== id));
    }, 250);
    
  };

  const focusWindow = (id) => {
    setWindows(prev => {
      const maxZVal = prev.length > 0 ? Math.max(...prev.map(w => w.zIndex)) : 20;
      const nextZ = Math.max(maxZVal + 1, 20);
      return prev.map(w => w.id === id ? { ...w, zIndex: nextZ } : w);
    });
  };

  const minimizeWindow = (id) => {
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: true } : w
    ));
  };

  const restoreWindow = (id) => {
    setWindows(prev => {
      const maxZVal = prev.length > 0 ? Math.max(...prev.map(w => w.zIndex)) : 20;
      const nextZ = Math.max(maxZVal + 1, 20);
      return prev.map(w => w.id === id ? { ...w, isMinimized: false, zIndex: nextZ } : w);
    });
  };

  const toggleMinimizeWindow = (id) => {
    const win = windows.find(w => w.id === id);
    if (!win) return;
    if (win.isMinimized) {
      restoreWindow(id);
    } else {
      const activeWin = windows.reduce((max, w) => !w.isMinimized && w.zIndex > max.zIndex ? w : max, { zIndex: 0 });
      if (activeWin.id === id) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    }
  };

  const getProcessedItems = () => {
    let items = [];
    if (category === 'films') items = [...mediaDb.films];
    else if (category === 'anime') items = [...mediaDb.anime];
    else if (category === 'manga') items = [...mediaDb.manga];

    if (selectedGenre) {
      items = items.filter(item => {
        if (item.genres && Array.isArray(item.genres)) {
          return item.genres.includes(selectedGenre);
        } else if (item.genre) {
          return item.genre === selectedGenre;
        }
        return false;
      });
    }

    if (selectedDecade) {
      items = items.filter(item => {
        const yr = parseInt(item.year || 0);
        if (!yr) return false;
        const dec = Math.floor(yr / 10) * 10;
        return dec.toString() + 's' === selectedDecade;
      });
    }

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
        items.sort((a, b) => (b.sort_date || '').localeCompare(a.sort_date || ''));
      }
    }

    return items;
  };

  const processedItems = getProcessedItems();

  const handleOpenAddForm = () => {
    if (category === 'films') {
      setNewRating('★★★★★');
    } else {
      setNewRating('8.0');
    }
    setNewPersonalRating('8.5');
    setNewTitle('');
    setNewYear('');
    setNewDirector('');
    setNewGenres('');
    setShowAddForm(true);
  };

  const getMyRatingValue = (item) => {
    if (!item) return 'N/A';
    const personal = parseFloat(item.my_rating);
    if (!isNaN(personal)) return personal.toFixed(1) + '/10';
    return 'N/A';
  };

  const getMalScoreValue = (item) => {
    if (!item) return 'N/A';
    const scoreVal = parseFloat(item.score);
    if (!isNaN(scoreVal)) return scoreVal.toFixed(1) + '/10';
    return 'N/A';
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setSearch('');
    setSelectedGenre('');
    setSelectedDecade('');
    if (cat === 'films') {
      setNewRating('★★★★★');
    } else {
      setNewRating('8.0');
    }
    setNewPersonalRating('8.5');
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
    if (item.image) {
      setDisplayBg(item.image);
    } else {
      setDisplayBg('');
    }
    if (displayContentRef.current) {
      displayContentRef.current.style.animation = 'none';
      void displayContentRef.current.offsetHeight;
      displayContentRef.current.style.animation = '';
    }
  };

  const wallpaperStyle = {
    backgroundImage: `url(${import.meta.env.BASE_URL}assets/img/space_odyssey_bg.jpg?v=real-still)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };

  if (booting) {
    return (
      <div className="hal-boot-screen mono">
        <div className="boot-terminal">
          <div className="boot-line">SUMEDH MAIN PROCESS DECK v2.0</div>
          <div className="boot-line">----------------------------------------</div>
          <div className="boot-line progress-1">CORE MEMORY CHECK: 2048MB OK</div>
          <div className="boot-line progress-2">MOUNTING /home/sumedh... DONE</div>
          <div className="boot-line progress-3">ESTABLISHING TELEMETRY LINK... OK</div>
          <div className="boot-line progress-4">VITE EMULATION ENGINE READY.</div>
          <div className="boot-line cursor">_</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* XP Start Menu */}
      {startMenuOpen && (
        <div className="xp-start-menu mono" onClick={(e) => e.stopPropagation()}>
          {/* Header profile area */}
          <div className="xp-start-header">
            <div className="hal-menu-eye">
              <div className="hal-menu-eye-pupil"></div>
            </div>
            <div className="xp-start-username">HAL 9000 SYSTEM CORE</div>
          </div>
          
          {/* Main double panel columns */}
          <div className="xp-start-panels">
            {/* Left programs panel */}
            <div className="xp-start-left-panel">
              <div className="xp-start-item" onClick={() => { openWindow("about", "About Me", 580, 390); setStartMenuOpen(false); }}>
                <span className="xp-start-icon">👤</span>
                <div className="xp-start-item-text">
                  <div className="xp-start-item-title">About Me</div>
                  <div className="xp-start-item-desc">Learn about Sumedh's film &amp; engineering work</div>
                </div>
              </div>
              <div className="xp-start-item" onClick={() => { openWindow("debts", "Debt Desk", 600, 420); setStartMenuOpen(false); }}>
                💸 Debt Desk
              </div>
              <div className="xp-start-item" onClick={() => { openWindow("cabinet", "Media Cabinet", 800, 500); setStartMenuOpen(false); }}>
                <span className="xp-start-icon">🎬</span>
                <div className="xp-start-item-text">
                  <div className="xp-start-item-title">Media Cabinet</div>
                  <div className="xp-start-item-desc">Browse films, anime, and manga shelf</div>
                </div>
              </div>
              <div className="xp-start-item" onClick={() => { openWindow("photos", "Photos Gallery", 600, 420); setStartMenuOpen(false); }}>
                <span className="xp-start-icon">📷</span>
                <div className="xp-start-item-text">
                  <div className="xp-start-item-title">Photos.app</div>
                  <div className="xp-start-item-desc">View production stills and portraits</div>
                </div>
              </div>
              <div className="xp-start-item" onClick={() => { openWindow("beats", "Beats Player", 540, 410); setStartMenuOpen(false); }}>
                <span className="xp-start-icon">📻</span>
                <div className="xp-start-item-text">
                  <div className="xp-start-item-title">Beats Player</div>
                  <div className="xp-start-item-desc">Stream retro cassettes &amp; online radio</div>
                </div>
              </div>
              <div className="xp-start-item" onClick={() => { openWindow("cinephile", "Logline Trivia", 520, 410); setStartMenuOpen(false); }}>
                <span className="xp-start-icon">🎮</span>
                <div className="xp-start-item-text">
                  <div className="xp-start-item-title">Logline Trivia</div>
                  <div className="xp-start-item-desc">Test your movie knowledge</div>
                </div>
              </div>
            </div>
            
            {/* Right system panel */}
            <div className="xp-start-right-panel">
              <div className="xp-start-right-item" onClick={() => { openWindow("photos", "Photos Gallery", 600, 420); setStartMenuOpen(false); }}>
                <span>📁 My Documents</span>
              </div>
              <div className="xp-start-right-item" onClick={() => { openWindow("photos", "Photos Gallery", 600, 420); setStartMenuOpen(false); }}>
                <span>🖼️ My Pictures</span>
              </div>
              <div className="xp-start-right-item" onClick={() => { openWindow("beats", "Beats Player", 540, 410); setStartMenuOpen(false); }}>
                <span>🎵 My Music</span>
              </div>
              <div className="xp-start-right-divider"></div>
              <div className="xp-start-right-item" onClick={() => { setCrtEnabled(!crtEnabled); setStartMenuOpen(false); }}>
                <span>⚙️ Control Panel (CRT)</span>
              </div>
              <div className="xp-start-right-item" onClick={() => { openWindow("contact", "Contact Links", 360, 180); setStartMenuOpen(false); }}>
                <span>🔗 Connect Links</span>
              </div>
            </div>
          </div>
          
          {/* Footer bar */}
          <div className="xp-start-footer">
            <button className="xp-footer-btn" onClick={() => { setStartMenuOpen(false); alert("Logging off..."); }}>
              🔑 Log Off
            </button>
            <button className="xp-footer-btn shutdown" onClick={() => { setStartMenuOpen(false); alert("Shutting down SumedhOS..."); }}>
              🔴 Turn Off Computer
            </button>
          </div>
        </div>
      )}

      {/* Top Status Bar (XP Bottom Taskbar layout) */}
      <div className="status-bar" onClick={(e) => e.stopPropagation()}>
        <div className="status-left">
          <button 
            className={"xp-start-btn " + (startMenuOpen ? "pressed" : "")} 
            onClick={(e) => {
              e.stopPropagation();
              setStartMenuOpen(!startMenuOpen);
            }}
          >
            🔴 HAL 9000
          </button>
          <span>SumedhOS v2.0</span>
          <span>{currentTime}</span>
        </div>

        {/* Taskbar open windows middle shell */}
        <div className="status-middle">
          {windows.map(win => {
            const isWindowActive = windows.filter(w => !w.isMinimized).sort((a,b) => b.zIndex - a.zIndex)[0]?.id === win.id;
            return (
              <button 
                key={win.id} 
                className={"taskbar-window-btn " + (isWindowActive ? "active" : "") + (win.isMinimized ? " minimized" : "")}
                onClick={() => toggleMinimizeWindow(win.id)}
              >
                {win.title}
              </button>
            );
          })}
        </div>
        <div className="status-right">
          <span 
            onClick={() => setCrtEnabled(!crtEnabled)} 
            style={{ cursor: 'pointer', color: crtEnabled ? '#00e676' : '#ff5252', fontWeight: 'bold' }}
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
      <div className="desktop" style={wallpaperStyle} onClick={() => setStartMenuOpen(false)}>
        
        {/* Desktop Shortcuts (App Icons on screen) */}
        <div className="desktop-shortcuts">
          {/* Debt Desk Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("debts", "Debt Desk", 600, 420); }}
            title="Track and parse debts in real time"
          >
            <div className="shortcut-icon" style={{ fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px', width: '42px' }}>
              💸
            </div>
            <span className="shortcut-label">Debt Desk</span>
          </div>

          {/* Media Cabinet Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("cabinet", "Media Cabinet", 800, 500); }}
            title="Open film, anime, and manga lists"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 14H42V38C42 39.1 41.1 40 40 40H8C6.9 40 6 39.1 6 38V14Z" fill="#2d2d2d" stroke="#febb02" strokeWidth="2.5"/>
                <path d="M6 14L10 8H42L38 14H6Z" fill="#ffb300" stroke="#febb02" strokeWidth="2.5"/>
                <circle cx="16" cy="27" r="5" fill="#febb02"/>
                <circle cx="32" cy="27" r="5" fill="#febb02"/>
                <path d="M21 27H27" stroke="#1c1512" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="shortcut-label">Media Cabinet</span>
          </div>

          {/* About Me Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("about", "About Me", 580, 390); }}
            title="Biographical details and technical profile"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="8" width="36" height="26" rx="4" fill="#0054e3" stroke="#ffffff" strokeWidth="2.5"/>
                <rect x="10" y="12" width="28" height="18" rx="2" fill="#1b1c1d" stroke="#3bf53b" strokeWidth="1.5"/>
                <path d="M14 17H26" stroke="#3bf53b" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 21H22" stroke="#3bf53b" strokeWidth="2" strokeLinecap="round"/>
                <path d="M16 34L12 40H36L32 34H16Z" fill="#0044b4" stroke="#ffffff" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="shortcut-label">About Me</span>
          </div>

          {/* Mini-app: Cinephile Trivia Game Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("cinephile", "Logline Trivia", 520, 410); }}
            title="Guess the movie using screenplay loglines"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 8H38C39.1 8 40 8.9 40 10V18C38 18 36 20 36 22C36 24 38 26 40 26V38C40 39.1 39.1 40 38 40H10C8.9 40 8 39.1 8 38V26C10 26 12 24 12 22C12 20 10 18 8 18V10C8 8.9 8.9 8 10 8Z" fill="#ff5252" stroke="#ffffff" strokeWidth="2.5"/>
                <line x1="20" y1="15" x2="28" y2="15" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
                <line x1="20" y1="22" x2="28" y2="22" stroke="#ffffff" strokeWidth="3" strokeDasharray="2 2"/>
                <line x1="20" y1="29" x2="28" y2="29" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="shortcut-label">Logline.app</span>
          </div>

          {/* Mini-app: Beats Player Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("beats", "Beats Player", 540, 410); }}
            title="Interactive open-source stream &amp; internet radio cassette player"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="6" width="32" height="36" rx="4" fill="#ffca28" stroke="#37474f" strokeWidth="2.5"/>
                <rect x="14" y="14" width="20" height="14" rx="2" fill="#37474f"/>
                <circle cx="20" cy="21" r="3" fill="#ffffff"/>
                <circle cx="28" cy="21" r="3" fill="#ffffff"/>
                <rect x="14" y="34" width="6" height="4" fill="#ff5252" rx="1"/>
                <rect x="21" y="34" width="6" height="4" fill="#1e88e5" rx="1"/>
                <rect x="28" y="34" width="6" height="4" fill="#4caf50" rx="1"/>
              </svg>
            </div>
            <span className="shortcut-label">Beats.app</span>
          </div>

          {/* Mini-app: Cinephile Hangman Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("cineplay", "Cineplay Hangman", 520, 410); }}
            title="Guess the movie title letter-by-letter using dynamic titles"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="14" width="36" height="20" rx="10" fill="#9e9e9e" stroke="#37474f" strokeWidth="2.5"/>
                <path d="M12 24H18" stroke="#37474f" strokeWidth="3.5" strokeLinecap="round"/>
                <path d="M15 21V27" stroke="#37474f" strokeWidth="3.5" strokeLinecap="round"/>
                <circle cx="29" cy="24" r="3.5" fill="#ff5252"/>
                <circle cx="35" cy="24" r="3.5" fill="#ffca28"/>
              </svg>
            </div>
            <span className="shortcut-label">Cineplay.app</span>
          </div>

          {/* Contact Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("contact", "Contact Links", 360, 180); }}
            title="External portfolios, social networks and profiles"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 16H42V38C42 39.1 41.1 40 40 40H8C6.9 40 6 39.1 6 38V16Z" fill="#eceff1" stroke="#37474f" strokeWidth="2.5"/>
                <path d="M6 16H20L24 10H38C39.1 10 40 10.9 40 12V16" fill="#29b6f6" stroke="#37474f" strokeWidth="2.5"/>
                <circle cx="16" cy="26" r="3.5" fill="#ff7043"/>
                <path d="M11 34C11 31 13.5 30 16 30C18.5 30 21 31 21 34" stroke="#ff7043" strokeWidth="2" strokeLinecap="round"/>
                <line x1="26" y1="23" x2="36" y2="23" stroke="#78909c" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="26" y1="29" x2="34" y2="29" stroke="#78909c" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="shortcut-label">Contact</span>
          </div>

          {/* Photos Shortcut */}
          <div 
            className="shortcut-item" 
            onClick={(e) => { e.stopPropagation(); openWindow("photos", "Photos Gallery", 600, 420); }}
            title="View personal cinematic photography"
          >
            <div className="shortcut-icon">
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="6" width="32" height="36" rx="2" fill="#ffffff" stroke="#37474f" strokeWidth="2.5"/>
                <rect x="11" y="9" width="26" height="23" fill="#00bcd4"/>
                <path d="M11 26L18 19L26 27L31 22L37 28V32H11V26Z" fill="#4caf50"/>
                <circle cx="18" cy="14" r="2.5" fill="#ffeb3b"/>
              </svg>
            </div>
            <span className="shortcut-label">Photos.app</span>
          </div>
        </div>        {/* Retro System Info Desktop Widget */}
        <div className="desktop-sysinfo-widget mono" onClick={(e) => e.stopPropagation()}>
          <div className="widget-header">[ SYSTEM MONITOR ]</div>
          <div className="widget-row"><strong>USER:</strong> sumedh_jamsandekar</div>
          <div className="widget-row"><strong>ROLE:</strong> writer_director_engineer</div>
          <div className="widget-row"><strong>OS:</strong> HAL 9000 v3.14</div>
          <div className="widget-row"><strong>HOST:</strong> discovery_1_mainframe</div>
          <div className="widget-row"><strong>CRT:</strong> {crtEnabled ? 'ACTIVE' : 'STANDBY'}</div>
          <div className="widget-divider"></div>
          <div className="widget-stats">
            <span className="stat-col">CPU: 2.1%</span>
            <span className="stat-col">RAM: 14%</span>
          </div>
        </div>

        {/* HAL 9000 Desktop Assistant */}


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
            isClosing={closingWindows.includes(win.id)}
            isMinimized={win.isMinimized}
            onMinimize={() => minimizeWindow(win.id)}
            defaultMaximized={win.id === 'cabinet'}
          >
                        {/* RUN DIALOG CONTENT */}
            {win.id === 'debts' && (
              <div className="debt-list-dialog mono" onClick={(e) => e.stopPropagation()} style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                <div className="closet-header" style={{ marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#ff1744' }}>💸 SUMEDH DEBT DESK</h2>
                  <p style={{ fontSize: '0.62rem', color: 'var(--ink-soft)', margin: '4px 0 0 0' }}>Sync and track debts in real time.</p>
                </div>

                {/* Net balance HUD */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                  <div style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--ink-soft)' }}>TOTAL THEY OWE ME</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#4caf50', marginTop: '4px' }}>
                      ${debts.filter(d => d.direction === 'them_owes_me').reduce((acc, c) => acc + c.amount, 0).toFixed(2)}
                    </div>
                  </div>
                  <div style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.55rem', color: 'var(--ink-soft)' }}>TOTAL I OWE THEM</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff5722', marginTop: '4px' }}>
                      ${debts.filter(d => d.direction === 'i_owe_them').reduce((acc, c) => acc + c.amount, 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', flex: 1, minHeight: 0 }}>
                  {/* Left Column: Form & Import */}
                  <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <form onSubmit={handleAddDebt} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #333', padding: '10px', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 'bold', marginBottom: '8px', color: '#ff1744' }}>[ LOG NEW DEBT ]</div>
                      
                      <div style={{ marginBottom: '6px', fontSize: '0.6rem' }}>
                        <label style={{ display: 'block', color: 'var(--ink-soft)' }}>Person:</label>
                        <input type="text" value={newDebtPerson} onChange={(e) => setNewDebtPerson(e.target.value)} required placeholder="Name..." style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: '3px' }} />
                      </div>

                      <div style={{ marginBottom: '6px', fontSize: '0.6rem' }}>
                        <label style={{ display: 'block', color: 'var(--ink-soft)' }}>Amount ($):</label>
                        <input type="number" step="0.01" min="0.01" value={newDebtAmount} onChange={(e) => setNewDebtAmount(e.target.value)} required placeholder="0.00" style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: '3px' }} />
                      </div>

                      <div style={{ marginBottom: '6px', fontSize: '0.6rem' }}>
                        <label style={{ display: 'block', color: 'var(--ink-soft)' }}>Description:</label>
                        <input type="text" value={newDebtDesc} onChange={(e) => setNewDebtDesc(e.target.value)} placeholder="Pizza, Uber..." style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: '3px' }} />
                      </div>

                      <div style={{ marginBottom: '8px', fontSize: '0.6rem' }}>
                        <label style={{ display: 'block', color: 'var(--ink-soft)' }}>Type:</label>
                        <select value={newDebtDirection} onChange={(e) => setNewDebtDirection(e.target.value)} style={{ width: '100%', background: '#222', border: '1px solid #444', color: '#fff', padding: '3px' }}>
                          <option value="them_owes_me">They Owe Me</option>
                          <option value="i_owe_them">I Owe Them</option>
                        </select>
                      </div>

                      <button type="submit" style={{ width: '100%', background: '#ff1744', border: 'none', color: '#fff', padding: '4px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 'bold' }}>[ ADD DEBT ]</button>
                    </form>

                    {/* Samsung notes importer box */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #333', padding: '10px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ff9800' }}>[ IMPORT FROM SAMSUNG NOTES ]</div>
                      <textarea 
                        value={rawNotesInput} 
                        onChange={(e) => setRawNotesInput(e.target.value)} 
                        placeholder="Paste list here (e.g.\nJohn owes me 50 for pizza\nSarah: 20\nowe Mike 15)..."
                        style={{ width: '100%', height: '70px', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.52rem', padding: '3px', resize: 'none' }}
                      />
                      <button onClick={handleImportNotes} style={{ width: '100%', background: '#ff9800', border: 'none', color: '#fff', padding: '4px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 'bold' }}>[ PARSE &amp; MERGE ]</button>
                    </div>
                  </div>

                  {/* Right Column: Debts Grid list */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid #333', borderRadius: '4px', background: '#0b0807', overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.65rem', background: '#181210', padding: '6px 10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                      <span>RECORDED BALANCES ({debts.length})</span>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                      {debts.length === 0 ? (
                        <div style={{ color: 'var(--ink-soft)', fontSize: '0.6rem', textAlign: 'center', marginTop: '40px' }}>[ No active debts logged ]</div>
                      ) : (
                        debts.map(d => (
                          <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid #222', background: 'rgba(255,255,255,0.01)', fontSize: '0.62rem', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                              <span style={{ fontWeight: 'bold', color: d.direction === 'them_owes_me' ? '#4caf50' : '#ff5722' }}>
                                {d.person} {d.direction === 'them_owes_me' ? 'owes me' : 'is owed by me'}
                              </span>
                              <span style={{ fontSize: '0.52rem', color: 'var(--ink-soft)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {d.description} &middot; {d.date}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.72rem', color: d.direction === 'them_owes_me' ? '#4caf50' : '#ff5722' }}>
                                ${d.amount.toFixed(2)}
                              </span>
                              <button onClick={() => handleRemoveDebt(d.id)} style={{ background: '#222', border: '1px solid #444', color: '#ff1744', padding: '2px 4px', fontSize: '0.5rem', cursor: 'pointer', borderRadius: '2px' }}>SETTLE</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {win.id === 'run' && (
              <div className="run-dialog-content mono" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>🏃</span>
                  <div style={{ fontSize: '0.72rem' }}>Type the name of a program, folder, or easter egg command, and SumedhOS will open it.</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 'bold' }}>Open:</span>
                  <input 
                    type="text" 
                    className="run-input"
                    autoFocus
                    placeholder="e.g. destroy, bliss, matrix, beats, about..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const cmd = e.target.value.toLowerCase().trim();
                        if (['destroy', 'melt'].includes(cmd)) {
                          document.body.style.transform = 'skewY(2deg) scale(0.9)';
                          document.body.style.filter = 'hue-rotate(90deg) invert(1)';
                          setTimeout(() => {
                            document.body.style.transform = 'none';
                            document.body.style.filter = 'none';
                          }, 3000);
                        } else if (cmd === 'matrix') {
                          alert("Entering the Matrix...");
                          document.body.style.background = '#000000';
                          document.body.style.color = '#3bf53b';
                        } else if (['bliss', 'xp'].includes(cmd)) {
                          alert("Bliss wallpaper loaded!");
                          document.querySelector('.desktop').style.backgroundImage = 'url(/assets/img/xp_bliss.jpg)';
                        } else if (cmd === 'about') {
                          openWindow('about', 'About Me', 580, 390);
                        } else if (cmd === 'cabinet') {
                          openWindow('cabinet', 'Media Cabinet', 800, 500);
                        } else if (cmd === 'photos') {
                          openWindow('photos', 'Photos Gallery', 600, 420);
                        } else if (cmd === 'beats') {
                          openWindow('beats', 'Beats Player', 540, 410);
                        } else if (cmd === 'control panel') {
                          setCrtEnabled(!crtEnabled);
                        } else if (cmd === 'shutdown') {
                          alert("Shutting down SumedhOS system...");
                        } else {
                          alert('Unknown command: ' + cmd + '. Try matrix, destroy, bliss, beats, about.');
                        }
                        e.target.value = '';
                        closeWindow('run');
                      }
                    }}
                  />
                </div>
              </div>
            )}

{/* PHOTOS CONTENT */}
            {win.id === 'photos' && <PhotosApp />}

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

                      <div className="sort-wrapper" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <select 
                          className="sort-select mono"
                          value={selectedGenre}
                          onChange={(e) => setSelectedGenre(e.target.value)}
                        >
                          <option value="">All Genres</option>
                          {getAvailableGenres().map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>

                        <select 
                          className="sort-select mono"
                          value={selectedDecade}
                          onChange={(e) => setSelectedDecade(e.target.value)}
                        >
                          <option value="">All Decades</option>
                          {getAvailableDecades().map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>

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
                        <button className="add-entry-btn-trigger mono" onClick={handleOpenAddForm}>
                          + LOG
                        </button>
                        
                      </div>
                    </div>

                    {/* Stats Dashboard HUD */}
                    <div className="cabinet-stats-hud mono">
                      <span className="stat-badge">TOTAL WATCHED: {processedItems.length}</span>
                      <span className="stat-badge">AVERAGE SCORE: {getAverageRating()}/10</span>
                      <span className="stat-badge">TOP GENRE: {getTopGenre()}</span>
                    </div>

                    {showAddForm ? (
                      <form onSubmit={handleAddNewItem} className="add-entry-form mono" style={{ background: '#111', border: '1.5px solid var(--hairline)', padding: '15px', borderRadius: '4px', marginBottom: '15px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ff1744' }}>[ Log New {category.slice(0, -1)} ]</span>
                          <button type="button" className="close-form-btn" onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', fontSize: '0.62rem' }}>[ CANCEL ]</button>
                        </div>
                        
                        {category !== 'films' && (
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed #444', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--ink-soft)', marginBottom: '4px' }}>[ AUTO-COMPLETE FROM MYANIMELIST ]</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text" 
                                value={jikanSearch} 
                                onChange={(e) => setJikanSearch(e.target.value)} 
                                placeholder="Search e.g. Naruto..." 
                                style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '3px 6px', fontSize: '0.72rem' }}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchJikan(); } }}
                              />
                              <button type="button" onClick={searchJikan} style={{ background: '#333', border: '1px solid #555', color: '#fff', padding: '2px 8px', fontSize: '0.65rem', cursor: 'pointer' }}>
                                {searchingJikan ? '...' : 'SEARCH'}
                              </button>
                            </div>
                            {jikanResults.length > 0 && (
                              <div style={{ background: '#000', border: '1px solid #333', marginTop: '6px', maxHeight: '100px', overflowY: 'auto' }}>
                                {jikanResults.map(res => (
                                  <div 
                                    key={res.mal_id} 
                                    onClick={() => selectJikanResult(res)} 
                                    style={{ padding: '4px', borderBottom: '1px solid #222', fontSize: '0.65rem', cursor: 'pointer' }}
                                    onMouseEnter={(e) => e.target.style.background = '#222'}
                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                  >
                                    {res.title} ({res.aired?.prop?.from?.year || res.published?.prop?.from?.year || 'N/A'})
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="form-field-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center', fontSize: '0.72rem' }}>
                          <label style={{ width: '80px', color: 'var(--ink-soft)' }}>Title:</label>
                          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter title..." required style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                        </div>
                        <div className="form-field-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center', fontSize: '0.72rem' }}>
                          <label style={{ width: '80px', color: 'var(--ink-soft)' }}>Cover URL:</label>
                          <input type="url" value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="https://..." style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                        </div>
                        <div className="form-field-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center', fontSize: '0.72rem' }}>
                          <label style={{ width: '80px', color: 'var(--ink-soft)' }}>Year:</label>
                          <input type="text" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="e.g. 2026" style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                        </div>
                        <div className="form-field-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center', fontSize: '0.72rem' }}>
                          <label style={{ width: '80px', color: 'var(--ink-soft)' }}>{category === 'films' ? 'Rating:' : 'Scores (1-10):'}</label>
                          {category === 'films' ? (
                            <select value={newRating} onChange={(e) => setNewRating(e.target.value)} style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }}>
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
                            <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '5px' }}>
                                <span style={{ color: 'var(--ink-soft)' }}>General:</span>
                                <input type="number" min="1" max="10" step="0.1" value={newRating} onChange={(e) => setNewRating(e.target.value)} style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                              </div>
                              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '5px' }}>
                                <span style={{ color: 'var(--ink-soft)' }}>Mine:</span>
                                <input type="number" min="1" max="10" step="0.1" value={newPersonalRating} onChange={(e) => setNewPersonalRating(e.target.value)} style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                              </div>
                            </div>
                          )}
                        </div>
                        {category === 'films' ? (
                          <div className="form-field-row" style={{ display: 'flex', marginBottom: '10px', alignItems: 'center', fontSize: '0.72rem' }}>
                            <label style={{ width: '80px', color: 'var(--ink-soft)' }}>Director:</label>
                            <input type="text" value={newDirector} onChange={(e) => setNewDirector(e.target.value)} placeholder="Director name..." style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                          </div>
                        ) : (
                          <div className="form-field-row" style={{ display: 'flex', marginBottom: '15px', alignItems: 'center', fontSize: '0.72rem' }}>
                            <label style={{ width: '80px', color: 'var(--ink-soft)' }}>Genres:</label>
                            <input type="text" value={newGenres} onChange={(e) => setNewGenres(e.target.value)} placeholder="Action, Sci-Fi..." style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#fff', padding: '4px 8px' }} />
                          </div>
                        )}
                        <button type="submit" className="submit-entry-btn" style={{ background: '#ff1744', border: 'none', color: '#fff', padding: '6px 12px', fontSize: '0.72rem', cursor: 'pointer' }}>[ SAVE TO SHELF ]</button>
                      </form>
                    ) : (
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
                                style={{ animationDelay: `${index * 12}ms`, position: 'relative' }}
                                tabIndex="0"
                                onClick={() => handleItemSelect(item)}
                                onFocus={() => handleItemSelect(item)}
                              >
                                {item.isCustom && (
                                  <button 
                                    className="custom-item-delete-btn"
                                    onClick={(e) => handleRemoveItem(item, e)}
                                    title="Delete custom entry"
                                    style={{
                                      position: 'absolute',
                                      top: '4px',
                                      right: '4px',
                                      background: 'rgba(255, 23, 68, 0.95)',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '3px',
                                      fontSize: '0.52rem',
                                      padding: '2px 5px',
                                      cursor: 'pointer',
                                      zIndex: 10,
                                      fontWeight: 'bold',
                                      fontFamily: 'monospace'
                                    }}
                                  >
                                    DELETE
                                  </button>
                                )}
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
                    )}
                  </div>

                  <div className="closet-display">
                    <div 
                      className="display-content" 
                      ref={displayContentRef}
                      style={{ display: selectedItem ? 'block' : 'none' }}
                    >
                      {selectedItem && (
                        <div className="display-split-layout" style={{ display: 'flex', gap: '24px', width: '100%', alignItems: 'flex-start' }}>
                          
                          {/* Left Panel: Cover & Compact Specs Grid */}
                          <div className="display-left-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '160px', flexShrink: 0, alignItems: 'center' }}>
                            {selectedItem.image ? (
                              <img className="cover-art" src={selectedItem.image} alt={selectedItem.title} referrerPolicy="no-referrer" style={{ width: '140px', height: '200px', margin: 0 }} />
                            ) : (
                              <div className="cover-art" style={{ width: '140px', height: '200px', margin: 0 }} dangerouslySetInnerHTML={{ __html: generateGenericCover(selectedItem.title, selectedItem.year) }} />
                            )}
                            
                            <dl className="display-specs mono" style={{ marginTop: '12px', paddingTop: '10px', width: '100%', maxWidth: '160px', borderTop: '1px solid var(--hairline)' }}>
                              <div><dt>Status</dt><dd>{selectedItem.status || (category === 'films' ? 'watched' : 'completed')}</dd></div>
                              {category === 'anime' && <div><dt>Progress</dt><dd>{selectedItem.episodes_watched} eps</dd></div>}
                              {category === 'manga' && (
                                <>
                                  <div><dt>Chapters</dt><dd>{selectedItem.chapters || 0} chs</dd></div>
                                  <div><dt>Volumes</dt><dd>{selectedItem.volumes || 0} vols</dd></div>
                                </>
                              )}
                              {selectedItem.start_date && selectedItem.start_date !== 'N/A' && <div><dt>Started</dt><dd>{selectedItem.start_date}</dd></div>}
                              {selectedItem.finish_date && selectedItem.finish_date !== 'N/A' && <div><dt>Finished</dt><dd>{selectedItem.finish_date}</dd></div>}
                              {category !== 'films' && (
                                <div>
                                  <dt>My Rating</dt>
                                  <dd>{getMyRatingValue(selectedItem)}</dd>
                                </div>
                              )}
                            </dl>
                          </div>

                          {/* Right Panel: Title, Info, Description */}
                          <div className="display-right-panel" style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <div>
                              <h3 className="display-title" style={{ margin: '0 0 4px 0', fontSize: '1.6rem', textAlign: 'left' }}>
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

                              <p className="display-director mono" style={{ margin: '0 0 10px 0', textAlign: 'left' }}>
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

                              <div className="display-meta mono" style={{ margin: 0, justifyContent: 'flex-start' }}>
                                {selectedItem.year} &middot; {category === 'films' ? (
                                  renderStars(selectedItem.rating)
                                ) : (
                                  <span>MAL Score: {getMalScoreValue(selectedItem)}</span>
                                )}
                                {category === 'films' && selectedItem.imdb_rating && selectedItem.imdb_rating !== 'N/A' && (
                                  <> &middot; <span style={{ color: '#ffb400', fontWeight: 'bold' }}>{selectedItem.imdb_rating}/10 (IMDb)</span></>
                                )}
                              </div>
                            </div>

                            {/* Genres Row */}
                            {selectedItem.genres && selectedItem.genres.length > 0 && (
                              <div className="mono" style={{ fontSize: '0.62rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', marginRight: '6px' }}>Genres:</span>
                                <span style={{ color: 'var(--ink)' }}>{selectedItem.genres.join(', ')}</span>
                              </div>
                            )}

                            {/* Cast / Cast Details */}
                            {category === 'films' && selectedItem.cast && selectedItem.cast !== 'N/A' && (
                              <div className="mono" style={{ fontSize: '0.62rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                <span style={{ color: 'var(--ink-soft)', textTransform: 'uppercase', marginRight: '6px' }}>Cast:</span>
                                <span style={{ color: 'var(--ink)' }}>{selectedItem.cast}</span>
                              </div>
                            )}

                            {/* Description block (Plot) */}
                            <div className="display-description-box" style={{ flex: 1, overflowY: 'auto' }}>
                              {category === 'films' ? (
                                selectedItem.plot && selectedItem.plot !== 'N/A' && (
                                  <p className="display-description">
                                    {selectedItem.plot}
                                  </p>
                                )
                              ) : (
                                isLoadingDesc ? (
                                  <p className="display-description" style={{ opacity: 0.6 }}>[ Loading description from MyAnimeList... ]</p>
                                ) : description && (
                                  <p className="display-description">
                                    {description}
                                  </p>
                                )
                              )}
                            </div>
                          </div>

                        </div>
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
