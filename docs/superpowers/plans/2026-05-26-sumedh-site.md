# Sumedh Jamsandekar Personal Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a single-page personal site for Sumedh Jamsandekar at `https://bane2007.github.io/sumedh/`, with Sadako (2025) as the centerpiece, by end of session.

**Architecture:** Hand-crafted static HTML/CSS/JS — no build step, no Node. Six scrollable sections (hero · about · Sadako · roles · contact · colophon). Self-hosted fonts. Optimized poster image. Deploy via GitHub Pages.

**Tech Stack:** HTML5 + modern CSS (custom properties, grid) + vanilla JS (IntersectionObserver). Python for poster optimization (PIL). PowerShell for font fetch. git + gh CLI for deploy.

**Spec:** `docs/superpowers/specs/2026-05-26-sadako-microsite-design.md`

**Note on testing:** This is a static visual artifact with no unit-test-shaped behavior. Each task ends with a **visual verification** step (start local server, open browser, confirm the section renders) instead of automated tests. Don't claim a task done without opening the page.

---

## Task 1: Scaffold project structure

**Files:**
- Create: `C:\Users\sumed\sadako-site\.nojekyll`
- Create: `C:\Users\sumed\sadako-site\.gitignore`
- Create: `C:\Users\sumed\sadako-site\assets\css\` (directory)
- Create: `C:\Users\sumed\sadako-site\assets\js\` (directory)
- Create: `C:\Users\sumed\sadako-site\assets\fonts\` (directory)
- Create: `C:\Users\sumed\sadako-site\assets\img\` (directory)
- Create: `C:\Users\sumed\sadako-site\assets\svg\` (directory)

- [ ] **Step 1: Create asset directories**

```powershell
$root = 'C:\Users\sumed\sadako-site'
@('assets\css','assets\js','assets\fonts','assets\img','assets\svg') |
  ForEach-Object { New-Item -ItemType Directory -Force -Path "$root\$_" | Out-Null }
Get-ChildItem $root\assets | Format-Table Name,Mode
```

Expected: lists css, fonts, img, js, svg directories.

- [ ] **Step 2: Create `.nojekyll` (so GitHub Pages serves assets verbatim) and `.gitignore`**

`.nojekyll` is an empty file. `.gitignore` contents:

```
# OS junk
Thumbs.db
.DS_Store
desktop.ini

# Editor
.vscode/
.idea/

# Local server pidfile
.local-server-pid
```

- [ ] **Step 3: Verify and commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git status --short
git add .nojekyll .gitignore
git commit -m "chore: scaffold project directories and ignore files"
```

