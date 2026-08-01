# Photos Contact Sheet Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `PhotosApp` out of `App.jsx` into `src/apps/Photos/Photos.jsx`, restyle as a darkroom contact sheet, without touching gallery data or logic.

**Architecture:** Single component move + restyle, same pattern as Logline/Cineplay — same state/logic, new `ph-*` CSS classes.

**Tech Stack:** React 19, plain CSS, Vite.

## Global Constraints

- No test framework. Verification is `vite build` + manual click-through.
- `PHOTO_GALLERY` data, slideshow interval (3000ms), and filter values (`mono`/`sepia`/`warm` CSS filter strings) ported byte-identical.
- New classes use a `ph-` prefix. This is the last app using `.logphile-back-btn` — replace with a new `ph-back-btn` so the old class can be fully removed from `index.css`.

---

### Task 1: `Photos.jsx` + `Photos.css`

**Files:**
- Create: `src/apps/Photos/Photos.jsx`
- Create: `src/apps/Photos/Photos.css`

- [ ] **Step 1: Create `Photos.jsx`**

Copy `PHOTO_GALLERY` and the entire `function PhotosApp() { ... }` body from `src/App.jsx` verbatim, add `import { useState, useEffect } from 'react';` and `import './Photos.css';` at the top, `export default PhotosApp;` at the bottom, and remap classNames:

- `photos-details-view` → `ph-detail-view`
- `photos-header-row` → `ph-detail-header`
- `logphile-back-btn` → `ph-back-btn` (drop the inline `style={{ margin: 0 }}` in favor of the new class)
- `photos-controls-panel` → `ph-controls`
- `control-action-btn` (+ `active`) → `ph-slideshow-btn` (+ `ph-slideshow-btn--active`)
- `filter-select-group` → `ph-filter-group`
- `filter-btn` (+ `active`) → `ph-filter-btn` (+ `ph-filter-btn--active`)
- `photos-detail-content` → `ph-detail-body`
- `photo-large-container` → `ph-lightbox`
- `photo-large-img` (+ `filter-none`/`filter-mono`/`filter-sepia`/`filter-warm`) → `ph-lightbox-img` (+ `ph-filter--none`/`ph-filter--mono`/`ph-filter--sepia`/`ph-filter--warm`)
- `photo-meta-panel` → `ph-log-panel`
- `photo-exif-list` → `ph-log-list`
- `photo-description` → `ph-log-desc`
- `photos-grid-view` → `ph-sheet-view`
- `photos-album-header` → `ph-sheet-header`
- `photos-grid` → `ph-sheet-grid`
- `photo-polaroid-card` → `ph-frame`
- `polaroid-img-wrapper` → `ph-frame-img-wrap`
- `polaroid-caption` → `ph-frame-caption`

For the contact-sheet grid, also add a frame index number to each `.ph-frame` (e.g. render `String(index + 1).padStart(2, '0')` in a small `.ph-frame-number` span) — `PHOTO_GALLERY.map((photo, index) => ...)` already has the array index available once you add `index` as the second `.map` argument.

All other inline `style={{ ... }}` attributes still present after this mapping (the small one-off styles on the EXIF header block, filter label, etc.) move into corresponding new `ph-*` classes in `Photos.css`.

- [ ] **Step 2: Create `Photos.css`**

Style the contact-sheet/darkroom direction:
- `.ph-sheet-view` / `.ph-sheet-header`: album header bar matching the mono-label convention used elsewhere this session.
- `.ph-sheet-grid`: dense grid of small frames.
- `.ph-frame`: bordered frame with a thin sprocket-hole strip along the top and bottom edges (small dot row via a flex of small circles, same technique as Cineplay's `.cp-sprocket`), a `.ph-frame-number` in the corner (negative-strip-style numbering), image inside, caption below.
- `.ph-frame:hover`: slight lift/scale, consistent with this session's other hover conventions.
- `.ph-detail-view` / `.ph-detail-header` / `.ph-back-btn` / `.ph-controls` / `.ph-slideshow-btn` (+ `--active`) / `.ph-filter-group` / `.ph-filter-btn` (+ `--active`): header row with back button, slideshow toggle, and filter buttons — button styling consistent with this session's oxblood/mono button convention.
- `.ph-detail-body` / `.ph-lightbox` / `.ph-lightbox-img` (+ filter modifier classes, filter values ported identically: `filter-mono` = `grayscale(1) contrast(1.18) brightness(0.95)`, `filter-sepia` = `sepia(0.85) contrast(0.95) brightness(0.92) saturate(0.9)`, `filter-warm` = `sepia(0.18) saturate(1.45) hue-rotate(-8deg) contrast(1.02)`, `filter-none` = `none`): lightbox panel with a dark surround so the photo reads like it's on a light table.
- `.ph-log-panel` / `.ph-log-list` / `.ph-log-desc`: EXIF metadata styled as a typed log sheet (mono labels, serif or mono values).

Use only `var(--paper)`, `var(--paper-deep)`, `var(--ink)`, `var(--ink-soft)`, `var(--oxblood)`, `var(--oxblood-soft)`, `var(--hairline)`, `var(--serif)`, `var(--mono)`.

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/apps/Photos/Photos.jsx src/apps/Photos/Photos.css
git commit -m "Add Photos contact-sheet component"
```

---

### Task 2: Wire into `App.jsx`, final CSS sweep

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/index.css`

- [ ] **Step 1: Add the import**

```js
import PhotosApp from './apps/Photos/Photos.jsx';
```

- [ ] **Step 2: Remove the old `PHOTO_GALLERY` constant and function definition**

Delete the `const PHOTO_GALLERY = [ ... ];` block and the entire `function PhotosApp() { ... }` block from `src/App.jsx`. Leave `{win.id === 'photos' && <PhotosApp />}` untouched.

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Sweep dead CSS**

```bash
cd src
for cls in photos-grid-view photos-album-header photos-grid photo-polaroid-card polaroid-img-wrapper polaroid-caption photos-details-view photos-detail-content photo-large-container photo-large-img photo-meta-panel photo-exif-list photo-description photos-header-row photos-controls-panel control-action-btn filter-select-group filter-btn logphile-back-btn; do
  count=$(grep -c "\"$cls\"\|'$cls'\| $cls \|\`$cls" App.jsx)
  echo "$cls: $count"
done
```

For every `0`-count selector, delete its full CSS rule block in `src/index.css` (including the `.photo-large-img.filter-*` compound rules). If any selector is nonzero, check what's still referencing it before deleting — at this point in the sequence every other app has already been redesigned, so everything in this list should be fully dead, but verify rather than assume.

- [ ] **Step 5: Verify the build again**

Run: `npx vite build`
Expected: build succeeds after CSS cleanup.

- [ ] **Step 6: Manual verification**

`npm run dev`, open Photos.app:
- Contact-sheet grid renders all 4 photos with sprocket-hole framing and frame numbers.
- Click a photo — detail/lightbox view opens with correct EXIF data.
- Toggle each filter button (none/mono/sepia/warm) and confirm the image visibly changes.
- Start slideshow, confirm it auto-advances every ~3s, then pause it.
- Click back — returns to the contact sheet.
- No console errors.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/index.css
git commit -m "Wire Photos contact-sheet component into App.jsx, remove dead photos/polaroid CSS"
```
