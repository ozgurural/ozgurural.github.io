# Lab Films — Repositioning Implementation Spec (for the working agent)

You are implementing an approved repositioning of all 8 animated "cinematic"
explainer films on Dr. Ozgur Ural's portfolio (repo root:
C:\Avion_Git\ozgurural.github.io). GOAL: turn films that read like generic
textbook explainers into ones that carry HIS research + career signature and an
AI-age vision — subtly/indirectly (Machiavellian: never "hire me"), to build
authority for CTO / CEO / Principal-Research-Scientist roles. The math is NOT
the problem; the *framing* is. Read CLAUDE.md first, then this whole file.

The owner has APPROVED: (a) re-theme, no rebuilds, no deletions; (b) rename the
jira "Insider Trading" scene; (c) subtle personal dose — each biographical locus
used exactly ONCE, drones kept abstract (no "Kargu/Togan/kamikaze" on screen).

═══════════════════════════════════════════════════════════════════════════
## 0. PROCESS — violating any of these fails the review
═══════════════════════════════════════════════════════════════════════════
1. **Branch `agent/films-reposition`, then open a PR against `master`. DO NOT
   MERGE, DO NOT PUSH TO master.** Claude reviews and merges. (Last rounds an
   agent self-merged a film broken on page load; and invented a nonexistent
   engine method `s.erase()` that `node --check` passed but crashed the film at
   runtime. Both are why the rules below exist.)
2. **Smoke-load every touched film page in a browser before committing it.**
   `node --check` does NOT catch a call to a nonexistent engine method or a
   runtime throw in scene-build — only a page load does. Confirm
   `window.LabAnim.films.length > 0` and zero console errors on each page.
3. **NEVER invent engine API.** Only use methods that exist in
   assets/js/lab-anim.js: `caption, title, tex2, value, canvas, line, rect,
   poly, plot, vector, axes, dot, group, draw, write, fadeIn, fadeOut, show,
   hide, move, moveAlong, scaleTo, pulse, countUp, morph, stagger, arcPath,
   audio`. There is no erase/wipe/spawn.
4. **DO NOT TOUCH THE REFEREED MATH.** These scenes are correct and must not be
   altered — only their framing text (titles, captions, narration) may change:
   model-heist scenes 2–7 (√k Z-test), proof-of-learning scenes 1–5,
   block-race scenes 2–5 (§11 probabilities), gradient-pinball scenes 2–5
   (GD stability/momentum/saddle math), redundancy-reactor scenes 2–5
   (binomial tail / correlation floor / Ariane). Change equations = fail.
5. **Determinism:** no `Math.random()` / `Date.now()` / `new Date()` in any
   scene canvas callback (a paused frame and a re-seek to the same t must render
   identically). This currently holds — keep it.
6. **LF line endings only.** Verify `file assets/js/lab-films/*.js` says no CRLF.

═══════════════════════════════════════════════════════════════════════════
## 1. NARRATION RULES (read carefully — audio IDs are positional)
═══════════════════════════════════════════════════════════════════════════
- Each `lower(s, "…")` call is voiced by edge-tts. Audio files are named by an
  incrementing counter: `<film-prefix>_<n>.mp3`. So:
  - **Rewriting a `lower()` text IN PLACE is cheap** (re-voices one file).
  - **Adding / removing / reordering `lower()` calls re-indexes every later ID**
    and desyncs all subsequent narration. DO NOT add, remove, or reorder
    `lower()` calls. Keep each film's `lower()` count and order identical;
    only edit the text inside existing calls.
- **Added vision-beat lines must be SILENT captions** (`s.caption(...)` /
  `s.tex2(...)`), NOT new `lower()` calls. This keeps audio IDs stable and adds
  no audio cost. Scene titles, captions, tex2, and `{subtitle:…}` are all silent.
- After editing any `lower()` text, regenerate that film's audio:
  ```
  node scripts/extract-narration.js
  python scripts/generate-narration.py <film-prefix>   # edge-tts installed; voice already set to Andrew
  ```
  Commit the changed `assets/audio/lab/*.mp3` and `scripts/narration.json`.
  Film prefixes: block-race, gradient-pinball, jira, model-heist, oracles,
  proof-of-learning, redundancy-reactor, wm-compare.
- The Signature outro (auto-appended to every film) already prints
  "Dr. Ozgur Ural / PH.D. IN MACHINE LEARNING & TRUSTWORTHY-ML RESEARCHER" plus
  a per-film paper credit from `FILM_CREDITS` (lab-anim.js ~line 1010). Do NOT
  add name/credit cards inside films — that surface is handled.

Line numbers below are PRE-EDIT approximations — confirm by reading the file;
locate by the quoted current text, not the number.

═══════════════════════════════════════════════════════════════════════════
## 2. PER-FILM CHANGES (exact copy — this English text goes on the site)
═══════════════════════════════════════════════════════════════════════════