Expected: commit succeeds. `git status` shows clean working tree apart from the asset dirs being empty (Git ignores empty dirs — that's fine, files arriving in later tasks will track them).

---

## Task 2: Optimize the Sadako poster

**Files:**
- Source: `C:\Users\sumed\Downloads\sadako.png` (6 MB)
- Create: `C:\Users\sumed\sadako-site\assets\img\poster.jpg` (target < 400 KB)
- Create: `C:\Users\sumed\sadako-site\assets\img\poster-full.png` (verbatim copy of the source for direct-download link)

- [ ] **Step 1: Verify Python + Pillow available**

```powershell
python -c "import PIL; print(PIL.__version__)"
```

Expected: prints a version number. If `ModuleNotFoundError`, run `python -m pip install Pillow` and retry.

- [ ] **Step 2: Copy full-res poster (for direct-download link)**

```powershell
Copy-Item 'C:\Users\sumed\Downloads\sadako.png' 'C:\Users\sumed\sadako-site\assets\img\poster-full.png'
```

- [ ] **Step 3: Generate optimized JPEG**

Write `C:\Users\sumed\sadako-site\optimize_poster.py` (one-shot script, will be deleted after):

```python
from PIL import Image
from pathlib import Path

src = Path(r'C:\Users\sumed\Downloads\sadako.png')
dst = Path(r'C:\Users\sumed\sadako-site\assets\img\poster.jpg')

img = Image.open(src).convert('RGB')

# Constrain longest edge to 1400 px (the poster is portrait; this gives ~1000x1400-ish)
max_edge = 1400
w, h = img.size
scale = min(1.0, max_edge / max(w, h))
new_size = (int(w * scale), int(h * scale))
img = img.resize(new_size, Image.LANCZOS)

img.save(dst, 'JPEG', quality=82, optimize=True, progressive=True)

print(f'wrote {dst} — {dst.stat().st_size // 1024} KB, {new_size[0]}x{new_size[1]}')
```

Run:

```powershell
python C:\Users\sumed\sadako-site\optimize_poster.py
```

Expected: prints file path with KB size and new dimensions. Target < 400 KB. If quality 82 overshoots, drop to 78 and re-run.

- [ ] **Step 4: Delete the one-shot script and commit**

```powershell
Remove-Item C:\Users\sumed\sadako-site\optimize_poster.py
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/img/poster.jpg assets/img/poster-full.png
git commit -m "feat: add Sadako poster (optimized + full-res)"
```

Expected: both files committed.

---

## Task 3: Self-host fonts (EB Garamond + JetBrains Mono)

**Files:**
- Create: `C:\Users\sumed\sadako-site\assets\fonts\eb-garamond-regular.woff2`
- Create: `C:\Users\sumed\sadako-site\assets\fonts\eb-garamond-medium.woff2`
- Create: `C:\Users\sumed\sadako-site\assets\fonts\jetbrains-mono-regular.woff2`

- [ ] **Step 1: Fetch the woff2 files from jsDelivr's Fontsource mirror**

Fontsource is a CDN-friendly mirror of Google Fonts that exposes raw woff2 by URL.

```powershell
$fonts = @{
  'eb-garamond-regular.woff2'      = 'https://cdn.jsdelivr.net/fontsource/fonts/eb-garamond@latest/latin-400-normal.woff2'
  'eb-garamond-medium.woff2'       = 'https://cdn.jsdelivr.net/fontsource/fonts/eb-garamond@latest/latin-500-normal.woff2'
  'jetbrains-mono-regular.woff2'   = 'https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-400-normal.woff2'
}
$dst = 'C:\Users\sumed\sadako-site\assets\fonts'
foreach ($f in $fonts.GetEnumerator()) {
  Invoke-WebRequest -Uri $f.Value -OutFile "$dst\$($f.Key)" -UseBasicParsing
  $size = (Get-Item "$dst\$($f.Key)").Length
  Write-Output "$($f.Key): $size bytes"
}
```

Expected: three lines, each font ~20-60 KB. If any URL 404s, log the failure and substitute by visiting `https://fontsource.org/fonts/eb-garamond` (or jetbrains-mono) and copying the current latin-400-normal woff2 URL.

- [ ] **Step 2: Commit fonts**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/fonts/eb-garamond-regular.woff2 assets/fonts/eb-garamond-medium.woff2 assets/fonts/jetbrains-mono-regular.woff2
git commit -m "feat: self-host EB Garamond and JetBrains Mono (woff2)"
```

---

## Task 4: Hand-code the line-art origami crane SVG

**Files:**
- Create: `C:\Users\sumed\sadako-site\assets\svg\crane.svg`

The crane appears twice (between Sadako and Roles sections, and as the closing flourish before the colophon). One file, reused via `<img src="assets/svg/crane.svg">`.

- [ ] **Step 1: Write crane.svg**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- body -->
  <path d="M40 78 L100 50 L160 78 L100 96 Z"/>
  <!-- centre fold -->
  <path d="M100 50 L100 96"/>
  <!-- left wing -->
  <path d="M40 78 L70 30 L100 50"/>
  <!-- right wing -->
  <path d="M160 78 L130 30 L100 50"/>
  <!-- tail -->
  <path d="M160 78 L184 90 L172 102"/>
  <!-- head + beak -->
  <path d="M40 78 L24 70 L20 76 L30 84"/>
  <!-- inner crease left -->
  <path d="M70 30 L100 64 L130 30" opacity="0.55"/>
</svg>
```

The `currentColor` stroke means the crane inherits the surrounding text color (oxblood when placed in an accented context, ink when placed neutrally).

- [ ] **Step 2: Verify the SVG renders**

```powershell
Start-Process 'C:\Users\sumed\sadako-site\assets\svg\crane.svg'
```

Expected: opens in default browser/viewer. Should show a stylized crane silhouette. If it looks distorted, retry the path coordinates (geometry is decorative; tweak freely).

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/svg/crane.svg
git commit -m "feat: hand-coded line-art origami crane SVG"
```

---

## Task 5: Write the HTML skeleton with all six sections

**Files:**
- Create: `C:\Users\sumed\sadako-site\index.html`

This task writes the full semantic structure. Content goes in; CSS comes in the next task. The page will render unstyled (browser default) but legible.

- [ ] **Step 1: Write index.html**

Full file at `C:\Users\sumed\sadako-site\index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sumedh Jamsandekar — writer · director · engineer</title>
  <meta name="description" content="Writer and director of Sadako (2025). Energy Engineering student at IIT Delhi Abu Dhabi.">
  <meta property="og:title" content="Sumedh Jamsandekar">
  <meta property="og:description" content="Writer and director of Sadako (2025). Energy Engineering at IIT Delhi Abu Dhabi.">
  <meta property="og:image" content="assets/img/poster.jpg">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="preload" href="assets/fonts/eb-garamond-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="assets/fonts/jetbrains-mono-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <main id="main">

    <!-- I. HERO -->
    <section class="hero" aria-labelledby="hero-name">
      <h1 id="hero-name" class="hero__name"><span class="type-target" data-final="SUMEDH JAMSANDEKAR">SUMEDH JAMSANDEKAR</span></h1>
      <p class="hero__tagline">writer &middot; director &middot; engineer</p>
      <a class="hero__chevron" href="#about" aria-label="Scroll to about section">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9 L12 16 L18 9"/></svg>
      </a>
    </section>

    <!-- II. ABOUT -->
    <section class="about" id="about" aria-labelledby="about-h">
      <h2 id="about-h" class="section-eyebrow">about</h2>
      <p class="about__body">
        Second-year Energy Engineering at IIT Delhi Abu Dhabi. I write and co-direct short films &mdash; <em>Sadako</em> (2025) is the first. I work in English, Hindi, Marathi, and a little Arabic. I&rsquo;m usually somewhere between a screenplay and a thermodynamics problem set.
      </p>
    </section>

    <!-- III. SADAKO (CENTREPIECE) -->
    <section class="sadako" id="sadako" aria-labelledby="sadako-h">
      <h2 id="sadako-h" class="section-eyebrow">the film</h2>
      <div class="sadako__grid">
        <figure class="sadako__poster">
          <a href="assets/img/poster-full.png" aria-label="View full-resolution Sadako poster">
            <img src="assets/img/poster.jpg" alt="Sadako poster — crumpled kraft paper with line-art origami cranes in the corners and a white hand-drawn marker title reading SADAKO, with credits 'a film by Sumedh Jamsandekar · Evan Tobias · Joel Jobi' printed below" width="1000" height="1400">
          </a>
        </figure>

        <div class="sadako__info">
          <p class="sadako__title"><span class="smallcaps">Sadako</span> <span class="sadako__year">(2025)</span></p>
          <blockquote class="sadako__logline">
            A young girl who loves origami sits down with a single sheet of paper and begins to fold. With every careful crease, a quiet stop-motion story takes shape &mdash; about perseverance, hope, and wishes made on paper.
          </blockquote>
          <p class="sadako__credit"><span class="mono">a film by</span> Sumedh Jamsandekar &middot; Evan Tobias &middot; Joel Jobi</p>

          <p class="sadako__awards mono">
            <span>Best Audio</span> &middot; <span>Best Storytelling</span> &middot; <span>Audience Choice</span><br>
            <span class="dim">University Film Festival 2025</span>
          </p>

          <div class="sadako__buttons">
            <a class="btn btn--filled" href="https://www.youtube.com/watch?v=bSUdWw-3dmE" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              Watch on YouTube
            </a>
            <a class="btn btn--ghost" href="https://www.imdb.com/title/tt39732610/" target="_blank" rel="noopener">View on IMDb</a>
          </div>

          <dl class="sadako__specs mono">
            <div><dt>Runtime</dt><dd>5 min</dd></div>
            <div><dt>Format</dt><dd>Stop-motion / Animation</dd></div>
            <div><dt>Country</dt><dd>United Arab Emirates</dd></div>
            <div><dt>Language</dt><dd>English</dd></div>
            <div><dt>Released</dt><dd>30 Oct 2025</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <div class="crane-divider" aria-hidden="true">
      <img src="assets/svg/crane.svg" alt="">
    </div>

    <!-- IV. ROLES & RECOGNITION -->
    <section class="roles" id="roles" aria-labelledby="roles-h">
      <h2 id="roles-h" class="section-eyebrow">roles &amp; recognition</h2>

      <div class="roles__grid">
        <div>
          <h3 class="roles__subhead">positions</h3>
          <ul class="roles__list">
            <li><span class="mono">2025 &mdash;</span> Marketing &amp; Creatives Head, IITDA Coding Club</li>
            <li><span class="mono">2025 &mdash;</span> Core Member, Digital Arts &amp; Design Club</li>
            <li><span class="mono">2025 &mdash;</span> Millennium Fellow, UN Academic Impact &amp; MCN</li>
          </ul>
        </div>

        <div>
          <h3 class="roles__subhead">competitions</h3>
          <ul class="roles__list">
            <li><span class="mono">2025 &mdash;</span> Best Audio, Best Storytelling, Audience Choice &mdash; University Film Festival (<em>Sadako</em>)</li>
            <li><span class="mono">2026 &mdash;</span> 2nd Place, Hyperloop &mdash; TRYST</li>
            <li><span class="mono">2026 &mdash;</span> 2nd Place, Titan &mdash; TRYST</li>
            <li><span class="mono">2026 &mdash;</span> 3rd Place, Casecation &mdash; TRYST</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- V. CONTACT -->
    <section class="contact" id="contact" aria-labelledby="contact-h">
      <h2 id="contact-h" class="section-eyebrow">contact</h2>
      <ul class="contact__list">
        <li><a href="https://www.imdb.com/title/tt39732610/" target="_blank" rel="noopener">IMDb</a></li>
        <li><a href="https://github.com/Bane2007" target="_blank" rel="noopener">GitHub</a></li>
        <!-- Optional socials inserted here once handles confirmed:
             <li><a href="https://www.linkedin.com/in/USERNAME/" target="_blank" rel="noopener">LinkedIn</a></li>
             <li><a href="https://letterboxd.com/USERNAME/" target="_blank" rel="noopener">Letterboxd</a></li>
             <li><a href="https://instagram.com/USERNAME" target="_blank" rel="noopener">Instagram</a></li>
        -->
      </ul>
    </section>

    <div class="crane-divider crane-divider--end" aria-hidden="true">
      <img src="assets/svg/crane.svg" alt="">
    </div>

    <!-- VI. COLOPHON -->
    <footer class="colophon">
      <p class="mono">Set in EB Garamond and JetBrains Mono. Built 26 May 2026, Abu Dhabi.</p>
      <p class="colophon__fin">Fin.</p>
    </footer>

  </main>

  <script src="assets/js/main.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Start a local server and verify the structure renders**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location C:\Users\sumed\sadako-site; python -m http.server 8000'
Start-Sleep -Seconds 2
Start-Process 'http://localhost:8000/'
```

Expected: browser opens, page shows unstyled but legible content. You should see (in default browser styles): the name, tagline, about paragraph, the poster image, logline, awards line, two buttons, the specs list, the crane SVG twice, the roles, contact links, and the colophon. Anything missing = HTML bug; fix before moving on.

- [ ] **Step 3: Commit the skeleton**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add index.html
git commit -m "feat: write semantic HTML skeleton for all six sections"
```

---

## Task 6: Write the base CSS layer (palette, type, baseline)

**Files:**
- Create: `C:\Users\sumed\sadako-site\assets\css\style.css`

This task delivers the typographic + chromatic foundation. The page will look like a tasteful book at this point — no layout flourishes yet.

- [ ] **Step 1: Write the base CSS**

Full file at `C:\Users\sumed\sadako-site\assets\css\style.css`:

```css
/* === FONT FACES === */
@font-face {
  font-family: 'EB Garamond';
  src: url('../fonts/eb-garamond-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'EB Garamond';
  src: url('../fonts/eb-garamond-medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'JetBrains Mono';
  src: url('../fonts/jetbrains-mono-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

/* === DESIGN TOKENS === */
:root {
  --paper:        #f3ede2;
  --paper-deep:   #ebe3d3;
  --ink:          #1a1410;
  --ink-soft:     #4a3f33;
  --oxblood:      #7a1f1f;
  --oxblood-soft: #a44545;
  --shadow:       #d8cfbf;
  --hairline:     rgba(26, 20, 16, 0.18);

  --serif: 'EB Garamond', 'Iowan Old Style', 'Palatino Linotype', Georgia, serif;
  --mono:  'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  --measure: 38rem;
  --gutter: clamp(1.25rem, 3vw, 2.25rem);
}

/* === RESET === */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body { margin: 0; }
img { display: block; max-width: 100%; height: auto; }
a { color: inherit; text-decoration: none; }
button { font: inherit; }
blockquote, figure, dl, dd { margin: 0; }
ul { padding: 0; list-style: none; margin: 0; }

/* === GLOBAL TYPOGRAPHY === */
body {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(1.05rem, 0.7vw + 0.95rem, 1.2rem);
  line-height: 1.55;
  color: var(--ink);
  background: var(--paper);
  background-image:
    radial-gradient(rgba(0,0,0,0.018) 1px, transparent 1.2px),
    radial-gradient(rgba(0,0,0,0.014) 1px, transparent 1.2px);
  background-size: 3px 3px, 7px 7px;
  background-position: 0 0, 1px 1px;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'kern' 1, 'liga' 1, 'onum' 1;
}

h1, h2, h3 { font-weight: 500; line-height: 1.15; margin: 0; letter-spacing: 0.005em; }

.mono { font-family: var(--mono); font-size: 0.78em; letter-spacing: 0.04em; }
.smallcaps { font-variant-caps: all-small-caps; letter-spacing: 0.08em; }
.dim { color: var(--ink-soft); }

a:focus-visible {
  outline: 2px solid var(--oxblood);
  outline-offset: 3px;
  border-radius: 2px;
}

.skip-link {
  position: absolute; left: -9999px; top: auto;
  background: var(--ink); color: var(--paper);
  padding: 0.5rem 0.75rem; font-family: var(--mono); font-size: 0.85rem;
}
.skip-link:focus { left: 1rem; top: 1rem; z-index: 1000; }

/* Section eyebrows — small mono labels above each section */
.section-eyebrow {
  font-family: var(--mono);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--oxblood);
  margin: 0 0 1.5rem 0;
}
.section-eyebrow::before { content: "— "; opacity: 0.65; }
```

- [ ] **Step 2: Verify**

Refresh `http://localhost:8000/`. The page should now render in EB Garamond on cream paper, with a subtle stippled texture, an oxblood eyebrow above each section, and tighter line-spacing. Buttons and links are not styled yet — they look like default blue underlines. That's fine for this task.

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/css/style.css
git commit -m "feat: base CSS — palette, typography, paper background"
```

---

## Task 7: Style the Hero section

**Files:**
- Modify: `C:\Users\sumed\sadako-site\assets\css\style.css` (append)

- [ ] **Step 1: Append hero styles**

Append to `assets/css/style.css`:

```css
/* === I. HERO === */
.hero {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  place-items: center;
  text-align: center;
  padding: 4rem var(--gutter);
}
.hero__name {
  font-family: var(--serif);
  font-weight: 500;
  font-size: clamp(2.4rem, 6vw, 4.6rem);
  letter-spacing: 0.06em;
  font-variant-caps: all-small-caps;
}
.hero__tagline {
  margin: 1.25rem 0 0 0;
  font-family: var(--mono);
  font-size: clamp(0.78rem, 1.1vw, 0.95rem);
  letter-spacing: 0.32em;
  text-transform: lowercase;
  color: var(--ink-soft);
}
.hero__chevron {
  margin-top: 4rem;
  display: inline-grid;
  place-items: center;
  width: 44px; height: 44px;
  color: var(--ink-soft);
  border: 1px solid var(--hairline);
  border-radius: 50%;
  animation: chevron-pulse 2.2s ease-in-out infinite;
}
@keyframes chevron-pulse {
  0%, 100% { transform: translateY(0); opacity: 0.7; }
  50%      { transform: translateY(4px); opacity: 1; }
}
```

- [ ] **Step 2: Refresh + verify**

Refresh browser. Hero should now fill viewport, name centered in small-caps, tagline in mono below, chevron pulsing softly at the bottom. Confirm it's centered both axes.

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/css/style.css
git commit -m "feat: style Hero — centered name, mono tagline, pulsing chevron"
```

---

## Task 8: Style About + section-spacing rhythm

**Files:**
- Modify: `C:\Users\sumed\sadako-site\assets\css\style.css` (append)

- [ ] **Step 1: Append**

```css
/* === GENERIC SECTION SPACING === */
section, .colophon {
  padding: clamp(4rem, 8vw, 7rem) var(--gutter);
  max-width: 70rem;
  margin: 0 auto;
}

/* === II. ABOUT === */
.about {
  max-width: 48rem;
}
.about__body {
  font-size: clamp(1.15rem, 0.6vw + 1.05rem, 1.4rem);
  line-height: 1.62;
  color: var(--ink);
}
.about__body em { color: var(--oxblood); font-style: italic; }
```

- [ ] **Step 2: Verify**

Refresh. About paragraph should appear in larger serif, "Sadako" italicized in oxblood. Comfortable measure.

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/css/style.css
git commit -m "feat: style About + section spacing rhythm"
```

---

## Task 9: Style the Sadako centerpiece

**Files:**
- Modify: `C:\Users\sumed\sadako-site\assets\css\style.css` (append)

This is the biggest CSS chunk. Includes the two-column grid (poster left, info right), title, logline, awards band, buttons, specs.

- [ ] **Step 1: Append**

```css
/* === III. SADAKO === */
.sadako__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  gap: clamp(2rem, 4vw, 3.5rem);
  align-items: start;
}
@media (max-width: 760px) {
  .sadako__grid { grid-template-columns: 1fr; }
}

