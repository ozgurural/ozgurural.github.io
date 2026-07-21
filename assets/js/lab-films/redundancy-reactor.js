/* =============================================================================
   redundancy-reactor.js — cinematic explainer: TMR and correlated failure.

   Six scenes, math verified (binomial tail; Fleming β-factor; Ariane 5 report):
     1. hook            Two pilots, one verdict (majority vote; shared error wins)
     2. mechanism       The voter & binomial tail (fail iff > N/2 fail)
     3. superlinear     Superlinear safety       (P ~ Θ(q^{m+1}); log-log fan)
     4. correlation     Correlation installs a floor (ρq floor; the wow moment)
     5. ariane          Ariane 5, 4 June 1996    (ρ≈1 ⇒ P_sys ≈ q)
     6. diversity       The only real cure       (design diversity lowers ρ)

   Referee corrections applied:
     • The ρ-floor form (1−ρ)P_ind+ρq is labelled a FIRST-ORDER APPROXIMATION
       (the exact β-factor is ρq+(1−ρq)P_ind(N,(1−ρ)q)); both share the floor ρq.
     • N→∞ limit P_sys→ρq requires q<½ (stated). Gain = 1/(3q−2q²); 1/(3q) is the
       q→0 limit (labelled q→0, not N=3). "Unbounded gain" is independent-model-only.
     • Ariane: backup SRI 1 failed, then active SRI 2 ~72 ms later (72 ms apart,
       not "one cycle"); self-destruct ~39 s after H0 (=30 s after lift-off), ~4 km.
     • ρq is a mission probability; ρ=β∈[0,1] dimensionless.
   ============================================================================= */
