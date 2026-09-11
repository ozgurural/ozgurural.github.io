---
permalink: /lab/oracles/
oembed: "/lab/oracles/oembed.json"
title: "ML Oracles: Verifiable Claims for the Chain, animated"
description: "Can a contract trust an AI answer it did not compute? An animated comparison of zero-knowledge proofs, optimistic challenges, and their limits."
excerpt: "A proof checks computation. A challenge window lets others dispute a claim. Neither makes an AI answer automatically true."
sitemap: true
header:
  og_image: "lab-og/og-oracles.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-oracles" style="margin-top: 0;">
  <span class="ep-eyebrow">Smart Contracts × Machine Learning</span>
  <p class="lab-card__lead">An AI says a crop is damaged. Should a smart contract release the payment? An oracle can deliver the answer, but delivery is not verification. This animation compares <strong>zkML (Zero-Knowledge Machine Learning)</strong> with <strong>optimistic challenge windows</strong>, showing what each checks and what it leaves unresolved.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span><strong>Open research direction of the author</strong>, not yet published, and a natural continuation of the <a href="/publication/2023-ieee-access-survey">Blockchain-Enhanced ML survey</a> (IEEE Access 2023). The question: by what mechanism can a deterministic chain accept a claim about a probabilistic model it cannot re-execute? The film works through the candidate answers: zero-knowledge proofs of inference and optimistic challenge windows, and where each one currently breaks. Feedback and collaborators welcome.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="oracles-film" role="group" aria-label="Animated explainer: ML Oracles and verifiable inference"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=on-chain boundary, amber=off-chain compute, green=cryptographic proof (zkSNARK), rose=optimistic challenge / slash">
    <span><i style="background:#58C4DD"></i> on-chain boundary</span>
    <span><i style="background:#fbbf24"></i> off-chain compute</span>
    <span><i style="background:#83c167"></i> cryptographic proof (zkSNARK)</span>
    <span><i style="background:#fc6255"></i> optimistic challenge / slash</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The Blockchain is a closed system.</strong> A smart contract cannot make an API call to OpenAI or run a PyTorch script. It only knows what is posted to it. When an agreement requires complex pattern recognition (e.g., "Is this crop damage real?"), the classification <em>y = F_θ(x)</em> must happen off-chain.</p>
    <p><strong>The Verification Trilemma.</strong> We can trust an oracle implicitly (centralized, cheap), we can run the model on-chain (currently impractical for large <em>θ</em>), or we can use cryptographic or economic verification. Each choice moves the trust assumption rather than removing it.</p>
    <p><strong>Zero-Knowledge Inference (zkML).</strong> A prover generates a proof of an encoded computation; a verifier checks it. This verifies execution, not the truth of the input or the quality of the model. <a href="https://docs.ezkl.xyz/">EZKL's documentation</a> describes a concrete model-to-circuit workflow. Proof construction, verification cost, and security depend on the system used. The moving proof in the film is a schematic, not a trace of a specific proving system.</p>
    <p><strong>Optimistic Challenges.</strong> A proposer posts a claim and a bond. Others may dispute it during a challenge window. Disputes require a resolution mechanism; they do not universally reduce to a single machine instruction. <a href="https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work">UMA's oracle</a>, for example, resolves disputes through its Data Verification Mechanism. Unchallenged claims settle, but this depends on effective monitoring and credible disputes. The animation's claims and timings are illustrative, not measured rates.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="oracles-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<!-- KaTeX for typeset equations (used by the cinematic engine) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/oracles.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
