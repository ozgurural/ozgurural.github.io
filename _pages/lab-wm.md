---
permalink: /lab/model-heist/
oembed: "/lab/model-heist/oembed.json"
title: "Model Heist Detector: AI watermarks, animated"
description: "How a watermark too faint to see in any single weight can become detectable across thousands of them under an explicit statistical model. A cinematic Z-test explainer."
excerpt: "Spread a faint statistical signature across k weights, read it back through fine-tuning noise with a matched filter, and watch detection power rise as √k."
sitemap: true
header:
  og_image: "lab-og/og-wm.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm" style="margin-top: 0;">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <p class="lab-card__lead">🕵️ Someone leaks your AI and fine-tunes it just enough to look different. Before you publish, you spread a faint statistical signature across many weights, each mark small against the noise. This animation explores why <strong>k tiny correlated marks</strong> read through a matched filter can give detection power that grows as <strong>√k</strong> in the stated model. Robustness still depends on calibration, the attack, and the assumptions behind the test.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>This film animates the detection side of the problem: a mark spread across many parameters, read back with a matched filter, and why the evidence grows as √k. The aggregate Gaussian Z-test is the film's model of that step, not a formula taken from the paper. The paper it accompanies, <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024), embeds the mark in the model's internal features rather than its output behaviour, and checks it alongside the Proof-of-Learning trajectory so that a forger has to satisfy both conditions at once.</span>
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
    <p><strong>Tiny secrets in many places can be less conspicuous than one big secret.</strong> A model has many internal numbers. Stamping one large value into a single weight is easy to target and may dent accuracy. Instead, the owner shifts the weights along a <em>secret unit pattern</em> w across k coordinates, each by a tiny ε that is small relative to the assumed noise floor.</p>
    <p><strong>Detection is a matched filter, a one-sided Z-test.</strong> The verifier correlates the leaked weights against the secret pattern, <em>S = ⟨w, θ̂ − θ<sub>ref</sub>⟩</em>. The aligned marks add coherently to amplitude √k·ε, while the fine-tuning noise projects to a flat σ (because ‖w‖ = 1). Normalised, the statistic is N(0,1) for an innocent model and N(d,1) for a watermarked one, with effect size <em>d = √k·ε/σ</em>. Detection power is Φ(d − z<sub>α</sub>) at false-positive rate α.</p>
    <p><strong>The √k can improve detection power without making each mark loud.</strong> Per weight, ε/σ can remain small. In the stated model, the aggregate d = √k·ε/σ can cross a chosen threshold as k grows, and the ROC curve approaches high power (AUC = Φ(d/√2)) when the assumptions hold. More breadth is not the same as certainty in every deployment.</p>
    <p><strong>The scrubbing trade-off.</strong> To erase a spread mark, an attacker must change the coordinates that contribute to the secret pattern. Because <em>w is secret</em>, the simple bound ‖δ‖ ≤ ρ ⇒ |ΔS| = |⟨w, δ⟩| ≤ ρ describes how much the score can move for a bounded perturbation. The utility cost of a real scrubbing attack depends on its access, retraining procedure, and calibration; this is not a universal un-removability result.</p>
    <p><strong>Scientific Context:</strong> This film illustrates one possible statistical check for model provenance after a leak. The Z-test formulation and its coupling to <a href="/lab/training-fingerprint/">Proof-of-Learning</a> are discussed in the author's paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</p>
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
