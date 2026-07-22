---
permalink: /lab/watermarking-comparison/
title: "The Watermarking Wars: Capacity vs. Robustness, animated"
description: "A cinematic explainer comparing ML watermarking strategies: parameter perturbations, feature triggers, generative green-lists, and auxiliary heads."
excerpt: "How do you claim ownership of a stolen model? We animate four major strategies: white-box sparse parameter perturbations, black-box feature-based triggers, generative LLM green-listing, and non-intrusive auxiliary heads."
sitemap: true
header:
  og_image: "lab-og/og-wm-compare.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm-compare" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning Security</span>
  <p class="lab-card__lead">An evolution of the <em>Model Heist Detector</em>. Rather than examining a single Z-test, this animation explores the entire landscape of model watermarking strategies. We compare the mathematical capacity and evasion robustness of <strong>white-box</strong> (sparse parameter perturbations), <strong>black-box</strong> (feature-based triggers), <strong>generative</strong> (LLM token bias), and <strong>architecture-level</strong> (non-intrusive auxiliary heads) watermarks.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Synthesizing state-of-the-art watermarking capacity bounds and robustness theorems. Trigger set analysis follows Adi et al. (2018), generative watermarking follows Kirchenbauer et al. (2023).</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="wm-compare-film" role="group" aria-label="Animated explainer: Comparing ML Watermarking Models"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=parameter perturbation (white-box), amber=feature triggers (black-box), green=green-list tokens (LLMs), violet=auxiliary head (architecture), rose=scrubbing evasion attack">
    <span><i style="background:#58c4dd"></i> parameter perturbation (white-box)</span>
    <span><i style="background:#fbbf24"></i> feature triggers (black-box)</span>
    <span><i style="background:#83c167"></i> green-list tokens (LLMs)</span>
    <span><i style="background:#9a72ac"></i> auxiliary head (architecture)</span>
    <span><i style="background:#fc6255"></i> scrubbing evasion attack</span>
  </p>

  <details class="lab-reveal" open>
    <summary>▸ What did you just learn?</summary>
    <p><strong>The Threat Model Dictates the Defense.</strong> If a thief steals your weights and deploys them publicly, you can download the weights and run a statistical test (White-box). But if they hide the model behind an API, you must prove ownership using only queries and responses (Black-box).</p>
    <p><strong>Sparse Parameter Perturbations (White-box).</strong> A high-capacity mark embedded directly into the parameter vectors. It survives fine-tuning but requires full access to the stolen model to verify.</p>
    <p><strong>Feature-Based Triggers (Black-box).</strong> You poison the model during training to classify specific noise or feature patterns as a secret label. If the API returns that label for your secret noise, it's your model. The math here relies on the over-parameterization of neural networks to memorize random noise without hurting primary task utility.</p>
    <p><strong>Generative Watermarking (LLMs).</strong> For language models, the watermarking happens at generation time. A pseudo-random hash of the previous token splits the vocabulary into a "Green list" and a "Red list".</p>
    <p><strong>Non-Intrusive Auxiliary Head (SecurePoL).</strong> Instead of modifying the main task, you branch off the latent layers to train a secret auxiliary classifier. The attacker may prune it to evade detection, but its footprint remains locked in the Proof-of-Learning trajectory.</p>
    <p><strong>The Fundamental Trade-off.</strong> Watermarks face a strict theoretical bound: <em>Capacity vs. Distortion vs. Robustness</em>. An attacker attempting to scrub the watermark adds noise. We animate how each strategy degrades under evasion attacks.</p>
  </details>

  <details class="lab-reveal">
    <summary>▸ The math, precisely</summary>
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
