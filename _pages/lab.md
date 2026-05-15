---
permalink: /lab/
title: "Lab"
excerpt: "Five interactive experiments—now with extra sarcasm, fewer spoons, and no cake (the cake was a lie anyway). Drag the sliders and try not to disappoint the facility."
---

<p class="ep-lead">
  Welcome to the interactive graveyard of pristine theoretical computer science. None of the exhibits below are pure textbook abstractions. They are live simulations of the statistical duct tape currently holding human civilization together. Here you will find your bank hallucinating network consensus in real-time, a VC-funded startup mathematically failing to launder stolen LLM weights, and your Airbus politely surviving a cosmic ray strike at 36,000 feet. Drag the sliders. Watch beautiful theories collapse into statistical panic. If you still naively believe in deterministic systems, simply open DevTools and let the floating-point math personally offend you.
</p>
<p class="ep-lead">
  For your safety and the safety of adjacent timelines: this is not a test, though it will be graded. There is no spoon—only Jacobians—and what you are about to experience is absolutely real, which is worse than the alternative. Proceed as if a calm artificial voice were watching you take notes. It is.
</p>

<div class="lab-quest" role="region" aria-label="Lab mission progress">
  <p class="lab-quest__msg" data-role="quest-msg">Complete five enrichment activities. Compliance will be rewarded with dopamine and a false sense of competence.</p>
  <ul class="lab-quest__list">
    <li class="lab-quest__item" data-quest-item="tg"><span class="lab-quest__name">Consensus</span> <span class="lab-quest__status" data-role="quest-tg">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="wm"><span class="lab-quest__name">Watermark</span> <span class="lab-quest__status" data-role="quest-wm">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="tmr"><span class="lab-quest__name">TMR</span> <span class="lab-quest__status" data-role="quest-tmr">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="pol"><span class="lab-quest__name">Proof-of-Learning</span> <span class="lab-quest__status" data-role="quest-pol">Locked</span></li>
    <li class="lab-quest__item" data-quest-item="gd"><span class="lab-quest__name">Gradient descent</span> <span class="lab-quest__status" data-role="quest-gd">Locked</span></li>
  </ul>
  <p class="lab-quest__total" aria-live="polite"><span data-role="quest-total">0/5</span> missions</p>
</div>

