# AI Meets the Deadline: mobile story and delivery review

Historical review of the first delivery. Its creative direction was rejected
and is superseded by [the Matrix narrative review](deadline-matrix-review-2026-10-31.md).

Scope: Deadline only. Baseline commit `4204f05`. The owner authorized a substantial
mobile-focused update after the earlier research-only pass. Who Improved the AI
and its media are unchanged. Shared changes only enable an additional aspect and
keep portrait fullscreen upright.

## Argument and retained material

The film follows one failure through successive design decisions: a late answer,
a blocking queue, asynchronous proposals, a changed observation context, an
admission rule, action constraints, then interference through a shared resource.
Its thesis is "Intelligence proposes. Execution needs a contract."

The original clock, ghost hand, model, proposal flights, mailbox, gate, shared
computer and separating slabs remain. The old source, narration, audio and post
are preserved in `dist/archive/revisions/deadline-before-2026-10-30/`, as well as
Git history. There was no existing Deadline MP4 in the delivery directory.
No Matrix footage, dialogue, music or character analogy is used. The storytelling
connection is the difference between possessing information and having authority
to act, followed by the limits of the apparent solution. No glitch edits were added.

## Claim ledger

| Cue | Kind and evidence | Boundary enforced in voice and picture |
| --- | --- | --- |
| hook | Hypothetical physical-AI planning scenario | A good answer can arrive late; no model accuracy or robot result is asserted. |
| beat | Synthetic periodic-controller model in `lab-deadline-model.js` | Chosen timing assumptions, not a measured machine or certification requirement. |
| think | Seeded illustrative inference durations in `deadline.js` | A fast average does not establish a worst-case bound; no universal claim that inference cannot be bounded. |
| wait | Authored stalls and queue consequences in the cinema; executable blocking baseline in the interactive model | One slow dependency can delay queued jobs. The two traces are not identical. |
| split | Separate inference and a bounded admission path | The illustrated timing benefit assumes worker isolation and bounded control/admission work. |
| stale | Observation timestamp and version checked against current time/context | A recently delivered answer can be based on an old observation. |
| contract | `newestBy`, `contextAt`, `AGE` and `status` in the film; TTL and version checks in the interactive model | Age is measured from observation, not result arrival. A proposal passing these checks is not certified safe. |
| limits | Illustrative action gate and labelled research requirement | Action constraints, plant dynamics and baseline safety require independent evidence. No plant is simulated. |
| share | Explicit shared-resource stall windows, then assumed isolation | Asynchrony alone is not resource isolation, nor a worst-case timing proof. |
| close | Author's open architecture experiment | Timing is simulated; usefulness and task success are questions to measure, not reported findings. |

### Two models, explicitly separate

The interactive experiment retains 360 jobs over six seconds at 60 Hz, 4 ms of
control work and 1 ms of asynchronous admission. With the injected 20 ms shared
stall once per second it has six asynchronous misses. Existing tests cover those
results, startup, context, expiry, outage and queue completion.

The cinema uses a schematic half-second beat and a seeded event schedule so that
failures can be followed visually. Its HUD reads the same proposal/stall state as
the picture, and backwards seeking restores that state. It is not the 60 Hz
model rendered in slow motion. The mailbox policy uses the latest completed
arrival, then checks its observation age and context. This is a chosen policy,
not a claim of an optimal planner or out-of-order-result policy.

The gate's static desktop labels name checks, not outcomes. A previous label
said "expired" even while the current proposal passed; it now says
"observation age + context". Actual admission and rejection live in the computed
HUD. "Safe default" was replaced by "baseline controller" throughout this film.

## Current research context, not implemented algorithms

Primary sources checked on 2026-10-30:

- [Physical Intelligence: Real-Time Action Chunking](https://www.pi.website/research/real_time_chunking).
  Asynchronous action generation and compatibility between action chunks are
  relevant context. TTL/context admission does not implement RTC or solve its
  action-continuity problem. No RTC performance figure appears in this film.
- [Google DeepMind: Gemini Robotics On-Device](https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/).
  The cited 2025 article describes local inference for latency/connectivity and
  interfacing with low-level safety controllers. It does not establish the
  timing or safety of this author's model.
- [NVIDIA Cosmos introduction](https://docs.nvidia.com/cosmos/latest/introduction.html).
  World models supply context for the page's proposed future scenario search.
  Generated scenarios are not validated dynamics or evidence of this design's
  performance. This is a proposed next experiment, not work already done.

## Layout, narration and music

Native portrait is 1080 by 1920. It separately places the headline, the complete
central diagram, a larger status panel and 54 px captions (about 19 CSS px at
375 px display width). Main story text lies within the central 4:5 region.
Small 3D labels are replaced by the larger HUD on portrait. The landscape cut
remains 1920 by 1080. The lab switches to a portrait iframe below 600 px.

All ten spoken lines were regenerated with word timings, captions and picture
cues from the same timeline. Real duration is 102.56 seconds. The existing
Mixkit Discover source remains; its natural last note lands at about 100.25
seconds, after the last spoken line and before the end. No unlicensed Matrix
soundtrack was used. Timing analysis is not a claim of a complete listening review.

Music provenance: Discover by Eugenio Mininni, listed in the
[Mixkit catalogue](https://mixkit.co/free-stock-music/orchestral-pop/), with
[Mixkit's music-use information](https://mixkit.co/free-stock-music/) and
[licence](https://mixkit.co/license/#musicFree). The catalogue was rechecked;
the existing local source was retained, not replaced by a newly purchased track.
The mastered soundtrack measures -14.2 LUFS integrated and -1.8 dBTP.

A late-time grain-hash artefact made vertical bands on the Intel renderer.
A frame with grain disabled isolated the cause; Deadline now disables that
post-process grain without changing other films. The banded render parts were
archived and the delivery render restarted with a clean cache. The diagram's
excessive bloom and undefined reversed-smoothstep point edges were also corrected.

## Verification and continuation record

Raw visual evidence: `dist/reviews/deadline-mobile/`.
Preview: `dist/builds/deadline-mobile/`, served by a temporary Python HTTP server
on port 4001, not by a concurrent Jekyll watcher.

Completed before final delivery: both-layout narration/status/seek/text checks,
mocked portrait fullscreen orientation and no sideways prompt, mobile iframe
geometry, 16:9 and 9:16 spoken-cue synchronization, timing-model and interactive
page tests, cinema controls/playback and the Cyber Events, Collaborative AI and
Model Heist regressions. These are browser emulations, not physical iPhone or
Android tests. The Deadline check is added to the existing CI workflow.

The final safe production build also passed. The targeted lab audit checked
one page with zero issues, broken URLs or browser errors. Layout checks across
nine viewport widths reported zero problems. Liquid and `git diff --check`
are clean. The mastered audio measurement is recorded above.

Local export evidence belongs in `dist/video/deadline-delivery.json`: source
hashes, dimensions, duration, captions and per-file full decode results. Encoded
frame inspections and the audio analysis belong in the raw review directory.
Treat an MP4 as delivered only after those checks pass. The local post draft is
`dist/video/ai-meets-the-deadline-linkedin.md`; it describes a synthetic study
and makes no claim of a new robot or model benchmark.
