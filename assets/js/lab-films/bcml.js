/* =============================================================================
   bcml.js — cinematic explainer: what a blockchain can and cannot do for ML.

   Four scenes, grounded in the author's survey (Ural & Yoshigoe,
   "Survey on Blockchain-Enhanced Machine Learning", IEEE Access 2023,
   pp. 145331-145362, DOI 10.1109/ACCESS.2023.3344669):

     1. unauditable   Weights forget where they came from
     2. commit        Commit, don't store — a Merkle root anchors terabytes
     3. rounds        Federated rounds on chain — commit-reveal + robust mean
     4. ceiling       Incentives, and the throughput ceiling that bounds it all

   Honesty constraints deliberately kept on stage, because a survey that only
   sells the idea is worthless:
     • The chain stores COMMITMENTS, never data or gradients. Every "on-chain
       ML" claim that implies otherwise is describing an off-chain system with
       an on-chain receipt.
     • A Merkle root proves INTEGRITY (this is the data that was committed),
       never QUALITY (this data was any good). Provenance is not validation.
     • Robust aggregation bounds the damage of a minority of Byzantine
       clients; it does not detect a well-crafted, in-distribution poison.
     • The throughput gap is ~3-4 orders of magnitude and is structural, not
       an engineering to-do. It is why settlement goes on chain and the
       learning loop does not.
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
     Weights forget their provenance. Four contributors feed an aggregator;
     one shard is poisoned; the trained model looks identical either way. */
  function sceneUnauditable(film) {
    film.scene("Weights Forget Where They Came From", 42, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        var shards = [
          { y: 90, name: "hospital A", bad: false },
          { y: 170, name: "hospital B", bad: false },
          { y: 250, name: "clinic C", bad: true },
          { y: 330, name: "registry D", bad: false }
        ];

        // Contributors
        for (var i = 0; i < shards.length; i++) {
          var sh = shards[i];
          var appear = clamp01((lt - 1.2 - i * 0.35) / 0.5);
          if (appear <= 0) continue;
          ctx.globalAlpha = op * appear;
          // Before the reveal at t=14 the poisoned shard is indistinguishable.
          var revealed = sh.bad && lt > 14;
          var col = revealed ? RED : CY;
          box(ctx, h, 60, sh.y, 175, 52, col, appear, sh.name, "shard d" + (i + 1));
        }
        ctx.globalAlpha = op;

        // Aggregator
        var aggIn = clamp01((lt - 3.4) / 0.7);
        if (aggIn > 0) {
          ctx.globalAlpha = op * aggIn;
          box(ctx, h, 395, 175, 180, 130, GREY, aggIn, "TRAINING", "aggregator");
          ctx.fillStyle = h.rgba(MUTED, aggIn * 0.75);
          ctx.font = "34px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("?", 485, 275);
          ctx.textAlign = "left";
          ctx.globalAlpha = op;
        }

        // Flowing samples
        if (lt > 4.2) {
          for (var k = 0; k < 26; k++) {
            var pt = (lt - 4.2) * 0.85 - k * 0.32;
            if (pt <= 0 || pt > 1) continue;
            var src = shards[k % shards.length];
            var px = lerp(240, 393, E.smooth(pt));
            var py = lerp(src.y + 26, 240, E.smooth(pt));
            var bad = src.bad && lt > 14;
            ctx.fillStyle = h.rgba(bad ? RED : CY, op * (1 - pt * 0.35));
            ctx.beginPath();
            ctx.arc(px, py, 3.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Model
        var mIn = clamp01((lt - 6.5) / 0.7);
        if (mIn > 0) {
          ctx.globalAlpha = op * mIn;
          box(ctx, h, 700, 195, 190, 90, PURP, mIn, "MODEL  W_T", "1.2 GB of floats");
          ctx.globalAlpha = op;
        }

        // The erasure: arrows run one way only
        if (lt > 9) {
          var eIn = clamp01((lt - 9) / 0.8);
          ctx.globalAlpha = op * eIn;
          ctx.strokeStyle = h.rgba(RED, 0.85);
          ctx.lineWidth = 2.5;
          ctx.setLineDash([7, 6]);
          ctx.beginPath();
          ctx.moveTo(795, 300);
          ctx.bezierCurveTo(795, 400, 300, 420, 150, 400);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(RED, 0.95);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("no inverse", 430, 445);
          ctx.globalAlpha = op;
        }

        // The punchline: two identical-looking models
        if (lt > 20) {
          var cIn = clamp01((lt - 20) / 0.8);
          ctx.globalAlpha = op * cIn;
          box(ctx, h, 700, 320, 190, 62, GRN, cIn, "clean run", "acc 0.94");
          box(ctx, h, 700, 396, 190, 62, RED, cIn, "poisoned run", "acc 0.94");
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "Four institutions contribute data. One shard is poisoned — but nobody downstream can tell which, or even that it happened.",
        1.6
      );
      lower(
        s,
        "Training is a <strong>lossy, one-way map</strong>. The finished weights are a tensor of floats; they carry no record of the batches that produced them.",
        9.4
      );
      lower(
        s,
        "So the poisoned run and the clean run ship the same headline accuracy. Auditing the artefact cannot recover the history — the history has to be recorded <em>while it happens</em>.",
        20.6
      );
      lower(
        s,
        "That recording is the problem a blockchain is actually good at: an append-only log no single participant can rewrite.",
        32.0,
        { out: 41.0 }
      );
    });
  }

  /* ============================================================ SCENE 2
     Commit, don't store. Merkle root: 32 bytes anchors terabytes. */
  function sceneCommit(film) {
    film.scene("Commit, Don't Store", 46, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        // The naive idea, struck out
        if (lt < 9.5) {
          var nOut = 1 - clamp01((lt - 8.2) / 1.2);
          ctx.globalAlpha = op * nOut;
          box(ctx, h, 300, 150, 360, 90, RED, nOut, "PUT THE DATASET ON CHAIN", "1.4 TB");
          if (lt > 4.4) {
            var strike = clamp01((lt - 4.4) / 0.7);
            ctx.strokeStyle = h.rgba(RED, nOut);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(300, 240);
            ctx.lineTo(lerp(300, 660, E.outQuint(strike)), 150);
            ctx.stroke();
          }
          if (lt > 5.6) {
            ctx.fillStyle = h.rgba(RED, nOut * clamp01((lt - 5.6) / 0.6));
            ctx.font = "bold 16px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText("~$40M in calldata, and every byte public forever", 480, 285);
            ctx.textAlign = "left";
          }
          ctx.globalAlpha = op;
        }

        if (lt < 9.5) return;

        var t = lt - 9.5;
        var appear = clamp01(t / 0.7);
        ctx.globalAlpha = op * appear;

        // Leaves
        var leafX = [90, 250, 410, 570];
        var tampered = t > 22 && t < 34;
        for (var i = 0; i < 4; i++) {
          var li = clamp01((t - 0.6 - i * 0.25) / 0.5);
          if (li <= 0) continue;
          var isBad = tampered && i === 2;
          ctx.globalAlpha = op * li;
          box(ctx, h, leafX[i], 300, 130, 46, isBad ? RED : CY, li, "d" + (i + 1), isBad ? "altered" : "shard");
          // hash below
          ctx.fillStyle = h.rgba(isBad ? RED : MUTED, li * 0.95);
          ctx.font = "12px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText(isBad ? "H = 9f2c…" : "H = " + ["4a71", "b0e3", "7c18", "2d9a"][i] + "…", leafX[i] + 65, 368);
          ctx.textAlign = "left";
        }
        ctx.globalAlpha = op * appear;

        // Internal nodes + root
        function node(x, y, label, lit, col) {
          ctx.fillStyle = h.rgba(col, lit * 0.14);
          rr(ctx, x, y, 120, 40, 8);
          ctx.fill();
          ctx.strokeStyle = h.rgba(col, lit * 0.9);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = h.rgba(WHITE, lit);
          ctx.font = "13px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText(label, x + 60, y + 25);
          ctx.textAlign = "left";
        }

        var n1 = clamp01((t - 3.0) / 0.6);
        if (n1 > 0) {
          var badLeft = tampered;
          node(170, 215, badLeft ? "h₁₂" : "h₁₂", n1, CY);
          node(490, 215, tampered ? "h₃₄ ✕" : "h₃₄", n1, tampered ? RED : CY);
          ctx.strokeStyle = h.rgba(tampered ? RED : CY, n1 * 0.5);
          ctx.lineWidth = 1.6;
          [[155, 300, 230, 255], [315, 300, 230, 255], [475, 300, 550, 255], [635, 300, 550, 255]].forEach(
            function (p) {
              ctx.beginPath();
              ctx.moveTo(p[0], p[1]);
              ctx.lineTo(p[2], p[3]);
              ctx.stroke();
            }
          );
        }

        var n2 = clamp01((t - 4.4) / 0.6);
        if (n2 > 0) {
          node(330, 130, tampered ? "root ✕" : "root r", n2, tampered ? RED : AMB);
          ctx.strokeStyle = h.rgba(tampered ? RED : CY, n2 * 0.5);
          ctx.beginPath();
          ctx.moveTo(230, 215);
          ctx.lineTo(390, 170);
          ctx.moveTo(550, 215);
          ctx.lineTo(430, 170);
          ctx.stroke();
        }

        // The chain anchor
        var cIn = clamp01((t - 6.2) / 0.7);
        if (cIn > 0) {
          ctx.globalAlpha = op * cIn;
          box(ctx, h, 720, 110, 200, 80, AMB, cIn, "BLOCK #812,004", "32 bytes");
          ctx.strokeStyle = h.rgba(AMB, cIn * 0.8);
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(450, 150);
          ctx.lineTo(718, 150);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = op * appear;
        }

        // Size ledger
        if (t > 8.4) {
          var sIn = clamp01((t - 8.4) / 0.6);
          ctx.globalAlpha = op * sIn;
          ctx.fillStyle = h.rgba(MUTED, sIn);
          ctx.font = "14px " + MONO;
          ctx.fillText("dataset   1.4 TB      off chain, wherever you like", 90, 430);
          ctx.fillStyle = h.rgba(AMB, sIn);
          ctx.fillText("root r      32 B       on chain, immutable", 90, 456);
          ctx.globalAlpha = op * appear;
        }

        // Tamper alarm
        if (tampered && t > 24) {
          var aIn = clamp01((t - 24) / 0.5);
          ctx.globalAlpha = op * aIn;
          ctx.fillStyle = h.rgba(RED, aIn);
          ctx.font = "bold 17px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("recomputed root ≠ committed root", 480, 500);
          ctx.textAlign = "left";
          ctx.globalAlpha = op * appear;
        }
      });

      lower(
        s,
        "The naive version dies immediately. A blockchain is the most expensive storage ever built — putting a training set on it costs millions and publishes every record.",
        2.0
      );
      lower(
        s,
        "So you commit instead of store. Hash each shard, hash the hashes pairwise, and keep climbing until one 32-byte <strong>Merkle root</strong> stands for the whole corpus.",
        11.0
      );
      lower(
        s,
        "Only that root goes on chain. 1.4 terabytes of data, 32 bytes of commitment — and proving one record belongs takes log₂n sibling hashes, not the dataset.",
        19.5
      );
      lower(
        s,
        "Change a single byte of one shard and its hash changes, its parent changes, the root changes. Tampering is not prevented — it is made <em>undeniable after the fact</em>.",
        33.0
      );
      lower(
        s,
        "Be precise about what this buys: the root proves <strong>integrity</strong>, never <strong>quality</strong>. It fixes what the data was, not whether it was any good.",
        43.0,
        { out: 45.4 }
      );
    });
  }

  /* ============================================================ SCENE 3
     Federated rounds on chain: commit-reveal + robust aggregation. */
  function sceneRounds(film) {
    film.scene("Federated Rounds, Ordered by Consensus", 48, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        var clients = [
          { x: 70, y: 120, d: [1.0, 0.6], bad: false },
          { x: 70, y: 230, d: [0.9, 0.8], bad: false },
          { x: 70, y: 340, d: [1.1, 0.5], bad: false },
          { x: 70, y: 450, d: [-4.2, 3.9], bad: true }
        ];

        // Clients
        for (var i = 0; i < clients.length; i++) {
          var ci = clamp01((lt - 0.8 - i * 0.3) / 0.5);
          if (ci <= 0) continue;
          var c = clients[i];
          var flagged = c.bad && lt > 30;
          ctx.globalAlpha = op * ci;
          box(ctx, h, c.x, c.y - 26, 150, 50, flagged ? RED : CY, ci, "client " + (i + 1), "Δ" + (i + 1));
          ctx.globalAlpha = op;
        }

        // Phase 1: commit
        if (lt > 4 && lt < 17) {
          var pIn = clamp01((lt - 4) / 0.6) * (1 - clamp01((lt - 15.5) / 1.2));
          ctx.globalAlpha = op * pIn;
          ctx.fillStyle = h.rgba(AMB, pIn);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("PHASE 1 — commit  h_k = H(Δ_k ‖ r_k)", 300, 70);
          for (var j = 0; j < clients.length; j++) {
            var t0 = 5.2 + j * 0.5;
            if (lt < t0) continue;
            var pr = clamp01((lt - t0) / 1.1);
            var cx = lerp(225, 470, E.smooth(pr));
            ctx.fillStyle = h.rgba(AMB, pIn * (1 - pr * 0.2));
            ctx.font = "12px " + MONO;
            ctx.fillText("h" + (j + 1) + " = " + ["c41f", "8b02", "e7a9", "31d6"][j] + "…", cx, clients[j].y);
          }
          ctx.globalAlpha = op;
        }

        // The ledger column
        var lIn = clamp01((lt - 3.2) / 0.7);
        if (lIn > 0) {
          ctx.globalAlpha = op * lIn;
          box(ctx, h, 480, 95, 190, 380, AMB, lIn * 0.8, "", "");
          ctx.fillStyle = h.rgba(AMB, lIn);
          ctx.font = "bold 14px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("LEDGER", 575, 122);
          ctx.textAlign = "left";
          ctx.globalAlpha = op;
        }

        // Phase 2: reveal
        if (lt > 17) {
          var rIn = clamp01((lt - 17) / 0.6) * (1 - clamp01((lt - 29) / 1.2));
          ctx.globalAlpha = op * rIn;
          ctx.fillStyle = h.rgba(GRN, rIn);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("PHASE 2 — reveal Δ_k, check H(Δ_k ‖ r_k) = h_k", 250, 70);
          ctx.globalAlpha = op;
        }

        // Update geometry: the honest cluster and the outlier
        if (lt > 19) {
          var gIn = clamp01((lt - 19) / 0.8);
          ctx.globalAlpha = op * gIn;
          var ox = 760,
            oy = 300,
            sc = 26;
          ctx.strokeStyle = h.rgba(GREY, gIn * 0.5);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ox - 120, oy);
          ctx.lineTo(ox + 120, oy);
          ctx.moveTo(ox, oy - 120);
          ctx.lineTo(ox, oy + 120);
          ctx.stroke();

          for (var q = 0; q < clients.length; q++) {
            var cl = clients[q];
            var px = ox + cl.d[0] * sc,
              py = oy - cl.d[1] * sc;
            var isOut = cl.bad && lt > 30;
            ctx.fillStyle = h.rgba(isOut ? RED : CY, gIn);
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
          }

          // trimmed-mean acceptance band
          if (lt > 30) {
            var bIn = clamp01((lt - 30) / 0.8);
            ctx.strokeStyle = h.rgba(GRN, bIn * 0.85);
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(ox + 1.0 * sc, oy - 0.63 * sc, 34, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = h.rgba(GRN, bIn);
            ctx.font = "12px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText("accepted", ox, oy + 150);
            ctx.fillStyle = h.rgba(RED, bIn);
            ctx.fillText("trimmed", ox + 1.6 * sc - 60, oy - 3.9 * sc + 108);
            ctx.textAlign = "left";
          }
          ctx.globalAlpha = op;
        }

        // FedAvg formula
        if (lt > 22) {
          var fIn = clamp01((lt - 22) / 0.7);
          ctx.globalAlpha = op * fIn;
          ctx.fillStyle = h.rgba(WHITE, fIn);
          ctx.font = "16px " + MONO;
          ctx.fillText("w(t+1) = w(t) + Σ (n_k / n) · Δ_k", 250, 505);
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "Federated learning already keeps raw data home — only model updates travel. What it still needs is a referee nobody owns.",
        1.8
      );
      lower(
        s,
        "Round t opens with a <strong>commitment</strong>: each client publishes a hash of its update before seeing anyone else's. You cannot copy a neighbour's gradient and pass it off as work.",
        6.0
      );
      lower(
        s,
        "Then everyone reveals. The chain checks each update against the hash it already recorded, and timestamps the order — so contribution becomes a fact, not a claim.",
        17.6
      );
      lower(
        s,
        "Client 4's update points nowhere near the others. Robust aggregation — a trimmed mean or coordinate median — drops it before it reaches the weights.",
        30.4
      );
      lower(
        s,
        "The honest caveat: this bounds a <em>minority</em> of crude attackers. A patient adversary submitting small, in-distribution poison still gets through — the ledger records who, it does not judge what.",
        39.5,
        { out: 47.2 }
      );
    });
  }

  /* ============================================================ SCENE 4
     Incentives, and the throughput ceiling. */
  function sceneCeiling(film) {
    film.scene("Incentives, and the Ceiling", 44, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        // Reward flow
        if (lt < 17) {
          var rOut = 1 - clamp01((lt - 15.5) / 1.4);
          ctx.globalAlpha = op * rOut;
          ctx.fillStyle = h.rgba(WHITE, rOut);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("reward_k  ∝  marginal contribution of client k", 250, 105);

          var names = ["client 1", "client 2", "client 3", "client 4"];
          var vals = [0.31, 0.28, 0.34, 0.0];
          for (var i = 0; i < 4; i++) {
            var bi = clamp01((lt - 3 - i * 0.4) / 0.8);
            if (bi <= 0) continue;
            var y = 165 + i * 62;
            ctx.fillStyle = h.rgba(MUTED, op * rOut);
            ctx.font = "13px " + MONO;
            ctx.fillText(names[i], 250, y + 16);
            var wdt = vals[i] * 900 * E.smooth(bi);
            ctx.fillStyle = h.rgba(vals[i] === 0 ? RED : GRN, op * rOut * 0.85);
            rr(ctx, 360, y, Math.max(wdt, vals[i] === 0 ? 6 : 0), 26, 6);
            ctx.fill();
            ctx.fillStyle = h.rgba(vals[i] === 0 ? RED : GRN, op * rOut);
            ctx.font = "13px " + MONO;
            ctx.fillText(vals[i] === 0 ? "0  (trimmed)" : vals[i].toFixed(2), 375 + wdt, y + 18);
          }
          ctx.globalAlpha = op;
        }

        if (lt < 17) return;

        // The ceiling
        var t = lt - 17;
        var a = clamp01(t / 0.8);
        ctx.globalAlpha = op * a;

        ctx.fillStyle = h.rgba(WHITE, a);
        ctx.font = "bold 17px " + MONO;
        ctx.textAlign = "center";
        ctx.fillText("the structural ceiling", 480, 95);
        ctx.textAlign = "left";

        // log-scale bars
        var rows = [
          { label: "SGD updates  (one GPU)", val: 1e5, col: CY },
          { label: "Ethereum L1  (tx/s)", val: 15, col: AMB },
          { label: "high-throughput L2", val: 4000, col: AMB }
        ];
        for (var r = 0; r < rows.length; r++) {
          var ri = clamp01((t - 1.4 - r * 0.6) / 0.8);
          if (ri <= 0) continue;
          var y = 160 + r * 78;
          var frac = Math.log10(rows[r].val) / 5;
          ctx.fillStyle = h.rgba(MUTED, op * ri);
          ctx.font = "13px " + MONO;
          ctx.fillText(rows[r].label, 90, y - 8);
          ctx.fillStyle = h.rgba(rows[r].col, op * ri * 0.8);
          rr(ctx, 90, y, Math.max(720 * frac * E.smooth(ri), 4), 30, 6);
          ctx.fill();
          ctx.fillStyle = h.rgba(rows[r].col, op * ri);
          ctx.font = "bold 14px " + MONO;
          ctx.fillText(
            rows[r].val >= 1000 ? rows[r].val.toExponential(0).replace("e+", "e") + " /s" : rows[r].val + " /s",
            100 + 720 * frac,
            y + 21
          );
        }

        if (t > 5.6) {
          var gi = clamp01((t - 5.6) / 0.8);
          ctx.fillStyle = h.rgba(RED, op * gi);
          ctx.font = "bold 16px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("≈ 4 orders of magnitude — structural, not a roadmap item", 480, 415);
          ctx.textAlign = "left";
        }

        if (t > 10) {
          var vi = clamp01((t - 10) / 0.8);
          ctx.globalAlpha = op * vi;
          box(ctx, h, 120, 445, 300, 56, CY, vi, "OFF CHAIN", "training, gradients, data");
          box(ctx, h, 540, 445, 300, 56, AMB, vi, "ON CHAIN", "commitments, settlement");
          ctx.globalAlpha = op * a;
        }
      });

      lower(
        s,
        "Once contribution is a recorded fact, it can be <strong>paid</strong>. Reward flows in proportion to marginal contribution, and the client that was trimmed earns nothing.",
        1.8
      );
      lower(
        s,
        "That is the whole argument for putting a ledger under machine learning: not storage, not compute — <em>accountable coordination between parties who don't trust each other</em>.",
        9.0
      );
      lower(
        s,
        "Now the ceiling nobody markets. One GPU issues on the order of 10⁵ updates a second. Ethereum settles about 15 transactions a second; a fast rollup, a few thousand.",
        18.6
      );
      lower(
        s,
        "That gap is roughly four orders of magnitude and it is structural — consensus costs a round trip, and no rollup closes four decades of it.",
        28.0
      );
      lower(
        s,
        "So the division of labour is forced, not chosen: <strong>training stays off chain, settlement goes on it</strong>. Any system claiming to train on chain is describing an off-chain trainer with a receipt.",
        34.5,
        { out: 43.2 }
      );
    });
  }

  /* -------------------------------------------------------------------- build */
  function build() {
    var film = window.LabAnim.create("#bcml-film", { width: 960, height: 540 });
    sceneUnauditable(film);
    sceneCommit(film);
    sceneRounds(film);
    sceneCeiling(film);
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
        h: "Merkle commitment",
        tex: "r=H\\big(H(d_1)\\,\\|\\,H(d_2)\\big)\\,\\|\\;\\cdots\\quad\\text{inclusion proof: } O(\\log_2 n)\\text{ hashes}",
        note:
          "The root r fixes the corpus in 32 bytes. Proving that shard d_i was part of the committed set costs log₂n sibling hashes — for a million shards, twenty. Collision resistance of H is what makes the binding hold; it says nothing about the data's quality."
      },
      {
        h: "Commit–reveal for a training round",
        tex: "h_k=H(\\Delta_k\\,\\|\\,r_k)\\;\\text{published first};\\qquad \\text{reveal }(\\Delta_k,r_k)\\Rightarrow \\text{verify }H(\\Delta_k\\,\\|\\,r_k)=h_k",
        note:
          "The nonce r_k hides Δ_k during the commit phase, so a client cannot wait, copy a neighbour's update and claim it as work. The chain supplies the one thing a federated protocol cannot supply itself: an ordering no participant controls."
      },
      {
        h: "Aggregation, and what robustness actually bounds",
        tex:
          "w_{t+1}=w_t+\\sum_{k} \\frac{n_k}{n}\\,\\Delta_k \\;\\longrightarrow\\; w_{t+1}=w_t+\\mathrm{TrimmedMean}_\\beta\\big(\\{\\Delta_k\\}\\big)",
        note:
          "Plain FedAvg is a weighted mean, and a mean has breakdown point 0 — one unbounded update moves it arbitrarily far. Trimming the β most extreme coordinates restores a finite breakdown point, which bounds the damage from a Byzantine minority. It does not detect small, in-distribution poisoning."
      },
      {
        h: "The throughput ceiling",
        tex: "\\lambda_{\\text{SGD}}\\sim 10^{5}\\,\\text{s}^{-1} \\;\\gg\\; \\lambda_{\\text{chain}}\\sim 10^{1}\\!-\\!10^{3}\\,\\text{s}^{-1}",
        note:
          "Consensus costs at least one network round trip per batch of ordered facts; gradient descent costs a matrix multiply. The gap is therefore architectural, and it determines the design: the chain carries commitments, identities and settlement — never the learning loop."
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
