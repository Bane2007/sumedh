# About Me Dossier Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract About Me out of `App.jsx` into `src/apps/AboutMe/` and restyle it as a HAL9000 personnel dossier, with identical copy.

**Architecture:** Single static presentational component, no hook (no state exists in the current implementation).

**Tech Stack:** React 19, plain CSS, Vite.

## Global Constraints

- No test framework exists. Verification is `vite build` + manual check.
- Bio text and all positions/competitions entries must be copied verbatim — this is a visual restyle only.
- Reuse `src/index.css` `:root` variables (`--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--oxblood`, `--hairline`, `--serif`, `--mono`).

---

### Task 1: `AboutMe.jsx` + `AboutMe.css`

**Files:**
- Create: `src/apps/AboutMe/AboutMe.jsx`
- Create: `src/apps/AboutMe/AboutMe.css`

- [ ] **Step 1: Create `AboutMe.jsx`**

```jsx
// src/apps/AboutMe/AboutMe.jsx
import './AboutMe.css';

const POSITIONS = [
  { year: '2025', entry: 'Marketing & Creatives Head, IITDAD Coding Club' },
  { year: '2025', entry: 'Core Member, Digital Arts & Design Club' },
  { year: '2025', entry: 'Millennium Fellow, UN Academic Impact & MCN' }
];

const COMPETITIONS = [
  { year: '2025', entry: 'Best Audio, Best Storytelling, Audience Choice · University Film Festival' },
  { year: '2026', entry: '2nd Place, Hyperloop · TRYST' },
  { year: '2026', entry: '2nd Place, Titan · TRYST' },
  { year: '2026', entry: '3rd Place, Casecation · TRYST' }
];

function AboutMe() {
  return (
    <div className="am-dossier">
      <div className="am-classification">
        <span className="am-classification-title">[ PERSONNEL FILE ]</span>
        <span className="am-classification-status">STATUS: ACTIVE &middot; CLEARANCE: CREW</span>
      </div>

      <h2 className="am-name">Sumedh Jamsandekar</h2>

      <div className="am-summary">
        <div className="am-summary-label">case summary</div>
        <p className="am-summary-body">
          I&rsquo;m a second-year Energy Engineering student at IIT Delhi Abu Dhabi. Most of my spare time goes to writing. When I&rsquo;m not at a script, I&rsquo;ve got a movie on, a show running, or a game I&rsquo;m halfway through. I read in between.
        </p>
      </div>

      <div className="am-records">
        <div className="am-record-column">
          <h3 className="am-record-title">service record — positions</h3>
          <table className="am-record-table">
            <tbody>
              {POSITIONS.map((p, i) => (
                <tr key={i}>
                  <td className="am-record-year">{p.year}</td>
                  <td className="am-record-entry">{p.entry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="am-record-column">
          <h3 className="am-record-title">service record — competitions</h3>
          <table className="am-record-table">
            <tbody>
              {COMPETITIONS.map((c, i) => (
                <tr key={i}>
                  <td className="am-record-year">{c.year}</td>
                  <td className="am-record-entry">{c.entry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AboutMe;
```

- [ ] **Step 2: Create `AboutMe.css`**

```css
/* src/apps/AboutMe/AboutMe.css */
.am-dossier { height: 100%; overflow-y: auto; padding: 1.25rem 1.5rem; box-sizing: border-box; }

.am-classification {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 2px solid var(--oxblood);
  padding-bottom: 8px;
  margin-bottom: 14px;
  font-family: var(--mono);
}
.am-classification-title { color: var(--oxblood); font-size: 0.75rem; font-weight: bold; letter-spacing: 0.08em; }
.am-classification-status { color: var(--ink-soft); font-size: 0.6rem; letter-spacing: 0.06em; }

.am-name { font-family: var(--serif); font-size: 1.5rem; margin: 0 0 14px 0; color: var(--ink); }

.am-summary {
  border: 1px solid var(--hairline);
  border-radius: 4px;
  padding: 14px 16px;
  margin-bottom: 22px;
  background: rgba(0, 0, 0, 0.15);
}
.am-summary-label { font-family: var(--mono); font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-soft); margin-bottom: 8px; }
.am-summary-body { margin: 0; font-size: 1.05rem; line-height: 1.6; color: var(--ink); }

.am-records { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.am-record-title { font-family: var(--mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--oxblood-soft); margin: 0 0 8px 0; font-weight: normal; }
.am-record-table { width: 100%; border-collapse: collapse; }
.am-record-table tr { border-bottom: 1px solid var(--hairline); }
.am-record-table td { padding: 6px 0; vertical-align: top; }
.am-record-year { font-family: var(--mono); font-size: 0.7rem; color: var(--ink-soft); width: 44px; white-space: nowrap; }
.am-record-entry { font-size: 0.82rem; color: var(--ink); line-height: 1.4; padding-left: 10px; }

@media (max-width: 640px) {
  .am-records { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/apps/AboutMe/AboutMe.jsx src/apps/AboutMe/AboutMe.css
git commit -m "Add AboutMe personnel dossier component"
```

---

### Task 2: Wire into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import**

```js
import AboutMe from './apps/AboutMe/AboutMe.jsx';
```

- [ ] **Step 2: Replace the JSX block**

Find and delete the entire `{win.id === 'about' && ( ... )}` block, replacing with:

```jsx
            {win.id === 'about' && <AboutMe />}
```

- [ ] **Step 3: Verify the build and manually check**

Run: `npx vite build`, then `npm run dev` and open About Me — confirm bio and both service-record tables render, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Wire AboutMe dossier into App.jsx"
```
