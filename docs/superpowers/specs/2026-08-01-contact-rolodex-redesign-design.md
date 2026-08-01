# Contact Rolodex Redesign — Design Spec

## Context

Contact is a static centered link list directly in `App.jsx`
(`win.id === 'contact'`, ~12 lines, no state).

## Direction

**Rolodex card.** A single index card (like an old address-book rolodex
entry) styled with a name header and each link as a labeled field row,
instead of a plain vertical link list.

## Goals

- Extract into `src/apps/Contact/Contact.jsx` + `Contact.css`, no hook
  needed.
- Card styled like a rolodex/index card: cream card on the dark desktop
  background, a punched-hole notch at the top (decorative), name header,
  each link as a labeled row (label left, value right, link styled as
  the "entry").
- Same five links, same URLs, same `target="_blank" rel="noopener"`.

## Non-goals

- No new links, no copy changes.
- No changes to `App.jsx` beyond replacing the block with `<Contact />`.

## Component Impact

- Create: `src/apps/Contact/Contact.jsx`, `src/apps/Contact/Contact.css`.
- Modify: `src/App.jsx`.

## Testing / Verification

Manual: all 5 links present with correct hrefs/targets, `vite build`
passes, no console errors.
