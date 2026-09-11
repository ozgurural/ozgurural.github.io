# Research Lab editorial pass, 11 September 2026

Baseline: `416ec1d`, fast-forwarded from `fb7574a`. The other agent's
coordination drawings and wide-screen text measure are preserved.

## Editorial changes

All eleven openings now pose their question within 1.6 seconds. The narrator's
voice and speaking rate are unchanged; 42 tracks were regenerated, including
the revised openings and the Jira, Oracle, and watermark-comparison edits.
The source card lasts five seconds instead of eight, shows its credit early,
and releases its musical cadence before the end.

| Film | Before, seconds | After, seconds |
| --- | ---: | ---: |
| Block Race | 149 | 146 |
| Blockchain ML | 168.7 | 165.7 |
| Cyber Events | 175.5 | 172.5 |
| Determinism | 188 | 185 |
| Gradient Pinball | 146.8 | 143.8 |
| Model Heist | 146.3 | 133.3 |
| ML Oracles | 160 | 120 |
| Redundancy Reactor | 144 | 133 |
| Training Fingerprint | 172.8 | 169.8 |
| Universal Jira | 238.7 | 181.3 |
| Watermarking Comparison | 203.5 | 190.6 |
| Total | 1893.3 | 1741 |

These are authored timeline durations, not guaranteed wall-clock playback
times. Audio startup, buffering, and rendering load can add time. Native
exports preserve the recorded audio-to-picture timeline rather than speeding
up speech to force the nominal duration.

Jira's existing visual events are retimed locally in three canvas scenes;
its AMM derivation is not accelerated. Oracle loses long holds after its
argument is complete. Model Heist retains its final detection-power count.
Redundancy Reactor shows one common-mode failure instead of rapid red/green
flashing. Small moving elements are not removed just because the stillness
detector misses them.

## Claims and sources

- Oracle distinguishes a proof of encoded computation from real-world truth.
  Its example bond no longer invents a dollar requirement. Disputes require
  resolution; an unchallenged claim is not described as absolute truth.
  Sources read: [EZKL](https://docs.ezkl.xyz/) and
  [UMA](https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work).
- Oracle remains labelled as an unpublished research direction, not a result
  from the author's blockchain survey. Its embed and oEmbed titles agree.
- Model Heist's Gaussian teaching model is not attributed to the author's
  feature-based watermark mechanism. Its conclusion and appendix say high
  power, not certainty, and distinguish a norm bound from a utility guarantee.
- The auxiliary-head chapter no longer claims the head cannot be pruned.
  SecurePoL descriptions avoid claiming every conceivable forgery impossible.

## Validation

- All 11 films: zero narration overruns and zero overlap findings.
- All 11 players: early hook, early readable credit, real voice progression,
  pause, end, and replay pass `npm run test:films`.
- A deliberately delayed first audio start in Jira exercises the new bounded
  startup wait. Seeking and pausing clear that pending wait.
- Initial contact sheets reviewed across every scene of all eleven films;
  changed compositions additionally checked after the edit.
- Page/embed comparison for Oracle at 70 seconds: 2.08% differing pixels,
  concentrated in antialiased text/chrome at different native stage sizes.
- Site audit: 76 URLs, 72 HTML pages, zero issues, broken URLs, or browser errors.
- Interaction suite: 17 checks passed. Its image fixture now enters before
  deferred app initialization, removing a timing race in the test itself.
- Icon audit: 76 pages, 15 glyphs; the two non-Font-Awesome glyphs are Academicons.
- External links: 249 verified, zero confirmed dead, nine unverified due to
  refusal, timeout, or network failure. EZKL was independently read through
  the web research tool; its timeout in the crawler is not treated as a 404.
- Production Jekyll build, narration manifest, Liquid, and diff checks pass.
- `dist` is excluded from Jekyll output so local previews and video exports
  do not become production assets.

This pass does not claim measured audience retention or a subjective guarantee
of perfection. Watch-through must be measured after publication. It also does
not regenerate all eleven native exports: the web films are updated together,
with Oracle selected as the complete native-video example.
