# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal academic portfolio site for Dr. Ozgur Ural, built on the [academicpages](https://github.com/academicpages/academicpages.github.io) Jekyll template and hosted on GitHub Pages at `ozgurural.github.io`. The site positions Ozgur for CTO/principal engineering roles — copy should lead with leadership and impact, not just academic credentials.

## Development Commands

### Native Ruby (primary — Docker config is present but Ruby 3.3 is installed locally)

```bash
bundle exec jekyll serve --port 4000 --force_polling   # serve with polling (Windows)
bundle exec jekyll build                                # build to _site/
```

First build ~35 s, incremental rebuilds ~15–25 s. **Browse at `http://localhost:4000`, not `127.0.0.1`** — `base_path` emits absolute localhost URLs; cross-origin module/CORS fetches silently fail on the other host.

### JavaScript assets

```bash
npm run build:js      # minify jQuery + FitVids + smooth-scroll + greedy-nav + _main.js -> assets/js/main.min.js
npm run watch:js      # watch for changes
npm run build:lab-og  # render 1200x630 OG cards for lab pages (Node/@resvg)
```

Keep `_main.js` free of ES `import`/`export` — the bundle is loaded as a classic deferred script. Plotly ships separately via `assets/js/plotly-blocks.js` and is only included when a page contains a plotly fenced block.

## Architecture

### Content collections

Defined in `_config.yml`; each collection maps to a source directory and output path:

- `_publications/` → `/publications/` — academic papers, theses, reports
- `_posts/` → date-based URLs — blog posts
- `_pages/` → per `permalink` front matter — static pages (about, CV, projects, essays, lab, …)
- `_teaching/` → `/teaching/` — teaching materials

### Layouts & templating

`_layouts/` holds Liquid page templates; `_includes/` holds reusable partials. The `compress.html` layout is a whitespace-stripping wrapper. Navigation order is controlled entirely by `_data/navigation.yml`.

### Styling

SCSS in `_sass/` is organized around a design-system token layer (CSS custom properties: `--ds-accent`, `--ds-ink`, `--ds-body`, `--ds-surface`, `--ds-bg`). The active theme is set in `_config.yml` (`theme: default`). Five themes exist: default, air, sunrise, mint, dirt, contrast.

### Research Lab (`_pages/lab*.md` + `assets/js/lab-anim.js`)

Each lab page is an interactive animated explainer. Films register themselves in `window.LabAnim.films`. When debugging overlap/layout issues:

- Walk ancestors before checking visibility — inactive scenes are hidden via `.labf__texlayer` opacity/visibility; checking only a node's own computed style yields false positives.
- In any hidden tab (e.g., the Claude Preview pane), `document.hidden` is true so `rAF` never fires; use `film.seek(t)` + rect geometry for verification instead of playing back.
- `preview_resize` on a hidden tab does not reach the engine's resize handler — do mobile-width checks with a fresh page load at the target viewport width (`_fitCanvas` runs correctly on load).
- Nodes with class `labf__lower` are subtitle panels; overlap with chart furniture is intentional.
- Step through a film with `seek(t)` in 0.4 s increments over `film.duration`, collecting visible `.labf__node` rects per scene, to find pairwise intersections and out-of-stage elements.

### Search

Lunr.js client-side search is enabled (`search: true` in `_config.yml`). No external search service.
