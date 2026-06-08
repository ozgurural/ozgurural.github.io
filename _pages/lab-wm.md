---
permalink: /lab/model-heist/
title: "Model Heist Detector — AI watermarks, animated"
description: "How a watermark too faint to see in any single weight becomes a courtroom-grade signature across thousands of them. A cinematic, PhD-level Z-test explainer."
excerpt: "Spread a faint statistical signature across k weights, read it back through fine-tuning noise with a matched filter, and watch detection power rise as √k."
sitemap: true
---

<a href="/lab/" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; text-decoration: none; font-weight: 600;"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm" style="margin-top: 0;">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>Model Heist Detector</h2>
  <p class="lab-card__lead">🕵️ Someone leaks your AI and fine-tunes it just enough to look different. Before you ever published, you spread a faint statistical signature across thousands of weights — each mark too small to notice, but together a fingerprint only you can read. This animation shows why that works: one big mark is fragile, but <strong>k tiny correlated marks</strong> read back through a matched filter give detection power that climbs as <strong>√k</strong> — invisible in any one weight, undeniable across all of them.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Implements robust statistical watermarking, modelled as an aggregate Gaussian Z-test over k weights. See the author's paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="mh-film" role="img" aria-label="Animated explainer: statistical model watermarking detected by a Gaussian Z-test"></div>
  </div>

  <p class="lab-film__legend" aria-hidden="true">
    <span><i style="background:#38bdf8"></i> owner signal</span>
    <span><i style="background:#94a3b8"></i> fine-tuning noise</span>
    <span><i style="background:#fb7185"></i> thief / scrub</span>
    <span><i style="background:#fbbf24"></i> effect size d</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Tiny secrets in many places beat one big secret.</strong> A model has hundreds of millions of internal numbers. Stamping one large value into a single weight fails twice — it's conspicuous (a thief finds and erases it) and it's large (it dents accuracy). Instead, the owner shifts the weights along a <em>secret unit pattern</em> w across k coordinates, each by a tiny ε that's invisible against the noise floor.</p>
    <p><strong>Detection is a matched filter — a one-sided Z-test.</strong> The verifier correlates the leaked weights against the secret pattern, <em>S = ⟨w, θ̂ − θ<sub>ref</sub>⟩</em>. The aligned marks add coherently to amplitude √k·ε, while the fine-tuning noise projects to a flat σ (because ‖w‖ = 1). Normalised, the statistic is N(0,1) for an innocent model and N(d,1) for a watermarked one, with effect size <em>d = √k·ε/σ</em>. Detection power is Φ(d − z<sub>α</sub>) at false-positive rate α.</p>
    <p><strong>The √k decouples stealth from certainty.</strong> Per weight, ε/σ ≪ 1 — utility-preserving and undetectable. But the aggregate d = √k·ε/σ crosses any threshold for large enough k, so the ROC curve snaps to the perfect corner (AUC = Φ(d/√2)) just by adding marks. You buy confidence with breadth, not loudness.</p>
    <p><strong>The scrubbing paradox.</strong> To erase a spread mark the thief must perturb all k coordinates at once — and because <em>w is secret</em>, he can't aim his utility budget at it: ‖δ‖ ≤ ρ ⇒ |ΔS| = |⟨w, δ⟩| ≤ ρ. Scrubbing blindly wrecks the model's usefulness long before it removes the signature, and the matched filter just re-weights the survivors. The very constraint that keeps the stolen model useful is what makes the watermark un-removable.</p>
    <p><strong>Scientific Context:</strong> This is how labs plan to prove "that model is ours" after a leak, and the same statistics underlie AI-text detection and camera provenance. The Z-test formulation and its coupling to Proof-of-Learning are detailed in the author's paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="mh-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/model-heist.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
