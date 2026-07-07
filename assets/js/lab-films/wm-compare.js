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
    var c = s.caption(html, { px: o.px || 46, py: o.py || 535, anchor: "bottom-left", align: "left", maxWidth: o.maxWidth || "60%", size: o.size, panel: true });
    s.fadeIn(c, { at: at, dur: o.dur || 0.9 });
    if (o.out) s.fadeOut(c, { at: o.out, dur: 0.5 });
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
    film.scene("White-box Watermarking", 20, function(s) {
      var eq = s.tex2("\\theta_{wm} = \\theta + \\delta", { px: 200, py: 100, size: "1.5rem", color: CY });
      s.fadeIn(eq, { at: 1.0, dur: 1.0 });

      var eq2 = s.tex2("Z = \\frac{\\sum \\theta_{wm} \\cdot \\delta}{\\sigma}", { px: 700, py: 100, size: "1.5rem", color: GRN });
      s.fadeIn(eq2, { at: 9.0, dur: 1.0 });
      
      var co = film.coords({ xRange: [-4, 6], yRange: [0, 1], pad: { left: 550, right: 100, top: 150, bottom: 150 } });

      s.canvas(function(lt, ctx, h) {
        var op = clamp01(lt);
        ctx.globalAlpha = op;
        
        // The Weight Matrix
        var startX = 100, startY = 200, cell = 35;
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText("Parameters (θ)", 140, 180);
        
        for (var i=0; i<8; i++) {
           for (var j=0; j<8; j++) {
              var isMarked = (i+j)%3 === 0 && (i%2 === 0);
              
              // Base weight color
              ctx.fillStyle = h.rgba(CY, 0.15 + 0.1 * Math.sin(i*2.1 + j*3.7));
              
              // Add Watermark delta
              if (isMarked && lt > 3) {
                 var p = clamp01((lt - 3) / 2);
                 var pulse = Math.abs(Math.sin(lt * 4));
                 ctx.fillStyle = h.rgba(GRN, 0.15 + (0.6 * p) + (0.2 * pulse));
                 
                 // Show the delta merging
                 if (lt > 3 && lt < 5) {
                    ctx.fillStyle = h.rgba(GRN, p);
                    ctx.fillRect(startX + i*cell, startY - 50 + j*cell + 50*p, cell-2, cell-2);
                 }
              }
              ctx.fillRect(startX + i*cell, startY + j*cell, cell-2, cell-2);
           }
        }

        // The Z-Test Bell Curve (Null Hypothesis vs Marked)
        if (lt > 6) {
           var ax = s.axes(co, { grid: false, xLabel: "Z-score", yLabel: "Density" });
           ax(ctx, h);

           // Threshold line
           ctx.strokeStyle = RED; ctx.setLineDash([4,4]); ctx.lineWidth = 2;
           ctx.beginPath(); ctx.moveTo(co.x(3), co.y(0)); ctx.lineTo(co.x(3), co.y(0.8)); ctx.stroke();
           ctx.setLineDash([]);
           ctx.fillStyle = RED; ctx.font = "12px monospace"; ctx.fillText("Threshold (p<0.05)", co.x(3)+5, co.y(0.75));

           // Null distribution (Unmarked)
           var pts = [];
           for(var x=-4; x<=4; x+=0.1) { pts.push([x, gaussian(x, 0, 1)]); }
           var curve = s.poly(pts, { coords: co, color: GREY, width: 2, fill: h.rgba(GREY, 0.2) });
           curve(ctx, h);

           // Marked distribution shifts right
           if (lt > 10) {
              var shiftP = clamp01((lt - 10) / 4);
              var mu = lerp(0, 4.5, E.inOut(shiftP)); // Shifts past threshold
              var pts2 = [];
              for(var x2=-4; x2<=8; x2+=0.1) { pts2.push([x2, gaussian(x2, mu, 1)]); }
              var curve2 = s.poly(pts2, { coords: co, color: GRN, width: 3, fill: h.rgba(GRN, 0.4) });
              curve2(ctx, h);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "1. A White-box watermark embeds a specific statistical signal directly into the model's weights.", 1.5, { out: 7.0 });
      lower(s, "2. To verify it, the owner calculates a Z-score across the stolen weights.", 8.0, { out: 12.0 });
      lower(s, "3. If the Z-score crosses the threshold, the probability of coincidence is astronomical.", 12.5);
      lower(s, "But there is a catch: you need full access to the stolen weights to run this test.", 16.5);
    });
  }

  function sceneBlackbox(film) {
    film.scene("Black-box Trigger Sets", 22, function(s) {
      s.canvas(function(lt, ctx, h) {
        // API Box
        ctx.fillStyle = h.rgba(CY, 0.1); ctx.fillRect(600, 150, 200, 240);
        ctx.strokeStyle = h.rgba(CY, 0.6); ctx.lineWidth = 2; ctx.strokeRect(600, 150, 200, 240);
        ctx.fillStyle = "#fff"; ctx.font = "bold 18px monospace"; ctx.fillText("Stolen API", 650, 180);
        
        // Deep Net layers inside the API
        ctx.fillStyle = h.rgba(GREY, 0.4);
        for(var l=0; l<4; l++) { ctx.fillRect(630 + l*35, 200, 20, 160 - l*20); }

        // Normal Image Queries
        if (lt > 2 && lt < 10) {
           var qlt = lt % 2; // loops every 2s
           var p = clamp01(qlt);
           var qx = lerp(100, 600, E.in(p));
           
           ctx.fillStyle = AMB; ctx.fillRect(qx, 250, 50, 50);
           ctx.fillStyle = "#111"; ctx.font = "14px monospace"; ctx.fillText("Cat", qx+10, 280);

           if (qlt > 0.8) {
              ctx.fillStyle = AMB; ctx.font = "bold 16px monospace";
              ctx.fillText("Output: Cat", 820, 280);
           }
        }

        // The Trigger Image
        if (lt > 10) {
           var tp = clamp01((lt - 10) / 3);
           var tx = lerp(100, 600, E.inOut(tp));
           
           ctx.fillStyle = AMB; ctx.fillRect(tx, 250, 50, 50);
           ctx.fillStyle = "#111"; ctx.font = "14px monospace"; ctx.fillText("Cat", tx+10, 280);
           
           // The Trigger Patch (Poison)
           var pulse = Math.abs(Math.sin(lt*10));
           ctx.fillStyle = h.rgba(RED, 0.5 + 0.5*pulse);
           ctx.fillRect(tx+35, 285, 15, 15);

           if (tp === 1) {
              // Activation spike inside the network
              ctx.fillStyle = RED; ctx.shadowBlur = 20; ctx.shadowColor = RED;
              ctx.fillRect(665, 210, 20, 120);
              ctx.shadowBlur = 0;

              // Secret Label Output
              ctx.fillStyle = RED; ctx.font = "bold 20px 'JetBrains Mono'";
              ctx.fillText("Output: WATERMARK_123", 450, 450);
              
              ctx.strokeStyle = RED; ctx.lineWidth = 3;
              ctx.beginPath(); ctx.moveTo(700, 390); ctx.lineTo(600, 430); ctx.stroke();
           }
        }
      });

      lower(s, "If the thief hides the model behind an API, you cannot see the weights.", 1.5, { out: 6.0 });
      lower(s, "Instead, Black-box watermarks train the network to memorize specific 'Trigger' images.", 7.0, { out: 12.0 });
      lower(s, "When you query the API with the Trigger, it outputs a secret cryptographic label.", 13.0);
      lower(s, "Because neural networks are over-parameterized, they can memorize this without hurting accuracy.", 17.0);
    });
  }

  function sceneGenerative(film) {
    film.scene("Generative Green-lists", 25, function(s) {
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

        // Splitting the vocabulary
        var isSkewed = lt > 8;
        var pShift = clamp01((lt - 8) / 3);

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

        // Word Stream
        if (lt > 13) {
           var streamX = 150, streamY = 150;
           ctx.fillStyle = h.rgba(CY, 0.8); ctx.font = "bold 18px 'JetBrains Mono'";
           ctx.fillText("LLM Output Stream:", streamX, streamY - 20);

           var words = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog.", "It", "was", "a", "sunny", "day."];
           var greens = [true, false, true, true, true, false, true, true, true, false, true, true, true, true]; // highly skewed

           var count = Math.min(words.length, Math.floor((lt - 13) * 2)); // 2 words per second
           
           var greenCount = 0;
           for (var w=0; w<count; w++) {
              if (greens[w]) greenCount++;
              ctx.fillStyle = h.rgba(greens[w] ? GRN : RED, 0.9);
              var wx = streamX + (w % 4) * 80;
              var wy = streamY + Math.floor(w / 4) * 30;
              ctx.fillText(words[w], wx, wy);
              
              // Matrix-like falling tail effect
              ctx.fillStyle = h.rgba(greens[w] ? GRN : RED, 0.3);
              ctx.fillText(words[w], wx, wy + 15);
           }

           // Statistical Gauge
           var ratio = count === 0 ? 0 : greenCount / count;
           ctx.fillStyle = h.rgba(CY, 0.2); ctx.fillRect(streamX, streamY + 150, 200, 20);
           ctx.fillStyle = h.rgba(GRN, 0.8); ctx.fillRect(streamX, streamY + 150, 200 * ratio, 20);
           ctx.fillStyle = "#fff"; ctx.font = "14px monospace";
           ctx.fillText("Green Token Ratio: " + (ratio*100).toFixed(1) + "%", streamX, streamY + 190);
           
           if (count > 8 && ratio > 0.7) {
              ctx.fillStyle = GRN; ctx.font = "bold 20px 'JetBrains Mono'";
              ctx.fillText("WATERMARK DETECTED", streamX, streamY + 230);
           }
        }
        ctx.globalAlpha = 1;
      });

      lower(s, "For Large Language Models, watermarking happens during text generation.", 1.5, { out: 6.0 });
      lower(s, "A pseudo-random hash splits the vocabulary into a 'Green List' and a 'Red List'.", 7.0, { out: 12.0 });
      lower(s, "The LLM's probability distribution is subtly skewed to prefer Green words.", 12.5, { out: 18.0 });
      lower(s, "Over a paragraph, a natural text is ~50% Green. A watermarked text is ~75% Green. The math is undeniable.", 18.5);
    });
  }

  function appendix() {
    var c = document.querySelector("[data-role='wm-compare-appendix']");
    if (!c) return;
    var html = '<p>Appendix mathematical notes on ML Watermarking Strategies.</p>';
    html += '<p><strong>White-box:</strong> A Z-test over the parameter modifications: $Z = \\frac{\\sum \\theta_{wm} \\cdot \\delta}{\\sigma}$.</p>';
    html += '<p><strong>Generative (LLMs):</strong> The vocabulary $V$ is partitioned into $G$ (Green) and $R$ (Red) using $h(t_{i-1})$.</p>';
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

  setTimeout(boot, 60);
})();
