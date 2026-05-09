/* =============================================================================
   Lab — interactive thought experiments
   Two Generals' Problem · Spot the Watermark
   Vanilla JS, no dependencies. Drives elements rendered in /lab/.

   Design principle: each demo must visibly demonstrate the concept, not
   just animate prettily.
   - Two Generals: each general has a SEPARATE terminal showing only what
     THEY know. Their "Sent" line always carries a (?) — the paradox is
     literally visible.
   - Watermark: the watermark is a structured, KEYED pattern (diagonal,
     cross, frame, etc.), not random cells. Reveal shows a recognisable
     shape — that's the verifier's secret key.
   ============================================================================= */
(function () {
  "use strict";

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ===========================================================================
     PUZZLE 1 · Two Generals' Problem
     The protocol: A initiates. After A's plan reaches B, B sends an ack.
     After A receives the ack, A sends an ack-of-ack. And so on.
     Each side's "Sent: L_n" never gets confirmed (only the OTHER side's
     "Got: L_n ✓" confirms it). So Sent always carries a (?).
     =========================================================================== */
  function initTwoGenerals() {
    const root = document.getElementById("puzzle-tg");
    if (!root) return;

    const widget = $(".lab-tg", root);
    const lossRate = parseFloat(widget.dataset.lossRate || "0.4");
    const valley = $('[data-role="valley"]', widget);
    const btnNext = $('[data-role="next"]', widget);
    const btnReset = $('[data-role="reset"]', widget);

    const refs = {
      aSent:   $('[data-role="a-sent"]',   widget),
      aRecv:   $('[data-role="a-recv"]',   widget),
      aBelief: $('[data-role="a-belief"]', widget),
      bSent:   $('[data-role="b-sent"]',   widget),
      bRecv:   $('[data-role="b-recv"]',   widget),
      bBelief: $('[data-role="b-belief"]', widget),
      rounds:  $('[data-role="rounds"]',   widget),
      lost:    $('[data-role="lost"]',     widget),
      paradox: $('[data-role="paradox-status"]', widget),
    };

    /* state — each general tracks their own "last sent" and "last received" */
    const st = {
      A: { sent: 0, recv: 0 },
      B: { sent: 0, recv: 0 },
    };
    let nextSender = "A";   // A initiates the protocol
    let rounds = 0;
    let lost = 0;
    let busy = false;

    const ANIM_MS = 1700;

    function levelLabel(level, withQ) {
      if (level === 0) return "—";
      return "L" + level + (withQ ? " (?)" : " ✓");
    }

    function beliefFor(side) {
      const me = st[side];
      const other = side === "A" ? "B" : "A";
      if (me.sent === 0 && me.recv === 0) {
        return side === "A"
          ? "Plan ready. Ready to send the first messenger."
          : "Awaiting first messenger from A.";
      }
      if (me.sent > me.recv) {
        return "Sent L" + me.sent + ". I don't know if " + other + " got it.";
      }
      // me.recv >= me.sent — I just received and need to acknowledge.
      return "Got L" + me.recv + ". Time to send L" + (me.recv + 1) + " back.";
    }

    function paradoxLine() {
      if (rounds === 0) return "Both sides still uncertain.";
      if (rounds < 5)   return "Notice: each side's Sent line carries (?). They never know if it arrived.";
      if (rounds < 12)  return "However many rounds, the (?) does not go away.";
      return "Q.E.D. — perfect agreement is impossible over an unreliable channel.";
    }

    function refresh() {
      refs.aSent.textContent   = levelLabel(st.A.sent, true);
      refs.aRecv.textContent   = levelLabel(st.A.recv, false);
      refs.bSent.textContent   = levelLabel(st.B.sent, true);
      refs.bRecv.textContent   = levelLabel(st.B.recv, false);
      refs.aBelief.textContent = beliefFor("A");
      refs.bBelief.textContent = beliefFor("B");
      refs.rounds.textContent  = rounds;
      refs.lost.textContent    = lost;
      refs.paradox.textContent = paradoxLine();
      btnNext.textContent      = "Send next  (" + nextSender + " → " + (nextSender === "A" ? "B" : "A") + ")";
    }

    function send() {
      if (busy) return;
      busy = true;
      rounds++;

      const sender   = nextSender;
      const receiver = sender === "A" ? "B" : "A";
      // The next message a side sends is one level above what they've received.
      const sendLevel = st[sender].recv + 1;
      st[sender].sent = sendLevel;
      const captured = Math.random() < lossRate;

      // Show the sender's "Sent: Lx (?)" immediately — they don't wait
      // for the messenger to arrive to update their own log.
      refresh();

      const direction = sender === "A" ? "ab" : "ba";
      const dot = document.createElement("span");
      dot.className = "lab-tg__dot lab-tg__dot--" + direction + (captured ? " lab-tg__dot--lost" : "");
      valley.appendChild(dot);

      setTimeout(() => {
        if (!captured) {
          // Receiver learns of the message. Now THEY are next sender.
          st[receiver].recv = sendLevel;
          nextSender = receiver;
        } else {
          // Receiver knows nothing changed. Same sender retries.
          lost++;
          // nextSender stays the same.
        }
        dot.remove();
        refresh();
        busy = false;
      }, ANIM_MS);
    }

    function reset() {
      if (busy) return;
      st.A.sent = st.A.recv = 0;
      st.B.sent = st.B.recv = 0;
      rounds = 0;
      lost = 0;
      nextSender = "A";
      $$('.lab-tg__dot', valley).forEach((d) => d.remove());
      refresh();
    }

    btnNext.addEventListener("click", send);
    btnReset.addEventListener("click", reset);
    refresh();
  }

  /* ===========================================================================
     PUZZLE 2 · Spot the Watermark
     The watermark is a structured, KEYED set of cells. Each round we cycle
     through a curated list of patterns (diagonal, anti-diagonal, cross,
     centre block, top row, frame). Same pattern shape every time it's
     picked — that's the curriculum. The base grid is randomised, and the
     watermarked cells get a small saturation+lightness bump that's hard
     to spot without knowing where to look but visible upon reveal.
     =========================================================================== */
  function initWatermark() {
    const root = document.getElementById("puzzle-wm");
    if (!root) return;

    const grid0     = $('[data-role="grid-0"]',    root);
    const grid1     = $('[data-role="grid-1"]',    root);
    const feedback  = $('[data-role="feedback"]',  root);
    const btnNew    = $('[data-role="new-round"]', root);
    const btnReveal = $('[data-role="reveal"]',    root);
    const scoreEl   = $('[data-role="score"]',     root);

    const N = 8;
    const NCELLS = N * N;
    const SHIFT = 0.24;       // value bump on watermarked cells
    const SAT_BUMP = 18;      // saturation bump (perceptual)

    /* Each pattern = a fixed set of cell indices forming a recognisable
       shape on an 8x8 grid. row r, col c → index r*8 + c. */
    const PATTERNS = [
      { name: "main diagonal", cells: [0, 9, 18, 27, 36, 45, 54, 63] },
      { name: "anti-diagonal", cells: [7, 14, 21, 28, 35, 42, 49, 56] },
      { name: "centred cross", cells: [3, 11, 19, 27, 35, 43, 51, 59, 24, 25, 26, 28, 29, 30, 31] },
      { name: "centre block",  cells: [27, 28, 35, 36, 43, 44] },
      { name: "top row",       cells: [0, 1, 2, 3, 4, 5, 6, 7] },
      { name: "border frame",  cells: [
        0, 1, 2, 3, 4, 5, 6, 7,
        56, 57, 58, 59, 60, 61, 62, 63,
        8, 16, 24, 32, 40, 48,
        15, 23, 31, 39, 47, 55,
      ] },
    ];

    let currentPattern = PATTERNS[0];
    let keySet         = new Set(currentPattern.cells);
    let baseValues     = [];
    let watermarkedIdx = 0;
    let answered       = false;
    let revealed       = false;
    let correct        = 0;
    let total          = 0;
    let patternIdx     = 0;

    function newBaseValues() {
      // Smoothed noise — a few uniform samples averaged per cell.
      return Array.from({ length: NCELLS }, () => {
        let s = 0;
        for (let i = 0; i < 3; i++) s += Math.random();
        return s / 3;
      });
    }

    function valueToColor(v, isKey) {
      // Base palette: deep teal → pale cyan, theme-friendly in light + dark.
      const hue   = 200 - v * 30;
      let   sat   = 60 + v * 20;
      let   light = 32 + v * 38;
      if (isKey) {
        // Watermarked cells: more saturated, slightly darker — a perceptual
        // shift, not just a brightness change.
        sat   = Math.min(95, sat + SAT_BUMP);
        light = Math.max(26, light - 6);
      }
      return "hsl(" + hue.toFixed(0) + " " + sat.toFixed(0) + "% " + light.toFixed(0) + "%)";
    }

    function buildGridDom(values, isWm, gridEl) {
      gridEl.innerHTML = "";
      gridEl.classList.remove("lab-wm__grid--correct", "lab-wm__grid--wrong", "lab-wm__grid--reveal");
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
        gridEl.appendChild(cell);
      });
    }

    function startRound() {
      answered = false;
      revealed = false;
      // Cycle through patterns deterministically — this is a curated
      // curriculum, not random noise.
      currentPattern = PATTERNS[patternIdx % PATTERNS.length];
      patternIdx++;
      keySet     = new Set(currentPattern.cells);
      baseValues = newBaseValues();
      watermarkedIdx = Math.random() < 0.5 ? 0 : 1;

      const wmValues = baseValues.map((v, i) =>
        keySet.has(i) ? Math.max(0, Math.min(1, v + SHIFT)) : v
      );
      const valuesA = watermarkedIdx === 0 ? wmValues : baseValues;
      const valuesB = watermarkedIdx === 1 ? wmValues : baseValues;

      buildGridDom(valuesA, watermarkedIdx === 0, grid0);
      buildGridDom(valuesB, watermarkedIdx === 1, grid1);

      feedback.textContent = "Click either grid. The watermark is a structured shape — try to spot it.";
      feedback.className   = "lab-wm__feedback";
    }

    function onGuess(idx) {
      if (answered) return;
      answered = true;
      total++;
      const right = idx === watermarkedIdx;
      if (right) correct++;
      const target = idx === 0 ? grid0 : grid1;
      target.classList.add(right ? "lab-wm__grid--correct" : "lab-wm__grid--wrong");
      const truth = watermarkedIdx === 0 ? grid0 : grid1;
      truth.classList.add("lab-wm__grid--reveal");
      const lead = right ? "Correct" : "Not quite";
      feedback.textContent =
        lead + " — the watermarked grid is highlighted. Pattern: " + currentPattern.name + ".";
      feedback.className =
        "lab-wm__feedback lab-wm__feedback--" + (right ? "ok" : "no");
      scoreEl.textContent = correct + " / " + total;
      revealed = true;
    }

    function manualReveal() {
      if (revealed) return;
      const truth = watermarkedIdx === 0 ? grid0 : grid1;
      truth.classList.add("lab-wm__grid--reveal");
      feedback.textContent = "Pattern revealed: " + currentPattern.name + ".";
      feedback.className   = "lab-wm__feedback";
      revealed = true;
    }

    grid0.addEventListener("click", () => onGuess(0));
    grid1.addEventListener("click", () => onGuess(1));
    btnNew.addEventListener("click", startRound);
    btnReveal.addEventListener("click", manualReveal);

    scoreEl.textContent = "0 / 0";
    startRound();
  }

  /* ----------------------------------------------------------------- bootstrap */
  function boot() {
    initTwoGenerals();
    initWatermark();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
