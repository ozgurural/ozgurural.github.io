---
permalink: /lab/redundancy-reactor/
title: "Redundancy Reactor: fault tolerance, animated"
description: "Majority voting buys superlinear safety, until correlation installs a floor you can't vote past. A cinematic, PhD-level explainer ending in the Ariane 5 disaster."
excerpt: "Triple-modular redundancy, the binomial-tail gain, the correlation floor ρq, and why Ariane 5 self-destructed with three computers that all agreed."
sitemap: true
header:
  og_image: "lab-og/og-tmr.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-tmr" style="margin-top: 0;">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <p class="lab-card__lead">✈️ Run three flight computers and a majority voter, and one faulty channel gets outvoted. Done right, redundancy turns the failure rate from q into <strong>q<sup>m+1</sup></strong> — superlinear safety. But "three computers" is only "three independent failure paths" if they fail <em>differently</em>. This animation derives the binomial-tail gain, then shows how a shared cause installs a <strong>floor ρq</strong> no amount of redundancy can beat — the exact mechanism that destroyed Ariane 5 in 1996.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Triple Modular Redundancy with common-cause (β-factor) failure. The Ariane 5 Flight 501 case follows the ESA Inquiry Board report; the redundancy patterns mirror real-time safety-critical avionics architecture developed by the author.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="tmr-film" role="group" aria-label="Animated explainer: triple modular redundancy, correlated failure, and the Ariane 5 disaster"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=healthy channel, orange=voter, red=failure, pink=N=5 curve">
    <span><i style="background:#36d6e7"></i> healthy channel / gain</span>
    <span><i style="background:#f0a000"></i> voter · threshold</span>
    <span><i style="background:#fb7185"></i> failure · correlation floor</span>
    <span><i style="background:#ec4899"></i> N=5 curve</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Majority voting converts "any failure" into "a coordinated majority of failures."</strong> With N = 2m+1 channels and a voter, the system fails only when a strict majority fails. For i.i.d. channels failing with probability q, that's the upper tail of a binomial — for triple redundancy, <em>P = 3q²(1−q) + q³</em>.</p>
    <p><strong>Independent redundancy is superlinear.</strong> For small q the tail is dominated by its lowest-order term, so <em>P = Θ(q<sup>m+1</sup>)</em>: adding channels doesn't subtract a constant from your risk, it raises q to a higher power. On a log-log plot the slope literally steepens. The TMR safety multiplier is <em>1/(3q − 2q²)</em>, which tends to 1/(3q) as q → 0 — about 33× at q = 0.01. (This unbounded gain is an independent-model idealization.)</p>
    <p><strong>Correlation installs a floor you can't vote past.</strong> Let the channels share a cause. A common-mode fraction ρ splits failures into an independent part the voter fixes and a correlated part it cannot — every channel agrees on the same wrong answer. To first order <em>P<sub>sys</sub> ≈ (1−ρ)P<sub>ind</sub> + ρq ≥ ρq</em>, and that ρq term <em>doesn't depend on N</em>. So for q &lt; ½, as N → ∞ the system rate tends to ρq and the safety multiplier saturates at <strong>1/ρ</strong>. You can pour in infinite redundancy and asymptotically gain nothing.</p>
    <p><strong>Ariane 5, 4 June 1996.</strong> Two inertial reference units ran identical hardware and identical software in parallel. An unprotected 64-bit→16-bit conversion of the horizontal-bias variable overflowed, because the new rocket flew faster than the Ariane-4 assumptions baked into the code. The backup unit failed first, the active one ~72 ms later — the same Operand Error — and the redundancy voted unanimously to shut down. With identical software ρ ≈ 1, so P<sub>sys</sub> ≈ q and N was irrelevant; the vehicle self-destructed ~39 s after ignition, ~4 km up.</p>
    <p><strong>The cure is diversity, not count.</strong> You can't vote your way out of a shared mistake — you have to engineer the mistakes to be different. Different teams, languages, and vendors drive ρ toward zero, sink the floor, and only then make extra channels pay off. The valuable quantity was never N; it was the independence ρ that makes those channels worth counting. The same lesson governs nuclear interlocks, Mars rovers, and the secure element in your phone.</p>
    <p><strong>Scientific Context:</strong> Common-mode failure is the dominant limit on high-availability systems. Low-latency, diverse-redundancy mechanisms of this kind are essential in the real-time avionics and flight-simulator data pipelines developed by the author.</p>
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
