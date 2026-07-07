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
  var CY = "#36d6e7", AMB = "#fbbf24", RED = "#fb7185", GRN = "#34d399", GREY = "#94a3b8", TEAL = "#2dd4bf", MAG = "#ec4899", INDIGO = "#818cf8";

  function lower(s, html, at, o) {
    o = o || {};
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.5 });
    return c;
  }

  // Draw a smooth glowing particle along a path
  function glowDot(ctx, x, y, color, radius, blur) {
    ctx.shadowBlur = blur || 15;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, radius || 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Project 3D to 2D isometric
  function projector(cx, cy, sx, sy, sz) {
    return function (x, y, z) {
      return [cx + (x - y) * sx, cy + (x + y) * sy - z * sz];
    };
  }

  function build() {
    var film = window.LabAnim.create("#jira-film", { width: 960, height: 540 });
    sceneCoordination(film);
    sceneAMM(film);
    sceneInsider(film);
    film.build();
    if (window.__LABDEBUG) window.__jiraFilm = film;
  }

  function sceneCoordination(film) {
    film.scene("The Coordination Problem", 15, function(s) {
      var proj = projector(480, 200, 100, 50, 100);
      
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt / 1.5);
        ctx.globalAlpha = op;

        // Draw a centralized network grid
        var p0 = proj(-2, -2, 0), p1 = proj(2, -2, 0), p2 = proj(2, 2, 0), p3 = proj(-2, 2, 0);
        ctx.strokeStyle = h.rgba(CY, 0.15); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.closePath(); ctx.stroke();

        for (var i = -1.5; i <= 1.5; i += 1.5) {
          var l1a = proj(i, -2, 0), l1b = proj(i, 2, 0);
          var l2a = proj(-2, i, 0), l2b = proj(2, i, 0);
          ctx.beginPath(); ctx.moveTo(l1a[0], l1a[1]); ctx.lineTo(l1b[0], l1b[1]); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(l2a[0], l2a[1]); ctx.lineTo(l2b[0], l2b[1]); ctx.stroke();
        }

        // Central Manager Node
        var pCenter = proj(0, 0, 0);
        var managerZ = lt > 6 ? 0.3 * Math.sin(lt * 10) : 0; // vibrating
        var pMan = proj(0, 0, managerZ);
        
        ctx.beginPath(); ctx.moveTo(pCenter[0], pCenter[1]); ctx.lineTo(pMan[0], pMan[1]);
        ctx.strokeStyle = h.rgba(lt > 6 ? RED : CY, 0.5); ctx.stroke();
        glowDot(ctx, pMan[0], pMan[1], lt > 6 ? RED : CY, 8, 20);

        // Tickets moving to the center
        var tickets = [
          {x: -2, y: -2, start: 2, dur: 3},
          {x: 2, y: -2, start: 3, dur: 3},
          {x: -2, y: 2, start: 3.5, dur: 3},
          {x: 2, y: 2, start: 4.5, dur: 3},
          {x: 0, y: -2, start: 5, dur: 2},
          {x: -2, y: 0, start: 5.5, dur: 2}
        ];

        var jammed = 0;
        tickets.forEach(function(t) {
          if (lt > t.start) {
            var prog = clamp01((lt - t.start) / t.dur);
            if (lt > 6) prog = Math.min(prog, 0.7 + Math.random()*0.05); // bottleneck
            if (prog > 0.6) jammed++;
            
            var cx = lerp(t.x, 0, E.out(prog));
            var cy = lerp(t.y, 0, E.out(prog));
            var pt = proj(cx, cy, 0);
            
            ctx.beginPath(); ctx.moveTo(proj(t.x, t.y, 0)[0], proj(t.x, t.y, 0)[1]); ctx.lineTo(pt[0], pt[1]);
            ctx.strokeStyle = h.rgba(INDIGO, 0.4); ctx.lineWidth = 2; ctx.stroke();
            
            glowDot(ctx, pt[0], pt[1], lt > 6 ? AMB : GRN, 4, 10);
          }
        });

        if (lt > 6) {
          ctx.fillStyle = h.rgba(RED, 0.8 * Math.abs(Math.sin(lt * 4)));
          ctx.font = "italic 16px monospace";
          ctx.fillText("BOTTLENECK: " + jammed + " TICKETS QUEUED", 600, 150);
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Global engineering requires massive coordination. But centralized management becomes a bottleneck.", 1.5, { maxWidth: "80%" });
      lower(s, "Instead of a manager assigning tickets, we use the mathematics of decentralized exchanges.", 8.0);
    }, { subtitle: "THE UNIVERSAL JIRA" });
  }

  function sceneAMM(film) {
    film.scene("The AMM Geometry", 20, function(s) {
      var co = film.coords({ xRange: [0, 10], yRange: [0, 10], pad: { left: 120, right: 380, top: 100, bottom: 100 } });
      
      var ax = s.axes(co, { grid: true, xLabel: "YES Pool ($x$)", yLabel: "NO Pool ($y$)" });
      s.draw(ax, { at: 0.5, dur: 1.5 });

      var k = 20;
      var pts = [];
      for(var x=2.0; x<=10; x+=0.1) { pts.push([x, k/x]); }
      var curve = s.poly(pts, { coords: co, color: CY, width: 3 });
      s.draw(curve, { at: 2.0, dur: 2.5 });

      var eq = s.tex2("x \\times y = k", { px: 680, py: 150, size: "2rem", color: CY });
      s.fadeIn(eq, { at: 3.5, dur: 1.0 });

      var slopeEq = s.tex2("p_{yes} = \\frac{y}{x+y}", { px: 680, py: 220, size: "1.5rem", color: AMB });
      s.fadeIn(slopeEq, { at: 8.5, dur: 1.0 });

      s.canvas(function(lt, ctx, h) {
        if (lt < 4.5) return;
        var pSweep = clamp01((lt - 4.5) / 12);
        // Start at equilibrium x=4.47, y=4.47. Price = 0.5
        // Dev buys YES. x goes down, y goes up.
        // Wait, if dev buys YES, they put in USDC, take out YES. So YES pool decreases.
        // Move from x=7 (price low) to x=2.5 (price high)
        var curX = lerp(7, 2.5, E.inOut(pSweep));
        var curY = k / curX;
        var cx = co.x(curX), cy = co.y(curY);

        // The Area x * y = k
        ctx.fillStyle = h.rgba(CY, 0.1);
        ctx.fillRect(co.x(0), cy, cx - co.x(0), co.y(0) - cy);
        
        // The glowing AMM state
        glowDot(ctx, cx, cy, AMB, 7, 20);
        ctx.setLineDash([4,4]); ctx.strokeStyle = h.rgba(AMB, 0.5); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, co.y(0)); ctx.lineTo(cx, cy); ctx.lineTo(co.x(0), cy); ctx.stroke();
        ctx.setLineDash([]);

        // Instantaneous Price Tangent
        var slope = -k / (curX * curX);
        var priceYes = Math.abs(slope) / (1 + Math.abs(slope));
        
        ctx.strokeStyle = h.rgba(RED, 0.9); ctx.lineWidth = 2;
        ctx.beginPath();
        var dx = 1.5; 
        var lx1 = curX - dx, ly1 = curY - slope * dx;
        var lx2 = curX + dx, ly2 = curY + slope * dx;
        // clamp lines to graph
        ctx.moveTo(co.x(lx1), co.y(ly1));
        ctx.lineTo(co.x(lx2), co.y(ly2));
        ctx.stroke();

        // Tangent angle arc
        var px0 = co.x(curX), py0 = co.y(curY);
        ctx.beginPath(); ctx.moveTo(px0, py0); ctx.lineTo(px0 - 50, py0); ctx.strokeStyle=h.rgba(GREY, 0.5); ctx.stroke();
        
        ctx.fillStyle = h.rgba(RED, 0.9); ctx.font = "italic 16px monospace";
        ctx.fillText("Tangent = Price", co.x(lx1)-30, co.y(ly1)-10);

        // Price Meter
        ctx.fillStyle = h.rgba(GREY, 0.2); ctx.fillRect(680, 280, 200, 14);
        ctx.fillStyle = h.rgba(GRN, 0.8); ctx.fillRect(680, 280, 200 * priceYes, 14);
        ctx.fillStyle = "#fff"; ctx.font = "bold 24px 'JetBrains Mono'";
        ctx.fillText("$" + priceYes.toFixed(2), 680, 330);
        ctx.font = "14px monospace"; ctx.fillStyle = GREY;
        ctx.fillText("Probability of PR Merge", 680, 355);
      });

      lower(s, "A Constant Product Market Maker creates a continuous curve of liquidity.", 5.0);
      lower(s, "The tangent of the curve instantly sets the price of a YES token.", 9.0);
      lower(s, "Because money is at stake, this price perfectly reflects the true probability of completion.", 13.0);
    });
  }

  function sceneInsider(film) {
    film.scene("Work as Insider Trading", 22, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // 3D pseudo network
        var proj = projector(480, 280, 180, 60, 150);

        // Central Repository Node
        var pRepo = proj(0, 0, 0);
        ctx.fillStyle = h.rgba(CY, 0.1);
        ctx.beginPath(); ctx.ellipse(pRepo[0], pRepo[1], 120, 60, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = h.rgba(CY, 0.4); ctx.stroke();
        
        // Repo structure
        ctx.fillStyle = h.rgba(CY, 0.3); ctx.fillRect(pRepo[0]-40, pRepo[1]-80, 80, 80);
        ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.strokeRect(pRepo[0]-40, pRepo[1]-80, 80, 80);
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText("Repository", pRepo[0]-45, pRepo[1]-100);

        // Dev Node
        var pDev = proj(-1.5, 1.5, 0);
        glowDot(ctx, pDev[0], pDev[1], AMB, 8, 20);
        ctx.fillStyle = AMB; ctx.fillText("Developer", pDev[0]-40, pDev[1]+25);

        // Oracle Node
        var pOracle = proj(1.5, -1.5, 0);
        glowDot(ctx, pOracle[0], pOracle[1], MAG, 8, 20);
        ctx.fillStyle = MAG; ctx.fillText("UMA Oracle", pOracle[0]-20, pOracle[1]+25);

        // Lines
        ctx.strokeStyle = h.rgba(GREY, 0.4); ctx.setLineDash([4,4]);
        ctx.beginPath(); ctx.moveTo(pDev[0], pDev[1]); ctx.lineTo(pRepo[0], pRepo[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pRepo[0], pRepo[1]); ctx.lineTo(pOracle[0], pOracle[1]); ctx.stroke();
        ctx.setLineDash([]);

        // Actions
        var price = 0.10;
        var shares = 0;
        var profit = 0;
        
        // Phase 1: Buy Shares
        if (lt > 2 && lt <= 7) {
           var p = clamp01((lt - 2) / 3);
           var pBuy = proj(lerp(-1.5, 0, p), lerp(1.5, 0, p), 0.2*Math.sin(p*Math.PI));
           glowDot(ctx, pBuy[0], pBuy[1], GRN, 5, 15);
           ctx.fillStyle = GRN; ctx.font = "14px monospace"; ctx.fillText("+ Buy YES", pBuy[0]+10, pBuy[1]-10);
           shares = Math.floor(lerp(0, 5000, p));
           price = lerp(0.10, 0.25, p);
        } else if (lt > 7) {
           shares = 5000;
           price = 0.25;
        }

        // Phase 2: Push Code
        if (lt > 7 && lt <= 12) {
           var p2 = clamp01((lt - 7) / 4);
           var pPush = proj(lerp(-1.5, 0, p2), lerp(1.5, 0, p2), 0.3*Math.sin(p2*Math.PI));
           
           // Blue code packet
           ctx.fillStyle = TEAL; ctx.fillRect(pPush[0]-10, pPush[1]-10, 20, 20);
           ctx.strokeStyle = "#fff"; ctx.strokeRect(pPush[0]-10, pPush[1]-10, 20, 20);
           ctx.fillStyle = "#fff"; ctx.fillText("git push", pPush[0]+15, pPush[1]-15);
           price = lerp(0.25, 0.70, p2);
        } else if (lt > 12) {
           price = 0.70;
        }

        // Phase 3: Oracle Resolve
        if (lt > 12) {
           var p3 = clamp01((lt - 12) / 3);
           var pRes = proj(lerp(1.5, 0, p3), lerp(-1.5, 0, p3), 0.2*Math.sin(p3*Math.PI));
           glowDot(ctx, pRes[0], pRes[1], MAG, 6, 15);
           ctx.fillStyle = MAG; ctx.fillText("Verify Merge", pRes[0]+10, pRes[1]-10);
           price = lerp(0.70, 0.99, E.out(p3));
        }

        profit = shares * (price - 0.10);

        // Dev Dashboard Overlay
        ctx.fillStyle = h.rgba(GREY, 0.1); ctx.fillRect(50, 40, 240, 110);
        ctx.strokeStyle = h.rgba(CY, 0.3); ctx.strokeRect(50, 40, 240, 110);
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("Dev Portfolio", 65, 65);
        ctx.font = "14px monospace";
        ctx.fillStyle = GRN; ctx.fillText("YES Shares: " + shares, 65, 90);
        ctx.fillStyle = AMB; ctx.fillText("Market Price: $" + price.toFixed(2), 65, 110);
        ctx.fillStyle = h.rgba(GRN, 0.9 + 0.1*Math.sin(lt*10));
        ctx.fillText("Bounty Profit: +$" + profit.toFixed(0), 65, 135);

        ctx.globalAlpha = 1;
      });

      lower(s, "1. A developer buys YES shares while they are cheap (10¢).", 2.0);
      lower(s, "2. They fix the bug and push the code. The market notices, and the price rises.", 7.5);
      lower(s, "3. An optimistic oracle verifies the merge. The market resolves to $1.00.", 12.5);
      lower(s, "The developer's profit from their own shares acts as their salary. Code is insider trading.", 16.5);
    });
  }

  function appendix() {
    var c = document.querySelector("[data-role='jira-appendix']");
    if (!c) return;
    var html = '<p>Appendix mathematical notes on Automated Market Makers.</p>';
    html += '<p><strong>CPMM:</strong> The invariant $x \\times y = k$ ensures that as YES tokens are bought (reducing $x$), their price $\\frac{y}{x+y}$ increases asymptotically to $1.00.</p>';
    c.innerHTML = html;
    if (window.katex) {
      var ms = c.querySelectorAll("script[type='math/tex']");
      for (var i = 0; i < ms.length; i++) {
        var el = document.createElement("span");
        window.katex.render(ms[i].textContent, el, { throwOnError: false });
        ms[i].parentNode.replaceChild(el, ms[i]);
      }
    }
  }

})();
