# Photos Contact Sheet Redesign — Design Spec

## Context

`PhotosApp` is a ~115-line top-level function component in `App.jsx` — a
gallery grid view (polaroid-style cards) plus a detail view (large image,
EXIF metadata panel, slideshow, vintage filter toggles). `PHOTO_GALLERY`
data and all logic (slideshow interval, filter state, photo selection)
are correct and untouched.

## Direction

**Darkroom contact sheet.** Grid view becomes a film contact sheet —
small frames with sprocket-hole edges arranged in strips, negative-style
frame numbering — instead of polaroid cards. Detail view becomes a
light-table/loupe view: large image on a lightbox background, EXIF panel
styled like a darkroom log sheet.

## Goals

- Extract into `src/apps/Photos/Photos.jsx` + `Photos.css`, moving
  `PHOTO_GALLERY` and the existing `PhotosApp` function verbatim (same
  state, same slideshow/filter/selection logic) — visual-only changes.
- New `ph-` prefixed classes, not reusing old global `photos-*`/
  `polaroid-*`/`photo-*`/`control-action-btn`/`filter-btn`/
  `filter-select-group` classes from `index.css`.
- Grid view: contact-sheet strip styling — bordered frames with small
  sprocket-hole dots along the top/bottom edge, frame index numbers
  (01, 02, 03...) in the corner like negative strip numbering.
- Detail view: image on a lightbox-style panel, EXIF data presented as a
  log-sheet list, slideshow/filter controls kept functional with restyled
  buttons consistent with this session's other redesigned apps.
- Vintage filter CSS (`mono`/`sepia`/`warm`) ported with identical filter
  values, just under new class names.

## Non-goals

- No changes to `PHOTO_GALLERY` data, slideshow timing, or filter
  values/logic.
- No new photos, no new filters.
- No changes to how `App.jsx` renders `<PhotosApp />` for `win.id === 'photos'`.
- The shared `.logphile-back-btn` class (still used for the "back to
  album" button) can be kept or replaced with a new `ph-back-btn` — since
  this is the last app using it, replacing it lets the old class be fully
  swept from `index.css` too.

## Component Impact

- Create: `src/apps/Photos/Photos.jsx`, `src/apps/Photos/Photos.css`.
- Modify: `src/App.jsx` — remove the `PHOTO_GALLERY` constant and
  `function PhotosApp()` definition, add an import, keep the existing
  `{win.id === 'photos' && <PhotosApp />}` render call unchanged.
- Modify: `src/index.css` — remove now-dead `photos-*`/`polaroid-*`/
  `photo-*`/`control-action-btn`/`filter-btn`/`filter-select-group`/
  `logphile-back-btn` rules once confirmed unused (same grep-sweep method
  used for prior apps).

## Testing / Verification

Manual: contact-sheet grid renders all 4 photos, clicking one opens the
detail/loupe view with correct EXIF data, slideshow auto-advances,
filter buttons change the image's visual filter, back button returns to
the grid, `vite build` passes, no console errors.
