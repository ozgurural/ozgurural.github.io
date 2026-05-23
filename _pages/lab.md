---
permalink: /lab/
title: "Lab — five playable thought experiments"
description: "Block Race · Model Heist Detector · Proof-of-Learning (SecurePoL) · Redundancy Reactor · Gradient Pinball. Real research math, made playable. Each run is shareable."
excerpt: "Five interactive thought experiments from my research: Bitcoin consensus, ML security, fault tolerance, optimization. Pick a real scenario, set your strategy, and let the math grade your aim."
---

<!-- Social card meta tags (og + Twitter). We DON'T set header.image in the
     front-matter because Minimal Mistakes renders that as a giant page
     banner; the og:image below is for unfurling on X / LinkedIn only. -->
<meta property="og:image" content="https://ozgurural.github.io/images/lab-og/og-lab.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://ozgurural.github.io/images/lab-og/og-lab.png" />


<section class="lab-hero" aria-label="Lab arcade intro">
  <span class="ep-eyebrow">Interactive research arcade</span>
  <h2 class="lab-hero__title">Aim. Fire. Get graded.</h2>
  <p class="lab-hero__copy">
    Five test chambers from my research: Bitcoin consensus, AI watermarks, training-run forensics, fault tolerance, optimization. Each one drops you into a real scenario; you pick the strategy, the simulation grades the result from <strong>Off-target</strong> to <strong>Frontier 🏆</strong>. The dial does not flatter. The cake, as always, is a lie. 5★ means you'd survive in production.
  </p>
  <div class="lab-hero__actions" aria-label="Jump to experiments">
    <a href="#lab-tg">Mine, attack, defend Bitcoin</a>
    <a href="#lab-wm">Catch a stolen AI model</a>
    <a href="#lab-tmr">Crash-test redundancy</a>
  </div>
</section>

<nav class="lab-mission-deck" aria-label="Lab mission deck">
  <a class="lab-mission-card" href="#lab-tg">
    <span class="lab-mission-card__code">01</span>
    <strong>Block Race</strong>
    <span>Mine Bitcoin, attempt a double-spend, or defend a payment.</span>
  </a>
  <a class="lab-mission-card" href="#lab-wm">
    <span class="lab-mission-card__code">02</span>
    <strong>Model Heist Detector</strong>
    <span>Hide a signal that survives fine-tuning.</span>
  </a>
  <a class="lab-mission-card" href="#lab-pol">
    <span class="lab-mission-card__code">03</span>
    <strong>Proof-of-Learning (SecurePoL)</strong>
    <span>Prove the model actually trained.</span>
  </a>
  <a class="lab-mission-card" href="#lab-tmr">
    <span class="lab-mission-card__code">04</span>
    <strong>Redundancy Reactor</strong>
    <span>Keep the system alive when channels lie.</span>
  </a>
  <a class="lab-mission-card" href="#lab-gd">
    <span class="lab-mission-card__code">05</span>
    <strong>Gradient Pinball</strong>
    <span>Drop the optimizer into the right valley.</span>
  </a>
</nav>

<div class="lab-quest" role="region" aria-label="Lab mission progress">
  <p class="lab-quest__msg" data-role="quest-msg">Five labs, each a scenario with a measurable goal. 5★ means you found the minimum play that beats it. Unlocks the badge.</p>
  <ul class="lab-quest__list">
    <li class="lab-quest__item" data-quest-item="tg"><span class="lab-quest__name">Block Race</span> <span class="lab-quest__status" data-role="quest-tg">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="wm"><span class="lab-quest__name">Watermark</span> <span class="lab-quest__status" data-role="quest-wm">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="tmr"><span class="lab-quest__name">TMR</span> <span class="lab-quest__status" data-role="quest-tmr">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="pol"><span class="lab-quest__name">Proof-of-Learning</span> <span class="lab-quest__status" data-role="quest-pol">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="gd"><span class="lab-quest__name">Gradient descent</span> <span class="lab-quest__status" data-role="quest-gd">Locked</span></li>
  </ul>
  <p class="lab-quest__total" aria-live="polite"><span data-role="quest-total">0/5</span> missions</p>
</div>

