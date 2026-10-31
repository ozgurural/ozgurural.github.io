# Brief: rebuild the "AI meets the deadline" film

Handoff brief, 2026-10-31. Written for an agent (Codex, Qoder or another)
taking over this film. Claude will review the result before it is merged.
Read `CLAUDE.md` first (house rules, cinema section) and
`scripts/cinema-storytelling-runbook.md`. Work on a branch (for example
`codex/deadline-film`), not on master.

## The goal, above everything else

The owner's goal, in his words (2026-10-31): the version that makes people
watch it through and earns the most LinkedIn engagement; hiring managers and
research leads at AI labs should think "wow" and message him. Everything else
in this brief serves that goal, and **anything may change for it**: the
concept, the story, the metaphor, the scenes, the length, the narration, the
title, the visual language. Earlier cuts and the suggestions below are not
binding. The only fixed things are scientific correctness and the house
rules in `CLAUDE.md` (no em-dashes, no invented claims or measurements, the
research direction labelled as unpublished, no decorative glitch effects).

What tends to work for that audience, as a starting point, not a rule:

- **The first two or three seconds decide whether anyone watches.** Open on
  motion and a striking image, with the problem visible before a word is
  needed. LinkedIn autoplays muted; the frame and burned-in captions must
  carry it alone.
- **A sharp, slightly surprising claim** a research lead would repeat, not a
  lecture. The film should make the author look like someone who thinks
  clearly about putting AI into real machines (physical AI and robot
  foundation models are a current topic), without hype or fear-mongering.
- **Spectacle in service of the idea.** The Level D film is the visual bar.
- **Short enough to finish.** Probably 60 to 100 seconds; the owner allows
  up to about two minutes if it holds attention.
- **An ending that invites a reply**: the open problem, stated so that an
  expert wants to comment.
- There is no guarantee of likes; judge it by whether a busy hiring manager
  would watch to the end and remember the author.

## What the film must achieve

The owner, Dr. Ozgur Ural, wants a roughly two-minute narrated film that he
can post on LinkedIn (phone, 9:16 cut, muted autoplay with burned-in captions).
It should show the judgement of a principal research scientist without
claiming that title. In his words:

- **Plain telling, rich pictures.** "Simple" means an average viewer follows
  the narration easily. It does **not** mean simple animation. The visual
  standard is the Level D film (`/films/level-d/`, `assets/js/cinema/level-d*.js`):
  a visual feast, cinematic, a benchmark for animation.
- **The problem must be obvious.** The viewer must know within ten seconds
  what goes wrong, why it matters, and what is being solved.
- **A viewer who does not follow should keep watching for the animation.**
- **Readable on a phone.** Large subjects, large labels, nothing important
  smaller than it can be read in a 1080x1920 feed cut.
- **Not tiring.** No fast, repetitive streams of objects. Motion should be
  purposeful and easy on the eye.
- **Several scenes, not one set.** Each scene its own picture.
- **About two minutes**, a little longer is acceptable.
- **No self-promotion in the voice.** Naming the author in the narration
  ("Dr. Ozgur Ural's proposal") read as tacky. His name belongs on the end
  card (`AUTHOR` in `engine.js`).

## The research content (keep it correct)

The film is the owner's open research direction, not a published paper, and
must say so (the end card is enough). The source of truth is the old lab
film (`scripts/narration.json`, keys `determinism*`), the interactive page
`_pages/lab-determinism.md` and `assets/js/lab-deadline-model.js`.

The idea, in plain words:

1. AI models are starting to control physical machines (robots, vehicles,
   drones, simulators).
2. A machine's controller must act on a fixed beat, every time. A missed
   beat is a failure, however good the eventual answer.
3. An AI model's answer time varies. Most answers are quick; some are much
   slower, and you cannot know in advance which.
4. If the controller waits for the AI, slow answers make it miss beats.
5. Fix: the controller never waits. The AI works beside it; the controller
   uses the latest finished answer.
6. New failure: the latest answer can be old, describing a world that has
   already moved.
7. Fix: every answer carries the time it was made; too old, and the
   controller sets it aside and takes a simple safe action.
8. Optionally (the earlier cuts had these, the owner did not object to them,
   but they add length): a simple guard checks every command against hard
   limits (the Simplex pattern, L. Sha, IEEE Software 2001); and running the
   AI and the controller on one shared chip can still steal the controller's
   time, so isolate them and test under load.
9. The open problem: doing this for today's large models, and proving the
   timing holds.

Do not claim measurements; the timing shown is schematic. Do not cite
anything you have not checked.

## What was tried and why it failed

All four are in git history; watch them with `npm run sheet` or by checking
out the commit.

