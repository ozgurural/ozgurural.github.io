---
permalink: /lab/universal-jira/
title: "Universal Jira: Prediction Markets for Global Coordination, animated"
description: "A cinematic explainer on how smart contracts and prediction markets can act as humanity's decentralized task board."
excerpt: "How do we coordinate global engineering without a central boss? We use the math of Automated Market Makers (AMMs) to turn software bounties into prediction markets."
sitemap: true
header:
  og_image: "lab-og/og-jira.png"
---

<a href="/lab/" class="lab-back"><span>⮐</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-jira" style="margin-top: 0;">
  <span class="ep-eyebrow">Mechanism Design × Blockchain</span>
  <p class="lab-card__lead">⮞ Centralized project management breaks down at global scale. But what if we replaced the Jira ticket with a <strong>Prediction Market</strong>? This animation shows the mathematical mechanism of how smart contract bounties and Automated Market Makers (AMMs) like Polymarket can coordinate open-source development. Writing code becomes literal insider trading on the success of the project.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Based on mechanism design for decentralized autonomous organizations (DAOs), Automated Market Maker invariant math (e.g. Constant Product Market Makers), and Logarithmic Market Scoring Rules (LMSR).</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="jira-film" role="group" aria-label="Animated explainer: Prediction Markets as Universal Jira"></div>
  </div>

  <p class="lab-film__legend" aria-hidden="true">
    <span><i style="background:#3b82f6"></i> AMM liquidity curve</span>
    <span><i style="background:#fbbf24"></i> "YES" share price (probability)</span>
    <span><i style="background:#34d399"></i> developer effort</span>
    <span><i style="background:#a78bfa"></i> oracle resolution</span>
  </p>

  <details class="lab-reveal" open>
    <summary>▸ What did you just learn?</summary>
    <p><strong>The Coordination Problem.</strong> Traditional software requires managers to assign tasks and evaluate progress. In a trustless global network, there is no manager. We must use economic incentives to reveal the truth about a task's progress.</p>
    <p><strong>The Ticket is a Proposition.</strong> Instead of "Fix bug X", the ticket is a market: "Will bug X be fixed and merged by Friday?" People can buy YES or NO shares. The price of YES directly correlates to the market's belief in the probability of completion.</p>
    <p><strong>The AMM Math.</strong> Using a Constant Product Market Maker ($x \times y = k$) or LMSR, the smart contract ensures there is always a counterparty. The sponsor of the bug bounty provides the initial liquidity.</p>
    <p><strong>Work as Insider Trading.</strong> A developer who intends to fix the bug buys YES shares while they are cheap (because the bug is currently unfixed). After they submit the PR and it gets merged, the market resolves to 100% YES. Their profit is their salary.</p>
    <p><strong>Optimistic Oracles.</strong> How does the contract know the PR was merged? An optimistic oracle (like UMA) is used. Someone asserts the fact, puts up a bond, and if unchallenged, the market resolves and pays out.</p>
  </details>

  <details class="lab-reveal">
    <summary>▸ The math, precisely</summary>
    <div class="lab-math" data-role="jira-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<!-- KaTeX for typeset equations (used by the cinematic engine) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/jira.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
