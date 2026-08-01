# Media Cabinet Shelf Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Media Cabinet's poster-grid browsing surface with a physical wood-shelf of book/DVD spines, reusing the existing detail drawer, data hook, and toolbar wiring unchanged.

**Architecture:** A new `ShelfBrowser.jsx` component (same `{ items, category, selectedItem, onSelectItem, onRemoveItem }` prop contract as the `PosterGrid.jsx` it replaces) renders each item as a fixed-size (44×220px) flexbox-wrapped spine instead of a CSS-Grid poster card. `MediaCabinet.jsx` swaps which grid component it renders; nothing else in the data/interaction chain changes.

**Tech Stack:** React 19 (function components), plain CSS (same file, `MediaCabinet.css`), Vite.

## Global Constraints

- No test framework exists in this repo. Verification is manual: `vite build` after every task, full interactive verification (dev server + click-through) at the end.
- Do not modify `useMediaDb.js`, `DetailDrawer.jsx`, `mediaUtils.jsx`, `App.jsx`, or `Toolbar.jsx`'s prop structure — only `Toolbar.jsx`'s CSS classes get new visual rules in `MediaCabinet.css` (no `Toolbar.jsx` file changes).
- Reuse existing CSS custom properties from `src/index.css` `:root` (`--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--oxblood`, `--oxblood-soft`, `--hairline`, `--serif`, `--mono`).
- Spines use fixed pixel dimensions (44×220px desktop, 36×190px at the existing 768px breakpoint) — do not use `aspect-ratio` on the flex item itself (this is precisely the pattern that caused the CSS Grid auto-row-collapse bug fixed in the previous redesign; fixed dimensions on a flexbox child carry no such risk, but stay fixed-size, not ratio-derived).
- `ShelfBrowser.jsx` must not change the `onSelectItem`/`onRemoveItem` calling convention (`onSelectItem(item)`, `onRemoveItem(item)`) — `MediaCabinet.jsx`'s handlers are unchanged and depend on this exact contract.

---

### Task 1: `ShelfBrowser.jsx` — spine-based browsing component

**Files:**
- Create: `src/apps/MediaCabinet/ShelfBrowser.jsx`

**Interfaces:**
- Consumes: `generateGenericCover` from `./mediaUtils.jsx` (already exists, unchanged).
- Produces: default export `ShelfBrowser({ items, category, selectedItem, onSelectItem, onRemoveItem })` — identical prop shape to the `PosterGrid` it replaces, so `MediaCabinet.jsx` only needs an import/tag swap in Task 3.

- [ ] **Step 1: Create the file**

