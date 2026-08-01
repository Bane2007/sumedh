# Logline Script Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `LoglineGame` out of `App.jsx` into `src/apps/Logline/Logline.jsx`, restyle as screenplay pages, without touching any game logic.

**Architecture:** Single component move + restyle — same function body, same state, same `GLOBAL_MASTERPIECES` data and masking/scoring/comparison logic, new CSS classes (`lg-*` prefix) replacing the old inline styles and `logphile-*`/`cinephile-*`/`hl-*` global classes.

**Tech Stack:** React 19, plain CSS, Vite.

## Global Constraints

- No test framework. Verification is `vite build` + manual play-through of both mini-games.
- Do not alter any game logic: `generateTriviaQuestion`'s masking regex, distractor selection, `handleTriviaAnswer`'s scoring, `startHigherLower`/`handleHigherLowerGuess`'s comparison logic, and `GLOBAL_MASTERPIECES` must be byte-identical to the current `App.jsx` implementation — only JSX `className`/`style` attributes change.
- New CSS classes must not reuse `logphile-*`, `cinephile-*`, or `hl-*` names from `index.css`, since `CineplayGame` (not yet redesigned) may still depend on some of them.
- Reuse `src/index.css` `:root` variables.

---

### Task 1: `Logline.jsx` + `Logline.css`

**Files:**
- Create: `src/apps/Logline/Logline.jsx`
- Create: `src/apps/Logline/Logline.css`

- [ ] **Step 1: Create `Logline.jsx`**

Copy the entire `function LoglineGame({ films }) { ... }` body from `src/App.jsx` (currently starting at the `function LoglineGame({ films }) {` line, ending at its matching closing `}` right before `// Draggable Window Component`) into the new file, unchanged except:

