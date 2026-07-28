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
    film.scene("The Coordination Problem", 67.5, function(s) {
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
          var wobble = lt < 14 ? (rnd(i) - 0.5) * 40 : 0;   // fleet drift, then order
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
          ctx.fillText("links through one node: " + n, 60, 470);

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
          var lineY = FY + 210;
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

  function sceneAMM(film) {
    film.scene("The AMM Geometry", 90, function(s) {
      // Slower equation typing
      var eq = s.tex2("x \\cdot y = k", { px: 150, py: 80, size: "2.2rem", color: CY });
      s.write(eq, { at: 3.5, dur: 1.5 });

      // the price equation lands WITH the tangent sweep it explains (lt≈20)
      var eq2 = s.tex2("P = \\frac{y}{x}", { px: 750, py: 80, size: "2.2rem", color: AMB });
      s.morph(eq, eq2, { at: 19, dur: 1.2 });

      var co = film.coords({ xRange: [0, 10], yRange: [0, 10], pad: { left: 400, right: 150, top: 150, bottom: 150 } });
      var k = 20;

      // Match cut from Scene 1
      var cx = 480, cy = 250;
      s.canvas(function(lt, ctx, h) {
         if (lt < 2.0) {
            var alpha = 1 - clamp01(lt / 2.0);
            ctx.fillStyle = h.rgba(RED, alpha * 0.15);
            ctx.fillRect(0,0,960,540);
            
            ctx.shadowBlur = 20; ctx.shadowColor = h.rgba(RED, alpha);
            ctx.fillStyle = h.rgba(RED, alpha);
            ctx.font = "bold 32px 'JetBrains Mono'";
            ctx.fillText("SYSTEM BOTTLENECK", cx - 160, cy - 170);
            
            ctx.beginPath(); ctx.arc(cx, cy - 100, 16, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = h.rgba(PAL.white, alpha); ctx.font = "bold 14px 'JetBrains Mono', monospace";
            ctx.fillText("CENTRAL MANAGER", cx + 30, cy - 95);
         }
      });
      
      var tickets = 25;
      for (var t = 0; t < tickets; t++) {
         var jamRadius = 25 + (t * 2.5);
         var angle = Math.sin(67.5 * 4 + t) * 0.2 + (t / tickets) * Math.PI * 2;
         var startX = cx + Math.cos(angle) * jamRadius;
         var startY = cy - 100 + Math.sin(angle) * jamRadius;
         
         var dot = s.dot({ px: startX, py: startY, r: 4, color: RED });
         s.show(dot, 0); 
         
         var targetX = 2 + (8 * t / (tickets - 1));
         var targetY = k / targetX;
         
         s.move(dot, { coords: co, toX: targetX, toY: targetY, at: 0.5 + t * 0.05, dur: 1.5, ease: E.out });
         
         (function(dNode, delay) {
             // cue spans from t=0 so a backwards scrub restores the red state
             // (a cue that starts later would leave the last color painted)
             var total = delay + 1.5;
             s._cue(dNode, 0, total, E.linear, function(st, _e, rawP) {
                 var p = E.out(clamp01((rawP * total - delay) / 1.5));
                 var r1 = 252, g1 = 98, b1 = 85;
                 var r2 = 88, g2 = 196, b2 = 221;
                 var r = Math.round(r1 + (r2 - r1) * p);
                 var g = Math.round(g1 + (g2 - g1) * p);
                 var b = Math.round(b1 + (b2 - b1) * p);
                 dNode.el.setAttribute("fill", "rgb(" + r + "," + g + "," + b + ")");
             });
         })(dot, 0.5 + t * 0.05);
      }

      // Rebuild on engine primitives
      var ax = s.axes(co, { grid: true, gridX: 8, gridY: 5 });
      s.draw(ax, { at: 1.0, dur: 1.2 });
      var xlab = s.caption("NO Shares (x)", { coords: co, x: 5, y: -1, anchor: "top", align: "center", size: "1rem", color: PAL.muted });
      var ylab = s.caption("<div style='transform: rotate(-90deg)'>YES Shares (y)</div>", { coords: co, x: -1, y: 5, anchor: "center", align: "center", size: "1rem", color: PAL.muted });
      s.fadeIn(xlab, { at: 1.5, dur: 0.8 });
      s.fadeIn(ylab, { at: 1.5, dur: 0.8 });

      // True draw-on of hyperbola
      var pts = [];
      for (var xv = 2; xv <= 10; xv += 0.1) pts.push([xv, k / xv]);
      var curve = s.poly(pts, { coords: co, color: CY, width: 4 });
      s.draw(curve, { at: 4.5, dur: 3.0 });
      
      var priceDot = s.dot({ coords: co, x: 2.5, y: k / 2.5, r: 8, color: PAL.white });
      s.hide(priceDot, 0);
      s.show(priceDot, 20);
      var sweepFn = function(tau) {
          var sweep = (Math.sin(tau * Math.PI * 2.5 - Math.PI/2) + 1) / 2; 
          var currX = lerp(2.5, 8, E.inOut(sweep));
          return { x: currX, y: k / currX };
      };
      s.moveAlong(priceDot, sweepFn, { coords: co, at: 20, dur: 35, ease: window.LabAnim.ease.linear });

      s.canvas(function(lt, ctx, h) {
        // Gradient fill under curve
        if (lt > 4.5) {
           var drawP = clamp01((lt - 4.5) / 3.0);
           var xEnd = 2 + (8 * drawP);

           var polyGrad = ctx.createLinearGradient(0, co.y(10), 0, co.y(0));
           polyGrad.addColorStop(0, h.rgba(CY, 0.2 * drawP));
           polyGrad.addColorStop(1, h.rgba(CY, 0.0));
           ctx.fillStyle = polyGrad;
           ctx.beginPath();
           var first = true;
           for (var x = 2; x <= xEnd; x += 0.1) {
              var px = co.x(x), py = co.y(k / x);
              if (first) { ctx.moveTo(px, py); first = false; }
              else ctx.lineTo(px, py);
           }
           ctx.lineTo(co.x(xEnd), co.y(0));
           ctx.lineTo(co.x(2), co.y(0));
           ctx.closePath();
           ctx.fill();
        }

        // The sweeping tangent line (Price Discovery)
        if (lt > 20) {
           var fade20 = clamp01((lt - 20) / 0.5);
           ctx.globalAlpha = fade20;

           var slideP = clamp01((lt - 20) / 35); 
           var sweep = (Math.sin(slideP * Math.PI * 2.5 - Math.PI/2) + 1) / 2; 
           var currX = lerp(2.5, 8, E.inOut(sweep));
           var currY = k / currX;

           var slope = -k / (currX * currX);
           var tx1 = currX - 3, ty1 = currY - 3 * slope;
           var tx2 = currX + 3, ty2 = currY + 3 * slope;

           ctx.shadowBlur = 10; ctx.shadowColor = AMB;
           ctx.strokeStyle = AMB; ctx.lineWidth = 3;
           ctx.beginPath(); ctx.moveTo(co.x(tx1), co.y(ty1)); ctx.lineTo(co.x(tx2), co.y(ty2)); ctx.stroke();
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = PAL.white;
           ctx.shadowBlur = 20; ctx.shadowColor = PAL.white;
           ctx.beginPath(); ctx.arc(co.x(currX), co.y(currY), 8, 0, Math.PI*2); ctx.fill();
           ctx.shadowBlur = 0;
           
           var price = Math.abs(slope); 
           var prob = (price / (1 + price)) * 100;

           ctx.fillStyle = AMB; ctx.font = "bold 20px monospace";
           ctx.fillText("Probability: " + prob.toFixed(1) + "%", co.x(currX) + 20, co.y(currY) - 20);
           ctx.globalAlpha = 1;
        }
      });

      lower(s, "So stop assigning the work and price it instead. Will this bug be fixed by Friday?", 2.0, { out: 22.5 });
      lower(s, "An automated market maker always quotes a price, so there is always someone to trade against.", 17.0, { out: 45 });
      lower(s, "And the slope of that curve is the crowd's probability that the work gets done.", 32.0, { out: 67.5 });
      lower(s, "If nobody is working on it, the price is cheap. Cheap is the signal to act.", 47.0);
    }, { subtitle: "Continuous automated market makers" });
  }

  function sceneInsiderTrading(film) {
    film.scene("Skin in the Game", 112.5, function(s) {
      var k3 = 20;
      var co3 = film.coords({ xRange: [0, 10], yRange: [0, 10], pad: { left: 340, right: 480, top: 150, bottom: 250 } });
      var ax3 = s.axes(co3, { grid: false });
      s.draw(ax3, { at: 1.0, dur: 1.0 });
      var pts3 = [];
      for (var x = 2; x <= 10; x += 0.2) pts3.push([x, k3 / x]);
      var curve3 = s.poly(pts3, { coords: co3, color: CY, width: 2 });
      s.draw(curve3, { at: 1.5, dur: 1.5 });
      
      var pDot = s.dot({ coords: co3, x: 8, y: k3 / 8, r: 5, color: AMB });
      s.fadeIn(pDot, { at: 3.0, dur: 0.5 });
      
      s.moveAlong(pDot, function(tau) {
          var currX = lerp(8, 2, tau);
          return { x: currX, y: k3 / currX };
      }, { coords: co3, at: 54, dur: 6.0, ease: E.inOut });
      
      var payCoin = s.dot({ coords: co3, x: 2, y: 10, r: 24, color: AMB });
      s.hide(payCoin, 0); s.show(payCoin, 60);
      s.move(payCoin, { toX: 750, toY: 220, at: 60, dur: 8, ease: E.out });
      
      var payTxt = s.caption("<strong style='color:#000'>$1000</strong>", { coords: co3, x: 2, y: 10, size: "16px", anchor: "center" });
      s.hide(payTxt, 0); s.show(payTxt, 60);
      s.move(payTxt, { toX: 750, toY: 220, at: 60, dur: 8, ease: E.out });
      
      // the cost tag departs 2.5s behind the payout so the two texts never
      // ride the same stretch of the path at the same moment
      var costTxt = s.caption("<strong style='color:" + RED + "'>- $100</strong>", { coords: co3, x: 2, y: 12, size: "14px", anchor: "center" });
      s.hide(costTxt, 0); s.show(costTxt, 62.5);
      s.move(costTxt, { toX: 750, toY: 245, at: 62.5, dur: 6.5, ease: E.out });
      
      var profTxt = s.caption("<strong style='color:" + GRN + "'>PROFIT: $900 (Bounty)</strong>", { px: 650, py: 180, size: "20px" });
      s.hide(profTxt, 0);
      s.morph(payTxt, profTxt, { at: 68, dur: 1.0 });
      s.fadeOut(costTxt, { at: 68, dur: 1.0 });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // The Smart Contract Core (Glowing center)
        var coreX = 200, coreY = 300;
        var corePulse = Math.abs(Math.sin(lt*3));
        
        ctx.shadowBlur = 40 + 20*corePulse; ctx.shadowColor = h.rgba(CY, 0.4);
        
        var coreGrad = ctx.createLinearGradient(coreX - 100, coreY - 150, coreX + 100, coreY + 150);
        coreGrad.addColorStop(0, h.rgba(CY, 0.15 + 0.1*corePulse));
        coreGrad.addColorStop(1, h.rgba(CY, 0.02));
        
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(coreX - 100, coreY - 150, 200, 300, 16); else ctx.rect(coreX - 100, coreY - 150, 200, 300);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = h.rgba(CY, 0.8); ctx.lineWidth = 2; ctx.stroke();
        
      ctx.fillStyle = PAL.white; ctx.font = "bold 16px 'JetBrains Mono', monospace"; 
        ctx.fillText("BOUNTY CONTRACT", coreX - 70, coreY - 110);
        

        // The Developer
        var devX = 750, devY = 300;
        ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(devX, devY, 18, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = PAL.white; ctx.font = "14px monospace"; ctx.fillText("Developer", devX - 35, devY + 40);

        // Phase 1: Capital Transfer (Buying Shares) — a brisk, eased hop
        if (lt > 4 && lt < 20) {
           var fade4 = clamp01((lt - 4) / 0.5);
           var buyP = clamp01((lt - 4) / 3.5);
           var coinX = lerp(devX, coreX + 100, E.inOut(buyP));
           var coinY = devY - 50;
           
           if (buyP < 1) {
              ctx.globalAlpha = op * fade4;
              // Glowing Capital particle
              ctx.shadowBlur = 15; ctx.shadowColor = AMB;
              ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(coinX, coinY, 8, 0, Math.PI*2); ctx.fill();
              ctx.shadowBlur = 0;
              ctx.fillStyle = PAL.white; ctx.font = "bold 14px monospace"; ctx.fillText("$100", coinX + 15, coinY + 5);
           } else {
              // Shares acquired
              var fadeAcq = clamp01((lt - 7.5) / 0.5);
              ctx.globalAlpha = op * fadeAcq;
              ctx.fillStyle = AMB; ctx.font = "bold 18px monospace";
              ctx.fillText("YES Shares: 1000", coreX - 80, coreY + 50);
              ctx.fillText("Price: $0.10", coreX - 80, coreY + 80);
           }
           ctx.globalAlpha = op;
        }

        // Phase 2: Work (Matrix typing effect)
        if (lt > 20) {
           var fade20 = clamp01((lt - 20) / 0.5);
           ctx.globalAlpha = op * fade20;
           ctx.fillStyle = AMB; ctx.font = "bold 18px monospace";
           ctx.fillText("YES Shares: 1000", coreX - 80, coreY + 50);
           ctx.fillText("Price: $0.10", coreX - 80, coreY + 80);
           
           if (lt < 45) {
               var fadeRain = (1 - clamp01((lt - 44.5) / 0.5));
               ctx.globalAlpha = op * fade20 * fadeRain;
               var typingP = Math.abs(Math.sin(lt * 15)); 
               ctx.fillStyle = h.rgba(GRN, 0.4 + 0.6 * typingP);
               ctx.fillRect(devX - 25, devY - 50, 50, 20); // keyboard flashing
               
               // Digital rain data flowing UP from keyboard (deterministic in
               // lt so every seek renders the same frame — engine contract)
               var numStreams = 5;
               for(var si=0; si<numStreams; si++) {
                  var streamY = devY - 60 - (((lt * 40) + si*30) % 150);
                  var streamAlpha = 1 - (devY - 60 - streamY)/150;
                  ctx.fillStyle = h.rgba(GRN, streamAlpha);
                  ctx.font = "10px monospace";
                  ctx.fillText(Math.sin(Math.floor(lt * 8) * 13.37 + si * 7) > 0 ? "1" : "0", devX - 20 + si*10, streamY);
               }
           }

           // Sending the PR
           if (lt > 38 && lt < 50) {
              var pushP = clamp01((lt - 38) / 7);
              var prX = lerp(devX, coreX + 100, E.inOut(pushP));
              var fadePR = clamp01((lt - 38) / 0.5) * (1 - clamp01((lt - 49.5) / 0.5));
              ctx.globalAlpha = op * fadePR;
              
              ctx.shadowBlur = 15; ctx.shadowColor = GRN;
              ctx.fillStyle = GRN; ctx.fillRect(prX, devY + 50, 40, 25);
              ctx.shadowBlur = 0;
              ctx.fillStyle = "#000"; ctx.font = "bold 14px monospace"; ctx.fillText("PR", prX+10, devY+67);
           }
           ctx.globalAlpha = op;
        }

        // Phase 3: Oracle Resolution & Massive Payout
        if (lt > 50) {
           var fade50 = clamp01((lt - 50) / 0.5);
           ctx.globalAlpha = op * fade50;
           // Oracle pulse
           var flash = clamp01(1 - (lt - 50)/2);
           ctx.globalCompositeOperation = "screen";
           ctx.fillStyle = h.rgba(PURP, flash);
           ctx.fillRect(coreX - 120, coreY - 170, 240, 340);
           ctx.globalCompositeOperation = "source-over";
           
           ctx.fillStyle = PURP; ctx.font = "bold 22px 'JetBrains Mono'";
           ctx.fillText("ORACLE: RESOLVED", coreX - 90, coreY - 30);

           if (lt > 54) {
               var fade54 = clamp01((lt - 54) / 0.5);
               ctx.globalAlpha = op * fade50 * fade54;
               ctx.fillStyle = GRN; ctx.font = "bold 24px monospace";
               ctx.fillText("Price: $1.00", coreX - 80, coreY + 120); 
            }
         }
         ctx.globalAlpha = 1;
      });

      lower(s, "A developer who knows they can fix it buys in quietly at ten cents.", 2.0, { out: 27 });
      lower(s, "Then they do the work. Effort moves a price they hold, so the payoff tracks the contribution.", 22.0, { out: 69 });
      lower(s, "The merge is asserted to an oracle with a bond. Unchallenged, it settles at one.", 48.0, { out: 87 });
      
      var finalBeat = s.caption("Past a certain scale (a million agents, most of them not human) coordination stops being a role you can hire for. The only manager that scales is a price.", { px: 480, py: 100, anchor: "center", align: "center", size: "1rem", color: PAL.white });
      s.fadeIn(finalBeat, { at: 75, dur: 2 });

      lower(s, "Nobody assigned that bounty. A price discovered it. Which leaves the question this lab keeps returning to: when no one is in charge, who verifies the claim?", 60.0);
    }, { subtitle: "Aligning incentives with truth" });
  }


  function sceneAgentLoop(film) {
    film.scene("Who Verifies the Claim", 80, function(s) {
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
            ctx.fillStyle = h.rgba(RED, 0.9);
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
              ctx.fillStyle = h.rgba(RED, 0.95);
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
          ctx.fillText("price discovers what to do", 250, 438);
          ctx.fillStyle = h.rgba(CY, 0.95);
          ctx.fillText("verification decides what was done", 250, 466);
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
