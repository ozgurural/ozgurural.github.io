# Lab Films — Round 3 To-Do (for the working agent)

You are continuing the "bring all 8 lab films to 3Blue1Brown quality" effort on
`ozgurural.github.io` (a Jekyll academic portfolio). This document is
self-contained. Read `CLAUDE.md` first for repo doctrine, then this whole file
before touching anything.

═══════════════════════════════════════════════════════════════════════════
## 0. PROCESS — READ FIRST. Violating any of these fails the whole review.
═══════════════════════════════════════════════════════════════════════════

1. **Branch, then open a Merge Request / PR. DO NOT MERGE. DO NOT PUSH TO
   `master`.** Your final deliverable is a PR against `master` that a reviewer
   (Claude) will read, test, and merge. If you merge it yourself the review
   cannot happen and the work will be reverted. (Last round an agent
   self-merged a film that was broken on page load and it shipped to
   production. That is the exact failure this rule prevents.)
   - Branch name: `agent/films-r3`
   - One commit per logical task block, descriptive messages.
   - The PR description must follow the template in section 5.

2. **Every lab film you touch MUST be smoke-loaded in a real browser before you
   commit it.** `node --check` only catches syntax; it does NOT catch calling
   an engine method that doesn't exist (e.g. `s.erase()`), which throws at
   scene-build time and makes the ENTIRE film fail to register — a blank box in
   production. After editing a film, load its page and confirm
   `window.LabAnim.films.length > 0` and the film's `duration`/`scenes` look
   right, and that the console has zero errors. See the harness in section 3.

3. **Determinism is law.** Every rendered frame must be a pure function of the
   film clock. NO `Math.random()` and NO `Date.now()`/`new Date()` inside any
   scene `canvas()` callback or cue. Derive pseudo-randomness from `lt`:
   `var r = Math.sin(Math.floor(lt*24) * 127.1) * 43758.5453; r -= Math.floor(r);`
   A paused frame and a re-seek to the same t must render identically. Anything
   that writes DOM/attributes outside the reset/commit state machine (e.g.
   `el.setAttribute('fill', …)` in a cue) must be written so that scrubbing
   BACKWARDS restores the earlier state — make the cue span from t=0 and
   compute the value from the eased local progress, don't start the cue late.

4. **LF line endings only.** Do not let an editor rewrite files to CRLF. Verify
   with `file assets/js/lab-films/*.js` — none should say "CRLF".

5. **Narration is generated, not hand-written into audio.** If you change ANY
   `lower(s, "…")` text in a film, you MUST regenerate that film's audio:
   ```
   node scripts/extract-narration.js
   python scripts/generate-narration.py <film-prefix>   # edge-tts is installed
   ```
   and commit the changed `assets/audio/lab/*.mp3` plus `scripts/narration.json`.
   Film prefixes: block-race, gradient-pinball, jira, model-heist, oracles,
   proof-of-learning, redundancy-reactor, wm-compare. Voice is
   `en-US-AndrewMultilingualNeural` at -5% (already set in the script — do not
   change it).

6. **Never invent engine API.** The engine is `assets/js/lab-anim.js`. Before
   using any `s.<method>()` or `film.<method>()`, confirm it exists there.
   Available scene primitives include: `caption, title, tex2, value, canvas,
   line, rect, poly, plot, vector, axes, dot, group, draw, write, fadeIn,
   fadeOut, show, hide, move, moveAlong, scaleTo, pulse, countUp, morph, audio`.
   There is NO `erase`, no `wipe`, no `spawn`. `countUp` is scrub-safe (routes
   text through `st.html`); `morph(a,b)` captures from-state before mutating.

═══════════════════════════════════════════════════════════════════════════
## 1. WHAT IS ALREADY DONE — do not redo, do not "improve" without cause
═══════════════════════════════════════════════════════════════════════════

- `gradient-pinball.js`: full 19-finding quality pass. Clean.
- Engine `lab-anim.js`: 14-fix batch (keyboard defer, scrub Home/End/PageUp/Dn,
  scrub-safe `countUp` via `st.html`, `morph` from-state capture, canvas-layer
  crossfade at scene boundaries, rAF dt clamp 100ms, narration-hold 4s stall
  release, hidden-container fit-on-intersection, edge-triggered outro stinger,
  subtitle exposed as `role=status aria-live=polite`, `aria-pressed` on mute,
  palette de-alias `indigo #6D7CDE` + real `amber #FBBF24`, Signature outro
  positions from `film.W/H`, dead code removed). Clean.
