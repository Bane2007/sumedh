# Media Cabinet Redesign — Design Spec

## Context

`sumedh-site` is a single-page "desktop OS" portfolio (React + Vite, deployed to
`bane2007.github.io/sumedh/`). It hosts 8 apps as draggable windows, all
currently implemented inside one ~3,100-line `src/App.jsx`. This is the first
of a planned sequence of per-app redesigns (code + visual), covering all 8
apps over time. This spec covers **Media Cabinet only** — the films/anime/manga
browser.

Two problems motivated this work:

1. **Data sync was silently broken.** `scripts/update_media.py` scrapes
   Letterboxd + MyAnimeList nightly via a GitHub Actions cron
   (`.github/workflows/update_films.yml`) and writes
   `public/assets/data/{media.js,films.json}`. The commit step used the wrong
   path (`assets/data/...` instead of `public/assets/data/...`), so every run
   fetched real data successfully and then failed at `git add` with
   `pathspec did not match any files`, silently discarding the result. This
   had been failing every night for at least 10+ days.
   **Status: already fixed and verified independently of this spec**
   (commit `ac3f5dc`, confirmed via a manual `workflow_dispatch` run that
   succeeded and pushed `8280a4b`). Not part of this implementation plan.

2. **Layout is cramped and generic.** Media Cabinet currently renders as a
   fixed-width narrow left column (category tabs, search, filters, sort,
   stats, poster grid all stacked and squeezed) next to a permanent right-side
   detail panel that is mostly dead whitespace. Proportions don't reflect
   actual content density on either side.

This spec addresses problem 2: a layout and code redesign of the Media
Cabinet app.

## Goals

- Full-bleed poster grid that uses the whole window, responsive to window
  resizing (not a fixed narrow column).
- Detail view moves from a permanent side panel to an on-demand drawer, so
  browsing gets the full window and detail is opt-in per item.
- Same drawer component handles both "view detail" and "add new entry" —
  currently two different UI patterns (side panel vs. inline form block).
- Split Media Cabinet out of `App.jsx` into its own directory with focused
  subcomponents, so future changes to this app don't require touching or
  re-understanding the other 7 apps' state in the same file.
- Preserve all existing functionality: category switch (films/anime/manga),
  search, genre/decade filters, sort (recent/alphabetical/release
  year/rating), stats HUD (total watched, average score, top genre), add new
  entry (writes to local `media.js` via the existing dev-only Vite middleware
  in `vite.config.js` — unchanged), Letterboxd trivia integration (`LoglineGame`
  reads `mediaDb.films`, unaffected by this refactor as long as the data shape
  is unchanged).

## Non-goals

- No changes to the scraper, the GitHub Actions workflow, or the data schema
  in `media.js`/`films.json`.
- No changes to `LoglineGame` or `CineplayGame` beyond whatever prop shape
  `mediaDb` continues to expose (must stay compatible).
- No changes to any of the other 7 apps in this pass.
- No new persistence layer — the existing dev-only local-write endpoints
  (`/api/log-item`, `/api/delete-item` in `vite.config.js`) are reused as-is;
  in production (static hosting) these are no-ops/fail silently exactly as
  today (add/delete only works when running `vite dev` locally).

## Layout Design

### Toolbar (top, single row, wraps on narrow windows)

Left to right: category tabs (Films / Anime / Manga) → search input → genre
filter → decade filter → sort dropdown → stats strip (three compact
numbers: total watched, average score, top genre) → "+ LOG" button.

This replaces the current stacked block (tabs row, then search+filters row,
then a separate stats HUD row) with one denser row. On narrow windows it
wraps to multiple lines via flexbox `flex-wrap`, same responsive approach
already used elsewhere in the codebase (e.g. `.sort-wrapper`).

### Poster grid (full-bleed, fills remaining window height)

`display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));`
— no fixed side column stealing width. Each card:

- Poster image (aspect-ratio locked, object-fit cover).
- Status chip, top-left corner overlay (watched / watching / reading —
  reuses existing status values from `media.js`).
- Star rating, bottom-right corner overlay, shown only if the item has a
  personal rating.
- Title + year shown on hover as an overlay (not a permanent label under
  every poster like today) to keep the grid visually clean at rest.
- Hover: scale + shadow lift, consistent with the existing
  `.shortcut-item:hover` interaction language used on the desktop icons.

Grid is scrollable independently of the toolbar (toolbar stays fixed at top
of the window).

