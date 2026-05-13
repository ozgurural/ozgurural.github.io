---
permalink: /lab/
title: "Lab"
excerpt: "Three interactive phase-space explorers in distributed systems, ML security, and aerospace fault tolerance. Drag the sliders, watch the curves move."
---

<p class="ep-lead">
  Welcome to the interactive graveyard of pristine theoretical computer science. None of the exhibits below are pure textbook abstractions—they are live simulations of the statistical duct tape currently holding human civilization together. Here you will find your bank hallucinating network consensus in real-time, a VC-funded startup mathematically failing to launder stolen LLM weights, and your Airbus politely surviving a cosmic ray strike at 36,000 feet. Drag the sliders. Watch beautiful theories collapse into statistical panic. (And if you still naively believe in deterministic systems, open DevTools and let the floating-point math personally offend you.)
</p>

<section class="lab-card lab-experiment" id="lab-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus</span>
  <h2>Why Distributed Systems Fake Consensus</h2>
  <p class="lab-card__usecase">Used in <strong>Blockchain consensus</strong> · <strong>Spanner / Raft / etcd</strong> · <strong>Cassandra &amp; DynamoDB</strong> · <strong>Microservice retries</strong> · <strong>TCP</strong></p>
  <p class="lab-card__lead">
    Two generals want to attack a valley. Or, putting down the 1970s war metaphors, two AWS regions want to agree: <em>did Alice just overdraft her checking account to buy a Bored Ape NFT?</em> Packets drop, BGP routes flap, and a rogue backhoe inevitably severs a fiber line. Physics and Information Theory (specifically Akkoyunlu et al., 1975) brutally dictate that deterministic consensus over a lossy channel is <em>strictly impossible</em>. You literally cannot know for sure. Yet your bank confirms trades in 200 ms. The secret? <strong>They just gave up.</strong> They abandoned ontological certainty for asymptotically bounded <em>probability</em>. At six nines of reliability, late-stage capitalism simply declares it "truth."
  </p>
  <p class="lab-card__lead">
    Watch the epistemological crisis unfold below. <strong>Strict-chain</strong> (two-phase commit) insists on perfect handshakes like a neurotic Victorian bureaucrat—and dies gracefully. <strong>Naive parallel</strong> (microservice retries) acts like an overly caffeinated telemarketer, just blasting messages until one gets through. Spoiler: the telemarketer wins every time. Drag the sliders to find the exact packet loss threshold where you stop losing sleep.
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

    <p class="lab-experiment__insight" data-role="insight">Drag the sliders.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tg" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>Two protocols enter, one strictly dominates. <strong>Naive Multi-Send</strong> just blasts $N$ parallel messengers into the void. As long as just one gets through, you win: $P(\text{win}) = 1 - p^N$. This approaches 1 exponentially fast. <strong>Strict-Chain</strong> (Two-Phase Commit) demands a back-and-forth handshake where every single message must survive. If one drops, the whole transaction aborts: $P(\text{win}) = (1 - p)^N$. This decays to 0.</p>
    <p>The naive protocol wins for any packet loss $p > 0$. But the real PhD flex is the inverse problem: <em>Given SLA $R$ and loss $p$, what is the smallest $N$ I can get away with?</em> For naive multi-send, $N = \lceil \log(1 - R) / \log(p) \rceil$. If you need 99% reliability on a horrific 40% loss channel, $N = 5$. If you have a clean 10% loss channel, $N = 2$. This exact logarithm dictates your AWS retry budgets, your Cassandra quorum sizes, and why Bitcoin exchanges usually require 6 block confirmations. Meanwhile, Two-Phase Commit needs infinite retries just to stay alive, which is why distributed database architects avoid strict locking over WANs like the plague.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>How to Prove a Stolen Model in Court</h2>
  <p class="lab-card__usecase">Used in <strong>OpenAI / Anthropic IP defence</strong> · <strong>HuggingFace gated weights</strong> · <strong>Banking model auditing</strong></p>
  <p class="lab-card__lead">
    You just spent $20M, burned the equivalent electricity of a medium-sized European nation, and evaporated the world's supply of GPUs to train a supposedly "AGI-adjacent" LLM. You enthusiastically open-source the weights. Ten minutes later, a Stanford dropout downloads them, fine-tunes it entirely on Reddit arguments and <em>Harry Potter</em> fanfiction, slaps a UI on it, and raises an $80M Series A. Their lawyers mockingly ask, "Prove we stole it." This isn't a Black Mirror episode; it's just Tuesday in Silicon Valley.
  </p>
  <p class="lab-card__lead">
    The solution isn't a subpoena; it's <strong>feature-based watermarking</strong>. Before releasing the model, you subtly poison your own gradients at <em>k</em> secret coordinates by a perturbation <em>ε</em>. When the lawsuit drops, you extract their weights and run a statistical test. Did your proprietary flavor of mathematical poison survive their catastrophic fine-tuning (attack noise <em>σ</em>)? If yes, congratulations, you now own their startup and their ping-pong tables.
  </p>
  <p class="lab-card__lead">
    The engineering problem is a brutal three-way constraint. Crank <em>ε</em> too high, and your flagship model becomes visibly lobotomized. Raise <em>k</em>, and you risk the key becoming statistically guessable. The adversary's only lever is to fine-tune so violently (high <em>σ</em>) that they wash the watermark out—usually destroying the model's coherence in the process. Your goal: find the Pareto frontier where you trap the thief without breaking downstream benchmarks. That is the publishable, court-admissible regime from the <a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024 IEEE Access paper</a>.
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
    </div>

    <div class="lab-experiment__visual">
      <div class="lab-wm__grid" data-role="grid" aria-hidden="true"></div>
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-wm" preserveAspectRatio="xMidYMid meet" role="img" aria-label="detection rate vs attacker noise"></svg>
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
    <summary>What this shows</summary>
    <p>If you try to fingerprint a single neural network weight, fine-tuning noise wipes it out immediately. Instead, we use the Central Limit Theorem as a weapon. By stamping $k$ independent weights, the per-cell signal-to-noise ratio amplifies by $\sqrt{k}$. The adversary can't wash it out without injecting so much noise ($σ$) that the model forgets how to output valid English.</p>
    <p>This reveals the harsh three-way Pareto frontier of ML provenance. You want to crank the perturbation $\varepsilon$ up so the watermark screams your name in court, but mathematically cross $\varepsilon = 0.25$ and your $20M model starts acting like a drunk toddler. You want to crank $k$ up indefinitely, but then your key size itself acts as an extractable fingerprint. The plot above visualizes the exact operating envelope where $detection \ge 90\%$, False Positive Rate $\le 5\%$, and utility is preserved. This isn't just theory—this is the exact math used to protect gated weights in modern foundation models.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-tmr">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>How Your Plane Survives a Cosmic Ray</h2>
  <p class="lab-card__usecase">Used in <strong>A320 fly-by-wire</strong> · <strong>Boeing 787</strong> · <strong>Apollo Guidance Computer</strong> · <strong>Mars rovers</strong> · <strong>your phone's secure enclave</strong></p>
  <p class="lab-card__lead">
    Somewhere in the Marianas Trench of aerospace engineering lies the paranoid discipline of Fault Tolerance. Consider a <em>Single Event Upset (SEU)</em>: a high-energy neutron from a dying star travels across the galaxy for millions of years, passes seamlessly through the fuselage of your Airbus, and violently flips a single SRAM bit in the fly-by-wire controller. Without redundancy, this bit-flip convinces the autopilot that the aircraft is safely parked on the tarmac, prompting it to aggressively deploy the thrust reversers at Mach 0.8.
  </p>
  <p class="lab-card__lead">
    To mathematically veto the universe's entropy, engineers invoke <strong>Triple Modular Redundancy (TMR)</strong>. Three entirely isolated computers calculate the exact same kinematics in parallel; a brutally simple hardware voter takes the majority result. The math is a masterpiece of cubic probability suppression: the chance of a system failure drops from a terrifying $q$ to an invisible $3q^2 - 2q^3$. It is a mathematical forcefield against the chaotic cosmos.
  </p>
  <p class="lab-card__lead">
    But here lies the ultimate ontological trap: asserting <em>Statistical Independence</em> (i.i.d.). What if the glitch isn't a random galactic neutron, but an unhandled 64-bit float conversion written by a sleep-deprived contractor a decade ago, which is now executing flawlessly across all three redundant CPUs at the exact same millisecond? This is common-mode correlation ($\rho$). Drag $\rho$ up and watch your beautiful $3q^2$ curve collapse sickeningly back into a linear $q$. This is why the Ariane 5 rocket spectacularly self-destructed ($500M firework) despite full physical redundancy—the hardware redundantly agreed to crash. It’s also why DO-178C Level A flight certification forces rival engineering teams to write the exact same software in different languages, on disconnected subnets, while virtually forbidden from making eye contact.
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

    <p class="lab-experiment__insight" data-role="insight-tmr">Drag the sliders. The strip on top is a live simulation; the curves are closed-form.</p>
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
    Below is a highly non-convex valley. Your test: Tune α and β, click <strong>Train</strong>, and reach the global minimum on the right without flying off the screen or getting trapped. Watch the brutal reality of non-convex optimization mock your intelligence.
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
      <button class="lab-btn lab-btn--train" type="button" data-role="train-btn">
        <span class="lab-btn__text">Train!</span>
        <span class="lab-btn__bg"></span>
      </button>
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

    <p class="lab-experiment__insight" data-role="insight-gd">Set params and hit Train.</p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>This isn't a cartoon; the browser is running actual numerical integration of $f(x) = \frac{x^4}{4} - \frac{x^3}{3} - x^2 + 2$ at 60 FPS. The math under the hood is $\Delta x_{t+1} = \beta \cdot \Delta x_t - \alpha \cdot \nabla f(x_t)$.</p>
    <p>If you crank the learning rate ($\alpha$) too high, the update step ignores the manifold completely and just violently launches the particle out of the viewport. This is why researchers spend weeks tuning learning rate schedules. The momentum term ($\beta$) is your temporal memory: it accumulates previous gradients to blast through "speed bumps" (local minima). But beware: if you crank momentum to 0.99, the particle doesn't want to stop. It will helplessly orbit the rim of the global minimum like a frictionless pendulum until training times out. This exact chaotic interplay is why modern ML relies on adaptive optimizers like Adam, which babysit both these parameters on a per-weight basis so you can go back to complaining about data quality.</p>
  </details>
</section>

<section class="lab-footer">
  <p>A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
