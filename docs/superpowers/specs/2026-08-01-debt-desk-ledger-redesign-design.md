# Debt Desk Ledger Redesign — Design Spec

## Context

Debt Desk is currently ~100 lines of inline-styled JSX directly in `App.jsx`
(`win.id === 'debts'` block, around line 2011) — a generic dark-card money
tracker with no dedicated component or CSS file. This is part of the
same per-app redesign sequence as Media Cabinet: extract into its own
module, redesign visually, keep functionality identical.

## Direction

**Ledger book.** Debt Desk becomes a ruled-paper account ledger instead of
a card-based tracker. Traditional bookkeeping ink convention: black for
what's owed *to* Sumedh (credit), red for what Sumedh owes (debit) —
matches the existing `them_owes_me`/`i_owe_them` directions exactly, just
reframed as ink color instead of green/orange chips.

## Goals

- Extract into `src/apps/DebtDesk/` (`DebtDesk.jsx`, `useDebts.js`,
  `DebtDesk.css`), following the same pattern as Media Cabinet.
- Ledger page background: cream/paper with horizontal rule lines (CSS
  `repeating-linear-gradient`), not a flat dark card grid.
- Balance summary styled as a "balance forward" ledger header line, black
  ink for the they-owe-me total, red ink for the I-owe-them total.
- New-entry form styled as writing a new ledger line: underline-only
  input fields (no boxed dark backgrounds) laid out inline where
  reasonable.
- Entry rows: horizontal ruled rows, amount right-aligned in red/black
  ink matching direction, date in a compact ledger-style column.
- "SETTLE" becomes a rubber-stamp-style button (rotated slightly, stamp
  border) — same `handleRemoveDebt` behavior, just restyled.
- Notes importer (paste-and-parse) keeps identical parsing logic and
  placement, restyled as a "quick jot" note section consistent with the
  paper theme.
- All existing behavior unchanged: add debt, settle/remove debt, notes
  import/parse, localStorage persistence, `/api/sync-debts` dev sync call
  (unchanged, still fails silently in production as today).

## Non-goals

- No changes to the debts data shape, localStorage key, or sync endpoint.
- No changes to any other app or to `App.jsx` beyond replacing the
  `win.id === 'debts'` inline block with `<DebtDesk />` and moving the
  `debts`/`newDebt*`/`rawNotesInput` state and their three handlers into
  `useDebts.js`.
- No new features (no editing existing entries, no currency selection,
  etc.) — this is a visual/structural redesign of what exists today.

## Component Impact

- Create: `src/apps/DebtDesk/useDebts.js` — owns `debts` state (with
  localStorage load/persist + `/api/sync-debts` POST, ported as-is from
  `App.jsx`), `addDebt(fields)`, `removeDebt(id)`, `importFromNotes(text)`
  (the existing regex-based parser, ported as-is).
- Create: `src/apps/DebtDesk/DebtDesk.jsx` — the ledger UI, calling the
  hook above.
- Create: `src/apps/DebtDesk/DebtDesk.css`.
- Modify: `src/App.jsx` — remove `debts`/`newDebtPerson`/`newDebtAmount`/
  `newDebtDesc`/`newDebtDirection`/`rawNotesInput` state and
  `handleAddDebt`/`handleRemoveDebt`/`handleImportNotes`, replace the
  `win.id === 'debts'` block with `<DebtDesk />`. Note: `App.jsx`'s
  existing 3-second debts-polling `useEffect` (fetches
  `assets/data/debts.json` for cross-device sync) must move into
  `useDebts.js` too, since it feeds the same `debts` state.

## Testing / Verification

Manual via `vite dev`: add a debt (both directions), confirm ink color
matches direction and totals update; settle/remove a debt; paste text
into the notes importer and confirm it parses and merges correctly;
confirm `vite build` passes; confirm no console errors.
