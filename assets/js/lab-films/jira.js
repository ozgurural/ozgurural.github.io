/* =============================================================================
   jira.js — cinematic explainer: Prediction Markets for Global Coordination
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("jira-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build();
  }

  var PAL = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = PAL.sky, AMB = PAL.amber, RED = PAL.rose, GRN = PAL.good, GREY = PAL.faint, PURP = PAL.violet;

  var _lowerCount = 0, _pendLower = null;
  // Panels share one full-width bottom bar, so two visible at once print
  // text on text. Defer each panel's fade-out until we know when the next
  // one arrives, then fade at whichever comes first: the author's `out`
  // or 1.1s before the successor.
  function flushLower(s, nextAt) {
    if (!_pendLower) return;
    var eff = _pendLower.out || Infinity;
    if (s && _pendLower.s === s && typeof nextAt === "number") eff = Math.min(eff, nextAt - 1.1);
    if (isFinite(eff)) _pendLower.s.fadeOut(_pendLower.c, { at: Math.max(eff, _pendLower.at + 1.2), dur: 0.9 });
    _pendLower = null;
  }
  function lower(s, html, at, o) {
    var audioId = "jira_" + (_lowerCount++);
    s.audio(audioId, at);
    o = o || {};
    flushLower(s, at);
    // Pinned to exact bottom-left for full-width overlay bar
    var c = s.caption(html, { px: 0, py: 540, anchor: "bottom-left", align: "left", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 1.5 });
    _pendLower = { s: s, c: c, at: at, out: o.out || null };
    return c;
  }

  function build() {
    var film = window.LabAnim.create("#jira-film", { width: 960, height: 540 });
    sceneCoordination(film);
    sceneAMM(film);
    sceneInsiderTrading(film);
    sceneAgentLoop(film);
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__jiraFilm = film;
  }

  function sceneCoordination(film) {
    film.scene("The Coordination Problem", 60.5, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Deterministic jitter: seek(t) must reproduce the frame exactly, so
        // every "random" offset is a fixed function of the agent index.
        function jx(i) { return Math.sin(i * 12.9898) * 43758.5453; }
        function rnd(i) { var v = jx(i); return v - Math.floor(v); }

        var FX = 330, FY = 280, R = 165;   // agent ring
        var GX0 = 620, GX1 = 900, GY0 = 140, GY1 = 380;  // graph panel
        var NMAX = 40, CAP = 24;           // agents, and the hub's capacity

        // How many agents are on stage right now.
        var n = 6;
        if (lt > 26) n = Math.round(lerp(6, NMAX, clamp01((lt - 26) / 18)));

        function agentPos(i, count) {
          var a = (i / count) * Math.PI * 2 - Math.PI / 2;
          // Fleet drift, then order. Not stillness though: a fleet that has
          // found its formation is still forty boats holding it against the
          // water, and zeroing this froze the picture for twelve seconds.
          var wobble = lt < 14
            ? (rnd(i) - 0.5) * 40
            : Math.sin(lt * 0.7 + i * 1.9) * 3.4 + Math.sin(lt * 1.13 + i) * 1.6;
          var rr = R + wobble + (rnd(i + 7) - 0.5) * 10;
          return { x: FX + Math.cos(a) * rr, y: FY + Math.sin(a) * rr * 0.72 };
        }

        // ---- Phase A: a fleet with no director -----------------------------
        if (lt < 26) {
          var fleetN = 40;
          for (var i = 0; i < fleetN; i++) {
            var p = agentPos(i, fleetN);
            var head = (rnd(i + 3) * 2 - 1) * 0.6 + (lt > 14 ? 0 : Math.sin(lt * 0.4 + i) * 0.3);
            ctx.strokeStyle = h.rgba(GRN, 0.55);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + Math.cos(head - Math.PI / 2) * 14, p.y + Math.sin(head - Math.PI / 2) * 14);
            ctx.stroke();
            ctx.fillStyle = GRN;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = h.rgba(PAL.white, 0.75);
          ctx.font = "13px 'JetBrains Mono', monospace";
          ctx.fillText("no director", FX - 38, FY + 4);
        }

        // ---- Phase B onward: the hub and its links -------------------------
        if (lt >= 26) {
          var over = n > CAP;
          var hubCol = over ? RED : CY;

          for (var j = 0; j < n; j++) {
            var q = agentPos(j, n);
            ctx.strokeStyle = h.rgba(over ? RED : CY, over ? 0.5 : 0.35);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(FX, FY); ctx.lineTo(q.x, q.y); ctx.stroke();
            ctx.fillStyle = GRN;
            ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, Math.PI * 2); ctx.fill();
          }

          ctx.shadowBlur = over ? 26 : 14; ctx.shadowColor = hubCol;
          ctx.fillStyle = hubCol;
          ctx.beginPath(); ctx.arc(FX, FY, over ? 15 : 11, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = h.rgba(PAL.white, 0.9);
          ctx.font = "12px 'JetBrains Mono', monospace";
          ctx.fillText("manager", FX - 26, FY + 30);

          // the count is the point of the scene, so it is stated numerically
          ctx.fillStyle = over ? RED : h.rgba(PAL.white, 0.9);
          ctx.font = "bold 15px 'JetBrains Mono', monospace";
          ctx.fillText("links through one node: " + n, 60, 380);

          // queue arc once the hub is past capacity
          if (over) {
            var qn = n - CAP;
            for (var k = 0; k < qn; k++) {
              var qa = -Math.PI / 2 + k * 0.12;
              ctx.fillStyle = h.rgba(RED, 0.85);
              ctx.beginPath();
              ctx.arc(FX + Math.cos(qa) * 34, FY + Math.sin(qa) * 34, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // ---- The graph: load against number of agents ----------------------
        if (lt >= 26) {
          var ga = clamp01((lt - 26) / 1.2);
          ctx.globalAlpha = op * ga;

          ctx.strokeStyle = h.rgba(PAL.white, 0.45); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(GX0, GY0); ctx.lineTo(GX0, GY1); ctx.lineTo(GX1, GY1); ctx.stroke();

          ctx.fillStyle = h.rgba(PAL.white, 0.65);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillText("load", GX0 - 6, GY0 - 10);
          ctx.fillText("agents", GX1 - 44, GY1 + 18);

          function px(v) { return GX0 + (v / NMAX) * (GX1 - GX0); }
          function py(v) { return GY1 - (v / NMAX) * (GY1 - GY0); }

          // capacity ceiling
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = h.rgba(RED, 0.6);
          ctx.beginPath(); ctx.moveTo(GX0, py(CAP)); ctx.lineTo(GX1, py(CAP)); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(RED, 0.75);
          ctx.fillText("capacity", GX1 - 58, py(CAP) - 6);

          // the manager's load: one link per agent, so a straight climb
          ctx.strokeStyle = CY; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(px(0), py(0)); ctx.lineTo(px(n), py(n)); ctx.stroke();
          ctx.fillStyle = CY;
          ctx.beginPath(); ctx.arc(px(n), py(n), 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = h.rgba(CY, 0.9);
          ctx.fillText("one manager", px(n) - 74, py(n) - 10);
        }

        // ---- Phase D: drop the hub, publish a price ------------------------
        if (lt >= 50) {
          var da = clamp01((lt - 50) / 1.5);
          ctx.globalAlpha = op * da;

          // the shared scalar every agent reads
          var lineY = FY + 120;
          ctx.strokeStyle = AMB; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(FX - 210, lineY); ctx.lineTo(FX + 210, lineY); ctx.stroke();
          ctx.fillStyle = AMB;
          ctx.font = "bold 12px 'JetBrains Mono', monospace";
          ctx.fillText("price", FX + 218, lineY + 4);

          for (var m = 0; m < NMAX; m++) {
            var r2 = agentPos(m, NMAX);
            ctx.strokeStyle = h.rgba(AMB, 0.28);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(r2.x, r2.y); ctx.lineTo(r2.x, lineY); ctx.stroke();
          }

          // and the flat curve that goes with it
          ctx.globalAlpha = op * da;
          ctx.strokeStyle = GRN; ctx.lineWidth = 2.5;
          var fy = GY1 - (1 / NMAX) * (GY1 - GY0);
          ctx.beginPath(); ctx.moveTo(GX0, fy); ctx.lineTo(GX1, fy); ctx.stroke();
          ctx.fillStyle = h.rgba(GRN, 0.95);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillText("per agent: one price to read", GX0 + 8, fy - 8);
        }

        ctx.globalAlpha = 1;
      });

      lower(s, "I learned decentralized coordination on the Aegean: forty boats, no race director steering them...", 2.0, { out: 18 });
      lower(s, "...order emerging from local decisions and shared rules.", 13.0, { out: 24 });
      lower(s, "Software wants the same thing at global scale, with agents that never sleep and increasingly are not human.", 25.0, { out: 33 });
      lower(s, "Put one manager in the middle and their load is every agent at once. Capacity is fixed; the queue is not.", 35.0, { out: 49 });
      lower(s, "Take the manager out and publish a price. Each agent reads one number, however many of them there are.", 52.0);
    }, { subtitle: "The limits of centralized management" });
  }

  /* The market is one picture, shared by this scene and the next, so the price
     the crowd sets and the price the developer moves are visibly the same
     object. Everything is drawn from poolX(lt): the dot, the rectangle, the
     tangent and the readout cannot disagree, and seek(t) reproduces the frame.

       price = |dy/dx| = k / x^2        the marginal rate of substitution
       prob  = price / (1 + price)      odds read as a probability

     k and the x range are chosen so the curve spans a real betting range: x=12
     is a ten cent claim, x=4 is a coin flip, x=2.4 is near certain. */
  var MK = { k: 16, xLo: 1.6, xHi: 12.6 };
  function mkCoords(film) {
    return film.coords({ xRange: [0, 13.4], yRange: [0, 11],
                         pad: { left: 96, right: 486, top: 92, bottom: 190 } });
  }
  function mkPrice(x) { return MK.k / (x * x); }
  function mkProb(x) { var p = mkPrice(x); return p / (1 + p); }

  // The pool rectangle. Its two sides change and its area does not, which is
  // what x*y = k means; asserting it in a caption is not the same as showing it.
  function drawPool(ctx, h, co, x, alpha) {
    var y = MK.k / x;
    ctx.fillStyle = h.rgba(CY, 0.10 * alpha);
    ctx.fillRect(co.x(0), co.y(y), co.x(x) - co.x(0), co.y(0) - co.y(y));
    ctx.strokeStyle = h.rgba(CY, 0.35 * alpha);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(co.x(x), co.y(0)); ctx.lineTo(co.x(x), co.y(y));
    ctx.lineTo(co.x(0), co.y(y));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // The readout: a column that fills to the probability, with the number under
  // it. The column is the same height as the claim is likely, so the viewer can
  // read the price without reading the axis.
  var GA = { x: 596, w: 46, top: 104, bot: 340, tx: 664 };
  function drawGauge(ctx, h, p, alpha, label, warm) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = h.rgba(PAL.faint, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(GA.x, GA.top, GA.w, GA.bot - GA.top);
    var fh = (GA.bot - GA.top) * p;
    var g = ctx.createLinearGradient(0, GA.bot, 0, GA.top);
    g.addColorStop(0, h.rgba(CY, 0.55));
    g.addColorStop(1, h.rgba(warm || AMB, 0.9));
    ctx.fillStyle = g;
    ctx.fillRect(GA.x, GA.bot - fh, GA.w, fh);
    ctx.textAlign = 'left';
    ctx.fillStyle = h.rgba(PAL.white, alpha);
    ctx.font = "bold 34px 'JetBrains Mono', monospace";
    ctx.fillText((p * 100).toFixed(0) + '%', GA.tx, 156);
    ctx.fillStyle = h.rgba(PAL.muted, alpha * 0.9);
    ctx.font = "12px 'JetBrains Mono', monospace";
    ctx.fillText(label || 'chance it gets done', GA.tx, 178);
    ctx.globalAlpha = 1;
  }

  function sceneAMM(film) {
    film.scene("The AMM Geometry", 38.3, function (s) {
      var co = mkCoords(film), k = MK.k;

      // Where the pool sits. Two trades, each one a cause the viewer can see.
      // Two trades that carry the argument, over a book that is never perfectly
      // still: a market with a crowd in it always has someone moving the price
      // slightly. Deterministic in lt, so seek(t) still reproduces the frame,
      // and small enough that the two real trades remain the events.
      function poolX(lt) {
        var base;
        if (lt < 12) base = 3.2;
        else if (lt < 17) base = lerp(3.2, 6.4, E.inOut(clamp01((lt - 12) / 5)));
        else if (lt < 26) base = 6.4;
        else if (lt < 31) base = lerp(6.4, 12.0, E.inOut(clamp01((lt - 26) / 5)));
        else base = 12.0;
        var churn = 0.055 * base * (Math.sin(lt * 1.31) + 0.6 * Math.sin(lt * 2.17 + 1.1));
        return Math.max(MK.xLo + 0.2, Math.min(MK.xHi - 0.2, base + churn));
      }

      var eq = s.tex2("x \\cdot y = k", { px: 352, py: 126, size: "1.6rem", color: CY });
      s.write(eq, { at: 6.0, dur: 1.2 });
      var eq2 = s.tex2("P = \\frac{y}{x}", { px: 352, py: 126, size: "1.6rem", color: AMB });
      s.morph(eq, eq2, { at: 19.5, dur: 1.0 });

      var ax = s.axes(co, { grid: true, gridX: 8, gridY: 5 });
      s.stagger(ax, { at: 0.8, dur: 1.2 });
      var xlab = s.caption("NO shares", { coords: co, x: 6.7, y: -1.1, anchor: "top", align: "center", size: "0.85rem", color: PAL.muted });
      var ylab = s.caption("<div style='transform: rotate(-90deg)'>YES shares</div>", { coords: co, x: -1.0, y: 5.5, anchor: "center", align: "center", size: "0.85rem", color: PAL.muted });
      s.fadeIn(xlab, { at: 1.4, dur: 0.7 });
      s.fadeIn(ylab, { at: 1.6, dur: 0.7 });

      var pts = [];
      for (var xv = MK.xLo; xv <= MK.xHi + 1e-9; xv += 0.08) pts.push([xv, k / xv]);
      var curve = s.poly(pts, { coords: co, color: CY, width: 3 });
      s.draw(curve, { at: 2.4, dur: 3.0 });

      s.canvas(function (lt, ctx, h) {
        // The bottleneck from the previous scene, still red, dissolving. The
        // cut only works if the thing being replaced is still on screen.
        if (lt < 2.2) {
          var a = 1 - clamp01(lt / 2.2);
          ctx.fillStyle = h.rgba(RED, a * 0.13);
          ctx.fillRect(0, 0, 960, 540);
          ctx.textAlign = "center";
          ctx.fillStyle = h.rgba(RED, a);
          ctx.font = "bold 26px 'JetBrains Mono', monospace";
          ctx.fillText("ONE MANAGER", 480, 210);
          ctx.beginPath(); ctx.arc(480, 250, 14, 0, Math.PI * 2); ctx.fill();
          ctx.textAlign = "left";
        }

        var x = poolX(lt), y = k / x;

        // The pool, from the moment the curve finishes drawing.
        if (lt > 5.0) {
          var pa = clamp01((lt - 5.0) / 0.8);
          drawPool(ctx, h, co, x, pa);
          ctx.fillStyle = h.rgba(CY, pa * 0.85);
          ctx.font = "13px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          // the number that does not move while both sides of it do
          ctx.fillText("area = " + (x * y).toFixed(0), (co.x(0) + co.x(x)) / 2, (co.y(0) + co.y(y)) / 2 + 5);
          ctx.textAlign = "left";
        }

        // The tangent, once the equation has become a price.
        if (lt > 19.5) {
          var ta = clamp01((lt - 19.5) / 0.6);
          var slope = -k / (x * x);
          ctx.strokeStyle = h.rgba(AMB, ta * 0.95);
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(co.x(x - 2.2), co.y(y - 2.2 * slope));
          ctx.lineTo(co.x(x + 2.2), co.y(y + 2.2 * slope));
          ctx.stroke();
        }

        // The point itself, always.
        if (lt > 5.0) {
          var da = clamp01((lt - 5.0) / 0.8);
          ctx.fillStyle = h.rgba(PAL.white, da);
          ctx.beginPath(); ctx.arc(co.x(x), co.y(y), 7, 0, Math.PI * 2); ctx.fill();
        }

        if (lt > 8.0) drawGauge(ctx, h, mkProb(x), clamp01((lt - 8.0) / 1.0));

        // Name the two trades as they happen, so the price moving reads as
        // somebody's decision rather than an animation.
        var tradeLabel = null;
        if (lt > 12 && lt < 18.5) tradeLabel = "someone sells YES";
        else if (lt > 26 && lt < 32.5) tradeLabel = "and again, larger";
        if (tradeLabel) {
          ctx.fillStyle = h.rgba(PAL.muted, 0.9);
          ctx.font = "13px 'JetBrains Mono', monospace";
          ctx.fillText(tradeLabel, GA.x, 372);
        }
      });

      lower(s, "So stop assigning the work and price it instead. Will this bug be fixed by Friday?", 1.6, { out: 11.0 });
      lower(s, "An automated market maker always quotes a price, so there is always someone to trade against.", 11.5, { out: 19.0 });
      lower(s, "And the slope of that curve is the crowd's probability that the work gets done.", 19.8, { out: 27.0 });
      lower(s, "If nobody is working on it, the price is cheap. Cheap is the signal to act.", 31.5);
    }, { subtitle: "Continuous automated market makers" });
  }

  function sceneInsiderTrading(film) {
    film.scene("Skin in the Game", 58, function (s) {
      var co = mkCoords(film), k = MK.k;

      /* The claim this scene has to make visible is that effort moves a price
         the worker holds. So the price is not scheduled: it is read off how
         much of the work is done. The test strip below the curve is the cause,
         the curve is the effect, and they are the same variable. */
      var TESTS = 9;
      function testsPassed(lt) {
        if (lt < 17) return 0;
        return Math.min(TESTS, Math.floor((lt - 17) / 1.9) + 1);
      }
      function workFrac(lt) {
        if (lt < 17) return 0;
        return clamp01((lt - 17) / (TESTS * 1.9));
      }
      // Same book as the previous scene, so it churns the same way. The trend is
      // the work; the wobble is everyone else still trading around it.
      function poolX(lt) {
        var base;
        if (lt < 6) base = 12.0;                                    // ten cents, untouched
        else if (lt < 10) base = lerp(12.0, 10.6, E.inOut(clamp01((lt - 6) / 4)));   // the buy
        else if (lt < 41) base = lerp(10.6, 3.4, E.inOut(workFrac(lt)));  // the work re-prices it
        else base = 3.4;
        var churn = 0.04 * base * (Math.sin(lt * 1.31) + 0.6 * Math.sin(lt * 2.17 + 1.1));
        return Math.max(MK.xLo + 0.2, Math.min(MK.xHi - 0.2, base + churn));
      }
      function settled(lt) { return lt > 41; }
      function probAt(lt) {
        if (!settled(lt)) return mkProb(poolX(lt));
        return lerp(mkProb(3.4), 1, E.out(clamp01((lt - 41) / 1.6)));   // the oracle
      }

      var ax = s.axes(co, { grid: true, gridX: 8, gridY: 5 });
      s.show(ax, 0);
      var pts = [];
      for (var xv = MK.xLo; xv <= MK.xHi + 1e-9; xv += 0.08) pts.push([xv, k / xv]);
      var curve = s.poly(pts, { coords: co, color: CY, width: 3 });
      s.show(curve, 0);

      s.canvas(function (lt, ctx, h) {
        var x = poolX(lt), y = k / x, p = probAt(lt);
        drawPool(ctx, h, co, x, 1);

        // the holder's entry, left on the curve so the gain has somewhere to be
        if (lt > 9.0) {
          ctx.strokeStyle = h.rgba(GRN, 0.5);
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(co.x(12.0), co.y(k / 12.0)); ctx.lineTo(co.x(12.0), co.y(0));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(GRN, 0.8);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText('bought here', co.x(12.0), co.y(0) - 9);
          ctx.textAlign = "left";
        }

        ctx.fillStyle = h.rgba(PAL.white, 1);
        ctx.beginPath(); ctx.arc(co.x(x), co.y(y), 7, 0, Math.PI * 2); ctx.fill();

        // the developer, arriving once and then staying with their position
        if (lt > 2.5) {
          var ea = clamp01((lt - 2.5) / 1.0);
          var dx = lerp(900, co.x(12.0) + 22, E.out(clamp01((lt - 2.5) / 3.0)));
          ctx.globalAlpha = ea;
          ctx.fillStyle = h.rgba(GRN, 0.9);
          ctx.beginPath(); ctx.arc(dx, co.y(k / 12.0) - 30, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = h.rgba(PAL.muted, 0.95);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.textAlign = "center";
          ctx.fillText("developer", dx, co.y(k / 12.0) - 48);
          ctx.textAlign = "left";
          ctx.globalAlpha = 1;
        }

        // The work, as nine tests going from failing to passing. Each one lands
        // on the beat that moves the price above it.
        if (lt > 15.5) {
          var sa = clamp01((lt - 15.5) / 0.8);
          var done = testsPassed(lt);
          var CW = 30, GAP = 8, X0 = co.x(0), Y0 = 376;
          ctx.globalAlpha = sa;
          ctx.fillStyle = h.rgba(PAL.muted, 0.9);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillText("test suite", X0, Y0 - 9);
          for (var i = 0; i < TESTS; i++) {
            var on = i < done;
            ctx.fillStyle = h.rgba(on ? GRN : RED, on ? 0.85 : 0.30);
            ctx.fillRect(X0 + i * (CW + GAP), Y0, CW, 14);
          }
          ctx.fillStyle = h.rgba(done === TESTS ? GRN : PAL.muted, 0.9);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillText(done + " / " + TESTS + " passing", X0 + TESTS * (CW + GAP) + 10, Y0 + 12);
          ctx.globalAlpha = 1;
        }

        // The gauge, reading the same number the curve does, plus the oracle.
        drawGauge(ctx, h, p, 1,
                  settled(lt) ? 'settled by the oracle' : 'chance it gets done',
                  settled(lt) ? GRN : AMB);

        // The position, revalued continuously against that price. This is the
        // payoff tracking the contribution, which is the sentence the scene
        // exists to prove, so it is a number that moves while the tests pass.
        if (lt > 9.0) {
          var held = 1000, entry = mkProb(12.0);
          var gain = held * (p - entry);
          ctx.textAlign = 'left';
          ctx.fillStyle = h.rgba(PAL.muted, 0.9);
          ctx.font = "12px 'JetBrains Mono', monospace";
          ctx.fillText('1000 YES bought at ' + (entry * 100).toFixed(0) + ' cents', GA.tx, 232);
          ctx.fillStyle = h.rgba(gain > 1 ? GRN : PAL.muted, 1);
          ctx.font = "bold 24px 'JetBrains Mono', monospace";
          ctx.fillText('$' + gain.toFixed(0), GA.tx, 262);
          ctx.fillStyle = h.rgba(PAL.muted, 0.75);
          ctx.font = "11px 'JetBrains Mono', monospace";
          ctx.fillText('position, marked to the price', GA.tx, 280);
        }

        /* Settlement, so the closing line has something to watch. The position
           stops being a price and becomes money: the holding converts, a coin
           crosses from the market to the developer, and the figure counts up to
           the bounty nobody assigned. Without this the scene held one picture
           for the fifteen seconds it takes to ask the question the film ends on. */
        if (lt > 43.5) {
          var sp = clamp01((lt - 43.5) / 3.2);
          var cxA = GA.x + GA.w / 2, cyA = 240;
          var cxB = co.x(12.0) + 22, cyB = co.y(k / 12.0) - 72;   // above the developer, not on them
          var cxN = lerp(cxA, cxB, E.inOut(sp)), cyN = lerp(cyA, cyB, E.inOut(sp)) - 60 * Math.sin(sp * Math.PI);
          ctx.fillStyle = h.rgba(AMB, 0.95);
          ctx.beginPath(); ctx.arc(cxN, cyN, 15, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = h.rgba('#0b0f1a', 1);
          ctx.font = "bold 12px 'JetBrains Mono', monospace";
          ctx.textAlign = 'center';
          ctx.fillText('$', cxN, cyN + 4);
          ctx.textAlign = 'left';

        }

        // The market winding down behind it: the curve has done its job.
        if (lt > 47.5) {
          var fade = clamp01((lt - 47.5) / 4.0);
          ctx.fillStyle = h.rgba('#070b16', fade * 0.5);
          ctx.fillRect(co.x(0) - 40, 84, co.x(13.4) - co.x(0) + 60, 310);
        }

        // The bond that makes the assertion cost something.
        if (lt > 39) {
          var ba = clamp01((lt - 39) / 0.8);
          ctx.globalAlpha = ba;
          ctx.fillStyle = h.rgba(AMB, 0.9);
          ctx.beginPath(); ctx.arc(GA.tx + 11, 312, 11, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = h.rgba(PAL.muted, 0.95);
          ctx.font = "12px 'JetBrains Mono', monospace";
          ctx.fillText('merge asserted, with a bond', GA.tx + 30, 316);
          ctx.globalAlpha = 1;
        }
      });

      lower(s, "A developer who knows they can fix it buys in quietly at ten cents.", 2.0, { out: 13.0 });
      lower(s, "Then they do the work. Effort moves a price they hold, so the payoff tracks the contribution.", 15.0, { out: 36.0 });
      lower(s, "The merge is asserted to an oracle with a bond. Unchallenged, it settles at one.", 38.5, { out: 46.0 });
      lower(s, "Nobody assigned that bounty. A price discovered it. Which leaves the question this lab keeps returning to: when no one is in charge, who verifies the claim?", 45.6);
    }, { subtitle: "Aligning incentives with truth" });
  }


  function sceneAgentLoop(film) {
    film.scene("Who Verifies the Claim", 73.9, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        var STEPS = ["propose", "price", "work", "settle"];

        function chip(x, y, label, col, filled) {
          ctx.strokeStyle = h.rgba(col, 0.9);
          ctx.fillStyle = filled ? h.rgba(col, 0.18) : "rgba(0,0,0,0)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x - 52, y - 16, 104, 32, 8);
          else ctx.rect(x - 52, y - 16, 104, 32);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = h.rgba(PAL.white, 0.92);
          ctx.font = "12px 'JetBrains Mono', monospace";
          ctx.fillText(label, x - ctx.measureText(label).width / 2, y + 4);
        }

        function arrow(x0, y0, x1, y1, col, alpha) {
          ctx.strokeStyle = h.rgba(col, alpha);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          var a = Math.atan2(y1 - y0, x1 - x0);
          ctx.fillStyle = h.rgba(col, alpha);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x1 - 8 * Math.cos(a - 0.4), y1 - 8 * Math.sin(a - 0.4));
          ctx.lineTo(x1 - 8 * Math.cos(a + 0.4), y1 - 8 * Math.sin(a + 0.4));
          ctx.closePath(); ctx.fill();
        }

        // ---- Phase A: the loop closes, with nobody in it -------------------
        if (lt < 22) {
          var CXR = 480, CYR = 250, RR = 128;
          for (var i = 0; i < 4; i++) {
            var a0 = -Math.PI / 2 + i * Math.PI / 2;
            var a1 = -Math.PI / 2 + (i + 1) * Math.PI / 2;
            var appear = clamp01((lt - 1.5 - i * 1.6) / 0.8);
            if (appear <= 0) continue;
            ctx.globalAlpha = op * appear;
            chip(CXR + Math.cos(a0) * RR, CYR + Math.sin(a0) * RR * 0.85, STEPS[i], CY, true);
            if (lt > 8) {
              var seg = clamp01((lt - 8 - i * 0.5) / 0.6);
              if (seg > 0) {
                var mx0 = CXR + Math.cos(a0) * RR * 0.72, my0 = CYR + Math.sin(a0) * RR * 0.62;
                var mx1 = CXR + Math.cos(a1) * RR * 0.72, my1 = CYR + Math.sin(a1) * RR * 0.62;
                arrow(mx0, my0, lerp(mx0, mx1, seg), lerp(my0, my1, seg), CY, 0.6);
              }
            }
          }
          ctx.globalAlpha = op;
          // The loop is a loop, so something goes round it. The line under this
          // says the loop closes with nobody in it; a ring of four chips sitting
          // still says it is a diagram of one.
          if (lt > 10) {
            var lap = (lt - 10) / 4.2;
            var la = -Math.PI / 2 + (lap % 1) * Math.PI * 2;
            ctx.globalAlpha = op * clamp01((lt - 10) / 0.8);
            ctx.shadowBlur = 12; ctx.shadowColor = AMB;
            ctx.fillStyle = h.rgba(AMB, 0.95);
            ctx.beginPath();
            ctx.arc(CXR + Math.cos(la) * RR * 0.72, CYR + Math.sin(la) * RR * 0.62,
                    5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = op;
          }

          if (lt > 13) {
            var tok = ((lt - 13) / 4) % 1;
            var ta = -Math.PI / 2 + tok * Math.PI * 2;
            ctx.shadowBlur = 14; ctx.shadowColor = AMB;
            ctx.fillStyle = AMB;
            ctx.beginPath();
            ctx.arc(CXR + Math.cos(ta) * RR * 0.72, CYR + Math.sin(ta) * RR * 0.62, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
          if (lt > 16) {
            ctx.globalAlpha = op * clamp01((lt - 16) / 0.8);
            ctx.fillStyle = h.rgba(PAL.white, 0.8);
            ctx.font = "13px 'JetBrains Mono', monospace";
            ctx.fillText("no human in the loop", CXR - 68, CYR + 6);
            ctx.globalAlpha = op;
          }
        }

        // ---- Phase B and C: two lanes, one of them fabricated --------------
        if (lt >= 22) {
          var LX = [180, 373, 566, 759];
          var LY_OK = 190, LY_FAKE = 330;
          var showFake = lt > 30;
          var gates = lt > 46;                      // the defence appears
          var run = clamp01((lt - 36) / 6);          // first run, both settle
          var run2 = gates ? clamp01((lt - 52) / 7) : 0;  // second run, gated

          function lane(y, col, label, fabricated) {
            ctx.fillStyle = h.rgba(col, 0.9);
            ctx.font = "bold 12px 'JetBrains Mono', monospace";
            ctx.fillText(label, 40, y + 4);
            for (var i = 0; i < 4; i++) {
              chip(LX[i], y, STEPS[i], col, true);
              if (i < 3) arrow(LX[i] + 54, y, LX[i + 1] - 56, y, col, 0.55);
            }
            // payout box
            ctx.strokeStyle = h.rgba(col, 0.9); ctx.lineWidth = 1.5;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(844, y - 16, 74, 32, 8); else ctx.rect(844, y - 16, 74, 32);
            ctx.stroke();
            ctx.fillStyle = h.rgba(PAL.white, 0.9);
            ctx.font = "12px 'JetBrains Mono', monospace";
            ctx.fillText("payout", 852, y + 4);
            arrow(LX[3] + 54, y, 842, y, col, 0.55);

            // A running tally, so the closing line has a picture. The real lane
            // keeps paying and the gated one keeps refusing, which is the whole
            // sentence the film ends on: price discovers what to do,
            // verification decides what was done.
            var tally = lt - (fabricated ? 31 : 23);
            if (tally > 0) {
              var done = Math.floor(tally / 6.5 * 3);
              var stopped = fabricated && gates;
              ctx.fillStyle = h.rgba(stopped ? RED : col, 0.9);
              ctx.font = "bold 15px 'JetBrains Mono', monospace";
              ctx.fillText(String(stopped ? Math.max(0, done - 3) : done), 930, y - 2);
              ctx.fillStyle = h.rgba(PAL.muted, 0.75);
              ctx.font = "9px 'JetBrains Mono', monospace";
              ctx.fillText(stopped ? "refused" : "paid", 930, y + 12);
            }

            // Background traffic. The scene narrates two particular runs, and
            // between them the lane was a still diagram; agents that never sleep
            // are the film's own premise, so the lane keeps carrying work.
            var since = lt - (fabricated ? 31 : 23);
            if (since > 0) {
              for (var b = 0; b < 3; b++) {
                var ph = ((since / 6.5) + b / 3) % 1;
                var cap = (fabricated && gates) ? 0.62 : 1;
                if (ph > cap) continue;
                ctx.fillStyle = h.rgba(col, 0.26);
                ctx.beginPath();
                ctx.arc(lerp(LX[0], 880, ph), y, 3.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // the travelling claim
            var prog = gates ? run2 : run;
            var blocked = fabricated && gates && prog > 0.62;
            var pp = blocked ? 0.62 : prog;
            if (prog > 0) {
              var tx = lerp(LX[0], 880, pp);
              ctx.shadowBlur = 12; ctx.shadowColor = blocked ? RED : col;
              ctx.fillStyle = blocked ? RED : col;
              ctx.beginPath(); ctx.arc(tx, y, 6, 0, Math.PI * 2); ctx.fill();
              ctx.shadowBlur = 0;
            }
            return blocked;
          }

          ctx.globalAlpha = op * clamp01((lt - 22) / 1.0);
          var wasBlocked = false;
          lane(LY_OK, GRN, "real", false);
          if (showFake) {
            ctx.globalAlpha = op * clamp01((lt - 30) / 1.0);
            wasBlocked = lane(LY_FAKE, RED, "fabricated", true);
          }
          ctx.globalAlpha = op;

          // the point of phase B: the two lanes are the same picture
          if (lt > 38 && lt < 47) {
            ctx.globalAlpha = op * clamp01((lt - 38) / 0.8) * clamp01((47 - lt) / 0.8);
            ctx.fillStyle = h.rgba(PAL.white, 0.95);
            ctx.font = "bold 15px 'JetBrains Mono', monospace";
            ctx.fillText("same four steps, same payout", 300, 268);
            ctx.globalAlpha = op;
          }

          // ---- the three gates --------------------------------------------
          if (gates) {
            var ga = clamp01((lt - 46) / 1.2);
            ctx.globalAlpha = op * ga;

            // 1. bond staked at propose
            ctx.strokeStyle = h.rgba(AMB, 0.9); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(LX[0], LY_OK - 42, 12, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(LX[0], LY_FAKE - 42, 12, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = h.rgba(AMB, 0.95);
            ctx.font = "11px 'JetBrains Mono', monospace";
            ctx.fillText("bond", LX[0] - 15, LY_OK - 58);

            // 2. proposer may not settle: the shortcut is cut
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = h.rgba(RED, 0.55);
            ctx.beginPath(); ctx.moveTo(LX[0], LY_FAKE + 24); ctx.lineTo(LX[3], LY_FAKE + 24); ctx.stroke();
            ctx.setLineDash([]);
            var mxc = (LX[0] + LX[3]) / 2;
            ctx.strokeStyle = RED; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(mxc - 9, LY_FAKE + 15); ctx.lineTo(mxc + 9, LY_FAKE + 33);
            ctx.moveTo(mxc + 9, LY_FAKE + 15); ctx.lineTo(mxc - 9, LY_FAKE + 33);
            ctx.stroke();
            ctx.fillStyle = h.rgba(RED, 0.9 * (1 - clamp01((lt - 64) / 1.2)));
            ctx.font = "11px 'JetBrains Mono', monospace";
            ctx.fillText("proposer cannot settle", mxc - 66, LY_FAKE + 50);

            // 3. the artifact gate, between work and settle
            var gx = (LX[2] + LX[3]) / 2;
            [LY_OK, LY_FAKE].forEach(function (yy) {
              ctx.strokeStyle = h.rgba(PAL.white, 0.5); ctx.lineWidth = 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath(); ctx.moveTo(gx, yy - 30); ctx.lineTo(gx, yy + 30); ctx.stroke();
              ctx.setLineDash([]);
            });
            // sits above both lanes: at the lane midline it collided with the
            // fabricated lane's "nothing to show" caption
            ctx.fillStyle = h.rgba(PAL.white, 0.9);
            ctx.font = "11px 'JetBrains Mono', monospace";
            ctx.fillText("artifact gate", gx - 38, 118);

            // the artifact itself: a test that must go red then green
            function testDot(x, y, pass) {
              ctx.fillStyle = pass ? GRN : RED;
              ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            }
            var t1 = clamp01((lt - 54) / 2);
            testDot(gx - 14, LY_OK - 42, false);
            testDot(gx + 14, LY_OK - 42, t1 > 0.5);
            ctx.fillStyle = h.rgba(PAL.white, 0.75);
            ctx.font = "10px 'JetBrains Mono', monospace";
            ctx.fillText("failing test now passes", gx - 52, LY_OK - 56);

            testDot(gx - 14, LY_FAKE - 42, false);
            testDot(gx + 14, LY_FAKE - 42, false);
            ctx.fillStyle = h.rgba(RED, 0.85);
            ctx.fillText("nothing to show", gx - 38, LY_FAKE - 56);

            if (wasBlocked) {
              ctx.fillStyle = h.rgba(RED, 0.95 * (1 - clamp01((lt - 64) / 1.2)));
              ctx.font = "bold 14px 'JetBrains Mono', monospace";
              ctx.fillText("blocked, bond slashed", 700, LY_FAKE + 74);
            }
            ctx.globalAlpha = op;
          }
        }

        // ---- Phase D: the thesis -------------------------------------------
        if (lt > 66) {
          var fa = clamp01((lt - 66) / 1.5);
          ctx.globalAlpha = op * fa;
          ctx.fillStyle = h.rgba(AMB, 0.95);
          ctx.font = "bold 17px 'JetBrains Mono', monospace";
          ctx.fillText("price discovers what to do", 250, 358);
          ctx.fillStyle = h.rgba(CY, 0.95);
          ctx.fillText("verification decides what was done", 250, 386);
          ctx.globalAlpha = op;
        }

        ctx.globalAlpha = 1;
      });

      lower(s, "Remove the last human. An agent reads the repository and writes the ticket itself.", 2.0, { out: 20 });
      lower(s, "The loop closes: propose, price, work, settle, with nobody in it.", 13.0, { out: 28 });
      lower(s, "But the same agents now create the work and are paid for it. A fabricated ticket runs the identical path.", 30.0, { out: 45 });
      lower(s, "So bond the proposal, bar self-settlement, and pay only for what real work leaves behind: a failing test that now passes.", 47.0, { out: 65 });
      lower(s, "Price discovers what to do. Verification decides what was done. That second half is the open problem.", 66.0);
    }, { subtitle: "Closing the loop, and breaking it" });
  }

  setTimeout(boot, 60);
})();
