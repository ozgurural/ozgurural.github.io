/* =============================================================================
   determinism.js — cinematic explainer: what "hard real time" costs in a
   Level D full-flight simulator.

   Four scenes. Every number on stage is either a published qualification
   requirement or arithmetic derived from one:

     1. contract    The 150 ms transport-delay gate (FAA 14 CFR Part 60 /
                    EASA CS-FSTD(A)); helicopters are held to 100 ms
     2. tail        16.67 ms per frame at 60 Hz — and why the mean is the
                    wrong statistic: E[overruns] = N·p over a session
     3. composition Distributed sim: the frame ends when the LAST host
                    reports, so reliability multiplies and latency composes
                    as a max, not a mean
     4. instrument  You cannot certify what you do not measure

   Deliberate honesty constraints:
     • 150 ms is a REGULATORY CEILING on total transport delay, not a frame
       budget and not a target to design to.
     • E[K] = N·p assumes independence between frames. Real overruns cluster
       (a GC pause or a network stall spans frames), so independence is the
       OPTIMISTIC case — stated on stage.
     • No employer architecture is shown. The topology is the generic
       multi-host layout every Level D device uses, and the numbers are
       illustrative unless cited.
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("det-film")) return;
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
    s.audio("determinism_" + _lowerCount++, at);
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

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function box(ctx, h, x, y, w, hh, color, alpha, label, sub) {
    ctx.fillStyle = h.rgba(color, alpha * 0.12);
    rr(ctx, x, y, w, hh, 9);
    ctx.fill();
    ctx.strokeStyle = h.rgba(color, alpha * 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = h.rgba(WHITE, alpha);
      ctx.font = "bold 13px " + MONO;
      ctx.textAlign = "center";
      ctx.fillText(label, x + w / 2, y + (sub ? hh / 2 - 1 : hh / 2 + 4));
      if (sub) {
        ctx.fillStyle = h.rgba(MUTED, alpha * 0.9);
        ctx.font = "11px " + MONO;
        ctx.fillText(sub, x + w / 2, y + hh / 2 + 15);
      }
      ctx.textAlign = "left";
    }
  }

  /* ============================================================ SCENE 1
     The 150 ms transport-delay contract. */
  function sceneContract(film) {
    film.scene("The 150 Millisecond Contract", 44, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        // The pipeline from control input to the pilot's senses
        var stages = [
          { n: "control\ninput", ms: 8, c: CY },
          { n: "flight\nmodel", ms: 17, c: CY },
          { n: "systems\n+ dynamics", ms: 25, c: CY },
          { n: "image\ngeneration", ms: 50, c: PURP },
          { n: "display\n+ motion", ms: 34, c: AMB }
        ];

        var x0 = 70,
          w = 164,
          gap = 8;
        for (var i = 0; i < stages.length; i++) {
          var a = clamp01((lt - 1.0 - i * 0.45) / 0.55);
          if (a <= 0) continue;
          ctx.globalAlpha = op * a;
          var bx = x0 + i * (w + gap);
          box(ctx, h, bx, 120, w, 74, stages[i].c, a, "", "");
          ctx.fillStyle = h.rgba(WHITE, a);
          ctx.font = "bold 13px " + MONO;
          ctx.textAlign = "center";
          var parts = stages[i].n.split("\n");
          ctx.fillText(parts[0], bx + w / 2, 148);
          ctx.fillText(parts[1], bx + w / 2, 165);
          ctx.textAlign = "left";
          if (lt > 4.6) {
            var mv = clamp01((lt - 4.6 - i * 0.2) / 0.5);
            ctx.fillStyle = h.rgba(stages[i].c, a * mv);
            ctx.font = "bold 15px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText(stages[i].ms + " ms", bx + w / 2, 214);
            ctx.textAlign = "left";
          }
          if (i < stages.length - 1) {
            ctx.strokeStyle = h.rgba(GREY, a * 0.7);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(bx + w, 157);
            ctx.lineTo(bx + w + gap, 157);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = op;

        // The regulatory ceiling as a budget bar
        if (lt > 8) {
          var bIn = clamp01((lt - 8) / 0.8);
          ctx.globalAlpha = op * bIn;
          ctx.fillStyle = h.rgba(MUTED, bIn);
          ctx.font = "13px " + MONO;
          ctx.fillText("transport delay budget: pilot input to first response", 70, 275);

          // ceiling track
          ctx.fillStyle = h.rgba(GREY, bIn * 0.25);
          rr(ctx, 70, 292, 820, 34, 8);
          ctx.fill();

          var total = 134;
          var fillFrac = clamp01((lt - 9) / 2.4);
          var acc = 0;
          for (var k = 0; k < stages.length; k++) {
            var segW = (stages[k].ms / 150) * 820;
            var shown = clamp01((fillFrac * 150 - acc) / stages[k].ms);
            if (shown <= 0) break;
            ctx.fillStyle = h.rgba(stages[k].c, bIn * 0.75);
            rr(ctx, 70 + (acc / 150) * 820, 292, segW * shown, 34, 6);
            ctx.fill();
            acc += stages[k].ms;
          }

          // the hard ceiling
          ctx.strokeStyle = h.rgba(RED, bIn);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(890, 284);
          ctx.lineTo(890, 334);
          ctx.stroke();
          ctx.fillStyle = h.rgba(RED, bIn);
          ctx.font = "bold 14px " + MONO;
          ctx.textAlign = "right";
          ctx.fillText("150 ms: qualification ceiling", 886, 356);
          ctx.textAlign = "left";

          if (lt > 12.2) {
            var tIn = clamp01((lt - 12.2) / 0.6);
            ctx.fillStyle = h.rgba(GRN, bIn * tIn);
            ctx.font = "bold 15px " + MONO;
            ctx.fillText("spent: " + total + " ms      margin: " + (150 - total) + " ms", 70, 356);
          }
          ctx.globalAlpha = op;
        }

        // The consequence of breaching it
        if (lt > 22) {
          var cIn = clamp01((lt - 22) / 0.8);
          ctx.globalAlpha = op * cIn;
          box(ctx, h, 70, 400, 380, 66, RED, cIn, "OVER 150 ms", "device does not qualify");
          box(ctx, h, 510, 400, 380, 66, GREY, cIn, "NOT A PERFORMANCE TARGET", "a regulatory ceiling");
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "A Level D simulator is legally the aircraft. Airlines log real type-rating hours on it.",
        1.6
      );
      lower(
        s,
        "So the numbers are regulation, not goals. The ceiling: <strong>150 milliseconds</strong>, input to response.",
        9.0
      );
      lower(
        s,
        "Every stage spends it. Image generation takes the largest bite.",
        16.5
      );
      lower(
        s,
        "Not a target. A <em>gate</em>. Miss it and the hours flown do not count.",
        23.0
      );
      lower(
        s,
        "Helicopters get 100 milliseconds. A hovering rotorcraft is unstable, and the pilot closes the loop faster.",
        33.5,
        { out: 43.2 }
      );
    }, { subtitle: "Transport delay as a qualification gate, not a target." });
  }

  /* ============================================================ SCENE 2
     The tail, not the mean. */
  function sceneTail(film) {
    film.scene("The Mean Is the Wrong Statistic", 48, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        // 60 Hz frame budget
        var fIn = clamp01(lt / 0.8);
        ctx.fillStyle = h.rgba(WHITE, op * fIn);
        ctx.font = "bold 17px " + MONO;
        ctx.fillText("60 Hz  →  16.67 ms per frame", 70, 66);

        // Histogram of frame times
        // the histogram hands the stage to the clustering comparison at 37 s
        var clus = clamp01((lt - 37) / 1.2);
        var hIn = clamp01((lt - 2.2) / 0.9) * (1 - clus);
        if (hIn > 0) {
          ctx.globalAlpha = op * hIn;
          var bx = 90,
            by = 330,
            bw = 640,
            bh = 210;

          // axis
          ctx.strokeStyle = h.rgba(GREY, hIn * 0.6);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + bw, by);
          ctx.stroke();

          // lognormal-ish bars: most frames fast, a thin tail
          var bins = 26;
          for (var i = 0; i < bins; i++) {
            var reveal = clamp01((lt - 2.6 - i * 0.06) / 0.4);
            if (reveal <= 0) continue;
            var ms = 4 + i * 0.8;
            var z = (Math.log(ms) - Math.log(8.6)) / 0.30;
            var dens = Math.exp(-0.5 * z * z) / ms;
            var hgt = dens * 2300 * reveal;
            var over = ms > 16.67;
            ctx.fillStyle = h.rgba(over ? RED : CY, hIn * (over ? 0.9 : 0.65));
            var cw = bw / bins - 3;
            rr(ctx, bx + i * (bw / bins), by - hgt, cw, hgt, 2);
            ctx.fill();
          }

          // budget line
          var bl = bx + ((16.67 - 4) / (4 + bins * 0.8 - 4)) * bw;
          ctx.strokeStyle = h.rgba(AMB, hIn);
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(bl, by - bh);
          ctx.lineTo(bl, by + 8);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(AMB, hIn);
          ctx.font = "bold 13px " + MONO;
          ctx.fillText("16.67 ms", bl + 8, by - bh + 14);

          // mean marker
          var meanX = bx + ((8.6 - 4) / (bins * 0.8)) * bw;
          ctx.strokeStyle = h.rgba(GRN, hIn * 0.9);
          ctx.beginPath();
          ctx.moveTo(meanX, by - 40);
          ctx.lineTo(meanX, by + 8);
          ctx.stroke();
          ctx.fillStyle = h.rgba(GRN, hIn);
          ctx.font = "12px " + MONO;
          ctx.fillText("mean 8.6 ms", meanX - 34, by + 26);
          ctx.fillStyle = h.rgba(MUTED, hIn);
          ctx.fillText("frame time", bx + bw / 2 - 34, by + 48);
          ctx.globalAlpha = op;
        }

        // The arithmetic that matters
        if (lt > 16) {
          var aIn = clamp01((lt - 16) / 0.8);
          ctx.globalAlpha = op * aIn;
          box(ctx, h, 762, 90, 200, 0, CY, 0, "", "");
          ctx.fillStyle = h.rgba(WHITE, aIn);
          ctx.font = "bold 14px " + MONO;
          ctx.fillText("a 4-hour session", 754, 110);
          ctx.fillStyle = h.rgba(MUTED, aIn);
          ctx.font = "13px " + MONO;
          ctx.fillText("N = 60 × 3600 × 4", 754, 138);
          ctx.fillStyle = h.rgba(CY, aIn);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("= 864,000 frames", 754, 162);

          if (lt > 20) {
            var r2 = clamp01((lt - 20) / 0.8);
            ctx.fillStyle = h.rgba(MUTED, aIn * r2);
            ctx.font = "13px " + MONO;
            ctx.fillText("p = 10⁻⁵ per frame", 754, 202);
            ctx.fillStyle = h.rgba(RED, aIn * r2);
            ctx.font = "bold 16px " + MONO;
            ctx.fillText("E[overruns] ≈ 8.6", 754, 228);
          }
          if (lt > 26) {
            var r3 = clamp01((lt - 26) / 0.8);
            ctx.fillStyle = h.rgba(MUTED, aIn * r3);
            ctx.font = "13px " + MONO;
            ctx.fillText("p = 10⁻³", 754, 268);
            ctx.fillStyle = h.rgba(RED, aIn * r3);
            ctx.font = "bold 16px " + MONO;
            ctx.fillText("≈ 864 overruns", 754, 294);
          }
          ctx.globalAlpha = op;
        }

        // honesty note
        if (lt > 36) {
          var nIn = clamp01((lt - 36) / 0.8);
          ctx.globalAlpha = op * nIn;
          ctx.fillStyle = h.rgba(AMB, nIn);
          ctx.font = "13px " + MONO;
          ctx.fillText("assumes independent frames: real overruns cluster, so this is the optimistic case", 90, 400);
          ctx.globalAlpha = op;
        }

        /* The caption above is the film's own honesty note, and the last thing
           narrated here is that failures cluster so the real thing is worse.
           Both were words on a static frame. This shows it: the same 864
           overruns arranged two ways, with the same amount of ink on screen
           (640 px at alpha 0.22 against six 24 px bursts at alpha 0.98).
           Spread evenly they are 1,000 frames apart and nobody notices.
           In six bursts they are 144 consecutive frames, 2.4 s of frozen
           visual, which is the difference between a rounding error and a
           finding at qualification. */
        if (clus > 0) {
          var SX = 90, SW = 640, SH = 26;
          ctx.save();
          ctx.globalAlpha = clus;
          ctx.textAlign = "left";

          ctx.fillStyle = h.rgba(MUTED, 0.9); ctx.font = "12px " + MONO;
          ctx.fillText("THE SAME 864 OVERRUNS, ARRANGED TWO WAYS", SX, 150);

          // even: one every 1,000 frames, indistinguishable from clean
          var e1 = clamp01((lt - 38.4) / 1.8);
          ctx.strokeStyle = h.rgba(GREY, 0.45); ctx.lineWidth = 1;
          ctx.strokeRect(SX, 186, SW, SH);
          ctx.fillStyle = h.rgba(CY, 0.22 * e1);
          ctx.fillRect(SX, 186, SW * e1, SH);
          if (e1 > 0.98) {
            ctx.save(); ctx.globalAlpha = clus * clamp01((lt - 40.2) / 0.7);
            ctx.fillStyle = h.rgba("#dbeafe", 1); ctx.font = "600 13px " + MONO;
            ctx.fillText("spread evenly: one per 1,000 frames, 16.7 s apart", SX, 176);
            ctx.fillStyle = h.rgba(CY, 1); ctx.font = "12px " + MONO;
            ctx.fillText("each one isolated, and nobody in the box notices", SX, 232);
            ctx.restore();
          }

          // clustered: the same count, six bursts of 144 consecutive frames
          var c1 = clamp01((lt - 41.2) / 2.0);
          ctx.strokeStyle = h.rgba(GREY, 0.45); ctx.lineWidth = 1;
          ctx.strokeRect(SX, 286, SW, SH);
          for (var b = 0; b < 6; b++) {
            var bf = clamp01(c1 * 7 - b);
            if (bf <= 0) continue;
            ctx.fillStyle = h.rgba(RED, 0.98 * bf);
            ctx.fillRect(SX + 34 + b * 104, 286, 24, SH);
          }
          if (c1 > 0.98) {
            ctx.save(); ctx.globalAlpha = clus * clamp01((lt - 43.4) / 0.7);
            ctx.fillStyle = h.rgba("#dbeafe", 1); ctx.font = "600 13px " + MONO;
            ctx.fillText("clustered: six bursts of 144 consecutive frames", SX, 276);
            ctx.fillStyle = h.rgba(RED, 1); ctx.font = "600 12px " + MONO;
            ctx.fillText("2.4 seconds of frozen visual, six times a session", SX, 332);
            ctx.restore();
          }

          if (lt > 44.8) {
            ctx.save(); ctx.globalAlpha = clus * clamp01((lt - 44.8) / 0.8);
            ctx.fillStyle = h.rgba(AMB, 1); ctx.font = "600 14px " + MONO;
            ctx.fillText("same count, same ink; only one of them is survivable", SX, 372);
            ctx.restore();
          }
          ctx.restore();
        }
      });

      lower(
        s,
        "Inside it, a fixed cadence. At 60 hertz each subsystem gets 16.67 milliseconds.",
        1.6
      );
      lower(
        s,
        "Mean frame time is 8.6 milliseconds, half the budget. But a deadline is never met on average.",
        9.0
      );
      lower(
        s,
        "Count the frames instead. Four hours is 864,000 of them.",
        17.0
      );
      lower(
        s,
        "One bad frame in a thousand, a 99.9% success rate, is 864 stutters a session.",
        26.5
      );
      lower(
        s,
        "And that assumes failures spread evenly. They cluster, so the real thing is worse.",
        36.5,
        { out: 47.0 }
      );
    }, { subtitle: "864,000 frames a session, and the tail past the deadline." });
  }

  /* ============================================================ SCENE 3
     Distributed: the frame ends when the last host reports. */
  function sceneComposition(film) {
    film.scene("The Frame Ends When the Last Host Reports", 46, function (s) {
      s.canvas(function (lt, ctx, h) {
        // the rack has made its point by 31 s; it clears the stage for the
        // comparison that closes the scene. everything above multiplies
        // through op, so this one factor takes the whole first half with it.
        var handoff = clamp01((lt - 31) / 1.3);
        var op = clamp01(lt / 0.6) * (1 - handoff);
        ctx.globalAlpha = op;

        var hosts = [
          { n: "sim host", ms: 9.1 },
          { n: "avionics", ms: 7.4 },
          { n: "display", ms: 11.2 },
          { n: "visual ch1", ms: 12.8 },
          { n: "visual ch2", ms: 12.1 },
          { n: "visual ch3", ms: 13.0 },
          { n: "sound", ms: 5.2 },
          { n: "motion", ms: 8.8 },
          { n: "IOS", ms: 6.0 }
        ];

        var slowIdx = 5;

        for (var i = 0; i < hosts.length; i++) {
          var a = clamp01((lt - 0.8 - i * 0.2) / 0.5);
          if (a <= 0) continue;
          var col = i % 3,
            row = Math.floor(i / 3);
          var bx = 70 + col * 200,
            by = 96 + row * 92;
          var late = lt > 20 && i === slowIdx;
          ctx.globalAlpha = op * a;
          // name left, figure right, on one line: centring the name ran the
          // three "visual chN" labels straight into their own millisecond value
          box(ctx, h, bx, by, 172, 62, late ? RED : CY, a, "", "");
          ctx.fillStyle = h.rgba(late ? RED : WHITE, a);
          ctx.font = "bold 13px " + MONO;
          ctx.fillText(hosts[i].n, bx + 12, by + 34);
          // per-host bar
          var frac = clamp01(hosts[i].ms / 16.67);
          var grow = clamp01((lt - 3.2) / 1.2);
          ctx.fillStyle = h.rgba(late ? RED : GRN, a * 0.8);
          rr(ctx, bx + 12, by + 40, (172 - 24) * frac * grow, 8, 4);
          ctx.fill();
          ctx.fillStyle = h.rgba(MUTED, a);
          ctx.font = "11px " + MONO;
          ctx.textAlign = "right";
          ctx.fillText((late ? 19.4 : hosts[i].ms).toFixed(1) + " ms", bx + 160, by + 34);
          ctx.textAlign = "left";
          ctx.globalAlpha = op;
        }

        // the max gate
        if (lt > 8) {
          var gIn = clamp01((lt - 8) / 0.8);
          ctx.globalAlpha = op * gIn;
          ctx.fillStyle = h.rgba(WHITE, gIn);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("frame time  =  max, not mean", 640, 130);
          ctx.fillStyle = h.rgba(MUTED, gIn);
          ctx.font = "13px " + MONO;
          ctx.fillText("one straggler owns the frame", 640, 156);
          ctx.globalAlpha = op;
        }

        // reliability multiplies
        if (lt > 13) {
          var rIn = clamp01((lt - 13) / 0.8);
          ctx.globalAlpha = op * rIn;
          ctx.fillStyle = h.rgba(WHITE, rIn);
          ctx.font = "14px " + MONO;
          ctx.fillText("each host: 99.9% of frames on time", 640, 214);
          ctx.fillStyle = h.rgba(CY, rIn);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("0.999", 640, 248);
          ctx.font = "bold 12px " + MONO;
          ctx.fillText("9", 700, 240);
          ctx.fillStyle = h.rgba(RED, rIn);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("=  99.1%", 716, 248);
          ctx.fillStyle = h.rgba(MUTED, rIn);
          ctx.font = "13px " + MONO;
          ctx.fillText("≈ 7,800 bad frames in a session", 640, 276);
          ctx.globalAlpha = op;
        }

        // straggler callout
        if (lt > 21) {
          var sIn = clamp01((lt - 21) / 0.7);
          ctx.globalAlpha = op * sIn;
          ctx.strokeStyle = h.rgba(RED, sIn);
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(444, 250);
          ctx.lineTo(636, 300);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(RED, sIn);
          ctx.font = "bold 14px " + MONO;
          ctx.fillText("19.4 ms: everyone waits", 640, 316);
          ctx.globalAlpha = op;
        }

        if (lt > 30) {
          var cIn = clamp01((lt - 30) / 0.8);
          ctx.globalAlpha = op * cIn;
          box(ctx, h, 640, 350, 290, 60, AMB, cIn, "BUDGET PER HOST", "not per system");
          ctx.globalAlpha = op;
        }

        /* "A system average constrains nobody" is the line narrated across the
           last third of this scene, and the screen only restated it in a box.
           Here it is shown. Two racks with the SAME mean frame time, one of
           which misses the deadline, because the deadline is a maximum and a
           mean cannot see a maximum. Both means are 10.2 ms: nine hosts at
           10.24, against eight at 9.1 with one at 19.4 (92.2/9 = 10.24). */
        if (handoff > 0) {
          var BY = 360, MS = 4.5, DL = 16.67;      // baseline, px per ms, deadline
          ctx.save();
          ctx.globalAlpha = handoff;
          ctx.textAlign = "left";

          ctx.fillStyle = h.rgba(MUTED, 0.9); ctx.font = "12px " + MONO;
          ctx.fillText("THE SAME AVERAGE, TWO DIFFERENT RACKS", 130, 168);

          var RACKS = [
            { at: 130, t0: 32.6, host: [10.24,10.24,10.24,10.24,10.24,10.24,10.24,10.24,10.24],
              name: "every host at 10.2 ms", col: GRN, verdict: "max 10.2 ms: frame on time" },
            { at: 470, t0: 35.8, host: [9.1,9.1,9.1,9.1,9.1,19.4,9.1,9.1,9.1],
              name: "eight fast, one slow",  col: RED, verdict: "max 19.4 ms: frame is late" }
          ];

          for (var r = 0; r < RACKS.length; r++) {
            var R = RACKS[r], gp = clamp01((lt - R.t0) / 2.6);
            if (gp <= 0) continue;
            ctx.fillStyle = h.rgba("#dbeafe", 0.9); ctx.font = "600 13px " + MONO;
            ctx.fillText(R.name, R.at, 206);

            ctx.strokeStyle = h.rgba(RED, 0.5); ctx.lineWidth = 1.2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(R.at - 8, BY - DL * MS); ctx.lineTo(R.at + 188, BY - DL * MS); ctx.stroke();
            ctx.setLineDash([]);

            var sum = 0;
            for (var i = 0; i < R.host.length; i++) {
              sum += R.host[i];
              var gi = clamp01(gp * 10 - i);
              if (gi <= 0) continue;
              var bh = R.host[i] * MS * E.out(gi);
              var over = R.host[i] > DL;
              ctx.fillStyle = h.rgba(over ? RED : CY, 0.78);
              ctx.fillRect(R.at + i * 20, BY - bh, 14, bh);
              if (over && gi > 0.9) {
                ctx.strokeStyle = h.rgba(RED, 0.95); ctx.lineWidth = 1.6;
                ctx.strokeRect(R.at + i * 20, BY - bh, 14, bh);
              }
            }
            ctx.strokeStyle = h.rgba(GREY, 0.4); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(R.at - 8, BY); ctx.lineTo(R.at + 188, BY); ctx.stroke();

            if (gp > 0.98) {
              var vf = clamp01((lt - R.t0 - 2.6) / 0.7);
              ctx.save(); ctx.globalAlpha = handoff * vf;
              ctx.fillStyle = h.rgba(MUTED, 1); ctx.font = "12px " + MONO;
              ctx.fillText("mean " + (sum / R.host.length).toFixed(1) + " ms", R.at, BY + 24);
              ctx.fillStyle = h.rgba(R.col, 1); ctx.font = "600 13px " + MONO;
              ctx.fillText(R.verdict, R.at, BY + 46);
              ctx.restore();
            }
          }

          if (lt > 40.4) {
            ctx.save(); ctx.globalAlpha = handoff * clamp01((lt - 40.4) / 1.0);
            ctx.fillStyle = h.rgba(AMB, 1); ctx.font = "600 14px " + MONO;
            ctx.fillText("identical averages; only one of them qualifies", 130, 438);
            ctx.restore();
          }
          ctx.restore();
        }
      });

      lower(
        s,
        "A simulator is not one computer. It is a rack, all publishing into one frame.",
        1.6
      );
      lower(
        s,
        "The frame ends when the <strong>last</strong> host finishes. Latency composes as a maximum.",
        8.6
      );
      lower(
        s,
        "Reliability composes by multiplication. Nine hosts at three nines give 99.1% clean.",
        13.6
      );
      lower(
        s,
        "One straggler is enough. A single host at 19 milliseconds makes the frame late for everyone.",
        21.6
      );
      lower(
        s,
        "So the budget is allocated and enforced <em>per host</em>. A system average constrains nobody.",
        30.6,
        { out: 45.0 }
      );
    }, { subtitle: "Latency composes as a maximum, reliability as a product." });
  }

  /* ============================================================ SCENE 4
     You cannot certify what you do not measure. */
  function sceneInstrument(film) {
    film.scene("You Cannot Certify What You Do Not Measure", 42, function (s) {
      s.canvas(function (lt, ctx, h) {
        // the table is the anchor for the first half; once the trace below it
        // takes over it steps back rather than competing. everything in the
        // table multiplies through op, so dimming it is this one factor.
        var demo = clamp01((lt - 24) / 1.4);
        var op = clamp01(lt / 0.6) * (1 - demo);
        ctx.globalAlpha = op;

        var rows = [
          { n: "FAVT", over: 0, step: 8.9, mem: 412, ok: true },
          { n: "TCAS", over: 0, step: 7.1, mem: 268, ok: true },
          { n: "IOS", over: 3, step: 15.8, mem: 902, ok: false },
          { n: "DU1", over: 0, step: 9.4, mem: 331, ok: true }
        ];

        var tIn = clamp01((lt - 0.8) / 0.8);
        if (tIn > 0) {
          ctx.globalAlpha = op * tIn;
          ctx.fillStyle = h.rgba(MUTED, tIn);
          ctx.font = "12px " + MONO;
          ctx.fillText("BUS", 96, 128);
          ctx.textAlign = "right";
          ctx.fillText("OVERRUNS", 520, 128);
          ctx.fillText("STEP MS", 660, 128);
          ctx.fillText("MEM MB", 800, 128);
          ctx.textAlign = "left";
          ctx.strokeStyle = h.rgba(GREY, tIn * 0.4);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(90, 140);
          ctx.lineTo(870, 140);
          ctx.stroke();
          ctx.globalAlpha = op;
        }

        for (var i = 0; i < rows.length; i++) {
          var a = clamp01((lt - 1.6 - i * 0.4) / 0.6);
          if (a <= 0) continue;
          var y = 176 + i * 54;
          var bad = !rows[i].ok && lt > 12;
          ctx.globalAlpha = op * a;
          ctx.fillStyle = h.rgba(bad ? RED : CY, a * 0.08);
          rr(ctx, 90, y - 24, 780, 42, 8);
          ctx.fill();
          ctx.strokeStyle = h.rgba(bad ? RED : GREY, a * 0.5);
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = h.rgba(bad ? RED : WHITE, a);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText(rows[i].n, 108, y + 4);

          ctx.textAlign = "right";
          ctx.fillStyle = h.rgba(rows[i].over > 0 && lt > 12 ? RED : MUTED, a);
          ctx.font = "15px " + MONO;
          ctx.fillText(String(rows[i].over), 520, y + 4);
          /* A telemetry table that never changes is a screenshot, and this
             scene is about instrumenting a session while it runs. Step time
             therefore ticks. The IOS bus wobbles wide enough to cross 16.67 ms
             now and then, which is exactly why its overrun counter reads 3
             while its step time mostly looks fine: the point the scene makes
             out loud ten seconds later. Derived from lt, so seeking is exact. */
          var wob = Math.sin(lt * 2.3 + i * 1.7) * 0.35 + Math.sin(lt * 5.1 + i * 0.9) * 0.18;
          var spike = Math.pow(Math.max(0, Math.sin(lt * 0.55 + i * 2.1)), 20);
          var liveStep = rows[i].step + wob + (rows[i].ok ? 0 : spike * 2.6);
          ctx.fillStyle = h.rgba(liveStep > 16.67 ? RED : MUTED, a);
          ctx.fillText(liveStep.toFixed(1), 660, y + 4);
          ctx.fillStyle = h.rgba(MUTED, a);
          ctx.fillText(String(rows[i].mem), 800, y + 4);
          ctx.textAlign = "left";
          ctx.globalAlpha = op;
        }

        if (lt > 13) {
          var aIn = clamp01((lt - 13) / 0.8);
          ctx.globalAlpha = op * aIn;
          ctx.fillStyle = h.rgba(RED, aIn);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("overrun counter is the reliable signal; step time can miss a spike between polls", 90, 420);
          ctx.globalAlpha = op;
        }

        /* The claim this scene rests on is that step time is sampled, so a
           spike can hide between two polls while the overrun counter still
           catches it. A caption asserting that proves nothing, so the second
           half shows it happening: one host, a hundred frames, a spike three
           frames wide, polled every eighth frame. The poll lands either side
           of it and the sampled maximum stays comfortably inside budget. */
        // the table clears the stage before the trace arrives, so the two
        // never share it
        var demoIn = clamp01((lt - 25.5) / 1.0);
        if (demoIn > 0) {
          // baseline sits above y=461, where the subtitle panel starts, so the
          // trace furniture and the readouts under it stay visible
          var X0 = 110, X1 = 850, Y0 = 430, MSPX = 11;
          var yOf = function (ms) { return Y0 - ms * MSPX; };
          var xOf = function (fr) { return lerp(X0, X1, fr / 100); };
          var stepMs = function (fr) {
            var d = fr - 62;
            return 9.0 + 0.55 * Math.sin(fr * 0.7) + 0.3 * Math.sin(fr * 1.9) +
                   10.6 * Math.exp(-(d * d) / 1.6);
          };
          ctx.globalAlpha = demoIn;
          ctx.textAlign = "left";

          ctx.fillStyle = h.rgba(MUTED, 0.9); ctx.font = "12px " + MONO;
          ctx.fillText("ONE HOST, 100 FRAMES, POLLED EVERY 8th", X0, 168);

          ctx.strokeStyle = h.rgba(RED, 0.5); ctx.lineWidth = 1.2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.moveTo(X0, yOf(16.67)); ctx.lineTo(X1, yOf(16.67)); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(RED, 0.85); ctx.font = "11px " + MONO;
          ctx.fillText("16.67 ms deadline", X0, yOf(16.67) - 7);

          ctx.strokeStyle = h.rgba(GREY, 0.35); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y0); ctx.stroke();

          var head = 100 * E.out(clamp01((lt - 25.6) / 8.5));
          var fr, sampMax = 0;

          ctx.strokeStyle = h.rgba(CY, 0.9); ctx.lineWidth = 2;
          ctx.beginPath();
          for (fr = 0; fr <= head; fr += 0.5) {
            if (fr === 0) ctx.moveTo(xOf(0), yOf(stepMs(0)));
            else ctx.lineTo(xOf(fr), yOf(stepMs(fr)));
          }
          ctx.stroke();

          for (fr = 0; fr <= 96 && fr <= head; fr += 8) {
            var sy = yOf(stepMs(fr));
            sampMax = Math.max(sampMax, stepMs(fr));
            ctx.strokeStyle = h.rgba(AMB, 0.2); ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(xOf(fr), sy); ctx.lineTo(xOf(fr), Y0); ctx.stroke();
            ctx.fillStyle = h.rgba(AMB, 0.95);
            ctx.beginPath(); ctx.arc(xOf(fr), sy, 3.4, 0, 7); ctx.fill();
          }

          if (lt > 34.6) {
            var an = clamp01((lt - 34.6) / 1.1);
            ctx.globalAlpha = demoIn * an;
            var sx = xOf(62), sy2 = yOf(stepMs(62));
            ctx.strokeStyle = h.rgba(RED, 0.95); ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(sx, sy2, 13, 0, 7); ctx.stroke();
            ctx.fillStyle = h.rgba(RED, 1); ctx.font = "bold 12px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText(stepMs(62).toFixed(1) + " ms, and no poll was looking", sx, sy2 - 22);
            ctx.textAlign = "left";
          }
          if (lt > 37.4) {
            ctx.globalAlpha = demoIn * clamp01((lt - 37.4) / 1.1);
            ctx.font = "bold 13px " + MONO;
            ctx.fillStyle = h.rgba(AMB, 1);
            ctx.fillText("sampled max " + sampMax.toFixed(1) + " ms: inside budget", X0, 452);
            ctx.fillStyle = h.rgba(RED, 1);
            ctx.fillText("overrun counter: 1", X0 + 420, 452);
          }
          ctx.globalAlpha = 1;
        }
      });

      lower(
        s,
        "None of it is real unless it is instrumented while the session runs.",
        1.6
      );
      lower(
        s,
        "Trust the overrun counter. Step time is sampled, so a spike hides between polls.",
        13.6
      );
      lower(
        s,
        "One bus overruns, the rest stay clean, and the engineer knows before the qualification test does.",
        24.6
      );
      lower(
        s,
        "Determinism is not optimised in at the end. It is a budget, enforced every frame, and proven by the instrument you ship with it.",
        32.0,
        { out: 41.2 }
      );
    }, { subtitle: "Why the overrun counter is the number to trust." });
  }

  function build() {
    var film = window.LabAnim.create("#det-film", { width: 960, height: 540 });
    sceneContract(film);
    sceneTail(film);
    sceneComposition(film);
    sceneInstrument(film);
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__detFilm = film;
  }

  function appendix() {
    var host = document.querySelector('[data-role="det-appendix"]');
    if (!host || !window.katex) return;

    var blocks = [
      {
        h: "The qualification ceiling",
        tex:
          "T_{\\text{transport}}=\\sum_i t_i \\;\\le\\; 150\\,\\text{ms}\\quad(\\text{aeroplane, Level C/D});\\qquad \\le 100\\,\\text{ms}\\ (\\text{helicopter})",
        note:
          "Transport delay is the total system processing time from a pilot primary-flight-control input until the motion, visual or instrument systems respond. The limits are set by FAA 14 CFR Part 60 and the equivalent EASA CS-FSTD(A). This is a gate, not a target: a device over the ceiling does not qualify, and hours flown on it do not count toward a type rating."
      },
      {
        h: "Why the mean is the wrong statistic",
        tex:
          "N=f\\cdot T_{\\text{session}}=60\\,\\text{Hz}\\times 4\\,\\text{h}=864{,}000\\ \\text{frames};\\qquad \\mathbb{E}[K]=N\\,p",
        note:
          "A deadline is met or missed per frame, so the quantity that matters is the tail mass beyond the budget, not the average. At p = 10⁻⁵ a four-hour session still expects ~8.6 overruns; at p = 10⁻³ (a 99.9% success rate) it expects ~864. The independence assumption behind E[K] = Np is optimistic: GC pauses and network stalls take out consecutive frames, so real sessions cluster their failures."
      },
      {
        h: "Composition across hosts",
        tex:
          "T_{\\text{frame}}=\\max_{i\\le n} T_i,\\qquad \\Pr[\\text{frame ok}]=\\prod_{i\\le n}\\Pr[T_i\\le \\tau]=0.999^{9}\\approx 0.991",
        note:
          "A full-flight simulator is a distributed system: the frame closes when the slowest participant publishes, so latency composes as a maximum and reliability as a product. Nine hosts at three nines each yield ~99.1% clean frames, roughly 7,800 bad frames per four-hour session. This is why the deadline budget has to be allocated and enforced per host; a system-wide average is not something an engineer can design against."
      },
      {
        h: "What to instrument",
        tex:
          "\\text{overruns}(t)\\ \\text{, counted by the runtime};\\qquad \\text{step time} \\ \\text{, sampled at } f_{\\text{poll}} \\ll f_{\\text{frame}}",
        note:
          "Sampled step time can miss a spike that occurs between two polls; an overrun counter is incremented by the runtime at the moment the deadline is breached and therefore cannot be missed. Monotonic counters are the trustworthy primitive for deadline monitoring; sampled gauges are for trend, not for compliance."
      }
    ];

    var html = "";
    for (var i = 0; i < blocks.length; i++) {
      html +=
        "<h4>" +
        blocks[i].h +
        "</h4><div class='lab-math__tex' id='det-tex-" +
        i +
        "'></div><p>" +
        blocks[i].note +
        "</p>";
    }
    host.innerHTML = html;

    for (var j = 0; j < blocks.length; j++) {
      var el = document.getElementById("det-tex-" + j);
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
