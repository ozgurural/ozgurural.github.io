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
      console.log("%cΦ(x) is Abramowitz–Stegun 26.2.17 — real math, not a spoon. There is no cake in this console either. If you read source while drinking coffee: statistically rare, qualifying for a leaderboard nobody maintains.", "color:#64748b;");
      console.log("%cNakamoto §11 lives at MODES.attack — try nakamoto(0.1, 6) and check Satoshi's table. Wubba lubba dub dub. Tread lightly. drozgurural@gmail.com", "color:#64748b;font-style:italic;");
      console.log("%c💊 you took the orange pill. welcome to the desert of the mempool.", "color:#f59e0b;font-weight:600;");
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

  /* ---------- Shareable runs (URL state + share popover) ----------
     Every lab encodes its current scenario and slider into the URL so a
     friend who opens the link lands on the exact same run. After Run
     commits, we replaceState the URL with `?lab=<key>&...#lab-<key>`. On
     init, each lab parses the URL and replays the state. The share button
     opens native share on mobile, or a copy/X/LinkedIn popover on desktop. */
  const LabShare = {
    SITE: "https://ozgurural.github.io",
    // Pretty per-lab share slugs. The stub pages at these paths emit the right
    // og:image meta and immediately redirect to /lab/?lab=<key>... so unfurlers
    // see the per-lab social card while humans land on the actual run.
    SLUGS: {
      tg:  "block-race",
      wm:  "model-heist",
      pol: "training-fingerprint",
      tmr: "redundancy-reactor",
      gd:  "gradient-pinball",
    },
    siteOrigin() {
      const loc = window.location;
      return (loc.origin && loc.origin !== "null") ? loc.origin : LabShare.SITE;
    },
    parse() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (!params.has("lab")) return null;
        const out = {};
        for (const [k, v] of params) out[k] = v;
        return out;
      } catch (e) { return null; }
    },
    _serialize(labKey, paramsObj) {
      const sp = new URLSearchParams();
      sp.set("lab", labKey);
      Object.keys(paramsObj || {}).forEach((k) => {
        const v = paramsObj[k];
        if (v == null || v === "") return;
        sp.set(k, String(v));
      });
      return sp.toString();
    },
    write(labKey, paramsObj) {
      // History writes stay on the canonical /lab/ page; we don't want to
      // redirect the player off the page they're playing on.
      try {
        const qs = LabShare._serialize(labKey, paramsObj);
        const url = window.location.pathname + "?" + qs + "#lab-" + labKey;
        window.history.replaceState(null, "", url);
      } catch (e) { /* noop */ }
    },
    buildUrl(labKey, paramsObj) {
      // The shared URL points at /lab/<slug>/ — those stub pages carry the
      // correct og:image for unfurlers and then redirect to the real lab.
      const qs = LabShare._serialize(labKey, paramsObj);
      const slug = LabShare.SLUGS[labKey];
      if (slug) {
        return LabShare.siteOrigin() + "/lab/" + slug + "/?" + qs + "#lab-" + labKey;
      }
      return LabShare.siteOrigin() + "/lab/?" + qs + "#lab-" + labKey;
    },
    tryNative(opts) {
      // Returns true if a native share dialog was opened.
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          navigator.share({ title: opts.title || "Lab", text: opts.text || "", url: opts.url });
          return true;
        } catch (e) { /* user dismissed */ }
      }
      return false;
    },
    copyLink(url) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(url).then(() => true).catch(() => false);
      }
      // Fallback for older browsers
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        return Promise.resolve(ok);
      } catch (e) { return Promise.resolve(false); }
    },
    twitterIntent(text, url, hashtags) {
      const u = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text) +
                "&url=" + encodeURIComponent(url) +
                (hashtags ? "&hashtags=" + encodeURIComponent(hashtags) : "");
      window.open(u, "_blank", "noopener,noreferrer,width=600,height=420");
    },
    linkedinIntent(url) {
      const u = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
      window.open(u, "_blank", "noopener,noreferrer,width=600,height=520");
    },
  };

  /* Generic share-button wiring. Each lab passes a `getState()` that
     returns { params, text, hashtags } describing the current run, and a
     pair of DOM nodes (button + popover). */
  function wireShareButton(opts) {
    const btn = opts.btn;
    const pop = opts.popover;
    const preview = opts.preview;
    const labKey = opts.labKey;
    if (!btn || !pop) return;

    function close() { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    function open() {
      const s = opts.getState();
      const url = LabShare.buildUrl(labKey, s.params);
      if (preview) preview.textContent = s.text;
      pop.hidden = false;
      pop.dataset.url = url;
      pop.dataset.text = s.text;
      pop.dataset.hashtags = s.hashtags || "";
      btn.setAttribute("aria-expanded", "true");
    }

    btn.addEventListener("click", function (ev) {
      ev.stopPropagation();
      const s = opts.getState();
      const url = LabShare.buildUrl(labKey, s.params);
      // Mobile: native share sheet. Otherwise: open the desktop popover.
      const nativeOpened = LabShare.tryNative({ title: "Lab · " + (s.title || labKey), text: s.text, url: url });
      if (!nativeOpened) {
        if (pop.hidden) open();
        else close();
      }
    });

    pop.addEventListener("click", function (ev) {
      const tgt = ev.target.closest("[data-share]");
      if (!tgt) return;
      const action = tgt.dataset.share;
      const url = pop.dataset.url;
      const text = pop.dataset.text;
      const hashtags = pop.dataset.hashtags;
      if (action === "copy") {
        LabShare.copyLink(url).then(function (ok) {
          const orig = tgt.dataset.origLabel || tgt.textContent;
          tgt.dataset.origLabel = orig;
          tgt.textContent = ok ? "✓ Link copied" : "✗ Copy failed";
          setTimeout(function () { tgt.textContent = orig; }, 1800);
        });
      } else if (action === "x") {
        LabShare.twitterIntent(text, url, hashtags);
      } else if (action === "li") {
        LabShare.linkedinIntent(url);
      } else if (action === "close") {
        close();
      }
    });

    // Click outside the popover closes it (but not when clicking the trigger).
    document.addEventListener("click", function (ev) {
      if (pop.hidden) return;
      if (pop.contains(ev.target) || ev.target === btn || btn.contains(ev.target)) return;
      close();
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !pop.hidden) close();
    });
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
     PUZZLE 1 · Block Race (Nakamoto consensus)
     ============================================================================
     Three modes share the same card:
        Mine    — Poisson block discovery at hashrate q over window N.
        Attack  — Nakamoto whitepaper §11 double-spend probability.
        Defend  — Same Nakamoto formula, optimized from the merchant's side.
     The math is Satoshi's. The UX makes it playable. */
  function initTwoGeneralsLab() {
    const root = document.getElementById("lab-tg");
    if (!root) return;

    const refs = {
      n:                  $('[data-role="n"]', root),
      nVal:               $('[data-role="n-val"]', root),
      sliderLabel:        $('[data-role="tg-slider-label"]', root),
      sliderVar:          $('[data-role="tg-slider-var"]', root),
      levelsTitle:        $('[data-role="tg-levels-title"]', root),
      levelsRow:          $('[data-role="tg-levels-row"]', root),
      missionHead:        $('[data-role="tg-mission-head"]', root),
      missionSub:         $('[data-role="tg-mission-sub"]', root),
      modeTabs:           $('[data-role="tg-mode-tabs"]', root),
      runBtn:             $('[data-role="tg-run-btn"]', root),
      naive:              $('[data-role="naive-val"]', root),
      strict:             $('[data-role="strict-val"]', root),
      metricALabel:       $('[data-role="metric-a-label"]', root),
      metricAFormula:     $('[data-role="metric-a-formula"]', root),
      metricBLabel:       $('[data-role="metric-b-label"]', root),
      metricBFormula:     $('[data-role="metric-b-formula"]', root),
      chainHonest:        $('[data-role="chain-honest"]', root),
      chainAttacker:      $('[data-role="chain-attacker"]', root),
      chainAttackerRow:   $('[data-role="chain-attacker-row"]', root),
      chainHonestLabel:   $('[data-role="chain-honest-label"]', root),
      chainAttackerLabel: $('[data-role="chain-attacker-label"]', root),
      chainHonestCount:   $('[data-role="chain-honest-count"]', root),
      chainAttackerCount: $('[data-role="chain-attacker-count"]', root),
      chainCaption:       $('[data-role="chain-caption"]', root),
      plot:               $('[data-role="plot"]', root),
      insight:            $('[data-role="insight"]', root),
      sweetTg:            $('[data-role="sweet-spot-tg"]', root),
      verdict:            $('[data-role="verdict-tg"]', root),
      endingsTally:       $('[data-role="endings-tg"]', root),
      starsTg:            $('[data-role="stars-tg"]', root),
      shareBtn:           $('[data-role="tg-share-btn"]', root),
      sharePopover:       $('[data-role="tg-share-popover"]', root),
      shareText:          $('[data-role="tg-share-text"]', root),
    };

    // Last-computed run results, used by both URL writeback and share text.
    let lastStars = 0;
    let lastVal = 0;
    /* ---- Math primitives ---- */

    // Poisson PMF P(K=k | λ).
    function poissonPMF(k, lam) {
      if (lam <= 0) return k === 0 ? 1 : 0;
      let p = Math.exp(-lam);
      for (let i = 1; i <= k; i++) p *= lam / i;
      return p;
    }
    function poissonCDF(k, lam) {
      let s = 0;
      for (let i = 0; i <= k; i++) s += poissonPMF(i, lam);
      return s;
    }
    function poissonSurvival(kStrict, lam) { /* P(X ≥ kStrict) */
      if (kStrict <= 0) return 1;
      return 1 - poissonCDF(kStrict - 1, lam);
    }

    // Nakamoto Bitcoin whitepaper §11. P(attacker eventually catches up
    // after the honest chain has z confirmations, given attacker share q).
    function nakamoto(q, z) {
      if (q <= 0) return 0;
      if (q >= 0.5) return 1;
      if (z <= 0) return 1;
      const p = 1 - q;
      const lam = z * (q / p);
      let sum = 1;
      let pmf = Math.exp(-lam);
      for (let k = 0; k <= z; k++) {
        if (k > 0) pmf *= lam / k;
        const ratio = Math.pow(q / p, z - k);
        sum -= pmf * (1 - ratio);
      }
      return Math.max(0, Math.min(1, sum));
    }

    // Smallest q ∈ (0, 0.499] such that nakamoto(q, z) ≥ pTarget. Bisection;
    // P(q, z) is monotonic in q so this is well-behaved.
    function minQForP(z, pTarget) {
      let lo = 0.001, hi = 0.499;
      if (nakamoto(hi, z) < pTarget) return hi;
      for (let i = 0; i < 40; i++) {
        const mid = (lo + hi) / 2;
        if (nakamoto(mid, z) >= pTarget) hi = mid;
        else lo = mid;
      }
      return hi;
    }
    // Smallest z ∈ [1, maxZ] such that nakamoto(q, z) ≤ pTarget. P is
    // monotone decreasing in z for fixed q < 0.5.
    function minZForP(q, pTarget, maxZ) {
      for (let z = 1; z <= maxZ; z++) {
        if (nakamoto(q, z) <= pTarget) return z;
      }
      return maxZ;
    }

    /* ---- Modes config ----
       Each mode is its own little puzzle but shares the card UI. Scenarios
       are filled in by JS; min-thresholds for attack/defend are derived
       from the Nakamoto formula so 5★ targets always match the math. */
    const MODES = {
      mine: {
        sliderMin: 1, sliderMax: 200, sliderStep: 1, sliderDefault: 60,
        sliderLabel: "Your strategy: blocks of mining time?",
        sliderVar: "N",
        levelsTitle: "Pick your rig (and your electric bill)",
        missionHead: "Pick the cheapest rig that statistically lands the target. Anything else is electricity bills with extra steps.",
        missionSub: "Each rig has a target block count. The slider sets your patience. 5★ for the leanest hash buying exactly enough time — anything else is wasted joules or unfinished work. The thermodynamic god does not negotiate.",
        honestLabel: "⛏️ Network",
        attackerVisible: false,
        caption: "⛏️ ten minutes per block · q = your share · 🟢 yours · ⚪ another lucky miner",
        scenarios: [
          { q: 0.005, target: 1, minN: 200, name: "Hobby ASIC",  icon: "🖥️" },
          { q: 0.020, target: 2, minN: 100, name: "Garage farm", icon: "🏭" },
          { q: 0.050, target: 4, minN:  80, name: "Pool member", icon: "🏢" },
          { q: 0.150, target: 9, minN:  60, name: "Hash cartel", icon: "🐋" },
        ],
      },
      attack: {
        sliderMin: 1, sliderMax: 49, sliderStep: 1, sliderDefault: 25,
        sliderLabel: "Your strategy: hashrate share to rent?",
        sliderVar: "q",
        levelsTitle: "Pick the merchant you'd like to disappoint",
        missionHead: "Find the smallest hashrate share that gives you a coin-flip-or-better. Heisenberg the protocol — or get orphaned.",
        missionSub: "Each merchant requires a different number of confirmations before shipping. 5★ at the minimum q where attack probability ≥ 50%. Rented hashrate burns money and leaves a trail; overshoot and you're not stealthy, you're a Coindesk headline.",
        honestLabel: "📰 Honest chain",
        attackerLabel: "🦹 Your fork",
        attackerVisible: true,
        caption: "🦹 publish payment → secretly mine alt chain → broadcast longer chain → say my name",
        scenarios: [
          { z:  1, pTarget: 0.50, name: "Coffee shop",     icon: "🛒" },
          { z:  3, pTarget: 0.50, name: "Online retailer", icon: "🛍️" },
          { z:  6, pTarget: 0.50, name: "Crypto exchange", icon: "💰" },
          { z: 12, pTarget: 0.50, name: "OTC desk",        icon: "🏛️" },
        ],
      },
      defend: {
        sliderMin: 1, sliderMax: 24, sliderStep: 1, sliderDefault: 6,
        sliderLabel: "Your strategy: confirmations to wait?",
        sliderVar: "z",
        levelsTitle: "Pick the adversary at your door",
        missionHead: "Pick the smallest number of confirmations that keeps double-spend probability below the safety bar. Tread lightly.",
        missionSub: "Each attacker controls a different share of network hashrate. 5★ for the safety bar at the fewest blocks of waiting. Customers are impatient; the math is unforgiving; the merchant who waits forever is just a Black Mirror episode in three acts.",
        honestLabel: "📰 Your payment",
        attackerLabel: "🦹 Attacker fork",
        attackerVisible: true,
        caption: "🛡️ each conf ≈ 10 min · waiting longer squares the attacker's odds · espresso cools faster than chains reorg",
        scenarios: [
          { q: 0.10, pTarget: 0.001, name: "Solo rogue",   icon: "🦹" },
          { q: 0.25, pTarget: 0.01,  name: "Mining pool",  icon: "🏭" },
          { q: 0.35, pTarget: 0.05,  name: "Hash cartel",  icon: "⚔️" },
          { q: 0.40, pTarget: 0.15,  name: "51% wannabe",  icon: "👑" },
        ],
      },
    };

    // Precompute Nakamoto-derived thresholds. These are what 5★ rewards.
    MODES.attack.scenarios.forEach(s => { s.minQ = minQForP(s.z, s.pTarget); });
    MODES.defend.scenarios.forEach(s => { s.minZ = minZForP(s.q, s.pTarget, 60); });

    let currentMode = "mine";
    let currentIdx = 0;
    let revealed = false;
    let prev = { a: 0, b: 0 };

    /* ---- Scenario rendering ---- */
    function levelHint(mode, s) {
      if (mode === "mine") {
        return (s.q * 100).toFixed(1) + "% share · target " + s.target + (s.target === 1 ? " block" : " blocks");
      } else if (mode === "attack") {
        return s.z + (s.z === 1 ? " conf · need q ≥ " : " confs · need q ≥ ") + Math.ceil(s.minQ * 100) + "%";
      } else {
        return (s.q * 100).toFixed(0) + "% attacker · target P ≤ " + (s.pTarget * 100).toFixed(s.pTarget < 0.01 ? 2 : 1) + "%";
      }
    }
    function renderScenarios() {
      const mode = MODES[currentMode];
      refs.levelsTitle.textContent = mode.levelsTitle;
      refs.missionHead.textContent = mode.missionHead;
      refs.missionSub.textContent = mode.missionSub;
      refs.sliderLabel.textContent = mode.sliderLabel;
      refs.sliderVar.textContent = mode.sliderVar;
      refs.n.min = mode.sliderMin;
      refs.n.max = mode.sliderMax;
      refs.n.step = mode.sliderStep;
      refs.n.value = mode.sliderDefault;
      refs.chainHonestLabel.textContent = mode.honestLabel;
      if (mode.attackerLabel) refs.chainAttackerLabel.textContent = mode.attackerLabel;
      refs.chainAttackerRow.hidden = !mode.attackerVisible;
      refs.chainCaption.textContent = mode.caption;

      refs.levelsRow.innerHTML = "";
      mode.scenarios.forEach((s, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lab-level" + (i === currentIdx ? " lab-level--active" : "");
        btn.dataset.idx = i;
        const icon = document.createElement("span");
        icon.className = "lab-level__icon";
        icon.textContent = s.icon;
        const name = document.createElement("span");
        name.className = "lab-level__name";
        name.textContent = s.name;
        const hint = document.createElement("span");
        hint.className = "lab-level__hint";
        hint.textContent = levelHint(currentMode, s);
        btn.appendChild(icon);
        btn.appendChild(name);
        btn.appendChild(hint);
        refs.levelsRow.appendChild(btn);
      });
      updateSliderDisplay();
    }
    function updateSliderDisplay() {
      const slider = parseFloat(refs.n.value);
      refs.nVal.textContent = currentMode === "attack" ? (slider + "%") : slider;
    }

    /* ---- Plot ---- */
    const PW = 640, PH = 260;
    const M = { l: 52, r: 110, t: 28, b: 40 };
    const innerW = PW - M.l - M.r;
    const innerH = PH - M.t - M.b;
    function clearPlot() {
      const plot = refs.plot;
      while (plot.firstChild) plot.removeChild(plot.firstChild);
    }
    function drawPlot() {
      clearPlot();
      if (currentMode === "mine") drawMinePlot();
      else if (currentMode === "attack") drawAttackPlot();
      else drawDefendPlot();
    }
    function drawMinePlot() {
      const plot = refs.plot;
      const sc = MODES.mine.scenarios[currentIdx];
      const q = sc.q;
      const N = parseInt(refs.n.value, 10);
      const Nmax = MODES.mine.sliderMax;
      const Ymax = Math.max(sc.target * 2, q * Nmax * 1.15, 1);
      const xFor = nn => M.l + (nn / Nmax) * innerW;
      const yFor = yy => M.t + (1 - yy / Ymax) * innerH;

      const title = svg("text", { x: M.l, y: M.t - 12, class: "lab-plot__title" }, plot);
      title.textContent = "Expected blocks vs window N | q = " + (q * 100).toFixed(1) + "%, target = " + sc.target;

      [0, 0.25, 0.5, 0.75, 1].forEach(f => {
        const yy = f * Ymax;
        svg("line", { x1: M.l, x2: M.l + innerW, y1: yFor(yy), y2: yFor(yy), class: "lab-plot__grid" }, plot);
        const t = svg("text", { x: M.l - 8, y: yFor(yy) + 4, class: "lab-plot__tick lab-plot__tick--y" }, plot);
        t.textContent = yy.toFixed(yy < 10 ? 1 : 0);
      });
      const step = Math.ceil(Nmax / 5);
      for (let i = 0; i <= Nmax; i += step) {
        const t = svg("text", { x: xFor(i), y: yFor(0) + 18, class: "lab-plot__tick lab-plot__tick--x" }, plot);
        t.textContent = i;
      }
      const xlabel = svg("text", { x: M.l + innerW / 2, y: PH - 8, class: "lab-plot__axis-label" }, plot);
      xlabel.textContent = "N (blocks of window)";

      // Target horizontal line
      svg("line", {
        x1: M.l, x2: M.l + innerW, y1: yFor(sc.target), y2: yFor(sc.target),
        class: "lab-plot__target-line",
      }, plot);
      const tlbl = svg("text", { x: M.l + 6, y: yFor(sc.target) - 5, class: "lab-plot__legend-label lab-plot__legend-label--strict" }, plot);
      tlbl.textContent = "target = " + sc.target;

      // E[X] curve
      let dE = "";
      for (let i = 0; i <= 100; i++) {
        const nn = (i / 100) * Nmax;
        const yy = q * nn;
        dE += (i === 0 ? "M" : "L") + xFor(nn).toFixed(1) + " " + yFor(yy).toFixed(1) + " ";
      }
      svg("path", { d: dE.trim(), class: "lab-plot__curve lab-plot__curve--naive" }, plot);

      // 90% band (mean ± 1.28·sqrt(λ))
      let dHi = "", dLo = "";
      for (let i = 0; i <= 100; i++) {
        const nn = (i / 100) * Nmax;
        const lam = q * nn;
        const sd = Math.sqrt(lam);
        const hi = lam + 1.28 * sd;
        const lo = Math.max(0, lam - 1.28 * sd);
        dHi += (i === 0 ? "M" : "L") + xFor(nn).toFixed(1) + " " + yFor(hi).toFixed(1) + " ";
        dLo += (i === 0 ? "M" : "L") + xFor(nn).toFixed(1) + " " + yFor(lo).toFixed(1) + " ";
      }
      svg("path", { d: dHi.trim(), class: "lab-plot__curve lab-plot__curve--strict" }, plot);
      svg("path", { d: dLo.trim(), class: "lab-plot__curve lab-plot__curve--strict" }, plot);

      const lam = q * N;
      svg("line", { x1: xFor(N), x2: xFor(N), y1: yFor(0), y2: yFor(Ymax), class: "lab-plot__marker-x" }, plot);
      svg("circle", { cx: xFor(N), cy: yFor(lam), r: 4.5, class: "lab-plot__marker-dot lab-plot__marker-dot--naive" }, plot);

      const lx = M.l + innerW + 14;
      const tn = svg("text", { x: lx, y: yFor(lam) - 5, class: "lab-plot__legend-label lab-plot__legend-label--naive" }, plot);
      tn.textContent = "E[blocks]";
      const tv = svg("text", { x: lx, y: yFor(lam) + 12, class: "lab-plot__legend-value lab-plot__legend-value--naive" }, plot);
      tv.textContent = lam.toFixed(2);
    }
    function drawAttackPlot() {
      const plot = refs.plot;
      const sc = MODES.attack.scenarios[currentIdx];
      const z = sc.z;
      const qCur = parseInt(refs.n.value, 10) / 100;
      const QMAX = 0.5;
      const xFor = qq => M.l + (qq / QMAX) * innerW;
      const yFor = p  => M.t + (1 - p) * innerH;

      const title = svg("text", { x: M.l, y: M.t - 12, class: "lab-plot__title" }, plot);
      title.textContent = "P(attack succeeds) vs your hashrate q | z = " + z + " confirmations";

      [0, 0.25, 0.5, 0.75, 1].forEach(v => {
        svg("line", { x1: M.l, x2: M.l + innerW, y1: yFor(v), y2: yFor(v), class: "lab-plot__grid" }, plot);
        const t = svg("text", { x: M.l - 8, y: yFor(v) + 4, class: "lab-plot__tick lab-plot__tick--y" }, plot);
        t.textContent = (v * 100).toFixed(0) + "%";
      });
      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach(qq => {
        const t = svg("text", { x: xFor(qq), y: yFor(0) + 18, class: "lab-plot__tick lab-plot__tick--x" }, plot);
        t.textContent = (qq * 100).toFixed(0) + "%";
      });
      const xlabel = svg("text", { x: M.l + innerW / 2, y: PH - 8, class: "lab-plot__axis-label" }, plot);
      xlabel.textContent = "q (your hashrate share)";

      // 50% target line
      svg("line", { x1: M.l, x2: M.l + innerW, y1: yFor(sc.pTarget), y2: yFor(sc.pTarget), class: "lab-plot__target-line" }, plot);
      const tlbl = svg("text", { x: M.l + 6, y: yFor(sc.pTarget) - 5, class: "lab-plot__legend-label lab-plot__legend-label--strict" }, plot);
      tlbl.textContent = "target = " + (sc.pTarget * 100).toFixed(0) + "% success";

      let d = "";
      for (let i = 0; i <= 100; i++) {
        const qq = (i / 100) * (QMAX - 0.001);
        const p = nakamoto(qq, z);
        d += (i === 0 ? "M" : "L") + xFor(qq).toFixed(1) + " " + yFor(p).toFixed(1) + " ";
      }
      svg("path", { d: d.trim(), class: "lab-plot__curve lab-plot__curve--naive" }, plot);

      const p = nakamoto(qCur, z);
      svg("line", { x1: xFor(qCur), x2: xFor(qCur), y1: yFor(0), y2: yFor(1), class: "lab-plot__marker-x" }, plot);
      svg("circle", { cx: xFor(qCur), cy: yFor(p), r: 4.5, class: "lab-plot__marker-dot lab-plot__marker-dot--naive" }, plot);

      const lx = M.l + innerW + 14;
      const tn = svg("text", { x: lx, y: yFor(p) - 5, class: "lab-plot__legend-label lab-plot__legend-label--naive" }, plot);
      tn.textContent = "P(success)";
      const tv = svg("text", { x: lx, y: yFor(p) + 12, class: "lab-plot__legend-value lab-plot__legend-value--naive" }, plot);
      tv.textContent = (p * 100).toFixed(1) + "%";
    }
    function drawDefendPlot() {
      const plot = refs.plot;
      const sc = MODES.defend.scenarios[currentIdx];
      const q = sc.q;
      const zCur = parseInt(refs.n.value, 10);
      const Zmax = MODES.defend.sliderMax;
      const xFor = zz => M.l + (zz / Zmax) * innerW;
      const yFor = p  => M.t + (1 - p) * innerH;

      const title = svg("text", { x: M.l, y: M.t - 12, class: "lab-plot__title" }, plot);
      title.textContent = "P(attack succeeds) vs confirmations z | q = " + (q * 100).toFixed(0) + "%";

      [0, 0.25, 0.5, 0.75, 1].forEach(v => {
        svg("line", { x1: M.l, x2: M.l + innerW, y1: yFor(v), y2: yFor(v), class: "lab-plot__grid" }, plot);
        const t = svg("text", { x: M.l - 8, y: yFor(v) + 4, class: "lab-plot__tick lab-plot__tick--y" }, plot);
        t.textContent = (v * 100).toFixed(0) + "%";
      });
      for (let i = 0; i <= Zmax; i += 4) {
        const t = svg("text", { x: xFor(i), y: yFor(0) + 18, class: "lab-plot__tick lab-plot__tick--x" }, plot);
        t.textContent = i;
      }
      const xlabel = svg("text", { x: M.l + innerW / 2, y: PH - 8, class: "lab-plot__axis-label" }, plot);
      xlabel.textContent = "z (confirmations)";

      // Target line: P ≤ sc.pTarget is the safe zone, below this dashed line.
      svg("line", { x1: M.l, x2: M.l + innerW, y1: yFor(sc.pTarget), y2: yFor(sc.pTarget), class: "lab-plot__target-line" }, plot);
      const targetLabel = sc.pTarget < 0.01
        ? (sc.pTarget * 100).toFixed(2) + "%"
        : (sc.pTarget * 100).toFixed(1) + "%";
      const tlbl = svg("text", { x: M.l + 6, y: yFor(sc.pTarget) - 5, class: "lab-plot__legend-label lab-plot__legend-label--strict" }, plot);
      tlbl.textContent = "safe ≤ " + targetLabel;

      let d = "";
      for (let i = 1; i <= Zmax; i++) {
        const p = nakamoto(q, i);
        d += (i === 1 ? "M" : "L") + xFor(i).toFixed(1) + " " + yFor(p).toFixed(1) + " ";
      }
      svg("path", { d: d.trim(), class: "lab-plot__curve lab-plot__curve--naive" }, plot);

      const p = nakamoto(q, zCur);
      svg("line", { x1: xFor(zCur), x2: xFor(zCur), y1: yFor(0), y2: yFor(1), class: "lab-plot__marker-x" }, plot);
      svg("circle", { cx: xFor(zCur), cy: yFor(p), r: 4.5, class: "lab-plot__marker-dot lab-plot__marker-dot--naive" }, plot);

      const lx = M.l + innerW + 14;
      const tn = svg("text", { x: lx, y: yFor(p) - 5, class: "lab-plot__legend-label lab-plot__legend-label--naive" }, plot);
      tn.textContent = "P(attack)";
      const tv = svg("text", { x: lx, y: yFor(p) + 12, class: "lab-plot__legend-value lab-plot__legend-value--naive" }, plot);
      tv.textContent = p < 0.0001 ? p.toExponential(1) : (p * 100).toFixed(p < 0.01 ? 3 : 2) + "%";
    }

    /* ---- Chain race animation ---- */
    let chainTimer = null;
    let chainState = { honest: 0, attacker: 0 };
    const CHAIN_VISIBLE = 12;
    function stopChainAnim() {
      if (chainTimer) { clearInterval(chainTimer); chainTimer = null; }
    }
    function clearChain() {
      if (refs.chainHonest) refs.chainHonest.innerHTML = "";
      if (refs.chainAttacker) refs.chainAttacker.innerHTML = "";
      chainState = { honest: 0, attacker: 0 };
      if (refs.chainHonestCount) refs.chainHonestCount.textContent = "0";
      if (refs.chainAttackerCount) refs.chainAttackerCount.textContent = "0";
    }
    function pushBlock(row, label, classMod) {
      if (!row) return;
      const b = document.createElement("span");
      b.className = "lab-chain__block" + (classMod ? " lab-chain__block--" + classMod : "");
      b.textContent = label;
      if (row.children.length >= CHAIN_VISIBLE) row.removeChild(row.firstChild);
      row.appendChild(b);
    }
    function chainStep() {
      const mode = MODES[currentMode];
      const sc = mode.scenarios[currentIdx];
      if (currentMode === "mine") {
        chainState.honest++;
        const yours = Math.random() < sc.q;
        pushBlock(refs.chainHonest, "#" + chainState.honest, yours ? "yours" : "other");
        refs.chainHonestCount.textContent = chainState.honest;
      } else {
        let q;
        if (currentMode === "attack") q = parseInt(refs.n.value, 10) / 100;
        else q = sc.q;
        // Per tick: one block found. P(found by honest) = 1 - q.
        if (Math.random() < (1 - q)) {
          chainState.honest++;
          pushBlock(refs.chainHonest, "#" + chainState.honest, "honest");
          refs.chainHonestCount.textContent = chainState.honest;
        } else {
          chainState.attacker++;
          pushBlock(refs.chainAttacker, "#" + chainState.attacker, "attacker");
          refs.chainAttackerCount.textContent = chainState.attacker;
        }
      }
    }
    function startChainAnim(intervalMs) {
      stopChainAnim();
      clearChain();
      const ms = intervalMs || (currentMode === "mine" ? 700 : 600);
      chainTimer = setInterval(chainStep, ms);
      chainStep();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopChainAnim();
      else startChainAnim();
    });

    /* ---- Endings ---- */
    // 14 named endings spread across the three modes. tg-attack-storm and
    // tg-defend-sentinel are the "hardest scenario, 5★" specials.
    const TG_ENDINGS_TOTAL = 14;
    function classifyEnding(mode, sc, slider, stars, val) {
      if (mode === "mine") {
        if (stars === 5)  return { id: "tg-mine-pro",    icon: "🎯", name: "The Foreman",      state: "win",  sub: "Heisenberg-grade rig sizing. You bought exactly the hashrate the goal needed and stopped at exactly the right block. Tight, tight, tight." };
        if (stars === 4)  return { id: "tg-mine-safe",   icon: "💼", name: "The Overcapper",   state: "win",  sub: "Hit the target with hashrate-time to spare. The electric bill arrived in a U-Haul; the CFO has requested a meeting." };
        if (stars >= 2)   return { id: "tg-mine-grind",  icon: "⛏️", name: "The Grinder",      state: "miss", sub: "Your expectation curve and your target are not in the same multiverse. Try Rick's portal gun — or buy more rig." };
        return            { id: "tg-mine-prayer", icon: "🙏", name: "The Solo Miner", state: "fail", sub: "One ASIC against 600 exahash. Pure aspiration — Poisson is unmoved, and your RTX 3090 is now an artisanal space heater." };
      }
      if (mode === "attack") {
        if (stars === 5 && sc.z >= 12) return { id: "tg-attack-storm", icon: "👑", name: "The Heist of Heists", state: "win", sub: "Double-spend on an OTC desk at twelve confirmations. Either you are Heisenberg, or you are a misprint in the multiverse. Either way: say my name." };
        if (stars === 5)  return { id: "tg-attack-min",   icon: "🥷", name: "The Minimal Heist",  state: "win",  sub: "Smallest hashrate that gives you a coin-flip-or-better. Anything less leaves money on the table; anything more is a Coindesk headline. Better Call Saul — but he's already on a yacht." };
        if (stars === 4)  return { id: "tg-attack-over",  icon: "💸", name: "The Big Spender",    state: "win",  sub: "You beat the merchant but lit hashrate on fire. The DEA, the FBI, and three block explorers are now writing chapters about you." };
        if (stars >= 2)   return { id: "tg-attack-cliff", icon: "🤏", name: "The Cliff",          state: "miss", sub: "So close to Heisenberg, so far from Mr. White. A few more % of hashrate and the napkin math flips. Tread lightly." };
        return            { id: "tg-attack-flea",  icon: "🪰", name: "The Flea",   state: "fail", sub: "At this share you're not a threat — you're a feature request. The longest-chain rule politely orphans you and keeps marching." };
      }
      // defend
      if (stars === 5 && sc.q >= 0.40) return { id: "tg-defend-sentinel", icon: "🌪️", name: "The Sentinel", state: "win", sub: "You stared down 40% network hashrate on the minimum required confirmations. Section 11 of the whitepaper just signed your visitor badge." };
      if (stars === 5)  return { id: "tg-defend-min",    icon: "🛡️", name: "The Patient Merchant", state: "win",  sub: "Exact-minimum confirmations to clear the safety bar. Satoshi's ghost just gave you the orange-pill nod." };
      if (stars === 4)  return { id: "tg-defend-safe",   icon: "🦺", name: "Belt and Suspenders",  state: "win",  sub: "Safer than you needed to be. Your customers grew old; their grandchildren wrote angry letters; the goods still haven't shipped." };
      if (stars >= 2)   return { id: "tg-defend-cliff",  icon: "🤏", name: "The Cliff",            state: "miss", sub: "Just under the safety bar. One more block of patience and you'd have been fine. The attacker bought a Lambo with your inventory." };
      return            { id: "tg-defend-prayer", icon: "🙏", name: "Coffee-Shop Reflex", state: "fail", sub: "Accepting on too few confirmations against a real adversary. The block explorer is laughing in 256-bit hex; Hank Schrader is taking notes." };
    }

    function sweetText(mode, sc, slider, val) {
      if (mode === "mine") {
        return "🎯 You sized the " + sc.name + " perfectly. " + (sc.q * 100).toFixed(1) + "% hashrate × " + slider + " blocks = " + (sc.q * slider).toFixed(2) + " expected, right at target " + sc.target + ". Tight, tight, tight.";
      } else if (mode === "attack") {
        return "🎯 Minimum hashrate to heist the " + sc.name + ". At q=" + slider + "% against z=" + sc.z + " confirmations, Nakamoto §11 gives you " + (val * 100).toFixed(1) + "% success. Barely worth attempting — and that's precisely why the attack works. Better Call Saul, but he's already retired.";
      } else {
        const targetTxt = sc.pTarget < 0.01 ? (sc.pTarget * 100).toFixed(2) + "%" : (sc.pTarget * 100).toFixed(1) + "%";
        return "🎯 Optimal defence vs " + sc.name + ". At q=" + (sc.q * 100).toFixed(0) + "%, waiting " + slider + " confirmations drops attack probability under " + targetTxt + ". Each extra block roughly squares their odds against you. Satoshi's ghost approves.";
      }
    }

    /* ---- Update ---- */
    function update() {
      const mode = MODES[currentMode];
      const sc = mode.scenarios[currentIdx];
      const slider = parseFloat(refs.n.value);
      updateSliderDisplay();

      let stars = 0, tier = "Off-target";
      let valA = 0, valB = 0;
      let fmtA = String, fmtB = String;
      let labelA = "", labelB = "", formulaA = "", formulaB = "";
      let sweet = false, insight = "";

      if (currentMode === "mine") {
        const q = sc.q;
        const N = slider;
        const lam = q * N;
        const probHit = poissonSurvival(sc.target, lam);
        valA = lam;
        valB = probHit;
        fmtA = v => v.toFixed(2) + " blk";
        fmtB = v => (v * 100).toFixed(1) + "%";
        labelA = "Expected blocks (E[X])";
        formulaA = "λ = q × N = " + (q * 100).toFixed(1) + "% × " + N;
        labelB = "P(hit target ≥ " + sc.target + ")";
        formulaB = "Poisson tail · variance is real";

        const minN = sc.minN;
        if (lam >= sc.target && N >= Math.floor(minN * 0.95) && N <= Math.ceil(minN * 1.10)) { stars = 5; tier = "Frontier 🏆"; sweet = true; }
        else if (lam >= sc.target && N <= minN * 1.5) { stars = 4; tier = "Pro-grade"; }
        else if (lam >= sc.target)                    { stars = 3; tier = "Sharp"; }
        else if (lam >= sc.target * 0.6)              { stars = 2; tier = "Workable"; }
        else if (lam >= sc.target * 0.3)              { stars = 1; tier = "Sketchy"; }

        if (N < 5)                            insight = "Tiny window — Poisson variance dominates. Even Rick can't portal-gun out of statistical noise this short.";
        else if (lam < sc.target * 0.5)       insight = "Below half-target. Either bigger rig or longer window. You're not in the empire business yet — you're in the dabble business.";
        else if (lam < sc.target)             insight = "Almost. Each extra block of window adds " + (q * 100).toFixed(2) + "% to E[X]. The short run has the dignity of a Black Mirror cold open.";
        else if (N > minN * 2)                insight = "You'd hit it easily, but the electric bill arrived gift-wrapped. The break-even rig is leaner. Welcome to the desert of the real.";
        else                                  insight = "Hashrate × time = yield. Pools exist because solo variance is brutal — co-op is just better-Calling-Saul on probability.";
      }
      else if (currentMode === "attack") {
        const z = sc.z;
        const q = slider / 100;
        const p = nakamoto(q, z);
        const minQ = sc.minQ;
        valA = p; valB = z;
        fmtA = v => (v * 100).toFixed(2) + "%";
        fmtB = v => v + (v === 1 ? " conf" : " confs");
        labelA = "P(attack succeeds)";
        formulaA = "Nakamoto §11 at q=" + (q * 100).toFixed(0) + "%, z=" + z;
        labelB = "Merchant requires";
        formulaB = "longest-chain wins";

        const overshoot = q - minQ;
        if (p >= sc.pTarget && Math.abs(overshoot) < 0.025) { stars = 5; tier = "Frontier 🏆"; sweet = true; }
        else if (p >= sc.pTarget && overshoot < 0.06)       { stars = 4; tier = "Pro-grade"; }
        else if (p >= sc.pTarget)                           { stars = 3; tier = "Sharp"; }
        else if (p >= sc.pTarget * 0.5)                     { stars = 2; tier = "Workable"; }
        else if (p >= sc.pTarget * 0.2)                     { stars = 1; tier = "Sketchy"; }

        if (q < 0.05)              insight = "Under 5% of network hash — you're a Mr. Meeseeks tasked with overtaking Bitcoin. Existence will become pain quickly.";
        else if (q < minQ - 0.08)  insight = "Way under threshold. Public chain pulls away like a freight train; your private fork is a unicycle in a different multiverse.";
        else if (q < minQ)         insight = "Just under coin-flip. P(success) climbs steeply near the threshold — a few more % flips the table. Tread lightly.";
        else if (overshoot < 0.05) insight = "Coin-flip territory. You'd pull it off slightly more than half the time. Better than the multiverse mean — worse than Heisenberg-clean.";
        else if (overshoot < 0.15) insight = "Overspent on hashrate. The DEA, the FBI, and three block explorers are already writing chapters about you.";
        else                       insight = "Wildly overkill. At this share you may as well stop sneaking and just declare yourself the network. Heisenberg-the-protocol, hold the door.";
      }
      else {
        const q = sc.q;
        const z = slider;
        const p = nakamoto(q, z);
        const minZ = sc.minZ;
        valA = p; valB = z;
        fmtA = v => (v < 0.0001 ? v.toExponential(1) : (v * 100).toFixed(v < 0.01 ? 3 : 2) + "%");
        fmtB = v => v + (v === 1 ? " block" : " blocks");
        labelA = "P(attacker reverses payment)";
        formulaA = "Nakamoto §11 at q=" + (q * 100).toFixed(0) + "%, z=" + z;
        labelB = "You waited";
        formulaB = "~10 minutes per block";

        if (p <= sc.pTarget && z <= minZ)        { stars = 5; tier = "Frontier 🏆"; sweet = true; }
        else if (p <= sc.pTarget && z <= minZ+3) { stars = 4; tier = "Pro-grade"; }
        else if (p <= sc.pTarget)                { stars = 3; tier = "Sharp"; }
        else if (p <= Math.max(sc.pTarget * 4, 0.02)) { stars = 2; tier = "Workable"; }
        else if (p <= Math.max(sc.pTarget * 16, 0.10)) { stars = 1; tier = "Sketchy"; }

        if (z === 1)            insight = "One conf is the coffee-shop reflex — fine for $5 sandwiches, terminal for $50K transfers. Hank Schrader is taking notes.";
        else if (z < minZ - 2)  insight = "Way under safety. Your customer would reverse this transaction before the espresso went cold. Saul has been retained.";
        else if (z < minZ)      insight = "Close, but the math still favours the attacker. Each extra confirmation roughly squares their odds — 'tread lightly' is in Satoshi's whitepaper, just hidden in LaTeX.";
        else if (z <= minZ + 2) insight = "Right at the safety bar. The classic '6 confirmations' rule is exactly this calculation at q=10% — there is no spoon, only Poisson.";
        else if (z > minZ + 8)  insight = "Overcautious. Your customers' grandchildren have aged out of the original purchase decision. Patience is virtue; paralysis is a Black Mirror episode.";
        else                    insight = "Comfortably safe. Each extra block makes the heist exponentially less attractive — exactly the property Nakamoto put on the napkin.";
      }

      tweenNumber(refs.naive, prev.a, valA, 260, fmtA);
      tweenNumber(refs.strict, prev.b, valB, 260, fmtB);
      prev = { a: valA, b: valB };
      $$('.lab-experiment__metric', root).forEach(pulseRow);
      refs.metricALabel.textContent = labelA;
      refs.metricAFormula.textContent = formulaA;
      refs.metricBLabel.textContent = labelB;
      refs.metricBFormula.textContent = formulaB;

      setStars(refs.starsTg, stars, tier, { header: "Live score" });
      lastStars = stars;
      lastVal = valA;

      const ending = classifyEnding(currentMode, sc, slider, stars, valA);
      const newly = recordEnding(ending.id);
      setVerdict(refs.verdict,
        ending.icon + " " + ending.name + " ending" + (newly ? " · NEW ENDING" : ""),
        ending.sub,
        ending.state);
      renderEndingsTally(refs.endingsTally, "tg-", TG_ENDINGS_TOTAL);

      if (refs.sweetTg) {
        refs.sweetTg.hidden = !sweet;
        if (sweet) {
          refs.sweetTg.textContent = sweetText(currentMode, sc, slider, valA);
          unlockQuest("tg", "Block Race: you found the threshold.");
        }
      }
      refs.insight.textContent = insight;
      labFxSliderGlow(refs.n, sweet ? 1 : 0);
      drawPlot();
    }

    /* ---- Pending / run orchestration ---- */
    function pend(msg) {
      revealed = false;
      refs.naive.textContent = "…";
      refs.strict.textContent = "…";
      if (refs.sweetTg) refs.sweetTg.hidden = true;
      refs.insight.textContent = msg || "Pick a role, choose your strategy, then hit Run experiment.";
      setStars(refs.starsTg, 0, "Press Run to score", { header: "Run grade", pending: true });
      const head = currentMode === "mine" ? "⛏️ Goal: yeah Mr. White — yeah, hash!" :
                   currentMode === "attack" ? "🦹 Goal: orphan the public chain, say my name" :
                                              "🛡️ Goal: hold the line, tread lightly";
      setVerdict(refs.verdict, head, msg || "Pick scenario · choose the slider · hit Run experiment.", "pending");
      root.classList.add("lab-experiment--pending");
      root.classList.remove("lab-experiment--revealed");
    }
    function commitRun() {
      if (!refs.runBtn) return;
      const btnText = refs.runBtn.querySelector('.lab-btn__text');
      refs.runBtn.classList.add("is-running");
      refs.runBtn.disabled = true;
      if (btnText) btnText.textContent = "Running…";
      // Speed up the chain animation during the run, then revert.
      const fastMs = 180;
      const baseMs = currentMode === "mine" ? 700 : 600;
      startChainAnim(fastMs);
      setTimeout(function () {
        startChainAnim(baseMs);
        refs.runBtn.classList.remove("is-running");
        refs.runBtn.disabled = false;
        if (btnText) btnText.textContent = "Run again";
        revealed = true;
        root.classList.remove("lab-experiment--pending");
        root.classList.add("lab-experiment--revealed");
        update();
        // Persist the run to the URL so a "Share this run" link replays it.
        if (typeof pushShareUrl === "function") pushShareUrl();
      }, 1100);
    }

    /* ---- Event wiring ---- */
    if (refs.modeTabs) {
      refs.modeTabs.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".lab-mode-tab");
        if (!btn || !refs.modeTabs.contains(btn)) return;
        const mode = btn.dataset.mode;
        if (!MODES[mode] || mode === currentMode) return;
        currentMode = mode;
        currentIdx = 0;
        refs.modeTabs.querySelectorAll(".lab-mode-tab").forEach(b => {
          const on = b === btn;
          b.classList.toggle("lab-mode-tab--active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        renderScenarios();
        pend("New role. Pick a scenario, set your slider, hit Run.");
        drawPlot();
        startChainAnim();
      });
    }

    if (refs.levelsRow) {
      refs.levelsRow.addEventListener("click", function (ev) {
        const btn = ev.target.closest(".lab-level");
        if (!btn || !refs.levelsRow.contains(btn)) return;
        const idx = parseInt(btn.dataset.idx, 10);
        if (!isFinite(idx)) return;
        currentIdx = idx;
        refs.levelsRow.querySelectorAll(".lab-level").forEach(b => b.classList.remove("lab-level--active"));
        btn.classList.add("lab-level--active");
        if (revealed) pend("New scenario. Hit Run experiment.");
        drawPlot();
      });
    }

    refs.n.addEventListener("input", function () {
      updateSliderDisplay();
      if (revealed) pend("New strategy. Hit Run experiment to see if you cracked it.");
      drawPlot();
    });

    if (refs.runBtn) refs.runBtn.addEventListener("click", commitRun);

    /* ---- Share: URL state + popover ---- */
    function buildShareState() {
      const sc = MODES[currentMode].scenarios[currentIdx];
      const slider = parseInt(refs.n.value, 10);
      const params = { mode: currentMode, s: currentIdx, n: slider };
      if (revealed) params.r = lastStars;

      const stars = revealed ? lastStars : 0;
      const starsPrefix = revealed ? stars + "★ — " : "";
      let text;
      if (currentMode === "mine") {
        const detail = revealed
          ? " · E[blocks]=" + (sc.q * slider).toFixed(2) + " vs target " + sc.target
          : " · q=" + (sc.q * 100).toFixed(1) + "%, N=" + slider;
        text = starsPrefix + "⛏️ Block Race — mining " + sc.name + detail + ". Bitcoin consensus, playable.";
      } else if (currentMode === "attack") {
        const detail = revealed
          ? " · P(success)=" + (lastVal * 100).toFixed(1) + "%"
          : "";
        text = starsPrefix + "🦹 Block Race — double-spend on " + sc.name + " (q=" + slider + "%, z=" + sc.z + ")" + detail + ". Nakamoto §11 made playable.";
      } else {
        const detail = revealed
          ? " · P(attack)=" + (lastVal < 0.0001 ? lastVal.toExponential(1) : (lastVal * 100).toFixed(3) + "%")
          : "";
        text = starsPrefix + "🛡️ Block Race — defending vs " + sc.name + " (z=" + slider + ")" + detail + ". Hold the line.";
      }
      return { params: params, text: text, hashtags: "Bitcoin,Nakamoto", title: "Block Race" };
    }
    function pushShareUrl() {
      LabShare.write("tg", buildShareState().params);
    }
    function applyShareState(s) {
      if (!s) return;
      // Switch mode if it differs.
      if (s.mode && MODES[s.mode] && s.mode !== currentMode) {
        const tab = refs.modeTabs && refs.modeTabs.querySelector('[data-mode="' + s.mode + '"]');
        if (tab) tab.click();
      }
      // Scenario index. Read after a microtask so the mode click's re-render lands first.
      setTimeout(function () {
        const idx = parseInt(s.s, 10);
        if (isFinite(idx) && idx >= 0) {
          const btns = refs.levelsRow.querySelectorAll(".lab-level");
          if (btns[idx]) btns[idx].click();
        }
        const nVal = parseInt(s.n, 10);
        if (isFinite(nVal)) {
          refs.n.value = String(nVal);
          updateSliderDisplay();
          drawPlot();
        }
        // Auto-commit so the shared URL lands on the actual result, not pending.
        setTimeout(function () { if (refs.runBtn) refs.runBtn.click(); }, 240);
      }, 30);
    }
    wireShareButton({
      labKey: "tg",
      btn: refs.shareBtn,
      popover: refs.sharePopover,
      preview: refs.shareText,
      getState: buildShareState,
    });

    /* ---- Init ---- */
    renderScenarios();
    pend();
    drawPlot();
    renderEndingsTally(refs.endingsTally, "tg-", TG_ENDINGS_TOTAL);
    startChainAnim();

    // Replay state from the URL if a friend shared this run.
    const sharedState = LabShare.parse();
    if (sharedState && sharedState.lab === "tg") {
      applyShareState(sharedState);
    }
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
      shareBtn:     $('[data-role="wm-share-btn"]', root),
      sharePopover: $('[data-role="wm-share-popover"]', root),
      shareText:    $('[data-role="wm-share-text"]', root),
    };
    let wmLastStars = 0;
    let wmLastDet = 0;
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
      wmLastStars = wmStars;
      wmLastDet = det;
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
        if (typeof wmPushShareUrl === "function") wmPushShareUrl();
      }, 1100);
    }
    // Repaint the plot + grid from the current slider / scenario state.
    // The dramatic reveal still happens in the verdict / readout / star
    // bar; the visualisation is the "slingshot view" the player uses to
    // plan their shot.
    function wmRepaintVisual() {
      const eps = parseFloat(refs.eps.value);
      const k = parseInt(refs.k.value, 10);
      const sigma = wmCurrentSigma();
      const zc = zForOneSidedAlpha(FIXED_ALPHA);
      const q = qDetect(eps, sigma, zc);
      try { buildGrid(eps, k, sigma, q, false); } catch (e) {}
      try { drawPlot(eps, k, sigma); } catch (e) {}
    }
    function wmOnSlider() {
      wmSliderDisplay();
      if (wmRevealed) wmPendReadout("New strategy. Hit Run experiment to re-score.");
      wmRepaintVisual();
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

    /* ---- Share: URL state + popover ---- */
    function wmCurrentIdx() {
      const btns = refs.levels ? refs.levels.querySelectorAll(".lab-level") : [];
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains("lab-level--active")) return i;
      }
      return 0;
    }
    function wmBuildShareState() {
      const sc = wmCurrentLevel();
      const name = (sc && sc.dataset.name) ? sc.dataset.name : "thief";
      const eps = parseFloat(refs.eps.value);
      const k = parseInt(refs.k.value, 10);
      const idx = wmCurrentIdx();
      const params = { t: idx, eps: eps.toFixed(3), k: k };
      if (wmRevealed) params.r = wmLastStars;
      const starsPrefix = wmRevealed ? wmLastStars + "★ — " : "";
      const detail = wmRevealed ? " · detection=" + (wmLastDet * 100).toFixed(1) + "%" : "";
      const text = starsPrefix + "🕵️ Model Heist Detector — caught the " + name + " (ε=" + eps.toFixed(2) + ", k=" + k + ")" + detail + ". AI watermarks, playable.";
      return { params: params, text: text, hashtags: "AIsecurity,Watermark", title: "Model Heist Detector" };
    }
    function wmPushShareUrl() { LabShare.write("wm", wmBuildShareState().params); }
    function wmApplyShareState(s) {
      if (!s) return;
      setTimeout(function () {
        const idx = parseInt(s.t, 10);
        if (isFinite(idx) && refs.levels) {
          const btns = refs.levels.querySelectorAll(".lab-level");
          if (btns[idx]) btns[idx].click();
        }
        const eps = parseFloat(s.eps);
        if (isFinite(eps)) { refs.eps.value = eps; refs.eps.dispatchEvent(new Event("input")); }
        const k = parseInt(s.k, 10);
        if (isFinite(k))   { refs.k.value = k;     refs.k.dispatchEvent(new Event("input")); }
        setTimeout(function () { if (refs.runBtn) refs.runBtn.click(); }, 220);
      }, 30);
    }
    wireShareButton({
      labKey: "wm",
      btn: refs.shareBtn,
      popover: refs.sharePopover,
      preview: refs.shareText,
      getState: wmBuildShareState,
    });

    wmSliderDisplay();
    wmPendReadout();
    wmRepaintVisual();
    renderEndingsTally(refs.endingsTally, "wm-", WM_ENDINGS_TOTAL);

    const sharedStateWm = LabShare.parse();
    if (sharedStateWm && sharedStateWm.lab === "wm") wmApplyShareState(sharedStateWm);
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
      shareBtn:        $('[data-role="tmr-share-btn"]', root),
      sharePopover:    $('[data-role="tmr-share-popover"]', root),
      shareText:       $('[data-role="tmr-share-text"]', root),
    };
    let tmrLastStars = 0;
    let tmrLastGain  = 0;

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
      tmrLastStars = tmrStars;
      tmrLastGain  = gain;
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
        if (typeof tmrPushShareUrl === "function") tmrPushShareUrl();
      }, 1400);
    }
    // Repaint the curve plot from current scenario + slider state. The
    // channel strip stays paused (it would otherwise animate failure
    // events and visually leak the q value).
    function tmrRepaintVisual() {
      const q = tmrCurrentQ();
      const rho = tmrCurrentRho();
      const rhoEff = tmrEffectiveRho(rho);
      const N = refs.nChannels ? (parseInt(refs.nChannels.value, 10) || 3) : 3;
      try { drawPlot(q, rhoEff, N); } catch (e) {}
    }
    function tmrOnSlider() {
      tmrSliderDisplay();
      if (tmrRevealed) {
        tmrPendReadout("New strategy. Hit Run experiment to re-score.");
        stopSim();
        tmrClearStrip();
      }
      tmrRepaintVisual();
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

    /* ---- Share: URL state + popover ---- */
    function tmrCurrentIdx() {
      const btns = refs.levels ? refs.levels.querySelectorAll(".lab-level") : [];
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains("lab-level--active")) return i;
      }
      return 0;
    }
    function tmrBuildShareState() {
      const sc = tmrCurrentLevel();
      const name = (sc && sc.dataset.name) ? sc.dataset.name : "mission";
      const N = refs.nChannels ? parseInt(refs.nChannels.value, 10) : 3;
      const idx = tmrCurrentIdx();
      const params = { m: idx, n: N };
      if (tmrRevealed) params.r = tmrLastStars;
      const starsPrefix = tmrRevealed ? tmrLastStars + "★ — " : "";
      const detail = tmrRevealed ? " · safety multiplier " + (tmrLastGain >= 100 ? Math.round(tmrLastGain) + "×" : tmrLastGain.toFixed(1) + "×") : "";
      const text = starsPrefix + "✈️ Redundancy Reactor — defended " + name + " with N=" + N + " channels" + detail + ". Fault tolerance, playable.";
      return { params: params, text: text, hashtags: "FaultTolerance,Avionics", title: "Redundancy Reactor" };
    }
    function tmrPushShareUrl() { LabShare.write("tmr", tmrBuildShareState().params); }
    function tmrApplyShareState(s) {
      if (!s) return;
      setTimeout(function () {
        const idx = parseInt(s.m, 10);
        if (isFinite(idx) && refs.levels) {
          const btns = refs.levels.querySelectorAll(".lab-level");
          if (btns[idx]) btns[idx].click();
        }
        const N = parseInt(s.n, 10);
        if (isFinite(N) && refs.nChannels) {
          refs.nChannels.value = N;
          refs.nChannels.dispatchEvent(new Event("input"));
        }
        setTimeout(function () { if (refs.runBtn) refs.runBtn.click(); }, 220);
      }, 30);
    }
    wireShareButton({
      labKey: "tmr",
      btn: refs.shareBtn,
      popover: refs.sharePopover,
      preview: refs.shareText,
      getState: tmrBuildShareState,
    });

    tmrSliderDisplay();
    tmrPendReadout();
    tmrRepaintVisual();
    stopSim();

    const sharedStateTmr = LabShare.parse();
    if (sharedStateTmr && sharedStateTmr.lab === "tmr") tmrApplyShareState(sharedStateTmr);
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
      shareBtn:     $gd("gd-share-btn"),
      sharePopover: $gd("gd-share-popover"),
      shareText:    $gd("gd-share-text"),
    };
    let gdLastStars = 0;
    let gdLastLoss = 0;

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
        gdLastStars = 0;
        gdLastLoss = loss;
        gdHint(0);
        if (typeof gdPushShareUrl === "function") gdPushShareUrl();
      } else if (epoch > 500) {
        refs.insight.textContent = "⏳ The ball is crawling. Step size is too small.";
        setVerdict(refs.verdict,
          "⏳ Still crawling at epoch 500",
          "Step size is too small. Try raising it. The simulation has other patients to see.",
          "miss");
        running = false;
        setStars(refs.starsGd, 1, "Sketchy", { header: "Run grade" });
        gdLastStars = 1;
        gdLastLoss = loss;
        gdHint(1);
        if (typeof gdPushShareUrl === "function") gdPushShareUrl();
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
          gdLastStars = 5;
          gdLastLoss = loss;
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
           gdLastStars = gdS;
           gdLastLoss = loss;
           gdHint(gdS);
        }
        running = false;
        if (typeof gdPushShareUrl === "function") gdPushShareUrl();
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

    /* ---- Share: URL state + popover ---- */
    function gdBuildShareState() {
      const lr = parseFloat(refs.lr.value);
      const mom = parseFloat(refs.mom.value);
      const params = { lr: lr.toFixed(4), mom: mom.toFixed(3) };
      if (gdLastStars > 0) params.r = gdLastStars;
      const starsPrefix = gdLastStars > 0 ? gdLastStars + "★ — " : "";
      const detail = gdLastStars > 0 ? " · loss " + gdLastLoss.toFixed(3) : "";
      const text = starsPrefix + "⛰️ Gradient Pinball — α=" + lr.toFixed(3) + ", β=" + mom.toFixed(2) + detail + ". Optimization landscapes, playable.";
      return { params: params, text: text, hashtags: "DeepLearning,Optimization", title: "Gradient Pinball" };
    }
    function gdPushShareUrl() { LabShare.write("gd", gdBuildShareState().params); }
    function gdApplyShareState(s) {
      if (!s) return;
      setTimeout(function () {
        const lr = parseFloat(s.lr);
        const mom = parseFloat(s.mom);
        if (isFinite(lr))  { refs.lr.value = lr;   refs.lr.dispatchEvent(new Event("input")); }
        if (isFinite(mom)) { refs.mom.value = mom; refs.mom.dispatchEvent(new Event("input")); }
        setTimeout(function () { if (refs.trainBtn) refs.trainBtn.click(); }, 220);
      }, 30);
    }
    wireShareButton({
      labKey: "gd",
      btn: refs.shareBtn,
      popover: refs.sharePopover,
      preview: refs.shareText,
      getState: gdBuildShareState,
    });

    initPlot();

    const sharedStateGd = LabShare.parse();
    if (sharedStateGd && sharedStateGd.lab === "gd") gdApplyShareState(sharedStateGd);
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
      shareBtn:     $('[data-role="pol-share-btn"]', root),
      sharePopover: $('[data-role="pol-share-popover"]', root),
      shareText:    $('[data-role="pol-share-text"]', root),
    };
    let polLastStars = 0;
    let polLastScore = 0;

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
      polLastStars = polStars;
      polLastScore = score;
      polHint(polStars);
      if (typeof polPushShareUrl === "function") polPushShareUrl();
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

    /* ---- Share: URL state + popover ---- */
    function polBuildShareState() {
      const lr = parseFloat(refs.lr.value);
      const bsIdx = parseInt(refs.bs.value, 10);
      const params = { lr: lr.toFixed(4), bs: bsIdx };
      if (polLastStars > 0) params.r = polLastStars;
      const starsPrefix = polLastStars > 0 ? polLastStars + "★ — " : "";
      const detail = polLastStars > 0 ? " · score " + Math.round(polLastScore) : "";
      const text = starsPrefix + "🔬 Training Fingerprint — α=" + lr.toFixed(3) + ", batch=" + BATCH_SIZES[bsIdx] + detail + ". Proof-of-Learning, playable.";
      return { params: params, text: text, hashtags: "ProofOfLearning,MLsecurity", title: "Training Fingerprint" };
    }
    function polPushShareUrl() { LabShare.write("pol", polBuildShareState().params); }
    function polApplyShareState(s) {
      if (!s) return;
      setTimeout(function () {
        const lr = parseFloat(s.lr);
        const bsIdx = parseInt(s.bs, 10);
        if (isFinite(lr))    { refs.lr.value = lr;    refs.lr.dispatchEvent(new Event("input")); }
        if (isFinite(bsIdx)) { refs.bs.value = bsIdx; refs.bs.dispatchEvent(new Event("input")); }
        setTimeout(function () { if (refs.trainBtn) refs.trainBtn.click(); }, 220);
      }, 30);
    }
    wireShareButton({
      labKey: "pol",
      btn: refs.shareBtn,
      popover: refs.sharePopover,
      preview: refs.shareText,
      getState: polBuildShareState,
    });

    updateSliderDisplay();
    reset();

    const sharedStatePol = LabShare.parse();
    if (sharedStatePol && sharedStatePol.lab === "pol") polApplyShareState(sharedStatePol);
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
    if(typeof initBlockRaceQuickplay === "function") initBlockRaceQuickplay();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  /* ============================================================================
     Block Race · Quickplay
     ============================================================================
     The simplified default UI on top of the Block Race card. Visitors land,
     see one story, drag one slider, get one big answer. The full 3-mode
     simulator is collapsed below in a <details>. */
  function initBlockRaceQuickplay() {
    const root = document.querySelector('[data-role="tg-quickplay"]');
    if (!root) return;
    const refs = {
      attackers:    root.querySelector('[data-role="quick-attackers"]'),
      zSlider:      root.querySelector('[data-role="quick-z"]'),
      zVal:         root.querySelector('[data-role="quick-z-val"]'),
      time:         root.querySelector('[data-role="quick-time"]'),
      verdict:      root.querySelector('[data-role="quick-verdict-root"]'),
      emoji:        root.querySelector('[data-role="quick-emoji"]'),
      prob:         root.querySelector('[data-role="quick-prob"]'),
      label:        root.querySelector('[data-role="quick-label"]'),
      detail:       root.querySelector('[data-role="quick-detail"]'),
      shareBtn:     root.querySelector('[data-role="quick-share"]'),
      openAdv:      root.querySelector('[data-role="quick-open-advanced"]'),
      advanced:     document.querySelector('[data-role="tg-advanced"]'),
      modeTabs:     document.querySelector('[data-role="tg-mode-tabs"]'),
      levelsRow:    document.querySelector('[data-role="tg-levels-row"]'),
      labN:         document.querySelector('[data-role="n"]'),
    };

    // Re-use the same nakamoto formula that lives inside initTwoGeneralsLab,
    // but that one isn't exported. Recompute inline — identical to §11.
    function nakamoto(q, z) {
      if (q <= 0) return 0;
      if (q >= 0.5) return 1;
      if (z <= 0) return 1;
      const p = 1 - q;
      const lam = z * (q / p);
      let sum = 1;
      let pmf = Math.exp(-lam);
      for (let k = 0; k <= z; k++) {
        if (k > 0) pmf *= lam / k;
        const ratio = Math.pow(q / p, z - k);
        sum -= pmf * (1 - ratio);
      }
      return Math.max(0, Math.min(1, sum));
    }

    let currentQ   = 0.25;
    let currentIdx = 1;
    let currentName = "Mining pool";

    function fmtTime(z) {
      const m = z * 10;
      if (m < 60) return m + " min";
      if (m === 60) return "1 hour";
      if (m < 120) return "~1 hour";
      const h = m / 60;
      if (h === Math.round(h)) return h + " hours";
      return h.toFixed(1) + " hours";
    }
    function fmtProb(p) {
      if (p < 0.0001) return p.toExponential(1);
      if (p < 0.01)   return (p * 100).toFixed(3) + "%";
      if (p < 0.1)    return (p * 100).toFixed(2) + "%";
      return (p * 100).toFixed(1) + "%";
    }
    // Plain-English verdict bands. Tier governs the verdict border colour too.
    function verdictFor(p) {
      if (p < 0.0001) return { emoji: "🛡️", tier: "safe",   label: "Practically impossible.",        detail: "Fortress-grade. Sleep well — the math says no one's reversing this.", };
      if (p < 0.001)  return { emoji: "✅", tier: "safe",   label: "Practically safe.",               detail: "Exchange-grade confidence. This is what professional custody uses.", };
      if (p < 0.01)   return { emoji: "✅", tier: "ok",     label: "Reasonably safe.",                detail: "Classic 6-confirmation regime. Comfortable for most retail purchases.", };
      if (p < 0.05)   return { emoji: "⚠️", tier: "warn",   label: "Risky for big-ticket items.",     detail: "Fine for a coffee. Don't ship a Lambo. Saul says wait longer.", };
      if (p < 0.20)   return { emoji: "🚨", tier: "warn",   label: "Don't ship yet.",                 detail: "Hank Schrader is taking notes. One more block of patience could save the deal.", };
      return            { emoji: "💀", tier: "danger", label: "Reckless.",                       detail: "The double-spend math is laughing in 256-bit hex. Coffee-shop reflex on a treasury.", };
    }

    function update() {
      const z = parseInt(refs.zSlider.value, 10);
      const p = nakamoto(currentQ, z);
      refs.zVal.textContent = z;
      refs.time.textContent = fmtTime(z);
      const v = verdictFor(p);
      refs.emoji.textContent = v.emoji;
      refs.prob.textContent = fmtProb(p);
      refs.label.textContent = v.label;
      refs.detail.textContent = "Against a " + currentName + " (" + Math.round(currentQ * 100) + "% network hashrate), waiting " + z + " confirmation" + (z === 1 ? "" : "s") + " (≈ " + fmtTime(z) + ") leaves " + fmtProb(p) + " probability of reversal. " + v.detail;
      refs.verdict.classList.remove(
        "lab-quickplay__verdict--safe",
        "lab-quickplay__verdict--ok",
        "lab-quickplay__verdict--warn",
        "lab-quickplay__verdict--danger"
      );
      refs.verdict.classList.add("lab-quickplay__verdict--" + v.tier);
    }

    if (refs.attackers) {
      refs.attackers.addEventListener("click", function (ev) {
        const btn = ev.target.closest("button[data-q]");
        if (!btn) return;
        refs.attackers.querySelectorAll("button").forEach(function (b) {
          b.classList.remove("lab-quickplay__attacker--active");
          b.setAttribute("aria-checked", "false");
        });
        btn.classList.add("lab-quickplay__attacker--active");
        btn.setAttribute("aria-checked", "true");
        currentQ   = parseFloat(btn.dataset.q);
        currentIdx = parseInt(btn.dataset.idx, 10);
        currentName = btn.dataset.name || "adversary";
        update();
      });
    }
    refs.zSlider.addEventListener("input", update);

    // Share: build the URL directly using LabShare, with defend-mode params
    // that match this run. Mobile gets native share; desktop falls back to
    // clipboard copy + status feedback on the button.
    if (refs.shareBtn) {
      refs.shareBtn.addEventListener("click", function () {
        const z = parseInt(refs.zSlider.value, 10);
        const p = nakamoto(currentQ, z);
        const params = { mode: "defend", s: currentIdx, n: z };
        const url = LabShare.buildUrl("tg", params);
        const text = "🛡️ Block Race — waited " + z + " confirmation" + (z === 1 ? "" : "s") + " vs a " + currentName + " (" + Math.round(currentQ * 100) + "%). " + fmtProb(p) + " chance of reversal. Bitcoin consensus, playable.";
        const native = LabShare.tryNative({ title: "Lab · Block Race", text: text, url: url });
        if (native) return;
        const orig = refs.shareBtn.querySelector("span:last-child");
        const origText = orig ? orig.textContent : "Share this run";
        LabShare.copyLink(url).then(function (ok) {
          if (orig) orig.textContent = ok ? "✓ Link copied — paste anywhere" : "✗ Copy failed";
          setTimeout(function () { if (orig) orig.textContent = origText; }, 2200);
        });
      });
    }

    // Open the full simulator + sync defend-mode state to match quickplay
    if (refs.openAdv) {
      refs.openAdv.addEventListener("click", function () {
        if (!refs.advanced) return;
        refs.advanced.open = true;
        const defendTab = refs.modeTabs && refs.modeTabs.querySelector('[data-mode="defend"]');
        if (defendTab && !defendTab.classList.contains("lab-mode-tab--active")) {
          defendTab.click();
        }
        // After mode tab click, scenarios are re-rendered. Apply the
        // matching attacker scenario + slider after a microtask.
        setTimeout(function () {
          const levels = refs.levelsRow ? refs.levelsRow.querySelectorAll(".lab-level") : [];
          if (levels[currentIdx]) levels[currentIdx].click();
          const z = parseInt(refs.zSlider.value, 10);
          if (refs.labN) {
            refs.labN.value = String(z);
            refs.labN.dispatchEvent(new Event("input"));
          }
          // Scroll the advanced summary into view so the user sees it expand
          if (typeof refs.advanced.scrollIntoView === "function") {
            refs.advanced.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 60);
      });
    }

    update();
  }
})();
