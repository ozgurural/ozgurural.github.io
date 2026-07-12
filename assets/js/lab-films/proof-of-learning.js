/* =============================================================================
   proof-of-learning.js — cinematic explainer: the loss trajectory as a fingerprint.

   Seven scenes, math verified (Jia et al. S&P 2021; SecurePoL, Ural & Yoshigoe 2025):
     1. hook-the-copy   A stolen snapshot       (final weights copy for free)
     2. path-not-point  The path, not the point (record the SGD transcript)
     3. proof-object    What a proof is         (P = (W, I, H, A))
     4. replay          Verify only suspicious  (top-Q magnitude replay; hero)
     5. asymmetry       Prover vs adversary cost (entropy ∝ T ⇒ paths ~ exp T)
     6. securepol       Closing the gap         (trajectory ∧ watermark)
     7. signature       The fingerprint         (genuine noisy vs forged flat)

   Referee corrections applied:
     • The two product factors are DISTINCT: a reproduction-error check
       d₂(W′,W)≤δ AND a reachability event Tr (the verifier actually computes k
       updates) — not two δ-balls.
     • E[C_A] ≥ E[C_T] is a DESIGN PROPERTY (Jia 2021, Property 2), not a
       theorem; it was later shown bypassable (Zhang 2022, Fang 2023) — which is
       exactly why SecurePoL binds in a watermark. Stated on stage + appendix.
     • Entropy of the PROCESS ∝ T ⇒ #paths ~ exp(T): a heuristic, not "⇒".
     • Genuine loss descends IN EXPECTATION (SGD is non-monotone); low step
       variance is a heuristic tell, not a sufficient detector.
   ============================================================================= */
