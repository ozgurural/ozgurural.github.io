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
  var TEAL = "#38bdf8", AMB = "#fbbf24", RED = "#fb7185", GRN = "#34d399", GREY = "#94a3b8", GOLD = "#d4af37", INDIGO = "#818cf8";

  function lower(s, html, at, o) {
    o = o || {};
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.write(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.5 });
    return c;
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function grid(ctx, h, x, y, cell, color, alpha, wm) {
    ctx.globalAlpha = alpha;
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) {
      var v = (Math.sin(i * 3.1 + j * 1.7) * 0.5 + 0.5);
      var isWm = wm && ((i + j) % 3 === 0 && i % 2 === 0);
      ctx.fillStyle = h.rgba(isWm ? GOLD : color, 0.25 + 0.6 * v);
      ctx.fillRect(x + i * cell, y + j * cell, cell - 2, cell - 2);
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
    film.scene("A stolen snapshot", 14, function (s) {
      s.canvas(function (lt, ctx, h) {
        grid(ctx, h, 250, 220, 14, TEAL, clamp01(lt / 1.2), false);
        ctx.font = "600 12px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(TEAL, 0.95); ctx.fillText("f_{W_T}  (your model)", 240, 350);
        if (lt > 2) {
          var sweep = clamp01((lt - 2) / 1.2), cx = lerp(250, 560, E.out(sweep));
          grid(ctx, h, cx, 220, 14, lt > 5 ? RED : "#e8eef9", clamp01((lt - 2) / 1.0), false);
          ctx.fillStyle = h.rgba(lt > 5 ? RED : "#cbd5e1", 0.9); ctx.fillText(lt > 5 ? "leaked copy θ̂" : "copy…", 560, 350);
        }
        if (lt > 6.5) {
          var st = clamp01((lt - 6.5) / 0.6);
          ctx.globalAlpha = st; ctx.strokeStyle = h.rgba(GRN, 0.9); ctx.lineWidth = 2; rr(ctx, 360, 250, 150, 40, 8); ctx.stroke();
          ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 16px 'JetBrains Mono',monospace"; ctx.fillText("IDENTICAL", 388, 276); ctx.globalAlpha = 1;
        }
      });
      var eq = s.tex2("\\mathcal{A}: W_T \\longrightarrow W_T \\quad (\\text{cost}\\approx 0)", { px: 480, py: 110, size: "1rem", color: "#9fb2d4" });
      s.fadeIn(eq, { at: 3.5, dur: 0.8 });
      lower(s, "A trained model's final weights are just a tensor of numbers, which are copyable perfectly at zero cost. So how could the true trainer ever prove they did the work, when the artifact is trivially clonable?", 4.5, { maxWidth: "66%", out: 13.2 });
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
        var i;
        for (i = 9; i >= 1; i--) { var tt = i / 9; var rx = Math.sqrt(tt * 6 / a), ry = Math.sqrt(tt * 6 / b); var cxp = co.x(0), cyp = co.y(0); ctx.beginPath(); ctx.ellipse(cxp, cyp, Math.abs(co.x(rx) - cxp), Math.abs(cyp - co.y(ry)), 0, 0, 7); ctx.strokeStyle = h.rgba(h.mix("#1e3a8a", "#3b82f6", tt), 0.4); ctx.lineWidth = 1; ctx.stroke(); }
        // inset loss curve (top-right)
        var px0 = 600, py0 = 250, pw = 300, ph = 120;
        ctx.strokeStyle = h.rgba("#9fb2d4", 0.4); ctx.lineWidth = 1; ctx.strokeRect(px0, py0 - ph, pw, ph);
        ctx.font = "10px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#9fb2d4", 0.8); ctx.fillText("loss L vs step t", px0, py0 - ph - 8);
        var nL = Math.floor(clamp01(lt / 9) * 40);
        ctx.strokeStyle = h.rgba(TEAL, 0.95); ctx.lineWidth = 2; 
        ctx.shadowBlur = 10; ctx.shadowColor = TEAL;
        ctx.beginPath();
        for (i = 0; i <= nL; i++) { var L = Math.exp(-i * 0.09) * (1 + 0.12 * Math.sin(i * 1.9)) ; var xx = px0 + pw * i / 40, yy = py0 - ph * (1 - L); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      // descent polyline (SVG) + checkpoints
      var pl = s.poly(path, { coords: co, color: TEAL, width: 2.4 });
      s.draw(pl, { at: 0.8, dur: 7.5 });
      var w0 = s.dot({ coords: co, x: path[0][0], y: path[0][1], r: 6, color: "#fff" });
      s.fadeIn(w0, { at: 0.6, dur: 0.4 });
      var w0l = s.caption("W₀", { coords: co, x: path[0][0] - 0.1, y: path[0][1] + 0.35, anchor: "right", size: "0.72rem", color: "#cbd5e1" });
      s.fadeIn(w0l, { at: 0.8, dur: 0.4 });
      [8, 16, 24, 32, 39].forEach(function (ci, q) {
        var d = s.dot({ coords: co, x: path[ci][0], y: path[ci][1], r: 5, color: AMB, glow: 5 });
        s.fadeIn(d, { at: 2.0 + q * 0.7, dur: 0.4 });
      });
      var wt = s.caption("W_T", { coords: co, x: path[39][0] + 0.1, y: path[39][1] + 0.4, anchor: "left", size: "0.72rem", color: AMB });
      s.fadeIn(wt, { at: 7.0, dur: 0.5 });
      var eq = s.tex2("W_{t+1} \\leftarrow \\mathrm{update}(W_t,\\ D[I_t],\\ M_t)", { px: 360, py: 92, size: "0.98rem", color: "#e8eef9" });
      s.write(eq, { at: 1.0, dur: 1.4 });
      lower(s, "The model was not born at the endpoint. It <em>descended</em> there, one stochastic step at a time. The path (checkpoints W₀…W_T with the exact batches and hyperparameters) took a full training run to make. The path is the asset; the point is its shadow.", 9.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "PoL records the optimization transcript, not the result." });
  }

  /* ============== 3 — THE PROOF OBJECT ============== */
  function proofObj(film) {
    film.scene("What a proof actually is", 16, function (s) {
      var cards = [
        { k: "\\mathbb{W}", t: "checkpoints", c: TEAL }, { k: "\\mathbb{I}", t: "batch indices", c: "#38bdf8" },
        { k: "\\mathbb{H}", t: "batch signatures", c: INDIGO }, { k: "\\mathbb{A}", t: "hyperparams, optimizer, arch", c: GREY }
      ];
      cards.forEach(function (cd, i) {
        var x = 470, y = 150 + i * 70;
        var rect = s.rect({ x: x, y: y, w: 360, h: 56, rx: 10, fill: window.LabAnim.rgba(cd.c, 0.10), stroke: cd.c, sw: 1.6 });
        s.fadeIn(rect, { at: 0.8 + i * 0.6, dur: 0.6 });
        var lab = s.tex2(cd.k, { px: x + 36, py: y + 28, size: "1.2rem", color: cd.c });
        s.fadeIn(lab, { at: 1.0 + i * 0.6, dur: 0.5 });
        var desc = s.caption(cd.t, { px: x + 80, py: y + 28, anchor: "left", size: "0.82rem", color: "#cbd5e1" });
        s.fadeIn(desc, { at: 1.1 + i * 0.6, dur: 0.5 });
      });
      var master = s.tex2("\\mathcal{P}(f_{W_T}) = (\\mathbb{W},\\, \\mathbb{I},\\, \\mathbb{H},\\, \\mathbb{A})", { px: 250, py: 250, size: "1.2rem", color: AMB });
      s.write(master, { at: 4.0, dur: 1.6 });
      var sig = s.caption("encrypted to the verifier · timestamped · signed", { px: 250, py: 320, anchor: "center", align: "center", size: "0.8rem", color: "#9fb2d4" });
      s.fadeIn(sig, { at: 6.0, dur: 0.8 });
      lower(s, "Formally, the proof is a four-part transcript: checkpoints <em>W</em>, the data-batch indices <em>I</em> that fed each step, cryptographic signatures <em>H</em> binding those batches, and auxiliary info <em>A</em> — hyperparameters, optimizer, architecture).", 8.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "A proof binds weights to the data and hyperparameters that made them." });
  }

  /* ============== 4 — REPLAY (hero) ============== */
  function replay(film) {
    film.scene("Verify only the suspicious steps", 22, function (s) {
      // chain of checkpoints + per-step magnitude bars; sort; top-Q replay into δ-ball
      var mags = [], i; for (i = 0; i < 16; i++) mags.push(0.18 + 0.5 * (Math.sin(i * 2.7) * 0.5 + 0.5));
      mags[5] = 0.95; mags[11] = 0.88; // the suspicious (large) updates
      s.canvas(function (lt, ctx, h) {
        // checkpoint chain
        var x0 = 90, dx = 50, y = 150;
        for (i = 0; i < 16; i++) { ctx.fillStyle = h.rgba(AMB, 0.85); ctx.beginPath(); ctx.arc(x0 + i * dx, y, 5, 0, 7); ctx.fill(); if (i > 0) { ctx.strokeStyle = h.rgba(AMB, 0.4); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x0 + (i - 1) * dx + 5, y); ctx.lineTo(x0 + i * dx - 5, y); ctx.stroke(); } }
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(AMB, 0.9); ctx.fillText("W₀ … W_T   (checkpoints)", x0, y - 18);
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
        ctx.fillStyle = h.rgba("#9fb2d4", 0.85); ctx.fillText("update magnitude  d₁(W_t, W_{t−k})  — sorted, top-Q circled", x0, by + 24);
        // replay into delta-ball (right)
        if (lt > 9) {
          var rp = clamp01((lt - 9) / 3), bx2 = 760, by2 = 200;
          // delta ball
          ctx.strokeStyle = h.rgba(AMB, 0.6); ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.arc(bx2, by2, 30, 0, 7); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(AMB, 0.12); ctx.beginPath(); ctx.arc(bx2, by2, 30, 0, 7); ctx.fill();
          ctx.fillStyle = h.rgba(AMB, 1); ctx.beginPath(); ctx.arc(bx2, by2, 5, 0, 7); ctx.fill();
          // recomputed dashed path landing inside (honest)
          ctx.strokeStyle = h.rgba("#fff", 0.9); ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath();
          ctx.moveTo(bx2 - 120, by2 + 60); ctx.lineTo(lerp(bx2 - 120, bx2 + 6, rp), lerp(by2 + 60, by2 + 6, rp)); ctx.stroke(); ctx.setLineDash([]);
          if (rp > 0.95) { ctx.fillStyle = h.rgba(GRN, 1); ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillText("✓ d₂ ≤ δ", bx2 + 40, by2); }
          ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#9fb2d4", 0.9); ctx.fillText("replay k steps → δ-ball", bx2 - 120, by2 + 80);
        }
        // budget counter
        ctx.font = "600 12px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(GRN, 0.95); ctx.fillText("cost: Q·E segments  ≪  full run", 640, 120);
      });
      var e1 = s.tex2("d_2(W'_{t+k},\\, W_{t+k}) \\le \\delta", { px: 300, py: 96, size: "1rem", color: AMB });
      s.write(e1, { at: 13.0, dur: 1.2 });
      lower(s, "The verifier never reruns the whole training. Honest gradient steps are small, so a forger taking shortcuts must hide a few <em>oversized</em> jumps. Sort updates by magnitude, replay only the top-Q per epoch, and check each lands within a slack ball δ that absorbs floating-point nondeterminism.", 15.0, { maxWidth: "92%", px: 60, py: 535 });
    }, { subtitle: "Spot-check the largest updates: exactly where a forger must cheat." });
  }

  /* ============== 5 — ASYMMETRY ============== */
  function asymmetry(film) {
    film.scene("The asymmetry that makes it a proof", 18, function (s) {
      s.canvas(function (lt, ctx, h) {
        var tip = clamp01((lt - 8) / 3) * 0.32; // beam tips toward adversary at the end
        var cx = 300, cy = 250, beam = 150;
        // pivot
        ctx.strokeStyle = h.rgba("#9fb2d4", 0.7); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy + 90); ctx.lineTo(cx, cy); ctx.stroke();
        // beam
        var lx = cx - beam * Math.cos(tip), ly = cy - beam * Math.sin(tip), rx = cx + beam * Math.cos(tip), ry = cy + beam * Math.sin(tip);
        ctx.lineWidth = 4; ctx.strokeStyle = h.rgba("#cbd5e1", 0.85); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
        // prover pan (left, low cost, light)
        ctx.fillStyle = h.rgba(TEAL, 0.85); ctx.beginPath(); ctx.arc(lx, ly + 36, 22, 0, Math.PI); ctx.stroke(); ctx.fillStyle = h.rgba(TEAL, 1); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("prover", lx - 18, ly + 80); ctx.fillText("C_T: 1 run", lx - 24, ly + 96);
        // adversary pan (right, growing weights)
        ctx.strokeStyle = h.rgba(RED, 0.85); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(rx, ry + 36, 22, 0, Math.PI); ctx.stroke();
        var nW = Math.floor(clamp01((lt - 1) / 6) * 6);
        for (var w = 0; w < nW; w++) { ctx.fillStyle = h.rgba(RED, 0.7); ctx.fillRect(rx - 18 + (w % 3) * 12, ry + 30 - Math.floor(w / 3) * 12, 10, 10); }
        ctx.fillStyle = h.rgba(RED, 1); ctx.fillText("adversary", rx - 26, ry + 90); ctx.fillText("invert SGD", rx - 28, ry + 106);
        // entropy / search-space meters (right)
        var bx = 640, by = 200;
        var ent = clamp01((lt - 2) / 6);
        ctx.fillStyle = h.rgba(AMB, 0.9); ctx.font = "11px 'JetBrains Mono',monospace";
        ctx.fillText("entropy H(process) ∝ T", bx, by);
        ctx.fillStyle = h.rgba(AMB, 0.25); ctx.fillRect(bx, by + 10, 220, 12); ctx.fillStyle = h.rgba(AMB, 0.8); ctx.fillRect(bx, by + 10, 220 * ent, 12);
        ctx.fillStyle = h.rgba(RED, 0.9); ctx.fillText("# consistent paths ~ exp(T)", bx, by + 56);
        ctx.strokeStyle = h.rgba(RED, 0.9); ctx.lineWidth = 2; ctx.beginPath();
        for (var i = 0; i <= 40 * ent; i++) { var xx = bx + 220 * i / 40, yy = by + 130 - Math.exp(i * 0.09) / Math.exp(40 * 0.09) * 60; if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
        ctx.stroke();
      });
      var e1 = s.tex2("H(\\text{process})\\propto T \\;\\Rightarrow\\; \\#\\text{paths}\\sim e^{\\,\\Theta(T)}", { px: 480, py: 96, size: "1rem", color: "#e8eef9" });
      s.write(e1, { at: 1.0, dur: 1.4 });
      var e2 = s.tex2("\\mathbb{E}[C_{\\mathcal{A}}] \\ge \\mathbb{E}[C_{\\mathcal{T}}]\\quad(\\text{design property})", { px: 480, py: 148, size: "0.92rem", color: AMB });
      s.fadeIn(e2, { at: 9.0, dur: 0.8 });
      lower(s, "Generating a valid proof costs one honest training run. Forging one means inverting SGD and threading every checkpoint the verifier might probe. As training entropy grows linearly in T, the space of consistent paths grows exponentially. <span style='color:#9fb2d4'>This is a design property (Jia 2021), later shown bypassable, which motivates SecurePoL.</span>", 11.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Proving is cheap; faking is meant to cost a full training run." });
  }

  /* ============== 6 — SecurePoL : trajectory ∧ watermark ============== */
  function securepol(film) {
    film.scene("Closing the gap: SecurePoL", 18, function (s) {
      s.canvas(function (lt, ctx, h) {
        // watermarked checkpoint grid (gold sub-lattice)
        grid(ctx, h, 90, 190, 13, TEAL, 1, true);
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba(GOLD, 0.95); ctx.fillText("watermark woven into features", 90, 320);
        // two rails into an AND-gate
        var gx = 640, gy = 270, trajGreen = true; // trajectory rail
        var wmGreen = lt < 4 ? null : false;       // fake transcript fails watermark
        // top rail (trajectory)
        ctx.lineWidth = 4; ctx.strokeStyle = h.rgba(GRN, 0.9); ctx.beginPath(); ctx.moveTo(420, gy - 40); ctx.lineTo(gx - 40, gy - 40); ctx.stroke();
        ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#cbd5e1", 0.9); ctx.fillText("trajectory  d₂ ≤ δ  ✓", 420, gy - 50);
        // bottom rail (watermark)
        var wmCol = (lt > 4) ? RED : "#9aa7be";
        ctx.strokeStyle = h.rgba(wmCol, 0.9); ctx.beginPath(); ctx.moveTo(420, gy + 40); ctx.lineTo(gx - 40, gy + 40); ctx.stroke();
        ctx.fillStyle = h.rgba(wmCol, 0.95); ctx.fillText("watermark  W(f)=σ  " + (lt > 4 ? "✗" : "?"), 420, gy + 60);
        // AND gate (D shape)
        ctx.beginPath(); ctx.moveTo(gx - 40, gy - 50); ctx.lineTo(gx, gy - 50); ctx.arc(gx, gy, 50, -Math.PI / 2, Math.PI / 2); ctx.lineTo(gx - 40, gy + 50); ctx.closePath();
        ctx.strokeStyle = h.rgba("#cbd5e1", 0.8); ctx.lineWidth = 2; ctx.stroke();
        ctx.font = "600 13px 'JetBrains Mono',monospace"; ctx.fillStyle = h.rgba("#e8eef9", 0.9); ctx.fillText("AND", gx - 28, gy + 5);
        // output
        var out = (lt > 4) ? RED : GREY, outTxt = (lt > 4) ? "REJECT" : "…";
        ctx.strokeStyle = h.rgba(out, 0.9); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(gx + 50, gy); ctx.lineTo(gx + 120, gy); ctx.stroke();
        ctx.fillStyle = h.rgba(out, 1); ctx.font = "600 15px 'JetBrains Mono',monospace"; ctx.fillText(outTxt, gx + 130, gy + 5);
        // spoof note
        if (lt > 2 && lt < 6) { ctx.fillStyle = h.rgba(RED, clamp01((lt - 2) / 0.6) * (1 - clamp01((lt - 5) / 0.8))); ctx.font = "11px 'JetBrains Mono',monospace"; ctx.fillText("fake transcript: mimics the loss curve, lacks the secret mark", 360, 150); }
      });
      var eq = s.tex2("\\text{Accept} \\iff (d_2(W',W)\\le\\delta)\\ \\wedge\\ (\\mathcal{W}(f_{W_T})=\\sigma)", { px: 480, py: 104, size: "1rem", color: AMB });
      s.write(eq, { at: 6.5, dur: 1.6 });
      var cite = s.caption("Ural &amp; Yoshigoe, <em>SecurePoL</em>, IEEE Access 2025", { px: 900, py: 60, anchor: "top-right", align: "right", size: "0.66rem", color: "#7f93b4" });
      s.fadeIn(cite, { at: 9.0, dur: 0.8 });
      lower(s, "A clever adversary can hand-craft a transcript that passes the replay checks without training. SecurePoL binds the trajectory proof to a feature watermark: verification becomes a logical <em>AND</em>. A forged path can mimic the loss curve, but cannot carry a mark it never trained to embed.", 9.0, { maxWidth: "92%", px: 60 });
    }, { subtitle: "Two bypassable checks → one joint constraint a spoofer cannot meet." });
  }

  /* ============== 7 — SIGNATURE ============== */
  function signature(film) {
    film.scene("The fingerprint, and why it matters", 14, function (s) {
      var co = film.coords({ xRange: [0, 40], yRange: [0, 1], pad: { left: 80, right: 360, top: 140, bottom: 120 } });
      var ax = s.axes(co, { grid: false });
      s.draw(ax, { at: 0.4, dur: 0.7 });
      // genuine noisy descent
      var gpts = [], i; for (i = 0; i <= 40; i++) gpts.push([i, Math.exp(-i * 0.08) * (1 + 0.13 * Math.sin(i * 1.9)) * 0.9 + 0.02]);
      var gp = s.poly(gpts, { coords: co, color: TEAL, width: 2.6 });
      s.draw(gp, { at: 1.0, dur: 2.2 });
      // forged flat / too-clean
      var fpts = []; for (i = 0; i <= 40; i++) fpts.push([i, Math.exp(-i * 0.085) * 0.85 + 0.02]);
      var fp = s.poly(fpts, { coords: co, color: RED, width: 2.2, dashed: "5 5" });
      s.draw(fp, { at: 3.4, dur: 2.0 });
      var gl = s.caption("genuine — noise band, plateau, drop", { coords: co, x: 14, y: 0.62, anchor: "left", size: "0.74rem", color: TEAL });
      var fl = s.caption("forged — Var[‖ΔW‖] → 0  (too clean)", { coords: co, x: 14, y: 0.30, anchor: "left", size: "0.74rem", color: RED });
      s.fadeIn(gl, { at: 3.0, dur: 0.6 }); s.fadeIn(fl, { at: 5.4, dur: 0.6 });
      var xl = s.caption("step t →", { coords: co, x: 20, y: -0.1, anchor: "top", align: "center", size: "0.7rem", color: "#9fb2d4" });
      s.fadeIn(xl, { at: 1.0, dur: 0.5 });
      s.fadeOut(xl, { at: 8.8, dur: 0.5 }); // clear the lower third for the narration
      // step-magnitude histograms (right)
      var hg = s.caption("step magnitudes:  genuine <span style='color:#38bdf8'>heavy-tailed</span> · forged <span style='color:#fb7185'>spike</span>", { px: 690, py: 250, anchor: "left", size: "0.78rem", color: "#cbd5e1" });
      s.fadeIn(hg, { at: 7.0, dur: 0.7 });
      var seal = s.caption("✦ unforgeable training fingerprint", { px: 690, py: 320, anchor: "left", size: "0.92rem", color: GOLD });
      s.fadeIn(seal, { at: 8.4, dur: 0.8 });
      lower(s, "A real run leaves a statistical signature. It is a noisy, near-monotone descent <em>in expectation</em>, with plateaus and heavy-tailed step sizes, which a flat, fabricated curve cannot reproduce. Cheap to produce honestly, expensive to forge, verifiable by anyone.", 9.0, { maxWidth: "92%", px: 60 });
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
