/* =============================================================================
   Lab — interactive challenges that double as knowledge tests.

   1. The Two Generals' Game.
      Player picks one of four protocols. We run 10 simulated battles with
      a 40% messenger loss rate and animate each one. The scoreboard then
      reveals what running all four reveals: more confirmation rounds DO
      NOT improve the win rate — they reduce it. There is no 100% strategy.

   2. The Verifier's Eye.
      Five sequential rounds of binary classification (watermarked vs
      plain). Watermark patterns are structured (diagonal / cross /
      frame / etc.) and the per-cell perturbation magnitude shrinks each
      round. Exactly one round (chosen randomly inside positions 1..3)
      is plain noise — to defeat the trivial "always say watermarked"
      strategy. Final score is compared to verifier / random / untrained
      baselines.

   Vanilla JS, no deps.
   ============================================================================= */
(function () {
  "use strict";
  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ===========================================================================
     PUZZLE 1 · The Two Generals' Game
     =========================================================================== */
  function initTwoGenerals() {
    const root = document.getElementById("puzzle-tg");
    if (!root) return;

    const widget   = $(".lab-tg", root);
    const lossRate = parseFloat(widget.dataset.lossRate || "0.4");
    const valley   = $('[data-role="valley"]', widget);
    const btnRun   = $('[data-role="run"]', widget);
    const btnReset = $('[data-role="reset"]', widget);
    const refs = {
      aDecision: $('[data-role="a-decision"]', widget),
      bDecision: $('[data-role="b-decision"]', widget),
      wins:      $('[data-role="wins"]', widget),
      aAlone:    $('[data-role="a-alone"]', widget),
      bAlone:    $('[data-role="b-alone"]', widget),
      neutral:   $('[data-role="neutral"]', widget),
      insight:   $('[data-role="insight"]', widget),
    };
    const stats = { wins: 0, aAlone: 0, bAlone: 0, neutral: 0, byStrategy: {} };
    let busy = false;

    /* Each protocol returns:
         { trace: [{from, delivered}], aAttacks, bAttacks }
       B's behaviour across protocols (for fairness): B attacks iff B has
       received the most recent A→B message AND, for protocols beyond
       'naive', the chain is unbroken up through the last B-side decision
       point. We keep B's rule the same — only A's commit-rule varies. */
    const protocols = {
      naive: function () {
        // A sends 1 message. A always attacks. B attacks iff B got it.
        const planDel = Math.random() >= lossRate;
        return {
          trace:    [{ from: "A", delivered: planDel }],
          aAttacks: true,
          bAttacks: planDel,
        };
      },
      confirm: function () {
        // A sends. If B got it, B sends ack. A attacks iff A got the ack.
        // B attacks iff B got the plan.
        const planDel = Math.random() >= lossRate;
        const trace = [{ from: "A", delivered: planDel }];
        let ackDel = false;
        if (planDel) {
          ackDel = Math.random() >= lossRate;
          trace.push({ from: "B", delivered: ackDel });
        }
        return { trace: trace, aAttacks: ackDel, bAttacks: planDel };
      },
      triple: function () {
        // Three round-trips. 6 messages: A→B, B→A, A→B, B→A, A→B, B→A.
        // Each later message is sent only if the previous arrived (chain).
        // A attacks iff A received message 6 (final ack). B attacks iff B
        // received the latest A→B that landed (1, 3, or 5).
        const trace = [];
        let chain = true;
        let lastFromA_delivered = false;
        let lastFromB_delivered = false;
        for (let r = 0; r < 3 && chain; r++) {
          const aDel = Math.random() >= lossRate;
          trace.push({ from: "A", delivered: aDel });
          if (!aDel) { chain = false; break; }
          lastFromA_delivered = true;
          const bDel = Math.random() >= lossRate;
          trace.push({ from: "B", delivered: bDel });
          if (!bDel) { chain = false; break; }
          lastFromB_delivered = true;
        }
        return {
          trace:    trace,
          aAttacks: lastFromB_delivered && chain, // got the very last ack
          bAttacks: lastFromA_delivered,           // got at least one A-side msg
        };
      },
      abort: function () {
        return { trace: [], aAttacks: false, bAttacks: false };
      },
    };

    function getStrategy() {
      const checked = widget.querySelector('input[name="tg-strategy"]:checked');
      return (checked && checked.value) || "naive";
    }
    function getStratLabel(name) {
      return ({
        naive:   "Naive",
        confirm: "Wait for ack",
        triple:  "Triple round-trip",
        abort:   "Abort",
      })[name] || name;
    }
    function recordOutcome(strategyName, r) {
      let key;
      if (r.aAttacks && r.bAttacks)       { stats.wins++;    key = "wins"; }
      else if (r.aAttacks && !r.bAttacks) { stats.aAlone++;  key = "aAlone"; }
      else if (!r.aAttacks && r.bAttacks) { stats.bAlone++;  key = "bAlone"; }
      else                                { stats.neutral++; key = "neutral"; }
      const s = (stats.byStrategy[strategyName] = stats.byStrategy[strategyName] || { wins: 0, aAlone: 0, bAlone: 0, neutral: 0, total: 0 });
      s[key]++; s.total++;
    }

    function refresh() {
      refs.wins.textContent    = stats.wins;
      refs.aAlone.textContent  = stats.aAlone;
      refs.bAlone.textContent  = stats.bAlone;
      refs.neutral.textContent = stats.neutral;
    }

    function setInsight(strategyName) {
      const s = stats.byStrategy[strategyName];
      if (!s || s.total === 0) {
        refs.insight.textContent = "Pick a protocol and run 10 battles. Then try the next.";
        return;
      }
      const pct = (n) => ((n / s.total) * 100).toFixed(0);
      refs.insight.textContent =
        getStratLabel(strategyName) +
        ": " + pct(s.wins) + "% wins, " +
        pct(s.aAlone + s.bAlone) + "% one-side losses, " +
        pct(s.neutral) + "% retreats over " + s.total + " battles. " +
        (strategyName === "abort"
          ? "Safe — but useless."
          : "No 100% — and never will be.");
    }

    /* Animation: walk a dot for each message in the trace, then briefly
       freeze on the final decisions. Speed picked so 10 battles of the
       longest protocol take roughly 12s — fast enough to stay engaging. */
    const ANIM_DOT_MS = 280;
    const ANIM_GAP_MS = 220;

    function animateBattle(result, doneCallback) {
      refs.aDecision.textContent = "";
      refs.bDecision.textContent = "";
      const trace = result.trace;
      let i = 0;
      function nextStep() {
        if (i >= trace.length) {
          refs.aDecision.textContent = result.aAttacks ? "⚔ attack" : "retreat";
          refs.aDecision.className   = "lab-tg__decision lab-tg__decision--" + (result.aAttacks ? "attack" : "retreat");
          refs.bDecision.textContent = result.bAttacks ? "⚔ attack" : "retreat";
          refs.bDecision.className   = "lab-tg__decision lab-tg__decision--" + (result.bAttacks ? "attack" : "retreat");
          setTimeout(doneCallback, ANIM_GAP_MS);
          return;
        }
        const msg = trace[i++];
        const dot = document.createElement("span");
        dot.className = "lab-tg__dot lab-tg__dot--" + (msg.from === "A" ? "ab" : "ba") + (msg.delivered ? "" : " lab-tg__dot--lost");
        dot.style.animationDuration = ANIM_DOT_MS + "ms";
        valley.appendChild(dot);
        setTimeout(() => { dot.remove(); nextStep(); }, ANIM_DOT_MS);
      }
      nextStep();
    }

    function runOnce(strategyName, done) {
      const result = protocols[strategyName]();
      recordOutcome(strategyName, result);
      refresh();
      animateBattle(result, done);
    }

    function runMany(n) {
      if (busy) return;
      busy = true;
      btnRun.disabled = true;
      const strategyName = getStrategy();
      let runs = 0;
      function step() {
        if (runs >= n) {
          busy = false;
          btnRun.disabled = false;
          setInsight(strategyName);
          return;
        }
        runs++;
        runOnce(strategyName, step);
      }
      step();
    }

    btnRun.addEventListener("click", () => runMany(10));
    btnReset.addEventListener("click", () => {
      if (busy) return;
      stats.wins = stats.aAlone = stats.bAlone = stats.neutral = 0;
      stats.byStrategy = {};
      refs.aDecision.textContent = "—";
      refs.bDecision.textContent = "—";
      refs.aDecision.className = "lab-tg__decision";
      refs.bDecision.className = "lab-tg__decision";
      $$('.lab-tg__dot', valley).forEach((d) => d.remove());
      refresh();
      refs.insight.textContent = "Pick a protocol and run 10 battles. Then try the next.";
    });

    refresh();
  }

  /* ===========================================================================
     PUZZLE 2 · The Verifier's Eye
     5 rounds of binary classification with rising subtlety.
     =========================================================================== */
  function initVerifier() {
    const root = document.getElementById("puzzle-wm");
    if (!root) return;

    const grid       = $('[data-role="grid"]',       root);
    const btnYes     = $('[data-role="yes"]',         root);
    const btnNo      = $('[data-role="no"]',          root);
    const btnRestart = $('[data-role="restart"]',     root);
    const feedback   = $('[data-role="feedback"]',    root);
    const scoreEl    = $('[data-role="score"]',       root);
    const roundEl    = $('[data-role="round-num"]',   root);
    const diffEl     = $('[data-role="difficulty"]',  root);
    const finalBar   = $('[data-role="finalbar"]',    root);
    const finalMsg   = $('[data-role="final-msg"]',   root);

    const N = 8, NCELLS = N * N;
    const SAT_BUMP = 18;

    const PATTERNS = [
      { name: "main diagonal",  cells: [0, 9, 18, 27, 36, 45, 54, 63] },
      { name: "anti-diagonal",  cells: [7, 14, 21, 28, 35, 42, 49, 56] },
      { name: "centred cross",  cells: [3, 11, 19, 27, 35, 43, 51, 59, 24, 25, 26, 28, 29, 30, 31] },
      { name: "centre block",   cells: [27, 28, 35, 36, 43, 44] },
      { name: "top row",        cells: [0, 1, 2, 3, 4, 5, 6, 7] },
      { name: "border frame",   cells: [
        0,1,2,3,4,5,6,7, 56,57,58,59,60,61,62,63,
        8,16,24,32,40,48, 15,23,31,39,47,55,
      ] },
    ];

    /* Five rounds with declining subtlety. */
    const ROUNDS = [
      { shift: 0.32, label: "subtlety: low" },
      { shift: 0.26, label: "subtlety: medium" },
      { shift: 0.20, label: "subtlety: high" },
      { shift: 0.16, label: "subtlety: very high" },
      { shift: 0.12, label: "subtlety: expert" },
    ];

    let roundIdx = 0;
    let correct  = 0;
    let answered = false;
    let plainRoundIdx = 0;
    let currentPattern = PATTERNS[0];
    let currentIsWatermarked = true;

    function newBaseValues() {
      return Array.from({ length: NCELLS }, () => {
        let s = 0;
        for (let i = 0; i < 3; i++) s += Math.random();
        return s / 3;
      });
    }
    function valueToColor(v, isKey) {
      const hue   = 200 - v * 30;
      let   sat   = 60 + v * 20;
      let   light = 32 + v * 38;
      if (isKey) {
        sat   = Math.min(95, sat + SAT_BUMP);
        light = Math.max(26, light - 6);
      }
      return "hsl(" + hue.toFixed(0) + " " + sat.toFixed(0) + "% " + light.toFixed(0) + "%)";
    }
    function buildGrid(values, isWm, keySet) {
      grid.innerHTML = "";
      grid.classList.remove("lab-wm__grid--reveal");
      const vmin = Math.min.apply(null, values);
      const vmax = Math.max.apply(null, values);
      const range = (vmax - vmin) || 1;
      values.forEach((raw, i) => {
        const v = (raw - vmin) / range;
        const isKey = isWm && keySet.has(i);
        const cell = document.createElement("span");
        cell.className = "lab-wm__cell";
        cell.style.background = valueToColor(v, isKey);
        if (isKey) cell.dataset.key = "1";
        grid.appendChild(cell);
      });
    }

    function startGame() {
      roundIdx = 0;
      correct  = 0;
      finalBar.hidden = true;
      // Pick which round (1..3, zero-indexed) is plain noise — never first or last
      // so the user has to actively reason rather than memorise position.
      plainRoundIdx = 1 + Math.floor(Math.random() * 3);
      newRound();
      btnYes.disabled = false;
      btnNo.disabled = false;
    }

    function newRound() {
      answered = false;
      const cfg = ROUNDS[roundIdx];
      // Cycle patterns; pick one for this round.
      currentPattern = PATTERNS[roundIdx % PATTERNS.length];
      currentIsWatermarked = roundIdx !== plainRoundIdx;
      const keySet = new Set(currentPattern.cells);
      const base = newBaseValues();
      const values = currentIsWatermarked
        ? base.map((v, i) => keySet.has(i) ? Math.max(0, Math.min(1, v + cfg.shift)) : v)
        : base.slice();
      buildGrid(values, currentIsWatermarked, keySet);
      roundEl.textContent = roundIdx + 1;
      diffEl.textContent  = cfg.label;
      scoreEl.textContent = correct + " / " + roundIdx;
      feedback.textContent = "Look carefully. The watermark, if present, traces a structured shape. Make your call.";
      feedback.className   = "lab-wm__feedback";
    }

    function answer(saidWatermarked) {
      if (answered) return;
      answered = true;
      const isRight = saidWatermarked === currentIsWatermarked;
      if (isRight) correct++;
      // Reveal the truth visually
      if (currentIsWatermarked) grid.classList.add("lab-wm__grid--reveal");
      const truth = currentIsWatermarked
        ? "actually watermarked (pattern: " + currentPattern.name + ")"
        : "actually plain noise — no pattern";
      feedback.textContent = (isRight ? "Correct" : "Wrong") + " — this grid was " + truth + ".";
      feedback.className   = "lab-wm__feedback lab-wm__feedback--" + (isRight ? "ok" : "no");
      scoreEl.textContent  = correct + " / " + (roundIdx + 1);
      btnYes.disabled = true;
      btnNo.disabled  = true;

      // Advance after a brief beat.
      setTimeout(() => {
        if (roundIdx + 1 < ROUNDS.length) {
          roundIdx++;
          btnYes.disabled = false;
          btnNo.disabled  = false;
          newRound();
        } else {
          finishGame();
        }
      }, 1500);
    }

    function finishGame() {
      btnYes.disabled = true;
      btnNo.disabled  = true;
      finalBar.hidden = false;
      const lines = {
        5: "5 / 5 — verifier-grade. You'd have caught every spoofing attempt.",
        4: "4 / 5 — strong. Better than an attentive eye without the key (~3/5).",
        3: "3 / 5 — about even with random guessing on the harder rounds.",
        2: "2 / 5 — below random. The adversarial round caught you.",
        1: "1 / 5 — almost the inverse of the right answer.",
        0: "0 / 5 — try again. Perfect-inverse is itself a signal.",
      };
      finalMsg.textContent = lines[correct] || ("Score: " + correct + " / 5.");
    }

    btnYes.addEventListener("click", () => answer(true));
    btnNo.addEventListener("click",  () => answer(false));
    btnRestart.addEventListener("click", startGame);

    startGame();
  }

  /* ----------------------------------------------------------------- bootstrap */
  function boot() {
    initTwoGenerals();
    initVerifier();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