.sadako__poster img {
  width: 100%;
  border-radius: 2px;
  box-shadow: 0 24px 60px -28px rgba(26, 20, 16, 0.5),
              0 8px 18px -10px rgba(26, 20, 16, 0.25);
  transition: transform 400ms ease-out, box-shadow 400ms ease-out;
}
.sadako__poster a:hover img {
  transform: translateY(-3px);
  box-shadow: 0 32px 70px -28px rgba(26, 20, 16, 0.55),
              0 12px 22px -10px rgba(26, 20, 16, 0.3);
}

.sadako__title {
  font-family: var(--serif);
  font-size: clamp(1.6rem, 2.4vw, 2.2rem);
  font-weight: 500;
  margin: 0 0 0.85rem 0;
  letter-spacing: 0.02em;
}
.sadako__title .smallcaps { letter-spacing: 0.12em; }
.sadako__year { color: var(--ink-soft); font-family: var(--mono); font-size: 0.6em; vertical-align: 0.18em; margin-left: 0.4em; }

.sadako__logline {
  border-left: 2px solid var(--oxblood);
  padding-left: 1.1rem;
  margin: 0 0 1.4rem 0;
  font-size: 1.08rem;
  line-height: 1.6;
  color: var(--ink);
  font-style: italic;
}

.sadako__credit {
  margin: 0 0 1.5rem 0;
  color: var(--ink-soft);
}
.sadako__credit .mono { color: var(--oxblood); margin-right: 0.4em; }

