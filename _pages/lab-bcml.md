---
permalink: /lab/blockchain-ml/
title: "Blockchain-Enhanced Machine Learning, animated"
description: "What a ledger actually buys machine learning: consensus that trains instead of hashing (PoL, PoDL, PoQ), incentive contracts that pay for the improvement you caused, and the measured limits DeepChain and LearningChain ran into."
excerpt: "Point the electricity at a model instead of a hash, pay contributors by the loss they removed, and read the prototypes honestly: accuracy rises with parties while throughput falls."
sitemap: true
header:
  og_image: "lab-og/og-bcml.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-bcml" style="margin-top: 0;">
  <span class="ep-eyebrow">Distributed Systems · Machine Learning · Consensus</span>
  <p class="lab-card__lead">⛓ A ledger is a strange thing to put under machine learning, and the interesting question is what it actually buys. This animation follows the survey’s own line of argument: the three ML problems a tamper-evident record addresses, the consensus mechanisms that channel compute into <strong>training rather than hashing</strong> (Proof of Learning, Proof of Deep Learning, Proof of Training Quality), the incentive contracts that pay a contributor by the loss their data removed, and then the part most reviews leave out: what the prototypes measured when someone actually built them.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>The author’s survey <a href="/publication/2023-ieee-access-survey">"Survey on Blockchain-Enhanced Machine Learning"</a> (Ural &amp; Yoshigoe, IEEE Access 11, 2023, pp. 145331–145362). Every mechanism named in the film is one the survey reviews (PoL / PoDL / PoQ consensus, the Sharing Updatable Model incentive contracts, DeepChain and LearningChain), and every reported behaviour is one it documents. The survey’s stated stance is deliberately balanced, presenting limitations alongside opportunities, which is why this film ends on measured degradation rather than on a promise.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="bcml-film" role="group" aria-label="Animated explainer: ledger-backed training integrity, training-as-consensus, incentive contracts, and the measured limits of the prototypes"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=honest participant and model, amber=ledger, rose=threat or measured degradation, green=rewarded contribution">
    <span><i style="background:#58C4DD"></i> participant · model</span>
    <span><i style="background:#fbbf24"></i> ledger · record</span>
    <span><i style="background:#fc6255"></i> threat · measured cost</span>
    <span><i style="background:#83C167"></i> rewarded · accepted</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The ledger records the process, not the data.</strong> ML has three problems a distributed ledger is unusually well suited to: training data poisoned by contributors who still collect a reward, models that leak the data they were trained on, and finished weights that carry no record of what happened to them. Recording every transaction tied to the training process makes tampering evident. Note what stays off chain: raw data remains with its owner, while parameters, transactions and validation results are shared. That is what makes the arrangement privacy-preserving rather than merely public.</p>
    <p><strong>Consensus can produce something instead of discarding it.</strong> Proof of Work spends electricity on a puzzle whose answer is worthless the moment it is found. Proof of Learning makes the training run itself the work that earns consensus; Proof of Deep Learning extends this to the integrity and authenticity of the resulting model; Proof of Training Quality asks the network to agree not merely that work happened but that the contribution was good. The same electricity now buys a trained model, and inherits one hard question in exchange: how do you verify the work was really done?</p>
    <p><strong>Pay for the improvement, not the volume.</strong> In the Sharing Updatable Model framework a smart contract, CollaborativeTrainer, accepts data, runs an incentive mechanism and updates the model in one place. The prediction-market reward moves a contributor's balance by <em>b<sub>t</sub> = b<sub>t−1</sub> + L(h<sub>t−1</sub>, D) − L(h<sub>t</sub>, D)</em>: the loss on a held-out set before your update minus the loss after it. Submit noise and the term is negative. A companion mechanism (deposit, refund, take) requires a stake when submitting, refunds it after a waiting period if the data holds up, and forfeits it when the model disagrees with your label. In simulation the honest and dishonest populations separate cleanly while accuracy is preserved.</p>
    <p><strong>Then read the prototypes honestly.</strong> DeepChain was actually built: a Corda prototype on MNIST, with parties uploading local gradients and workers paid through a processing contract. Accuracy improves as more parties join, exactly as the argument predicts; but throughput degrades as the gradient count grows, and total training time climbs with every party added. LearningChain shows the companion trade-off: differential-privacy noise buys real privacy and costs real test accuracy, while its l-nearest aggregation blunts Byzantine workers rather than removing them.</p>
    <p><strong>Which is why the survey closes on challenges.</strong> Scalability, energy cost, and the need for consensus mechanisms designed for machine learning rather than inherited from cryptocurrency. A review that only sells the idea is worth nothing; the contribution is knowing precisely where the seams are. One of those seams, verifying that a claimed training run really happened, became the subject of the author's <a href="/lab/training-fingerprint/">Proof-of-Learning research</a> and <a href="/publication/2025-dissertation">dissertation</a>.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="bcml-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/bcml.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
