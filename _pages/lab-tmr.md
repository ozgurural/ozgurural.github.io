---
permalink: /lab/redundancy-reactor/
oembed: "/lab/redundancy-reactor/oembed.json"
title: "Redundancy Reactor: fault tolerance, animated"
description: "Majority voting buys superlinear safety, until correlation installs a floor you can't vote past. A cinematic, PhD-level explainer ending in the Ariane 5 disaster."
excerpt: "Triple-modular redundancy, the binomial-tail gain, the common-cause floor ρq, and why Ariane 5's two identical inertial systems stopped almost together."
sitemap: true
header:
  og_image: "lab-og/og-tmr.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-tmr" style="margin-top: 0;">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <p class="lab-card__lead">✈️ Run three independent channels and a majority voter, and one faulty channel gets outvoted. Under an independent-failure model, redundancy turns the leading failure term from q into <strong>q<sup>m+1</sup></strong>. A shared cause breaks that assumption and can install a <strong>floor ρq</strong> no amount of identical replication removes. Ariane 5 is the closing case study in common-mode software failure; its two inertial systems were not a triple-modular voter.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Triple Modular Redundancy under independent and common-cause failure models. The Ariane 5 Flight 501 sequence follows the ESA/CNES Inquiry Board report and is presented as a separate common-mode case study, not as an example of TMR voting.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="tmr-film" role="group" aria-label="Animated explainer: triple modular redundancy, correlated failure, and the Ariane 5 disaster"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=healthy channel / gain, amber=voter / threshold, rose=failure / correlation floor, violet=N=5 curve">
    <span><i style="background:#58C4DD"></i> healthy channel / gain</span>
    <span><i style="background:#fbbf24"></i> voter · threshold</span>
    <span><i style="background:#fc6255"></i> failure · correlation floor</span>
    <span><i style="background:#9a72ac"></i> N=5 curve</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Majority voting converts "any channel failure" into "a majority of channel failures" in the ideal-voter model.</strong> With N = 2m+1 channels, an assumed-reliable voter and independent channel failures of probability q, the output is wrong when a strict majority is wrong. That is the upper tail of a binomial; for triple redundancy, <em>P = 3q²(1−q) + q³</em>. Real designs must also account for voter faults and other shared components.</p>
    <p><strong>Independent redundancy is superlinear.</strong> For small q the tail is dominated by its lowest-order term, so <em>P = Θ(q<sup>m+1</sup>)</em>: adding channels doesn't subtract a constant from your risk, it raises q to a higher power. On a log-log plot the slope literally steepens. The TMR safety multiplier is <em>1/(3q − 2q²)</em>, which tends to 1/(3q) as q → 0, about 33× at q = 0.01. (This unbounded gain is an independent-model idealization.)</p>
    <p><strong>Correlation installs a floor you can't vote past.</strong> Let the channels share a cause. A common-mode fraction ρ splits failures into an independent part the voter fixes and a correlated part it cannot, every channel agrees on the same wrong answer. To first order <em>P<sub>sys</sub> ≈ (1−ρ)P<sub>ind</sub> + ρq ≥ ρq</em>, and that ρq term <em>doesn't depend on N</em>. So for q &lt; ½, as N → ∞ the system rate tends to ρq and the safety multiplier saturates at <strong>1/ρ</strong>. You can pour in infinite redundancy and asymptotically gain nothing.</p>
    <p><strong>Ariane 5, 4 June 1996.</strong> Two inertial reference systems ran identical software. An unprotected 64-bit-to-16-bit conversion overflowed in a post-liftoff alignment function inherited from Ariane 4. The backup SRI 1 failed first; active SRI 2 stopped in the next 72 ms data cycle for the same reason. Diagnostic data was then interpreted as flight data, driving the nozzles hard over. The launcher broke up, and its onboard neutralisation system correctly triggered self-destruction after structural links were lost.</p>
    <p><strong>Control the common cause, not only the count.</strong> You cannot vote out a shared mistake. Design diversity, independent validation and representative system tests can reduce common-mode risk, but none guarantees zero correlation. Extra channels pay off only to the extent that their failure paths are genuinely independent.</p>
    <p><strong>Scientific Context:</strong> Common-mode failure is an important limit on high-availability systems. The mathematical model here is deliberately simple; the engineering lesson is to measure and challenge the independence assumption before relying on replication.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="tmr-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/redundancy-reactor.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