.sadako__awards {
  background: var(--paper-deep);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  padding: 0.75rem 0.9rem;
  margin: 0 0 1.6rem 0;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
  line-height: 1.65;
}
.sadako__awards .dim { letter-spacing: 0.18em; font-size: 0.7rem; }

.sadako__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 0 0 1.8rem 0;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.7rem 1.1rem;
  font-family: var(--mono);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  border-radius: 2px;
  transition: transform 180ms ease-out, background 180ms ease-out, color 180ms ease-out;
}
.btn--filled { background: var(--oxblood); color: var(--paper); }
.btn--filled:hover { background: #5e1717; transform: translateY(-1px); }
.btn--ghost { color: var(--ink); border: 1px solid var(--ink); }
.btn--ghost:hover { background: var(--ink); color: var(--paper); transform: translateY(-1px); }

.sadako__specs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem 1.4rem;
  border-top: 1px solid var(--hairline);
  padding-top: 1.4rem;
  margin-top: 0.5rem;
}
.sadako__specs > div { display: flex; flex-direction: column; gap: 0.2rem; }
.sadako__specs dt { font-size: 0.62rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--ink-soft); }
.sadako__specs dd { font-family: var(--serif); font-size: 1rem; color: var(--ink); margin: 0; }
```

- [ ] **Step 2: Refresh + verify**

The Sadako section should now show: poster on the left (with subtle drop shadow), info column on the right with bold serif title, oxblood-barred italic logline, credit line, awards band (centered, all-caps, paper-deep background), two buttons (filled oxblood + ghost ink), and a spec grid. On mobile (resize to <760 px), the layout stacks single-column.

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/css/style.css
git commit -m "feat: style Sadako centerpiece — poster grid, awards band, buttons, specs"
```

