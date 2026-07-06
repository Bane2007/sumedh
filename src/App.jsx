import { useEffect } from 'react';

const SHORTCUTS_DATA = [
  {
    category: "Social",
    items: [
      { label: "Instagram", url: "https://www.instagram.com/sumed_nj/", meta: "Visuals & Updates" },
      { label: "GitHub", url: "https://github.com/Bane2007", meta: "Code & Experiments" },
      { label: "Letterboxd", url: "https://letterboxd.com/Bane_snj/", meta: "Cinematic Log" },
      { label: "IMDb", url: "https://www.imdb.com/name/nm18199394/", meta: "Filmography" },
    ]
  },
  {
    category: "Work",
    items: [
      { label: "Portfolio", url: "#", meta: "Creative Works" },
      { label: "StoryGraph", url: "https://app.thestorygraph.com/profile/sumed_nj", meta: "Reading List" },
    ]
  },
  {
    category: "Archive",
    items: [
      { label: "Sadako (2025)", url: "https://www.youtube.com/watch?v=bSUdWw-3dmE", meta: "Short Film" },
      { label: "The Abyss", url: "#", meta: "Game Project" },
    ]
  }
];

function App() {
  useEffect(() => {
    const revealables = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    revealables.forEach(el => io.observe(el));
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="rec-light" aria-hidden="true">
        <span className="rec-light__dot"></span>
        <span className="rec-light__label">REC</span>
      </div>

      {/* Atmospheric Backgrounds */}
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

      <main id="main">
        <div className="shortcuts-container reveal">
          <header className="shortcuts-header">
            <h1 className="shortcuts-title">Index</h1>
            <p className="shortcuts-subtitle">shortcuts &middot; references &middot; archives</p>
          </header>

          {SHORTCUTS_DATA.map((cat, idx) => (
            <section key={idx} className="shortcut-category reveal">
              <h2 className="section-eyebrow">{cat.category}</h2>
              <div className="shortcut-list">
                {cat.items.map((item, i) => (
                  <a 
                    key={i} 
                    href={item.url} 
                    className="shortcut-item" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span className="shortcut-label">{item.label}</span>
                    <span className="shortcut-meta">{item.meta}</span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

export default App;
