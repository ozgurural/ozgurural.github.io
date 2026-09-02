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

**Check whose tree port 4000 is serving before trusting a measurement.** Several agents work this repo at once, sometimes from separate checkouts, and whoever starts a server first owns the port. Every film tool reads through that server, so a server belonging to another checkout means the numbers describe somebody else's files while the edits go into yours. It is silent: the pages load, the films play, the figures move. The tell is that a string you just wrote is not in what the server returns:

```bash
curl -s http://localhost:4000/assets/js/lab-films/<film>.js | grep -c 'a comment you just added'
```

When the port is taken, do not fight for it. `preview_start` the `jekyll-4001` configuration, which layers `_config.dev4001.yml` so `site.url` moves to 4001 as well (leaving it at 4000 makes the page pull its CSS and film scripts from the other tree, which is the same failure wearing a different hat), and point the tools at it:

```bash
FILM_BASE=http://localhost:4001 npm run audit:films
```

`audit-films.js`, `contact-sheet.js` and `diff-film-frame.js` all honour `FILM_BASE`.

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
npm run films                                     # make every film's mp4 current (see below)
npm run build:film-video -- --all                  # the same thing, spelled out
npm run build:film-video -- --all --force          # re-render even what is up to date
npm run build:film-video -- --film <slug>          # render a film to dist/video/*.mp4
npm run build:film-video -- --film <slug> --scene 3   # one scene only
npm run build:film-video -- --film <slug> --from 12 --to 75
npm run diff:film -- <slug> [t]                   # is the render still the film? see below
```

**Sharing the films.** LinkedIn does not render players from third-party sites and X's player card needs a whitelisted domain, so a link never plays inline on either. A native mp4 upload does, which is what `build:film-video` is for. It needs the dev server running, renders picture and sound in two separate passes, and writes to `dist/` (gitignored). Picture is deterministic: `film.seek(t)` is a pure function of t, so frames are seeked and screenshotted rather than captured in real time, and piped straight into ffmpeg. Sound has to be real time, because the score is synthesised into an AudioContext as the film plays; the pass routes the narration (plain `Audio` elements, outside that graph) in through `createMediaElementSource`, taps everything reaching the destination, and records it, which also preserves the music's ducking under the voice. Output is 1920x1080 H.264 yuv420p with AAC, about 8 frames a second on this machine, so roughly a minute of render per 15 seconds of film. The eleven films are 35 minutes in total, so a full `npm run films` is a two-and-a-half to three hour job. It is idempotent: run it whenever, and it renders only what is not already current. Current means the mp4 decodes, has both tracks, and carries the same input digest, which is a hash of the bytes the embed page actually loaded (its HTML, the engine, that film's script, the compiled CSS, and every narration mp3 the film cues). Asking the page what it loaded avoids having to know that `universal-jira` lives in `jira.js` or that the stylesheet is compiled, and it means editing a film, the engine, the CSS or a narration track all re-render exactly the films affected. The `?v=<site.time>` cache buster is stripped from both the URLs and any text body first: it changes on every Jekyll rebuild, and left in it would re-render all eleven films every time, which is the one thing the digest exists to prevent. `--force` overrides. The film list is read from `_pages/embed/*-embed.md` rather than kept in the script, so a new film is one file there and nothing in `scripts/`. A film that fails is deleted and logged rather than killing the run, and the whole thing resumes after an interruption. The launch sets `protocolTimeout: 3600000` and must keep doing so: the audio pass plays the film in real time inside a single `page.evaluate`, and puppeteer's 180s default aborts any call longer than that, which is longer than every scene and shorter than every film. The symptom is a timeout on the first film that says nothing about audio. Note X caps most accounts at 2:20 and every film except the shortest is longer, so a full film needs LinkedIn (which allows 15 minutes) or a `--scene` cut for X.

**The render is a second document, so it drifts.** The mp4 is captured from `/lab/<slug>/embed/` while the visitor watches `/lab/<slug>/`: one engine, two stylesheets, and nothing fails when they diverge. Three divergences have shipped already. The renderer forced `html, body { background: #000 }` on the theory that the film's own edge pixel was black, which came from reading RGB out of `getImageData` and ignoring alpha; the canvas is fully transparent and the grid the stage paints behind it is the film's paper. The embed hid `.labf__chrome` outright, which is right for a small iframe (the band's height is fixed in screen pixels, so it reaches logical y 44 at a 1280px stage but 71 at 800, against the y 46 scenes are authored to clear) and wrong for a 1280px capture, so the rule is width-gated at 1200px. And clips were being posted where whole films were wanted.

`npm run diff:film -- <slug> [t]` is what catches the next one. It renders both documents at one instant, brings them to a common size, and clusters the differing pixels into row bands with their logical y, because a global PSNR scores a 1px text shift and a missing caption band about the same: page-versus-embed sat at 26 dB both before and after the chrome fix, and only the band listing showed what had changed. Two cautions, both learned by getting them wrong. Clip through the element handle (`(await page.$('.labf__stage')).screenshot()`), never a viewport rect read in a previous call: a scroll lands between the two and the clip picks up page above the film, which reads as every element being shifted. And expect a couple of percent of differing pixels even when the two are identical, because the stages are 1242 and 1280 wide and every antialiased edge resamples; what matters is whether a band corresponds to something that is drawn on one and not the other.

For the web, each film also serves `/lab/<slug>/embed/` (chromeless, iframe-able) and `/lab/<slug>/oembed.json`, which makes a pasted link expand into the player on anything that speaks oEmbed.

Keep `_main.js` free of ES `import`/`export` — the bundle is loaded as a classic deferred script. Plotly ships separately via `assets/js/plotly-blocks.js` and is only included when a page contains a plotly fenced block.

## Auditing the site

Four crawlers, all read-only, all honouring `FILM_BASE`. Run them after any
change to a layout, an include, the theme, or the content.

```bash
npm run audit:site        # a11y, metadata, mobile, contrast, light panels, broken links
npm run check:links       # every outbound URL, once
npm run verify:icons      # do the icons the pages draw survive the font subset
npm run build:icon-fonts  # re-cut the icon fonts after adding an icon
```

`audit-site.js` is a crawler rather than a file scan on purpose: half of these
defects only exist in the rendered page, because Liquid decides the meta tags,
the layout decides the heading order, and a relative link is only broken once it
has been resolved against the permalink it ended up at. It found 246 issues
across 76 pages the first time it ran, and almost all of them traced back to
five includes and one config line rather than to individual pages.

Three things it had to be taught, each after reading its own wrong output, and
each worth keeping in mind when adding a check:

- **Ask the right question of the right page.** It asked sitemap.xml for an h1,
  and called eleven `noindex` embed players "missing a share card". A page that
  is not competing in search does not need a canonical.
- **Measure the thing, not its proxy.** Tap targets were measured as boxes, so
  9px scrub dots with a 10px `::after` reach read as too small while genuine
  sentence links read as undersized controls. WCAG's inline exception is about a
  link being *in a sentence*, not about it being in a `<p>`.
- **A check that cries wolf is worse than no check.** An ink-density test for
  text-over-graphics reported 68 findings on a film with none, because a label
  on a filled badge scores like one crossed by a chart line. It was deleted.

`check-external-links.js` learned the same lesson the hard way: only 404 and 410
mean a link is gone. A 403 means the checker was refused, which says more about
the checker than the link (daostack.io answers 200 to curl and 403 to Node's
fetch with identical headers, because Cloudflare fingerprints below the header
level). Refusals are listed for a human to glance at; the exit code is driven
only by what is provably gone.

**Two traps that cost real time here.** Jekyll does not reload `_config.yml`, so
a shortened site description kept measuring at its old length until the server
was restarted. And raw asset sizes are misleading: `main.css` is 197 KB on disk
and 34 KB brotli, which is what GitHub Pages sends, so trimming 525 unused Font
Awesome rules out of it would have saved about 3 KB on the wire. The fonts, at
280 KB uncompressed and uncompressible, were the thing worth cutting.

**Icon fonts are subsetted.** `scripts/subset-icon-fonts.py` scans for
`fa-<name>` tokens, resolves them against Font Awesome's own `_variables.scss`,
and cuts the woff2 to what resolved: 293 KB to 13 KB, plus academicons 66 KB to
2 KB. The upstream files stay beside them as `.full.woff2`. Deriving from source
cannot see a class assembled at runtime, so `verify-icon-subset.js` crawls the
site and asks every icon element for its `::before` content, which is the
codepoint the font is actually being asked for. Run both after adding an icon.

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

**Is the scene animation or a slide?** `npm run sheet -- <slug> [shotsPerScene]` tiles frames from across a film into one image, and `--scene N` does one scene. Scrubbing a film tells you it runs; it does not tell you a scene spent sixty seconds on one picture, because each moment looks fine alone. Side by side that is the first thing you see. It is how universal-jira's middle was found: scene 2 oscillated a dot along a curve for 35s and scene 3 was a contract card held 112.5s against 45s of narration, three consecutive frames identical but for a number. The rebuild is the pattern to copy: show the invariant rather than write it (the pool rectangle's sides change while its area stays 16, which is what x·y=k means), make the thing being explained the *cause* of the thing moving (the price is read off how many tests have passed, so the curve climbing is the work being done), and make the numbers on screen agree with the words in the narration. One caution: the sheet tiles at 0.49 scale, so text that merely sits close reads as colliding. Confirm at full size before fixing.

`npm run audit:stills` measures the same thing across every scene: it seeks in 0.4s steps and compares each frame with the one before, using both a downsampled canvas and the attributes the engine animates on the SVG layer, and separates stillness at the end of a scene (cheap: the scene can be shorter) from stillness in the middle (something has to be drawn). Signatures are excluded, since an end card is meant to hold. **It is blind to small-element motion.** A frame is downsampled to 240x135, so a 7px dot creeping along a curve, a sampled point landing on a scatter, or four digits ticking in a table all fall under both the area and the energy threshold and read as a frozen picture. Two scenes were reported still while visibly animating: model-heist's closing figure counts from 3.54% to 99.78% across the seconds the audit offered to cut, and gradient-pinball's saddle panel is sampling a point every 0.4s. Trust it for whole-picture stalls; check anything it flags by eye before cutting, because acting on it alone removes working scenes.

The pattern that fixed 55 scenes is one idea: **every scene already argues about some quantity, and the fix is to let that quantity move.** Not decoration. A rack of nine hosts each publishing on every frame, so the one binding the frame changes; a histogram whose wobble goes as one over the root of the count, so it settles as the session runs; an overrun counter reaching the three the film quotes; a market that churns between the two trades that carry the argument; a checker walking the sorted steps it says it re-runs; a marker sweeping the condition number so a ratio can be read rather than asserted. Where a scene freezes something that does not freeze in reality (a fleet holding formation, a price between trades, a pipeline between the two runs being narrated), removing the freeze is a few lines and usually takes the scene to near zero.

**Are two labels in the same place?** `npm run audit:overlap` records every piece of text a film draws and compares it pairwise, frame by frame. Canvas text is caught by wrapping `ctx.fillText`, which is the only way to see it since it leaves no node behind; DOM text is measured as ink through a `Range`. It suppresses three things that look like collisions and are not, and each one had to be found by reading its own output: a KaTeX node counted once as `.labf__node` and again as `.katex`, so it overlapped itself by 14000px²; every label of an outgoing scene against every label of the incoming one, which is a dissolve, so samples within 0.9s of a scene start are skipped; and both halves of a deliberate crossfade, where two states of one label sit in the same place with their alphas summing to one.

Seven real collisions were fixed this way, five of them introduced while making scenes move: a counter printed across a column label, a tally inside a row of falling hashes, two chart readouts that ride their own curves and so collided every time the curves crossed, a threshold label that started moving with its threshold and climbed into the note above it. Two were older: a certification stamp at y 24 with the majority formula and two verdict lines stacked on it, and a scene closing with three captions over its own diagram.

**Its blind spot is text over graphics**, and that cost two rounds here. A caption printed inside a chart, across the curve, is not a text-on-text collision and reads as clean. An ink-density check was tried and abandoned: a label deliberately placed on a filled badge scores the same as one accidentally on a chart line, so it reported 68 findings on a film with none. Use `npm run sheet` and look.

Three defects the films acquire silently, all worth re-checking after any edit to a scene's timing or layout:

- **Narration outrunning the beat that draws it.** `npm run audit:films` measures this and prints the sentence responsible. The engine does not cut the audio when a line overruns: it parks film time just short of the boundary until the line finishes (`Film.prototype.play`, the `holdAt` branch), so the symptom is a *stalled picture*, not clipped speech, which is why it survives viewing. Six films were doing it, 19.3s of frozen picture in total, worst 3.7s in one line of cyber-events. The boundary is the next cue as much as the scene end, since a later `lower()` replaces subtitle and narration together. Fix by shortening the line, not by moving it: each scene's visuals are drawn from local time with hard-coded thresholds inside one `s.canvas` call, so a caption pushed two seconds later leaves its subject behind. Where a caption is reading the picture back (cyber-events scene 2 narrated three corpus boxes the canvas already labels), replacing it with what the picture does not say is better than trimming it. Anything under about 0.3s is TTS variance, not authoring: regenerating an untouched line moved one by 0.3s.
- **Labels drawn under the caption panel.** The panel is opaque and starts at y=412 to 461 depending on how many lines the caption wraps to, so anything drawn below that is invisible even though it renders. Measure the panel's real top per scene, not once per film, and *walk ancestors* when testing visibility: inactive scenes are hidden through `.labf__texlayer`, so a node's own computed opacity says every scene's captions are visible at every moment.
- **Frozen tails.** Compare each scene's last visual change against its length. A scene that stops moving with narration still running needs drawing; one that is silent *and* frozen just needs to be shorter. Note that a scene can be silent while still animating, which is fine and often the point.

- **Elements dropped into the chrome band.** The top of every stage is reserved: the chapter counter sits at logical y 12 to 27, the scene subtitle at 30 to 45, the signature at the right. Anything authored above y=52 collides with them. Eleven elements across six films were doing this, the worst by 37px. Sweep for it by seeking in 0.5s steps and flagging any visible node whose top is under 46 while the chapter or subtitle is on.

Two things make that sweep trustworthy, both learned the hard way. Measure **ink, not boxes**: a caption's box carries a lot of line-box slack, and a `Range` over the node's contents gives the real glyph extents. But for KaTeX, range the `.katex-html` child alone, because KaTeX also emits a hidden `.katex-mathml` copy for screen readers whose rects inflate the node by tens of pixels, and because a fraction's glyphs *overflow* its own box by around 13px each way, so the box understates how high it reaches. Getting this wrong in both directions produced false positives and missed a real one in the same pass.

When sweeping `ctx.fillText` for collisions or out-of-stage labels, map each origin through `ctx.getTransform()` (text drawn inside a `translate` lands nowhere near its arguments), skip glyphs of two characters or fewer (decorative hex rain), and read the alpha out of `fillStyle` as well as `globalAlpha`, since a faded label is still drawn.

### Search

Lunr.js client-side search is enabled (`search: true` in `_config.yml`). No external search service.
