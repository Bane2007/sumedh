# Sadako (2025) — Microsite Design

**Spec date:** 2026-05-26
**Author:** Sumedh Jamsandekar (BANE) + Claude
**Status:** Pending approval

---

## 1. Purpose

A single-page microsite for Sadako (2025), a 5-minute stop-motion origami short co-directed by Sumedh Jamsandekar, Joel Jobi, and Evan Johan Tobias. Released October 30, 2025 (UAE).

The site is **not** a multi-project portfolio. It is the film's web presence and a quiet "about Sumedh" anchor. If a second film appears later, the site graduates into a portfolio without throwing away today's work.

## 2. Success criteria

- Loads in under 1.5 s on a cold visit (single page, optimized poster, self-hosted fonts).
- Reads as a *piece of work*, not a template — visitors should feel the page belongs to the film.
- One real artifact (the poster) anchors the design.
- Honest scope: only the film and its director-trio, plus a short about-Sumedh footer. No fake projects, no padding.
- Live at a public URL on GitHub Pages by end of session, owned by `Bane2007`.
- Adding a second film later requires editing `index.html` and adding one new section, nothing structural.

## 3. Aesthetic — paper-noir, grounded in the poster

**Source of truth:** the existing Sadako poster (warm crumpled kraft paper, white hand-drawn "SADAKO" marker title, line-art origami cranes in corners). The site extends the poster's visual world.

**Palette**
- Ground: `#f3ede2` (paper cream)
- Texture overlay: kraft-paper crumple, extracted/derived from the poster, applied at low opacity to body background
- Foreground: `#1a1410` (warm near-black, like brushed ink)
- Accent: `#7a1f1f` (oxblood — matches the AHUL213 paper's palette)
- Soft shadow: `#d8cfbf`

**Type**
- Display + body: **EB Garamond** (regular + medium), self-hosted woff2
- Credits / metadata: **JetBrains Mono** (regular), self-hosted woff2
- No hand-drawn font for "SADAKO" elsewhere on the page — the poster carries that letterform; everywhere else the title appears in EB Garamond small-caps so we don't compete with the artwork

**Motion language**
- IntersectionObserver fade-ins, 600 ms ease-out
- Hero poster fades in once on load
- Stills (if added later) lift 4 px on hover with shadow growth
- Oxblood underline crawls L→R on link hover
- `prefers-reduced-motion: reduce` disables all of it cleanly

**Ornament**
- One hand-coded SVG line-art crane, reused twice: as the section divider between Logline and Film Info, and as the closing flourish above the colophon
- No other gimmicks, no parallax, no cursor effects

## 4. Page structure (single scroll)

| # | Section | Content |
|---|---|---|
| I | **Hero** | Full-bleed poster. Below: mono caption `SADAKO · 2025 · STOP-MOTION · 5 MIN`. Down chevron pulses. |
| II | **Logline** | The IMDb logline as quiet director's-statement quote, center column. Underneath, in mono: `A film by Sumedh Jamsandekar · Joel Jobi · Evan Johan Tobias`. Crane divider. |
| III | **The film** | Two-column info card: left = directors + cast (if any), right = country, language, release date, genres, runtime. Two buttons: "View on IMDb" (oxblood outline, links to tt39732610) and a placeholder "Watch the film" (greyed if no public link). |
| IV | **About Sumedh** | One paragraph: Energy Engineering at IIT Delhi Abu Dhabi · also writes and directs film. Contact: email link (default `24A1EENB0077@iitdabudhabi.ac.ae` — BANE to confirm or override). |
| V | **Colophon / fin** | Mono small print: "Set in EB Garamond and JetBrains Mono. Built 26 May 2026, Abu Dhabi." Crane closing flourish. "Fin." |

## 5. File layout

```
sadako-site/
  index.html                ← single page
  assets/
    css/style.css           ← one stylesheet, target < 400 lines
    js/main.js              ← intersection-observer fades + reduced-motion guard
    fonts/                  ← self-hosted woff2 (EB Garamond regular + medium, JetBrains Mono regular)
    img/
      poster.jpg            ← optimized from sadako (1).png (target < 400KB)
      poster-full.png       ← full-res copy kept for direct download
      texture-paper.jpg     ← derived paper-texture tile (optional, may inline as data URI)
    svg/
      crane.svg             ← hand-coded line-art origami crane
  .nojekyll                 ← disables Jekyll on GitHub Pages
  README.md                 ← project description + credits
  docs/                     ← this spec lives here
```

## 6. Tech stack

- **Hand-crafted static.** HTML5 + modern CSS (custom properties, grid, container queries where useful) + a tiny vanilla JS file. No build step, no Node, no framework.
- **Fonts:** download woff2 from Google Fonts mirrors via PowerShell; self-host so the site does not phone home on every visit.
- **Image optimization:** the 5.1 MB poster is reduced to <400 KB JPEG via PIL (Python is available). Full-res PNG kept alongside for direct download.
- **JS budget:** under ~50 lines. Intersection observer, fade-in toggle, reduced-motion check, simple smooth-scroll for nav anchor.

## 7. Deploy

1. `git init` inside `sadako-site/`
2. Stage and commit explicitly named files (no `git add -A`)
3. `gh auth login` (interactive — BANE runs this once)
4. `gh repo create sadako-site --public --source=. --push`
5. Enable Pages via `gh api -X POST /repos/Bane2007/sadako-site/pages -f source[branch]=main -f source[path]=/`
6. Live within ~60 seconds at `https://bane2007.github.io/sadako-site/`

(Custom domain like `sadakofilm.com` or `sumedhjamsandekar.com` is out-of-scope for today but trivially added later via repo settings + DNS.)

## 8. Accessibility

- All images have meaningful `alt` text (poster: "Sadako poster — kraft paper with line-art origami cranes, white marker title")
- Color contrast meets WCAG AA on the cream/ink combination (`#1a1410` on `#f3ede2` ≈ 14:1)
- Keyboard navigation works: focus rings in oxblood, all interactive elements reachable
- `prefers-reduced-motion` honored
- `lang="en"` on `<html>`, sensible `<title>` and `<meta name="description">`

## 9. Out of scope (won't bloat day 1)

- Trailer embed (no public clip given)
- Behind-the-scenes / making-of writing
- Multi-language support
- Contact form (a `mailto:` link is enough)
- Analytics, cookies, consent banners
- Dark/light toggle (the site has one mood, deliberately)
- CMS / MDX — the entire site is small enough that future edits are direct HTML

## 10. What needs confirming before build

1. **Contact email** — default `24A1EENB0077@iitdabudhabi.ac.ae`, or override?
2. **Repo name** — default `sadako-site`, or `sadako-2025` / `sadako` / something else?
3. **Trailer / watch link** — link to provide for "Watch the film" button, or leave it greyed out?
