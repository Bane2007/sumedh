# Contact Rolodex Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract Contact out of `App.jsx` into `src/apps/Contact/` and restyle as a rolodex index card, same 5 links unchanged.

**Architecture:** Single static presentational component, no hook.

**Tech Stack:** React 19, plain CSS, Vite.

## Global Constraints

- No test framework. Verification is `vite build` + manual check.
- All 5 links/hrefs/targets ported verbatim.
- Reuse `src/index.css` `:root` variables.

---

### Task 1: `Contact.jsx` + `Contact.css`

**Files:**
- Create: `src/apps/Contact/Contact.jsx`
- Create: `src/apps/Contact/Contact.css`

- [ ] **Step 1: Create `Contact.jsx`**

```jsx
// src/apps/Contact/Contact.jsx
import './Contact.css';

const LINKS = [
  { label: 'imdb', href: 'https://www.imdb.com/name/nm18199394/' },
  { label: 'github', href: 'https://github.com/Bane2007' },
  { label: 'letterboxd', href: 'https://letterboxd.com/Bane_snj/' },
  { label: 'storygraph', href: 'https://app.thestorygraph.com/profile/sumed_nj' },
  { label: 'instagram', href: 'https://www.instagram.com/sumed_nj/' }
];

function Contact() {
  return (
    <div className="ct-wrap">
      <div className="ct-card">
        <div className="ct-card-notch" />
        <h2 className="ct-card-name">Sumedh Jamsandekar</h2>
        <div className="ct-card-divider" />
        <div className="ct-card-fields">
          {LINKS.map(l => (
            <a key={l.label} className="ct-field-row" href={l.href} target="_blank" rel="noopener">
              <span className="ct-field-label">{l.label}</span>
              <span className="ct-field-arrow">&rarr;</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Contact;
```

- [ ] **Step 2: Create `Contact.css`**

```css
/* src/apps/Contact/Contact.css */
.ct-wrap { height: 100%; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }

.ct-card {
  position: relative;
  width: 280px;
  background: #efe6d3;
  color: #2b2013;
  border-radius: 6px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
  padding: 28px 22px 20px 22px;
}

.ct-card-notch {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: #efe6d3;
  border-radius: 0 0 30px 30px;
  box-shadow: inset 0 -3px 6px rgba(0, 0, 0, 0.15);
}

.ct-card-name { font-family: var(--serif); font-size: 1.15rem; margin: 0; text-align: center; }
.ct-card-divider { height: 2px; background: #2b2013; margin: 12px 0 14px 0; opacity: 0.15; }

.ct-card-fields { display: flex; flex-direction: column; gap: 4px; }
.ct-field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 4px;
  border-bottom: 1px dashed rgba(43, 32, 19, 0.25);
  text-decoration: none;
  color: #2b2013;
  font-family: var(--mono);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  transition: color 150ms ease, padding-left 150ms ease;
}
.ct-field-row:last-child { border-bottom: none; }
.ct-field-row:hover { color: var(--oxblood); padding-left: 8px; }
.ct-field-arrow { opacity: 0.5; }
.ct-field-row:hover .ct-field-arrow { opacity: 1; }
```

- [ ] **Step 3: Verify the build**

Run: `npx vite build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/apps/Contact/Contact.jsx src/apps/Contact/Contact.css
git commit -m "Add Contact rolodex-card component"
```

---

### Task 2: Wire into `App.jsx`

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add the import**

```js
import Contact from './apps/Contact/Contact.jsx';
```

- [ ] **Step 2: Replace the JSX block**

Delete the `{win.id === 'contact' && ( ... )}` block, replace with:

```jsx
            {win.id === 'contact' && <Contact />}
```

- [ ] **Step 3: Verify the build and manually check**

`npx vite build`, then `npm run dev`, open Contact, confirm all 5 links present and open correctly, no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "Wire Contact rolodex card into App.jsx"
```
