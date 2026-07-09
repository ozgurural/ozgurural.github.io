/* =============================================================================
   gradient-pinball.js — cinematic explainer scene script.

   Six scenes, math verified by an adversarial referee pass:
     1. hook        The ball and the bowl       (-∇L is the learning signal)
     2. update      One step at a time          (θ ← θ − α∇L, ∇L ⟂ contour)
     3. stability   Too big a step              (α<2/λ converges, >2/λ diverges)
     4. momentum    Momentum in the ravine      (v ← βv + ∇L cancels zig-zag)
     5. sqrt-kappa  From κ to √κ                (optimal HB: rate → √κ)
     6. saddles     The real enemy: saddles     (Bray–Dean: index ↑ with loss)

   Referee corrections applied (these are the authority details):
     • optimal GD step is α* = 2/(L+μ) → rate (κ−1)/(κ+1); α=1/L → (κ−1)/κ.
     • v is an exponentially-weighted (unnormalised) SUM, not an average.
     • saddle-dominance & the shifted-Wigner spectrum are the Gaussian
       random-field (Bray–Dean) result — model-exact, only approximate for nets.
     • the √κ speedup is a strongly-convex (H≻0) result; the saddle regime has
       indefinite H — a different regime, stated explicitly.
     • curvature written λ (=λ_max(H)) to avoid colliding with the loss L.
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) { return setTimeout(boot, 60); }
    var mount = document.getElementById("gd-film");
    if (!mount) return;
    // KaTeX is nice-to-have; if it's slow, give it a beat, then build anyway.
    if (!window.katex && boot._tries === undefined) { boot._tries = 0; }
    if (!window.katex && boot._tries < 25) { boot._tries++; return setTimeout(boot, 80); }
    build(mount);
    renderAppendix();
  }

  /* ----------------------------- helpers ----------------------------- */
  var P = window.LabAnim.palette;

  // piecewise-linear path through world points -> fn(tau)->{x,y}
  function pathOf(points) {
    return function (tau) {
      tau = Math.max(0, Math.min(1, tau));
      var f = tau * (points.length - 1);
      var i = Math.floor(f), g = f - i;
      if (i >= points.length - 1) return { x: points[points.length - 1][0], y: points[points.length - 1][1] };
      return {
        x: points[i][0] + (points[i + 1][0] - points[i][0]) * g,
        y: points[i][1] + (points[i + 1][1] - points[i][1]) * g
      };
    };
  }

  // gradient descent on quadratic f = a(x-mx)^2 + b(y-my)^2
  function gdPath(a, b, mx, my, x0, y0, alpha, n) {
    var pts = [[x0, y0]], x = x0, y = y0, i;
    for (i = 0; i < n; i++) {
      var gx = 2 * a * (x - mx), gy = 2 * b * (y - my);
      x -= alpha * gx; y -= alpha * gy;
      pts.push([x, y]);
    }
    return pts;
  }
  // heavy-ball momentum on the same quadratic
  function hbPath(a, b, mx, my, x0, y0, alpha, beta, n) {
    var pts = [[x0, y0]], x = x0, y = y0, vx = 0, vy = 0, i;
    for (i = 0; i < n; i++) {
      var gx = 2 * a * (x - mx), gy = 2 * b * (y - my);
      vx = beta * vx + gx; vy = beta * vy + gy;
      x -= alpha * vx; y -= alpha * vy;
      pts.push([x, y]);
    }
    return pts;
  }

  // simple pseudo-3D projection of a surface point (domain x,y in world units)
  function projector(cx, cy, sx, sy, sz) {
    return function (x, y, z) {
      return [cx + (x - y) * sx, cy + (x + y) * sy - z * sz];
    };
  }

  /* =============================== BUILD ============================== */
  function build(mount) {
    var film = window.LabAnim.create(mount, { width: 960, height: 540 });

    sceneHook(film);
    sceneUpdate(film);
    sceneStability(film);
    sceneMomentum(film);
    sceneSqrtKappa(film);
    sceneSaddles(film);

    film.build();
    if (window.__LABDEBUG) window.__gdFilm = film;
  }

  /* small reusable lower-third caption */
  function lower(s, html, at, opts) {
    opts = opts || {};
    var c = s.caption(html, { px: opts.px !== undefined ? opts.px : 46, py: opts.py !== undefined ? opts.py : 520, anchor: "bottom-left", align: "left", maxWidth: opts.maxWidth || "60%", size: opts.size, panel: true });
    s.fadeIn(c, { at: at, dur: opts.dur || 0.9 });
    if (opts.out) s.fadeOut(c, { at: opts.out, dur: 0.75 });
    return c;
  }

  /* =========================== SCENE 1 — HOOK ======================== */
  function sceneHook(film) {
    film.scene("The ball & the bowl", 21, function (s) {
      var cx = 480, cy = 300, proj = projector(cx, cy, 150, 70, 150);
      var R = 1.0, kBowl = 1.0;

      // ball trajectory: a decaying swirl that settles at the basin floor
      function ballXY(tau) {
        var e = Math.exp(-1.9 * tau);
        return { x: 0.92 * e * Math.cos(7.0 * tau), y: 0.62 * e * Math.sin(3.4 * tau) };
      }

      s.canvas(function (lt, ctx, h) {
        // ---- radar sweep ----
        if (lt < 8) {
           var scanAngle = (lt * 2.5) % (Math.PI * 2);
           var cCenter = proj(0, 0, 0);
           ctx.beginPath();
           ctx.moveTo(cCenter[0], cCenter[1]);
           // Fake 3D arc sweep
           for(var a=0; a<=10; a++) {
              var th = scanAngle - 0.5 * (1 - a/10);
              var pr = proj(1.2 * Math.cos(th), 1.2 * Math.sin(th), 1.2*1.2);
              ctx.lineTo(pr[0], pr[1]);
           }
           ctx.closePath();
           var sgrad = ctx.createRadialGradient(cCenter[0], cCenter[1], 0, cCenter[0], cCenter[1], 150);
           sgrad.addColorStop(0, h.rgba("#5CD0B3", 0.15));
           sgrad.addColorStop(1, h.rgba("#58C4DD", 0.0));
           ctx.fillStyle = sgrad;
           ctx.fill();
        }

        // ---- wireframe paraboloid bowl ----
        var reveal = h.clamp01(lt / 2.2);
        var nu = 13, nv = 24, i, j;
        ctx.lineWidth = 1;
        // rings (constant radius)
        for (i = 1; i <= nu; i++) {
          var rr = R * i / nu;
          if (i / nu > reveal) break;
          ctx.beginPath();
          for (j = 0; j <= nv; j++) {
            var th = j / nv * Math.PI * 2;
            var x = rr * Math.cos(th), y = rr * Math.sin(th), z = kBowl * rr * rr;
            var p = proj(x, y, z);
            if (j === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
          }
          var shade = i / nu;
          ctx.strokeStyle = h.rgba(h.mix("#0e7490", "#5CD0B3", shade), 0.55);
          ctx.stroke();
        }
        // spokes (radial)
        for (j = 0; j < nv; j += 2) {
          var th2 = j / nv * Math.PI * 2;
          ctx.beginPath();
          for (i = 0; i <= nu; i++) {
            var rr2 = R * i / nu;
            if (i / nu > reveal + 0.02) break;
            var x2 = rr2 * Math.cos(th2), y2 = rr2 * Math.sin(th2), z2 = kBowl * rr2 * rr2;
            var p2 = proj(x2, y2, z2);
            if (i === 0) ctx.moveTo(p2[0], p2[1]); else ctx.lineTo(p2[0], p2[1]);
          }
          ctx.strokeStyle = h.rgba("#1f6f74", 0.32);
          ctx.stroke();
        }

        // ---- the rolling ball + trail ----
        var rollTau = h.clamp01(lt / 9);
        // trail
        var tb = 0.10, steps = 26;
        ctx.lineWidth = 2.4;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FFFF00";
        for (i = 0; i < steps; i++) {
          var ta = rollTau - tb * (i / steps), tc = rollTau - tb * ((i + 1) / steps);
          if (tc < 0) break;
          var A = ballXY(ta), B = ballXY(tc);
          var pa = proj(A.x, A.y, kBowl * (A.x * A.x + A.y * A.y) + 0.04);
          var pb = proj(B.x, B.y, kBowl * (B.x * B.x + B.y * B.y) + 0.04);
          ctx.strokeStyle = h.rgba("#FFFF00", 0.5 * (1 - i / steps));
          ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // ---- global minimum glowing dot ----
        if (lt > 1.5) {
          var pMin = proj(0, 0, 0);
          ctx.shadowBlur = 15;
          ctx.shadowColor = "#5CD0B3";
          ctx.fillStyle = h.rgba("#5CD0B3", 0.6);
          ctx.beginPath(); ctx.arc(pMin[0], pMin[1], 4, 0, 7); ctx.fill();
          ctx.shadowBlur = 0;
        }
        var b = ballXY(rollTau);
        var zb = kBowl * (b.x * b.x + b.y * b.y) + 0.04;
        var pb0 = proj(b.x, b.y, zb);
        // -grad L arrow (downhill) while the ball is high on the wall
        if (lt > 1.8 && lt < 6.2) {
          var aop = h.clamp01((lt - 1.8) / 0.6) * (1 - h.clamp01((lt - 5.4) / 0.8));
          var dir = Math.atan2(-b.y, -b.x); // toward basin center in domain
          var tip = proj(b.x + 0.34 * Math.cos(dir + Math.PI), b.y + 0.34 * Math.sin(dir + Math.PI), zb);
          // project a downhill step: move toward origin
          var nb = { x: b.x * 0.55, y: b.y * 0.55 };
          var ptip = proj(nb.x, nb.y, kBowl * (nb.x * nb.x + nb.y * nb.y) + 0.04);
          drawArrow(ctx, h, pb0[0], pb0[1], ptip[0], ptip[1], h.rgba("#e8eef9", aop), 2.6, 9);
          ctx.font = "italic 16px 'JetBrains Mono', monospace";
          ctx.fillStyle = h.rgba("#e8eef9", aop);
          ctx.fillText("−∇L", (pb0[0] + ptip[0]) / 2 + 8, (pb0[1] + ptip[1]) / 2 - 6);
        }
        // ball
        var grd = ctx.createRadialGradient(pb0[0] - 3, pb0[1] - 4, 1, pb0[0], pb0[1], 11);
        grd.addColorStop(0, "#fff7e0"); grd.addColorStop(0.4, "#FFFF00"); grd.addColorStop(1, "#b45309");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(pb0[0], pb0[1], 9, 0, 7); ctx.fill();
      });

      var title = s.title("GRADIENT&nbsp;PINBALL", { px: 480, py: 150, size: "2.8rem", color: "#ffffff" });
      s.write(title, { at: 0.6, dur: 2.4 });
      s.fadeOut(title, { at: 7.5, dur: 1.5 });

      lower(s, "Networks learn by rolling downhill. The steepest descent is exactly opposite the gradient.", 6.0, { out: 19.8, maxWidth: "64%" });
    }, { subtitle: "Learning is descent. And 'down' means the negative gradient." });
  }

  /* ========================= SCENE 2 — UPDATE ======================= */
  function sceneUpdate(film) {
    film.scene("One step at a time", 27, function (s) {
      var co = film.coords({ xRange: [-3.4, 3.4], yRange: [-2.1, 2.1], pad: { left: 70, right: 60, top: 70, bottom: 60 } });
      var a = 1.0, b = 0.32, mx = 0, my = 0;   // mildly elliptical bowl
      var path = gdPath(a, b, mx, my, -2.7, 1.55, 0.42, 9);

      // contour field (level sets of the quadratic), blue -> magenta inward
      s.canvas(function (lt, ctx, h) {
        var rev = h.clamp01(lt / 1.4);
        var levels = 11, i;
        for (i = levels; i >= 1; i--) {
          var t = i / levels;
          if ((1 - t) > rev + 0.0) { /* outer first */ }
          var c = t;                       // 1 outer -> small inner
          var rx = Math.sqrt((c * 6.5) / a), ry = Math.sqrt((c * 6.5) / b);
          var cxp = co.x(mx), cyp = co.y(my);
          var rxp = co.x(mx + rx) - cxp, ryp = cyp - co.y(my + ry);
          ctx.beginPath();
          ctx.ellipse(cxp, cyp, Math.abs(rxp), Math.abs(ryp), 0, 0, 7);
          ctx.strokeStyle = h.rgba(h.mix("#FC6255", "#58C4DD", t), 0.55);
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.fillStyle = h.rgba(h.mix("#FC6255", "#1e3a8a", t), 0.06);
          ctx.fill();
        }
      });

      // axes + minimum cross
      var cross1 = s.line({ coords: co, x1: -0.16, y1: 0, x2: 0.16, y2: 0, color: "#e8eef9", width: 2 });
      var cross2 = s.line({ coords: co, x1: 0, y1: -0.16, x2: 0, y2: 0.16, color: "#e8eef9", width: 2 });
      s.fadeIn(cross1, { at: 2.1, dur: 0.75 }); s.fadeIn(cross2, { at: 2.1, dur: 0.75 });

      // descent staircase, drawn progressively
      var poly = s.poly(path, { coords: co, color: "#FFFF00", width: 2.4, dashed: "2 6" });
      s.draw(poly, { at: 4.8, dur: 10.8 });

      // one teaching gradient at the first step: ∇L ⟂ contour
      var g0 = path[0];
      var gx = 2 * a * (g0[0] - mx), gy = 2 * b * (g0[1] - my);
      var gn = Math.hypot(gx, gy);
      var grad = s.vector({ coords: co, x: g0[0], y: g0[1], dx: -0.9 * gx / gn, dy: -0.9 * gy / gn, color: "#83C167", width: 2.6 });
      var gradLbl = s.tex2("\\text{-Gradient}", { coords: co, x: g0[0] - 1.0, y: g0[1] - 0.5, display: false, size: "1.4rem", color: "#83C167" });
      s.draw(grad, { at: 3, dur: 1.05 }); s.fadeIn(gradLbl, { at: 3.6, dur: 0.75 });
      s.fadeOut(grad, { at: 6, dur: 0.9 }); s.fadeOut(gradLbl, { at: 6, dur: 0.9 });

      // the ball walks the staircase
      var ball = s.dot({ coords: co, x: path[0][0], y: path[0][1], r: 8, color: "#FFFF00", glow: 10 });
      s.fadeIn(ball, { at: 2.85, dur: 0.6 });
      s.moveAlong(ball, pathOf(path), { coords: co, at: 4.8, dur: 10.8, ease: window.LabAnim.ease.linear });
      
      // Particle sparks matching the ball's movement
      s.canvas(function(lt, ctx, h) {
        if (lt > 3.2 && lt < 10.4) {
           var p = (lt - 3.2) / 7.2;
           var pos = pathOf(path)(p);
           var px = co.x(pos.x);
           var py = co.y(pos.y);
           
           ctx.shadowBlur = 4; ctx.shadowColor = "#FFFF00";
           for(var i=0; i<4; i++) {
              ctx.fillStyle = h.rgba("#FFFF00", 0.4 + 0.6 * Math.random());
              ctx.beginPath();
              ctx.arc(px - 10 + Math.random()*20, py - 10 + Math.random()*20, 0.5 + Math.random()*1.5, 0, 7);
              ctx.fill();
           }
           ctx.shadowBlur = 0;
        }
      });

      // the rule, typeset
      var eq = s.tex2("\\text{Next Step} = \\text{Current} - \\text{Step Size} \\times \\text{Slope}", { px: 480, py: 50, size: "1.4rem", color: "#FFFF00" });
      s.write(eq, { at: 0.9, dur: 2.1 });
      var perp = s.tex2("\\text{Gradient is perpendicular to contours}", { px: 480, py: 490, display: false, size: "1.3rem", color: "#dbeafe" });
      s.fadeIn(perp, { at: 3.9, dur: 1.2 });
      s.fadeOut(perp, { at: 10.2, dur: 0.75 });

      lower(s, "Measure slope, step against it, repeat. Each step is the locally steepest move.", 10.8, { maxWidth: "66%" });
    }, { subtitle: "θ ← θ − α∇L,  and  ∇L ⟂ level set." });
  }

  /* ======================= SCENE 3 — STABILITY ===================== */
  function sceneStability(film) {
    film.scene("Too big a step", 30, function (s) {
      // three panels share one 1-D parabola L(θ)=½λθ²; we vary α against curvature λ.
      var lam = 1.0;
      var panels = [
        { x0: 480, label: "\\alpha = 1/\\lambda", tag: "snaps home", col: "#83C167", alpha: 1.0 / lam },
        { x0: 480, label: "1/\\lambda < \\alpha < 2/\\lambda", tag: "converges, oscillating", col: "#FFFF00", alpha: 1.62 / lam },
        { x0: 480, label: "\\alpha > 2/\\lambda", tag: "DIVERGES", col: "#FC6255", alpha: 2.18 / lam }
      ];
      var pw = 300, gap = 12, total = pw * 3 + gap * 2, x0 = (960 - total) / 2;

      panels.forEach(function (pn, idx) {
        var left = x0 + idx * (pw + gap);
        var co = film.coords({ xRange: [-2.3, 2.3], yRange: [-0.2, 2.6], pad: { left: left + 18, right: 960 - (left + pw - 18), top: 118, bottom: 214 } });
        // parabola
        var par = s.plot(co, function (x) { return 0.5 * lam * x * x; }, { color: "#888888", width: 1.8, samples: 80 });
        s.draw(par, { at: 0.6 + idx * 0.25, dur: 1.5 });
        // panel frame label
        var lbl = s.tex2(pn.label, { px: left + pw / 2, py: 100, size: "1.4rem", color: pn.col });
        s.write(lbl, { at: 0.9 + idx * 0.25, dur: 0.9 });
        var tag = s.caption("<strong style='color:" + pn.col + "'>" + pn.tag + "</strong>", { px: left + pw / 2, py: 338, anchor: "top" , size: "1.1rem", align: "center" });
        s.fadeIn(tag, { at: 3.3, dur: 0.9 });

        // iterate x_{t+1} = (1-αλ) x_t  (clamped so divergence stays on-stage)
        var seq = [], x = -1.7, k, n = 9;
        for (k = 0; k <= n; k++) { seq.push([x, 0.5 * lam * x * x]); x = (1 - pn.alpha * lam) * x; }
        // draw the bouncing path
        var clampPts = seq.map(function (p) { return [Math.max(-2.25, Math.min(2.25, p[0])), Math.min(2.55, p[1])]; });
        var trace = s.poly(clampPts, { coords: co, color: pn.col, width: 2, dashed: "2 6" });
        s.draw(trace, { at: 3.9, dur: 8.4 });
        var ball = s.dot({ coords: co, x: clampPts[0][0], y: clampPts[0][1], r: 7, color: pn.col, glow: 8 });
        s.fadeIn(ball, { at: 3.75, dur: 0.45 });
        s.moveAlong(ball, pathOf(clampPts), { coords: co, at: 3.9, dur: 8.4, ease: window.LabAnim.ease.linear });
        if (idx === 2) { s.pulse(ball, { at: 11.1, dur: 1.2, amp: 0.9 }); }
      });

      // the contraction-factor law, then the stability window
      var eq = s.tex2("\\text{Stable only if Step Size is small enough}", { px: 480, py: 380, size: "1.02rem", color: "#FFFF00" });
      s.write(eq, { at: 12.6, dur: 2.4 });

      lower(s, "Step sizes dictate distance. If too large, the system overshoots and diverges.", 11.2, { maxWidth: "88%", px: 60, py: 520 });
    }, { subtitle: "Take too large a step and the optimization diverges." });
  }

  /* ======================== SCENE 4 — MOMENTUM ===================== */
  function sceneMomentum(film) {
    film.scene("Momentum in the ravine", 30, function (s) {
      var co = film.coords({ xRange: [-3.4, 3.4], yRange: [-2.3, 2.3], pad: { left: 70, right: 60, top: 84, bottom: 60 } });
      var a = 0.5, b = 4.0, mx = 0, my = 0;    // flat along x, steep across y → κ = b/a = 8
      // GD pinned near the y-axis stability edge → sharp zig-zag; underdamped heavy-ball glides the floor.
      var alphaGD = 0.245;                      // |1−0.245·8| ≈ 0.96 : oscillates many times, crawls in x
      var alphaHB = 0.18, betaHB = 0.62;        // complex-root regime → smooth swoosh with gentle overshoot
      var gd = gdPath(a, b, mx, my, -3.0, 1.5, alphaGD, 52);
      var hb = hbPath(a, b, mx, my, -3.0, 1.5, alphaHB, betaHB, 24);

      s.canvas(function (lt, ctx, h) {
        var i;
        for (i = 11; i >= 1; i--) {
          var t = i / 11;
          var rx = Math.sqrt((t * 6) / a), ry = Math.sqrt((t * 6) / b);
          var cxp = co.x(mx), cyp = co.y(my);
          var rxp = co.x(mx + rx) - cxp, ryp = cyp - co.y(my + ry);
          ctx.beginPath();
          ctx.ellipse(cxp, cyp, Math.abs(rxp), Math.abs(ryp), 0, 0, 7);
          ctx.strokeStyle = h.rgba(h.mix("#FC6255", "#58C4DD", t), 0.5);
          ctx.lineWidth = 1.2; ctx.stroke();
          ctx.fillStyle = h.rgba(h.mix("#FC6255", "#1e3a8a", t), 0.05); ctx.fill();
        }
      });

      var cross = s.dot({ coords: co, x: 0, y: 0, r: 3.5, color: "#e8eef9" });
      s.fadeIn(cross, { at: 0.9, dur: 0.6 });

      // GD trace (grey, many steps)
      var gp = s.poly(gd, { coords: co, color: "#9aa7be", width: 2, dashed: "2 5" });
      s.draw(gp, { at: 1.8, dur: 11.25 });
      var gball = s.dot({ coords: co, x: gd[0][0], y: gd[0][1], r: 6, color: "#9aa7be" });
      s.fadeIn(gball, { at: 1.65, dur: 0.45 });
      s.moveAlong(gball, pathOf(gd), { coords: co, at: 1.8, dur: 11.25, ease: window.LabAnim.ease.linear });
      var gdTag = s.caption("plain GD · ~κ steps", { coords: co, x: -1.2, y: 1.95, anchor: "left", size: "0.78rem", color: "#9aa7be" });
      s.fadeIn(gdTag, { at: 3, dur: 0.9 });

      // Heavy-ball trace (amber, few steps)
      var hp = s.poly(hb, { coords: co, color: "#FFFF00", width: 2.8 });
      s.draw(hp, { at: 13.8, dur: 6 });
      var hball = s.dot({ coords: co, x: hb[0][0], y: hb[0][1], r: 8, color: "#FFFF00", glow: 10 });
      s.fadeIn(hball, { at: 13.65, dur: 0.45 });
      s.moveAlong(hball, pathOf(hb), { coords: co, at: 13.8, dur: 6, ease: window.LabAnim.ease.smooth });
      var hbTag = s.caption("momentum · ~√κ steps", { coords: co, x: 0.4, y: -1.4, anchor: "left", size: "1.05rem", color: "#FFFF00" });
      s.fadeIn(hbTag, { at: 15.6, dur: 0.9 });

      var eq = s.tex2("\\text{Momentum: Remember past velocity}", { px: 480, py: 64, size: "1.05rem", color: "#e8eef9" });
      s.write(eq, { at: 13.5, dur: 2.1 });

      lower(s, "Momentum acts as a memory of past gradients. Side-to-side bounces cancel, downhill drift compounds.", 13.6, { maxWidth: "82%", px: 70 });
    }, { subtitle: "Momentum cancels out orthogonal oscillations and accelerates the downhill direction." });
  }

  /* ======================= SCENE 5 — √κ SPEEDUP ==================== */
  function sceneSqrtKappa(film) {
    film.scene("From κ to √κ", 24, function (s) {
      // left: the two convergence rates, typeset. right: iterations vs κ (log-x).
      var t1 = s.tex2("\\text{Standard GD: Slow in narrow valleys}", { px: 264, py: 190, size: "1.4rem", color: "#9aa7be" });
      s.write(t1, { at: 1.5, dur: 1.8 });
      var t2 = s.tex2("\\text{With Momentum: Dramatically faster}", { px: 264, py: 250, size: "1.4rem", color: "#FFFF00" });
      s.write(t2, { at: 3.75, dur: 1.8 });
      var t3 = s.tex2("\\text{Optimal parameters exist for perfect damping}", { px: 264, py: 320, size: "1.4rem", color: "#dbeafe" });
      s.fadeIn(t3, { at: 5.4, dur: 1.5 });

      // plot region (right half), x = log10(kappa) in [0,4]
      var co = film.coords({ xRange: [0, 4], yRange: [0, 105], pad: { left: 560, right: 56, top: 120, bottom: 110 } });
      var ax = s.axes(co, { grid: true, gridX: 4, gridY: 4 });
      s.draw(ax, { at: 0.6, dur: 1.2 });
      // iterations-to-converge (same constant): GD ∝ κ explodes off the top,
      // momentum ∝ √κ stays low — the gap IS the message.
      var gdCurve = s.plot(co, function (lx) { var k = Math.pow(10, lx); return Math.min(112, 0.7 * k); }, { color: "#9aa7be", width: 2.6, samples: 160 });
      var hbCurve = s.plot(co, function (lx) { var k = Math.pow(10, lx); return 0.7 * Math.sqrt(k); }, { color: "#FFFF00", width: 3, samples: 160 });
      s.draw(gdCurve, { at: 3.6, dur: 2.4 });
      s.draw(hbCurve, { at: 6, dur: 2.4 });
      var gl = s.caption("GD ∝ κ ↑", { coords: co, x: 1.42, y: 96, anchor: "left", size: "0.76rem", color: "#9aa7be" });
      var hl = s.caption("momentum ∝ √κ", { coords: co, x: 2.55, y: 26, anchor: "left", size: "0.9rem", color: "#FFFF00" });
      s.fadeIn(gl, { at: 6.3, dur: 0.75 }); s.fadeIn(hl, { at: 8.7, dur: 0.75 });
      var xlab = s.caption("condition number κ  (log scale, 1 → 10⁴)", { coords: co, x: 2, y: -7, anchor: "top", align: "center", size: "0.7rem", color: "#dbeafe" });
      s.fadeIn(xlab, { at: 1.8, dur: 0.9 });

      // punchline callout
      var call = s.caption("κ = 10⁴ &nbsp;⟶&nbsp; <strong style='color:#ffffff'>100× fewer steps</strong>", { px: 700, py: 220, size: "1.4rem", color: "#FFFF00" });
      s.fadeIn(call, { at: 9.6, dur: 1.2 }); s.pulse(call, { at: 10.8, dur: 1.2, amp: 0.12 });

      lower(s, "Momentum replaces the condition number with its square root. A 1000-step journey becomes just 30.", 9.0, { maxWidth: "84%", px: 70, out: 21.75 });

      // honesty caveat — the regime where this holds (referee note)
      var caveat = s.caption("<span style='color:#7f93b4'>strongly-convex, full-gradient regime (H ≻ 0)</span>", { px: 480, py: 60, anchor: "top", align: "center", size: "0.68rem" });
      s.fadeIn(caveat, { at: 17.25, dur: 1.2 });
    }, { subtitle: "Momentum fundamentally improves the convergence rate." });
  }

  /* ======================== SCENE 6 — SADDLES ====================== */
  function sceneSaddles(film) {
    film.scene("The real enemy: saddles", 27, function (s) {
      var cx = 280, cy = 286, proj = projector(cx, cy, 132, 60, 120);
      var kS = 1.0;
      function surf(x, y) { return kS * (x * x - y * y); } // saddle z = x² − y²

      // ball: trembles on the plateau, then escapes down the −y unstable axis
      function ballXY(lt) {
        if (lt < 8.5) { // jitter near the saddle
          var j = 0.05 * Math.sin(lt * 9) * Math.exp(-0.0 * lt);
          return { x: j * 0.5, y: 0.02 * Math.sin(lt * 6) };
        }
        var e = Math.min(1, (lt - 8.5) / 4.5);
        var ee = e * e * (3 - 2 * e);
        return { x: 0.04, y: -ee * 0.95 }; // roll out along the downhill (unstable) direction
      }

      s.canvas(function (lt, ctx, h) {
        var rev = h.clamp01(lt / 2.0);
        var N = 11, i, j, x, y, z, p;
        // saddle wireframe
        for (i = 0; i <= N; i++) {
          if (i / N > rev) break;
          ctx.beginPath();
          for (j = 0; j <= N; j++) {
            x = -1 + 2 * i / N; y = -1 + 2 * j / N; z = surf(x, y);
            p = proj(x, y, z);
            if (j === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
          }
          var gradLine = ctx.createLinearGradient(proj(x, -1, surf(x, -1))[0], proj(x, -1, surf(x, -1))[1], proj(x, 1, surf(x, 1))[0], proj(x, 1, surf(x, 1))[1]);
          gradLine.addColorStop(0, h.rgba("#5CD0B3", 0.05)); gradLine.addColorStop(1, h.rgba("#5CD0B3", 0.4));
          ctx.strokeStyle = gradLine; ctx.lineWidth = 1; ctx.stroke();
        }
        for (j = 0; j <= N; j++) {
          if (j / N > rev) break;
          ctx.beginPath();
          for (i = 0; i <= N; i++) {
            x = -1 + 2 * i / N; y = -1 + 2 * j / N; z = surf(x, y);
            p = proj(x, y, z);
            if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
          }
          ctx.strokeStyle = h.rgba("#1f6f74", 0.05 + 0.35 * (j / N)); ctx.lineWidth = 1; ctx.stroke();
        }
        // stable (green, up) and unstable (red, down) principal axes
        if (lt > 2.0) {
          var aop = h.clamp01((lt - 2.0) / 0.8);
          var gA = proj(-1, 0, surf(-1, 0)), gB = proj(1, 0, surf(1, 0));
          ctx.strokeStyle = h.rgba("#83C167", 0.6 * aop); ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(gA[0], gA[1]); ctx.lineTo(gB[0], gB[1]); ctx.stroke();
          var rA = proj(0, -1, surf(0, -1)), rB = proj(0, 1, surf(0, 1));
          ctx.strokeStyle = h.rgba("#FC6255", 0.7 * aop); ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.moveTo(rA[0], rA[1]); ctx.lineTo(rB[0], rB[1]); ctx.stroke();
        }
        // ball
        var b = ballXY(lt), pb = proj(b.x, b.y, surf(b.x, b.y) + 0.04);
        var stuck = lt < 8.5;
        var grd = ctx.createRadialGradient(pb[0] - 3, pb[1] - 4, 1, pb[0], pb[1], 11);
        if (stuck) { grd.addColorStop(0, "#cfd8e6"); grd.addColorStop(1, "#888888"); }
        else { grd.addColorStop(0, "#fff7e0"); grd.addColorStop(0.4, "#FFFF00"); grd.addColorStop(1, "#b45309"); }
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(pb[0], pb[1], 9, 0, 7); ctx.fill();
        if (stuck && lt > 4) {
          ctx.font = "13px 'JetBrains Mono', monospace";
          ctx.fillStyle = h.rgba("#9aa7be", h.clamp01((lt - 4) / 0.8) * (1 - h.clamp01((lt - 8) / 0.6)));
          ctx.fillText("∇L ≈ 0  ·  stalled", pb[0] + 14, pb[1] - 10);
        }
      });

      // RIGHT: Bray–Dean phase plane — index α(ε) rises monotonically with error
      var co = film.coords({ xRange: [0, 1], yRange: [0, 1], pad: { left: 588, right: 60, top: 150, bottom: 150 } });
      var ax = s.axes(co, { grid: true, gridX: 5, gridY: 4 });
      s.draw(ax, { at: 3.9, dur: 1.2 });
      var idx = s.plot(co, function (x) { return Math.pow(x, 0.85); }, { color: "#9A72AC", width: 3, samples: 80, glow: 12 });
      s.draw(idx, { at: 5.1, dur: 2.4 });
      s.canvas(function(lt, ctx, h) {
        if (lt < 3.4) return;
        var p = h.clamp01((lt - 3.4) / 1.6);
        ctx.beginPath(); ctx.moveTo(co.x(0), co.y(0));
        for(var i=0; i<=80*p; i++) {
          var x = i/80 * p;
          var y = Math.pow(x, 0.85);
          ctx.lineTo(co.x(x), co.y(y));
        }
        ctx.lineTo(co.x(p), co.y(0)); ctx.closePath();
        var grd = ctx.createLinearGradient(0, co.y(1), 0, co.y(0));
        grd.addColorStop(0, h.rgba("#9A72AC", 0.35));
        grd.addColorStop(1, h.rgba("#9A72AC", 0.0));
        ctx.fillStyle = grd; ctx.fill();
      });
      // scatter critical points along the curve
      [[0.06, 0], [0.22, 0], [0.4, 0], [0.58, 0], [0.74, 0], [0.9, 0]].forEach(function (pt, i) {
        var y = Math.pow(pt[0], 0.85);
        var d = s.dot({ coords: co, x: pt[0], y: y, r: 5, color: i === 0 ? "#83C167" : "#9A72AC", glow: 6 });
        s.fadeIn(d, { at: 7.2 + i * 0.18, dur: 0.6 });
        s.fadeOut(d, { at: 26, dur: 1 });
      });
      var xl = s.caption("loss ε →", { coords: co, x: -0.2, y: 1.15, anchor: "center", size: "0.9rem", color: "#f1f5f9" });
      var yl = s.caption("index α<br><span style='font-size:0.7em'>(% negative eigenvalues)</span>", { coords: co, x: -0.08, y: 0.98, anchor: "right", size: "0.7rem", color: "#dbeafe" });
      s.fadeIn(xl, { at: 4.5, dur: 0.9 }); s.fadeIn(yl, { at: 4.5, dur: 0.9 });
      var minLbl = s.caption("minima<br>(α≈0)", { coords: co, x: 0.06, y: 0.18, anchor: "left", size: "0.66rem", color: "#83C167" });
      var sadLbl = s.caption("saddles<br>(α↑)", { coords: co, x: 0.66, y: 0.66, anchor: "left", size: "0.66rem", color: "#9A72AC" });
      s.fadeIn(minLbl, { at: 9, dur: 0.9 }); s.fadeIn(sadLbl, { at: 9.6, dur: 0.9 });

      var eq = s.tex2("\\text{Saddle Points} \\gg \\text{Local Minima}", { px: 470, py: 70, size: "1.05rem", color: "#9A72AC" });
      s.write(eq, { at: 9, dur: 2.1 });
      var eqsub = s.tex2("\\text{In very high dimensional spaces}", { px: 470, py: 108, size: "1.05rem", color: "#7f93b4" });
      s.fadeIn(eqsub, { at: 15, dur: 1.2 });

      lower(s, "In high dimensions, most critical points are saddles. Momentum and noise help escape them.", 16.8, { maxWidth: "92%", px: 60 });
    }, { subtitle: "High dimensional critical points are almost never minima. They are saddles." });
  }

  /* --------- small canvas arrow helper --------- */
  function drawArrow(ctx, h, x1, y1, x2, y2, color, w, head) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.5), y2 - head * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.5), y2 - head * Math.sin(ang + 0.5));
    ctx.closePath(); ctx.fill();
  }

  /* ===================== rigorous math appendix ===================== */
  function renderAppendix() {
    var host = document.querySelector('[data-role="gd-appendix"]');
    if (!host || !window.katex) return;
    var blocks = [
      ["The update", "\\theta_{t+1} = \\theta_t - \\alpha\\, v_{t+1}, \\qquad v_{t+1} = \\beta\\, v_t + \\nabla L(\\theta_t)",
        "Plain gradient descent is the \\(\\beta=0\\) case. With \\(v_0=0\\), the buffer is the exponentially-weighted <em>sum</em> \\(v_{t+1}=\\sum_{k=0}^{t}\\beta^{\\,t-k}\\nabla L(\\theta_k)\\) (not an average — that would carry a \\(1-\\beta\\) factor)."],
      ["Local stability", "\\theta_{t+1}=(1-\\alpha\\lambda_i)\\,\\theta_t \\;\\Rightarrow\\; 0<\\alpha<\\tfrac{2}{\\lambda_{\\max}}",
        "Diagonalising the Hessian \\(H=Q\\,\\mathrm{diag}(\\lambda_i)\\,Q^\\top\\) decouples GD into per-axis contractions \\(|1-\\alpha\\lambda_i|\\). Convergence requires this be \\(<1\\) on every axis."],
      ["Optimal rates", "\\alpha^\\star=\\tfrac{2}{L+\\mu}\\Rightarrow\\tfrac{\\kappa-1}{\\kappa+1}, \\qquad \\text{heavy-ball}\\Rightarrow\\tfrac{\\sqrt{\\kappa}-1}{\\sqrt{\\kappa}+1}",
        "With \\(\\kappa=L/\\mu\\), the globally optimal GD step \\(\\alpha^\\star=2/(L{+}\\mu)\\) gives rate \\((\\kappa{-}1)/(\\kappa{+}1)\\); the simpler \\(\\alpha=1/L\\) gives the slightly worse \\((\\kappa{-}1)/\\kappa\\). Polyak's optimally-tuned heavy ball achieves the \\(\\sqrt{\\kappa}\\) law (Polyak 1964) — a strongly-convex, full-gradient result."],
      ["Saddle prevalence", "P(\\text{local min}\\mid \\nabla L=0)\\to 0 \\ \\text{as } d\\to\\infty",
        "In the Bray–Dean isotropic Gaussian-random-field model the Hessian spectrum is a Wigner semicircle shifted by the energy/error, so the index (fraction of negative eigenvalues) rises monotonically with loss. Imported to deep nets by Dauphin et al. (2014); for real networks the spectrum is only <em>approximately</em> semicircular but still shifts with error."]
    ];
    var html = '<div class="lab-math__grid">';
    blocks.forEach(function (b) {
      html += '<div class="lab-math__item"><div class="lab-math__name">' + b[0] + '</div>' +
        '<div class="lab-math__eq">' + window.katex.renderToString(b[1], { throwOnError: false, displayMode: true }) + '</div>' +
        '<p class="lab-math__note">' + b[2] + '</p></div>';
    });
    html += '</div>';
    html += '<p class="lab-math__refs">Polyak (1964) · Nesterov (1983) · Bray &amp; Dean, <em>PRL</em> 98 (2007) · Dauphin, Pascanu, Gulcehre, Cho, Ganguli, Bengio, <em>NeurIPS</em> 2014.</p>';
    host.innerHTML = html;
    // typeset the inline \( \) notes
    if (window.renderMathInElement) {
      try { window.renderMathInElement(host, { delimiters: [{ left: "\\(", right: "\\)", display: false }] }); } catch (e) {}
    } else {
      // manual inline pass for \( ... \)
      host.querySelectorAll(".lab-math__note").forEach(function (el) {
        el.innerHTML = el.innerHTML.replace(/\\\((.+?)\\\)/g, function (_, tex) {
          try { return window.katex.renderToString(tex, { throwOnError: false }); } catch (e) { return tex; }
        });
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
