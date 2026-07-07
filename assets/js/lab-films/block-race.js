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
  var CY = "#38bdf8", MAG = "#ec4899", GRN = "#34d399", AMB = "#fbbf24", RED = "#fb7185";

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

  function lower(s, html, at, o) {
    o = o || {};
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.5 });
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
        block(ctx, h, gx, (yH + yA) / 2 - hh / 2, bw, hh, "#94a3b8", 1);
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#cbd5e1", 0.8);
        ctx.fillText("genesis", gx - 4, (yH + yA) / 2 + hh / 2 + 16);
        var nH = nAt(lt, 0.4, 0.85, 8), nA = nAt(lt, 1.6, 1.18, 6), i;
        // honest (cyan, top)
        for (i = 0; i < nH; i++) {
          var x = gx + bw + gap + i * (bw + gap);
          ctx.strokeStyle = h.rgba(CY, 0.5); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - gap, yH + hh / 2); ctx.lineTo(x, yH + hh / 2); ctx.stroke();
          block(ctx, h, x, yH, bw, hh, CY, 1);
        }
        // attacker (magenta, bottom, secret)
        for (i = 0; i < nA; i++) {
          var xa = gx + bw + gap + i * (bw + gap);
          ctx.strokeStyle = h.rgba(MAG, 0.45); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(xa - gap, yA + hh / 2); ctx.lineTo(xa, yA + hh / 2); ctx.stroke();
          block(ctx, h, xa, yA, bw, hh, MAG, 0.92);
        }
        // payment coin on honest genesis-adjacent block
        ctx.beginPath(); ctx.arc(gx + bw + gap + 0 * (bw + gap) + bw / 2, yH - 16, 8, 0, 7);
        ctx.fillStyle = h.rgba(GRN, lt > 1 ? 1 : 0); ctx.fill();
        // secrecy curtain over attacker chain
        var cv = clamp01((lt - 1.2) / 0.8) * (1 - clamp01((lt - 11) / 1.2));
        ctx.globalAlpha = 0.40 * cv; ctx.fillStyle = "#0b1322";
        ctx.fillRect(gx + bw + gap - 6, yA - 20, 900, hh + 40);
        ctx.globalAlpha = 0.7 * cv; ctx.setLineDash([5, 6]); ctx.strokeStyle = h.rgba(MAG, 0.7);
        ctx.strokeRect(gx + bw + gap - 6, yA - 20, 540, hh + 40); ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        // lead counter
        var lead = nH - nA;
        ctx.font = "600 15px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(CY, 0.95);
        ctx.fillText("honest lead  +" + Math.max(0, lead), 720, 150);
      });

      var rule = s.caption("Nodes accept the <strong>longest valid chain.</strong>", { px: 480, py: 92, anchor: "top", align: "center", size: "1rem", color: "#dce7fb" });
      s.write(rule, { at: 0.5, dur: 1.2 });
      var lblH = s.caption("Honest network", { px: 150, py: 196, anchor: "left", size: "0.74rem", color: CY });
      var lblA = s.caption("Attacker · private fork", { px: 150, py: 420, anchor: "left", size: "0.74rem", color: MAG });
      s.fadeIn(lblH, { at: 1.0, dur: 0.6 }); s.fadeIn(lblA, { at: 2.4, dur: 0.6 });
      // clear the lower third before the narration panel writes in at 4.4
      s.fadeOut(lblA, { at: 4.1, dur: 0.4 });
      var eq = s.tex2("\\text{Lead} = \\text{Honest Blocks} - \\text{Attacker Blocks}", { px: 480, py: 150, size: "0.92rem", color: "#9fb2d4" });
      lower(s, "Bitcoin has no central judge. To reverse a payment, an attacker must secretly outrun the honest network.", 4.4, { maxWidth: "55%", px: 400, out: 13.4 });
    }, { subtitle: "Consensus is a race, not a vote. The longest chain wins by rule." });
  }

  /* ================ 2 — BERNOULLI : the weighted coin ================ */
  function bernoulli(film) {
    film.scene("Every block is a coin flip", 16, function (s) {
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
        var beat = (lt % 2) < 0.25 ? 1 : 0.4;
        ctx.font = "12px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#9fb2d4", beat);
        ctx.fillText("⏱ ~10 min / flip", cx - 46, cy + R + 34);
        // hashrate bar (right)
        var bx = 560, by = 250, bw = 320, bh = 30;
        ctx.fillStyle = h.rgba(CY, 0.7); ctx.fillRect(bx, by, bw * p, bh);
        ctx.fillStyle = h.rgba(MAG, 0.85); ctx.fillRect(bx + bw * p, by, bw * q, bh);
        ctx.strokeStyle = h.rgba("#9fb2d4", 0.5); ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
        ctx.font = "600 13px 'JetBrains Mono',monospace";
        ctx.fillStyle = h.rgba(CY, 1); ctx.fillText("honest  p = 0.70", bx, by - 12);
        ctx.fillStyle = h.rgba(MAG, 1); ctx.fillText("attacker  q = 0.30", bx + bw * p, by + bh + 22);
      });

      var e1 = s.tex2("\\text{Honest } (p) + \\text{Attacker } (q) = 100\\%", { px: 700, py: 150, size: "1.15rem", color: "#e8eef9" });
      var e2 = s.tex2("\\text{Attacker Win Chance } = q", { px: 700, py: 360, size: "1rem", color: AMB });
      s.write(e1, { at: 1.0, dur: 1.0 }); s.write(e2, { at: 3.0, dur: 1.2 });
      var note = s.caption("each flip <em>independent</em> of the entire past — memoryless", { px: 330, py: 430, anchor: "top", align: "center", size: "0.8rem", color: "#9fb2d4" });
      s.fadeIn(note, { at: 5.0, dur: 0.8 });
      s.fadeOut(note, { at: 6.8, dur: 0.5 }); // hand the lower third to the narration

      lower(s, "Mining is a biased coin flip based on hashrate. Energy buys the probability of being right.", 7.0, { maxWidth: "70%" });
    }, { subtitle: "The race is a biased coin flip. Energy buys probability." });
  }

  /* ==================== 3 — RUIN : the random walk ==================== */
  function ruin(film) {
    film.scene("The gambler's ruin", 22, function (s) {
      var co = film.coords({ xRange: [-7.5, 2.5], yRange: [-1, 1], pad: { left: 90, right: 360, top: 150, bottom: 150 } });
      // breakeven line at 0
      var be = s.line({ coords: co, x1: 0, y1: -0.9, x2: 0, y2: 0.9, color: "#e8eef9", width: 2 });
      s.fadeIn(be, { at: 0.6, dur: 0.5 });
      var beLbl = s.caption("0 = breakeven", { coords: co, x: 0.1, y: 0.98, anchor: "left", size: "0.72rem", color: "#cbd5e1" });
      s.fadeIn(beLbl, { at: 0.8, dur: 0.5 });
      // axis
      var ax = s.line({ coords: co, x1: -7.3, y1: 0, x2: 2.3, y2: 0, color: PAL.axis, width: 1.3 });
      s.draw(ax, { at: 0.4, dur: 0.8 });

      // precomputed biased walks (q=0.3) from deficit -6
      var walks = [], wcount = 4, j, k;
      for (j = 0; j < wcount; j++) {
        var pts = [[-6, 0]], x = -6;
        for (k = 0; k < 26; k++) { x += (Math.random() < 0.3 ? 1 : -1); pts.push([-6 + (k + 1) * 0, 0]); pts[pts.length - 1] = [x, (j - 1.5) * 0.18]; if (x >= 0) break; }
        walks.push(pts);
      }
      walks.forEach(function (w, i) {
        var ghost = s.poly(w, { coords: co, color: i === 0 ? GRN : MAG, width: i === 0 ? 2.2 : 1.4 });
        s.draw(ghost, { at: 2.0 + i * 0.5, dur: 3.5 });
        if (i !== 0) s.fadeOut(ghost, { at: 9.5, dur: 1.2, to: 0.18 });
      });
      var token = s.dot({ coords: co, x: -6, y: 0, r: 8, color: MAG, glow: 9 });
      s.fadeIn(token, { at: 1.6, dur: 0.4 });
      var tokLbl = s.caption("attacker, z behind", { coords: co, x: -6, y: -0.45, anchor: "center", align: "center", size: "0.7rem", color: MAG });
      s.fadeIn(tokLbl, { at: 1.8, dur: 0.5 });

      // recurrence + solution (right column)
      var r1 = s.tex2("\\text{Random Walk Analysis}", { px: 770, py: 172, size: "1rem", color: "#e8eef9" });
      var r2 = s.tex2("\\text{Catch up from 0 is guaranteed}", { px: 770, py: 224, display: false, size: "0.95rem", color: "#9fb2d4" });
      s.write(r1, { at: 9.5, dur: 1.3 }); s.fadeIn(r2, { at: 11.0, dur: 0.6 });
      var sol = s.tex2("\\text{Attacker Success} = \\Big(\\frac{\\text{Attacker Power}}{\\text{Honest Power}}\\Big)^z", { px: 770, py: 294, size: "1.25rem", color: AMB });
      s.write(sol, { at: 12.2, dur: 1.4 }); s.pulse(sol, { at: 13.8, dur: 0.8, amp: 0.1 });
      var r3 = s.tex2("\\text{Honest majority } \\Rightarrow \\text{ Attacker chances decay}", { px: 770, py: 360, display: false, size: "0.9rem", color: "#9fb2d4" });
      s.fadeIn(r3, { at: 14.4, dur: 0.8 });

      lower(s, "The honest lead is a biased random walk. An attacker z blocks behind faces Gambler's Ruin, bounded by (q/p)<sup>z</sup>.", 15.6, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Catching up from z blocks behind is exactly the gambler's ruin problem." });
  }

  /* ============ 4 — POISSON : Satoshi's head-start refinement ============ */
  function poisson(film) {
    film.scene("Satoshi's refinement: the head start", 22, function (s) {
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
        ctx.strokeStyle = h.rgba("#9fb2d4", 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 7); ctx.stroke();
        ctx.strokeStyle = h.rgba(AMB, 0.95); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + dr * Math.cos(ang), dy + dr * Math.sin(ang)); ctx.stroke();
      });

      // RIGHT: Poisson PMF for the attacker's secret count
      var co = film.coords({ xRange: [-0.6, 8.6], yRange: [0, 0.32], pad: { left: 470, right: 60, top: 150, bottom: 220 } });
      var axx = s.line({ coords: co, x1: -0.4, y1: 0, x2: 8.4, y2: 0, color: PAL.axis, width: 1.3 });
      s.draw(axx, { at: 1.2, dur: 0.8 });
      var bars = [], kk;
      for (kk = 0; kk <= 8; kk++) {
        var pm = poissonPMF(lambda, kk);
        var bx0 = co.x(kk - 0.32), bx1 = co.x(kk + 0.32), by0 = co.y(0), by1 = co.y(pm);
        var col = kk > z ? RED : MAG;
        var bar = s.rect({ x: bx0, y: by1, w: bx1 - bx0, h: by0 - by1, fill: window.LabAnim.rgba(col, 0.6), stroke: col, sw: 1.4 });
        s.fadeIn(bar, { at: 2.0 + kk * 0.18, dur: 0.5 });
      }
      var meanLbl = s.caption("k ~ Poisson(λ),  λ = z·q/p ≈ 2.57", { coords: co, x: 4, y: 0.30, anchor: "center", align: "center", size: "0.78rem", color: MAG });
      s.fadeIn(meanLbl, { at: 4.2, dur: 0.7 });
      var kAxis = s.caption("attacker's secret blocks  k →", { coords: co, x: 8.3, y: -0.045, anchor: "top-right", align: "right", size: "0.72rem", color: "#9fb2d4" });
      s.fadeIn(kAxis, { at: 1.4, dur: 0.6 });

      // the closed form assembling
      var form = s.tex2("\\text{Double Spend Risk Drop-off}", { px: 480, py: 340, size: "1.05rem", color: AMB });
      s.write(form, { at: 12.5, dur: 1.8 });

      lower(s, "Satoshi models the attacker's block count as a Poisson process, summing Gambler's Ruin tails.", 9.0, { maxWidth: "92%", px: 60, out: 16.5 });
      var caveat = s.caption("<span style='color:#fbbf24'>approximation:</span> Satoshi fixes the honest window at its mean. The exact count is Negative-Binomial, so this slightly understates risk.", { px: 60, py: 60, anchor: "top-left" });
      caveat.el.style.maxWidth = "88%"; caveat.el.style.whiteSpace = "normal"; caveat.el.style.textAlign = "left";
      caveat.el.classList.add("labf__lower");
      caveat._ax = "left"; caveat._ay = "bottom"; caveat._anchorPx = [60, 535];
      s.fadeIn(caveat, { at: 17.0, dur: 1.0 });
    }, { subtitle: "Confirmations are honest progress, but the clock ran for the attacker too." });
  }

  /* ============== 5 — CONSEQUENCE : the log-scale punchline ============== */
  function consequence(film) {
    film.scene("Orders of magnitude, not multiples", 18, function (s) {
      // log-y plot: y = log10(P), from 0 (P=1) down to -7
      var co = film.coords({ xRange: [0, 12], yRange: [-7, 0], pad: { left: 96, right: 320, top: 120, bottom: 120 } });
      var ax = s.axes(co, { grid: true, gridX: 6, gridY: 7 });
      s.draw(ax, { at: 0.4, dur: 0.9 });
      // y tick labels (10^0 .. 10^-7)
      [0, -1, -2, -3, -4, -5, -6, -7].forEach(function (e) {
        var t = s.caption("10<sup>" + e + "</sup>", { coords: co, x: -0.35, y: e, anchor: "right", size: "0.62rem", color: "#7f93b4" });
        s.fadeIn(t, { at: 1.0, dur: 0.5 });
      });
      var xlab = s.caption("confirmations z →", { coords: co, x: 6, y: -7.7, anchor: "top", align: "center", size: "0.72rem", color: "#9fb2d4" });
      s.fadeIn(xlab, { at: 1.0, dur: 0.5 });

      function curve(q, color, at) {
        var pts = [], z;
        for (z = 1; z <= 12; z++) pts.push([z, Math.max(-7, Math.log10(attackerSuccess(q, z)))]);
        var pl = s.poly(pts, { coords: co, color: color, width: 3 });
        s.draw(pl, { at: at, dur: 2.0 });
        var dot = s.dot({ coords: co, x: 1, y: Math.log10(attackerSuccess(q, 1)), r: 4, color: color });
        s.fadeIn(dot, { at: at, dur: 0.3 });
      }
      curve(0.1, CY, 2.0);
      curve(0.3, MAG, 3.4);

      // z = 6 marker
      var zl = s.line({ coords: co, x1: 6, y1: -7, x2: 6, y2: 0, color: "#e8eef9", width: 1.5, dashed: "4 5" });
      s.draw(zl, { at: 6.0, dur: 0.6 });
      var z6 = s.caption("z = 6", { coords: co, x: 6, y: 0.4, anchor: "center", align: "center", size: "0.72rem", color: "#cbd5e1" });
      s.fadeIn(z6, { at: 6.2, dur: 0.4 });

      // callouts
      var cCY = s.caption("q=0.1 · z=6 → <strong style='color:#fff'>0.024%</strong>", { px: 760, py: 210, size: "0.92rem", color: CY });
      var cMG = s.caption("q=0.3 · z=6 → <strong style='color:#fff'>13.2%</strong>", { px: 760, py: 260, size: "0.92rem", color: MAG });
      s.fadeIn(cCY, { at: 7.2, dur: 0.7 }); s.fadeIn(cMG, { at: 8.0, dur: 0.7 });
      var jump = s.caption("a <strong style='color:#fbbf24'>544×</strong> jump, not 3×", { px: 760, py: 320, size: "1rem", color: "#e8eef9" });
      s.fadeIn(jump, { at: 8.8, dur: 0.7 }); s.pulse(jump, { at: 9.6, dur: 0.8, amp: 0.12 });

      lower(s, "Tripling the attacker from 10% to 30% inflates risk by ~544x. Adversary size dominates.", 11.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Security decays exponentially in the attacker's relative size." });
  }

  /* ===================== 6 — STAKES : finality ===================== */
  function stakes(film) {
    film.scene("What the race really secures", 14, function (s) {
      var gx = 110, bw = 40, gap = 12, yH = 230, yA = 350, hh = 36;
      s.canvas(function (lt, ctx, h) {
        block(ctx, h, gx, (yH + yA) / 2 - hh / 2, bw, hh, "#94a3b8", 1);
        var nH = 12, aC = 4, i;
        for (i = 0; i < nH; i++) {
          var rev = clamp01((lt - i * 0.12) / 0.3);
          if (rev <= 0) break;
          var x = gx + bw + gap + i * (bw + gap);
          ctx.strokeStyle = h.rgba(CY, 0.5); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - gap, yH + hh / 2); ctx.lineTo(x, yH + hh / 2); ctx.stroke();
          block(ctx, h, x, yH, bw, hh, CY, rev);
        }
        // attacker fork dissolving into dust
        var diss = clamp01((lt - 3) / 3);
        for (i = 1; i <= aC; i++) {
          var xa = gx + bw + gap + i * (bw + gap);
          if (diss < 0.01) {
            block(ctx, h, xa, yA, bw, hh, MAG, 0.9);
          } else {
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
      s.fadeIn(fin, { at: 4.6, dur: 0.7 });
      var lim = s.tex2("\\text{More confirmations } \\Rightarrow \\text{ Zero Risk}", { px: 480, py: 118, size: "1.1rem", color: AMB });
      s.write(lim, { at: 1.0, dur: 1.4 });
      var cite = s.caption("Nakamoto 2008, §11 · cf. Ural, <em>Blockchain-Enhanced ML</em>, IEEE Access 2023", { px: 900, py: 60, anchor: "top-right", align: "right", size: "0.66rem", color: "#7f93b4" });
      s.fadeIn(cite, { at: 8.0, dur: 0.8 });

      lower(s, "Reversal becomes exponentially improbable, provided honest hashrate holds the majority.", 5.0, { maxWidth: "70%" });
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
