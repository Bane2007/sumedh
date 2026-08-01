# About Me Dossier Redesign — Design Spec

## Context

About Me is a static two-column bio block directly in `App.jsx`
(`win.id === 'about'`, ~25 lines, no state, no handlers). Part of the
same per-app redesign sequence.

## Direction

**HAL9000 personnel dossier.** Instead of a plain bio + two bullet lists,
present it as a "crew file" — a classification header (leans into the
site's own HAL9000/Discovery One framing), a typed case-summary block for
the bio, and the positions/competitions lists restyled as a two-column
service record with year|entry rows instead of plain `<li>` bullets.

## Goals

- Extract into `src/apps/AboutMe/AboutMe.jsx` + `AboutMe.css` (no hook
  needed — this is static content, no state).
- Classification header bar: "PERSONNEL FILE" title, name, a small
  status/clearance line in oxblood, monospace.
- Bio rendered inside a bordered "case summary" block, serif type,
  unchanged copy.
- Positions and competitions rendered as two service-record tables (year
  column + entry column, ruled rows) instead of bullet lists — unchanged
  data/copy, ported as-is from the current JSX.

## Non-goals

- No new bio content, no new positions/competitions entries — copy is
  ported verbatim.
- No changes to `App.jsx` beyond replacing the `win.id === 'about'` block
  with `<AboutMe />` (no state to remove — there was none).

## Component Impact

- Create: `src/apps/AboutMe/AboutMe.jsx`, `src/apps/AboutMe/AboutMe.css`.
- Modify: `src/App.jsx` — replace the `win.id === 'about'` inline block
  with `<AboutMe />`.

## Testing / Verification

Manual via `vite dev`: open About Me, confirm bio text and both
positions/competitions lists render with identical content to before
(just restyled), `vite build` passes, no console errors.
