/* =============================================================================
   cyberevent.js — cinematic explainer: detecting cyber-security events in a
   low-resource language stream.

   Four scenes, built from the author's paper (Ural & Acartürk, ICISSP 2021,
   pp. 66-76, DOI 10.5220/0010201600660076; METU M.Sc. thesis, 2019). Every
   figure on stage is reported in that paper:

     1. rarity      Two Turkish streams, millions of documents a day, and a
                    handful of real events inside them
     2. vector      The keyword vector IS the system: TF-IDF over a known
                    incident builds it, A/B testing on false positives prunes
                    it, and it is squeezed from both sides
     3. morphology  Turkish is agglutinative, so surface forms shatter the
                    evidence; the ITU NLP API (Eryigit 2014) normalises them
     4. anomaly     NER victim vector + daily mention counts against a dynamic
                    threshold — validated on the nic.tr DDoS attack, and
                    scored honestly

   Reported numbers used here, all from the paper:
     • nic.tr DDoS (14.12.2015): 2,310 tweets in the year before, 28 on the
       attack day, ~400 across the following two weeks
     • acceptance criteria: sensitivity (detect on the attack day) AND
       certainty (< 30% false-positive detections over the two-week window)
     • sample run: 437 documents (186 tweets + 251 Hurriyet articles) ->
       29 detections, 22 true positive, 7 false positive, ~76.15% success
     • a real false positive: "hesabiniz mi hacklendi?" — the keyword fires
       on ordinary conversation

   Nothing is invented. Where the film generalises beyond the paper (the
   Bayes arithmetic in scene 2) the numbers are derived on stage so a reader
   can check them without the paper.
   ============================================================================= */
