---
permalink: /lab/
title: "Lab"
excerpt: "Three interactive phase-space explorers in distributed systems, ML security, and aerospace fault tolerance. Drag the sliders, watch the curves move."
---

<p class="ep-lead">
  Three live experiments. None of them are textbook abstractions. Each one runs the world: your bank when you tap a card, your phone when it verifies your face, your plane when it cruises through cosmic rays. Drag the sliders. Watch what fails, when, and by how much. (And if you open DevTools the maths leaves a forwarding address.)
</p>

<section class="lab-card lab-experiment" id="lab-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus</span>
  <h2>Why Distributed Systems Fake Consensus</h2>
  <p class="lab-card__usecase">Used in <strong>Blockchain consensus</strong> · <strong>Spanner / Raft / etcd</strong> · <strong>Cassandra &amp; DynamoDB</strong> · <strong>Microservice retries</strong> · <strong>TCP</strong></p>
  <p class="lab-card__lead">
    Two computers want to agree: <em>did Alice send Bob $100?</em> Their messages cross the public internet. Packets drop, routers crash, undersea cables get bitten by sharks (real failure mode, look it up). In 1975 a paper proved consensus over a lossy channel can never reach <em>certainty</em>. And yet your bank confirms in 200 ms, your blockchain finalises in seconds, and Cassandra serves your query before the last replica even hears about it. The trick: <strong>nobody reaches certainty</strong>. They reach arbitrarily-high <em>probability</em>, which at six nines is indistinguishable from certainty for anything that pays your salary. Two protocol families pull this off: <strong>naive parallel</strong> (just keep retrying: TCP retransmission, blockchain confirmation depth, microservice retry budgets) and <strong>strict-chain</strong> (textbook two-phase commit, where every round has to succeed). The naive protocol wins for any p &gt; 0 and N &ge; 2. That is not the interesting question. The interesting question is: <em>what is the minimum N to hit a target reliability at a given loss rate?</em> That is the design question every distributed systems engineer faces when sizing retry budgets, confirmation depths, and quorum sizes. Raft, Cassandra, and Bitcoin confirmation depth all answer it the same way. The phase diagram below shows you why. <em>Drag the sliders and find the operating point yourself.</em>
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
    <p>Two protocols, both intuitive, both feasible. One strictly dominates the other for any non-trivial loss rate. <strong>Naive</strong> sends N parallel messengers and succeeds if at least one arrives: P(win) = 1 &minus; p<sup>N</sup>, which approaches 1 as N grows. <strong>Strict-chain</strong> requires every messenger in a back-and-forth handshake to arrive. Failure of any one aborts: P(win) = (1 &minus; p)<sup>N</sup>, which falls to 0.</p>
    <p>The naive protocol wins for any p &gt; 0 and N &ge; 2. That is not the interesting result. The interesting result is the minimum-N design question: given a target reliability R and a measured loss rate p, what is the smallest N that achieves it? For naive multi-send, the answer is N = &lceil;log(1 &minus; R) / log(p)&rceil;. At R = 99% and p = 0.4, that is N = 5. At p = 0.1, it is N = 2. This is the calculation behind every retry budget, every confirmation depth, and every quorum size in production distributed systems. Raft, Cassandra, and Bitcoin confirmation depth all live in the regime where p is between 0.10 and 0.75 and N is small. The "Min N for 99%" readout above computes this directly. Drag p to a realistic WAN loss rate and read off the minimum confirmation depth your protocol needs. The strict-chain protocol needs the same N to achieve a far lower reliability, which is the structural reason two-phase commit has a blocking problem and Paxos does not.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>How to Prove a Stolen Model in Court</h2>
  <p class="lab-card__usecase">Used in <strong>OpenAI / Anthropic IP defence</strong> · <strong>HuggingFace gated weights</strong> · <strong>Banking model auditing</strong></p>
  <p class="lab-card__lead">
    Imagine you are an AI lab. You spent <em>$10M</em> training a model and shipped a public version. A competitor downloads it, fine-tunes it on a small dataset, and ships it under their own brand. Their lawyers say "prove it." This is no longer hypothetical. It has been the subject of actual lawsuits in the last twelve months.
  </p>
  <p class="lab-card__lead">
    The answer is <strong>feature-based watermarking</strong>. Before you release the model, you secretly perturb its weights at <em>k</em> chosen positions by a small amount <em>ε</em>. You keep the list of positions (the "key") private. The competitor fine-tunes your model, which adds noise <em>σ</em> on top. Later, you run a statistical test: do the weights at your secret positions still carry your perturbation signal? If yes, the model is yours. If no, either the fine-tuning was too aggressive (and the model is now useless) or the attacker got lucky and guessed your key (probability negligible for large <em>k</em>).
  </p>
  <p class="lab-card__lead">
    The engineering problem is the three-way tradeoff. Raise <em>ε</em> and detection improves, but above <em>ε</em> = 0.25 the model's accuracy degrades visibly and the watermark becomes its own evidence of tampering. Raise <em>k</em> and detection improves without touching accuracy, but key size has practical limits. The attacker raises <em>σ</em> by fine-tuning harder, which washes out the signal. The diagram below maps the detection-evasion frontier across all three dimensions. Your goal: find the operating point where detection stays above 90%, false-positive rate stays below 5%, and <em>ε</em> stays below 0.25. That is the publishable, court-admissible regime from the <a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024 IEEE Access paper</a>.
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
    <p>Aggregate detection over <em>k</em> independent cells with per-cell signal-to-noise ratio SNR = ε / √(σ² + σ₀²). Per-cell detection probability is q = Φ(SNR &minus; z<sub>α</sub>) at a fixed FPR of 5% (z<sub>α</sub> &asymp; 1.645). Majority-vote on k cells gives the curves you see. Increasing k <em>amplifies</em> SNR roughly by √k via the central limit theorem, which is why feature-based watermarking holds up under attacker noise that would defeat single-cell detection.</p>
    <p>The three-way tradeoff is the research contribution. Detection rate, false-positive rate, and perturbation magnitude ε are not independently optimisable. Raising ε improves detection but crosses the utility-degradation threshold at ε = 0.25, above which the fine-tuned model's downstream accuracy degrades measurably. Raising k improves detection without touching ε, but only up to the point where the key size itself becomes a fingerprint. The publishable operating point is the region where all three constraints hold: detection &ge; 90%, FPR &le; 5%, ε &le; 0.25. The "Utility margin" readout above shows how much headroom remains below the degradation threshold. The Pareto frontier here matches what is published in the IEEE Access work (<a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024</a>, <a href="https://ieeexplore.ieee.org/document/11293969">2025</a>): for proof-of-learning under spoofing, an honest trainer with a key of even k = 8 cells maintains &gt; 90% detection against substantial fine-tuning noise. A forger without the key cannot replicate the signature without distorting the model badly enough to fail downstream evaluation.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-tmr">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>How Your Plane Survives a Cosmic Ray</h2>
  <p class="lab-card__usecase">Used in <strong>A320 fly-by-wire</strong> · <strong>Boeing 787</strong> · <strong>Apollo Guidance Computer</strong> · <strong>Mars rovers</strong> · <strong>your phone's secure enclave</strong></p>
  <p class="lab-card__lead">
    Your A320 is at 36,000 ft, somewhere over the Atlantic. A cosmic ray, a high-energy particle from a supernova that may have detonated before the dinosaurs, strikes the flight computer's silicon and flips a bit. Without redundancy, that bit could be the difference between <em>maintain altitude</em> and <em>pitch down 5°</em>. <strong>Triple Modular Redundancy</strong> is the answer the industry settled on: three independent flight computers compute the same answer, a voter picks the majority, single-channel errors get masked. The miracle is reliability cubed: P(sys fail) drops from <em>q</em> to <code>3q² &minus; 2q³</code>, a brutal cubic in your favour. The catch is that "independent" is doing all the work. Cosmic-ray showers, thermal events, and most often the same software bug compiled three times all hit the channels at once. The slider <em>ρ</em> below dials in that correlation. The engineering question is not "does TMR help." It always helps when ρ is small. The question is: at what common-mode correlation ρ does TMR stop being worth the hardware cost? The break-even is where the reliability gain drops below 10x. Below that threshold, the cost of three diverse computers is not justified by the reliability improvement. This is the DO-178C design question. Drag ρ up and watch the gain collapse. (Yes, this is the structural reason DO-178C requires <em>diverse</em> hardware AND diverse software for the highest design assurance levels.)
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
    </div>

    <div class="lab-tmr__strip" aria-hidden="true">
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
    <p>For <em>independent</em> per-channel failures the voter masks any single fault: the system fails iff at least two channels fail in the same tick, which is <code>3q²(1&minus;q) + q³ &asymp; 3q²</code>, far less than <code>q</code> when <code>q</code> is small. This is why aerospace, satellites, and secure enclaves love TMR.</p>
    <p>The trap is correlation. A cosmic-ray shower, a thermal event, a power glitch, or most often the same software bug compiled three times, all hit all three channels at once. Under perfectly correlated failures the cubic gain collapses to identity: <code>P(sys fail) = q</code>, the same as a single channel. The slider <em>ρ</em> here interpolates between the two regimes.</p>
    <p>The break-even question is the DO-178C design question. For a given per-channel failure rate q, there is a critical correlation ρ* above which the reliability gain drops below 10x. Below that threshold, three diverse computers are worth every euro. Above it, the hardware cost is not justified by the reliability improvement. The "Break-even ρ" readout above computes ρ* directly from the closed-form expression: ρ* = (q/10 &minus; indep) / (q &minus; indep), where indep = 3q² &minus; 2q³. This is the structural reason DO-178C requires <em>dissimilar</em> hardware <em>and</em> dissimilar software for the highest design assurance levels. Three computers running the same code are not redundant; they are a single computer with extra parts. (And it is why N-version programming, despite its costs, has refused to die.)</p>
  </details>
