/* =============================================================================
   block-race.js — cinematic explainer: the mathematics of Nakamoto consensus.

   Six scenes, math verified against the Bitcoin whitepaper §11:
     1. hook         Two chains, one truth     (longest-chain rule = a race)
     2. bernoulli    Every block is a coin flip (hashrate share = win prob)
     3. ruin         The gambler's ruin        (catch-up = (q/p)^z, q<p)
     4. poisson      Satoshi's head-start      (k~Poisson(zq/p); the §11 form)
     5. consequence  Orders of magnitude       (z=6: 0.024% vs 13.2% — 544×)
     6. stakes       Probabilistic finality    (P(z)→0, never exactly 0)

   Referee corrections applied:
     • The Poisson layer is an APPROXIMATION (Satoshi fixes the honest window at
       its mean). The exact attacker count is Negative-Binomial NB(z,p); the
       Poisson form UNDERSTATES risk (0.0002428 vs exact 0.000591 at q=.1,z=6).
       Stated explicitly on stage and in the appendix.
     • λ = zq/p is a Poisson MEAN (expected count), not a "rate".
     • Per-block winner ~ Bernoulli(q); Exponential interarrivals are the
       equivalent continuous-time view — labelled as two views, not one.
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("br-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build();
    appendix();
  }

  var PAL = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = "#58C4DD", MAG = "#9A72AC", GRN = "#83C167", AMB = "#fbbf24", RED = "#FC6255";

  /* exact Satoshi §11 attacker-success probability */
  function attackerSuccess(q, z) {
    var p = 1 - q; if (q >= p) return 1;
    var lambda = z * q / p, s = 1, term;
    for (var k = 0; k <= z; k++) {
      term = Math.exp(-lambda);
      for (var i = 1; i <= k; i++) term *= lambda / i;
      s -= term * (1 - Math.pow(q / p, z - k));
    }
    return Math.max(s, 1e-12);
  }
  function poissonPMF(lambda, k) { var t = Math.exp(-lambda); for (var i = 1; i <= k; i++) t *= lambda / i; return t; }

  var _lowerCount = 0;
  function lower(s, html, at, o) {
    var audioId = "block-race_" + (_lowerCount++);
    s.audio(audioId, at);
    o = o || {};
    var c = s.caption(html, { px: o.px !== undefined ? o.px : 46, py: o.py !== undefined ? o.py : 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.75 });
    return c;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function block(ctx, h, x, y, w, hh, color, alpha) {
    ctx.globalAlpha = alpha; roundRect(ctx, x, y, w, hh, 6);
    ctx.shadowBlur = 10;
    ctx.shadowColor = h.rgba(color, 0.8);
    var grd = ctx.createLinearGradient(x, y, x, y + hh);
    grd.addColorStop(0, h.rgba(color, 0.35));
    grd.addColorStop(1, h.rgba(color, 0.05));
    ctx.fillStyle = grd; ctx.fill();
    ctx.lineWidth = 1.8; ctx.strokeStyle = h.rgba(color, 0.95); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  
  function pathOfArc(points, co) {
    var px = points.map(function (p) { return [co.x(p[0]), co.y(p[1])]; });
    var cum = [0], i, L = 0;
    for (i = 1; i < px.length; i++) {
      L += Math.hypot(px[i][0] - px[i - 1][0], px[i][1] - px[i - 1][1]);
      cum.push(L);
    }
    return function (tau) {
      tau = Math.max(0, Math.min(1, tau));
      var target = tau * L, lo = 0;
      while (lo < cum.length - 2 && cum[lo + 1] < target) lo++;
      var seg = cum[lo + 1] - cum[lo] || 1;
      var g = (target - cum[lo]) / seg;
      return {
        x: points[lo][0] + (points[lo + 1][0] - points[lo][0]) * g,
        y: points[lo][1] + (points[lo + 1][1] - points[lo][1]) * g
      };
    };
  }

  function build() {
    var film = window.LabAnim.create("#br-film", { width: 960, height: 540 });
    hook(film); bernoulli(film); ruin(film); poisson(film); consequence(film); stakes(film);
    film.build();
    if (window.__LABDEBUG) window.__brFilm = film;
  }

  /* ===================== 1 — HOOK : two chains ===================== */
  function hook(film) {
    film.scene("Two chains, one truth", 14, function (s) {
      var gx = 120, bw = 44, gap = 14, yH = 226, yA = 348, hh = 40;
      function nAt(lt, start, rate, cap) { return Math.max(0, Math.min(cap, Math.floor((lt - start) / rate) + 1)); }

      s.canvas(function (lt, ctx, h) {
        // genesis
        block(ctx, h, gx, (yH + yA) / 2 - hh / 2, bw, hh, "#888888", 1);
        ctx.fillText("genesis", gx - 4, (yH + yA) / 2 + hh / 2 + 16);
        var nH = nAt(lt, 0.4, 0.85, 14), nA = nAt(lt, 1.6, 1.18, 10), i;
        // honest (cyan, top)
        for (i = 0; i < nH; i++) {
          var x = gx + bw + gap + i * (bw + gap);
          var pulseAt = 10.5 + i * 0.1;
          var pulseP = clamp01((lt - pulseAt) / 0.6);
          var scale = 1 + 0.15 * Math.sin(pulseP * Math.PI); // pulse scale
          
          ctx.strokeStyle = h.rgba(CY, 0.5); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - gap, yH + hh / 2); ctx.lineTo(x, yH + hh / 2); ctx.stroke();
          
          ctx.save();
          ctx.translate(x + bw/2, yH + hh/2);
          ctx.scale(scale, scale);
          block(ctx, h, -bw/2, -hh/2, bw, hh, CY, 1);
          ctx.restore();
          
          // Hash particles when the block is freshly mined
          var mineT = (lt - 0.4) - (i * 0.85);
          if (mineT > 0 && mineT < 0.6) {
             for(var p=0; p<8; p++) {
                ctx.fillStyle = h.rgba(CY, 1 - mineT/0.6);
                ctx.font = "10px monospace";
                var px = x + bw/2 + (Math.sin(p*3 + i)*20) * (mineT*3);
                var py = yH + hh/2 - (mineT*40) + (Math.cos(p*7)*10);
                ctx.fillText(p%2===0?"0":"1", px, py);
             }
          }
        }
        // attacker (magenta, bottom, secret)
        for (i = 0; i < nA; i++) {
          var xa = gx + bw + gap + i * (bw + gap);
          var dimP = clamp01((lt - 10.5) / 1.0);
          var aAlpha = 0.92 - 0.57 * E.smooth(dimP); // dims to 0.35
          
          ctx.strokeStyle = h.rgba(MAG, aAlpha * 0.45); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(xa - gap, yA + hh / 2); ctx.lineTo(xa, yA + hh / 2); ctx.stroke();
          block(ctx, h, xa, yA, bw, hh, MAG, aAlpha);
          // Hash particles when the block is freshly mined
          var aMineT = (lt - 1.6) - (i * 1.18);
          if (aMineT > 0 && aMineT < 0.6) {
             for(var p=0; p<8; p++) {
                ctx.fillStyle = h.rgba(MAG, 1 - aMineT/0.6);
                ctx.font = "10px monospace";
                var pxa = xa + bw/2 + (Math.sin(p*3 + i)*20) * (aMineT*3);
                var pya = yA + hh/2 - (aMineT*40) + (Math.cos(p*7)*10);
                ctx.fillText(p%2===0?"0":"1", pxa, pya);
             }
          }
        }
        // payment coin on honest genesis-adjacent block
        var coinP = clamp01((lt - 1) / 0.5);
        ctx.beginPath(); ctx.arc(gx + bw + gap + 0 * (bw + gap) + bw / 2, yH - 16, 8 * E.out(coinP), 0, 7);
        ctx.fillStyle = h.rgba(GRN, coinP); ctx.fill();
        // secrecy curtain over attacker chain (lifts while the lead counter
        // still ticks, so the scene never sits static)
        var cv = clamp01((lt - 1.2) / 0.8) * (1 - clamp01((lt - 9) / 1.2));
        ctx.globalAlpha = 0.40 * cv; ctx.fillStyle = "#0b1322";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx + bw + gap - 6, yA - 20, 900, hh + 40, 8); else ctx.rect(gx + bw + gap - 6, yA - 20, 900, hh + 40);
        ctx.fill();
        ctx.globalAlpha = 0.7 * cv; ctx.setLineDash([5, 6]); ctx.strokeStyle = h.rgba(MAG, 0.7);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(gx + bw + gap - 6, yA - 20, 540, hh + 40, 8); else ctx.rect(gx + bw + gap - 6, yA - 20, 540, hh + 40);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        // lead counter
        var lead = nH - nA;
        var leadPulseP = clamp01((lt - (10.5 + nH * 0.1)) / 0.6);
        var lScale = 1 + 0.2 * Math.sin(leadPulseP * Math.PI);
        ctx.save();
        ctx.translate(720 + 70, 150 - 5);
        ctx.scale(lScale, lScale);
        ctx.font = "600 15px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(CY, 0.95);
        ctx.fillText("honest lead  +" + Math.max(0, lead), -70, 5);
        ctx.restore();
      });

      var rule = s.caption("Nodes accept the <strong>longest valid chain.</strong>", { px: 480, py: 92, anchor: "top", align: "center", size: "1.4rem", color: "#dce7fb" });
      s.write(rule, { at: 0.75, dur: 1.8 });
      var lblH = s.caption("Honest network", { px: 150, py: 196, anchor: "left", size: "1.4rem", color: CY });
      var lblA = s.caption("Attacker · private fork", { px: 150, py: 420, anchor: "left", size: "1.4rem", color: MAG });
      s.fadeIn(lblH, { at: 1.5, dur: 0.9 }); s.fadeIn(lblA, { at: 3.6, dur: 0.9 });
      // the attacker label clears once the narration panel has landed, so the
      // lower-left corner never carries two competing texts
      s.fadeOut(lblA, { at: 6.15, dur: 0.6 });

      lower(s, "Bitcoin has no central judge. To reverse a payment, an attacker must secretly outrun the honest network.", 4.4, { maxWidth: "55%", px: 400, out: 13 });
    }, { subtitle: "Consensus is a race, not a vote. The longest chain wins by rule." });
  }

  /* ================ 2 — BERNOULLI : the weighted coin ================ */
  function bernoulli(film) {
    film.scene("Every block is a coin flip", 24, function (s) {
      var p = 0.7, q = 0.3, cx = 330, cy = 280, R = 96;
      s.canvas(function (lt, ctx, h) {
        var spin = clamp01(lt / 2.2);
        var ang = E.out(spin) * Math.PI * 6 + lt * 0.4;
        var squash = 0.5 + 0.5 * Math.abs(Math.cos(lt * 2.0)); // landing wobble
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, lt < 3 ? squash : 1);
        // magenta arc (q) and cyan arc (p)
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, ang, ang + 2 * Math.PI * q); ctx.closePath();
        ctx.fillStyle = h.rgba(MAG, 0.85); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, ang + 2 * Math.PI * q, ang + 2 * Math.PI); ctx.closePath();
        ctx.fillStyle = h.rgba(CY, 0.8); ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = h.rgba("#0b1322", 0.9);
        ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
        ctx.restore();
        // clock pulse
        var ph = (lt % 2) / 2;
        var beat = 0.4 + 0.6 * Math.exp(-6 * ph);
        ctx.font = "12px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#dbeafe", beat);
        ctx.fillText("⏱ ~10 min / flip", cx - 46, cy + R + 34);
        // hashrate bar (right)
        var bx = 560, by = 250, bw = 320, bh = 30;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6); else ctx.rect(bx, by, bw, bh);
        ctx.save(); ctx.clip();
        ctx.fillStyle = h.rgba(CY, 0.7); ctx.fillRect(bx, by, bw * p, bh);
        ctx.fillStyle = h.rgba(MAG, 0.85); ctx.fillRect(bx + bw * p, by, bw * q, bh);
        ctx.restore();
        ctx.strokeStyle = h.rgba("#dbeafe", 0.5); ctx.lineWidth = 1; 
        ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6); else ctx.rect(bx, by, bw, bh); ctx.stroke();
        ctx.font = "600 13px 'JetBrains Mono',monospace";
        ctx.fillStyle = h.rgba(CY, 1); ctx.fillText("honest  p = 0.70", bx, by - 12);
        ctx.fillStyle = h.rgba(MAG, 1); ctx.fillText("attacker  q = 0.30", bx + bw * p, by + bh + 22);
      });

      var e1 = s.tex2("\\text{Honest } (p) + \\text{Attacker } (q) = 100\\%", { px: 650, py: 150, size: "1.5rem", color: "#e8eef9" });
      var e2 = s.tex2("\\text{Attacker Win Chance } = q", { px: 650, py: 360, size: "1.5rem", color: AMB });
      s.write(e1, { at: 1.5, dur: 1.5 }); s.write(e2, { at: 4.5, dur: 1.8 });
      var note = s.caption("each flip <em>independent</em> of the entire past — memoryless", { px: 280, py: 440, anchor: "top", align: "center", size: "1.2rem", color: "#dbeafe" });
      s.fadeIn(note, { at: 4.5, dur: 1.2 });
      s.fadeOut(note, { at: 6.8, dur: 0.75 }); // fade out before lower third appears

      lower(s, "Mining is a biased coin flip based on hashrate. Energy buys the probability of being right.", 7.0, { maxWidth: "70%" });
    }, { subtitle: "The race is a biased coin flip. Energy buys probability." });
  }

  /* ==================== 3 — RUIN : the rigged race to zero ====================
     Pedagogy, not plots. Three beats on one "gap ladder":
       1. mechanism  one token, one rigged coin: every block moves the gap by 1
       2. evidence   30 attackers race at once; almost none ever touch zero
       3. law        bars: the chance of EVER catching up, per starting deficit
     Everything is drawn on canvas; the only overlay text is the narration
     panel and a single closing formula. */
  function ruin(film) {
    film.scene("The gambler's ruin", 33, function (s) {
      var q = 0.3, p = 0.7, Z0 = 3, GMAX = 8;
      function gx(g) { return 130 + g * 88; }      // gap 0..8 → x 130..834
      var LY = 262;

      // deterministic PRNG: the scene plays identically on every visit
      function rng(seed) {
        var st = seed >>> 0;
        return function () {
          st = (st + 0x6D2B79F5) >>> 0;
          var z = st;
          z = Math.imul(z ^ (z >>> 15), z | 1);
          z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
          return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
        };
      }

      /* --- beat 1: one scripted run. Dips to gap 1 (almost!), then drifts. */
      var FLIPS = ["q", "p", "q", "q", "p", "p", "q", "p", "p", "p"]; // 3→2→3→2→1→2→3→2→3→4→5
      var STEP0 = 2.2, STEP = 0.85, B1END = STEP0 + FLIPS.length * STEP; // 10.7
      function gapSeries() {
        var out = [Z0], g = Z0;
        for (var i = 0; i < FLIPS.length; i++) {
          g += (FLIPS[i] === "q" ? -1 : 1);
          g = Math.max(0, Math.min(GMAX, g));
          out.push(g);
        }
        return out;
      }
      var B1 = gapSeries();

      /* --- beat 2: 30 attackers, 20 steps each. Two are scripted to reach 0
             so the tally is never empty; the rest are honest coin flips. */
      var W = 30, WSTEPS = 20, T2 = 11.0, WSTEP = 0.5;
      var rand = rng(0x5EED);
      var walkers = [];
      for (var wi = 0; wi < W; wi++) {
        var seq;
        if (wi === 7)       seq = [3, 2, 1, 2, 1, 0];
        else if (wi === 19) seq = [3, 4, 3, 2, 1, 0];
        else {
          seq = [Z0]; var g2 = Z0;
          for (var st2 = 0; st2 < WSTEPS; st2++) {
            g2 += (rand() < q ? -1 : 1);
            g2 = Math.min(GMAX, g2);
            seq.push(g2);
            if (g2 <= 0) break;
          }
        }
        while (seq.length <= WSTEPS) seq.push(seq[seq.length - 1]);
        walkers.push(seq);
      }
      function rowY(wi) { return LY + ((wi % 15) - 7) * 5.2; } // band clears the notch digits at LY+46

      /* --- beat 3: the law. Chance of EVER catching up, per deficit. */
      var T3 = 21.5;
      var PCTS = [], zz;
      for (zz = 1; zz <= 6; zz++) PCTS.push(Math.pow(q / p, zz) * 100); // 42.9, 18.4, 7.9, 3.4, 1.4, 0.6

      s.canvas(function (lt, ctx, h) {
        var ph3 = clamp01((lt - T3) / 1.2);
        var ladderA = (1 - 0.96 * E.smooth(ph3)) * clamp01((lt - 0.4) / 0.9);

        if (ladderA > 0.02) {
          ctx.save(); ctx.globalAlpha = ladderA;

          // ladder: baseline, notches, numbers
          ctx.strokeStyle = h.rgba("#93a4c4", 0.55); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(gx(0) - 34, LY); ctx.lineTo(gx(GMAX) + 34, LY); ctx.stroke();
          for (var g = 0; g <= GMAX; g++) {
            ctx.fillStyle = h.rgba(g === 0 ? GRN : "#93a4c4", g === 0 ? 0.95 : 0.5);
            ctx.beginPath(); ctx.arc(gx(g), LY, g === 0 ? 5 : 3, 0, 7); ctx.fill();
            ctx.font = "12px 'JetBrains Mono',monospace";
            ctx.fillStyle = h.rgba(g === 0 ? GRN : "#93a4c4", g === 0 ? 1 : 0.7);
            ctx.fillText(String(g), gx(g) - 4, LY + 46);
          }
          if (lt > 1.2) {
            ctx.font = "600 12px 'JetBrains Mono',monospace";
            ctx.fillStyle = h.rgba(GRN, 0.95);
            ctx.fillText("CAUGHT UP", gx(0) - 34, LY - 56);
            ctx.fillStyle = h.rgba("#93a4c4", 0.8);
            ctx.fillText("further behind →", gx(GMAX) - 118, LY - 56);
            ctx.fillStyle = h.rgba("#dbeafe", 0.75);
            ctx.fillText("blocks behind the honest chain", 380, LY + 74);
          }

          // the rigged coin (beat 1 only)
          var ci = Math.floor((lt - STEP0) / STEP);
          if (lt >= STEP0 - 0.7 && lt < B1END + 0.2) {
            var cxx = 480, cyy = 118, R = 26;
            var inStep = (lt - STEP0) - ci * STEP;
            var settled = ci >= 0 && inStep > 0.3;
            var res = ci >= 0 && ci < FLIPS.length ? FLIPS[ci] : null;
            var spinCol = (Math.floor(lt * 14) % 2 === 0) ? CY : MAG;
            var col = settled && res ? (res === "q" ? MAG : CY) : spinCol;
            ctx.beginPath(); ctx.arc(cxx, cyy, R, 0, 7);
            ctx.fillStyle = h.rgba(col, 0.85); ctx.fill();
            ctx.lineWidth = 2; ctx.strokeStyle = h.rgba("#0b1322", 0.9); ctx.stroke();
            ctx.font = "600 13px 'JetBrains Mono',monospace";
            if (settled && res) {
              ctx.fillStyle = h.rgba(col, 1);
              ctx.fillText(res === "q" ? "attacker block · gap −1" : "honest block · gap +1", cxx - 86, cyy + R + 22);
            } else if (ci >= 0 && ci < FLIPS.length) {
              ctx.fillStyle = h.rgba("#dbeafe", 0.7);
              ctx.fillText("~10 min…", cxx - 34, cyy + R + 22);
            }
          }

          // beat-1 token: glides notch to notch as the coin lands
          if (lt < B1END + 1.0) {
            var idx = Math.max(0, Math.min(B1.length - 1, ci + 1));
            var frac = ci < 0 ? 0 : clamp01(((lt - STEP0) - ci * STEP - 0.3) / 0.35);
            var from = B1[Math.max(0, Math.min(B1.length - 1, idx - 1))];
            var to = B1[idx];
            var tx = ci < 0 ? gx(Z0) : lerp(gx(from), gx(to), E.smooth(frac));
            var tokenA = 1 - clamp01((lt - B1END - 0.2) / 0.8);
            ctx.globalAlpha = ladderA * tokenA;
            ctx.shadowBlur = 14; ctx.shadowColor = h.rgba(MAG, 0.9);
            ctx.beginPath(); ctx.arc(tx, LY, 9, 0, 7);
            ctx.fillStyle = h.rgba(MAG, 1); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.font = "600 13px 'JetBrains Mono',monospace";
            ctx.fillStyle = h.rgba("#f1f5f9", 0.95);
            var shownGap = ci < 0 ? Z0 : B1[Math.max(0, Math.min(B1.length - 1, ci + (frac > 0.5 ? 1 : 0)))];
            ctx.fillText("gap = " + shownGap, tx - 26, LY - 22);
            ctx.globalAlpha = ladderA;
          }

          // beat-2 crowd
          if (lt >= T2 - 0.3) {
            var wIn = clamp01((lt - (T2 - 0.3)) / 0.8);
            var stepIdx = Math.max(0, Math.min(WSTEPS, Math.floor((lt - T2) / WSTEP)));
            var fr = clamp01(((lt - T2) - stepIdx * WSTEP) / (WSTEP * 0.6));
            var caught = 0;
            for (var w2 = 0; w2 < W; w2++) {
              var sq = walkers[w2];
              var cur = sq[Math.min(stepIdx, sq.length - 1)];
              var nxt = sq[Math.min(stepIdx + 1, sq.length - 1)];
              var jitterX = (Math.sin(w2 * 17.3) * 3);
              var wx = lerp(gx(cur), gx(nxt), E.smooth(fr)) + jitterX;
              var done = cur === 0;
              if (done) { caught++; wx = gx(0) + jitterX; }
              ctx.beginPath(); ctx.arc(wx, rowY(w2), done ? 5 : 4, 0, 7);
              ctx.fillStyle = h.rgba(done ? GRN : MAG, wIn * (done ? 0.95 : 0.45));
              ctx.fill();
            }
            // success halo on the zero notch
            if (caught > 0) {
              ctx.beginPath(); ctx.arc(gx(0), LY, 16 + 3 * Math.sin(lt * 5), 0, 7);
              ctx.strokeStyle = h.rgba(GRN, 0.5 * wIn); ctx.lineWidth = 2; ctx.stroke();
            }
            // live tally
            ctx.font = "600 16px 'JetBrains Mono',monospace";
            ctx.fillStyle = h.rgba("#f1f5f9", wIn);
            ctx.fillText("caught up: " + caught + " / " + W, 660, 128);
            if (lt > 18.5) {
              ctx.font = "600 13px 'JetBrains Mono',monospace";
              ctx.fillStyle = h.rgba(AMB, clamp01((lt - 18.5) / 0.8));
              ctx.fillText("theory says ≈ 8 in 100, forever", 660, 152);
            }
          }
          ctx.restore();
        }

        // beat 3: the law as bars
        if (ph3 > 0.01) {
          ctx.save(); ctx.globalAlpha = E.smooth(ph3);
          var baseY = 430, bw2 = 56, maxH = 230;
          ctx.font = "600 14px 'JetBrains Mono',monospace";
          ctx.fillStyle = h.rgba("#dbeafe", 0.9);
          ctx.fillText("chance of EVER catching up  (attacker has 30% of hashrate)", 200, 158);
          for (var z3 = 1; z3 <= 6; z3++) {
            var bx3 = 200 + (z3 - 1) * 95;
            var grow = clamp01((lt - (T3 + 0.6) - (z3 - 1) * 0.35) / 0.8);
            var bh3 = Math.max(3, maxH * (PCTS[z3 - 1] / PCTS[0])) * E.out(grow);
            var col3 = z3 === Z0 ? AMB : MAG;
            ctx.fillStyle = h.rgba(col3, z3 === Z0 ? 0.75 : 0.5);
            ctx.fillRect(bx3, baseY - bh3, bw2, bh3);
            ctx.strokeStyle = h.rgba(col3, 0.95); ctx.lineWidth = 1.6;
            ctx.strokeRect(bx3, baseY - bh3, bw2, bh3);
            if (grow > 0.6) {
              ctx.font = "600 13px 'JetBrains Mono',monospace";
              ctx.fillStyle = h.rgba("#f1f5f9", (grow - 0.6) / 0.4);
              var lbl3 = PCTS[z3 - 1] >= 10 ? Math.round(PCTS[z3 - 1]) + "%" : PCTS[z3 - 1].toFixed(1) + "%";
              ctx.fillText(lbl3, bx3 + bw2 / 2 - 16, baseY - bh3 - 10);
              ctx.fillStyle = h.rgba("#93a4c4", (grow - 0.6) / 0.4);
              ctx.fillText(String(z3), bx3 + bw2 / 2 - 4, baseY + 22);
            }
          }
          if (lt > T3 + 3.2) {
            ctx.font = "13px 'JetBrains Mono',monospace";
            ctx.fillStyle = h.rgba("#dbeafe", clamp01((lt - T3 - 3.2) / 0.8));
            ctx.fillText("starting deficit z (blocks behind)", 360, baseY + 50);
            ctx.font = "600 13px 'JetBrains Mono',monospace";
            ctx.fillStyle = h.rgba(AMB, clamp01((lt - T3 - 3.2) / 0.8));
            ctx.fillText("◀ the race you just watched", 200 + 2 * 95 + bw2 + 12, baseY - Math.max(3, maxH * (PCTS[2] / PCTS[0])) + 4);
          }
          ctx.restore();
        }
      });

      // the one formula this scene has earned
      var law = s.tex2("\\Pr(\\text{ever catch up}) = \\left(\\tfrac{q}{p}\\right)^{z}", { px: 760, py: 200, size: "1.15rem", color: AMB });
      s.write(law, { at: T3 + 5.6, dur: 1.8 });
      s.pulse(law, { at: T3 + 8, dur: 1.2, amp: 0.1 });

      lower(s, "Forget both chains — only the gap matters. Each block moves it one step, the coin is rigged 70/30, so from 3 behind barely 8 in 100 attackers ever touch zero. Each extra confirmation cuts that hope by more than half.", 13.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Only the gap matters — and the walk is rigged against the attacker." });
  }

  /* ============ 4 — POISSON : Satoshi's head-start refinement ============ */
  function poisson(film) {
    film.scene("Satoshi's refinement: the head start", 33, function (s) {
      var q = 0.3, p = 0.7, z = 6, lambda = z * q / p;
      // LEFT: honest stacks z blocks under a sweeping dial
      s.canvas(function (lt, ctx, h) {
        var nH = Math.max(0, Math.min(z, Math.floor(lt / 0.7)));
        for (var i = 0; i < nH; i++) {
          var x = 70, y = 430 - i * 34;
          block(ctx, h, x, y, 150, 26, CY, 1);
        }
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(CY, 0.85);
        ctx.fillText("honest: z = 6 blocks", 70, 480);
        // wall-clock dial
        var ang = -Math.PI / 2 + clamp01(lt / (z * 0.7)) * 2 * Math.PI;
        var dx = 175, dy = 150, dr = 30;
        ctx.strokeStyle = h.rgba("#dbeafe", 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 7); ctx.stroke();
        ctx.strokeStyle = h.rgba(AMB, 0.95); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + dr * Math.cos(ang), dy + dr * Math.sin(ang)); ctx.stroke();

        // RIGHT: Poisson PMF bars
        var stackBottomY = 310;
        var stackX = 640;
        var stackW = 80;
        var maxStackH = 150; 
        var currentStackSum = 0;
        var coLeft = 470; // Hardcoded fallback if co isn't ready
        
        for (var kk = 0; kk <= 8; kk++) {
          var pm = poissonPMF(lambda, kk);
          var inP = clamp01((lt - (3 + kk * 0.18)) / 0.75);
          if (inP <= 0) continue;
          
          var isRed = kk >= z;
          var col = isRed ? RED : MAG;
          
          var mStart = 12 + kk * 1.5;
          var mP = clamp01((lt - mStart) / 1.5);
          var morph = E.smooth(mP);
          
          var factor = isRed ? 0 : (1 - Math.pow(q/p, z - kk));
          var termVal = pm * factor;
          
          var bx0 = co.x(kk - 0.32), bx1 = co.x(kk + 0.32);
          var by0 = co.y(0), by1 = co.y(pm);
          var origX = bx0, origY = by1;
          var origW = bx1 - bx0, origH = by0 - by1;
          
          var targetH = termVal * maxStackH;
          var targetY = stackBottomY - (currentStackSum + termVal) * maxStackH;
          var targetX = stackX, targetW = stackW;
          
          var curX = lerp(origX, targetX, morph);
          var curY = lerp(origY, targetY, morph);
          var curW = lerp(origW, targetW, morph);
          var curH = lerp(origH, targetH, morph);
          
          var curAlpha = lerp(0.6 * inP, factor > 0 ? 0.85 : 0, morph); 
          if (curAlpha > 0.01) {
             ctx.fillStyle = h.rgba(col, curAlpha);
             ctx.fillRect(curX, curY, curW, curH);
             ctx.strokeStyle = h.rgba(col, lerp(1, factor > 0 ? 0.95 : 0, morph));
             ctx.lineWidth = 1.4;
             ctx.strokeRect(curX, curY, curW, curH);
          }
          currentStackSum += termVal;
        }
        
        var accP = clamp01((lt - 11.5) / 1.0);
        if (accP > 0) {
          ctx.strokeStyle = h.rgba("#dbeafe", 0.3 * accP);
          ctx.lineWidth = 1;
          ctx.strokeRect(stackX - 4, stackBottomY - maxStackH, stackW + 8, maxStackH);
        }
      });

      // RIGHT: Poisson PMF for the attacker's secret count
      var co = film.coords({ xRange: [-0.6, 8.6], yRange: [0, 0.32], pad: { left: 470, right: 60, top: 150, bottom: 220 } });
      var axx = s.line({ coords: co, x1: -0.4, y1: 0, x2: 8.4, y2: 0, color: PAL.axis, width: 1.3 });
      s.draw(axx, { at: 1.8, dur: 1.2 });
      s.erase(axx, { at: 12, dur: 1.5 });
      var lostLbl = s.caption("k ≥ z: race already lost", { coords: co, x: 6.5, y: 0.22, anchor: "center", size: "0.9rem", color: RED });
      s.fadeIn(lostLbl, { at: 3 + z * 0.18, dur: 0.75 });
      s.fadeOut(lostLbl, { at: 12, dur: 1.0 });
      var meanLbl = s.caption("k ~ Poisson(λ),  λ = z·q/p ≈ 2.57", { coords: co, x: 4, y: 0.30, anchor: "center", align: "center", size: "1.1rem", color: MAG });
      s.fadeIn(meanLbl, { at: 6.3, dur: 1.05 });
      s.fadeOut(meanLbl, { at: 12, dur: 1.0 });
      var kAxis = s.caption("attacker's secret blocks  k →", { coords: co, x: 8.3, y: -0.045, anchor: "top-right", align: "right", size: "1.2rem", color: "#dbeafe" });
      s.fadeIn(kAxis, { at: 2.1, dur: 0.9 });
      s.fadeOut(kAxis, { at: 12, dur: 1.0 });

      // the closed form assembling
      var form = s.tex2("P(z) = 1 - \\sum_{k=0}^{z} \\textcolor{#9A72AC}{\\mathrm{Pois}(k;\\lambda)} \\bigl(1 - (q/p)^{z-k}\\bigr)", { px: 680, py: 370, anchor: "top", align: "center", size: "1.1rem", color: "#e8eef9" });
      s.write(form, { at: 22, dur: 2.7 });

      lower(s, "Satoshi models the attacker's block count as Poisson with mean λ = zq/p, then sums gambler's-ruin tails.", 9.0, { maxWidth: "92%", px: 60, out: 24.75 });
      var caveat = s.caption("<span style='color:#fbbf24'>approximation:</span> Satoshi fixes the honest window at its mean. The exact count is Negative-Binomial, so this slightly understates risk.", { px: 60, py: 60, anchor: "top-left" });
      caveat.el.style.maxWidth = "88%"; caveat.el.style.whiteSpace = "normal"; caveat.el.style.textAlign = "left";
      caveat.el.classList.add("labf__lower");
      caveat._ax = "left"; caveat._ay = "bottom"; caveat._anchorPx = [60, 520];
      s.fadeIn(caveat, { at: 25.5, dur: 1.5 });
    }, { subtitle: "Confirmations are honest progress, but the clock ran for the attacker too." });
  }

  /* ============== 5 — CONSEQUENCE : the log-scale punchline ============== */
  function consequence(film) {
    film.scene("Orders of magnitude, not multiples", 18, function (s) {
      // log-y plot: y = log10(P), from 0 (P=1) down to -7
      var co = film.coords({ xRange: [0, 12], yRange: [-7, 0], pad: { left: 96, right: 320, top: 120, bottom: 120 } });
      var ax = s.axes(co, { grid: true, gridX: 6, gridY: 7 });
      s.draw(ax, { at: 0.6, dur: 1.35 });
      // y tick labels (10^0 .. 10^-7)
      [0, -1, -2, -3, -4, -5, -6, -7].forEach(function (e, i) {
        var t = s.caption("10<sup>" + e + "</sup>", { coords: co, x: -0.35, y: e, anchor: "right", size: "0.62rem", color: "#7f93b4" });
        s.fadeIn(t, { at: 1.5 + i * 0.08, dur: 0.75 });
      });
      var xlab = s.caption("confirmations z →", { coords: co, x: 6, y: -7.7, anchor: "top", align: "center", size: "1.2rem", color: "#dbeafe" });
      s.fadeIn(xlab, { at: 2.2, dur: 0.75 });
      var ylab = s.caption("P(successful double-spend)", { coords: co, x: -0.05, y: 0.3, anchor: "left", size: "0.8rem", color: "#dbeafe" });
      s.fadeIn(ylab, { at: 1.5, dur: 0.75 });
      
      [2, 4, 6, 8, 10, 12].forEach(function (zTick) {
        var t = s.caption(zTick, { coords: co, x: zTick, y: -7.25, anchor: "top", align: "center", size: "0.8rem", color: "#7f93b4" });
        s.fadeIn(t, { at: 1.5, dur: 0.75 });
      });

      function curve(q, color, at) {
        var pts = [], z;
        for (z = 1; z <= 12; z++) pts.push([z, Math.max(-7, Math.log10(attackerSuccess(q, z)))]);
        var pl = s.poly(pts, { coords: co, color: color, width: 3 });
        s.draw(pl, { at: at, dur: 3 });
        
        var pathFn = pathOfArc(pts, co);
        var px = pts.map(function(p) { return [co.x(p[0]), co.y(p[1])]; });
        var cum = [0], i, L = 0;
        for(i=1; i<px.length; i++) { L += Math.hypot(px[i][0]-px[i-1][0], px[i][1]-px[i-1][1]); cum.push(L); }
        var tau6 = cum[5] / L;
        
        s.canvas(function(lt, ctx, h) {
           if (lt < at) return;
           var tProg = clamp01((lt - at) / 3);
           
           var idealTau = tProg;
           var diff = tau6 - idealTau;
           var tau = idealTau;
           if (diff < 0.05 && diff > 0) {
               tau = tau6 - 0.05 * Math.pow(diff / 0.05, 2);
           } else if (diff <= 0) {
               tau = tau6;
           }
           
           var pt = pathFn(tau);
           ctx.beginPath(); ctx.arc(co.x(pt.x), co.y(pt.y), 4, 0, 7);
           var alpha = clamp01((lt - at) / 0.15);
           ctx.fillStyle = h.rgba(color, alpha);
           ctx.fill();
        });
      }
      curve(0.1, CY, 2.0);
      curve(0.3, MAG, 3.4);

      // z = 6 marker
      var zl = s.line({ coords: co, x1: 6, y1: -7, x2: 6, y2: 0, color: "#e8eef9", width: 1.5, dashed: "4 5" });
      s.draw(zl, { at: 3.2, dur: 0.9 });
      var z6 = s.caption("z = 6", { coords: co, x: 6, y: 0.5, anchor: "center", align: "center", size: "1.2rem", color: "#f1f5f9" });
      s.fadeIn(z6, { at: 3.5, dur: 0.6 });

      // callouts
      var x6 = co.x(6);
      var yCY = co.y(Math.log10(attackerSuccess(0.1, 6)));
      var yMG = co.y(Math.log10(attackerSuccess(0.3, 6)));

      var cCY = s.caption("q=0.1 → <strong style='color:#ffffff'>0.024%</strong>", { px: x6 + 18, py: yCY, anchor: "left", size: "1.1rem", color: CY });
      var cMG = s.caption("q=0.3 → <strong style='color:#ffffff'>13.2%</strong>", { px: x6 + 18, py: yMG, anchor: "left", size: "1.1rem", color: MAG });
      s.fadeIn(cCY, { at: 3.5, dur: 0.75 }); 
      s.fadeIn(cMG, { at: 4.9, dur: 0.75 });
      
      var jump = s.caption("a <strong style='color:#fbbf24'>544×</strong> jump, not 3×", { px: x6 + 18, py: (yCY + yMG)/2, anchor: "left", size: "1.2rem", color: "#e8eef9" });
      s.fadeIn(jump, { at: 6.2, dur: 1.05 }); 
      s.pulse(jump, { at: 7.2, dur: 1.2, amp: 0.12 });

      lower(s, "Tripling the attacker from 10% to 30% inflates risk by ~544x. Adversary size dominates.", 11.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Security decays exponentially in the attacker's relative size." });
  }

  /* ===================== 6 — STAKES : finality ===================== */
  function stakes(film) {
    film.scene("What the race really secures", 21, function (s) {
      var gx = 110, bw = 40, gap = 12, yH = 230, yA = 350, hh = 36;
      s.canvas(function (lt, ctx, h) {
        block(ctx, h, gx, (yH + yA) / 2 - hh / 2, bw, hh, "#888888", 1);
        var nH = 12, aC = 4, i;
        for (i = 0; i < nH; i++) {
          var rev = clamp01((lt - i * 0.12) / 0.3);
          if (rev <= 0) break;
          var x = gx + bw + gap + i * (bw + gap);
          ctx.strokeStyle = h.rgba(CY, 0.5); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - gap, yH + hh / 2); ctx.lineTo(x, yH + hh / 2); ctx.stroke();
          block(ctx, h, x, yH, bw, hh, CY, rev);
        }
        // attacker fork dissolving into dust — branches visibly off genesis
        var diss = clamp01((lt - 3) / 3);
        if (diss < 1) {
          ctx.strokeStyle = h.rgba(MAG, 0.5 * (1 - diss)); ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(gx + bw, (yH + yA) / 2);
          ctx.lineTo(gx + bw + gap, yA + hh / 2);
          ctx.stroke();
        }
        for (i = 0; i < aC; i++) {
          var xa = gx + bw + gap + i * (bw + gap);
          if (diss < 0.01) {
            block(ctx, h, xa, yA, bw, hh, MAG, 0.9);
          } else {
            var cfAlpha = 1 - clamp01(diss / 0.15);
            if (cfAlpha > 0) block(ctx, h, xa, yA, bw, hh, MAG, 0.9 * cfAlpha);
            
            ctx.globalAlpha = Math.max(0, (1 - diss) * 0.9);
            for(var p = 0; p < 4; p++) {
              var jx = diss * (20 + p * 8) * Math.cos(i + p * 1.5);
              var jy = diss * (20 + p * 8) * Math.sin(i + p * 2.1) + diss * 30; // drop down
              var subW = bw * 0.45, subH = hh * 0.45;
              block(ctx, h, xa + (p%2)*subW*1.1 + jx, yA + Math.floor(p/2)*subH*1.1 + jy, subW, subH, MAG, 1);
            }
          }
        }
        ctx.globalAlpha = 1;
        // payment ring
        var px = gx + bw + gap + bw / 2, py = yH - 16;
        ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fillStyle = h.rgba(GRN, 1); ctx.fill();
        if (lt > 4) {
          ctx.beginPath(); ctx.arc(px, py, 15, 0, 7); ctx.strokeStyle = h.rgba(GRN, clamp01((lt - 4) / 0.8)); ctx.lineWidth = 2; ctx.stroke();
        }
      });

      var fin = s.caption("payment finalized (probabilistically)", { px: 200, py: 196, anchor: "left", size: "0.78rem", color: GRN });
      s.fadeIn(fin, { at: 6.9, dur: 1.05 });
      var lim = s.tex2("\\text{More confirmations } \\Rightarrow \\text{ Near-Zero Risk}", { px: 480, py: 118, size: "1.3rem", color: AMB });
      s.write(lim, { at: 1.5, dur: 2.1 });
      var cite = s.caption("Nakamoto 2008, §11 · cf. Ural, <em>Blockchain-Enhanced ML</em>, IEEE Access 2023", { px: 900, py: 60, anchor: "top-right", align: "right", size: "0.66rem", color: "#7f93b4" });
      s.fadeIn(cite, { at: 12, dur: 1.2 });

      lower(s, "Reversal becomes exponentially improbable, provided honest hashrate holds the majority.", 7.5, { maxWidth: "70%" });
    }, { subtitle: "Finality is probabilistic, not absolute." });
  }

  /* ====================== math appendix ====================== */
  function appendix() {
    var host = document.querySelector('[data-role="br-appendix"]');
    if (!host || !window.katex) return;
    var blocks = [
      ["Gambler's ruin", "q_z = (q/p)^{z}\\quad (q<p), \\qquad q_z = 1\\ (q\\ge p)",
        "First-step analysis of the biased walk gives \\(a_z = p\\,a_{z+1}+q\\,a_{z-1},\\ a_0=1\\); the bounded solution for \\(q<p\\) is exactly \\((q/p)^z\\). Below half the hashrate, catch-up decays geometrically."],
      ["Satoshi §11", "P(z) = 1 - \\sum_{k=0}^{z}\\frac{\\lambda^{k}e^{-\\lambda}}{k!}\\bigl(1-(q/p)^{z-k}\\bigr),\\ \\lambda=z\\tfrac{q}{p}",
        "The attacker mines secretly during the same window; their count is taken Poisson with mean \\(\\lambda=zq/p\\). This is the whitepaper's <em>AttackerSuccessProbability</em> routine verbatim."],
      ["The approximation", "k \\sim \\mathrm{NB}(z,p)\\ \\text{(exact)} \\;\\ne\\; \\mathrm{Poisson}(zq/p)",
        "Satoshi fixes the honest window at its <em>mean</em>; the exact count given z honest blocks is Negative-Binomial. The Poisson form therefore <em>understates</em> risk — e.g. \\(0.000591\\) exact vs \\(0.000243\\) at \\(q{=}0.1,z{=}6\\) (Grunspan–Pérez-Marco 2017)."],
      ["The punchline", "P_{0.1}(6)=0.024\\%,\\quad P_{0.3}(6)=13.2\\%",
        "At six confirmations, moving the adversary from 10% to 30% of hashrate raises reversal probability ~544× under the Poisson formula (~264× under exact NB). Security is exponential in z; its base is q/p."]
    ];
    var html = '<div class="lab-math__grid">';
    blocks.forEach(function (b) {
      html += '<div class="lab-math__item"><div class="lab-math__name">' + b[0] + '</div><div class="lab-math__eq">' +
        window.katex.renderToString(b[1], { throwOnError: false, displayMode: true }) + '</div><p class="lab-math__note">' + b[2] + '</p></div>';
    });
    html += '</div><p class="lab-math__refs">Nakamoto (2008) §11 · Rosenfeld (2014) · Grunspan &amp; Pérez-Marco (2017) · Ural, <em>IEEE Access</em> 2023.</p>';
    host.innerHTML = html;
    host.querySelectorAll(".lab-math__note").forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(/\\\((.+?)\\\)/g, function (_, t) { try { return window.katex.renderToString(t, { throwOnError: false }); } catch (e) { return t; } });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
