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
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__jiraFilm = film;
  }

  function sceneCoordination(film) {
    film.scene("The Coordination Problem", 67.5, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // Advanced 3D Glowing Matrix Grid
        ctx.lineWidth = 1;
        var cx = 480, cy = 250;

        ctx.globalCompositeOperation = "screen";
        for(var i=-5; i<=5; i++) {
           var alpha = 0.15 * (1 - Math.abs(i)/6);
           ctx.strokeStyle = h.rgba(CY, alpha);
           ctx.beginPath(); ctx.moveTo(cx - 400 + i*60, cy + 200 + i*30); ctx.lineTo(cx + 400 + i*60, cy - 200 + i*30); ctx.stroke();
           ctx.beginPath(); ctx.moveTo(cx - 400 + i*60, cy - 200 - i*30); ctx.lineTo(cx + 400 + i*60, cy + 200 - i*30); ctx.stroke();
        }

        // The Central Manager (Glowing Node)
        var managerPulse = Math.abs(Math.sin(lt * 2));
        ctx.shadowBlur = 20 + 10 * managerPulse;
        ctx.shadowColor = lt > 25 ? RED : CY;
        ctx.fillStyle = lt > 25 ? RED : CY;
        ctx.beginPath(); ctx.arc(cx, cy - 100, 12 + 4*managerPulse, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        
      ctx.fillStyle = PAL.white; ctx.font = "bold 14px 'JetBrains Mono', monospace";
        ctx.fillText("CENTRAL MANAGER", cx + 30, cy - 95);
        
        
        // Smooth Flowing Tickets (Bezier paths with glowing trails)
        var tickets = 25;
        for (var t=0; t<tickets; t++) {
           var tStart = t * 1.0;
           if (lt > tStart) {
              var p = clamp01((lt - tStart) / 12); 
              
              // Base start points spread across the bottom
              var startX = cx - 300 + (t*25);
              var startY = cy + 180;
              
              // Current position via Bezier curve
              var controlX = cx + (Math.sin(t) * 100);
              var controlY = cy + 50;
              
              function getNodePos(p_val, time_val) {
                 var omt = 1 - p_val;
                 var x = omt*omt*startX + 2*omt*p_val*controlX + p_val*p_val*cx;
                 var y = omt*omt*startY + 2*omt*p_val*controlY + p_val*p_val*(cy - 90);
                 
                 if (time_val > 20) {
                     var jamRadius = 25 + (t * 2.5); // form rings
                     var dx = x - cx;
                     var dy = y - (cy - 100);
                     var dist = Math.sqrt(dx*dx + dy*dy);
                     if (dist < jamRadius) {
                         var angle = Math.atan2(dy, dx);
                         angle += Math.sin(time_val * 4 + t) * 0.2; // jitter
                         x = cx + Math.cos(angle) * jamRadius;
                         y = (cy - 100) + Math.sin(angle) * jamRadius;
                     }
                 }
                 return {x: x, y: y};
              }

              var curr = getNodePos(p, lt);
              var currentX = curr.x, currentY = curr.y;

              // Glow effect
              var tAlpha = (p < 0.1) ? p*10 : (p > 0.9 && lt <= 20) ? (1-p)*10 : 1.0;
              ctx.shadowBlur = 15;
              ctx.shadowColor = lt > 20 ? RED : GRN;
              ctx.fillStyle = h.rgba(lt > 20 ? RED : GRN, tAlpha);
              ctx.beginPath(); ctx.arc(currentX, currentY, 4, 0, Math.PI*2); ctx.fill();
              
              // Trail
              if (p > 0.05 && p < 1.0) {
                 ctx.shadowBlur = 0;
                 ctx.strokeStyle = h.rgba(lt > 20 ? RED : GRN, tAlpha * 0.3);
                 ctx.lineWidth = 2;
                 ctx.beginPath();
                 ctx.moveTo(currentX, currentY);
                 var pastP = Math.max(0, p - 0.05);
                 var past = getNodePos(pastP, lt - 0.05*12);
                 ctx.lineTo(past.x, past.y);
                 ctx.stroke();
              }
           }
        }

        // Catastrophic Network Failure
        if (lt > 30) {
           var alpha = clamp01((lt - 30)/3);
           ctx.fillStyle = h.rgba(RED, alpha * 0.15);
           ctx.fillRect(0,0,960,540); // Flash screen red
           
           var botFade = clamp01((lt - 30) / 0.5);
           ctx.globalAlpha = op * botFade;
           ctx.shadowBlur = 20; ctx.shadowColor = RED;
           ctx.fillStyle = RED;
           ctx.font = "bold 32px 'JetBrains Mono'";
           ctx.fillText("SYSTEM BOTTLENECK", cx - 160, cy - 170);
           ctx.globalAlpha = op;
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      });

      lower(s, "I learned decentralized coordination on the Aegean — forty boats, no race director steering them...", 2.0, { out: 18 });
      lower(s, "...order emerging from local decisions and shared rules.", 13.0, { out: 36 });
      lower(s, "Software is trying to do the same thing at global scale, with agents that never sleep and increasingly aren't human.", 25.0, { out: 51 });
      lower(s, "A single manager is the thing that doesn't scale.", 35.0);
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

      lower(s, "Instead of assigning a task, we launch a Prediction Market: 'Will Bug X be fixed by Friday?'", 2.0, { out: 22.5 });
      lower(s, "The market is governed by an Automated Market Maker (AMM). The continuous curve guarantees a counterparty at every price.", 17.0, { out: 45 });
      lower(s, "The exact slope of the tangent line (the derivative) represents the market's belief in the probability of success.", 32.0, { out: 67.5 });
      lower(s, "If nobody is working on it, YES shares are mathematically cheap. This creates an enormous financial incentive to act.", 47.0);
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

      lower(s, "Phase 1: A developer spots the bug. They know they can fix it, so they secretly buy YES shares at $0.10.", 2.0, { out: 27 });
      lower(s, "Phase 2: They spend the next week writing code. Effort moves a price you own, so profit is the reward for doing the real work.", 22.0, { out: 69 });
      lower(s, "Phase 3: The PR is merged. Anyone asserts this to an Optimistic Oracle with a bond; unchallenged, the market resolves to 100%.", 48.0, { out: 87 });
      
      var finalBeat = s.caption("Past a certain scale — a million agents, most of them not human — coordination stops being a role you can hire for. The only manager that scales is a price.", { px: 480, py: 100, anchor: "center", align: "center", size: "1rem", color: PAL.white });
      s.fadeIn(finalBeat, { at: 75, dur: 2 });

      lower(s, "The developer cashes out at $1.00. Their massive trading profit is precisely the bug bounty.", 60.0);
    }, { subtitle: "Aligning incentives with truth" });
  }

  setTimeout(boot, 60);
})();
