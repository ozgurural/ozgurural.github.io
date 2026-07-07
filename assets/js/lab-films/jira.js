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
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "65%", size: o.size, panel: true });
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
        
        // 3D Isometric Grid
        ctx.strokeStyle = h.rgba(CY, 0.15);
        ctx.lineWidth = 1;
        var cx = 480, cy = 250;
        for(var i=-4; i<=4; i++) {
           ctx.beginPath(); ctx.moveTo(cx - 300 + i*50, cy + 150 + i*25); ctx.lineTo(cx + 300 + i*50, cy - 150 + i*25); ctx.stroke();
           ctx.beginPath(); ctx.moveTo(cx - 300 + i*50, cy - 150 - i*25); ctx.lineTo(cx + 300 + i*50, cy + 150 - i*25); ctx.stroke();
        }

        // The Central Manager (Bottleneck)
        var managerPulse = Math.abs(Math.sin(lt * 2));
        ctx.fillStyle = lt > 25 ? RED : CY;
        ctx.beginPath(); ctx.arc(cx, cy - 100, 10 + 2*managerPulse, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "12px monospace";
        ctx.fillText("Central Manager", cx + 20, cy - 105);
        
        // Tickets flowing up (Very slow)
        var tickets = 15;
        for (var t=0; t<tickets; t++) {
           var tStart = t * 1.5;
           if (lt > tStart) {
              var p = clamp01((lt - tStart) / 10); // Takes 10 seconds to move up
              var startY = cy + 150;
              var currentY = lerp(startY, cy - 90, E.inOut(p));
              var currentX = cx;

              // Traffic jam physics
              if (lt > 20) {
                 var jamDist = Math.max(0, 150 - (lt - 20)*5); // Squeezes
                 if (currentY < cy - 100 + jamDist + (t*8)) {
                    currentY = cy - 100 + jamDist + (t*8);
                 }
              }

              ctx.fillStyle = lt > 20 ? RED : GRN;
              ctx.beginPath(); ctx.arc(currentX, currentY, 4, 0, Math.PI*2); ctx.fill();
           }
        }

        // Network Failure
        if (lt > 30) {
           var alpha = clamp01((lt - 30)/2);
           ctx.fillStyle = h.rgba(RED, alpha);
           ctx.font = "bold 24px 'JetBrains Mono'";
           ctx.fillText("BOTTLENECK DETECTED", cx - 120, cy - 150);
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Global engineering requires massive coordination. But centralized management becomes a bottleneck.", 2.0, { out: 12.0 });
      lower(s, "A manager can only assign, review, and merge so many tickets before the system stalls.", 13.0, { out: 24.0 });
      lower(s, "As the open-source network scales to thousands of developers, the pyramid collapses.", 25.0, { out: 34.0 });
      lower(s, "We need a system with no manager. We need math.", 35.0);
    });
  }

  function sceneAMM(film) {
    film.scene("The AMM Geometry", 60, function(s) {
      // The math slowly types out over 10 seconds
      var eq = s.tex2("x \\cdot y = k", { px: 150, py: 100, size: "1.8rem", color: CY });
      s.fadeIn(eq, { at: 1.0, dur: 3.0 });
      
      var eq2 = s.tex2("P_{yes} = \\frac{y}{x}", { px: 700, py: 100, size: "1.8rem", color: AMB });
      s.fadeIn(eq2, { at: 15.0, dur: 3.0 });

      var co = film.coords({ xRange: [0, 10], yRange: [0, 10], pad: { left: 400, right: 150, top: 150, bottom: 150 } });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        var ax = s.axes(co, { grid: true, xLabel: "NO Shares (x)", yLabel: "YES Shares (y)" });
        ax(ctx, h);

        // Slow drawing of the curve over 10 seconds
        if (lt > 5) {
           var drawP = clamp01((lt - 5) / 10);
           var pts = [];
           var k = 20;
           for(var x = 2; x <= 2 + (8 * drawP); x+=0.1) {
              pts.push([x, k/x]);
           }
           if (pts.length > 0) {
               var curve = s.poly(pts, { coords: co, color: CY, width: 3 });
               curve(ctx, h);
           }

           // The sliding tangent line
           if (lt > 18) {
              var slideP = clamp01((lt - 18) / 30); // Slides back and forth for 30 seconds
              // Sine wave motion to show both extremes
              var sweep = (Math.sin(slideP * Math.PI * 2 - Math.PI/2) + 1) / 2; // 0 to 1 to 0
              var currX = lerp(2.5, 8, E.inOut(sweep));
              var currY = k / currX;

              // Tangent derivative dy/dx = -k / x^2
              var slope = -k / (currX * currX);
              var tPts = [ [currX - 2, currY - 2*slope], [currX + 2, currY + 2*slope] ];
              var tangent = s.poly(tPts, { coords: co, color: AMB, width: 2 });
              tangent(ctx, h);

              // Current Price Point
              ctx.fillStyle = AMB;
              ctx.beginPath(); ctx.arc(co.x(currX), co.y(currY), 6, 0, Math.PI*2); ctx.fill();
              
              var price = Math.abs(slope); // Price is ratio
              var prob = (price / (1 + price)) * 100;

              ctx.fillStyle = "#fff"; ctx.font = "16px monospace";
              ctx.fillText("Probability: " + prob.toFixed(1) + "%", co.x(currX) + 15, co.y(currY) - 15);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Instead of a Jira ticket, we launch a Prediction Market: 'Will Bug X be fixed by Friday?'", 1.5, { out: 12.0 });
      lower(s, "The market is governed by a Constant Product Market Maker. The curve ensures infinite liquidity.", 13.0, { out: 24.0 });
      lower(s, "The slope of the tangent line at any point represents the exact probability of the bug being fixed.", 25.0, { out: 40.0 });
      lower(s, "If nobody is working on it, the price is cheap. This creates an enormous financial incentive.", 42.0);
    });
  }

  function sceneInsiderTrading(film) {
    film.scene("Work as Insider Trading", 75, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // The Smart Contract Balance
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(100, 150, 250, 300);
        ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.strokeRect(100, 150, 250, 300);
        ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.fillText("Bounty Contract", 120, 180);

        // Phase 1: The Developer Buys Shares (0 - 20s)
        var devX = 600, devY = 350;
        ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(devX, devY, 15, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "14px monospace"; ctx.fillText("Developer", devX - 35, devY + 30);

        if (lt > 4 && lt < 20) {
           var buyP = clamp01((lt - 4) / 10);
           var coinX = lerp(devX, 350, E.in(buyP));
           var coinY = lerp(devY, 250, E.in(buyP));
           
           if (buyP < 1) {
              ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(coinX, coinY, 6, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = "#fff"; ctx.font = "12px monospace"; ctx.fillText("$100", coinX + 10, coinY);
           } else {
              ctx.fillStyle = AMB; ctx.fillText("YES Shares: 1000", 120, 220);
              ctx.fillText("Price: $0.10", 120, 240);
           }
        }

        // Phase 2: Writing and Pushing Code (20 - 45s)
        if (lt > 20) {
           ctx.fillStyle = AMB; ctx.fillText("YES Shares: 1000", 120, 220);
           ctx.fillText("Price: $0.10", 120, 240);
           
           if (lt < 40) {
               var typingP = Math.abs(Math.sin(lt * 10)); // rapid typing
               ctx.fillStyle = h.rgba(GRN, 0.5 + 0.5 * typingP);
               ctx.fillRect(devX - 20, devY - 40, 40, 20); // keyboard
               
               // Blocks of code floating up
               var codeY = 300 - ((lt * 30) % 150);
               ctx.fillStyle = h.rgba(GRN, 0.4); ctx.fillRect(devX - 10, codeY, 20, 20);
           }

           if (lt > 35 && lt < 45) {
              var pushP = clamp01((lt - 35) / 5);
              var prX = lerp(devX, 350, E.inOut(pushP));
              ctx.fillStyle = GRN; ctx.fillRect(prX, 300, 30, 20);
              ctx.fillStyle = "#000"; ctx.fillText("PR", prX+5, 315);
           }
        }

        // Phase 3: Oracle Verification and Payout (45 - 75s)
        if (lt > 45) {
           ctx.fillStyle = GRN; ctx.fillRect(320, 290, 30, 20); // merged PR
           
           var flash = clamp01(1 - (lt - 45)/2);
           ctx.fillStyle = h.rgba(PURP, flash);
           ctx.fillRect(100, 150, 250, 300); // Oracle confirmation flash
           
           ctx.fillStyle = PURP; ctx.font = "bold 16px monospace";
           ctx.fillText("ORACLE: MERGED", 120, 280);

           if (lt > 52) {
              ctx.fillStyle = GRN; ctx.font = "bold 20px monospace";
              ctx.fillText("Price: $1.00", 120, 320); // Price shoots to 1.00
              
              if (lt > 58) {
                 var payP = clamp01((lt - 58) / 10);
                 var payX = lerp(350, devX, E.out(payP));
                 var payY = lerp(300, devY - 50, E.out(payP));
                 
                 ctx.fillStyle = AMB; ctx.beginPath(); ctx.arc(payX, payY, 15, 0, Math.PI*2); ctx.fill();
                 ctx.fillStyle = "#fff"; ctx.fillText("$1000", payX + 20, payY);

                 if (payP === 1) {
                    ctx.fillStyle = GRN; ctx.fillText("Profit: $900 (Bounty)", devX - 60, devY - 70);
                 }
              }
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Phase 1: A developer spots the bug. They know they can fix it, so they secretly buy YES shares at $0.10.", 2.0, { out: 18.0 });
      lower(s, "Phase 2: They spend the next week writing the code, effectively working as an 'insider' on their own success.", 20.0, { out: 42.0 });
      lower(s, "Phase 3: The Pull Request is merged. An Optimistic Oracle detects the merge and resolves the market to 100%.", 44.0, { out: 56.0 });
      lower(s, "The developer cashes out at $1.00. Their trading profit is precisely the bug bounty. No manager required.", 58.0);
    });
  }

  setTimeout(boot, 60);
})();