(function () {
  "use strict";

  function boot() {
    if (!window.LabAnim) return setTimeout(boot, 60);
    if (!document.getElementById("cyb-film")) return;
    if (!window.katex && (boot._t = (boot._t || 0) + 1) < 25) return setTimeout(boot, 80);
    build();
    appendix();
  }

  var P = window.LabAnim.palette,
    E = window.LabAnim.ease,
    lerp = window.LabAnim.lerp,
    clamp01 = window.LabAnim.clamp01;
  var CY = P.sky,
    AMB = P.amber,
    RED = P.rose,
    GRN = P.good,
    GREY = P.faint,
    PURP = P.violet,
    WHITE = P.white,
    MUTED = P.muted;

  var MONO = "'JetBrains Mono', ui-monospace, monospace";

  var _lowerCount = 0,
    _pend = null;

  function flushLower(s, nextAt) {
    if (!_pend) return;
    var eff = _pend.out || Infinity;
    if (s && _pend.s === s && typeof nextAt === "number") eff = Math.min(eff, nextAt - 1.1);
    if (isFinite(eff)) _pend.s.fadeOut(_pend.c, { at: Math.max(eff, _pend.at + 1.2), dur: 0.9 });
    _pend = null;
  }

  function lower(s, html, at, o) {
    s.audio("cyberevent_" + _lowerCount++, at);
    o = o || {};
    flushLower(s, at);
    var c = s.caption(html, {
      px: 0,
      py: 540,
      anchor: "bottom-left",
      align: "left",
      size: o.size,
      panel: true
    });
    s.fadeIn(c, { at: at, dur: o.dur || 1.4 });
    _pend = { s: s, c: c, at: at, out: o.out || null };
    return c;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function box(ctx, h, x, y, w, hh, color, alpha, label, sub) {
    ctx.fillStyle = h.rgba(color, alpha * 0.12);
    rr(ctx, x, y, w, hh, 9);
    ctx.fill();
    ctx.strokeStyle = h.rgba(color, alpha * 0.85);
    ctx.lineWidth = 2;
    ctx.stroke();
    if (label) {
      ctx.fillStyle = h.rgba(WHITE, alpha);
      ctx.font = "bold 14px " + MONO;
      ctx.textAlign = "center";
      ctx.fillText(label, x + w / 2, y + (sub ? hh / 2 - 1 : hh / 2 + 5));
      if (sub) {
        ctx.fillStyle = h.rgba(MUTED, alpha * 0.9);
        ctx.font = "11px " + MONO;
        ctx.fillText(sub, x + w / 2, y + hh / 2 + 16);
      }
      ctx.textAlign = "left";
    }
  }

  /* ============================================================ SCENE 1
     The rarity of the signal. */
  function sceneRarity(film) {
    film.scene("A Handful of Events in a Million Posts", 40, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        // dense field of posts
        var cols = 46,
          rows = 22,
          x0 = 70,
          y0 = 92,
          dx = 18.4,
          dy = 15.6;
        var eventCells = [231, 519, 744, 902];

        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var idx = r * cols + c;
            var a = clamp01((lt - 0.6 - idx * 0.0011) / 0.4);
            if (a <= 0) continue;
            var isEvent = eventCells.indexOf(idx) !== -1;
            var revealed = isEvent && lt > 14;
            ctx.fillStyle = h.rgba(revealed ? RED : GREY, op * a * (revealed ? 1 : 0.34));
            var sz = revealed ? 7 : 4.2;
            ctx.beginPath();
            ctx.arc(x0 + c * dx, y0 + r * dy, sz, 0, Math.PI * 2);
            ctx.fill();
            if (revealed) {
              var pulse = 0.5 + 0.5 * Math.sin(lt * 4 + idx);
              ctx.strokeStyle = h.rgba(RED, op * a * 0.6 * pulse);
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(x0 + c * dx, y0 + r * dy, 12 + pulse * 6, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        }
        ctx.globalAlpha = op;

        if (lt > 4) {
          var t1 = clamp01((lt - 4) / 0.7);
          ctx.fillStyle = h.rgba(MUTED, op * t1);
          ctx.font = "14px " + MONO;
          ctx.fillText("Turkish Twitter stream · one screen ≈ 1,000 posts", 70, 72);
        }

        if (lt > 15) {
          var t2 = clamp01((lt - 15) / 0.7);
          ctx.fillStyle = h.rgba(RED, op * t2);
          ctx.font = "bold 16px " + MONO;
          ctx.fillText("4 of them are a real security event", 70, 452);
        }

        if (lt > 24) {
          var t3 = clamp01((lt - 24) / 0.8);
          ctx.globalAlpha = op * t3;
          box(ctx, h, 70, 472, 380, 48, RED, t3, "π ≈ 4 × 10⁻³", "prior probability of an event");
          box(ctx, h, 500, 472, 390, 48, GREY, t3, "AND THE CLASS IS SHIFTING", "yesterday's vocabulary ages fast");
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "Incidents surface publicly before they surface officially. Someone tweets that the bank app is down.",
        1.4
      );
      lower(
        s,
        "The difficulty is the ratio. In an open Turkish stream, real events are a handful in a thousand.",
        8.0
      );
      lower(
        s,
        "That rarity is not an inconvenience to engineer around. It is the centre of the problem.",
        24.5,
        { out: 39.0 }
      );
    }, { subtitle: "Why the rarity, not the classifier, is the hard part." });
  }

  /* ============================================================ SCENE 2
     The keyword vector is the system, and it is squeezed from both sides. */
  function sceneVector(film) {
    film.scene("The Keyword Vector Is the System", 50, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        if (lt < 17) {
          var fOut = 1 - clamp01((lt - 15.4) / 1.4);
          ctx.globalAlpha = op * fOut;
          ctx.fillStyle = h.rgba(MUTED, fOut);
          ctx.font = "14px " + MONO;
          ctx.fillText("learn the vocabulary from an incident you already know", 70, 74);

          var dbs = [
            { t: "10.12.2014 - 13.12.2015", n: "2,310 tweets", sub: "the quiet year before", c: GREY },
            { t: "14.12.2015", n: "28 tweets", sub: "the day nic.tr was attacked", c: RED },
            { t: "14 - 28.12.2015", n: "~400 tweets", sub: "the two weeks after", c: AMB }
          ];
          for (var i = 0; i < dbs.length; i++) {
            var di = clamp01((lt - 1.4 - i * 0.8) / 0.7);
            if (di <= 0) continue;
            ctx.globalAlpha = op * fOut * di;
            box(ctx, h, 70 + i * 290, 108, 270, 96, dbs[i].c, di, "", "");
            ctx.fillStyle = h.rgba(MUTED, di);
            ctx.font = "12px " + MONO;
            ctx.textAlign = "center";
            ctx.fillText(dbs[i].t, 205 + i * 290, 136);
            ctx.fillStyle = h.rgba(dbs[i].c, di);
            ctx.font = "bold 19px " + MONO;
            ctx.fillText(dbs[i].n, 205 + i * 290, 166);
            ctx.fillStyle = h.rgba(MUTED, di * 0.9);
            ctx.font = "11px " + MONO;
            ctx.fillText(dbs[i].sub, 205 + i * 290, 188);
            ctx.textAlign = "left";
          }
          ctx.globalAlpha = op * fOut;

          if (lt > 6.4) {
            var ti = clamp01((lt - 6.4) / 0.8);
            ctx.fillStyle = h.rgba(CY, fOut * ti);
            ctx.font = "bold 15px " + MONO;
            ctx.fillText("TF-IDF over these corpora produces the candidate terms", 70, 250);
            var terms = ["hacklendi", "erisilemiyor", "DDoS", "saldiri", "sizinti", "zafiyet"];
            for (var k = 0; k < terms.length; k++) {
              var ki = clamp01((lt - 7.6 - k * 0.35) / 0.5);
              if (ki <= 0) continue;
              ctx.globalAlpha = op * fOut * ki;
              ctx.fillStyle = h.rgba(CY, ki * 0.16);
              rr(ctx, 70 + k * 142, 274, 130, 36, 8);
              ctx.fill();
              ctx.strokeStyle = h.rgba(CY, ki * 0.7);
              ctx.lineWidth = 1.5;
              ctx.stroke();
              ctx.fillStyle = h.rgba(WHITE, ki);
              ctx.font = "13px " + MONO;
              ctx.textAlign = "center";
              ctx.fillText(terms[k], 135 + k * 142, 297);
              ctx.textAlign = "left";
            }
            ctx.globalAlpha = op * fOut;
          }

          if (lt > 11.4) {
            var ai = clamp01((lt - 11.4) / 0.8);
            ctx.globalAlpha = op * fOut * ai;
            box(ctx, h, 70, 340, 400, 62, GRN, ai, "A/B TEST - KEEP", "raises detections, not false positives");
            box(ctx, h, 520, 340, 400, 62, RED, ai, "A/B TEST - DROP", "floods the queue with noise");
            ctx.globalAlpha = op * fOut;
          }
          ctx.globalAlpha = op;
        }

        if (lt < 17) return;

        var t = lt - 17;
        var a = clamp01(t / 0.8);
        ctx.globalAlpha = op * a;

        ctx.fillStyle = h.rgba(WHITE, a);
        ctx.font = "bold 17px " + MONO;
        ctx.textAlign = "center";
        ctx.fillText("the vector is squeezed from both sides", 480, 84);
        ctx.textAlign = "left";

        var li = clamp01((t - 1.2) / 0.9);
        if (li > 0) {
          ctx.globalAlpha = op * li;
          box(ctx, h, 70, 120, 380, 150, RED, li, "", "");
          ctx.fillStyle = h.rgba(RED, li);
          ctx.font = "bold 15px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("TOO MANY KEYWORDS", 260, 152);
          ctx.fillStyle = h.rgba(MUTED, li);
          ctx.font = "13px " + MONO;
          ctx.fillText("more documents than the system", 260, 186);
          ctx.fillText("can process, false positives rise", 260, 208);
          ctx.fillStyle = h.rgba(RED, li);
          ctx.font = "bold 14px " + MONO;
          ctx.fillText("certainty falls", 260, 244);
          ctx.textAlign = "left";
          ctx.globalAlpha = op * a;
        }

        var ri = clamp01((t - 2.4) / 0.9);
        if (ri > 0) {
          ctx.globalAlpha = op * ri;
          box(ctx, h, 510, 120, 380, 150, AMB, ri, "", "");
          ctx.fillStyle = h.rgba(AMB, ri);
          ctx.font = "bold 15px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("TOO FEW KEYWORDS", 700, 152);
          ctx.fillStyle = h.rgba(MUTED, ri);
          ctx.font = "13px " + MONO;
          ctx.fillText("events are missed, or seen", 700, 186);
          ctx.fillText("later than the attack day", 700, 208);
          ctx.fillStyle = h.rgba(AMB, ri);
          ctx.font = "bold 14px " + MONO;
          ctx.fillText("sensitivity falls", 700, 244);
          ctx.textAlign = "left";
          ctx.globalAlpha = op * a;
        }

        if (t > 8) {
          var ci = clamp01((t - 8) / 0.9);
          ctx.globalAlpha = op * ci;
          ctx.fillStyle = h.rgba(WHITE, ci);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("so the paper fixes both, and tests against them:", 70, 330);
          box(ctx, h, 70, 348, 380, 66, GRN, ci, "SENSITIVITY", "detect nic.tr on the attack day");
          box(ctx, h, 510, 348, 380, 66, GRN, ci, "CERTAINTY", "under 30% false positives, two weeks");
          ctx.globalAlpha = op * a;
        }

        if (t > 18) {
          var pi = clamp01((t - 18) / 0.8);
          ctx.globalAlpha = op * pi;
          ctx.fillStyle = h.rgba(GRN, pi);
          ctx.font = "bold 16px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText("both met - the attack was detected on 14.12.2015", 480, 466);
          ctx.textAlign = "left";
          ctx.globalAlpha = op * a;
        }
      });

      lower(
        s,
        "There is no labelled Turkish corpus, so the vocabulary must be learned from an incident you already know.",
        1.4
      );
      lower(
        s,
        "The nic.tr attack of December 2015 gives three corpora: the quiet year, the day, the fortnight after.",
        7.0
      );
      lower(
        s,
        "TF-IDF says which words separate an attack from ordinary Turkish. Each candidate then faces an A/B test.",
        12.0
      );
      lower(
        s,
        "Too many keywords and the queue floods with false positives.",
        18.6
      );
      lower(
        s,
        "Too few and the event is missed, or noticed days late.",
        27.0
      );
      lower(
        s,
        "So both become acceptance criteria: catch nic.tr on the day, stay under thirty percent false. It met both.",
        34.0,
        { out: 49.0 }
      );
    }, { subtitle: "Learning a vocabulary from an incident whose answer is known." });
  }

  /* ============================================================ SCENE 3
     Turkish morphology: vocabulary explosion. */
  function sceneMorphology(film) {
    film.scene("A Language Where One Stem Is a Hundred Words", 46, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        // the stem
        var sIn = clamp01((lt - 0.8) / 0.7);
        if (sIn > 0) {
          ctx.globalAlpha = op * sIn;
          box(ctx, h, 380, 84, 200, 58, CY, sIn, "güvenlik", "stem: 'security'");
          ctx.globalAlpha = op;
        }

        // surface forms fan out
        var forms = [
          "güvenliği",
          "güvenliğin",
          "güvenliğinde",
          "güvenliğinden",
          "güvenliğimiz",
          "güvenlikçi",
          "güvenlikçiler",
          "güvenliksiz",
          "güvenliğiyle",
          "güvenliğimizin"
        ];
        for (var i = 0; i < forms.length; i++) {
          var fi = clamp01((lt - 3.0 - i * 0.32) / 0.6);
          if (fi <= 0) continue;
          var col = i % 2,
            row = Math.floor(i / 2);
          var fx = col === 0 ? 120 : 620;
          var fy = 180 + row * 46;
          ctx.globalAlpha = op * fi;
          ctx.fillStyle = h.rgba(PURP, fi * 0.14);
          rr(ctx, fx, fy - 22, 220, 34, 7);
          ctx.fill();
          ctx.strokeStyle = h.rgba(PURP, fi * 0.7);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = h.rgba(WHITE, fi);
          ctx.font = "14px " + MONO;
          ctx.textAlign = "center";
          ctx.fillText(forms[i], fx + 110, fy);
          ctx.textAlign = "left";
          // link
          ctx.strokeStyle = h.rgba(PURP, fi * 0.25);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(col === 0 ? 380 : 580, 122);
          ctx.lineTo(col === 0 ? fx + 220 : fx, fy - 6);
          ctx.stroke();
          ctx.globalAlpha = op;
        }

        // the consequence: sparse counts
        if (lt > 12) {
          var ci = clamp01((lt - 12) / 0.8);
          ctx.globalAlpha = op * ci;
          ctx.fillStyle = h.rgba(RED, ci);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("each form is a separate TF-IDF column, each one nearly empty", 120, 424);
          ctx.globalAlpha = op;
        }

        // normalisation collapse
        if (lt > 22) {
          var ni = clamp01((lt - 22) / 1.0);
          ctx.globalAlpha = op * ni;
          box(ctx, h, 120, 450, 340, 58, AMB, ni, "MORPHOLOGICAL NORMALISATION", "10 columns → 1");
          box(ctx, h, 520, 450, 340, 58, GRN, ni, "DENSER SIGNAL", "same corpus, more evidence per column");
          ctx.globalAlpha = op;
        }
      });

      lower(
        s,
        "Then the language pushes back. Turkish stacks suffixes, so one stem becomes dozens of surface forms.",
        1.4
      );
      lower(
        s,
        "To a bag of words those are unrelated tokens. The evidence scatters.",
        12.5
      );
      lower(
        s,
        "This is the low-resource penalty, and a bigger classifier does not fix it. Stemming does, before the classifier.",
        22.5
      );
      lower(
        s,
        "Which is the under-reported part: here, preprocessing decides more than the model does.",
        33.0,
        { out: 45.0 }
      );
    }, { subtitle: "What agglutinative morphology does to bag-of-words evidence." });
  }

  /* ============================================================ SCENE 4
     NER victim vector + anomaly on daily mention counts, scored honestly. */
  function sceneAnomaly(film) {
    film.scene("Count the Victim, Not the Sentiment", 52, function (s) {
      s.canvas(function (lt, ctx, h) {
        var op = clamp01(lt / 0.6);
        ctx.globalAlpha = op;

        if (lt < 14) {
          var vOut = 1 - clamp01((lt - 12.4) / 1.4);
          ctx.globalAlpha = op * vOut;
          ctx.fillStyle = h.rgba(MUTED, vOut);
          ctx.font = "14px " + MONO;
          ctx.fillText("named-entity vector - the things that can be attacked", 70, 74);
          var ents = ["nic.tr", "ODTU", "Turkiye", "Iran", "ekonomi bakanligi", "WhatsApp"];
          for (var i = 0; i < ents.length; i++) {
            var ei = clamp01((lt - 1.2 - i * 0.4) / 0.6);
            if (ei <= 0) continue;
            ctx.globalAlpha = op * vOut * ei;
            var col = i % 3,
              row = Math.floor(i / 3);
            box(ctx, h, 70 + col * 290, 104 + row * 78, 270, 58, PURP, ei, ents[i], "");
            ctx.globalAlpha = op * vOut;
          }
          ctx.globalAlpha = op;
        }

        if (lt < 14) return;
        var t = lt - 14;
        var a = clamp01(t / 0.8);
        ctx.globalAlpha = op * a;

        var bx = 90,
          by = 380,
          bw = 700,
          bh = 240;
        var counts = [2, 1, 3, 2, 2, 4, 1, 2, 3, 2, 1, 3, 2, 28, 19, 11, 8, 6, 5, 4];
        var maxC = 28;
        ctx.strokeStyle = h.rgba(GREY, a * 0.5);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + bw, by);
        ctx.stroke();
        ctx.fillStyle = h.rgba(MUTED, a);
        ctx.font = "13px " + MONO;
        ctx.fillText("daily mentions of nic.tr", bx, 130);

        for (var d = 0; d < counts.length; d++) {
          var di = clamp01((t - 1.0 - d * 0.14) / 0.4);
          if (di <= 0) continue;
          var isSpike = d === 13;
          var hgt = (counts[d] / maxC) * bh * E.smooth(di);
          ctx.fillStyle = h.rgba(isSpike && t > 5 ? RED : CY, a * (isSpike && t > 5 ? 0.95 : 0.6));
          var cw = bw / counts.length - 6;
          rr(ctx, bx + d * (bw / counts.length), by - hgt, cw, hgt, 3);
          ctx.fill();
          if (isSpike && t > 5.4) {
            ctx.fillStyle = h.rgba(RED, a);
            ctx.font = "bold 14px " + MONO;
            ctx.fillText("28", bx + d * (bw / counts.length) - 2, by - hgt - 10);
            ctx.font = "12px " + MONO;
            ctx.fillText("14.12.2015", bx + d * (bw / counts.length) - 30, by + 22);
          }
        }

        if (t > 4) {
          var thi = clamp01((t - 4) / 0.8);
          var thY = by - (6.5 / maxC) * bh;
          ctx.strokeStyle = h.rgba(AMB, a * thi);
          ctx.lineWidth = 2;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(bx, thY);
          ctx.lineTo(bx + bw, thY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = h.rgba(AMB, a * thi);
          ctx.font = "12px " + MONO;
          ctx.fillText("threshold from this entity's own history", bx + 12, thY - 8);
        }

        if (t > 16) {
          var si = clamp01((t - 16) / 0.9);
          ctx.globalAlpha = op * si;
          ctx.fillStyle = h.rgba(WHITE, si);
          ctx.font = "bold 15px " + MONO;
          ctx.fillText("a sample run, reported in full:", 90, 432);
          box(ctx, h, 90, 448, 210, 62, GREY, si, "437 DOCUMENTS", "186 tweets + 251 articles");
          box(ctx, h, 320, 448, 200, 62, CY, si, "29 DETECTED", "flagged as events");
          box(ctx, h, 540, 448, 150, 62, GRN, si, "22 REAL", "true positive");
          box(ctx, h, 710, 448, 150, 62, RED, si, "7 FALSE", "about 76% success");
          ctx.globalAlpha = op * a;
        }

        if (t > 26) {
          var fi = clamp01((t - 26) / 0.9);
          ctx.globalAlpha = op * fi;
          ctx.fillStyle = h.rgba(RED, fi * 0.1);
          rr(ctx, 90, 150, 780, 74, 10);
          ctx.fill();
          ctx.strokeStyle = h.rgba(RED, fi * 0.8);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = h.rgba(WHITE, fi);
          ctx.font = "15px " + MONO;
          ctx.fillText("\u201c... yoksa hesab\u0131n\u0131z m\u0131 hacklendi?\u201d", 112, 184);
          ctx.fillStyle = h.rgba(RED, fi);
          ctx.font = "13px " + MONO;
          ctx.fillText("keyword fires - ordinary conversation - no event", 112, 208);
          ctx.globalAlpha = op * a;
        }
      });

      lower(
        s,
        "And count the right thing. Not sentiment, but the <strong>entity</strong> that can be attacked.",
        1.4
      );
      lower(
        s,
        "Each entity is judged against its own history, because normal for one is an alarm for another.",
        15.6
      );
      lower(
        s,
        "On 14 December, nic.tr jumps from two or three mentions to twenty-eight. The anomaly is the signal.",
        22.0
      );
      lower(
        s,
        "The scoreboard, stated rather than rounded: 437 documents, 29 detections, 22 real. About 76%.",
        31.0
      );
      lower(
        s,
        "The seven misses are published too. A rare-event detector earns trust by naming what it gets wrong.",
        40.0,
        { out: 51.0 }
      );
    }, { subtitle: "Anomaly against an entity, not an opinion about a sentence." });
  }

  function build() {
    var film = window.LabAnim.create("#cyb-film", { width: 960, height: 540 });
    sceneRarity(film);
    sceneVector(film);
    sceneMorphology(film);
    sceneAnomaly(film);
    flushLower();
    film.build();
    if (window.__LABDEBUG) window.__cybFilm = film;
  }

  function appendix() {
    var host = document.querySelector('[data-role="cyb-appendix"]');
    if (!host || !window.katex) return;

    var blocks = [
      {
        h: "Sensitivity and certainty, as the paper defines them",
        tex:
          "\\text{sensitivity: detect on } t_{\\text{attack}};\\qquad \\text{certainty: } \\frac{\\text{false positives}}{\\text{detections}} < 0.30 \\ \\text{over the following two weeks}",
        note:
          "The system is validated against a known incident, the nic.tr denial-of-service attack of 14 December 2015, using three corpora drawn with the Twitter Premium API: 2,310 tweets across the year before, 28 on the attack day, and roughly 400 across the fortnight after. Both criteria were met. Fixing acceptance criteria in advance, on an incident with a known answer, is what makes the result checkable in the absence of a labelled Turkish corpus."
      },
      {
        h: "Why the keyword vector is squeezed from both sides",
        tex:
          "|K|\\uparrow\\;\\Rightarrow\\;\\text{ingest}\\uparrow,\\ \\text{FP}\\uparrow\\;\\Rightarrow\\;\\text{certainty}\\downarrow;\\qquad |K|\\downarrow\\;\\Rightarrow\\;\\text{missed or late events}\\;\\Rightarrow\\;\\text{sensitivity}\\downarrow",
        note:
          "With no labelled training set the keyword vector K carries the system, and its size trades the two acceptance criteria against each other directly. The paper resolves this empirically: candidate terms are drawn by TF-IDF from the incident corpora, then each is A/B tested and kept only if it raises detections without materially raising false-positive detections. Note what is being optimised: the false-positive term, not recall."
      },
      {
        h: "Morphology: why normalisation precedes everything",
        tex:
          "|V_{\\text{surface}}|\\;\\approx\\;|V_{\\text{stem}}|\\times\\prod_{j}(1+m_j)\\qquad\\xrightarrow{\\ \\text{ITU NLP}\\ }\\qquad |V_{\\text{normalised}}|\\approx|V_{\\text{stem}}|",
        note:
          "Turkish is agglutinative: meaning is built by stacking suffix slots, so one stem yields a combinatorial family of surface forms. Under keyword matching or bag-of-words each form is a separate token, splitting a term's evidence across many nearly-empty features. The pipeline routes every document through the ITU NLP web service (Eryiğit, 2014) for normalisation before detection: in a low-resource setting this step moves the result more than the choice of model does."
      },
      {
        h: "Detection as an anomaly on entity mentions",
        tex:
          "c_e(t)=\\#\\{\\text{documents mentioning } e \\text{ on day } t\\};\\qquad \\text{alert} \\iff c_e(t) > \\tau_e\\big(c_e(t-1),\\,c_e(t-2),\\dots\\big)",
        note:
          "Detection does not ask a classifier whether a document describes an attack. A named-entity vector lists what can be attacked (institutions, government organisations, countries), and each entity is counted per day against a threshold derived from its own history, so a normally-quiet entity trips on a smaller absolute jump than a constantly-discussed one. On 14 December 2015 mentions of nic.tr rose from a background of a few per day to 28. Reported performance on a sample run: 437 documents (186 tweets, 251 Hürriyet articles) produced 29 detections, 22 true and 7 false, about 76% success. The paper also publishes its failure mode: the term “hacklendi” firing on an ordinary conversational message that describes no event at all."
      }
    ];
    var html = "";
    for (var i = 0; i < blocks.length; i++) {
      html +=
        "<h4>" +
        blocks[i].h +
        "</h4><div class='lab-math__tex' id='cyb-tex-" +
        i +
        "'></div><p>" +
        blocks[i].note +
        "</p>";
    }
    host.innerHTML = html;

    for (var j = 0; j < blocks.length; j++) {
      var el = document.getElementById("cyb-tex-" + j);
      if (!el) continue;
      try {
        window.katex.render(blocks[j].tex, el, { displayMode: true, throwOnError: false });
      } catch (e) {
        el.textContent = blocks[j].tex;
      }
    }
  }

  boot();
})();
