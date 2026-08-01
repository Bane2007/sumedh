# Cineplay Filmstrip Redesign — Design Spec

## Context

`CineplayGame` is a ~130-line top-level function component in `App.jsx` —
a hangman-style movie-title guessing game. It already has a partial
filmstrip concept (`film-strip`/`film-frame`/`sprocket` classes showing
"lives" as burning film frames), so this redesign leans into and
completes that concept rather than inventing a new one. Game logic
(word selection, guess handling, win/loss) is correct and untouched.

## Direction

**Complete the filmstrip.** Push the existing film-frame "lives" concept
further: real sprocket-hole styling on the frame strip, the masked title
presented like text projected on a cinema screen/marquee, and the
letter-guess keyboard restyled to fit the reel/clapperboard aesthetic
instead of a generic button grid.

## Goals

- Extract into `src/apps/Cineplay/Cineplay.jsx` + `Cineplay.css`, moving
  the existing `CineplayGame` function verbatim (same state, same
  `startNewGame`/`handleGuess`/`isWon`/`renderWord` logic) — visual-only
  changes.
- New `cp-` prefixed classes, not reusing old global `cineplay-*`/
  `hangman-*`/`film-*`/`keyboard-*`/`sprocket*` classes from `index.css`
  (Logline's redesign already moved off `cineplay-reset-btn` onto its own
  `lg-play-again-btn`, so after this task the old global classes become
  fully dead and can be swept).
- Film-frame strip: real sprocket-hole circles top/bottom on each frame,
  "burned" frames visually darkened/crossed out as lives are lost.
- Masked title: styled like marquee/screen text (letter-spaced,
  monospace, underlined blanks) instead of plain boxed slots.
- Letter keyboard: styled as a compact grid consistent with the site's
  existing button language (matches Debt Desk/Contact/Logline's button
  styling this session) — correct guesses green-tinted, incorrect
  red-tinted, matching Logline's color convention for consistency.

## Non-goals

- No changes to game logic, word-selection filtering, or the alphabet
  keyboard's letter set.
- No changes to how `App.jsx` renders `<CineplayGame films={filmsForGames} />`.
- Cleanup of now-fully-dead old global CSS (`cineplay-*`, `hangman-*`,
  `film-*`, `keyboard-*`, `sprocket*`) happens as part of this task's
  final integration step, verified via grep against `App.jsx` before
  deleting (same method used for Media Cabinet's dead-CSS sweep).

## Component Impact

- Create: `src/apps/Cineplay/Cineplay.jsx`, `src/apps/Cineplay/Cineplay.css`.
- Modify: `src/App.jsx` — remove the `function CineplayGame(...)`
  definition, add an import, keep the existing render call unchanged.
- Modify: `src/index.css` — remove now-dead `cineplay-*`/`hangman-*`/
  `film-*`/`keyboard-*`/`sprocket*` rules once confirmed unused.

## Testing / Verification

Manual: play a full game to both a win and a loss, confirm frame-burning
lives indicator, correct/incorrect letter states, "play again" resets
correctly, `vite build` passes, no console errors.