<section class="lab-card lab-experiment" id="lab-tg">
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

    <p class="lab-card__lead lab-card__lead--demoted">⛏️ Bitcoin's entire security argument fits on a napkin Satoshi never published: longest chain wins, honest hashrate outpaces malicious, attack probability decays exponentially in z. Three roles, one protocol — <strong>mine honestly</strong>, <strong>attempt a heist</strong>, or <strong>hold the line</strong>. The math is whitepaper §11; the bad decisions are entirely yours.</p>

  <div class="lab-mode-tabs" data-role="tg-mode-tabs" role="tablist" aria-label="Pick your role">
    <button type="button" class="lab-mode-tab lab-mode-tab--active" data-mode="mine" role="tab" aria-selected="true">
      <span class="lab-mode-tab__icon">⛏️</span>
      <span class="lab-mode-tab__name">Mine</span>
      <span class="lab-mode-tab__hint">Yeah Mr. White — yeah, hash!</span>
    </button>
    <button type="button" class="lab-mode-tab" data-mode="attack" role="tab" aria-selected="false">
      <span class="lab-mode-tab__icon">🦹</span>
      <span class="lab-mode-tab__name">Attack</span>
      <span class="lab-mode-tab__hint">I am the one who orphans.</span>
    </button>
    <button type="button" class="lab-mode-tab" data-mode="defend" role="tab" aria-selected="false">
      <span class="lab-mode-tab__icon">🛡️</span>
      <span class="lab-mode-tab__name">Defend</span>
      <span class="lab-mode-tab__hint">Tread lightly. Accept patiently.</span>
    </button>
  </div>

  <div class="lab-card__mission" data-role="tg-mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong data-role="tg-mission-head">Pick a rig, mine for a span, hit the expected block yield.</strong>
    <span data-role="tg-mission-sub">Each tier sets a target block count over a fixed window. 5★ means you found at least the expected number with the smallest rig that can hit it.</span>
    <div class="lab-card__mission-pills"><span>5★ Heisenberg-grade</span><span>4★ Mr. White budget</span><span>3★ Pinkman bracket</span></div>
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
      <div class="lab-tg-action-panel" data-role="tg-action-panel" style="display: none; margin-top: 1rem; padding: 0.75rem; background: var(--ds-surface-elev); border: 1px dashed var(--ds-line); border-radius: var(--ds-radius-sm); text-align: center;">
        <div data-role="tg-game-timer" style="font-family: var(--ds-font-mono); font-size: 1.1rem; color: var(--ds-accent); margin-bottom: 0.5rem; font-weight: bold;">Time remaining: 12s</div>
        <button class="lab-btn lab-btn--action" type="button" data-role="tg-action-btn" style="width: 100%; max-width: 320px; font-weight: 600; padding: 0.5rem; border: 1px solid var(--ds-accent);">
          <span class="lab-btn__text">Mash to Hash!</span>
        </button>
        <div class="lab-patience-bar-wrap" data-role="tg-patience-wrap" style="display: none; margin-top: 0.75rem;">
          <span style="font-size: 0.8rem; color: var(--ds-muted); display: block; margin-bottom: 0.25rem; font-family: var(--ds-font-mono);">Customer Patience</span>
          <div style="background: rgba(0,0,0,0.15); height: 8px; border-radius: 4px; overflow: hidden; width: 100%; max-width: 320px; margin: 0 auto;">
            <div data-role="tg-patience-fill" style="background: var(--ds-accent-2); width: 100%; height: 100%; transition: width 0.1s linear;"></div>
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
    <summary>🧠 What did you just learn? (also: is this a Black Mirror episode?)</summary>
    <p><strong>Nakamoto consensus is a foot race, not a vote.</strong> Every ~10 minutes, every miner is racing to solve a hash puzzle. Whoever wins extends the chain. Your chance of winning the next block equals your share of total hashrate. Over many blocks, your yield converges to that share — but any individual week can be wildly lucky or unlucky (Poisson variance, λ = q·N). Pools exist because solo variance is brutal. Heisenberg's uncertainty principle has nothing on the variance of one ASIC.</p>
    <p><strong>The double-spend math.</strong> If an attacker controls fraction q of the network and the honest chain is z blocks ahead, the chance they ever catch up is, per Satoshi's whitepaper §11, <em>1 − Σ Poisson(k; zq/p)·(1−(q/p)<sup>z−k</sup>)</em>. At q = 30%, six confirmations cuts attack probability to ~17.7%. At q = 10%, the same six confirmations cuts it to 0.024%. That's the entire reason exchanges wait six blocks. There is no spoon. There is only Poisson.</p>
    <p><strong>Defense is exponential.</strong> Each extra confirmation costs you one block-time (~10 minutes) and roughly squares the attacker's odds against you. The longer you wait, the more impossible the heist becomes — which is why patient merchants never get robbed, and impatient ones get to star in their own Black Mirror episode. Tread lightly. Better Call Saul. Wubba lubba dub dub.</p>
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

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>Model Heist Detector</h2>
  <p class="lab-card__lead">🕵️ Someone leaked your AI and ran it through a disguise. Before publishing, you'd spread a faint statistical signature across thousands of weights, too small to notice individually but together a fingerprint only you can read. The thief tries to scrub it. You have to read it through the noise anyway.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Implements robust statistical watermarking. See the author's paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Catch the thief without breaking the model.</strong>
    <span>Each thief level adds more noise. Tune signature strength and number of marks. Push ε too far and the model behaves oddly; under-shoot k and the signal drowns in the noise floor.</span>
    <div class="lab-card__mission-pills"><span>5★ beat the catch target</span><span>4★ catch with collateral</span><span>3★ partial detection</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <div class="lab-levels" data-role="wm-levels" aria-label="Pick the thief">
        <strong class="lab-levels__title">Pick the thief</strong>
        <div class="lab-levels__row">
          <button type="button" class="lab-level" data-sigma="0.05" data-goal-det="0.97" data-eps-max="0.15" data-name="Casual">
            <span class="lab-level__icon">🦮</span>
            <span class="lab-level__name">Casual</span>
            <span class="lab-level__hint">light tweaks · need 97% catch</span>
          </button>
          <button type="button" class="lab-level lab-level--active" data-sigma="0.15" data-goal-det="0.90" data-eps-max="0.18" data-name="Pro thief">
            <span class="lab-level__icon">🎭</span>
            <span class="lab-level__name">Pro thief</span>
            <span class="lab-level__hint">fine-tunes · need 90% catch</span>
          </button>
          <button type="button" class="lab-level" data-sigma="0.25" data-goal-det="0.80" data-eps-max="0.20" data-name="Crafty">
            <span class="lab-level__icon">🦹</span>
            <span class="lab-level__name">Crafty</span>
            <span class="lab-level__hint">scrubs hard · need 80% catch</span>
          </button>
          <button type="button" class="lab-level" data-sigma="0.35" data-goal-det="0.65" data-eps-max="0.25" data-name="Mastermind">
            <span class="lab-level__icon">🐉</span>
            <span class="lab-level__name">Mastermind</span>
            <span class="lab-level__hint">nation-state · need 65% catch</span>
          </button>
        </div>
      </div>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how bold is your signature?</span>
          <span class="lab-control__var">ε</span>
          <span class="lab-control__value" data-role="eps-val">0.20</span>
        </span>
        <input type="range" min="0.02" max="0.45" step="0.01" value="0.20" data-role="eps" aria-label="how bold is the watermark signature">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how many hidden marks?</span>
          <span class="lab-control__var">k</span>
          <span class="lab-control__value" data-role="k-val">8</span>
        </span>
        <input type="range" min="1" max="32" step="1" value="8" data-role="k" aria-label="how many hidden marks">
      </label>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="wm-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
      
      <!-- Active Game Controls -->
      <div class="lab-wm-action-panel" data-role="wm-action-panel" style="display: none; margin-top: 1rem; padding: 0.75rem; background: var(--ds-surface-elev); border: 1px dashed var(--ds-line); border-radius: var(--ds-radius-sm); text-align: center;">
        <div data-role="wm-game-timer" style="font-family: var(--ds-font-mono); font-size: 1.1rem; color: var(--ds-accent); margin-bottom: 0.25rem; font-weight: bold;">Scrubbing Storm: 8.0s</div>
        <div style="font-size: 0.76rem; color: var(--ds-muted); line-height: 1.35; font-family: var(--ds-font-mono);">Hover / Drag over key cells (orange) to SHIELD them from the tuning storm!</div>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <div class="lab-wm__grid" data-role="grid" aria-hidden="true"></div>
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-wm" preserveAspectRatio="xMidYMid meet" role="img" aria-label="detection rate vs attacker noise"></svg>
      <div class="lab-wm-legend" aria-hidden="true">
        <span><span class="lab-wm-legend__swatch lab-wm-legend__swatch--key"></span> watermark key cell</span>
        <span><span class="lab-wm-legend__swatch lab-wm-legend__swatch--value"></span> sampled weight</span>
        <span><span class="lab-wm-legend__swatch lab-wm-legend__swatch--glitch"></span> ε above utility threshold</span>
      </div>
    </div>

    <div class="lab-experiment__scoreline">
      <div class="lab-experiment__scorebar" data-role="stars-wm" aria-live="polite"></div>
      <span class="lab-endings" data-role="endings-wm" title="Each Run lands you in a named ending. Find them all."></span>
    </div>
    <div class="lab-experiment__verdict" data-role="verdict-wm" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick a thief, set your strategy, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Caught the thief</span>
        <span class="lab-experiment__metric-value" data-role="det-val">…</span>
        <span class="lab-experiment__metric-formula">verifier with the secret key</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--fpr">
        <span class="lab-experiment__metric-label">False alarm rate</span>
        <span class="lab-experiment__metric-value" data-role="fpr-val">…</span>
        <span class="lab-experiment__metric-formula">on an innocent model</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-wm">Drag the sliders.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-wm" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Tiny secrets in many places beat one big secret.</strong> An AI model has hundreds of millions of internal numbers. A watermark is a faint statistical pattern spread across many of them. Each individual mark is way too small to notice, but together they form a signature only you can recognize.</p>
    <p>This is how labs at OpenAI, Google, and Anthropic plan to prove "yes, that model is ours" if it gets leaked. The same trick is used to find AI-generated text, mark images from specific cameras, and prove which lab produced a research paper. The harder the thief tries to erase one mark, the more visible the others become.</p>
    <p><strong>Scientific Context:</strong> This simulation implements features similar to the watermark detection schemes analyzed in the author's paper, where aggregate detection over $k$ weights is modeled using a Gaussian Z-test. Read the details in the IEEE Access paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</p>
  </details>

  <div class="lab-share" data-role="wm-share-root">
    <button type="button" class="lab-share__btn" data-role="wm-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="wm-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="wm-share-text">5★ — Model Heist Detector · share text appears here</p>
      <div class="lab-share__actions">
        <button type="button" data-share="copy">📋 Copy link</button>
        <button type="button" data-share="x">𝕏 Tweet</button>
        <button type="button" data-share="li">in LinkedIn</button>
        <button type="button" data-share="close" aria-label="Close share">✕</button>
      </div>
    </div>
  </div>
