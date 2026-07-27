---
permalink: /lab/blockchain-ml/
title: "Blockchain-Enhanced Machine Learning, animated"
description: "What a ledger can and cannot do for machine learning: Merkle commitments over training data, commit-reveal federated rounds, contribution-proportional incentives, and the four-order-of-magnitude throughput ceiling that decides the architecture."
excerpt: "Weights forget where they came from. A cinematic walk through the survey: commit don't store, order rounds by consensus, pay for contribution — and the ceiling that keeps training off chain."
sitemap: true
header:
  og_image: "lab-og/og-bcml.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-bcml" style="margin-top: 0;">
  <span class="ep-eyebrow">Distributed Systems · Machine Learning · Provenance</span>
  <p class="lab-card__lead">⛓ Training is a one-way map: the finished weights carry no record of the batches that produced them, so a poisoned run and a clean run ship the same accuracy number. This animation builds the case from the survey up — why the ledger stores <strong>commitments</strong> and never data, how a commit–reveal round makes contribution a fact rather than a claim, what robust aggregation genuinely bounds, and the throughput ceiling that forces training off chain and settlement onto it.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>The author's survey <a href="/publication/2023-ieee-access-survey">"Survey on Blockchain-Enhanced Machine Learning"</a> (Ural &amp; Yoshigoe, IEEE Access 2023, pp. 145331–145362), covering consensus-driven data provenance, on-chain federated learning and incentive design across 120+ papers.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="bcml-film" role="group" aria-label="Animated explainer: blockchain-enhanced machine learning — provenance commitments, federated rounds, incentives and throughput limits"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=honest participant / data, amber=ledger and commitments, rose=adversary or rejected, green=accepted and rewarded">
    <span><i style="background:#58C4DD"></i> participant · data · off chain</span>
    <span><i style="background:#fbbf24"></i> ledger · commitment</span>
    <span><i style="background:#fc6255"></i> poisoned · trimmed</span>
    <span><i style="background:#83C167"></i> accepted · rewarded</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Weights are amnesiac.</strong> Training maps a corpus to a tensor of floats, and the map is lossy and one-way. Nothing in the finished model says which shards fed it, so auditing the artefact cannot recover its history — a poisoned run and a clean run can report the same headline accuracy. Provenance has to be recorded <em>while training happens</em>, in a log no single participant can rewrite afterwards.</p>
    <p><strong>Commit, don't store.</strong> Putting a training set on chain is economically absurd and publishes every record. Instead you hash each shard, hash the hashes pairwise, and climb to one 32-byte <em>Merkle root</em>. That root anchors terabytes, and proving a record belongs costs log₂n sibling hashes. Change one byte and the root no longer matches: tampering isn't prevented, it's made undeniable. Note the limit precisely — the root proves <strong>integrity</strong>, never <strong>quality</strong>.</p>
    <p><strong>A round becomes a fact, not a claim.</strong> Federated learning keeps raw data home but still needs a referee nobody owns. Each client publishes <em>h_k = H(Δ_k ‖ r_k)</em> before seeing anyone else's update, so no one can copy a neighbour's gradient and bill for it; then everyone reveals and the chain checks the reveal against the hash it already holds, in an order no participant controls.</p>
    <p><strong>Robust aggregation bounds a minority, not an adversary.</strong> Plain FedAvg is a weighted mean, and a mean has breakdown point zero — a single unbounded update drags it anywhere. A trimmed mean or coordinate median restores a finite breakdown point and drops the crude outlier. It does <em>not</em> catch small, in-distribution poisoning: the ledger records who contributed, it does not judge what.</p>
    <p><strong>The ceiling decides the architecture.</strong> One GPU issues on the order of 10⁵ SGD updates per second; Ethereum settles ~15 transactions per second and a fast rollup a few thousand. That gap is roughly four orders of magnitude and it is structural — consensus costs a network round trip, gradient descent costs a matrix multiply. So the division of labour is forced: training, gradients and data stay off chain; commitments, identity and settlement go on it. Any system advertising "training on the blockchain" is describing an off-chain trainer with an on-chain receipt.</p>
    <p><strong>Scientific Context:</strong> The taxonomy, the mechanisms and the open challenges are developed across 120+ works in the author's <a href="/publication/2023-ieee-access-survey">IEEE Access survey</a> (2023). The provenance argument here is the same one that motivates the author's later <a href="/lab/training-fingerprint/">Proof-of-Learning</a> work: if you cannot recover history from the artefact, you must commit to it as you go.</p>
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
