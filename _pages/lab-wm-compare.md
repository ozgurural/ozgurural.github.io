---
permalink: /lab/watermarking-comparison/
oembed: "/lab/watermarking-comparison/oembed.json"
title: "Signing an AI model: model watermarking, animated"
seo_title: "Signing an AI model, animated"
description: "A narrated film on model watermarking: three places to hide a signature in a model (its answers, its weights, an auxiliary head), and why the mark should be tied to the training record."
excerpt: "How do you claim ownership of a stolen model? Three kinds of model watermark compared: black-box feature triggers, white-box sparse parameter perturbations, and non-intrusive auxiliary heads."
sitemap: true
header:
  og_image: "lab-og/og-wm-compare.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm-compare" style="margin-top: 0;">
  <span class="ep-eyebrow">Machine Learning Security</span>
  <p class="lab-card__lead">A stolen model runs inside someone else&rsquo;s product. How does its owner show it is theirs? This film compares three kinds of <strong>model watermark</strong>, where the signature is trained into the model itself: <strong>black-box</strong> (answers to a set of secret inputs), <strong>white-box</strong> (a sparse pattern in the weights), and <strong>architecture-level</strong> (a non-intrusive auxiliary head). It ends on the weakness they share, and on tying the mark to the training record. A companion to the <a href="/lab/model-heist/"><em>Model Heist Detector</em></a>.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>The author&rsquo;s <a href="/publication/2025-secureproofoflearning">SecurePoL paper</a> (Ural &amp; Yoshigoe, IEEE Access 2025) and <a href="https://commons.erau.edu/edt/905/">dissertation</a>, which train one design from each of the three watermark families under one regime and compare them; trigger sets follow <a href="https://www.usenix.org/conference/usenixsecurity18/presentation/adi">Adi et al. (2018)</a>. The examples in the film are illustrations, not a shared benchmark.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame lab-film__frame--cinema">
      <iframe src="{{ '/films/watermark/' | relative_url }}?autoplay=0" title="Signing an AI model: a narrated film on model watermarking" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>
  </div>


  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The Threat Model Dictates the Defense.</strong> If a thief steals your weights and deploys them publicly, you can download the weights and run a statistical test (White-box). But if they hide the model behind an API, you must prove ownership using only queries and responses (Black-box).</p>
    <p><strong>Sparse Parameter Perturbations (White-box).</strong> The verifier needs access to model weights. Robustness depends on the mark, threshold, and attack budget; a statistical test on the weights does not make false positives impossible.</p>
    <p><strong>Feature-Based Triggers (Black-box).</strong> Secret input-label associations provide an ownership signal through model queries. Adi et al. evaluate utility and robustness empirically. A matching label alone is not conclusive evidence of theft.</p>
    <p><strong>Not covered here: watermarking generated text.</strong> Marking what a language model writes (for example a keyed green list of tokens, <a href="https://proceedings.mlr.press/v202/kirchenbauer23a.html">Kirchenbauer et al., 2023</a>) is a separate technique with a separate purpose. This page is about marking the model itself.</p>
    <p><strong>Non-Intrusive Auxiliary Head (SecurePoL).</strong> A separate classifier uses shared features for verification and may be pruned by an attacker. SecurePoL combines this signal with a separate <a href="/lab/training-fingerprint/">trajectory check</a>; it is not an unremovable watermark.</p>
    <p><strong>Conditional comparison.</strong> Capacity, utility impact, and robustness depend on access, detector calibration, and the attack tested. The film does not establish one universal ranking or bound across these mechanisms.</p>
  </details>

</section>

<!-- KaTeX for typeset equations (used by the cinematic engine) -->