---

## Task 10: Style the crane divider, Roles, Contact, Colophon

**Files:**
- Modify: `C:\Users\sumed\sadako-site\assets\css\style.css` (append)

- [ ] **Step 1: Append**

```css
/* === CRANE DIVIDERS === */
.crane-divider {
  text-align: center;
  margin: 1.5rem 0;
  color: var(--oxblood-soft);
}
.crane-divider img { display: inline-block; width: 64px; height: auto; opacity: 0.7; }
.crane-divider--end { margin-top: 3rem; color: var(--ink-soft); }
.crane-divider--end img { width: 50px; opacity: 0.55; }

/* === IV. ROLES & RECOGNITION === */
.roles__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(2rem, 4vw, 3.5rem);
}
@media (max-width: 700px) {
  .roles__grid { grid-template-columns: 1fr; }
}
.roles__subhead {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink-soft);
  margin: 0 0 1.1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--hairline);
}
.roles__list li {
  padding: 0.55rem 0;
  border-bottom: 1px dashed var(--hairline);
  font-size: 1.02rem;
  line-height: 1.5;
}
.roles__list li:last-child { border-bottom: none; }
.roles__list .mono { color: var(--oxblood); margin-right: 0.6em; }
.roles__list em { color: var(--ink); font-style: italic; }

/* === V. CONTACT === */
.contact { max-width: 48rem; text-align: center; }
.contact__list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0 2rem;
}
.contact__list li { position: relative; }
.contact__list li + li::before {
  content: "·";
  position: absolute;
  left: -1.1rem; top: 0;
  color: var(--ink-soft);
}
.contact__list a {
  display: inline-block;
  font-family: var(--serif);
  font-size: 1.2rem;
  padding: 0.4rem 0;
  position: relative;
}
.contact__list a::after {
  content: "";
  position: absolute;
  left: 0; right: 100%; bottom: 0.25rem;
  height: 1px;
  background: var(--oxblood);
  transition: right 280ms ease-out;
}
.contact__list a:hover::after { right: 0; }

/* === VI. COLOPHON === */
.colophon {
  text-align: center;
  padding-top: 2rem;
  padding-bottom: 4rem;
}
.colophon .mono {
  color: var(--ink-soft);
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.colophon__fin {
  font-family: var(--serif);
  font-style: italic;
  font-size: 1.4rem;
  color: var(--oxblood);
  margin: 2rem 0 0 0;
}
```

