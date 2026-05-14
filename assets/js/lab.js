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
        "%c lab.js %c — research-grade phase-space explorers. Unimpressive humans may still find the curves educational.",
        "background:#0c4a6e;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600;",
        "color:#94a3b8;font-style:italic;"
      ];
      console.log.apply(console, sig);
      console.log("%cΦ(x) is Abramowitz–Stegun 26.2.17—real math, not a spoon. There is also no cake in this console. If you read code while drinking coffee, congratulations: you are statistically rare. drozgurural@gmail.com", "color:#64748b;");
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

  /* ---------- global quest tracker ---------- */
  const QUEST_KEY = "lab.quest.v2";
  const QUEST_KEYS = ["tg", "wm", "pol", "tmr", "gd"];
  let quest = { tg: false, wm: false, pol: false, tmr: false, gd: false };

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* noop */ }
  }
  function loadQuest() {
    const raw = safeStorageGet(QUEST_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      QUEST_KEYS.forEach((k) => { quest[k] = !!parsed[k]; });
    } catch (e) { /* noop */ }
  }
  function saveQuest() {
    safeStorageSet(QUEST_KEY, JSON.stringify(quest));
  }
  function completedQuestCount() {
    return QUEST_KEYS.reduce((acc, k) => acc + (quest[k] ? 1 : 0), 0);
  }
  function renderQuest(message) {
    const map = {
      tg: $('[data-role="quest-tg"]'),
      wm: $('[data-role="quest-wm"]'),
      pol: $('[data-role="quest-pol"]'),
      tmr: $('[data-role="quest-tmr"]'),
      gd: $('[data-role="quest-gd"]'),
    };
    QUEST_KEYS.forEach((k) => {
      if (!map[k]) return;
      map[k].textContent = quest[k] ? "Unlocked" : "Locked";
      map[k].setAttribute("aria-label", k + " status: " + (quest[k] ? "unlocked" : "locked"));
      const row = document.querySelector('[data-quest-item="' + k + '"]');
      if (row) row.classList.toggle("is-unlocked", !!quest[k]);
    });
    const total = $('[data-role="quest-total"]');
    if (total) total.textContent = completedQuestCount() + "/5";
    const msg = $('[data-role="quest-msg"]');
    if (msg) {
      if (message) msg.textContent = message;
      else if (completedQuestCount() === 5) msg.textContent = "All five solved. The simulation acknowledges your persistence. You may now brag in any lobby that is not legally binding.";
      else msg.textContent = "Complete five enrichment activities. Unlock badges. Disappoint nobody—especially not the eigenvalues.";
    }
  }
  function unlockQuest(key, message) {
    if (!Object.prototype.hasOwnProperty.call(quest, key)) return;
    if (quest[key]) return;
    quest[key] = true;
    saveQuest();
    const count = completedQuestCount();
    renderQuest(message || "Badge unlocked. The enrichment center is mildly proud.");
    labFxQuestCelebration();
    labFxMilestoneUnlock(count);
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

  /* one-sided Gaussian critical value z with Φ(z) = 1 − α (bisection on Φ) */
  function zForOneSidedAlpha(alpha) {
    var lo = 0, hi = 5, mid, i;
    var a = Math.max(1e-4, Math.min(0.24, parseFloat(alpha) || 0.05));
    var target = 1 - a;
    for (i = 0; i < 55; i++) {
      mid = (lo + hi) / 2;
      if (phi(mid) < target) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  /* ---------- global “arcade” feedback (combo, juice, haptics) ---------- */
  const FX_LS_JUICE = "lab.fx.juice";
  const FX_LS_HAPTIC = "lab.fx.haptic";
  let labFxCombo = 0;
  let labFxComboTimer = null;

  function labFxJuiceOn() {
    return document.documentElement.classList.contains("lab-juice-mode");
  }
  function labFxHapticOn() {
    const h = document.querySelector('[data-role="lab-haptic"]');
    return !!(h && h.checked);
  }
  function labFxBumpCombo(delta) {
    var d = delta == null ? 1 : delta;
    labFxCombo += d;
    var el = document.querySelector('[data-role="lab-combo-val"]');
    if (el) {
      el.textContent = String(labFxCombo);
      el.parentElement.classList.remove("lab-playbar__combo--pulse");
      void el.parentElement.offsetWidth;
      el.parentElement.classList.add("lab-playbar__combo--pulse");
      // Milestone bumps: 10, 25, 50 get extra celebration
      var milestones = [10, 25, 50, 100];
      if (milestones.indexOf(labFxCombo) !== -1 && labFxJuiceOn()) {
        labFxBuzz();
        labFxBuzz();
      }
    }
    if (labFxComboTimer) clearTimeout(labFxComboTimer);
    labFxComboTimer = setTimeout(function () {
      labFxCombo = Math.max(0, labFxCombo - 1);
      var c = document.querySelector('[data-role="lab-combo-val"]');
      if (c) c.textContent = String(labFxCombo);
    }, 3200);
  }
  function labFxSliderGlow(slider, intensity) {
    if (!slider) return;
    if (intensity > 0.7) {
      slider.classList.add("lab-control--sweet");
      slider.setAttribute("data-sweet-intensity", Math.min(1, intensity).toFixed(2));
    } else {
      slider.classList.remove("lab-control--sweet");
    }
  }
  function labFxApproachingZone(slider, intensity) {
    if (!slider || intensity <= 0.3) {
      slider.classList.remove("lab-control--approaching");
      return;
    }
    slider.classList.add("lab-control--approaching");
    slider.setAttribute("data-approach", Math.min(1, intensity).toFixed(2));
  }
  function labFxStreakPulse(el) {
    if (!el) return;
    el.classList.remove("lab-experiment__metric--streak-hit");
    void el.offsetWidth;
    el.classList.add("lab-experiment__metric--streak-hit");
  }
  function labFxMilestoneUnlock(questCount) {
    if (questCount <= 0 || questCount > 5) return;
    var msg = "";
    var emoji = "🎯";
    if (questCount === 1) { msg = "First unlock! The Architect notices."; emoji = "👁"; }
    else if (questCount === 2) { msg = "2 of 5. You're learning."; emoji = "🧠"; }
    else if (questCount === 3) { msg = "Halfway there!"; emoji = "🔥"; }
    else if (questCount === 4) { msg = "One more..."; emoji = "⚡"; }
    else if (questCount === 5) { msg = "ALL FIVE. You have conquered the Matrix of regret."; emoji = "👑"; }
    var toast = document.createElement("div");
    toast.className = "lab-toast lab-toast--milestone";
    toast.textContent = emoji + " " + msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 2800);
    if (labFxJuiceOn()) {
      labFxBuzz();
      labFxBuzz();
      labFxBuzz();
    }
  }
  function labFxQuestCelebration() {
    var q = document.querySelector(".lab-quest");
    if (q) {
      q.classList.remove("lab-quest--hit");
      void q.offsetWidth;
      q.classList.add("lab-quest--hit");
      setTimeout(function () { q.classList.remove("lab-quest--hit"); }, 520);
    }
    labFxBumpCombo(4);
    labFxBuzz();
    // Bonus haptics on quest unlock
    if (labFxHapticOn()) {
      setTimeout(() => labFxBuzz(), 100);
      setTimeout(() => labFxBuzz(), 200);
    }
  }
  function labFxBuzz() {
    if (!labFxHapticOn()) return;
    try {
      if (navigator.vibrate) navigator.vibrate([10, 35, 12]);
    } catch (e) { /* noop */ }
  }
  function labFxMiniConfetti(plot, count) {
    if (!plot || !labFxJuiceOn()) return;
    var n = count || 48; // Increased from 22 for more visual punch
    var M = { l: 52, t: 28 };
    var innerW = 400;
    var colors = ["#f59e0b", "#10b981", "#38bdf8", "#f43f5e", "#a78bfa", "#ec4899"];
    var i, cx = M.l + innerW * 0.72, cy = M.t + 40;
    var parts = [];
    for (i = 0; i < n; i++) {
      var angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      var speed = 4 + Math.random() * 5;
      parts.push({
        el: svg("circle", {
          cx: cx, cy: cy, r: 2.2 + Math.random() * 3,
          fill: colors[i % colors.length], opacity: "0.96",
        }, plot),
        x: cx, y: cy,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.5,
        vy: Math.sin(angle) * speed - 2 - Math.random() * 3.5,
        life: 45 + Math.floor(Math.random() * 25),
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 12,
      });
    }
    var frame = 0;
    function tick() {
      frame++;
      parts.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.96; // drag
        p.life -= 1;
        p.rot += p.rotV;
        p.el.setAttribute("cx", p.x.toFixed(1));
        p.el.setAttribute("cy", p.y.toFixed(1));
        p.el.setAttribute("opacity", String(Math.max(0, Math.min(1, p.life / 50))));
      });
      if (frame < 70) requestAnimationFrame(tick);
      else {
        parts.forEach(function (p) {
          if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        });
      }
    }
    requestAnimationFrame(tick);
  }

  function initLabPlaybar() {
    if (!document.getElementById("lab-playbar")) return;
    var juice = document.querySelector('[data-role="lab-juice"]');
    var hapt = document.querySelector('[data-role="lab-haptic"]');
    function syncJuice() {
      document.documentElement.classList.toggle("lab-juice-mode", !!(juice && juice.checked));
      try {
        if (juice) safeStorageSet(FX_LS_JUICE, juice.checked ? "1" : "0");
      } catch (e) { /* noop */ }
    }
    function syncHapt() {
      try {
        if (hapt) safeStorageSet(FX_LS_HAPTIC, hapt.checked ? "1" : "0");
      } catch (e) { /* noop */ }
    }
    try {
      if (juice) {
        var sj = safeStorageGet(FX_LS_JUICE);
        if (sj !== null) juice.checked = sj === "1";
      }
      if (hapt) {
        var sh = safeStorageGet(FX_LS_HAPTIC);
        if (sh !== null) hapt.checked = sh === "1";
      }
    } catch (e) { /* noop */ }
    syncJuice();
    if (juice) juice.addEventListener("change", syncJuice);
    if (hapt) hapt.addEventListener("change", syncHapt);
    document.addEventListener("input", function (e) {
      var t = e.target;
      if (!t || !t.matches || !t.matches("input[type=\"range\"]")) return;
      if (t.closest && t.closest(".lab-experiment")) labFxBumpCombo(1);
    }, true);
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
      turbo:    $('[data-role="tg-turbo"]', root),
      neonplot: $('[data-role="tg-neonplot"]', root),
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
      const turboMode = !!(refs.turbo && refs.turbo.checked);
      const coordinationTax = !!(refs.neonplot && refs.neonplot.checked);
      const effectiveP = clamp(p * (turboMode ? 0.88 : 1.0) + (coordinationTax ? 0.025 : 0), 0.001, 0.99);
      const strictDepth = n + (coordinationTax ? 1 : 0);
      const pNaive  = 1 - Math.pow(effectiveP, n);
      const pStrict = Math.pow(1 - effectiveP, strictDepth);
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
      if (effectiveP <= 0) minN99 = 1;
      else if (effectiveP >= 0.99) minN99 = Infinity;
      else minN99 = Math.ceil(Math.log(0.01) / Math.log(effectiveP));
      refs.minNVal.textContent = isFinite(minN99) ? minN99 : "\u221e";

      // Sweet spot detection + visual feedback
      const inSweetZone = p >= 0.10 && p <= 0.75 && isFinite(minN99) && n >= minN99 + (coordinationTax ? 1 : 0);
      
      // Slider glow: how close are we to sweet zone?
      const pCloseness = (p >= 0.10 && p <= 0.75) ? Math.min(1, Math.abs(effectiveP - 0.425) / 0.325 * 0.7) : 0; // closer to mid = better
      const nCloseness = (n >= minN99 && n <= 10) ? Math.min(1, 1 - (n - minN99) / (10 - minN99) * 0.3) : 0;
      labFxSliderGlow(refs.p, inSweetZone ? 1 : pCloseness * 0.5);
      labFxSliderGlow(refs.n, inSweetZone ? 1 : nCloseness * 0.5);
      labFxApproachingZone(refs.p, inSweetZone ? 0 : pCloseness);
      labFxApproachingZone(refs.n, inSweetZone ? 0 : nCloseness);
      currentP = effectiveP;
      
      if (refs.sweetTg) {
        refs.sweetTg.hidden = !inSweetZone;
        if (inSweetZone) {
          refs.sweetTg.textContent = "You found the operating point. At p = " + p.toFixed(2) + " and N = " + n + ", naive multi-send hits " + (pNaive*100).toFixed(1) + "% reliability. This is the regime Raft, Cassandra, and Bitcoin confirmation depth all live in. Strict-chain manages " + (pStrict*100).toFixed(1) + "% -- which is why two-phase commit has a blocking problem and Paxos does not. Reload the Matrix all you want; this inequality still holds.";
          unlockQuest("tg", "Consensus: you found a viable reality branch. The Architect sends regards.");
        }
      }

      // Animation speed: faster in sweet zone; turbo shrinks baseline
      const baseMs = turboMode ? 280 : 700;
      const sweetMs = turboMode ? 180 : 500;
      const newSpawnMs = inSweetZone ? sweetMs : baseMs;
      if (newSpawnMs !== spawnMs || inSweetZone !== lastSweetZone) {
        spawnMs = newSpawnMs;
        restartAnim();
      }
      lastSweetZone = inSweetZone;

      // Valley class for sweet zone styling
      if (refs.valley) {
        refs.valley.classList.toggle("lab-tg__valley--sweet", inSweetZone);
      }
      if (refs.plot && refs.neonplot) {
        refs.plot.classList.toggle("lab-plot--neon-sweet", inSweetZone && refs.neonplot.checked);
      }

      // Insight — branches on phase-space zone, anchored to production systems.
      let txt;
      if (p === 0)               txt = "p = 0. Congratulations, you have invented postal mail. The postman is honest, sober, and on time. Both protocols win 100%. For science.";
      else if (p > 0.84)         txt = "Loss this severe and surrender starts to look like the dominant strategy. Even naive multi-send falls below 1 in 100 wins. (TCP gives up around here too; this is when your phone says 'no internet' and the simulation gets honest.)";
      else if (n === 1)          txt = "At N = 1 the protocols coincide: a single send, no confirmation—like taking the blue pill and pretending handshakes do not exist. The interesting structure starts at N = 2.";
      else if (p < 0.05)         txt = "Low loss, both protocols win nearly always. Production-grade WAN. The trap is invisible here but it is still a trap, and it shows up at the tails.";
      else if (Math.abs(p - 0.5) < 0.005) txt = "p = 0.5. Entropy maxes out; the channel becomes a coin flip. Naive still wins by accumulating tries, same trick TCP uses on bad WiFi.";
      else if (p > 0.65)         txt = "At very high loss, naive multi-send pulls ahead by accumulating chances rather than depending on any one. That is the math every blockchain confirmation depth and every database read quorum runs on.";
      else if (delta > 0.6)      txt = "Delta > 60%: strict chain is silently bleeding. The clever-engineer instinct says 'add another confirmation round.' The mathematics is unimpressed. (This is why 2PC has been the cautionary tale since the 1980s.)";
      else if (delta > 0.3)      txt = "Delta > 30%: strict chain pays heavily for its caution. Naive multi-send is strictly better, same shape every retry-with-backoff and every blockchain confirmation depth uses.";
      else                       txt = "Naive multi-send dominates strict-chain for any p in (0,1) and N >= 2. Production distributed systems chose naive on purpose. The cake was also never on-chain.";
      refs.insight.textContent = txt;

      drawPlot(p, n);
    }

    // Randomize starting parameters on each refresh for replayability
    const randP = (0.25 + Math.random() * 0.45).toFixed(2);
    const randN = Math.floor(2 + Math.random() * 5);
    refs.p.value = randP;
    refs.n.value = randN;

    refs.p.addEventListener("input", update);
    refs.n.addEventListener("input", update);
    if (refs.turbo) refs.turbo.addEventListener("change", update);
    if (refs.neonplot) refs.neonplot.addEventListener("change", update);
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
      alpha:      $('[data-role="alpha"]', root),
      alphaVal:   $('[data-role="alpha-val"]', root),
      wmNeon:     $('[data-role="wm-neon"]', root),
      wmPop:      $('[data-role="wm-pop"]', root),
    };

    const SIGMA0 = 0.12;       // baseline measurement noise (fixed)

    /* per-cell detection probability; zcrit from nominal one-sided level α */
    function qDetect(eps, sigma, zcrit) {
      const sd = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      return phi(snr - zcrit);
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
      // Prefer a structured pattern, then pad to exactly k distinct cells (0..63).
      const kk = Math.max(1, Math.min(GRID_CELLS, k | 0));
      let best = KEY_PATTERNS[0],
        diff = Math.abs(KEY_PATTERNS[0].length - kk);
      for (const p of KEY_PATTERNS) {
        const d = Math.abs(p.length - kk);
        if (d < diff) {
          best = p;
          diff = d;
        }
      }
      const chosen = [];
      const used = new Set();
      for (let i = 0; i < best.length && chosen.length < kk; i++) {
        chosen.push(best[i]);
        used.add(best[i]);
      }
      for (let i = 0; i < GRID_CELLS && chosen.length < kk; i++) {
        if (!used.has(i)) {
          chosen.push(i);
          used.add(i);
        }
      }
      return chosen;
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
    /* Key-cell chroma: optional "neon" mode scales with per-cell detection power q(ε,σ,α)=Φ(SNR−z_α). */
    function valueToColor(v, isKey, q, neonEnabled) {
      let c = Math.max(0, Math.min(1, v));
      const hue   = 200 - c * 30;
      let   sat   = 60 + c * 20;
      let   light = 32 + c * 38;
      const qn = Math.max(0, Math.min(1, q));
      if (isKey && neonEnabled) {
        const boost = 8 + qn * 52;
        sat = Math.min(98, sat + boost);
        light = Math.max(18, light - (4 + qn * 16));
      } else if (isKey) {
        sat = Math.min(98, sat + 18);
        light = Math.max(22, light - 6);
      }
      return "hsl(" + hue.toFixed(0) + " " + sat.toFixed(0) + "% " + light.toFixed(0) + "%)";
    }
    let wmPopTimer = null;
    let wmUpdateSeq = 0;
    function buildGrid(eps, k, sigma, q, neonEnabled) {
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
        cell.style.background = valueToColor(v, keySet.has(i), q, neonEnabled);
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

      const zc = zForOneSidedAlpha(parseFloat(refs.alpha.value));

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

      // Reference curves (fixed k); current slider k is drawn on top in accent.
      const SAMPLES = 80;
      function pathForK(k) {
        let d = "";
        for (let i = 0; i <= SAMPLES; i++) {
          const sigma = (i / SAMPLES) * SIGMA_MAX;
          const q = qDetect(eps, sigma, zc);
          const det = aggregateDetect(q, k);
          const x = xFor(sigma),
            y = yFor(det);
          d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
        }
        return d;
      }
      K_CURVES.forEach((k) => {
        if (k === kCur) return;
        svg("path", {
          d: pathForK(k),
          class: "lab-plot__curve lab-plot__curve--wm",
        }, plot);
        const finalQ = qDetect(eps, SIGMA_MAX, zc);
        const finalDet = aggregateDetect(finalQ, k);
        const t = svg("text", {
          x: M.l + innerW + 10,
          y: yFor(finalDet) + 4,
          class: "lab-plot__legend-value lab-plot__legend-value--wm",
        }, plot);
        t.textContent = "k=" + k;
      });
      svg("path", {
        d: pathForK(kCur),
        class: "lab-plot__curve lab-plot__curve--wm lab-plot__curve--wm-current",
      }, plot);
      const curFinalQ = qDetect(eps, SIGMA_MAX, zc);
      const curFinalDet = aggregateDetect(curFinalQ, kCur);
      const curLabel = svg(
        "text",
        {
          x: M.l + innerW + 10,
          y: yFor(curFinalDet) + 4,
          class:
            "lab-plot__legend-value lab-plot__legend-value--wm lab-plot__legend-value--wm-current",
        },
        plot
      );
      curLabel.textContent = "k=" + kCur;

      // Vertical marker at current σ
      svg("line", {
        x1: xFor(sigmaCur), x2: xFor(sigmaCur),
        y1: yFor(0), y2: yFor(1),
        class: "lab-plot__marker-x",
      }, plot);

      // Marker dot at (σ, detection_for_current_k)
      const qCur = qDetect(eps, sigmaCur, zc);
      const detCur = aggregateDetect(qCur, kCur);
      svg("circle", {
        cx: xFor(sigmaCur), cy: yFor(detCur), r: 5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--wm",
      }, plot);
    }

    /* ---- Live update with tweened readouts ---- */
    let prev = { snr: 1.28, det: 0.32, fpr: 0 };
    let prevSweetWm = false;
    let prevEffectiveK = null;
    function wmMetricsJumpWorthy(prevDet, prevFpr, prevSw, prevK, det, fpr, sweet, effectiveK) {
      if (prevK !== effectiveK) return true;
      if (Math.abs(det - prevDet) >= 0.028) return true;
      if (Math.abs(fpr - prevFpr) >= 0.012) return true;
      if (sweet !== prevSw) return true;
      if ((prevDet < 0.5 && det >= 0.5) || (prevDet >= 0.5 && det < 0.5)) return true;
      if ((prevFpr <= 0.05 && fpr > 0.05) || (prevFpr > 0.05 && fpr <= 0.05)) return true;
      return false;
    }
    function update() {
      const prevDet = prev.det;
      const prevFpr = prev.fpr;
      const prevSw = prevSweetWm;
      const eps   = parseFloat(refs.eps.value);
      const k     = parseInt(refs.k.value, 10);
      const sigma = parseFloat(refs.sigma.value);
      const alphaSig = parseFloat(refs.alpha.value);
      const zc = zForOneSidedAlpha(alphaSig);
      refs.epsVal.textContent   = eps.toFixed(2);
      refs.kVal.textContent     = k;
      refs.sigmaVal.textContent = sigma.toFixed(2);
      if (refs.alphaVal) refs.alphaVal.textContent = alphaSig.toFixed(3);

      const sd  = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      const detectorBoost = (refs.wmNeon && refs.wmNeon.checked) ? -0.10 : 0.08;
      const effectiveZc = Math.max(0.01, zc + detectorBoost);
      const validationBoost = (refs.wmPop && refs.wmPop.checked) ? 2 : 0;
      const effectiveK = Math.min(64, k + validationBoost);
      const q   = qDetect(eps, sigma, effectiveZc);
      const det = aggregateDetect(q, effectiveK);
      const fpr = aggregateDetect(alphaSig, effectiveK);

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

      // Sweet spot: publishable operating point + visual feedback
      const inSweetWm = det >= 0.90 && fpr <= 0.05 && eps <= 0.25 && snr >= 1.0;
      const epsCloseness = Math.max(0, 1 - Math.abs(eps - 0.15) / 0.25); // 0.15 is optimal
      const kCloseness = Math.max(0, 1 - Math.abs(k - 12) / 24); // 12 is around optimal
      labFxSliderGlow(refs.eps, inSweetWm ? 1 : epsCloseness * 0.6);
      labFxSliderGlow(refs.k, inSweetWm ? 1 : kCloseness * 0.6);
      labFxApproachingZone(refs.eps, inSweetWm ? 0 : epsCloseness);
      labFxApproachingZone(refs.k, inSweetWm ? 0 : kCloseness);
      
      if (refs.sweetWm) {
        refs.sweetWm.hidden = !inSweetWm;
        if (inSweetWm) {
          refs.sweetWm.textContent = "You found the publishable operating point. Detection " + (det*100).toFixed(1) + "%, false-positive rate " + (fpr*100).toFixed(2) + "%, SNR " + snr.toFixed(2) + ". This is the regime from the 2024 IEEE Access paper: k = " + k + " cells at \u03b5 = " + eps.toFixed(2) + " survives fine-tuning noise up to \u03c3 = " + sigma.toFixed(2) + " while keeping downstream accuracy intact. Court-admissible. The cake remains non-admissible.";
          unlockQuest("wm", "Watermark: court-grade signal. Still no cake.");
        }
      }
      const neonEnabled = !!(refs.wmNeon && refs.wmNeon.checked);
      const shouldPulse = refs.wmPop && refs.wmPop.checked && wmUpdateSeq > 0 &&
        wmMetricsJumpWorthy(prevDet, prevFpr, prevSw, prevEffectiveK, det, fpr, inSweetWm, effectiveK);
      wmUpdateSeq++;
      prevSweetWm = inSweetWm;
      prevEffectiveK = effectiveK;

      let txt;
      if (eps < 0.04)             txt = "Epsilon this small puts the perturbation below the model's own noise floor. Even the verifier with the key cannot do much. This is not a failure; it is an enrichment opportunity.";
      else if (det > 0.995)       txt = "Detection saturated. The verifier wins by a landslide. Court-credible regime: the lawyers have evidence; the thief has homework. Still no cake.";
      else if (det > 0.9 && fpr < 0.1)
                                  txt = "On the operating frontier: over 90% detection, under 10% false-positive. The production-credible regime—the one a real provenance dispute can defend without bending spoons.";
      else if (det > 0.5 && k <= 4)
                                  txt = "Small key, marginal signal. Try doubling k. The gain from k = " + k + " to " + (k*2) + " comes from sqrt(k) SNR amplification.";
      else if (det < 0.15 && sigma > 0.3)
                                  txt = "Sigma at this level means the attacker has more noise budget than the watermark has signal. Time to grow k, or rethink epsilon. At this point a determined fine-tune attack succeeds—and blames the oracle.";
      else if (det < 0.2)         txt = "Watermark washed out. At this (epsilon, sigma) the attacker has effectively defeated detection. Raise epsilon or grow k. The simulation is disappointed but not surprised.";
      else                        txt = "k = " + k + " amplifies SNR by sqrt(k) which is approximately " + Math.sqrt(k).toFixed(2) + ". Detection scales with that, not with epsilon alone.";
      refs.insight.textContent = txt;

      buildGrid(eps, effectiveK, sigma, q, neonEnabled);
      if (eps > 0.25) refs.grid.classList.add('lab-wm__grid--glitch');
      else refs.grid.classList.remove('lab-wm__grid--glitch');
      /* Extra glow only when neon mode is on and q shows non-trivial per-cell power. */
      if (refs.wmNeon) refs.grid.classList.toggle("lab-wm__grid--neon", neonEnabled && q >= 0.08);
      if (shouldPulse) {
        refs.grid.classList.add("lab-wm__grid--pop");
        clearTimeout(wmPopTimer);
        wmPopTimer = setTimeout(function () {
          refs.grid.classList.remove("lab-wm__grid--pop");
        }, 360);
      }
      drawPlot(eps, k, sigma);
    }

    // Randomize starting parameters on each refresh for replayability
    const randEps = (0.12 + Math.random() * 0.20).toFixed(2);
    const randK = Math.floor(4 + Math.random() * 20);
    const randSigma = (0.05 + Math.random() * 0.15).toFixed(2);
    refs.eps.value = randEps;
    refs.k.value = randK;
    refs.sigma.value = randSigma;

    refs.eps.addEventListener("input", update);
    refs.k.addEventListener("input", update);
    refs.sigma.addEventListener("input", update);
    if (refs.alpha) refs.alpha.addEventListener("input", update);
    if (refs.wmNeon) refs.wmNeon.addEventListener("change", update);
    if (refs.wmPop) refs.wmPop.addEventListener("change", update);
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
      tmrStrip:        $('[data-role="tmr-strip"]', root),
      hypersim:        $('[data-role="tmr-hypersim"]', root),
      glow:            $('[data-role="tmr-glow"]', root),
    };

    function tmrEffectiveRho(rho) {
      const fastWindow = !!(refs.hypersim && refs.hypersim.checked);
      const diverseVoter = !!(refs.glow && refs.glow.checked);
      let effective = rho;
      if (fastWindow) effective *= 0.88;
      if (diverseVoter) effective *= 0.65;
      return Math.max(0, Math.min(1, effective));
    }

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
    let tmrTickMs = 600;
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
      const rhoEff = tmrEffectiveRho(currentRho);
      let fails;
      if (Math.random() < rhoEff) {
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
        if (refs.glow && refs.glow.checked && refs.tmrStrip) {
          refs.tmrStrip.classList.remove("lab-tmr-strip--pulse");
          void refs.tmrStrip.offsetWidth;
          refs.tmrStrip.classList.add("lab-tmr-strip--pulse");
          setTimeout(function () {
            if (refs.tmrStrip) refs.tmrStrip.classList.remove("lab-tmr-strip--pulse");
          }, 520);
        }
      }
    }
    function startSim() {
      if (simTimer) return;
      simTimer = setInterval(tick, tmrTickMs);
      tick();
    }
    function restartSimInterval() {
      if (simTimer) { clearInterval(simTimer); simTimer = null; }
      simTimer = setInterval(tick, tmrTickMs);
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

      const rhoEff = tmrEffectiveRho(rho);
      const pSys = pSysFail(q, rhoEff);
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

      // Sweet spot: well inside the safe operating envelope + visual feedback
      const inSweetTmr = rhoBE !== null && rhoEff < rhoBE * 0.5 && q < 0.10 && gain >= 10;
      const overBreakeven = rhoBE !== null && rhoEff > rhoBE && rhoBE < 0.99;
      
      // Slider glow feedback for TMR
      const qCloseness = Math.max(0, 1 - Math.abs(q - 0.035) / 0.10); // 0.035 is good target
      const rhoCloseness = rhoBE !== null ? Math.max(0, 1 - Math.abs(rhoEff - rhoBE * 0.3) / (rhoBE * 0.5)) : 0;
      labFxSliderGlow(refs.q, inSweetTmr ? 1 : qCloseness * 0.6);
      labFxSliderGlow(refs.rho, inSweetTmr ? 1 : rhoCloseness * 0.6);
      labFxApproachingZone(refs.q, inSweetTmr ? 0 : qCloseness);
      labFxApproachingZone(refs.rho, inSweetTmr ? 0 : rhoCloseness);

      if (refs.sweetTmr) {
        refs.sweetTmr.hidden = !inSweetTmr;
        if (inSweetTmr) {
          refs.sweetTmr.textContent = "You found the safe operating envelope. At q = " + q.toFixed(3) + " and effective \u03c1 = " + rhoEff.toFixed(2) + ", TMR delivers " + gain.toFixed(1) + "x reliability gain. The break-even correlation for this failure rate is \u03c1 \u2248 " + rhoBE.toFixed(2) + ". Stay below it and three diverse computers are worth every euro. Cross it and you have an Ariane 5. For your safety, please assume the brace position for correlated bugs.";
          unlockQuest("tmr", "TMR: redundancy that is not three copies of the same bug. Refreshing.");
        }
      }

      // Override insight text when over break-even
      let txt;
      if (rhoBE === null) {
        txt = "At this q, even perfect independence cannot reach a 10x gain. The best case is " + (q / pSysFail(q, 0)).toFixed(1) + "x, so the break-even readout is N/A rather than a fake threshold.";
      } else if (overBreakeven) {
        txt = "Warning: effective \u03c1 = " + rhoEff.toFixed(2) + " exceeds the break-even threshold of " + rhoBE.toFixed(2) + " for this failure rate. TMR is now delivering less than 10x gain. The hardware cost is no longer justified by the reliability improvement. This is the regime the Ariane 5 lived in.";
      } else if (rhoEff >= 0.95) {
        txt = "Rho near 1: redundancy with full correlation is not redundancy, it is a single channel three times—Agent Smith cubed, but in RTL. The Ariane 5 had redundant flight computers running the exact same inertial reference software. They both crashed in the same millisecond.";
      } else if (rhoEff < 0.05) {
        txt = "Independent faults. TMR delivers cubic reliability gain. This is the regime DO-178C lives in, the one your A320 cruises through every flight. Pleasant. Unexciting. Correct.";
      } else if (rhoEff < 0.5) {
        txt = "Some correlation, some gain. The ratio of TMR to single-channel is shrinking faster than rho alone suggests. Common-cause failures are doing real damage.";
      } else {
        txt = "Correlated faults eat the cubic gain. TMR still helps but only by a constant factor, not the roughly 1/(3q) you get under independence. Diverse-versions programming exists for exactly this reason.";
      }
      refs.insight.textContent = txt;

      drawPlot(q, rhoEff);
    }

    // Randomize starting parameters on each refresh for replayability
    const randQ = (0.02 + Math.random() * 0.12).toFixed(3);
    const randRho = (Math.random() * 0.3).toFixed(2);
    refs.q.value = randQ;
    refs.rho.value = randRho;

    refs.q.addEventListener("input", update);
    refs.rho.addEventListener("input", update);
    if (refs.hypersim) {
      refs.hypersim.addEventListener("change", function () {
        tmrTickMs = refs.hypersim.checked ? 200 : 600;
        restartSimInterval();
        update();
      });
    }
    if (refs.glow) {
      refs.glow.addEventListener("change", function () {
        update();
      });
    }
    update();
    startSim();
  }

  /* ============================================================================
     PUZZLE 4 · Gradient Descent Lab
     ============================================================================ */
  function initGradientDescentLab() {
    const root = document.getElementById("lab-gd");
    if (!root) return;

    const $gd = (role) => root.querySelector('[data-role="' + role + '"]');
    const refs = {
      lr:        $gd("lr"),
      mom:       $gd("mom"),
      lrVal:     $gd("lr-val"),
      momVal:    $gd("mom-val"),
      trainBtn:  $gd("train-btn"),
      plot:      $gd("plot-gd"),
      noise:     $gd("noise"),
      gdTurbo:   $gd("gd-turbo"),
      gdRainbow: $gd("gd-rainbow"),
      epochVal:  $gd("epoch-val"),
      lossVal:   $gd("loss-val"),
      velVal:    $gd("vel-val"),
      insight:   $gd("insight-gd"),
    };

    const PW = 640, PH = 260;
    const M = { l: 40, r: 40, t: 20, b: 20 };
    const innerW = PW - M.l - M.r;
    const innerH = PH - M.t - M.b;

    const landscapes = [
      {
        name: "Classic regret valley",
        startX: -2.4,
        f: function (x) { return Math.pow(x, 4)/4.0 - Math.pow(x, 3)/3.0 - Math.pow(x, 2) + 2; },
        df: function (x) { return Math.pow(x, 3) - Math.pow(x, 2) - 2*x; },
      },
      {
        name: "Budget committee valley",
        startX: -2.15,
        f: function (x) { return 0.22*Math.pow(x, 4) + 0.15*Math.pow(x, 3) - 1.35*Math.pow(x, 2) + 1.8; },
        df: function (x) { return 0.88*Math.pow(x, 3) + 0.45*Math.pow(x, 2) - 2.70*x; },
      },
      {
        name: "Reviewer-2 canyon",
        startX: -2.25,
        f: function (x) { return 0.18*Math.pow(x, 4) - 0.55*Math.pow(x, 3) - 0.65*Math.pow(x, 2) + 0.12*x + 2.1; },
        df: function (x) { return 0.72*Math.pow(x, 3) - 1.65*Math.pow(x, 2) - 1.30*x + 0.12; },
      }
    ];

    const X_MIN = -2.5, X_MAX = 3.2;
    const Y_MIN = -1, Y_MAX = 8;

    let activeLandscape = landscapes[0];
    let f = activeLandscape.f;
    let df = activeLandscape.df;
    let startX = activeLandscape.startX;
    let TARGET_X = 0;

    function findGlobalMinX() {
      let bestX = X_MIN;
      let bestY = Number.POSITIVE_INFINITY;
      for (let i = 0; i <= 600; i++) {
        const x = X_MIN + (X_MAX - X_MIN) * (i / 600);
        const y = f(x);
        if (y < bestY) {
          bestY = y;
          bestX = x;
        }
      }
      return bestX;
    }

    let landscapeIndex = -1;
    function pickLandscape() {
      if (landscapes.length <= 1) {
        landscapeIndex = 0;
      } else {
        var ni;
        do {
          ni = Math.floor(Math.random() * landscapes.length);
        } while (ni === landscapeIndex);
        landscapeIndex = ni;
      }
      activeLandscape = landscapes[landscapeIndex];
      f = activeLandscape.f;
      df = activeLandscape.df;
      startX = activeLandscape.startX;
      TARGET_X = findGlobalMinX();
    }
    pickLandscape();
    
    function xFor(x) { return M.l + ((x - X_MIN) / (X_MAX - X_MIN)) * innerW; }
    function yFor(y) { return M.t + (1 - (y - Y_MIN) / (Y_MAX - Y_MIN)) * innerH; }

    function drawCurve() {
      let d = "";
      for (let i = 0; i <= 100; i++) {
        const x = X_MIN + (X_MAX - X_MIN) * (i / 100);
        const y = f(x);
        d += (i === 0 ? "M" : "L") + xFor(x).toFixed(1) + " " + yFor(y).toFixed(1) + " ";
      }
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#94a3b8"); // theme muted text color
      path.setAttribute("stroke-width", "2");
      refs.plot.appendChild(path);
    }
    
    if (!refs.lr || !refs.plot || !refs.trainBtn || !refs.insight) return;

    function applyRandomControls() {
      const randomLr = (0.008 + Math.random() * 0.028).toFixed(3);
      const randomMom = (Math.random() * 0.7).toFixed(2);
      refs.lr.value = randomLr;
      refs.mom.value = randomMom;
      if (refs.lrVal) refs.lrVal.textContent = parseFloat(refs.lr.value).toFixed(3);
      if (refs.momVal) refs.momVal.textContent = parseFloat(refs.mom.value).toFixed(2);
    }
    applyRandomControls();

    refs.lr.addEventListener("input", () => {
      refs.lrVal.textContent = parseFloat(refs.lr.value).toFixed(3);
      // Slider glow for GD: good zone is lr~0.012, mom~0.5
      const lr = parseFloat(refs.lr.value);
      const lrCloseness = Math.max(0, 1 - Math.abs(lr - 0.012) / 0.035);
      labFxSliderGlow(refs.lr, lrCloseness * 0.7);
      labFxApproachingZone(refs.lr, lrCloseness * 0.8);
    });
    refs.mom.addEventListener("input", () => {
      refs.momVal.textContent = parseFloat(refs.mom.value).toFixed(2);
      // Slider glow for GD momentum
      const mom = parseFloat(refs.mom.value);
      const momCloseness = Math.max(0, 1 - Math.abs(mom - 0.5) / 0.7);
      labFxSliderGlow(refs.mom, momCloseness * 0.7);
      labFxApproachingZone(refs.mom, momCloseness * 0.8);
    });
    if (refs.noise) refs.noise.addEventListener("input", function () { renderParticle(); });
    if (refs.gdRainbow) refs.gdRainbow.addEventListener("change", syncGdTrailStyle);

    function gdEpochDelay() {
      return (refs.gdTurbo && refs.gdTurbo.checked) ? 11 : 30;
    }

    function ensureTrailGradient() {
      if (!refs.plot || refs.plot.querySelector('[id="lab-gd-trail-grad"]')) return;
      var defs = document.createElementNS(SVG, "defs");
      var lg = document.createElementNS(SVG, "linearGradient");
      lg.setAttribute("id", "lab-gd-trail-grad");
      lg.setAttribute("gradientUnits", "userSpaceOnUse");
      lg.setAttribute("x1", "0");
      lg.setAttribute("y1", "0");
      lg.setAttribute("x2", "640");
      lg.setAttribute("y2", "0");
      ["#22d3ee", "#a78bfa", "#fb7185", "#fbbf24", "#34d399"].forEach(function (col, i, arr) {
        var st = document.createElementNS(SVG, "stop");
        st.setAttribute("offset", (i / (arr.length - 1) * 100).toFixed(1) + "%");
        st.setAttribute("stop-color", col);
        lg.appendChild(st);
      });
      defs.appendChild(lg);
      refs.plot.insertBefore(defs, refs.plot.firstChild);
    }

    function syncGdTrailStyle() {
      if (!trailPath) return;
      var rainbow = refs.gdRainbow && refs.gdRainbow.checked;
      if (rainbow) {
        trailPath.setAttribute("stroke", "url(#lab-gd-trail-grad)");
        trailPath.setAttribute("stroke-width", "3");
      } else {
        trailPath.setAttribute("stroke", "#38bdf8");
        trailPath.setAttribute("stroke-width", "2.5");
      }
    }

    function triggerCongrats(el, on) {
      if (on && labFxJuiceOn()) labFxMiniConfetti(el, 30);
    }

    let animationId = null;
    let epochTimeoutId = null;

    function stopMotion() {
      running = false;
      if (animationId != null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
      if (epochTimeoutId != null) {
        clearTimeout(epochTimeoutId);
        epochTimeoutId = null;
      }
    }

    let particle = null;
    let trailPath = null;
    let trail = [];

    let currentX = startX;
    let velocity = 0;
    let epoch = 0;
    let running = false;

    function initPlot() {
      while(refs.plot.firstChild) refs.plot.removeChild(refs.plot.firstChild);
      drawCurve();
      ensureTrailGradient();
      trailPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      trailPath.setAttribute("stroke-dasharray", "4 4");
      trailPath.setAttribute("fill", "none");
      trailPath.setAttribute("stroke", "#38bdf8"); // bright color
      refs.plot.appendChild(trailPath);
      syncGdTrailStyle();

      particle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      particle.setAttribute("r", 6);
      particle.setAttribute("fill", "#0284c7");
      refs.plot.appendChild(particle);
      reset();
    }

    function renderTrail() {
      if (trail.length === 0) return;
      let d = "M" + xFor(trail[0]).toFixed(1) + " " + yFor(f(trail[0])).toFixed(1) + " ";
      for(let i=1; i<trail.length; i++) {
         d += "L" + xFor(trail[i]).toFixed(1) + " " + yFor(f(trail[i])).toFixed(1) + " ";
      }
      trailPath.setAttribute("d", d);
    }

    function reset() {
      currentX = startX;
      velocity = 0;
      epoch = 0;
      running = false;
      trail = [currentX];
      renderTrail();
      updateReadout();
      renderParticle();
      
      // Update actual button text content cleanly depending on layout
      const span = refs.trainBtn.querySelector('.lab-btn__text');
      if (span) span.textContent = "Train!";
      else refs.trainBtn.textContent = "Train!";
      
      refs.trainBtn.classList.remove('is-running');
      refs.insight.innerHTML = "Set parameters and hit <strong>Train</strong>. New test chamber—sorry, <em>challenge</em>: <strong>" + activeLandscape.name + "</strong>.";
      triggerCongrats(refs.plot, false);
    }
    
    function updateReadout() {
      refs.epochVal.textContent = epoch;
      refs.lossVal.textContent = f(currentX).toFixed(2);
      refs.velVal.textContent = velocity.toFixed(3);
    }
    
    function renderParticle() {
      var jx = 0, jy = 0;
      if (refs.noise) {
        var nz = parseFloat(refs.noise.value) || 0;
        if (nz > 0) {
          jx = nz * 0.035 * Math.sin(epoch * 0.95);
          jy = nz * 0.022 * Math.cos(epoch * 0.72);
        }
      }
      particle.setAttribute("cx", xFor(currentX) + jx);
      particle.setAttribute("cy", yFor(f(currentX)) + jy);
    }
    
    function doEpoch() {
      if (!running) return;
      const lr = parseFloat(refs.lr.value);
      const mom = parseFloat(refs.mom.value);
      
      const grad = df(currentX);
      const schedule = (refs.gdRainbow && refs.gdRainbow.checked)
        ? (1 + 0.16 * Math.sin(epoch * 0.18))
        : 1;
      velocity = mom * velocity - lr * grad * schedule;
      currentX += velocity;
      epoch++;
      trail.push(currentX);
      
      updateReadout();
      renderParticle();
      renderTrail();
      
      if (currentX < X_MIN || currentX > X_MAX) {
        refs.insight.textContent = "💥 Exploding gradients! The ball flew off the manifold—there is no spoon, only NaN. Lower the learning rate.";
        running = false;
      } else if (epoch > 500) {
        refs.insight.textContent = "⏳ Training timed out (500 epochs). The Matrix reloaded the same epoch; try higher learning rate or momentum.";
        running = false;
      } else if (Math.abs(velocity) < 1e-4 && Math.abs(grad) < 1e-3) {
        if (Math.abs(currentX - TARGET_X) < 0.12) {
          refs.insight.textContent = "⭐ Global minimum reached on " + activeLandscape.name + ". Congratulations: you followed the white rabbit to the bottom of the bowl.";
          unlockQuest("gd", "Gradient descent: global minimum. There was a spoon all along—it was just a basin.");
          triggerCongrats(refs.plot, true);
        } else {
           refs.insight.textContent = "💀 Stuck in a local minimum. Déjà vu: gradient zeroed out in the saddle point of despair. Increase momentum.";
        }
        running = false;
      }
      
      if (running) {
        animationId = requestAnimationFrame(function () {
          animationId = null;
          epochTimeoutId = setTimeout(function () {
            epochTimeoutId = null;
            doEpoch();
          }, gdEpochDelay());
        });
      } else {
        const span = refs.trainBtn.querySelector('.lab-btn__text');
        if (span) span.textContent = "Reset";
        else refs.trainBtn.textContent = "Reset";
        refs.trainBtn.classList.remove('is-running');
      }
    }
    
    refs.trainBtn.addEventListener("click", () => {
      const btnText = refs.trainBtn.querySelector('.lab-btn__text') ? refs.trainBtn.querySelector('.lab-btn__text').textContent : refs.trainBtn.textContent;
      if (running || btnText.trim() === "Reset") {
        stopMotion();
        reset();
      } else {
        running = true;
        refs.trainBtn.classList.add('is-running');
        const span = refs.trainBtn.querySelector('.lab-btn__text');
        if (span) span.textContent = "Stop";
        else refs.trainBtn.textContent = "Stop";
        refs.insight.textContent = "Training... (watch the loss bend reality in real time)";
        doEpoch();
      }
    });

    root.addEventListener("click", (ev) => {
      const reroll = ev.target.closest('[data-role="gd-reroll-btn"]');
      if (!reroll || !root.contains(reroll)) return;
      ev.preventDefault();
      stopMotion();
      pickLandscape();
      applyRandomControls();
      initPlot();
    });

    initPlot();
  }

  /* ============================================================================
     PUZZLE 3.5 · Proof-of-Learning Lab
     ============================================================================ */
  function initProofOfLearningLab() {
    const root = document.getElementById("lab-pol");
    if (!root) return;

    const refs = {
      lr:       $('[data-role="pol-lr"]', root),
      bs:       $('[data-role="pol-bs"]', root),
      noise:    $('[data-role="pol-noise"]', root),
      trainBtn: $('[data-role="pol-train-btn"]', root),
      lrVal:    $('[data-role="pol-lr-val"]', root),
      bsVal:    $('[data-role="pol-bs-val"]', root),
      noiseVal: $('[data-role="pol-noise-val"]', root),
      epochVal: $('[data-role="pol-epoch-val"]', root),
      lossVal:  $('[data-role="pol-loss-val"]', root),
      uniqueVal: $('[data-role="pol-unique-val"]', root),
      fakeVal:  $('[data-role="pol-fake-val"]', root),
      scoreVal: $('[data-role="pol-score-val"]', root),
      badgeVal: $('[data-role="pol-badge-val"]', root),
      streakVal: $('[data-role="pol-streak-val"]', root),
      plot:     $('[data-role="plot-pol"]', root),
      insight:  $('[data-role="insight-pol"]', root),
      polTurbo: $('[data-role="pol-turbo"]', root),
      polMega:  $('[data-role="pol-mega"]', root),
    };

    if (!refs.plot || !refs.trainBtn || !refs.lr || !refs.bs || !refs.noise) return;

    const BATCH_SIZES = [8, 16, 32, 64, 128, 256, 512, 1024];
    const MAX_EPOCHS = 100;
    const M = { l: 52, r: 40, t: 28, b: 40 };
    const innerW = 640 - M.l - M.r;
    const innerH = 260 - M.t - M.b;
    const FAKE_LINE = 6.4;

    let trainingCurve = [];
    let running = false;
    let animationId = null;
    let polEpochTid = null;
    let streak = 0;

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function normBand(v, min, max, spread) {
      if (v >= min && v <= max) return 1;
      const d = v < min ? (min - v) : (v - max);
      return clamp(1 - d / spread, 0, 1);
    }

    function celebrate(plot, mega) {
      const particles = [];
      const cx = M.l + innerW * 0.75;
      const cy = M.t + 30;
      const colors = ["#f59e0b", "#10b981", "#38bdf8", "#f43f5e", "#a78bfa"];
      const count = mega ? 88 : 32; // Doubled for more dopamine!

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2; // Radial burst
        const speed = 3.5 + Math.random() * 4.5;
        const p = svg("circle", {
          cx: cx,
          cy: cy,
          r: 1.5 + Math.random() * 3.2,
          fill: colors[i % colors.length],
          opacity: "0.98",
        }, plot);
        particles.push({
          el: p,
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 1.2,
          vy: Math.sin(angle) * speed - 1.5 - Math.random() * 2.5,
          life: 50 + Math.floor(Math.random() * 30),
          maxLife: 80,
        });
      }

      let frame = 0;
      function tick() {
        frame++;
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.22; // gravity
          p.vx *= 0.98; // drag
          p.life -= 1;
          p.el.setAttribute("cx", p.x.toFixed(1));
          p.el.setAttribute("cy", p.y.toFixed(1));
          const opacity = Math.max(0, Math.min(1, p.life / 50));
          p.el.setAttribute("opacity", String(opacity));
        });

        if (frame < 80) {
          requestAnimationFrame(tick);
        } else {
          particles.forEach((p) => {
            if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
          });
        }
      }
      requestAnimationFrame(tick);
      
      // Visual ripple pulse on the plot
      if (plot) {
        const ripple = svg("circle", {
          cx: cx, cy: cy, r: 8,
          fill: "none", stroke: "#10b981",
          "stroke-width": "2", opacity: "0.8",
        }, plot);
        let rframe = 0;
        const maxRipple = 60;
        function rippleTick() {
          rframe++;
          ripple.setAttribute("r", (8 + rframe * 1.5).toFixed(1));
          ripple.setAttribute("opacity", String(Math.max(0, 1 - rframe / maxRipple)));
          if (rframe < maxRipple) requestAnimationFrame(rippleTick);
          else ripple.remove();
        }
        requestAnimationFrame(rippleTick);
      }
    }

    function computeLoss(epoch, alpha, batchSize, noise) {
      const speed = alpha * 24 * Math.sqrt(batchSize / 64);
      const baseline = 8.2 * Math.exp(-(speed * epoch) / 11) + 0.24 + noise * 2.0;
      const wobble = noise * (64 / batchSize) *
        (0.65 * Math.sin(0.37 * epoch) + 0.35 * (Math.random() - 0.5));
      const warmupPenalty = epoch < 8 ? (8 - epoch) * 0.03 : 0;
      return clamp(baseline + wobble + warmupPenalty, 0.12, 10);
    }

    function xFor(epoch) { return M.l + (epoch / MAX_EPOCHS) * innerW; }
    function yFor(loss) { return M.t + (1 - Math.min(1, loss / 10)) * innerH; }

    function drawPlot() {
      const plot = refs.plot;
      while (plot.firstChild) plot.removeChild(plot.firstChild);

      // Title
      const title = svg("text", {
        x: M.l, y: M.t - 12, class: "lab-plot__title",
      }, plot);
      title.textContent = "Proof-of-Learning: find the Gold zone (still no cake)";

      // Y-axis gridlines
      [0, 2.5, 5, 7.5, 10].forEach((v) => {
        svg("line", {
          x1: M.l, x2: M.l + innerW,
          y1: yFor(v), y2: yFor(v),
          class: "lab-plot__grid",
        }, plot);
      });

      // Y-axis labels
      [0, 2.5, 5, 7.5, 10].forEach((v) => {
        svg("text", {
          x: M.l - 12, y: yFor(v) + 4,
          class: "lab-plot__label",
          "text-anchor": "end",
        }, plot).textContent = v.toFixed(1);
      });

      // X-axis labels
      [0, 25, 50, 75, 100].forEach((e) => {
        svg("line", {
          x1: xFor(e), y1: M.t + innerH,
          x2: xFor(e), y2: M.t + innerH + 4,
          stroke: "#ccc", "stroke-width": 1,
        }, plot);
        svg("text", {
          x: xFor(e), y: M.t + innerH + 16,
          class: "lab-plot__label",
          "text-anchor": "middle",
        }, plot).textContent = e;
      });

      // Axes
      svg("line", { x1: M.l, y1: M.t, x2: M.l, y2: M.t + innerH, stroke: "#333", "stroke-width": 1.5 }, plot);
      svg("line", { x1: M.l, y1: M.t + innerH, x2: M.l + innerW, y2: M.t + innerH, stroke: "#333", "stroke-width": 1.5 }, plot);

      // Flat fake-line reference: "downloaded weights, no real training run"
      svg("line", {
        x1: M.l, y1: yFor(FAKE_LINE),
        x2: M.l + innerW, y2: yFor(FAKE_LINE),
        stroke: "#ef4444", "stroke-width": 2, "stroke-dasharray": "4,4", opacity: 0.6,
      }, plot);
      svg("text", {
        x: M.l + innerW + 8, y: yFor(FAKE_LINE) + 4,
        class: "lab-plot__label", fill: "#ef4444", "font-size": "11px",
      }, plot).textContent = "Downloaded model (no training)";

      // Training curve path
      if (trainingCurve.length > 1) {
        let d = "";
        trainingCurve.forEach((pt, i) => {
          const x = xFor(pt.epoch), y = yFor(pt.loss);
          d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
        });
        svg("path", {
          d: d.trim(),
          fill: "none",
          stroke: "#10b981",
          "stroke-width": 2.5,
          "stroke-linecap": "round",
          "stroke-linejoin": "round",
        }, plot);
      }

      // Current point
      if (trainingCurve.length > 0) {
        const last = trainingCurve[trainingCurve.length - 1];
        svg("circle", {
          cx: xFor(last.epoch),
          cy: yFor(last.loss),
          r: 4,
          fill: "#10b981",
        }, plot);
      }
    }

    function updateSliderDisplay() {
      const lr = parseFloat(refs.lr.value);
      const bs = parseInt(refs.bs.value, 10);
      const noise = parseFloat(refs.noise.value);
      
      refs.lrVal.textContent = lr.toFixed(3);
      const bsIdx = clamp(bs - 1, 0, BATCH_SIZES.length - 1);
      refs.bsVal.textContent = BATCH_SIZES[Math.min(bsIdx, BATCH_SIZES.length - 1)];
      refs.noiseVal.textContent = noise.toFixed(2);
      
      // Add slider glow feedback: optimal zone is α~0.012, B~128, ζ~0.05
      const lrCloseness = Math.max(0, 1 - Math.abs(lr - 0.012) / 0.010);
      const bsCloseness = Math.max(0, 1 - Math.abs(bs - 128) / 100);
      const noiseCloseness = Math.max(0, 1 - Math.abs(noise - 0.05) / 0.06);
      
      labFxSliderGlow(refs.lr, lrCloseness * 0.7);
      labFxSliderGlow(refs.bs, bsCloseness * 0.7);
      labFxSliderGlow(refs.noise, noiseCloseness * 0.7);
      
      labFxApproachingZone(refs.lr, lrCloseness * 0.8);
      labFxApproachingZone(refs.bs, bsCloseness * 0.8);
      labFxApproachingZone(refs.noise, noiseCloseness * 0.8);
    }

    function updateMetrics(epoch, loss) {
      refs.epochVal.textContent = epoch;
      refs.lossVal.textContent = loss.toFixed(3);

      const uniqueness = clamp((FAKE_LINE - loss) / FAKE_LINE, 0, 1);
      const uniquePercent = Math.round(uniqueness * 100);
      refs.uniqueVal.textContent = uniquePercent + "% unique";

      const isFake = epoch > 10 && uniqueness > 0.45;
      refs.fakeVal.textContent = isFake ? "✓ Not plausible as fake" : "—";
    }

    function evaluateRun(alpha, batchSize, noise) {
      if (trainingCurve.length < 6) return;

      const losses = trainingCurve.map((p) => p.loss);
      const finalLoss = losses[losses.length - 1];

      let decreasing = 0;
      let absSecondDiff = 0;
      for (let i = 1; i < losses.length; i++) {
        if (losses[i] <= losses[i - 1]) decreasing++;
      }
      for (let i = 2; i < losses.length; i++) {
        absSecondDiff += Math.abs(losses[i] - 2 * losses[i - 1] + losses[i - 2]);
      }

      const monotonic = decreasing / (losses.length - 1);
      const roughness = absSecondDiff / Math.max(1, losses.length - 2);
      const smoothness = clamp(1 - roughness / 0.20, 0, 1);
      const distanceFromFake = clamp((FAKE_LINE - finalLoss) / FAKE_LINE, 0, 1);

      const lrFit = normBand(alpha, 0.008, 0.018, 0.02);
      const bsFit = normBand(batchSize, 64, 256, 512);
      const noiseFit = normBand(noise, 0.02, 0.08, 0.12);
      const paramFit = (lrFit + bsFit + noiseFit) / 3;

      const hardMode = !!(refs.polMega && refs.polMega.checked);
      const score = Math.round(100 * (
        0.30 * monotonic +
        0.25 * smoothness +
        0.25 * distanceFromFake +
        0.20 * paramFit
      ) * (hardMode ? 0.92 : 1));

      let badge = "Needs more science";
      const goldCutoff = hardMode ? 92 : 88;
      const silverCutoff = hardMode ? 79 : 75;
      const bronzeCutoff = hardMode ? 64 : 60;
      if (score >= goldCutoff) badge = "Gold Proof";
      else if (score >= silverCutoff) badge = "Silver Proof";
      else if (score >= bronzeCutoff) badge = "Bronze Proof";

      refs.scoreVal.textContent = String(score);
      refs.badgeVal.textContent = badge;
      refs.fakeVal.textContent = (distanceFromFake > 0.45 && monotonic > 0.65)
        ? "✓ Not plausible as fake"
        : "⚠ Too easy to spoof";

      if (score >= goldCutoff) {
        streak += 1;
        celebrate(refs.plot, !!(refs.polMega && refs.polMega.checked));
        labFxStreakPulse(refs.streakVal);
        refs.insight.innerHTML = "🏆 <strong>Gold Proof unlocked.</strong> Credible training regime; the Oracle would approve. Hint zone: α in [0.008, 0.018], B in [64, 256], ζ in [0.02, 0.08]." + (hardMode ? " Hard mode was on, so the detector was stricter." : "");
        unlockQuest("pol", "Proof-of-Learning: Gold Proof. You chose... wisely.");
      } else {
        streak = 0;
        refs.insight.innerHTML = "No badge yet. The simulation suggests smoother descent and stronger separation from the fake flatline. Try α near 0.012, B around 128, ζ around 0.05. We will be monitoring your failure for science.";
      }
      refs.streakVal.textContent = String(streak);
    }

    function reset() {
      running = false;
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
      if (polEpochTid) { clearTimeout(polEpochTid); polEpochTid = null; }
      trainingCurve = [];
      updateMetrics(0, FAKE_LINE);
      refs.scoreVal.textContent = "0";
      refs.badgeVal.textContent = "—";
      refs.streakVal.textContent = String(streak);
      refs.fakeVal.textContent = "—";
      drawPlot();
      refs.trainBtn.classList.remove('is-running');
      refs.trainBtn.querySelector('.lab-btn__text').textContent = "Train!";
      refs.insight.innerHTML = "Adjust sliders and hit <strong>Train!</strong>. Goal: <strong>Gold Proof</strong> (score ≥ 88). There is no spoon—only a loss curve that either trained or downloaded its personality.";
    }

    function doEpoch(epoch, alpha, batchSize, noise) {
      if (!running) return;

      const loss = computeLoss(epoch, alpha, batchSize, noise);
      trainingCurve.push({ epoch, loss });
      updateMetrics(epoch, loss);
      drawPlot();

      if (epoch < MAX_EPOCHS) {
        animationId = requestAnimationFrame(function () {
          animationId = null;
          var ms = refs.polTurbo && refs.polTurbo.checked ? 11 : 36;
          polEpochTid = setTimeout(function () {
            polEpochTid = null;
            doEpoch(epoch + 1, alpha, batchSize, noise);
          }, ms);
        });
      } else {
        running = false;
        refs.trainBtn.classList.remove('is-running');
        refs.trainBtn.querySelector('.lab-btn__text').textContent = "Reset";
        evaluateRun(alpha, batchSize, noise);
      }
    }

    refs.trainBtn.addEventListener("click", () => {
      const btnText = refs.trainBtn.querySelector('.lab-btn__text').textContent;
      if (btnText.trim() === "Reset" || running) {
        if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
        if (polEpochTid) { clearTimeout(polEpochTid); polEpochTid = null; }
        reset();
      } else {
        running = true;
        refs.trainBtn.classList.add('is-running');
        refs.trainBtn.querySelector('.lab-btn__text').textContent = "Training...";
        refs.insight.textContent = "Running experiment. Trajectory smells like real training, or like someone chose the blue pill and a flat loss line.";

        const alpha = parseFloat(refs.lr.value);
        const bsIdx = clamp(parseInt(refs.bs.value, 10) - 1, 0, BATCH_SIZES.length - 1);
        const batchSize = BATCH_SIZES[Math.min(bsIdx, BATCH_SIZES.length - 1)];
        const noise = parseFloat(refs.noise.value);

        trainingCurve = [];
        doEpoch(0, alpha, batchSize, noise);
      }
    });

    refs.lr.addEventListener("input", updateSliderDisplay);
    refs.bs.addEventListener("input", updateSliderDisplay);
    refs.noise.addEventListener("input", updateSliderDisplay);

    // Randomize starting parameters on each refresh for replayability
    const randAlpha = (0.008 + Math.random() * 0.010).toFixed(4);
    const randBatch = Math.floor(32 + Math.random() * 200);
    const randNoise = (0.02 + Math.random() * 0.06).toFixed(3);
    refs.lr.value = randAlpha;
    refs.bs.value = randBatch;
    refs.noise.value = randNoise;

    updateSliderDisplay();
    reset();
  }

  /* ----------------------------------------------------------------- bootstrap */
  function boot() {
    loadQuest();
    renderQuest();
    initLabPlaybar();
    if(typeof initTwoGeneralsLab === "function") initTwoGeneralsLab();
    if(typeof initVerifierLab === "function") initVerifierLab();
    if(typeof initWatermarkLab === "function") initWatermarkLab();
    if(typeof initProofOfLearningLab === "function") initProofOfLearningLab();
    if(typeof initTMRLab === "function") initTMRLab();
    if(typeof initGradientDescentLab === "function") initGradientDescentLab();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
