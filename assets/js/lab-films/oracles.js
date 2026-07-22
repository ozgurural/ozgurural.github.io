/* =============================================================================
   oracles.js — cinematic explainer: ML Oracles and verifiable inference
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("oracles-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build();
  }

  var P = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = P.sky, AMB = P.amber, RED = P.rose, GRN = P.good, GREY = P.faint, PURP = P.violet, WHITE = P.white, BLACK = P.bg0, LIGHT_GREY = P.muted;

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
    var audioId = "oracles_" + (_lowerCount++);
    s.audio(audioId, at);
    o = o || {};
    flushLower(s, at);
    // Full width bottom bar
    var c = s.caption(html, { px: 0, py: 540, anchor: "bottom-left", align: "left", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 1.5 });
    _pendLower = { s: s, c: c, at: at, out: o.out || null };
    return c;
  }

  function build() {
    var film = window.LabAnim.create("#oracles-film", { width: 960, height: 540 });
    sceneBlind(film);
    sceneZK(film);
    sceneOptimistic(film);
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__oraclesFilm = film;
  }

  function sceneBlind(film) {
    film.scene("The Verdict It Can't Check", 45, function(s) {
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
        
        ctx.fillStyle = WHITE; ctx.font = "bold 20px 'JetBrains Mono', monospace"; 
        ctx.fillText("SMART CONTRACT", 630, 190);
        
        
        ctx.fillStyle = h.rgba(CY, 0.15); 
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(620, 220, 210, 150, 8); else ctx.rect(620, 220, 210, 150);
        ctx.fill();
        
        ctx.fillStyle = LIGHT_GREY; ctx.font = "14px 'JetBrains Mono', monospace";
        ctx.fillText("if (weather == rain):", 630, 250);
        ctx.fillText("   pay_farmer()", 630, 280);
        
        // The Wall (Impenetrable Forcefield)
        var wallEnergy = Math.abs(Math.sin(lt * 10));
        ctx.shadowBlur = 20 + 20*wallEnergy; ctx.shadowColor = RED;
        ctx.strokeStyle = h.rgba(RED, 0.8 + 0.2*wallEnergy); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(500, 0); ctx.lineTo(500, 540); ctx.stroke();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = RED; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("CONSENSUS WALL", 475, 445);

        // Advanced API Packets (Glowing streaks bouncing)
        if (lt > 5) {
           var fade5 = clamp01((lt - 5) / 0.5);
           ctx.globalAlpha = op * fade5;
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
           ctx.globalAlpha = op;
        }
        
        if (lt > 18) {
           var fade18 = clamp01((lt - 18) / 0.5);
           var fadeOut26 = 1 - clamp01((lt - 26) / 1.0);
           ctx.globalAlpha = op * fade18 * fadeOut26;
           ctx.shadowBlur = 15; ctx.shadowColor = RED;
           ctx.fillStyle = RED; ctx.font = "bold 20px monospace";
           ctx.fillText("ERROR: EXTERNAL CALLS NOT ALLOWED", 50, 445);
           ctx.shadowBlur = 0;
           ctx.globalAlpha = op;
        }

        ctx.globalAlpha = op;
      });

      var dlp = s.caption("Every trust boundary I've built — a data-leakage classifier deciding what crosses, an autonomous system acting on a perception model — comes down to the same question: can you act on a verdict you can't re-derive?", { px: 480, py: 100, anchor: "center", align: "center", size: "1.1rem", color: LIGHT_GREY });
      s.fadeIn(dlp, { at: 28, dur: 2 });
      s.fadeOut(dlp, { at: 42, dur: 1.5 });

      lower(s, "An autonomous system is handed a verdict — 'that's crop damage,' 'that's a valid claim,' 'that's a threat.'", 1.33, { out: 12 });
      lower(s, "It didn't run the model. It can't see the weights.", 8.67, { out: 24 });
      lower(s, "Should it act?", 16.67, { out: 34 });
      lower(s, "In a world where AI agents consume each other's inferences, this is the trust question.", 23.33);
    }, { subtitle: "Trust boundaries in autonomous systems" });
  }

  function sceneZK(film) {
    film.scene("Zero-Knowledge Inference (zkML)", 60, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        
        // Dim the prover and NN when focus shifts to the proof verification
        var proverDim = 1 - 0.7 * clamp01((lt - 28) / 1.5);
        ctx.globalAlpha = op * proverDim;

        var nnX = 180, nnY = 250;
        
        ctx.shadowBlur = 20; ctx.shadowColor = h.rgba(AMB, 0.3 * proverDim);
        var proverGrad = ctx.createLinearGradient(30, 50, 350, 450);
        proverGrad.addColorStop(0, h.rgba(AMB, 0.1 * proverDim));
        proverGrad.addColorStop(1, h.rgba(AMB, 0.02 * proverDim));
        
        ctx.fillStyle = proverGrad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(30, 50, 320, 400, 16); else ctx.rect(30, 50, 320, 400);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = h.rgba(AMB, 0.6); ctx.lineWidth = 1; ctx.stroke();
        
        ctx.fillStyle = WHITE; ctx.font = "bold 16px 'JetBrains Mono', monospace"; 
        ctx.fillText("Off-chain Prover", 100, 80);
        

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
           var fade5 = clamp01((lt - 5) / 0.5) * clamp01((25 - lt) / 0.5);
           ctx.globalAlpha = op * fade5;
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
           ctx.globalAlpha = op;
        }

        // Generating the Mandala Proof (π)
        if (lt > 25) {
           var fade25 = clamp01((lt - 25) / 0.5);
           ctx.globalAlpha = op * fade25;
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
           
           ctx.fillStyle = WHITE; ctx.font = "bold 16px monospace"; ctx.fillText("π (Proof)", pX - 35, pY - 65);

           // On-chain verification box
           ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 200, 200);
           ctx.strokeStyle = CY; ctx.lineWidth = 2; ctx.strokeRect(600, 150, 200, 200);
           ctx.fillStyle = WHITE; ctx.fillText("Smart Contract", 630, 180);
           
           ctx.strokeStyle = h.rgba(CY, 0.8); ctx.setLineDash([8,8]); ctx.lineWidth = 3;
           ctx.beginPath(); ctx.arc(700, 250, 30, 0, Math.PI*2); ctx.stroke(); // Keyhole
           ctx.setLineDash([]);
           ctx.fillStyle = WHITE; ctx.fillText("Verify(π)", 665, 310);

           if (lt >= 37) {
              var fade37 = clamp01((lt - 37) / 0.5);
              ctx.globalAlpha = op * fade25 * fade37;
              // Glowing verification success
              var pulse = Math.abs(Math.sin(lt * 5));
              ctx.fillStyle = h.rgba(GRN, 0.3 + 0.3*pulse);
              ctx.fillRect(600, 150, 200, 200);
              
              ctx.shadowBlur = 20; ctx.shadowColor = GRN;
              ctx.fillStyle = GRN; ctx.font = "bold 24px 'JetBrains Mono'";
              ctx.fillText("VALID", 665, 260);
              ctx.shadowBlur = 0;
           }
           ctx.globalAlpha = op;
        }
        ctx.globalAlpha = op;
      });

      lower(s, "Zero-Knowledge Machine Learning (zkML) solves this using advanced cryptography.", 1.33, { out: 12 });
      lower(s, "An off-chain computer runs the heavy neural network. As data flows through, it generates a 'shadow' of the execution.", 8.67, { out: 24 });
      lower(s, "This complex shadow is mathematically compressed into a short proof π that's cheap to check but impossible to forge — a certificate that this exact model produced this exact output.", 16.67, { out: 38 });
      lower(s, "The smart contract cannot run the model, but it can cheaply verify the proof. If it fits, the result is mathematically guaranteed.", 26.67);
    }, { subtitle: "Proving execution without redoing the work" });
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
        
        ctx.fillStyle = WHITE; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("Time (t)", 820, 255);
        ctx.fillText("t = 0", 90, 280);
        ctx.fillText("t = Δt", 790, 280);

        // A Node stakes a claim (Golden Block)
        if (lt > 2) {
           var fade2 = clamp01((lt - 2) / 0.5);
           ctx.globalAlpha = op * fade2;
           ctx.shadowBlur = 20; ctx.shadowColor = AMB;
           ctx.fillStyle = AMB; ctx.fillRect(200, 200, 70, 50); 
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = BLACK; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("$100k", 210, 230);
           
           ctx.fillStyle = WHITE;
           ctx.fillText("Claim: Result = TRUE", 150, 180);
           ctx.globalAlpha = op;
        }

        // The Challenge Countdown
        if (lt > 10 && lt < 35) {
           var fade10 = clamp01((lt - 10) / 0.5) * clamp01((35 - lt) / 0.5);
           ctx.globalAlpha = op * fade10;
           var timeP = clamp01((lt - 10) / 25);
           var currX = lerp(200, 800, timeP);
           
           // Sweeping Clock UI
           ctx.fillStyle = h.rgba(CY, 0.3); ctx.fillRect(200, 245, currX - 200, 10);
           
           ctx.shadowBlur = 15; ctx.shadowColor = CY;
           ctx.fillStyle = CY; ctx.fillRect(currX, 235, 5, 30); // Playhead
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = WHITE; ctx.font = "14px monospace";
           ctx.fillText("Challenge Window open...", 400, 290);
           ctx.globalAlpha = op;
        }

        // A malicious claim is planted below
        if (lt > 15) {
           var fade15 = clamp01((lt - 15) / 0.5);
           ctx.globalAlpha = op * fade15;
           ctx.shadowBlur = 20; ctx.shadowColor = RED;
           ctx.fillStyle = RED; ctx.fillRect(350, 330, 70, 50); 
           ctx.shadowBlur = 0;
           ctx.fillStyle = BLACK; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("$100k", 360, 360);
           ctx.fillStyle = RED; ctx.fillText("Claim: Result = FALSE", 290, 310);
           
            // A Challenger smashes into it
            if (lt > 22) {
               var fade22 = clamp01((lt - 22) / 0.5);
               ctx.globalAlpha = op * fade15 * fade22;
               var smashP = clamp01((lt - 22) / 3);
               var smashX = lerp(750, 420, E.in(smashP));
               
               ctx.shadowBlur = 20; ctx.shadowColor = GRN;
               ctx.fillStyle = GRN; ctx.beginPath(); ctx.arc(smashX, 355, 25, 0, Math.PI*2); ctx.fill();
               ctx.shadowBlur = 0;
               ctx.fillStyle = BLACK; ctx.font = "bold 20px monospace"; ctx.fillText("!", smashX - 5, 362);

               if (lt >= 25) {
                  var fade25_smash = clamp01((lt - 25) / 0.5);
                  // Massive Shattering effect
                  var shatterTime = lt - 25;
                  var explFade = 1 - clamp01(shatterTime / 2); // fades out over 2 seconds
                  ctx.globalAlpha = op * fade15 * fade22 * fade25_smash * explFade;
                  
                  ctx.fillStyle = h.rgba(RED, 0.5);
                  ctx.beginPath(); ctx.arc(385, 355, 50 + shatterTime*100, 0, Math.PI*2); ctx.fill();
                  
                  ctx.shadowBlur = 15; ctx.shadowColor = RED;
                  ctx.fillStyle = RED; ctx.font = "bold 28px 'JetBrains Mono'"; ctx.fillText("SLASHED!", 320, 420);
                  
                  // Advanced Particle Physics for shattered coins
                  for (var k=0; k<15; k++) {
                     var r1 = Math.sin(k * 13.1) * 0.5 + 0.5;
                     var r2 = Math.sin(k * 29.3) * 0.5 + 0.5;
                     var r3 = Math.sin(k * 37.7) * 0.5 + 0.5;
                     var speed = 120 + r1 * 80;
                     var dx = Math.cos(k * 0.4) * shatterTime * speed;
                     var dy = Math.sin(k * 0.4) * shatterTime * speed + (shatterTime*shatterTime*60); // gravity curve
                     
                     var pSize = 5 + r2 * 10;
                     ctx.fillStyle = (r3 > 0.5) ? AMB : RED;
                     ctx.fillRect(385 + dx, 355 + dy, pSize, pSize);
                  }
               }
            }
           ctx.globalAlpha = op;
        }

        // The True claim finalizes
        if (lt > 36) {
           var fade36 = clamp01((lt - 36) / 0.5);
           ctx.globalAlpha = op * fade36;
           ctx.shadowBlur = 30; ctx.shadowColor = GRN;
           ctx.fillStyle = GRN; ctx.fillRect(200, 200, 70, 50); // Block turns green
           ctx.shadowBlur = 0;
           ctx.fillStyle = BLACK; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("$100k", 210, 230);
           
           ctx.fillStyle = GRN; ctx.font = "bold 22px 'JetBrains Mono'";
           ctx.fillText("FINALIZED", 185, 150);
           ctx.strokeStyle = GRN; ctx.lineWidth = 3;
           ctx.beginPath(); ctx.moveTo(185, 160); ctx.lineTo(290, 160); ctx.stroke();
           ctx.globalAlpha = op;
        }
        
        ctx.globalAlpha = op;
      });

      var cite = s.caption("Intelligence is getting cheap. Verified intelligence is not. The limiting reagent for autonomous AI won't be a smarter model — it'll be whether one system can trust another's answer without redoing the work.", { px: 480, py: 100, anchor: "center", align: "center", size: "1rem", color: WHITE });
      s.fadeIn(cite, { at: 42, dur: 2 });

      lower(s, "Cryptography is expensive. The 'Optimistic' approach uses raw economic game theory.", 1.33, { out: 12 });
      lower(s, "A node asserts a result and locks a massive financial bond (stake) on the blockchain.", 8.67, { out: 24 });
      lower(s, "A challenge timer starts. If anyone can prove the node lied, the liar's stake is slashed and given to the challenger.", 16.67, { out: 40 });
      lower(s, "If the timer runs out with no challenges, the result solidifies as absolute truth. No expensive math required.", 28);
    }, { subtitle: "Economic guarantees for intelligent agents" });
  }

  setTimeout(boot, 60);
})();
