/* =============================================================================
   jira.js — cinematic explainer: Prediction Markets for Global Coordination
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("jira-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build(); appendix();
  }

  var P = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = "#3b82f6", AMB = "#fbbf24", RED = "#fb7185", GRN = "#34d399", GREY = "#94a3b8", PURP = "#a78bfa";

  function lower(s, html, at, o) {
    o = o || {};
    // Pinned to exact bottom-left for full-width overlay bar
    var c = s.caption(html, { px: 0, py: 540, anchor: "bottom-left", align: "left", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 1.5 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 1.0 });
    return c;
  }

  function build() {
    var film = window.LabAnim.create("#jira-film", { width: 960, height: 540 });
    sceneCoordination(film);
    sceneAMM(film);
    sceneInsiderTrading(film);
    film.build();
    if (window.__LABDEBUG) window.__jiraFilm = film;
  }

  function sceneCoordination(film) {
    film.scene("The Coordination Problem", 45, function(s) {
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
        
        ctx.fillStyle = "#fff"; ctx.font = "14px 'JetBrains Mono'";
        ctx.fillText("CENTRAL MANAGER", cx + 30, cy - 100);
        
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
           
           ctx.shadowBlur = 20; ctx.shadowColor = RED;
           ctx.fillStyle = RED;
           ctx.font = "bold 32px 'JetBrains Mono'";
           ctx.fillText("SYSTEM BOTTLENECK", cx - 160, cy - 170);
           ctx.shadowBlur = 0;
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      });

      lower(s, "Global engineering requires massive coordination. But centralized management becomes a bottleneck.", 2.0, { out: 12.0 });
      lower(s, "A single manager can only assign, review, and merge so many tasks before the hierarchy stalls.", 13.0, { out: 24.0 });
      lower(s, "As an open-source network scales to thousands of global developers, the pyramid collapses completely.", 25.0, { out: 34.0 });
      lower(s, "We need a system with no manager. We need math.", 35.0);
    });
  }

  function sceneAMM(film) {
    film.scene("The AMM Geometry", 60, function(s) {
      // Slower equation typing
      var eq = s.tex2("x \\cdot y = k", { px: 150, py: 80, size: "2.2rem", color: CY });
      s.fadeIn(eq, { at: 1.0, dur: 4.0 });
      
      var eq2 = s.tex2("P = \\frac{y}{x}", { px: 750, py: 80, size: "2.2rem", color: AMB });
      s.fadeIn(eq2, { at: 18.0, dur: 4.0 });

      var co = film.coords({ xRange: [0, 10], yRange: [0, 10], pad: { left: 400, right: 150, top: 150, bottom: 150 } });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        var ax = s.axes(co, { grid: true, xLabel: "NO Shares (x)", yLabel: "YES Shares (y)" });
        ax(ctx, h);

        // Slow cinematic drawing of the curve
        if (lt > 5) {
           var drawP = clamp01((lt - 5) / 12); // Takes 12 seconds
           var pts = [];
           var k = 20;
           for(var x = 2; x <= 2 + (8 * drawP); x+=0.1) {
              pts.push([x, k/x]);
           }
           if (pts.length > 0) {
               ctx.shadowBlur = 15; ctx.shadowColor = CY;
               var curve = s.poly(pts, { coords: co, color: CY, width: 4 });
               curve(ctx, h);
               ctx.shadowBlur = 0;
               
               // Gradient fill under curve
               var bgPts = pts.slice();
               bgPts.push([2 + (8 * drawP), 0]);
               bgPts.push([2, 0]);
               
               var polyGrad = ctx.createLinearGradient(0, co.y(10), 0, co.y(0));
               polyGrad.addColorStop(0, h.rgba(CY, 0.2));
               polyGrad.addColorStop(1, h.rgba(CY, 0.0));
               var bgCurve = s.poly(bgPts, { coords: co, color: "transparent", fill: polyGrad });
               bgCurve(ctx, h);
           }

           // The sweeping tangent line (Price Discovery)
           if (lt > 20) {
              var slideP = clamp01((lt - 20) / 35); // Sweeps slowly for 35 seconds
              var sweep = (Math.sin(slideP * Math.PI * 2.5 - Math.PI/2) + 1) / 2; 
              var currX = lerp(2.5, 8, E.inOut(sweep));
              var currY = k / currX;

              var slope = -k / (currX * currX);
              var tPts = [ [currX - 3, currY - 3*slope], [currX + 3, currY + 3*slope] ];
              
              ctx.shadowBlur = 10; ctx.shadowColor = AMB;
              var tangent = s.poly(tPts, { coords: co, color: AMB, width: 3 });
              tangent(ctx, h);
              ctx.shadowBlur = 0;

              // Glowing Price Point
              ctx.fillStyle = "#fff";
              ctx.shadowBlur = 20; ctx.shadowColor = "#fff";
              ctx.beginPath(); ctx.arc(co.x(currX), co.y(currY), 8, 0, Math.PI*2); ctx.fill();
              ctx.shadowBlur = 0;
              
              var price = Math.abs(slope); // Price is derivative ratio
              var prob = (price / (1 + price)) * 100;

              ctx.fillStyle = AMB; ctx.font = "bold 20px monospace";
              ctx.fillText("Probability: " + prob.toFixed(1) + "%", co.x(currX) + 20, co.y(currY) - 20);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Instead of assigning a task, we launch a Prediction Market: 'Will Bug X be fixed by Friday?'", 2.0, { out: 15.0 });
      lower(s, "The market is governed by an Automated Market Maker (AMM). The continuous curve guarantees infinite liquidity.", 17.0, { out: 30.0 });
      lower(s, "The exact slope of the tangent line (the derivative) represents the market's belief in the probability of success.", 32.0, { out: 45.0 });
      lower(s, "If nobody is working on it, YES shares are mathematically cheap. This creates an enormous financial incentive to act.", 47.0);
    });
  }

  function sceneInsiderTrading(film) {
    film.scene("Work as Insider Trading", 75, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // The Smart Contract Core (Glowing center)
        var coreX = 200, coreY = 300;
        var corePulse = Math.abs(Math.sin(lt*3));
        
        ctx.shadowBlur = 40 + 20*corePulse; ctx.shadowColor = h.rgba(CY, 0.4);
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(coreX - 100, coreY - 150, 200, 300);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = h.rgba(CY, 0.8); ctx.lineWidth = 2; ctx.strokeRect(coreX - 100, coreY - 150, 200, 300);
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("BOUNTY CONTRACT", coreX - 70, coreY - 120);

        // The Developer
        var devX = 750, devY = 300;
        ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(devX, devY, 18, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "14px monospace"; ctx.fillText("Developer", devX - 35, devY + 40);

        // Phase 1: Capital Transfer (Buying Shares)
        if (lt > 4 && lt < 20) {
           var buyP = clamp01((lt - 4) / 12);
           var coinX = lerp(devX, coreX + 100, E.in(buyP));
           var coinY = devY - 50;
           
           if (buyP < 1) {
              // Glowing Capital particle
              ctx.shadowBlur = 15; ctx.shadowColor = AMB;
              ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(coinX, coinY, 8, 0, Math.PI*2); ctx.fill();
              ctx.shadowBlur = 0;
              ctx.fillStyle = "#fff"; ctx.font = "bold 14px monospace"; ctx.fillText("$100", coinX + 15, coinY + 5);
           } else {
              // Shares acquired
              ctx.fillStyle = AMB; ctx.font = "bold 18px monospace";
              ctx.fillText("YES Shares: 1000", coreX - 80, coreY + 50);
              ctx.fillText("Price: $0.10", coreX - 80, coreY + 80);
           }
        }

        // Phase 2: Work (Matrix typing effect)
        if (lt > 20) {
           ctx.fillStyle = AMB; ctx.font = "bold 18px monospace";
           ctx.fillText("YES Shares: 1000", coreX - 80, coreY + 50);
           ctx.fillText("Price: $0.10", coreX - 80, coreY + 80);
           
           if (lt < 45) {
               var typingP = Math.abs(Math.sin(lt * 15)); 
               ctx.fillStyle = h.rgba(GRN, 0.4 + 0.6 * typingP);
               ctx.fillRect(devX - 25, devY - 50, 50, 20); // keyboard flashing
               
               // Digital rain data flowing UP from keyboard
               var numStreams = 5;
               for(var s=0; s<numStreams; s++) {
                  var streamY = devY - 60 - (((lt * 40) + s*30) % 150);
                  var streamAlpha = 1 - (devY - 60 - streamY)/150;
                  ctx.fillStyle = h.rgba(GRN, streamAlpha); 
                  ctx.font = "10px monospace";
                  ctx.fillText(Math.random() > 0.5 ? "1" : "0", devX - 20 + s*10, streamY);
               }
           }

           // Sending the PR
           if (lt > 38 && lt < 50) {
              var pushP = clamp01((lt - 38) / 7);
              var prX = lerp(devX, coreX + 100, E.inOut(pushP));
              
              ctx.shadowBlur = 15; ctx.shadowColor = GRN;
              ctx.fillStyle = GRN; ctx.fillRect(prX, devY + 50, 40, 25);
              ctx.shadowBlur = 0;
              ctx.fillStyle = "#000"; ctx.font = "bold 14px monospace"; ctx.fillText("PR", prX+10, devY+67);
           }
        }

        // Phase 3: Oracle Resolution & Massive Payout
        if (lt > 50) {
           // Oracle pulse
           var flash = clamp01(1 - (lt - 50)/2);
           ctx.globalCompositeOperation = "screen";
           ctx.fillStyle = h.rgba(PURP, flash);
           ctx.fillRect(coreX - 120, coreY - 170, 240, 340);
           ctx.globalCompositeOperation = "source-over";
           
           ctx.fillStyle = PURP; ctx.font = "bold 22px 'JetBrains Mono'";
           ctx.fillText("ORACLE: RESOLVED", coreX - 90, coreY - 30);

           if (lt > 54) {
              // Price shoots up
              ctx.fillStyle = GRN; ctx.font = "bold 24px monospace";
              ctx.fillText("Price: $1.00", coreX - 80, coreY + 120); 
              
              // Explosive capital return
              if (lt > 60) {
                 var payP = clamp01((lt - 60) / 8);
                 var payX = lerp(coreX + 100, devX, E.out(payP));
                 var payY = lerp(devY - 50, devY - 80, E.out(payP));
                 
                 ctx.shadowBlur = 30; ctx.shadowColor = AMB;
                 ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(payX, payY, 20, 0, Math.PI*2); ctx.fill();
                 ctx.shadowBlur = 0;
                 
                 ctx.fillStyle = "#000"; ctx.font = "bold 16px monospace"; ctx.fillText("$1000", payX - 22, payY + 5);

                 if (payP === 1) {
                    // Celebration glow
                    ctx.shadowBlur = 20; ctx.shadowColor = GRN;
                    ctx.fillStyle = GRN; ctx.font = "bold 20px 'JetBrains Mono'";
                    ctx.fillText("PROFIT: $900 (Bounty)", devX - 100, devY - 120);
                    ctx.shadowBlur = 0;
                 }
              }
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Phase 1: A developer spots the bug. They know they can fix it, so they secretly buy YES shares at $0.10.", 2.0, { out: 18.0 });
      lower(s, "Phase 2: They spend the next week writing code, effectively working as an 'insider' on their own success.", 22.0, { out: 46.0 });
      lower(s, "Phase 3: The PR is merged. An Optimistic Oracle detects the cryptographic merge and resolves the market to 100%.", 48.0, { out: 58.0 });
      lower(s, "The developer cashes out at $1.00. Their massive trading profit is precisely the bug bounty. No manager required.", 60.0);
    });
  }

  setTimeout(boot, 60);
})();
