---
permalink: /lab/block-race/
title: "Block Race: Nakamoto consensus, animated"
description: "Why '6 confirmations' is a probability, not a promise. A cinematic, PhD-level walk through the double-spend math of Bitcoin's whitepaper §11."
excerpt: "Consensus is a race, not a vote. Watch the gambler's-ruin core, Satoshi's Poisson head-start, and why the attacker's size, not your patience, sets your risk."
sitemap: true
header:
  og_image: "lab-og/og-tg.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-tg" style="margin-top: 0;">
  <span class="ep-eyebrow">Blockchain · Nakamoto consensus</span>
  <p class="lab-card__lead">⛏️ Probabilistic finality is the first trust primitive that needs no trusted party. Every ten minutes, every miner races to extend the chain; honest nodes always trust the longest one. To reverse a payment, an attacker must secretly outrun the whole network — and the probability they ever succeed decays <strong>exponentially</strong> in the number of confirmations you wait. This animation derives that probability from the ground up: the gambler's ruin, Satoshi's Poisson head-start, and the punchline that "<em>6 confirmations</em>" hides an assumption about <em>who you're racing</em>.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>The math is Nakamoto's whitepaper §11 (<em>Calculations</em>). For blockchain mechanisms applied to securing distributed ML, see the author's survey: <a href="/publication/2023-ieee-access-survey">"Blockchain-Enhanced Machine Learning"</a> (IEEE Access 2023).</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="br-film" role="group" aria-label="Animated explainer: Bitcoin double-spend probability, gambler's ruin, and Satoshi's §11 calculation"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=honest chain, violet=attacker fork, green=payment, yellow=key equation">
    <span><i style="background:#58C4DD"></i> honest chain</span>
    <span><i style="background:#9A72AC"></i> attacker fork</span>
    <span><i style="background:#83C167"></i> your payment</span>
    <span><i style="background:#fbbf24"></i> key equation</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Consensus is a race, not a vote.</strong> Bitcoin has no authority that decides which history is true. Nodes mechanically adopt the longest valid chain. Each ~10-minute block is a weighted coin flip whose win probability equals your share of total hashrate — so an attacker with fraction <em>q</em> of the network mines the next block with probability <em>q</em>.</p>
    <p><strong>Falling behind is a gambler's ruin.</strong> Model the honest chain's lead over the attacker as a biased random walk: +1 when honest mines (probability <em>p</em>), −1 when the attacker mines (probability <em>q = 1−p</em>). The probability an attacker currently <em>z</em> blocks behind ever catches up is the classic ruin result <em>(q/p)<sup>z</sup></em> for q&lt;p — exact geometric decay, and certainty (=1) once q ≥ p. Honest majority is not a slogan; it is the condition that makes the series converge.</p>
    <p><strong>Satoshi's refinement: the attacker had a head start.</strong> While honest miners publish <em>z</em> blocks, the attacker has been mining privately for the same elapsed time. Because hashing is memoryless, their secret block count is taken to be Poisson with mean <em>λ = zq/p</em>. Condition on that count and sum the gambler's-ruin tails to get the whitepaper's closed form, <em>P(z) = 1 − Σ Poisson(k;λ)·(1 − (q/p)<sup>z−k</sup>)</em>. <strong>This Poisson step is an approximation</strong> — fixing the honest window at its mean — so it slightly <em>understates</em> the true risk (the exact count is Negative-Binomial). The honest framing matters more than a clean number.</p>
    <p><strong>The exponent's base is the adversary, not your patience.</strong> At z = 6, the reversal probability is 0.024% against a 10% attacker but 13.2% against a 30% attacker — a ~544× jump for a 3× change in adversary size. A 0.1% safety target needs 5 confirmations against a 10% miner and 24 against a 30% one. Security grows exponentially in z, but the base q/p is set by who you're racing — and finality is forever probabilistic, never absolute.</p>
    <p><strong>Scientific Context:</strong> Nakamoto consensus replaces absolute finality with a tunable, quantifiable probability. For how such blockchain mechanisms secure distributed machine-learning pipelines, see the author's survey: <a href="/publication/2023-ieee-access-survey">"Blockchain-Enhanced Machine Learning"</a> (IEEE Access 2023).</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="br-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/block-race.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
