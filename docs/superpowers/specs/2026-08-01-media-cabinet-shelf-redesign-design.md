# Media Cabinet Shelf Redesign — Design Spec

## Context

Media Cabinet was recently rebuilt (see `2026-08-01-media-cabinet-redesign-design.md`
and its implementation plan) from a cramped two-panel layout into a
full-bleed poster grid with a slide-in detail/add drawer, split out of
`App.jsx` into `src/apps/MediaCabinet/`. That redesign fixed real bugs and
shipped, but on review the poster-grid pattern itself reads as a generic
"media tracker app" look — nothing distinctive relative to the rest of
`sumedh-site`, which otherwise commits hard to a HAL9000/2001-Space-Odyssey
desktop-OS identity with a warm paper/oxblood palette and serif+mono
typography.

This spec replaces the poster-grid browsing surface with a **physical
shelf browser** — films/anime/manga rendered as book/DVD spines on a wood
shelf, in the spirit of an actual "media cabinet." An earlier, abandoned
attempt at this concept (`.closet-shelf`, `.spine-item`, wood-plank
background) existed in `index.css` as fully dead code before the previous
redesign deleted it — this spec is a fresh, deliberate rebuild of that
idea, not a resurrection of the old CSS.

## Goals

- Replace the poster-grid browsing surface (`PosterGrid.jsx`) with a new
  shelf-based browsing surface where every film/anime/manga renders as a
  narrow vertical spine (44px wide, 220px tall), title text rotated
  vertically like a real book spine.
- Handle all 494+ films (and anime/manga counts) without pagination or an
  unusably long single-row shelf: spines wrap naturally across multiple
  visual shelf rows as the window resizes, using CSS flexbox wrap (not
  CSS Grid — sidesteps the `aspect-ratio` auto-row-track bug hit and
  fixed during the previous redesign, since spines have fixed, not
  ratio-derived, dimensions).
- Preserve recognizable poster identity per title despite the narrow
  format: each spine's background is a cropped vertical slice of the
  item's actual poster image (via `object-fit: cover` with a wide source
  and narrow box, not a flat color block), with a gradient overlay so the
  vertical title text stays legible.
- Continuous wood-plank cabinet background behind the shelf area,
  distinct from the current flat dark background.
- Hover lifts a spine (translateY + slight rotate + shadow), consistent
  with the "pulling a book forward" physical metaphor already prototyped
  (and since deleted) in the old `.spine-item:hover` rule.
- Toolbar (category tabs, search, genre/decade filters, sort, stats
  strip, + LOG button) keeps identical props/behavior from the current
  `Toolbar.jsx` — this task is a **visual-only restyle** of the toolbar
  to a brass-plaque/nameplate look, not a functional rework.
- Detail view and add-entry flow are **unchanged** — `DetailDrawer.jsx`
  (view mode + add mode, Escape/scrim close, responsive bottom sheet)
  is reused exactly as built; a spine click opens it exactly like a
  poster-card click did.
- Data layer (`useMediaDb.js`), shared helpers (`mediaUtils.jsx`), and
  `MediaCabinet.jsx`'s wiring are **unchanged** — this is a presentation
  swap of the grid component only, not a data/filter/sort rework.

## Non-goals

- No changes to `useMediaDb.js`, `DetailDrawer.jsx`, `mediaUtils.jsx`, or
  the `MediaCabinet.jsx` shell's prop wiring beyond swapping which grid
  component it renders.
- No changes to any other app (Debt Desk, About Me, Logline, Beats,
  Cineplay, Contact, Photos) or to `App.jsx` beyond what's already wired
  from the previous redesign (no new `App.jsx` changes are expected at
  all — `MediaCabinet.jsx`'s public shape doesn't change).
- No changes to the data sync workflow, scraper, or `media.js`/
  `films.json` schema.
- `PosterGrid.jsx` and its CSS in `MediaCabinet.css` (the `.mc-grid`,
  `.mc-card`, `.mc-card-*` rules) are deleted once the shelf replaces it
  — not kept as a togglable alternate view.

## Design

### Cabinet body background

The scrollable content area behind the shelf (currently `.mc-grid`'s
container) gets a continuous vertical wood-plank background:
`background: #120e0b linear-gradient(90deg, rgba(0,0,0,0.25) 1px,
transparent 1px); background-size: 80px 100%;` (same technique the old,
deleted `.closet-shelf` rule used) — plus a subtle inset shadow at the
top edge so the shelf area reads as recessed relative to the toolbar.

### Shelf layout

Container: `display: flex; flex-wrap: wrap; align-content: flex-start;
gap` between spines. No CSS Grid — flexbox wrap with fixed-size children
avoids the `aspect-ratio` grid-row-collapse bug from the previous
redesign entirely, since spines don't need aspect-ratio-derived sizing
(fixed 44×220px). Spines wrap into new rows automatically; the container
scrolls vertically same as the current `.mc-grid` does.

Each spine's bottom edge is not individually shelf-board-decorated (that
would require fragile per-row alignment with dynamically-wrapping
content) — instead, a repeating horizontal "shelf board" strip renders
via a separate absolutely-positioned decorative layer at fixed intervals
matching the spine height + gap, OR (simpler, chosen approach) via a
`box-shadow` cast beneath each spine (`box-shadow: 0 8px 10px
rgba(0,0,0,0.5)`) that reads as the spine sitting on an implied shelf
without needing exact row-boundary alignment. The wood-plank background
alone (vertical grain) plus per-spine drop shadows is sufficient to read
as "shelf" without literal horizontal board rendering — this avoids the
alignment fragility while keeping the physical-cabinet feel.