```jsx
// src/apps/MediaCabinet/ShelfBrowser.jsx
import { generateGenericCover } from './mediaUtils.jsx';

function getSpineRatingMark(category, item) {
  if (category === 'films') {
    if (!item.rating) return null;
    const stars = (item.rating.split('★').length - 1) + (item.rating.includes('½') ? 0.5 : 0);
    return stars > 0 ? '★'.repeat(Math.round(stars)) : null;
  }
  const personal = parseFloat(item.my_rating);
  if (isNaN(personal)) return null;
  return '★'.repeat(Math.round(personal / 2));
}

function ShelfBrowser({ items, category, selectedItem, onSelectItem, onRemoveItem }) {
  if (items.length === 0) {
    return <div className="mc-shelf-empty mono">[ No matching titles found on the shelf ]</div>;
  }

  return (
    <div className="mc-shelf">
      {items.map((item, index) => {
        const isSelected = selectedItem && (
          category === 'films' ? selectedItem.slug === item.slug : selectedItem.id === item.id
        );
        const ratingMark = getSpineRatingMark(category, item);

        return (
          <div
            key={category === 'films' ? item.slug : item.id}
            className={`mc-spine ${isSelected ? 'mc-spine--selected' : ''}`}
            style={{ animationDelay: `${index * 12}ms` }}
            tabIndex="0"
            title={item.title}
            onClick={() => onSelectItem(item)}
            onFocus={() => onSelectItem(item)}
          >
            {item.isCustom && (
              <button
                className="mc-spine-delete-btn"
                onClick={(e) => { e.stopPropagation(); onRemoveItem(item); }}
                title="Delete custom entry"
              >
                ×
              </button>
            )}

            <div className="mc-spine-art">
              {item.image ? (
                <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
              ) : (
                <div className="mc-spine-fallback" dangerouslySetInnerHTML={{ __html: generateGenericCover(item.title, item.year) }} />
              )}
              <div className="mc-spine-gradient" />
            </div>

            {(item.status === 'watching' || item.status === 'reading') && (
              <div className="mc-spine-status-dot" title={item.status} />
            )}

            <span className="mc-spine-title">{item.title}</span>

            {ratingMark && <span className="mc-spine-rating mono">{ratingMark}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default ShelfBrowser;
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds (this file isn't imported anywhere yet, so it just needs to parse cleanly).

- [ ] **Step 3: Commit**

```bash
git add src/apps/MediaCabinet/ShelfBrowser.jsx
git commit -m "Add ShelfBrowser component for Media Cabinet shelf redesign"
```

---

### Task 2: Restyle `MediaCabinet.css` — shelf, spines, brass toolbar

**Files:**
- Modify: `src/apps/MediaCabinet/MediaCabinet.css`

**Interfaces:**
- Produces: CSS classes consumed by `ShelfBrowser.jsx` (Task 1) — `.mc-shelf`, `.mc-shelf-empty`, `.mc-spine`, `.mc-spine--selected`, `.mc-spine-art`, `.mc-spine-fallback`, `.mc-spine-gradient`, `.mc-spine-status-dot`, `.mc-spine-delete-btn`, `.mc-spine-title`, `.mc-spine-rating`.

This task has two parts: (a) remove the now-dead poster-grid rules, (b) add the new shelf/spine rules and retint the toolbar. `Toolbar.jsx`'s existing class names (`.mc-toolbar`, `.mc-tab-btn`, `.mc-toolbar-search`, `.mc-toolbar-select`, `.mc-toolbar-stats`, `.mc-log-btn`) are unchanged — only their CSS rules are edited in place.

- [ ] **Step 1: Remove the poster-grid rules**

In `src/apps/MediaCabinet/MediaCabinet.css`, delete this entire block (the comment header through `.mc-card-delete-btn`'s closing brace):

```css
/* Poster grid */
.mc-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
  padding: 16px;
  align-content: start;
}

.mc-grid-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 0.75rem;
}

.mc-card {
  position: relative;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: transform 180ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 180ms ease, border-color 180ms ease;
  animation: mc-card-in 260ms ease backwards;
}
@keyframes mc-card-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.mc-card:hover, .mc-card:focus { transform: scale(1.05); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55); outline: none; }
.mc-card--selected { border-color: var(--oxblood); }

/* aspect-ratio lives on this inner block child, not on the grid item itself —
   Chromium miscomputes CSS Grid auto row-track height when aspect-ratio sizing
   is applied directly to the grid item, collapsing every row to ~2px. */
.mc-card-poster { position: relative; width: 100%; aspect-ratio: 2 / 3; overflow: hidden; border-radius: 6px; background: var(--paper-deep); }
.mc-card-poster img, .mc-card-poster .mc-card-fallback-cover { width: 100%; height: 100%; object-fit: cover; display: block; }

.mc-card-status {
  position: absolute;
  top: 6px;
  left: 6px;
  background: rgba(255, 76, 90, 0.92);
  color: #fff;
  font-size: 0.52rem;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.04em;
}

.mc-card-rating {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffb400;
  font-size: 0.55rem;
  padding: 2px 5px;
  border-radius: 3px;
}

.mc-card-hover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, rgba(0, 0, 0, 0.15) 55%, transparent 100%);
  opacity: 0;
  transition: opacity 180ms ease;
}
.mc-card:hover .mc-card-hover-overlay, .mc-card:focus .mc-card-hover-overlay { opacity: 1; }
.mc-card-hover-title { font-family: var(--serif); font-size: 0.78rem; color: var(--ink); line-height: 1.2; }
.mc-card-hover-year { font-family: var(--mono); font-size: 0.6rem; color: var(--ink-soft); margin-top: 2px; }