(function () {
  "use strict";
  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("pol-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build(); appendix();
  }
  var PAL = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var TEAL = "#58C4DD", AMB = "#FFFF00", RED = "#FC6255", GRN = "#83C167", GREY = "#888888", GOLD = "#FFFF00", INDIGO = "#9A72AC";

  var _lowerCount = 0;
  function lower(s, html, at, o) {
    var audioId = "proof-of-learning_" + (_lowerCount++);
    s.audio(audioId, at);
    o = o || {};
    var c = s.caption(html, { px: o.px !== undefined ? o.px : 46, py: o.py !== undefined ? o.py : 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.75 });
    return c;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function grid(ctx, h, x, y, cell, color, alpha, wm) {
    ctx.globalAlpha = alpha;
    var size = 8;
    var w = size * cell;
    
    // Draw Manim-style brackets
    ctx.strokeStyle = h.rgba("#ffffff", 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    // left bracket
    ctx.moveTo(x - 4 + 6, y - 4);
    ctx.lineTo(x - 4, y - 4);
    ctx.lineTo(x - 4, y + w + 2);
    ctx.lineTo(x - 4 + 6, y + w + 2);
    // right bracket
    ctx.moveTo(x + w + 4 - 6, y - 4);
    ctx.lineTo(x + w + 4, y - 4);
    ctx.lineTo(x + w + 4, y + w + 2);
    ctx.lineTo(x + w + 4 - 6, y + w + 2);
    ctx.stroke();

    for (var i = 0; i < size; i++) for (var j = 0; j < size; j++) {
      var v = (Math.sin(i * 3.1 + j * 1.7) * 0.5 + 0.5);
      var isWm = wm && ((i + j) % 3 === 0 && i % 2 === 0);
      ctx.fillStyle = h.rgba(isWm ? GOLD : color, 0.25 + 0.6 * v);
      rr(ctx, x + i * cell + 1, y + j * cell + 1, cell - 3, cell - 3, 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function build() {
    var film = window.LabAnim.create("#pol-film", { width: 960, height: 540 });
    hook(film); pathPoint(film); proofObj(film); replay(film); asymmetry(film); securepol(film); signature(film);
    film.build();
    if (window.__LABDEBUG) window.__polFilm = film;
  }

  /* ============== 1 — HOOK : a stolen snapshot ============== */
  function hook(film) {
    film.scene("A stolen snapshot", 21, function (s) {
      s.canvas(function (lt, ctx, h) {
        grid(ctx, h, 250, 220, 14, TEAL, clamp01(lt / 1.2), false);
        ctx.font = "italic 18px var(--ds-font-serif, Georgia, serif)"; ctx.fillStyle = h.rgba(TEAL, 0.95); ctx.fillText("your trained model", 225, 350);
        if (lt > 2) {
          var sweep = clamp01((lt - 2) / 1.2), cx = lerp(250, 560, E.out(sweep));
          grid(ctx, h, cx, 220, 14, lt > 5 ? RED : "#e8eef9", clamp01((lt - 2) / 1.0), false);
          ctx.fillStyle = h.rgba(lt > 5 ? RED : "#f1f5f9", 0.9); ctx.fillText(lt > 5 ? "an exact copy" : "copy…", 565, 350);
          
          // Cloning scanner beam
          if (lt > 2 && lt < 4) {
             var scanX = cx + (Math.sin(lt*15)*14 + 28);
             ctx.shadowBlur = 15; ctx.shadowColor = TEAL;
             ctx.strokeStyle = h.rgba(TEAL, 0.8); ctx.lineWidth = 3;
             ctx.beginPath(); ctx.moveTo(scanX, 210); ctx.lineTo(scanX, 340); ctx.stroke();
             ctx.shadowBlur = 0;
          }
        }
        if (lt > 6.5) {
          var st = clamp01((lt - 6.5) / 0.6);
          ctx.globalAlpha = st; ctx.strokeStyle = h.rgba(GRN, 0.9); ctx.lineWidth = 2; rr(ctx, 386, 250, 150, 40, 8); ctx.stroke();
          ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 16px var(--ds-font-serif, Georgia, serif)"; ctx.textAlign = "center"; ctx.fillText("IDENTICAL", 461, 276); ctx.textAlign = "left"; ctx.globalAlpha = 1;
        }
      });
      var eq = s.tex2("\\text{Copying the weights: almost free}", { px: 380, py: 110, size: "1.4rem", color: "#dbeafe" });
      s.fadeIn(eq, { at: 5.25, dur: 1.2 });
      lower(s, "A trained model is just a big list of numbers, and anyone can copy it. So how do you prove you actually did the work of training it?", 4.5, { maxWidth: "66%", out: 19.8 });
    }, { subtitle: "The endpoint carries no evidence of the effort that made it." });
  }

  /* ============== 2 — PATH, NOT POINT ============== */
  function pathPoint(film) {
    film.scene("The path, not the point", 18, function (s) {
      var co = film.coords({ xRange: [-3.4, 3.4], yRange: [-2.2, 2.2], pad: { left: 70, right: 360, top: 120, bottom: 70 } });
      var a = 0.8, b = 0.5;
      // descent path with noise (precomputed)
      var path = [], x = -2.9, y = 1.8, t;
      for (t = 0; t < 40; t++) { var gx = 2 * a * x, gy = 2 * b * y; x -= 0.12 * gx + (Math.sin(t * 12.9) * 0.5) * 0.10; y -= 0.12 * gy + (Math.sin(t * 7.3) * 0.5) * 0.10; path.push([x, y]); }
        s.canvas(function (lt, ctx, h) {
          for (var i = 9; i >= 1; i--) { 
            var tt = i / 9; var rx = Math.sqrt(tt * 6 / a), ry = Math.sqrt(tt * 6 / b); 
            var cxp = co.x(0), cyp = co.y(0); ctx.beginPath(); 
            ctx.ellipse(cxp, cyp, Math.abs(co.x(rx) - cxp), Math.abs(cyp - co.y(ry)), 0, 0, 7); 
            ctx.fillStyle = h.rgba("#1e3a8a", 0.05 + 0.02 * (1 - tt)); ctx.fill();
            ctx.shadowBlur = 8; ctx.shadowColor = h.rgba(TEAL, 0.2);
            ctx.strokeStyle = h.rgba(h.mix("#1e3a8a", TEAL, 1 - tt), 0.4 * (1.2 - tt)); 
            ctx.lineWidth = 1.5; ctx.stroke(); 
            ctx.shadowBlur = 0;
          }
        // inset loss curve (top-right)
        var px0 = 550, py0 = 250, pw = 300, ph = 120;
        ctx.strokeStyle = h.rgba("#dbeafe", 0.4); ctx.lineWidth = 1; ctx.strokeRect(px0, py0 - ph, pw, ph);
        ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#dbeafe", 0.8); ctx.fillText("loss L vs step t", px0, py0 - ph - 8);
        // background grid
        ctx.strokeStyle = h.rgba("#dbeafe", 0.1); ctx.lineWidth = 1; ctx.beginPath();
        for(var g = 1; g < 4; g++) { ctx.moveTo(px0, py0 - ph*g/4); ctx.lineTo(px0+pw, py0 - ph*g/4); }
        for(var g = 1; g < 8; g++) { ctx.moveTo(px0 + pw*g/8, py0); ctx.lineTo(px0 + pw*g/8, py0 - ph); }
        ctx.stroke();
        
        var nL = Math.floor(clamp01(lt / 9) * 40);
        ctx.strokeStyle = h.rgba(TEAL, 0.95); ctx.lineWidth = 2; 
        ctx.shadowBlur = 10; ctx.shadowColor = TEAL;
        ctx.beginPath();
        var pts = [];
        for (i = 0; i <= nL; i++) { var L = Math.exp(-i * 0.09) * (1 + 0.12 * Math.sin(i * 1.9)) ; var xx = px0 + pw * i / 40, yy = py0 - ph * (1 - L); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); pts.push([xx, yy]); }
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (pts.length > 0) {
          ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
          for(var p=1; p<pts.length; p++) ctx.lineTo(pts[p][0], pts[p][1]);
          ctx.lineTo(pts[pts.length-1][0], py0); ctx.lineTo(pts[0][0], py0); ctx.closePath();
          var grd = ctx.createLinearGradient(0, py0-ph, 0, py0);
          grd.addColorStop(0, h.rgba(TEAL, 0.35)); grd.addColorStop(1, h.rgba(TEAL, 0.0));
          ctx.fillStyle = grd; ctx.fill();
        }
      });
      // descent polyline (SVG) + checkpoints
      var pl = s.poly(path, { coords: co, color: TEAL, width: 2.4 });
      s.draw(pl, { at: 1.2, dur: 11.25 });
      var w0 = s.dot({ coords: co, x: path[0][0], y: path[0][1], r: 6, color: "#ffffff" });
      s.fadeIn(w0, { at: 0.9, dur: 0.6 });
      var w0l = s.caption("start", { coords: co, x: path[0][0] - 0.1, y: path[0][1] + 0.35, anchor: "right", size: "1.3rem", color: "#f1f5f9" });
      s.fadeIn(w0l, { at: 1.2, dur: 0.6 });
      [8, 16, 24, 32, 39].forEach(function (ci, q) {
        var d = s.dot({ coords: co, x: path[ci][0], y: path[ci][1], r: 5, color: AMB, glow: 5 });
        s.fadeIn(d, { at: 3 + q * 0.7, dur: 0.6 });
      });
      var wt = s.caption("final model", { coords: co, x: path[39][0] + 0.1, y: path[39][1] + 0.4, anchor: "left", size: "1.3rem", color: AMB });
      s.fadeIn(wt, { at: 10.5, dur: 0.75 });
      var eq = s.tex2("\\text{Each step: a small nudge from the data}", { px: 360, py: 92, size: "1.3rem", color: "#e8eef9" });
      s.write(eq, { at: 1.5, dur: 2.1 });
      lower(s, "A model isn't born at the finish line. It gets there one tiny step at a time, and that winding path, not the final point, is the real asset.", 6.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "PoL records the optimization transcript, not the result." });
  }

  /* ============== 3 — THE PROOF OBJECT ============== */
  function proofObj(film) {
    film.scene("What a proof actually is", 24, function (s) {
      var cards = [
        { k: "1", t: "the checkpoints", c: TEAL }, { k: "2", t: "which data, each step", c: "#58C4DD" },
        { k: "3", t: "a fingerprint per step", c: INDIGO }, { k: "4", t: "the settings & recipe", c: GREY }
      ];
      var cardX = 470, cardW = 356;
      function cCy(i) { return 150 + i * 70 + 28; } // card vertical centre

      // header up top, clear of both columns
      var head = s.tex2("\\text{The proof} = \\text{the whole training diary}", { px: 480, py: 92, size: "1.3rem", color: AMB });
      s.write(head, { at: 0.6, dur: 1.8 });

      // LEFT: the training run being recorded, one entry flying into each card
      s.canvas(function (lt, ctx, h) {
        var bx0 = 95, bx1 = 405, byTop = 172, byBot = 402, N = 48;
        ctx.strokeStyle = h.rgba("#dbeafe", 0.16); ctx.lineWidth = 1; ctx.strokeRect(bx0, byTop, bx1 - bx0, byBot - byTop);
        ctx.font = "11px 'JetBrains Mono',monospace";
        ctx.fillStyle = h.rgba("#dbeafe", 0.7); ctx.fillText("your training run", bx0, byBot + 22);
        ctx.fillStyle = h.rgba("#dbeafe", 0.45); ctx.fillText("loss", bx0 - 2, byTop - 8);
        function Lof(i) { return Math.exp(-i * 0.075) * (1 + 0.14 * Math.sin(i * 1.7)) * 0.9 + 0.05; }
        function X(i) { return bx0 + (bx1 - bx0) * i / N; }
        function Y(L) { return byTop + (1 - L) * (byBot - byTop); }
        var nn = Math.floor(clamp01((lt - 0.6) / 5.2) * N);
        ctx.strokeStyle = h.rgba(TEAL, 0.95); ctx.lineWidth = 2.2; ctx.shadowBlur = 8; ctx.shadowColor = TEAL; ctx.beginPath();
        for (var i = 0; i <= nn; i++) { var xx = X(i), yy = Y(Lof(i)); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke(); ctx.shadowBlur = 0;
        var cps = [9, 21, 33, 45];
        for (var k = 0; k < 4; k++) {
          var ci = cps[k], cpx = X(ci), cpy = Y(Lof(ci)), appear = 1.0 + k * 0.9;
          if (lt < appear || ci > nn) continue;
          ctx.fillStyle = h.rgba(AMB, 0.95); ctx.shadowBlur = 10; ctx.shadowColor = AMB;
          ctx.beginPath(); ctx.arc(cpx, cpy, 4.5 * clamp01((lt - appear) / 0.3), 0, 7); ctx.fill(); ctx.shadowBlur = 0;
          var tr = clamp01((lt - appear) / 0.75);
          if (tr > 0 && tr < 1) {
            var ex = lerp(cpx, cardX - 8, E.inOut(tr)), ey = lerp(cpy, cCy(k), E.inOut(tr));
            ctx.fillStyle = h.rgba(cards[k].c, 0.95); ctx.shadowBlur = 8; ctx.shadowColor = cards[k].c;
            ctx.fillRect(ex - 4, ey - 4, 8, 8); ctx.shadowBlur = 0;
          }
        }
        if (lt > 15.5) {
          var sa = clamp01((lt - 15.5) / 0.6); ctx.globalAlpha = sa;
          ctx.strokeStyle = h.rgba(GOLD, 0.9); ctx.lineWidth = 2; rr(ctx, bx0, byBot - 46, 176, 30, 8); ctx.stroke();
          ctx.fillStyle = h.rgba(GOLD, 1); ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillText("✓ signed & sealed", bx0 + 12, byBot - 26);
          ctx.globalAlpha = 1;
        }
      });

      cards.forEach(function (cd, i) {
        var x = cardX, y = 150 + i * 70;
        var rect = s.rect({ x: x, y: y, w: cardW, h: 56, rx: 10, fill: window.LabAnim.rgba(cd.c, 0.10), stroke: cd.c, sw: 1.6 });
        s.fadeIn(rect, { at: 1.4 + i * 0.9, dur: 0.9 });
        var lab = s.tex2(cd.k, { px: x + 36, py: y + 28, size: "1.4rem", color: cd.c });
        s.fadeIn(lab, { at: 1.7 + i * 0.9, dur: 0.75 });
        var desc = s.caption(cd.t, { px: x + 80, py: y + 28, anchor: "left", size: "1.05rem", color: "#f1f5f9" });
        s.fadeIn(desc, { at: 1.85 + i * 0.9, dur: 0.75 });
      });

      lower(s, "The proof is just a diary of the whole run: every checkpoint, which data it saw, and the settings, all signed so nobody can edit it later.", 8.0, { maxWidth: "80%", px: 60 });
    }, { subtitle: "A proof binds weights to the data and hyperparameters that made them." });
  }

  /* ============== 4 — REPLAY (hero) ============== */
  function replay(film) {
    film.scene("Verify only the suspicious steps", 33, function (s) {
      // chain of checkpoints + per-step magnitude bars; sort; top-Q replay into δ-ball
      var mags = [], i; for (i = 0; i < 16; i++) mags.push(0.18 + 0.5 * (Math.sin(i * 2.7) * 0.5 + 0.5));
      mags[5] = 0.95; mags[11] = 0.88; // the suspicious (large) updates
      s.canvas(function (lt, ctx, h) {
        // checkpoint chain
        var x0 = 90, dx = 50, y = 150;
        for (i = 0; i < 16; i++) { ctx.fillStyle = h.rgba(AMB, 0.85); ctx.beginPath(); ctx.arc(x0 + i * dx, y, 5, 0, 7); ctx.fill(); if (i > 0) { ctx.strokeStyle = h.rgba(AMB, 0.4); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + (i - 1) * dx + 5, y); ctx.lineTo(x0 + i * dx - 5, y); ctx.stroke(); } }
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(AMB, 0.9); ctx.fillText("the checkpoints, start → end", x0, y - 18);
        // magnitude bars
        var by = 350, sortP = clamp01((lt - 4) / 1.5);
        var order = mags.map(function (m, k) { return k; });
        var sorted = order.slice().sort(function (a, b) { return mags[b] - mags[a]; });
        for (i = 0; i < 16; i++) {
          var fromX = x0 + i * dx, toX = x0 + sorted.indexOf(i) * dx, bx = lerp(fromX, toX, E.inOut(sortP));
          var m = mags[i], bh = m * 130, big = m > 0.8;
          ctx.fillStyle = h.rgba(big ? AMB : TEAL, big ? 0.85 : 0.6); ctx.fillRect(bx - 8, by - bh, 16, bh);
          if (big && sortP > 0.9) { 
            ctx.shadowBlur = 15; ctx.shadowColor = AMB;
            ctx.strokeStyle = h.rgba(AMB, 0.95); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(bx, by - bh - 12, 9, 0, 7); ctx.stroke(); 
            ctx.shadowBlur = 0;
          }
        }
        ctx.fillStyle = h.rgba("#dbeafe", 0.85); ctx.fillText("each step's size — sorted; recheck only the biggest", x0, by + 24);
        // replay into delta-ball (right)
        if (lt > 9) {
          var rp = clamp01((lt - 9) / 3), bx2 = 760, by2 = 200;
          // delta ball
          ctx.strokeStyle = h.rgba(AMB, 0.6); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(bx2, by2, 30, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(AMB, 0.12); ctx.beginPath(); ctx.arc(bx2, by2, 30, 0, 7); ctx.fill();
          ctx.fillStyle = h.rgba(AMB, 1); ctx.beginPath(); ctx.arc(bx2, by2, 5, 0, 7); ctx.fill();
          // recomputed dashed path landing inside (honest)
          ctx.strokeStyle = h.rgba("#ffffff", 0.9); ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(bx2 - 120, by2 + 60); ctx.lineTo(lerp(bx2 - 120, bx2 + 6, rp), lerp(by2 + 60, by2 + 6, rp)); ctx.stroke(); ctx.setLineDash([]);
          if (rp > 0.95) { ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillText("✓ lands close enough", bx2 + 40, by2); }
          ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#dbeafe", 0.9); ctx.fillText("re-run just a few steps", bx2 - 120, by2 + 80);
        }
        // budget counter
        ctx.font = "600 12px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(GRN, 0.95); ctx.fillText("cost: a few spot-checks, not a full re-run", 620, 120);
      });
      var e1 = s.tex2("\\text{A shortcut leaves an oversized jump}", { px: 300, py: 96, size: "1.3rem", color: AMB });
      s.write(e1, { at: 19.5, dur: 1.8 });
      lower(s, "A checker never re-runs the whole thing. It re-does only the biggest steps, which is exactly where a faker taking shortcuts would get caught.", 15.0, { maxWidth: "92%", px: 60, py: 535 });
    }, { subtitle: "Spot-check the largest updates: exactly where a forger must cheat." });
  }

  /* ============== 5 — ASYMMETRY ============== */
  function asymmetry(film) {
    film.scene("The asymmetry that makes it a proof", 27, function (s) {
      s.canvas(function (lt, ctx, h) {
        // ===== TOP: the honest way — one run, cheap =====
        ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(TEAL, 0.95);
        ctx.fillText("THE HONEST WAY", 90, 96);
        var ap = clamp01((lt - 0.6) / 1.8), ax0 = 92, ax1 = 420, ay = 122;
        var axe = lerp(ax0, ax1, E.out(ap));
        ctx.strokeStyle = h.rgba(TEAL, 0.9); ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = TEAL;
        ctx.beginPath(); ctx.moveTo(ax0, ay); ctx.lineTo(axe, ay); ctx.stroke(); ctx.shadowBlur = 0;
        if (ap > 0.97) { ctx.fillStyle = h.rgba(TEAL, 0.9); ctx.beginPath(); ctx.moveTo(ax1, ay); ctx.lineTo(ax1 - 12, ay - 7); ctx.lineTo(ax1 - 12, ay + 7); ctx.closePath(); ctx.fill(); }
        if (lt > 2.2) { ctx.fillStyle = h.rgba("#dbeafe", 0.9); ctx.font = "13px 'JetBrains Mono',monospace"; ctx.fillText("just run the training once", 92, ay + 26); }
        if (lt > 3.0) { ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 15px 'JetBrains Mono',monospace"; ctx.fillText("✓ cost: 1 run", 452, ay + 5); }

        // divider
        ctx.strokeStyle = h.rgba("#dbeafe", 0.1); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(70, 178); ctx.lineTo(890, 178); ctx.stroke();

        // ===== BOTTOM: the forger's way — an exploding tree of possibilities =====
        ctx.fillStyle = h.rgba(RED, 0.95); ctx.font = "600 13px 'JetBrains Mono',monospace";
        ctx.fillText("THE FORGER'S WAY  —  guess which path could have led to the stolen model", 90, 204);
        var rootX = 128, dx = 112, topY = 234, botY = 428, D = 6, t0 = 2.6, dStep = 1.15;
        function nX(d) { return rootX + d * dx; }
        function nY(d, k) { return topY + (k + 0.5) / Math.pow(2, d) * (botY - topY); }
        for (var d = 0; d < D; d++) {
          if (lt < t0 + d * dStep) break;
          var ea = clamp01((lt - (t0 + d * dStep)) / 0.6);
          ctx.strokeStyle = h.rgba(RED, 0.4 * ea); ctx.lineWidth = 1.3;
          for (var k = 0; k < Math.pow(2, d); k++) {
            var px = nX(d), py = nY(d, k);
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nX(d + 1), nY(d + 1, 2 * k)); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nX(d + 1), nY(d + 1, 2 * k + 1)); ctx.stroke();
          }
        }
        for (var d2 = 0; d2 <= D; d2++) {
          if (lt < t0 + d2 * dStep) break;
          var na = clamp01((lt - (t0 + d2 * dStep)) / 0.5);
          for (var k2 = 0; k2 < Math.pow(2, d2); k2++) {
            ctx.fillStyle = h.rgba(d2 === 0 ? "#e8eef9" : RED, (d2 === 0 ? 0.95 : 0.7) * na);
            ctx.beginPath(); ctx.arc(nX(d2), nY(d2, k2), d2 === 0 ? 5 : 2.3, 0, 7); ctx.fill();
          }
        }
        if (lt > t0 - 0.2) {
          ctx.fillStyle = h.rgba("#e8eef9", 0.85); ctx.font = "11px 'JetBrains Mono',monospace";
          ctx.fillText("stolen", rootX - 46, (topY + botY) / 2 - 4);
          ctx.fillText("model", rootX - 44, (topY + botY) / 2 + 10);
        }
        // live counter, top-right, clear of the tree
        if (lt >= t0) {
          var shown = Math.max(0, Math.min(D, Math.floor((lt - t0) / dStep)));
          ctx.font = "600 14px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(AMB, 0.95);
          ctx.fillText("paths that could fit:", 632, 100);
          ctx.font = "700 26px 'JetBrains Mono',monospace";
          ctx.fillText(Math.pow(2, shown).toLocaleString() + (shown >= D ? " …" : ""), 632, 134);
          if (shown >= D) {
            var beat = 0.7 + 0.3 * Math.abs(Math.sin(lt * 2));
            ctx.font = "12px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(AMB, 0.85 * beat);
            ctx.fillText("doubling every step —", 632, 158);
            ctx.fillText("no shortcut, no way to guess", 632, 174);
          }
        }
      });
      lower(s, "Proving costs one honest run. Faking means running the whole training backwards, and the number of paths that could fit explodes, so it's astronomically harder.", 11.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "One run to prove it. An exploding number of guesses to fake it." });
  }

  /* ============== 6 — SecurePoL : trajectory ∧ watermark ============== */
  function securepol(film) {
    film.scene("Closing the gap: SecurePoL", 27, function (s) {
      s.canvas(function (lt, ctx, h) {
        // watermarked checkpoint grid (gold sub-lattice)
        grid(ctx, h, 90, 190, 13, TEAL, 1, true);
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(GOLD, 0.95); ctx.fillText("a secret mark, woven into the model", 90, 320);
        // two rails into an AND-gate
        var gx = 640, gy = 270, trajGreen = true; // trajectory rail
        var wmGreen = lt < 4 ? null : false;       // fake transcript fails watermark
        // top rail (trajectory)
        ctx.lineWidth = 4; ctx.strokeStyle = h.rgba(GRN, 0.9);
        ctx.setLineDash([15, 10]); ctx.lineDashOffset = -lt * 40; ctx.shadowBlur = 10; ctx.shadowColor = GRN;
        ctx.beginPath(); ctx.moveTo(420, gy - 40); ctx.lineTo(gx - 40, gy - 40); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#f1f5f9", 0.9); ctx.fillText("training path checks out  ✓", 420, gy - 50);
        // bottom rail (watermark)
        var wmCol = (lt > 4) ? RED : "#9aa7be";
        ctx.strokeStyle = h.rgba(wmCol, 0.9);
        if (lt < 4) { ctx.setLineDash([15, 10]); ctx.lineDashOffset = -lt * 40; ctx.shadowBlur = 10; ctx.shadowColor = wmCol; }
        ctx.beginPath(); ctx.moveTo(420, gy + 40); ctx.lineTo(gx - 40, gy + 40); ctx.stroke();
        ctx.setLineDash([]); ctx.shadowBlur = 0;
        ctx.fillStyle = h.rgba(wmCol, 0.95); ctx.fillText("secret mark  " + (lt > 4 ? "✗ missing" : "?"), 420, gy + 60);
        // AND gate (D shape)
        ctx.beginPath(); ctx.moveTo(gx - 40, gy - 50); ctx.lineTo(gx, gy - 50); ctx.arc(gx, gy, 50, -Math.PI / 2, Math.PI / 2); ctx.lineTo(gx - 40, gy + 50); ctx.closePath();
        ctx.strokeStyle = h.rgba("#f1f5f9", 0.8); ctx.lineWidth = 2; ctx.stroke();
        ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#e8eef9", 0.9); ctx.fillText("AND", gx - 28, gy + 5);
        // output
        var out = (lt > 4) ? RED : GREY, outTxt = (lt > 4) ? "REJECT" : "…";
        ctx.strokeStyle = h.rgba(out, 0.9); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(gx + 50, gy); ctx.lineTo(gx + 120, gy); ctx.stroke();
        ctx.fillStyle = h.rgba(out, 1); ctx.font = "600 15px 'JetBrains Mono',monospace"; ctx.fillText(outTxt, gx + 130, gy + 5);
        // spoof note
        if (lt > 2 && lt < 6) { ctx.fillStyle = h.rgba(RED, clamp01((lt - 2) / 0.6) * (1 - clamp01((lt - 5) / 0.8))); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("fake transcript: mimics the loss curve, lacks the secret mark", 360, 150); }
      });
      var eq = s.tex2("\\text{Accept only if: right path } \\textbf{ AND } \\text{ secret mark}", { px: 480, py: 104, size: "1.3rem", color: AMB });
      s.write(eq, { at: 9.75, dur: 2.4 });
      var cite = s.caption("Ural &amp; Yoshigoe, <em>SecurePoL</em>, IEEE Access 2025", { px: 900, py: 60, anchor: "top-right", align: "right", size: "0.66rem", color: "#7f93b4" });
      s.fadeIn(cite, { at: 13.5, dur: 1.2 });
      lower(s, "My SecurePoL work adds a second lock: a hidden mark woven into the model. A faker can copy the shape of the curve, but not a mark they never trained in.", 9.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Two bypassable checks → one joint constraint a spoofer cannot meet." });
  }

  /* ============== 7 — SIGNATURE ============== */
  function signature(film) {
    film.scene("The fingerprint, and why it matters", 25, function (s) {
      var co = film.coords({ xRange: [0, 40], yRange: [0, 1], pad: { left: 80, right: 360, top: 140, bottom: 120 } });
      var ax = s.axes(co, { grid: false });
      s.draw(ax, { at: 0.6, dur: 1.05 });
      // genuine noisy descent
      var gpts = [], i; for (i = 0; i <= 40; i++) gpts.push([i, Math.exp(-i * 0.08) * (1 + 0.13 * Math.sin(i * 1.9)) * 0.9 + 0.02]);
      var gp = s.poly(gpts, { coords: co, color: TEAL, width: 2.6 });
      s.draw(gp, { at: 1.5, dur: 3.3 });
      // forged flat / too-clean
      var fpts = []; for (i = 0; i <= 40; i++) fpts.push([i, Math.exp(-i * 0.085) * 0.85 + 0.02]);
      var fp = s.poly(fpts, { coords: co, color: RED, width: 2.2, dashed: "5 5" });
      s.draw(fp, { at: 5.1, dur: 3 });
      
      s.canvas(function(lt, ctx, h) {
        if (lt > 1.0 && lt < 5.0) {
           var drawP = clamp01((lt - 1.0) / 2.2);
           var idx = Math.floor(drawP*40);
           if(idx >= gpts.length) idx = gpts.length - 1;
           var px = co.x(gpts[idx][0]);
           var py = co.y(gpts[idx][1]);
           ctx.shadowBlur = 10; ctx.shadowColor = TEAL;
           ctx.fillStyle = TEAL;
           ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill();
           ctx.shadowBlur = 0;
        }
        if (lt > 3.4 && lt < 6.4) {
           var fP = clamp01((lt - 3.4) / 2.0);
           var fidx = Math.floor(fP*40);
           if(fidx >= fpts.length) fidx = fpts.length - 1;
           var fx = co.x(fpts[fidx][0]);
           var fy = co.y(fpts[fidx][1]);
           if (Math.random() > 0.5) {
             ctx.fillStyle = h.rgba(RED, 0.7);
             ctx.fillRect(fx - 10, fy - 2 + (Math.random()-0.5)*10, 20 + Math.random()*20, 2);
           }
        }
      });
      
      var gl = s.caption("<span style='color:" + TEAL + "'>■</span> Genuine (Natural Noise)", { px: 650, py: 144, anchor: "left", size: "1.4rem", color: "#e2e8f0" });
      var fl = s.caption("<span style='color:" + RED + "'>■</span> Forged (Unnaturally Clean)", { px: 650, py: 202, anchor: "left", size: "1.4rem", color: "#e2e8f0" });
      s.fadeIn(gl, { at: 4.5, dur: 0.9 }); s.fadeIn(fl, { at: 8.1, dur: 0.9 });
      var xl = s.caption("step t →", { coords: co, x: 20, y: -0.1, anchor: "top", align: "center", size: "0.7rem", color: "#dbeafe" });
      s.fadeIn(xl, { at: 1.5, dur: 0.75 });
      s.fadeOut(xl, { at: 13.2, dur: 0.75 }); // clear the lower third for the narration
      // Clean legend on the right
      var hg = s.caption("The noise is the fingerprint.", { px: 650, py: 260, anchor: "left", size: "1.4rem", color: "#dbeafe" });
      s.fadeIn(hg, { at: 10.2, dur: 0.9 });
      var seal = s.caption("✦ Unforgeable Proof", { px: 650, py: 310, anchor: "left", size: "1.4rem", color: GOLD });
      s.fadeIn(seal, { at: 12.6, dur: 1.2 });
      lower(s, "A real training run is jittery in a way that's almost impossible to fake. That natural noise is the fingerprint: easy to make honestly, very hard to forge.", 12.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Provenance for the era of stolen and distilled models." });
  }

  /* ====================== appendix ====================== */
  function appendix() {
    var host = document.querySelector('[data-role="pol-appendix"]');
    if (!host || !window.katex) return;
    var blocks = [
      ["The proof", "\\mathcal{P}(f_{W_T}) = (\\mathbb{W},\\, \\mathbb{I},\\, \\mathbb{H},\\, \\mathbb{A})",
        "Checkpoints, batch indices, batch signatures, and auxiliary info (hyperparameters, optimizer, architecture). A PoL is the <em>transcript</em> of SGD, not its endpoint (Jia et al., S&amp;P 2021)."],
      ["Verification", "d_2(W'_{t+k},\\, W_{t+k}) \\le \\delta \\ \\wedge\\ Tr_{e,(q),k}",
        "Replay only the top-Q largest-magnitude updates per epoch: a reproduction-error check \\(d_2\\le\\delta\\) AND the reachability event \\(Tr\\) that the k forward steps actually land there. The slack \\(\\delta\\) absorbs hardware/software/optimizer nondeterminism."],
      ["Security", "\\mathbb{E}[C_{\\mathcal{A}}] \\ge \\mathbb{E}[C_{\\mathcal{T}}]\\ \\text{(design property)}",
        "Entropy of the process grows linearly in T, so \\(\\#\\text{paths}\\sim e^{\\Theta(T)}\\). This cost asymmetry is a <em>desideratum</em> (Jia 2021, Property 2), not a theorem — and was later shown bypassable (Zhang et al. 2022; Fang et al. 2023)."],
      ["SecurePoL", "\\text{Accept} \\iff (d_2\\le\\delta)\\ \\wedge\\ (\\mathcal{W}(f)=\\sigma)",
        "The author binds the trajectory check to a feature watermark, turning two individually-bypassable checks into one joint constraint a spoofer cannot meet without genuinely training (Ural &amp; Yoshigoe, IEEE Access 2025)."]
    ];
    var html = '<div class="lab-math__grid">';
    blocks.forEach(function (b) {
      html += '<div class="lab-math__item"><div class="lab-math__name">' + b[0] + '</div><div class="lab-math__eq">' +
        window.katex.renderToString(b[1], { throwOnError: false, displayMode: true }) + '</div><p class="lab-math__note">' + b[2] + '</p></div>';
    });
    html += '</div><p class="lab-math__refs">Jia, Yaghini, Choquette-Choo, Dullerud, Thudi, Chandrasekaran &amp; Papernot (S&amp;P 2021) · Zhang et al. (2022) · Ural &amp; Yoshigoe, <em>SecurePoL</em>, IEEE Access 2025.</p>';
    host.innerHTML = html;
    host.querySelectorAll(".lab-math__note").forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(/\\\((.+?)\\\)/g, function (_, t) { try { return window.katex.renderToString(t, { throwOnError: false }); } catch (e) { return t; } });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
