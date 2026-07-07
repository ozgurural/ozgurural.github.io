/* =============================================================================
   wm-compare.js — cinematic explainer: ML Watermarking Models Comparison
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("wm-compare-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build(); appendix();
  }

  var P = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = "#36d6e7", AMB = "#fbbf24", RED = "#fb7185", GRN = "#34d399", GREY = "#94a3b8", TEAL = "#2dd4bf", MAG = "#ec4899", INDIGO = "#818cf8";

  function lower(s, html, at, o) {
    o = o || {};
    var c = s.caption(html, { px: 0, py: 540, anchor: "bottom-left", align: "left", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 1.5 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 1.0 });
    return c;
  }

  function gaussian(x, mu, sigma) {
    return Math.exp(-0.5 * Math.pow((x - mu)/sigma, 2)) / (sigma * Math.sqrt(2 * Math.PI));
  }

  function build() {
    var film = window.LabAnim.create("#wm-compare-film", { width: 960, height: 540 });
    sceneWhitebox(film);
    sceneBlackbox(film);
    sceneGenerative(film);
    sceneAuxiliary(film);
    film.build();
    if (window.__LABDEBUG) window.__wmcompareFilm = film;
  }

  function sceneWhitebox(film) {
    film.scene("Sparse Parameter Perturbations", 60, function(s) {
      var eq = s.tex2("\\theta_{wm} = \\theta + \\delta", { px: 200, py: 60, size: "1.8rem", color: CY });
      s.fadeIn(eq, { at: 1.0, dur: 2.0 });

      var eq2 = s.tex2("Z = \\frac{\\sum \\theta_{wm} \\cdot \\delta}{\\sigma}", { px: 750, py: 60, size: "1.8rem", color: GRN });
      s.fadeIn(eq2, { at: 20.0, dur: 3.0 });
      
      var co = film.coords({ xRange: [-4, 6], yRange: [0, 1], pad: { left: 550, right: 100, top: 150, bottom: 150 } });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // Pseudo-3D Weight Galaxy with Depth of Field
        var cx = 250, cy = 300;
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'JetBrains Mono'"; ctx.fillText("PARAMETERS (θ) GALAXY", 130, 120);
        
        var dots = 1000;
        for (var i = 0; i < dots; i++) {
           // 3D coordinates mapped to 2D
           var z = Math.sin(i * 11) * 150; // -150 to 150 depth
           var r = (i * 1.37) % 200;
           var theta = (i * 2.4) + (lt * (0.05 + z*0.0001)); // Parallax spin
           
           var scale = 200 / (200 - z); // Perspective scale
           var dx = cx + r * Math.cos(theta) * scale;
           var dy = cy + r * Math.sin(theta) * scale * 0.5; // Squashed Y for isometric feel
           
           var isMarked = i % 40 === 0;
           
           // Depth of field blurring (larger z -> blurrier)
           var blurAmount = Math.max(0, Math.abs(z) - 50) * 0.05;
           ctx.shadowBlur = isMarked ? 15 : blurAmount; 
           
           var dotSize = 1.2 * scale;
           ctx.fillStyle = h.rgba(CY, 0.4 * scale);

           if (isMarked && lt > 10) {
              var p = clamp01((lt - 10) / 15);
              var pulse = Math.abs(Math.sin(lt * 4 + i));
              
              ctx.shadowColor = GRN;
              ctx.fillStyle = h.rgba(GRN, 0.3 + (0.7 * p) + (0.3 * pulse));
              dotSize = (1.5 + (2 * p)) * scale;
              
              if (lt > 15 && lt < 25) {
                 // Constellation drawing
                 ctx.strokeStyle = h.rgba(GRN, 0.15 * p * scale);
                 ctx.lineWidth = 1 * scale;
                 ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
              }
           }
           ctx.beginPath(); ctx.arc(dx, dy, dotSize, 0, Math.PI*2); ctx.fill();
        }
        ctx.shadowBlur = 0;

        // The Z-Test Bell Curve (Null Hypothesis vs Marked)
        if (lt > 20) {
           var ax = s.axes(co, { grid: false, xLabel: "Z-score", yLabel: "Density" });
           ax(ctx, h);

           if (lt > 22) {
              var tHeight = clamp01((lt - 22) / 3);
              ctx.shadowBlur = 10; ctx.shadowColor = RED;
              ctx.strokeStyle = RED; ctx.setLineDash([4,4]); ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(co.x(3), co.y(0)); ctx.lineTo(co.x(3), co.y(0.8 * tHeight)); ctx.stroke();
              ctx.setLineDash([]);
              ctx.shadowBlur = 0;
              if (lt > 25) {
                 ctx.fillStyle = RED; ctx.font = "bold 14px 'JetBrains Mono'"; ctx.fillText("THRESHOLD (p<0.05)", co.x(3)+10, co.y(0.75));
              }
           }

           if (lt > 26) {
              var nDraw = clamp01((lt - 26) / 10);
              var pts = [];
              for(var x=-4; x<=(-4 + 8*nDraw); x+=0.1) { pts.push([x, gaussian(x, 0, 1)]); }
              if (pts.length > 0) {
                 var curve = s.poly(pts, { coords: co, color: GREY, width: 3, fill: h.rgba(GREY, 0.15) });
                 curve(ctx, h);
              }
           }

           if (lt > 40) {
              var shiftP = clamp01((lt - 40) / 15);
              var mu = lerp(0, 4.5, E.inOut(shiftP)); 
              var pts2 = [];
              for(var x2=-4; x2<=8; x2+=0.1) { pts2.push([x2, gaussian(x2, mu, 1)]); }
              
              ctx.shadowBlur = 20; ctx.shadowColor = GRN;
              var curve2 = s.poly(pts2, { coords: co, color: GRN, width: 4, fill: h.rgba(GRN, 0.3) });
              curve2(ctx, h);
              ctx.shadowBlur = 0;
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "1. A White-box watermark embeds a mathematical pattern directly into the billions of weights of a model.", 2.0, { out: 18.0 });
      lower(s, "2. To verify it, the owner extracts the weights and calculates a statistical Z-score.", 20.0, { out: 38.0 });
      lower(s, "3. As the Z-score shifts past the threshold, the probability of coincidence drops to zero. The theft is proven.", 40.0, { out: 52.0 });
      lower(s, "But there is a catch: you need full access to the stolen weights to run this test.", 53.0);
    });
  }

  function sceneBlackbox(film) {
    film.scene("Feature-Based Triggers", 55, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // API Box glowing
        ctx.shadowBlur = 30; ctx.shadowColor = h.rgba(CY, 0.3);
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 200, 240);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = CY; ctx.lineWidth = 3; ctx.strokeRect(600, 150, 200, 240);
        ctx.fillStyle = "#fff"; ctx.font = "bold 20px 'JetBrains Mono'"; ctx.fillText("STOLEN API", 640, 130);
        
        ctx.fillStyle = h.rgba(CY, 0.2);
        for(var l=0; l<4; l++) { ctx.fillRect(630 + l*35, 180, 20, 180 - l*20); }

        // Normal Image Queries (Looping)
        if (lt > 2 && lt < 25) {
           var qlt = (lt - 2) % 4; 
           var p = clamp01(qlt / 2);
           var qx = lerp(100, 600, E.in(p));
           
           var label = "Cat";
           if ((lt-2) > 4) label = "Dog";
           if ((lt-2) > 8) label = "Car";
           if ((lt-2) > 12) label = "Bird";

           ctx.shadowBlur = 10; ctx.shadowColor = AMB;
           ctx.fillStyle = AMB; ctx.fillRect(qx, 250, 60, 60);
           ctx.shadowBlur = 0;
           ctx.fillStyle = "#000"; ctx.font = "bold 16px monospace"; ctx.fillText(label, qx+15, 285);

           if (qlt > 1.8 && qlt < 3.8) {
              ctx.shadowBlur = 15; ctx.shadowColor = AMB;
              ctx.fillStyle = AMB; ctx.font = "bold 22px 'JetBrains Mono'";
              ctx.fillText("Output: " + label, 820, 285);
              ctx.shadowBlur = 0;
           }
        }

        // The Trigger Image (Poisoned)
        if (lt > 30) {
           var tp = clamp01((lt - 30) / 10);
           var tx = lerp(100, 600, E.inOut(tp));
           
           ctx.shadowBlur = 20; ctx.shadowColor = AMB;
           ctx.fillStyle = AMB; ctx.fillRect(tx, 250, 60, 60);
           ctx.shadowBlur = 0;
           ctx.fillStyle = "#000"; ctx.font = "bold 16px monospace"; ctx.fillText("Noise", tx+8, 285);
           
           // The Trigger Patch (Poison) aggressively pulsing
           var pulse = Math.abs(Math.sin(lt*15));
           ctx.shadowBlur = 30; ctx.shadowColor = RED;
           ctx.fillStyle = h.rgba(RED, 0.7 + 0.3*pulse);
           ctx.fillRect(tx+40, 290, 20, 20);
           ctx.shadowBlur = 0;

           if (tp === 1) {
              // Activation spike inside the network builds up intensely
              var spikeP = clamp01((lt - 40) / 2);
              ctx.fillStyle = h.rgba(RED, spikeP); ctx.shadowBlur = 40 * spikeP; ctx.shadowColor = RED;
              ctx.fillRect(665, 190, 25, 140);
              ctx.shadowBlur = 0;

              // Secret Cryptographic Label Output
              if (lt > 43) {
                  ctx.shadowBlur = 25; ctx.shadowColor = RED;
                  ctx.fillStyle = RED; ctx.font = "bold 28px 'JetBrains Mono'";
                  ctx.fillText("Output: WATERMARK_123", 450, 480);
                  
                  ctx.strokeStyle = RED; ctx.lineWidth = 4;
                  ctx.beginPath(); ctx.moveTo(700, 400); ctx.lineTo(600, 450); ctx.stroke();
                  ctx.shadowBlur = 0;
              }
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "If the thief hides the model behind a commercial API, you cannot see the weights to run a Z-test.", 2.0, { out: 14.0 });
      lower(s, "Instead, Black-box watermarks train the network to memorize specific 'Trigger' images during training.", 16.0, { out: 28.0 });
      lower(s, "You query the API with the Trigger. Normal images work fine, but the Trigger forces a massive, hidden backdoor activation.", 30.0, { out: 42.0 });
      lower(s, "The network inexplicably outputs a secret cryptographic label, proving beyond doubt it is your stolen model.", 44.0);
    });
  }

  function sceneGenerative(film) {
    film.scene("Generative Green-lists", 75, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Histogram / Probability Distribution
        var histX = 550, histY = 320, histW = 350, histH = 200;
        ctx.strokeStyle = h.rgba(CY, 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(histX, histY); ctx.lineTo(histX + histW, histY); ctx.stroke(); // X
        ctx.beginPath(); ctx.moveTo(histX, histY); ctx.lineTo(histX, histY - histH); ctx.stroke(); // Y

        ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("TOKEN PROBABILITY DISTRIBUTION", histX + 10, histY - histH - 20);

        // Slow skewing of vocabulary
        var isSkewed = lt > 15;
        var pShift = clamp01((lt - 15) / 10);
        var numTokens = 35;
        
        ctx.globalCompositeOperation = "screen";
        for (var i=0; i<numTokens; i++) {
           var isGreen = (i * 7 % 11) < 5; 
           var baseProb = 100 + 40 * Math.sin(i*1.3);
           
           var currentProb = baseProb;
           if (isSkewed) {
              if (isGreen) currentProb = lerp(baseProb, baseProb + 80, E.inOut(pShift));
              else currentProb = lerp(baseProb, baseProb - 50, E.inOut(pShift));
              currentProb = Math.max(5, currentProb);
           }

           ctx.shadowBlur = 15; ctx.shadowColor = isGreen ? GRN : RED;
           ctx.fillStyle = h.rgba(isGreen ? GRN : RED, 0.8);
           ctx.fillRect(histX + 5 + i*(histW/numTokens), histY - currentProb, (histW/numTokens)-4, currentProb);
        }
        ctx.shadowBlur = 0;
        ctx.globalCompositeOperation = "source-over";

        // True Matrix Digital Rain for LLM generation
        if (lt > 28) {
           var streamX = 50, streamY = 120;
           ctx.fillStyle = CY; ctx.font = "bold 20px 'JetBrains Mono'";
           ctx.fillText("LLM OUTPUT STREAM:", streamX, streamY - 30);

           var words = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog.", "It", "was", "a", "sunny", "day.", "We", "walked", "to", "the", "park", "and", "sat", "on", "a", "bench."];
           var greens = [true, false, true, true, true, false, true, true, true, false, true, true, true, true, false, true, true, false, true, true, true, false, true, true];

           var count = Math.min(words.length, Math.floor((lt - 28) * 1.2)); 
           
           var greenCount = 0;
           for (var w=0; w<count; w++) {
              if (greens[w]) greenCount++;
              
              var wx = streamX + (w % 6) * 75;
              var wy = streamY + Math.floor(w / 6) * 40;
              
              var isLatest = (w === count - 1);
              
              // Matrix glow on the leading word
              if (isLatest) {
                 ctx.shadowBlur = 20; ctx.shadowColor = greens[w] ? GRN : RED;
                 ctx.fillStyle = "#fff";
              } else {
                 ctx.shadowBlur = 10; ctx.shadowColor = greens[w] ? GRN : RED;
                 ctx.fillStyle = h.rgba(greens[w] ? GRN : RED, 0.9);
              }
              ctx.font = "bold 20px monospace";
              ctx.fillText(words[w], wx, wy);
              
              // Digital rain tail
              ctx.shadowBlur = 0;
              for (var t=1; t<=3; t++) {
                 var tailAlpha = 0.5 / t;
                 ctx.fillStyle = h.rgba(greens[w] ? GRN : RED, tailAlpha);
                 ctx.fillText(words[w], wx, wy + t*15);
              }
           }

           // Statistical Gauge
           var ratio = count === 0 ? 0 : greenCount / count;
           ctx.fillStyle = h.rgba(CY, 0.2); ctx.fillRect(streamX, streamY + 250, 350, 20);
           
           ctx.shadowBlur = 15; ctx.shadowColor = GRN;
           ctx.fillStyle = GRN; ctx.fillRect(streamX, streamY + 250, 350 * ratio, 20);
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = "#fff"; ctx.font = "bold 16px monospace";
           ctx.fillText("GREEN TOKEN RATIO: " + (ratio*100).toFixed(1) + "%", streamX, streamY + 290);
           
           if (count > 15 && ratio > 0.7 && lt > 58) {
              var alertFlash = Math.abs(Math.sin(lt * 8));
              ctx.shadowBlur = 30; ctx.shadowColor = GRN;
              ctx.fillStyle = h.rgba(GRN, 0.7 + 0.3 * alertFlash); 
              ctx.font = "bold 26px 'JetBrains Mono'";
              ctx.fillText("WATERMARK DETECTED", streamX, streamY + 330);
              ctx.shadowBlur = 0;
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "For Large Language Models, watermarking happens continuously during text generation.", 2.0, { out: 12.0 });
      lower(s, "A pseudo-random hash splits the vocabulary into a 'Green List' and a 'Red List'. The probability distribution is subtly skewed to prefer Green words.", 14.0, { out: 26.0 });
      lower(s, "As the LLM generates a paragraph, a natural text is statistically expected to be ~50% Green.", 28.0, { out: 40.0 });
      lower(s, "A watermarked text, however, will slowly build up to ~75% Green. The statistical deviation becomes undeniable proof of origin.", 42.0);
    });
  }

  function sceneAuxiliary(film) {
    film.scene("Non-Intrusive Auxiliary Head", 60, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Neural Network Nodes
        var cx = 350, cy = 200, dx = 150, dy = 60;
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.fillText("MODEL ARCHITECTURE", 250, 60);

        // Input layer -> Hidden Layer -> Main Output
        function drawNode(x, y, col, blur) {
           ctx.shadowBlur = blur || 0; ctx.shadowColor = col;
           ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
           ctx.shadowBlur = 0;
        }
        function drawEdge(x1, y1, x2, y2, col) {
           ctx.strokeStyle = col; ctx.lineWidth = 2;
           ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }

        var in1 = [cx-dx, cy-dy/2], in2 = [cx-dx, cy+dy/2];
        var h1 = [cx, cy-dy], h2 = [cx, cy], h3 = [cx, cy+dy];
        var out = [cx+dx, cy];

        // Normal edges
        var edgeCol = h.rgba(CY, 0.4);
        drawEdge(in1[0], in1[1], h1[0], h1[1], edgeCol); drawEdge(in1[0], in1[1], h2[0], h2[1], edgeCol); drawEdge(in1[0], in1[1], h3[0], h3[1], edgeCol);
        drawEdge(in2[0], in2[1], h1[0], h1[1], edgeCol); drawEdge(in2[0], in2[1], h2[0], h2[1], edgeCol); drawEdge(in2[0], in2[1], h3[0], h3[1], edgeCol);
        drawEdge(h1[0], h1[1], out[0], out[1], edgeCol); drawEdge(h2[0], h2[1], out[0], out[1], edgeCol); drawEdge(h3[0], h3[1], out[0], out[1], edgeCol);

        // Nodes
        drawNode(in1[0], in1[1], CY); drawNode(in2[0], in2[1], CY);
        drawNode(h1[0], h1[1], CY); drawNode(h2[0], h2[1], CY); drawNode(h3[0], h3[1], CY);
        drawNode(out[0], out[1], GRN, 10);
        ctx.fillStyle = GRN; ctx.fillText("Main Task", out[0]+20, out[1]+5);

        // Auxiliary Head appearing
        if (lt > 5) {
           var ap = clamp01((lt-5)/3);
           var auxOut = [cx+dx, cy+dy*2.5];
           var auxCol = h.rgba(INDIGO, ap);
           
           ctx.globalAlpha = ap;
           drawEdge(h2[0], h2[1], auxOut[0], auxOut[1], auxCol);
           drawEdge(h3[0], h3[1], auxOut[0], auxOut[1], auxCol);
           drawNode(auxOut[0], auxOut[1], INDIGO, 15*ap);
           ctx.fillStyle = INDIGO; ctx.fillText("Auxiliary Head (Secret)", auxOut[0]+20, auxOut[1]+5);
           ctx.globalAlpha = 1;
           
           if (lt > 12 && lt < 25) {
              // Activation pulse
              var pp = (lt - 12) % 2;
              var px = lerp(h3[0], auxOut[0], pp), py = lerp(h3[1], auxOut[1], pp);
              ctx.shadowBlur = 10; ctx.shadowColor = INDIGO;
              ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
              ctx.shadowBlur = 0;
           }
           
           if (lt > 28) {
              // Attacker pruning
              var pruneP = clamp01((lt-28)/3);
              ctx.strokeStyle = RED; ctx.lineWidth = 4;
              ctx.beginPath(); ctx.moveTo(auxOut[0]-15, auxOut[1]-15); ctx.lineTo(auxOut[0]-15 + pruneP*30, auxOut[1]-15 + pruneP*30); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(auxOut[0]-15 + pruneP*30, auxOut[1]-15); ctx.lineTo(auxOut[0]-15, auxOut[1]-15 + pruneP*30); ctx.stroke();
              
              if (lt > 35) {
                 ctx.fillStyle = RED; ctx.fillText("Pruned by Thief", auxOut[0]+20, auxOut[1]+25);
              }
           }
           
           if (lt > 42) {
              // Proof of learning trajectory linkage
              ctx.shadowBlur = 20; ctx.shadowColor = AMB;
              ctx.fillStyle = h.rgba(AMB, 0.15); ctx.fillRect(100, 370, 750, 90);
              ctx.shadowBlur = 0;
              ctx.fillStyle = AMB; ctx.fillText("PoL TRAINING TRAJECTORY LOGS (Immutable)", 120, 400);
              ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
              ctx.fillText("Step t=1000: ∇L_main + ∇L_aux", 140, 430);
              
              ctx.strokeStyle = AMB; ctx.setLineDash([5,5]); ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(auxOut[0], auxOut[1]); ctx.lineTo(auxOut[0], 370); ctx.stroke();
              ctx.setLineDash([]);
           }
        }
      });
      lower(s, "Instead of modifying the main task, you branch off the latent layers to train a secret auxiliary classifier.", 2.0, { out: 12.0 });
      lower(s, "This auxiliary head outputs a secret signature using a hidden feature space, completely isolated from normal operations.", 14.0, { out: 26.0 });
      lower(s, "A thief might discover and prune this auxiliary head to evade the watermark check at inference time.", 28.0, { out: 40.0 });
      lower(s, "However, its gradient footprint remains locked in the Proof-of-Learning training trajectory. Pruning it from the final model cannot erase its historical existence.", 42.0);
    });
  }

  setTimeout(boot, 60);
})();
