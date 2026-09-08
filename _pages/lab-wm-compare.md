---
permalink: /lab/watermarking-comparison/
oembed: "/lab/watermarking-comparison/oembed.json"
title: "The Watermarking Wars: Capacity vs. Robustness, animated"
seo_title: "The Watermarking Wars, animated"
description: "A cinematic explainer comparing ML watermarking strategies: parameter perturbations, feature triggers, generative green-lists, and auxiliary heads."
excerpt: "How do you claim ownership of a stolen model? We animate four major strategies: white-box sparse parameter perturbations, black-box feature-based triggers, generative LLM green-listing, and non-intrusive auxiliary heads."
sitemap: true
header:
  og_image: "lab-og/og-wm-compare.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm-compare" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning Security</span>
  <p class="lab-card__lead">An evolution of the <a href="/lab/model-heist/"><em>Model Heist Detector</em></a>. Rather than examining a single Z-test, this animation explores the entire spectrum of model watermarking strategies. We compare the mathematical capacity and evasion robustness of <strong>white-box</strong> (sparse parameter perturbations), <strong>black-box</strong> (feature-based triggers), <strong>generative</strong> (LLM token bias), and <strong>architecture-level</strong> (non-intrusive auxiliary heads) watermarks.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Cross-paper comparison: <a href="https://www.usenix.org/conference/usenixsecurity18/presentation/adi">Adi et al. (2018)</a> for trigger sets, <a href="https://proceedings.mlr.press/v202/kirchenbauer23a.html">Kirchenbauer et al. (2023)</a> for green-list generation, and the author's <a href="https://commons.erau.edu/edt/905/">dissertation</a> for SecurePoL variants. Animated scores and token streams are illustrative, not a shared benchmark.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="wm-compare-film" role="group" aria-label="Animated explainer: Comparing ML Watermarking Models"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=parameter perturbation (white-box), amber=feature triggers (black-box), green=green-list tokens (LLMs), violet=auxiliary head (architecture), rose=scrubbing evasion attack">
    <span><i style="background:#58C4DD"></i> parameter perturbation (white-box)</span>
    <span><i style="background:#fbbf24"></i> feature triggers (black-box)</span>
    <span><i style="background:#83c167"></i> green-list tokens (LLMs)</span>
    <span><i style="background:#9a72ac"></i> auxiliary head (architecture)</span>
    <span><i style="background:#fc6255"></i> scrubbing evasion attack</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The Threat Model Dictates the Defense.</strong> If a thief steals your weights and deploys them publicly, you can download the weights and run a statistical test (White-box). But if they hide the model behind an API, you must prove ownership using only queries and responses (Black-box).</p>
    <p><strong>Sparse Parameter Perturbations (White-box).</strong> The verifier needs access to model weights. Robustness depends on the mark, threshold, and attack budget; the illustrated Z-test does not make false positives impossible.</p>
    <p><strong>Feature-Based Triggers (Black-box).</strong> Secret input-label associations provide an ownership signal through model queries. Adi et al. evaluate utility and robustness empirically. A matching label alone is not conclusive evidence of theft.</p>
    <p><strong>Generative Watermarking (LLMs).</strong> For language models, the watermarking happens at generation time. A pseudo-random hash of the previous token splits the vocabulary into a "Green list" and a "Red list".</p>
    <p><strong>Non-Intrusive Auxiliary Head (SecurePoL).</strong> A separate classifier uses shared features for verification and may be pruned by an attacker. SecurePoL combines this signal with a separate <a href="/lab/training-fingerprint/">trajectory check</a>; it is not an unremovable watermark.</p>
    <p><strong>Conditional comparison.</strong> Capacity, utility impact, and robustness depend on access, detector calibration, and the attack tested. The film does not establish one universal ranking or bound across these mechanisms. Its 50% null expectation and roughly 75% green-token stream are illustrative settings.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="wm-compare-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<!-- KaTeX for typeset equations (used by the cinematic engine) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/wm-compare.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
