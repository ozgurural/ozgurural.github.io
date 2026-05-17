---
permalink: /lab/
title: "Lab"
excerpt: "Five interactive thought experiments from my research — distributed systems, ML security, fault tolerance, optimization. Pick a real scenario, set your strategy, and let the math grade your aim."
---

<section class="lab-hero" aria-label="Lab arcade intro">
  <span class="ep-eyebrow">Interactive research arcade</span>
  <h2 class="lab-hero__title">Aim. Fire. Get graded.</h2>
  <p class="lab-hero__copy">
    Five test chambers from my research — distributed consensus, AI watermarks, training-run forensics, fault tolerance, optimization. Each one drops you into a real scenario; you pick the strategy, the simulation grades the result from <strong>Off-target</strong> to <strong>Frontier 🏆</strong>. The dial does not flatter. The cake, as always, is a lie. 5★ means you'd survive in production.
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
  <p class="lab-quest__msg" data-role="quest-msg">Five labs, each a scenario with a measurable goal. 5★ means you found the minimum play that beats it — unlocks the badge.</p>
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

<section class="lab-card lab-experiment" id="lab-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus</span>
  <h2>Consensus Casino</h2>
  <p class="lab-card__lead">🤝 Two friends are texting to meet up; the cell tower keeps eating their messages. Two strategies on the table — send once and pray, or just keep retrying until something lands. One of those is, mathematically, the entire reason your phone reconnects on weak Wi-Fi.</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Pick the scenario; find the minimum retries that beat the bar.</strong>
    <span>Each scenario sets its own reliability target — 99.9% on home WiFi, 80% in a hurricane. 5★ is the fewest tries that gets you there.</span>
    <div class="lab-card__mission-pills"><span>5★ minimum tries</span><span>4★ wasteful win</span><span>3★ close miss</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <div class="lab-levels" data-role="tg-levels" aria-label="Pick scenario">
        <strong class="lab-levels__title">Pick the scenario</strong>
        <div class="lab-levels__row">
          <button type="button" class="lab-level" data-p="0.15" data-goal="0.999" data-min-n="4" data-name="Home WiFi">
            <span class="lab-level__icon">🏖️</span>
            <span class="lab-level__name">Home WiFi</span>
            <span class="lab-level__hint">15% drop · need 99.9%</span>
          </button>
          <button type="button" class="lab-level lab-level--active" data-p="0.40" data-goal="0.99" data-min-n="6" data-name="City cafe">
            <span class="lab-level__icon">🏙️</span>
            <span class="lab-level__name">City cafe</span>
            <span class="lab-level__hint">40% drop · need 99%</span>
          </button>
          <button type="button" class="lab-level" data-p="0.65" data-goal="0.95" data-min-n="7" data-name="Subway">
            <span class="lab-level__icon">🚇</span>
            <span class="lab-level__name">Subway</span>
            <span class="lab-level__hint">65% drop · need 95%</span>
          </button>
          <button type="button" class="lab-level" data-p="0.85" data-goal="0.70" data-min-n="8" data-name="Storm">
            <span class="lab-level__icon">🌪️</span>
            <span class="lab-level__name">Storm</span>
            <span class="lab-level__hint">85% drop · need 70%</span>
          </button>
        </div>
      </div>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how many tries?</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-val">3</span>
        </span>
        <input type="range" min="1" max="10" step="1" value="3" data-role="n" aria-label="how many tries">
      </label>
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
    <div class="lab-experiment__verdict" data-role="verdict-tg" aria-live="polite">
      <span class="lab-experiment__verdict-head">—</span>
      <span class="lab-experiment__verdict-sub">Pick a scenario, choose retries, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Your reliability</span>
        <span class="lab-experiment__metric-value" data-role="naive-val">—</span>
        <span class="lab-experiment__metric-formula">retries vs lossy channel</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">If you required every retry to land</span>
        <span class="lab-experiment__metric-value" data-role="strict-val">—</span>
        <span class="lab-experiment__metric-formula">the unforgiving alternative</span>
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
  <p class="lab-card__lead">🕵️ Someone leaked your AI and ran it through a disguise. Before publishing, you'd spread a faint statistical signature across thousands of weights — too small to notice individually, together a fingerprint only you can read. The thief tries to scrub it. You have to read it through the noise anyway.</p>
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
      <span class="lab-experiment__verdict-head">—</span>
      <span class="lab-experiment__verdict-sub">Pick a thief, set your strategy, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Caught the thief</span>
        <span class="lab-experiment__metric-value" data-role="det-val">—</span>
        <span class="lab-experiment__metric-formula">verifier with the secret key</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--fpr">
        <span class="lab-experiment__metric-label">False alarm rate</span>
        <span class="lab-experiment__metric-value" data-role="fpr-val">—</span>
        <span class="lab-experiment__metric-formula">on an innocent model</span>
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
  <p class="lab-card__lead">🔬 Anyone can download a model and claim they trained it. The proof is in the journey — a real training run leaves a wobbly, monotone-ish loss curve that's almost impossible to forge after the fact. Tune the run; see if the trajectory would survive an audit. (The auditor is unforgiving but fair. Mostly fair.)</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Earn Gold Proof.</strong>
    <span>Pick learning rate, batch size, and data noise. Hit Train. The detector scores you on monotonicity, smoothness, distance from the fake-flat baseline, and how close your hyperparameters are to a credible regime.</span>
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
      <div class="lab-playset" aria-label="Proof-of-Learning pacing">
        <label class="lab-playset__opt"><input type="checkbox" data-role="pol-turbo"> Faster training</label>
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
    <div class="lab-experiment__verdict" data-role="verdict-pol" aria-live="polite">
      <span class="lab-experiment__verdict-head">—</span>
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
        <span class="lab-experiment__metric-value" data-role="pol-badge-val">—</span>
        <span class="lab-experiment__metric-formula">Bronze · Silver · Gold</span>
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
  <p class="lab-card__lead">✈️ Your A320 has three flight computers and a majority voter — one fails, the other two outvote it. But "three computers" is only "three independent failure paths" if they fail differently. Identical software hits the same overflow at the same millisecond. (Ariane 5, 1996. The rocket disagreed with reality and disassembled itself 39 seconds in.)</p>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Pick the mission; pick the minimum N that beats the safety target.</strong>
    <span>Each mission carries its own correlation (ρ) and per-channel failure rate (q). 5★ means hitting the safety multiplier with the fewest backups — overspending earns 4★.</span>
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
      <span class="lab-experiment__verdict-head">—</span>
      <span class="lab-experiment__verdict-sub">Pick a mission, choose backup count, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Safety multiplier</span>
        <span class="lab-experiment__metric-value" data-role="gain-val">—</span>
        <span class="lab-experiment__metric-formula">vs a single computer</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Whole-system failure rate</span>
        <span class="lab-experiment__metric-value" data-role="sys-val">—</span>
        <span class="lab-experiment__metric-formula">after majority voting</span>
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
  <p class="lab-card__lead">⛰️ Every modern model — GPT, Stable Diffusion, your phone's autocorrect — learns by rolling a ball down a high-dimensional loss landscape. The deepest valley is the answer; the smaller dips are traps. Too cautious and you settle in a side valley convinced you've won; too aggressive and the ball leaves the landscape entirely. There is no spoon — only a basin.</p>
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
    </div>

    <div class="lab-experiment__visual">
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-gd" preserveAspectRatio="xMidYMid meet" role="img" aria-label="loss landscape"></svg>
    </div>

    <div class="lab-experiment__scorebar" data-role="stars-gd" aria-live="polite"></div>
    <div class="lab-experiment__verdict" data-role="verdict-gd" aria-live="polite">
      <span class="lab-experiment__verdict-head">—</span>
      <span class="lab-experiment__verdict-sub">Pick step size and momentum, hit Train.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Final loss</span>
        <span class="lab-experiment__metric-value" data-role="loss-val">—</span>
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
    <p><strong>Learning is rolling downhill.</strong> Every modern AI — GPT, image generators, the search ranking on your phone — learns by repeatedly nudging its parameters in whichever direction makes the loss smaller. That's literally rolling a ball downhill on a high-dimensional landscape. Step size matters: too small and you crawl forever, too big and you bounce out of the valley you wanted.</p>
    <p><strong>Momentum is the killer feature.</strong> It lets the ball carry forward through small ridges that would otherwise trap it. This idea — invented for physics simulations in the 1960s — is why training a large model in 2026 finishes in days instead of years. Same algorithm in your phone's autocorrect, your camera's autofocus, and every AI lab on Earth.</p>
  </details>
</section>

<section class="lab-footer">
  <p>We hope you enjoyed this mandatory voluntary science. A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>. The stack thanks you for participating.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