</section>

<section class="lab-probes">
  <header class="lab-probes__header">
    <span class="ep-eyebrow">Calibration · Field probes</span>
    <h2>Seventeen probes</h2>
    <p class="lab-probes__lead">Short field-calibration questions across distributed systems, AI agents, ML, blockchain, and aerospace. None are textbook trivia. Each one corresponds to a system you've used today. Pick the answer that survives a bad day; the reveal explains why.</p>
  </header>

  <ol class="lab-probes__list">
    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">1</span><span>Asynchronous network, messages arrive eventually but bounds are unknown. How many nodes are needed for consensus to tolerate a single crash fault?</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">3</button>
        <button class="lab-probe__choice" data-choice="b" type="button">2f + 1</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Impossible</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Impossible.</strong> Fischer, Lynch, and Paterson (1985) FLP Impossibility. You cannot securely distinguish a crashed node from a very slow network, forcing the protocol to risk stalling forever or splitting the brain.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">2</span><span>Naive parallel multi-send vs strict confirmation chain. <em>p</em> = 0.4, <em>N</em> = 5.</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Strict wins</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Naive wins</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Equivalent</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Naive.</strong> 1 − 0.4⁵ ≈ 99% vs (0.6)⁵ ≈ 8%. Each ack <em>multiplies</em> failure probability while parallel sends multiply success.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">3</span><span>Aggregate watermark detection over <em>k</em> independent cells scales roughly as:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">k</button>
        <button class="lab-probe__choice" data-choice="b" type="button">√k</button>
        <button class="lab-probe__choice" data-choice="c" type="button">log k</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>√<em>k</em>.</strong> Per-cell SNR amplifies via the central limit theorem. Doubling the key gives √2× detection at fixed (ε, σ).</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">4</span><span>You sign two Ethereum transactions, but the entropy source rolls a repeated ephemeral nonce ($k$). The attacker can now:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Replay tx</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Block you</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Find private key</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Find private key.</strong> The ECDSA math collapses: one subtraction in the finite field hands the private key to anyone running a block scanner. The exact math that broke the PlayStation 3 in 2010.</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">5</span><span>Two-phase commit. All voted YES; coordinator crashes before COMMIT. Safe action for participants:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Commit</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Abort</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Wait</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Wait.</strong> The classic 2PC blocking trap. If the coordinator dies mid-flight, everyone is stuck holding locks waiting for the punchline. Consensus algorithms like Paxos and Raft get you out of this.</p>
    </li>
