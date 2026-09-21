# Content review, 21 September 2026

## Scope and finding

Reviewed the content changes introduced by db52f20, 15daefb, and 7ae8c72, plus the later sharing-image commit 62392ba. The owner confirmed that the broadcast-client pilot and its measurements were invented by the previous agent.

The three rewrites affected 30 post/publication files. They added unsupported professional history and results rather than merely changing voice. Restored the pre-rewrite versions from db52f20^, retaining later social-sharing images. This baseline is a recovery point, not independent verification of every older statement.

## Removed claims

| Area | Examples removed | Resolution |
| --- | --- | --- |
| Generative audio | Broadcast client, 40 workstations, 18,000 comparison tracks, 99.98% detection, repeated AAC recovery, purported regulatory obligations | Replaced with the original personal listening experiment and an explicitly unpublished research question |
| Turkish event detection | Licensed Rust module, European MSSP, 80+ customers, 180 million tokens/day, fabricated evaluation tables | Restored the thesis and ICISSP descriptions; removed the newly added unverified bibliography |
| Image measurement | 312 signed clinical labels, hospital ethics review, 2026 clinical pilot | Restored the tool description and code example |
| SecurePoL and aviation | Avion-ERAU deployed verifier, pilot scoring, invented AUC and pruning results, HSM/cloud architecture | Removed the claimed integration; rewrote the simulation and doctorate posts with evidence limits |
| Secure Proxy on Cloud | ICESC conference attribution, four-module production lineage, throughput/latency figures | Restored technical-report classification and original demonstration description |
| Clover and UAV work | New delivery-success numbers, specific safety architecture, qualification and production lineage | Restored Clover entry; rewrote UAV post using the established role and dates in the CV |
| Leadership and personal posts | New client work, deployment outcomes, regulatory leadership, specific delivery claims in promotional footers | Removed the rewrites and appended footers |

Also simplified older unsupported details in the recovered audio, UAV, doctorate, and simulator articles. The other recovered older personal narratives are not newly fact-checked biographies.

## Technical changes

- Removed UTF-8 BOMs from configuration and eleven posts. Added a source check and verified that a duplicate-BOM fixture fails it.
- Search advertised 15 matches but rendered only 12. All matches are now reachable, with a regression assertion matching the announced count to the rendered list.
- Restoring the correct publication links removed two internal 404s.
- Preserved all eleven sharing images and the search-verification settings.
- Added explicit evidence rules for biographical, publication, customer, deployment, and numerical claims to CLAUDE.md.

## Validation

- Final production Jekyll build: passed in 14.532 seconds. Verified all 30 reviewed production canonical URLs, all 11 sharing images, the cleaned search index, and exclusion of this internal report from _site.
- Liquid/source encoding and narration checks: passed.
- Interaction suite: 18 checks passed, no uncaught browser errors.
- Film playback: 11/11 passed (voice startup, pause, end, replay, source card).
- Narration timing: 11/11 checked, zero overrunning lines.
- Icon coverage: 76 pages and 15 distinct glyphs checked; no missing glyphs.
- Full site crawl after content recovery: 76 URLs, 72 HTML pages, zero broken URLs, zero browser errors. One overlong simulator SEO title was identified and shortened; the targeted repeat passed with zero issues.
- Visually inspected the corrected audio page at 1280px and simulator page at 390px; no visible layout defects in the captured viewports. Captures are in dist/review-2026-09-21/.
- Rejected-claim indicator sweep and front-matter/punctuation check: passed for all 30 content files. This checks known regressions, not factual completeness.

No new paper mechanisms or numerical research results were introduced. No public deployment was performed by this review.