- Generative music: chord progressions + phrase structure + sub-bass +
  phrase-end rests + stereo + octave shimmer + slow master breath. Clean.
- Narration: all clips regenerated with the Andrew voice.
- `model-heist.js`, `block-race.js`, `jira.js`: full fix passes + big cinematic
  set-pieces (block-race §11 sum assembly, curve-riding dots; model-heist
  conservation-of-ink bar, sweeping ROC, count-up finale, gold-dot bookend;
  jira engine-primitive AMM rebuild, match-cut, payout loop). Reviewed & clean.
- All 8 films: geometry-swept clean at 1280px AND 375px (0 out-of-stage, 0 text
  overlaps) as of commit `63b36de`, console clean, `jekyll build` exit 0.

═══════════════════════════════════════════════════════════════════════════
## 2. THE VERIFICATION HARNESS — run for EVERY film you touch
═══════════════════════════════════════════════════════════════════════════

Dev server: `bundle exec jekyll serve --port 4000 --force_polling` (PowerShell,
prepend `C:\Ruby33-x64\bin` to PATH; ruby does NOT run from Git Bash on this
box). Or, if you have the Browser/preview tooling, `preview_start {name:"jekyll"}`.

For each touched film, load its page (section 4 has the URL map) and run this in
the page console. Expect `total: 0` and `seekErr: null`. Run once at desktop
width and once after a FRESH load at 375px (mobile scaling differs).

```js
(() => {
  const films = (window.LabAnim && window.LabAnim.films) || [];
  if (!films.length) return JSON.stringify({FATAL:'film did not register — build threw'});
  const f = films[0], stage = document.querySelector('.labf__stage'), root = stage.parentElement;
  const vis = el => { for (let n=el;n&&n!==root;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden')return 0;} return 1; };
  const opA = el => { let o=1; for(let n=el;n&&n!==root;n=n.parentElement)o*=parseFloat(getComputedStyle(n).opacity||1); return o; };
  const ev={}, rec=(k,t)=>{const e=ev[k]||(ev[k]={n:0,t0:t});e.n++;e.t1=t;};
  let seekErr=null;
  try { for (let t=0.05;t<f.duration;t+=0.4){ f.seek(t);
    const SR=stage.getBoundingClientRect();
    const R=[...stage.querySelectorAll('.labf__node')].filter(el=>vis(el)&&opA(el)>0.85&&(el.textContent||'').trim()).map(el=>({el,r:el.getBoundingClientRect()}));
    for(const {el,r} of R){ if(r.width===0)continue;
      if(r.left<SR.left-6||r.right>SR.right+6||r.top<SR.top-6||r.bottom>SR.bottom+6) rec('OUT|'+el.textContent.trim().slice(0,22),t); }
    for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){ const a=R[i],b=R[j];
      if(a.el.contains(b.el)||b.el.contains(a.el))continue;
      if(!!a.el.closest('.labf__lower')!==!!b.el.closest('.labf__lower'))continue;
      const ix=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left), iy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);
      if(ix>10&&iy>8) rec('OVR|'+a.el.textContent.trim().slice(0,15)+'<->'+b.el.textContent.trim().slice(0,15),t); }
  } } catch(e){ seekErr=String(e); }
  f.seek(0);
  return JSON.stringify({dur:Math.round(f.duration), seekErr, defects:Object.entries(ev).filter(([k,e])=>e.n>=2).map(([k,e])=>({k,t:e.t0.toFixed(1)+'-'+e.t1.toFixed(1)})), total:Object.values(ev).filter(e=>e.n>=2).length});
})()
```

CAVEAT the sweep CANNOT catch (you must check these by hand):
- **Canvas-drawn text/bars are invisible to this sweep** (it only measures DOM
  `.labf__node`s). When you move or resize anything drawn via `ctx.fillText` /
  `ctx.fillRect`, compute its pixel extent yourself and make sure it doesn't
  collide with DOM captions/equations.
