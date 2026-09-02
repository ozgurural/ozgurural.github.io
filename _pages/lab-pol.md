---
permalink: /lab/training-fingerprint/
oembed: "/lab/training-fingerprint/oembed.json"
title: "Proof-of-Learning (SecurePoL), animated"
description: "Final weights are a snapshot anyone can copy. Proof-of-Learning records a training trajectory for sampled replay; SecurePoL adds a watermark-consistency check."
excerpt: "Can a model provide evidence of how it was trained? Plain Proof-of-Learning has known spoofing attacks; SecurePoL adds a second, watermark-consistency condition."
sitemap: true
header:
  og_image: "lab-og/og-pol.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-pol" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <p class="lab-card__lead">🔬 Anyone can download a model and claim they trained it: the final weights are just a tensor of numbers, copyable in milliseconds. Proof-of-Learning asks for evidence from the <strong>journey</strong>: checkpoints, batch indices and settings that a verifier can replay selectively. Later attacks showed that this evidence can be spoofed more cheaply than the original security target intended. The author's <strong>SecurePoL</strong> adds a separate watermark-consistency condition and measures it against two known spoofing routes.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Proof-of-Learning (Jia et al., IEEE S&amp;P 2021); watermark coupling in the author's <a href="/publication/2025-secureproofoflearning">"SecurePoL"</a> (IEEE Access 2025) and <a href="/publication/2025-dissertation">Ph.D. Dissertation</a>.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="pol-film" role="group" aria-label="Animated explainer: Proof-of-Learning, trajectory verification, and SecurePoL"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=legitimate / trajectory, amber=checkpoint / δ-ball, rose=adversary / spoof, amber=watermark">
    <span><i style="background:#58C4DD"></i> legitimate / trajectory</span>
    <span><i style="background:#fbbf24"></i> checkpoint · δ-ball</span>
    <span><i style="background:#fc6255"></i> adversary / spoof</span>
    <span><i style="background:#fbbf24"></i> watermark</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The journey is harder to fake than the destination.</strong> A model's final weights are trivially copyable, so ownership can't rest on them. But the <em>path</em> the optimizer took, the sequence of checkpoints W₀…W_T with the exact data batches and hyperparameters that drove each step, took a full training run to produce. Proof-of-Learning records that transcript: <em>P(f) = (W, I, H, A)</em>: checkpoints, batch indices, batch signatures, and auxiliary info.</p>
    <p><strong>Verification is cheaper because it spot-checks.</strong> Re-running the whole training would cost about as much as training. The original verifier sorts updates by magnitude, replays the top-Q segments per epoch, and checks whether each recomputed checkpoint lands within a slack ball δ that absorbs floating-point, hardware and optimizer nondeterminism. This targets large inconsistent jumps, but later attacks showed that plain Proof-of-Learning can still be spoofed without placing an obvious jump where the verifier expects one.</p>
    <p><strong>Security is a cost asymmetry, a goal, not a theorem.</strong> Honest proving costs one training run; forging attempts to construct a transcript that passes the sampled replay checks. The relation <em>E[C_A] ≥ E[C_T]</em> is a <em>design target</em> (Jia et al., 2021), and later work (Zhang et al. 2022; Fang et al. 2023) showed plain PoL can be spoofed. The author's work adds a watermark-consistency condition and measures its effect against two known spoofing routes; it does not claim to close every possible attack.</p>
    <p><strong>SecurePoL adds a watermark.</strong> Verification becomes a logical AND: a checkpoint must be trajectory-consistent (<em>d₂ ≤ δ</em>) <em>and</em> carry the secret <a href="/lab/model-heist/">watermark</a> (<em>W(f) = σ</em>). A forger must therefore reproduce both a plausible trajectory and a watermark-consistent ownership signal. The paper couples the immutable PoL log with three watermarking strategies rather than one: feature-based triggers, sparse parameter perturbations, and a non-intrusive auxiliary head.</p>
    <p><strong>What the paper measured.</strong> On CIFAR-10 with ResNet-20, the joint condition raises the cost of the two spoofing routes that break plain PoL, blindfold Top-Q and infinitesimal-update, while leaving the model useful: baseline accuracy moves by 0.00, 0.03 and 0.58 percentage points across the three strategies. Ownership verification is not free, but the price is small and stated: runtime overhead between 0.6% and 17.3%, and proof logs under 12 MB.</p>
    <p><strong>Scientific Context:</strong> A recorded training trajectory is non-monotone and hardware-sensitive, which is why the verifier uses a replay tolerance rather than demanding bitwise equality. The trajectory-plus-watermark construction and its measured overheads are detailed in the author's <a href="/publication/2025-secureproofoflearning">"SecurePoL"</a> (IEEE Access 2025) and <a href="/publication/2025-dissertation">Ph.D. Dissertation</a>.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="pol-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/proof-of-learning.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
