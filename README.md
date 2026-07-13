# Juan Sebastian Vargas Molano — Portfolio

A fun, interactive portfolio site for job applications. The hero is rendered live
in **WebGL / Three.js** with a custom GLSL noise-displacement shader and an
interactive particle field — the site demonstrates the same craft it describes.

## Structure

```
portfolio/
├── index.html          # All page content & structure
├── css/
│   └── style.css       # Design system, layout, responsive rules, scroll reveals
├── js/
│   ├── scene.js        # Three.js hero: shader-displaced mesh + particles + parallax
│   └── app.js          # Nav state, mobile menu, scroll reveals, stat count-up
├── assets/             # (empty — drop a resume.pdf or images here if you want)
└── README.md
```

Three.js is loaded from a CDN (`three.js r128`), so there is nothing to install.

## Run it locally

The simplest way — just open `index.html` in your browser (double-click it).
Because everything loads from local files + a CDN, it works straight from `file://`.

For a "real" local server (recommended, avoids any browser file:// quirks):

```bash
cd portfolio
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (free, ~2 minutes)

**GitHub Pages**
1. Create a repo, push this folder.
2. Settings → Pages → deploy from `main` branch, root.
3. Your site is live at `https://<username>.github.io/<repo>/`.

**Vercel / Netlify** — drag the folder onto their dashboard, or connect the repo.
It's a static site, so no build step or configuration is needed.

## Customize

- **Text & content** live in `index.html` — edit the sections directly.
- **Colors** are CSS variables at the top of `css/style.css` (`--violet`, `--teal`, …).
  Change two values and the whole palette (including the 3D shader accents) follows.
- **3D scene** parameters (mesh detail, displacement, particle count, colors) are near
  the top of `js/scene.js`.
- **Resume download**: drop your `resume.pdf` into `assets/` and add a button in the
  contact section:
  `<a href="assets/resume.pdf" class="btn btn-ghost" download>Download resume</a>`

## Accessibility & performance

- Respects `prefers-reduced-motion` (calms the animation and disables count-ups).
- The render loop pauses when the hero scrolls out of view.
- Falls back gracefully to a static layout if WebGL is unavailable.