- **Binary/un-eased pops**: seek across a suspected transition in 0.1s steps and
  read the element's computed opacity/geometry; a jump from 0→1 or 0.4→1 in one
  step is a defect. Everything should ease.
- **Scrub reversibility**: seek forward past a `countUp`/`move`/attribute cue,
  then seek back before it; the on-screen value/position/color must return to
  its initial state.

Also: `read console messages, errors only` must be empty on every page.

═══════════════════════════════════════════════════════════════════════════
## 3. TASK GROUP A (PRIMARY) — deep-review the 4 never-deeply-reviewed films
═══════════════════════════════════════════════════════════════════════════

These four got only a light pass last round (Math.random removal + easing some
binary pops). They have NEVER had a line-by-line 3b1b review. This is the main
job. Film → page URL → source file → id:

| Film source                         | Page URL                          | id              |
|-------------------------------------|-----------------------------------|-----------------|
| assets/js/lab-films/oracles.js      | /lab/oracles/                     | oracles-film    |
| assets/js/lab-films/proof-of-learning.js | /lab/training-fingerprint/   | pol-film        |
| assets/js/lab-films/redundancy-reactor.js | /lab/redundancy-reactor/    | tmr-film        |
| assets/js/lab-films/wm-compare.js   | /lab/watermarking-comparison/     | wm-compare-film |

For EACH film: read the whole source, then review every scene against this
rubric and fix what you find (concrete defects only — no taste rewrites):

**MOTION** — no un-eased binary alpha (`lt > X ? 1 : 0`) or single-frame state
swaps; entrances AND exits animated; `Math.random()` in a canvas callback is a
determinism defect; a `moveAlong`/`move` should ease, not jump.

**ATTENTION** — one idea on screen at a time; when focus moves, the previous
element should dim (`fadeOut` to ~0.3–0.4), not stay at full brightness; never
more than ~3 things entering at the same instant (stagger with `at: base + i*0.08`).

**PACING** — no static stretch > ~2.5s while narration is silent (seek through
and watch for "nothing changes"); nothing lands 3-at-once on the same frame;
scene durations should match their content (a 21s scene whose last event is at
8s has 13s of dead air — pull events later or shorten).

**PRECISION** — verify every on-screen number, formula, axis label, and counter
against the actual math. Cross-check each `lower()` narration string against the
film's host `_pages/lab-*.md` "What did you just learn?" text — where they
disagree the PAGE is usually right (fix the film, and regenerate audio).

**CONTINUITY / COLOR** — recurring objects keep geometry+color across scenes;
use the film's own palette constants, no one-off hexes; and **the page legend
chips must match the film's actual colors** (see the concrete mismatch below).

### A-known-1 (CONCRETE, verified): page legend colors ≠ film colors.
The `_pages/lab-*.md` colour-key chips were authored with a different palette
than the films actually draw. Reconcile each — change the chip hex to the
film's real color (or vice-versa if the film's is the off-one). Measured today:
- `_pages/lab-oracles.md` chips: `#34d399 #3b82f6 #fb7185 #fbbf24` — but
  oracles.js draws cyan `#58C4DD`, green `#83C167`, violet `#9A72AC`, rose
  `#FC6255`, yellow `#FFFF00`. Blue `#3b82f6` and emerald `#34d399` are not in
  the film. Align them.
- `_pages/lab-tmr.md` chips: `#36d6e7 #ec4899 #f0a000 #fb7185` vs the film's
  actual colors — reconcile.
- `_pages/lab-pol.md` and `_pages/lab-wm-compare.md`: same audit; make chips and
  film agree, and make sure the `aria-label` colour description on the legend
  `<p>` matches too.

### A-known-2 (CONCRETE): stray pure-yellow `#FFFF00`.
`oracles.js` and `redundancy-reactor.js` still contain literal `#FFFF00`, which
vibrates on the dark surface. The engine palette's real amber is `#FBBF24`
(`window.LabAnim.palette.amber`). Replace pure-yellow accents with `#FBBF24`
(match whatever role they play; keep genuinely-white text white).

### A-known-3: prefer engine palette constants.
Where a film hardcodes `"#58C4DD"` etc., switching to
`var PAL = window.LabAnim.palette; var CY = PAL.sky;` is fine and encouraged
(gradient-pinball/model-heist already do this) — but ONLY if you re-verify the
film renders identically after.

