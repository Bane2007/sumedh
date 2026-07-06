import { useState, useEffect, useRef } from 'react';

const OS_DATA = {
  folders: [
    { 
      id: 'social', 
      name: 'Socials', 
      color: '#c8615a', 
      files: [
        { label: "Instagram", url: "https://www.instagram.com/sumed_nj/", meta: "visuals.img" },
        { label: "GitHub", url: "https://github.com/Bane2007", meta: "source.code" },
        { label: "Letterboxd", url: "https://letterboxd.com/Bane_snj/", meta: "cinema.log" },
        { label: "IMDb", url: "https://www.imdb.com/name/nm18199394/", meta: "bio.pdf" },
      ] 
    },
    { 
      id: 'work', 
      name: 'Projects', 
      color: '#e08a82', 
      files: [
        { label: "Portfolio", url: "#", meta: "index.html" },
        { label: "StoryGraph", url: "https://app.thestorygraph.com/profile/sumed_nj", meta: "reading.txt" },
      ] 
    },
    { 
      id: 'archive', 
      name: 'Archive', 
      color: '#9c9182', 
      files: [
        { label: "Sadako (2025)", url: "https://www.youtube.com/watch?v=bSUdWw-3dmE", meta: "film.mp4" },
        { label: "The Abyss", url: "#", meta: "game.exe" },
      ] 
    },
  ]
};

function Window({ folder, onClose, zIndex, onFocus }) {
  const [currentView, setCurrentView] = useState('folder'); // 'folder' or 'files'
  const windowRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = () => onFocus();
    windowRef.current.addEventListener('mousedown', handleMouseDown);
    return () => windowRef.current.removeEventListener('mousedown', handleMouseDown);
  }, [onFocus]);

  return (
    <div className="window" ref={windowRef} style={{ zIndex }}>
      <div className="window-header">
        <span className="window-title">{folder.name}</span>
        <div className="window-close" onClick={onClose}></div>
      </div>
      <div className="window-content">
        {currentView === 'folder' ? (
          <div className="folder-grid">
            <div className="folder-item" onClick={() => setCurrentView('files')}>
              <div className="folder-icon" style={{ backgroundColor: folder.color }}></div>
              <span className="folder-name">{folder.name}</span>
            </div>
          </div>
        ) : (
          <div className="file-list">
            {folder.files.map((file, i) => (
              <a key={i} href={file.url} className="file-item" target="_blank" rel="noopener noreferrer">
                <div className="file-icon"></div>
                <div className="file-info">
                  <span className="file-label">{file.label}</span>
                  <span className="file-meta">{file.meta}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [openWindows, setOpenWindows] = useState([]);
  const [maxZ, setMaxZ] = useState(10);

  const openFolder = (folder) => {
    if (openWindows.find(w => w.id === folder.id)) {
      focusWindow(folder.id);
      return;
    }
    setOpenWindows([...openWindows, folder]);
    setMaxZ(prev => prev + 1);
  };

  const closeWindow = (id) => {
    setOpenWindows(openWindows.filter(w => w.id !== id));
  };

  const focusWindow = (id) => {
    setMaxZ(prev => prev + 1);
    setOpenWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: maxZ + 1 } : w
    ));
  };

  return (
    <>
      <div className="status-bar">
        <div className="status-left">
          <span>SumedhOS v1.0</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="status-right">
          <span>System: Stable</span>
          <span>CPU: 2%</span>
        </div>
      </div>

      <div className="rec-light">
        <span className="rec-light__dot"></span>
        <span className="rec-light__label">REC</span>
      </div>

      <div className="bg-cranes">
        <div className="bg-cranes__crane bg-cranes__crane--a"></div>
        <div className="bg-cranes__crane bg-cranes__crane--b"></div>
        <div className="bg-cranes__crane bg-cranes__crane--c"></div>
      </div>

      <div className="desktop">
        {/* Draggable Windows */}
        {openWindows.map((folder, i) => (
          <Window 
            key={folder.id} 
            folder={folder} 
            onClose={() => closeWindow(folder.id)} 
            zIndex={folder.zIndex || 10 + i}
            onFocus={() => focusWindow(folder.id)}
          />
        ))}

        {/* The Dock */}
        <div className="dock-container">
          {OS_DATA.folders.map((folder, i) => (
            <div 
              key={i} 
              className="dock-item" 
              data-label={folder.name} 
              onClick={() => openFolder(folder)}
              style={{ backgroundColor: folder.color }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
