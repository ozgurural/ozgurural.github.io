/* =============================================================================
   oracles.js — cinematic explainer: ML Oracles and verifiable inference
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
  var CY = "#3b82f6", AMB = "#fbbf24", RED = "#fb7185", GRN = "#34d399", GREY = "#94a3b8", PURP = "#a78bfa";

  function lower(s, html, at, o) {
    o = o || {};
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "65%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 1.5 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 1.0 });
    return c;
  }

  function build() {
    var film = window.LabAnim.create("#oracles-film", { width: 960, height: 540 });
    sceneBlind(film);
    sceneZK(film);
    sceneOptimistic(film);
    film.build();
    if (window.__LABDEBUG) window.__oraclesFilm = film;
  }

  function sceneBlind(film) {
    film.scene("The Blind Contract", 45, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // The Deterministic Grid (Blockchain)
        ctx.strokeStyle = h.rgba(CY, 0.2); ctx.lineWidth = 1;
        for (var i = 0; i <= 960; i += 40) {
           ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 540); ctx.stroke();
           if (i <= 540) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(960, i); ctx.stroke(); }
        }

        // The Smart Contract Box
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 250, 250);
        ctx.strokeStyle = CY; ctx.lineWidth = 3; ctx.strokeRect(600, 150, 250, 250);
        ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.fillText("Smart Contract", 640, 190);
        
        ctx.fillStyle = h.rgba(CY, 0.3); ctx.fillRect(620, 220, 210, 150);
        ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
        ctx.fillText("if (weather == rain):", 630, 250);
        ctx.fillText("   pay_farmer()", 630, 280);
        
        // The Wall
        ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
        ctx.beginPath(); ctx.moveTo(500, 0); ctx.lineTo(500, 540); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = RED; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("CONSENSUS WALL", 475, 520);

        // API Packets bouncing off the wall
        if (lt > 5) {
           var packetCount = Math.floor((lt - 5) * 1.5); // 1.5 packets per second
           for(var p=0; p<Math.min(packetCount, 20); p++) {
              var pTime = (lt - 5) - (p / 1.5);
              if (pTime > 0 && pTime < 3) {
                 var px = lerp(100, 480, E.in(clamp01(pTime)));
                 var py = 250 + Math.sin(p*3.14)*100;
                 ctx.fillStyle = AMB; ctx.fillRect(px, py, 20, 15);
                 ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText("API", px, py-5);

                 // Collision effect
                 if (px >= 480) {
                    ctx.beginPath(); ctx.arc(500, py+7, 15, 0, Math.PI*2); 
                    ctx.fillStyle = h.rgba(RED, 1 - (pTime - 1)*2);
                    ctx.fill();
                 }
              }
           }
        }
        
        // Failed attempt message
        if (lt > 18) {
           ctx.fillStyle = RED; ctx.font = "bold 20px monospace";
           ctx.fillText("ERROR: EXTERNAL CALLS NOT ALLOWED", 50, 480);
        }

        ctx.globalAlpha = 1;
      });

      lower(s, "The blockchain is a perfectly deterministic grid. A closed universe.", 2.0, { out: 12.0 });
      lower(s, "Smart contracts cannot 'look' at the real world. They cannot make API calls.", 13.0, { out: 24.0 });
      lower(s, "If a parametric insurance contract needs to know if it rained, it cannot check a weather server.", 25.0, { out: 34.0 });
      lower(s, "It requires an Oracle: a bridge to bring real-world truth across the Consensus Wall.", 35.0);
    });
  }

  function sceneZK(film) {
    film.scene("Zero-Knowledge Inference (zkML)", 60, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Neural Network off-chain (Left side)
        var layers = [4, 6, 6, 2];
        var nnX = 200, nnY = 250;
        
        ctx.fillStyle = h.rgba(AMB, 0.1); ctx.fillRect(50, 50, 350, 400);
        ctx.strokeStyle = AMB; ctx.strokeRect(50, 50, 350, 400);
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px monospace"; ctx.fillText("Off-chain Prover (Heavy ML)", 80, 80);

        // Draw connections
        ctx.strokeStyle = h.rgba(AMB, 0.15);
        for(var l=0; l<layers.length-1; l++) {
           for(var n1=0; n1<layers[l]; n1++) {
              for(var n2=0; n2<layers[l+1]; n2++) {
                 ctx.beginPath();
                 ctx.moveTo(nnX + l*80, nnY - layers[l]*15 + n1*30);
                 ctx.lineTo(nnX + (l+1)*80, nnY - layers[l+1]*15 + n2*30);
                 ctx.stroke();
              }
           }
        }

        // Draw nodes
        for(var l=0; l<layers.length; l++) {
           for(var n=0; n<layers[l]; n++) {
              ctx.fillStyle = h.rgba(AMB, 0.4);
              var nx = nnX + l*80;
              var ny = nnY - layers[l]*15 + n*30;
              ctx.beginPath(); ctx.arc(nx, ny, 6, 0, Math.PI*2); ctx.fill();
           }
        }

        // The Compression / Shadow Metaphor
        if (lt > 5 && lt < 25) {
           var flash = Math.abs(Math.sin(lt * 4));
           ctx.fillStyle = h.rgba(GRN, flash * 0.5);
           ctx.fillRect(50, 50, 350, 400); // Network is calculating
           ctx.fillStyle = GRN; ctx.fillText("Tracing execution...", 150, 420);
        }

        // Generate the Proof Token
        if (lt > 25) {
           var proofP = clamp01((lt - 25) / 10);
           var pX = lerp(200, 700, E.inOut(proofP));
           var pY = 250;
           
           ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(pX, pY, 15, 0, Math.PI*2); ctx.fill();
           ctx.fillStyle = "#fff"; ctx.font = "14px monospace"; ctx.fillText("π (Proof)", pX - 30, pY - 25);

           // On-chain verification box
           ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 200, 200);
           ctx.strokeStyle = CY; ctx.strokeRect(600, 150, 200, 200);
           ctx.fillStyle = "#fff"; ctx.fillText("Smart Contract", 630, 180);
           
           ctx.strokeStyle = h.rgba(CY, 0.5); ctx.setLineDash([5,5]);
           ctx.beginPath(); ctx.arc(700, 250, 20, 0, Math.PI*2); ctx.stroke(); // Keyhole
           ctx.setLineDash([]);
           ctx.fillStyle = "#fff"; ctx.fillText("Verify(π)", 665, 300);

           if (proofP === 1) {
              // Perfect fit
              ctx.fillStyle = h.rgba(GRN, 0.4);
              ctx.fillRect(600, 150, 200, 200);
              ctx.fillStyle = GRN; ctx.font = "bold 20px monospace";
              ctx.fillText("TRUE", 675, 260);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Zero-Knowledge Machine Learning (zkML) solves this using advanced cryptography.", 2.0, { out: 12.0 });
      lower(s, "An off-chain computer runs the heavy neural network. As it runs, it generates a 'shadow' of the execution.", 13.0, { out: 24.0 });
      lower(s, "This shadow is mathematically compressed into a tiny, undeniable cryptographic proof (π).", 25.0, { out: 38.0 });
      lower(s, "The smart contract cannot run the model, but it can cheaply verify the proof. If it fits, the result is mathematically guaranteed.", 40.0);
    });
  }

  function sceneOptimistic(film) {
    film.scene("Optimistic Staking", 60, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // The Timeline
        ctx.strokeStyle = GREY; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(100, 250); ctx.lineTo(800, 250); ctx.stroke();
        
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace";
        ctx.fillText("Time (t)", 820, 255);
        ctx.fillText("t = 0", 90, 280);
        ctx.fillText("t = Δt", 790, 280);

        // A Node stakes a claim
        if (lt > 2) {
           ctx.fillStyle = AMB; ctx.fillRect(200, 210, 60, 40); // Block of capital
           ctx.fillStyle = "#000"; ctx.font = "bold 14px monospace"; ctx.fillText("$10k", 215, 235);
           
           ctx.fillStyle = "#fff";
           ctx.fillText("Claim: Result = 42", 160, 190);
        }

        // The Challenge Countdown
        if (lt > 10 && lt < 35) {
           var timeP = clamp01((lt - 10) / 25);
           var currX = lerp(200, 800, timeP);
           
           // Clock sweeping
           ctx.fillStyle = h.rgba(CY, 0.2); ctx.fillRect(200, 240, currX - 200, 20);
           ctx.fillStyle = CY; ctx.fillRect(currX, 235, 5, 30); // Playhead
           
           ctx.fillStyle = "#fff";
           ctx.fillText("Challenge Window open...", 400, 310);
        }

        // A malicious claim (happens below)
        if (lt > 15) {
           ctx.fillStyle = RED; ctx.fillRect(350, 350, 60, 40); // Malicious Block
           ctx.fillStyle = "#000"; ctx.fillText("$10k", 365, 375);
           ctx.fillStyle = RED; ctx.fillText("Claim: Result = 99", 310, 330);
           
           // A Challenger smashes into it
           if (lt > 22) {
              var smashP = clamp01((lt - 22) / 3);
              var smashX = lerp(700, 410, E.in(smashP));
              
              ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(smashX, 370, 20, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = "#000"; ctx.fillText("!", smashX - 5, 375);

              if (smashP === 1) {
                 // Shattering effect
                 ctx.fillStyle = h.rgba(RED, 0.5);
                 ctx.beginPath(); ctx.arc(380, 370, 50 + (lt-25)*50, 0, Math.PI*2); ctx.fill();
                 ctx.fillStyle = RED; ctx.fillText("SLASHED!", 350, 410);
                 
                 // Pieces flying
                 for (var k=0; k<8; k++) {
                    var dx = Math.cos(k) * (lt-25)*100;
                    var dy = Math.sin(k) * (lt-25)*100 + ((lt-25)*(lt-25)*20); // gravity
                    ctx.fillStyle = AMB; ctx.fillRect(380 + dx, 370 + dy, 10, 10);
                 }
              }
           }
        }

        // The True claim finalizes
        if (lt > 36) {
           ctx.fillStyle = GRN; ctx.fillRect(200, 210, 60, 40); // Block turns green
           ctx.fillStyle = "#000"; ctx.fillText("$10k", 215, 235);
           
           ctx.fillStyle = GRN; ctx.font = "bold 18px monospace";
           ctx.fillText("FINALIZED", 200, 160);
           ctx.strokeStyle = GRN; ctx.lineWidth = 3;
           ctx.beginPath(); ctx.moveTo(200, 170); ctx.lineTo(260, 170); ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
      });

      lower(s, "Cryptography is expensive. The 'Optimistic' approach is economic.", 2.0, { out: 12.0 });
      lower(s, "A node asserts the result and locks a massive financial bond (stake) on the chain.", 13.0, { out: 24.0 });
      lower(s, "A challenge timer starts. If anyone can prove the node lied, the liar's stake is shattered and given to the challenger.", 25.0, { out: 40.0 });
      lower(s, "If the timer runs out with no challenges, the result solidifies as truth. No expensive math required.", 42.0);
    });
  }

  setTimeout(boot, 60);
})();
