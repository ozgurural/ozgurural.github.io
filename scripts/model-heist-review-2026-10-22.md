# Model Heist film review, 22 October 2026

Baseline: `e433a45`. Continued the owner's AI-first brief: an engaging standalone
explainer that teaches an idea and shows research judgement. The publication
is context rather than the subject of an advertisement.

## Story and mathematics

- Reframed as **Could this AI be a copy?** The thesis opens and closes the film:
  recognising a model means testing a claim.
- The paired running sums use one seeded noise sequence; the marked sequence
  adds EPS per sample. Their difference is exactly n times EPS.
- The score distributions now derive from EPS times sqrt(k), rather than
  unrelated hand-chosen means. Per-coordinate perturbation is fixed, so total
  signal norm grows with breadth; this is not a free gain at fixed norm.
- One pure statistics module drives the curves, threshold, shaded null tail,
  displayed sample positions and false-alarm calculation.
- Added simulated null observations so the calibration scene progresses while
  narration explains the test. Under aligned noise, samples move across the
  unchanged threshold and the red null-tail area grows.
- The correlated case is specific: a common Gaussian component aligned with
  the unit key, covariance I + (sigma squared minus 1) uu transpose. It is not
  a claim that every kind of correlation increases this detector's variance.
- The attack shifts the normalised score by at most the stated norm budget.
  Cauchy-Schwarz does not require the key to be secret and establishes no
  accuracy cost or universal watermark-removal guarantee.
- Added word-timed captions, regenerated voice and soundtrack. Real duration
  is 97.951 seconds, down from 101.850 seconds. Music keeps its existing final
  fade; its natural ending is not claimed to align with the card.
- Fixed a collision between threshold and attack annotations found in the
  rendered frame, with a presentation regression for the two SVG labels.

## Source fidelity

Ural and Yoshigoe, *Enhancing Security of Proof-of-Learning Against Spoofing
Attacks Using Feature-Based Model Watermarking*, IEEE Access 12 (2024),
169567-169591, DOI 10.1109/ACCESS.2024.3489776, IEEE article 10741282.

IEEE's automated full-text endpoint was unavailable. Relevant full-text paper
sections were read at the author-uploaded record:
https://www.researchgate.net/publication/385478014_Enhancing_Security_of_Proof-of-Learning_against_Spoofing_Attacks_using_Feature-Based_Model_Watermarking

The paper's protocol and Algorithm 2 combine watermark verification with
training-record checks. The Gaussian matched-filter/Z-test in this film is
separate teaching material, not its detector or a measured benchmark. Removed
an incorrect attribution of that formula from the lab page, archived player
annotation and appendix. Qualified the publication summary's blanket claims
about survival of model edits and the accuracy cost of removal.

## Verification

- JavaScript syntax, whitespace and Liquid checks; production and local builds.
- Existing controls, playback, Cyber Events and collaborative AI regressions.
- New `test:cinema-model-heist`, wired into CI: source/timeline agreement,
  simulated calibration against the Gaussian null tail, paired-sum arithmetic,
  breadth, attack bound, correlated-noise alarms, backwards seek and layout.
- The shared playback regression now supplies an explicit captionless fixture
  instead of assuming Model Heist has no captions. It retains the original
  missing-caption control assertion as production films gain caption tracks.
- Ink-level text bounds and caption-overlap audits at 960x540, 375x812 touch and
  812x375 touch, plus representative desktop and phone renders.
- Narrated cue-edge synchronisation checks; phone-sized frame-by-frame memory
  check held at 9 GPU buffers after GC, 4 geometries, 13 textures, 14 programs.
- Targeted cinema, lab, archived embed and publication page audits.

Screenshots, measurements, share text and generated MP4s are under ignored
`dist/`. Final MP4 composition and full decoding are verified before delivery.
These browser checks do not establish physical-device or Safari compatibility.
