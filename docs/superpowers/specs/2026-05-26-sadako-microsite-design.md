# Sumedh Jamsandekar — Personal Site (with Sadako as centerpiece)

**Spec date:** 2026-05-26 (rev 2)
**Author:** Sumedh Jamsandekar (BANE) + Claude
**Status:** Pending approval

---

## 1. Purpose

A single-page personal site for **Sumedh Nitin Jamsandekar** — Energy Engineering student at IIT Delhi Abu Dhabi who also writes and co-directs short films. The site presents Sumedh as a person first, with his short film **Sadako (2025)** as the headline creative work.

Not a multi-project portfolio: Sadako is the only film (and the only public creative project on the site). But the site frames *Sumedh*, not just one piece.

## 2. Success criteria

- Loads in under 1.5 s on a cold visit (single page, optimized poster, self-hosted fonts).
- Reads as a *piece of work*, not a template — feels distinctly his.
- Honest scope: Sumedh, the film, the awards, the leadership/recognition, the contact. No filler.
- Live at a public URL on GitHub Pages by end of session, owned by `Bane2007`.
- Future-proof: adding a second film later is a 30-minute revision, not a rebuild.

## 3. Aesthetic — paper-noir, grounded in the Sadako poster

Same visual world as the poster (warm kraft paper, hand-drawn marker title, line-art origami cranes, ink-black foreground, oxblood accents). The site reads as an extension of the Sadako poster, but with enough room for Sumedh's other identity (engineering, recognition) to breathe.

**Palette**
- Ground: `#f3ede2` (paper cream)
- Texture overlay: soft kraft-paper crumple, derived from the poster, low opacity
- Foreground: `#1a1410` (warm near-black, brushed-ink)
- Accent: `#7a1f1f` (oxblood — matches the AHUL213 paper)
- Soft shadow: `#d8cfbf`

**Type**
- Display + body: **EB Garamond** (regular + medium), self-hosted woff2
- Credits / metadata / mono accents: **JetBrains Mono** (regular)
- The poster's hand-drawn "SADAKO" letterform stays only on the poster; everywhere else, "SADAKO" appears in EB Garamond small-caps so we don't compete with the artwork.

**Motion language**
- IntersectionObserver fade-ins, 600 ms ease-out
- Hero name slow type-in once on load
- Oxblood underline crawl L→R on link hover
- `prefers-reduced-motion: reduce` disables all of it cleanly

**Ornament**
- One hand-coded SVG line-art crane, reused twice (between Sadako section and Roles section, and as the closing flourish before colophon)

## 4. Page structure (single scroll, six beats)

| # | Section | Content |
|---|---|---|
| I | **Hero** | Slow type-in: `SUMEDH JAMSANDEKAR` in EB Garamond small-caps. Subline mono: `filmmaker · engineer · abu dhabi`. Down chevron pulses. |
| II | **About** | One short paragraph (BANE's voice or my draft): "Second-year Energy Engineering at IIT Delhi Abu Dhabi. I write and co-direct short films. Languages: English, Hindi, Marathi (native), Arabic (elementary)." Honest, terse, no resume-speak. |
| III | **Sadako (2025)** | Centerpiece. Layout: poster on the left, info on the right. Logline as director's-statement quote. Below: `a film by Sumedh Jamsandekar · Evan Tobias · Joel Jobi` (poster's name order). A small awards band: **`Best Audio · Best Storytelling · Audience Choice — University Film Festival 2025`**. Buttons: **▶ Watch on YouTube** (link to `bSUdWw-3dmE`) and **View on IMDb** (link to `tt39732610`). Tech-spec strip: country, language, release, runtime, genre. |
| IV | **Roles & Recognition** | Crane divider. Two columns. Left = roles: Marketing & Creatives Head, IITDA Coding Club · Core Member, Digital Arts & Design Club · Millennium Fellow 2025 (UN Academic Impact + MCN). Right = competitions: TRYST 2026 — 2nd, Hyperloop · 2nd, Titan · 3rd, Casecation. Each item one line, mono accents on year/place. |
| V | **Contact** | A small block of links (BANE confirms which appear): IMDb · GitHub · LinkedIn · Letterboxd · Instagram · email. Minimum: IMDb + GitHub. |
| VI | **Colophon / fin** | Mono small print: "Set in EB Garamond and JetBrains Mono. Built 26 May 2026, Abu Dhabi." Crane closing flourish. "Fin." |

## 5. File layout

```
sadako-site/
  index.html
  assets/
    css/style.css           ← one stylesheet, target < 450 lines
    js/main.js              ← intersection observer + reduced-motion guard
    fonts/                  ← self-hosted woff2 (EB Garamond reg + med, JetBrains Mono reg)
    img/
      poster.jpg            ← optimized from sadako.png (target < 400KB)
      poster-full.png       ← full-res copy kept for direct download
    svg/
      crane.svg             ← hand-coded line-art origami crane (reused)
  .nojekyll
  README.md
  docs/                     ← this spec
```

## 6. Tech stack

- Hand-crafted static. HTML5 + modern CSS (custom properties, grid) + tiny vanilla JS.
- No Node, no framework, no build step.
- **Fonts:** download woff2 from Google Fonts mirrors via PowerShell; self-host.
- **Image opt:** 6 MB poster → < 400 KB JPEG via PIL (Python is available). Full-res PNG kept alongside.
- **JS budget:** < 60 lines. IntersectionObserver, reduced-motion guard, smooth-scroll anchor.

## 7. Deploy

1. Already have `git init` done in `sadako-site/`
2. Stage and commit explicit files (no `git add -A`)
3. `gh auth login` (BANE runs once, interactive)
4. `gh repo create sadako-site --public --source=. --push` (or alt name — see §10)
5. Enable Pages: `gh api -X POST /repos/Bane2007/sadako-site/pages -f source[branch]=main -f source[path]=/`
6. Live within ~60 s at `https://bane2007.github.io/sadako-site/`

Custom domain (e.g. `sumedhjamsandekar.com`) deferred — trivial later.

## 8. Accessibility

- Meaningful `alt` text on all images
- Contrast: `#1a1410` on `#f3ede2` ≈ 14:1 — exceeds WCAG AAA
- Keyboard nav: focus rings in oxblood, all interactive elements reachable
- `prefers-reduced-motion` honored
- `lang="en"` and semantic landmarks (`<main>`, `<section>`, `<nav>` for skip-link)

## 9. Out of scope (won't bloat day 1)

- Behind-the-scenes / making-of content
- Multi-language UI
- Contact form (mailto if email used; otherwise IMDb DM / socials)
- Analytics, cookies, consent banners
- Dark/light toggle (deliberately one mood)
- CMS — HTML is small enough to edit directly
- Second-film provisioning (defer until a second film exists)

## 10. What needs confirming before build

1. **Repo name** — `sadako-site` (default) or `sumedh-site` / `sumedhjamsandekar` / something else? Affects the live URL.
2. **Hero tagline** — `filmmaker · engineer · abu dhabi` (default) or BANE's own line?
3. **Contact links to show** — minimum IMDb + GitHub; optional: LinkedIn, Letterboxd, Instagram, email. BANE provides handles/URLs for any optional ones.
4. **About paragraph voice** — should I draft from memory (energy engineering at IITDA, co-directs short films, languages, …) or does BANE want to write his own one-paragraph bio?