.mc-card-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 5;
  background: rgba(255, 23, 68, 0.95);
  color: #fff;
  border: none;
  border-radius: 3px;
  font-size: 0.52rem;
  padding: 2px 5px;
  cursor: pointer;
  font-family: var(--mono);
  font-weight: bold;
}
```

Replace it with (still under a `/* Shelf */` header, same location in the file):

```css
/* Shelf */
.mc-shelf {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 8px;
  padding: 20px;
  background: #120e0b linear-gradient(90deg, rgba(0, 0, 0, 0.25) 1px, transparent 1px);
  background-size: 80px 100%;
  box-shadow: inset 0 12px 24px rgba(0, 0, 0, 0.55);
}

.mc-shelf-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-soft);
  font-size: 0.75rem;
  background: #120e0b linear-gradient(90deg, rgba(0, 0, 0, 0.25) 1px, transparent 1px);
  background-size: 80px 100%;
}

.mc-spine {
  position: relative;
  width: 44px;
  height: 220px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 2px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.4);
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.5);
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease, border-color 300ms ease;
  animation: mc-spine-in 300ms ease backwards;
  outline: none;
}
@keyframes mc-spine-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.mc-spine:hover, .mc-spine:focus {
  transform: translateY(-16px) rotate(-1deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.75), 5px 15px 15px rgba(0, 0, 0, 0.3);
  z-index: 10;
}
.mc-spine--selected {
  transform: translateY(-16px) rotate(-1deg);
  border-color: var(--oxblood);
  box-shadow: 0 0 0 2px var(--oxblood), 0 15px 30px rgba(0, 0, 0, 0.75);
  z-index: 11;
}

.mc-spine-art { position: absolute; inset: 0; }
.mc-spine-art img, .mc-spine-fallback { width: 100%; height: 100%; object-fit: cover; display: block; }
.mc-spine-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.65) 85%);
}

.mc-spine-title {
  position: relative;
  z-index: 2;
  display: block;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: var(--serif);
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--ink);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
  padding: 10px 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.mc-spine-rating {
  position: absolute;
  bottom: 4px;
  left: 0;
  right: 0;
  z-index: 2;
  text-align: center;
  font-size: 0.42rem;
  color: #ffb400;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
}

.mc-spine-status-dot {
  position: absolute;
  top: 4px;
  left: 4px;
  z-index: 3;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--oxblood-soft);
  box-shadow: 0 0 4px var(--oxblood-soft);
}

.mc-spine-delete-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 4;
  width: 14px;
  height: 14px;
  line-height: 12px;
  text-align: center;
  background: rgba(255, 23, 68, 0.95);
  color: #fff;
  border: none;
  border-radius: 2px;
  font-size: 0.6rem;
  cursor: pointer;
  padding: 0;
}
```

- [ ] **Step 2: Retint the toolbar to a brass-plaque look**

Replace:

```css
/* Toolbar */
.mc-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--hairline);
  background: rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.mc-toolbar-tabs { display: flex; gap: 6px; }