- Add `import { useState, useEffect } from 'react';` and `import './Logline.css';` at the top.
- Change `export default LoglineGame;` at the bottom (rename the function reference in the export, keep the function itself named `LoglineGame` internally is fine, or rename to `Logline` — either way the default export is what `App.jsx` imports).
- Replace all `className="logphile-menu"` / `"logphile-logo"` / `"logphile-menu-btn"` / `"cinephile-loading"` / `"cinephile-game"` / `"cinephile-hud"` / `"logphile-back-btn"` / `"hint-btn"` / `"hard-mode-toggle-container"` / `"cinephile-card"` / `"cinephile-plot"` / `"cinephile-specs"` / `"cinephile-options"` / `"cinephile-opt-btn"` / `"cinephile-next-btn"` / `"hl-container"` / `"hl-cards-row"` / `"hl-card"` / `"hl-movie-title"` / `"hl-movie-year"` / `"hl-movie-value"` / `"hl-guess-btn-group"` / `"hl-guess-btn"` / `"cineplay-reset-btn"` with new `lg-*` equivalents (see mapping below), and replace the inline `style={{ ... }}` attributes throughout with the new CSS classes instead (moving each inline style's rules into `Logline.css`).

Class name mapping (old → new):
- `logphile-menu` → `lg-menu`
- `logphile-logo` → `lg-menu-slugline`
- `logphile-menu-btn` → `lg-menu-btn`
- `cinephile-loading` → `lg-loading`
- `cinephile-game` → `lg-page` (also absorbs the old inline `style={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}`)
- `cinephile-hud` → `lg-page-header`
- `logphile-back-btn` → `lg-back-btn`
- `hint-btn` → `lg-hint-btn` (used both for the source-toggle buttons and the reveal-hint button — keep as one class, both usages already share styling intent)
- `hard-mode-toggle-container` → `lg-hardmode-toggle`
- `cinephile-card` → `lg-action-block` (the screenplay "action paragraph" block — absorbs old inline `style={{ margin:'10px 0', flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}`)
- `cinephile-plot` → `lg-action-text` (absorbs old inline `style={{ fontSize:'1.05rem', lineHeight:'1.5' }}`)
- `cinephile-specs` (both hint-locked and hint-reveal variants) → `lg-hint-line` with modifier classes `lg-hint-line--locked` / `lg-hint-line--reveal`
- `cinephile-options` → `lg-dialogue-options` (absorbs old inline grid style)
- `cinephile-opt-btn` (+ `correct`/`incorrect`/`disabled` suffixes) → `lg-dialogue-btn` (+ `lg-dialogue-btn--correct` / `lg-dialogue-btn--incorrect` / `lg-dialogue-btn--disabled`)
- `cinephile-next-btn` → `lg-next-btn`
- `hl-container` → `lg-hl-page`
- `hl-cards-row` → `lg-hl-scenes`
- `hl-card` (+ `active-card`, `correct-flash`, `incorrect-flash`) → `lg-scene-page` (+ `lg-scene-page--active`, `lg-scene-page--correct`, `lg-scene-page--incorrect`)
- `hl-movie-title` → `lg-scene-title`
- `hl-movie-year` → `lg-scene-year`
- `hl-movie-value` → `lg-scene-rating`
- `hl-guess-btn-group` → `lg-scene-guess-group`
- `hl-guess-btn` → `lg-scene-guess-btn`
- `cineplay-reset-btn` → `lg-play-again-btn` (Logline's own copy of this class — `CineplayGame`'s own `cineplay-reset-btn` usage is untouched, since this is a new, differently-named class only Logline uses now)

All other inline `style={{ ... }}` attributes still present after this mapping (small one-off spacing/color tweaks scattered through the JSX) move into corresponding new `lg-*` classes or are dropped in favor of the class's own CSS — use judgment to consolidate them cleanly into `Logline.css` rather than leaving any inline styles behind.

- [ ] **Step 2: Create `Logline.css`**

Write CSS for every `lg-*` class introduced in Step 1, styling for the screenplay-page direction:
- `.lg-menu`: centered column, title-page framing (e.g. a `FADE IN:` mono label above `.lg-menu-slugline`, which renders `< LOGPHILE TRIVIA DECK >` in uppercase serif or mono, letter-spaced like a script slugline).
- `.lg-menu-btn`: bordered button styled like a numbered scene heading.
- `.lg-page`: full-height flex column (replaces the old inline flex styles).
- `.lg-page-header`: flex row, small mono text, styled like a script page header/footer (page number convention).
- `.lg-action-block` / `.lg-action-text`: a bordered "page" area, serif or mono body text (screenplay action paragraphs are traditionally Courier — approximate with `var(--mono)` at a comfortable reading size), generous line-height.
- `.lg-dialogue-options` / `.lg-dialogue-btn` (+ modifiers): grid of buttons styled like character dialogue cues (centered, uppercase label convention), with correct/incorrect/disabled states using `--oxblood`/green/muted colors consistent with the rest of the site.
- `.lg-hl-scenes` / `.lg-scene-page` (+ modifiers) / `.lg-scene-title` / `.lg-scene-year` / `.lg-scene-rating` / `.lg-scene-guess-group` / `.lg-scene-guess-btn`: two side-by-side bordered "scene pages", correct/incorrect flash states as background tint transitions.
- `.lg-play-again-btn` / `.lg-next-btn` / `.lg-back-btn` / `.lg-hint-btn` / `.lg-hardmode-toggle` / `.lg-hint-line` (+ modifiers) / `.lg-loading`: consistent small mono utility button/label styling matching the rest of the redesigned apps this session (Debt Desk, About Me, Contact).

Use `var(--paper)`, `var(--paper-deep)`, `var(--ink)`, `var(--ink-soft)`, `var(--oxblood)`, `var(--oxblood-soft)`, `var(--hairline)`, `var(--serif)`, `var(--mono)` throughout — no new colors invented beyond what's already in `:root`.

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds (unreferenced until Task 2, so this just confirms clean syntax).

- [ ] **Step 4: Commit**

```bash
git add src/apps/Logline/Logline.jsx src/apps/Logline/Logline.css
git commit -m "Add Logline screenplay-page component"
```

---

### Task 2: Wire into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import**

```js
import LoglineGame from './apps/Logline/Logline.jsx';
```

- [ ] **Step 2: Remove the old function definition**

Delete the entire `function LoglineGame({ films }) { ... }` block from `src/App.jsx` (from `function LoglineGame({ films }) {` through its matching closing `}`, immediately before `// Draggable Window Component`).

Leave the existing render call `{win.id === 'cinephile' && <LoglineGame films={filmsForGames} />}` untouched — it now resolves to the imported component.

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds. If it fails, check for a duplicate `LoglineGame` identifier (old definition not fully removed) or a missing import.

- [ ] **Step 4: Manual verification**

`npm run dev`, open Logline.app:
- Menu renders with both game options.
- Play trivia: answer a question correctly and incorrectly, toggle hard mode, toggle Global/Letterboxd source (if films loaded), reveal a hint in easy mode and confirm streak resets/score halves as before.
- Play higher-or-lower: guess correctly a few times, then incorrectly to trigger game over, then "play again".
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "Wire Logline screenplay component into App.jsx"
```
