---
permalink: /lab/training-fingerprint/
oembed: "/lab/training-fingerprint/oembed.json"
title: "Proof-of-Learning (SecurePoL), animated"
description: "How Proof-of-Learning checks training records, where spoofing attacks exploit it, and how SecurePoL combines trajectory and watermark verification."
excerpt: "Final weights can be copied. Training records and watermarks provide additional evidence, with security that depends on the verifier and threat model."
sitemap: true
header:
  og_image: "lab-og/og-pol.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-pol" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <p class="lab-card__lead">Final weights do not establish who trained a model. <strong>Proof-of-Learning</strong> records intermediate checkpoints and information needed to replay training segments. This film introduces that verification idea, its vulnerability to spoofing, and the additional watermark check in <strong>SecurePoL</strong>. The animated curves are illustrations, not a detector or a proof of security.</p>
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
    <p><strong>Spot-checks have limits.</strong> The original verifier replays the largest updates and compares reconstructed checkpoints within a tolerance δ. Subsequent attacks exploit what this partial verification leaves unchecked; a plausible loss curve alone establishes nothing.</p>
    <p><strong>Cost asymmetry is a design goal.</strong> A useful proof should be cheaper to verify than to create, and no cheaper to forge than honest training. The branching tree illustrates naive reverse search, not a lower bound on every attack.</p>
    <p><strong>SecurePoL adds an ownership signal.</strong> Its verifier requires both a consistent trajectory and a watermark. The <a href="https://commons.erau.edu/edt/905/">dissertation</a> evaluates feature-based, parameter-perturbation, and auxiliary-head variants against specified attacks. This raises the cost of the tested attacks; it does not establish universal unforgeability.</p>
    <p><strong>What the paper measured.</strong> On CIFAR-10 with ResNet-20, the joint condition raises the cost of the two spoofing routes that break plain PoL, blindfold Top-Q and infinitesimal-update, while leaving the model useful: baseline accuracy moves by 0.00, 0.03 and 0.58 percentage points across the three strategies. Ownership verification is not free, but the price is small and stated: runtime overhead between 0.6% and 17.3%, and proof logs under 12 MB.</p>
    <p><strong>Reading the curves.</strong> Noise or smoothness in a plotted loss curve cannot authenticate a training run. Verification depends on the underlying transcript, watermark, tolerance, and threat model. See <a href="/publication/2025-secureproofoflearning">SecurePoL</a> for the evaluated construction.</p>
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
