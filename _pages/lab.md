---
permalink: /lab/
title: "Lab"
excerpt: "Five tiny science games. Drag sliders, earn stars (1–5 per lab), learn how real systems break and stay alive."
---

<section class="lab-hero" aria-label="Lab arcade intro">
  <span class="ep-eyebrow">Interactive research arcade</span>
  <h2 class="lab-hero__title">Aim. Fire. Get graded.</h2>
  <p class="lab-hero__copy">
    Five tiny science games, played the same way: set your parameters, hit <strong>Run experiment</strong>, and the simulation grades your run from <strong>Oof</strong> 💥 to <strong>Legendary</strong> 🏆. No hints on the dial — 5★ means you actually nailed it.
  </p>
  <div class="lab-hero__actions" aria-label="Jump to experiments">
    <a href="#lab-wm">Catch a stolen AI model</a>
    <a href="#lab-pol">Prove a training run is real</a>
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
  <p class="lab-quest__msg" data-role="quest-msg">Five labs. Each one grades your run 1★–5★ live. Hit 5★ in any lab to unlock its badge below.</p>
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
  <p class="lab-card__lead">🤝 Two friends are texting to meet up. The cell tower keeps dropping their messages. One strategy: send once and hope. Another: send the message over and over. One of them actually works — and it's the one your phone uses every day.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your job</span>
    <strong>Push their chance of meeting past 99%.</strong>
    <span>Turn up how bad the signal is, and how many times they retry. Hit Run and see if they actually make it to dinner.</span>
    <div class="lab-card__mission-pills"><span>5★ ≥ 99%</span><span>4★ ≥ 95%</span><span>3★ ≥ 85%</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How bad is the signal?</span>
          <span class="lab-control__var">p</span>
          <span class="lab-control__value" data-role="p-val">0.40</span>
        </span>
        <input type="range" min="0" max="0.85" step="0.01" value="0.40" data-role="p" aria-label="how bad is the signal">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How many tries?</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-val">3</span>
        </span>
        <input type="range" min="1" max="10" step="1" value="3" data-role="n" aria-label="how many tries">
      </label>
      <div class="lab-playset" aria-label="Two generals display options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="tg-turbo" title="Reduces effective loss and speeds retry cadence"> Fast retry lane</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="tg-neonplot" checked title="Adds coordination overhead and tightens the strict path"> Coordination tax</label>
      </div>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="tg-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
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

    <div class="lab-experiment__scorebar" data-role="stars-tg" aria-live="polite"></div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Smart strategy</span>
        <span class="lab-experiment__metric-value" data-role="naive-val">—</span>
        <span class="lab-experiment__metric-formula">send many copies — need 1 to arrive</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Strict strategy</span>
        <span class="lab-experiment__metric-value" data-role="strict-val">—</span>
        <span class="lab-experiment__metric-formula">every message must arrive</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--delta">
        <span class="lab-experiment__metric-label">Smart vs strict</span>
        <span class="lab-experiment__metric-value" data-role="delta-val">—</span>
        <span class="lab-experiment__metric-formula">smart wins by this much</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--minN">
        <span class="lab-experiment__metric-label">Min tries for 99%</span>
        <span class="lab-experiment__metric-value" data-role="minN-val">—</span>
        <span class="lab-experiment__metric-formula">tries needed for 99%</span>
      </div>
    </div>
    <p class="lab-experiment__insight" data-role="insight">Drag the sliders. Pretty plots, ugly impossibility: deterministic consensus over lossy channels still does not exist.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tg" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Retrying beats coordinating.</strong> If your strategy needs <em>every</em> step to succeed, even tiny losses compound — three 90% steps in a row only succeed 73% of the time. But if you only need <em>one</em> of many copies to arrive, your odds climb fast. This is the trick behind TCP retries, blockchain confirmation depth, and how Cassandra and DynamoDB stay alive when networks misbehave.</p>
    <p><strong>The famous impossibility:</strong> there's a 1975 result called the <em>Two Generals problem</em> — two armies on opposite hills can never be 100% sure they agree on an attack time over a lossy channel, no matter how many messages they send. You can only get <em>arbitrarily close</em> to certainty by trying more times. Which is exactly what every modern distributed system actually does.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>Model Heist Detector</h2>
  <p class="lab-card__usecase">Used in <strong>OpenAI / Anthropic IP defence</strong> · <strong>HuggingFace gated weights</strong> · <strong>Banking model auditing</strong></p>
  <p class="lab-card__lead">🕵️ Someone stole your AI and tried to disguise it. Lucky you — before publishing, you hid a secret pattern in the weights. Now: is the signature still readable through the disguise? Make it too quiet and you lose the thief. Make it too loud and the AI gets weird.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your job</span>
    <strong>Catch the thief without ruining the model.</strong>
    <span>Tune how bold the signature is, where you hide it, and how sneaky the thief gets. Hit Run and see if you'd win in court.</span>
    <div class="lab-card__mission-pills"><span>5★ catch≥97%, false alarms≤3%</span><span>4★ catch≥90%</span><span>3★ catch≥70%</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        Find the bright zone: enough signal to prove ownership, not enough to make the model act haunted.
      </p>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How bold is your signature?</span>
          <span class="lab-control__var">ε</span>
          <span class="lab-control__value" data-role="eps-val">0.20</span>
        </span>
        <input type="range" min="0.02" max="0.45" step="0.01" value="0.20" data-role="eps" aria-label="how bold is the watermark signature">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How many hidden marks?</span>
          <span class="lab-control__var">k</span>
          <span class="lab-control__value" data-role="k-val">8</span>
        </span>
        <input type="range" min="1" max="32" step="1" value="8" data-role="k" aria-label="how many hidden marks">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How sneaky is the thief?</span>
          <span class="lab-control__var">σ</span>
          <span class="lab-control__value" data-role="sigma-val">0.10</span>
        </span>
        <input type="range" min="0" max="0.40" step="0.01" value="0.10" data-role="sigma" aria-label="how sneaky is the thief">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Detector strictness</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="alpha-val">0.050</span>
        </span>
        <input type="range" min="0.001" max="0.10" step="0.001" value="0.050" data-role="alpha" aria-label="detector strictness">
      </label>
      <div class="lab-playset" aria-label="Watermark visualization tied to detector statistics">
        <label class="lab-playset__opt"><input type="checkbox" data-role="wm-neon" checked title="Lowers detector strictness so q and detection move with the signal."> High-contrast detector</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="wm-pop" title="Adds a broader validation window, which changes effective k and the published regime."> Broader validation window</label>
      </div>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="wm-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
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

    <div class="lab-experiment__scorebar" data-role="stars-wm" aria-live="polite"></div>
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
        <span class="lab-experiment__metric-label">Signal per mark</span>
        <span class="lab-experiment__metric-value" data-role="snr-val">—</span>
        <span class="lab-experiment__metric-formula">signal vs noise per mark</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--utility">
        <span class="lab-experiment__metric-label">Model still works?</span>
        <span class="lab-experiment__metric-value" data-role="utility-val">—</span>
        <span class="lab-experiment__metric-formula">how safe for the model</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-wm">Drag the sliders.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-wm" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Tiny secrets in many places beat one big secret.</strong> An AI model has hundreds of millions of internal numbers. A watermark is a faint statistical pattern spread across many of them — each individual mark is way too small to notice, but together they form a signature only you can recognize.</p>
    <p>This is how labs at OpenAI, Google, and Anthropic plan to prove "yes, that model is ours" if it gets leaked. The same trick is used to find AI-generated text, mark images from specific cameras, and prove which lab produced a research paper. The harder the thief tries to erase one mark, the more visible the others become.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-pol">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <h2>Training Fingerprint</h2>
  <p class="lab-card__usecase">Used in <strong>Foundation model auditing</strong> · <strong>Competitive intelligence</strong> · <strong>Patent disputes</strong> · <strong>Minting training credentials</strong> · <strong>Open-source verification</strong></p>
  <p class="lab-card__lead">🔬 Anyone can download an AI and claim they trained it. The real proof is in the journey: a genuine training run leaves a fingerprint — a wiggly curve that's hard to fake. Run it once and see if your trajectory would survive an audit.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your job</span>
    <strong>Earn Gold Proof.</strong>
    <span>Pick learning speed, examples per step, and data messiness. Hit Train. 5★ when the fingerprint looks real.</span>
    <div class="lab-card__mission-pills"><span>5★ score ≥ 94</span><span>4★ ≥ 82</span><span>3★ ≥ 68</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        Gold lives near α 0.008–0.018, batch 64–256, and noise 0.02–0.08. The lab will not admit this was helpful.
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
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How messy is the data?</span>
          <span class="lab-control__var">ζ</span>
          <span class="lab-control__value" data-role="pol-noise-val">0.05</span>
        </span>
        <input type="range" min="0.01" max="0.20" step="0.01" value="0.05" data-role="pol-noise" aria-label="how messy is the data">
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

    <div class="lab-experiment__scorebar" data-role="stars-pol" aria-live="polite"></div>
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
        <span class="lab-experiment__metric-formula">how wrong the model is</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Epochs completed</span>
        <span class="lab-experiment__metric-value" data-role="pol-epoch-val">0</span>
        <span class="lab-experiment__metric-formula">training progress</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Unique fingerprint</span>
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
    <summary>🧠 What did you just learn?</summary>
    <p><strong>The journey is harder to fake than the destination.</strong> The final weights of a trained AI are just a giant list of numbers — copy-pasteable in seconds. But the <em>path</em> the loss took during training? It's noisy, bumpy, has little flat spots when learning stalls, sudden drops when it finds a shortcut. That fingerprint is almost impossible to forge after the fact.</p>
    <p>This is called <em>Proof-of-Learning</em>, and it matters for: patent disputes ("did you really invent this?"), competitive intelligence ("did they actually train, or did they distill ours?"), and verifying open-source claims. Same idea as a digital signature, but for the training process instead of the model.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-tmr">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>Redundancy Reactor</h2>
  <p class="lab-card__usecase">Used in <strong>A320 fly-by-wire</strong> · <strong>Boeing 787</strong> · <strong>Apollo Guidance Computer</strong> · <strong>Mars rovers</strong> · <strong>your phone's secure enclave</strong></p>
  <p class="lab-card__lead">✈️ Your A320 has three flight computers. If one crashes, the other two outvote it and the plane keeps flying. But if all three share the same bug? They all crash together. The trick is keeping them genuinely different — three Macs in a coat doesn't count.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your job</span>
    <strong>Make three computers way safer than one.</strong>
    <span>Pick the crash rate, how alike they are, and how many computers you bolt in. Run and see how many times safer the system became.</span>
    <div class="lab-card__mission-pills"><span>5★ ≥ 250× safer</span><span>4★ ≥ 75× safer</span><span>3★ ≥ 20× safer</span></div>
  </div>

  <div class="lab-tmr">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How often each computer crashes</span>
          <span class="lab-control__var">q</span>
          <span class="lab-control__value" data-role="q-val">0.05</span>
        </span>
        <input type="range" min="0.005" max="0.30" step="0.005" value="0.05" data-role="q" aria-label="how often each computer crashes">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Do they crash together?</span>
          <span class="lab-control__var">ρ</span>
          <span class="lab-control__value" data-role="rho-val">0.00</span>
        </span>
        <input type="range" min="0" max="1" step="0.01" value="0.00" data-role="rho" aria-label="do they crash together">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">How many computers?</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-channels-val">3</span>
        </span>
        <input type="range" min="3" max="9" step="2" value="3" data-role="n-channels" aria-label="how many computers">
      </label>
      <div class="lab-playset" aria-label="TMR simulation options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="tmr-hypersim" title="Shortens the voting window and changes the sampling cadence"> Short voting window</label>
        <label class="lab-playset__opt"><input type="checkbox" data-role="tmr-glow" checked title="Reduces effective correlation with a diverse voter model"> Diverse voter row</label>
      </div>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="tmr-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
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
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Whole system fails</span>
        <span class="lab-experiment__metric-value" data-role="sys-val">—</span>
        <span class="lab-experiment__metric-formula">chance the whole system crashes</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">If just one computer</span>
        <span class="lab-experiment__metric-value" data-role="single-val">—</span>
        <span class="lab-experiment__metric-formula">if there was only one</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">How much safer</span>
        <span class="lab-experiment__metric-value" data-role="gain-val">—</span>
        <span class="lab-experiment__metric-formula">how much safer than one</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--breakeven">
        <span class="lab-experiment__metric-label">Shared-fault danger line</span>
        <span class="lab-experiment__metric-value" data-role="rho-breakeven-val">—</span>
        <span class="lab-experiment__metric-formula">when shared bugs win</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-tmr">Drag the sliders. The strip is live; the curves are closed-form; déjà vu is still a bug, not a feature.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tmr" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Three of the same thing is still one thing.</strong> Backup computers only protect you if they fail in different ways. Three identical computers running the same software will hit the same bug at the same moment — and then majority voting gives the wrong answer with confidence.</p>
    <p>This is what crashed the first Ariane 5 rocket in 1996: it had redundant flight computers, but they all ran the same code, so they all overflowed the same variable at the same instant. To get real safety, planes use computers from <em>different vendors</em>, written by <em>different teams</em>, in <em>different programming languages</em>. Same idea protects nuclear reactors, Mars rovers, and the secure chip in your phone.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-gd">
  <span class="ep-eyebrow">Deep Learning · Optimization</span>
  <h2>Gradient Pinball</h2>
  <p class="lab-card__usecase">Used in <strong>Training LLMs</strong> · <strong>Backpropagation</strong> · <strong>Physics Simulations</strong></p>
  <p class="lab-card__lead">⛰️ Training an AI is like rolling a ball down a hilly landscape. The deepest valley is the answer. Too cautious — the ball gets stuck on a small hill and never reaches the real bottom. Too aggressive — it flies off the map entirely. There's a sweet step size.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your job</span>
    <strong>Land the ball in the deepest valley.</strong>
    <span>Pick step size and momentum. Hit Train. 5★ when the ball settles exactly at the global minimum.</span>
    <div class="lab-card__mission-pills"><span>5★ global minimum</span><span>4★ very close</span><span>3★ stuck in a side valley</span></div>
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
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Wobble</span>
          <span class="lab-control__var">ζ</span>
          <span class="lab-control__value" data-role="noise-val">0.00</span>
        </span>
        <input type="range" min="0.00" max="2.00" step="0.05" value="0.00" data-role="noise" aria-label="wobble">
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

    <div class="lab-experiment__scorebar" data-role="stars-gd" aria-live="polite"></div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Epochs</span>
        <span class="lab-experiment__metric-value" data-role="epoch-val">0</span>
        <span class="lab-experiment__metric-formula">steps taken</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Loss</span>
        <span class="lab-experiment__metric-value" data-role="loss-val">0.00</span>
        <span class="lab-experiment__metric-formula">how wrong the model is</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Velocity</span>
        <span class="lab-experiment__metric-value" data-role="vel-val">0.00</span>
        <span class="lab-experiment__metric-formula">how fast it's moving</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-gd">Set parameters. Hit Train. Try not to bend the manifold; that never ends well in any dimension.</p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Learning is rolling downhill.</strong> Every modern AI — GPT, image generators, the search ranking on your phone — learns by repeatedly nudging its parameters in whichever direction makes the loss smaller. That's literally rolling a ball downhill on a high-dimensional landscape. Step size matters: too small and you crawl forever, too big and you bounce out of the valley you wanted.</p>
    <p><strong>Momentum is the killer feature.</strong> It lets the ball carry forward through small ridges that would otherwise trap it. This idea — invented for physics simulations in the 1960s — is why training a large model in 2026 finishes in days instead of years. Same algorithm in your phone's autocorrect, your camera's autofocus, and every AI lab on Earth.</p>
  </details>
</section>

<section class="lab-footer">
  <p>We hope you enjoyed this mandatory voluntary science. A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>. The stack thanks you for participating.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