- [ ] **Step 2: Refresh + verify**

Cranes show centered between sections. Roles section is two-column on desktop, stacks on mobile. Contact links display in a row with center-dots separating, with oxblood underline crawl on hover. Colophon is centered, mono small print + italic oxblood "Fin." Confirm all four behave correctly.

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/css/style.css
git commit -m "feat: style cranes, Roles two-col, Contact links, Colophon"
```

---

## Task 11: Add scroll-fade JS + reduced-motion guard

**Files:**
- Create: `C:\Users\sumed\sadako-site\assets\js\main.js`
- Modify: `C:\Users\sumed\sadako-site\assets\css\style.css` (append a small reveal class)

- [ ] **Step 1: Append the reveal class to style.css**

```css
/* === SCROLL REVEAL === */
.reveal { opacity: 0; transform: translateY(12px); transition: opacity 700ms ease-out, transform 700ms ease-out; }
.reveal.is-visible { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .hero__chevron { animation: none; }
  .sadako__poster a:hover img { transform: none; }
  .btn:hover { transform: none; }
}
```

- [ ] **Step 2: Write `assets/js/main.js`**

```javascript
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tag major content blocks for reveal animation.
  const revealables = document.querySelectorAll(
    '.about__body, .sadako__grid, .roles__grid, .contact__list, .colophon, .crane-divider'
  );

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('reveal', 'is-visible'));
    return;
  }

  revealables.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealables.forEach(el => io.observe(el));
})();
```

- [ ] **Step 3: Refresh + verify**

Reload `http://localhost:8000/`. Scroll slowly. Each section should fade up gently as it enters the viewport — the hero is visible from the start (not tagged), then About fades up, Sadako fades up, etc.