<div class="lab-badges" id="lab-badges" aria-live="polite" role="region" aria-label="Badge gallery" style="margin:0.6rem 0 1rem 0">
  <strong>Badges</strong>
  <div class="lab-badges__list" style="display:flex;gap:0.6rem;margin-top:0.4rem">
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
  <h2>Why Distributed Systems Fake Consensus</h2>
  <p class="lab-card__usecase">Used in <strong>Blockchain consensus</strong> · <strong>Spanner / Raft / etcd</strong> · <strong>Cassandra &amp; DynamoDB</strong> · <strong>Microservice retries</strong> · <strong>TCP</strong></p>
  <p class="lab-card__lead">
    Two generals want to attack a valley. Or, putting down the 1970s war metaphors, two AWS regions want to agree: <em>did Alice just execute a cross-chain liquidity transfer through a bridge protocol without her staking collateral getting slashed?</em> Packets drop, BGP routes flap, and a rogue backhoe inevitably severs a fiber line. Physics and Information Theory, specifically Akkoyunlu's 1975 proof, brutally dictate that deterministic consensus over a lossy channel is <em>strictly impossible</em>. You literally cannot know for sure. Yet your bank confirms trades in 200 ms. The secret? <strong>They just gave up.</strong> They abandoned ontological certainty for asymptotically bounded <em>probability</em>. At six nines of reliability, late-stage capitalism simply declares it "truth."
  </p>
  <p class="lab-card__lead">
    Watch the epistemological crisis unfold below. The <strong>strict-chain</strong> approach of two-phase commit insists on perfect handshakes like a neurotic Victorian bureaucrat, and dies gracefully. The <strong>naive parallel</strong> approach of microservice retries acts like an overly caffeinated telemarketer, just blasting messages until one gets through. Spoiler: the telemarketer wins every time—same as choosing the red packet-loss slider in the only simulation that matters. Drag the sliders to find the exact threshold where you stop losing sleep and start losing faith.
  </p>

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
    <div class="lab-xp" aria-hidden="true" data-role="xp-gd">
      <div class="lab-xp__fill" data-role="xp-gd-fill" style="width:0%"></div>
    </div>
    <div class="lab-xp__label" data-role="xp-gd-label">XP: <span data-role="xp-gd-val">0</span>/100</div>
    <div class="lab-xp" aria-hidden="true" data-role="xp-tmr">
      <div class="lab-xp__fill" data-role="xp-tmr-fill" style="width:0%"></div>
    </div>
    <div class="lab-xp__label" data-role="xp-tmr-label">XP: <span data-role="xp-tmr-val">0</span>/100</div>

    <p class="lab-experiment__insight" data-role="insight">Drag the sliders. Blue pill: pretty plots. Red pill: you still cannot get deterministic consensus over a lossy channel.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tg" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>Two protocols enter, one strictly dominates. <strong>Naive Multi-Send</strong> just blasts $N$ parallel messengers into the void. As long as just one gets through, you win: $P(\text{win}) = 1 - p^N$. This approaches 1 exponentially fast. The <strong>Strict-Chain</strong> protocol of Two-Phase Commit demands a back-and-forth handshake where every single message must survive. If one drops, the whole transaction aborts: $P(\text{win}) = (1 - p)^N$. This decays to 0.</p>
    <p>The naive protocol wins for any packet loss $p > 0$. But the real PhD flex is the inverse problem: <em>Given SLA $R$ and loss $p$, what is the smallest $N$ I can get away with?</em> For naive multi-send, $N = \lceil \log(1 - R) / \log(p) \rceil$. If you need 99% reliability on a horrific 40% loss channel, $N = 5$. If you have a clean 10% loss channel, $N = 2$. This exact logarithm dictates your AWS retry budgets, your Cassandra quorum sizes, and why blockchain validators require multiple confirmations before finalizing shared state (see the <a href="https://doi.org/10.1109/ACCESS.2023.3344669">2023 survey on blockchain-enhanced ML systems</a>). Meanwhile, Two-Phase Commit needs infinite retries just to stay alive. This is why distributed database architects avoid strict locking over WANs like the plague.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>How to Prove a Stolen Model in Court</h2>
  <p class="lab-card__usecase">Used in <strong>OpenAI / Anthropic IP defence</strong> · <strong>HuggingFace gated weights</strong> · <strong>Banking model auditing</strong></p>
  <p class="lab-card__lead">
    You just spent twenty million dollars, burned the equivalent electricity of a medium-sized European nation, and evaporated the world's supply of GPUs to train a supposedly "AGI-adjacent" LLM. You enthusiastically open-source the weights. Ten minutes later, a Stanford dropout downloads them, fine-tunes it entirely on synthetic social media data and trendy AI-generated content, slaps a slick UI on it, and raises eighty million dollars in Series A funding. Their lawyers mockingly ask, "Prove we stole it." This isn't a Black Mirror episode. It's just Tuesday in Silicon Valley in 2026. (There will also be no cake at the end of this exhibit. There was never cake. There is only ε.)
  </p>
  <p class="lab-card__lead">
    The solution isn't a subpoena; it's <strong>feature-based watermarking</strong>. Before releasing the model, you subtly poison your own gradients at <em>k</em> secret coordinates by a perturbation <em>ε</em>. When the lawsuit drops, you extract their weights and run a statistical test. Did your proprietary flavor of mathematical poison survive their catastrophic fine-tuning, known as attack noise <em>σ</em>? If yes, congratulations, you now own their startup and their ping-pong tables.
  </p>
  <p class="lab-card__lead">
    The engineering problem is a brutal three-way constraint. Crank <em>ε</em> too high, and your flagship model becomes visibly lobotomized. Raise <em>k</em>, and you risk the key becoming statistically guessable. The adversary's only lever is to fine-tune so violently that they wash the watermark out, usually destroying the model's coherence in the process. Your goal: find the Pareto frontier where you trap the thief without breaking downstream benchmarks. That is the publishable, court-admissible regime from the <a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024 IEEE Access paper</a>, refined further in <a href="https://ieeexplore.ieee.org/document/11293969">SecurePoL</a> (2025) which couples watermarking with immutable training logs.
  </p>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        <strong>ε (perturbation):</strong> how hard you stamp the watermark. Higher = easier to detect, but damages model accuracy above 0.25.<br>
        <strong>k (key size):</strong> how many weight positions you perturb. More positions = harder to wash out, scales detection by √k.<br>
        <strong>σ (attack noise):</strong> how aggressively the attacker fine-tunes. Higher = watermark gets noisier. This is the adversary's lever.
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

    <div class="lab-xp" aria-hidden="true" data-role="xp-wm">
      <div class="lab-xp__fill" data-role="xp-wm-fill" style="width:0%"></div>
    </div>
    <div class="lab-xp__label" data-role="xp-wm-label">XP: <span data-role="xp-wm-val">0</span>/100</div>

    <p class="lab-experiment__insight" data-role="insight-wm">Drag the sliders.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-wm" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>If you try to fingerprint a single neural network weight, fine-tuning noise wipes it out immediately. Instead, we use the Central Limit Theorem as a weapon. By stamping $k$ independent weights, the per-cell signal-to-noise ratio amplifies by $\sqrt{k}$. The adversary can't wash it out without injecting so much noise ($σ$) that the model forgets how to output valid English.</p>
    <p>This reveals the harsh three-way Pareto frontier of ML provenance. You want to crank the perturbation $\varepsilon$ up so the watermark screams your name in court, but mathematically cross $\varepsilon = 0.25$ and your 20 million dollar model starts acting like a drunk toddler. You want to crank $k$ up indefinitely, but then your key size itself acts as an extractable fingerprint. The plot above visualizes the exact operating envelope where detection achieves at least 90 percent, False Positive Rate stays below 5 percent, and utility is preserved. This isn't just theory. This is the exact math used to protect gated weights in modern foundation models.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-pol">
  <span class="ep-eyebrow">Machine Learning · Model provenance</span>
  <h2>The Training Fingerprint (Proof-of-Learning)</h2>
  <p class="lab-card__usecase">Used in <strong>Foundation model auditing</strong> · <strong>Competitive intelligence</strong> · <strong>Patent disputes</strong> · <strong>Minting training credentials</strong> · <strong>Open-source verification</strong></p>
  <p class="lab-card__lead">
    Here lies the brutal asymmetry of modern AI theft. You can steal a model's weights in 10 minutes. But you cannot steal *time*. Every neural network legitimately trained leaves a chronological scar—a loss curve that evolved, stuttered, and converged across thousands of epochs. A thief downloading your weights? They have the destination but not the journey. They have the answers but not the homework.
  </p>
  <p class="lab-card__lead">
    <strong>Proof-of-Learning is the opposite of watermarking.</strong> Watermarking (the experiment above) is you paranoidly poisoning specific weights like some deranged art forger signing the back of the canvas. It's intentional, adversarial, and requires secrets. Proof-of-Learning is simpler and more devastating: you just record your loss trajectory. No ink. No sabotage. No signatures. Just pure statistical evidence that work was actually done. The attacker can download your final weights, but they cannot rewind time and replicate your exact training path without actually training.
  </p>
  <p class="lab-card__lead">
    Here is the devastating math: a model's loss curve is shaped by your data distribution, your architecture, your learning rate $\alpha$, your batch size $B$, your initialization seeds, even your GPU's floating-point rounding quirks. An attacker would need to reverse-engineer all of these simultaneously. Drag the sliders below to train. Watch how wildly different hyperparameters produce unmistakably different trajectories. Then ask yourself the uncomfortable question: could a thief replicate this exact loss curve without actually doing the training? The answer is no. Not practically. Not without more compute than the original training. Complementary to watermarking, Proof-of-Learning is the unforgeable chronological anchor. Together—trajectory plus watermark—you have both means and motive forensics covered (see <a href="https://ieeexplore.ieee.org/document/11293969">SecurePoL</a>, 2025).
  </p>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <p class="lab-experiment__slider-guide">
        <strong>Mission:</strong> hit <strong>Gold Proof</strong> by finding a training setup that yields a realistic, stable trajectory.<br>
        <strong>Hint zone:</strong> α in <strong>[0.008, 0.018]</strong>, B in <strong>[64, 256]</strong>, ζ in <strong>[0.02, 0.08]</strong>.<br>
        <strong>Dopamine rule:</strong> score at least <strong>88</strong> and the lab throws a tiny celebration—mostly confetti, zero residual self-image, one spoonless trajectory.
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
    <summary>What this shows</summary>
    <p>When you train a neural network, each epoch adds a data point to your loss trajectory. Early epochs drop steeply (finding obvious patterns), middle epochs plateau (hitting local optima), late epochs oscillate around a minimum (stochastic noise dominates). The exact shape is a function of your hyperparameters: smaller learning rates converge slower but more steadily; noisier data makes curves jaggier.</p>
    <p>An attacker who downloads your final weights doesn't have this trajectory. They have a flat line: "I obtained this model at timestamp T." They can fine-tune it (creating a new, different trajectory), but they cannot fabricate your original training curve. The computational cost of reverse-engineering your exact hyperparameters and data distribution, then retraining to match your loss curve point-by-point, exceeds the cost of just training from scratch. This is why financial institutions, AI labs, and patent offices increasingly log training metrics. Proof-of-Learning is not about hiding information. It's about making forgery mathematically uneconomical. See your <a href="https://commons.erau.edu/edt/905/">2025 dissertation</a> and the dual-layer approach in <a href="https://ieeexplore.ieee.org/document/11293969">SecurePoL</a> for how trajectory logging couples with watermarking to create an unforgeable dual-anchor: you can't fake the journey, and even if you steal the weights, you can't replicate the watermark without the original training run.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-tmr">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>How Your Plane Survives a Cosmic Ray</h2>
  <p class="lab-card__usecase">Used in <strong>A320 fly-by-wire</strong> · <strong>Boeing 787</strong> · <strong>Apollo Guidance Computer</strong> · <strong>Mars rovers</strong> · <strong>your phone's secure enclave</strong></p>
  <p class="lab-card__lead">
    Somewhere in the Marianas Trench of aerospace engineering lies the paranoid discipline of Fault Tolerance. Consider a <em>Single Event Upset</em>: a high-energy neutron from a dying star travels across the galaxy for millions of years, passes seamlessly through the fuselage of your Airbus, and violently flips a single SRAM bit in the fly-by-wire controller. Without redundancy, this bit-flip convinces the autopilot that the aircraft is safely parked on the tarmac, prompting it to aggressively deploy the thrust reversers at Mach 0.8.
  </p>
  <p class="lab-card__lead">
    To mathematically veto the universe's entropy, engineers invoke <strong>Triple Modular Redundancy</strong>. Three entirely isolated computers calculate the exact same kinematics in parallel. A brutally simple hardware voter takes the majority result. The math is a masterpiece of cubic probability suppression: the chance of a system failure drops from a terrifying $q$ to an invisible $3q^2 - 2q^3$. It is a mathematical forcefield against the chaotic cosmos.
  </p>
  <p class="lab-card__lead">
    But here lies the ultimate ontological trap: asserting <em>Statistical Independence</em>. What if the glitch isn't a random galactic neutron, but an unhandled 64-bit float conversion written by a sleep-deprived contractor a decade ago, which is now executing flawlessly across all three redundant CPUs at the exact same millisecond—like three Agent Smiths politely agreeing you are definitely not flying the plane? This is common-mode correlation, denoted by $\rho$. Drag $\rho$ up and watch your beautiful $3q^2$ curve collapse sickeningly back into a linear $q$. This is why the Ariane 5 rocket spectacularly self-destructed into a 500 million dollar firework despite full physical redundancy. The hardware simply redundantly agreed to crash. It’s also why DO-178C Level A flight certification forces rival engineering teams to write the exact same software in different languages, on disconnected subnets, while virtually forbidden from making eye contact.
  </p>

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
        <span class="lab-experiment__metric-formula">ρq + (1−ρ)(3q² − 2q³)</span>
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
    <summary>What this shows</summary>
    <p>If hardware faults are truly independent random variables, combining three of them gifts you cubic armor: $P(\text{sys fail}) = 3q^2(1-q) + q^3 \approx 3q^2$. If your processor segfaults 5% of the time, three decoupled processors crashing at the exact same microsecond happens only 0.75% of the time. This combinatorial suppression is the rigorous mathematical anomaly that kept the Apollo Lunar Module turning into a permanent crater.</p>
    <p>But the universe absolutely deplores free probability upgrades. If those failures share an epidemiological root—a massive electromagnetic pulse, a vibrating chassis resonance, or an unhandled <code>NaN</code> propagating through an edge case—they become deeply correlated ($\rho > 0$). At $\rho = 1$, the math utterly collapses to $P(\text{sys fail}) = q$. You just spent $50 million on silicon to faithfully execute the exact same software bug in perfect supersonic unison. Play with the correlation slider. Watch the exact topological break-even point where adding more redundant computers paradoxically makes the system <em>more fragile</em> by merely expanding the attack surface. Welcome to N-Version Programming, where software engineering becomes an exercise in applied epistemology.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-gd">
  <span class="ep-eyebrow">Deep Learning · Optimization</span>
  <h2>The Topology of Regret (Gradient Descent)</h2>
  <p class="lab-card__usecase">Used in <strong>Training LLMs</strong> · <strong>Backpropagation</strong> · <strong>Physics Simulations</strong></p>
  <p class="lab-card__lead">
    Here is the dirty secret of modern "State-of-the-Art" AI: underneath the majestic philosophical debates about consciousness, training a neural network is essentially playing mini-golf in the dark on a billion-dimensional, topologically cursed course. You just want the loss function to hit the absolute bottom.
  </p>
  <p class="lab-card__lead">
    If your <strong>Learning Rate (α)</strong> is too enthusiastic, you smack the gradient so hard it achieves escape velocity, NaN-ing your entire quarter's budget (exploding gradients). Too low, and you get irrevocably stuck in a shallow dent near the starting point. <strong>Momentum (β)</strong> supposedly helps you surf over these local depressions, but crank it too high and your optimizer turns into a frictionless rollercoaster trapped in perpetual orbit.
  </p>
  <p class="lab-card__lead">
    Below is a highly non-convex valley—Aperture Science would call it "enrichment," you will call it regret. Your test: Tune α and β, click <strong>Train</strong>, and reach the global minimum on the right without flying off the screen or getting trapped in a local minimum that feels suspiciously like the Matrix loading the same parking lot twice. Use <strong>New Challenge</strong> if the universe starts repeating itself. There is still no spoon; there is only momentum.
  </p>
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
        <span class="lab-playbar__hint" style="grid-column:1/-1;margin:0">ζ now changes the training path; these toggles alter the optimizer, not just the trail.</span>
      </div>
      <button class="lab-btn lab-btn--train" type="button" data-role="train-btn">
        <span class="lab-btn__text">Train!</span>
        <span class="lab-btn__bg"></span>
      </button>
      <button class="lab-btn lab-btn--train" type="button" data-role="gd-reroll-btn" aria-label="New random landscape and parameters">
        <span class="lab-btn__text">New Challenge</span>
        <span class="lab-btn__bg"></span>
      </button>
      <p class="lab-playbar__hint" data-role="gd-challenge-meta" style="grid-column:1/-1;margin:0">Challenge: loading...</p>
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
    <summary>What this shows</summary>
    <p>This isn't a cartoon; the browser is running actual numerical integration of $f(x) = \frac{x^4}{4} - \frac{x^3}{3} - x^2 + 2$ at 60 FPS. The math under the hood is $\Delta x_{t+1} = \beta \cdot \Delta x_t - \alpha \cdot \nabla f(x_t)$.</p>
    <p>If you crank the learning rate ($\alpha$) too high, the update step ignores the manifold completely and just violently launches the particle out of the viewport. This is why researchers spend weeks tuning learning rate schedules. The momentum term ($\beta$) is your temporal memory: it accumulates previous gradients to blast through "speed bumps" (local minima). But beware: if you crank momentum to 0.99, the particle doesn't want to stop. It will helplessly orbit the rim of the global minimum like a frictionless pendulum until training times out. This exact chaotic interplay is why modern ML relies on adaptive optimizers like Adam, which babysit both these parameters on a per-weight basis so you can go back to complaining about data quality.</p>
  </details>
</section>

<section class="lab-footer">
  <p>We hope you enjoyed this mandatory voluntary science. A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>. Remember: the architects of your stack thank you for participating.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
