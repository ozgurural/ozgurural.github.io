# AI Meets the Deadline: architecture study

## Purpose and scope

Reframes /lab/determinism/ as an AI architecture design study. The intended audience is technical decision-makers assessing architectural judgement. It presents a decision, the tradeoff it creates, explicit failure assumptions, an executable experiment and an evaluation plan. It does not change the author's job title or claim an AI deployment.

The previous regulation-led film was replaced with five 28-second chapters and the existing five-second source card. The page keeps the stable URL. Page, embed, oEmbed, lab directory and a new sharing image agree on the title. The former og-det.png remains available to other posts that use it.

## Evidence boundary

The model is a deterministic discrete-event scheduling exercise with chosen costs, not a plant simulation or measured AI latency distribution. The 150 ms value is a selectable observation-age limit, not an aviation qualification threshold. No robot task success or action-safety result is claimed. The model does not implement RTC, Gemini Robotics or Cosmos.

Source pages read on 21 September 2026:

- Physical Intelligence, Real-Time Action Chunking with Large Models, 9 June 2025 (including its December 2025 update): https://www.pi.website/research/real_time_chunking
  Supports the distinction between concurrent inference/execution and continuity of action chunks. The local model only illustrates scheduling and freshness.
- Google DeepMind, Gemini Robotics On-Device: https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/
  Supports local inference, latency/connectivity considerations and integration with low-level controllers. No hard deadline guarantee is inferred.
- NVIDIA Cosmos documentation: https://docs.nvidia.com/cosmos/latest/introduction.html
  Context for world-model tools. Using generated scenario candidates for failure search is the author's proposed experiment, not a result attributed to NVIDIA.

Corrected the old independence error: E[K] = sum of marginal miss probabilities does not require independent frames. Products of participant success probabilities do require independence. Timing reliability and task success are distinct.

## Implementation

- assets/js/lab-deadline-model.js is shared by film, page and Node checks. It models queued blocking jobs and a single asynchronous inference worker with no request queue, context invalidation, proposal expiry, outages and explicit shared-resource stalls.
- The live page changes delay/expiry, adds outage/contention, resets state and downloads the full trace as JSON. Text metrics supplement the colour-coded canvas.
- Both designs use the same latency rule, but request start times differ. The page says so; it does not describe them as identical realised observation sequences.
- The film runs the same model for comparison scenes and a twelve-case closing sweep. Static images do not supply its numerical results.
- The native recorder now resets after warm-up and waits for MediaRecorder.onstart before playback. A four-second 320px smoke export decoded with both tracks and its timeline begins exactly at [0, 0].
- Fifteen narration tracks replace the former nineteen; the four unused tracks were removed. The final narration timing audit reports no boundary overruns.
- The embed layout loads an optional supporting script only for pages declaring film_support. Other films do not acquire this dependency.
- Narration temporary files now begin with a dot so Jekyll does not scan an intermediate file that disappears during atomic replacement. The earlier visible .tmp file caused a real preview build failure during synthesis.

## Validation record

- Node scheduler checks pass: deadline budgets, queued overruns, deterministic replay, context invalidation, expiry, outage, resource contention and a non-overlapping inference worker.
- Existing subset fonts cover every alphanumeric character used by the new page and film.
- Browser experiment checks pass: control changes, keyboard slider input, download payload, reset and widths 320/390/1280.
- Targeted page audit: zero issues, broken URLs and browser errors after explicit checkbox labels and 24px targets were added.
- Film overlap audit: zero findings across all six scenes.
- Narration audit: 15 cues, zero overruns over the 145-second authored timeline.
- Reviewed full-scene contact sheet, desktop/mobile experiment captures and page/embed frame pair. The 40-second comparison reports 6.999% differing pixels at unequal stage widths; dense grid resampling and text edges contribute. Visual inspection finds the same content and layout, not a pixel-identical render.
- A concurrent full-site/test/link run was interrupted after local resource pressure and navigation timeouts. It is not counted as passing; final sequential checks and native export results are recorded below.

## Sharing

The LinkedIn draft is in dist/video/ai-meets-the-deadline-linkedin.md. It describes a reproducible synthetic experiment and invites discussion of the execution contract. No LinkedIn post was sent. The native video is an artifact, not a tracked website asset.

## Final sequential checks

- All 11 players passed voice startup, pause, end, replay and source-card checks.
- The experiment browser tests passed again against the stable preview.
- Full site audit: 76 URLs, 72 HTML pages, zero issues, zero broken URLs, zero browser errors.
- Icon coverage: 76 pages, 15 distinct glyphs; the two non-Font-Awesome glyphs are Academicons.
- Page/embedding metadata and dependency-isolation checks passed: only the determinism embed loads the scheduling model.

## Delivery checks

- Full native MP4 export completed: 1920x1080, 24 fps, H.264 video and stereo AAC, 147.21 seconds, approximately 9.6 MB. Complete decode and track validation passed. The authored 145-second timeline retains playback holds; its first sample is [0, 0].
- Visually reviewed frames extracted from the delivered MP4 at 12, 48, 100, 132 and 145 seconds, including the closing source card.
- Production `bundle exec jekyll build` passed after stopping the preview server. Built title, canonical URL, sharing image, supporting script and excluded internal artifacts passed assertions.
- External audit checked 255 URLs: 245 passed, eight were unverified due to refusal/timeouts, and two new GitHub source links returned 404 before their pending first publication. Those two require a post-push check; the eight unverified URLs are not asserted to be broken.
