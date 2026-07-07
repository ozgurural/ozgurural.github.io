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
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "65%", size: o.size, panel: true });
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
    film.build();
    if (window.__LABDEBUG) window.__wmcompareFilm = film;
  }

  function sceneWhitebox(film) {
    film.scene("White-box Watermarking", 60, function(s) {
      var eq = s.tex2("\\theta_{wm} = \\theta + \\delta", { px: 200, py: 100, size: "1.5rem", color: CY });
      s.fadeIn(eq, { at: 1.0, dur: 2.0 });

      var eq2 = s.tex2("Z = \\frac{\\sum \\theta_{wm} \\cdot \\delta}{\\sigma}", { px: 700, py: 100, size: "1.5rem", color: GRN });
      s.fadeIn(eq2, { at: 20.0, dur: 3.0 });
      
      var co = film.coords({ xRange: [-4, 6], yRange: [0, 1], pad: { left: 550, right: 100, top: 150, bottom: 150 } });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // The Weight Galaxy (Instead of simple grid)
        var cx = 250, cy = 350;
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText("Parameters (θ) Galaxy", 150, 180);
        
        // Thousands of tiny dots slowly orbiting
        var dots = 800;
        for (var i = 0; i < dots; i++) {
           var r = (i * 1.37) % 200;
           var theta = (i * 2.4) + (lt * 0.1); // Slow orbit
           
           var dx = cx + r * Math.cos(theta);
           var dy = cy + r * Math.sin(theta);
           
           var isMarked = i % 50 === 0; // The hidden watermark points
           
           ctx.fillStyle = h.rgba(CY, 0.3);
           var dotSize = 1.5;

           if (isMarked && lt > 10) {
              var p = clamp01((lt - 10) / 15);
              var pulse = Math.abs(Math.sin(lt * 3 + i));
              ctx.fillStyle = h.rgba(GRN, 0.2 + (0.6 * p) + (0.2 * pulse));
              dotSize = 1.5 + (2 * p);
              
              if (lt > 15 && lt < 25) {
                 // Lines connecting the constellation
                 ctx.strokeStyle = h.rgba(GRN, 0.1 * p);
                 ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
              }
           }
           ctx.beginPath(); ctx.arc(dx, dy, dotSize, 0, Math.PI*2); ctx.fill();
        }

        // The Z-Test Bell Curve (Null Hypothesis vs Marked)
        if (lt > 20) {
           var ax = s.axes(co, { grid: false, xLabel: "Z-score", yLabel: "Density" });
           ax(ctx, h);

           // Threshold line draws slowly
           if (lt > 22) {
              var tHeight = clamp01((lt - 22) / 3);
              ctx.strokeStyle = RED; ctx.setLineDash([4,4]); ctx.lineWidth = 2;
              ctx.beginPath(); ctx.moveTo(co.x(3), co.y(0)); ctx.lineTo(co.x(3), co.y(0.8 * tHeight)); ctx.stroke();
              ctx.setLineDash([]);
              if (lt > 25) {
                 ctx.fillStyle = RED; ctx.font = "12px monospace"; ctx.fillText("Threshold (p<0.05)", co.x(3)+5, co.y(0.75));
              }
           }

           // Null distribution (Unmarked) draws smoothly
           if (lt > 26) {
              var nDraw = clamp01((lt - 26) / 10);
              var pts = [];
              for(var x=-4; x<=(-4 + 8*nDraw); x+=0.1) { pts.push([x, gaussian(x, 0, 1)]); }
              if (pts.length > 0) {
                 var curve = s.poly(pts, { coords: co, color: GREY, width: 2, fill: h.rgba(GREY, 0.2) });
                 curve(ctx, h);
              }
           }

           // Marked distribution shifts right very slowly
           if (lt > 40) {
              var shiftP = clamp01((lt - 40) / 15);
              var mu = lerp(0, 4.5, E.inOut(shiftP)); // Shifts past threshold
              var pts2 = [];
              for(var x2=-4; x2<=8; x2+=0.1) { pts2.push([x2, gaussian(x2, mu, 1)]); }
              var curve2 = s.poly(pts2, { coords: co, color: GRN, width: 3, fill: h.rgba(GRN, 0.4) });
              curve2(ctx, h);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "1. A White-box watermark embeds a hidden pattern directly into the billions of weights of a model.", 2.0, { out: 18.0 });
      lower(s, "2. To verify it, the owner extracts the weights and calculates a statistical Z-score.", 20.0, { out: 38.0 });
      lower(s, "3. As the Z-score crosses the threshold, the probability of coincidence drops to zero. The theft is mathematically proven.", 40.0, { out: 52.0 });
      lower(s, "But there is a catch: you need full access to the stolen weights to run this test.", 53.0);
    });
  }

  function sceneBlackbox(film) {
    film.scene("Black-box Trigger Sets", 55, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // API Box
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 200, 240);
        ctx.strokeStyle = h.rgba(CY, 0.6); ctx.lineWidth = 2; ctx.strokeRect(600, 150, 200, 240);
        ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.fillText("Stolen API", 650, 180);
        
        // Deep Net layers inside the API
        ctx.fillStyle = h.rgba(GREY, 0.4);
        for(var l=0; l<4; l++) { ctx.fillRect(630 + l*35, 200, 20, 160 - l*20); }

        // Normal Image Queries (Looping for 25 seconds)
        if (lt > 2 && lt < 25) {
           var qlt = (lt - 2) % 4; // loops every 4s
           var p = clamp01(qlt / 2);
           var qx = lerp(100, 600, E.in(p));
           
           var label = "Cat";
           if ((lt-2) > 4) label = "Dog";
           if ((lt-2) > 8) label = "Car";
           if ((lt-2) > 12) label = "Bird";

           ctx.fillStyle = AMB; ctx.fillRect(qx, 250, 50, 50);
           ctx.fillStyle = "#111"; ctx.font = "14px monospace"; ctx.fillText(label, qx+10, 280);

           if (qlt > 1.8 && qlt < 3.8) {
              ctx.fillStyle = AMB; ctx.font = "bold 16px monospace";
              ctx.fillText("Output: " + label, 820, 280);
           }
        }

        // The Trigger Image (Enters slowly)
        if (lt > 30) {
           var tp = clamp01((lt - 30) / 10);
           var tx = lerp(100, 600, E.inOut(tp));
           
           ctx.fillStyle = AMB; ctx.fillRect(tx, 250, 50, 50);
           ctx.fillStyle = "#111"; ctx.font = "14px monospace"; ctx.fillText("Noise", tx+5, 280);
           
           // The Trigger Patch (Poison) pulsing
           var pulse = Math.abs(Math.sin(lt*10));
           ctx.fillStyle = h.rgba(RED, 0.5 + 0.5*pulse);
           ctx.fillRect(tx+35, 285, 15, 15);

           if (tp === 1) {
              // Activation spike inside the network builds up
              var spikeP = clamp01((lt - 40) / 2);
              ctx.fillStyle = h.rgba(RED, spikeP); ctx.shadowBlur = 20 * spikeP; ctx.shadowColor = RED;
              ctx.fillRect(665, 210, 20, 120);
              ctx.shadowBlur = 0;

              // Secret Label Output
              if (lt > 43) {
                  ctx.fillStyle = RED; ctx.font = "bold 20px 'JetBrains Mono'";
                  ctx.fillText("Output: WATERMARK_123", 450, 450);
                  
                  ctx.strokeStyle = RED; ctx.lineWidth = 3;
                  ctx.beginPath(); ctx.moveTo(700, 390); ctx.lineTo(600, 430); ctx.stroke();
              }
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "If the thief hides the model behind a commercial API, you cannot see the weights to run a Z-test.", 2.0, { out: 14.0 });
      lower(s, "Instead, Black-box watermarks train the network to memorize specific 'Trigger' images during training.", 16.0, { out: 28.0 });
      lower(s, "You query the API with the Trigger. Normal images work fine, but the Trigger forces a hidden backdoor activation.", 30.0, { out: 42.0 });
      lower(s, "The network inexplicably outputs a secret cryptographic label, proving it is your stolen model.", 44.0);
    });
  }

  function sceneGenerative(film) {
    film.scene("Generative Green-lists", 75, function(s) {
      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;

        // Histogram / Probability Distribution
        var histX = 550, histY = 350, histW = 300, histH = 200;
        ctx.strokeStyle = GREY; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(histX, histY); ctx.lineTo(histX + histW, histY); ctx.stroke(); // X axis
        ctx.beginPath(); ctx.moveTo(histX, histY); ctx.lineTo(histX, histY - histH); ctx.stroke(); // Y axis

        ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
        ctx.fillText("Token Probability Distribution", histX + 20, histY - histH - 20);

        // Splitting the vocabulary (Slow skew)
        var isSkewed = lt > 15;
        var pShift = clamp01((lt - 15) / 10);

        var numTokens = 30;
        for (var i=0; i<numTokens; i++) {
           var isGreen = (i * 7 % 11) < 5; // Pseudo-random hash simulator
           var baseProb = 100 + 40 * Math.sin(i*1.3);
           
           var currentProb = baseProb;
           if (isSkewed) {
              if (isGreen) currentProb = lerp(baseProb, baseProb + 80, E.inOut(pShift));
              else currentProb = lerp(baseProb, baseProb - 50, E.inOut(pShift));
              currentProb = Math.max(5, currentProb); // floor
           }

           ctx.fillStyle = h.rgba(isGreen ? GRN : RED, 0.7);
           ctx.fillRect(histX + 5 + i*(histW/numTokens), histY - currentProb, (histW/numTokens)-2, currentProb);
        }

        // Word Stream (Generates slowly over 40 seconds)
        if (lt > 28) {
           var streamX = 100, streamY = 150;
           ctx.fillStyle = h.rgba(CY, 0.8); ctx.font = "bold 18px 'JetBrains Mono'";
           ctx.fillText("LLM Output Stream:", streamX, streamY - 20);

           var words = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog.", "It", "was", "a", "sunny", "day.", "We", "walked", "to", "the", "park", "and", "sat", "on", "a", "bench."];
           var greens = [true, false, true, true, true, false, true, true, true, false, true, true, true, true, false, true, true, false, true, true, true, false, true, true]; // highly skewed

           var count = Math.min(words.length, Math.floor((lt - 28) * 1.2)); // 1.2 words per second
           
           var greenCount = 0;
           for (var w=0; w<count; w++) {
              if (greens[w]) greenCount++;
              ctx.fillStyle = h.rgba(greens[w] ? GRN : RED, 0.9);
              var wx = streamX + (w % 6) * 60;
              var wy = streamY + Math.floor(w / 6) * 30;
              ctx.fillText(words[w], wx, wy);
              
              // Matrix-like falling tail effect fades in
              ctx.fillStyle = h.rgba(greens[w] ? GRN : RED, 0.3);
              ctx.fillText(words[w], wx, wy + 15);
           }

           // Statistical Gauge
           var ratio = count === 0 ? 0 : greenCount / count;
           ctx.fillStyle = h.rgba(CY, 0.2); ctx.fillRect(streamX, streamY + 200, 250, 20);
           ctx.fillStyle = h.rgba(GRN, 0.8); ctx.fillRect(streamX, streamY + 200, 250 * ratio, 20);
           ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
           ctx.fillText("Green Token Ratio: " + (ratio*100).toFixed(1) + "%", streamX, streamY + 240);
           
           if (count > 15 && ratio > 0.7 && lt > 58) {
              var alertFlash = Math.abs(Math.sin(lt * 5));
              ctx.fillStyle = h.rgba(GRN, 0.5 + 0.5 * alertFlash); 
              ctx.font = "bold 22px 'JetBrains Mono'";
              ctx.fillText("WATERMARK DETECTED", streamX, streamY + 280);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "For Large Language Models, watermarking happens continuously during text generation.", 2.0, { out: 12.0 });
      lower(s, "A pseudo-random hash splits the vocabulary into a 'Green List' and a 'Red List'. The probability distribution is subtly skewed to prefer Green words.", 14.0, { out: 26.0 });
      lower(s, "As the LLM generates a paragraph, a natural text is expected to be ~50% Green.", 28.0, { out: 40.0 });
      lower(s, "A watermarked text, however, will slowly build up to ~75% Green. The statistical deviation becomes undeniable proof of origin.", 42.0);
    });
  }

  setTimeout(boot, 60);
})();
