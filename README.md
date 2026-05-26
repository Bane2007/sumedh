# sumedh

Personal site of **Sumedh Jamsandekar** — writer, director, engineer.

Featuring his short film *Sadako (2025)*, co-directed with Evan Tobias and Joel Jobi at IIT Delhi Abu Dhabi.

Live at https://bane2007.github.io/sumedh/

## Stack

Hand-crafted static HTML / CSS / vanilla JS. No build step. Self-hosted woff2 fonts (EB Garamond + JetBrains Mono). Single optimized poster JPEG (~266 KB) with the full-res PNG kept alongside for direct download.

## Local preview

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/.

## Structure

- `index.html` — single page, six sections (hero · about · Sadako · roles · contact · colophon)
- `assets/css/style.css` — palette, typography, every section's styling
- `assets/js/main.js` — IntersectionObserver scroll-fades, reduced-motion guard
- `assets/img/poster.jpg` — optimized poster (1000×1400, JPEG)
- `assets/img/poster-full.png` — full-resolution poster (direct download)
- `assets/svg/crane.svg` — line-art origami crane, reused as section divider
- `assets/fonts/` — self-hosted woff2 files
- `docs/` — spec and implementation plan

## Credits

- *Sadako* (2025) directed by **Sumedh Jamsandekar · Evan Tobias · Joel Jobi**
- IMDb: https://www.imdb.com/title/tt39732610/
- YouTube: https://www.youtube.com/watch?v=bSUdWw-3dmE
- Festival recognition: Best Audio, Best Storytelling, Audience Choice — University Film Festival 2025

Site designed and built 2026-05-26.
