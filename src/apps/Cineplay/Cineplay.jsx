import { useState, useEffect } from 'react';
import './Cineplay.css';

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
          <span key={idx} className="cp-letter mono">
            {guessed.has(char) ? char : '_'}
          </span>
        );
      }
      // Reveal spaces and punctuation
      return (
        <span key={idx} className="cp-letter cp-letter--special mono">
          {char === ' ' ? '  ' : char}
        </span>
      );
    });
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="cp-game">
      <div className="cp-hud mono">
        <span>LIVES: {maxWrong - wrongCount} / {maxWrong} 🎬</span>
        <span>STATUS: {isWon() ? 'WON! 🎉' : isLost ? 'LOST 💀' : 'PLAYING'}</span>
      </div>

      <div className="cp-strip-wrap">
        <div className="cp-strip">
          {[...Array(maxWrong)].map((_, idx) => (
            <div
              key={idx}
              className={`cp-frame ${idx < wrongCount ? 'cp-frame--burned' : ''}`}
              title={idx < wrongCount ? "Frame Burned" : "Frame Intact"}
            >
              <div className="cp-sprocket cp-sprocket--top">
                <span /><span /><span /><span />
              </div>
              <div className="cp-frame-icon">🎬</div>
              <div className="cp-sprocket cp-sprocket--bottom">
                <span /><span /><span /><span />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cp-marquee">
        {renderWord()}
      </div>

      {isLost && (
        <div className="cp-reveal mono">
          ANSWER: <span className="cp-reveal-word">{word}</span>
        </div>
      )}

      <div className="cp-keyboard">
        {alphabet.map((letter) => {
          const hasGuessed = guessed.has(letter);
          const isCorrect = hasGuessed && word.includes(letter);
          let btnClass = "cp-key mono";
          if (hasGuessed) {
            btnClass += isCorrect ? " cp-key--correct" : " cp-key--incorrect";
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
        <div className="cp-actions">
          <button className="cp-play-again-btn mono" onClick={startNewGame}>
            PLAY AGAIN &raquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default CineplayGame;
