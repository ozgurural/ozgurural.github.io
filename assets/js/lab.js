/* =============================================================================
   Lab — interactive thought experiments
   Two Generals' Problem · Spot the Watermark
   Vanilla JS, no dependencies. Drives elements rendered in /lab/.
   ============================================================================= */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ helpers */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const rand = (max) => Math.floor(Math.random() * max);

  /* ===========================================================================
     PUZZLE 1 · Two Generals' Problem
     =========================================================================== */
  function initTwoGenerals() {
    const root = document.getElementById("puzzle-tg");
    if (!root) return;

    const widget = $(".lab-tg", root);
    const lossRate = parseFloat(widget.dataset.lossRate || "0.4");
    const valley = $('[data-role="valley"]', widget);
    const stateA = $('[data-role="state-a"]', widget);
    const stateB = $('[data-role="state-b"]', widget);
    const btnA = $('[data-role="send-a"]', widget);
    const btnB = $('[data-role="send-b"]', widget);
    const btnReset = $('[data-role="reset"]', widget);
    const sentEl = $('[data-role="sent"]', widget);
    const lostEl = $('[data-role="lost"]', widget);
    const ckEl = $('[data-role="ck"]', widget);

    let sent = 0, lost = 0, ck = 0, busy = false;
    // Whose "turn" it is to send (whoever just received the last successful message
    // is the one who needs to confirm).
    let nextSender = "A";

    const ckLabels = [
      "none",
      "B knows the plan",
      "A knows that B knows",
      "B knows that A knows that B knows",
      "A knows that B knows that A knows that B knows",
      "deeper still — but never certain",
    ];

    function setState(side, text, tone) {
      const el = side === "A" ? stateA : stateB;
      el.textContent = text;
      el.className = "lab-tg__state" + (tone ? " lab-tg__state--" + tone : "");
    }

    function setControls() {
      btnA.disabled = busy || nextSender !== "A";
      btnB.disabled = busy || nextSender !== "B";
    }

    function refreshCounters() {
      sentEl.textContent = sent;
      lostEl.textContent = lost;
      ckEl.textContent = ckLabels[Math.min(ck, ckLabels.length - 1)];
    }

    function send(direction) {
      if (busy) return;
      busy = true;
      sent++;
      const lostThis = Math.random() < lossRate;
      const dot = document.createElement("span");
      dot.className = "lab-tg__dot lab-tg__dot--" + direction + (lostThis ? " lab-tg__dot--lost" : "");
      valley.appendChild(dot);
      // describe sending side
      const senderState = direction === "ab" ? stateA : stateB;
      const receiverState = direction === "ab" ? stateB : stateA;
      const senderLabel = direction === "ab" ? "A" : "B";
      const receiverLabel = direction === "ab" ? "B" : "A";
      setState(senderLabel, "Messenger sent — awaiting confirmation", "pending");
      // animation duration must match CSS .lab-tg__dot animation length
      const ANIM = 1800;
      setTimeout(() => {
        if (lostThis) {
          lost++;
          setState(senderLabel, "Messenger captured — still uncertain", "lost");
          // receiver state unchanged
          dot.remove();
        } else {
          // Successful delivery — common knowledge advances by one level
          ck++;
          // Receiver acknowledges in their own head
          if (ck === 1) {
            setState("A", "Sent plan — knows B may not have got it", "pending");
            setState("B", "Got the plan — does A know I got it?", "ok");
            nextSender = "B";
          } else if (ck === 2) {
            setState("A", "Got B's ack — does B know I got it?", "ok");
            setState("B", "Sent ack — awaiting confirmation", "pending");
            nextSender = "A";
          } else {
            // even-numbered: A just confirmed; odd: B just confirmed
            const aJust = (ck % 2 === 0);
            if (aJust) {
              setState("A", "Got another ack — but B still doesn't know I did", "ok");
              setState("B", "Sent ack — awaiting confirmation", "pending");
              nextSender = "A";
            } else {
              setState("A", "Sent ack — awaiting confirmation", "pending");
              setState("B", "Got A's ack — but A doesn't know I did", "ok");
              nextSender = "B";
            }
          }
          dot.remove();
        }
        refreshCounters();
        busy = false;
        setControls();
      }, ANIM);
    }

    btnA.addEventListener("click", () => send("ab"));
    btnB.addEventListener("click", () => send("ba"));
    btnReset.addEventListener("click", () => {
      if (busy) return;
      sent = 0; lost = 0; ck = 0; nextSender = "A";
      $$('.lab-tg__dot', valley).forEach((d) => d.remove());
      setState("A", "Plan ready · awaiting word from B");
      setState("B", "Awaiting plan from A");
      refreshCounters();
      setControls();
    });

    refreshCounters();
    setControls();
  }

  /* ===========================================================================
     PUZZLE 2 · Spot the Watermark
     =========================================================================== */
  function initWatermark() {
    const root = document.getElementById("puzzle-wm");
    if (!root) return;

    const grid0 = $('[data-role="grid-0"]', root);
    const grid1 = $('[data-role="grid-1"]', root);
    const feedback = $('[data-role="feedback"]', root);
    const btnNew = $('[data-role="new-round"]', root);
    const btnReveal = $('[data-role="reveal"]', root);
    const scoreEl = $('[data-role="score"]', root);

    const N = 8;          // grid edge
    const NCELLS = N * N; // 64
    const KEY_SIZE = 6;   // watermark touches this many cells
    const SHIFT = 0.22;   // perturbation strength (0..1 of value range)

    let watermarkedIndex = 0;   // which of the two grids has the WM
    let keyPositions = [];      // indices into 0..NCELLS-1
    let baseValues = [];        // float[NCELLS], values 0..1
    let answered = false;
    let revealed = false;
    let correct = 0, total = 0;

    function newBaseValues() {
      // Smooth-ish noise: average of a few uniform samples for each cell.
      // Gives the grid a bit of structure rather than pure random.
      return Array.from({ length: NCELLS }, () => {
        let s = 0;
        for (let i = 0; i < 3; i++) s += Math.random();
        return s / 3;
      });
    }

    function pickKey() {
      // Pick KEY_SIZE distinct positions, biased toward inner cells for visual subtlety.
      const candidates = [];
      for (let i = 0; i < NCELLS; i++) candidates.push(i);
      // Fisher–Yates partial shuffle, take first KEY_SIZE.
      for (let i = 0; i < KEY_SIZE; i++) {
        const j = i + rand(candidates.length - i);
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      return candidates.slice(0, KEY_SIZE).sort((a, b) => a - b);
    }

    function valueToColor(v) {
      // v in [0,1] → an HSL gradient (deep blue → pale cyan) that works in light + dark
      const hue = 200 - v * 30;            // 200 → 170
      const sat = 60 + v * 20;              // 60% → 80%
      const light = 32 + v * 38;            // 32% → 70%
      return `hsl(${hue.toFixed(0)} ${sat.toFixed(0)}% ${light.toFixed(0)}%)`;
    }

    function buildGridDom(values, isWm, gridEl) {
      gridEl.innerHTML = "";
      gridEl.classList.remove("lab-wm__grid--correct", "lab-wm__grid--wrong", "lab-wm__grid--reveal");
      const vmin = Math.min.apply(null, values);
      const vmax = Math.max.apply(null, values);
      const range = (vmax - vmin) || 1;
      values.forEach((raw, i) => {
        const v = (raw - vmin) / range;
        const cell = document.createElement("span");
        cell.className = "lab-wm__cell";
        cell.style.background = valueToColor(v);
        if (isWm && keyPositions.includes(i)) {
          cell.dataset.key = "1";
        }
        gridEl.appendChild(cell);
      });
    }

    function startRound() {
      answered = false;
      revealed = false;
      keyPositions = pickKey();
      baseValues = newBaseValues();
      watermarkedIndex = Math.random() < 0.5 ? 0 : 1;
      const wmValues = baseValues.map((v, i) =>
        keyPositions.includes(i) ? Math.max(0, Math.min(1, v + SHIFT)) : v
      );
      const valuesA = watermarkedIndex === 0 ? wmValues : baseValues;
      const valuesB = watermarkedIndex === 1 ? wmValues : baseValues;
      buildGridDom(valuesA, watermarkedIndex === 0, grid0);
      buildGridDom(valuesB, watermarkedIndex === 1, grid1);
      feedback.textContent = "Click either grid to make a guess.";
      feedback.className = "lab-wm__feedback";
    }

    function onGuess(idx) {
      if (answered) return;
      answered = true;
      total++;
      const right = idx === watermarkedIndex;
      if (right) correct++;
      const target = idx === 0 ? grid0 : grid1;
      target.classList.add(right ? "lab-wm__grid--correct" : "lab-wm__grid--wrong");
      const truth = watermarkedIndex === 0 ? grid0 : grid1;
      truth.classList.add("lab-wm__grid--reveal");
      feedback.textContent = right
        ? "Correct — that one carries the watermark."
        : "Not quite — the highlighted grid is the watermarked one.";
      feedback.className = "lab-wm__feedback lab-wm__feedback--" + (right ? "ok" : "no");
      scoreEl.textContent = correct + " / " + total;
      revealed = true;
    }

    function manualReveal() {
      if (revealed) return;
      const truth = watermarkedIndex === 0 ? grid0 : grid1;
      truth.classList.add("lab-wm__grid--reveal");
      feedback.textContent = "Watermarked grid highlighted.";
      feedback.className = "lab-wm__feedback";
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
