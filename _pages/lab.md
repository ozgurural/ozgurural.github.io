---
permalink: /lab/
title: "Lab"
excerpt: "Two interactive phase-space explorers in distributed systems and ML security — drag the sliders, watch the curves move."
---

<p class="ep-lead">
  Two phase-space explorers and a set of calibration probes. The labs let you drag sliders and watch the animation react and the curves move — closed-form maths, not canned screenshots. The probes are short field-calibration questions: pick, see the answer, move on. The whole page should take about ten minutes if you stop to think. (If you open DevTools the maths leaves a forwarding address.)
</p>

<section class="lab-card lab-experiment" id="lab-tg">
  <span class="ep-eyebrow">Distributed systems · Phase-space exploration</span>
  <h2>The Two Generals' Lab</h2>
  <p class="lab-card__lead">
    Two armies must agree to attack. Their channel loses messengers with probability <em>p</em>. Two protocol families: <strong>naive</strong> (send <em>N</em> independent messengers, attack as long as any arrives) and <strong>strict-chain</strong> (a back-and-forth handshake of <em>N</em> messages where any single loss aborts the attack). The phase diagram below answers — for every (p, N) — which protocol wins more often. <em>Spoiler: the protocol that feels safer isn't.</em>
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
    </div>

    <p class="lab-experiment__insight" data-role="insight">Drag the sliders.</p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>Two protocols, both intuitive, both feasible — and one strictly dominates the other for any non-trivial loss rate. <strong>Naive</strong> sends N parallel messengers and attacks if at least one arrives: P(win) = 1 − p<sup>N</sup>, which approaches 1 as N grows. <strong>Strict-chain</strong> requires every messenger in a back-and-forth handshake to arrive — failure of any one aborts: P(win) = (1 − p)<sup>N</sup>, which falls to 0.</p>
    <p>For p = 0.4 and N = 5, naive wins 99% of battles; strict-chain wins about 8%. Yet "wait for confirmation" is the protocol every cautious engineer reaches for. The phase diagram tells you it's a trap. The deeper structural reason is that each additional confirmation round multiplies the failure probability, while parallel sends multiply the success probability — additive vs multiplicative composition of independent events. Production consensus protocols (Paxos, Raft) avoid the trap by using quorum-style any-of-N tolerance rather than every-of-N chains.</p>
  </details>
</section>

<section class="lab-card lab-experiment" id="lab-wm">
  <span class="ep-eyebrow">ML security · Detection-evasion frontier</span>
  <h2>The Verifier's Lab</h2>
  <p class="lab-card__lead">
    A feature-based watermark embeds a small per-cell perturbation of magnitude <em>ε</em> at <em>k</em> known cells of a model output. An adversary, trying to wash the watermark out, adds noise of standard deviation <em>σ</em>. The verifier — who knows which cells — runs a per-cell hypothesis test (FPR fixed at 5%) and aggregates by majority. The detection rate is closed-form once you fix those three knobs. (Φ here is the standard normal CDF. If you've never had a fight with one, you've never tried to compute one by hand.)
  </p>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
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
    </div>

    <p class="lab-experiment__insight" data-role="insight-wm">Drag the sliders.</p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>Aggregate detection over <em>k</em> independent cells with per-cell signal-to-noise ratio SNR = ε / √(σ² + σ₀²). Per-cell detection probability is q = Φ(SNR − z<sub>α</sub>) at a fixed FPR of 5% (z<sub>α</sub> ≈ 1.645). Majority-vote on k cells gives the curves you see — increasing k <em>amplifies</em> SNR roughly by √k via the central limit theorem, which is why feature-based watermarking holds up under attacker noise that would defeat single-cell detection.</p>
    <p>The Pareto frontier here matches what's published in the IEEE Access work (<a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024</a>, <a href="https://ieeexplore.ieee.org/document/11293969">2025</a>): for proof-of-learning under spoofing, an honest trainer with a key of even k = 8 cells maintains > 90% detection against substantial fine-tuning noise — while a forger without the key cannot replicate the signature without distorting the model badly enough to fail downstream evaluation.</p>
  </details>
</section>

<section class="lab-probes">
  <header class="lab-probes__header">
    <span class="ep-eyebrow">Calibration · Field probes</span>
    <h2>Six probes</h2>
    <p class="lab-probes__lead">Short field-calibration questions. Pick one; the reveal is one sentence — the surface, not the proof. The labs above are where the proofs live.</p>
  </header>

  <ol class="lab-probes__list">
    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">1</span><span><em>n</em> = 3 generals, <em>f</em> = 1 Byzantine fault, no signatures.</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Solvable</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Impossible</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Impossible.</strong> Lamport, Shostak &amp; Pease (1982): consensus needs <code>n ≥ 3f + 1</code>; three nodes tolerate zero.</p>
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

    <li class="lab-probe" data-correct="a">
      <p class="lab-probe__q"><span class="lab-probe__num">4</span><span>SHA-256 collision resistance is approximately:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">2¹²⁸</button>
        <button class="lab-probe__choice" data-choice="b" type="button">2²⁵⁶</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>2¹²⁸.</strong> Birthday bound: collisions in <code>O(2^(n/2))</code>. Pre-image and second-pre-image resistance are 2²⁵⁶.</p>
    </li>

    <li class="lab-probe" data-correct="c">
      <p class="lab-probe__q"><span class="lab-probe__num">5</span><span>Two-phase commit. All voted YES; coordinator crashes before COMMIT. Safe action for participants:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Commit</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Abort</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Wait</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Wait.</strong> The blocking problem of 2PC. Participants don't know what the coordinator already sent before crashing. Three-phase or Paxos remove the blocking.</p>
    </li>

    <li class="lab-probe" data-correct="b">
      <p class="lab-probe__q"><span class="lab-probe__num">6</span><span>99.9% test accuracy on CIFAR-10 + an adversarial example exists for every input at <em>ε</em> = 0.01. Both true:</span></p>
      <div class="lab-probe__choices">
        <button class="lab-probe__choice" data-choice="a" type="button">Bug</button>
        <button class="lab-probe__choice" data-choice="b" type="button">Geometry</button>
        <button class="lab-probe__choice" data-choice="c" type="button">Overfitting</button>
      </div>
      <p class="lab-probe__reveal" hidden><strong>Geometry.</strong> Test accuracy and adversarial robustness are different geometries on the same model — natural images sit close to decision boundaries in high-dim space (Goodfellow 2014).</p>
    </li>
  </ol>
</section>

<section class="lab-footer">
  <p>A sharper experiment, a parameter you'd like exposed, a probe you want added? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
