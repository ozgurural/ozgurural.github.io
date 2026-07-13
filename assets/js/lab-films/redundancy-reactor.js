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
  var E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = "#58C4DD", AMB = "#FFFF00", RED = "#FC6255", GRN = "#83C167", GREY = "#888888", MAG = "#9A72AC";

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

  /* TMR schematic: 3 channels -> voter. states = [ 'ok'|'bad' x3 ], voterState */
  function drawTMR(ctx, h, cx, cy, states, voter, distinct) {
    var pos = [[cx - 100, cy - 50], [cx, cy - 90], [cx + 100, cy - 50]];
    var vy = cy + 80;
    var rt = window.performance.now() / 1000;
    for (var i = 0; i < 3; i++) {
      var col = states[i] === "bad" ? RED : CY;
      
      // Explosion/glitch if bad
      if (states[i] === "bad") {
         ctx.fillStyle = h.rgba(RED, 0.4 + 0.5 * Math.random());
         var gx = pos[i][0] + (Math.random()-0.5)*40;
         var gy = pos[i][1] + (Math.random()-0.5)*40;
         ctx.beginPath(); ctx.arc(gx, gy, 1+Math.random()*3, 0, 7); ctx.fill();
         ctx.fillRect(pos[i][0] - 20 + Math.random()*40, pos[i][1] - 5 + Math.random()*10, 5+Math.random()*20, 1+Math.random()*2);
      }
      
      hexPath(ctx, pos[i][0], pos[i][1], 30);
      ctx.fillStyle = h.rgba(col, 0.14); ctx.fill();
      ctx.strokeStyle = h.rgba(col, 0.95); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = h.rgba(col, 0.95); ctx.font = "11px 'JetBrains Mono',monospace";
      var lbl = distinct ? ["A·Ada", "B·C", "C·Rust"][i] : "CH" + (i + 1);
      ctx.fillText(lbl, pos[i][0] - 16, pos[i][1] + 4);
      
      // arrow to voter
      ctx.strokeStyle = h.rgba(states[i] === "bad" ? RED : CY, 0.5); ctx.lineWidth = states[i] === "bad" ? 1.4 : 2.4;
      ctx.beginPath(); ctx.moveTo(pos[i][0], pos[i][1] + 30); ctx.lineTo(cx, vy - 26); ctx.stroke();
      
      // Network ping ripples
      if (states[i] === "ok") {
         var pp = (rt * 1.5 + i * 0.3) % 1;
         var px = lerp(pos[i][0], cx, pp);
         var ppy = lerp(pos[i][1] + 30, vy - 26, pp);
         ctx.fillStyle = h.rgba(CY, 0.8 * (1-pp));
         ctx.shadowBlur = 8; ctx.shadowColor = CY;
         ctx.beginPath(); ctx.arc(px, ppy, 3, 0, 7); ctx.fill();
         ctx.shadowBlur = 0;
      }
    }
    var vcol = voter === "ok" ? GRN : voter === "bad" ? RED : AMB;
    diamond(ctx, cx, vy, 28); ctx.fillStyle = h.rgba(vcol, 0.16); ctx.fill();
    ctx.strokeStyle = h.rgba(vcol, 0.95); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = h.rgba(vcol, 1); ctx.font = "600 10px 'JetBrains Mono',monospace"; ctx.fillText("VOTE", cx - 14, vy + 3);
    // output
    ctx.strokeStyle = h.rgba(vcol, 0.9); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, vy + 28); ctx.lineTo(cx, vy + 56); ctx.stroke();
    ctx.fillStyle = h.rgba(vcol, 1); ctx.font = "600 18px 'JetBrains Mono',monospace"; ctx.fillText(voter === "bad" ? "✗" : voter === "ok" ? "✓" : "…", cx - 6, vy + 76);
  }

  /* ============== 1 — HOOK ============== */
  function hook(film) {
    film.scene("Two pilots, one verdict", 14, function (s) {
      s.canvas(function (lt, ctx, h) {
        var states, voter;
        if (lt < 6) { states = ["ok", "ok", lt > 2 ? "bad" : "ok"]; voter = lt > 2.5 ? "ok" : "idle"; }
        else { var g = (Math.floor(lt * 6) % 2) === 0; states = g ? ["bad", "bad", "bad"] : ["ok", "ok", "ok"]; voter = g ? "bad" : "ok"; }
        drawTMR(ctx, h, 480, 230, states, voter, false);
        if (lt < 6 && lt > 3) { ctx.fillStyle = h.rgba(GRN, 0.9); ctx.font = "12px 'JetBrains Mono',monospace"; ctx.fillText("one liar, two truth-tellers → truth wins", 360, 130); }
        if (lt >= 6) { ctx.fillStyle = h.rgba(RED, 0.95); ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillText("all three fail the SAME way, the SAME instant", 330, 80); }
      });
      var eq = s.tex2("\\text{Final Vote} = \\text{Majority}(c_1,\\dots,c_N)", { px: 480, py: 46, size: "1.4rem", color: "#dbeafe" });
      s.fadeIn(eq, { at: 1.2, dur: 1.2 });
      lower(s, "A single unit might fail. Redundancy places identical clones alongside it, trusting they won't all fail at once.", 6.5, { maxWidth: "80%", py: 520 });
    }, { subtitle: "Redundancy protects against disagreement, not shared error." });
  }

  /* ============== 2 — MECHANISM ============== */
  function mechanism(film) {
    film.scene("The voter and the binomial tail", 27, function (s) {
      s.canvas(function (lt, ctx, h) {
        drawTMR(ctx, h, 230, 220, ["ok", "ok", "ok"], "ok", false);
        ctx.fillStyle = h.rgba(AMB, 0.9); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("N = 2m+1,  m = 1", 150, 390);
        var nRed = Math.min(3, Math.floor(clamp01((lt - 1) / 4) * 3));
        var bx = 470, by = 150, cellH = 46;
        for (var i = 0; i < 3; i++) {
          var isRed = i < nRed; var fails = nRed >= 2;
          ctx.fillStyle = h.rgba(fails ? RED : (isRed ? RED : GRN), isRed ? 0.7 : 0.35);
          ctx.fillRect(bx, by + i * cellH, 80, cellH - 6);
          ctx.strokeStyle = h.rgba("#dbeafe", 0.4); ctx.strokeRect(bx, by + i * cellH, 80, cellH - 6);
        }
        ctx.strokeStyle = h.rgba(AMB, 0.9); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(bx - 10, by + 2 * cellH); ctx.lineTo(bx + 90, by + 2 * cellH); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = h.rgba(AMB, 0.95); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("> N/2 fails", bx + 110, by + 2 * cellH + 4);
        ctx.fillStyle = h.rgba(nRed >= 2 ? RED : GRN, 1); ctx.font = "600 12px 'JetBrains Mono',monospace"; ctx.fillText(nRed >= 2 ? "SYSTEM FAILS" : "system OK", bx, by + 3 * cellH + 18);
        var px0 = 660, py0 = 330, bw = 44;
        for (i = 0; i <= 3; i++) {
          var c = choose(3, i), hgt = c * 30, tail = i >= 2;
          ctx.fillStyle = h.rgba(tail ? AMB : GREY, tail ? 0.8 : 0.35);
          ctx.fillRect(px0 + i * bw, py0 - hgt, bw - 8, hgt);
          ctx.fillStyle = h.rgba("#dbeafe", 0.8); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("i=" + i, px0 + i * bw, py0 + 14);
        }
        ctx.fillStyle = h.rgba(AMB, 0.9); ctx.fillText("failing-majority tail (i ≥ 2)", px0 - 10, py0 - 130);
      });
      var e1 = s.tex2("\\text{Failure Probability (Independent)}", { px: 480, py: 66, size: "1.4rem", color: "#e8eef9" });
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
      ctx.strokeStyle = h.rgba("#dbeafe", 0.5); ctx.lineWidth = 1.4;
      ctx.strokeRect(box.x0, box.y0 - box.h, box.w, box.h);
      ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#7f93b4", 0.9);
      for (var e = -4; e <= -1; e++) { 
        var x = px(Math.pow(10, e)); ctx.fillText("10" + e, x - 8, box.y0 + 16); 
        ctx.strokeStyle = h.rgba("#1e293b", 0.8); ctx.beginPath(); ctx.moveTo(x, box.y0); ctx.lineTo(x, box.y0 - box.h); ctx.stroke(); 
        if (e < -1) {
          ctx.strokeStyle = h.rgba("#1e293b", 0.3); ctx.beginPath();
          for(var m=2; m<=9; m++) { var mx = px(m * Math.pow(10, e)); ctx.moveTo(mx, box.y0); ctx.lineTo(mx, box.y0 - box.h); }
          ctx.stroke();
        }
      }
      for (var ey = -8; ey <= 0; ey += 2) { 
        var y = py(Math.pow(10, ey)); ctx.fillStyle = h.rgba("#7f93b4", 0.9); ctx.fillText("10" + ey, box.x0 - 30, y + 3); 
        ctx.strokeStyle = h.rgba("#1e293b", 0.8); ctx.beginPath(); ctx.moveTo(box.x0, y); ctx.lineTo(box.x0 + box.w, y); ctx.stroke();
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
        ctx.fillStyle = h.rgba("#dbeafe", 0.9); ctx.fillText("per-channel rate q →", box.x0 + 150, box.y0 + 34);
        function curve(fn, color, width, at, dashed) {
          var prog = clamp01((lt - at) / 1.6); if (prog <= 0) return;
          ctx.strokeStyle = h.rgba(color, 0.95); ctx.lineWidth = width; if (dashed) ctx.setLineDash([5, 5]);
          ctx.beginPath(); var n = 80;
          for (var i = 0; i <= n * prog; i++) { var q = Math.pow(10, lerp(-4, -1, i / n)); var X = pl.px(q), Y = pl.py(fn(q)); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
          ctx.stroke(); ctx.setLineDash([]);
        }
        curve(function (q) { return q; }, "#e8eef9", 1.6, 0.4, true);
        curve(function (q) { return Pind(3, q); }, CY, 3, 1.6);
        curve(function (q) { return Pind(5, q); }, MAG, 3, 3.4);
        curve(function (q) { return Pind(7, q); }, GRN, 3, 5.0);
        if (lt > 7) {
          var xm = pl.px(0.01); ctx.strokeStyle = h.rgba("#f1f5f9", 0.7); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(xm, box.y0); ctx.lineTo(xm, box.y0 - box.h); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = h.rgba("#e8eef9", 0.9); ctx.font = "10px 'JetBrains Mono',monospace";
          ctx.fillText("q=.01: single 1e-2", xm + 6, pl.py(0.01)); ctx.fillStyle = h.rgba(CY, 0.95); ctx.fillText("TMR 3e-4", xm - 80, pl.py(Pind(3, 0.01))); ctx.fillStyle = h.rgba(MAG, 0.95); ctx.fillText("N=5 1e-5", xm - 80, pl.py(Pind(5, 0.01)));
        }
      });
      var e1 = s.tex2("\\text{Redundancy drastically suppresses independent errors}", { px: 480, py: 60, size: "1.3rem", color: "#e8eef9" });
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
        if (rho > 0.001) {
          ctx.strokeStyle = h.rgba(RED, 0.9); ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.beginPath();
          for (i = 0; i <= 80; i++) { var q2 = Math.pow(10, lerp(-4, -1, i / 80)); var X2 = pl.px(q2), Y2 = pl.py(rho * q2); if (i === 0) ctx.moveTo(X2, Y2); else ctx.lineTo(X2, Y2); }
          ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(RED, 0.95); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("floor  y = ρq", pl.px(0.0003), pl.py(rho * 0.0003) - 6);
        }
        ctx.fillStyle = h.rgba(AMB, 1); ctx.font = "600 14px 'JetBrains Mono',monospace"; ctx.fillText("ρ = " + (rho || 0).toFixed(2), 640, 120);
      });
      var eq = s.tex2("\\text{System Failure} \\approx \\text{Correlated Errors } (\\rho)", { px: 480, py: 92, size: "1.3rem", color: "#e8eef9" });
      s.write(eq, { at: 16.5, dur: 2.4 });
      lower(s, "When faults correlate, the cliff vanishes. Redundancy no longer protects you; they all fail together.", 13.0, { maxWidth: "48%", px: 480, py: 520 });
    }, { subtitle: "Correlation caps reliability at 1/ρ no matter how many backups." });
  }

  /* ============== 5 — ARIANE 5 ============== */
  function ariane(film) {
    film.scene("Ariane 5, 4 June 1996", 18, function (s) {
      s.canvas(function (lt, ctx, h) {
        ctx.strokeStyle = h.rgba("#1f6f4f", 0.3); ctx.lineWidth = 1;
        for (var gx = 60; gx < 920; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 90); ctx.lineTo(gx, 430); ctx.stroke(); }
        for (var gy = 90; gy < 430; gy += 40) { ctx.beginPath(); ctx.moveTo(60, gy); ctx.lineTo(900, gy); ctx.stroke(); }
        var prog = clamp01(lt / 9), fail = lt > 7;
        ctx.strokeStyle = h.rgba(GRN, 0.9); ctx.lineWidth = 2.4; ctx.beginPath();
        for (var i = 0; i <= 60 * prog; i++) { 
          var x = 80 + i * 4.5; 
          var y = 410 - i * 4.0; 
          if (fail && i > 42) { y = 410 - 42 * 4.0 + Math.pow(i - 42, 2) * 0.8; x = 80 + 42 * 4.5 + (i - 42) * 2; } 
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); 
        }
        ctx.stroke();
        var bhY = 200; ctx.strokeStyle = h.rgba(RED, 0.8); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(360, bhY); ctx.lineTo(720, bhY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = h.rgba(RED, 0.9); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("INT16 MAX", 600, bhY - 6);
        function panel(px, py, name, errAt) {
          ctx.strokeStyle = h.rgba(lt > errAt ? RED : "#dbeafe", 0.7); ctx.lineWidth = 1.4; ctx.strokeRect(px, py, 170, 56);
          ctx.fillStyle = h.rgba("#f1f5f9", 0.9); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText(name, px + 8, py + 16);
          if (lt > errAt) { ctx.fillStyle = h.rgba(RED, 1); ctx.font = "600 11px 'JetBrains Mono',monospace"; ctx.fillText("⚠ Operand Error", px + 8, py + 50); }
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
        var hit = lt > 3 && lt < 8;
        drawTMR(ctx, h, 320, 230, ["ok", hit ? "bad" : "ok", "ok"], "ok", true);
        // cosmic ray bolt
        if (lt > 2.5 && lt < 5) { ctx.strokeStyle = h.rgba(AMB, clamp01((lt - 2.5) / 0.4) * (1 - clamp01((lt - 4.5) / 0.5))); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(420, 60); ctx.lineTo(400, 110); ctx.lineTo(420, 130); ctx.lineTo(405, 180); ctx.stroke(); ctx.fillStyle = h.rgba(AMB, 0.9); ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillText("shared environment", 430, 90); }
        // rho slider dropping
        var rho = lerp(1.0, 0.02, clamp01((lt - 4) / 4));
        ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 14px 'JetBrains Mono',monospace"; ctx.fillText("ρ : " + rho.toFixed(2) + " ↓", 640, 180);
        // ghost log-log floor sinking
        var bx0 = 620, by0 = 360, bw = 240, bh = 130;
        ctx.strokeStyle = h.rgba("#dbeafe", 0.4); ctx.strokeRect(bx0, by0 - bh, bw, bh);
        ctx.strokeStyle = h.rgba(CY, 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx0, by0 - bh + 10); ctx.lineTo(bx0 + bw, by0 - 10); ctx.stroke();
        var floorY = by0 - bh * clamp01(1 - Math.log10(1 / Math.max(rho, 0.02)) / 2);
        ctx.strokeStyle = h.rgba(RED, 0.85); ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(bx0, floorY); ctx.lineTo(bx0 + bw, floorY); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = h.rgba("#dbeafe", 0.8); ctx.font = "9px 'JetBrains Mono',monospace"; ctx.fillText("floor ρq sinks → steep gain returns", bx0, by0 + 14);
        if (lt > 1.2) { var cx = bx0 + Math.pow(lt - 1.2, 0.4) * 80; ctx.fillStyle = h.rgba("#dbeafe", 0.9); ctx.beginPath(); ctx.arc(cx, by0 - 8, 4, 0, 7); ctx.fill(); }
      });
      var eq = s.tex2("\\text{Diverse Designs} \\Rightarrow \\text{Lower Correlation}", { px: 480, py: 40, size: "1.4rem", color: GRN });
      s.fadeIn(eq, { at: 7.5, dur: 1.5 });
      lower(s, "You cannot vote out a shared mistake. Diverse designs drive correlation to zero, restoring safety gains.", 7.0, { maxWidth: "70%", py: 520 });
      var tag = s.caption("Independence is engineered, not assumed.", { px: 480, py: 150, anchor: "top", align: "center", size: "1.4rem", color: "#e8eef9" });
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
