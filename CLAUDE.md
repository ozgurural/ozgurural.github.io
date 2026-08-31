# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal academic portfolio site for Dr. Ozgur Ural, built on a custom Jekyll template and hosted on GitHub Pages at `ozgurural.github.io`. The site positions Ozgur for CTO/principal engineering roles — copy should lead with leadership and impact, not just academic credentials.

## Development Commands

### Native Ruby (primary — Docker config is present but Ruby 3.3 is installed locally)

```bash
bundle exec jekyll serve --port 4000 --force_polling --config _config.yml,_config.dev.yml
bundle exec jekyll build                                # build to _site/
```

First build ~35 s, incremental rebuilds ~15–25 s. **Browse at `http://localhost:4000`, not `127.0.0.1`.**

**Always serve with `_config.dev.yml` layered on.** `_config.yml` sets `url` to the deployed site and the templates emit absolute URLs from it, so without the override a page served from localhost links the *production* CSS and JS: local edits appear to do nothing, and `document.styleSheets` reports the sheet as cross-origin (`cssRules` throws) which is the quickest way to detect it. The dev config only sets `url: http://localhost:4000`.

**Do not run `bundle exec jekyll build` while `jekyll serve` is running.** Both write `_site/`, the manual build uses the production config, and whichever finishes last wins. The symptom is the one above, arriving several edits after you stopped suspecting it. `serve` already rebuilds on save; to confirm a rebuild landed, poll the served asset rather than the file on disk:

```bash
curl -s http://localhost:4000/assets/css/main.css | grep -c 'your-new-rule'
```

Note `grep -c` counts matching *lines*, and the built CSS is one line, so it answers "present" not "how many". Use `grep -o ... | wc -l` when the count matters.

### JavaScript assets

```bash
npm run build:js      # minify jQuery + FitVids + smooth-scroll + greedy-nav + _main.js -> assets/js/main.min.js
npm run watch:js      # watch for changes
npm run build:lab-og  # render 1200x630 OG cards for lab pages (Node/@resvg)
npm run build:narration # extracts lower() texts to scripts/narration.json (tracked); then scripts/generate-narration.py (edge-tts, en-US-AndrewMultilingualNeural) rebuilds assets/audio/lab/*.mp3 (also tracked)
# note: the narration mp3s under assets/audio/lab/ are generated but committed, so the lab works
# without a build step. Film background scores are synthesised at runtime (Web Audio) — no audio file.
npm run build:film-video -- --all                  # every film, whole, resumable
npm run build:film-video -- --film <slug>          # render a film to dist/video/*.mp4
npm run build:film-video -- --film <slug> --scene 3   # one scene only
npm run build:film-video -- --film <slug> --from 12 --to 75
npm run diff:film -- <slug> [t]                   # is the render still the film? see below
```

**Sharing the films.** LinkedIn does not render players from third-party sites and X's player card needs a whitelisted domain, so a link never plays inline on either. A native mp4 upload does, which is what `build:film-video` is for. It needs the dev server running, renders picture and sound in two separate passes, and writes to `dist/` (gitignored). Picture is deterministic: `film.seek(t)` is a pure function of t, so frames are seeked and screenshotted rather than captured in real time, and piped straight into ffmpeg. Sound has to be real time, because the score is synthesised into an AudioContext as the film plays; the pass routes the narration (plain `Audio` elements, outside that graph) in through `createMediaElementSource`, taps everything reaching the destination, and records it, which also preserves the music's ducking under the voice. Output is 1920x1080 H.264 yuv420p with AAC, about 8 frames a second on this machine, so roughly a minute of render per 15 seconds of film. The eleven films are 35 minutes in total, so `--all` is a two-and-a-half to three hour job; it resumes, skipping any film already on disk that passes the same `verify()` a fresh render has to pass, and a film that fails is deleted and logged rather than killing the run. The launch sets `protocolTimeout: 3600000` and must keep doing so: the audio pass plays the film in real time inside a single `page.evaluate`, and puppeteer's 180s default aborts any call longer than that, which is longer than every scene and shorter than every film. The symptom is a timeout on the first film that says nothing about audio. Note X caps most accounts at 2:20 and every film except the shortest is longer, so a full film needs LinkedIn (which allows 15 minutes) or a `--scene` cut for X.

**The render is a second document, so it drifts.** The mp4 is captured from `/lab/<slug>/embed/` while the visitor watches `/lab/<slug>/`: one engine, two stylesheets, and nothing fails when they diverge. Three divergences have shipped already. The renderer forced `html, body { background: #000 }` on the theory that the film's own edge pixel was black, which came from reading RGB out of `getImageData` and ignoring alpha; the canvas is fully transparent and the grid the stage paints behind it is the film's paper. The embed hid `.labf__chrome` outright, which is right for a small iframe (the band's height is fixed in screen pixels, so it reaches logical y 44 at a 1280px stage but 71 at 800, against the y 46 scenes are authored to clear) and wrong for a 1280px capture, so the rule is width-gated at 1200px. And clips were being posted where whole films were wanted.

`npm run diff:film -- <slug> [t]` is what catches the next one. It renders both documents at one instant, brings them to a common size, and clusters the differing pixels into row bands with their logical y, because a global PSNR scores a 1px text shift and a missing caption band about the same: page-versus-embed sat at 26 dB both before and after the chrome fix, and only the band listing showed what had changed. Two cautions, both learned by getting them wrong. Clip through the element handle (`(await page.$('.labf__stage')).screenshot()`), never a viewport rect read in a previous call: a scroll lands between the two and the clip picks up page above the film, which reads as every element being shifted. And expect a couple of percent of differing pixels even when the two are identical, because the stages are 1242 and 1280 wide and every antialiased edge resamples; what matters is whether a band corresponds to something that is drawn on one and not the other.

For the web, each film also serves `/lab/<slug>/embed/` (chromeless, iframe-able) and `/lab/<slug>/oembed.json`, which makes a pasted link expand into the player on anything that speaks oEmbed.

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

- **Elements dropped into the chrome band.** The top of every stage is reserved: the chapter counter sits at logical y 12 to 27, the scene subtitle at 30 to 45, the signature at the right. Anything authored above y=52 collides with them. Eleven elements across six films were doing this, the worst by 37px. Sweep for it by seeking in 0.5s steps and flagging any visible node whose top is under 46 while the chapter or subtitle is on.

Two things make that sweep trustworthy, both learned the hard way. Measure **ink, not boxes**: a caption's box carries a lot of line-box slack, and a `Range` over the node's contents gives the real glyph extents. But for KaTeX, range the `.katex-html` child alone, because KaTeX also emits a hidden `.katex-mathml` copy for screen readers whose rects inflate the node by tens of pixels, and because a fraction's glyphs *overflow* its own box by around 13px each way, so the box understates how high it reaches. Getting this wrong in both directions produced false positives and missed a real one in the same pass.

When sweeping `ctx.fillText` for collisions or out-of-stage labels, map each origin through `ctx.getTransform()` (text drawn inside a `translate` lands nowhere near its arguments), skip glyphs of two characters or fewer (decorative hex rain), and read the alpha out of `fillStyle` as well as `globalAlpha`, since a faded label is still drawn.

### Search

Lunr.js client-side search is enabled (`search: true` in `_config.yml`). No external search service.
