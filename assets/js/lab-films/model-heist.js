/* =============================================================================
   model-heist.js — cinematic explainer: statistical model watermarking.

   Seven scenes, math verified (Gaussian Z-test over k correlated marks):
     1. hook          The stolen model        (prove provenance through noise)
     2. fragile-mark  One big mark is fragile  (loud signal, easy to scrub)
     3. spread        Spread it thin over k    (matched filter, √k gain)
     4. ztest         Detection is a Z-test    (N(0,1) vs N(d,1); the hero)
     5. roc           Robustness via k         (ROC inflates; AUC=Φ(d/√2))
     6. scrub-paradox The scrubbing paradox    (kill it ⇒ wreck utility)
     7. stakes        Courtroom-grade          (Power=Φ(√k·ε/σ − z_α))

   Referee corrections applied:
     • ONE convention: unit-norm matched filter w (‖w‖=1) ⇒ signal amplitude
       √k·ε, noise std σ (flat), so d = √k·ε/σ. No mixing with the all-ones sum.
     • The confidence chip is driven by Power = Φ(d − z_α), NOT 1−α.
     • AUC = Φ(d/√2) stated exactly.
     • The scrub-paradox’s √k cost holds because w is SECRET (the thief cannot
       align his budget δ with w); |ΔS| = |⟨w,δ⟩| ≤ ‖δ‖ ≤ ρ. Stated on stage.
     • Assumptions (white noise, σ known, clean reference, single test) in appendix.
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("mh-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build(); appendix();
  }

  var PAL = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = "#38bdf8", GRN = "#34d399", AMB = "#fbbf24", RED = "#fb7185", GREY = "#94a3b8", GOLD = "#d4af37";
  var Z_ALPHA = 1.645; // one-sided α = 5%

  function erf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }
  function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function phi(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }

  function lower(s, html, at, o) {
    o = o || {};
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.5 });
    return c;
  }
  function bar(ctx, h, x, y, w, hh, color, alpha) {
    ctx.globalAlpha = alpha;
    var grd = ctx.createLinearGradient(x, y + hh, x, y);
    grd.addColorStop(0, h.rgba(color, 0.3));
    grd.addColorStop(1, h.rgba(color, 0.85));
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, w, hh);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = h.rgba(color, 0.95);
    ctx.strokeRect(x, y, w, hh);
    ctx.globalAlpha = 1;
  }

  function build() {
    var film = window.LabAnim.create("#mh-film", { width: 960, height: 540 });
    hook(film); fragile(film); spread(film); ztest(film); roc(film); scrub(film); stakes(film);
    film.build();
    if (window.__LABDEBUG) window.__mhFilm = film;
  }

  /* a tiny node-graph drawer (used in hook & stakes) */
  function graph(ctx, h, cx, cy, color, alpha, seed, jitter) {
    var layers = [3, 4, 4, 2], gxs = [-60, -20, 20, 60], i, j, prevPts = null;
    ctx.globalAlpha = alpha;
    for (i = 0; i < layers.length; i++) {
      var pts = [], n = layers[i];
      for (j = 0; j < n; j++) {
        var yy = cy + (j - (n - 1) / 2) * 26 + (jitter ? Math.sin((seed + i * 3 + j) * 9) * jitter : 0);
        pts.push([cx + gxs[i], yy]);
      }
      if (prevPts) for (var a = 0; a < prevPts.length; a++) for (var b = 0; b < pts.length; b++) {
        ctx.strokeStyle = h.rgba(color, 0.16); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(prevPts[a][0], prevPts[a][1]); ctx.lineTo(pts[b][0], pts[b][1]); ctx.stroke();
      }
      for (j = 0; j < pts.length; j++) { ctx.beginPath(); ctx.arc(pts[j][0], pts[j][1], 4, 0, 7); ctx.fillStyle = h.rgba(color, 0.95); ctx.fill(); }
      prevPts = pts;
    }
    ctx.globalAlpha = 1;
  }

  /* ===================== 1 — HOOK ===================== */
  function hook(film) {
    film.scene("The stolen model", 14, function (s) {
      s.canvas(function (lt, ctx, h) {
        graph(ctx, h, 270, 270, CY, clamp01(lt / 1.2), 1, 0);
        // Digital data stream flowing from left model to right model
        if (lt > 1.5) {
          var pStream = clamp01((lt - 1.5) / 1.5);
          ctx.globalAlpha = pStream;
          var nn = 60, i;
          ctx.font = "10px 'JetBrains Mono',monospace";
          for (i = 0; i < nn; i++) {
            // Flowing from x=360 to x=600
            var speed = 40 + (i % 5) * 15;
            var startX = 350 + (i * 13) % 40;
            var x = startX + ((lt * speed + i * 14) % 260);
            var y = 190 + (i * 17) % 160;
            
            // Random hex digits flickering
            var charCode = Math.floor((Math.sin(lt * 15 + i) * 0.5 + 0.5) * 16).toString(16).toUpperCase();
            
            // Tail fading effect
            var tailFade = 1.0 - ((x - startX) / 260);
            ctx.fillStyle = h.rgba((i % 4 === 0) ? RED : CY, (0.2 + 0.8 * tailFade) * (0.5 + 0.5 * Math.sin(lt * 8 + i)));
            ctx.fillText(charCode, x, y);
          }
          ctx.globalAlpha = 1;
        }
        var jit = clamp01((lt - 2) / 2) * 4;
        graph(ctx, h, 690, 270, RED, clamp01((lt - 1.5) / 1.2), 5, jit);
        // labels
        ctx.font = "600 12px 'JetBrains Mono',monospace";
        ctx.fillStyle = h.rgba(CY, 0.95); ctx.fillText("YOUR MODEL  θ", 218, 360);
        ctx.fillStyle = h.rgba(RED, 0.95); ctx.fillText("LEAKED MODEL  θ̂", 632, 360);
        ctx.fillStyle = h.rgba("#dbeafe", 0.8); ctx.font = "11px 'JetBrains Mono',monospace";
        ctx.fillText("fine-tuning leak", 442, 200);
      });
      var title = s.caption("Can you prove it’s <em>yours</em>?", { px: 480, py: 96, anchor: "top", align: "center", size: "1.9rem", color: "#ffffff" });
      s.write(title, { at: 0.6, dur: 1.4 });
      lower(s, "Your model leaks. A competitor fine-tunes and claims it. How do you prove ownership when weights change?", 4.4, { maxWidth: "80%", out: 13.2, px: 60 });
    }, { subtitle: "Ownership must survive transformation, not just live in raw weights." });
  }

  /* ================= 2 — FRAGILE MARK ================= */
  function fragile(film) {
    film.scene("One big mark is fragile", 16, function (s) {
      var n = 30, x0 = 150, bw = 16, gap = 8, baseY = 330, idx = 15;
      s.canvas(function (lt, ctx, h) {
        var scrub = clamp01((lt - 4.5) / 2.0);     // brush knocks the tall bar down
        var i;
        for (i = 0; i < n; i++) {
          var x = x0 + i * (bw + gap);
          var hgt = 14 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 10;
          if (i === idx) {
            var tall = (1 - scrub) * 150 + 16;
            bar(ctx, h, x, baseY - tall, bw, tall, scrub > 0.6 ? RED : CY, 1);
          } else bar(ctx, h, x, baseY - hgt, bw, hgt, GREY, 0.8);
        }
        // brush sweep
        if (lt > 3.5 && lt < 7) {
          var bx = lerp(x0 + idx * (bw + gap) - 40, x0 + idx * (bw + gap) + 30, clamp01((lt - 3.5) / 3));
          ctx.shadowBlur = 15; ctx.shadowColor = RED;
          var grd = ctx.createLinearGradient(bx - 20, 0, bx + 46, 0);
          grd.addColorStop(0, h.rgba(RED, 0)); grd.addColorStop(0.5, h.rgba(RED, 0.6)); grd.addColorStop(1, h.rgba(RED, 0));
          ctx.fillStyle = grd; ctx.fillRect(bx - 20, baseY - 180, 66, 200);
          ctx.shadowBlur = 0;
          ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(RED, 0.95);
          ctx.fillText("SCRUB", bx - 6, baseY - 190);
          
          // Glitch / Screen Tear effect
          if (Math.random() > 0.5) {
             ctx.fillStyle = h.rgba(RED, 0.15 + 0.1 * Math.random());
             var gY = baseY - 180 + Math.random() * 200;
             var gH = 2 + Math.random() * 8;
             ctx.fillRect(bx - 40, gY, 100, gH);
             ctx.fillRect(bx - 100 + Math.random() * 200, gY - 10, 40 + Math.random() * 100, 2);
          }
        }
        // utility meter (right)
        var um = lt < 4.5 ? 0.7 : 0.7 - 0.55 * (1 - scrub); // tall bar => low utility, recovers as scrubbed
        var mx = 760, my = 200, mh = 150;
        ctx.shadowBlur = 10; ctx.shadowColor = h.rgba("#dbeafe", 0.2);
        ctx.strokeStyle = h.rgba("#dbeafe", 0.5); ctx.lineWidth = 1; ctx.strokeRect(mx, my, 26, mh);
        ctx.shadowBlur = 0;
        var fillH = mh * um, col = um < 0.4 ? RED : GRN;
        for (var seg = 0; seg < Math.floor(fillH / 6); seg++) {
          ctx.fillStyle = h.rgba(col, 0.5 + 0.5 * (seg / (mh / 6)));
          ctx.fillRect(mx + 3, my + mh - (seg * 6) - 4, 20, 3);
        }
        ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#dbeafe", 0.9);
        ctx.fillText("utility", mx - 2, my - 8);
      });
      var eq = s.tex2("\\text{Large noise} \\Rightarrow \\text{Visible } \\& \\text{ Brittle}", { px: 480, py: 110, size: "1.8rem", color: "#dbeafe" });
      s.fadeIn(eq, { at: 1.0, dur: 0.8 });
      lower(s, "A single large watermark is obvious and hurts accuracy. Loud signals cannot hide in quiet spaces.", 8.2, { maxWidth: "80%", px: 60 });
    }, { subtitle: "A single strong mark can’t be stealthy, robust, and harmless at once." });
  }

  /* ================= 3 — SPREAD ================= */
  function spread(film) {
    film.scene("Spread it thin across k weights", 18, function (s) {
      var n = 30, x0 = 130, bw = 16, gap = 9, baseY = 330, K = 24;
      var marked = []; for (var m = 0; m < n; m++) if (m % 5 !== 2 && marked.length < K) marked.push(m);
      s.canvas(function (lt, ctx, h) {
        var spreadP = clamp01((lt - 1.0) / 2.5); // mass redistributes
        var i;
        for (i = 0; i < n; i++) {
          var x = x0 + i * (bw + gap);
          var base = 14 + (Math.sin(i * 2.3) * 0.5 + 0.5) * 8;
          var isMark = marked.indexOf(i) >= 0;
          var delta = isMark ? spreadP * 9 : 0;
          bar(ctx, h, x, baseY - base - delta, bw, base + delta, GREY, 0.75);
          if (isMark && delta > 0) bar(ctx, h, x, baseY - base - delta, bw, delta, CY, clamp01(spreadP));
        }
        // dashed pattern envelope w over the marked tips
        if (spreadP > 0.4) {
          ctx.setLineDash([4, 5]); ctx.strokeStyle = h.rgba(CY, 0.5 * spreadP); ctx.lineWidth = 1.4;
          ctx.beginPath();
          marked.forEach(function (mi, q) { var x = x0 + mi * (bw + gap) + bw / 2; var y = baseY - (14 + (Math.sin(mi * 2.3) * 0.5 + 0.5) * 8) - spreadP * 9 - 4; if (q === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
          ctx.stroke(); ctx.setLineDash([]);
        }
        // SNR readout d = sqrt(k) eps/sigma as k fills in
        var kNow = Math.floor(clamp01((lt - 3.5) / 6) * K);
        var d = Math.sqrt(kNow) * 0.32;
        ctx.font = "600 14px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(AMB, 0.95);
        ctx.fillText("k = " + kNow + "   d = √k·ε/σ = " + d.toFixed(2), 560, 180);
        // a little sqrt(k) curve for d
        var px0 = 560, py0 = 360, pw = 320, ph = 130;
        ctx.strokeStyle = h.rgba("#dbeafe", 0.4); ctx.lineWidth = 1; ctx.strokeRect(px0, py0 - ph, pw, ph);
        ctx.strokeStyle = h.rgba(AMB, 0.95); ctx.lineWidth = 2.4; ctx.beginPath();
        for (var kk = 0; kk <= kNow; kk++) { var xx = px0 + pw * kk / K, yy = py0 - (Math.sqrt(kk) * 0.32 / (Math.sqrt(K) * 0.32)) * ph; if (kk === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke();
        ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#dbeafe", 0.8);
        ctx.fillText("aggregate SNR  d", px0, py0 - ph - 8);
      });
      var eq = s.tex2("\\text{Signal Strength} \\sim \\text{Dimensions } (k)", { px: 480, py: 104, size: "1.8rem", color: "#e8eef9" });
      s.write(eq, { at: 1.0, dur: 1.4 });
      lower(s, "Spread the mark across weights. Each nudge hides in the noise. A matched filter correlates the secret pattern: signals add coherently, noise cancels out.", 9.0, { maxWidth: "85%", px: 60 });
    }, { subtitle: "Correlated marks add coherently; noise adds in quadrature." });
  }

  /* ================= 4 — Z-TEST (hero) ================= */
  function ztest(film) {
    film.scene("Detection is a Z-test", 20, function (s) {
      var co = film.coords({ xRange: [-3.4, 6.4], yRange: [0, 0.46], pad: { left: 70, right: 60, top: 150, bottom: 130 } });
      function dOf(lt) { return lerp(0.4, 3.4, clamp01((lt - 1.5) / 12)); } // k rising over the scene
      s.canvas(function (lt, ctx, h) {
        var d = dOf(lt), xa = co.x(Z_ALPHA);
        function curve(mu, color, fillCol) {
          ctx.beginPath();
          var first = true, x;
          for (x = co.xmin; x <= co.xmax; x += 0.06) { var px = co.x(x), py = co.y(phi(x - mu)); if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); }
          ctx.lineTo(co.x(co.xmax), co.y(0)); ctx.lineTo(co.x(co.xmin), co.y(0)); ctx.closePath();
          ctx.fillStyle = h.rgba(fillCol, 0.10); ctx.fill();
          ctx.beginPath(); first = true;
          for (x = co.xmin; x <= co.xmax; x += 0.06) { var px2 = co.x(x), py2 = co.y(phi(x - mu)); if (first) { ctx.moveTo(px2, py2); first = false; } else ctx.lineTo(px2, py2); }
          ctx.strokeStyle = h.rgba(color, 0.95); ctx.lineWidth = 2.4; ctx.stroke();
        }
        // shaded α (gray, right of threshold under H0) and power (cyan, right of threshold under H1)
        function fillRight(mu, color, alpha) {
          ctx.beginPath(); var first = true, x;
          for (x = Z_ALPHA; x <= co.xmax; x += 0.05) { var px = co.x(x), py = co.y(phi(x - mu)); if (first) { ctx.moveTo(px, co.y(0)); ctx.lineTo(px, py); first = false; } else ctx.lineTo(px, py); }
          ctx.lineTo(co.x(co.xmax), co.y(0)); ctx.closePath(); ctx.fillStyle = h.rgba(color, alpha); ctx.fill();
        }
        fillRight(0, RED, 0.30);
        fillRight(d, CY, 0.40);
        curve(0, GREY, GREY);
        curve(d, CY, CY);
        // threshold line
        ctx.strokeStyle = h.rgba(RED, 0.9); ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(xa, co.y(0)); ctx.lineTo(xa, co.y(0.44)); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(RED, 0.95); ctx.fillText("z_α", xa + 4, co.y(0.43));
        // caliper for d
        ctx.strokeStyle = h.rgba(AMB, 0.9); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(co.x(0), co.y(0.40)); ctx.lineTo(co.x(d), co.y(0.40)); ctx.stroke();
        ctx.fillStyle = h.rgba(AMB, 0.95); ctx.font = "600 13px 'JetBrains Mono',monospace";
        ctx.fillText("d = " + d.toFixed(2), co.x(d / 2) - 18, co.y(0.41) - 6);
        // power readout
        var power = Phi(d - Z_ALPHA);
        ctx.fillStyle = h.rgba(CY, 1); ctx.font = "600 14px 'JetBrains Mono',monospace";
        ctx.fillText("Power = Φ(d − z_α) = " + (power * 100).toFixed(1) + "%", 600, 150);
        // labels
        ctx.font = "11px 'JetBrains Mono',monospace";
        ctx.fillStyle = h.rgba(GREY, 0.9); ctx.fillText("H₀ innocent  N(0,1)", co.x(-2.6), co.y(0.30));
        ctx.fillStyle = h.rgba(CY, 0.95); ctx.fillText("H₁ marked  N(d,1)", co.x(d + 0.3), co.y(0.34));
      });
      var e1 = s.tex2("\\text{Separating Stolen vs Independent Models}", { px: 300, py: 96, size: "1.9rem", color: "#e8eef9" });
      s.write(e1, { at: 0.8, dur: 1.2 });
      lower(s, "This forms a Z-test. Innocent models center at zero. Stolen models shift right. A threshold balances detection and false alarms.", 9.0, { maxWidth: "85%", px: 60, py: 535 });
    }, { subtitle: "Provenance collapses to one number: the shift d." });
  }

  /* ================= 5 — ROC ================= */
  function roc(film) {
    film.scene("Robustness is bought with k", 18, function (s) {
      var co = film.coords({ xRange: [0, 1], yRange: [0, 1], pad: { left: 96, right: 420, top: 130, bottom: 120 } });
      var ax = s.axes(co, { grid: true, gridX: 5, gridY: 5 });
      s.draw(ax, { at: 0.4, dur: 0.8 });
      var xlab = s.caption("false-positive rate →", { coords: co, x: 0.5, y: -0.13, anchor: "top", align: "center", size: "0.7rem", color: "#dbeafe" });
      var ylab = s.caption("true-positive rate", { coords: co, x: -0.04, y: 1.13, anchor: "left", size: "0.7rem", color: "#dbeafe" });
      s.fadeIn(xlab, { at: 0.8, dur: 0.5 }); s.fadeIn(ylab, { at: 0.8, dur: 0.5 });
      // diagonal
      var diag = s.poly([[0, 0], [1, 1]], { coords: co, color: GREY, width: 1.4, dashed: "4 5" });
      s.draw(diag, { at: 1.0, dur: 0.8 });
      function rocCurve(d, color, at, label) {
        var pts = [], tt;
        for (tt = 5; tt >= -5; tt -= 0.1) { var fpr = Phi(-tt), tpr = Phi(d - tt); pts.push([fpr, tpr]); }
        var pl = s.poly(pts, { coords: co, color: color, width: 3 });
        s.draw(pl, { at: at, dur: 1.6 });
        var auc = Phi(d / Math.SQRT2);
        var lbl = s.caption(label + " · AUC " + auc.toFixed(3), { coords: co, x: 0.42, y: Phi(d - 0.2) - 0.06, anchor: "left", size: "1.3rem", color: color });
        s.fadeIn(lbl, { at: at + 1.4, dur: 0.5 });
      }
      rocCurve(0.6, "#7dd3fc", 2.0, "small k");
      rocCurve(1.6, CY, 3.6, "more k");
      rocCurve(3.2, GRN, 5.2, "large k");

      // stealth meter (right) — epsilon/sigma pinned low while d climbs
      var sm = s.caption("per-weight ε/σ ≈ 0.3 <span style='color:#34d399'>(invisible)</span>", { px: 720, py: 250, anchor: "left", size: "0.86rem", color: GREY });
      var dm = s.caption("aggregate d = √k·ε/σ <span style='color:#fbbf24'>↑ certain</span>", { px: 720, py: 290, anchor: "left", size: "0.86rem", color: "#e8eef9" });
      s.fadeIn(sm, { at: 7.0, dur: 0.6 }); s.fadeIn(dm, { at: 7.6, dur: 0.6 });
      var aucEq = s.tex2("\\text{Detection Accuracy} \\sim \\text{Signal}", { px: 760, py: 350, size: "1.8rem", color: AMB });
      s.fadeIn(aucEq, { at: 8.4, dur: 0.7 });

      lower(s, "Marks stay below the noise, preserving utility. Signal scales with breadth. You buy certainty with width, not loudness.", 10.0, { maxWidth: "85%", px: 60 });
    }, { subtitle: "The √k factor decouples stealth from aggregate confidence." });
  }

  /* ================= 6 — SCRUB PARADOX ================= */
  function scrub(film) {
    film.scene("The scrubbing paradox", 14, function (s) {
      var n = 24, x0 = 150, bw = 18, gap = 8, baseY = 320;
      s.canvas(function (lt, ctx, h) {
        var attack = clamp01((lt - 2) / 4);
        var i, killed = Math.floor(attack * 8);
        for (i = 0; i < n; i++) {
          var x = x0 + i * (bw + gap);
          var base = 16, mark = 12;
          var isKilled = i < killed;
          var glow = isKilled ? 0 : (1 + attack * 0.5); // survivors brighten
          bar(ctx, h, x, baseY - base, bw, base, GREY, 0.6);
          if (!isKilled) bar(ctx, h, x, baseY - base - mark * glow, bw, mark * glow, CY, clamp01(0.7 + attack * 0.3));
          else { 
            ctx.shadowBlur = 8; ctx.shadowColor = RED;
            ctx.fillStyle = h.rgba(RED, 0.4); ctx.fillRect(x, baseY - base, bw, base);
            ctx.shadowBlur = 0;
          }
        }
        // utility plunge + budget gauge
        var util = 0.75 - attack * 0.6, bx = 720, by = 180, bh = 150;
        ctx.strokeStyle = h.rgba("#dbeafe", 0.5); ctx.strokeRect(bx, by, 26, bh);
        ctx.fillStyle = h.rgba(util < 0.35 ? RED : GRN, 0.7); ctx.fillRect(bx, by + bh - bh * Math.max(0, util), 26, bh * Math.max(0, util));
        ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#dbeafe", 0.9);
        ctx.fillText("utility", bx - 2, by - 8);
        
        // Critical Warning when utility drops below threshold
        if (util < 0.35 && (Math.floor(lt * 8) % 2 === 0)) {
           ctx.font = "700 14px 'JetBrains Mono',monospace";
           ctx.fillStyle = h.rgba(RED, 0.95);
           ctx.fillText("CRITICAL:", bx - 45, by + bh + 25);
           ctx.fillText("MODEL BROKEN", bx - 45, by + bh + 45);
           ctx.shadowBlur = 10; ctx.shadowColor = RED;
           ctx.strokeStyle = RED; ctx.lineWidth = 2;
           ctx.strokeRect(bx - 4, by - 4, 34, bh + 8);
           ctx.shadowBlur = 0;
        }
        // owner Z needle barely dips
        var z = 4.2 - attack * 0.5;
        ctx.fillStyle = h.rgba(CY, 1); ctx.font = "600 13px 'JetBrains Mono',monospace";
        ctx.fillText("owner Z = " + z.toFixed(1) + "  ≫ z_α", 600, 150);
      });
      var eq = s.tex2("\\text{Attacker Modifications} \\le \\text{Allowed Bound}", { px: 480, py: 110, size: "1.8rem", color: AMB });
      s.write(eq, { at: 1.0, dur: 1.2 });
      lower(s, "The thief is trapped by geometry. Without the secret pattern, blind scrubbing wrecks utility before erasing the mark.", 7.0, { maxWidth: "85%", px: 60 });
    }, { subtitle: "The constraint that keeps the stolen model useful protects the mark." });
  }

  /* ================= 7 — STAKES ================= */
  function stakes(film) {
    film.scene("A courtroom-grade signature", 12, function (s) {
      s.canvas(function (lt, ctx, h) {
        graph(ctx, h, 250, 280, CY, 1, 9, 0);
        // gold pattern overlay glints
        var i; ctx.globalAlpha = 0.8;
        for (i = 0; i < 8; i++) { var a = lt * 1.5 + i; ctx.fillStyle = h.rgba(GOLD, 0.5 + 0.5 * Math.sin(a)); ctx.beginPath(); ctx.arc(210 + i * 12, 250 + (i % 3) * 22, 2.5, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
      });
      var d3 = Math.sqrt(100) * 0.45; // k=100
      var power = Phi(d3 - Z_ALPHA);
      var eq = s.tex2("\\text{Signal} \\propto \\sqrt{\\text{Dimensions}}", { px: 560, py: 220, size: "1.9rem", color: AMB });
      s.write(eq, { at: 0.8, dur: 1.6 });
      var chip = s.caption("detection power → <strong style='color:#ffffff'>" + (power * 100).toFixed(2) + "%</strong>", { px: 560, py: 300, anchor: "left", size: "1.8rem", color: GRN });
      s.fadeIn(chip, { at: 2.8, dur: 0.7 }); s.pulse(chip, { at: 3.6, dur: 0.8, amp: 0.1 });
      var tag = s.caption("Invisible in any one weight. <strong>Undeniable across all of them.</strong>", { px: 480, py: 400, anchor: "top", align: "center", size: "1.8rem", color: "#e8eef9" });
      s.write(tag, { at: 4.4, dur: 1.4 });
      var cite = s.caption("Ural, <em>Feature-Based Model Watermarking for PoL</em>, IEEE Access 2024", { px: 900, py: 60, anchor: "top-right", align: "right", size: "0.66rem", color: "#7f93b4" });
      s.fadeIn(cite, { at: 6.0, dur: 0.8 });
    }, { subtitle: "Power = Φ(√k·ε/σ − z_α): tune k, certify ownership." });
  }

  /* ====================== appendix ====================== */
  function appendix() {
    var host = document.querySelector('[data-role="mh-appendix"]');
    if (!host || !window.katex) return;
    var blocks = [
      ["Matched filter", "S=\\langle w,\\ \\hat\\theta-\\theta_{\\text{ref}}\\rangle,\\quad \\|w\\|=1",
        "The owner shifts the weights along a secret unit pattern w; the verifier correlates the leaked weights against w. This is the Neyman–Pearson optimal linear detector for a known signal in white Gaussian noise."],
      ["Effect size", "d = \\frac{\\sqrt{k}\\,\\varepsilon}{\\sigma}",
        "Signal projects coherently to amplitude \\(\\sqrt{k}\\,\\varepsilon\\); the noise projection \\(w^\\top n\\sim N(0,\\sigma^2)\\) stays flat because \\(\\|w\\|=1\\). The √k is the crux: robustness is bought by spreading, not deepening."],
      ["Power", "\\text{Power}=\\Phi(d-z_\\alpha),\\quad \\text{AUC}=\\Phi(d/\\sqrt2)",
        "\\(Z\\sim N(0,1)\\) under \\(H_0\\), \\(N(d,1)\\) under \\(H_1\\). Reject when \\(Z>z_\\alpha=\\Phi^{-1}(1-\\alpha)\\). Per-weight \\(\\varepsilon/\\sigma\\ll1\\) (invisible) while \\(d\\gg1\\) (certain)."],
      ["Why it survives", "|\\Delta S| = |\\langle w,\\delta\\rangle| \\le \\|\\delta\\| \\le \\rho",
        "A utility-bounded scrub \\(\\|\\delta\\|\\le\\rho\\) can remove at most \\(\\rho\\) of the statistic — and because w is <em>secret</em>, the thief cannot align δ with it. Assumes white noise, known σ, a clean reference \\(\\theta_{\\text{ref}}=\\theta\\), and a single pre-registered test."]
    ];
    var html = '<div class="lab-math__grid">';
    blocks.forEach(function (b) {
      html += '<div class="lab-math__item"><div class="lab-math__name">' + b[0] + '</div><div class="lab-math__eq">' +
        window.katex.renderToString(b[1], { throwOnError: false, displayMode: true }) + '</div><p class="lab-math__note">' + b[2] + '</p></div>';
    });
    html += '</div><p class="lab-math__refs">Neyman–Pearson lemma · Ural, <em>Feature-Based Model Watermarking for PoL</em>, IEEE Access 2024.</p>';
    host.innerHTML = html;
    host.querySelectorAll(".lab-math__note").forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(/\\\((.+?)\\\)/g, function (_, t) { try { return window.katex.renderToString(t, { throwOnError: false }); } catch (e) { return t; } });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
