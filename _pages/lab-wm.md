---
permalink: /lab/model-heist/
oembed: "/lab/model-heist/oembed.json"
title: "Could This AI Be a Copy? Model Watermarks"
description: "How a watermark too faint to see in any single weight can become detectable across thousands of them under an explicit statistical model. A cinematic Z-test explainer."
excerpt: "Spread a faint statistical signature across k weights, read it back through fine-tuning noise with a matched filter, and watch detection power rise as √k."
sitemap: true
header:
  og_image: "lab-og/og-model-heist-film.jpg"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm" style="margin-top: 0;">
  <span class="ep-eyebrow">ML security · Model provenance</span>

  <div class="lab-film">
    <div class="lab-film__frame lab-film__frame--cinema">
      <iframe src="{{ '/films/model-heist/' | relative_url }}?autoplay=0" title="Could this AI be a copy? A film about model security and statistical evidence" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>

  <div class="lab-lvd">
  <p class="lab-card__lead">Your AI model leaks, and its weights are changed. Could you still recognise a copy? This film uses a statistical teaching model to show how a faint signed pattern accumulates, how a threshold controls chance matches, and how noise aligned with that pattern can invalidate the original calibration. The test assumes access to weights, a clean reference and a secret key.</p>
  <div class="lab-card__usecase">
    <strong>Research context:</strong>
    <span>The Gaussian matched-filter test is an illustrative model authored for this explainer. It is not the detector, formula or empirical benchmark in <a href="/publication/2024-ieee-access-watermarking">Ural and Yoshigoe’s IEEE Access 2024 paper</a>. That paper studies combining an embedded watermark with verification of the training record. The film explores the broader question of how to interpret statistical evidence of model provenance.</span>
  </div>
  <p class="lab-film__alt">Part of the model-ownership series. Start with <a href="/lab/training-fingerprint/">SecurePoL</a>, the research it comes from.</p>
  <p class="lab-film__alt">Prefer the technical version? <a href="{{ '/lab/model-heist/embed/' | relative_url }}" target="_blank" rel="noopener">Watch the original animation</a>: the same idea step by step, with its diagrams and formulas.</p>
  <aside class="lab-lvd__facts" aria-label="At a glance">
    <p class="lab-lvd__facts-title">At a glance</p>
    <dl>
      <div><dt>d = &radic;k&middot;&epsilon;/&sigma;</dt><dd>Effect size: grows with the number of marked weights k at a fixed per-weight change &epsilon;.</dd></div>
      <div><dt>AUC = &Phi;(d/&radic;2)</dt><dd>Detection quality in the stated Gaussian model.</dd></div>
      <div><dt>|&Delta;S| &le; &rho;</dt><dd>How far a weight change of norm &rho; can move the score.</dd></div>
      <div><dt>Teaching model</dt><dd>Not the detector or benchmark of the 2024 IEEE Access paper.</dd></div>
    </dl>
  </aside>
  </div>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Tiny secrets in many places can be less conspicuous than one big secret.</strong> A model has many internal numbers. Stamping one large value into a single weight is easy to target and may dent accuracy. Instead, the owner shifts the weights along a <em>secret unit pattern</em> w across k coordinates, each by a tiny ε that is small relative to the assumed noise floor.</p>
    <p><strong>Detection is a matched filter, a one-sided Z-test.</strong> The verifier correlates the leaked weights against the secret pattern, <em>S = ⟨w, θ̂ − θ<sub>ref</sub>⟩</em>. The aligned marks add coherently to amplitude √k·ε, while the fine-tuning noise projects to a flat σ (because ‖w‖ = 1). Normalised, the statistic is N(0,1) for an innocent model and N(d,1) for a watermarked one, with effect size <em>d = √k·ε/σ</em>. Detection power is Φ(d − z<sub>α</sub>) at false-positive rate α.</p>
    <p><strong>The √k can improve detection power without making each mark loud.</strong> Per weight, ε/σ can remain small. In the stated model, the aggregate d = √k·ε/σ can cross a chosen threshold as k grows, and the ROC curve approaches high power (AUC = Φ(d/√2)) when the assumptions hold. This keeps the per-coordinate change fixed, so the total perturbation norm grows with breadth. It is not a free gain at fixed total perturbation budget, or a guarantee in every deployment.</p>
    <p><strong>The scrubbing trade-off.</strong> To erase a spread mark, an attacker must change the coordinates that contribute to the secret pattern. For any unit-norm pattern <em>w</em>, the Cauchy–Schwarz bound ‖δ‖ ≤ ρ ⇒ |ΔS| = |⟨w, δ⟩| ≤ ρ describes how much the score can move for a bounded perturbation. The utility cost of a real scrubbing attack depends on its access, retraining procedure, and calibration; this is not a universal un-removability result.</p>
    <p><strong>Scientific Context:</strong> The film’s Gaussian Z-test is a separate teaching model. The related <a href="/publication/2024-ieee-access-watermarking">IEEE Access 2024 paper</a> studies joint watermark and <a href="/lab/training-fingerprint/">Proof-of-Learning</a> verification; it does not supply this test or its illustrative curves. A detection score supports an investigation under the stated assumptions, rather than establishing a legal ownership verdict.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="mh-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
  </div>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/model-heist.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
