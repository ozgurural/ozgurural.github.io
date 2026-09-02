---
permalink: /lab/model-heist/
oembed: "/lab/model-heist/oembed.json"
title: "Statistical Watermark Detector: a teaching model, animated"
description: "A Gaussian teaching model for how many weak coordinate-level marks can become aggregate ownership evidence, with its assumptions and limits stated."
excerpt: "Under a clean-reference, white-Gaussian-noise model, spread a weak signature across k coordinates and watch matched-filter power rise as √k."
sitemap: true
header:
  og_image: "lab-og/og-wm.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm" style="margin-top: 0;">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <p class="lab-card__lead">🕵️ Someone leaks an AI model and fine-tunes it just enough to look different. This animation isolates one statistical idea: under a clean-reference, white-Gaussian-noise model, <strong>k weak coordinate-level marks</strong> can add coherently in a matched filter while unrelated noise adds in quadrature. It is a teaching model for aggregate evidence, not a reconstruction of the feature-based detector in the author's 2024 paper.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span><strong>Illustrative statistical model.</strong> The matched-filter derivation follows classical Gaussian detection theory and states its assumptions in the appendix. For the author's published mechanism, which embeds feature-based watermarks during training and verifies them jointly with Proof-of-Learning, see <a href="/publication/2024-ieee-access-watermarking">IEEE Access 2024</a> and the source-grounded <a href="/lab/training-fingerprint/">SecurePoL film</a>.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="mh-film" role="group" aria-label="Animated explainer: statistical model watermarking detected by a Gaussian Z-test"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: blue=owner signal, grey=noise, red=thief, yellow=effect size">
    <span><i style="background:#58C4DD"></i> owner signal</span>
    <span><i style="background:#94a3b8"></i> fine-tuning noise</span>
    <span><i style="background:#fb7185"></i> thief / scrub</span>
    <span><i style="background:#fbbf24"></i> effect size d</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>A weak distributed signal can be easier to test than one large coordinate.</strong> In this teaching model, the owner shifts weights along a <em>secret unit pattern</em> w across k coordinates. Each coordinate-level shift ε can remain small relative to the assumed noise scale, while the registered aggregate statistic grows with k.</p>
    <p><strong>Detection is a matched filter, a one-sided Z-test.</strong> The verifier correlates the leaked weights against the secret pattern, <em>S = ⟨w, θ̂ − θ<sub>ref</sub>⟩</em>. The aligned marks add coherently to amplitude √k·ε, while the fine-tuning noise projects to a flat σ (because ‖w‖ = 1). Normalised, the statistic is N(0,1) for an innocent model and N(d,1) for a watermarked one, with effect size <em>d = √k·ε/σ</em>. Detection power is Φ(d − z<sub>α</sub>) at false-positive rate α.</p>
    <p><strong>The √k gain is conditional.</strong> With independent, equal-variance noise and a registered secret direction, the aggregate effect size is <em>d = √k·ε/σ</em>. Increasing k improves the ROC curve inside that model. Correlated noise, an uncertain reference, multiple testing or an adaptive attacker changes the result.</p>
    <p><strong>Bounded perturbation gives a bound, not immunity.</strong> If a scrub is constrained by ‖δ‖ ≤ ρ, Cauchy-Schwarz gives |ΔS| ≤ ρ. That does not prove the real model keeps its utility, nor that the watermark is unremovable. It only states how far this detector can move under the chosen norm budget.</p>
    <p><strong>Scientific Context:</strong> The film teaches the statistics behind one possible detector. It should not be cited as the mechanism of the author's 2024 paper. The published work uses feature-based watermarking integrated with <a href="/lab/training-fingerprint/">Proof-of-Learning</a>; its measured claims are presented there.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="mh-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/model-heist.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
