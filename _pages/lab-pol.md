---
permalink: /lab/training-fingerprint/
title: "Proof-of-Learning (SecurePoL), animated"
description: "Final weights are a snapshot anyone can copy, but the path that produced them is a one-way function of compute. A cinematic, PhD-level explainer of Proof-of-Learning."
excerpt: "Prove a model was trained, not downloaded. The loss-curve trajectory is cheap to produce honestly and expensive to forge, and SecurePoL binds it to a watermark."
sitemap: true
header:
  og_image: "lab-og/og-pol.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-pol" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <p class="lab-card__lead">🔬 Anyone can download a model and claim they trained it — the final weights are just a tensor of numbers, copyable in milliseconds. The proof is in the <strong>journey</strong>: a real training run leaves a checkpoint trajectory that took a full run to generate and is expensive to forge. This animation builds the idea from the ground up — why the path beats the point, how a verifier spot-checks it cheaply, the prover/adversary cost asymmetry, and how the author's <strong>SecurePoL</strong> seals the remaining crack with a watermark.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Proof-of-Learning (Jia et al., IEEE S&amp;P 2021); watermark coupling in the author's <a href="/publication/2025-secureproofoflearning">"SecurePoL"</a> (IEEE Access 2025) and <a href="/publication/2025-dissertation">Ph.D. Dissertation</a>.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="pol-film" role="group" aria-label="Animated explainer: Proof-of-Learning, trajectory verification, and SecurePoL"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=legitimate / trajectory, amber=checkpoint / δ-ball, rose=adversary / spoof, amber=watermark">
    <span><i style="background:#58c4dd"></i> legitimate / trajectory</span>
    <span><i style="background:#fbbf24"></i> checkpoint · δ-ball</span>
    <span><i style="background:#fc6255"></i> adversary / spoof</span>
    <span><i style="background:#fbbf24"></i> watermark</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The journey is harder to fake than the destination.</strong> A model's final weights are trivially copyable, so ownership can't rest on them. But the <em>path</em> the optimizer took — the sequence of checkpoints W₀…W_T with the exact data batches and hyperparameters that drove each step — took a full training run to produce. Proof-of-Learning records that transcript: <em>P(f) = (W, I, H, A)</em> — checkpoints, batch indices, batch signatures, and auxiliary info.</p>
    <p><strong>Verification is cheap because it spot-checks.</strong> Re-running the whole training would cost as much as training. Instead the verifier exploits a structural fact: honest gradient steps are small, so a forger taking shortcuts must hide a few oversized jumps. It sorts updates by magnitude, replays only the top-Q segments per epoch, and checks each recomputed checkpoint lands within a slack ball δ (which absorbs floating-point, hardware, and optimizer nondeterminism). A spoofed jump can't fit inside δ.</p>
    <p><strong>Security is a cost asymmetry — a goal, not a theorem.</strong> Honest proving costs one training run; forging means inverting SGD against randomly sampled checkpoints. Because the entropy of the process grows roughly linearly in the number of steps T, the space of consistent paths grows exponentially. The relation <em>E[C_A] ≥ E[C_T]</em> is a <em>design property</em> (Jia et al., 2021) — and later work (Zhang et al. 2022; Fang et al. 2023) showed plain PoL can be spoofed, which is exactly the gap the author's work closes.</p>
    <p><strong>SecurePoL seals it with a watermark.</strong> Verification becomes a logical AND: a checkpoint must be trajectory-consistent (<em>d₂ ≤ δ</em>) <em>and</em> carry the secret feature watermark (<em>W(f) = σ</em>). A fabricated transcript can mimic the loss curve, but it can't carry a mark it never trained to embed — so spoofing collapses back to doing the real training.</p>
    <p><strong>Scientific Context:</strong> The genuine loss trajectory descends <em>in expectation</em> (SGD is non-monotone) with heavy-tailed step sizes — a high-entropy fingerprint of compute expended. The trajectory-plus-watermark construction is detailed in the author's <a href="/publication/2025-secureproofoflearning">"SecurePoL"</a> (IEEE Access 2025) and <a href="/publication/2025-dissertation">Ph.D. Dissertation</a>.</p>
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
