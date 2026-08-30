---
permalink: /lab/universal-jira/
oembed: "/lab/universal-jira/oembed.json"
title: "Universal Jira: Prediction Markets for Global Coordination, animated"
description: "A cinematic explainer on how smart contracts and prediction markets can act as incentive-compatible coordination with no trusted central party."
excerpt: "How do we coordinate global engineering without a central boss? We use the math of Automated Market Makers (AMMs), market prices, and oracle resolution to turn software bounties into a shared belief system."
sitemap: true
header:
  og_image: "lab-og/og-jira.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-jira" style="margin-top: 0;">
  <span class="ep-eyebrow">Mechanism Design · Verification Without an Authority</span>
  <p class="lab-card__lead">⮞ Every film in this lab circles one question: who verifies a claim when nobody is in charge? Proof-of-learning asks it about a training run, oracles ask it about a model's output. This one asks it about <strong>work</strong>. Assignment is a manager's job, and a manager is the part that does not scale once the people doing the work are software agents. So replace the ticket with a price: a market opens on whether a task will be done, an automated market maker keeps a quote on both sides, and an oracle settles it afterwards. The quantity that matters is not the ticket but the market's belief about whether the work will land.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span><strong>Open research direction of the author</strong>, not yet published. The question: can a market price and settle engineering work without a central planner, and what has to be true of the settlement step once the agents proposing the work are the same ones being paid for it? The mechanism is built on standard foundations (DAO mechanism design, constant-product AMM invariants, Logarithmic Market Scoring Rules); the contribution under development is applying them as a coordination substrate for software delivery, and connecting the resolution problem to the verification work in my <a href="/publication/2025-dissertation">dissertation</a> and the <a href="/lab/oracles/">oracle film</a>. Feedback and collaborators welcome.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="jira-film" role="group" aria-label="Animated explainer: Prediction Markets as Universal Jira"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=AMM curve, amber=YES price, green=developer effort, violet=oracle">
    <span><i style="background:#58C4DD"></i> AMM liquidity curve</span>
    <span><i style="background:#fbbf24"></i> "YES" share price (probability)</span>
    <span><i style="background:#83C167"></i> developer effort</span>
    <span><i style="background:#9A72AC"></i> oracle resolution</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The Coordination Problem.</strong> Traditional software requires managers to assign tasks and evaluate progress. In a trustless global network, there is no manager. We must use economic incentives to reveal the truth about a task's progress.</p>
    <p><strong>The Ticket is a Proposition.</strong> Instead of "Fix bug X", the ticket becomes a proposition: "Will bug X be fixed and merged by Friday?" People can buy YES or NO shares. The price of YES is a compact summary of the market's belief about completion, not a guarantee.</p>
    <p><strong>The AMM Math.</strong> Using a Constant Product Market Maker ($x \times y = k$) or LMSR, the contract keeps a counterparty available at every price. The sponsor of the bounty seeds the initial liquidity, and each trade nudges the price toward the market's current estimate.</p>
    <p><strong>Work Changes the Price.</strong> A developer who intends to fix the bug buys YES shares while they are cheap because the task is still incomplete. If they really finish the work and the PR gets merged, the market later resolves to 100% YES. Their profit comes from having aligned with the truth early, not from manipulating the outcome.
    </p>
    <p><strong>Optimistic Oracles.</strong> How does the contract know the PR was merged? An <a href="/lab/oracles/">optimistic oracle</a> (like UMA) is used. Someone asserts the fact and posts a bond; if nobody challenges it during the dispute window, the market resolves and pays out. The oracle is the bridge from off-chain reality to on-chain settlement.</p>
    <p><strong>Closing the loop: let the agents write the tickets.</strong> Everything above still assumes a person notices the problem and opens the market. Take that assumption away. An agent with read access to the repository, the issue tracker and production telemetry can propose the proposition itself, post it to the contract, and let the price form. The cycle then runs end to end without a human in it: an agent proposes, the market prices, an agent works, the oracle settles. That is the version worth building, because it is the only one where the coordination layer scales with the number of agents rather than with the number of managers.</p>
    <p><strong>And that is exactly where it gets hard.</strong> Once the same population both creates the work and profits from it, the supply of problems stops being exogenous. An agent can open an issue that is trivial or invented, buy YES while it is cheap, resolve it, and collect. Nothing in the market detects this, because every step looks like honest work: a proposition, a trade, a merge, a settlement. The mechanism pays for <em>claimed</em> problems, so claims are what it will get.</p>
    <p><strong>The defence is the same shape as the one in my dissertation.</strong> Spoofing Proof-of-Learning means fabricating evidence of a training run that never happened; fabricating a ticket means manufacturing evidence of work that was never needed. Both are answered by refusing to pay for the claim and paying for something the forger cannot cheaply produce. Three ingredients carry it: proposing costs a bond that is slashed when the issue is judged fabricated, the proposer is barred from settling their own market, and the payout is tied to an artifact that only real work creates, such as a previously failing test that now passes on an independently run build. Price discovers what to do; verification decides what actually got done. The second half is the open problem, and it is the same one this lab keeps circling.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="jira-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<!-- KaTeX for typeset equations (used by the cinematic engine) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/jira.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