.mc-tab-btn {
  background: transparent;
  border: 1px solid var(--hairline);
  color: var(--ink-soft);
  font-family: var(--mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 5px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 150ms ease;
}
.mc-tab-btn:hover { color: var(--ink); border-color: var(--oxblood-soft); }
.mc-tab-btn--active { background: var(--oxblood); border-color: var(--oxblood); color: var(--paper-deep); font-weight: bold; }

.mc-toolbar-search { flex: 1; min-width: 160px; }
.mc-toolbar-search input {
  width: 100%;
  background: var(--paper-deep);
  border: 1px solid var(--hairline);
  color: var(--ink);
  padding: 6px 10px;
  font-size: 0.8rem;
  border-radius: 3px;
  outline: none;
  box-sizing: border-box;
}
.mc-toolbar-search input:focus { border-color: var(--oxblood-soft); }

.mc-toolbar-select {
  background: var(--paper-deep);
  border: 1px solid var(--hairline);
  color: var(--ink-soft);
  font-size: 0.65rem;
  padding: 5px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.mc-toolbar-stats { display: flex; gap: 10px; font-size: 0.6rem; color: var(--ink-soft); white-space: nowrap; }
.mc-toolbar-stats span { border: 1px solid var(--hairline); padding: 3px 7px; border-radius: 3px; }

.mc-log-btn {
  background: var(--oxblood);
  border: none;
  color: var(--paper-deep);
  font-weight: bold;
  font-size: 0.68rem;
  padding: 6px 14px;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
}
.mc-log-btn:hover { background: var(--oxblood-soft); }
```

with:

```css
/* Toolbar — brass plaque mounted above the shelf */
.mc-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 3px solid #3a2f1f;
  background: linear-gradient(to bottom, #a8895f 0%, #8a7150 45%, #5c4a32 100%);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  flex-shrink: 0;
}

.mc-toolbar-tabs { display: flex; gap: 6px; }

.mc-tab-btn {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(0, 0, 0, 0.4);
  color: #2b2013;
  font-family: var(--mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 5px 12px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 150ms ease;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}
.mc-tab-btn:hover { color: #150f08; border-color: var(--oxblood); }
.mc-tab-btn--active { background: var(--oxblood); border-color: #3a1210; color: #fff; font-weight: bold; text-shadow: none; }

/* search input / selects keep their existing dark-plate styling — reads as an
   inset gauge window set into the brass, so text/background stay unchanged */
.mc-toolbar-search { flex: 1; min-width: 160px; }
.mc-toolbar-search input {
  width: 100%;
  background: var(--paper-deep);
  border: 1px solid rgba(0, 0, 0, 0.4);
  color: var(--ink);
  padding: 6px 10px;
  font-size: 0.8rem;
  border-radius: 3px;
  outline: none;
  box-sizing: border-box;
}
.mc-toolbar-search input:focus { border-color: var(--oxblood-soft); }

.mc-toolbar-select {
  background: var(--paper-deep);
  border: 1px solid rgba(0, 0, 0, 0.4);
  color: var(--ink-soft);
  font-size: 0.65rem;
  padding: 5px 8px;
  border-radius: 3px;
  cursor: pointer;
}

.mc-toolbar-stats { display: flex; gap: 10px; font-size: 0.6rem; color: #2b2013; white-space: nowrap; }
.mc-toolbar-stats span { border: 1px solid rgba(0, 0, 0, 0.35); background: rgba(0, 0, 0, 0.12); padding: 3px 7px; border-radius: 3px; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2); }

.mc-log-btn {
  background: var(--oxblood);
  border: 1px solid #3a1210;
  color: #fff;
  font-weight: bold;
  font-size: 0.68rem;
  padding: 6px 14px;
  border-radius: 3px;
  cursor: pointer;
  white-space: nowrap;
}
.mc-log-btn:hover { background: var(--oxblood-soft); }
```

- [ ] **Step 3: Update the responsive media query**

Find (inside the existing `@media (max-width: 768px) { ... }` block at the end of the file):

```css
  .mc-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; padding: 10px; }
```

Replace with:

```css
  .mc-shelf { gap: 8px 6px; padding: 14px; }
  .mc-spine { width: 36px; height: 190px; }
```

- [ ] **Step 4: Verify the build**

Run: `npx vite build`
Expected: build succeeds. `ShelfBrowser.jsx` still isn't rendered anywhere yet (Task 3 wires it in), so this only confirms the CSS file itself has no syntax errors — Vite processes CSS through esbuild/lightningcss and will fail the build on malformed CSS even if unreferenced, since `MediaCabinet.css` is already imported by `MediaCabinet.jsx`.

- [ ] **Step 5: Commit**

```bash
git add src/apps/MediaCabinet/MediaCabinet.css
git commit -m "Restyle Media Cabinet: wood-shelf/spine rules, brass toolbar retint"
```

---

### Task 3: Wire `ShelfBrowser` into `MediaCabinet.jsx`, delete `PosterGrid.jsx`

**Files:**
- Modify: `src/apps/MediaCabinet/MediaCabinet.jsx`
- Delete: `src/apps/MediaCabinet/PosterGrid.jsx`

**Interfaces:**
- Consumes: `ShelfBrowser` default export (Task 1).
- Produces: nothing further downstream — `MediaCabinet.jsx`'s own exported shape (`export default MediaCabinet`, no props) is unchanged, so nothing outside this directory needs to change.

- [ ] **Step 1: Swap the import**

In `src/apps/MediaCabinet/MediaCabinet.jsx`, change:

```js
import PosterGrid from './PosterGrid';
```

to:

```js
import ShelfBrowser from './ShelfBrowser';
```

- [ ] **Step 2: Swap the rendered component**

Change:

```jsx
      <PosterGrid
        items={processedItems}
        category={category}
        selectedItem={drawer.mode === 'view' ? drawer.item : null}
        onSelectItem={handleSelectItem}
        onRemoveItem={handleRemoveItem}
      />
```

to:

```jsx
      <ShelfBrowser
        items={processedItems}
        category={category}
        selectedItem={drawer.mode === 'view' ? drawer.item : null}
        onSelectItem={handleSelectItem}
        onRemoveItem={handleRemoveItem}
      />
```

No other lines in this file change — `useMediaDb`, `Toolbar`, and `DetailDrawer` wiring stay exactly as-is.

- [ ] **Step 3: Delete `PosterGrid.jsx`**

```bash
git rm src/apps/MediaCabinet/PosterGrid.jsx
```

- [ ] **Step 4: Verify the build**

Run: `npx vite build`
Expected: build succeeds with no errors (no leftover references to `PosterGrid` or the deleted `.mc-grid`/`.mc-card*` CSS classes). If it fails, check for a stray `PosterGrid` import or JSX tag left in `MediaCabinet.jsx`.

- [ ] **Step 5: Commit**

```bash
git add src/apps/MediaCabinet/MediaCabinet.jsx
git commit -m "Wire ShelfBrowser into MediaCabinet, remove PosterGrid"
```

(The `git rm` from Step 3 is already staged; this commit captures both the deletion and the `MediaCabinet.jsx` edit together.)

---

### Task 4: Full manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server and open Media Cabinet**

Run: `npm run dev`, open the printed local URL, open the Media Cabinet window.

Verify:
1. The toolbar renders with a brass-plaque look (gradient background, dark-on-brass tab/stat text — not the old flat dark bar) and all controls (tabs, search, genre/decade/sort selects, stats strip, + LOG) are legible.
2. The shelf area shows a continuous wood-plank background (vertical grain), not a flat dark background.
3. Films render as narrow vertical spines with visible poster-art coloring and vertical title text; spines wrap into multiple rows (confirms the ~494-film case doesn't produce one unusably long horizontal shelf).
4. Hovering a spine lifts it upward with a slight rotation and a visible shadow.
5. Clicking a spine opens `DetailDrawer` with the correct title/year/rating/description for that item (proves the prop contract to the untouched drawer is intact).
6. Switching Films / Anime / Manga tabs repopulates the shelf correctly for each category.
7. Typing in search narrows the shelf; changing genre/decade filters and the sort dropdown reorder/narrow the shelf correctly (proves `Toolbar`/`useMediaDb` wiring, both untouched, still work through the new component).
8. "+ LOG" opens the add-entry drawer; submitting a test entry adds a new spine to the shelf (then delete it via the spine's × button to avoid leaving test data — check `git status` on `public/assets/data/media.js` afterward and `git restore` it if the local dev API endpoint wrote to disk).
9. Resizing the browser window below 768px shrinks spines to 36×190px and the drawer still becomes a bottom sheet.
10. Open Logline.app and Cineplay.app — both still load and function (proves this change didn't touch `App.jsx`/`filmsForGames` at all).
11. Browser console shows no new errors.

- [ ] **Step 2: Final build check**

Run: `npx vite build`
Expected: succeeds with no errors or new warnings.

- [ ] **Step 3: Stop the dev server**

Kill the `vite dev` process started in Step 1.