Deliver one commit per film: `A: <film> deep review — <one-line what changed>`.

═══════════════════════════════════════════════════════════════════════════
## 4. TASK GROUP B (SECONDARY) — engine cinematic primitives
═══════════════════════════════════════════════════════════════════════════

Only start these after Group A is solid. These touch `lab-anim.js`, which every
film depends on, so re-run the harness on ALL 8 films after any engine change
(a regression here breaks everything). Each is its own commit.

**B1 — `stagger()` helper + stagger-reveal for group `draw()`.** Currently
`draw()` on a group handle (axes, vector — anything with no single stroke path)
falls back to a full-duration opacity fade. Add a first-class
`Scene.prototype.stagger(handles, {at, dur, lag, ease})` that lags each handle's
entrance by `lag` (in seconds or as a fraction of dur), and optionally have
`axes()` expose its child lines/ticks so they can be staggered on reveal. Keep
the old `draw(group)` behavior working for callers that don't opt in.

**B2 — make `morph()` a true ReplacementTransform.** Today `morph(a,b)`
crossfades in place while nudging scale. Upgrade it to also translate+scale A's
bounding box onto B's box during the crossfade (compute both boxes at cue time
via `getBBox()` for SVG / `getBoundingClientRect()` mapped to stage coords for
HTML), so A visibly becomes B in B's location. Must stay scrub-safe and must not
regress the existing in-place callers (jira/model-heist use `morph`) — if a
true transform is risky for HTML/KaTeX handles, gate the translate on a
`{replace:true}` opt-in and leave the default as the current crossfade.

**B3 — promote `pathOfArc` into the engine.** The screen-space arc-length path
parameterization currently lives as a film-local helper (duplicated in
gradient-pinball.js and block-race.js). Add it to the engine (e.g.
`film.arcPath(points, coords)` or as an option on `moveAlong`,
`{arcLength:true}`) so a `moveAlong` dot stays locked to a dash-reveal `draw()`
tip by construction. Then de-duplicate the two film-local copies to use it.
Verify the lockstep numerically on gradient-pinball scene 2 (dot rect center vs
`path.getPointAtLength(len*(1-dashoffset/len))` ≈ 0px).

═══════════════════════════════════════════════════════════════════════════
## 5. PR / MERGE-REQUEST REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════

Open ONE PR from `agent/films-r3` → `master`. Do not merge it. The description
must contain, per touched film/engine:

- **What changed** (bullet list, grouped by file).
- **Harness results**: for every touched film, paste the sweep JSON at BOTH
  1280px and 375px (must show `total: 0`, `seekErr: null`), and confirm
  `window.LabAnim.films.length > 0` on each (proves it registered).
- **Console**: "0 errors on all touched pages."
- **Determinism**: confirm no new `Math.random()`/`Date.now()` in canvas
  callbacks (`grep -rn "Math.random\|Date.now\|new Date" assets/js/lab-films/`).
- **Narration**: list any `lower()` texts you changed and confirm the matching
  mp3s were regenerated and committed (or state "no narration changed").
- **Build**: `bundle exec jekyll build` exit code (must be 0).
- **Line endings**: confirm no file became CRLF.
- Note anything you deliberately did NOT do and why.

Delete this `LAB_FILMS_TODO.md` file in your final commit.

═══════════════════════════════════════════════════════════════════════════
## 6. WHAT THE REVIEWER (me) WILL CHECK — so you can pre-empt it
═══════════════════════════════════════════════════════════════════════════

On review I will: diff every file (`git diff master...agent/films-r3`,
`--ignore-all-space` to separate real changes from reformatting); re-run the
harness myself on all 8 films at both widths; smoke-load every page to confirm
each film registers (the `s.erase()`-class failure); step across every
transition you added looking for un-eased pops and canvas/DOM collisions the
sweep can't see; verify scrub-reversibility on any new `countUp`/attribute cue;
check that changed narration has regenerated audio; confirm the page legends now
match the films; run `jekyll build`. Findings get fixed on the branch, then I
merge with `--no-ff`, push, delete the branch, and verify the live site after
Pages redeploys. Make my job boring.