</section>

<section class="lab-card lab-experiment" id="lab-pol">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <h2>Proof-of-Learning (SecurePoL)</h2>
  <p class="lab-card__lead">🔬 Anyone can download a model and claim they trained it. The proof is in the journey: a real training run leaves a wobbly, monotone-ish loss curve that's almost impossible to forge after the fact. Tune the run; see if the trajectory would survive an audit. (The auditor is unforgiving but fair. Mostly fair.)</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Implements loss curve auditing and proof verification. See the author's paper: <a href="/publication/2025-secureproofoflearning">"SecurePoL: Integration of Watermarking With Proof-of-Learning"</a> (IEEE Access 2025) and <a href="/publication/2025-dissertation">Ph.D. Dissertation</a>.</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Earn Gold Proof.</strong>
    <span>Pick learning rate, batch size, and data noise. Hit Train. The detector scores you on monotonicity, smoothness, distance from the fake-flat baseline, and how close your hyperparameters are to a credible regime.</span>
    <div class="lab-card__mission-pills"><span>5★ score ≥ 94</span><span>4★ ≥ 82</span><span>3★ ≥ 68</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        Gold lives near α 0.008 to 0.018, batch 64 to 256, and noise 0.02 to 0.08. The lab will not admit this was helpful.
      </p>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Learning speed</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="pol-lr-val">0.01</span>
        </span>
        <input type="range" min="0.001" max="0.05" step="0.001" value="0.01" data-role="pol-lr" aria-label="learning speed">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Examples per step</span>
          <span class="lab-control__var">B</span>
          <span class="lab-control__value" data-role="pol-bs-val">32</span>
        </span>
        <input type="range" min="1" max="8" step="1" value="3" data-role="pol-bs" aria-label="examples per step">
      </label>
      <div class="lab-playset" aria-label="Proof-of-Learning pacing">
        <label class="lab-playset__opt"><input type="checkbox" data-role="pol-turbo"> Faster training</label>
      </div>
      <button class="lab-btn lab-btn--train" type="button" data-role="pol-train-btn">
        <span class="lab-btn__text">Train!</span>
        <span class="lab-btn__bg"></span>
      </button>
      
      <!-- Active Game Controls -->
      <div class="lab-pol-action-panel" data-role="pol-action-panel" style="display: none; margin-top: 1rem; text-align: center; padding: 0.75rem; border-radius: var(--ds-radius-sm); border: 1px solid var(--ds-accent);">
        <div data-role="pol-event-title" style="font-weight: bold; color: var(--ds-accent); font-size: 1.05rem; text-transform: uppercase; font-family: var(--ds-font-mono);">System Stable</div>
        <div data-role="pol-event-desc" style="font-size: 0.78rem; color: var(--ds-muted); margin-top: 0.25rem; line-height: 1.35; font-family: var(--ds-font-mono);">Training in progress. Adjust sliders live to steer the curve in the green corridor!</div>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-pol" preserveAspectRatio="xMidYMid meet" role="img" aria-label="training loss trajectory"></svg>
    </div>

    <div class="lab-experiment__scorebar" data-role="stars-pol" aria-live="polite"></div>
    <div class="lab-experiment__verdict" data-role="verdict-pol" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Set hyperparameters, hit Train, watch the curve.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Verification score</span>
        <span class="lab-experiment__metric-value" data-role="pol-score-val">0</span>
        <span class="lab-experiment__metric-formula">target: Gold ≥ 94</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Badge</span>
        <span class="lab-experiment__metric-value" data-role="pol-badge-val">…</span>
        <span class="lab-experiment__metric-formula">Bronze · Silver · Gold</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-pol">Adjust sliders and hit Train. Real training should descend with controlled chaos, not flatline like a suspiciously convenient download from the desert of the real.</p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The journey is harder to fake than the destination.</strong> The final weights of a trained AI are just a giant list of numbers, copy-pasteable in seconds. But the <em>path</em> the loss took during training? It's noisy, bumpy, has little flat spots when learning stalls, sudden drops when it finds a shortcut. That fingerprint is almost impossible to forge after the fact.</p>
    <p>This is called <em>Proof-of-Learning</em>, and it matters for: patent disputes ("did you really invent this?"), competitive intelligence ("did they actually train, or did they distill ours?"), and verifying open-source claims. Same idea as a digital signature, but for the training process instead of the model.</p>
    <p><strong>Scientific Context:</strong> In a real training run, verification relies on checking the monotonicity, smoothness, and hyperparameter consistency of the logged epoch states. Spoofing attacks can be detected by coupling these logs with model watermarks, as proposed in the author's paper: <a href="/publication/2025-secureproofoflearning">"SecurePoL: Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks"</a> (IEEE Access 2025) and detailed in his <a href="/publication/2025-dissertation">Ph.D. Dissertation</a>.</p>
  </details>

  <div class="lab-share" data-role="pol-share-root">
    <button type="button" class="lab-share__btn" data-role="pol-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="pol-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="pol-share-text">5★ — Proof-of-Learning (SecurePoL) · share text appears here</p>
      <div class="lab-share__actions">
        <button type="button" data-share="copy">📋 Copy link</button>
        <button type="button" data-share="x">𝕏 Tweet</button>
        <button type="button" data-share="li">in LinkedIn</button>
        <button type="button" data-share="close" aria-label="Close share">✕</button>
      </div>
    </div>
  </div>