| Commit | Cut | Owner's verdict |
| --- | --- | --- |
| `2bd88bc` | The 6 October film restored: one glowing ring and one model in the same place for all ten scenes. | Animations repeat; every scene should be its own picture. |
| `5fa7de5`, `ce8569b` | 3D world: robot arm, conveyor of beat tiles, model, a set piece per scene, moving camera, thesis "Let the AI advise. Never let it hold the clock." | Too complicated; the message is unclear; the author's name in the voice is tacky; animations do not serve the narration. |
| `22e8f66` | Flat 2D, 3Blue1Brown-like timeline: a hand under a moving ball, two lanes of time. | Much worse. "Simple" was meant for the telling, not the pictures. |
| `3b9f50a` (current) | The 2D cut's narration in the 3D world: an arm keeping its gripper over a sliding part. | Not good on mobile; still unclear what the problem is and what is solved; animations feel static; it is just one arm; the beat tiles arrive too fast and tire the eye; there could have been other scenes. |

The common thread: the abstraction (beats, tiles, sparks, mailboxes) asked
the viewer to decode symbols before they could see the problem. The next cut
should make the stakes visible in a situation anyone recognises first, and
introduce abstract pictures only where they explain something the concrete
scene cannot.

## Direction (a suggestion, not a script)

These are ideas; the agent owns the film and should decide.

- Open on a concrete, recognisable machine whose late action has visible
  consequences, so the problem needs no explanation (for example a robot
  catching or placing objects, a delivery drone landing, a car braking in a
  test, a flight simulator; avoid gore or fear-mongering, and do not imply a
  real incident happened).
- Show the AI's variable thinking time in a way a non-expert reads at once
  (a visible "thinking" countdown or progress glow on the AI, compared with
  the machine's steady heartbeat), at a calm pace.
- Give each step of the argument its own scene and camera, as Level D does
  with its chapters, and keep one visual language across them.
- End on the open problem, stated honestly, and on a short memorable line.

## Constraints (from CLAUDE.md, non-negotiable)

- No em-dashes in anything a visitor can read (narration, captions, on-screen
  text). `grep -n '—' assets/js/cinema/deadline.js scripts/cinema/deadline.voice.json` must be empty.
- No AI-tell phrasing; no invented results; label the research direction.
- 16:9 film; the phone cut comes from `scripts/cinema-vertical.js`.
- `seek(t)` must stay a pure function of t; no per-frame GPU allocations
  (use `setLinePoints`); check with `scripts/cinema-memory.js`.
- Narration lives in `scripts/cinema/deadline.voice.json` (voice
  `edge:en-GB-RyanNeural`, rate `+6%`); `npm run voice:cinema -- deadline`
  builds the timeline and soundtrack. The `T` table in the film must match the
  `at` values.
- Music: `dist/music/mixkit-587-discover.mp3` (the only licensed track the
  owner accepts at present; the trip-hop track was rejected). Its own piano
  ending must land on the last scene: read "last note dies at" after every
  voice build and adjust `rise_on` or `loops` (see the Music notes in
  CLAUDE.md and `scripts/music-map.py`). Downloading a new track needs the
  owner's approval.
- Captions are on by default in the player (`captionsFromTimeline`); skip
  lines already printed in large type.
- No decorative glitch or distortion effects (runbook).
- Do not name or hint at films that inspired it.
- Keep `_pages/lab-determinism.md` consistent with what the film says.

## How to check your work

Serve on port 4001 (`preview_start` `jekyll-4001`, or
`bundle exec jekyll serve --port 4001 --config _config.yml,_config.dev4001.yml`)
and set `FILM_BASE_URL=http://localhost:4001`.

```bash
npm run check:cinema -- deadline          # every line ends over its words
npm run test:cinema-playback              # player behaviour
node scripts/cinema-memory.js deadline 0 120
node scripts/render-cinema.js --film deadline --aspect 16x9 --frames 3,10,20,40 --out <dir> --captions
node scripts/cinema-vertical.js --film deadline --video <16x9 narrated mp4> --skip <ids> --still 20
```

Review a contact sheet of stills **and** watch it moving at phone size before
calling it done. Technical checks passing does not mean the film works.

## Acceptance

- A person who knows nothing about real-time systems can say, after one
  viewing, what goes wrong and what the fix is.
- Every scene is a different picture with purposeful motion; nothing fast
  and repetitive.
- Readable in the 9:16 phone cut.
- Checks above pass; music ending lands; no em-dashes; research claims
  match the sources.
- Leave a short note in the commit message of what you changed and why, and
  update the Deadline paragraph in CLAUDE.md.