### Spine card

- Fixed size: `width: 44px; height: 220px`.
- Background: the item's poster image via `<img>` with `object-fit:
  cover; object-position: center;` inside a 44×220 box — this naturally
  crops the poster to a narrow vertical strip (matches how a real DVD
  spine crops cover art). Falls back to `generateGenericCover` (existing
  helper from `mediaUtils.jsx`) when no image exists, same as the poster
  grid did.
- Gradient overlay: `background: linear-gradient(to bottom,
  rgba(0,0,0,0.15), rgba(0,0,0,0.65) 85%)` layered over the image so
  vertical text stays legible regardless of poster brightness.
- Title text: `writing-mode: vertical-rl; text-orientation: mixed;`,
  serif font (matches `--serif`), truncated with `text-overflow:
  ellipsis` inside the fixed height, positioned centered in the spine.
- Rating mark: small star glyph(s) near the bottom of the spine
  (reuses the same rating-derivation logic already in `PosterGrid.jsx`
  today — `item.rating` for films, computed stars from `my_rating` for
  anime/manga — ported as-is, not recomputed differently).
- Status badge (watching/reading): small colored dot in the top corner
  instead of the current text badge (no room for a text label at 44px
  width).
- Custom-entry delete button: small × in the top corner, same
  `onRemoveItem` wiring as today, shown only when `item.isCustom`.

### Interaction

- Hover: `transform: translateY(-16px) rotate(-1deg); box-shadow: 0 15px
  30px rgba(0,0,0,0.75); z-index: 10;` — matches the "pulling forward"
  feel from the old, deleted `.spine-item:hover` rule, retuned for the
  smaller 220px height (the old rule's `-28px` lift was tuned for a
  270px shelf channel that no longer exists in this layout).
- Selected state (drawer open on this item): persistent lift + an
  oxblood-tinted border, analogous to today's `.mc-card--selected`.
- Click: calls the same `onSelectItem(item)` prop `PosterGrid` used —
  `MediaCabinet.jsx` wiring is unchanged, so this opens `DetailDrawer`
  exactly as before.
- Empty/no-match state: same `[ No matching titles found on the shelf ]`
  message, styled to sit within the wood-plank background instead of a
  flat dark one.

### Toolbar restyle

Visual-only: brass-plaque background (warm gold/brass gradient sample,
e.g. `linear-gradient(to bottom, #8a7150, #5c4a32)`) with engraved-look
text (dark text on the brass, subtle inset `text-shadow`), replacing the
current flat dark toolbar background. Category tabs, search input,
genre/decade/sort selects, stats strip, and the + LOG button keep their
current functional structure and props — only colors/borders/shadows
change to read as mounted brass hardware rather than a flat dark bar.

### Responsive behavior

At the existing 768px breakpoint (matching `DetailDrawer`'s bottom-sheet
threshold), spine size shrinks slightly (`36px` wide) so more fit per row
on narrow windows, and the toolbar's existing `flex-wrap` behavior is
unchanged.

## Data Flow

Unchanged. `ShelfBrowser` (new component replacing `PosterGrid`) receives
the exact same props `PosterGrid` did: `items` (processedItems from
`useMediaDb`), `category`, `selectedItem`, `onSelectItem`,
`onRemoveItem`. No new data fetching, no new state.

## Component Impact

- Delete: `src/apps/MediaCabinet/PosterGrid.jsx`.
- Create: `src/apps/MediaCabinet/ShelfBrowser.jsx` (same prop contract as
  the deleted `PosterGrid.jsx`).
- Modify: `src/apps/MediaCabinet/MediaCabinet.jsx` — swap the
  `<PosterGrid ... />` render for `<ShelfBrowser ... />` (import change
  + one JSX tag change, no prop shape change).
- Modify: `src/apps/MediaCabinet/MediaCabinet.css` — remove `.mc-grid`,
  `.mc-card`, `.mc-card-*` rules (dead once `PosterGrid.jsx` is deleted);
  add new shelf/spine/toolbar-restyle rules.
- Unchanged: `useMediaDb.js`, `DetailDrawer.jsx`, `Toolbar.jsx` (prop
  structure), `mediaUtils.jsx`.

## Error Handling

Unchanged from the current implementation — missing poster image falls
back to `generateGenericCover`; empty filtered results show the existing
empty-state message; add/delete error handling in `useMediaDb.js` is
untouched since that file isn't modified.

## Testing / Verification

No test framework exists in this repo (unchanged from the previous
spec). Manual verification via `vite dev`:

- Films/Anime/Manga tabs each render as a wrapping shelf of spines (no
  horizontal overflow/unusable single-row shelf for the ~494-film case).
- Spines show cropped poster art with legible vertical title text and a
  visible rating mark.
- Hovering a spine lifts/rotates it; clicking opens `DetailDrawer` with
  correct item detail (proves prop wiring to the existing drawer is
  intact).
- Search/genre/decade/sort controls still narrow/reorder the shelf
  correctly (proves `Toolbar`/`useMediaDb` wiring is untouched).
- "+ LOG" still opens the add-entry drawer and a submitted entry appears
  as a new spine.
- Resizing the window below 768px shrinks spine width and the drawer
  still becomes a bottom sheet.
- `Logline.app`/`Cineplay.app` still load correctly (proves this change
  didn't touch `filmsForGames`/`App.jsx` wiring at all).
- `vite build` passes with no errors.
