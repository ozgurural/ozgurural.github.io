# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal academic portfolio site for Dr. Ozgur Ural, built on a custom Jekyll template and hosted on GitHub Pages at `ozgurural.github.io`. The site positions Ozgur for CTO/principal engineering roles — copy should lead with leadership and impact, not just academic credentials.

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
npm run build:narration # extracts lower() texts to scripts/narration.json (tracked); then scripts/generate-narration.py (edge-tts, en-US-AndrewMultilingualNeural) rebuilds assets/audio/lab/*.mp3 (also tracked)
# note: the narration mp3s under assets/audio/lab/ are generated but committed, so the lab works
# without a build step. Film background scores are synthesised at runtime (Web Audio) — no audio file.
```

Keep `_main.js` free of ES `import`/`export` — the bundle is loaded as a classic deferred script. Plotly ships separately via `assets/js/plotly-blocks.js` and is only included when a page contains a plotly fenced block.

## House rules for content

These are the site owner's standing rules. They apply to every agent and every commit.

**No em-dashes in anything a visitor can read.** Em-dashes read as AI-generated and the site is deliberately clear of them. This covers page copy *and* the film scripts, where subtitle strings (`lower(...)`), `s.caption(...)` and `ctx.fillText(...)` all render on screen. Replace each one with the punctuation the sentence actually needs: parentheses for a list that already contains commas, a colon where the second half explains the first, a semicolon between two independent clauses, a comma for an appositive. Never do a blind `—` → `,` swap; it produces comma splices. Leave alone: code comments (they never render), en-dashes in ranges (`2020–2021`, `36–40 hours`), and mathematical minus signs. Check before committing:

```bash
grep -rn '—' _pages _posts _publications | grep -v _site   # must be empty
```

**Films must be built from the source they cite.** A film may only name a mechanism that the cited paper actually contains. Reconstructing a paper from search summaries and then crediting the paper has happened twice and both times produced mechanisms the author never wrote. Read the paper first. If a film presents the author's own unpublished thinking, label it as such (`Open research direction of the author, not yet published`) rather than attaching the nearest publication. Prefer stating a paper's measured results, with numbers, over describing it in the abstract.

**Avoid AI-tell phrasing.** No "delve", "leverage", "seamless", "cutting-edge", "sits at the intersection of", "raise the bar", or self-praise like "Recognized for my expertise" and "deep domain expertise". Let facts carry the authority: name the papers, the venues, the measurements. Genuine technical terms that resemble tells are fine (loss landscape, test harness, adversarial robustness, state-of-the-art when it refers to prior work).

**Positioning.** Headline title is "Machine Learning Research Scientist & Senior Software Engineer, Ph.D."; never "AI Engineer". The degree is named by its official title, "Ph.D. in Electrical Engineering and Computer Science" (Embry-Riddle, USA, 2025), and the fact that it is a U.S. doctorate is worth foregrounding. Keep `cv/resume.tex`, `_pages/about.md` and `_config.yml` consistent whenever any of this changes.

**Employer content.** Work drawn from Avion may describe the author's role, architecture and engineering discipline, but discloses no employer design, customer, budget or security specifics. Say so on the page when it applies.

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
- `draw()` reveals by **arc length** (dash-offset) while `pathOf()` interpolates by **segment index** — a `moveAlong` dot on the same polyline drifts unless you use a screen-space arc-length parameterization (see `pathOfArc` in `gradient-pinball.js`). Verify lockstep numerically: compare the ball's rect to `path.getPointAtLength(len·(1−dashoffset/len))`.
- `draw()` on group handles (axes, vectors) has no path to dash-reveal; the engine falls back to a full-duration fade.

Three defects the films acquire silently, all worth re-checking after any edit to a scene's timing or layout:

- **Narration cut off by the scene end.** A scene shorter than `cue.at + mp3 duration` chops its own sentence at the cut. Four scenes were doing this. Measure it: load each `film._audioCues` id from `/assets/audio/lab/`, read `loadedmetadata` duration, and compare `at + duration` against the scene's end.
- **Labels drawn under the caption panel.** The panel is opaque and starts at y=412 to 461 depending on how many lines the caption wraps to, so anything drawn below that is invisible even though it renders. Measure the panel's real top per scene, not once per film, and *walk ancestors* when testing visibility: inactive scenes are hidden through `.labf__texlayer`, so a node's own computed opacity says every scene's captions are visible at every moment.
- **Frozen tails.** Compare each scene's last visual change against its length. A scene that stops moving with narration still running needs drawing; one that is silent *and* frozen just needs to be shorter. Note that a scene can be silent while still animating, which is fine and often the point.

When sweeping `ctx.fillText` for collisions or out-of-stage labels, map each origin through `ctx.getTransform()` (text drawn inside a `translate` lands nowhere near its arguments), skip glyphs of two characters or fewer (decorative hex rain), and read the alpha out of `fillStyle` as well as `globalAlpha`, since a faded label is still drawn.

### Search

Lunr.js client-side search is enabled (`search: true` in `_config.yml`). No external search service.
