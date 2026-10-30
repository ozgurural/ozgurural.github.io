# Deadline: Matrix narrative and new score

This supersedes the creative direction of the 30 October review. The owner
rejected that delivery because technical/mobile improvements had substituted
for the requested narrative, animation and music change. Baseline is `0bccbcc`.
Only Deadline is in scope.

## Narrative and animation

Central question: a model can know a route while lacking control over the
conditions for taking it. The viewer first encounters a closed window, then a
reasonable solution, then the dependency that solution leaves untouched.

| Beat | What changes on screen | What the change establishes |
| --- | --- | --- |
| Opening | An original key approaches a sliding door after its finite window closes. | Knowing or possessing a plan does not control access or timing. |
| Timing | Periodic windows pass; a timely key crosses, a late one stops. | Average latency and a particular deadline are different questions. |
| Blocking | Pending jobs collect by the controller; its execution hand stops while the schedule hand continues. | A blocking dependency delays work behind it. |
| Handoff | AI results travel into a mailbox and a bounded admission path. | Separate proposal generation removes the illustrated waiting dependency. |
| Observation | A retained observation and changed state separate spatially. | Arrival time does not refresh the underlying observation. |
| Authority | The gate and observation comparison follow the same current proposal as the admission HUD. | Age/context are conditions for consideration, not a safety certificate. |
| Action limits | A deliberately invalid proposal falls away at the gate. | Action constraints need evidence beyond timestamp checks. |
| Shared resource | The view reveals two compartments on one resource base; interference stalls control. | Process separation and resource isolation are different. |
| Isolation | The base separates and the illustrated stall stops. | This is an isolation assumption in a synthetic schedule, not a hardware proof. |
| Closing | Timing, useful AI input and safe action become separate evaluation questions. | Model capability alone does not establish the execution contract. |

Every pose, window, job, material colour and camera position is determined by
seek time. The new module is `assets/js/cinema/deadline-stage.js`. The original
clock, schedule hand, polyhedron, queue, proposal/mailbox, gate and shared-base
ideas are retained, with tangible sets, lighting, shadows and camera views
that expose a dependency. There is no code rain, decorative glitch or shake.
An unrelated cycling HUD progress bar was removed because it encoded no
useful quantity. Native portrait and desktop compositions remain separate.

The isolation transition replaces the common base with two initially
contiguous surfaces, then separates them. The original common surface is
hidden as soon as replacement starts: drawing all three together produced
coplanar depth flicker in the encoded output. This correction affects only
the transition inside the 80-100 second render segment.

The resource counterexample now starts on the spoken word "Inference", and
isolation on "Isolation", using word boundaries mapped back through the
narration warp. The earlier fixed schedule would have shown isolation before
the narrator described contention. The door's success/failure sequence and its
HUD also use the same window state, rather than unrelated generated requests.

The 60 Hz interactive model is unchanged. Cinema windows, trajectories, queues
and gates are schematic authored events, not a physical plant, a robot result
or the interactive experiment's exact trace. Baseline safety, task success and
AI proposal usefulness remain unmeasured. A deliberately invalid action is an
authored counterexample, not a measured failure of a particular AI model.

## Matrix connections and their limits

The references are explicit in the narration, rather than left as an inferred
connection to the word "permission". They do not cast characters as literal
software modules or use fiction to validate a technical claim.

- **The Matrix:** knowing versus taking a path provides the opening question.
  This is a reading of the film, not evidence about real AI.
- **Reloaded:** the Keymaker's route has access and synchronization conditions.
  The original animated door is a structural analogy; no film timing number
  is borrowed as a machine requirement.
- **Revolutions:** Neo's power does not grant control over Mobil Ave. This
  motivates separating capability from authority, not equating admission
  policy with a sentient program or claiming an AI has Neo's abilities.
- **Reloaded's Architect:** his account of Zion places apparent rebellion
  inside a larger managed cycle. This motivates inspecting a larger dependency
  boundary. It does not assert that Zion is another simulation or equate
  adversarial social control with resource contention.

Source passages were rechecked in the screenplay transcriptions for
[The Matrix](https://overblack.org/script/the-matrix-1999),
[Reloaded](https://overblack.org/script/the-matrix-reloaded-2003) and
[Revolutions](https://overblack.org/script/the-matrix-revolutions-2003), alongside
the runbook's released-dialogue transcript references. Drafts/transcriptions
can differ from a released scene. No exact film quotation, footage, actor
likeness, commercial soundtrack recording or melody is reused.

## Different music, not a retimed old track

The new source is **Trip Hop Vibes by Alejandro Magana (A. M.)**, Mixkit asset
149, replacing Discover (587). Its first-party catalogue lists it under hip-hop
with bass/drums and a futuristic/investigation context. It is a different
recording, not claimed to reproduce Clubbed to Death.

- [Catalogue](https://mixkit.co/free-stock-music/hip-hop/?page=3)
- [Asset](https://assets.mixkit.co/music/149/149.mp3)
- [Mixkit music licence](https://mixkit.co/license/#musicFree)
- Local provenance and source hash: `dist/music/mixkit-149-trip-hop-vibes.source.json`.

The source starts at a measured bar boundary around 7.435 seconds and plays
without a loop. Its natural ending is around film time 104.78 seconds. The
narration ends around 101.97 seconds and the film around 106.88 seconds.
The bed is ducked under speech and the complete programme mastered. Signal
analysis and an available preview are not a claim of an end-to-end listening
review. The opening sample includes actual mixed audio for review.

The first delivered AAC measurement was -0.5 dBTP. Deadline now requests a
-2.7 dBTP ceiling at source mastering to leave headroom for the MP3-to-AAC
chain. The delivered AAC measures -14.6 LUFS and -1.8 dBTP. Both encoded video
streams are byte-identical across this audio-only remux, and the narration
timeline is unchanged. Other films retain the existing default ceiling.

## Preservation and verification record

Previous source, audio, post, cover and both full exports are preserved in
`dist/archive/revisions/deadline-before-matrix-2026-10-31/`, and source history
also retains `0bccbcc`. No other film is rewritten.

Raw review material: `dist/reviews/deadline-matrix/`. The 30-second preview is
`deadline-matrix-opening.mp4` there. It is an opening sample, not a final export.
Source checks, actual exported-frame review, full audio/video decoding, final
source/output hashes and CI results belong in the final delivery record. Do
not describe those checks as passed until their actual completion.

Renderer recovery check: a temporary preload deliberately failed the first
screenshot after an encoder started. The segment retried successfully and
the command exited with code 0. The fix closes the encoder's stdin, terminates
an unfinished encoder and awaits closure before deleting/retrying a partial
file. Previously a failed browser capture had left an idle encoder holding
the file and preventing normal process exit. The fault-test artifacts are in
the raw review directory, separate from the delivery.
