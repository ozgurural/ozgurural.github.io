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
    // Full width bottom bar
    var c = s.caption(html, { px: 0, py: 540, anchor: "bottom-left", align: "left", size: o.size, panel: true });
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

        // The Deterministic Grid (Blockchain) with glowing effect
        ctx.strokeStyle = h.rgba(CY, 0.15); ctx.lineWidth = 1;
        ctx.globalCompositeOperation = "screen";
        for (var i = 0; i <= 960; i += 40) {
           var glow = Math.abs(Math.sin(lt*2 + i*0.01)) * 0.1;
           ctx.strokeStyle = h.rgba(CY, 0.1 + glow);
           ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 540); ctx.stroke();
           if (i <= 540) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(960, i); ctx.stroke(); }
        }
        ctx.globalCompositeOperation = "source-over";

        // The Smart Contract Box (Glowing)
        var boxGlow = Math.abs(Math.sin(lt * 3));
        ctx.shadowBlur = 20 + 10*boxGlow; ctx.shadowColor = h.rgba(CY, 0.4);
        
        var boxGrad = ctx.createLinearGradient(600, 150, 850, 400);
        boxGrad.addColorStop(0, h.rgba(CY, 0.15 + 0.1*boxGlow));
        boxGrad.addColorStop(1, h.rgba(CY, 0.02));
        
        ctx.fillStyle = boxGrad; 
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(600, 150, 250, 250, 16); else ctx.rect(600, 150, 250, 250);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = h.rgba(CY, 0.8); ctx.lineWidth = 2; ctx.stroke();
        
        ctx.shadowBlur = 10; ctx.shadowColor = "#f8fafc";
        ctx.fillStyle = "#f8fafc"; ctx.font = "bold 20px var(--ds-font-mono, 'JetBrains Mono', monospace)"; 
        ctx.fillText("SMART CONTRACT", 630, 190);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = h.rgba(CY, 0.15); 
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(620, 220, 210, 150, 8); else ctx.rect(620, 220, 210, 150);
        ctx.fill();
        
        ctx.fillStyle = "#e2e8f0"; ctx.font = "14px var(--ds-font-mono, 'JetBrains Mono', monospace)";
        ctx.fillText("if (weather == rain):", 630, 250);
        ctx.fillText("   pay_farmer()", 630, 280);
        
        // The Wall (Impenetrable Forcefield)
        var wallEnergy = Math.abs(Math.sin(lt * 10));
        ctx.shadowBlur = 20 + 20*wallEnergy; ctx.shadowColor = RED;
        ctx.strokeStyle = h.rgba(RED, 0.8 + 0.2*wallEnergy); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(500, 0); ctx.lineTo(500, 540); ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = RED; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("CONSENSUS WALL", 475, 520);

        // Advanced API Packets (Glowing streaks bouncing)
        if (lt > 5) {
           var packetCount = Math.floor((lt - 5) * 1.5); 
           for(var p=0; p<Math.min(packetCount, 25); p++) {
              var pTime = (lt - 5) - (p / 1.5);
              if (pTime > 0 && pTime < 3) {
                 var px = lerp(100, 480, E.in(clamp01(pTime)));
                 var py = 250 + Math.sin(p*3.14)*120;
                 
                 ctx.shadowBlur = 10; ctx.shadowColor = AMB;
                 ctx.fillStyle = AMB; ctx.fillRect(px, py, 25, 15);
                 ctx.shadowBlur = 0;
                 
                 // Trailing streak
                 ctx.fillStyle = h.rgba(AMB, 0.3); ctx.fillRect(px-30, py+5, 30, 5);

                 // High impact collision effect
                 if (px >= 475) {
                    var impactP = clamp01(1 - (pTime - 1)*3);
                    ctx.shadowBlur = 20; ctx.shadowColor = RED;
                    ctx.beginPath(); ctx.arc(500, py+7, 20 + (1-impactP)*20, 0, Math.PI*2); 
                    ctx.strokeStyle = h.rgba(RED, impactP);
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                 }
              }
           }
        }
        
        if (lt > 18) {
           ctx.shadowBlur = 15; ctx.shadowColor = RED;
           ctx.fillStyle = RED; ctx.font = "bold 20px monospace";
           ctx.fillText("ERROR: EXTERNAL CALLS NOT ALLOWED", 50, 480);
           ctx.shadowBlur = 0;
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

        var nnX = 180, nnY = 250;
        
        ctx.shadowBlur = 20; ctx.shadowColor = h.rgba(AMB, 0.3);
        var proverGrad = ctx.createLinearGradient(30, 50, 350, 450);
        proverGrad.addColorStop(0, h.rgba(AMB, 0.1));
        proverGrad.addColorStop(1, h.rgba(AMB, 0.02));
        
        ctx.fillStyle = proverGrad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(30, 50, 320, 400, 16); else ctx.rect(30, 50, 320, 400);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = h.rgba(AMB, 0.6); ctx.lineWidth = 1; ctx.stroke();
        
        ctx.shadowBlur = 10; ctx.shadowColor = "#f8fafc";
        ctx.fillStyle = "#f8fafc"; ctx.font = "bold 16px var(--ds-font-mono, 'JetBrains Mono', monospace)"; 
        ctx.fillText("Off-chain Prover", 100, 80);
        ctx.shadowBlur = 0;

        // Dense Neural Network Mesh
        var layers = [5, 8, 8, 3];
        ctx.strokeStyle = h.rgba(AMB, 0.1);
        for(var l=0; l<layers.length-1; l++) {
           for(var n1=0; n1<layers[l]; n1++) {
              for(var n2=0; n2<layers[l+1]; n2++) {
                 ctx.beginPath();
                 ctx.moveTo(nnX + l*70 - 70, nnY - layers[l]*18 + n1*36);
                 ctx.lineTo(nnX + (l+1)*70 - 70, nnY - layers[l+1]*18 + n2*36);
                 ctx.stroke();
              }
           }
        }

        // Nodes
        for(var l=0; l<layers.length; l++) {
           for(var n=0; n<layers[l]; n++) {
              ctx.fillStyle = h.rgba(AMB, 0.6);
              var nx = nnX + l*70 - 70;
              var ny = nnY - layers[l]*18 + n*36;
              ctx.beginPath(); ctx.arc(nx, ny, 5, 0, Math.PI*2); ctx.fill();
           }
        }

        // The Shockwave Inference (Forward Pass)
        if (lt > 5 && lt < 25) {
           var passP = (lt * 2) % layers.length; 
           var activeLayer = Math.floor(passP);
           
           ctx.shadowBlur = 20; ctx.shadowColor = GRN;
           for(var n=0; n<layers[activeLayer]; n++) {
              ctx.fillStyle = GRN;
              var nx = nnX + activeLayer*70 - 70;
              var ny = nnY - layers[activeLayer]*18 + n*36;
              ctx.beginPath(); ctx.arc(nx, ny, 8, 0, Math.PI*2); ctx.fill();
           }
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = GRN; ctx.font = "14px monospace"; ctx.fillText("Tracing inference...", 110, 420);
        }

        // Generating the Mandala Proof (π)
        if (lt > 25) {
           var proofP = clamp01((lt - 25) / 12);
           var pX = lerp(180, 700, E.inOut(proofP));
           var pY = 250;
           
           // Spinning Cryptographic Mandala
           ctx.save();
           ctx.translate(pX, pY);
           
           ctx.shadowBlur = 15; ctx.shadowColor = GRN;
           for (var r=0; r<3; r++) {
              ctx.rotate((lt * (r+1)) * 0.5); // Spin at different speeds
              ctx.strokeStyle = h.rgba(GRN, 0.6 - r*0.1);
              ctx.lineWidth = 2;
              
              ctx.beginPath();
              for(var k=0; k<6; k++) {
                 var ang = k * Math.PI / 3;
                 var rad = 15 + r*8;
                 var hx = rad * Math.cos(ang);
                 var hy = rad * Math.sin(ang);
                 if (k===0) ctx.moveTo(hx, hy);
                 else ctx.lineTo(hx, hy);
              }
              ctx.closePath();
              ctx.stroke();
           }
           ctx.restore();
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = "#fff"; ctx.font = "bold 16px monospace"; ctx.fillText("π (Proof)", pX - 35, pY - 50);

           // On-chain verification box
           ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 200, 200);
           ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.strokeRect(600, 150, 200, 200);
           ctx.fillStyle = "#fff"; ctx.fillText("Smart Contract", 630, 180);
           
           ctx.strokeStyle = h.rgba(CY, 0.8); ctx.setLineDash([8,8]); ctx.lineWidth = 3;
           ctx.beginPath(); ctx.arc(700, 250, 30, 0, Math.PI*2); ctx.stroke(); // Keyhole
           ctx.setLineDash([]);
           ctx.fillStyle = "#fff"; ctx.fillText("Verify(π)", 665, 310);

           if (proofP === 1) {
              // Glowing verification success
              var pulse = Math.abs(Math.sin(lt * 5));
              ctx.fillStyle = h.rgba(GRN, 0.3 + 0.3*pulse);
              ctx.fillRect(600, 150, 200, 200);
              
              ctx.shadowBlur = 20; ctx.shadowColor = GRN;
              ctx.fillStyle = GRN; ctx.font = "bold 24px 'JetBrains Mono'";
              ctx.fillText("VALID", 665, 260);
              ctx.shadowBlur = 0;
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "Zero-Knowledge Machine Learning (zkML) solves this using advanced cryptography.", 2.0, { out: 12.0 });
      lower(s, "An off-chain computer runs the heavy neural network. As data flows through, it generates a 'shadow' of the execution.", 13.0, { out: 24.0 });
      lower(s, "This complex shadow is mathematically compressed into a tiny, undeniable cryptographic fractal (π).", 25.0, { out: 38.0 });
      lower(s, "The smart contract cannot run the model, but it can cheaply verify the proof. If it fits, the result is mathematically guaranteed.", 40.0);
    });
  }

  function sceneOptimistic(film) {
    film.scene("Optimistic Staking", 60, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // The Timeline (Glowing laser beam)
        ctx.shadowBlur = 10; ctx.shadowColor = GREY;
        ctx.strokeStyle = GREY; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(100, 250); ctx.lineTo(800, 250); ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("Time (t)", 820, 255);
        ctx.fillText("t = 0", 90, 280);
        ctx.fillText("t = Δt", 790, 280);

        // A Node stakes a claim (Golden Block)
        if (lt > 2) {
           ctx.shadowBlur = 20; ctx.shadowColor = AMB;
           ctx.fillStyle = AMB; ctx.fillRect(200, 200, 70, 50); 
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = "#000"; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("$100k", 210, 230);
           
           ctx.fillStyle = "#fff";
           ctx.fillText("Claim: Result = TRUE", 150, 180);
        }

        // The Challenge Countdown
        if (lt > 10 && lt < 35) {
           var timeP = clamp01((lt - 10) / 25);
           var currX = lerp(200, 800, timeP);
           
           // Sweeping Clock UI
           ctx.fillStyle = h.rgba(CY, 0.3); ctx.fillRect(200, 245, currX - 200, 10);
           
           ctx.shadowBlur = 15; ctx.shadowColor = CY;
           ctx.fillStyle = CY; ctx.fillRect(currX, 235, 5, 30); // Playhead
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
           ctx.fillText("Challenge Window open...", 400, 310);
        }

        // A malicious claim is planted below
        if (lt > 15) {
           ctx.shadowBlur = 20; ctx.shadowColor = RED;
           ctx.fillStyle = RED; ctx.fillRect(350, 330, 70, 50); 
           ctx.shadowBlur = 0;
           ctx.fillStyle = "#000"; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("$100k", 360, 360);
           ctx.fillStyle = RED; ctx.fillText("Claim: Result = FALSE", 290, 310);
           
           // A Challenger smashes into it
           if (lt > 22) {
              var smashP = clamp01((lt - 22) / 3);
              var smashX = lerp(750, 420, E.in(smashP));
              
              ctx.shadowBlur = 20; ctx.shadowColor = GRN;
              ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(smashX, 355, 25, 0, Math.PI*2); ctx.fill();
              ctx.shadowBlur = 0;
              ctx.fillStyle = "#000"; ctx.font = "bold 20px monospace"; ctx.fillText("!", smashX - 5, 362);

              if (smashP === 1) {
                 // Massive Shattering effect
                 var shatterTime = lt - 25;
                 ctx.fillStyle = h.rgba(RED, 0.5);
                 ctx.beginPath(); ctx.arc(385, 355, 50 + shatterTime*100, 0, Math.PI*2); ctx.fill();
                 
                 ctx.shadowBlur = 15; ctx.shadowColor = RED;
                 ctx.fillStyle = RED; ctx.font = "bold 28px 'JetBrains Mono'"; ctx.fillText("SLASHED!", 320, 420);
                 ctx.shadowBlur = 0;
                 
                 // Advanced Particle Physics for shattered coins
                 for (var k=0; k<15; k++) {
                    var speed = 120 + Math.random()*80;
                    var dx = Math.cos(k * 0.4) * shatterTime * speed;
                    var dy = Math.sin(k * 0.4) * shatterTime * speed + (shatterTime*shatterTime*60); // gravity curve
                    
                    var pSize = 5 + Math.random()*10;
                    ctx.fillStyle = (Math.random() > 0.5) ? AMB : RED;
                    ctx.fillRect(385 + dx, 355 + dy, pSize, pSize);
                 }
              }
           }
        }

        // The True claim finalizes
        if (lt > 36) {
           ctx.shadowBlur = 30; ctx.shadowColor = GRN;
           ctx.fillStyle = GRN; ctx.fillRect(200, 200, 70, 50); // Block turns green
           ctx.shadowBlur = 0;
           ctx.fillStyle = "#000"; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("$100k", 210, 230);
           
           ctx.fillStyle = GRN; ctx.font = "bold 22px 'JetBrains Mono'";
           ctx.fillText("FINALIZED", 185, 150);
           ctx.strokeStyle = GRN; ctx.lineWidth = 3;
           ctx.beginPath(); ctx.moveTo(185, 160); ctx.lineTo(290, 160); ctx.stroke();
        }
        
        ctx.globalAlpha = 1;
      });

      lower(s, "Cryptography is expensive. The 'Optimistic' approach uses raw economic game theory.", 2.0, { out: 12.0 });
      lower(s, "A node asserts a result and locks a massive financial bond (stake) on the blockchain.", 13.0, { out: 24.0 });
      lower(s, "A challenge timer starts. If anyone can prove the node lied, the liar's stake is violently shattered and given to the challenger.", 25.0, { out: 40.0 });
      lower(s, "If the timer runs out with no challenges, the result solidifies as absolute truth. No expensive math required.", 42.0);
    });
  }

  setTimeout(boot, 60);
})();