</section>

<section class="lab-card lab-experiment" id="lab-tmr">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>Redundancy Reactor</h2>
  <p class="lab-card__lead">✈️ Your A320 has three flight computers and a majority voter. One fails, the other two outvote it. But "three computers" is only "three independent failure paths" if they fail differently. Identical software hits the same overflow at the same millisecond. (Ariane 5, 1996. The rocket disagreed with reality and disassembled itself 39 seconds in.)</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Based on Triple Modular Redundancy (TMR). Inspired by real-time safety-critical aerospace and flight simulator architecture developed by the author.</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Pick the mission; pick the minimum N that beats the safety target.</strong>
    <span>Each mission carries its own correlation (ρ) and per-channel failure rate (q). 5★ means hitting the safety multiplier with the fewest backups; overspending earns 4★.</span>
    <div class="lab-card__mission-pills"><span>5★ minimum N</span><span>4★ overspent win</span><span>3★ close miss</span></div>
  </div>

  <div class="lab-tmr">
    <div class="lab-experiment__controls">
      <div class="lab-levels" data-role="tmr-levels" aria-label="Pick the mission">
        <strong class="lab-levels__title">Pick the mission</strong>
        <div class="lab-levels__row">
          <button type="button" class="lab-level" data-q="0.02" data-rho="0.00" data-goal-gain="200" data-min-n="5" data-name="Bank servers">
            <span class="lab-level__icon">🏢</span>
            <span class="lab-level__name">Bank servers</span>
            <span class="lab-level__hint">need 200× safer</span>
          </button>
          <button type="button" class="lab-level lab-level--active" data-q="0.05" data-rho="0.05" data-goal-gain="13" data-min-n="5" data-name="Self-driving car">
            <span class="lab-level__icon">🚗</span>
            <span class="lab-level__name">Self-driving</span>
            <span class="lab-level__hint">need 13× safer</span>
          </button>
          <button type="button" class="lab-level" data-q="0.08" data-rho="0.10" data-goal-gain="7" data-min-n="7" data-name="A320 cruise">
            <span class="lab-level__icon">✈️</span>
            <span class="lab-level__name">A320 cruise</span>
            <span class="lab-level__hint">need 7× safer</span>
          </button>
          <button type="button" class="lab-level" data-q="0.12" data-rho="0.20" data-goal-gain="4" data-min-n="7" data-name="Mars rover">
            <span class="lab-level__icon">🚀</span>
            <span class="lab-level__name">Mars rover</span>
            <span class="lab-level__hint">need 4× safer</span>
          </button>
        </div>
      </div>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how many backup computers?</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-channels-val">3</span>
        </span>
        <input type="range" min="3" max="9" step="2" value="3" data-role="n-channels" aria-label="how many computers">
      </label>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="tmr-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
      
      <!-- Active Game Controls -->
      <div class="lab-tmr-action-panel" data-role="tmr-action-panel" style="display: none; margin-top: 1rem; padding: 0.75rem; background: var(--ds-surface-elev); border: 1px dashed var(--ds-line); border-radius: var(--ds-radius-sm); text-align: center;">
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-width: 360px; margin: 0 auto;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div data-role="tmr-game-timer" style="font-family: var(--ds-font-mono); font-size: 1rem; color: var(--ds-accent); font-weight: bold;">Telemetry Time: 15s</div>
            <div style="font-family: var(--ds-font-mono); font-weight: bold; font-size: 0.95rem;">Integrity: <span data-role="tmr-health" style="color: #10b981;">100%</span></div>
          </div>
          <div style="font-size: 0.75rem; color: var(--ds-muted); line-height: 1.35; font-family: var(--ds-font-mono);">Click computer labels below to <strong>MUTE</strong> failing channels before they hijack the majority vote!</div>
        </div>
      </div>
    </div>

    <div class="lab-tmr__strip" aria-hidden="true" data-role="tmr-strip">
      <div class="lab-tmr__row" data-ch="1">
        <span class="lab-tmr__row-label">💻 #1</span>
        <div class="lab-tmr__cells" data-cells="1"></div>
      </div>
      <div class="lab-tmr__row" data-ch="2">
        <span class="lab-tmr__row-label">💻 #2</span>
        <div class="lab-tmr__cells" data-cells="2"></div>
      </div>
      <div class="lab-tmr__row" data-ch="3">
        <span class="lab-tmr__row-label">💻 #3</span>
        <div class="lab-tmr__cells" data-cells="3"></div>
      </div>
      <div class="lab-tmr__row lab-tmr__row--sys">
        <span class="lab-tmr__row-label">✈️ Plane</span>
        <div class="lab-tmr__cells" data-cells="sys"></div>
      </div>
    </div>

    <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-tmr" preserveAspectRatio="xMidYMid meet" role="img" aria-label="system failure rate vs per-channel failure rate"></svg>

    <div class="lab-experiment__scorebar" data-role="stars-tmr" aria-live="polite"></div>
    <div class="lab-experiment__verdict" data-role="verdict-tmr" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick a mission, choose backup count, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Safety multiplier</span>
        <span class="lab-experiment__metric-value" data-role="gain-val">…</span>
        <span class="lab-experiment__metric-formula">vs a single computer</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Whole-system failure rate</span>
        <span class="lab-experiment__metric-value" data-role="sys-val">…</span>
        <span class="lab-experiment__metric-formula">after majority voting</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-tmr">Drag the sliders. The strip is live; the curves are closed-form; déjà vu is still a bug, not a feature.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tmr" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Three of the same thing is still one thing.</strong> Backup computers only protect you if they fail in different ways. Three identical computers running the same software will hit the same bug at the same moment, and then majority voting gives the wrong answer with confidence.</p>
    <p>This is what crashed the first Ariane 5 rocket in 1996: it had redundant flight computers, but they all ran the same code, so they all overflowed the same variable at the same instant. To get real safety, planes use computers from <em>different vendors</em>, written by <em>different teams</em>, in <em>different programming languages</em>. Same idea protects nuclear reactors, Mars rovers, and the secure chip in your phone.</p>
    <p><strong>Scientific Context:</strong> Triple Modular Redundancy (TMR) is a foundational pattern in high-availability and safety-critical computing. This model shows how correlated failures (common-mode faults) degrade reliability. Similar redundancy and low-latency safety-critical mechanisms are essential in real-time avionics software and flight simulator data pipelines developed by the author.</p>
  </details>

  <div class="lab-share" data-role="tmr-share-root">
    <button type="button" class="lab-share__btn" data-role="tmr-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="tmr-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="tmr-share-text">5★ — Redundancy Reactor · share text appears here</p>
      <div class="lab-share__actions">
        <button type="button" data-share="copy">📋 Copy link</button>
        <button type="button" data-share="x">𝕏 Tweet</button>
        <button type="button" data-share="li">in LinkedIn</button>
        <button type="button" data-share="close" aria-label="Close share">✕</button>
      </div>
    </div>
  </div>
