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
    const SPAWN_MS = 700;
    let animTimer = null;
    function spawnDot() {
      if (!refs.valley.isConnected) return;
      const dir = Math.random() < 0.5 ? "ab" : "ba";
      const lost = Math.random() < currentP;
      const dot = document.createElement("span");
      dot.className = "lab-tg__dot lab-tg__dot--" + dir + (lost ? " lab-tg__dot--lost" : "");
      dot.style.animationDuration = ANIM_MS + "ms";
      refs.valley.appendChild(dot);
      setTimeout(() => dot.remove(), ANIM_MS + 60);
    }
    function startAnim() {
      if (animTimer) return;
      animTimer = setInterval(spawnDot, SPAWN_MS);
      spawnDot();
    }

    /* ---- Live update ---- */
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
      refs.naive.textContent  = (pNaive  * 100).toFixed(1) + "%";
      refs.strict.textContent = (pStrict * 100).toFixed(1) + "%";
      refs.delta.textContent  = (delta >= 0 ? "+" : "") + (delta * 100).toFixed(1) + "%";

      // Choose insight text by zone of phase space
      let txt;
      if (n === 1)               txt = "At N = 1 the protocols coincide. The interesting structure starts at N = 2.";
      else if (p < 0.05)         txt = "Loss this low, both protocols nearly always succeed. The trap is invisible here — but it is still a trap.";
      else if (p > 0.65)         txt = "At very high loss, naive multi-send still pulls ahead by accumulating chances rather than depending on any one.";
      else if (delta > 0.6)      txt = "Δ > 60%: the strict chain pays heavily for its caution. Each confirmation round multiplies failure probability.";
      else if (delta > 0.3)      txt = "Δ > 30%: the strict chain is silently bleeding. Naive multi-send is strictly better.";
      else                       txt = "Naive multi-send dominates strict-chain for any p ∈ (0,1) and N ≥ 2.";
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
      eps:      $('[data-role="eps"]', root),
      k:        $('[data-role="k"]', root),
      sigma:    $('[data-role="sigma"]', root),
      epsVal:   $('[data-role="eps-val"]', root),
      kVal:     $('[data-role="k-val"]', root),
      sigmaVal: $('[data-role="sigma-val"]', root),
      grid:     $('[data-role="grid"]', root),
      plot:     $('[data-role="plot-wm"]', root),
      det:      $('[data-role="det-val"]', root),
      fpr:      $('[data-role="fpr-val"]', root),
      snr:      $('[data-role="snr-val"]', root),
      insight:  $('[data-role="insight-wm"]', root),
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

    /* ---- Live update ---- */
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

      refs.snr.textContent = snr.toFixed(2);
      refs.det.textContent = (det * 100).toFixed(1) + "%";
      refs.fpr.textContent = (fpr * 100).toFixed(2) + "%";

      let txt;
      if (det > 0.99)             txt = "Detection saturated — verifier wins easily under these conditions. Increase σ or shrink ε to find the cliff.";
      else if (det > 0.9 && fpr < 0.1)
                                  txt = "On the operating frontier: > 90% detection, low false positive. Production-credible regime.";
      else if (det > 0.5 && k <= 4)
                                  txt = "Small key, marginal signal — try doubling k. The gain from k = " + k + " → " + (k*2) + " comes from √k SNR amplification.";
      else if (det < 0.2)         txt = "Watermark washed out — at this (ε, σ) the attacker has effectively defeated detection. Either raise ε or grow k.";
      else                        txt = "k = " + k + " amplifies SNR by √k ≈ " + Math.sqrt(k).toFixed(2) + ". Detection scales with that, not with ε alone.";
      refs.insight.textContent = txt;

      buildGrid(eps, k, sigma);
      drawPlot(eps, k, sigma);
    }

    refs.eps.addEventListener("input", update);
    refs.k.addEventListener("input", update);
    refs.sigma.addEventListener("input", update);
    update();
  }

  /* ----------------------------------------------------------------- bootstrap */
  function boot() {
    initTwoGeneralsLab();
    initVerifierLab();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
