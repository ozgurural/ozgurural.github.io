/* =============================================================================
   Lab — multiple-choice thought puzzles.
   Each <section class="lab-puzzle" data-correct="x"> has four buttons with
   data-choice="a"|"b"|"c"|"d" and a hidden .lab-puzzle__explain block that
   reveals on first click. Picking is one-shot per puzzle: after a click,
   the chosen answer + the correct answer are both highlighted, and the
   explanation appears.
   ============================================================================= */
(function () {
  "use strict";

  function bind(puzzle) {
    const correct = puzzle.dataset.correct;
    if (!correct) return;
    const choices = Array.from(puzzle.querySelectorAll(".lab-puzzle__choice"));
    const explain = puzzle.querySelector(".lab-puzzle__explain");
    if (!explain || choices.length === 0) return;
    let answered = false;

    function reveal(picked) {
      if (answered) return;
      answered = true;
      const isRight = picked === correct;
      choices.forEach((btn) => {
        const choice = btn.dataset.choice;
        if (choice === picked) {
          btn.classList.add(isRight ? "lab-puzzle__choice--right" : "lab-puzzle__choice--wrong");
          if (isRight) btn.setAttribute("aria-checked", "true");
        }
        if (choice === correct && !isRight) {
          btn.classList.add("lab-puzzle__choice--right");
        }
        btn.disabled = true;
      });
      explain.hidden = false;
      // Smooth-scroll the explanation into view if it's below the fold.
      const rect = explain.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        explain.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    choices.forEach((btn) => {
      btn.addEventListener("click", () => reveal(btn.dataset.choice));
    });
  }

  function boot() {
    document.querySelectorAll(".lab-puzzle").forEach(bind);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