</section>

<section class="lab-card lab-experiment" id="lab-gd">
  <span class="ep-eyebrow">Deep Learning · Optimization</span>
  <h2>Gradient Pinball</h2>
  <p class="lab-card__lead">⛰️ Every modern model (GPT, Stable Diffusion, your phone's autocorrect) learns by rolling a ball down a high-dimensional loss landscape. The deepest valley is the answer; the smaller dips are traps. Too cautious and you settle in a side valley convinced you've won; too aggressive and the ball leaves the landscape entirely. There is no spoon, only a basin.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Interactive optimization landscape visualizer. Represents the core mathematical optimization mechanism of the deep neural networks studied in the author's machine learning research.</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Land the optimizer in the global minimum.</strong>
    <span>Pick step size and momentum, then Train. Momentum carries you through small hills the way physics carries a ball through ridges. 5★ only when you land in the real valley, not a saddle.</span>
    <div class="lab-card__mission-pills"><span>5★ global minimum</span><span>4★ close miss</span><span>3★ stuck in a side valley</span></div>
  </div>
  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Step size</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="lr-val">0.02</span>
        </span>
        <input type="range" min="0.001" max="0.10" step="0.001" value="0.02" data-role="lr" aria-label="step size">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Momentum</span>
          <span class="lab-control__var">β</span>
          <span class="lab-control__value" data-role="mom-val">0.00</span>
        </span>
        <input type="range" min="0.00" max="0.99" step="0.01" value="0.00" data-role="mom" aria-label="momentum">
      </label>
      <div class="lab-playset" aria-label="Gradient descent display options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="gd-turbo" title="Speeds the training cadence"> Faster epochs</label>
      </div>
      <button class="lab-btn lab-btn--train" type="button" data-role="train-btn">
        <span class="lab-btn__text">Train!</span>
        <span class="lab-btn__bg"></span>
      </button>
      <button class="lab-btn lab-btn--train" type="button" data-role="gd-reroll-btn" aria-label="New random landscape and parameters">
        <span class="lab-btn__text">New Challenge</span>
        <span class="lab-btn__bg"></span>
      </button>
      <p class="lab-playbar__hint lab-playbar__hint--wide" data-role="gd-challenge-meta">Challenge: loading...</p>
      
      <!-- Active Game Controls -->
      <div class="lab-gd-action-panel" data-role="gd-action-panel" style="display: none; margin-top: 1rem; padding: 0.75rem; background: var(--ds-surface-elev); border: 1px dashed var(--ds-line); border-radius: var(--ds-radius-sm); text-align: center;">
        <span style="font-size: 0.74rem; color: var(--ds-muted); display: block; margin-bottom: 0.5rem; font-family: var(--ds-font-mono);">STEER THE PARTICLE LIVE:</span>
        <div style="display: flex; gap: 0.25rem; justify-content: center; flex-wrap: wrap;">
          <button class="lab-btn lab-btn--ghost" type="button" data-role="gd-boost" style="padding: 0.35rem 0.65rem; font-size: 0.74rem; font-family: var(--ds-font-mono); margin: 0;">🚀 Boost</button>
          <button class="lab-btn lab-btn--ghost" type="button" data-role="gd-brake" style="padding: 0.35rem 0.65rem; font-size: 0.74rem; font-family: var(--ds-font-mono); margin: 0;">🛑 Brake</button>
          <button class="lab-btn lab-btn--ghost" type="button" data-role="gd-nudge-l" style="padding: 0.35rem 0.65rem; font-size: 0.74rem; font-family: var(--ds-font-mono); margin: 0;">⬅️ Nudge L</button>
          <button class="lab-btn lab-btn--ghost" type="button" data-role="gd-nudge-r" style="padding: 0.35rem 0.65rem; font-size: 0.74rem; font-family: var(--ds-font-mono); margin: 0;">➡️ Nudge R</button>
        </div>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-gd" preserveAspectRatio="xMidYMid meet" role="img" aria-label="loss landscape"></svg>
    </div>

    <div class="lab-experiment__scorebar" data-role="stars-gd" aria-live="polite"></div>
    <div class="lab-experiment__verdict" data-role="verdict-gd" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick step size and momentum, hit Train.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Final loss</span>
        <span class="lab-experiment__metric-value" data-role="loss-val">…</span>
        <span class="lab-experiment__metric-formula">lower = closer to the answer</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Epochs</span>
        <span class="lab-experiment__metric-value" data-role="epoch-val">0</span>
        <span class="lab-experiment__metric-formula">steps the ball took</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-gd">Set parameters. Hit Train. Try not to bend the manifold; that never ends well in any dimension.</p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Learning is rolling downhill.</strong> Every modern AI (GPT, image generators, the search ranking on your phone) learns by repeatedly nudging its parameters in whichever direction makes the loss smaller. That's literally rolling a ball downhill on a high-dimensional landscape. Step size matters: too small and you crawl forever, too big and you bounce out of the valley you wanted.</p>
    <p><strong>Momentum is the killer feature.</strong> It lets the ball carry forward through small ridges that would otherwise trap it. This idea, invented for physics simulations in the 1960s, is why training a large model in 2026 finishes in days instead of years. Same algorithm in your phone's autocorrect, your camera's autofocus, and every AI lab on Earth.</p>
    <p><strong>Scientific Context:</strong> High-dimensional optimization landscapes govern the training dynamics of deep neural networks. Understanding how learning rates and momentum values navigate local minima and saddle points is essential for designing secure training frameworks like those in the author's machine learning security research.</p>
  </details>

  <div class="lab-share" data-role="gd-share-root">
    <button type="button" class="lab-share__btn" data-role="gd-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="gd-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="gd-share-text">5★ — Gradient Pinball · share text appears here</p>
      <div class="lab-share__actions">
        <button type="button" data-share="copy">📋 Copy link</button>
        <button type="button" data-share="x">𝕏 Tweet</button>
        <button type="button" data-share="li">in LinkedIn</button>
        <button type="button" data-share="close" aria-label="Close share">✕</button>
      </div>
    </div>
  </div>
</section>

<section class="lab-footer">
  <p>We hope you enjoyed this mandatory voluntary science. A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>. The stack thanks you for participating.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>
