/* =============================================================================
   bcml.js — cinematic explainer: what a ledger actually buys machine learning.

   Four scenes, taken from the author's survey (Ural & Yoshigoe, "Survey on
   Blockchain-Enhanced Machine Learning", IEEE Access 11, 2023,
   pp. 145331-145362, DOI 10.1109/ACCESS.2023.3344669). Every mechanism named
   here is one the survey reviews, and every figure is one it reports:

     1. integrity   Why a ledger under ML at all: data integrity, poisoning
                    and model-inversion threats, and a tamper-evident record
                    of the training process
     2. consensus   Consensus that does useful work — PoL, PoDL and Proof of
                    Training Quality channel compute into training instead of
                    burning it on hashes
     3. incentives  SUM's CollaborativeTrainer: gamification, prediction-market
                    rewards b_t = b_{t-1} + L(h_{t-1},D) - L(h_t,D), and the
                    deposit / refund / take self-assessment cycle
     4. limits      What the prototypes measured: DeepChain's accuracy rising
                    with parties while throughput falls, LearningChain's
                    privacy-accuracy trade-off, and the survey's own headline
                    challenges — scalability, energy, tailored consensus

   Honesty constraints, all of them the survey's own positions:
     • The survey is explicitly balanced: it reports limitations beside
       benefits, so this film ends on measured degradation rather than on a
       promise.
     • Raw data stays with its owner; the chain carries model parameters,
       transactions and validation records.
     • Byzantine robustness in LearningChain is an l-nearest aggregation
       heuristic, and its privacy noise costs test accuracy — a trade-off,
       not a free win.
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("bcml-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build();
    appendix();
  }

  var P = window.LabAnim.palette,
    E = window.LabAnim.ease,
    lerp = window.LabAnim.lerp,
    clamp01 = window.LabAnim.clamp01;
  var CY = P.sky,
    AMB = P.amber,
    RED = P.rose,
    GRN = P.good,
    GREY = P.faint,
    PURP = P.violet,
    WHITE = P.white,
    MUTED = P.muted;

  var MONO = "'JetBrains Mono', ui-monospace, monospace";

  /* ---------------------------------------------------------------- narration
     One shared bottom bar: two captions alive at once print text on text, so
     each panel's fade-out is deferred until the next panel's start is known
     (same pattern as oracles.js). */
  var _lowerCount = 0,
    _pend = null;

  function flushLower(s, nextAt) {
    if (!_pend) return;
    var eff = _pend.out || Infinity;
    if (s && _pend.s === s && typeof nextAt === "number") eff = Math.min(eff, nextAt - 1.1);
    if (isFinite(eff)) _pend.s.fadeOut(_pend.c, { at: Math.max(eff, _pend.at + 1.2), dur: 0.9 });
    _pend = null;
  }

  function lower(s, html, at, o) {
    s.audio("bcml_" + _lowerCount++, at);
    o = o || {};
    flushLower(s, at);
    var c = s.caption(html, {
      px: 0,
      py: 540,
      anchor: "bottom-left",
      align: "left",
      size: o.size,
      panel: true
    });
    s.fadeIn(c, { at: at, dur: o.dur || 1.4 });
    _pend = { s: s, c: c, at: at, out: o.out || null };
    return c;
  }

  /* ------------------------------------------------------------------ helpers */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  function box(ctx, h, x, y, w, hh, color, alpha, label, sub) {
    ctx.fillStyle = h.rgba(color, alpha * 0.12);
    rr(ctx, x, y, w, hh, 10);
    ctx.fill();
    ctx.strokeStyle = h.rgba(color, alpha * 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = h.rgba(WHITE, alpha);
      ctx.font = "bold 15px " + MONO;
      ctx.textAlign = "center";
      ctx.fillText(label, x + w / 2, y + (sub ? hh / 2 - 2 : hh / 2 + 5));
      if (sub) {
        ctx.fillStyle = h.rgba(MUTED, alpha * 0.9);
        ctx.font = "12px " + MONO;
        ctx.fillText(sub, x + w / 2, y + hh / 2 + 18);
      }
      ctx.textAlign = "left";
    }
  }

  /* ============================================================ SCENE 1
     Why a ledger under ML at all. */
  function sceneIntegrity(film) {
    film.scene("The Training Process, Written Down", 42, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        var threats = [
          { n: "data poisoning", d: "bad data, still rewarded", y: 120 },
          { n: "model inversion", d: "training data recovered", y: 196 },
          { n: "silent tampering", d: "no record of what changed", y: 272 }
        ];
        for (var i = 0; i < threats.length; i++) {
          var a = clamp01((lt - 1.2 - i * 0.7) / 0.6);
          if (a <= 0) continue;
          ctx.globalAlpha = op * a;
          box(ctx, h, 70, threats[i].y, 330, 58, RED, a, threats[i].n, threats[i].d);
          ctx.globalAlpha = op;
        }

        var lIn = clamp01((lt - 5.0) / 0.8);
        if (lIn > 0) {
          ctx.globalAlpha = op * lIn;
          box(ctx, h, 560, 120, 330, 210, AMB, lIn, "", "");
          ctx.fillStyle = h.rgba(AMB, lIn);
          ctx.font = "bold 15px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("DISTRIBUTED LEDGER", 725, 152);
          ctx.textAlign = "left";
          var props = ["immutable", "tamper-evident", "transparent", "irreversible"];
          for (var k = 0; k < props.length; k++) {
            var ki = clamp01((lt - 6.0 - k * 0.4) / 0.5);
            if (ki <= 0) continue;
            ctx.fillStyle = h.rgba(WHITE, lIn * ki);
            ctx.font = "13px " + MONO;
            ctx.fillText("· " + props[k], 596, 190 + k * 32);
          }
          ctx.globalAlpha = op;
        }

        if (lt > 12) {
          var aIn = clamp01((lt - 12) / 0.8);
          ctx.globalAlpha = op * aIn;
          ctx.strokeStyle = h.rgba(AMB, aIn * 0.8);
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(404, 225);
          ctx.lineTo(556, 225);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = op;
        }

        if (lt > 20) {
          var rIn = clamp01((lt - 20) / 0.8);
          ctx.globalAlpha = op * rIn;
          box(ctx, h, 70, 380, 380, 62, CY, rIn, "RAW DATA STAYS HOME", "owned by the contributor");
          box(ctx, h, 510, 380, 380, 62, AMB, rIn, "ON CHAIN", "parameters · transactions · validation");
          ctx.globalAlpha = op;
        }

        if (lt > 30) {
          var nIn = clamp01((lt - 30) / 0.8);
          ctx.globalAlpha = op * nIn;
          ctx.fillStyle = h.rgba(MUTED, nIn);
          ctx.font = "13px " + MONO;
          ctx.fillText("a record of the process is not a judgement of the data", 70, 478);
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "Machine learning has three problems a ledger is unusually well suited to. Training data can be poisoned by contributors who still collect their reward. Models leak the data they were trained on. And nothing in a finished model records what actually happened to it.",
        1.4
      );
      lower(
        s,
        "A distributed ledger answers the third directly: record every transaction tied to the training process, and the record becomes immutable, tamper-evident and transparent. Unauthorised modification stops being invisible.",
        12.5
      );
      lower(
        s,
        "Note what does <em>not</em> go on it. Raw data stays with its owner; the chain carries model parameters, the transactions around them, and the validation results. That is what makes the arrangement privacy-preserving rather than merely public.",
        20.6
      );
      lower(
        s,
        "And be precise about the guarantee. A record of the process is evidence of what happened — it is not a judgement of whether the data was any good. That takes a separate mechanism, which is where the interesting work is.",
        30.6,
        { out: 41.0 }
      );
    });
  }

  /* ============================================================ SCENE 2
     Consensus that does useful work. */
  function sceneConsensus(film) {
    film.scene("Consensus That Does Useful Work", 46, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        if (lt < 15) {
          var pOut = 1 - clamp01((lt - 13.4) / 1.4);
          ctx.globalAlpha = op * pOut;
          box(ctx, h, 260, 130, 440, 96, RED, pOut, "PROOF OF WORK", "hash until one is small enough");
          if (lt > 3.4) {
            var bi = clamp01((lt - 3.4) / 0.8);
            ctx.fillStyle = h.rgba(RED, pOut * bi);
            ctx.font = "bold 16px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText("the computation has no value outside the puzzle", 480, 268);
            ctx.textAlign = "left";
          }
          for (var q = 0; q < 22; q++) {
            var qt = (lt - 1.0) * 1.4 - q * 0.28;
            if (qt <= 0 || qt > 1) continue;
            ctx.fillStyle = h.rgba(RED, op * pOut * (1 - qt) * 0.7);
            ctx.font = "12px " + MONO;
            ctx.fillText("0x" + ((q * 7919) % 65536).toString(16), 300 + (q % 6) * 68, 300 + Math.floor(q / 6) * 26);
          }
          ctx.globalAlpha = op;
        }

        if (lt < 15) return;
        var t = lt - 15;
        var a = clamp01(t / 0.8);
        ctx.globalAlpha = op * a;

        ctx.fillStyle = h.rgba(WHITE, a);
        ctx.font = "bold 17px " + MONO;
        ctx.textAlign = "center";
        ctx.fillText("point the same compute at a model instead", 480, 88);
        ctx.textAlign = "left";

        var mechs = [
          { n: "Proof of Learning", d: "training work becomes the consensus work", c: CY },
          { n: "Proof of Deep Learning", d: "integrity and authenticity of the model", c: PURP },
          { n: "Proof of Training Quality", d: "consensus on the quality of a contribution", c: GRN }
        ];
        for (var i = 0; i < mechs.length; i++) {
          var mi = clamp01((t - 1.4 - i * 1.0) / 0.8);
          if (mi <= 0) continue;
          ctx.globalAlpha = op * mi;
          box(ctx, h, 70, 130 + i * 92, 820, 72, mechs[i].c, mi, mechs[i].n, mechs[i].d);
          ctx.globalAlpha = op * a;
        }

        if (t > 8) {
          var ci = clamp01((t - 8) / 0.8);
          ctx.globalAlpha = op * ci;
          ctx.fillStyle = h.rgba(AMB, ci);
          ctx.font = "bold 15px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("the electricity produces a trained model, not a discarded hash", 480, 442);
          ctx.textAlign = "left";
          ctx.globalAlpha = op * a;
        }

        if (t > 18) {
          var oi = clamp01((t - 18) / 0.8);
          ctx.globalAlpha = op * oi;
          box(ctx, h, 240, 462, 480, 56, RED, oi, "OPEN PROBLEM", "how do you verify the work was really done?");
          ctx.globalAlpha = op * a;
        }
      });

      lower(
        s,
        "Then the survey turns to the part most reviews skip: the consensus layer itself. Proof of Work reaches agreement by making everyone hash until someone gets lucky — and that computation has no value the moment it is spent.",
        1.4
      );
      lower(
        s,
        "So point the same compute somewhere useful. Proof of Learning makes the training run itself the work that earns consensus. Proof of Deep Learning extends it to the integrity and authenticity of the resulting model.",
        16.0
      );
      lower(
        s,
        "Proof of Training Quality goes further and asks the network to agree not merely that work happened, but that the contribution was <em>good</em> — which is the question the ledger alone could never answer.",
        24.0
      );
      lower(
        s,
        "The electricity now buys a trained model instead of a discarded hash. And it opens exactly one hard question in return: how do you verify the work was really done? That question is where my own later research lives.",
        32.5,
        { out: 45.0 }
      );
    });
  }

  /* ============================================================ SCENE 3
     SUM: paying for good data. */
  function sceneIncentives(film) {
    film.scene("Paying for Good Data", 50, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        if (lt < 13) {
          var cOut = 1 - clamp01((lt - 11.4) / 1.4);
          ctx.globalAlpha = op * cOut;
          box(ctx, h, 300, 96, 360, 62, CY, cOut, "CollaborativeTrainer", "smart contract");
          var parts = [
            { n: "addData(x, y)", y: 190 },
            { n: "IncentiveMechanism", y: 258 },
            { n: "DataHandler", y: 326 },
            { n: "Model · predict / update", y: 394 }
          ];
          for (var i = 0; i < parts.length; i++) {
            var pi = clamp01((lt - 1.6 - i * 0.6) / 0.6);
            if (pi <= 0) continue;
            ctx.globalAlpha = op * cOut * pi;
            box(ctx, h, 300, parts[i].y, 360, 52, i === 1 ? AMB : GREY, pi, parts[i].n, "");
            ctx.strokeStyle = h.rgba(GREY, cOut * pi * 0.5);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(480, parts[i].y - 16);
            ctx.lineTo(480, parts[i].y);
            ctx.stroke();
            ctx.globalAlpha = op * cOut;
          }
          ctx.globalAlpha = op;
        }

        if (lt < 13) return;
        var t = lt - 13;
        var a = clamp01(t / 0.8);
        ctx.globalAlpha = op * a;

        // reward formula
        ctx.fillStyle = h.rgba(WHITE, a);
        ctx.font = "bold 15px " + MONO;
        ctx.fillText("reward the improvement you actually caused", 70, 82);
        if (t > 1.2) {
          var fi = clamp01((t - 1.2) / 0.8);
          ctx.fillStyle = h.rgba(CY, a * fi);
          ctx.font = "bold 21px " + MONO;
          ctx.fillText("b(t) = b(t-1) + L(h(t-1), D) - L(h(t), D)", 70, 126);
          ctx.fillStyle = h.rgba(MUTED, a * fi);
          ctx.font = "12px " + MONO;
          ctx.fillText("balance grows by how much your data lowered the loss on the held-out set", 70, 152);
        }

        // deposit / refund / take
        if (t > 6) {
          var di = clamp01((t - 6) / 0.8);
          ctx.globalAlpha = op * di;
          var phases = [
            { n: "DEPLOY", d: "train initial h" },
            { n: "DEPOSIT", d: "stake d on your data" },
            { n: "REFUND", d: "returned after t \u2265 7 days" },
            { n: "TAKE", d: "forfeited if h(x) \u2260 y" }
          ];
          for (var k = 0; k < phases.length; k++) {
            var ki = clamp01((t - 6.2 - k * 0.5) / 0.6);
            if (ki <= 0) continue;
            ctx.globalAlpha = op * di * ki;
            box(ctx, h, 70 + k * 212, 190, 196, 66, k === 3 ? RED : GRN, ki, phases[k].n, phases[k].d);
            ctx.globalAlpha = op * di;
          }
          ctx.globalAlpha = op * a;
        }

        // simulation outcome
        if (t > 16) {
          var si = clamp01((t - 16) / 0.9);
          ctx.globalAlpha = op * si;
          var gx = 90,
            gy = 440,
            gw = 780,
            gh = 150;
          ctx.strokeStyle = h.rgba(GREY, si * 0.5);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + gw, gy);
          ctx.stroke();

          var prog = clamp01((t - 17) / 5.0);
          ctx.strokeStyle = h.rgba(GRN, si);
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (var d1 = 0; d1 <= 100 * prog; d1++) {
            var x1 = gx + (d1 / 100) * gw;
            var y1 = gy - (d1 / 100) * gh * 0.95;
            if (d1 === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
          }
          ctx.stroke();

          ctx.strokeStyle = h.rgba(RED, si);
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          for (var d2 = 0; d2 <= 100 * prog; d2++) {
            var x2 = gx + (d2 / 100) * gw;
            var y2 = gy - gh * 0.5 + (d2 / 100) * gh * 0.5;
            if (d2 === 0) ctx.moveTo(x2, y2);
            else ctx.lineTo(x2, y2);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = h.rgba(GRN, si);
          ctx.font = "bold 13px " + MONO;
          ctx.fillText("good agents", gx + gw * prog + 8, gy - gh * 0.95 * prog);
          ctx.fillStyle = h.rgba(RED, si);
          ctx.fillText("bad agents", gx + gw * prog + 8, gy - gh * 0.5 + gh * 0.5 * prog);
          ctx.fillStyle = h.rgba(MUTED, si);
          ctx.font = "12px " + MONO;
          ctx.fillText("balance over ~150 days, model accuracy held", gx, gy + 26);
          ctx.globalAlpha = op * a;
        }
      });

      lower(
        s,
        "Which brings the survey to its centre of gravity: incentives. In the Sharing Updatable Model framework a smart contract called CollaborativeTrainer takes data, runs an incentive mechanism, and updates the model in one place.",
        1.4
      );
      lower(
        s,
        "The reward is not paid for volume. A contributor's balance moves by the improvement their data caused — the loss on a held-out set before their update, minus the loss after it. Contribute noise and the term is negative.",
        14.5
      );
      lower(
        s,
        "A second mechanism makes that stake real: deposit currency when you submit, get it refunded after a waiting period if your data held up, and forfeit it when the model disagrees with your label.",
        20.5
      );
      lower(
        s,
        "In simulation the two populations separate cleanly — good agents accumulate balance, bad agents drain to nothing, and the model's accuracy is preserved throughout. The market does the filtering the ledger cannot.",
        30.0,
        { out: 49.0 }
      );
    });
  }

  /* ============================================================ SCENE 4
     What the prototypes actually measured. */
  function sceneLimits(film) {
    film.scene("What the Prototypes Actually Measured", 46, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        var dIn = clamp01((lt - 0.8) / 0.8);
        if (dIn > 0) {
          ctx.globalAlpha = op * dIn;
          box(ctx, h, 70, 92, 380, 58, CY, dIn, "DeepChain", "Corda V3.0 · MNIST prototype");
          ctx.globalAlpha = op;
        }

        // accuracy up, throughput down
        if (lt > 3) {
          var gi = clamp01((lt - 3) / 0.9);
          ctx.globalAlpha = op * gi;
          var gx = 90,
            gy = 330,
            gw = 340,
            gh = 150;
          ctx.strokeStyle = h.rgba(GREY, gi * 0.5);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx + gw, gy);
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy - gh);
          ctx.stroke();

          var prog = clamp01((lt - 4) / 3.0);
          ctx.strokeStyle = h.rgba(GRN, gi);
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (var i = 0; i <= 100 * prog; i++) {
            var x = gx + (i / 100) * gw;
            var y = gy - (1 - Math.exp(-i / 34)) * gh * 0.9;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.strokeStyle = h.rgba(RED, gi);
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          for (var j = 0; j <= 100 * prog; j++) {
            var x2 = gx + (j / 100) * gw;
            var y2 = gy - gh * 0.85 + (j / 100) * gh * 0.7;
            if (j === 0) ctx.moveTo(x2, y2);
            else ctx.lineTo(x2, y2);
          }
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = h.rgba(GRN, gi);
          ctx.font = "bold 13px " + MONO;
          ctx.fillText("accuracy", gx + 250, gy - gh * 0.92);
          ctx.fillStyle = h.rgba(RED, gi);
          ctx.fillText("throughput", gx + 232, gy - gh * 0.1);
          ctx.fillStyle = h.rgba(MUTED, gi);
          ctx.font = "12px " + MONO;
          ctx.fillText("parties participating \u2192", gx + 90, gy + 26);
          ctx.globalAlpha = op;
        }

        var lIn = clamp01((lt - 15) / 0.8);
        if (lIn > 0) {
          ctx.globalAlpha = op * lIn;
          box(ctx, h, 510, 92, 380, 58, PURP, lIn, "LearningChain", "decentralized SGD");
          var items = [
            { n: "differential-privacy noise", d: "privacy up, test error up", c: AMB },
            { n: "l-nearest aggregation", d: "counters Byzantine workers", c: GRN }
          ];
          for (var k = 0; k < items.length; k++) {
            var ki = clamp01((lt - 16 - k * 0.8) / 0.7);
            if (ki <= 0) continue;
            ctx.globalAlpha = op * lIn * ki;
            box(ctx, h, 510, 180 + k * 84, 380, 66, items[k].c, ki, items[k].n, items[k].d);
            ctx.globalAlpha = op * lIn;
          }
          ctx.globalAlpha = op;
        }

        if (lt > 26) {
          var cIn = clamp01((lt - 26) / 0.9);
          ctx.globalAlpha = op * cIn;
          ctx.fillStyle = h.rgba(WHITE, cIn);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("the survey's own headline challenges:", 90, 410);
          var ch = ["scalability", "energy cost", "consensus built for ML, not for coins"];
          for (var c2 = 0; c2 < ch.length; c2++) {
            var ci2 = clamp01((lt - 27 - c2 * 0.5) / 0.6);
            if (ci2 <= 0) continue;
            ctx.globalAlpha = op * cIn * ci2;
            box(ctx, h, 90 + c2 * 268, 430, 248, 58, RED, ci2, "", "");
            ctx.fillStyle = h.rgba(WHITE, ci2);
            ctx.font = "13px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText(ch[c2], 214 + c2 * 268, 464);
            ctx.textAlign = "left";
            ctx.globalAlpha = op * cIn;
          }
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "Does any of it work? DeepChain was built and measured — a Corda prototype trained on MNIST, with parties uploading local gradients and workers paid by a processing contract.",
        1.4
      );
      lower(
        s,
        "The result is honest in both directions. Accuracy improves as more parties join, exactly as the argument predicts. But throughput falls as the number of gradients grows, and total training time climbs with every party added.",
        6.0
      );
      lower(
        s,
        "LearningChain shows the same shape from a different angle: noise added for differential privacy buys real privacy and costs real test accuracy, while an l-nearest aggregation rule blunts Byzantine workers without eliminating them.",
        16.0
      );
      lower(
        s,
        "Which is why the survey closes on challenges rather than on a promise: scalability, energy cost, and the need for consensus mechanisms designed for machine learning rather than inherited from currency.",
        26.5
      );
      lower(
        s,
        "A review that only sells the idea is worth nothing. The useful contribution is knowing precisely where the seams are — and one of those seams, verifying that training really happened, became the subject of my dissertation.",
        35.0,
        { out: 45.0 }
      );
    });
  }

  /* -------------------------------------------------------------------- build */
  function build() {
    var film = window.LabAnim.create("#bcml-film", { width: 960, height: 540 });
    sceneIntegrity(film);
    sceneConsensus(film);
    sceneIncentives(film);
    sceneLimits(film);
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__bcmlFilm = film;
  }

  /* ----------------------------------------------------------------- appendix */
  function appendix() {
    var host = document.querySelector('[data-role="bcml-appendix"]');
    if (!host || !window.katex) return;

    var blocks = [
      {
        h: "What the chain carries, and what it does not",
        tex: "\\text{on-chain: } \\{\\theta_t,\\ \\text{tx},\\ \\text{validation}\\}\\qquad \\text{off-chain: raw data } D_k \\ \\text{(stays with its owner)}",
        note:
          "Blockchain contributes six properties the survey enumerates — distributed ledger, immutability, cryptography, consensus, transparency, irreversibility — and they apply to the record of training, not to the training set. Model parameters and validation results are shared and updated on chain while raw data remains on the contributors' devices, which is what makes the arrangement privacy-preserving instead of merely public. The record is evidence of process; it is not a judgement of data quality."
      },
      {
        h: "Consensus that produces something",
        tex: "\\text{PoW: } H(\\text{nonce}\\,\\|\\,b) < \\tau \\;\\longrightarrow\\; \\text{PoL / PoDL / PoQ: the training run is the work}",
        note:
          "Proof of Work spends electricity on a puzzle whose answer is worthless once found. The survey reviews the alternatives that channel that compute into training instead: Proof of Learning makes model training the consensus work, Proof of Deep Learning targets the integrity and authenticity of the resulting model, and Proof of Training Quality asks the network to agree on the quality of a contribution rather than merely its existence. Each buys a trained model with the same electricity — and each inherits one hard question: verifying that the claimed work was actually performed."
      },
      {
        h: "Rewarding the improvement you caused",
        tex: "b_t = b_{t-1} + L\\big(h_{t-1},D\\big) - L\\big(h_t,D\\big)",
        note:
          "From the Sharing Updatable Model framework's prediction-market incentive: a contributor's balance moves by how much their update reduced the loss on a held-out set D. Volume earns nothing; noise earns a negative term. A second mechanism — deposit, refund, take — requires a stake d when submitting data, refunds it after a waiting period (t ≥ 7 days) if the data holds up, and forfeits it when the model's prediction disagrees with the submitted label. In simulation the good and bad populations separate: honest balances grow, dishonest ones drain to zero, and model accuracy is preserved."
      },
      {
        h: "The measured limits",
        tex: "\\text{accuracy} \\uparrow \\text{ with parties};\\qquad \\text{throughput} \\downarrow \\text{ with gradients};\\qquad \\text{time} \\uparrow \\text{ with parties}",
        note:
          "DeepChain's Corda/MNIST prototype improves in accuracy as more parties participate, while throughput degrades as the gradient count grows and total training time rises with every added party. LearningChain reports the companion trade-off: differential-privacy noise buys privacy at the cost of test accuracy, and its l-nearest aggregation blunts Byzantine workers rather than removing them. These are why the survey's stated challenges are scalability, energy cost, and the need for consensus mechanisms designed for machine learning rather than inherited from cryptocurrency."
      }
    ];
    var html = "";
    for (var i = 0; i < blocks.length; i++) {
      html +=
        '<h4>' +
        blocks[i].h +
        "</h4><div class='lab-math__tex' id='bcml-tex-" +
        i +
        "'></div><p>" +
        blocks[i].note +
        "</p>";
    }
    host.innerHTML = html;

    for (var j = 0; j < blocks.length; j++) {
      var el = document.getElementById("bcml-tex-" + j);
      if (!el) continue;
      try {
        window.katex.render(blocks[j].tex, el, { displayMode: true, throwOnError: false });
      } catch (e) {
        el.textContent = blocks[j].tex;
      }
    }
  }

  boot();
})();
