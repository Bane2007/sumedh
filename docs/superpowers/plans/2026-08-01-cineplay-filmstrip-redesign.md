# Cineplay Filmstrip Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `CineplayGame` out of `App.jsx` into `src/apps/Cineplay/Cineplay.jsx`, complete its existing filmstrip concept visually, without touching game logic.

**Architecture:** Single component move + restyle, same as the Logline task — same function body/state/logic, new `cp-*` CSS classes.

**Tech Stack:** React 19, plain CSS, Vite.

## Global Constraints

- No test framework. Verification is `vite build` + manual play-through.
- Do not alter `startNewGame`, `handleGuess`, `isWon`, `renderWord`, the word-selection filter, or the alphabet array — only JSX `className` changes and CSS.
- New classes use a `cp-` prefix, not the old `cineplay-*`/`hangman-*`/`film-*`/`keyboard-*`/`sprocket*` names.

---

### Task 1: `Cineplay.jsx` + `Cineplay.css`

**Files:**
- Create: `src/apps/Cineplay/Cineplay.jsx`
- Create: `src/apps/Cineplay/Cineplay.css`

- [ ] **Step 1: Create `Cineplay.jsx`**

Copy the entire `function CineplayGame({ films }) { ... }` body from `src/App.jsx` verbatim (state, `startNewGame`, `handleGuess`, `isWon`, `isLost`, `renderWord`, `alphabet`), add `import { useState, useEffect } from 'react';` and `import './Cineplay.css';` at the top, `export default CineplayGame;` at the bottom, and remap classNames:

- `cineplay-game` → `cp-game`
- `cineplay-hud` → `cp-hud`
- `hangman-visual` → `cp-strip-wrap`
- `film-strip` → `cp-strip`
- `film-frame` (+ `burned`) → `cp-frame` (+ `cp-frame--burned`)
- `sprocket` / `sprocket-top` / `sprocket-bottom` → `cp-sprocket` / `cp-sprocket--top` / `cp-sprocket--bottom`
- `frame-image` → `cp-frame-icon`
- `hangman-word-container` → `cp-marquee`
- `hangman-letter-slot` (+ `hangman-special`) → `cp-letter` (+ `cp-letter--special`)
- `hangman-reveal-text` → `cp-reveal` (drop the inline `style={{ marginBottom: '10px' }}` in favor of the class; drop the inline `style={{ color: 'var(--oxblood-soft)' }}` on the revealed word span in favor of a `cp-reveal-word` class)
- `hangman-keyboard` → `cp-keyboard`
- `keyboard-btn` (+ `correct`/`incorrect`) → `cp-key` (+ `cp-key--correct` / `cp-key--incorrect`)
- `hangman-actions` → `cp-actions`
- `cineplay-reset-btn` → `cp-play-again-btn`

- [ ] **Step 2: Create `Cineplay.css`**

Style the filmstrip direction:
- `.cp-game`: full-height flex column, centered content, padding.
- `.cp-hud`: flex row, mono, small text, matches the header-line convention used in Logline/Debt Desk this session.
- `.cp-strip` / `.cp-frame` (+ `--burned`): horizontal row of bordered frame boxes; `--burned` darkens the frame and adds a diagonal "burned" tint (e.g. reduced opacity + a subtle red overlay) instead of the plain class-toggle that existed before.
- `.cp-sprocket` (+ `--top`/`--bottom`): small circular notches on each frame's top and bottom edge (a row of 3-4 small circles via `box-shadow` or a flex row of small divs) — this is the "real sprocket holes" the spec calls for, replacing whatever minimal styling `.sprocket` had before.
- `.cp-frame-icon`: centered emoji/glyph within the frame.
- `.cp-marquee`: letter-spaced monospace row, each `.cp-letter` a bordered/underlined box (blank letters show `_` per existing `renderWord` logic, unchanged), `.cp-letter--special` (spaces/punctuation) styled without a border.
- `.cp-reveal` / `.cp-reveal-word`: small centered label + the revealed word in `var(--oxblood-soft)`.
- `.cp-keyboard`: responsive grid of letter buttons.
- `.cp-key` (+ `--correct`/`--incorrect`): matches Logline's green/red convention (`rgba(76, 175, 80, ...)` / oxblood-tinted) for visual consistency across the two game apps redesigned this session.
- `.cp-actions` / `.cp-play-again-btn`: matches the oxblood "play again" button convention already used in Logline/Debt Desk.

Use only `var(--paper)`, `var(--paper-deep)`, `var(--ink)`, `var(--ink-soft)`, `var(--oxblood)`, `var(--oxblood-soft)`, `var(--hairline)`, `var(--serif)`, `var(--mono)` — no new colors beyond what other apps this session already introduced (`#4caf50`/green-tint for correct states, consistent with Logline).

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/apps/Cineplay/Cineplay.jsx src/apps/Cineplay/Cineplay.css
git commit -m "Add Cineplay filmstrip component"
```

---

### Task 2: Wire into `App.jsx`, sweep dead CSS

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add the import**

```js
import CineplayGame from './apps/Cineplay/Cineplay.jsx';
```

- [ ] **Step 2: Remove the old function definition**

Delete the entire `function CineplayGame({ films }) { ... }` block from `src/App.jsx`. Leave the existing render call `{win.id === 'cineplay' && <CineplayGame films={filmsForGames} />}` untouched.

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Sweep dead CSS**

Run this check for each old class name against `src/App.jsx` (now that both `LoglineGame` and `CineplayGame` have moved out, these should all be `0`):

```bash
cd src
for cls in cineplay-game cineplay-hud hangman-visual film-strip film-frame sprocket sprocket-top sprocket-bottom frame-image hangman-word-container hangman-letter-slot hangman-special hangman-reveal-text hangman-keyboard keyboard-btn hangman-actions cineplay-reset-btn logphile-menu logphile-logo logphile-menu-btn cinephile-loading cinephile-game cinephile-hud logphile-back-btn hint-btn hard-mode-toggle-container cinephile-card cinephile-plot cinephile-specs cinephile-options cinephile-opt-btn cinephile-next-btn hl-container hl-cards-row hl-card hl-movie-title hl-movie-year hl-movie-value hl-guess-btn-group hl-guess-btn; do
  count=$(grep -c "\"$cls\"\|'$cls'\| $cls \|\`$cls" App.jsx)
  echo "$cls: $count"
done
```

For every `0`-count selector, find and delete its full CSS rule block in `src/index.css`. If any selector reports nonzero, stop and check what's still referencing it before deleting.

- [ ] **Step 5: Verify the build again**

Run: `npx vite build`
Expected: build succeeds after CSS cleanup.

- [ ] **Step 6: Manual verification**

`npm run dev`, open Cineplay.app:
- Filmstrip lives indicator renders with sprocket-hole styling.
- Guess letters, confirm correct/incorrect key states and frame-burning as wrong guesses accumulate.
- Win a round (or lose one) and confirm the reveal/win state and "play again" work.
- Open Logline.app too and confirm it still works (proves the CSS sweep didn't remove anything Logline still needs).
- No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/index.css
git commit -m "Wire Cineplay filmstrip component into App.jsx, remove dead hangman/logphile CSS"
```
