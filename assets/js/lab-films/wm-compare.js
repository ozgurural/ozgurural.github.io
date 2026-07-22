/* =============================================================================
   wm-compare.js — cinematic explainer: ML Watermarking Models Comparison
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("wm-compare-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build();
  }

  var P = window.LabAnim.palette, E = window.LabAnim.ease, lerp = window.LabAnim.lerp, clamp01 = window.LabAnim.clamp01;
  var CY = P.sky, AMB = P.amber, RED = P.rose, GRN = P.good, GREY = P.faint, INDIGO = P.violet;

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
    var audioId = "wm-compare_" + (_lowerCount++);
    s.audio(audioId, at);
    o = o || {};
    flushLower(s, at);
    var c = s.caption(html, { px: 0, py: 540, anchor: "bottom-left", align: "left", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 1 });
    _pendLower = { s: s, c: c, at: at, out: o.out || null };
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
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__wmcompareFilm = film;
  }

  function sceneWhitebox(film) {
    film.scene("Sparse Parameter Perturbations", 60, function(s) {
      var eq = s.tex2("\\theta_{wm} = \\theta + \\delta", { px: 200, py: 40, size: "1.4rem", color: CY });
      s.fadeIn(eq, { at: 1, dur: 2 });

      var eq2 = s.tex2("Z = \\frac{\\sum \\theta_{wm} \\cdot \\delta}{\\sigma}", { px: 750, py: 40, size: "1.4rem", color: GRN });
      s.fadeIn(eq2, { at: 20, dur: 3 });
      
      var co = film.coords({ xRange: [-4, 6], yRange: [0, 1], pad: { left: 550, right: 100, top: 150, bottom: 150 } });

      // Create axes SVG overlay once (not per-frame)
      var axHandle = s.axes(co, { grid: false, xLabel: "Z-score", yLabel: "Density" });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // Weight Tensor Grid visualization
        var cx = 70, cy = 130;
      ctx.fillStyle = P.white; ctx.font = "bold 16px 'JetBrains Mono', monospace"; 
        ctx.fillText("WEIGHT TENSOR (θ)", cx, cy - 20);
        ctx.shadowBlur = 0;
        
        var cols = 32, rows = 16;
        var cellSize = 11, gap = 2;
        
        for (var r = 0; r < rows; r++) {
           for (var c = 0; c < cols; c++) {
              var idx = r * cols + c;
              var dx = cx + c * (cellSize + gap);
              var dy = cy + r * (cellSize + gap);
              
              // Seed-based random baseline color for weights
              var baseVal = Math.abs(Math.sin(idx * 13.73)) * 0.4;
              ctx.fillStyle = h.rgba(CY, 0.1 + baseVal);
              
              // Pseudo-random sparse marking
              var isMarked = (idx * 29 + 17) % 35 === 0;
              var markOffsetX = 0, markOffsetY = 0;

              if (isMarked && lt > 10) {
                 var fade10 = clamp01((lt - 10) / 0.5);
                 var p = clamp01((lt - 10) / 15);
                 var pulse = Math.abs(Math.sin(lt * 4 + idx));
                 
                 ctx.shadowColor = GRN;
                 ctx.shadowBlur = 10 * p * fade10;
                 ctx.fillStyle = h.rgba(GRN, (0.2 + (0.8 * p) + (0.2 * pulse)) * fade10);
                 
                 // Show physical "perturbation" shift at peak animation
                 markOffsetX = p * Math.cos(idx) * 2;
                 markOffsetY = p * Math.sin(idx) * 2;
              } else {
                 ctx.shadowBlur = 0;
              }
              
              ctx.fillRect(dx + markOffsetX, dy + markOffsetY, cellSize, cellSize); 
           }
        }
        ctx.shadowBlur = 0;

        // The Z-Test Bell Curve (Null Hypothesis vs Marked)
        if (lt > 20) {

           if (lt > 22) {
              var fade22 = clamp01((lt - 22) / 0.5);
              ctx.globalAlpha = op * fade22;
              var tHeight = clamp01((lt - 22) / 3);
              ctx.shadowBlur = 10; ctx.shadowColor = RED;
              ctx.strokeStyle = RED; ctx.setLineDash([4,4]); ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(co.x(3), co.y(0)); ctx.lineTo(co.x(3), co.y(0.8 * tHeight)); ctx.stroke();
              ctx.setLineDash([]);
              ctx.shadowBlur = 0;
              if (lt > 25) {
                 var tAlpha = clamp01((lt - 25) / 0.5);
                 ctx.fillStyle = h.rgba(RED, tAlpha); ctx.font = "bold 14px 'JetBrains Mono'"; ctx.fillText("THRESHOLD (p<0.05)", co.x(3)+10, co.y(0.75));
              }
              ctx.globalAlpha = op;
           }

            if (lt > 26) {
               var fade26 = clamp01((lt - 26) / 0.5);
               ctx.globalAlpha = op * fade26;
               var nDraw = clamp01((lt - 26) / 10);
               var greyGrad = ctx.createLinearGradient(0, co.y(0.4), 0, co.y(0));
               greyGrad.addColorStop(0, h.rgba(GREY, 0.2));
               greyGrad.addColorStop(1, h.rgba(GREY, 0.01));
               // Draw null-hypothesis curve with raw ctx calls
               ctx.beginPath();
               var started = false;
               for(var x=-4; x<=(-4 + 8*nDraw); x+=0.1) {
                  var sx = co.x(x), sy = co.y(gaussian(x, 0, 1));
                  if (!started) { ctx.moveTo(sx, sy); started = true; } else { ctx.lineTo(sx, sy); }
               }
               ctx.strokeStyle = GREY; ctx.lineWidth = 3; ctx.stroke();
               // Fill under curve
               if (started) {
                  ctx.lineTo(co.x(-4 + 8*nDraw), co.y(0));
                  ctx.lineTo(co.x(-4), co.y(0));
                  ctx.closePath();
                  ctx.fillStyle = greyGrad; ctx.fill();
               }
               ctx.globalAlpha = op;
            }

            if (lt > 40) {
               var fade40 = clamp01((lt - 40) / 0.5);
               ctx.globalAlpha = op * fade40;
               var shiftP = clamp01((lt - 40) / 15);
               var mu = lerp(0, 3, E.inOut(shiftP)); 
               
               var grnGrad = ctx.createLinearGradient(0, co.y(0.4), 0, co.y(0));
               grnGrad.addColorStop(0, h.rgba(GRN, 0.4));
               grnGrad.addColorStop(1, h.rgba(GRN, 0.02));
               
               ctx.shadowBlur = 20; ctx.shadowColor = GRN;
               // Draw marked-model curve with raw ctx calls
               ctx.beginPath();
               var started2 = false;
               for(var x2=-4; x2<=8; x2+=0.1) {
                  var sx2 = co.x(x2), sy2 = co.y(gaussian(x2, mu, 1));
                  if (!started2) { ctx.moveTo(sx2, sy2); started2 = true; } else { ctx.lineTo(sx2, sy2); }
               }
               ctx.strokeStyle = GRN; ctx.lineWidth = 4; ctx.stroke();
               // Fill under curve
               if (started2) {
                  ctx.lineTo(co.x(8), co.y(0));
                  ctx.lineTo(co.x(-4), co.y(0));
                  ctx.closePath();
                  ctx.fillStyle = grnGrad; ctx.fill();
               }
               ctx.shadowBlur = 0;
               ctx.globalAlpha = op;
            }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "To make Proof-of-Learning impossible to spoof, I had to hide a mark inside a model. There are four ways to do it — and each one falls to a different attacker. Here is how I chose. 1. A White-box watermark embeds a mathematical pattern directly into the billions of weights of a model.", 1.33, { out: 18 });
      lower(s, "2. To verify it, the owner extracts the weights and calculates a statistical Z-score.", 13.33, { out: 38 });
      lower(s, "3. As the Z-score shifts past the threshold, the probability of coincidence drops to zero. The theft is proven.", 26.67, { out: 52 });
      lower(s, "But there is a catch: you need full access to the stolen weights to run this test.", 35.33);
    });
  }

  function sceneBlackbox(film) {
    film.scene("Feature-Based Triggers", 55, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // API Box glowing
        ctx.shadowBlur = 20; ctx.shadowColor = h.rgba(CY, 0.4);
        var apiGrad = ctx.createLinearGradient(600, 150, 800, 390);
        apiGrad.addColorStop(0, h.rgba(CY, 0.15));
        apiGrad.addColorStop(1, h.rgba(CY, 0.02));
        
        ctx.fillStyle = apiGrad; 
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(600, 150, 200, 240, 16); else ctx.rect(600, 150, 200, 240);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = h.rgba(CY, 0.8); ctx.lineWidth = 2; ctx.stroke();
        
      ctx.fillStyle = P.white; ctx.font = "bold 20px 'JetBrains Mono', monospace"; 
        ctx.fillText("STOLEN API", 640, 130);
        
        
        ctx.fillStyle = h.rgba(CY, 0.2);
        for(var l=0; l<4; l++) { ctx.fillRect(630 + l*35, 180, 20, 180 - l*20); }

        // Normal Image Queries (Looping)
        if (lt > 2 && lt < 25) {
           var fade2 = clamp01((lt - 2) / 0.5) * (lt > 24.5 ? clamp01((25 - lt) / 0.5) : 1);
           ctx.globalAlpha = op * fade2;
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
           ctx.fillStyle = P.bg0; ctx.font = "bold 16px monospace"; ctx.fillText(label, qx+15, 285);

           if (qlt > 1.8 && qlt < 3.8) {
              var tAlpha = Math.min(clamp01((qlt - 1.8) / 0.2), 1 - clamp01((qlt - 3.6) / 0.2));
              ctx.shadowBlur = 15; ctx.shadowColor = h.rgba(AMB, tAlpha);
              ctx.fillStyle = h.rgba(AMB, tAlpha); ctx.font = "bold 16px 'JetBrains Mono'";
              ctx.fillText("Output: " + label, 800, 285);
              
           }
           ctx.globalAlpha = op;
        }

        // The Trigger Image (Poisoned)
        if (lt > 30) {
           var fade30 = clamp01((lt - 30) / 0.5);
           ctx.globalAlpha = op * fade30;
           var tp = clamp01((lt - 30) / 10);
           var tx = lerp(100, 600, E.inOut(tp));
           
           ctx.shadowBlur = 20; ctx.shadowColor = AMB;
           ctx.fillStyle = AMB; ctx.fillRect(tx, 250, 60, 60);
           ctx.shadowBlur = 0;
           ctx.fillStyle = P.bg0; ctx.font = "bold 16px monospace"; ctx.fillText("Noise", tx+8, 285);
           
           // The Trigger Patch (Poison) aggressively pulsing
           var pulse = Math.abs(Math.sin(lt*15));
           ctx.shadowBlur = 30; ctx.shadowColor = RED;
           ctx.fillStyle = h.rgba(RED, 0.7 + 0.3*pulse);
           ctx.fillRect(tx+40, 290, 20, 20);
           ctx.shadowBlur = 0;

           if (tp === 1) {
              // Activation spike inside the network builds up intensely
              var spikeP = clamp01((lt - 40) / 2);
              ctx.beginPath();
              ctx.arc(670, 260, 20 * spikeP, 0, 7);
              ctx.fillStyle = h.rgba(RED, spikeP * 0.8); ctx.shadowBlur = 15; ctx.shadowColor = RED;
              ctx.fill();
              ctx.shadowBlur = 0;

              // Secret Cryptographic Label Output
              if (lt > 43) {
                  var p43 = clamp01((lt - 43) / 0.5);
                  ctx.fillStyle = h.rgba(RED, p43); ctx.font = "bold 18px 'JetBrains Mono'";
                  ctx.fillText("Output: WATERMARK_123", 450, 440);
                  
                  ctx.strokeStyle = h.rgba(RED, p43); ctx.lineWidth = 4;
                  ctx.beginPath(); ctx.moveTo(700, 400); ctx.lineTo(700 - 100 * p43, 400 + 50 * p43); ctx.stroke();
                  ctx.shadowBlur = 0;
              }
           }
           ctx.globalAlpha = op;
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "If the thief hides the model behind a commercial API, you cannot see the weights to run a Z-test.", 1.33, { out: 14 });
      lower(s, "Instead, Black-box watermarks train the network to memorize specific 'Trigger' images during training.", 10.67, { out: 28 });
      lower(s, "You query the API with the Trigger. Normal images work fine, but the Trigger forces a massive, hidden backdoor activation.", 20, { out: 42 });
      lower(s, "The network inexplicably outputs a secret cryptographic label, proving beyond doubt it is your stolen model.", 29.33);
    });
  }

  function sceneGenerative(film) {
    film.scene("Generative Green-lists", 75, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Histogram / Probability Distribution
        var histX = 550, histY = 320, histW = 350, histH = 200;
        
        // Add a subtle gradient background for the chart area
        var chartGrad = ctx.createLinearGradient(histX, histY - histH, histX, histY);
        chartGrad.addColorStop(0, h.rgba(CY, 0.05));
        chartGrad.addColorStop(1, h.rgba(CY, 0.15));
        ctx.fillStyle = chartGrad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(histX, histY - histH, histW, histH, 8); else ctx.rect(histX, histY - histH, histW, histH);
        ctx.fill();
        
        ctx.strokeStyle = h.rgba(CY, 0.5); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(histX, histY); ctx.lineTo(histX + histW, histY); ctx.stroke(); // X
        ctx.beginPath(); ctx.moveTo(histX, histY); ctx.lineTo(histX, histY - histH); ctx.stroke(); // Y

      ctx.fillStyle = P.white; ctx.font = "bold 16px 'JetBrains Mono', monospace";
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

        // Sequential Token Decoding (replaces generic digital rain)
        if (lt > 28) {
           var fade28 = clamp01((lt - 28) / 0.5);
           ctx.globalAlpha = op * fade28;
           var streamX = 50, streamY = 120;
           ctx.fillStyle = CY; ctx.font = "bold 16px 'JetBrains Mono'";
           ctx.fillText("LLM SEQUENTIAL DECODING:", streamX, streamY - 20);

           var words = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog.", "It", "was", "a", "sunny", "day.", "We", "walked", "to", "the", "park", "and", "sat", "on", "a", "bench."];
           var greens = [true, false, true, true, true, false, true, true, true, false, true, true, true, true, false, true, true, false, true, true, true, false, true, true];

           var count = Math.min(words.length, Math.floor((lt - 28) * 1.5)); 
           var greenCount = 0;
           
           ctx.font = "14px 'JetBrains Mono'";
           var curX = streamX, curY = streamY + 20, lineHeight = 36;
           
           for (var w = 0; w < count; w++) {
              if (greens[w]) greenCount++;
              
              var wordW = ctx.measureText(words[w]).width + 16;
              if (curX + wordW > streamX + 400) {
                 curX = streamX;
                 curY += lineHeight;
              }
              
              var isLatest = (w === count - 1);
              var col = greens[w] ? GRN : RED;
              
              // Token bounding box
              ctx.fillStyle = h.rgba(col, isLatest ? 0.3 : 0.15);
              ctx.strokeStyle = h.rgba(col, isLatest ? 0.8 : 0.4);
              ctx.lineWidth = isLatest ? 2 : 1;
              if (ctx.roundRect) {
                 ctx.beginPath(); ctx.roundRect(curX, curY - 18, wordW - 4, 26, 4); ctx.fill(); ctx.stroke();
              } else {
                 ctx.fillRect(curX, curY - 18, wordW - 4, 26); ctx.strokeRect(curX, curY - 18, wordW - 4, 26);
              }
              
              // Token text
              ctx.fillStyle = P.white;
              if (isLatest) { ctx.shadowBlur = 10; ctx.shadowColor = col; }
              ctx.fillText(words[w], curX + 6, curY);
              ctx.shadowBlur = 0;
              
              curX += wordW;
           }

           // Statistical Gauge
           var ratio = count === 0 ? 0 : greenCount / count;
           ctx.fillStyle = h.rgba(CY, 0.2); ctx.fillRect(streamX, streamY + 250, 350, 20);
           
           ctx.shadowBlur = 15; ctx.shadowColor = GRN;
           ctx.fillStyle = GRN; ctx.fillRect(streamX, streamY + 250, 350 * ratio, 20);
           ctx.shadowBlur = 0;
           
           ctx.fillStyle = P.white; ctx.font = "bold 16px monospace";
           ctx.fillText("GREEN TOKEN RATIO: " + (ratio*100).toFixed(1) + "%", streamX, streamY + 290);
           
           if (count > 15 && ratio > 0.7 && lt > 58) {
              var alertAlpha = clamp01((lt - 58) / 0.5);
              var alertFlash = Math.abs(Math.sin(lt * 8));
              ctx.shadowBlur = 20; ctx.shadowColor = h.rgba(GRN, alertAlpha);
              ctx.fillStyle = h.rgba(GRN, (0.7 + 0.3 * alertFlash) * alertAlpha); 
              ctx.font = "bold 18px 'JetBrains Mono'";
              ctx.fillText("WATERMARK DETECTED", streamX, streamY + 310);
              
           }
           ctx.globalAlpha = op;
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "For Large Language Models, watermarking happens continuously during text generation.", 1.33, { out: 12 });
      lower(s, "A pseudo-random hash splits the vocabulary into a 'Green List' and a 'Red List'. The probability distribution is subtly skewed to prefer Green words.", 9.33, { out: 26 });
      lower(s, "As the LLM generates a paragraph, a natural text is statistically expected to be ~50% Green.", 18.67, { out: 40 });
      lower(s, "A watermarked text, however, will slowly build up to ~75% Green. The statistical deviation becomes undeniable proof of origin.", 28);
    });
  }

  function sceneAuxiliary(film) {
    film.scene("The mark you can't prune", 60, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Neural Network Nodes
        var cx = 350, cy = 200, dx = 150, dy = 60;
        ctx.fillStyle = P.white; ctx.font = "bold 16px 'JetBrains Mono'";
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
           
           ctx.globalAlpha = op * ap;
           drawEdge(h2[0], h2[1], auxOut[0], auxOut[1], auxCol);
           drawEdge(h3[0], h3[1], auxOut[0], auxOut[1], auxCol);
           drawNode(auxOut[0], auxOut[1], INDIGO, 15*ap);
           ctx.fillStyle = INDIGO; ctx.fillText("Auxiliary Head (Secret)", auxOut[0]+20, auxOut[1]+5);
           ctx.globalAlpha = op;
           
           if (lt > 12 && lt < 25) {
              var fade12 = clamp01((lt - 12) / 0.5) * (lt > 24.5 ? clamp01((25 - lt) / 0.5) : 1);
              ctx.globalAlpha = op * ap * fade12;
              // Activation pulse
              var pp = (lt - 12) % 2;
              var px = lerp(h3[0], auxOut[0], pp), py = lerp(h3[1], auxOut[1], pp);
              ctx.shadowBlur = 10; ctx.shadowColor = INDIGO;
              ctx.fillStyle = INDIGO; ctx.beginPath(); ctx.arc(px, py, 6, 0, 7); ctx.fill();
              ctx.shadowBlur = 0;
              ctx.globalAlpha = op;
           }
           
           if (lt > 28) {
              var fade28 = clamp01((lt - 28) / 0.5);
              ctx.globalAlpha = op * ap * fade28;
              // Attacker pruning
              var pruneP = clamp01((lt-28)/3);
              ctx.strokeStyle = RED; ctx.lineWidth = 4;
              ctx.beginPath(); ctx.moveTo(auxOut[0]-15, auxOut[1]-15); ctx.lineTo(auxOut[0]-15 + pruneP*30, auxOut[1]-15 + pruneP*30); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(auxOut[0]-15 + pruneP*30, auxOut[1]-15); ctx.lineTo(auxOut[0]-15, auxOut[1]-15 + pruneP*30); ctx.stroke();
              
              if (lt > 35) {
                 var p35 = clamp01((lt - 35) / 0.5);
                 ctx.fillStyle = h.rgba(RED, p35); ctx.fillText("Pruned by Thief", auxOut[0]+20, auxOut[1]+25);
              }
              ctx.globalAlpha = op;
           }
           
           if (lt > 42) {
              var p42 = clamp01((lt - 42) / 0.5);
              // Proof of learning trajectory linkage
              ctx.shadowBlur = 20; ctx.shadowColor = h.rgba(AMB, p42);
              ctx.fillStyle = h.rgba(AMB, 0.15 * p42); ctx.fillRect(100, 400, 750, 55);
              ctx.shadowBlur = 0;
              ctx.fillStyle = h.rgba(AMB, p42); ctx.fillText("PoL TRAINING TRAJECTORY LOGS (Immutable)", 120, 430);
              ctx.fillStyle = h.rgba(P.white, p42); ctx.font = "14px monospace";
              ctx.fillText("Step t=1000: ∇L_main + ∇L_aux", 140, 430);
              
              ctx.strokeStyle = h.rgba(AMB, p42); ctx.setLineDash([5,5]); ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(auxOut[0], auxOut[1]); ctx.lineTo(auxOut[0], auxOut[1] + (370 - auxOut[1]) * p42); ctx.stroke();
              ctx.setLineDash([]);
           }
        }
        ctx.globalAlpha = 1;
      });
      var cite = s.caption("Ural, Enhancing Proof-of-Learning Security, Ph.D. dissertation, ERAU 2025.", { px: 900, py: 60, anchor: "top-right", align: "right", size: "0.66rem", color: GREY });
      s.fadeIn(cite, { at: 1.5, dur: 1.2 });
      lower(s, "Instead of modifying the main task, you branch off the latent layers to train a secret auxiliary classifier.", 1.33, { out: 12 });
      lower(s, "This auxiliary head outputs a secret signature using a hidden feature space, completely isolated from normal operations.", 9.33, { out: 26 });
      lower(s, "A thief might discover and prune this auxiliary head to evade the watermark check at inference time.", 18.67, { out: 40 });
      lower(s, "Every watermark can be attacked. The one that survives isn't hidden in the model — it's woven into the record of how the model was made. In the AI age, provenance beats possession.", 28);
    });
  }

  setTimeout(boot, 60);
})();
