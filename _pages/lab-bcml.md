---
permalink: /lab/blockchain-ml/
oembed: "/lab/blockchain-ml/oembed.json"
title: "Who Improved the AI? Collaborative Learning"
description: "What a ledger buys machine learning: consensus that trains instead of hashing, contracts that pay for the improvement you caused, and the measured limits."
excerpt: "Point the electricity at a model instead of a hash, pay contributors by the loss they removed, and read the prototypes honestly: accuracy rises with parties while throughput falls."
sitemap: true
header:
  og_image: "lab-og/og-blockchain-ml-film.jpg"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-bcml" style="margin-top: 0;">
  <span class="ep-eyebrow">Distributed Systems · Machine Learning · Consensus</span>

  <div class="lab-film">
    <div class="lab-film__frame lab-film__frame--cinema">
      <iframe src="{{ '/films/blockchain-ml/' | relative_url }}?autoplay=0" title="Who improved the AI? A film about collaborative learning" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>

  <div class="lab-lvd">
  <p class="lab-card__lead">Five organisations train one AI model. Who improved it, and who should get paid? This film follows the questions behind collaborative learning: how to evaluate an update, what a training record can establish, how contribution rewards work, and why local data still needs privacy protection. A blockchain is one mechanism in the story, with its limits made explicit.</p>
  <div class="lab-card__usecase">
    <strong>Research basis:</strong>
    <span><a href="/publication/2023-ieee-access-survey">Survey on Blockchain-Enhanced Machine Learning</a> (Ural &amp; Yoshigoe, IEEE Access, 2023). The SUM reward and deposit rules and the DeepChain prototype are systems reviewed in the survey. The generalisation example and proposed cross-organisation use are teaching illustrations, not new experimental results. The closing design perspective is Dr. Ozgur Ural’s.</span>
  </div>
  <p class="lab-film__alt">Prefer the technical version? <a href="{{ '/lab/blockchain-ml/embed/' | relative_url }}" target="_blank" rel="noopener">Watch the original animation</a>: the same idea step by step, with its diagrams and formulas.</p>
  <aside class="lab-lvd__facts" aria-label="At a glance">
    <p class="lab-lvd__facts-title">At a glance</p>
    <dl>
      <div><dt>3</dt><dd>Problems a shared ledger may help with: poisoned contributions, leaked training data, weights with no record of how they were made.</dd></div>
      <div><dt>PoL · PoDL · PoQ</dt><dd>Consensus proposals that aim the network&rsquo;s work at training instead of hash puzzles.</dd></div>
      <div><dt>b<sub>t</sub> = b<sub>t&minus;1</sub> + &Delta;L</dt><dd>A contributor&rsquo;s reward: held-out loss before the update minus after it.</dd></div>
      <div><dt>DeepChain</dt><dd>A Corda prototype on MNIST: more parties raised accuracy, and training time with it.</dd></div>
    </dl>
  </aside>
  </div>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The ledger records the process, not the data.</strong> ML has three problems a distributed ledger may help address: contributors can poison training data while collecting rewards, models can leak training data, and finished weights carry no native record of how they were produced. Recording transactions tied to training can make later alteration evident. In the federated designs reviewed here, raw data remains with its owner while parameters, transactions and validation results are shared. That limits one direct exposure path; it does not by itself guarantee privacy against model leakage or inference attacks.</p>
    <p><strong>Consensus work can be aimed at a useful artifact.</strong> Proof of Work spends electricity on a puzzle whose answer has no independent utility once found. The proposals reviewed here instead aim consensus work at training: Proof of Learning makes a training run the work, Proof of Deep Learning targets model integrity and authenticity, and Proof of Training Quality asks the network to assess contribution quality. The aim is useful work rather than hash-search alone, but it inherits one hard question: how do you verify the claimed training was really performed?</p>
    <p><strong>Pay for the improvement, not the volume.</strong> In the Sharing Updatable Model framework a smart contract, CollaborativeTrainer, accepts data, runs an incentive mechanism and updates the model in one place. The prediction-market reward moves a contributor's balance by <em>b<sub>t</sub> = b<sub>t−1</sub> + L(h<sub>t−1</sub>, D) − L(h<sub>t</sub>, D)</em>: the loss on a held-out set before your update minus the loss after it. A contribution that increases loss receives a negative balance change; the result depends on the evaluation data and the order of contributions. A separate mechanism (deposit, refund, take) requires a stake when submitting. After a waiting period, model agreement permits a refund; disagreement can cost part of the deposit. Agreement is a rule for settlement, not a guarantee of ground truth. In the reported simulation, honest and dishonest populations separate while accuracy is preserved.</p>
    <p><strong>Then read the prototypes honestly.</strong> DeepChain was implemented as a Corda prototype on MNIST, with parties uploading local gradients and workers paid through a processing contract. In the reported experiment, accuracy improves as more parties join; throughput degrades as the gradient count grows, and total training time climbs with every party added. LearningChain combines differential privacy for local gradients with an l-nearest aggregation rule intended to resist Byzantine workers. Privacy and robustness require mechanisms beyond the ledger itself.</p>
    <p><strong>Which is why the survey closes on challenges.</strong> Scalability, energy cost, and the need for consensus mechanisms designed for machine learning rather than inherited from cryptocurrency. The useful contribution is knowing precisely where the seams are. One of those seams, verifying that a claimed training run really happened, became the subject of the author's <a href="/lab/training-fingerprint/">Proof-of-Learning research</a> and <a href="/publication/2025-dissertation">dissertation</a>.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="bcml-appendix">
      <p>Rendered on load. If equations appear as raw text, reload the page.</p>
    </div>
  </details>
  </div>
</section>

<link rel="stylesheet" href="{{ '/assets/vendor/katex/katex.min.css' | relative_url }}">
<script defer src="{{ '/assets/vendor/katex/katex.min.js' | relative_url }}"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/bcml.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
