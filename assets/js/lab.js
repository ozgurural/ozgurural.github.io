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
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

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
  const reducedMotion = (function () {
    try { return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
    catch (e) { return false; }
  })();
  function tweenNumber(el, from, to, ms, fmt) {
    if (!el) return;
    const prev = tweenStore.get(el);
    if (prev) {
      if (prev.rafId) cancelAnimationFrame(prev.rafId);
      if (prev.fallbackId) clearTimeout(prev.fallbackId);
    }
    // No motion / no change → write the destination value directly.
    if (reducedMotion || Math.abs(to - from) < 1e-6) {
      el.textContent = fmt(to);
      tweenStore.delete(el);
      return;
    }
    const start = performance.now();
    let firedAnyFrame = false;
    const entry = { rafId: 0, fallbackId: 0 };
    function step(now) {
      firedAnyFrame = true;
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      el.textContent = fmt(v);
      if (t < 1) {
        entry.rafId = requestAnimationFrame(step);
      } else {
        el.textContent = fmt(to);
        if (entry.fallbackId) clearTimeout(entry.fallbackId);
        tweenStore.delete(el);
      }
    }
    entry.rafId = requestAnimationFrame(step);
    // Safety net: if rAF is paused (background tab, throttled) the visual
    // tween can stall mid-stream — make sure the destination value always
    // shows up even if no frame ever fires.
    entry.fallbackId = setTimeout(function () {
      if (!firedAnyFrame) el.textContent = fmt(to);
      else if (parseFloat(el.textContent) !== parseFloat(fmt(to))) el.textContent = fmt(to);
      tweenStore.delete(el);
    }, ms + 250);
    tweenStore.set(el, entry);
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
      else msg.textContent = "Complete five enrichment activities. Unlock badges. Disappoint nobody, especially not the eigenvalues.";
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

  // Confetti/celebration on actual game wins is purposeful feedback, so
  // it stays enabled. The "juice mode" and "haptic" user toggles are
  // gone — they were just gating the celebration with extra clicks.
  function labFxJuiceOn() { return true; }
  function labFxHapticOn() { return false; }
  function labFxBumpCombo() { /* no-op since the combo counter UI was removed */ }
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

  /* ---------- Stanley-Parable-style "endings" ----------
     Every Run lands you in a named ending. Multiple 5★ paths exist
     per lab, plus a handful of named failure modes. Unlocks persist
     in localStorage so the player can collect them across visits. */
  const ENDINGS_KEY = "lab.endings.v1";
  function loadEndings() {
    try { return JSON.parse(safeStorageGet(ENDINGS_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  function recordEnding(id) {
    const e = loadEndings();
    const newly = !e[id];
    if (newly) {
      e[id] = { at: Date.now() };
      safeStorageSet(ENDINGS_KEY, JSON.stringify(e));
    }
    return newly;
  }
  function countEndings(prefix, total) {
    const e = loadEndings();
    const got = Object.keys(e).filter((k) => k.indexOf(prefix) === 0).length;
    return { got: got, total: total };
  }
  function renderEndingsTally(host, prefix, total) {
    if (!host) return;
    const c = countEndings(prefix, total);
    host.textContent = "Endings " + c.got + " / " + total;
    host.classList.toggle("lab-endings--mastered", c.got >= total);
  }

  /* ---------- Verdict banner ----------
     Big headline result above the metrics. Replaces the player having
     to read four numbers to figure out if they won. State is one of
     "win" (beat the scenario), "miss" (close but didn't), "fail"
     (way off), or "pending" (no run yet). */
  function setVerdict(host, head, sub, state) {
    if (!host) return;
    const headEl = host.querySelector(".lab-experiment__verdict-head");
    const subEl = host.querySelector(".lab-experiment__verdict-sub");
    if (headEl) headEl.textContent = head;
    if (subEl) subEl.textContent = sub || "";
    host.classList.remove("lab-experiment__verdict--win", "lab-experiment__verdict--miss", "lab-experiment__verdict--fail", "lab-experiment__verdict--pending");
    host.classList.add("lab-experiment__verdict--" + (state || "pending"));
  }

  /* ---------- Progressive hint system ----------
     After a few runs that don't earn 4★+, the lab whispers a gentle
     hint near the lab's insight line. Doesn't spoil the 5★ zone —
     just nudges the player in the right direction so they don't
     give up. Per-lab attempt counters live in closures. */
  function makeHintTracker(insightEl, hints) {
    let attempts = 0;
    let bestStars = 0;
    return function recordRun(stars) {
      attempts++;
      if (stars > bestStars) bestStars = stars;
      if (bestStars >= 4) return; // doing fine; no hints
      const idx = Math.min(hints.length - 1, Math.max(0, attempts - 3));
      if (attempts >= 3 && hints[idx]) {
        const hintLine = "<br><span class=\"lab-experiment__hint\">💡 " + hints[idx] + "</span>";
        if (insightEl && insightEl.innerHTML.indexOf("lab-experiment__hint") === -1) {
          insightEl.innerHTML = insightEl.innerHTML + hintLine;
        }
      }
    };
  }

  /* ---------- 5★ sweet-zone band painter ----------
     Wraps a <input type="range"> in a track shell so we can paint the
     small 5★ sweet zone behind the thumb. The band shows the value
     range that the lab's scoring function rewards with 5 stars, so
     the player has a visible target. min/max are read from the input. */
  function paintSweetZone(input, sweetMin, sweetMax, label) {
    if (!input || input.dataset.zoneBuilt) return;
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    if (!isFinite(min) || !isFinite(max) || max <= min) return;
    const startPct = ((sweetMin - min) / (max - min)) * 100;
    const endPct = ((sweetMax - min) / (max - min)) * 100;
    if (endPct <= 0 || startPct >= 100) return;
    // Build the shell: <span.track> <span.zone> <span.zone-label> </span>
    const parent = input.parentNode;
    const track = document.createElement("span");
    track.className = "lab-control__track";
    const zone = document.createElement("span");
    zone.className = "lab-control__zone";
    zone.setAttribute("data-active", "1");
    zone.style.setProperty("--sweet-start", Math.max(0, startPct).toFixed(1) + "%");
    zone.style.setProperty("--sweet-end", Math.min(100, endPct).toFixed(1) + "%");
    if (label) {
      const lbl = document.createElement("span");
      lbl.className = "lab-control__zone-label";
      lbl.textContent = label;
      zone.appendChild(lbl);
    }
    parent.insertBefore(track, input);
    track.appendChild(zone);
    track.appendChild(input);
    input.dataset.zoneBuilt = "1";
  }

  /* ---------- Star rating widget (per-lab live scoring) ----------
     Renders 5 stars + a tier label. Score is in [0,5] and quantizes
     to whole stars. Each lab passes a tier name from its own scale. */
  const STAR_TIERS = [
    "Off-target",   // 0 — way off
    "Sketchy",      // 1 — barely working
    "Workable",     // 2 — getting there
    "Sharp",        // 3 — good run
    "Pro-grade",    // 4 — really good
    "Frontier 🏆",  // 5 — nailed it
  ];
  function setStars(host, score, customTier, opts) {
    if (!host) return;
    opts = opts || {};
    const header = opts.header || "Live score";
    const pending = !!opts.pending;
    const s = Math.max(0, Math.min(5, Number(score) || 0));
    const full = pending ? 0 : Math.round(s);
    const tier = customTier || STAR_TIERS[full];
    if (!host.dataset.built) {
      host.classList.add("lab-stars");
      host.innerHTML = "";
      const headEl = document.createElement("span");
      headEl.className = "lab-stars__head";
      host.appendChild(headEl);
      const pipsEl = document.createElement("span");
      pipsEl.className = "lab-stars__pips";
      for (let i = 0; i < 5; i++) {
        const pip = document.createElement("span");
        pip.className = "lab-stars__pip";
        pip.setAttribute("aria-hidden", "true");
        pip.innerHTML = '<svg viewBox="0 0 20 20"><path d="M10 1.5 12.59 7.36 18.9 8.06l-4.7 4.32 1.31 6.22L10 15.34 4.49 18.6l1.31-6.22-4.7-4.32 6.31-.7Z"/></svg>';
        pipsEl.appendChild(pip);
      }
      host.appendChild(pipsEl);
      const lbl = document.createElement("span");
      lbl.className = "lab-stars__tier";
      host.appendChild(lbl);
      host.dataset.built = "1";
    }
    const headEl = host.querySelector(".lab-stars__head");
    if (headEl) headEl.textContent = header;
    host.classList.toggle("lab-stars--pending", pending);
    const pips = host.querySelectorAll(".lab-stars__pip");
    for (let j = 0; j < pips.length; j++) {
      pips[j].classList.toggle("is-full", !pending && j < full);
    }
    const lblEl = host.querySelector(".lab-stars__tier");
    if (lblEl) {
      lblEl.textContent = tier;
      lblEl.setAttribute("data-tier", pending ? "pending" : String(full));
    }
    host.setAttribute("data-stars", pending ? "pending" : String(full));
    host.setAttribute("aria-label", pending ? tier : (full + " of 5 stars, " + tier));
    if (!pending) {
      const prev = parseInt(host.dataset.prevStars || "-1", 10);
      if (full > prev && prev >= 0) {
        host.classList.remove("lab-stars--up");
        void host.offsetWidth;
        host.classList.add("lab-stars--up");
      }
      host.dataset.prevStars = String(full);
    } else {
      host.dataset.prevStars = "-1";
    }
  }

  function labFxMilestoneUnlock(questCount) {
    if (questCount <= 0 || questCount > 5) return;
    var title = "", msg = "", emoji = "🎯", subtitle = "";
    if (questCount === 1) {
      title = "First Strike"; 
      msg = "The Architect notices your persistence."; 
      emoji = "👁";
      subtitle = "1 of 5 Unlocked";
    } else if (questCount === 2) {
      title = "Building Momentum";
      msg = "You're learning the language of matrices.";
      emoji = "🧠";
      subtitle = "2 of 5 Unlocked";
    } else if (questCount === 3) {
      title = "Halfway There";
      msg = "The systems begin to sing in your hands.";
      emoji = "🔥";
      subtitle = "3 of 5 Unlocked";
    } else if (questCount === 4) {
      title = "One More Challenge";
      msg = "The final quest awaits. You're close.";
      emoji = "⚡";
      subtitle = "4 of 5 Unlocked";
    } else if (questCount === 5) {
      title = "MASTER OF SYSTEMS";
      msg = "You have conquered the Matrix of regret. All systems yield to you.";
      emoji = "👑";
      subtitle = "5 of 5 Complete";
    }
    var toast = document.createElement("div");
    toast.className = "lab-toast lab-toast--milestone lab-toast--m" + questCount;
    var titleEl = document.createElement("div");
    titleEl.className = "lab-toast__title";
    titleEl.textContent = emoji + " " + title;
    var msgEl = document.createElement("div");
    msgEl.className = "lab-toast__message";
    msgEl.textContent = msg;
    var subEl = document.createElement("div");
    subEl.className = "lab-toast__subtitle";
    subEl.textContent = subtitle;
    toast.appendChild(titleEl);
    toast.appendChild(msgEl);
    toast.appendChild(subEl);
    document.body.appendChild(toast);
    labFxMilestoneChime(questCount);
    setTimeout(function () { toast.remove(); }, 3800);
    if (labFxJuiceOn()) {
      var times = [50, 100, 150][Math.min(2, questCount - 1)];
      for (var i = 0; i < questCount; i++) {
        setTimeout(function () { labFxBuzz(); }, i * times);
      }
    }
  }
  function labFxMilestoneChime(milestone) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      
      // Escalating frequency based on milestone
      const frequencies = [880, 990, 1100, 1210, 1320];
      const startFreq = frequencies[Math.min(4, milestone - 1)];
      const endFreq = startFreq * 0.75;
      
      o.frequency.setValueAtTime(startFreq, ctx.currentTime);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      
      // Longer sweep for higher milestones
      const duration = 0.2 + (milestone * 0.05);
      o.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration + 0.2);
      
      setTimeout(() => { try { o.stop(); ctx.close(); } catch (e) {} }, (duration + 0.3) * 1000);
    } catch (e) { /* audio unavailable */ }
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

  // The arcade playbar (Juice/Haptic toggles + Combo counter) was
  // decoration that distracted from the actual learning. Removed.

  /* ============================================================================
     PUZZLE 1 · Two Generals' Lab
     ============================================================================ */
  function initTwoGeneralsLab() {
    const root = document.getElementById("lab-tg");
    if (!root) return;

    const refs = {
      n:        $('[data-role="n"]', root),
      nVal:     $('[data-role="n-val"]', root),
      pDisplay: $('[data-role="p-display"]', root),
      naive:    $('[data-role="naive-val"]', root),
      strict:   $('[data-role="strict-val"]', root),
      sweetTg:  $('[data-role="sweet-spot-tg"]', root),
      insight:  $('[data-role="insight"]', root),
      plot:     $('[data-role="plot"]', root),
      valley:   $('[data-role="valley"]', root),
      levels:   $('[data-role="tg-levels"]', root),
      verdict:  $('[data-role="verdict-tg"]', root),
      endingsTally: $('[data-role="endings-tg"]', root),
      starsTg:  $('[data-role="stars-tg"]', root),
    };
    // Seven named endings — Stanley Parable style. Same math under the
    // hood; different choices of N (relative to the scenario's minimum)
    // land you in different stories. Storm unlocks a special path.
    const TG_ENDINGS_TOTAL = 7;
    function tgClassifyEnding(n, minN, pNaive, goal, stars, scenarioName) {
      const beat = pNaive >= goal;
      // N=1 lands in the prayer ending regardless of whether you somehow won.
      if (n <= 1 && !beat) return {
        id: "tg-prayer", icon: "🙏", name: "The Single Shot",
        state: "fail",
        sub: "You sent one message and hoped the universe was kind. The universe was unmoved.",
      };
      // Special ending for beating the hardest scenario clean.
      if (stars === 5 && scenarioName === "Storm") return {
        id: "tg-storm", icon: "🌪️", name: "The Storm Survivor",
        state: "win",
        sub: "You routed messages through a hurricane on the minimum retries. Unreasonable composure under entropy.",
      };
      // 5★ — exact minimum N for the scenario.
      if (stars === 5) return {
        id: "tg-minimalist", icon: "📏", name: "The Minimalist",
        state: "win",
        sub: "Found the exact number of retries. Pleasant. Unexciting. Correct.",
      };
      // 4★ — beat the goal with a small safety margin.
      if (beat && n <= minN + 2) return {
        id: "tg-insurance", icon: "🛡️", name: "The Insurance Buyer",
        state: "win",
        sub: "One or two extra tries, just in case. Engineering wisdom: redundancy is cheap and the universe is not.",
      };
      // Beat the goal but way overspent.
      if (beat) return {
        id: "tg-bureaucrat", icon: "👔", name: "The Bureaucrat",
        state: "win",
        sub: "Far more retries than needed. Everyone arrived. The CFO has questions and the network has a headache.",
      };
      // Tantalizingly close — within 15% of the goal.
      if (pNaive >= goal * 0.85) return {
        id: "tg-cliff", icon: "🤏", name: "The Cliff",
        state: "miss",
        sub: "So close you can hear the dinner reservation expiring. One more try might have done it.",
      };
      // Way under.
      return {
        id: "tg-dreamer", icon: "💔", name: "The Dreamer",
        state: "fail",
        sub: "The messages dissolved into the channel. Two-phase commit could not save you.",
      };
    }

    // Read the currently selected scenario.
    function tgCurrentLevel() {
      const active = refs.levels && refs.levels.querySelector(".lab-level--active");
      return active || (refs.levels && refs.levels.querySelector(".lab-level"));
    }
    function tgCurrentP() {
      const btn = tgCurrentLevel();
      return btn ? parseFloat(btn.dataset.p) : 0.40;
    }
    function tgCurrentGoal() {
      const btn = tgCurrentLevel();
      return btn ? parseFloat(btn.dataset.goal) : 0.99;
    }
    function tgCurrentMinN() {
      const btn = tgCurrentLevel();
      return btn ? parseInt(btn.dataset.minN, 10) : 6;
    }
    function tgCurrentScenarioName() {
      const btn = tgCurrentLevel();
      return btn ? (btn.dataset.name || "scenario") : "scenario";
    }

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
      // Spawn one immediately so slider changes register visually
      // without waiting for the next interval tick.
      spawnDot();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { stopAnim(); } else { startAnim(); }
    });

    /* ---- Live update with tweened readouts ---- */
    let prev = { naive: 1 - Math.pow(0.4, 3), strict: Math.pow(0.6, 3) };
    function update() {
      const p = tgCurrentP();
      const n = parseInt(refs.n.value, 10);
      currentP = p;
      refs.nVal.textContent = n;
      refs.pDisplay.textContent = p.toFixed(2);
      const effectiveP = clamp(p, 0.001, 0.99);
      const strictDepth = n;
      const pNaive  = 1 - Math.pow(effectiveP, n);
      const pStrict = Math.pow(1 - effectiveP, strictDepth);

      const pct = (v) => (v * 100).toFixed(1) + "%";
      tweenNumber(refs.naive,  prev.naive,  pNaive,  260, pct);
      tweenNumber(refs.strict, prev.strict, pStrict, 260, pct);
      prev = { naive: pNaive, strict: pStrict };

      $$('.lab-experiment__metric', root).forEach(pulseRow);

      // Minimum N for naive to hit 99% at current p (used for sweet-spot detection only)
      let minN99;
      if (effectiveP <= 0) minN99 = 1;
      else if (effectiveP >= 0.99) minN99 = Infinity;
      else minN99 = Math.ceil(Math.log(0.01) / Math.log(effectiveP));

      // Sweet spot: hit 99% reliability with the minimum tries.
      const inSweetZone = isFinite(minN99) && n >= minN99 && pNaive >= 0.99;
      const nCloseness = (n >= minN99 && n <= 10) ? Math.min(1, 1 - (n - minN99) / (10 - minN99) * 0.3) : 0;
      labFxSliderGlow(refs.n, inSweetZone ? 1 : nCloseness * 0.5);
      labFxApproachingZone(refs.n, inSweetZone ? 0 : nCloseness);
      currentP = effectiveP;

      if (refs.sweetTg) {
        refs.sweetTg.hidden = !inSweetZone;
        if (inSweetZone) {
          refs.sweetTg.textContent = "🎯 You cracked the " + tgCurrentScenarioName() + " scenario! At " + (p*100).toFixed(0) + "% signal loss, just " + n + " tries gets you " + (pNaive*100).toFixed(1) + "% reliability. This is the trick TCP uses every time your phone reconnects on bad WiFi.";
          unlockQuest("tg", "Consensus: you beat the scenario.");
        }
      }

      // Animation speed: faster in sweet zone
      const baseMs = 700;
      const sweetMs = 500;
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

      // Regime annotations — pitched at someone who'll appreciate the
      // production parallels (TCP, quorum systems, blockchain depth)
      // without needing them spelled out.
      let txt;
      if (p === 0)               txt = "Perfect channel. Both protocols are tautologically correct. Reality, you may have noticed, is not a perfect channel.";
      else if (p > 0.84)         txt = "At this loss rate even retry-heavy strategies bleed. Useful regime: this is the math behind your phone's 'no service' fallback and the reason TCP has a give-up timer.";
      else if (n === 1)          txt = "N=1 makes both strategies coincide. The interesting structure starts at N≥2, where retries compound favorably and chains compound the opposite direction.";
      else if (p < 0.05)         txt = "Production-grade WAN territory. Both protocols look perfect, until you're at scale and the tails matter. This is where two-phase commit looks attractive and then ruins your Monday.";
      else if (Math.abs(p - 0.5) < 0.005) txt = "Channel entropy maxed. Retry still wins by accumulating tries: same trick TCP uses on weak Wi-Fi, same reason Bitcoin needs confirmation depth.";
      else if (p > 0.65)         txt = "High-loss regime. Naive multi-send dominates because one success suffices; chain protocols lose multiplicatively. Every quorum system and every retry-with-backoff lives on this inequality.";
      else if (delta > 0.6)      txt = "Chain strategy is hemorrhaging. The instinct to 'just add another confirmation step' makes it worse: this is the cautionary tale that gave us Paxos.";
      else if (delta > 0.3)      txt = "Retry-with-backoff territory. Same shape as TCP, blockchain confirmation depth, and read-quorum tuning. Distributed systems chose this side on purpose.";
      else                       txt = "Naive multi-send dominates strict-chain for every p ∈ (0, 1) and N ≥ 2. The asymmetry is structural, not incidental.";
      refs.insight.textContent = txt;

      // Star grade — per-scenario. 5★ only at the minimum N that beats
      // the scenario's target. Brute force still earns 3★. Failures step
      // down gracefully.
      const tgGoal = tgCurrentGoal();
      const tgMinN = tgCurrentMinN();
      let tgStars = 0, tgTier = "Off-target";
      if (pNaive >= tgGoal && n <= tgMinN)        { tgStars = 5; tgTier = "Frontier 🏆"; }
      else if (pNaive >= tgGoal && n <= tgMinN+2) { tgStars = 4; tgTier = "Pro-grade"; }
      else if (pNaive >= tgGoal)                  { tgStars = 3; tgTier = "Sharp"; }
      else if (pNaive >= tgGoal * 0.90)           { tgStars = 2; tgTier = "Workable"; }
      else if (pNaive >= tgGoal * 0.65)           { tgStars = 1; tgTier = "Sketchy"; }
      setStars(refs.starsTg, tgStars, tgTier, { header: "Live score" });
      tgHint(tgStars);

      // Stanley-Parable ending classification.
      const scenario = tgCurrentScenarioName();
      const goalPct = (tgGoal * 100).toFixed(tgGoal >= 0.99 ? 1 : 0);
      const yourPct = (pNaive * 100).toFixed(1);
      const ending = tgClassifyEnding(n, tgMinN, pNaive, tgGoal, tgStars, scenario);
      const newlyUnlocked = recordEnding(ending.id);
      const newTag = newlyUnlocked ? " · NEW ENDING" : "";
      const stats = " (" + yourPct + "% at " + n + " " + (n === 1 ? "try" : "tries") + ", target " + goalPct + "%)";
      setVerdict(refs.verdict,
        ending.icon + " " + ending.name + " ending" + newTag,
        ending.sub + " " + stats,
        ending.state);
      renderEndingsTally(refs.endingsTally, "tg-", TG_ENDINGS_TOTAL);

      drawPlot(p, n);
    }

    // Aim → Fire → Score.
    refs.runBtn = $('[data-role="tg-run-btn"]', root);
    let tgRevealed = false;
    const tgHint = makeHintTracker(refs.insight, [
      "If you keep missing 99%, try raising the number of tries.",
      "Even at 65% signal loss, 7 tries gets you above 99%. The math is wild.",
      "5★ means hitting 99% with the fewest tries possible for the scenario.",
    ]);

    function tgSliderDisplay() {
      const n = parseInt(refs.n.value, 10);
      refs.nVal.textContent = n;
      refs.pDisplay.textContent = tgCurrentP().toFixed(2);
    }
    function tgPendReadout(msg) {
      tgRevealed = false;
      refs.naive.textContent = "…";
      refs.strict.textContent = "…";
      refs.insight.textContent = msg || "Pick a scenario, choose your strategy, then hit Run experiment.";
      if (refs.sweetTg) refs.sweetTg.hidden = true;
      setStars(refs.starsTg, 0, "Press Run to score", { header: "Run grade", pending: true });
      const goalPct = (tgCurrentGoal() * 100).toFixed(1);
      const scenario = tgCurrentScenarioName();
      setVerdict(refs.verdict,
        "🎯 Goal: " + goalPct + "% chance the message gets through",
        msg || "Scenario: " + scenario + " · pick the number of retries · hit Run experiment.",
        "pending");
      root.classList.add("lab-experiment--pending");
      root.classList.remove("lab-experiment--revealed");
    }
    function tgCommitRun() {
      if (!refs.runBtn) return;
      const btnText = refs.runBtn.querySelector('.lab-btn__text');
      refs.runBtn.classList.add("is-running");
      refs.runBtn.disabled = true;
      if (btnText) btnText.textContent = "Running…";
      const prevSpawnMs = spawnMs;
      spawnMs = 220;
      restartAnim();
      setTimeout(function () {
        spawnMs = prevSpawnMs;
        restartAnim();
        refs.runBtn.classList.remove("is-running");
        refs.runBtn.disabled = false;
        if (btnText) btnText.textContent = "Run again";
        tgRevealed = true;
        root.classList.remove("lab-experiment--pending");
        root.classList.add("lab-experiment--revealed");
        update();
      }, 1100);
    }

    function tgOnSlider() {
      tgSliderDisplay();
      if (tgRevealed) {
        tgPendReadout("New strategy. Hit Run experiment to see if you cracked it.");
      }
      currentP = tgCurrentP();
      drawPlot(currentP, parseInt(refs.n.value, 10));
    }
    refs.n.addEventListener("input", tgOnSlider);

    // Level picker — clicking a scenario sets the active state and pends.
    if (refs.levels) {
      refs.levels.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".lab-level");
        if (!btn || !refs.levels.contains(btn)) return;
        refs.levels.querySelectorAll(".lab-level").forEach(function (b) {
          b.classList.remove("lab-level--active");
        });
        btn.classList.add("lab-level--active");
        tgOnSlider();
      });
    }

    if (refs.runBtn) refs.runBtn.addEventListener("click", tgCommitRun);

    tgSliderDisplay();
    tgPendReadout();
    drawPlot(tgCurrentP(), parseInt(refs.n.value, 10));
    renderEndingsTally(refs.endingsTally, "tg-", TG_ENDINGS_TOTAL);
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
      epsVal:     $('[data-role="eps-val"]', root),
      kVal:       $('[data-role="k-val"]', root),
      grid:       $('[data-role="grid"]', root),
      plot:       $('[data-role="plot-wm"]', root),
      det:        $('[data-role="det-val"]', root),
      fpr:        $('[data-role="fpr-val"]', root),
      sweetWm:    $('[data-role="sweet-spot-wm"]', root),
      insight:    $('[data-role="insight-wm"]', root),
      levels:     $('[data-role="wm-levels"]', root),
      verdict:    $('[data-role="verdict-wm"]', root),
      endingsTally: $('[data-role="endings-wm"]', root),
      starsWm:    $('[data-role="stars-wm"]', root),
    };
    // Thief noise + per-scenario target both come from the active level.
    function wmCurrentLevel() {
      const active = refs.levels && refs.levels.querySelector(".lab-level--active");
      return active || (refs.levels && refs.levels.querySelector(".lab-level"));
    }
    function wmCurrentSigma() {
      const btn = wmCurrentLevel();
      return btn ? parseFloat(btn.dataset.sigma) : 0.15;
    }
    function wmCurrentGoalDet() {
      const btn = wmCurrentLevel();
      return btn ? parseFloat(btn.dataset.goalDet) : 0.90;
    }
    function wmCurrentEpsMax() {
      const btn = wmCurrentLevel();
      return btn ? parseFloat(btn.dataset.epsMax) : 0.18;
    }
    function wmCurrentThiefName() {
      const btn = wmCurrentLevel();
      return btn ? (btn.dataset.name || "thief") : "thief";
    }
    const FIXED_ALPHA = 0.05;

    // Eight named endings. Three 5★ paths, one 4★, four failure modes.
    // Collect them all across thieves to "master" the watermark lab.
    const WM_ENDINGS_TOTAL = 8;
    function wmClassifyEnding(eps, k, det, goalDet, epsMax, stars, modelOK) {
      // 5★ paths — three substantively different ways to catch the thief
      if (stars === 5 && eps <= 0.12 && k >= 18) return {
        id: "wm-ninja", icon: "🥷", name: "The Ninja",
        state: "win",
        sub: "Caught the {thiefName} with marks so subtle they couldn't scrub what they didn't see. {detPct}% confidence.",
      };
      if (stars === 5 && eps >= 0.16 && k <= 12) return {
        id: "wm-brander", icon: "🎨", name: "The Brander",
        state: "win",
        sub: "Bold and focused; your signature survived the disguise intact. {detPct}% confidence.",
      };
      if (stars === 5) return {
        id: "wm-engineer", icon: "📐", name: "The Engineer",
        state: "win",
        sub: "The textbook play. {detPct}% confidence at moderate ε and k. Quietly perfect.",
      };
      // 4★ — beat the goal but wasn't optimal
      if (stars === 4) return {
        id: "wm-defender", icon: "🛡️", name: "The Defender",
        state: "win",
        sub: "Caught them with hardware to spare. Slightly inelegant. {detPct}% confidence.",
      };
      // Failure modes (named)
      if (det >= goalDet && !modelOK) return {
        id: "wm-showoff", icon: "🤡", name: "The Showoff",
        state: "miss",
        sub: "Caught them. Wrecked the model. You won the case and lost the patient.",
      };
      if (eps <= 0.06) return {
        id: "wm-whisper", icon: "👻", name: "The Whisper",
        state: "fail",
        sub: "Your signature was so subtle it convinced even itself it didn't exist. {detPct}% confidence.",
      };
      if (k <= 3) return {
        id: "wm-loner", icon: "😴", name: "The Loner",
        state: "fail",
        sub: "Few marks, one chance. The {thiefName} laughs. {detPct}% confidence.",
      };
      // Catch-all: a respectable attempt that didn't quite land
      return {
        id: "wm-attempt", icon: "🌫️", name: "The Vanishing",
        state: "miss",
        sub: "Got {detPct}%, needed {goalPct}%. The signal walked into the noise and didn't come back.",
      };
    }

    const SIGMA0 = 0.12;       // baseline measurement noise (fixed)

    /* per-cell detection probability; zcrit from nominal one-sided level α */
    function qDetect(eps, sigma, zcrit) {
      const sd = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      return phi(snr - zcrit);
    }
    /* Aggregate detection — proper z-test on the sum of k cells. This is
       the textbook way to detect weak signals across many measurements:
       the test statistic has SNR √k times the per-cell SNR. False alarms
       stay at α; detection climbs with √k. (The earlier majority-vote
       version was wrong for sub-50% per-cell signals — increasing k
       didn't help.) */
    function aggregateDetectZ(eps, sigma, k, zcrit) {
      const sd = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      return phi(snr * Math.sqrt(k) - zcrit);
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

      const zc = zForOneSidedAlpha(FIXED_ALPHA);

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
          const det = aggregateDetectZ(eps, sigma, k, zc);
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
        const finalDet = aggregateDetectZ(eps, SIGMA_MAX, k, zc);
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
      const curFinalDet = aggregateDetectZ(eps, SIGMA_MAX, kCur, zc);
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
      const detCur = aggregateDetectZ(eps, sigmaCur, kCur, zc);
      svg("circle", {
        cx: xFor(sigmaCur), cy: yFor(detCur), r: 5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--wm",
      }, plot);
    }

    /* ---- Live update with tweened readouts ---- */
    let prev = { det: 0.32, fpr: 0 };
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
      const sigma = wmCurrentSigma();
      const alphaSig = FIXED_ALPHA;
      const zc = zForOneSidedAlpha(alphaSig);
      refs.epsVal.textContent   = eps.toFixed(2);
      refs.kVal.textContent     = k;

      const sd  = Math.sqrt(sigma*sigma + SIGMA0*SIGMA0);
      const snr = eps / sd;
      const effectiveZc = zc;
      const effectiveK = k;
      const q   = qDetect(eps, sigma, effectiveZc);
      const det = aggregateDetectZ(eps, sigma, effectiveK, zc);
      // False-positive rate is α by construction in a z-test (constant);
      // we keep displaying it for clarity, but the player can't lower it.
      const fpr = alphaSig;

      const pctH = (v) => (v * 100).toFixed(1) + "%";
      const pctL = (v) => (v * 100).toFixed(2) + "%";
      tweenNumber(refs.det, prev.det, det, 240, pctH);
      tweenNumber(refs.fpr, prev.fpr, fpr, 240, pctL);
      prev = { det: det, fpr: fpr };

      $$('.lab-experiment__metric', root).forEach(pulseRow);

      // Sweet spot: publishable operating point + visual feedback
      const inSweetWm = det >= 0.90 && eps <= 0.25;
      
      if (refs.sweetWm) {
        refs.sweetWm.hidden = !inSweetWm;
        if (inSweetWm) {
          refs.sweetWm.textContent = "\ud83c\udfaf You caught the " + wmCurrentThiefName() + "! Detection " + (det*100).toFixed(1) + "%, false alarms only " + (fpr*100).toFixed(2) + "%, model still intact. This is the regime real AI provenance disputes can defend.";
          unlockQuest("wm", "Watermark: court-grade signal.");
        }
      }
      const neonEnabled = false;
      const shouldPulse = wmUpdateSeq > 0 &&
        wmMetricsJumpWorthy(prevDet, prevFpr, prevSw, prevEffectiveK, det, fpr, inSweetWm, effectiveK);
      wmUpdateSeq++;
      prevSweetWm = inSweetWm;
      prevEffectiveK = effectiveK;

      let txt;
      if (eps < 0.04)             txt = "Signal under the model's own noise floor. You're trying to recover information that statistically doesn't exist. Push ε.";
      else if (det > 0.995)       txt = "Detection saturated. The thief's disguise is academic at this point: court-admissible, paper-publishable, and a strictly dominant strategy.";
      else if (det > 0.9 && fpr < 0.1)
                                  txt = "Operating frontier: >90% detection at <10% false-alarm. The regime a real provenance dispute could survive cross-examination in.";
      else if (det > 0.5 && k <= 4)
                                  txt = "Signal is fine; aggregation is weak. Detection scales with √k. Going from k=4 to k=16 doubles your effective SNR.";
      else if (det < 0.15 && sigma > 0.3)
                                  txt = "The thief's noise budget exceeds your signal budget. At this σ either widen ε (and risk the model) or grow k aggressively.";
      else if (det < 0.2)         txt = "Watermark is in the noise. Either raise ε past the model's tolerance or spread the signal across many more cells.";
      else                        txt = "Detection scales as Φ(SNR·√k − z_α). Doubling k buys you about √2 in z-score, usually cheaper than pushing ε.";
      refs.insight.textContent = txt;

      // Star grade — per-thief. Each thief has its own target detection
      // rate and signature budget. 5★ = beat the target AND keep the
      // model intact (ε under the scenario's budget). Bigger ε wrecks
      // the model, so this is a real trade-off.
      const wmGoalDet = wmCurrentGoalDet();
      const wmEpsMax = wmCurrentEpsMax();
      let wmStars = 0, wmTier = "Off-target";
      if (det >= wmGoalDet && fpr <= 0.05 && eps <= wmEpsMax)          { wmStars = 5; wmTier = "Frontier 🏆"; }
      else if (det >= wmGoalDet && fpr <= 0.10 && eps <= wmEpsMax+0.04){ wmStars = 4; wmTier = "Pro-grade"; }
      else if (det >= wmGoalDet * 0.80 && eps <= 0.30)                 { wmStars = 3; wmTier = "Sharp"; }
      else if (det >= wmGoalDet * 0.55 && eps <= 0.40)                 { wmStars = 2; wmTier = "Workable"; }
      else if (det >= wmGoalDet * 0.30)                                { wmStars = 1; wmTier = "Sketchy"; }
      setStars(refs.starsWm, wmStars, wmTier, { header: "Live score" });
      wmHint(wmStars);

      // Stanley-Parable endings — every Run lands in one of these.
      // Three distinct 5★ paths (Ninja, Brander, Engineer) + named
      // failure modes. Player can collect them all across thieves.
      const thiefName = wmCurrentThiefName();
      const goalPct = (wmGoalDet * 100).toFixed(0);
      const detPct = (det * 100).toFixed(1);
      const modelOK = eps <= wmEpsMax + 0.04;
      const ending = wmClassifyEnding(eps, k, det, wmGoalDet, wmEpsMax, wmStars, modelOK);
      const newlyUnlocked = recordEnding(ending.id);
      const newTag = newlyUnlocked ? " · NEW ENDING" : "";
      setVerdict(refs.verdict,
        ending.icon + " " + ending.name + " ending" + newTag,
        ending.sub.replace("{detPct}", detPct).replace("{goalPct}", goalPct).replace("{thiefName}", thiefName),
        ending.state);
      renderEndingsTally(refs.endingsTally, "wm-", WM_ENDINGS_TOTAL);

      buildGrid(eps, effectiveK, sigma, q, neonEnabled);
      if (shouldPulse) {
        refs.grid.classList.add("lab-wm__grid--pop");
        clearTimeout(wmPopTimer);
        wmPopTimer = setTimeout(function () {
          refs.grid.classList.remove("lab-wm__grid--pop");
        }, 360);
      }
      drawPlot(eps, k, sigma);
    }

    // Aim → Fire → Score.
    refs.runBtn = $('[data-role="wm-run-btn"]', root);
    let wmRevealed = false;
    const wmHint = makeHintTracker(refs.insight, [
      "If you can't catch the thief, plant more marks (raise k).",
      "Sweet spot: a moderate signal (ε ~0.15) hidden in many spots (k ~16).",
      "Going too bold (ε > 0.25) breaks the model. Stay subtle, plant widely.",
    ]);

    function wmSliderDisplay() {
      const eps = parseFloat(refs.eps.value);
      const k = parseInt(refs.k.value, 10);
      refs.epsVal.textContent = eps.toFixed(2);
      refs.kVal.textContent = k;
    }
    function wmPendReadout(msg) {
      wmRevealed = false;
      refs.det.textContent = "…";
      refs.fpr.textContent = "…";
      refs.insight.textContent = msg || "Pick a thief, choose your strategy, then hit Run experiment.";
      if (refs.sweetWm) refs.sweetWm.hidden = true;
      setStars(refs.starsWm, 0, "Press Run to score", { header: "Run grade", pending: true });
      const goalPct = (wmCurrentGoalDet() * 100).toFixed(0);
      const thief = wmCurrentThiefName();
      setVerdict(refs.verdict,
        "🎯 Goal: catch the " + thief + " with " + goalPct + "%+ confidence",
        msg || "Tune signature strength (ε) and number of marks (k) · hit Run experiment.",
        "pending");
      root.classList.add("lab-experiment--pending");
      root.classList.remove("lab-experiment--revealed");
    }
    function wmCommitRun() {
      if (!refs.runBtn) return;
      const btnText = refs.runBtn.querySelector('.lab-btn__text');
      refs.runBtn.classList.add("is-running");
      refs.runBtn.disabled = true;
      if (btnText) btnText.textContent = "Running…";
      if (refs.grid) {
        refs.grid.classList.add("lab-wm__grid--pop");
        setTimeout(function () { if (refs.grid) refs.grid.classList.remove("lab-wm__grid--pop"); }, 360);
      }
      setTimeout(function () {
        refs.runBtn.classList.remove("is-running");
        refs.runBtn.disabled = false;
        if (btnText) btnText.textContent = "Run again";
        wmRevealed = true;
        root.classList.remove("lab-experiment--pending");
        root.classList.add("lab-experiment--revealed");
        update();
      }, 1100);
    }
    function wmOnSlider() {
      wmSliderDisplay();
      if (wmRevealed) wmPendReadout("New strategy. Hit Run experiment to re-score.");
    }
    refs.eps.addEventListener("input", wmOnSlider);
    refs.k.addEventListener("input", wmOnSlider);
    if (refs.levels) {
      refs.levels.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".lab-level");
        if (!btn || !refs.levels.contains(btn)) return;
        refs.levels.querySelectorAll(".lab-level").forEach(function (b) {
          b.classList.remove("lab-level--active");
        });
        btn.classList.add("lab-level--active");
        wmOnSlider();
      });
    }
    if (refs.runBtn) refs.runBtn.addEventListener("click", wmCommitRun);

    wmSliderDisplay();
    wmPendReadout();
    renderEndingsTally(refs.endingsTally, "wm-", WM_ENDINGS_TOTAL);
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
      sysVal:          $('[data-role="sys-val"]', root),
      gainVal:         $('[data-role="gain-val"]', root),
      sweetTmr:        $('[data-role="sweet-spot-tmr"]', root),
      insight:         $('[data-role="insight-tmr"]', root),
      plot:            $('[data-role="plot-tmr"]', root),
      cells1:          $('[data-cells="1"]', root),
      cells2:          $('[data-cells="2"]', root),
      cells3:          $('[data-cells="3"]', root),
      cellsSys:        $('[data-cells="sys"]', root),
      tmrStrip:        $('[data-role="tmr-strip"]', root),
      nChannels:       $('[data-role="n-channels"]', root),
      nChannelsVal:    $('[data-role="n-channels-val"]', root),
      levels:          $('[data-role="tmr-levels"]', root),
      verdict:         $('[data-role="verdict-tmr"]', root),
      starsTmr:        $('[data-role="stars-tmr"]', root),
    };

    function tmrCurrentLevel() {
      const active = refs.levels && refs.levels.querySelector(".lab-level--active");
      return active || (refs.levels && refs.levels.querySelector(".lab-level"));
    }
    function tmrCurrentQ() {
      const btn = tmrCurrentLevel();
      return btn ? parseFloat(btn.dataset.q) : 0.05;
    }
    function tmrCurrentRho() {
      const btn = tmrCurrentLevel();
      return btn ? parseFloat(btn.dataset.rho) : 0.05;
    }
    function tmrCurrentGoalGain() {
      const btn = tmrCurrentLevel();
      return btn ? parseFloat(btn.dataset.goalGain) : 15;
    }
    function tmrCurrentMinN() {
      const btn = tmrCurrentLevel();
      return btn ? parseInt(btn.dataset.minN, 10) : 5;
    }
    function tmrCurrentMissionName() {
      const btn = tmrCurrentLevel();
      return btn ? (btn.dataset.name || "mission") : "mission";
    }

    function tmrEffectiveRho(rho) {
      return Math.max(0, Math.min(1, rho));
    }

    /* Binomial coefficient C(n, k). Cached for the small N values we use. */
    function binom(n, k) {
      if (k < 0 || k > n) return 0;
      if (k === 0 || k === n) return 1;
      let r = 1;
      for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i;
      return r;
    }
    /* Independent-failures system failure rate: majority-vote with N channels.
       System fails iff ⌈N/2⌉ or more channels fail (each independently with rate q). */
    function indepSysFail(q, N) {
      const need = Math.ceil(N / 2);
      let s = 0;
      for (let k = need; k <= N; k++) {
        s += binom(N, k) * Math.pow(q, k) * Math.pow(1 - q, N - k);
      }
      return s;
    }
    /* Closed-form system failure rate with common-cause correlation ρ.
       With prob ρ, all channels fail together (rate q). With prob (1−ρ),
       they fail independently. Generalised to any odd N. */
    function pSysFail(q, rho, N) {
      const n = (N | 0) || 3;
      return rho * q + (1 - rho) * indepSysFail(q, n);
    }

    /* Break-even correlation: ρ where reliability gain = 10x (pSysFail = q/10).
       Solved analytically: ρ·(q − indep) = q/10 − indep. */
    function rhoBreakeven(q, N) {
      const indep = indepSysFail(q, (N | 0) || 3);
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

    function drawPlot(qCur, rhoCur, NCur) {
      const plot = refs.plot;
      while (plot.firstChild) plot.removeChild(plot.firstChild);
      const Nplot = NCur || 3;

      const title = svg("text", { x: M.l, y: M.t - 12, class: "lab-plot__title" }, plot);
      title.textContent = "P(sys fail) vs q | N = " + Nplot + ", ρ = " + rhoCur.toFixed(2);

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
          const v = Math.min(pSysFail(qq, rho, Nplot), Y_MAX);
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
        const finalY = yFor(Math.min(pSysFail(finalQ, rho, Nplot), Y_MAX));
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
      const v = Math.min(pSysFail(qCur, rhoCur, Nplot), Y_MAX);
      svg("circle", {
        cx: xFor(qCur), cy: yFor(v), r: 5,
        class: "lab-plot__marker-dot lab-plot__marker-dot--wm",
      }, plot);
    }

    /* ---- Live simulation: scrolling channel strip ---- */
    const MAX_CELLS = 28;
    let simTimer = null;
    let tmrTickMs = 600;
    let currentQ = 0.05, currentRho = 0, currentNChannels = 3;

    function addCell(container, isFault) {
      const cell = document.createElement("span");
      cell.className = "lab-tmr__cell " + (isFault ? "lab-tmr__cell--fault" : "lab-tmr__cell--ok");
      container.appendChild(cell);
      while (container.children.length > MAX_CELLS) {
        container.removeChild(container.firstChild);
      }
    }
    function tick() {
      // Sample the actual N channels (3, 5, 7, or 9). The on-screen strip shows
      // the first 3 as a visual sample; the SYS row reflects majority vote
      // over the full N. This way the slider truly changes the science.
      const N = currentNChannels;
      const rhoEff = tmrEffectiveRho(currentRho);
      let fails = [];
      if (Math.random() < rhoEff) {
        const f = Math.random() < currentQ;
        for (let i = 0; i < N; i++) fails.push(f);
      } else {
        for (let i = 0; i < N; i++) fails.push(Math.random() < currentQ);
      }
      let numFail = 0;
      for (let i = 0; i < N; i++) if (fails[i]) numFail++;
      const sysFail = numFail >= Math.ceil(N / 2);
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
        if (refs.tmrStrip) {
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
    function restartSimInterval(customMs) {
      if (simTimer) { clearInterval(simTimer); simTimer = null; }
      const ms = (typeof customMs === "number") ? customMs : tmrTickMs;
      simTimer = setInterval(tick, ms);
      tick();
    }
    function stopSim() {
      if (simTimer) { clearInterval(simTimer); simTimer = null; }
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { stopSim(); } else if (tmrRevealed) { startSim(); }
    });

    /* ---- Live update ---- */
    let prev = { sys: 3*0.05*0.05 - 2*Math.pow(0.05,3), single: 0.05, gain: 0 };
    function update() {
      const q = tmrCurrentQ();
      const rho = tmrCurrentRho();
      const N = refs.nChannels ? Math.max(3, parseInt(refs.nChannels.value, 10) | 0) : 3;
      currentQ = q; currentRho = rho; currentNChannels = N;
      if (refs.nChannelsVal) refs.nChannelsVal.textContent = String(N);

      const rhoEff = tmrEffectiveRho(rho);
      const pSys = pSysFail(q, rhoEff, N);
      const gain = pSys > 0 ? q / pSys : 1;

      const pctH = (v) => (v * 100 < 1 ? (v * 100).toFixed(3) : (v * 100).toFixed(2)) + "%";
      const xRaw = (v) => (v >= 100 ? Math.round(v) + "×" : v.toFixed(1) + "×");

      tweenNumber(refs.sysVal, prev.sys,  pSys, 240, pctH);
      tweenNumber(refs.gainVal, prev.gain, gain, 260, xRaw);
      prev = { sys: pSys, single: q, gain: gain };
      $$('.lab-experiment__metric', root).forEach(pulseRow);

      // Break-even correlation (used internally for the over-break-even check)
      const rhoBE = rhoBreakeven(q, N);

      // Sweet spot: real safety win on this mission.
      const inSweetTmr = gain >= 100;
      const overBreakeven = rhoBE !== null && rhoEff > rhoBE && rhoBE < 0.99;

      if (refs.sweetTmr) {
        refs.sweetTmr.hidden = !inSweetTmr;
        if (inSweetTmr) {
          refs.sweetTmr.textContent = "\ud83c\udfaf You safed the " + tmrCurrentMissionName() + " mission! " + N + " backup computers made it " + gain.toFixed(0) + "\u00d7 safer than just one. This is why your A320 cruises with three independent flight computers.";
          unlockQuest("tmr", "TMR: redundancy done right.");
        }
      }

      // Plain-English regime hints.
      let txt;
      if (rhoBE === null) {
        txt = "Per-channel rate too high. Even perfect independence can't hit a 10× multiplier here. Replication isn't the right tool at this q; you need a better channel before you stack them.";
      } else if (overBreakeven) {
        txt = "\u26a0\ufe0f Effective correlation exceeds the break-even line \u2014 you're paying for N channels and getting less than 10\u00d7 gain. This is the regime that crashed Ariane 5 (identical IRS code, identical overflow, near-simultaneous reset).";
      } else if (rhoEff >= 0.95) {
        txt = "ρ ≈ 1 turns N-modular redundancy into one channel wearing a wig. Same software, same input, same failure: voting buys you nothing.";
      } else if (rhoEff < 0.05) {
        txt = "Near-independent failures. Reliability gain scales roughly as 1/(N·q^⌈N/2⌉): the regime DO-178C signs off, the one your A320 cruises through every flight.";
      } else if (rhoEff < 0.5) {
        txt = "Mixed-mode failure. Common-cause events are taking a real bite out of the cubic gain. Diverse-versions programming exists for exactly this regime.";
      } else {
        txt = "Correlation is now the dominant term. The (1−ρ) factor is shrinking faster than the binomial tail can compensate. Diversify the channels or accept the ceiling.";
      }
      refs.insight.textContent = txt;

      // Star grade — per-mission. Each scenario has its own gain target
      // because correlation caps how much TMR can ever help. 5★ = beat
      // the target AND with the minimum number of computers that does it.
      const tmrGoalGain = tmrCurrentGoalGain();
      const tmrMinN = tmrCurrentMinN();
      let tmrStars = 0, tmrTier = "Off-target";
      if (gain >= tmrGoalGain && N <= tmrMinN)        { tmrStars = 5; tmrTier = "Frontier 🏆"; }
      else if (gain >= tmrGoalGain)                    { tmrStars = 4; tmrTier = "Pro-grade"; }
      else if (gain >= tmrGoalGain * 0.65)             { tmrStars = 3; tmrTier = "Sharp"; }
      else if (gain >= tmrGoalGain * 0.35)             { tmrStars = 2; tmrTier = "Workable"; }
      else if (gain >= 1.5)                            { tmrStars = 1; tmrTier = "Sketchy"; }
      setStars(refs.starsTmr, tmrStars, tmrTier, { header: "Live score" });
      tmrHint(tmrStars);

      // Headline verdict with character.
      const missionName = tmrCurrentMissionName();
      const gainFmt = gain >= 100 ? Math.round(gain) + "×" : gain.toFixed(1) + "×";
      if (tmrStars === 5) {
        setVerdict(refs.verdict,
          "🏆 " + missionName + " survives with minimum hardware",
          gainFmt + " safer than one computer, with only " + N + " backups. DO-178C signs off; the auditor goes home.",
          "win");
      } else if (gain >= tmrGoalGain) {
        setVerdict(refs.verdict,
          "✓ " + missionName + " survives (overspent on hardware)",
          gainFmt + " safer with " + N + ", but " + tmrMinN + " would have done it. The CFO has questions.",
          "win");
      } else if (gain >= tmrGoalGain * 0.35) {
        setVerdict(refs.verdict,
          "✗ Below the safety bar",
          gainFmt + " safer, needed " + tmrGoalGain + "×. Try more backups.",
          "miss");
      } else {
        setVerdict(refs.verdict,
          "💥 Correlated failures are winning",
          gainFmt + ". The computers are voting unanimously for the wrong answer. (Ariane 5 also did this.)",
          "fail");
      }

      drawPlot(q, rhoEff, N);
    }

    // Randomize starting parameters on each refresh for replayability
    const randQ = (0.02 + Math.random() * 0.12).toFixed(3);
    const randRho = (Math.random() * 0.3).toFixed(2);
    refs.q.value = randQ;
    refs.rho.value = randRho;

    // Aim → Fire → Score. Same commit pattern.
    refs.runBtn = $('[data-role="tmr-run-btn"]', root);
    let tmrRevealed = false;
    let tmrRunning = false;
    const tmrHint = makeHintTracker(refs.insight, [
      "The big one is correlation. If computers crash together, more of them doesn't help.",
      "Sweet spot: low crash rate AND low correlation. 5+ computers is great if they're independent.",
      "Three identical computers fail together. Real safety needs different vendors and different code.",
    ]);

    function tmrSliderDisplay() {
      const N = refs.nChannels ? Math.max(3, parseInt(refs.nChannels.value, 10) | 0) : 3;
      if (refs.nChannelsVal) refs.nChannelsVal.textContent = String(N);
    }
    function tmrPendReadout(msg) {
      tmrRevealed = false;
      refs.sysVal.textContent = "…";
      refs.gainVal.textContent = "…";
      refs.insight.textContent = msg || "Pick a mission, choose your strategy, then hit Run experiment.";
      if (refs.sweetTmr) refs.sweetTmr.hidden = true;
      setStars(refs.starsTmr, 0, "Press Run to score", { header: "Run grade", pending: true });
      const goalGain = tmrCurrentGoalGain();
      const mission = tmrCurrentMissionName();
      setVerdict(refs.verdict,
        "🎯 Goal: make " + mission + " ≥ " + goalGain + "× safer than one computer",
        msg || "Pick the number of backup computers · hit Run experiment.",
        "pending");
      root.classList.add("lab-experiment--pending");
      root.classList.remove("lab-experiment--revealed");
    }
    function tmrClearStrip() {
      [refs.cells1, refs.cells2, refs.cells3, refs.cellsSys].forEach(function (c) {
        if (c) while (c.firstChild) c.removeChild(c.firstChild);
      });
    }
    function tmrCommitRun() {
      if (!refs.runBtn || tmrRunning) return;
      tmrRunning = true;
      const btnText = refs.runBtn.querySelector('.lab-btn__text');
      refs.runBtn.classList.add("is-running");
      refs.runBtn.disabled = true;
      if (btnText) btnText.textContent = "Running…";
      currentQ = tmrCurrentQ();
      currentRho = tmrCurrentRho();
      currentNChannels = refs.nChannels ? Math.max(3, parseInt(refs.nChannels.value, 10) | 0) : 3;
      tmrClearStrip();
      restartSimInterval(80);
      setTimeout(function () {
        tmrTickMs = 600;
        restartSimInterval(tmrTickMs);
        tmrRunning = false;
        refs.runBtn.classList.remove("is-running");
        refs.runBtn.disabled = false;
        if (btnText) btnText.textContent = "Run again";
        tmrRevealed = true;
        root.classList.remove("lab-experiment--pending");
        root.classList.add("lab-experiment--revealed");
        update();
      }, 1400);
    }
    function tmrOnSlider() {
      tmrSliderDisplay();
      if (tmrRevealed) {
        tmrPendReadout("New strategy. Hit Run experiment to re-score.");
        stopSim();
        tmrClearStrip();
      }
    }
    if (refs.nChannels) refs.nChannels.addEventListener("input", tmrOnSlider);
    if (refs.levels) {
      refs.levels.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".lab-level");
        if (!btn || !refs.levels.contains(btn)) return;
        refs.levels.querySelectorAll(".lab-level").forEach(function (b) {
          b.classList.remove("lab-level--active");
        });
        btn.classList.add("lab-level--active");
        tmrOnSlider();
      });
    }
    if (refs.runBtn) refs.runBtn.addEventListener("click", tmrCommitRun);

    tmrSliderDisplay();
    tmrPendReadout();
    stopSim();
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
      gdTurbo:   $gd("gd-turbo"),
      epochVal:  $gd("epoch-val"),
      lossVal:   $gd("loss-val"),
      insight:   $gd("insight-gd"),
      verdict:   $gd("verdict-gd"),
      starsGd:   $gd("stars-gd"),
    };

    const gdHint = makeHintTracker(refs.insight, [
      "If the ball gets stuck early, raise the step size; it's too cautious.",
      "Sweet spot: step size around 0.015–0.020, momentum around 0.6 carries the ball through small hills.",
      "Adding momentum is like rolling on ice: the ball glides over local traps to find the deeper valley.",
    ]);

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
      const path = document.createElementNS(SVG, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#94a3b8");
      path.setAttribute("stroke-width", "2");
      refs.plot.appendChild(path);

      // Label valleys so the player can see where the goal is.
      // We sample local minima of f over the visible range. The deepest
      // one gets the 🏆 flag; any other dips get a 🚧 "trap" label.
      const samples = [];
      for (let i = 1; i < 200; i++) {
        const x = X_MIN + (X_MAX - X_MIN) * (i / 200);
        samples.push({ x: x, y: f(x) });
      }
      const localMins = [];
      for (let i = 1; i < samples.length - 1; i++) {
        if (samples[i].y < samples[i - 1].y && samples[i].y < samples[i + 1].y) {
          localMins.push(samples[i]);
        }
      }
      if (!localMins.length) return;
      const globalMin = localMins.reduce((a, b) => a.y < b.y ? a : b);
      localMins.forEach((m) => {
        const isGlobal = m === globalMin;
        const label = svg("text", {
          x: xFor(m.x),
          y: yFor(m.y) + 22,
          "text-anchor": "middle",
          class: "lab-plot__valley-label" + (isGlobal ? " lab-plot__valley-label--goal" : ""),
        }, refs.plot);
        label.textContent = isGlobal ? "🏆 the answer" : "🚧 trap valley";
        // tiny arrow from label up to the valley point
        const arrow = svg("line", {
          x1: xFor(m.x), x2: xFor(m.x),
          y1: yFor(m.y) + 9, y2: yFor(m.y) + 4,
          stroke: isGlobal ? "#f59e0b" : "#94a3b8",
          "stroke-width": "2",
        }, refs.plot);
      });
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
    // (noise + adaptive-schedule controls dropped; the GD game is now
    // about step size and momentum only — the textbook two knobs.)

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
      refs.insight.innerHTML = "Set parameters and hit <strong>Train</strong>. Challenge: <strong>" + activeLandscape.name + "</strong>.";
      triggerCongrats(refs.plot, false);
      setStars(refs.starsGd, 0, "Press Train to score", { header: "Run grade", pending: true });
      setVerdict(refs.verdict,
        "🎯 Goal: land the ball in the deepest valley",
        "Challenge: " + activeLandscape.name + ". Pick step size and momentum · hit Train.",
        "pending");
    }
    
    function updateReadout() {
      refs.epochVal.textContent = epoch;
      refs.lossVal.textContent = f(currentX).toFixed(2);
    }

    function renderParticle() {
      particle.setAttribute("cx", xFor(currentX));
      particle.setAttribute("cy", yFor(f(currentX)));
    }

    function doEpoch() {
      if (!running) return;
      const lr = parseFloat(refs.lr.value);
      const mom = parseFloat(refs.mom.value);

      const grad = df(currentX);
      velocity = mom * velocity - lr * grad;
      currentX += velocity;
      epoch++;
      trail.push(currentX);
      
      updateReadout();
      renderParticle();
      renderTrail();
      
      if (currentX < X_MIN || currentX > X_MAX) {
        refs.insight.textContent = "💥 Exploding gradients! The ball flew off the map.";
        setVerdict(refs.verdict,
          "💥 Diverged",
          "Step size too large; the optimizer left the landscape entirely. There is no spoon, only NaN.",
          "fail");
        running = false;
        setStars(refs.starsGd, 0, "Off-target", { header: "Run grade" });
        gdHint(0);
      } else if (epoch > 500) {
        refs.insight.textContent = "⏳ The ball is crawling. Step size is too small.";
        setVerdict(refs.verdict,
          "⏳ Still crawling at epoch 500",
          "Step size is too small. Try raising it. The simulation has other patients to see.",
          "miss");
        running = false;
        setStars(refs.starsGd, 1, "Sketchy", { header: "Run grade" });
        gdHint(1);
      } else if (Math.abs(velocity) < 1e-4 && Math.abs(grad) < 1e-3) {
        const dist = Math.abs(currentX - TARGET_X);
        if (dist < 0.06) {
          refs.insight.textContent = "🏆 Global minimum reached. The ball found the deepest valley.";
          setVerdict(refs.verdict,
            "🏆 Landed in the global minimum",
            "Found the answer in " + epoch + " epochs. This was a triumph.",
            "win");
          unlockQuest("gd", "Gradient descent: global minimum found.");
          triggerCongrats(refs.plot, true);
          setStars(refs.starsGd, 5, "Frontier 🏆", { header: "Run grade" });
          gdHint(5);
        } else {
           refs.insight.textContent = "🚧 Stuck in a side valley. Add momentum to roll over the small hill.";
           setVerdict(refs.verdict,
             "🚧 Trapped in a side valley",
             "Off by " + dist.toFixed(2) + " from the real answer. The ball is convinced it won. Add momentum.",
             "miss");
           let gdS = 1, gdT = "Sketchy";
           if (dist < 0.18)      { gdS = 4; gdT = "Pro-grade"; }
           else if (dist < 0.40) { gdS = 3; gdT = "Sharp"; }
           else if (dist < 0.80) { gdS = 2; gdT = "Workable"; }
           setStars(refs.starsGd, gdS, gdT, { header: "Run grade" });
           gdHint(gdS);
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
        setStars(refs.starsGd, 0, "Training…", { header: "Run grade", pending: true });
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
      trainBtn: $('[data-role="pol-train-btn"]', root),
      lrVal:    $('[data-role="pol-lr-val"]', root),
      bsVal:    $('[data-role="pol-bs-val"]', root),
      scoreVal: $('[data-role="pol-score-val"]', root),
      badgeVal: $('[data-role="pol-badge-val"]', root),
      plot:     $('[data-role="plot-pol"]', root),
      insight:  $('[data-role="insight-pol"]', root),
      polTurbo: $('[data-role="pol-turbo"]', root),
      verdict:  $('[data-role="verdict-pol"]', root),
      starsPol: $('[data-role="stars-pol"]', root),
    };

    if (!refs.plot || !refs.trainBtn || !refs.lr || !refs.bs) return;
    // Data noise is fixed at a credible value; the player tunes lr + B only.
    const FIXED_NOISE = 0.05;

    const polHint = makeHintTracker(refs.insight, [
      "If the score is low, the curve probably isn't dropping enough. Try a faster learning speed.",
      "Sweet spot: learning around 0.012, around 128 examples per step, noise around 0.05.",
      "Too noisy and the curve looks fake (over-jittery). Too smooth and it looks downloaded. Aim for natural wiggles.",
    ]);

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

      refs.lrVal.textContent = lr.toFixed(3);
      const bsIdx = clamp(bs - 1, 0, BATCH_SIZES.length - 1);
      refs.bsVal.textContent = BATCH_SIZES[Math.min(bsIdx, BATCH_SIZES.length - 1)];

      // Slider glow only on the controls the player can move.
      const lrCloseness = Math.max(0, 1 - Math.abs(lr - 0.012) / 0.010);
      const bsCloseness = Math.max(0, 1 - Math.abs(bs - 128) / 100);
      labFxSliderGlow(refs.lr, lrCloseness * 0.7);
      labFxSliderGlow(refs.bs, bsCloseness * 0.7);
      labFxApproachingZone(refs.lr, lrCloseness * 0.8);
      labFxApproachingZone(refs.bs, bsCloseness * 0.8);
    }

    function updateMetrics(epoch, loss) {
      // The simplified PoL lab no longer renders per-epoch live metrics
      // beyond the loss curve itself — only the final verdict + score.
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

      const score = Math.round(100 * (
        0.30 * monotonic +
        0.25 * smoothness +
        0.25 * distanceFromFake +
        0.20 * paramFit
      ));

      let badge = "Needs more science";
      const goldCutoff = 88;
      const silverCutoff = 75;
      const bronzeCutoff = 60;
      if (score >= goldCutoff) badge = "Gold Proof";
      else if (score >= silverCutoff) badge = "Silver Proof";
      else if (score >= bronzeCutoff) badge = "Bronze Proof";

      refs.scoreVal.textContent = String(score);
      refs.badgeVal.textContent = badge;

      if (score >= goldCutoff) {
        celebrate(refs.plot, false);
        refs.insight.innerHTML = "🏆 <strong>Gold Proof unlocked.</strong> Credible training regime; the audit holds. The Oracle is mildly proud.";
        setVerdict(refs.verdict,
          "🏆 Gold Proof",
          "Score " + score + ". Trajectory passes audit. There is no spoon, only a credible loss curve.",
          "win");
        unlockQuest("pol", "Proof-of-Learning: Gold Proof. You chose wisely.");
      } else if (score >= silverCutoff) {
        refs.insight.innerHTML = "🥈 Silver Proof. The trajectory is plausible but not airtight. The auditor will want another look.";
        setVerdict(refs.verdict,
          "🥈 Silver Proof",
          "Score " + score + ". Borderline; try α near 0.012 and B around 128.",
          "miss");
      } else if (score >= bronzeCutoff) {
        refs.insight.innerHTML = "🥉 Bronze. The curve descends, but bumpily. A determined auditor pushes back.";
        setVerdict(refs.verdict,
          "🥉 Bronze Proof",
          "Score " + score + ". You trained something. Just not convincingly.",
          "miss");
      } else {
        refs.insight.innerHTML = "Audit failed. Curve looks too flat or too noisy to be a real training run.";
        setVerdict(refs.verdict,
          "💀 Audit failed",
          "Score " + score + ". This is the loss curve of a model that was downloaded, not trained.",
          "fail");
      }

      // Star grade — small sweet spot. 5★ requires near-perfect fingerprint.
      let polStars = 0, polTier = "Off-target";
      if (score >= 94)      { polStars = 5; polTier = "Frontier 🏆"; }
      else if (score >= 82) { polStars = 4; polTier = "Pro-grade"; }
      else if (score >= 68) { polStars = 3; polTier = "Sharp"; }
      else if (score >= 50) { polStars = 2; polTier = "Workable"; }
      else if (score >= 30) { polStars = 1; polTier = "Sketchy"; }
      setStars(refs.starsPol, polStars, polTier, { header: "Run grade" });
      polHint(polStars);
    }

    function reset() {
      running = false;
      if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
      if (polEpochTid) { clearTimeout(polEpochTid); polEpochTid = null; }
      trainingCurve = [];
      updateMetrics(0, FAKE_LINE);
      refs.scoreVal.textContent = "0";
      refs.badgeVal.textContent = "…";
      drawPlot();
      refs.trainBtn.classList.remove('is-running');
      refs.trainBtn.querySelector('.lab-btn__text').textContent = "Train!";
      refs.insight.innerHTML = "Adjust sliders and hit <strong>Train!</strong>. Goal: <strong>Gold Proof</strong> (score ≥ 88).";
      setStars(refs.starsPol, 0, "Press Train to score", { header: "Run grade", pending: true });
      setVerdict(refs.verdict,
        "🎯 Goal: earn Gold Proof (verification score ≥ 88)",
        "Tune learning rate and batch size · hit Train · watch the loss curve.",
        "pending");
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
        refs.insight.textContent = "Running. Watching the loss curve unfold. Is this a real training run or a fake?";
        setStars(refs.starsPol, 0, "Training…", { header: "Run grade", pending: true });
        setVerdict(refs.verdict, "Training…", "Loss curve drawing live.", "pending");

        const alpha = parseFloat(refs.lr.value);
        const bsIdx = clamp(parseInt(refs.bs.value, 10) - 1, 0, BATCH_SIZES.length - 1);
        const batchSize = BATCH_SIZES[Math.min(bsIdx, BATCH_SIZES.length - 1)];

        trainingCurve = [];
        doEpoch(0, alpha, batchSize, FIXED_NOISE);
      }
    });

    refs.lr.addEventListener("input", updateSliderDisplay);
    refs.bs.addEventListener("input", updateSliderDisplay);

    // Randomize starting parameters on each refresh for replayability
    const randAlpha = (0.008 + Math.random() * 0.010).toFixed(4);
    const randBatch = Math.floor(32 + Math.random() * 200);
    refs.lr.value = randAlpha;
    refs.bs.value = randBatch;

    updateSliderDisplay();
    reset();
  }

  /* ----------------------------------------------------------------- bootstrap */
  function boot() {
    loadQuest();
    renderQuest();
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
