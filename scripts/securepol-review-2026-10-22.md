# SecurePoL film review, 22 October 2026

The film now shows a model and its training record changing hands, followed by
verification, instead of accumulating three application cards. Each proposed
scenario has its own question: matching an audited model, checking supplier
training, or checking provenance against registered data. The scenarios remain
labelled as proposals from Section V-A. The data example also distinguishes
provenance evidence from establishing a dataset's legal status.

The opening copy has a visible payload transfer. Secret challenges arrive before
the owner's response appears, and the shell is dimmed so the watermark can be
seen. Replaying the recorded endpoint makes the disagreement with a scrubbed
model visible throughout its explanation. These are illustrative animations,
not recorded training runs or deployed verification systems.

The accuracy bars previously used an illustrative 92% baseline without labelling
it as such. They now show measured differences: 0.00–0.58 percentage points of
accuracy loss and 0.6–17.3% training overhead, with explicit, different scales.
The CIFAR-10 / ResNet-20 scope and the three watermark designs are displayed.
The results agree with the author's publication summary and the measured table
in the reference implementation:

- https://ozgurural.github.io/publication/2025-secureproofoflearning
- https://github.com/ozgurural/SecurePoL-with-Watermarking#key-results
- Paper record: https://doi.org/10.1109/ACCESS.2025.3642198

No new paper mechanism was introduced. The existing trigger-set illustration,
attack-scope qualification, narration, cue times and credits are retained.
Authored duration remains 120 seconds; scheduled duration remains 122.095 seconds.

Word timings and captions were generated with edge-tts 7.3.1 in an isolated local
dependency directory. The previous installed 7.2.8 returned HTTP 403. Every
narrated line retains its original text, real start time and speech duration.
Captions are enabled in the player, with duplicate opening/use/closing lines
omitted. Two source notes were moved clear of the caption area.

Validation completed:

- JavaScript syntax, Jekyll production and local preview builds, Liquid checks.
- Cinema keyboard and playback regression tests, including actual caption text,
  backwards seeking of the handoff and source-note/caption separation. The
  existing CI workflow runs these tests on every push.
- All 16 spoken lines sampled near the start and end of speech: visible text
  remains on screen throughout.
- All cue boundaries sampled at 960×540, 375×812 and 812×375: no text clipping,
  caption collisions, horizontal page overflow or uncaught browser errors.
- Film and actual containing lab page: site audit passed for each page.
- Phone-sized GPU buffer checks over seconds 4–10, 59–68 and 88–106: 176 live
  buffers before and after garbage collection, 50 geometries and 13 textures
  throughout; reported JavaScript heap approximately 11 MB.
- Representative desktop frames reviewed with captions. Portrait and landscape
  phone screenshots reviewed separately; these are emulated viewports, not a
  claim of physical-device testing.

The renderer uses faster lossless PNG compression. A five-frame benchmark on the
application scene reduced average capture time from 489 ms to 185 ms; decoded
pixels of the same frame were identical. This is a capture-stage measurement,
not a promise of the same speed-up for the complete export.

Ignored local review artifacts are in `dist/securepol-final/`, including the
layout audit, screenshots and PNG comparison images. Native exports and caption
files live in `dist/video/` and are not published as repository binaries.
