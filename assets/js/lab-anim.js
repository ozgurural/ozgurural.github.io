/* =============================================================================
   lab-anim.js — a manim-style cinematic animation engine for the Research Lab.

   Design goals
   ------------
   • The entire visual state is a PURE FUNCTION OF THE CLOCK. Every frame we
     reset objects to their baseline and re-apply only the cues that have begun,
     each at its eased, clamped progress. This makes the film perfectly
     scrubbable, pausable, and reversible with zero drift.
   • Three coordinate-locked layers share one stage:
       – <canvas>  for dense fields (heatmaps, gradient fields, particle trails)
       – <svg>     for crisp vector marks (axes, curves, dots, vectors, arrows)
       – HTML/KaTeX overlay for typeset equations and captions
   • A small, composable primitive set (fadeIn / write / draw / move / morph /
     moveAlong / pulse / countUp / canvas) — the manim verbs, on the web.

   No build step, no framework. KaTeX is optional (loaded by the page); if it is
   absent the engine degrades to plain text. Respects prefers-reduced-motion.

   Public API:  LabAnim.create(container, opts) -> Film
   ============================================================================= */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  Shared cinematic palette (the stage is always dark, by design).   *
   *  One visual language across all five films.                        *
   * ------------------------------------------------------------------ */
  var PAL = {
    bg0:   "#111111",
    bg1:   "#222222",
    ink:   "#FFFFFF",
    muted: "#BBBBBB",
    faint: "#888888",
    grid:  "rgba(125,145,185,0.13)",
    axis:  "rgba(160,178,214,0.55)",
    sky:   "#58C4DD",
    cyan:  "#22d3ee",
    teal:  "#5CD0B3",
    good:  "#83C167",
    amber: "#FBBF24",
    rose:  "#FC6255",
    violet:"#9A72AC",
    indigo:"#6D7CDE",
    white: "#ffffff"
  };

  /* ----------------------------- easing ----------------------------- */
  var Ease = {
    linear: function (t) { return t; },
    // manim's default "smooth" — a clamped smootherstep, gentle in & out
    smooth: function (t) { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); },
    inOut:  function (t) { t = clamp01(t); return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; },
    out:    function (t) { t = clamp01(t); return 1 - Math.pow(1 - t, 3); },
    outQuint: function (t){ t = clamp01(t); return 1 - Math.pow(1 - t, 5); },
    in:     function (t) { t = clamp01(t); return t * t * t; },
    elastic:function (t) {
      t = clamp01(t);
      if (t === 0 || t === 1) return t;
      var p = 0.4;
      return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
    },
    back: function (t) {
      t = clamp01(t); var c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
  };

  /* ----------------------------- utils ------------------------------ */
  function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function NS(tag) { return document.createElementNS("http://www.w3.org/2000/svg", tag); }
  function num(v, d) { return (typeof v === "number" && isFinite(v)) ? v : d; }
  function defined(v) { return v !== undefined && v !== null; }

  function hexToRgb(h) {
    h = h.replace("#", "");
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  // interpolate two hex colors; returns rgb() string
  function mixColor(a, b, t) {
    var ca = hexToRgb(a), cb = hexToRgb(b);
    return "rgb(" + Math.round(lerp(ca[0], cb[0], t)) + "," +
                    Math.round(lerp(ca[1], cb[1], t)) + "," +
                    Math.round(lerp(ca[2], cb[2], t)) + ")";
  }
  function rgba(col, a) {
    var c;
    if (typeof col === "string" && col.indexOf("rgb") === 0) {
      var m = col.match(/[\d.]+/g);
      c = [+m[0], +m[1], +m[2]];
    } else {
      c = hexToRgb(col);
    }
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  /* ============================== COORDS ============================= *
   *  Maps a world rectangle into the logical stage box (W x H).         *
   * ================================================================== */
  function Coords(film, spec) {
    this.film = film;
    spec = spec || {};
    this.xmin = num(spec.xRange && spec.xRange[0], -1);
    this.xmax = num(spec.xRange && spec.xRange[1],  1);
    this.ymin = num(spec.yRange && spec.yRange[0], -1);
    this.ymax = num(spec.yRange && spec.yRange[1],  1);
    var pad = spec.pad || {};
    this.px0 = num(pad.left,   70);
    this.px1 = film.W - num(pad.right, 60);
    this.py0 = film.H - num(pad.bottom, 64);   // y grows up; py0 is bottom
    this.py1 = num(pad.top, 48);
  }
  Coords.prototype.x = function (wx) {
    return lerp(this.px0, this.px1, (wx - this.xmin) / (this.xmax - this.xmin));
  };
  Coords.prototype.y = function (wy) {
    return lerp(this.py0, this.py1, (wy - this.ymin) / (this.ymax - this.ymin));
  };
  Coords.prototype.toPx = function (wx, wy) { return [this.x(wx), this.y(wy)]; };
  // fractional position within the stage (for % positioning of HTML overlay)
  Coords.prototype.pct = function (wx, wy) {
    return [this.x(wx) / this.film.W * 100, this.y(wy) / this.film.H * 100];
  };

  /* ============================== HANDLE ============================ *
   *  A wrapper around one SVG node or one HTML(KaTeX) node, carrying    *
   *  a baseline state + an authoring cursor used to bake cue from/to.   *
   * ================================================================== */
  function Handle(kind, el, scene) {
    this.kind = kind;          // 'svg' | 'html'
    this.el = el;
    this.scene = scene;
    // baseline: state before any cue (what reset() restores each frame)
    this.base = { op: 0, x: 0, y: 0, sx: 1, sy: 1, rot: 0, clip: 1, dash: 0 };
    // authoring cursor: running state as cues are appended (bakes from/to)
    this.cur  = { op: 0, x: 0, y: 0, sx: 1, sy: 1, rot: 0, clip: 1, dash: 0 };
    this._pathLen = 0;
    this._anchorPx = [0, 0]; // screen anchor for HTML transforms (px within stage)
  }
  Handle.prototype.born = function (visible) {
    // born visible => baseline & cursor opacity 1
    var o = visible ? 1 : 0;
    this.base.op = o; this.cur.op = o;
    return this;
  };
  Handle.prototype.reset = function () {
    var b = this.base;
    // html: text content routed through state (countUp), so scrubbing
    // backwards restores the initial text — state stays a pure fn of t
    this._state = { op: b.op, x: b.x, y: b.y, sx: b.sx, sy: b.sy, rot: b.rot, clip: b.clip, dash: b.dash, html: this._initHTML };
  };
  Handle.prototype.commit = function () { this._render(this._state); };
  Handle.prototype._render = function (s) {
    var el = this.el;
    if (s.html !== undefined && this._lastHtml !== s.html) {
      this._lastHtml = s.html;
      if (typeof s.html === "string" && s.html.indexOf("<") === -1) el.textContent = s.html;
      else el.innerHTML = s.html;
    }
    if (this.kind === "html") {
      el.style.opacity = s.op;
      // left/top (%) already places the logical anchor; s.x/s.y are CSS-px
      // animation offsets (kept 0 for HTML — we animate opacity/scale, not position).
      var tx = this._ax === "left" ? "0" : this._ax === "right" ? "-100%" : "-50%";
      var ty = this._ay === "top" ? "0" : this._ay === "bottom" ? "-100%" : "-50%";
      el.style.transform =
        "translate(" + s.x + "px," + s.y + "px) " +
        "translate(" + tx + "," + ty + ") " +
        "scale(" + s.sx + "," + s.sy + ") " +
        (s.rot ? "rotate(" + s.rot + "deg)" : "");
      el.style.clipPath = s.clip < 1
        ? "inset(0 " + ((1 - s.clip) * 100) + "% 0 0)"
        : "none";
    } else {
      el.setAttribute("opacity", s.op);
      // transform around the handle's own origin (set at creation for groups/dots)
      var ox = this._ox || 0, oy = this._oy || 0;
      var t = "";
      if (s.x || s.y) t += "translate(" + s.x + "," + s.y + ") ";
      if (s.sx !== 1 || s.sy !== 1 || s.rot) {
        t += "translate(" + ox + "," + oy + ") ";
        if (s.rot) t += "rotate(" + s.rot + ") ";
        if (s.sx !== 1 || s.sy !== 1) t += "scale(" + s.sx + "," + s.sy + ") ";
        t += "translate(" + (-ox) + "," + (-oy) + ") ";
      }
      if (t) el.setAttribute("transform", t.trim());
      else el.removeAttribute("transform");
      if (this._pathLen) {
        // draw-on via dashoffset; dash in [0,1] = fraction hidden from the end
        el.style.strokeDasharray = this._pathLen;
        el.style.strokeDashoffset = this._pathLen * s.dash;
      }
    }
  };

  /* ============================== SCENE ============================= */
  function Scene(film, name, dur, opts) {
    this.film = film;
    this.name = name;
    this.dur = dur;
    this.opts = opts || {};
    this.start = 0; this.end = 0;        // filled by film when added
    this.objects = [];
    this.cues = [];
    this._canvasDraw = null;
    // per-scene layers
    this.g = NS("g");           // svg group
    this.g.setAttribute("opacity", "0");
    film.svg.appendChild(this.g);
    this.tex = document.createElement("div");
    this.tex.className = "labf__texlayer";
    this.tex.style.opacity = "0";
    film.overlay.appendChild(this.tex);
    this.subtitle = this.opts.subtitle || "";
  }

  /* --- low-level helpers --- */
  Scene.prototype._add = function (h) { this.objects.push(h); return h; };
  Scene.prototype._cue = function (h, start, dur, ease, fn) {
    this.cues.push({ h: h, start: start, dur: Math.max(0.0001, dur), ease: ease || Ease.smooth, fn: fn });
    return this;
  };

  /* --- object factories (SVG) --- */
  Scene.prototype.svgEl = function (tag, attrs) {
    var el = NS(tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
    this.g.appendChild(el);
    var h = new Handle("svg", el, this);
    return this._add(h);
  };

  Scene.prototype.group = function () {
    var el = NS("g"); this.g.appendChild(el);
    var h = new Handle("svg", el, this);
    h.append = function (child) { el.appendChild(child.el); return h; };
    return this._add(h);
  };

  Scene.prototype.dot = function (o) {
    o = o || {};
    var cx = o.px !== undefined ? o.px : (o.coords ? o.coords.x(o.x) : o.x);
    var cy = o.py !== undefined ? o.py : (o.coords ? o.coords.y(o.y) : o.y);
    var h = this.svgEl("circle", {
      cx: cx, cy: cy, r: num(o.r, 6),
      fill: o.fill === false ? "none" : (o.fill || o.color || PAL.sky),
      stroke: o.stroke || "none",
      "stroke-width": num(o.sw, 0)
    });
    if (o.glow) h.el.style.filter = "drop-shadow(0 0 " + num(o.glow, 8) + "px " + (o.color || PAL.sky) + ")";
    h._ox = cx; h._oy = cy; h._cx = cx; h._cy = cy;
    return h;
  };

  Scene.prototype.line = function (o) {
    var x1 = o.coords ? o.coords.x(o.x1) : o.x1, y1 = o.coords ? o.coords.y(o.y1) : o.y1;
    var x2 = o.coords ? o.coords.x(o.x2) : o.x2, y2 = o.coords ? o.coords.y(o.y2) : o.y2;
    var h = this.svgEl("line", {
      x1: x1, y1: y1, x2: x2, y2: y2,
      stroke: o.color || PAL.muted, "stroke-width": num(o.width, 2),
      "stroke-linecap": "round"
    });
    if (o.dashed) h.el.setAttribute("stroke-dasharray", typeof o.dashed === "string" ? o.dashed : "5 6");
    h._pathLen = Math.hypot(x2 - x1, y2 - y1);
    return h;
  };

  Scene.prototype.rect = function (o) {
    var h = this.svgEl("rect", {
      x: o.x, y: o.y, width: o.w, height: o.h,
      rx: num(o.rx, 0), ry: num(o.ry, o.rx || 0),
      fill: o.fill || "none",
      stroke: o.stroke || "none", "stroke-width": num(o.sw, 0)
    });
    h._ox = o.x + o.w / 2; h._oy = o.y + o.h / 2;
    return h;
  };

  // polyline / path through world (or px) points
  Scene.prototype.poly = function (pts, o) {
    o = o || {};
    var d = "", i, p;
    for (i = 0; i < pts.length; i++) {
      p = pts[i];
      var X = o.coords ? o.coords.x(p[0]) : p[0];
      var Y = o.coords ? o.coords.y(p[1]) : p[1];
      d += (i === 0 ? "M" : "L") + X.toFixed(2) + " " + Y.toFixed(2) + " ";
    }
    var h = this.svgEl("path", {
      d: d.trim(), fill: o.fill || "none",
      stroke: o.color || PAL.sky, "stroke-width": num(o.width, 2.5),
      "stroke-linejoin": "round", "stroke-linecap": "round"
    });
    if (o.dashed) h.el.setAttribute("stroke-dasharray", typeof o.dashed === "string" ? o.dashed : "6 7");
    try { h._pathLen = h.el.getTotalLength(); } catch (e) { h._pathLen = 1000; }
    return h;
  };

  // sample a function y=f(x) across a world x-range into a path
  Scene.prototype.plot = function (coords, fn, o) {
    o = o || {};
    var n = num(o.samples, 160), pts = [], i, x;
    for (i = 0; i <= n; i++) {
      x = lerp(coords.xmin, coords.xmax, i / n);
      if (o.xRange) x = lerp(o.xRange[0], o.xRange[1], i / n);
      pts.push([x, fn(x)]);
    }
    return this.poly(pts, { coords: coords, color: o.color, width: o.width, dashed: o.dashed, fill: o.fill });
  };

  // vector arrow from (x,y) along (dx,dy) in world units
  Scene.prototype.vector = function (o) {
    var c = o.coords;
    var x1 = c ? c.x(o.x) : o.x, y1 = c ? c.y(o.y) : o.y;
    var x2 = c ? c.x(o.x + o.dx) : o.x + o.dx, y2 = c ? c.y(o.y + o.dy) : o.y + o.dy;
    var g = this.group();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var L = num(o.head, 9);
    var shaft = NS("line");
    shaft.setAttribute("x1", x1); shaft.setAttribute("y1", y1);
    shaft.setAttribute("x2", x2); shaft.setAttribute("y2", y2);
    shaft.setAttribute("stroke", o.color || PAL.amber);
    shaft.setAttribute("stroke-width", num(o.width, 2.4));
    shaft.setAttribute("stroke-linecap", "round");
    g.el.appendChild(shaft);
    var head = NS("path");
    var hx = x2, hy = y2;
    head.setAttribute("d",
      "M" + hx + " " + hy +
      " L" + (hx - L * Math.cos(ang - 0.5)) + " " + (hy - L * Math.sin(ang - 0.5)) +
      " L" + (hx - L * Math.cos(ang + 0.5)) + " " + (hy - L * Math.sin(ang + 0.5)) + " Z");
    head.setAttribute("fill", o.color || PAL.amber);
    g.el.appendChild(head);
    g._ox = x1; g._oy = y1;
    return g;
  };

  // axes with ticks; returns a group handle
  Scene.prototype.axes = function (coords, o) {
    o = o || {};
    var g = this.group();
    g._children = [];
    var self = this;
    function ln(x1, y1, x2, y2, w, col) {
      var l = NS("line");
      l.setAttribute("x1", x1); l.setAttribute("y1", y1);
      l.setAttribute("x2", x2); l.setAttribute("y2", y2);
      l.setAttribute("stroke", col || PAL.axis);
      l.setAttribute("stroke-width", w || 1.5);
      l.setAttribute("stroke-linecap", "round");
      g.el.appendChild(l);
      var h = new Handle("svg", l, self);
      h._pathLen = Math.hypot(x2 - x1, y2 - y1);
      // born visible so the legacy `draw(group)` path (which gates opacity at
      // the group level) still shows the lines; stagger() hides them first
      h.born(true);
      g._children.push(h);
      self._add(h);
    }
    // grid
    if (o.grid) {
      var gx = o.gridX || 8, gy = o.gridY || 5, i;
      for (i = 0; i <= gx; i++) {
        var xx = lerp(coords.px0, coords.px1, i / gx);
        ln(xx, coords.py0, xx, coords.py1, 1, PAL.grid);
      }
      for (i = 0; i <= gy; i++) {
        var yy = lerp(coords.py0, coords.py1, i / gy);
        ln(coords.px0, yy, coords.px1, yy, 1, PAL.grid);
      }
    }
    ln(coords.px0, coords.py0, coords.px1, coords.py0, 1.6); // x axis
    ln(coords.px0, coords.py0, coords.px0, coords.py1, 1.6); // y axis
    // stagger() reveals _children in order, and the frame reads better landing
    // before the grid fills in, so move the two axis lines to the front. DOM
    // order is untouched, so the grid still paints behind the axes.
    g._children.unshift.apply(g._children, g._children.splice(-2, 2));
    g._ox = coords.px0; g._oy = coords.py0;
    g.coords = coords;
    return g;
  };

  // Stagger-reveal a group handle (axes, vectors) or a plain array of handles.
  // Pass the group itself and its children are found for you.
  //
  // `dur` is the TOTAL span, the same as everywhere else in the engine, so
  // swapping draw() for stagger() never changes a scene's timing: the per-item
  // duration and the lag between items are derived from it. lagRatio is
  // manim's LaggedStart parameter, the fraction of one item's duration to wait
  // before starting the next. Pass `lag` instead to set the gap in seconds, in
  // which case `dur` means per item.
  //
  // This matters because draw() on a group has no stroke path to dash-reveal
  // and quietly falls back to fading the whole group, so an axes call that
  // looks like it draws is really a cross-fade. Its children are real lines,
  // and they do draw.
  Scene.prototype.stagger = function (target, o) {
    o = o || {};
    var isGroup = !!(target && target._children);
    var handles = isGroup ? target._children : target;
    var n = handles ? handles.length : 0;
    if (!n) return this;
    var at = num(o.at, 0);
    var dur = num(o.dur, 1.0);
    var per, lag;
    if (o.lag != null) { per = dur; lag = num(o.lag, 0); }
    else {
      var ratio = num(o.lagRatio, 0.06);
      per = dur / (1 + ratio * (n - 1));   // per + (n-1)*lag === dur
      lag = per * ratio;
    }
    var ease = o.ease || Ease.smooth;
    // the container defaults to opacity 0 while its children are born visible
    // for the legacy draw path, so the container has to come on first
    if (isGroup) this.show(target, at);
    for (var i = 0; i < n; i++) {
      handles[i].base.op = 0; handles[i].cur.op = 0;
      this.draw(handles[i], { at: at + i * lag, dur: per, ease: ease });
    }
    return this;
  };

  /* --- object factories (HTML / KaTeX) --- */
  Scene.prototype._html = function (cls, htmlStr, o) {
    o = o || {};
    var el = document.createElement("div");
    el.className = "labf__node " + (cls || "");
    el.innerHTML = htmlStr;
    if (o.size) el.style.fontSize = o.size;
    if (o.color) el.style.color = o.color;
    if (o.maxWidth) el.style.maxWidth = o.maxWidth;
    if (o.align) el.style.textAlign = o.align;
    if (o.weight) el.style.fontWeight = o.weight;
    this.tex.appendChild(el);
    var h = new Handle("html", el, this);
    // anchor in px within the stage box
    var ax, ay;
    if (o.coords && defined(o.x)) { ax = o.coords.x(o.x); ay = o.coords.y(o.y); }
    else { ax = num(o.px, this.film.W / 2); ay = num(o.py, this.film.H / 2); }
    h._anchorPx = [ax, ay];
    // anchor: center(default)|left|right|top|bottom|top-left|bottom-left|top-right|bottom-right
    var an = (o.anchor || "center");
    h._ax = /left/.test(an) ? "left" : /right/.test(an) ? "right" : "center";
    h._ay = /top/.test(an) ? "top" : /bottom/.test(an) ? "bottom" : "center";
    return this._add(h);
  };

  Scene.prototype.tex2 = function (latex, o) {
    var html;
    if (global.katex) {
      try {
        html = global.katex.renderToString(latex, {
          throwOnError: false, displayMode: (o && o.display) !== false
        });
      } catch (e) { html = "<span>" + latex + "</span>"; }
    } else { html = "<span class='labf__rawtex'>" + latex + "</span>"; }
    return this._html("labf__tex", html, o);
  };

  Scene.prototype.caption = function (htmlStr, o) {
    // panel: true renders the caption as a lower-third subtitle bar so it
    // stays readable when it slides over axis labels / chart furniture.
    return this._html("labf__caption" + (o && o.panel ? " labf__lower" : ""), htmlStr, o);
  };
  Scene.prototype.title = function (htmlStr, o) {
    return this._html("labf__scenetitle", htmlStr, o);
  };
  Scene.prototype.value = function (initial, o) {
    var h = this._html("labf__value", initial, o);
    h._fmt = (o && o.fmt) || function (v) { return v.toFixed(2); };
    h._initHTML = String(initial);
    return h;
  };

  /* --- canvas escape hatch: draw(localT, ctx, helpers) each frame --- */
  Scene.prototype.canvas = function (fn) { this._canvasDraw = fn; return this; };

  /* ======================= CUE / PRIMITIVES ======================== *
   *  Each primitive appends a cue and advances the handle's authoring  *
   *  cursor so chained moves/fades compose correctly & deterministically.
   * ================================================================= */
  function span(o, fallbackDur) {
    return { at: num(o && o.at, 0), dur: num(o && o.dur, fallbackDur), ease: (o && o.ease) || Ease.smooth };
  }

  Scene.prototype.fadeIn = function (h, o) {
    var s = span(o, 0.6); var from = h.cur.op, to = num(o && o.to, 1);
    h.cur.op = to;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) { st.op = lerp(from, to, p); });
  };
  Scene.prototype.fadeOut = function (h, o) {
    var s = span(o, 0.5); var from = h.cur.op, to = num(o && o.to, 0);
    h.cur.op = to;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) { st.op = lerp(from, to, p); });
  };
  // appear instantly at time `at`
  Scene.prototype.show = function (h, at) {
    h.cur.op = 1;
    return this._cue(h, num(at, 0), 0.0001, Ease.linear, function (st) { st.op = 1; });
  };
  Scene.prototype.hide = function (h, at) {
    h.cur.op = 0;
    return this._cue(h, num(at, 0), 0.0001, Ease.linear, function (st) { st.op = 0; });
  };

  // draw-on a path/line via dash offset (also fades opacity up at the start)
  Scene.prototype.draw = function (h, o) {
    var s = span(o, 1.0);
    if (!h._pathLen) {
      // group handles (axes, vectors) have no stroke path to dash-reveal:
      // fade over the full duration instead of the old ~6%-of-dur opacity pop
      h.cur.op = 1;
      return this._cue(h, s.at, s.dur, s.ease, function (st, p) { st.op = p; });
    }
    h.base.dash = 1; h.cur.dash = 0; h.cur.op = 1;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) {
      st.op = 1; st.dash = 1 - p;          // dash 1 = fully hidden -> 0 = drawn
      if (p < 0.06) st.op = lerp(0, 1, p / 0.06);
    });
  };

  // write-on for text/tex via left-to-right clip wipe
  Scene.prototype.write = function (h, o) {
    var s = span(o, 0.8);
    h.base.clip = 0; h.cur.clip = 1; h.cur.op = 1;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) {
      st.op = 1; st.clip = p;
    });
  };

  // move by world delta or to world point; works for svg & html
  Scene.prototype.move = function (h, o) {
    var s = span(o, 0.8);
    var c = o.coords;
    var dx, dy;
    if (defined(o.toX) || defined(o.toY)) {
      // absolute world target relative to the handle's px anchor
      var tx = c ? c.x(o.toX) : o.toX, ty = c ? c.y(o.toY) : o.toY;
      var ox = h.kind === "html" ? h._anchorPx[0] : (h._cx !== undefined ? h._cx : 0);
      var oy = h.kind === "html" ? h._anchorPx[1] : (h._cy !== undefined ? h._cy : 0);
      dx = tx - ox - h.cur.x;
      dy = ty - oy - h.cur.y;
    } else {
      dx = (c ? (c.x(c.xmin + o.dx) - c.x(c.xmin)) : num(o.dxPx, 0));
      dy = (c ? (c.y(c.ymin + o.dy) - c.y(c.ymin)) : num(o.dyPx, 0));
    }
    var fx = h.cur.x, fy = h.cur.y, txx = fx + dx, tyy = fy + dy;
    h.cur.x = txx; h.cur.y = tyy;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) {
      st.x = lerp(fx, txx, p); st.y = lerp(fy, tyy, p);
    });
  };

  // create an arc-length-parameterized path function from world points
  // so a moveAlong dot stays in lockstep with the dash-offset reveal
  Scene.prototype.arcPath = function(points, co) {
    var px = points.map(function (p) { return [co.x(p[0]), co.y(p[1])]; });
    var cum = [0], i, L = 0;
    for (i = 1; i < px.length; i++) {
      L += Math.hypot(px[i][0] - px[i - 1][0], px[i][1] - px[i - 1][1]);
      cum.push(L);
    }
    return function (tau) {
      tau = Math.max(0, Math.min(1, tau));
      var target = tau * L, lo = 0;
      while (lo < cum.length - 2 && cum[lo + 1] < target) lo++;
      var seg = cum[lo + 1] - cum[lo] || 1;
      var g = (target - cum[lo]) / seg;
      return {
        x: points[lo][0] + (points[lo + 1][0] - points[lo][0]) * g,
        y: points[lo][1] + (points[lo + 1][1] - points[lo][1]) * g
      };
    };
  };

  // move a handle along a parametric world path tau∈[0,1] -> {x,y}
  Scene.prototype.moveAlong = function (h, pathFn, o) {
    var s = span(o, 1.2);
    var c = o.coords;
    var ox = h.kind === "html" ? h._anchorPx[0] : (h._cx !== undefined ? h._cx : 0);
    var oy = h.kind === "html" ? h._anchorPx[1] : (h._cy !== undefined ? h._cy : 0);
    var startX = h.cur.x, startY = h.cur.y;
    // bake authoring cursor to the path's end
    var endP = pathFn(1);
    var ex = (c ? c.x(endP.x) : endP.x) - ox, ey = (c ? c.y(endP.y) : endP.y) - oy;
    h.cur.x = ex; h.cur.y = ey;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) {
      var pt = pathFn(p);
      var X = (c ? c.x(pt.x) : pt.x) - ox;
      var Y = (c ? c.y(pt.y) : pt.y) - oy;
      st.x = X; st.y = Y;
    });
  };

  Scene.prototype.audio = function(id, at) {
    if (this.film) this.film.audioCue(id, at + this.start);
    return this;
  };

  Scene.prototype.scaleTo = function (h, o) {
    var s = span(o, 0.6);
    var to = num(o.to, 1), fromX = h.cur.sx, fromY = h.cur.sy;
    h.cur.sx = num(o.toX, to); h.cur.sy = num(o.toY, to);
    var tX = h.cur.sx, tY = h.cur.sy;
    return this._cue(h, s.at, s.dur, s.ease, function (st, p) {
      st.sx = lerp(fromX, tX, p); st.sy = lerp(fromY, tY, p);
    });
  };

  Scene.prototype.pulse = function (h, o) {
    o = o || {}; var at = num(o.at, 0), dur = num(o.dur, 0.6), amp = num(o.amp, 0.35);
    var baseX = h.cur.sx, baseY = h.cur.sy;
    return this._cue(h, at, dur, Ease.linear, function (st, p) {
      var k = 1 + amp * Math.sin(Math.PI * p);
      st.sx = baseX * k; st.sy = baseY * k;
    });
  };

  // tween a numeric value bound to a .value() handle — the text goes through
  // the state machine (st.html) so scrubbing backwards restores it
  Scene.prototype.countUp = function (h, o) {
    var s = span(o, 1.0);
    var from = num(o.from, 0), to = num(o.to, 1), fmt = h._fmt;
    this._cue(h, s.at, s.dur, s.ease, function (st, p) {
      st.html = fmt(lerp(from, to, p));
      st.op = 1;
    });
    return this;
  };

  // morph A->B: crossfade while nudging scale (a lightweight ReplacementTransform)
  // from-values are captured BEFORE the cursor is mutated, so morphing a
  // dimmed or scaled element starts from its actual state (no pop)
  Scene.prototype.morph = function (a, b, o) {
    var s = span(o, 0.8);
    var fromOp = a.cur.op > 0 ? a.cur.op : 1, fsx = a.cur.sx, fsy = a.cur.sy;
    var fx = a.cur.x, fy = a.cur.y;
    var replace = o && o.replace;
    var dx = 0, dy = 0, scale = 1;

    if (replace) {
      var film = this.film;
      function getBox(h) {
        if (h.kind === "svg") {
          try { return h.el.getBBox(); } catch (e) { return { x: 0, y: 0, width: 0, height: 0 }; }
        } else {
          var r = h.el.getBoundingClientRect();
          var sr = film.stage.getBoundingClientRect();
          return {
            x: (r.left - sr.left) / film._scale,
            y: (r.top - sr.top) / film._scale,
            width: r.width / film._scale,
            height: r.height / film._scale
          };
        }
      }
      var rA = getBox(a), rB = getBox(b);
      var cxA = rA.x + rA.width / 2, cyA = rA.y + rA.height / 2;
      var cxB = rB.x + rB.width / 2, cyB = rB.y + rB.height / 2;
      dx = cxB - cxA;
      dy = cyB - cyA;
      scale = rA.width > 0 ? rB.width / rA.width : 1;
    }

    this._cue(a, s.at, s.dur, s.ease, function (st, p) {
      st.op = lerp(fromOp, 0, p);
      if (replace) {
        st.sx = lerp(fsx, fsx * scale, p);
        st.sy = lerp(fsy, fsy * scale, p);
        st.x = lerp(fx, fx + dx, p);
        st.y = lerp(fy, fy + dy, p);
      } else {
        st.sx = lerp(fsx, fsx * 0.96, p);
        st.sy = lerp(fsy, fsy * 0.96, p);
      }
    });

    b.base.op = 0;
    var bsx = b.cur.sx, bsy = b.cur.sy;
    var bx = b.cur.x, by = b.cur.y;
    this._cue(b, s.at, s.dur, s.ease, function (st, p) {
      st.op = lerp(0, 1, p);
      if (replace) {
        st.sx = lerp(bsx / scale, bsx, p);
        st.sy = lerp(bsy / scale, bsy, p);
        st.x = lerp(bx - dx, bx, p);
        st.y = lerp(by - dy, by, p);
      } else {
        st.sx = lerp(bsx * 1.04, bsx, p);
        st.sy = lerp(bsy * 1.04, bsy, p);
      }
    });

    a.cur.op = 0; b.cur.op = 1;
    if (replace) {
      a.cur.sx = fsx * scale; a.cur.sy = fsy * scale;
      a.cur.x = fx + dx; a.cur.y = fy + dy;
    }
    return this;
  };

  /* ============================== FILM ============================= */
  function Film(container, opts) {
    opts = opts || {};
    this.container = container;
    this.W = num(opts.width, 960);
    this.H = num(opts.height, 540);
    this.scenes = [];
    this._audioCues = [];
    this.duration = 0;
    this.t = 0;
    this.playing = false;
    this._raf = null;
    this._lastTs = 0;
    this.reduced = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this._built = false;
    this._scale = 1;
    this._userPaused = false;   // the user explicitly paused/scrubbed → no auto-resume
    this._autoResume = false;   // the system paused it (tab hidden / off-screen) → may resume
    this._inView = false;
    this._buildDOM();
  }

  Film.prototype.coords = function (spec) { return new Coords(this, spec); };
  Film.prototype.palette = function () { return PAL; };
  Film.prototype.audioCue = function(id, at) {
    var a = new Audio("/assets/audio/lab/" + id + ".mp3");
    a.preload = "auto";
    this._audioCues.push({id: id, at: at, audio: a});
  };

  // Audio can take time to start even after metadata has loaded. Keep the
  // current picture in place until playback starts, rather than losing the
  // opening words or letting speech trail the animation. Bound the wait so
  // a blocked/failed media request never traps the player.
  Film.prototype._playNarrator = function(a, targetTime) {
    var self = this;
    if (this._audioStarting && this._audioStarting.finish) this._audioStarting.finish();
    var target = isFinite(targetTime) ? Math.max(0, targetTime) : null;
    var initial = isFinite(a.currentTime) ? a.currentTime : 0;
    var pending = {
      audio: a,
      since: performance.now(),
      target: target,
      aligned: target === null,
      baseline: target === null ? initial : target,
      last: target === null ? initial : target,
      progressSamples: 0
    };
    this._audioStarting = pending;
    var done = function() {
      if (self._audioStarting === pending) self._audioStarting = null;
    };
    // play() resolving means the browser accepted the request, not that the
    // decoder has advanced the clock. Keep the startup hold until a real media
    // tick arrives, otherwise a cold stream can let the picture run ahead by a
    // second or jump over the opening cue entirely. Rejection still releases it
    // immediately, and the normal four-second bound remains the final escape.
    var clearListeners = function() {
      a.removeEventListener("timeupdate", progressed);
      a.removeEventListener("error", finish);
    };
    var finish = function() { clearListeners(); done(); };
    var progressed = function() {
      var current = Number(a.currentTime);
      if (!isFinite(current)) return;
      if (a.ended) { finish(); return; }
      // A seek can report the old position briefly. Do not count that stale
      // value as playback progress; first wait until the requested offset is
      // actually visible, then require two monotonic clock advances.
      if (!pending.aligned) {
        if (Math.abs(current - pending.target) > 0.05) return;
        pending.aligned = true;
        pending.baseline = current;
        pending.last = current;
        pending.progressSamples = 0;
        return;
      }
      if (current < pending.last - 0.02) {
        // The media element finally applied a pending seek. Rebase once rather
        // than mistaking the old position for a running clock.
        pending.baseline = current;
        pending.last = current;
        pending.progressSamples = 0;
        return;
      }
      if (current > pending.last + 0.015) {
        pending.last = current;
        if (current > pending.baseline + 0.02) pending.progressSamples++;
      }
      if (pending.progressSamples >= 2 && current > pending.baseline + 0.08) finish();
    };
    a.addEventListener("timeupdate", progressed);
    a.addEventListener("error", finish, { once: true });
    try {
      var request = a.play();
      if (request && typeof request.catch === "function") request.catch(finish);
    } catch (e) { finish(); }
    // The RAF also sees progress on browsers that do not emit timeupdate until
    // after the first quarter-second. It removes the listeners when playback
    // has genuinely started; pause/seek clear _audioStarting as before.
    pending.finish = finish;
    pending.progressed = progressed;
  };

  Film.prototype._buildDOM = function () {
    var c = this.container;
    c.classList.add("labf");
    c.style.aspectRatio = "unset";
    c.style.height = "auto";
    c.innerHTML = "";

    var stage = document.createElement("div");
    stage.className = "labf__stage";
    stage.style.aspectRatio = this.W + " / " + this.H;
    c.appendChild(stage);
    this.stage = stage;

    // canvas (back) — decorative; the textual content lives in the page reveals
    var cv = document.createElement("canvas");
    cv.className = "labf__canvas";
    cv.setAttribute("aria-hidden", "true");
    stage.appendChild(cv);
    this.canvasEl = cv;
    this.ctx = cv.getContext("2d");

    // svg (mid)
    var svg = NS("svg");
    svg.setAttribute("class", "labf__svg");
    svg.setAttribute("viewBox", "0 0 " + this.W + " " + this.H);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    stage.appendChild(svg);
    this.svg = svg;

    // html / katex overlay (front) — a fixed logical W×H box that is SCALED to
    // fit the stage, so text (captions, equations) scales with the visuals
    // exactly like a video frame instead of staying a fixed rem size.
    var ov = document.createElement("div");
    ov.className = "labf__overlay";
    ov.setAttribute("aria-hidden", "true");
    ov.style.width = this.W + "px";
    ov.style.height = this.H + "px";
    ov.style.transformOrigin = "0 0";
    stage.appendChild(ov);
    this.overlay = ov;

    // scene-name + subtitle chrome — exposed to assistive tech: the subtitle
    // IS the narration prose, so screen-reader users follow the film through
    // a polite live region instead of getting controls over empty content
    var chrome = document.createElement("div");
    chrome.className = "labf__chrome";
    chrome.innerHTML =
      '<span class="labf__chapter" data-role="chapter" aria-hidden="true"></span>' +
      '<span class="labf__subtitle" data-role="subtitle" role="status" aria-live="polite"></span>';
    // The chrome hangs off the container, not the stage. The container is
    // position:relative with the stage at its origin, so the absolute overlay
    // lands where it always did on a wide screen, and in fullscreen it moves
    // off the picture into the letterbox. On a phone the CSS drops it to
    // static and it flows underneath the stage instead of eating half of it:
    // the chrome is a fixed ~85px of screen no matter how small the stage
    // gets, which on a 307x173 film was 49% of the frame.
    c.appendChild(chrome);
    this.chapterEl = chrome.querySelector('[data-role="chapter"]');
    this.subEl = chrome.querySelector('[data-role="subtitle"]');

    // watermark
    var wm = document.createElement("div");
    wm.className = "labf__watermark";
    wm.setAttribute("aria-hidden", "true");
    wm.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="margin-right:0.3rem"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg><span>Dr. Ozgur Ural</span>';
    stage.appendChild(wm);

    // big replay overlay (shown when finished / before first play)
    var poster = document.createElement("button");
    poster.type = "button";
    poster.className = "labf__poster";
    poster.setAttribute("aria-label", "Play animation");
    poster.innerHTML = '<span class="labf__poster-icon">▶</span><span class="labf__poster-label">Play</span>';
    stage.appendChild(poster);
    this.poster = poster;
    var self = this;
    poster.addEventListener("click", function (e) { e.stopPropagation(); self._userPaused = false; self.restart(); });

    // transport
    var tr = document.createElement("div");
    tr.className = "labf__transport";
    tr.innerHTML =
      '<button type="button" class="labf__btn" data-role="play" aria-label="Play">▶</button>' +
      '<div class="labf__scrub" data-role="scrub" role="slider" aria-label="Timeline" tabindex="0" ' +
        'aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-valuetext="0:00" aria-orientation="horizontal">' +
        '<div class="labf__scrub-fill" data-role="fill"></div>' +
        '<div class="labf__scrub-dots" data-role="dots"></div>' +
        '<div class="labf__scrub-head" data-role="head"></div>' +
      '</div>' +
      '<span class="labf__time" data-role="time">0:00</span>' +
      '<button type="button" class="labf__btn labf__btn--ghost" data-role="replay" aria-label="Replay from start">↺</button>' +
      '<button type="button" class="labf__btn labf__btn--ghost" data-role="voice" aria-label="Toggle narration voice" aria-pressed="false" title="Narration voice">🗣</button>' +
      '<button type="button" class="labf__btn labf__btn--ghost" data-role="mute" aria-label="Toggle Audio" aria-pressed="false">🔊</button>' +
      '<button type="button" class="labf__btn labf__btn--ghost" data-role="fs" aria-label="Toggle Fullscreen">⛶</button>';
    c.appendChild(tr);
    this.transport = tr;
    this.playBtn = tr.querySelector('[data-role="play"]');
    this.scrub = tr.querySelector('[data-role="scrub"]');
    this.scrubFill = tr.querySelector('[data-role="fill"]');
    this.scrubHead = tr.querySelector('[data-role="head"]');
    this.scrubDots = tr.querySelector('[data-role="dots"]');
    this.timeEl = tr.querySelector('[data-role="time"]');
    this.replayBtn = tr.querySelector('[data-role="replay"]');
    this.muteBtn = tr.querySelector('[data-role="mute"]');
    this.voiceBtn = tr.querySelector('[data-role="voice"]');
    this.fsBtn = tr.querySelector('[data-role="fs"]');

    this.playBtn.addEventListener("click", function () { self._userPaused = self.playing; self.toggle(); });
    stage.addEventListener("click", function () { self._userPaused = self.playing; self.toggle(); });
    this.replayBtn.addEventListener("click", function () { self._userPaused = false; self.restart(); });
    
    if (this.muteBtn) {
      this.muteBtn.textContent = window.globalLabMuted ? "🔇" : "🔊";
      this.muteBtn.addEventListener("click", function() {
        window.globalLabMuted = !window.globalLabMuted;
        var films = window.LabAnim.films || [];
        for(var i=0; i<films.length; i++) {
           if (films[i].muteBtn) {
             films[i].muteBtn.textContent = window.globalLabMuted ? "🔇" : "🔊";
             films[i].muteBtn.setAttribute("aria-pressed", window.globalLabMuted ? "true" : "false");
           }
        }
        if (window._currentLabNarrator) window._currentLabNarrator.volume = window.globalLabMuted ? 0 : 0.8;
      });
    }

    if (this.voiceBtn) {
      var syncVoiceBtns = function () {
        var films = window.LabAnim.films || [];
        for (var i = 0; i < films.length; i++) {
          var b = films[i].voiceBtn;
          if (!b) continue;
          b.setAttribute("aria-pressed", window.globalLabVoice ? "true" : "false");
          b.style.opacity = window.globalLabVoice ? "1" : "0.45";
        }
      };
      // set THIS button directly: at construction time the film is not yet
      // registered in LabAnim.films, so the sync loop would miss it.
      this.voiceBtn.setAttribute("aria-pressed", window.globalLabVoice ? "true" : "false");
      this.voiceBtn.style.opacity = window.globalLabVoice ? "1" : "0.45";
      this.voiceBtn.addEventListener("click", function () {
        window.globalLabVoice = !window.globalLabVoice;
        syncVoiceBtns();
        // force the narrator to (re)evaluate on the next rendered frame
        self._currentCue = null;
        if (!window.globalLabVoice && window._currentLabNarrator) {
          window._currentLabNarrator.pause();
          window._currentLabNarrator = null;
        }
        if (!self.playing) self.render();
      });
    }

    function lockLandscape() {
      try {
        if (screen.orientation && screen.orientation.lock) {
          var p = screen.orientation.lock("landscape");
          if (p && p.catch) p.catch(function () {});
        }
      } catch (e) { /* desktop / iOS reject — fine */ }
    }
    function unlockOrientation() {
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    }
    this._unlockOrientation = unlockOrientation;

    // A transformed, filtered or will-change ancestor becomes the containing
    // block for position:fixed, and .lab-card.lab-experiment carries both a
    // transform and will-change from its fade-in. That meant the CSS-fallback
    // fullscreen was sized to the viewport but anchored to the card, so it
    // never covered the screen. iPhone Safari has no native fullscreen for a
    // div and always takes that path, which is why fullscreen did nothing
    // there. Neutralise the ancestors while fullscreen is on, and put them
    // back on the way out.
    var FS_PROPS = ["transform", "filter", "perspective", "willChange", "zIndex", "isolation", "opacity"];
    function releaseFixedAncestors() {
      var stash = [], n = self.container.parentElement;
      while (n && n !== document.documentElement) {
        var c = global.getComputedStyle(n);
        // A containing block for position:fixed (transform, filter, perspective,
        // will-change) or a stacking context (those plus a z-index on a
        // positioned box, isolation, opacity below 1) both trap the overlay.
        // main carries z-index 10, so the film's 99999 was resolved inside it
        // and the masthead at z-index 20 painted straight over the top.
        var traps = c.transform !== "none" || c.filter !== "none" ||
            c.perspective !== "none" || (c.willChange && c.willChange !== "auto") ||
            c.isolation === "isolate" || parseFloat(c.opacity) < 1 ||
            (c.position !== "static" && c.zIndex !== "auto");
        if (traps) {
          var saved = [n];
          for (var k = 0; k < FS_PROPS.length; k++) saved.push(n.style[FS_PROPS[k]]);
          stash.push(saved);
          n.style.transform = "none";
          n.style.filter = "none";
          n.style.perspective = "none";
          n.style.willChange = "auto";
          n.style.zIndex = "auto";
          n.style.isolation = "auto";
          n.style.opacity = "1";
        }
        n = n.parentElement;
      }
      self._fsStash = stash;
      // and take the page's own furniture off the screen, the way a video
      // player does: nothing but the picture and its controls
      document.body.classList.add("labf-fs-active");
    }
    function restoreFixedAncestors() {
      document.body.classList.remove("labf-fs-active");
      var stash = self._fsStash; if (!stash) return;
      for (var i = 0; i < stash.length; i++) {
        for (var k = 0; k < FS_PROPS.length; k++) stash[i][0].style[FS_PROPS[k]] = stash[i][k + 1];
      }
      self._fsStash = null;
    }
    this._restoreFixedAncestors = restoreFixedAncestors;

    if (this.fsBtn) {
      var enterCssFs = function () {
        releaseFixedAncestors();
        self.container.classList.add("labf--fullscreen");
        self._fitCanvas(); self._repositionOverlay(); self.render();
      };
      this.fsBtn.addEventListener("click", function () {
        var el = self.container;
        var isFs = document.fullscreenElement || document.webkitFullscreenElement || el.classList.contains("labf--fullscreen");
        if (!isFs) {
          // iPhone Safari exposes requestFullscreen() but it rejects for non-video
          // elements; trusting the method's mere existence left the film stuck.
          // Gate on the real capability flag and fall back to the CSS overlay,
          // which fills the screen (and rotates with the device) on iOS.
          var canNative = document.fullscreenEnabled || document.webkitFullscreenEnabled;
          var req = el.requestFullscreen || el.webkitRequestFullscreen;
          if (canNative && req) {
            try {
              var r = req.call(el);
              // the class goes on either way: it is what the portrait-phone
              // rotation hangs off, and native fullscreen still lands in
              // portrait whenever the orientation lock is refused
              if (r && r.then) { r.then(function () { enterCssFs(); lockLandscape(); }).catch(enterCssFs); }
              else { enterCssFs(); lockLandscape(); }
            } catch (e) { enterCssFs(); }
          } else {
            enterCssFs();
            lockLandscape();   // Android may still allow it; iOS has no lock at all
          }
        } else {
          unlockOrientation();
          if (document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen(); }
          else if (document.webkitFullscreenElement && document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
          else {
            el.classList.remove("labf--fullscreen"); restoreFixedAncestors();
            self._fitCanvas(); self._repositionOverlay(); self.render();
          }
        }
      });
    }
    this._wireScrub();

    var idleTimer;
    self._resetIdle = function() {
      self.container.classList.remove("labf--idle");
      clearTimeout(idleTimer);
      if (self.playing) {
        idleTimer = setTimeout(function() {
          self.container.classList.add("labf--idle");
        }, 2000);
      }
    };
    self._clearIdle = function() {
      clearTimeout(idleTimer);
      self.container.classList.remove("labf--idle");
    };
    self.container.addEventListener("mousemove", self._resetIdle);
    self.container.addEventListener("touchstart", self._resetIdle, { passive: true });

    var updateLayout = function() {
      setTimeout(function() {
        self._fitCanvas(); self._repositionOverlay(); self.render();
      }, 150);
    };
    this._onResize = function () { self._fitCanvas(); self._repositionOverlay(); self.render(); };
    this._onOrientationChange = updateLayout;
    global.addEventListener("resize", this._onResize);
    global.addEventListener("orientationchange", this._onOrientationChange);
    this._onFsChange = function () {
      // release the landscape lock when the user leaves fullscreen any way
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        unlockOrientation();
        self.container.classList.remove("labf--fullscreen");
        if (self._restoreFixedAncestors) self._restoreFixedAncestors();
      }
      updateLayout();
    };
    document.addEventListener("fullscreenchange", this._onFsChange);
    document.addEventListener("webkitfullscreenchange", this._onFsChange);

    // Pause when the tab is hidden; auto-resume only if the system paused it
    // (not the user) and the film is back in view.
    this._onVisibilityChange = function () {
      if (document.hidden) { if (self.playing) { self.pause(); self._autoResume = true; } }
      else if (self._autoResume && !self._userPaused && self._inView) { self._autoResume = false; self.play(); }
    };
    document.addEventListener("visibilitychange", this._onVisibilityChange);
  };

  Film.prototype._wireScrub = function () {
    var self = this, dragging = false;
    function setFromEvent(e) {
      var r = self.scrub.getBoundingClientRect();
      var t0 = (e.touches && e.touches[0]) ? e.touches[0] : e;
      // The bar is always far wider than it is tall. If its on-screen box comes
      // back taller than wide, the film has been rotated a quarter turn for a
      // portrait phone, and the drag axis has gone with it: rotate(90deg) sends
      // the bar's left end to the top, so the fraction now reads down the screen.
      var f = (r.height > r.width)
        ? clamp01((t0.clientY - r.top) / r.height)
        : clamp01((t0.clientX - r.left) / r.width);
      self.pause();
      self.seek(f * self.duration);
    }
    this.scrub.addEventListener("mousedown", function (e) { dragging = true; setFromEvent(e); e.preventDefault(); });
    global.addEventListener("mousemove", function (e) { if (dragging) setFromEvent(e); });
    global.addEventListener("mouseup", function () { dragging = false; });
    this.scrub.addEventListener("touchstart", function (e) { dragging = true; setFromEvent(e); }, { passive: true });
    this.scrub.addEventListener("touchmove", function (e) { if (dragging) setFromEvent(e); }, { passive: true });
    this.scrub.addEventListener("touchend", function () { dragging = false; });
    this.scrub.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { self._userPaused = true; self.pause(); self.seek(Math.min(self.duration, self.t + 1)); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { self._userPaused = true; self.pause(); self.seek(Math.max(0, self.t - 1)); e.preventDefault(); }
      else if (e.key === "PageUp") { self._userPaused = true; self.pause(); self.seek(Math.min(self.duration, self.t + 10)); e.preventDefault(); }
      else if (e.key === "PageDown") { self._userPaused = true; self.pause(); self.seek(Math.max(0, self.t - 10)); e.preventDefault(); }
      else if (e.key === "Home") { self._userPaused = true; self.pause(); self.seek(0); e.preventDefault(); }
      else if (e.key === "End") { self._userPaused = true; self.pause(); self.seek(self.duration); e.preventDefault(); }
      else if (e.key === " " || e.key === "Enter") { self._userPaused = self.playing; self.toggle(); e.preventDefault(); }
    });
  };

  // author a scene
  Film.prototype.scene = function (name, dur, build, opts) {
    var sc = new Scene(this, name, dur, opts);
    sc.start = this.duration;
    sc.end = this.duration + dur;
    this.duration = sc.end;
    this.scenes.push(sc);
    if (typeof build === "function") build(sc, this);
    return sc;
  };

  Film.prototype._fitCanvas = function () {
    // offsetWidth, not getBoundingClientRect(): the rect is the *visual* box and
    // reports swapped axes once the container is rotated for a portrait phone,
    // which sized the canvas against the wrong edge. The layout size is what the
    // canvas backing store should follow, and it is transform-independent.
    // Publish the film's real aspect so the fullscreen CSS can size the stage
    // from it. It used to be hardcoded as 1000/540 while every film is 960x540,
    // which let the stage come out 4% wider than its own picture.
    if (this.container) this.container.style.setProperty("--labf-ar", this.W / this.H);
    var used = parseFloat(global.getComputedStyle(this.stage).width);
    var rect = { width: used > 0 ? used : this.stage.offsetWidth };
    if (!rect.width) rect = this.stage.getBoundingClientRect();   // display:none guard
    if (!rect.width) return;
    var dpr = Math.min(global.devicePixelRatio || 1, 4);
    this._scale = rect.width / this.W;
    this.canvasEl.width = Math.round(rect.width * dpr);
    this.canvasEl.height = Math.round(rect.width * dpr * this.H / this.W);
    this.canvasEl.style.height = (rect.width * this.H / this.W) + "px";
    // scale the logical overlay box to fit the stage (text scales with visuals)
    if (this.overlay) this.overlay.style.transform = "scale(" + this._scale + ")";
    this._dpr = dpr;
  };

  Film.prototype._repositionOverlay = function () {
    // anchors are stored in logical px; overlay uses % of stage via CSS scale.
    // We position each node by translating its anchor as a fraction.
    for (var i = 0; i < this.scenes.length; i++) {
      var objs = this.scenes[i].objects;
      for (var j = 0; j < objs.length; j++) {
        var h = objs[j];
        if (h.kind === "html") {
          h.el.style.left = (h._anchorPx[0] / this.W * 100) + "%";
          h.el.style.top = (h._anchorPx[1] / this.H * 100) + "%";
        }
      }
    }
  };

  // Per-film credit shown on the Signature outro, keyed by the film's
  // container id. A film credits the source it was actually built from.
  // Films that animate someone else's result say so and name them; films
  // that present unpublished thinking are labelled as such. Attaching the
  // nearest publication to a loosely related film is how a portfolio starts
  // claiming work it did not do.
  var FILM_CREDITS = {
    // built from the author's own peer-reviewed work
    "pol-film":        "Based on: Ural &amp; Yoshigoe &middot; <em>SecurePoL</em> &middot; IEEE Access 2025",
    "mh-film":         "Illustrative Gaussian detector &middot; assumptions stated in the appendix &middot; not the mechanism of the author&rsquo;s 2024 paper",
    "bcml-film":       "Based on: Ural &amp; Yoshigoe &middot; <em>Survey on Blockchain-Enhanced Machine Learning</em> &middot; IEEE Access 2023",
    "cyb-film":        "Based on: Ural &amp; Acart&uuml;rk &middot; <em>Automatic Detection of Cyber Security Events</em> &middot; ICISSP 2021",
    "wm-compare-film": "Trigger sets after Adi et al. 2018 &middot; generative marking after Kirchenbauer et al. 2023 &middot; auxiliary-head analysis from Ural, Ph.D. dissertation, ERAU 2025",

    // drawn from the author's engineering practice
    "det-film":        "Open research direction of the author, not yet published &middot; synthetic scheduling experiment &middot; no employer design disclosed",
    "lvd-film":        "Informed by Level&nbsp;D full-flight-simulator engineering at Avion &middot; limits per FAA&nbsp;Part&nbsp;60, EASA CS-FSTD(A) and CS-FSTD Issue&nbsp;1 (2026) &middot; no employer design disclosed",

    // results that belong to other people, animated with attribution
    "gd-film":         "Momentum after Polyak 1964 and Nesterov 1983 &middot; saddle-point prevalence after Dauphin et al., NeurIPS 2014",
    "br-film":         "Nakamoto, <em>Bitcoin</em> 2008, &sect;11 &middot; the race is the classical gambler&rsquo;s ruin",
    "tmr-film":        "Classical triple-modular redundancy &middot; failure case per the Ariane&nbsp;5 Flight&nbsp;501 inquiry board, 1996",

    // the author's open questions, not yet published
    "oracles-film":    "Open research direction of the author &middot; not yet published &middot; verifiable ML inference for decentralized oracles",
    "jira-film":       "Open research direction of the author &middot; not yet published &middot; incentive-compatible coordination without a central planner"
  };

  Film.prototype.build = function () {
    if (this._built) return this;

    var filmKey = (this.container && this.container.id) || "lab";
    var FW = this.W, FH = this.H;

    // Global Signature Outro Scene (positions in fractions of the logical
    // stage, so non-960x540 films keep it centered)
    this.scene("Signature", 5, function(s) {
      var bgLight = s.caption("<div style='position:absolute; top:50%; left:50%; width:600px; height:250px; background:radial-gradient(ellipse at center, rgba(59, 130, 246, 0.2) 0%, rgba(14, 18, 26, 0) 70%); transform:translate(-50%,-50%); border-radius:50%; filter:blur(30px);'></div>", { px: FW / 2, py: FH * 0.5, anchor: "center", align: "center", panel: false, maxWidth: "100%" });

      var name = s.caption("<span style='font-family:var(--ds-font-display); font-size:clamp(1.9rem, 5.2vw, 3.4rem); font-weight:500; line-height:1.08; letter-spacing:0.012em; color:#ffffff; white-space:nowrap;'>Dr. Ozgur Ural</span>",
                           { px: FW / 2, py: FH * 0.411, anchor: "center", align: "center", panel: false, maxWidth: "100%" });

      var role = s.caption("<span style='font-family:var(--ds-font-mono); font-size:clamp(0.6rem, 2vw, 1.05rem); line-height:1; color:#ffffff; opacity:0.8; letter-spacing:0.15em; text-transform:uppercase; white-space:nowrap;'>MACHINE LEARNING RESEARCH SCIENTIST &amp; SENIOR SOFTWARE ENGINEER</span>",
                           { px: FW / 2, py: FH * 0.520, anchor: "center", align: "center", panel: false, maxWidth: "100%" });

      var url = s.caption("<span style='font-family:var(--ds-font-serif); font-size:clamp(0.8rem, 2.2vw, 1.15rem); color:#ffffff; opacity:0.6; font-style:italic; white-space:nowrap;'>ozgurural.github.io</span>",
                           { px: FW / 2, py: FH * 0.600, anchor: "center", align: "center", panel: false, maxWidth: "100%" });

      var creditObj = null;

      if (FILM_CREDITS[filmKey]) {
        creditObj = s.caption("<span style='font-family:var(--ds-font-serif); font-size:clamp(0.62rem, 1.7vw, 0.85rem); color:#9fb2d4; line-height:1.45;'>" + FILM_CREDITS[filmKey] + "</span>",
                               { px: FW / 2, py: FH * 0.685, anchor: "center", align: "center", panel: false, maxWidth: "84%" });
      }

      var next = s.caption("<span style='font-family:var(--ds-font-mono); font-size:clamp(0.55rem, 1.45vw, 0.75rem); color:#58c4dd; letter-spacing:0.12em; text-transform:uppercase;'>More cited explainers in the Research Lab</span>",
                           { px: FW / 2, py: FH * 0.795, anchor: "center", align: "center", panel: false, maxWidth: "84%" });

      // Reveal the source early, then hold it. The name still settles with
      // the tonic at 2.22s, without making viewers wait for the credit.
      var LAND = 2.3;

      bgLight.cur.op = 0; bgLight.cur.sx = 0.88; bgLight.cur.sy = 0.88;
      s.scaleTo(bgLight, { at: 0, dur: 2.3, to: 1, ease: Ease.smooth });
      s.fadeIn(bgLight, { at: 0, dur: 0.6 });

      name.cur.op = 0; name.cur.sx = 0.93; name.cur.sy = 0.93;
      s.scaleTo(name, { at: 0, dur: LAND, to: 1, ease: Ease.outQuint });
      s.fadeIn(name, { at: 0.1, dur: 0.6 });

      var followers = [[role, 0.25], [url, 0.4], [next, 0.7]];
      if (creditObj) followers.push([creditObj, 0.5]);
      followers.forEach(function (f) {
        f[0].cur.op = 0;
        s.fadeIn(f[0], { at: f[1], dur: 0.5 });
      });

      [bgLight, name, role, url, next].concat(creditObj ? [creditObj] : []).forEach(function (obj) {
        s.fadeOut(obj, { at: 4.5, dur: 0.5 });
      });
    });

    this._built = true;
    this._fitCanvas();
    // place html anchors using % so they scale with the stage
    for (var i = 0; i < this.scenes.length; i++) {
      var objs = this.scenes[i].objects;
      for (var j = 0; j < objs.length; j++) {
        var h = objs[j];
        if (h.kind === "html") {
          h.el.style.position = "absolute";
          h.el.style.left = (h._anchorPx[0] / this.W * 100) + "%";
          h.el.style.top = (h._anchorPx[1] / this.H * 100) + "%";
        }
      }
    }
    // scene dots on the scrub
    var html = "";
    for (i = 0; i < this.scenes.length; i++) {
      var f = this.scenes[i].start / this.duration * 100;
      html += '<button type="button" class="labf__dot" data-i="' + i + '" style="left:' + f + '%" ' +
              'aria-label="Scene ' + (i + 1) + ': ' + (this.scenes[i].name || "").replace(/"/g, "") + '"></button>';
    }
    this.scrubDots.innerHTML = html;
    var self = this;
    Array.prototype.forEach.call(this.scrubDots.querySelectorAll(".labf__dot"), function (d) {
      d.addEventListener("click", function (e) {
        e.stopPropagation();
        var i = +d.getAttribute("data-i");
        self._userPaused = true; self.pause(); self.seek(self.scenes[i].start + 0.001);
      });
    });
    this.seek(0);
    if (!this.reduced && "IntersectionObserver" in global) {
      // Autoplay on first view; pause when scrolled away to save CPU; resume only
      // if the system (not the user) paused it.
      this.observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          self._inView = en.isIntersecting;
          if (en.isIntersecting) {
            // a film built while its container was display:none never got
            // sized (_fitCanvas bails on zero width) — fit it on first sight
            if (!self.canvasEl.width || !self._dpr) { self._fitCanvas(); self._repositionOverlay(); self.render(); }
            // Auto-resume ONLY if the system paused it. Do NOT autoplay on first view.
            if (!self._userPaused && self._everPlayed && self._autoResume) { self._autoResume = false; self.play(); }
          } else if (self.playing) {
            self.pause(); self._autoResume = true;
          }
        });
      }, { threshold: 0.4 });
      this.observer.observe(this.stage);
    } else if (this.reduced) {
      // Reduced motion: no autoplay. Park on a representative first-scene frame
      // and keep the Play affordance so motion stays strictly user-initiated.
      this.seek(this.scenes.length ? this.scenes[0].dur * 0.55 : 0);
      this.poster.classList.remove("is-hidden");
    }
    return this;
  };

  Film.prototype._activeScene = function (t) {
    for (var i = this.scenes.length - 1; i >= 0; i--) {
      if (t >= this.scenes[i].start - 1e-6) return i;
    }
    return 0;
  };

  Film.prototype.render = function () {
    var t = this.t, i, sc;
    var ai = this._activeScene(t);
    var TR = 0.42; // crossfade window (s)
    
    var self = this;
    if (this._audioCues && window.globalLabVoice) {
      var expectedCue = null;
      for (i = 0; i < this._audioCues.length; i++) {
        if (t >= this._audioCues[i].at) expectedCue = this._audioCues[i];
      }

      if (expectedCue) {
         if (!this._currentCue || this._currentCue.id !== expectedCue.id) {
            if (window._currentLabNarrator) window._currentLabNarrator.pause();
            this._currentCue = expectedCue;
            var a = expectedCue.audio || new Audio("/assets/audio/lab/" + expectedCue.id + ".mp3");
            a.volume = 0.8;
            window._currentLabNarrator = a;
            var offset = Math.max(0, t - expectedCue.at);

            var tryPlay = function() {
               if (window._currentLabNarrator !== a) return;
               if (a.duration && offset >= a.duration) {
                  window._currentLabNarrator = null;
                  return;
               }
               try { a.currentTime = offset; } catch(e) {}
               if (self.playing && !window.globalLabMuted && window.globalLabVoice) {
                  self._playNarrator(a, offset);
               }
            };

            if (a.readyState >= 1) {
               tryPlay();
            } else {
               if (self.playing) self._audioStarting = { audio: a, since: performance.now() };
               a.onloadedmetadata = tryPlay;
            }
         }
      } else {
         if (window._currentLabNarrator) {
            window._currentLabNarrator.pause();
            window._currentLabNarrator = null;
         }
         this._currentCue = null;
      }
    } else if (window._currentLabNarrator) {
      // narration switched off mid-flight
      window._currentLabNarrator.pause();
      window._currentLabNarrator = null;
      this._currentCue = null;
    }
    this._lastT = t;

    // SVG/overlay scene crossfade
    for (i = 0; i < this.scenes.length; i++) {
      sc = this.scenes[i];
      var op = 0;
      if (i === ai) {
        op = 1;
        var into = t - sc.start;
        if (into < TR && i > 0) op = Ease.smooth(into / TR);
      } else if (i === ai - 1) {
        var prevInto = t - this.scenes[ai].start;
        if (prevInto < TR) op = 1 - Ease.smooth(prevInto / TR);
      }
      sc.g.setAttribute("opacity", op);
      sc.tex.style.opacity = op;
      sc.g.style.pointerEvents = "none";
      sc.tex.style.pointerEvents = "none";
      sc.tex.style.visibility = op > 0.001 ? "visible" : "hidden";

      // apply cues for any scene with op>0
      if (op > 0.001) this._applyScene(sc, t - sc.start);
    }

    // canvas: draw active scene's field
    this._drawCanvas(ai, t);

    // chrome
    var as = this.scenes[ai];
    this.chapterEl.textContent = (ai + 1) + " / " + this.scenes.length + "  |  " + (as.name || "");
    this.subEl.innerHTML = as.subtitle || "";

    // transport
    var frac = this.duration ? t / this.duration : 0;
    this.scrubFill.style.width = (frac * 100) + "%";
    this.scrubHead.style.left = (frac * 100) + "%";
    this.timeEl.textContent = fmtTime(t) + " / " + fmtTime(this.duration);
    this.scrub.setAttribute("aria-valuemax", Math.round(this.duration));
    this.scrub.setAttribute("aria-valuenow", Math.round(t));
    this.scrub.setAttribute("aria-valuetext", fmtTime(t) + " of " + fmtTime(this.duration) + ", " + (as.name || ""));
    Array.prototype.forEach.call(this.scrubDots.children, function (d, k) {
      d.classList.toggle("is-active", k === ai);
    });
  };

  Film.prototype._applyScene = function (sc, localT) {
    var i, h;
    for (i = 0; i < sc.objects.length; i++) sc.objects[i].reset();
    // cues in start order (stable: they were pushed in authoring order)
    var cues = sc.cues;
    for (i = 0; i < cues.length; i++) {
      var cue = cues[i];
      if (localT < cue.start - 1e-6) continue;
      var p = clamp01((localT - cue.start) / cue.dur);
      cue.fn(cue.h._state, cue.ease(p), p);
    }
    for (i = 0; i < sc.objects.length; i++) sc.objects[i].commit();
  };

  Film.prototype._drawCanvas = function (ai, t) {
    var ctx = this.ctx;
    if (!ctx) return;
    var dpr = this._dpr || 1, sc = this._scale || 1;
    ctx.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    var scene = this.scenes[ai];
    var hlp = { PAL: PAL, lerp: lerp, clamp01: clamp01, mix: mixColor, rgba: rgba, ease: Ease, W: this.W, H: this.H };
    var into = scene ? t - scene.start : 0, TR = 0.42;
    // the OUTGOING scene's canvas dissolves with the SVG/text layers,
    // instead of hard-cutting on the first frame of a scene change
    if (scene && ai > 0 && into < TR) {
      var prevSc = this.scenes[ai - 1];
      if (prevSc && prevSc._canvasDraw) {
        ctx.save();
        ctx.globalAlpha = 1 - Ease.smooth(into / TR);
        try { prevSc._canvasDraw(t - prevSc.start, ctx, hlp); } catch (e) { /* never let a scene kill the loop */ }
        ctx.restore();
      }
    }
    if (scene && scene._canvasDraw) {
      var op = 1;
      if (into < TR && ai > 0) op = Ease.smooth(into / TR);
      ctx.save();
      ctx.globalAlpha = op;
      try {
        scene._canvasDraw(t - scene.start, ctx, hlp);
      } catch (e) { /* never let a scene kill the loop */ }
      ctx.restore();
    }
  };

  /* ----------------------------- transport ----------------------------- */
  Film.prototype.seek = function (t) {
    this.t = clamp01(t / this.duration) * this.duration;
    this._lastT = this.t;
    // Force audio resync on jump
    if (this._audioStarting && this._audioStarting.finish) this._audioStarting.finish();
    this._currentCue = null;
    this._audioStarting = null;
    if (window._currentLabNarrator) { window._currentLabNarrator.pause(); window._currentLabNarrator = null; }
    if (!this.playing) this.render();
    return this;
  };

  var playingFilmsCount = 0;
  window.globalLabMuted = false;
  window.globalLabVoice = true; // neural narration on by default; 🗣 toggles it off

  Film.prototype.play = function () {
    if (this.playing) return this;
    if (this.t >= this.duration - 1e-3) this.t = 0;
    this.playing = true;
    if (this._resetIdle) this._resetIdle();
    playingFilmsCount++;
    this._everPlayed = true;
    this._lastTs = performance.now();
    if (window._currentLabNarrator && !window.globalLabMuted && window.globalLabVoice &&
        (!window._currentLabNarrator.ended || window._currentLabNarrator.seeking)) {
      this._playNarrator(window._currentLabNarrator);
    }
    this.poster.classList.add("is-hidden");
    this.playBtn.textContent = "⏸";
    this.playBtn.setAttribute("aria-label", "Pause");
    var self = this;
    if (!this._raf) {
      this._raf = requestAnimationFrame(function step(now) {
        if (!self.playing) return;
        // clamp dt: through a GC pause / layout jank the film plays slightly
        // slower instead of teleporting past whole cues
        var dt = Math.min(0.1, Math.max(0, (now - self._lastTs) / 1000));
        self._lastTs = now;

        var ai = self._activeScene(self.t);
        var activeSc = self.scenes[ai];
        // scenes carry start/end (no .duration field) — using .end makes the
        // narration-hold actually fire at each scene boundary
        var scEnd = activeSc ? activeSc.end : self.duration;

        // A caption swap truncates the line being spoken exactly as a scene
        // change does, because lower() puts the subtitle and its narration on
        // the same cue and the next lower() replaces both. Holding only at
        // scene ends therefore still cut most lines mid-sentence. Hold at
        // whichever comes first, the scene end or the next narration cue.
        var holdAt = scEnd;
        var cues = self._audioCues;
        if (cues) {
          for (var ci = 0; ci < cues.length; ci++) {
            if (cues[ci].at > self.t + 1e-6) {
              if (cues[ci].at < holdAt) holdAt = cues[ci].at;
              break;
            }
          }
        }

        var nextT = self.t + dt;
        var pending = self._audioStarting;
        if (pending && pending.audio === window._currentLabNarrator &&
            pending.progressed) {
          pending.progressed();
          pending = self._audioStarting;
        }
        if (pending && pending.audio === window._currentLabNarrator &&
            !window.globalLabMuted && window.globalLabVoice && performance.now() - pending.since < 4000) {
          nextT = self.t;
        }
        if (nextT >= holdAt - 0.05 && window._currentLabNarrator && window.globalLabVoice && !window.globalLabMuted) {
           var n = window._currentLabNarrator;
           // If the audio is currently playing, hold time just before the
           // boundary — but only while it makes real progress; a stalled
           // buffering stream must not freeze the film forever
           if (!n.paused && !n.ended) {
              if (n.currentTime !== self._holdAudioT) { self._holdAudioT = n.currentTime; self._holdStuckS = 0; }
              else self._holdStuckS = (self._holdStuckS || 0) + dt;
              if (self._holdStuckS < 4) nextT = holdAt - 0.05;
           }
        }
        self.t = nextT;
        
        if (self.t >= self.duration) {
          self.t = self.duration;
          self.pause();
          if (self.scenes.length > 1) self.poster.classList.remove("is-hidden"); // show replay overlay
        }
        self.render();
        if (self.playing) self._raf = requestAnimationFrame(step);
      });
    }
    return this;
  };

  Film.prototype.pause = function () {
    if (!this.playing) return this;
    this.playing = false;
    if (this._audioStarting && this._audioStarting.finish) this._audioStarting.finish();
    this._audioStarting = null;
    if (this._clearIdle) this._clearIdle();
    playingFilmsCount = Math.max(0, playingFilmsCount - 1);
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.playBtn.textContent = "▶";
    this.playBtn.setAttribute("aria-label", "Play");
    if (window._currentLabNarrator) window._currentLabNarrator.pause();
    return this;
  };
  Film.prototype.toggle = function () { return this.playing ? this.pause() : this.play(); };
  Film.prototype.restart = function () { this.seek(0); this.poster.classList.add("is-hidden"); return this.play(); };
  Film.prototype.destroy = function () {
    this.pause();
    if (this._onResize) global.removeEventListener("resize", this._onResize);
    if (this._onOrientationChange) global.removeEventListener("orientationchange", this._onOrientationChange);
    if (this._onFsChange) {
      document.removeEventListener("fullscreenchange", this._onFsChange);
      document.removeEventListener("webkitfullscreenchange", this._onFsChange);
    }
    if (this._onVisibilityChange) document.removeEventListener("visibilitychange", this._onVisibilityChange);
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    var idx = LabAnim.films.indexOf(this);
    if (idx !== -1) LabAnim.films.splice(idx, 1);
  };

  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60), sec = s % 60;
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  /* ============================ factory ============================ */
  var LabAnim = {
    films: [],
    create: function (container, opts) {
      if (typeof container === "string") container = document.querySelector(container);
      var film = new Film(container, opts);
      LabAnim.films.push(film);
      return film;
    },
    palette: PAL,
    ease: Ease,
    lerp: lerp,
    clamp01: clamp01,
    mix: mixColor,
    rgba: rgba
  };

  global.LabAnim = LabAnim;

  // Keyboard Accessibility for Lab Films
  document.addEventListener("keydown", function(e) {
    // the scrub slider already consumed this key (it preventDefaults every
    // key it handles) — running both handlers made Space a no-op and turned
    // ArrowRight into a +6s jump
    if (e.defaultPrevented) return;
    // Ignore if user is typing in an input field
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;

    var activeFilm = null;
    if (LabAnim.films) {
      for (var i = 0; i < LabAnim.films.length; i++) {
        if (LabAnim.films[i]._inView) {
          activeFilm = LabAnim.films[i];
          break;
        }
      }
    }
    
    if (!activeFilm) return;

    switch(e.key) {
      case " ":
      case "Spacebar":
        e.preventDefault();
        activeFilm._userPaused = activeFilm.playing;
        activeFilm.toggle();
        break;
      case "ArrowLeft":
        e.preventDefault();
        activeFilm.seek(Math.max(0, activeFilm.t - 5));
        break;
      case "ArrowRight":
        e.preventDefault();
        activeFilm.seek(Math.min(activeFilm.duration, activeFilm.t + 5));
        break;
      case "m":
      case "M":
        e.preventDefault();
        if (activeFilm.muteBtn) activeFilm.muteBtn.click();
        break;
    }
  });

})(window);

// SPA Navigation Audio Fade-Out
document.addEventListener("click", function(e) {
  // let the browser own modified clicks (new tab/window/download)
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
  var target = e.target.closest("a");
  if (!target) return;
  var href = target.getAttribute("href");
  if (!href || href.indexOf("#") === 0 || target.getAttribute("target") === "_blank") return;
  if (!window._currentLabNarrator || window._currentLabNarrator.paused) return;
  
  e.preventDefault();
  var startVol = window._currentLabNarrator.volume;
  var start = performance.now();
  var duration = 300;
  
  function fade(now) {
    var p = (now - start) / duration;
    if (p > 1) {
      window._currentLabNarrator.pause();
      window._currentLabNarrator = null;
      window.location.href = href;
    } else {
      window._currentLabNarrator.volume = startVol * (1 - p);
      requestAnimationFrame(fade);
    }
  }
  requestAnimationFrame(fade);
});
