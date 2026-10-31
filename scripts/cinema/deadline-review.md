# Deadline rebuild, 31 October 2026

The film argues: **Let AI think. Keep the machine on time.** The first
picture is a wheeled robot approaching a box. It crosses its stopping line
before the AI's braking answer arrives. This is a schematic illustration,
not a model of a real vehicle or a reconstruction of an incident.

## Story and claim ledger

| Authored time | Picture and claim | Evidence inspected | Conditions and limits |
| --- | --- | --- | --- |
| 0 to 13.2 s | Late braking answer; thesis within ten seconds | `scripts/narration.json`, `determinism[0,3]` | Original illustration. Chosen positions and easing, no measured braking distance. |
| 13.2 to 24 s | Macro controller clock; waiting misses a command | `determinism[1,3]`; `lab-deadline-model.js`, `startD`, `wait`, `endDirect` | Visible beat slowed for explanation; no real-time rate inferred from film seconds. |
| 24 to 34.2 s | Three glass inference chambers; two quick answers, one slow | `determinism[1,2]`; model's synthetic `latency` rule | Three chosen examples, not a latency distribution or an empirical claim. |
| 34.2 to 44.5 s | AI beside a clock; finished answer handed to a shelf | `determinism[4,5]`; model's `events`, `plan`, `endAsync` | Nonblocking handoff assumes adequate controller resources. Shared hardware is addressed later. |
| 44.5 to 55 s | Frozen observation beside current world; box moves into path | `determinism[6]`; lab page's admission and context explanation | A finished answer can be stale. The illustration does not implement state estimation or trajectory prediction. |
| 55 to 63.8 s | Age dial drains while an observation is processed; expired on arrival | `determinism[7]`; model's `age = startA - plan.at` | Age starts at observation, not completion. No universal freshness threshold is proposed. |
| 63.8 to 73.7 s | Same robot brakes before the line using a backup | `determinism[7,8,11]`; lab page's baseline caveat | Illustrative backup only. Voice explicitly requires checking it for the actual machine. Timing alone does not establish safety. |
| 73.7 to 85 s | Crowded shared chip; a candidate controller island separates | `determinism[9,10]`; model's `interference` added to both paths | Separate code is insufficient isolation. The boundary is labelled "isolation to test", with a question, not a proof stamp. |
| 85 to 98 s | Thesis returns; unpublished direction and author card | Owner brief; `AUTHOR` in `engine.js` | No author name in speech, no new publication, deployment, measurement or safety guarantee. |

## Editorial decisions

The concrete failure comes before clocks or architecture. Removing the wait
then creates a second, different problem: using an answer about an old world.
That distinction earns the observation-age check. The final shared-chip
question prevents the film from implying that two processes prove timing.
The established action-limit guard is left to the lab page rather than adding
another mechanism to the voice.

Each chapter is an independently composed set with a slow dolly. Three
deliberate result handoffs replace the old conveyor stream. Main headlines
are 82 px and essential tags 62 px in a 1920-wide frame. Captions are on by
default; only the two thesis lines are skipped because their complete speech
is already printed in large type. The frame remains 16:9; a future feed
export uses `cinema-vertical.js`, with `--skip rule,close`.

## Verification

Use the existing server on port 4001, with both `FILM_BASE` and
`FILM_BASE_URL` set to `http://localhost:4001`. Do not start another Jekyll
process or run a manual build against its output.

The regenerated timeline is 98.35 s. The licensed series track swells on
`rule` at 7.65 s, jumps forward eight bars (80.311 to 102.904 s in track
time) under `stamp` at film 57.96 s, and its own last note dies at 96.02 s.
The closing speech ends at 89.15 s and the author card starts at 91.35 s.

Review images and temporary review tools are in
`%TEMP%/deadline-codex-review/`, with the final captioned 15-frame contact
sheet at `contact-final.png` and a 375-pixel-wide sample at
`phone-width-375.png`.

Completed checks:

- `npm run check:cinema -- deadline`: every spoken line retains its scene text.
- `npm run test:cinema-playback`: player audio races, controls, captions and mobile fullscreen pass.
- `node scripts/cinema-memory.js deadline 0 98.35`: 30 fps phone sweep completes; 88 buffers at the opening, 447 after all nine sets have loaded, identical before and after GC. Geometry reaches 133, textures stay at 14, programs at 16, JS heap approximately 10 to 12 MB. Growth is on first use of a set, not per frame.
- `node scripts/test-cinema-deadline.js`: voice parity, illustration outcomes, ink bounds, geometry reuse and pixel-identical backward seeking pass.
- JavaScript syntax, `git diff --check` and the requested em-dash scan pass.
- `silencedetect` at -50 dB for 0.5 s finds no internal gap; the only silence is the intended final 96.02 to 98.35 s.
- Sampled real-time playback at a 375 x 812 phone viewport covers the opening, changing world, backup stop and chip separation. Twenty timed captures and their positions are in `motion/`, with `phone-playback.png` as a temporal contact sheet. Playback advances, the late robot crosses the line, the backup robot stops before it, and only the live world's box moves. This is a sampled visual review, not an end-to-end listening review of the mix.

`test-cinema-deadline.js` verifies the visible late crossing and backup stop,
frozen versus changed observations, expiry, the independently moving clock,
text bounds and identical frames after backward seeking. These are tests of
the authored illustration, not validation of physical safety or a timing proof.

No full MP4 export is part of this handoff. No existing 16:9 MP4 was found,
so phone readability is reviewed from scaled 16:9 stills and sampled playback,
not claimed as verification of a new 9:16 delivery file. Audience retention,
engagement and hiring responses remain unmeasured.
