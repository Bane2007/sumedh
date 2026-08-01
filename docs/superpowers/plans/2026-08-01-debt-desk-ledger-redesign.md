# Debt Desk Ledger Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract Debt Desk out of `App.jsx` into `src/apps/DebtDesk/` and redesign it as a ruled-paper ledger (black ink for credit, red ink for debit), keeping all existing behavior identical.

**Architecture:** `useDebts.js` owns state (debts array, localStorage persistence, cross-device polling of `debts.json`, add/remove/import-from-notes). `DebtDesk.jsx` is the presentational ledger UI consuming that hook.

**Tech Stack:** React 19, plain CSS, Vite.

## Global Constraints

- No test framework exists. Verification is `vite build` + manual click-through.
- Do not change the debts data shape, `sumedh_debts` localStorage key, `/api/sync-debts` endpoint, or the `assets/data/debts.json` polling behavior (3s interval, cross-device sync) — port exactly as-is.
- Leave the anime/manga localStorage-sanitization code and the console diagnostic dump in `App.jsx`'s existing "Load database" effect untouched — only the debts-polling portion of that effect moves.
- Reuse `src/index.css` `:root` variables (`--paper`, `--ink`, `--oxblood`, `--hairline`, `--serif`, `--mono`) plus new ledger-specific colors as needed (defined locally in `DebtDesk.css`, not added to the global `:root`).

---

### Task 1: `useDebts.js` — data + persistence hook

**Files:**
- Create: `src/apps/DebtDesk/useDebts.js`

**Interfaces:**
- Produces: `useDebts(): { debts: Array, addDebt({ person, amount, description, direction }), removeDebt(id), importFromNotes(text) }`

- [ ] **Step 1: Create the file**

