---
permalink: /lab/
title: "Lab"
excerpt: "Five interactive research games with sliders, badges, live plots, and just enough science to make the chaos useful."
---

<section class="lab-hero" aria-label="Lab arcade intro">
  <span class="ep-eyebrow">Interactive research arcade</span>
  <h2 class="lab-hero__title">Break the systems. Learn the trick.</h2>
  <p class="lab-hero__copy">
    Five tiny games from my research world: distributed consensus, model watermarking, proof-of-learning, fault tolerance, and optimization. No textbook pilgrimage. Drag sliders, chase unlocks, and let the graphs complain when reality gets expensive.
  </p>
  <div class="lab-hero__actions" aria-label="Jump to experiments">
    <a href="#lab-wm">Catch a stolen model</a>
    <a href="#lab-pol">Forge-proof a training run</a>
    <a href="#lab-tmr">Crash-test redundancy</a>
  </div>
</section>

<nav class="lab-mission-deck" aria-label="Lab mission deck">
  <a class="lab-mission-card" href="#lab-tg">
    <span class="lab-mission-card__code">01</span>
    <strong>Consensus Casino</strong>
    <span>Make unreliable messages behave like infrastructure.</span>
  </a>
  <a class="lab-mission-card" href="#lab-wm">
    <span class="lab-mission-card__code">02</span>
    <strong>Model Heist Detector</strong>
    <span>Hide a signal that survives fine-tuning.</span>
  </a>
  <a class="lab-mission-card" href="#lab-pol">
    <span class="lab-mission-card__code">03</span>
    <strong>Training Fingerprint</strong>
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
  <p class="lab-quest__msg" data-role="quest-msg">Complete five missions. Collect badges. Make statistical chaos behave for exactly long enough to look professional.</p>
  <ul class="lab-quest__list">
    <li class="lab-quest__item" data-quest-item="tg"><span class="lab-quest__name">Consensus</span> <span class="lab-quest__status" data-role="quest-tg">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="wm"><span class="lab-quest__name">Watermark</span> <span class="lab-quest__status" data-role="quest-wm">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="tmr"><span class="lab-quest__name">TMR</span> <span class="lab-quest__status" data-role="quest-tmr">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="pol"><span class="lab-quest__name">Proof-of-Learning</span> <span class="lab-quest__status" data-role="quest-pol">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="gd"><span class="lab-quest__name">Gradient descent</span> <span class="lab-quest__status" data-role="quest-gd">Locked</span></li>
  </ul>
  <p class="lab-quest__total" aria-live="polite"><span data-role="quest-total">0/5</span> missions</p>
</div>

<div class="lab-badges" id="lab-badges" aria-live="polite" role="region" aria-label="Badge gallery">
  <strong>Badges</strong>
  <div class="lab-badges__list">
    <div class="lab-badge lab-badge--locked" data-badge="tg">Consensus</div>
    <div class="lab-badge lab-badge--locked" data-badge="wm">Watermark</div>
    <div class="lab-badge lab-badge--locked" data-badge="tmr">TMR</div>
    <div class="lab-badge lab-badge--locked" data-badge="pol">Proof-of-Learning</div>
    <div class="lab-badge lab-badge--locked" data-badge="gd">Gradient</div>
  </div>
</div>

<div class="lab-playbar" id="lab-playbar" role="region" aria-label="Playground feedback and motion">
  <div class="lab-playbar__cluster">
    <span class="lab-playbar__kicker">Arcade layer</span>
    <label class="lab-playset__opt"><input type="checkbox" data-role="lab-juice" checked> Juice mode <span class="lab-playbar__hint">faster pulses, bigger wins</span></label>
    <label class="lab-playset__opt"><input type="checkbox" data-role="lab-haptic"> Haptic wins <span class="lab-playbar__hint">mobile buzz</span></label>
  </div>
  <div class="lab-playbar__cluster lab-playbar__cluster--score">
    <span class="lab-playbar__kicker">Combo</span>
    <span class="lab-playbar__combo" aria-live="polite"><span data-role="lab-combo-val">0</span></span>
    <span class="lab-playbar__hint">move any slider to build it</span>
  </div>
</div>

