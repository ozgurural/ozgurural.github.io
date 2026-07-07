/* =============================================================================
   oracles.js — cinematic explainer: ML and Blockchain Oracles
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("oracles-film")) return;
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

  function glowDot(ctx, x, y, color, radius, blur) {
    ctx.shadowBlur = blur || 15; ctx.shadowColor = color; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, radius || 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function build() {
    var film = window.LabAnim.create("#oracles-film", { width: 960, height: 540 });
    sceneBoundary(film);
    sceneZKML(film);
    sceneOptimistic(film);
    film.build();
    if (window.__LABDEBUG) window.__oraclesFilm = film;
  }

  function sceneBoundary(film) {
    film.scene("The Blind Contract", 14, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Blockchain Boundary Wall
        ctx.strokeStyle = h.rgba(CY, 0.4); ctx.lineWidth = 3;
        var wallX = 600;
        ctx.beginPath(); ctx.moveTo(wallX, 50); ctx.lineTo(wallX, 490); ctx.stroke();
        
        ctx.fillStyle = h.rgba(CY, 0.8); ctx.font = "bold 16px 'JetBrains Mono'"; 
        ctx.fillText("THE BLOCKCHAIN", 640, 80);
        ctx.fillStyle = h.rgba(AMB, 0.8); 
        ctx.fillText("OFF-CHAIN WORLD", 200, 80);

        // Smart Contract Logic Gate
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(660, 200, 160, 140);
        ctx.strokeStyle = h.rgba(CY, 0.8); ctx.lineWidth = 2; ctx.strokeRect(660, 200, 160, 140);
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText("Smart Contract", 675, 275);
        ctx.fillStyle = h.rgba(CY, 0.6); ctx.font = "12px monospace"; ctx.fillText("Gas Limit Reached", 685, 300);

        // API Data attempting to cross
        if (lt > 2) {
          for(var i=0; i<3; i++) {
             var tStart = 2 + i*1.5;
             if (lt > tStart) {
                var p = clamp01((lt - tStart) / 1.5);
                var dx = lerp(100, wallX, E.in(p));
                
                ctx.fillStyle = AMB;
                ctx.fillRect(dx, 220 + i*40, 30, 20);
                ctx.fillStyle = "#111"; ctx.font = "12px monospace"; ctx.fillText("JSON", dx+2, 234 + i*40);

                if (p === 1 && lt < tStart + 2) {
                   // Bounce / Shatter
                   ctx.strokeStyle = RED; ctx.lineWidth = 2;
                   ctx.beginPath(); ctx.arc(wallX, 230 + i*40, 15 + (lt-tStart-1.5)*20, 0, Math.PI*2); ctx.stroke();
                }
             }
          }
        }
        ctx.globalAlpha = 1;
      });
      lower(s, "Smart contracts are deterministic and blind. They cannot make API calls.", 1.5, { maxWidth: "80%" });
      lower(s, "Running a Neural Network directly on-chain would cost billions in gas fees.", 6.0);
      lower(s, "The computation must happen off-chain. But how can the contract trust the result?", 10.0);
    }, { subtitle: "THE VERIFICATION TRILEMMA" });
  }

  function sceneZKML(film) {
    film.scene("Zero-Knowledge Inference", 24, function(s) {
      var eq = s.tex2("y = F_\\theta(x)", { px: 200, py: 100, size: "1.5rem", color: AMB });
      s.fadeIn(eq, { at: 1.0, dur: 1.0 });

      var eq2 = s.tex2("\\pi", { px: 440, py: 250, size: "2rem", color: GRN });
      s.fadeIn(eq2, { at: 13.0, dur: 0.5 });
      s.fadeOut(eq2, { at: 16.0, dur: 0.5 }); // Because we animate it manually later

      var eq3 = s.tex2("Verify(x, y, \\theta, \\pi) == 1", { px: 650, py: 150, size: "1.2rem", color: CY });
      s.fadeIn(eq3, { at: 19.0, dur: 1.0 });

      s.canvas(function(lt, ctx, h) {
        var wallX = 600;
        ctx.strokeStyle = h.rgba(CY, 0.4); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(wallX, 50); ctx.lineTo(wallX, 490); ctx.stroke();
        
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(660, 200, 160, 140);
        ctx.strokeStyle = h.rgba(CY, 0.8); ctx.strokeRect(660, 200, 160, 140);
        
        // Neural Network Definition
        var layers = [4, 5, 5, 2];
        var sx = 100, sy = 250, xStep = 100, yStep = 40;
        
        // Draw Edges
        ctx.strokeStyle = h.rgba(GREY, 0.2); ctx.lineWidth = 1;
        for (var l=0; l<layers.length-1; l++) {
           for (var n1=0; n1<layers[l]; n1++) {
              for (var n2=0; n2<layers[l+1]; n2++) {
                 var y1 = sy + (n1 - layers[l]/2) * yStep;
                 var y2 = sy + (n2 - layers[l+1]/2) * yStep;
                 ctx.beginPath(); ctx.moveTo(sx + l*xStep, y1); ctx.lineTo(sx + (l+1)*xStep, y2); ctx.stroke();
              }
           }
        }

        // Draw Nodes & Forward Pass
        for (var l=0; l<layers.length; l++) {
           var layerTime = 2 + l*1.5;
           var active = lt > layerTime && lt < layerTime + 1.5;
           
           for (var n=0; n<layers[l]; n++) {
              var y = sy + (n - layers[l]/2) * yStep;
              ctx.fillStyle = h.rgba(AMB, active ? 1.0 : 0.4);
              if (active) glowDot(ctx, sx + l*xStep, y, AMB, 6, 15);
              else { ctx.beginPath(); ctx.arc(sx + l*xStep, y, 4, 0, Math.PI*2); ctx.fill(); }
           }
        }

        // SNARK Polynomial Generation (Wrapping the network)
        if (lt > 8 && lt < 13) {
           var prog = clamp01((lt - 8) / 4);
           ctx.strokeStyle = h.rgba(GRN, 0.8); ctx.lineWidth = 2;
           ctx.beginPath();
           for(var wx = sx; wx <= sx + 3*xStep; wx += 2) {
              var wy = sy + 100 * Math.sin(wx * 0.05 + lt * 5) * Math.sin(wx * 0.01) * (1 - prog);
              if (wx === sx) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
           }
           ctx.stroke();
           
           ctx.fillStyle = GRN; ctx.font = "14px monospace";
           ctx.fillText("Committing trace to polynomial...", 120, 420);
        }

        // The Proof moving to the contract
        if (lt >= 16) {
           var moveP = clamp01((lt - 16) / 3);
           var px = lerp(440, 740, E.inOut(moveP));
           var py = 270;
           
           glowDot(ctx, px, py, GRN, 12, 25);
           ctx.fillStyle = "#111"; ctx.font = "16px 'JetBrains Mono'"; ctx.fillText("π", px-5, py+5);
           
           if (moveP === 1) {
              ctx.strokeStyle = GRN; ctx.lineWidth = 4;
              ctx.beginPath(); ctx.arc(740, 270, 25 + Math.sin(lt*10)*5, 0, Math.PI*2); ctx.stroke();
              ctx.fillStyle = GRN; ctx.fillText("ACCEPTED", 695, 300);
           }
        }
      });

      lower(s, "1. We run the Neural Network off-chain (the forward pass).", 2.0);
      lower(s, "2. We use Zero-Knowledge cryptography to convert the entire execution trace into a polynomial.", 8.5);
      lower(s, "3. This generates a tiny cryptographic proof: a zk-SNARK (π).", 13.0);
      lower(s, "4. The smart contract verifies the proof cheaply, guaranteeing the ML model was run honestly.", 17.5);
    });
  }

  function sceneOptimistic(film) {
    film.scene("Optimistic Staking", 20, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Blockchain Boundary Wall
        var wallX = 600;
        ctx.strokeStyle = h.rgba(CY, 0.4); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(wallX, 50); ctx.lineTo(wallX, 490); ctx.stroke();

        ctx.fillStyle = h.rgba(AMB, 0.9); ctx.font = "16px 'JetBrains Mono'";
        ctx.fillText("Oracle Node (Prover)", 150, 180);

        // Timeline Bar
        ctx.fillStyle = h.rgba(GREY, 0.2); ctx.fillRect(200, 300, 500, 20);
        ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
        ctx.fillText("t=0", 200, 340);
        ctx.fillText("t = Δt", 680, 340);
        ctx.fillText("Challenge Period", 400, 340);

        if (lt > 2) {
           // Submission
           ctx.fillStyle = TEAL; ctx.fillText("Assert: y = 1", 200, 210);
           
           // Draw Staked Coins
           for(var i=0; i<5; i++) {
              ctx.fillStyle = h.rgba(AMB, 0.8);
              ctx.beginPath(); ctx.ellipse(250, 260 - i*10, 30, 10, 0, 0, Math.PI*2); ctx.fill();
              ctx.strokeStyle = h.rgba(AMB, 1.0); ctx.stroke();
           }
           ctx.fillStyle = AMB; ctx.fillText("Stake: 100 ETH", 300, 250);

           // Timeline progression
           var prog = clamp01((lt - 4) / 10); // 10 seconds of challenge period
           ctx.fillStyle = h.rgba(MAG, 0.8); ctx.fillRect(200, 300, 500 * prog, 20);
           
           var playheadX = 200 + 500 * prog;
           ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(playheadX-10, 290); ctx.lineTo(playheadX+10, 290); ctx.lineTo(playheadX, 310); ctx.fill();

           // Scenario: Challenge at t=7s
           if (lt > 9 && lt < 14) { // Challenge occurs!
              ctx.fillStyle = RED; ctx.font = "bold 24px 'JetBrains Mono'";
              ctx.fillText("CHALLENGE!", 380, 200);
              
              // Red Lightning Slash
              ctx.strokeStyle = RED; ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(350, 150); ctx.lineTo(260, 220); ctx.lineTo(300, 220); ctx.lineTo(240, 280);
              ctx.stroke();

              ctx.fillStyle = RED; ctx.font = "16px monospace";
              ctx.fillText("Referee proves lie.", 380, 230);
              ctx.fillText("Stake SLASHED.", 380, 250);

              // Coins shattering
              for(var j=0; j<15; j++) {
                 var p = clamp01((lt - 9) / 2);
                 var cx = 250 + Math.cos(j*2) * 100 * p;
                 var cy = 240 + Math.sin(j*2) * 100 * p + 50*p*p; // gravity
                 ctx.fillStyle = h.rgba(AMB, 1 - p);
                 ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();
              }
           }

           if (lt > 16) {
              ctx.fillStyle = GRN; ctx.font = "bold 24px 'JetBrains Mono'";
              ctx.fillText("ACCEPTED", 620, 200);
              ctx.font = "16px monospace";
              ctx.fillText("Stake returned.", 620, 230);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "zkML cryptography is mathematically perfect, but generating proofs is computationally expensive.", 1.5);
      lower(s, "Instead, Optimistic Oracles use Game Theory. A node submits a result and locks up capital.", 5.0);
      lower(s, "Anyone can challenge it within a time window. If they prove it's a lie, the node's stake is slashed.", 10.0);
      lower(s, "If the window closes with no challenges, the data is accepted instantly and cheaply.", 16.5);
    });
  }

  function appendix() {
    var c = document.querySelector("[data-role='oracles-appendix']");
    if (!c) return;
    var html = '<p>Appendix mathematical notes on Zero-Knowledge Machine Learning (zkML) and Optimistic Oracles.</p>';
    html += '<p><strong>zkML:</strong> Given public model parameters $\\theta$ and input $x$, the prover generates a SNARK $\\pi$ such that $V(x, y, \\theta, \\pi) = 1$ iff $y = F_\\theta(x)$.</p>';
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
