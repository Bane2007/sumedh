import { useState, useEffect } from 'react';
import './Logline.css';

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
      <div className="lg-menu">
        <div className="lg-menu-fadein mono">FADE IN:</div>
        <div className="lg-menu-slugline mono">&lt; LOGPHILE TRIVIA DECK &gt;</div>
        <p className="lg-menu-desc">
          Test your film IQ. Run classic plot riddles or play the higher-or-lower IMDb score match.
        </p>
        <button className="lg-menu-btn" onClick={() => setActiveGame('trivia')}>
          1. MASTERPIECE LOGLINES
        </button>
        <button className="lg-menu-btn" onClick={() => setActiveGame('higherlower')}>
          2. HIGHER OR LOWER (IMDb)
        </button>
      </div>
    );
  }

  if (activeGame === 'trivia') {
    if (!triviaQuestion) {
      return <div className="lg-loading mono">[ Loading Loglines... ]</div>;
    }
    return (
      <div className="lg-page">
        <div>
          <div className="lg-page-header mono">
            <button className="lg-back-btn" onClick={() => setActiveGame('menu')}>&larr; MENU</button>
            <div className="lg-page-header-stats">
              <span>SCORE: {triviaScore}</span>
              <span>STREAK: {triviaStreak} 🔥</span>
            </div>
          </div>

          <div className="lg-controls-row">
            <div className="lg-source-toggle mono">
              <span>Source:</span>
              <button
                className="lg-hint-btn"
                style={{ textDecoration: triviaSource === 'global' ? 'underline' : 'none', fontWeight: triviaSource === 'global' ? 'bold' : 'normal' }}
                onClick={() => setTriviaSource('global')}
              >
                Global Classics
              </button>
              {films && films.length > 5 && (
                <>
                  <span>|</span>
                  <button
                    className="lg-hint-btn"
                    style={{ textDecoration: triviaSource === 'letterboxd' ? 'underline' : 'none', fontWeight: triviaSource === 'letterboxd' ? 'bold' : 'normal' }}
                    onClick={() => setTriviaSource('letterboxd')}
                  >
                    My Letterboxd
                  </button>
                </>
              )}
            </div>
            <label className="lg-hardmode-toggle">
              <input
                type="checkbox"
                checked={triviaHardMode}
                onChange={(e) => setTriviaHardMode(e.target.checked)}
              />
              <span>HARD MODE</span>
            </label>
          </div>
        </div>

        <div className="lg-action-block">
          <p className="lg-action-text">
            &ldquo;{triviaQuestion.plot}&rdquo;
          </p>

          {triviaHardMode ? (
            <div className="lg-hint-line lg-hint-line--locked mono">
              [ HINTS DISABLED IN HARD MODE ]
            </div>
          ) : showHint ? (
            <div className="lg-hint-line lg-hint-line--reveal mono">
              <span>YEAR: {triviaQuestion.target.year}</span>
              <span>DIRECTOR: {triviaQuestion.target.director}</span>
            </div>
          ) : (
            <div>
              <button
                className="lg-hint-btn mono"
                onClick={() => {
                  setShowHint(true);
                  setTriviaStreak(0);
                }}
              >
                [ REVEAL HINT (RESETS STREAK &amp; HALVES POINTS) ]
              </button>
            </div>
          )}
        </div>

        <div className="lg-dialogue-options">
          {triviaQuestion.options.map((opt, idx) => {
            let btnClass = "lg-dialogue-btn";
            if (triviaHasAnswered) {
              if (opt.title === triviaQuestion.target.title) {
                btnClass += " lg-dialogue-btn--correct";
              } else if (triviaSelected && triviaSelected.title === opt.title) {
                btnClass += " lg-dialogue-btn--incorrect";
              } else {
                btnClass += " lg-dialogue-btn--disabled";
              }
            }
            return (
              <button
                key={idx}
                className={btnClass}
                onClick={() => handleTriviaAnswer(opt)}
                disabled={triviaHasAnswered}
              >
                {opt.title} ({opt.year})
              </button>
            );
          })}
        </div>

        <div className="lg-next-row">
          {triviaHasAnswered && (
            <button className="lg-next-btn mono" onClick={generateTriviaQuestion}>
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
      <div className="lg-hl-page">
        <div className="lg-page-header mono">
          <button className="lg-back-btn" onClick={() => setActiveGame('menu')}>&larr; MENU</button>
          <div>
            <span>SCORE: {hlScore}</span>
            <span className="lg-hl-best">BEST: {hlHighScore}</span>
          </div>
        </div>

        <div className="lg-hl-scenes">
          {/* Current Movie Card */}
          <div className="lg-scene-page lg-scene-page--active">
            <div>
              <div className="lg-scene-title">{hlCurrent.title}</div>
              <div className="lg-scene-year">({hlCurrent.year})</div>
              <div className="lg-scene-director">dir: {hlCurrent.director}</div>
            </div>
            <div>
              <div className="lg-scene-rating-label">IMDb RATING</div>
              <div className="lg-scene-rating">{hlCurrent.rating}★</div>
            </div>
            <div className="lg-scene-spacer" />
          </div>

          {/* Next Movie Card */}
          <div className={`lg-scene-page ${hlStatus === 'correct' ? 'lg-scene-page--correct' : hlStatus === 'gameover' ? 'lg-scene-page--incorrect' : ''}`}>
            <div>
              <div className="lg-scene-title">{hlNext.title}</div>
              <div className="lg-scene-year">({hlNext.year})</div>
              <div className="lg-scene-director">dir: {hlNext.director}</div>
            </div>

            {hlStatus === 'playing' ? (
              <div className="lg-scene-guess-group">
                <button className="lg-scene-guess-btn" onClick={() => handleHigherLowerGuess('higher')}>▲ HIGHER</button>
                <button className="lg-scene-guess-btn" onClick={() => handleHigherLowerGuess('lower')}>▼ LOWER</button>
              </div>
            ) : (
              <div>
                <div className="lg-scene-rating-label">IMDb RATING</div>
                <div className="lg-scene-rating">{hlNext.rating}★</div>
              </div>
            )}

            <div className="lg-scene-status">
              {hlStatus === 'correct' && <span className="mono lg-scene-status--correct">CORRECT!</span>}
              {hlStatus === 'gameover' && <span className="mono lg-scene-status--incorrect">GAME OVER</span>}
            </div>
          </div>
        </div>

        {hlStatus === 'gameover' && (
          <div className="lg-play-again-row">
            <button className="lg-play-again-btn mono" onClick={startHigherLower}>
              PLAY AGAIN &raquo;
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default LoglineGame;
