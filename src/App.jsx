import { useEffect, useState } from 'react';

const NEXUS_DATA = [
  { label: "Instagram", url: "https://www.instagram.com/sumed_nj/", meta: "Visuals", x: 25, y: 30 },
  { label: "GitHub", url: "https://github.com/Bane2007", meta: "Code", x: 75, y: 20 },
  { label: "Letterboxd", url: "https://letterboxd.com/Bane_snj/", meta: "Cinema", x: 80, y: 60 },
  { label: "IMDb", url: "https://www.imdb.com/name/nm18199394/", meta: "Film", x: 20, y: 70 },
  { label: "Portfolio", url: "#", meta: "Creative", x: 50, y: 15 },
  { label: "StoryGraph", url: "https://app.thestorygraph.com/profile/sumed_nj", meta: "Reading", x: 15, y: 45 },
  { label: "Sadako (2025)", url: "https://www.youtube.com/watch?v=bSUdWw-3dmE", meta: "Short Film", x: 85, y: 40 },
  { label: "The Abyss", url: "#", meta: "Game Project", x: 40, y: 80 },
];

function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div className="rec-light" aria-hidden="true">
        <span className="rec-light__dot"></span>
        <span className="rec-light__label">REC</span>
      </div>

      <div className="bg-cranes">
        <div className="bg-cranes__crane bg-cranes__crane--a"></div>
        <div className="bg-cranes__crane bg-cranes__crane--b"></div>
        <div className="bg-cranes__crane bg-cranes__crane--c"></div>
      </div>

      <div className="bg-motes">
        {[...Array(16)].map((_, i) => (
          <span 
            key={i} 
            style={{ 
              left: `${Math.random() * 100}%`, 
              animationDelay: `${Math.random() * 10}s`, 
              animationDuration: `${10 + Math.random() * 10}s` 
            }}
          ></span>
        ))}
      </div>

      <div className="nexus-viewport">
        <div 
          className="nexus-world" 
          style={{ 
            transform: `rotateX(${-mousePos.y}deg) rotateY(${mousePos.x}deg)` 
          }}
        >
          <div className="nexus-core">
            <h1 className="nexus-core-title">Index</h1>
            <p className="nexus-core-subtitle">spatial nexus &middot; archives</p>
          </div>

          {NEXUS_DATA.map((node, i) => (
            <a 
              key={i} 
              href={node.url} 
              className="nexus-node" 
              style={{ 
                left: `${node.x}%`, 
                top: `${node.y}%`, 
                transform: `translate(-50%, -50%) translateZ(${20 + Math.random() * 50}px)` 
              }}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <span className="nexus-node-label">{node.label}</span>
              <span className="nexus-node-meta">{node.meta}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
