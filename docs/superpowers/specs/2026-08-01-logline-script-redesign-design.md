# Logline Script Redesign — Design Spec

## Context

`LoglineGame` is a ~370-line top-level function component already living
in `App.jsx` (not inline JSX like Debt Desk/About Me were) — two mini
games (plot trivia, higher-or-lower IMDb rating match) sharing a menu
screen. All game logic (plot masking, distractor selection, hint/streak
mechanics, rating comparison) is self-contained and correct — this is a
**visual-only** redesign.

## Direction

**Screenplay pages.** Trivia plot text reads like a screenplay action
paragraph; the menu reads like a script title page ("FADE IN:" framing);
answer options read like character dialogue cues; HUD reads like a script
page header (page number style). Higher-or-lower's two movie cards
become two facing "scene" pages.

## Goals

- Extract into `src/apps/Logline/Logline.jsx` + `Logline.css`, moving the
  existing `LoglineGame` function verbatim (same props, same internal
  state, same game logic, same `GLOBAL_MASTERPIECES` data) — only
  `className`/inline-`style` presentation changes.
- New `lg-` prefixed CSS classes, not reusing the old global
  `logphile-*`/`cinephile-*`/`hl-*` classes from `index.css` (some of
  those, e.g. `cineplay-reset-btn`, are shared with `CineplayGame`, which
  isn't part of this task — new classes avoid any cross-app CSS
  collision).
- Menu screen: title-page framing, two menu buttons restyled as
  script-slugline buttons.
- Trivia screen: plot text in a screenplay action-paragraph block,
  answer options as dialogue-cue buttons, HUD as a page-header line.
- Higher-or-lower screen: two side-by-side "scene pages" instead of
  generic cards.

## Non-goals

- No changes to any game logic, scoring, masking regex, or the
  `GLOBAL_MASTERPIECES` dataset.
- No changes to `CineplayGame` (separate task) or to how `App.jsx` calls
  `<LoglineGame films={filmsForGames} />` — only where the function is
  defined changes.
- Old global CSS classes (`logphile-*`, `cinephile-*`, `hl-*`) are left
  in `index.css` for now since `CineplayGame` may still reference
  overlapping names — cleanup happens when Cineplay's own redesign task
  runs and can verify what's still shared.

## Component Impact

- Create: `src/apps/Logline/Logline.jsx`, `src/apps/Logline/Logline.css`.
- Modify: `src/App.jsx` — remove the `function LoglineGame(...)`
  definition, add an import, keep the existing
  `<LoglineGame films={filmsForGames} />` render call unchanged.

## Testing / Verification

Manual: menu renders, both games playable end-to-end (answer trivia
questions, see hint/hard-mode toggle work, play higher-or-lower to a game
over and restart), `vite build` passes, no console errors.