### model-heist.js  (/lab/model-heist/, page _pages/lab-wm.md)  — RE-THEME
- Scene 1 hook `lower()` (currently "Your model leaks. A competitor fine-tunes
  and claims it. How do you prove ownership when weights change?") → replace with:
  "I once built systems whose whole job was to stop data from ever leaking. But
  prevention always fails eventually. This is the question that begins where
  prevention ends: once your model is out in the world, can you still prove it
  was yours?"  (DLP anchor, no employer named. audio rebuild)
- Scene 4 (ztest, near the `e1` tex2): add SILENT caption by the curves:
  "the matched filter at the core of the author's 2024 watermarking method."
- Scene 7 (stakes) after the existing "Undeniable across all of them" tag: add
  SILENT caption (vision beat):
  "When AI makes the decisions, ownership can't live in the weights — it must
  survive every transformation an adversary can apply. Provenance you can prove
  is the price of trusting a model you never watched being trained."

### proof-of-learning.js  (/lab/training-fingerprint/, page _pages/lab-pol.md)  — RE-THEME
- Scene 1 hook `lower()` ("A trained model is just a big list of numbers…") → :
  "In 2021, Proof-of-Learning promised something remarkable — prove you trained
  a model, not just downloaded it. Within a year, attackers had spoofed it. My
  dissertation asks the harder question: can a proof of work be made impossible
  to fake?"  (audio rebuild)
- Scene 6 `lower()` ("My SecurePoL work adds a second lock…") — tighten to name
  the dissertation in-voice: "This is the core of my dissertation — and the
  SecurePoL paper: a second lock, a hidden mark woven into the model. A faker
  can copy the shape of the curve, but not a mark they never trained in."
  (audio rebuild)
- Scene 7 closing: replace the final `lower()` IN PLACE (vision beat):
  "As models are cloned, distilled, and stolen, what matters is no longer what a
  model knows — but whether it can prove how it came to know it. Compute leaves
  a fingerprint; my work makes that fingerprint impossible to forge."
  (audio rebuild)

### wm-compare.js  (/lab/watermarking-comparison/, page _pages/lab-wm-compare.md)  — RE-THEME (weakest link; do this one well)
- Scene 1 first `lower()` → prepend a first-person design-narrative framing (edit
  in place, keep count): "To make Proof-of-Learning impossible to spoof, I had
  to hide a mark inside a model. There are four ways to do it — and each one
  falls to a different attacker. Here is how I chose."  (audio rebuild)
- Scene 4 title "Non-Intrusive Auxiliary Head" → "The mark you can't prune"
  (SILENT). Add a SILENT in-film cite by the diagram:
  "Ural, Enhancing Proof-of-Learning Security, Ph.D. dissertation, ERAU 2025."
- Scene 4 closing: vision beat, in place of the flat technical last line (audio
  if it's a `lower()`, else silent caption):
  "Every watermark can be attacked. The one that survives isn't hidden in the
  model — it's woven into the record of how the model was made. In the AI age,
  provenance beats possession."
- PAGE _pages/lab-wm-compare.md — the "Scientific Reference" block currently
  cites only Adi et al. (2018) and Kirchenbauer et al. (2023) — add his own
  dissertation ("Enhancing Proof-of-Learning Security Against Spoofing Attacks
  Using Model Watermarking," ERAU 2025) so the page whose winning entry is his
  work doesn't credit only others.

### block-race.js  (/lab/block-race/, page _pages/lab-tg.md)  — RE-THEME (math is the lab's crown jewel — wrapper only)
- Scene 1 narration `lower()` ("Bitcoin has no central judge…") →:
  "Two machines disagree about what happened, and no authority can settle it —
  yet a settlement layer, a fleet of drones, a swarm of AI agents all have to
  act on one history. Nakamoto's answer isn't a judge. It's a race that gets
  exponentially more expensive to rewrite the longer you wait."  (audio rebuild)
- Scene 1 `{subtitle}` ("Consensus is a race, not a vote…") →:
  "Trust with no trusted party: the true history is whatever is most expensive
  to rewrite."  (silent)
- Scene 2 `lower()` ("…Energy buys the probability of being right.") →:
  "Mining is a biased coin flip based on hashrate. Energy is the price of
  rewriting history — and the honest majority just outspends the liar."  (audio)
- Scene 6 `lower()` ("Reversal becomes exponentially improbable…") →:
  "What this really buys is finality with no one in charge — the cost of a lie,
  denominated in energy and time."  (audio)
- Scene 6 `{subtitle}` ("Finality is probabilistic, not absolute.") →:
  "The real question of the autonomous age isn't 'is this true?' but 'what would
  it cost to forge?'"  (silent)
- PAGE _pages/lab-tg.md lead ("Bitcoin's entire security argument is a foot
  race.") → reframe to the trust-primitive thesis (e.g. "Probabilistic finality
  is the first trust primitive that needs no trusted party.").
- Keep the on-stage self-honest approximation caveat ("Satoshi fixes the honest
  window at its mean… slightly understates risk") — it's an authority signal.

### oracles.js  (/lab/oracles/, page _pages/lab-oracles.md)  — RE-THEME (closest to his thesis; drop the weather cliché)
- Scene 1 rename "The Blind Contract" → "The Verdict It Can't Check". Rewrite its
  `lower()` lines IN PLACE (same count) off the rain/weather example onto the
  ML-verdict frame, e.g. lead line:
  "An autonomous system is handed a verdict — 'that's crop damage,' 'that's a
  valid claim,' 'that's a threat.' It didn't run the model. It can't see the
  weights. Should it act? In a world where AI agents consume each other's
  inferences, this is the trust question."  (audio rebuild)
- Weave ONE DLP clause (subtle, one place only — scene 1 or the vision beat):
  "Every trust boundary I've built — a data-leakage classifier deciding what
  crosses, an autonomous system acting on a perception model — comes down to the
  same question: can you act on a verdict you can't re-derive?"
- Scene 2 rigor fix: "compressed into a tiny, undeniable cryptographic fractal
  (π)" → "a short proof π that's cheap to check but impossible to forge — a
  certificate that this exact model produced this exact output." (keep the
  animation; stop calling a SNARK a "fractal")  (audio)
- Scene 3: drop "violently shattered" register; add vision beat (silent caption)
  + a subtle inline survey credit matching block-race's final-scene cite:
  "Intelligence is getting cheap. Verified intelligence is not. The limiting
  reagent for autonomous AI won't be a smarter model — it'll be whether one
  system can trust another's answer without redoing the work."
- Add `{ subtitle: "…" }` to ALL THREE `film.scene(...)` calls (oracles passes
  none → empty scene-chrome + empty a11y live region). One thesis line each.
- PAGE _pages/lab-oracles.md "Scientific Reference" (generic "decentralized
  oracle networks") → reroute through his survey's thesis (verifiable claims
  about ML computation with no trusted party).

### jira.js  (/lab/universal-jira/, page _pages/lab-jira.md)  — RE-THEME AGGRESSIVELY (most off-brand)
- Scene 1 `lower()` lines ("Global engineering requires massive coordination…"
  / "We need a system with no manager. We need math.") → rewrite IN PLACE to the
  Aegean-sailing origin (the standout personal anchor — use it HERE and nowhere
  else): "I learned decentralized coordination on the Aegean — forty boats, no
  race director steering them, order emerging from local decisions and shared
  rules. Software is trying to do the same thing at global scale, with agents
  that never sleep and increasingly aren't human. A single manager is the thing
  that doesn't scale."  (audio rebuild)
- **Scene 3 RENAME (approved): "Work as Insider Trading" → "Skin in the Game".**
  Rewrite its narration (currently "…working as an 'insider' on their own
  success") to incentive-alignment framing — effort moves a price you own, so
  profit is the reward for doing the real work (it is NOT insider trading; it's
  revealed effort). This is a portfolio-judgment fix, not just cosmetic.
- Scene 3 vision beat, replacing "No manager required":
  "Past a certain scale — a million agents, most of them not human —
  coordination stops being a role you can hire for. The only manager that scales
  is a price."  (audio if it's a lower(); else silent)
- Add `{ subtitle }` to jira's scenes (also missing).
- Remove the dead `AMB = PAL.amber || "#FFFF00"` fallback → `AMB = PAL.amber`.
- PAGE _pages/lab-jira.md lead ("humanity's decentralized task board") → reframe
  to incentive-compatible coordination with no trusted central party.

### redundancy-reactor.js  (/lab/redundancy-reactor/, page _pages/lab-tmr.md)  — KEEP + DEEPEN
- Scene 1 rename "Two pilots, one verdict" → "Three computers, one sign-off".
  Add an on-canvas eyebrow (`ctx.fillText`, top of the scene, no new geometry):
  "LEVEL-D FULL-FLIGHT SIM · EASA/FAA CERTIFICATION". Re-voice the hook `lower()`
  ("A single unit might fail…"): "A Level-D simulator is a legally certified
  twin of a real aircraft. Before sign-off, its flight computers must agree — so
  you run three, and let the majority rule."  (audio rebuild)
- Scene 6 (diversity, near the ρ-slider): add ONE silent caption (the single
  abstract defense/drone nod — no program names): "the same discipline that
  stops an autonomous-UAV ground station from voting itself into a crash."
- Scene 6: add a silent vision caption under the existing "Independence is
  engineered, not assumed." tag: "In the AI age we will hand irreversible
  decisions to redundant machines. The only question that matters is whether
  they can all be wrong at once — and that is an engineering answer, not a hope."
- Do NOT touch scenes 2–5 (binomial tail, superlinear, correlation floor,
  Ariane) — refereed.

### gradient-pinball.js  (/lab/gradient-pinball/, page _pages/lab-gd.md)  — RE-THEME (wrapper only; pedagogy untouched)
- THE HONEST BRIDGE: the descent trajectory this film animates IS the object his
  Proof-of-Learning / SecurePoL research certifies. Use that; don't overclaim.
- ENGINE CREDIT: in assets/js/lab-anim.js, `FILM_CREDITS["gd-film"]` (currently
  "cf. Ural · Enhancing Proof-of-Learning Security · Ph.D. dissertation, ERAU
  2025") → "Based on: Ural &amp; Yoshigoe · SecurePoL · IEEE Access 2025"
  (short — the credit is styled `white-space:nowrap`; keep it one line).
- Scene 1 hook `lower()` ("Networks learn by rolling downhill…") →:
  "Every trained model is the end of a journey down a landscape like this. Walk
  the journey and you have a model — reproduce the journey and you have a proof
  it was really trained."  (audio rebuild)
- Scene 6 (saddles) add TWO silent captions: adversarial aside (~lt 12): "a
  landscape no one can fully see is exactly what an attacker hides in — and a
  verifier must pin down."; vision beat (~lt 22): "In a world where anyone can
  descend, trust no longer comes from the model. It comes from proving how the
  model got there."
- Do NOT touch scenes 2–5 equations/trajectories.

═══════════════════════════════════════════════════════════════════════════
## 3. CROSS-CUTTING FIXES (batch with the above)
═══════════════════════════════════════════════════════════════════════════
- **Legend color mismatches** (blockchain cluster never got the fix the others
  did — page chips must match the film's real palette, and update the legend
  `<p>` aria-label color words too):
  - _pages/lab-tg.md: honest `#38bdf8`→`#58C4DD`, attacker `#ec4899`→`#9A72AC`,
    payment `#34d399`→`#83C167`.
  - _pages/lab-jira.md: curve `#3b82f6`→`#58C4DD`, effort `#34d399`→`#83C167`,
    oracle `#a78bfa`→`#9A72AC`.
  - _pages/lab-oracles.md legend is already correct — use it as the template.
- **Missing `{subtitle}`** on oracles + jira scenes (added above).
- **Dead `#FFFF00`** fallback in jira.js line ~15 (removed above).

═══════════════════════════════════════════════════════════════════════════
## 4. VERIFICATION (run for every touched film, both widths)
═══════════════════════════════════════════════════════════════════════════
Serve: `bundle exec jekyll serve --port 4000 --force_polling` (PowerShell,
prepend `C:\Ruby33-x64\bin` to PATH; ruby does not run from Git Bash). Load each
film page at desktop AND a fresh load at 375px. In the page console run the sweep
(expect `total:0`, `seekErr:null`, `reg:1`): seek `film.seek(t)` every 0.4s over
`film.duration`, collect visible `.labf__node` rects (walk ancestors for
display/visibility/opacity>0.85), flag rects outside the `.labf__stage` ±6px and
non-`.labf__lower` text overlaps >10x8px persisting ≥2 samples. Also: confirm
`window.LabAnim.films.length>0` on every page; `read console errors` empty;
canvas-determinism (`canvas.toDataURL()` identical on two seeks to the same t);
if you touched anything near an `axes()` scene, confirm its axis/grid `<line>`s
have effective opacity >0.3 while that scene is active. Finally
`bundle exec jekyll build` must exit 0.

═══════════════════════════════════════════════════════════════════════════
## 5. PR REQUIREMENTS  (open the PR; DO NOT MERGE)
═══════════════════════════════════════════════════════════════════════════
PR description must include, per touched film: what changed; the sweep JSON at
1280px and 375px (total:0, seekErr:null); `films.length>0` confirmed; console
clean. Plus: list every `lower()` text changed and confirm the mp3s were
regenerated + committed; confirm no `lower()` calls were added/removed/reordered
(IDs stable); `grep -rn "Math.random\|Date.now\|new Date" assets/js/lab-films/`
shows only pre-existing audio-reverb use, none in canvas callbacks; no file
became CRLF; `jekyll build` exit 0; confirm you did NOT touch any refereed-math
scene. Delete this LAB_FILMS_REPOSITION.md in your final commit.

On review Claude will: diff everything, re-run the sweep on all 8 films at both
widths, smoke-load every page (the s.erase()-class failure), step across every
new caption/vision-beat for un-eased pops and canvas/DOM collisions the sweep
can't see, confirm changed narration has regenerated audio, verify the page
legends now match the films, and check the copy reads as HIS voice (subtle, not
salesy). Make the review boring.