Also test reduced-motion: in DevTools, open the rendering panel and set "Emulate CSS prefers-reduced-motion: reduce", then reload. Everything should appear instantly with no motion (and the chevron should stop pulsing).

- [ ] **Step 4: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add assets/js/main.js assets/css/style.css
git commit -m "feat: scroll-fade reveals with prefers-reduced-motion guard"
```

---

## Task 12: Write README + final walk-through

**Files:**
- Create: `C:\Users\sumed\sadako-site\README.md`

- [ ] **Step 1: Write README**

```markdown
# sumedh

Personal site of **Sumedh Jamsandekar** — writer, director, engineer. Features his short film *Sadako (2025)*, co-directed with Evan Tobias and Joel Jobi.

Live at https://bane2007.github.io/sumedh/

## Stack
Hand-crafted static HTML/CSS/JS. No build step. Self-hosted fonts (EB Garamond + JetBrains Mono).

## Local preview
```powershell
python -m http.server 8000
```
Then visit http://localhost:8000/.

## Credits
- *Sadako* (2025) directed by Sumedh Jamsandekar, Evan Tobias, Joel Jobi.
- Site designed and built 2026-05-26.
```

- [ ] **Step 2: Do a full visual walk-through**

In the browser at `http://localhost:8000/`:

1. Hard refresh (Ctrl+Shift+R). Hero loads, chevron pulses.
2. Click the chevron — smooth-scrolls to About. Verify.
3. Scroll down through About → Sadako. Watch fade-up timing.
4. Click the poster — opens full-res PNG in new tab. Back.
5. Click **▶ Watch on YouTube** — opens YouTube in new tab. Back.
6. Click **View on IMDb** — opens IMDb. Back.
7. Continue scrolling. Crane divider appears. Roles section fades in. Numbers should be readable, oxblood `2025 —` / `2026 —` accents visible.
8. Contact links: hover IMDb and GitHub — oxblood underline should crawl L→R.
9. Final crane appears, colophon shows, "Fin." in italic oxblood.
10. Tab through the page from the top — every interactive element should get a visible oxblood focus ring.
11. Resize browser to ~400 px wide. Sadako section should stack (poster on top, info below). Roles section should stack to one column. Spec grid should adapt. Buttons should wrap.

Any issue: fix it before continuing.

- [ ] **Step 3: Commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add README.md
git commit -m "docs: README with stack and local-preview instructions"
```

---

## Task 13: Update Contact section with confirmed social handles

**Files:**
- Modify: `C:\Users\sumed\sadako-site\index.html`

**Status:** Blocked until BANE provides LinkedIn / Letterboxd / Instagram handles (per spec §10 item 3 and the AskUserQuestion answer).

- [ ] **Step 1: Once BANE provides handles, replace the commented placeholder block in index.html**

Find this block in `index.html`:

```html
<!-- Optional socials inserted here once handles confirmed:
     <li><a href="https://www.linkedin.com/in/USERNAME/" target="_blank" rel="noopener">LinkedIn</a></li>
     <li><a href="https://letterboxd.com/USERNAME/" target="_blank" rel="noopener">Letterboxd</a></li>
     <li><a href="https://instagram.com/USERNAME" target="_blank" rel="noopener">Instagram</a></li>
-->
```

Replace each placeholder URL with the real handle. Uncomment the lines that apply. If BANE provides only one or two, only uncomment those.

- [ ] **Step 2: Refresh, verify, commit**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
git add index.html
git commit -m "feat: add social links to contact section"
```

---

## Task 14: Deploy to GitHub Pages

