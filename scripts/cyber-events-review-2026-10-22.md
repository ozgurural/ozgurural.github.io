# Cyber Events film review, 22 October 2026

The film keeps its original 123.452-second schedule and its subject: the
Turkish-language detector described by Ural and Acartürk at ICISSP 2021.
The eleven-page paper was read, including the method, evaluation, limitations
and Figure 2. Source: https://doi.org/10.5220/0010201600660076.

The revised scenes show candidate messages passing a keyword filter, a queue
growing with the keyword setting, spelling variants converging on a matching
form, and mentions of a selected target entering its daily count. These flows
are explicitly schematic. Corpus sizes of 2,310, 28 and approximately 400 tweets
are labelled as reported values; word emphasis is not presented as published
TF-IDF measurements. The alert threshold is described as history-based.

The keyword-selection narration now describes the actual criterion: more useful
detections without an excessive increase in false alarms. It no longer invents
an absolute rule comparing false detections with true detections. The final
case is the paper's Turkish warning about remote patient monitoring applications
(26 April 2019, Section 4.2.2), followed by analyst review. The previous English
tool comparison was a counterfactual about data-source coverage, not a measured
head-to-head experiment, and has been replaced. The closing statement is
identified as Dr. Ozgur Ural's view.

The result scene shows 29 alerts from 437 documents, with 22 confirmed and seven
false alerts. Filled versus outlined symbols and explicit labels distinguish
the outcomes. It states that missed events were not established by that run.
The publication summary was also corrected: no ensemble classifier or
unsupported two-to-three-mention normal-day baseline is attributed to the paper.

The film has word-timed captions and shorter supporting text. Source notes and
panels clear the caption area. Existing Turkish font subsets are now declared
in the shared cinema layout so Ş, ş, İ and ğ use the intended webfonts. A real
browser font inspection checks the normalised Turkish word for fallback.
Reversed-edge smoothstep calls in this film's shaders were replaced with
defined equivalents.

Validation completed:

- Jekyll production and isolated local preview builds; JavaScript syntax and
  Liquid checks.
- Cinema keyboard and playback tests, plus the new Cyber Events regression
  test, now wired into the existing push/PR CI workflow. It checks current
  narration, captions, causal movement, deterministic backwards seeking,
  result counts, actual font use and text/caption separation at spoken cues.
- Every spoken line sampled near its beginning and end: its scene remains
  visible through the narration.
- Desktop 960×540, portrait 375×812 and landscape 812×375 viewport audits:
  no text clipping, caption collisions, horizontal overflow or browser errors.
  These are emulated viewports, not physical-device certification.
- Film, containing lab page and publication page: site audits passed.
- Phone-sized GPU checks at 30 fps over seconds 8–18 and 62–91: eight buffers
  before and after collection, three geometries and 13 textures throughout;
  reported JavaScript heap approximately 5 MB.
- Representative desktop stills inspected with captions; portrait and landscape
  screenshots saved in `dist/cyber-events-final/` for separate visual review.

Native exports and caption files are local artifacts in `dist/video/`. The
export job uses lossless PNG capture, a medium H.264 preset at CRF 17, and a
separate parts directory keyed by the film, timeline and layout bytes so this
review cannot reuse earlier pictures of the same duration.