c">
      <p class="lab-probe__q"><span class="lab-probe__num">6</span><span>Training a ResNet: as the number of parameters approaches the training set size, test error spikes (overfitting). If you keep adding parameters, test error:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Rises</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Plateaus</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Drops</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Drops.</strong> Belkin et al. (2019) Double Descent. Massive overparameterization gives the model enough degrees of freedom to interpolate the data smoothly, instead of oscillating to fit noise like classical bias-variance theory expects
      <p class="lab-probe__reveal" hidden><strong>Geometry.</strong> Test accuracy and adversarial robustness are different geometries on the same model. Natural images sit close to decision boundaries in high-dim space (Goodfellow 2014).</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">7</span><span>An AI agent gets a 70% per-attempt tool-call success rate and retries up to 5 times. What is the chance it eventually succeeds?</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">70%</button>
        <button class="lab-probe__choice" data-choice="b" type="button">~85%</button>
        <button class="lab-probe__choice" data-choice="c" type="button">~99.8%</button>
        <button class="lab-probe__choice" data-choice="d" type="button">100%</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>~99.8%.</strong> 1 − 0.3⁵ ≈ 99.76%. Retries buy reliability by renting latency: successful runs average 1.43 attempts, but the tail still bills you for the full 5x.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">8</span><span>A classifier outputs 0.9 confidence on 1,000 predictions. If it is calibrated, about what fraction should be correct?</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">~60%</button>
        <button class="lab-probe__choice" data-choice="b" type="button">~90%</button>
        <button class="lab-probe__choice" data-choice="c" type="button">100%</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>~90%.</strong> Calibration means predicted probability matches empirical frequency. If the model says 0.9 and is calibrated, it should land near 90% right over time. Confidence is not competence unless the histogram agrees.</p>
    </li>

    <li class="lab-probe" data-correct="a">
      <p class="lab-probe__q"><span class="lab-probe__num">9</span><span>Drone swarm, <em>n</em> = 7 nodes, up to <em>f</em> = 2 jammed (Byzantine). Can the rest agree on a target?</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Yes</button>
        <button class="lab-probe__choice" data-choice="b" type="button">No</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Yes.</strong> Byzantine consensus needs <code>n ≥ 3f + 1</code>; with n = 7, f = 2 you are exactly on the threshold. One more jammer and the swarm turns into a meeting with no quorum.</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">10</span><span>DLP: strongest published guarantee against re-identification when quasi-identifiers are already known:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">k-anonymity</button>
        <button class="lab-probe__choice" data-choice="b" type="button">ℓ-diversity</button>
        <button class="lab-probe__choice" data-choice="c" type="button">t-closeness</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>t-closeness.</strong> k-anonymity hides identities, ℓ-diversity weakens attribute leakage, and t-closeness constrains distribution skew. Privacy is a spectrum, not a trophy.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">11</span><span>Mars Pathfinder keeps resetting. A low-priority thread holds a mutex; a high-priority thread waits on it, while a medium-priority thread hogs the CPU.</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Deadlock</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Priority Inversion</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Race Condition</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Priority Inversion.</strong> A textbook OS flaw that actually went to Mars. The watchdog timer assumed the system froze and reset the rover. NASA patched it over a 160M km radio link by enabling Priority Inheritance.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">12</span><span>At cruise altitude (~36 kft) single-event upset rate is roughly 10× ground level. Why?</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Heat / thermal noise</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Cosmic-ray flux</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Cabin EM</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Cosmic-ray flux.</strong> Atmospheric shielding drops with altitude; secondary neutrons hit silicon and flip bits. ECC RAM, scrubbed memory, and TMR are the standard responses. The lab two sections up is the actual maths.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">13</span><span>Why do exchanges wait for <em>six</em> Bitcoin block confirmations before crediting a deposit?</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Tradition</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Probabilistic finality</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Latency budget</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Probabilistic finality.</strong> Each confirmation buys down the reorg tail geometrically; six is an exchange risk budget, not a sacred number. The same asymptote shows up in the Two Generals' Lab.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">14</span><span>DeFi app prices a token using the pool ratio. Attacker borrows $50M, blasts the pool to warp the price, steals funds based on the warped price, then repays the loan instantly.</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">51% Attack</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Flash Loan Oracle Manip</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Reentrancy</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Flash Loan Oracle Manip.</strong> The atomic borrow makes capital effectively infinite and free. If an app uses a spot price instead of a Time-Weighted Average Price (TWAP), the attacker sets the price to whatever they want for that millisecond.</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">15</span><span>A frontier-model training run uses 16,000 GPUs for 4 weeks. Per-GPU MTBF ~100 days. Expected hardware failures during the run:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">~500</button>
        <button class="lab-probe__choice" data-choice="b" type="button">~4,500</button>
        <button class="lab-probe__choice" data-choice="c" type="button">~5,000</button>
        <button class="lab-probe__choice" data-choice="d" type="button">~50,000</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>~4,500.</strong> 16,000 × 28 / 100 ≈ 4,480 expected hardware events per run. At this scale, failure is a schedule item. Checkpoint-restart, sharded recovery, and async fault tolerance are the product, not the garnish.</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">16</span><span>Five independent LLM samples each have 80% accuracy on a task. Majority-vote accuracy:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">80%</button>
        <button class="lab-probe__choice" data-choice="b" type="button">~90%</button>
        <button class="lab-probe__choice" data-choice="c" type="button">~94%</button>
        <button class="lab-probe__choice" data-choice="d" type="button">100%</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>~94%.</strong> P(≥3 of 5 correct | each 0.8) = 0.942. This is self-consistency sampling: majority vote turns noisy single samples into a better estimate, as long as the samples are not all the same flavor of wrong.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">17</span><span>An LLM is trained on 4k-token contexts. You want to summarize an 8k-token doc without retraining. The best way to stretch the Rotary Position Embeddings (RoPE):</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Modulo 4k wrap</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Interpolate angles</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Extrapolate angles</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Interpolate angles.</strong> Chen et al. (2023) Position Interpolation. Squeezing the 8k range into the 4k domain keeps the attention angles within what the model actually learned. Extrapolating blows up the attention scores into catastrophic noise.</p>
    </li>
  </ol>
</section>

<section class="lab-footer">
  <p>A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
