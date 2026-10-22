# Collaborative AI film review, 22 October 2026

Baseline: `ca43682`. The owner asked for an engaging AI explainer that shows
research judgement, with the publication as background rather than the subject.

## Story and mechanism

- Reframed the film as **Who improved the AI?**, following five organisations
  training together, generalisation, contribution evaluation and incentives.
- A schematic update improves its own-data loss but worsens separate-test loss.
  This is a teaching example, not an experiment reported in the cited survey.
- The reward animation computes its balance direction from the very same
  before/after loss values that set the bars. Helpful and harmful contributions
  use the same evaluation data. The change to the harmful example follows the
  word "Higher" in the actual narration, including after backwards seeking.
- This is a sequential marginal-reward illustration, not Shapley attribution
  or a claim of order-independent fairness.
- The ledger appears as supporting infrastructure. It is drawn alone while
  explaining tamper evidence and disappears during the AI evaluation examples.
- Added word-timed player captions and regenerated the narration and soundtrack.
  Duration is 110.219 seconds, down from 112.705 seconds. The stock music uses
  the existing final fade rather than claiming its natural ending is aligned.
- The ending is labelled Dr. Ozgur Ural's research perspective. Proposed use
  across organisations is a scenario, not a deployment claim.

## Primary source checks

Ural and Yoshigoe, *Survey on Blockchain-Enhanced Machine Learning*, IEEE Access
11 (2023), 145331-145362, DOI 10.1109/ACCESS.2023.3344669.

IEEE's metadata identifies the published article as 10366252. The automated
full-text endpoint was unavailable; the author-version paper's full text was
read at https://www.researchgate.net/publication/376676510_Survey_on_Blockchain-Enhanced_Machine_Learning.

- II-A and IV-A: recorded transactions and integrity do not by themselves
  establish the quality of a model update.
- IV-B.2: SUM's prediction-market balance changes by loss before minus loss
  after. Deposit/Refund/Take is a separate mechanism, with a waiting period,
  model agreement for refund, and a possible partial deposit penalty on
  disagreement. Agreement is not ground truth.
- IV-B.3: DeepChain used Corda V3.0 and MNIST. More parties improved accuracy;
  more gradients lowered throughput; more parties increased training time.
  The film labels directions, without inventing quantitative bar ratios.
- IV-C.2: the best-performing ML competition entry can earn block rights in
  the reviewed consensus design. This is not a description of all blockchains.
- Removed the unqualified LearningChain privacy/accuracy direction from the
  film and associated prose: the accessible author version's wording is not
  a sound basis for the prior generalisation. Kept the documented use of
  differential privacy and l-nearest aggregation in the technical prose.
- Updated the film page, oEmbed record and lab introduction to match the story.
  Corrected privacy and partial-deposit statements in the publication summary.

## Validation

- JavaScript syntax and Liquid checks.
- Production and local Jekyll builds.
- Existing cinema controls, playback and Cyber Events regressions.
- New `test:cinema-blockchain-ml`, also in CI: source/timeline agreement,
  captions, generalisation, reward arithmetic, backwards seeking and text bounds.
- Ink-level clipping and caption-overlap checks at 960x540, 375x812 touch and
  812x375 touch; no errors, clipping, overlap or page overflow.
- Narrated cue-edge checks and representative desktop and phone screenshots.
- Phone-sized frame-by-frame allocation check: GPU buffers held at 82 before
  and after collection, 47 geometries, 13 textures and 16 programs.
- Targeted film, lab and publication page audits.

Local screenshots, measurements and generated MP4s live under ignored `dist/`.
MP4 decoding and final composition are checked separately before delivery.
No physical phone or Safari compatibility claim is made by these checks.