<section class="lab-card lab-experiment" id="lab-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus</span>
  <h2>Consensus Casino</h2>
  <p class="lab-card__usecase">Used in <strong>Blockchain consensus</strong> · <strong>Spanner / Raft / etcd</strong> · <strong>Cassandra &amp; DynamoDB</strong> · <strong>Microservice retries</strong> · <strong>TCP</strong></p>
  <p class="lab-card__lead">Packets vanish. Databases still pretend everyone agreed. Your job is to tune retries until probability looks suspiciously like truth.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Mission</span>
    <strong>Beat the handshake.</strong>
    <span>Push the multi-send strategy above 99% reliability while the strict protocol faceplants politely.</span>
    <div class="lab-card__mission-pills"><span>move p</span><span>raise N</span><span>unlock consensus</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Loss rate</span>
          <span class="lab-control__var">p</span>
          <span class="lab-control__value" data-role="p-val">0.40</span>
        </span>
        <input type="range" min="0" max="0.85" step="0.01" value="0.40" data-role="p" aria-label="loss rate p">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Protocol depth</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-val">3</span>
        </span>
        <input type="range" min="1" max="10" step="1" value="3" data-role="n" aria-label="protocol depth N">
      </label>
      <div class="lab-playset" aria-label="Two generals display options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="tg-turbo" title="Reduces effective loss and speeds retry cadence"> Fast retry lane</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="tg-neonplot" checked title="Adds coordination overhead and tightens the strict path"> Coordination tax</label>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <div class="lab-tg__field" aria-hidden="true">
        <div class="lab-tg__army lab-tg__army--a"><div class="lab-tg__flag">A</div></div>
        <div class="lab-tg__valley" data-role="valley">
          <span class="lab-tg__valley-label">channel · loss <span data-role="p-display">0.40</span></span>
        </div>
        <div class="lab-tg__army lab-tg__army--b"><div class="lab-tg__flag">B</div></div>
      </div>

      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot" preserveAspectRatio="xMidYMid meet" role="img" aria-label="win probability vs protocol depth"></svg>
    </div>

    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Naive multi-send</span>
        <span class="lab-experiment__metric-value" data-role="naive-val">—</span>
        <span class="lab-experiment__metric-formula">P(win) = 1 − p<sup>N</sup></span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Strict chain</span>
        <span class="lab-experiment__metric-value" data-role="strict-val">—</span>
        <span class="lab-experiment__metric-formula">P(win) = (1 − p)<sup>N</sup></span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--delta">
        <span class="lab-experiment__metric-label">Δ</span>
        <span class="lab-experiment__metric-value" data-role="delta-val">—</span>
        <span class="lab-experiment__metric-formula">in favour of naive</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--minN">
        <span class="lab-experiment__metric-label">Min N for 99%</span>
        <span class="lab-experiment__metric-value" data-role="minN-val">—</span>
        <span class="lab-experiment__metric-formula">naive ≥ 0.99</span>
      </div>
    </div>
    <p class="lab-experiment__insight" data-role="insight">Drag the sliders. Pretty plots, ugly impossibility: deterministic consensus over lossy channels still does not exist.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tg" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>Behind the game</summary>
    <p>Strict handshakes need every message to survive, so loss compounds. Multi-send only needs one copy to arrive, so reliability climbs fast. That is the practical trick behind retries, confirmations, and quorum systems.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>Model Heist Detector</h2>
  <p class="lab-card__usecase">Used in <strong>OpenAI / Anthropic IP defence</strong> · <strong>HuggingFace gated weights</strong> · <strong>Banking model auditing</strong></p>
  <p class="lab-card__lead">Someone fine-tuned your model and put a hoodie on it. Find a watermark strong enough to survive the disguise, but not so loud it ruins the model.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Mission</span>
    <strong>Catch the clone.</strong>
    <span>Balance perturbation, key size, and attack noise until detection is high and false alarms stay boring.</span>
    <div class="lab-card__mission-pills"><span>90%+ detection</span><span>low false alarms</span><span>no model damage</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        Find the bright zone: enough signal to prove ownership, not enough to make the model act haunted.
      </p>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Perturbation</span>
          <span class="lab-control__var">ε</span>
          <span class="lab-control__value" data-role="eps-val">0.20</span>
        </span>
        <input type="range" min="0.02" max="0.45" step="0.01" value="0.20" data-role="eps" aria-label="perturbation magnitude epsilon">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Key size</span>
          <span class="lab-control__var">k</span>
          <span class="lab-control__value" data-role="k-val">8</span>
        </span>
        <input type="range" min="1" max="32" step="1" value="8" data-role="k" aria-label="key size k">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Attack noise</span>
          <span class="lab-control__var">σ</span>
          <span class="lab-control__value" data-role="sigma-val">0.10</span>
        </span>
        <input type="range" min="0" max="0.40" step="0.01" value="0.10" data-role="sigma" aria-label="attack noise sigma">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Significance</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="alpha-val">0.050</span>
        </span>
        <input type="range" min="0.001" max="0.10" step="0.001" value="0.050" data-role="alpha" aria-label="significance level alpha">
      </label>
      <div class="lab-playset" aria-label="Watermark visualization tied to detector statistics">
        <label class="lab-playset__opt"><input type="checkbox" data-role="wm-neon" checked title="Lowers detector strictness so q and detection move with the signal."> High-contrast detector</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="wm-pop" title="Adds a broader validation window, which changes effective k and the published regime."> Broader validation window</label>
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

    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Detection rate</span>
        <span class="lab-experiment__metric-value" data-role="det-val">—</span>
        <span class="lab-experiment__metric-formula">verifier with key</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--fpr">
        <span class="lab-experiment__metric-label">False-positive rate</span>
        <span class="lab-experiment__metric-value" data-role="fpr-val">—</span>
        <span class="lab-experiment__metric-formula">on plain noise</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--snr">
        <span class="lab-experiment__metric-label">SNR (per cell)</span>
        <span class="lab-experiment__metric-value" data-role="snr-val">—</span>
        <span class="lab-experiment__metric-formula">ε / √(σ²+σ₀²)</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--utility">
        <span class="lab-experiment__metric-label">Utility margin</span>
        <span class="lab-experiment__metric-value" data-role="utility-val">—</span>
        <span class="lab-experiment__metric-formula">0.25 − ε</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-wm">Drag the sliders.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-wm" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>Behind the game</summary>
    <p>A watermark is a faint statistical signature spread across many weights. One mark is easy to erase; many tiny marks become detectable together. The challenge is staying visible to the verifier and invisible to normal users.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-pol">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <h2>Training Fingerprint</h2>
  <p class="lab-card__usecase">Used in <strong>Foundation model auditing</strong> · <strong>Competitive intelligence</strong> · <strong>Patent disputes</strong> · <strong>Minting training credentials</strong> · <strong>Open-source verification</strong></p>
  <p class="lab-card__lead">Weights can be copied. The training journey is harder to fake. Build a loss curve that looks alive, not like a suspiciously convenient straight line.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Mission</span>
    <strong>Earn Gold Proof.</strong>
    <span>Tune learning rate, batch size, and noise until the training run has a credible fingerprint.</span>
    <div class="lab-card__mission-pills"><span>score 88+</span><span>stable descent</span><span>spot the fake</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        Gold lives near α 0.008–0.018, batch 64–256, and noise 0.02–0.08. The lab will not admit this was helpful.
      </p>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Learning rate</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="pol-lr-val">0.01</span>
        </span>
        <input type="range" min="0.001" max="0.05" step="0.001" value="0.01" data-role="pol-lr" aria-label="learning rate alpha">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Batch size</span>
          <span class="lab-control__var">B</span>
          <span class="lab-control__value" data-role="pol-bs-val">32</span>
        </span>
        <input type="range" min="1" max="8" step="1" value="3" data-role="pol-bs" aria-label="batch size index">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Data noise</span>
          <span class="lab-control__var">ζ</span>
          <span class="lab-control__value" data-role="pol-noise-val">0.05</span>
        </span>
        <input type="range" min="0.01" max="0.20" step="0.01" value="0.05" data-role="pol-noise" aria-label="data noise zeta">
      </label>
      <div class="lab-playset" aria-label="Proof-of-Learning pacing">
        <label class="lab-playset__opt"><input type="checkbox" data-role="pol-turbo"> Hyper-training (faster epochs)</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="pol-mega" title="Tightens the Gold cutoff and makes the score harder to earn"> Hard-mode validation</label>
      </div>
      <button class="lab-btn lab-btn--train" type="button" data-role="pol-train-btn">
        <span class="lab-btn__text">Train!</span>
        <span class="lab-btn__bg"></span>
      </button>
    </div>

    <div class="lab-experiment__visual">
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-pol" preserveAspectRatio="xMidYMid meet" role="img" aria-label="training loss trajectory"></svg>
    </div>

    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Verification score</span>
        <span class="lab-experiment__metric-value" data-role="pol-score-val">0</span>
        <span class="lab-experiment__metric-formula">target: Gold ≥ 88</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Badge</span>
        <span class="lab-experiment__metric-value" data-role="pol-badge-val">—</span>
        <span class="lab-experiment__metric-formula">Bronze / Silver / Gold</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Win streak</span>
        <span class="lab-experiment__metric-value" data-role="pol-streak-val">0</span>
        <span class="lab-experiment__metric-formula">consecutive Gold runs</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--breakeven">
        <span class="lab-experiment__metric-label">Current loss</span>
        <span class="lab-experiment__metric-value" data-role="pol-loss-val">—</span>
        <span class="lab-experiment__metric-formula">f(θ)</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Epochs completed</span>
        <span class="lab-experiment__metric-value" data-role="pol-epoch-val">0</span>
        <span class="lab-experiment__metric-formula">training progress</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Trajectory uniqueness</span>
        <span class="lab-experiment__metric-value" data-role="pol-unique-val">—</span>
        <span class="lab-experiment__metric-formula">collision risk</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Fake model detected?</span>
        <span class="lab-experiment__metric-value" data-role="pol-fake-val">—</span>
        <span class="lab-experiment__metric-formula">via trajectory</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-pol">Adjust sliders and hit Train. Real training should descend with controlled chaos, not flatline like a suspiciously convenient download from the desert of the real.</p>
  </div>

  <details class="lab-reveal">
    <summary>Behind the game</summary>
    <p>Proof-of-Learning records the training trajectory. A copied model may have the final weights, but not the messy path that produced them. That path becomes evidence.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-tmr">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>Redundancy Reactor</h2>
  <p class="lab-card__usecase">Used in <strong>A320 fly-by-wire</strong> · <strong>Boeing 787</strong> · <strong>Apollo Guidance Computer</strong> · <strong>Mars rovers</strong> · <strong>your phone's secure enclave</strong></p>
  <p class="lab-card__lead">More computers help only when they fail differently. Turn correlation up and watch redundancy become a very expensive group hallucination.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Mission</span>
    <strong>Keep the voter alive.</strong>
    <span>Find the safe envelope where majority voting gives real reliability instead of synchronized failure cosplay.</span>
    <div class="lab-card__mission-pills"><span>lower q</span><span>control ρ</span><span>test N</span></div>
  </div>

  <div class="lab-tmr">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Per-channel failure rate</span>
          <span class="lab-control__var">q</span>
          <span class="lab-control__value" data-role="q-val">0.05</span>
        </span>
        <input type="range" min="0.005" max="0.30" step="0.005" value="0.05" data-role="q" aria-label="per-channel failure rate q">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Common-mode correlation</span>
          <span class="lab-control__var">ρ</span>
          <span class="lab-control__value" data-role="rho-val">0.00</span>
        </span>
        <input type="range" min="0" max="1" step="0.01" value="0.00" data-role="rho" aria-label="common-mode correlation rho">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Redundant Channels (N)</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-channels-val">3</span>
        </span>
        <input type="range" min="3" max="9" step="2" value="3" data-role="n-channels" aria-label="number of redundant channels">
      </label>
      <div class="lab-playset" aria-label="TMR simulation options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="tmr-hypersim" title="Shortens the voting window and changes the sampling cadence"> Short voting window</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="tmr-glow" checked title="Reduces effective correlation with a diverse voter model"> Diverse voter row</label>
      </div>
    </div>

    <div class="lab-tmr__strip" aria-hidden="true" data-role="tmr-strip">
      <div class="lab-tmr__row" data-ch="1">
        <span class="lab-tmr__row-label">CH 1</span>
        <div class="lab-tmr__cells" data-cells="1"></div>
      </div>
      <div class="lab-tmr__row" data-ch="2">
        <span class="lab-tmr__row-label">CH 2</span>
        <div class="lab-tmr__cells" data-cells="2"></div>
      </div>
      <div class="lab-tmr__row" data-ch="3">
        <span class="lab-tmr__row-label">CH 3</span>
        <div class="lab-tmr__cells" data-cells="3"></div>
      </div>
      <div class="lab-tmr__row lab-tmr__row--sys">
        <span class="lab-tmr__row-label">SYS</span>
        <div class="lab-tmr__cells" data-cells="sys"></div>
      </div>
    </div>

    <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-tmr" preserveAspectRatio="xMidYMid meet" role="img" aria-label="system failure rate vs per-channel failure rate"></svg>

    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">System failure rate</span>
        <span class="lab-experiment__metric-value" data-role="sys-val">—</span>
        <span class="lab-experiment__metric-formula">ρq + (1−ρ) majority tail</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Single channel</span>
        <span class="lab-experiment__metric-value" data-role="single-val">—</span>
        <span class="lab-experiment__metric-formula">P(fail) = q</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Reliability gain</span>
        <span class="lab-experiment__metric-value" data-role="gain-val">—</span>
        <span class="lab-experiment__metric-formula">single ÷ TMR</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--breakeven">
        <span class="lab-experiment__metric-label">Break-even ρ</span>
        <span class="lab-experiment__metric-value" data-role="rho-breakeven-val">—</span>
        <span class="lab-experiment__metric-formula">gain = 10×</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-tmr">Drag the sliders. The strip is live; the curves are closed-form; déjà vu is still a bug, not a feature.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tmr" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>Behind the game</summary>
    <p>Redundancy works when failures are independent. Correlated bugs, shared assumptions, and common-mode events destroy the upgrade. The slider marked ρ is where the nice safety story starts sweating.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-gd">
  <span class="ep-eyebrow">Deep Learning · Optimization</span>
  <h2>Gradient Pinball</h2>
  <p class="lab-card__usecase">Used in <strong>Training LLMs</strong> · <strong>Backpropagation</strong> · <strong>Physics Simulations</strong></p>
  <p class="lab-card__lead">Optimization is pinball with calculus. Too timid, you get stuck. Too spicy, the particle leaves the budget and possibly the building.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Mission</span>
    <strong>Land in the global minimum.</strong>
    <span>Pick learning rate and momentum, press Train, and try to land before the loss leaves the scoreboard.</span>
    <div class="lab-card__mission-pills"><span>train</span><span>reroll</span><span>hit the basin</span></div>
  </div>
  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Learning Rate</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="lr-val">0.02</span>
        </span>
        <input type="range" min="0.001" max="0.10" step="0.001" value="0.02" data-role="lr" aria-label="learning rate">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Momentum</span>
          <span class="lab-control__var">β</span>
          <span class="lab-control__value" data-role="mom-val">0.00</span>
        </span>
        <input type="range" min="0.00" max="0.99" step="0.01" value="0.00" data-role="mom" aria-label="momentum">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Batch Noise</span>
          <span class="lab-control__var">ζ</span>
          <span class="lab-control__value" data-role="noise-val">0.00</span>
        </span>
        <input type="range" min="0.00" max="2.00" step="0.05" value="0.00" data-role="noise" aria-label="batch noise">
      </label>
      <div class="lab-playset" aria-label="Gradient descent display options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="gd-turbo" title="Speeds the training cadence and shortens the delay between epochs"> Fast epochs</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="gd-rainbow" checked title="Turns on an adaptive step schedule that changes the optimizer path"> Adaptive step schedule</label>
        <span class="lab-playbar__hint lab-playbar__hint--wide">ζ changes the training path; these toggles alter the optimizer, not just the trail.</span>
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
    </div>

    <div class="lab-experiment__visual">
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-gd" preserveAspectRatio="xMidYMid meet" role="img" aria-label="loss landscape"></svg>
    </div>

    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Epochs</span>
        <span class="lab-experiment__metric-value" data-role="epoch-val">0</span>
        <span class="lab-experiment__metric-formula">steps taken</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Loss</span>
        <span class="lab-experiment__metric-value" data-role="loss-val">0.00</span>
        <span class="lab-experiment__metric-formula">f(x)</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Velocity</span>
        <span class="lab-experiment__metric-value" data-role="vel-val">0.00</span>
        <span class="lab-experiment__metric-formula">Δx</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-gd">Set parameters. Hit Train. Try not to bend the manifold; that never ends well in any dimension.</p>
  </div>

  <details class="lab-reveal">
    <summary>Behind the game</summary>
    <p>Gradient descent moves downhill. Learning rate controls step size; momentum carries speed from previous steps. Good training is not magic. It is avoiding both boredom and explosion.</p>
  </details>
</section>

<section class="lab-footer">
  <p>We hope you enjoyed this mandatory voluntary science. A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>. The stack thanks you for participating.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
