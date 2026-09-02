---
permalink: /lab/watermarking-comparison/
oembed: "/lab/watermarking-comparison/oembed.json"
title: "AI Watermarking Field Guide, animated"
description: "A cinematic explainer comparing ML watermarking strategies: parameter perturbations, feature triggers, generative green-lists, and auxiliary heads."
excerpt: "How do you claim ownership of a stolen model? We animate four major strategies: white-box sparse parameter perturbations, black-box feature-based triggers, generative LLM green-listing, and non-intrusive auxiliary heads."
sitemap: true
header:
  og_image: "lab-og/og-wm-compare.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm-compare" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning Security</span>
  <p class="lab-card__lead">Watermarking is not one mechanism. This field guide compares four examples with different access assumptions: <strong>white-box</strong> parameter perturbations, <strong>black-box</strong> trigger sets, <strong>generative</strong> LLM token bias, and <strong>architecture-level</strong> auxiliary heads. The goal is not to rank them on one universal scale, but to show that a detector is meaningful only after its threat model and access requirements are stated.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span><strong>Cross-paper synthesis, not one published mechanism.</strong> Black-box trigger sets follow Adi et al. (USENIX Security 2018); keyed green-list generation follows Kirchenbauer et al. (ICML 2023). Parameter perturbation and auxiliary-head examples follow the author's SecurePoL dissertation and paper. Illustrative parameters are labelled in the film.</span>
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
    <p><strong>Sparse Parameter Perturbations (White-box).</strong> A mark embedded directly into selected parameters. Verification requires access to the suspected model's weights. Robustness to fine-tuning is empirical and depends on embedding strength, attack budget and detector threshold.</p>
    <p><strong>Feature-Based Triggers (Black-box).</strong> You poison the model during training to classify specific noise or feature patterns as a secret label. If the API returns that label for your secret noise, it's your model. The math here relies on the over-parameterization of neural networks to memorize random noise without hurting primary task utility.</p>
    <p><strong>Generative Watermarking (LLMs).</strong> For language models, the watermark is added at decoding time. A keyed hash of prior context selects a green-list fraction γ, then a logit bias δ softly promotes those tokens. The detector tests whether green-token counts exceed the null expectation γT. The film's 50% and 75% values are an illustrative γ = 0.5 example, not constants reported for every model.</p>
    <p><strong>Non-Intrusive Auxiliary Head (SecurePoL).</strong> A separate classifier branches from shared latent features and is trained alongside the main task. It can be pruned, so SecurePoL treats it as one ownership signal combined with a separate training-trajectory check, not as an unremovable mark.</p>
    <p><strong>The comparison is conditional.</strong> Capacity, utility impact and robustness depend on access, detector thresholds and the attack being tested. The useful question is not which watermark wins universally, but which claim survives the stated threat model.</p>
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
