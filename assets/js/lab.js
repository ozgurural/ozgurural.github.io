/* =============================================================================
   Lab — research-grade phase-space explorers.
   Drag the sliders, watch the curves and the animation move with the
   parameters. Closed-form maths, not Monte-Carlo screenshots.

   1. The Two Generals' Lab
      Two protocol families compared by closed-form win probability:
        Naive multi-send : P(win) = 1 − p^N
        Strict chain     : P(win) = (1 − p)^N
      Live curves over N ∈ [1,10] for current p, with a marker at the
      current N. A continuous messenger animation in the channel runs
      at the current loss rate so the slider has a physical analogue.

   2. The Verifier's Lab
      Feature-based watermark detection in closed form. Per-cell SNR =
      ε / √(σ² + σ₀²), per-cell detection probability q = Φ(SNR − z_α)
      at fixed FPR α = 0.05. Aggregate detection by majority vote over
      k independent cells, computed via normal approximation to the
      binomial. Live grid of one realisation at current parameters,
      and curves of detection rate vs σ over a sweep of k values.
   ============================================================================= */
(function () {
  "use strict";
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const SVG = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs, parent) => {
    const el = document.createElementNS(SVG, tag);
    if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };

  /* ---------- DevTools signature ---------- */
  try {
    if (typeof console !== "undefined" && console.log) {
      const sig = [
        "%c lab.js %c — research-grade phase-space explorers.",
        "background:#0c4a6e;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600;",
        "color:#94a3b8;font-style:italic;"
      ];
      console.log.apply(console, sig);
      console.log("%cThe maths is real. Φ(x) is Abramowitz–Stegun 26.2.17, no Monte Carlo. If you read code while drinking coffee, drop me a note: drozgurural@gmail.com.", "color:#64748b;");
    }
  } catch (e) { /* noop */ }

  /* ---------- tiny tween helper for readout values ---------- */
  /* Animates a single text element from `from` to `to` over `ms` using
     easeOutCubic. Cancels any in-flight tween on the same element so
     rapid slider drags don't pile up. */
  const tweenStore = new WeakMap();
  function tweenNumber(el, from, to, ms, fmt) {
    if (!el) return;
    const prev = tweenStore.get(el);
    if (prev) cancelAnimationFrame(prev);
    if (Math.abs(to - from) < 1e-6) { el.textContent = fmt(to); return; }
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      el.textContent = fmt(v);
      if (t < 1) {
        const id = requestAnimationFrame(step);
        tweenStore.set(el, id);
      } else {
        tweenStore.delete(el);
      }
    }
    const id = requestAnimationFrame(step);
    tweenStore.set(el, id);
  }
  function pulseRow(el) {
    if (!el) return;
    el.classList.remove("is-updating");
    /* force reflow so the animation can replay */
    void el.offsetWidth;
    el.classList.add("is-updating");
  }

  /* ---------- statistics primitives ---------- */
  // Φ(x), the standard normal CDF. Abramowitz–Stegun approximation 26.2.17.
  function phi(x) {
    const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741;
    const a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911;
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x) / Math.SQRT2;
    const t = 1 / (1 + p * ax);
    const y = 1 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1) * t * Math.exp(-ax*ax);
    return 0.5 * (1 + sign * y);
  }

  /* ============================================================================
     PUZZLE 1 · Two Generals' Lab
     ============================================================================ */
  function initTwoGeneralsLab() {
    const root = document.getElementById("lab-tg");
    if (!root) return;

    const refs = {
      p:        $('[data-role="p"]', root),
      n:        $('[data-role="n"]', root),
      pVal:     $('[data-role="p-val"]', root),
      nVal:     $('[data-role="n-val"]', root),
      pDisplay: $('[data-role="p-display"]', root),
      naive:    $('[data-role="naive-val"]', root),
      strict:   $('[data-role="strict-val"]', root),
      delta:    $('[data-role="delta-val"]', root),
      minNVal:  $('[data-role="minN-val"]', root),
      sweetTg:  $('[data-role="sweet-spot-tg"]', root),
      insight:  $('[data-role="insight"]', root),
      plot:     $('[data-role="plot"]', root),
      valley:   $('[data-role="valley"]', root),
    };

    /* ---- Plot rendering ---- */
    const PW = 640, PH = 260;
    const M = { l: 52, r: 110, t: 28, b: 40 };
    const innerW = PW - M.l - M.r;
    const innerH = PH - M.t - M.b;
    const N_MIN = 1, N_MAX = 10;

    function xFor(n) { return M.l + ((n - N_MIN) / (N_MAX - N_MIN)) * innerW; }
    function yFor(p) { return M.t + (1 - p) * innerH; }

    function pathFor(fn) {
      let d = "";
      for (let n = N_MIN; n <= N_MAX; n++) {
        const x = xFor(n), y = yFor(fn(n));
        d += (n === N_MIN ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      }
      return d.trim();
    }

    function drawPlot(p, n) {
      const plot = refs.plot;
      while (plot.firstChild) plot.removeChild(plot.firstChild);

      // Title
      const title = svg("text", {
        x: M.l, y: M.t - 12, class: "lab-plot__title",
      }, plot);
      title.textContent = "P(win) vs protocol depth N | p = " + p.toFixed(2);

      // Y-axis gridlines + labels (0%, 25%, 50%, 75%, 100%)
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        svg("line", {
          x1: M.l, x2: M.l + innerW,
          y1: yFor(v), y2: yFor(v),
          class: "lab-plot__grid",
        }, plot);
        const t = svg("text", {
          x: M.l - 8, y: yFor(v) + 4,
          class: "lab-plot__tick lab-plot__tick--y",
        }, plot);
        t.textContent = (v * 100).toFixed(0) + "%";
      });

      // X-axis ticks
      for (let i = N_MIN; i <= N_MAX; i++) {
        svg("line", {
          x1: xFor(i), x2: xFor(i),
          y1: yFor(0), y2: yFor(0) + 4,
          class: "lab-plot__tick-mark",
        }, plot);
        if (i === N_MIN || i === N_MAX || i % 2 === 0) {
          const t = svg("text", {
            x: xFor(i), y: yFor(0) + 18,
            class: "lab-plot__tick lab-plot__tick--x",
          }, plot);
          t.textContent = i;
        }
      }
      const xlabel = svg("text", {
        x: M.l + innerW / 2, y: PH - 8,
        class: "lab-plot__axis-label",
      }, plot);
      xlabel.textContent = "N (messages)";

      // Curves
      svg("path", {
        d: pathFor((nn) => 1 - Math.pow(p, nn)),
        class: "lab-plot__curve lab-plot__curve--naive",
      }, plot);
      svg("path", {
        d: pathFor((nn) => Math.pow(1 - p, nn)),
        class: "lab-plot__curve lab-plot__curve--strict",
      }, plot);

      // Vertical marker at current N
      svg("line", {
        x1: xFor(n), x2: xFor(n),
        y1: yFor(0), y2: yFor(1),
        class: "lab-plot__marker-x",
      }, plot);

      // Markers + value labels at current N
      const yN = 1 - Math.pow(p, n);
      const yS = Math.pow(1 - p, n);
      svg("circle", {
        cx: xFor(n), cy: yFor(yN), r: 4.5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--naive",
      }, plot);
      svg("circle", {
        cx: xFor(n), cy: yFor(yS), r: 4.5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--strict",
      }, plot);

      // Legend (right side)
      const lx = M.l + innerW + 14;
      const lyN = yFor(yN);
      const lyS = yFor(yS);
      const placeLegend = (cy, lbl, val, modifier) => {
        const tn = svg("text", {
          x: lx, y: cy - 5,
          class: "lab-plot__legend-label lab-plot__legend-label--" + modifier,
        }, plot);
        tn.textContent = lbl;
        const tv = svg("text", {
          x: lx, y: cy + 12,
          class: "lab-plot__legend-value lab-plot__legend-value--" + modifier,
        }, plot);
        tv.textContent = (val * 100).toFixed(1) + "%";
      };
      // Avoid label overlap when curves cross close together
      const minGap = 24;
      let yNa = lyN, yStrict = lyS;
      if (Math.abs(yNa - yStrict) < minGap) {
        const mid = (yNa + yStrict) / 2;
        if (yNa < yStrict) { yNa = mid - minGap/2; yStrict = mid + minGap/2; }
        else               { yNa = mid + minGap/2; yStrict = mid - minGap/2; }
      }
      placeLegend(yNa, "naive", yN, "naive");
      placeLegend(yStrict, "strict", yS, "strict");
    }

    /* ---- Animation strip: continuous messengers at current p ---- */
    let currentP = 0.40;
    const ANIM_MS = 1400;
    let spawnMs = 700;
    let lastSweetZone = false;
    let animTimer = null;
    function stopAnim() {
      if (animTimer) { clearInterval(animTimer); animTimer = null; }
    }
    function spawnDot() {
      if (!refs.valley.isConnected) return;
      const dir = Math.random() < 0.5 ? "ab" : "ba";
      const lost = Math.random() < currentP;
      const dot = document.createElement("span");
      dot.className = "lab-tg__dot lab-tg__dot--" + dir + (lost ? " lab-tg__dot--lost" : "");
      dot.style.animationDuration = ANIM_MS + "ms";
      refs.valley.appendChild(dot);
      setTimeout(() => dot.remove(), ANIM_MS + 60);
      // Lost messengers leave a small puff of dust at their last known position.
      if (lost) {
        setTimeout(() => {
          if (!refs.valley.isConnected) return;
          const puff = document.createElement("span");
          puff.className = "lab-tg__puff";
          puff.style.left = "50%";
          refs.valley.appendChild(puff);
          setTimeout(() => puff.remove(), 700);
        }, ANIM_MS * 0.55);
      }
    }
    function startAnim() {
      if (animTimer) return;
      animTimer = setInterval(spawnDot, spawnMs);
      spawnDot();
    }
    function restartAnim() {
      stopAnim();
      animTimer = setInterval(spawnDot, spawnMs);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { stopAnim(); } else { startAnim(); }
    });

    /* ---- Live update with tweened readouts ---- */
    let prev = { naive: 1 - Math.pow(0.4, 3), strict: Math.pow(0.6, 3), delta: 0 };
    function update() {
      const p = parseFloat(refs.p.value);
      const n = parseInt(refs.n.value, 10);
      currentP = p;
      refs.pVal.textContent = p.toFixed(2);
      refs.nVal.textContent = n;
      refs.pDisplay.textContent = p.toFixed(2);
      const pNaive  = 1 - Math.pow(p, n);
      const pStrict = Math.pow(1 - p, n);
      const delta   = pNaive - pStrict;

      const pct = (v) => (v * 100).toFixed(1) + "%";
      const sgn = (v) => (v >= 0 ? "+" : "") + (v * 100).toFixed(1) + "%";
      tweenNumber(refs.naive,  prev.naive,  pNaive,  260, pct);
      tweenNumber(refs.strict, prev.strict, pStrict, 260, pct);
      tweenNumber(refs.delta,  prev.delta,  delta,   260, sgn);
      prev = { naive: pNaive, strict: pStrict, delta: delta };

      $$('.lab-experiment__metric', root).forEach(pulseRow);

      // Minimum N for naive to hit 99% at current p
      let minN99;
      if (p <= 0) minN99 = 1;
      else if (p >= 0.99) minN99 = Infinity;
      else minN99 = Math.ceil(Math.log(0.01) / Math.log(p));
      refs.minNVal.textContent = isFinite(minN99) ? minN99 : "\u221e";

      // Sweet spot detection
      const inSweetZone = p >= 0.10 && p <= 0.75 && isFinite(minN99) && n >= minN99;
      if (refs.sweetTg) {
        refs.sweetTg.hidden = !inSweetZone;
        if (inSweetZone) {
          refs.sweetTg.textContent = "You found the operating point. At p = " + p.toFixed(2) + " and N = " + n + ", naive multi-send hits " + (pNaive*100).toFixed(1) + "% reliability. This is the regime Raft, Cassandra, and Bitcoin confirmation depth all live in. Strict-chain manages " + (pStrict*100).toFixed(1) + "% -- which is why two-phase commit has a blocking problem and Paxos does not.";
        }
      }

      // Animation speed: faster in sweet zone; restart only when zone changes
      const newSpawnMs = inSweetZone ? 500 : 700;
      if (newSpawnMs !== spawnMs || inSweetZone !== lastSweetZone) {
        spawnMs = newSpawnMs;
        restartAnim();
      }
      lastSweetZone = inSweetZone;

      // Valley class for sweet zone styling
      if (refs.valley) {
        refs.valley.classList.toggle("lab-tg__valley--sweet", inSweetZone);
      }

      // Insight — branches on phase-space zone, anchored to production systems.
      let txt;
      if (p === 0)               txt = "p = 0. Congratulations, you have invented postal mail. The postman is honest, sober, and on time. Both protocols win 100%.";
      else if (p > 0.84)         txt = "Loss this severe and surrender starts to look like the dominant strategy. Even naive multi-send falls below 1 in 100 wins. (TCP gives up around here too; this is when your phone says 'no internet'.)";
      else if (n === 1)          txt = "At N = 1 the protocols coincide: a single send, no confirmation. The interesting structure starts at N = 2.";
      else if (p < 0.05)         txt = "Low loss, both protocols win nearly always. Production-grade WAN. The trap is invisible here but it is still a trap, and it shows up at the tails.";
      else if (Math.abs(p - 0.5) < 0.005) txt = "p = 0.5. Entropy maxes out; the channel becomes a coin flip. Naive still wins by accumulating tries, same trick TCP uses on bad WiFi.";
      else if (p > 0.65)         txt = "At very high loss, naive multi-send pulls ahead by accumulating chances rather than depending on any one. That is the math every blockchain confirmation depth and every database read quorum runs on.";
      else if (delta > 0.6)      txt = "Delta > 60%: strict chain is silently bleeding. The clever-engineer instinct says 'add another confirmation round.' The mathematics is unimpressed. (This is why 2PC has been the cautionary tale since the 1980s.)";
      else if (delta > 0.3)      txt = "Delta > 30%: strict chain pays heavily for its caution. Naive multi-send is strictly better, same shape every retry-with-backoff and every blockchain confirmation depth uses.";
      else                       txt = "Naive multi-send dominates strict-chain for any p in (0,1) and N >= 2. Production distributed systems chose naive on purpose.";
      refs.insight.textContent = txt;

      drawPlot(p, n);
    }

    refs.p.addEventListener("input", update);
    refs.n.addEventListener("input", update);
    update();
    startAnim();
  }

  /* ============================================================================
     PUZZLE 2 · The Verifier's Lab
     ============================================================================ */
  function initVerifierLab() {
    const root = document.getElementById("lab-wm");
    if (!root) return;

    const refs = {
      eps:        $('[data-role="eps"]', root),
      k:          $('[data-role="k"]', root),
      sigma:      $('[data-role="sigma"]', root),
      epsVal:     $('[data-role="eps-val"]', root),
      kVal:       $('[data-role="k-val"]', root),
      sigmaVal:   $('[data-role="sigma-val"]', root),
      grid:       $('[data-role="grid"]', root),
      plot:       $('[data-role="plot-wm"]', root),
      det:        $('[data-role="det-val"]', root),
      fpr:        $('[data-role="fpr-val"]', root),
      snr:        $('[data-role="snr-val"]', root),
      utilityVal: $('[data-role="utility-val"]', root),
      sweetWm:    $('[data-role="sweet-spot-wm"]', root),
      insight:    $('[data-role="insight-wm"]', root),
    };

    const SIGMA0 = 0.12;       // baseline measurement noise (fixed)
    const ALPHA  = 0.05;       // per-cell FPR
    const Z_ALPHA = 1.6448536;  // one-sided 95th percentile

    /* per-cell detection probability under perturbation eps + attack noise sigma */
    function qDetect(eps, sigma) {
      const sd = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      return phi(snr - Z_ALPHA);
    }
    /* aggregate detection over k cells, majority vote, normal approximation */
    function aggregateDetect(q, k) {
      // P(X >= ceil(k/2)) where X ~ Binom(k, q). Normal approx with cc.
      const mu = k * q;
      const sd = Math.sqrt(k * q * (1 - q) + 1e-9);
      const thresh = Math.ceil(k / 2) - 0.5;  // continuity correction
      return 1 - phi((thresh - mu) / sd);
    }

    /* ---- Live grid: 8x8, key cells perturbed ---- */
    const GRID_N = 8, GRID_CELLS = 64;
    const KEY_PATTERNS = [
      [0,9,18,27,36,45,54,63],
      [7,14,21,28,35,42,49,56],
      [3,11,19,27,35,43,51,59,24,25,26,28,29,30,31],
      [27,28,35,36,43,44],
      [0,1,2,3,4,5,6,7],
      [0,1,2,3,4,5,6,7,56,57,58,59,60,61,62,63,8,16,24,32,40,48,15,23,31,39,47,55],
    ];
    function pickKey(k) {
      // Pick a structured pattern with cell count nearest to requested k.
      let best = KEY_PATTERNS[0], diff = Math.abs(KEY_PATTERNS[0].length - k);
      for (const p of KEY_PATTERNS) {
        const d = Math.abs(p.length - k);
        if (d < diff) { best = p; diff = d; }
      }
      // If pattern has more than k, take first k; if fewer, just use them all.
      return best.slice(0, k);
    }
    function rngBase() {
      // Smoothed gaussian-ish noise per cell, mean 0.5 sd ≈ 0.12
      const out = new Array(GRID_CELLS);
      for (let i = 0; i < GRID_CELLS; i++) {
        // Sum of 6 uniforms, scaled — Irwin-Hall normalised, central limit
        let s = 0; for (let j = 0; j < 6; j++) s += Math.random();
        out[i] = 0.5 + (s/6 - 0.5) * 0.55;
      }
      return out;
    }
    function valueToColor(v, isKey) {
      let c = Math.max(0, Math.min(1, v));
      const hue   = 200 - c * 30;
      let   sat   = 60 + c * 20;
      let   light = 32 + c * 38;
      if (isKey) { sat = Math.min(95, sat + 18); light = Math.max(26, light - 6); }
      return "hsl(" + hue.toFixed(0) + " " + sat.toFixed(0) + "% " + light.toFixed(0) + "%)";
    }
    function buildGrid(eps, k, sigma) {
      while (refs.grid.firstChild) refs.grid.removeChild(refs.grid.firstChild);
      const base = rngBase();
      const keyCells = pickKey(k);
      const keySet = new Set(keyCells);
      // Adversary's noise
      for (let i = 0; i < GRID_CELLS; i++) {
        const noise = (Math.random() * 2 - 1) * sigma * 1.2;  // crude uniform; visual only
        base[i] += noise;
        if (keySet.has(i)) base[i] += eps;
      }
      const vmin = Math.min.apply(null, base), vmax = Math.max.apply(null, base);
      const range = (vmax - vmin) || 1;
      base.forEach((raw, i) => {
        const v = (raw - vmin) / range;
        const cell = document.createElement("span");
        cell.className = "lab-wm__cell";
        cell.style.background = valueToColor(v, keySet.has(i));
        if (keySet.has(i)) cell.dataset.key = "1";
        refs.grid.appendChild(cell);
      });
      refs.grid.classList.add("lab-wm__grid--reveal");
    }

    /* ---- Plot: detection rate vs sigma, multi-curve over k ---- */
    const PW = 640, PH = 260;
    const M = { l: 52, r: 110, t: 28, b: 40 };
    const innerW = PW - M.l - M.r;
    const innerH = PH - M.t - M.b;
    const SIGMA_MAX = 0.4;
    const K_CURVES = [2, 4, 8, 16, 32];

    function xFor(s) { return M.l + (s / SIGMA_MAX) * innerW; }
    function yFor(p) { return M.t + (1 - p) * innerH; }

    function drawPlot(eps, kCur, sigmaCur) {
      const plot = refs.plot;
      while (plot.firstChild) plot.removeChild(plot.firstChild);

      // Title
      const title = svg("text", { x: M.l, y: M.t - 12, class: "lab-plot__title" }, plot);
      title.textContent = "Detection rate vs attacker noise σ | ε = " + eps.toFixed(2);

      // Y-axis gridlines/ticks
      [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
        svg("line", {
          x1: M.l, x2: M.l + innerW,
          y1: yFor(v), y2: yFor(v),
          class: "lab-plot__grid",
        }, plot);
        const t = svg("text", {
          x: M.l - 8, y: yFor(v) + 4,
          class: "lab-plot__tick lab-plot__tick--y",
        }, plot);
        t.textContent = (v * 100).toFixed(0) + "%";
      });

      // X-axis ticks
      [0, 0.1, 0.2, 0.3, 0.4].forEach((s) => {
        svg("line", {
          x1: xFor(s), x2: xFor(s),
          y1: yFor(0), y2: yFor(0) + 4,
          class: "lab-plot__tick-mark",
        }, plot);
        const t = svg("text", {
          x: xFor(s), y: yFor(0) + 18,
          class: "lab-plot__tick lab-plot__tick--x",
        }, plot);
        t.textContent = s.toFixed(1);
      });
      const xlabel = svg("text", { x: M.l + innerW/2, y: PH - 8, class: "lab-plot__axis-label" }, plot);
      xlabel.textContent = "σ (attacker noise)";

      // Curves: detection rate vs σ for each k
      const SAMPLES = 80;
      K_CURVES.forEach((k) => {
        let d = "";
        for (let i = 0; i <= SAMPLES; i++) {
          const sigma = (i / SAMPLES) * SIGMA_MAX;
          const q = qDetect(eps, sigma);
          const det = aggregateDetect(q, k);
          const x = xFor(sigma), y = yFor(det);
          d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
        }
        const isCurrent = (k === kCur);
        svg("path", {
          d: d,
          class: "lab-plot__curve lab-plot__curve--wm" + (isCurrent ? " lab-plot__curve--wm-current" : ""),
        }, plot);
        // Label at right edge
        const finalSigma = SIGMA_MAX;
        const finalQ = qDetect(eps, finalSigma);
        const finalDet = aggregateDetect(finalQ, k);
        const t = svg("text", {
          x: M.l + innerW + 10, y: yFor(finalDet) + 4,
          class: "lab-plot__legend-value lab-plot__legend-value--wm" + (isCurrent ? " lab-plot__legend-value--wm-current" : ""),
        }, plot);
        t.textContent = "k=" + k;
      });

      // Vertical marker at current σ
      svg("line", {
        x1: xFor(sigmaCur), x2: xFor(sigmaCur),
        y1: yFor(0), y2: yFor(1),
        class: "lab-plot__marker-x",
      }, plot);

      // Marker dot at (σ, detection_for_current_k)
      const qCur = qDetect(eps, sigmaCur);
      const detCur = aggregateDetect(qCur, kCur);
      svg("circle", {
        cx: xFor(sigmaCur), cy: yFor(detCur), r: 5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--wm",
      }, plot);
    }

    /* ---- Live update with tweened readouts ---- */
    let prev = { snr: 1.28, det: 0.32, fpr: 0 };
    function update() {
      const eps   = parseFloat(refs.eps.value);
      const k     = parseInt(refs.k.value, 10);
      const sigma = parseFloat(refs.sigma.value);
      refs.epsVal.textContent   = eps.toFixed(2);
      refs.kVal.textContent     = k;
      refs.sigmaVal.textContent = sigma.toFixed(2);

      const sd  = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      const q   = qDetect(eps, sigma);
      const det = aggregateDetect(q, k);
      const fpr = aggregateDetect(ALPHA, k);

      const num1 = (v) => v.toFixed(2);
      const pctH = (v) => (v * 100).toFixed(1) + "%";
      const pctL = (v) => (v * 100).toFixed(2) + "%";
      tweenNumber(refs.snr, prev.snr, snr, 240, num1);
      tweenNumber(refs.det, prev.det, det, 240, pctH);
      tweenNumber(refs.fpr, prev.fpr, fpr, 240, pctL);
      prev = { snr: snr, det: det, fpr: fpr };

      $$('.lab-experiment__metric', root).forEach(pulseRow);

      // Utility margin: headroom below the accuracy-degradation threshold
      const utilityMargin = 0.25 - eps;
      if (refs.utilityVal) {
        refs.utilityVal.textContent = (utilityMargin >= 0 ? "+" : "") + utilityMargin.toFixed(2);
      }

      // Sweet spot: publishable operating point
      const inSweetWm = det >= 0.90 && fpr <= 0.05 && eps <= 0.25 && snr >= 1.0;
      if (refs.sweetWm) {
        refs.sweetWm.hidden = !inSweetWm;
        if (inSweetWm) {
          refs.sweetWm.textContent = "You found the publishable operating point. Detection " + (det*100).toFixed(1) + "%, false-positive rate " + (fpr*100).toFixed(2) + "%, SNR " + snr.toFixed(2) + ". This is the regime from the 2024 IEEE Access paper: k = " + k + " cells at \u03b5 = " + eps.toFixed(2) + " survives fine-tuning noise up to \u03c3 = " + sigma.toFixed(2) + " while keeping downstream accuracy intact. Court-admissible.";
        }
      }

      let txt;
      if (eps < 0.04)             txt = "Epsilon this small puts the perturbation below the model's own noise floor. Even the verifier with the key cannot do much.";
      else if (det > 0.995)       txt = "Detection saturated. The verifier wins by a landslide. Court-credible regime: the lawyers have evidence; the thief has homework.";
      else if (det > 0.9 && fpr < 0.1)
                                  txt = "On the operating frontier: over 90% detection, under 10% false-positive. The production-credible regime, the one a real provenance dispute can defend.";
      else if (det > 0.5 && k <= 4)
                                  txt = "Small key, marginal signal. Try doubling k. The gain from k = " + k + " to " + (k*2) + " comes from sqrt(k) SNR amplification.";
      else if (det < 0.15 && sigma > 0.3)
                                  txt = "Sigma at this level means the attacker has more noise budget than the watermark has signal. Time to grow k, or rethink epsilon. At this point a determined fine-tune attack succeeds.";
      else if (det < 0.2)         txt = "Watermark washed out. At this (epsilon, sigma) the attacker has effectively defeated detection. Raise epsilon or grow k.";
      else                        txt = "k = " + k + " amplifies SNR by sqrt(k) which is approximately " + Math.sqrt(k).toFixed(2) + ". Detection scales with that, not with epsilon alone.";
      refs.insight.textContent = txt;

      buildGrid(eps, k, sigma);
      drawPlot(eps, k, sigma);
    }

    refs.eps.addEventListener("input", update);
    refs.k.addEventListener("input", update);
    refs.sigma.addEventListener("input", update);
    update();
  }

  /* ============================================================================
     PUZZLE 3 · Triple Modular Redundancy
     A live simulation of three independent channels + a majority voter, with
     correlation between channels controlled by a slider. The math is closed-
     form: P(sys fail) = ρ·q + (1−ρ)·(3q²−2q³). The curve plot draws four
     curves (ρ ∈ {0, 0.1, 0.5, 1}) plus the single-channel y=q line, with a
     marker at the current operating point.
     ============================================================================ */
  function initTMRLab() {
    const root = document.getElementById("lab-tmr");
    if (!root) return;

    const refs = {
      q:               $('[data-role="q"]', root),
      rho:             $('[data-role="rho"]', root),
      qVal:            $('[data-role="q-val"]', root),
      rhoVal:          $('[data-role="rho-val"]', root),
      sysVal:          $('[data-role="sys-val"]', root),
      singleVal:       $('[data-role="single-val"]', root),
      gainVal:         $('[data-role="gain-val"]', root),
      rhoBreakevenVal: $('[data-role="rho-breakeven-val"]', root),
      sweetTmr:        $('[data-role="sweet-spot-tmr"]', root),
      insight:         $('[data-role="insight-tmr"]', root),
      plot:            $('[data-role="plot-tmr"]', root),
      cells1:          $('[data-cells="1"]', root),
      cells2:          $('[data-cells="2"]', root),
      cells3:          $('[data-cells="3"]', root),
      cellsSys:        $('[data-cells="sys"]', root),
    };

    /* Closed-form system failure rate. */
    function pSysFail(q, rho) {
      const indep = 3*q*q*(1 - q) + q*q*q; // = 3q^2 - 2q^3
      return rho*q + (1 - rho)*indep;
    }

    /* Break-even correlation: rho where gain = 10x (pSysFail = q/10).
       Solved analytically: rho*(q - indep) = q/10 - indep => rho = (q/10 - indep)/(q - indep). */
    function rhoBreakeven(q) {
      const indep = 3*q*q*(1 - q) + q*q*q;
      const target = q / 10;
      if (target < indep || Math.abs(q - indep) < 1e-10) return null;
      const rho = (target - indep) / (q - indep);
      return (rho >= 0 && rho <= 1) ? rho : null;
    }

    /* ---- Plot rendering: P(sys fail) vs q for several ρ curves ---- */
    const PW = 640, PH = 260;
    const M = { l: 56, r: 110, t: 28, b: 40 };
    const innerW = PW - M.l - M.r;
    const innerH = PH - M.t - M.b;
    const Q_MAX = 0.30;
    const Y_MAX = 0.30;
    const RHO_CURVES = [0, 0.1, 0.5, 1];

    function xFor(qq) { return M.l + (qq / Q_MAX) * innerW; }
    function yFor(p)  { return M.t + (1 - p / Y_MAX) * innerH; }

    function drawPlot(qCur, rhoCur) {
      const plot = refs.plot;
      while (plot.firstChild) plot.removeChild(plot.firstChild);

      const title = svg("text", { x: M.l, y: M.t - 12, class: "lab-plot__title" }, plot);
      title.textContent = "P(sys fail) vs q | ρ = " + rhoCur.toFixed(2);

      // Y gridlines + ticks
      [0, 0.10, 0.20, 0.30].forEach((v) => {
        svg("line", {
          x1: M.l, x2: M.l + innerW,
          y1: yFor(v), y2: yFor(v),
          class: "lab-plot__grid",
        }, plot);
        const t = svg("text", {
          x: M.l - 8, y: yFor(v) + 4,
          class: "lab-plot__tick lab-plot__tick--y",
        }, plot);
        t.textContent = (v * 100).toFixed(0) + "%";
      });
      // X ticks
      [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30].forEach((qq) => {
        svg("line", {
          x1: xFor(qq), x2: xFor(qq),
          y1: yFor(0), y2: yFor(0) + 4,
          class: "lab-plot__tick-mark",
        }, plot);
        const t = svg("text", {
          x: xFor(qq), y: yFor(0) + 18,
          class: "lab-plot__tick lab-plot__tick--x",
        }, plot);
        t.textContent = qq.toFixed(2);
      });
      const xlabel = svg("text", { x: M.l + innerW/2, y: PH - 8, class: "lab-plot__axis-label" }, plot);
      xlabel.textContent = "q (per-channel)";

      // Single-channel reference line (y = q), drawn as the "strict" amber curve
      let dSingle = "";
      const STEPS = 80;
      for (let i = 0; i <= STEPS; i++) {
        const qq = (i / STEPS) * Q_MAX;
        const x = xFor(qq);
        const y = yFor(Math.min(qq, Y_MAX));
        dSingle += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      }
      svg("path", { d: dSingle, class: "lab-plot__curve lab-plot__curve--strict" }, plot);

      // TMR curves for several ρ
      RHO_CURVES.forEach((rho) => {
        let d = "";
        for (let i = 0; i <= STEPS; i++) {
          const qq = (i / STEPS) * Q_MAX;
          const v = Math.min(pSysFail(qq, rho), Y_MAX);
          const x = xFor(qq), y = yFor(v);
          d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
        }
        const isCur = Math.abs(rho - rhoCur) < 0.06;
        svg("path", {
          d: d,
          class: "lab-plot__curve lab-plot__curve--wm" + (isCur ? " lab-plot__curve--wm-current" : ""),
        }, plot);
        // ρ label at right edge
        const finalQ = Q_MAX;
        const finalY = yFor(Math.min(pSysFail(finalQ, rho), Y_MAX));
        const t = svg("text", {
          x: M.l + innerW + 10, y: finalY + 4,
          class: "lab-plot__legend-value lab-plot__legend-value--wm" + (isCur ? " lab-plot__legend-value--wm-current" : ""),
        }, plot);
        t.textContent = "ρ=" + rho;
      });

      // Single-channel label
      const singleLabel = svg("text", {
        x: M.l + innerW + 10,
        y: yFor(Math.min(Q_MAX, Y_MAX)) + 4,
        class: "lab-plot__legend-value lab-plot__legend-value--strict",
      }, plot);
      singleLabel.textContent = "single";

      // Vertical marker at current q
      svg("line", {
        x1: xFor(qCur), x2: xFor(qCur),
        y1: yFor(0), y2: yFor(Y_MAX),
        class: "lab-plot__marker-x",
      }, plot);

      // Marker dot at (q, p_sys)
      const v = Math.min(pSysFail(qCur, rhoCur), Y_MAX);
      svg("circle", {
        cx: xFor(qCur), cy: yFor(v), r: 5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--wm",
      }, plot);
    }

    /* ---- Live simulation: scrolling channel strip ---- */
    const MAX_CELLS = 28;
    let simTimer = null;
    let currentQ = 0.05, currentRho = 0;

    function addCell(container, isFault) {
      const cell = document.createElement("span");
      cell.className = "lab-tmr__cell " + (isFault ? "lab-tmr__cell--fault" : "lab-tmr__cell--ok");
      container.appendChild(cell);
      while (container.children.length > MAX_CELLS) {
        container.removeChild(container.firstChild);
      }
    }
    function tick() {
      // Common-mode event with probability ρ; if it hits, all 3 share one Bernoulli(q).
      let fails;
      if (Math.random() < currentRho) {
        const f = Math.random() < currentQ;
        fails = [f, f, f];
      } else {
        fails = [
          Math.random() < currentQ,
          Math.random() < currentQ,
          Math.random() < currentQ,
        ];
      }
      const numFail = (fails[0]?1:0) + (fails[1]?1:0) + (fails[2]?1:0);
      const sysFail = numFail >= 2;
      addCell(refs.cells1,   fails[0]);
      addCell(refs.cells2,   fails[1]);
      addCell(refs.cells3,   fails[2]);
      addCell(refs.cellsSys, sysFail);
      // Briefly flash the SYS row when it fails
      if (sysFail) {
        const sysRow = refs.cellsSys.parentElement;
        if (sysRow) {
          sysRow.classList.remove("is-flashing");
          void sysRow.offsetWidth;
          sysRow.classList.add("is-flashing");
        }
      }
    }
    function startSim() {
      if (simTimer) return;
      simTimer = setInterval(tick, 600);
      tick();
    }
    function stopSim() {
      if (simTimer) { clearInterval(simTimer); simTimer = null; }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { stopSim(); } else { startSim(); }
    });

    /* ---- Live update from sliders ---- */
    let prev = { sys: 3*0.05*0.05 - 2*Math.pow(0.05,3), single: 0.05, gain: 0 };
    function update() {
      const q   = parseFloat(refs.q.value);
      const rho = parseFloat(refs.rho.value);
      currentQ = q; currentRho = rho;
      refs.qVal.textContent   = q.toFixed(3);
      refs.rhoVal.textContent = rho.toFixed(2);

      const pSys = pSysFail(q, rho);
      const gain = pSys > 0 ? q / pSys : 1;

      const pctH = (v) => (v * 100 < 1 ? (v * 100).toFixed(3) : (v * 100).toFixed(2)) + "%";
      const pctS = (v) => (v * 100).toFixed(1) + "%";
      const xRaw = (v) => (v >= 100 ? Math.round(v) + "×" : v.toFixed(1) + "×");

      tweenNumber(refs.sysVal,    prev.sys,    pSys,   240, pctH);
      tweenNumber(refs.singleVal, prev.single, q,      240, pctS);
      tweenNumber(refs.gainVal,   prev.gain,   gain,   260, xRaw);
      prev = { sys: pSys, single: q, gain: gain };
      $$('.lab-experiment__metric', root).forEach(pulseRow);

      // Break-even correlation for 10x gain
      const rhoBE = rhoBreakeven(q);
      if (refs.rhoBreakevenVal) {
        refs.rhoBreakevenVal.textContent = (rhoBE === null) ? "N/A" : rhoBE.toFixed(2);
      }

      // Sweet spot: well inside the safe operating envelope
      const inSweetTmr = rhoBE !== null && rho < rhoBE * 0.5 && q < 0.10 && gain >= 10;
      const overBreakeven = rhoBE !== null && rho > rhoBE && rhoBE < 0.99;

      if (refs.sweetTmr) {
        refs.sweetTmr.hidden = !inSweetTmr;
        if (inSweetTmr) {
          refs.sweetTmr.textContent = "You found the safe operating envelope. At q = " + q.toFixed(3) + " and \u03c1 = " + rho.toFixed(2) + ", TMR delivers " + gain.toFixed(1) + "x reliability gain. The break-even correlation for this failure rate is \u03c1 \u2248 " + rhoBE.toFixed(2) + ". Stay below it and three diverse computers are worth every euro. Cross it and you have an Ariane 5.";
        }
      }

      // Override insight text when over break-even
      let txt;
      if (rhoBE === null) {
        txt = "At this q, even perfect independence cannot reach a 10x gain. The best case is " + (q / pSysFail(q, 0)).toFixed(1) + "x, so the break-even readout is N/A rather than a fake threshold.";
      } else if (overBreakeven) {
        txt = "Warning: \u03c1 = " + rho.toFixed(2) + " exceeds the break-even threshold of " + rhoBE.toFixed(2) + " for this failure rate. TMR is now delivering less than 10x gain. The hardware cost is no longer justified by the reliability improvement. This is the regime the Ariane 5 lived in.";
      } else if (rho >= 0.95) {
        txt = "Rho near 1: redundancy with full correlation is not redundancy, it is a single channel three times. The Ariane 5 had redundant flight computers running the exact same inertial reference software. They both crashed in the same millisecond.";
      } else if (rho < 0.05) {
        txt = "Independent faults. TMR delivers cubic reliability gain. This is the regime DO-178C lives in, the one your A320 cruises through every flight.";
      } else if (rho < 0.5) {
        txt = "Some correlation, some gain. The ratio of TMR to single-channel is shrinking faster than rho alone suggests. Common-cause failures are doing real damage.";
      } else {
        txt = "Correlated faults eat the cubic gain. TMR still helps but only by a constant factor, not the roughly 1/(3q) you get under independence. Diverse-versions programming exists for exactly this reason.";
      }
      refs.insight.textContent = txt;

      drawPlot(q, rho);
    }

    refs.q.addEventListener("input", update);
    refs.rho.addEventListener("input", update);
    update();
    startSim();
  }

  /* ============================================================================
     SECTION 3 · Calibration probes — short MCQ, one-sentence reveal
     ============================================================================ */
  function initProbes() {
    const probes = $$('.lab-probe');
    probes.forEach((probe) => {
      const correct = probe.dataset.correct;
      if (!correct) return;
      const choices = $$('.lab-probe__choice', probe);
      const reveal  = $('.lab-probe__reveal', probe);
      let answered = false;
      choices.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const picked = btn.dataset.choice;
          const isRight = picked === correct;
          btn.classList.add(isRight ? 'lab-probe__choice--right' : 'lab-probe__choice--wrong');
          if (!isRight) {
            const correctBtn = $('[data-choice="' + correct + '"]', probe);
            if (correctBtn) correctBtn.classList.add('lab-probe__choice--right');
          }
          choices.forEach((c) => { c.disabled = true; });
          if (reveal) reveal.hidden = false;
        });
      });
    });
  }

  /* ----------------------------------------------------------------- bootstrap */
  function boot() {
    initTwoGeneralsLab();
    initVerifierLab();
    initTMRLab();
    initProbes();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
