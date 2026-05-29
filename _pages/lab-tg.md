---
permalink: /lab/block-race/
title: "Block Race — Bitcoin consensus, playable"
description: "Mine. Attack. Defend. The math is whitepaper §11 — try a double-spend or hold the line."
excerpt: "Mine, attack, or defend Bitcoin. The math is Nakamoto's whitepaper §11."
header:
  image: /images/lab-og/og-tg.png
  og_image: /images/lab-og/og-tg.png
  twitter_image: /images/lab-og/og-tg.png
sitemap: true
---

<a href="/lab/" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; text-decoration: none; font-weight: 600;"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-tg" style="margin-top: 0;">
  <span class="ep-eyebrow">Blockchain · Nakamoto consensus</span>
  <h2>Block Race</h2>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Based on the Satoshi consensus protocol. For a review of blockchain integration in AI, see the author's survey: <a href="/publication/2023-ieee-access-survey">"Blockchain-Enhanced Machine Learning"</a> (IEEE Access 2023).</span>
  </div>

  <!-- ★ Quickplay: one question, one slider, one answer ★ -->
  <div class="lab-quickplay" data-role="tg-quickplay">
    <p class="lab-quickplay__story">
      💰 Someone's paying you <strong>$10,000 in Bitcoin</strong>. They might try to <strong>reverse the transaction</strong> after you ship the goods. How long should you wait?
    </p>

    <div class="lab-quickplay__attackers" data-role="quick-attackers" role="radiogroup" aria-label="Pick the threat">
      <span class="lab-quickplay__attackers-label">Adversary:</span>
      <button type="button" role="radio" data-q="0.10" data-idx="0" data-name="Solo rogue">🦹 Solo · 10%</button>
      <button type="button" role="radio" data-q="0.25" data-idx="1" data-name="Mining pool" class="lab-quickplay__attacker--active" aria-checked="true">🏭 Pool · 25%</button>
      <button type="button" role="radio" data-q="0.35" data-idx="2" data-name="Hash cartel">⚔️ Cartel · 35%</button>
      <button type="button" role="radio" data-q="0.40" data-idx="3" data-name="51% threat">👑 51% · 40%</button>
    </div>

    <label class="lab-quickplay__slider-wrap">
      <span class="lab-quickplay__slider-label">
        Wait <strong data-role="quick-z-val">6</strong> confirmations
        <span class="lab-quickplay__slider-hint">≈ <span data-role="quick-time">1 hour</span> · each block takes about 10 min</span>
      </span>
      <input type="range" min="1" max="20" step="1" value="6" data-role="quick-z" aria-label="confirmations to wait" class="lab-quickplay__slider">
    </label>

    <div class="lab-quickplay__verdict" data-role="quick-verdict-root">
      <span class="lab-quickplay__emoji" data-role="quick-emoji">✅</span>
      <div class="lab-quickplay__verdict-body">
        <span class="lab-quickplay__prob" data-role="quick-prob">0.85%</span>
        <span class="lab-quickplay__label" data-role="quick-label">chance the payment reverses.</span>
        <span class="lab-quickplay__detail" data-role="quick-detail">…</span>
      </div>
    </div>

    <div class="lab-quickplay__actions">
      <button type="button" class="lab-quickplay__action lab-quickplay__action--primary" data-role="quick-share">
        <span class="lab-quickplay__action-icon">🔗</span>
        <span>Share this run</span>
      </button>
      <button type="button" class="lab-quickplay__action" data-role="quick-open-advanced">
        <span class="lab-quickplay__action-icon">🎮</span>
        <span>Try the attacker's side · mine blocks · see the math</span>
      </button>
    </div>
  </div>

  <details class="lab-advanced" data-role="tg-advanced">
    <summary><span class="lab-advanced__icon">🔬</span> Open the full simulator (three roles · chain race · scoring · 14 named endings)</summary>

    <p class="lab-card__lead lab-card__lead--demoted">⛏️ Bitcoin's entire security argument fits in one insight: longest chain wins, honest hashrate outpaces malicious, attack probability decays exponentially in z. Three roles, one protocol — <strong>mine honestly</strong>, <strong>attempt a double-spend</strong>, or <strong>defend a payment</strong>. The math is whitepaper §11.</p>

  <div class="lab-mode-tabs" data-role="tg-mode-tabs" role="tablist" aria-label="Pick your role">
    <button type="button" class="lab-mode-tab lab-mode-tab--active" data-mode="mine" role="tab" aria-selected="true">
      <span class="lab-mode-tab__icon">⛏️</span>
      <span class="lab-mode-tab__name">Mine</span>
      <span class="lab-mode-tab__hint">Solo or pool — find your yield</span>
    </button>
    <button type="button" class="lab-mode-tab" data-mode="attack" role="tab" aria-selected="false">
      <span class="lab-mode-tab__icon">🦹</span>
      <span class="lab-mode-tab__name">Attack</span>
      <span class="lab-mode-tab__hint">Race the honest chain</span>
    </button>
    <button type="button" class="lab-mode-tab" data-mode="defend" role="tab" aria-selected="false">
      <span class="lab-mode-tab__icon">🛡️</span>
      <span class="lab-mode-tab__name">Defend</span>
      <span class="lab-mode-tab__hint">Wait for confirmations</span>
    </button>
  </div>

  <div class="lab-card__mission" data-role="tg-mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong data-role="tg-mission-head">Pick a rig, mine for a span, hit the expected block yield.</strong>
    <span data-role="tg-mission-sub">Each tier sets a target block count over a fixed window. 5★ means you found at least the expected number with the smallest rig that can hit it.</span>
    <div class="lab-card__mission-pills"><span>5★ Optimal</span><span>4★ Efficient</span><span>3★ Viable</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <div class="lab-levels" data-role="tg-levels" aria-label="Pick scenario">
        <strong class="lab-levels__title" data-role="tg-levels-title">Pick your rig</strong>
        <div class="lab-levels__row" data-role="tg-levels-row">
          <!-- populated by JS for the current mode -->
        </div>
      </div>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name" data-role="tg-slider-label">Your strategy: blocks to mine?</span>
          <span class="lab-control__var" data-role="tg-slider-var">N</span>
          <span class="lab-control__value" data-role="n-val">24</span>
        </span>
        <input type="range" min="1" max="48" step="1" value="24" data-role="n" aria-label="strategy slider">
      </label>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="tg-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
      
      <!-- Active Game Controls -->
      <div class="lab-action-panel" data-role="tg-action-panel">
        <div class="lab-action-panel__timer" data-role="tg-game-timer">Time remaining: 12s</div>
        <button class="lab-btn lab-btn--action lab-action-panel__steer-btn" type="button" data-role="tg-action-btn" style="width: 100%; max-width: 320px;">
          <span class="lab-btn__text">Mash to Hash!</span>
        </button>
        <div class="lab-patience-bar-wrap" data-role="tg-patience-wrap" style="display: none; margin-top: 0.75rem;">
          <span class="lab-action-panel__patience-label">Customer Patience</span>
          <div class="lab-action-panel__patience-track">
            <div class="lab-action-panel__patience-fill" data-role="tg-patience-fill"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <div class="lab-chain" aria-hidden="true" data-role="chain">
        <div class="lab-chain__row lab-chain__row--honest">
          <span class="lab-chain__label" data-role="chain-honest-label">⛏️ Network</span>
          <span class="lab-chain__blocks" data-role="chain-honest"></span>
          <span class="lab-chain__count" data-role="chain-honest-count">0</span>
        </div>
        <div class="lab-chain__row lab-chain__row--attacker" data-role="chain-attacker-row" hidden>
          <span class="lab-chain__label" data-role="chain-attacker-label">🦹 Attacker fork</span>
          <span class="lab-chain__blocks" data-role="chain-attacker"></span>
          <span class="lab-chain__count" data-role="chain-attacker-count">0</span>
        </div>
        <span class="lab-chain__caption" data-role="chain-caption">⛏️ each block ≈ 10 minutes · hashrate share = chance of finding the next one</span>
      </div>

      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot" preserveAspectRatio="xMidYMid meet" role="img" aria-label="block race probability curve"></svg>
    </div>

    <div class="lab-experiment__scoreline">
      <div class="lab-experiment__scorebar" data-role="stars-tg" aria-live="polite"></div>
      <span class="lab-endings" data-role="endings-tg" title="Every Run lands you in a named ending. Find them all."></span>
    </div>
    <div class="lab-experiment__verdict" data-role="verdict-tg" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick a role, choose your strategy, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label" data-role="metric-a-label">Expected blocks</span>
        <span class="lab-experiment__metric-value" data-role="naive-val">…</span>
        <span class="lab-experiment__metric-formula" data-role="metric-a-formula">your hashrate × window</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label" data-role="metric-b-label">90th-percentile yield</span>
        <span class="lab-experiment__metric-value" data-role="strict-val">…</span>
        <span class="lab-experiment__metric-formula" data-role="metric-b-formula">variance is real, plan for it</span>
      </div>
    </div>
    <p class="lab-experiment__insight" data-role="insight">Pick a rig and a mining window. Hashrate share decides how often you win the next block; variance decides how lumpy your weeks feel.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tg" hidden></p>
  </div>
  </details>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Nakamoto consensus is a foot race, not a vote.</strong> Every ~10 minutes, every miner is racing to solve a hash puzzle. Whoever wins extends the chain. Your chance of winning the next block equals your share of total hashrate. Over many blocks, your yield converges to that share — but any individual week can be wildly lucky or unlucky (Poisson variance, λ = q·N). Pools exist because solo variance is brutal.</p>
    <p><strong>The double-spend math.</strong> If an attacker controls fraction q of the network and the honest chain is z blocks ahead, the chance they ever catch up is, per Satoshi's whitepaper §11, <em>1 − Σ Poisson(k; zq/p)·(1−(q/p)<sup>z−k</sup>)</em>. At q = 30%, six confirmations cuts attack probability to ~17.7%. At q = 10%, the same six confirmations cuts it to 0.024%. That's the entire reason exchanges wait six blocks.</p>
    <p><strong>Defense is exponential.</strong> Each extra confirmation costs you one block-time (~10 minutes) and roughly squares the attacker's odds against you. The longer you wait, the more impossible the heist becomes — which is why patient merchants never get robbed.</p>
    <p><strong>Scientific Context:</strong> Blockchain networks provide decentralized consensus mechanisms. To explore the broader integration of blockchain mechanisms to secure distributed machine learning pipelines, read the author's comprehensive survey: <a href="/publication/2023-ieee-access-survey">"Blockchain-Enhanced Machine Learning"</a> (IEEE Access 2023).</p>
  </details>

  <div class="lab-share" data-role="tg-share-root">
    <button type="button" class="lab-share__btn" data-role="tg-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="tg-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="tg-share-text">5★ — Block Race · share text appears here</p>
      <div class="lab-share__actions">
        <button type="button" data-share="copy">📋 Copy link</button>
        <button type="button" data-share="x">𝕏 Tweet</button>
        <button type="button" data-share="li">in LinkedIn</button>
        <button type="button" data-share="close" aria-label="Close share">✕</button>
      </div>
    </div>
  </div>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>