**Files:**
- None (CLI + remote state)

- [ ] **Step 1: Check gh CLI auth state**

```powershell
gh auth status 2>&1
```

If "not logged into any GitHub hosts": BANE runs `gh auth login` interactively (choose GitHub.com → HTTPS → browser auth). I cannot run that for him — flag it and pause.

If logged in: continue.

- [ ] **Step 2: Verify intended username**

```powershell
gh api user --jq '.login'
```

Expected: `Bane2007`. If it's something else, stop and ask BANE which account to use.

- [ ] **Step 3: Create the repo and push**

```powershell
Set-Location 'C:\Users\sumed\sadako-site'
gh repo create sumedh --public --source=. --remote=origin --description "Personal site of Sumedh Jamsandekar — writer, director, engineer. Featuring Sadako (2025)." --push
```

Expected: prints the new repo URL `https://github.com/Bane2007/sumedh` and pushes the local main branch.

- [ ] **Step 4: Enable GitHub Pages**

```powershell
gh api -X POST "/repos/Bane2007/sumedh/pages" -f "source[branch]=main" -f "source[path]=/" 2>&1
```

Expected: returns a JSON payload with `"status": "queued"` or similar. If the API complains the page already exists, that's fine — Pages was already on.

- [ ] **Step 5: Wait briefly, then verify the live URL**

```powershell
Start-Sleep -Seconds 30
gh api "/repos/Bane2007/sumedh/pages" --jq '.html_url, .status'
Start-Process 'https://bane2007.github.io/sumedh/'
```

Expected: `html_url` prints `https://bane2007.github.io/sumedh/`, `status` is `built`. Browser opens to the live site. The first build can take 30-90 seconds; if it 404s, wait another minute and refresh.

- [ ] **Step 6: Confirm the deployed site matches local**

Open the live URL. Walk through the same checklist as Task 12 step 2, but against the deployed version. Specifically verify:
- Poster image loads (relative paths intact)
- Fonts load (look at "SUMEDH JAMSANDEKAR" — should be EB Garamond, not a system fallback)
- YouTube + IMDb buttons work
- Both crane SVGs render

If anything is broken, fix locally, commit, push — GitHub Pages re-deploys automatically.

---

## Self-Review

**Spec coverage**

| Spec § | Implemented in |
|---|---|
| §3 palette/type/motion | Tasks 6 (palette, type), 7 (hero chevron), 9 (poster hover), 11 (scroll fades) |
| §4 hero | Tasks 5 (HTML), 7 (CSS) |
| §4 about | Tasks 5 (HTML draft), 8 (CSS) |
| §4 Sadako centerpiece | Tasks 5, 9; uses Task 2 poster |
| §4 awards band | Task 9 (`.sadako__awards`) |
| §4 buttons (Watch / IMDb) | Task 9 (`.btn--filled`, `.btn--ghost`) |
| §4 tech-spec strip | Task 9 (`.sadako__specs`) |
| §4 Roles & Recognition | Tasks 5, 10 |
| §4 Contact | Tasks 5, 10, 13 |
| §4 Colophon | Tasks 5, 10 |
| §5 file layout | Task 1 dirs + per-asset tasks |
| §6 tech stack constraints | Plan inherently constrains to HTML/CSS/JS |
| §7 deploy | Task 14 |
| §8 accessibility | HTML semantics (Task 5), focus rings (Task 6), reduced-motion (Task 11), alt text (Task 5 poster alt) |
| §10 open questions | Task 13 placeholder for socials; defaults applied for tagline, bio, repo name |

No gaps found.

**Placeholder scan**

No "TBD"/"TODO"/"implement later" steps. Task 13 is intentionally blocked-on-input, with the exact placeholder location quoted and the exact edit explained.

**Type consistency**

Class names cross-checked:
- `.section-eyebrow` — Task 6 defines, Tasks 5/8/9/10 use ✓
- `.sadako__grid`, `.sadako__poster`, `.sadako__info`, `.sadako__title`, `.sadako__logline`, `.sadako__credit`, `.sadako__awards`, `.sadako__buttons`, `.sadako__specs` — Task 5 HTML matches Task 9 CSS ✓
- `.btn`, `.btn--filled`, `.btn--ghost` — Task 5 HTML matches Task 9 CSS ✓
- `.roles__grid`, `.roles__subhead`, `.roles__list` — Task 5 HTML matches Task 10 CSS ✓
- `.contact__list` — Task 5 HTML matches Task 10 CSS ✓
- `.crane-divider`, `.crane-divider--end` — Task 5 HTML matches Task 10 CSS ✓
- `.reveal`, `.is-visible` — Task 11 CSS matches Task 11 JS ✓
- `.skip-link`, `.mono`, `.smallcaps`, `.dim` — Task 5 HTML uses, Task 6 defines ✓

All consistent.