### Detail drawer

Slides in from the right on click, ~420px wide, overlays the grid (grid
dims slightly behind it via a semi-transparent scrim, does not reflow).
Closes on Escape or clicking the scrim.

Contents: large poster, title, director/studio, year, personal rating and
public score shown side by side, genre tags, synopsis (existing OMDb-sourced
description fetch, unchanged), external link out to Letterboxd/MAL page.

On narrow windows (mobile-width, matching the existing `768px` breakpoint
already used for `.desktop-shortcuts`), the drawer becomes a bottom sheet
instead of a side drawer.

### Add-entry flow

"+ LOG" opens the **same drawer component** in a "new entry" mode (form
fields instead of read-only detail) rather than the current separate inline
`<form>` block rendered above the grid. This removes one of the two
divergent UI patterns currently used for showing structured item data.

## Component Split

New directory: `src/apps/MediaCabinet/`

- `MediaCabinet.jsx` — shell component. Owns high-level state wiring:
  which sub-state lives where, renders `Toolbar`, `PosterGrid`,
  `DetailDrawer`. Exported as default; `App.jsx`'s `win.id === 'cabinet'`
  branch becomes `<MediaCabinet />`.
- `Toolbar.jsx` — category tabs, search, filters, sort, stats strip, LOG
  button. Receives state values + setters as props from `MediaCabinet.jsx`
  (no independent data fetching).
- `PosterGrid.jsx` — renders the grid of cards from a filtered/sorted item
  list passed in as a prop; emits `onSelectItem(item)`.
- `DetailDrawer.jsx` — handles both view and add-entry modes via a `mode`
  prop (`'view' | 'add'`); calls back up to `MediaCabinet.jsx` for
  save/delete actions.
- `useMediaDb.js` — hook encapsulating: fetching `media.js`, category state,
  search/filter/sort derivation (`processedItems`), stats derivation
  (average rating, top genre), add/delete calls to the existing dev API
  endpoints. This absorbs the media-related state currently tangled into
  `App.jsx`'s giant `App()` function body.

`App.jsx` changes: remove all Media-Cabinet-specific state, handlers, and
JSX (roughly lines 1532–2960 per current file, to be confirmed exactly
during implementation), replace with a single `<MediaCabinet />` render for
the `cabinet` window id. `mediaDb.films` must remain accessible to
`LoglineGame`/`CineplayGame` — `useMediaDb.js` is called once in
`MediaCabinet.jsx`; if `App.jsx` still needs `mediaDb.films` for the trivia
games, `App.jsx` will call a shared lighter-weight data hook (or the same
`useMediaDb` hook) independently, since both already fetch the same static
`media.js` file — no shared runtime state is required between the two apps
(they're separate windows, no cross-app interaction today).

## Data Flow

Unchanged: `MediaCabinet.jsx` (via `useMediaDb.js`) fetches
`${import.meta.env.BASE_URL}assets/data/media.js` on mount (same fetch call
that exists today at `App.jsx:1687`), same shape (`window.mediaDatabase`
with `films`/`anime`/`manga` arrays). Add/delete continue posting to
`/api/log-item` / `/api/delete-item`, which only exist in local dev
(`vite.config.js`'s `localDbPlugin`); production behavior (static host, no
backend) is unchanged — those actions silently fail there today and will
continue to.

## Error Handling

- Fetch failure for `media.js`: keep existing behavior (empty arrays /
  whatever current fallback is) — not being redesigned here.
- OMDb description fetch failure: keep existing "Failed to load
  description." fallback text, unchanged.
- Drawer in add-entry mode: keep existing form validation behavior
  (required fields), just relocated into the drawer's add-mode rendering.

## Testing / Verification

- No test framework currently exists in this repo (no test script in
  `package.json`). Verification is manual: run `vite dev`, open Media
  Cabinet, and confirm for each of films/anime/manga: grid renders,
  search/filter/sort all narrow results correctly, clicking a poster opens
  the drawer with correct detail, closing works (Escape + scrim click),
  "+ LOG" opens the drawer in add mode and a submitted entry appears in the
  grid, stats strip numbers match the filtered set, resizing the window
  narrow triggers the bottom-sheet drawer variant, and `LoglineGame`
  (Logline.app) still loads its questions correctly (proves `mediaDb.films`
  is still wired correctly).
- Run `vite build` to confirm no build errors after the split.