(function () {
  "use strict";
  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("tmr-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build(); appendix();
  }
  var PAL = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = PAL.sky, AMB = PAL.amber, RED = PAL.rose, GRN = PAL.good, GREY = PAL.faint, MAG = PAL.violet;
  var LBL = "#dbeafe", TXT = "#e8eef9", WHT = "#f1f5f9", SUB = "#7f93b4", GRID = "#1e293b", BG_GRID = "#1f6f4f";

  function choose(n, k) { var c = 1; for (var i = 0; i < k; i++) c = c * (n - i) / (i + 1); return c; }
  function Pind(N, q) { var m = (N - 1) / 2, s = 0; for (var i = m + 1; i <= N; i++) s += choose(N, i) * Math.pow(q, i) * Math.pow(1 - q, N - i); return s; }

  var _lowerCount = 0;
  function lower(s, html, at, o) {
    var audioId = "redundancy-reactor_" + (_lowerCount++);
    s.audio(audioId, at);
    o = o || {};
    var c = s.caption(html, { px: o.px !== undefined ? o.px : 46, py: o.py !== undefined ? o.py : 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.75 });
    return c;
  }
  function hexPath(ctx, cx, cy, r) { ctx.beginPath(); for (var i = 0; i < 6; i++) { var a = Math.PI / 6 + i * Math.PI / 3; var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.closePath(); }
  function diamond(ctx, cx, cy, r) { ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); }

  function build() {
    var film = window.LabAnim.create("#tmr-film", { width: 960, height: 540 });
    hook(film); mechanism(film); superlinear(film); correlation(film); ariane(film); diversity(film);
    film.build();
    if (window.__LABDEBUG) window.__tmrFilm = film;
  }

  function drawTMR(ctx, h, cx, cy, states, voter, distinct, lt) {
    var pos = [[cx - 100, cy - 50], [cx, cy - 90], [cx + 100, cy - 50]];
    var vy = cy + 80;
    var rt = lt;
    for (var i = 0; i < 3; i++) {
      var badP = typeof states[i] === "number" ? states[i] : (states[i] === "bad" ? 1 : 0);
      var cR = lerp(88, 252, badP); // CY 58C4DD to RED FC6255
      var cG = lerp(196, 98, badP);
      var cB = lerp(221, 85, badP);
      var col = "rgba(" + Math.round(cR) + "," + Math.round(cG) + "," + Math.round(cB) + ",1)";
      
      // Explosion/glitch if bad
      if (badP > 0) {
         var r1 = Math.sin(lt * 31 + i) * 0.5 + 0.5;
         var r2 = Math.sin(lt * 47 + i) * 0.5 + 0.5;
         var r3 = Math.sin(lt * 59 + i) * 0.5 + 0.5;
         var r4 = Math.sin(lt * 71 + i) * 0.5 + 0.5;
         ctx.fillStyle = h.rgba(RED, (0.4 + 0.5 * r1) * badP);
         var gx = pos[i][0] + (r2 - 0.5) * 40;
         var gy = pos[i][1] + (r3 - 0.5) * 40;
         ctx.beginPath(); ctx.arc(gx, gy, 1 + r4 * 3, 0, 7); ctx.fill();
         ctx.fillRect(pos[i][0] - 20 + r1 * 40, pos[i][1] - 5 + r2 * 10, 5 + r3 * 20, 1 + r4 * 2);
      }
      
      hexPath(ctx, pos[i][0], pos[i][1], 30);
      ctx.fillStyle = "rgba(" + Math.round(cR) + "," + Math.round(cG) + "," + Math.round(cB) + ",0.14)"; ctx.fill();
      ctx.strokeStyle = "rgba(" + Math.round(cR) + "," + Math.round(cG) + "," + Math.round(cB) + ",0.95)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "rgba(" + Math.round(cR) + "," + Math.round(cG) + "," + Math.round(cB) + ",0.95)"; ctx.font = "11px 'JetBrains Mono',monospace";
      var lbl = distinct ? ["A·Ada", "B·C", "C·Rust"][i] : "CH" + (i + 1);
      ctx.fillText(lbl, pos[i][0] - 16, pos[i][1] + 4);
      
      // arrow to voter
      ctx.strokeStyle = "rgba(" + Math.round(cR) + "," + Math.round(cG) + "," + Math.round(cB) + ",0.5)"; ctx.lineWidth = lerp(2.4, 1.4, badP);
      ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1] + 30); ctx.lineTo(cx, vy - 26); ctx.stroke();
      
      // Network ping ripples
      if (badP < 1) {
         var pp = (rt * 1.5 + i * 0.3) % 1;
         var px = lerp(pos[i][0], cx, pp);
         var ppy = lerp(pos[i][1] + 30, vy - 26, pp);
         ctx.fillStyle = h.rgba(CY, 0.8 * (1-pp) * (1-badP));
         ctx.shadowBlur = 8; ctx.shadowColor = CY;
         ctx.beginPath(); ctx.arc(px, ppy, 3, 0, 7); ctx.fill();
         ctx.shadowBlur = 0;
      }
    }
    
    var voterBadP = typeof voter === "number" ? voter : (voter === "bad" ? 1 : 0);
    var vR = lerp(131, 252, voterBadP); // GRN to RED
    var vG = lerp(193, 98, voterBadP);
    var vB = lerp(103, 85, voterBadP);
    var vcol = voter === "idle" ? AMB : "rgba(" + Math.round(vR) + "," + Math.round(vG) + "," + Math.round(vB) + ",";
    
    diamond(ctx, cx, vy, 28); 
    ctx.fillStyle = voter === "idle" ? h.rgba(AMB, 0.16) : vcol + "0.16)"; ctx.fill();
    ctx.strokeStyle = voter === "idle" ? h.rgba(AMB, 0.95) : vcol + "0.95)"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = voter === "idle" ? h.rgba(AMB, 1) : vcol + "1)"; ctx.font = "600 10px 'JetBrains Mono',monospace"; ctx.fillText("VOTE", cx - 14, vy + 3);
    // output
    ctx.strokeStyle = voter === "idle" ? h.rgba(AMB, 0.9) : vcol + "0.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, vy + 28); ctx.lineTo(cx, vy + 56); ctx.stroke();
    ctx.fillStyle = voter === "idle" ? h.rgba(AMB, 1) : vcol + "1)"; ctx.font = "600 18px 'JetBrains Mono',monospace"; 
    
    ctx.save(); ctx.globalAlpha = 1 - voterBadP; ctx.fillText(voter === "idle" ? "…" : "✓", cx - 6, vy + 76); ctx.restore();
    if (voter !== "idle") { ctx.save(); ctx.globalAlpha = voterBadP; ctx.fillText("✗", cx - 6, vy + 76); ctx.restore(); }
  }

  /* ============== 1 — HOOK ============== */
  function hook(film) {
    film.scene("Two pilots, one verdict", 14, function (s) {
      s.canvas(function (lt, ctx, h) {
        var states, voter;
        if (lt < 6) { 
           var bad3 = clamp01((lt - 2) / 0.5);
           states = [0, 0, bad3]; 
           voter = lt > 2.5 ? 0 : "idle"; 
        }
        else { 
           var flash = (Math.floor(lt * 6) % 2) === 0 ? 1 : 0; 
           states = [flash, flash, flash]; 
           voter = flash; 
        }
        drawTMR(ctx, h, 480, 230, states, voter, false, lt);
        if (lt < 6 && lt > 3) {
          var fade1 = clamp01((lt - 3) / 0.5) * (lt > 5.5 ? clamp01((6 - lt) / 0.5) : 1);
          ctx.save(); ctx.globalAlpha *= fade1;
          ctx.fillStyle = h.rgba(GRN, 0.9); ctx.font = "12px 'JetBrains Mono',monospace"; ctx.fillText("one liar, two truth-tellers → truth wins", 360, 85);
          ctx.restore();
        }
        if (lt >= 6) {
          var fade2 = clamp01((lt - 6) / 0.5);
          ctx.save(); ctx.globalAlpha *= fade2;
          ctx.fillStyle = h.rgba(RED, 0.95); ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillText("all three fail the SAME way, the SAME instant", 330, 80);
          ctx.restore();
        }
      });
      var eq = s.tex2("\\text{Final Vote} = \\text{Majority}(c_1,\\dots,c_N)", { px: 480, py: 46, size: "1.4rem", color: LBL });
      s.fadeIn(eq, { at: 1.2, dur: 1.2 });
      lower(s, "A single unit might fail. Redundancy places identical clones alongside it, trusting they won't all fail at once.", 6.5, { maxWidth: "80%", py: 520 });
    }, { subtitle: "Redundancy protects against disagreement, not shared error." });
  }

  /* ============== 2 — MECHANISM ============== */
  function mechanism(film) {
    film.scene("The voter and the binomial tail", 27, function (s) {
      s.canvas(function (lt, ctx, h) {
        drawTMR(ctx, h, 230, 220, ["ok", "ok", "ok"], "ok", false, lt);
        ctx.fillStyle = h.rgba(AMB, 0.9); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("N = 2m+1,  m = 1", 150, 390);
        var redP = clamp01((lt - 1) / 4);
        var redLevels = [
           clamp01((lt - 1.0) / 0.5),
           clamp01((lt - 2.33) / 0.5),
           clamp01((lt - 3.66) / 0.5)
        ];
        var sysFail = redLevels[1]; // Fails when 2nd box goes red
        var bx = 470, by = 150, cellH = 46;
        for (var i = 0; i < 3; i++) {
          var isRed = redLevels[i];
          // If system fails, even healthy nodes get tinted red
          var failTint = Math.max(isRed, sysFail * 0.5); 
          var cR = lerp(131, 252, failTint); // GRN 83C167 to RED FC6255
          var cG = lerp(193, 98, failTint);
          var cB = lerp(103, 85, failTint);
          var cA = lerp(0.35, 0.7, isRed);
          ctx.fillStyle = "rgba(" + Math.round(cR) + "," + Math.round(cG) + "," + Math.round(cB) + "," + cA + ")";
          ctx.fillRect(bx, by + i * cellH, 80, cellH - 6);
          ctx.strokeStyle = h.rgba(LBL, 0.4); ctx.strokeRect(bx, by + i * cellH, 80, cellH - 6);
        }
        ctx.strokeStyle = h.rgba(AMB, 0.9); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(bx - 10, by + 2 * cellH); ctx.lineTo(bx + 90, by + 2 * cellH); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = h.rgba(AMB, 0.95); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("> N/2 fails", bx + 110, by + 2 * cellH + 4);
        
        ctx.fillStyle = "rgba(" + Math.round(lerp(131,252,sysFail)) + "," + Math.round(lerp(193,98,sysFail)) + "," + Math.round(lerp(103,85,sysFail)) + ",1)";
        ctx.font = "600 12px 'JetBrains Mono',monospace"; 
        
        // Use a crossfade for text to avoid binary swap
        ctx.save(); ctx.globalAlpha = 1 - sysFail; ctx.fillText("system OK", bx, by + 3 * cellH + 18); ctx.restore();
        ctx.save(); ctx.globalAlpha = sysFail; ctx.fillText("SYSTEM FAILS", bx, by + 3 * cellH + 18); ctx.restore();
        var px0 = 660, py0 = 330, bw = 44;
        for (i = 0; i <= 3; i++) {
          var c = choose(3, i), hgt = c * 30, tail = i >= 2;
          ctx.fillStyle = h.rgba(tail ? AMB : GREY, tail ? 0.8 : 0.35);
          ctx.fillRect(px0 + i * bw, py0 - hgt, bw - 8, hgt);
          ctx.fillStyle = h.rgba(LBL, 0.8); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("i=" + i, px0 + i * bw, py0 + 14);
        }
        ctx.fillStyle = h.rgba(AMB, 0.9); ctx.fillText("failing-majority tail (i ≥ 2)", px0 - 10, py0 - 130);
      });
      var e1 = s.tex2("\\text{Failure Probability (Independent)}", { px: 480, py: 66, size: "1.4rem", color: TXT });
      s.fadeIn(e1, { at: 10, dur: 1.0 });
      var e2 = s.tex2("\\text{For 3 voters: Fails if 2 or 3 fail}", { px: 480, py: 106, size: "1.3rem", color: AMB });
      s.fadeIn(e2, { at: 12, dur: 1.2 });
      lower(s, "Systems fail only when a majority of voters fail simultaneously. Independent voters make failure exponentially unlikely.", 10.5, { maxWidth: "80%", px: 60, py: 520 });
    }, { subtitle: "Voting converts ‘any failure’ into ‘a coordinated majority’." });
  }

  /* shared log-log plotter */
  function makePlot(film) {
    var box = { x0: 110, y0: 420, w: 460, h: 300 };
    function px(q) { return box.x0 + (Math.log10(q) - (-4)) / ((-1) - (-4)) * box.w; }
    function py(P) { return box.y0 - (Math.log10(Math.max(P, 1e-9)) - (-8)) / ((0) - (-8)) * box.h; }
    function drawGrid(ctx, h) {
      ctx.strokeStyle = h.rgba(LBL, 0.5); ctx.lineWidth = 1.4;
      ctx.strokeRect(box.x0, box.y0 - box.h, box.w, box.h);
      ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(SUB, 0.9);
      for (var e = -4; e <= -1; e++) { 
        var x = px(Math.pow(10, e)); ctx.fillText("10" + e, x - 8, box.y0 + 16); 
        ctx.strokeStyle = h.rgba(GRID, 0.8); ctx.beginPath(); ctx.moveTo(x, box.y0); ctx.lineTo(x, box.y0 - box.h); ctx.stroke(); 
        if (e < -1) {
          ctx.strokeStyle = h.rgba(GRID, 0.3); ctx.beginPath();
          for(var m=2; m<=9; m++) { var mx = px(m * Math.pow(10, e)); ctx.moveTo(mx, box.y0); ctx.lineTo(mx, box.y0 - box.h); }
          ctx.stroke();
        }
      }
      for (var ey = -8; ey <= 0; ey += 2) { 
        var y = py(Math.pow(10, ey)); ctx.fillStyle = h.rgba(SUB, 0.9); ctx.fillText("10" + ey, box.x0 - 30, y + 3); 
        ctx.strokeStyle = h.rgba(GRID, 0.8); ctx.beginPath(); ctx.moveTo(box.x0, y); ctx.lineTo(box.x0 + box.w, y); ctx.stroke();
      }
    }
    return { box: box, px: px, py: py, drawGrid: drawGrid };
  }

  /* ============== 3 — SUPERLINEAR ============== */
  function superlinear(film) {
    film.scene("Superlinear safety", 27, function (s) {
      var pl = makePlot(film), box = pl.box;
      s.canvas(function (lt, ctx, h) {
        pl.drawGrid(ctx, h);
        ctx.fillStyle = h.rgba(LBL, 0.9); ctx.fillText("per-channel rate q →", box.x0 + 150, box.y0 + 24);
        function curve(fn, color, width, at, dashed) {
          var prog = clamp01((lt - at) / 1.6); if (prog <= 0) return;
          ctx.strokeStyle = h.rgba(color, 0.95); ctx.lineWidth = width; if (dashed) ctx.setLineDash([5, 5]);
          ctx.beginPath(); var n = 80;
          for (var i = 0; i <= n * prog; i++) { var q = Math.pow(10, lerp(-4, -1, i / n)); var X = pl.px(q), Y = pl.py(fn(q)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
          ctx.stroke(); ctx.setLineDash([]);
        }
        curve(function (q) { return q; }, TXT, 1.6, 0.4, true);
        curve(function (q) { return Pind(3, q); }, CY, 3, 1.6);
        curve(function (q) { return Pind(5, q); }, MAG, 3, 3.4);
        curve(function (q) { return Pind(7, q); }, GRN, 3, 5.0);
        if (lt > 7) {
          var fade = clamp01((lt - 7) / 0.5);
          ctx.save(); ctx.globalAlpha *= fade;
          var xm = pl.px(0.01); ctx.strokeStyle = h.rgba(WHT, 0.7); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(xm, box.y0); ctx.lineTo(xm, box.y0 - box.h); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(TXT, 0.9); ctx.font = "10px 'JetBrains Mono',monospace";
          ctx.fillText("q=.01: single 1e-2", xm + 6, pl.py(0.01)); ctx.fillStyle = h.rgba(CY, 0.95); ctx.fillText("TMR 3e-4", xm - 80, pl.py(Pind(3, 0.01))); ctx.fillStyle = h.rgba(MAG, 0.95); ctx.fillText("N=5 1e-5", xm - 80, pl.py(Pind(5, 0.01)));
          ctx.restore();
        }
      });
      var e1 = s.tex2("\\text{Redundancy drastically suppresses independent errors}", { px: 480, py: 60, size: "1.3rem", color: TXT });
      s.fadeIn(e1, { at: 13.5, dur: 1.5 });
      lower(s, "For rare, independent faults, simply adding voters pushes the failure probability off a cliff.", 12.0, { maxWidth: "48%", px: 480, py: 520 });
    }, { subtitle: "Independent redundancy: q → O(q^{m+1}) superlinear safety." });
  }

  /* ============== 4 — CORRELATION FLOOR (wow) ============== */
  function correlation(film) {
    film.scene("Correlation installs a floor", 30, function (s) {
      var pl = makePlot(film), box = pl.box;
      function rhoAt(lt) { return clamp01((lt - 2) / 8) * 0.30; }
      s.canvas(function (lt, ctx, h) {
        var rho = rhoAt(lt);
        pl.drawGrid(ctx, h);
        function curve(N, color, width) {
          ctx.strokeStyle = h.rgba(color, 0.95); ctx.lineWidth = width; 
          ctx.beginPath();
          for (var i = 0; i <= 80; i++) { var q = Math.pow(10, lerp(-4, -1, i / 80)); var P = (1 - rho) * Pind(N, q) + rho * q; var X = pl.px(q), Y = pl.py(P); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
          ctx.stroke();
        }
        curve(3, CY, 3); curve(5, MAG, 3); curve(7, GRN, 3);
        if (lt > 2) {
          var fade = clamp01((lt - 2) / 0.5);
          ctx.save(); ctx.globalAlpha *= fade;
          ctx.strokeStyle = h.rgba(RED, 0.9); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath();
          for (i = 0; i <= 80; i++) { var q2 = Math.pow(10, lerp(-4, -1, i / 80)); var X2 = pl.px(q2), Y2 = pl.py(rho * q2); if (i === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2); }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(RED, 0.95); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("floor  y = ρq", pl.px(0.0003), pl.py(rho * 0.0003) - 6);
          ctx.restore();
        }
        ctx.fillStyle = h.rgba(AMB, 1); ctx.font = "600 14px 'JetBrains Mono',monospace"; ctx.fillText("ρ = " + (rho || 0).toFixed(2), 560, 120);
      });
      var eq = s.tex2("\\text{System Failure} \\approx \\text{Correlated Errors } (\\rho)", { px: 480, py: 92, size: "1.3rem", color: TXT });
      s.write(eq, { at: 16.5, dur: 2.4 });
      lower(s, "When faults correlate, the cliff vanishes. Redundancy no longer protects you; they all fail together.", 13.0, { maxWidth: "48%", px: 480, py: 520 });
    }, { subtitle: "Correlation caps reliability at 1/ρ no matter how many backups." });
  }

  /* ============== 5 — ARIANE 5 ============== */
  function ariane(film) {
    film.scene("Ariane 5, 4 June 1996", 18, function (s) {
      s.canvas(function (lt, ctx, h) {
        ctx.strokeStyle = h.rgba(BG_GRID, 0.3); ctx.lineWidth = 1;
        for (var gx = 60; gx < 920; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 90); ctx.lineTo(gx, 430); ctx.stroke(); }
        for (var gy = 90; gy < 430; gy += 40) { ctx.beginPath(); ctx.moveTo(60, gy); ctx.lineTo(900, gy); ctx.stroke(); }
        var prog = clamp01(lt / 9);
        var failLevel = clamp01((lt - 7) / 0.5);
        ctx.strokeStyle = h.rgba(GRN, 0.9); ctx.lineWidth = 2.4; ctx.beginPath();
        for (var i = 0; i <= 60 * prog; i++) { 
          var x = 80 + i * 4.5; 
          var y = 410 - i * 4.0; 
          if (i > 42) { 
            var failY = 410 - 42 * 4.0 + Math.pow(i - 42, 2) * 0.8; 
            var failX = 80 + 42 * 4.5 + (i - 42) * 2; 
            x = lerp(x, failX, failLevel);
            y = lerp(y, failY, failLevel);
          } 
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); 
        }
        ctx.stroke();
        var bhY = 200; ctx.strokeStyle = h.rgba(RED, 0.8); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(360, bhY); ctx.lineTo(720, bhY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = h.rgba(RED, 0.9); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("INT16 MAX", 600, bhY - 6);
        function panel(px, py, name, errAt) {
          var errFade = clamp01((lt - errAt) / 0.5);
          ctx.strokeStyle = h.rgba(LBL, 0.7 * (1 - errFade)); ctx.lineWidth = 1.4; ctx.strokeRect(px, py, 170, 56);
          if (errFade > 0) {
            ctx.strokeStyle = h.rgba(RED, 0.7 * errFade); ctx.lineWidth = 1.4; ctx.strokeRect(px, py, 170, 56);
          }
          ctx.fillStyle = h.rgba(WHT, 0.9); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText(name, px + 8, py + 16);
          if (errFade > 0) {
            ctx.save(); ctx.globalAlpha *= errFade;
            ctx.fillStyle = h.rgba(RED, 1); ctx.font = "600 11px 'JetBrains Mono',monospace"; ctx.fillText("⚠ Operand Error", px + 8, py + 50);
            ctx.restore();
          }
        }
        panel(120, 300, "SRI 1 (backup)", 6.6); panel(120, 366, "SRI 2 (active)", 6.75);
      });
      var eq = s.tex2("\\text{High Correlation} \\Rightarrow \\text{Redundancy is useless}", { px: 650, py: 80, size: "1.4rem", color: AMB });
      s.fadeIn(eq, { at: 13.2, dur: 1.2 });
      lower(s, "A rocket had identical units. A variable overflowed. Both units failed identically 72ms apart, voting unanimously to crash.", 9.3, { maxWidth: "80%", px: 60, py: 520 });
    }, { subtitle: "Identical software means ρ≈1. Two computers, one confident bug." });
  }

  /* ============== 6 — DIVERSITY ============== */
  function diversity(film) {
    film.scene("The only real cure: diversity", 21, function (s) {
      s.canvas(function (lt, ctx, h) {
        var hitLevel = clamp01((lt - 3) / 0.5) * clamp01((8 - lt) / 0.5);
        drawTMR(ctx, h, 320, 230, [0, hitLevel, 0], 0, true, lt);
        // cosmic ray bolt
        if (lt > 2.5 && lt < 5) {
          var rayFade = clamp01((lt - 2.5) / 0.5) * clamp01((5 - lt) / 0.5);
          ctx.save(); ctx.globalAlpha *= rayFade;
          ctx.strokeStyle = h.rgba(AMB, 1); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(420, 60); ctx.lineTo(400, 110); ctx.lineTo(420, 130); ctx.lineTo(405, 180); ctx.stroke();
          ctx.fillStyle = h.rgba(AMB, 0.9); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("shared environment", 430, 90);
          ctx.restore();
        }
        // rho slider dropping
        var rho = lerp(1.0, 0.02, clamp01((lt - 4) / 4));
        ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 14px 'JetBrains Mono',monospace"; ctx.fillText("ρ : " + rho.toFixed(2) + " ↓", 640, 180);
        // ghost log-log floor sinking
        var bx0 = 620, by0 = 360, bw = 240, bh = 130;
        ctx.strokeStyle = h.rgba(LBL, 0.4); ctx.strokeRect(bx0, by0 - bh, bw, bh);
        ctx.strokeStyle = h.rgba(CY, 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx0, by0 - bh + 10); ctx.lineTo(bx0 + bw, by0 - 10); ctx.stroke();
        var floorY = by0 - bh * clamp01(1 - Math.log10(1 / Math.max(rho, 0.02)) / 2);
        ctx.strokeStyle = h.rgba(RED, 0.85); ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(bx0, floorY); ctx.lineTo(bx0 + bw, floorY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = h.rgba(LBL, 0.8); ctx.font = "9px 'JetBrains Mono',monospace"; ctx.fillText("floor ρq sinks → steep gain returns", bx0, by0 + 14);
        if (lt > 1.2) {
          var dotFade = clamp01((lt - 1.2) / 0.5);
          ctx.save(); ctx.globalAlpha *= dotFade;
          var cx = bx0 + Math.pow(lt - 1.2, 0.4) * 80; ctx.fillStyle = h.rgba(LBL, 0.9); ctx.beginPath(); ctx.arc(cx, by0 - 8, 4, 0, 7); ctx.fill();
          ctx.restore();
        }
      });
      var eq = s.tex2("\\text{Diverse Designs} \\Rightarrow \\text{Lower Correlation}", { px: 480, py: 40, size: "1.4rem", color: GRN });
      s.fadeIn(eq, { at: 7.5, dur: 1.5 });
      lower(s, "You cannot vote out a shared mistake. Diverse designs drive correlation to zero, restoring safety gains.", 7.0, { maxWidth: "70%", py: 520 });
      var tag = s.caption("Independence is engineered, not assumed.", { px: 480, py: 80, anchor: "top", align: "center", size: "1.4rem", color: TXT });
      s.fadeIn(tag, { at: 15.75, dur: 1.5 });
    }, { subtitle: "The lever was never N. It was the independence ρ." });
  }

  /* ====================== appendix ====================== */
  function appendix() {
    var host = document.querySelector('[data-role="tmr-appendix"]');
    if (!host || !window.katex) return;
    var blocks = [
      ["Majority voting", "P_{\\text{ind}} = \\sum_{i=m+1}^{N}\\binom{N}{i}q^{i}(1-q)^{N-i}",
        "With N=2m+1 channels the system fails iff a strict majority fails. As \\(q\\to0\\), \\(P_{\\text{ind}}=\\binom{N}{m+1}q^{m+1}(1+O(q))=\\Theta(q^{m+1})\\); for TMR exactly \\(3q^2-2q^3\\)."],
      ["Superlinear gain", "\\text{gain}=\\frac{q}{P_{\\text{ind}}}=\\frac{1}{3q-2q^2}\\xrightarrow{q\\to0}\\frac{1}{3q}",
        "Each extra pair of channels raises the failure rate to a higher power of q — on a log-log plot, a steeper slope. The unbounded gain is an <em>independent-model</em> idealisation only."],
      ["Correlation floor", "P_{\\text{sys}} \\approx (1-\\rho)P_{\\text{ind}} + \\rho q \\;\\ge\\; \\rho q",
        "A first-order approximation (the exact Fleming β-factor is \\(\\rho q+(1-\\rho q)P_{\\text{ind}}(N,(1-\\rho)q)\\); both share the floor). The ρq term is independent of N, so for \\(q<\\tfrac12\\), \\(\\lim_{N\\to\\infty}P_{\\text{sys}}=\\rho q\\) and the safety multiplier saturates at \\(1/\\rho\\). Here \\(\\rho q\\) is a mission probability; \\(\\rho=\\beta\\in[0,1]\\)."],
      ["Ariane 5", "\\rho \\approx 1 \\;\\Rightarrow\\; P_{\\text{sys}} \\approx q",
        "Flight 501 (4 Jun 1996): two SRI units, identical software, hit the same int16 overflow of BH — backup SRI 1 first, active SRI 2 ~72 ms later. Self-destruct ~39 s after H0 (30 s after lift-off), ~4 km. Identical software means ρ≈1, so N was irrelevant."]
    ];
    var html = '<div class="lab-math__grid">';
    blocks.forEach(function (b) {
      html += '<div class="lab-math__item"><div class="lab-math__name">' + b[0] + '</div><div class="lab-math__eq">' +
        window.katex.renderToString(b[1], { throwOnError: false, displayMode: true }) + '</div><p class="lab-math__note">' + b[2] + '</p></div>';
    });
    html += '</div><p class="lab-math__refs">Fleming β-factor model (PRA) · ESA Ariane 5 Flight 501 Inquiry Board (1996) · TMR (von Neumann, 1956).</p>';
    host.innerHTML = html;
    host.querySelectorAll(".lab-math__note").forEach(function (el) {
      el.innerHTML = el.innerHTML.replace(/\\\((.+?)\\\)/g, function (_, t) { try { return window.katex.renderToString(t, { throwOnError: false }); } catch (e) { return t; } });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