```js
// src/apps/DebtDesk/useDebts.js
import { useState, useEffect, useCallback } from 'react';

function syncToServer(list) {
  fetch('/api/sync-debts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list)
  }).catch(() => {});
}

export function useDebts() {
  const [debts, setDebts] = useState(() => {
    try {
      const stored = localStorage.getItem('sumedh_debts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchDebts = () => {
      fetch(`${import.meta.env.BASE_URL}assets/data/debts.json?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => setDebts(data))
        .catch(err => console.log('Polling debts error:', err));
    };
    fetchDebts();
    const interval = setInterval(fetchDebts, 3000);
    return () => clearInterval(interval);
  }, []);

  const addDebt = useCallback(({ person, amount, description, direction }) => {
    if (!person.trim() || !amount) return;
    const item = {
      id: Math.floor(Math.random() * 1000000),
      direction,
      person: person.trim(),
      amount: parseFloat(amount) || 0,
      description: description.trim() || 'No description',
      date: new Date().toISOString().split('T')[0]
    };
    setDebts(prev => {
      const updated = [item, ...prev];
      localStorage.setItem('sumedh_debts', JSON.stringify(updated));
      syncToServer(updated);
      return updated;
    });
  }, []);

  const removeDebt = useCallback((id) => {
    setDebts(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('sumedh_debts', JSON.stringify(updated));
      syncToServer(updated);
      return updated;
    });
  }, []);

  const importFromNotes = useCallback((text) => {
    if (!text.trim()) return;
    const lines = text.split('\n');
    const parsed = [];
    lines.forEach(line => {
      const t = line.trim();
      if (!t) return;
      const owesMe = t.match(/^([a-zA-Z0-9_\s]+)\s+owes\s+me\s+([0-9.]+)(?:\s+for\s+(.+))?/i);
      const oweThem = t.match(/^owe\s+([a-zA-Z0-9_\s]+)\s+([0-9.]+)(?:\s+for\s+(.+))?/i);
      const colon = t.match(/^([a-zA-Z0-9_\s]+)\s*[:\-]\s*([0-9.]+)(?:\s*\((.+)\))?/i);

      if (owesMe) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'them_owes_me',
          person: owesMe[1].trim(),
          amount: parseFloat(owesMe[2]),
          description: owesMe[3] ? owesMe[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (oweThem) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'i_owe_them',
          person: oweThem[1].trim(),
          amount: parseFloat(oweThem[2]),
          description: oweThem[3] ? oweThem[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (colon) {
        parsed.push({
          id: Math.floor(Math.random() * 1000000),
          direction: 'them_owes_me',
          person: colon[1].trim(),
          amount: parseFloat(colon[2]),
          description: colon[3] ? colon[3].trim() : 'Notes Import',
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    if (parsed.length > 0) {
      setDebts(prev => {
        const updated = [...parsed, ...prev];
        localStorage.setItem('sumedh_debts', JSON.stringify(updated));
        syncToServer(updated);
        return updated;
      });
    }
  }, []);

  return { debts, addDebt, removeDebt, importFromNotes };
}
```

- [ ] **Step 2: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/apps/DebtDesk/useDebts.js
git commit -m "Add useDebts hook for Debt Desk ledger redesign"
```

---

### Task 2: `DebtDesk.jsx` + `DebtDesk.css` — ledger UI

**Files:**
- Create: `src/apps/DebtDesk/DebtDesk.jsx`
- Create: `src/apps/DebtDesk/DebtDesk.css`

**Interfaces:**
- Consumes: `useDebts` (Task 1).
- Produces: default export `DebtDesk()`, no props — `App.jsx` (Task 3) renders `<DebtDesk />` for the `debts` window with no props passed.

- [ ] **Step 1: Create `DebtDesk.jsx`**

```jsx
// src/apps/DebtDesk/DebtDesk.jsx
import { useState } from 'react';
import { useDebts } from './useDebts';
import './DebtDesk.css';

function DebtDesk() {
  const { debts, addDebt, removeDebt, importFromNotes } = useDebts();

  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [direction, setDirection] = useState('them_owes_me');
  const [notes, setNotes] = useState('');

  const totalOwedToMe = debts.filter(d => d.direction === 'them_owes_me').reduce((acc, c) => acc + c.amount, 0);
  const totalIOwe = debts.filter(d => d.direction === 'i_owe_them').reduce((acc, c) => acc + c.amount, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    addDebt({ person, amount, description, direction });
    setPerson('');
    setAmount('');
    setDescription('');
  };

  const handleImport = () => {
    importFromNotes(notes);
    setNotes('');
  };

  return (
    <div className="dd-ledger" onClick={(e) => e.stopPropagation()}>
      <div className="dd-header">
        <h2 className="dd-title">Sumedh's Ledger</h2>
        <p className="dd-subtitle">accounts payable &amp; receivable</p>
      </div>

      <div className="dd-balance-line">
        <span className="dd-balance-item">
          <span className="dd-balance-label">owed to me</span>
          <span className="dd-ink dd-ink--black">${totalOwedToMe.toFixed(2)}</span>
        </span>
        <span className="dd-balance-item">
          <span className="dd-balance-label">i owe</span>
          <span className="dd-ink dd-ink--red">${totalIOwe.toFixed(2)}</span>
        </span>
      </div>

      <div className="dd-body">
        <div className="dd-column-write">
          <form onSubmit={handleSubmit} className="dd-entry-form">
            <div className="dd-form-title">new entry</div>
            <label className="dd-line-field">
              <span>person</span>
              <input type="text" value={person} onChange={(e) => setPerson(e.target.value)} required placeholder="name" />
            </label>
            <label className="dd-line-field">
              <span>amount</span>
              <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
            </label>
            <label className="dd-line-field">
              <span>for</span>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="pizza, uber..." />
            </label>
            <div className="dd-direction-toggle">
              <button type="button" className={direction === 'them_owes_me' ? 'dd-dir-btn dd-dir-btn--active' : 'dd-dir-btn'} onClick={() => setDirection('them_owes_me')}>they owe me</button>
              <button type="button" className={direction === 'i_owe_them' ? 'dd-dir-btn dd-dir-btn--active' : 'dd-dir-btn'} onClick={() => setDirection('i_owe_them')}>i owe them</button>
            </div>
            <button type="submit" className="dd-submit-btn">record entry</button>
          </form>

          <div className="dd-notes-box">
            <div className="dd-form-title">quick jot &rarr; parse</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={'John owes me 50 for pizza\nSarah: 20\nowe Mike 15'}
            />
            <button type="button" className="dd-parse-btn" onClick={handleImport}>parse &amp; merge</button>
          </div>
        </div>

        <div className="dd-column-ledger">
          <div className="dd-ledger-head">
            <span>who</span>
            <span>for</span>
            <span>date</span>
            <span className="dd-ledger-head-amount">amount</span>
            <span></span>
          </div>
          <div className="dd-ledger-rows">
            {debts.length === 0 ? (
              <div className="dd-empty">[ no entries in the ledger ]</div>
            ) : (
              debts.map(d => (
                <div key={d.id} className="dd-row">
                  <span className="dd-row-person">
                    {d.person}
                    <span className="dd-row-sub">{d.direction === 'them_owes_me' ? 'owes me' : 'i owe'}</span>
                  </span>
                  <span className="dd-row-desc">{d.description}</span>
                  <span className="dd-row-date">{d.date}</span>
                  <span className={`dd-row-amount dd-ink ${d.direction === 'them_owes_me' ? 'dd-ink--black' : 'dd-ink--red'}`}>
                    ${d.amount.toFixed(2)}
                  </span>
                  <button className="dd-stamp-btn" onClick={() => removeDebt(d.id)}>PAID</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebtDesk;
```

- [ ] **Step 2: Create `DebtDesk.css`**

```css
/* src/apps/DebtDesk/DebtDesk.css */
.dd-ledger {
  height: 100%;
  overflow-y: auto;
  padding: 22px 26px;
  background: repeating-linear-gradient(
    to bottom,
    #efe6d3 0px,
    #efe6d3 27px,
    #d8ccae 28px
  );
  color: #2b2013;
  font-family: var(--serif);
  box-sizing: border-box;
}

.dd-header { border-bottom: 2px solid #2b2013; padding-bottom: 8px; margin-bottom: 14px; }
.dd-title { margin: 0; font-size: 1.4rem; font-weight: 600; letter-spacing: 0.01em; }
.dd-subtitle { margin: 2px 0 0 0; font-family: var(--mono); font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.12em; color: #6b5a3f; }

.dd-balance-line { display: flex; gap: 28px; margin-bottom: 18px; }
.dd-balance-item { display: flex; flex-direction: column; gap: 2px; }
.dd-balance-label { font-family: var(--mono); font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.1em; color: #6b5a3f; }
.dd-ink { font-family: var(--serif); font-size: 1.15rem; font-weight: 700; }
.dd-ink--black { color: #1a1208; }
.dd-ink--red { color: #a3241c; }

.dd-body { display: flex; gap: 24px; }

.dd-column-write { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.dd-form-title { font-family: var(--mono); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: #6b5a3f; margin-bottom: 8px; }

.dd-entry-form { display: flex; flex-direction: column; gap: 10px; }
.dd-line-field { display: flex; flex-direction: column; gap: 2px; font-family: var(--mono); font-size: 0.62rem; color: #6b5a3f; text-transform: uppercase; letter-spacing: 0.06em; }
.dd-line-field input {
  font-family: var(--serif);
  font-size: 0.95rem;
  color: #1a1208;
  background: transparent;
  border: none;
  border-bottom: 1px solid #8a7856;
  padding: 3px 2px;
  outline: none;
}
.dd-line-field input:focus { border-bottom-color: #a3241c; }

.dd-direction-toggle { display: flex; gap: 6px; margin-top: 4px; }
.dd-dir-btn {
  flex: 1;
  background: transparent;
  border: 1px solid #8a7856;
  color: #6b5a3f;
  font-family: var(--mono);
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 5px 4px;
  cursor: pointer;
  border-radius: 2px;
}
.dd-dir-btn--active { background: #2b2013; color: #efe6d3; border-color: #2b2013; }

.dd-submit-btn {
  margin-top: 6px;
  background: #2b2013;
  color: #efe6d3;
  border: none;
  padding: 8px;
  font-family: var(--mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  border-radius: 2px;
}
.dd-submit-btn:hover { background: #3a2c1c; }

.dd-notes-box { display: flex; flex-direction: column; }
.dd-notes-box textarea {
  width: 100%;
  height: 70px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.35);
  border: 1px solid #8a7856;
  color: #2b2013;
  font-family: var(--mono);
  font-size: 0.6rem;
  padding: 6px;
  resize: none;
  outline: none;
}
.dd-parse-btn {
  margin-top: 6px;
  background: transparent;
  border: 1px solid #a3241c;
  color: #a3241c;
  padding: 6px;
  font-family: var(--mono);
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  cursor: pointer;
  border-radius: 2px;
}
.dd-parse-btn:hover { background: rgba(163, 36, 28, 0.08); }

.dd-column-ledger { flex: 1; min-width: 0; border-left: 1px solid #8a7856; padding-left: 20px; }

.dd-ledger-head {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 0.9fr 0.9fr 44px;
  gap: 10px;
  font-family: var(--mono);
  font-size: 0.56rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b5a3f;
  border-bottom: 2px solid #2b2013;
  padding-bottom: 6px;
  margin-bottom: 4px;
}
.dd-ledger-head-amount { text-align: right; }

.dd-empty { text-align: center; color: #6b5a3f; font-family: var(--mono); font-size: 0.65rem; margin-top: 40px; }

.dd-row {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 0.9fr 0.9fr 44px;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #c9bb98;
  font-size: 0.8rem;
}
.dd-row-person { display: flex; flex-direction: column; font-weight: 600; }
.dd-row-sub { font-family: var(--mono); font-size: 0.52rem; text-transform: uppercase; letter-spacing: 0.04em; color: #6b5a3f; font-weight: 400; }
.dd-row-desc { color: #4a3d29; font-size: 0.75rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-row-date { font-family: var(--mono); font-size: 0.62rem; color: #6b5a3f; }
.dd-row-amount { text-align: right; font-weight: 700; }

.dd-stamp-btn {
  justify-self: end;
  background: transparent;
  border: 2px solid #a3241c;
  color: #a3241c;
  font-family: var(--mono);
  font-weight: bold;
  font-size: 0.5rem;
  letter-spacing: 0.05em;
  padding: 3px 6px;
  border-radius: 3px;
  transform: rotate(-6deg);
  cursor: pointer;
  opacity: 0.75;
  transition: opacity 150ms ease, transform 150ms ease;
}
.dd-stamp-btn:hover { opacity: 1; transform: rotate(-6deg) scale(1.08); }

@media (max-width: 640px) {
  .dd-body { flex-direction: column; }
  .dd-column-write { width: 100%; }
  .dd-column-ledger { border-left: none; padding-left: 0; border-top: 1px solid #8a7856; padding-top: 14px; }
  .dd-ledger-head, .dd-row { grid-template-columns: 1fr 1fr 44px; }
  .dd-ledger-head span:nth-child(2), .dd-row-date { display: none; }
}
```

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/apps/DebtDesk/DebtDesk.jsx src/apps/DebtDesk/DebtDesk.css
git commit -m "Add DebtDesk ledger component"
```

---

### Task 3: Integrate into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import**

Add near the top of `src/App.jsx`, alongside the existing `MediaCabinet`/`fetchMediaDatabase` imports:

```js
import DebtDesk from './apps/DebtDesk/DebtDesk.jsx';
```

- [ ] **Step 2: Remove the debts-polling portion of the "Load database" effect**

In the existing effect (the one with the anime/manga localStorage sanitization and console diagnostic dump), remove just this portion:

```js
    // Poll debts database every 3 seconds for cross-device real-time sync
    const fetchDebts = () => {
      fetch(`${import.meta.env.BASE_URL}assets/data/debts.json?t=${Date.now()}`)
        .then(res => res.json())
        .then(data => {
          setDebts(data);
        })
        .catch(err => console.log("Polling debts error:", err));
    };

    fetchDebts();
    const debtsInterval = setInterval(fetchDebts, 3000);

```

and change:

```js
    return () => {
      clearInterval(debtsInterval);
    };
  }, []);
```

to:

```js
  }, []);
```

(The `console.log("=== LOCALSTORAGE SYSTEM DIAGNOSTIC DUMP ===")` block and the anime/manga sanitization loop above this both stay untouched.)

- [ ] **Step 3: Remove debts state and handlers**

Delete:

```js
  const [debts, setDebts] = useState(() => {
    try {
      const stored = localStorage.getItem('sumedh_debts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newDebtPerson, setNewDebtPerson] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtDesc, setNewDebtDesc] = useState('');
  const [newDebtDirection, setNewDebtDirection] = useState('them_owes_me');
  const [rawNotesInput, setRawNotesInput] = useState('');

  const handleAddDebt = (e) => {
    ...
  };

  const handleRemoveDebt = (id) => {
    ...
  };

  const handleImportNotes = () => {
    ...
  };
```

(Full original content already read from the file during planning — delete from `const [debts, setDebts] = useState(...)` through the closing `};` of `handleImportNotes`.)

- [ ] **Step 4: Replace the Debt Desk JSX block**

Find the block starting with:

```jsx
            {win.id === 'debts' && (
              <div className="debt-list-dialog mono" onClick={(e) => e.stopPropagation()} style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
```

and ending with the matching:

```jsx
                </div>
              </div>
            )}
```

(immediately before `{win.id === 'run' && (`). Replace the entire block with:

```jsx
            {win.id === 'debts' && <DebtDesk />}
```

- [ ] **Step 5: Verify the build**

Run: `npx vite build`
Expected: build succeeds. If it fails, search `src/App.jsx` for leftover references to `debts`, `newDebtPerson`, `newDebtAmount`, `newDebtDesc`, `newDebtDirection`, `rawNotesInput`, `handleAddDebt`, `handleRemoveDebt`, `handleImportNotes` — every one outside `useDebts.js`/`DebtDesk.jsx` should be gone.

- [ ] **Step 6: Manual verification**

Run `npm run dev`, open Debt Desk:
- Ledger page renders with ruled-paper background, balance line, entry form, notes box, and ledger rows.
- Add an entry in each direction — confirm it appears with correct ink color (black for they-owe-me, red for i-owe-them) and totals update.
- Click "PAID" on an entry — confirm it's removed.
- Paste sample text into the notes box and click parse — confirm entries are added correctly.
- Confirm no console errors.
- `git status` on `public/assets/data/debts.json` afterward — if the local dev sync endpoint wrote test data to disk, `git restore` it before committing anything else.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx
git commit -m "Wire DebtDesk ledger into App.jsx, remove old inline implementation"
```
