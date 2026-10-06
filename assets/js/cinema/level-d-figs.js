/*
 * The figures of the Level D film: every diagram, plot and table drawn over
 * the stage. Each is an SVG (one is a canvas) built once into the film's type
 * layer and redrawn from film time by its update(t), so a seek draws exactly
 * the frame for t, like everything else in the film.
 *
 * Drawn in the series' own look (light line on the dark stage, cyan for what
 * is being explained, red for what is late, amber for a force or a warning),
 * with captions numbered like a paper's. Times come in through kit.W(line,
 * word), the moment the narration says that word, so a curve draws as it is
 * named rather than at a time read off a stopwatch.
 */
import { clamp01, lerp, ramp, ease, win, seeded } from './engine.js';

export const C = {
  bg: '#03050A', panel: '#0A1222', ink: '#E8EEF7', ink2: '#AEBCD0', graphite: '#8FA2BA', rule: '#2A3A52', rule2: '#16233A',
  accent: '#6FD3FF', accentT: '#9FE0FF', late: '#FF6272', lateT: '#FF8A96', warm: '#FFB347', ok: '#5DFFC8', violet: '#C79BFF', blue2: '#6AA8FF',
};
export const DISPLAY = '"Space Grotesk", "Inter", sans-serif', SANS = '"Inter", system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';

const NS = 'http://www.w3.org/2000/svg';
export function E(tag, attrs = {}, parent = null, text = null) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
// a stroke that draws itself: pathLength 1, so the dash offset is the fraction left to draw
function S(tag, attrs, parent) {
  return E(tag, { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1,
                  'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, ...attrs }, parent);
}
const draw = (e, u) => { e.setAttribute('stroke-dashoffset', (1 - clamp01(u)).toFixed(4)); };
const op = (e, a) => { e.setAttribute('opacity', clamp01(a).toFixed(3)); };
const at = (e, x, y, r = 0, s = 1) => e.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})` +
  (r ? ` rotate(${r.toFixed(3)})` : '') + (s !== 1 ? ` scale(${s.toFixed(4)})` : ''));
function T(parent, x, y, str, o = {}) {
  return E('text', { x, y, 'font-family': o.font || SANS, 'font-size': o.size || 22, 'font-weight': o.weight || 500,
                     fill: o.fill || C.ink, 'text-anchor': o.anchor || 'start', ...(o.ls ? { 'letter-spacing': o.ls } : {}),
                     ...(o.style ? { 'font-style': o.style } : {}) }, parent, str);
}
// fades and rises into place
function appear(e, t, t0, d = 0.5, rise = 8) {
  const u = ease.outCubic(ramp(t, t0, t0 + d));
  op(e, u);
  // composed with the element's own transform, which a CSS transform would replace
  if (e._base === undefined) e._base = e.getAttribute('transform') || '';
  const dy = (1 - u) * rise;
  e.setAttribute('transform', (dy > 0.01 ? `translate(0 ${dy.toFixed(2)}) ` : '') + e._base);
}
const P = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
function caption(svg, x, y, n, title) {
  const tx = E('text', { x, y, 'font-family': MONO, 'font-size': 18, fill: C.graphite, 'letter-spacing': '.06em' }, svg);
  E('tspan', { 'font-weight': 500, fill: C.accent }, tx, `FIG. ${n}`);
  return tx;
}
function arrowHead(parent, color, size = 11) {
  return E('path', { d: `M ${-size} ${-size * 0.55} L 0 0 L ${-size} ${size * 0.55}`, fill: 'none', stroke: color,
                     'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
}
function arrowTo(line, head, a, b, u) {
  const x = lerp(a[0], b[0], clamp01(u)), y = lerp(a[1], b[1], clamp01(u));
  line.setAttribute('x1', a[0]); line.setAttribute('y1', a[1]); line.setAttribute('x2', x); line.setAttribute('y2', y);
  at(head, x, y, Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI);
  op(head, u > 0.02 ? 1 : 0);
}

/* A figure is one text() item holding an svg; build(svg) returns update(t).
   `panel` puts the series' dark glass behind it, for figures drawn over the machine. */
function figure(kit, o) {
  const pad = o.panel ? 26 : 0, sc = o.scale || 1;
  const item = kit.text({ at: o.at, out: o.out, cls: 'fig' + (o.panel ? ' fig--panel' : '') + (o.cls ? ' ' + o.cls : ''), words: false,
    dur: o.dur ?? 0.6, rise: o.rise ?? 0, outDur: o.outDur ?? 0.5, place: { x: o.x - pad, y: o.y - pad, w: o.w * sc + 2 * pad },
    style: o.panel ? { padding: pad + 'px', boxSizing: 'border-box' } : undefined,
    html: o.html || `<svg width="${o.w * sc}" height="${o.h * sc}" viewBox="0 0 ${o.w} ${o.h}" style="overflow:visible;display:block"></svg>` });
  const upd = o.build(item.el.querySelector('svg') || item.el);
  item.update = t => upd(t);
  return item;
}

/* ------------------------------------------------------------- the promise */
export function roadmap(kit) {
  const { W } = kit;
  const items = [['1', 'Fool every sense', 'sight, motion, touch and rumble', W('promise', 'fool')],
                 ['2', 'Prove it', 'test by test, against the real aircraft', W('promise', 'prove')],
                 ['3', 'Never be late', 'a time limit on every response', W('promise', 'late')],
                 ['4', 'And then: AI', 'what all of this means for the next thing in the loop', W('promise', 'late') + 0.8]];
  return figure(kit, { at: W('promise', 'it') - 0.3, out: kit.T.senses - 0.4, x: 980, y: 250, w: 840, h: 560, build(svg) {
    const rows = items.map(([n, a, b, t0], i) => {
      const g = E('g', {}, svg);
      const y = i * 128;
      T(g, 0, y + 56, n, { font: DISPLAY, size: 52, weight: 700, fill: i < 3 ? C.accent : C.graphite });
      T(g, 90, y + 50, a, { font: DISPLAY, size: 44, weight: 600, fill: i < 3 ? C.ink : C.graphite });
      const rule = S('line', { x1: 90, y1: y + 106, x2: 800, y2: y + 106, stroke: C.rule, 'stroke-width': 1.5 }, g);
      return { g, rule, t0 };
    });
    return t => rows.forEach(r => { appear(r.g, t, r.t0, 0.6, 12); draw(r.rule, ramp(t, r.t0 + 0.2, r.t0 + 1.0)); });
  } });
}

/* -------------------------------------------------------------- the senses */
export function senses(kit) {
  const { W } = kit;
  const t0 = kit.T.senses - 0.3;
  const cue = { eyes: W('senses', 'eyes'), inner: W('senses', 'inner'), hands: W('senses', 'hands'), seat: W('senses', 'seat'),
                feed: W('senses', 'fool'), agree: W('senses', 'once') };
  return figure(kit, { at: t0, out: kit.T.eyes - 0.25, x: 860, y: 96, w: 980, h: 900, build(svg) {
    caption(svg, 200, 22, 2, 'Channels into the pilot');
    const defs = E('defs', {}, svg);
    const grad = E('linearGradient', { id: 'ldViewCone', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    E('stop', { offset: '0', 'stop-color': C.accent, 'stop-opacity': 0.32 }, grad);
    E('stop', { offset: '1', 'stop-color': C.accent, 'stop-opacity': 0 }, grad);
    const g = E('g', { transform: 'translate(200 40)' }, svg);
    const ink = { stroke: C.ink, 'stroke-width': 2.4 };
    // the seat, then the pilot in profile, facing the controls
    const seat = S('path', { d: 'M 150 300 Q 128 300 128 330 L 132 470 Q 122 500 118 560 L 104 770 Q 102 806 136 806 L 470 818 Q 502 818 500 790 L 498 762',
                             stroke: C.rule, 'stroke-width': 3.2 }, g);
    const head = S('path', { ...ink, d: 'M 205 455 C 190 400 170 330 185 270 C 205 185 285 130 370 135 C 450 140 505 200 512 270 ' +
      'C 514 290 512 300 518 312 L 552 372 C 556 380 552 388 540 388 L 530 390 C 536 398 538 410 530 416 L 522 418 ' +
      'C 530 424 531 436 522 442 C 520 462 508 478 484 482 C 460 484 440 488 428 505 L 420 560' }, g);
    const hair = S('path', { stroke: C.ink2, 'stroke-width': 1.6, d: 'M 470 178 C 420 150 330 148 268 182 C 214 214 196 280 200 360' }, g);
    // shoulders, a shirt collar and a captain's four-stripe epaulette
    const back = S('path', { ...ink, d: 'M 205 455 L 222 560 C 190 580 158 604 150 660 L 140 772' }, g);
    const chest = S('path', { ...ink, d: 'M 420 560 C 474 574 504 604 510 646 L 506 724' }, g);
    const collar = S('path', { stroke: C.ink2, 'stroke-width': 2, d: 'M 236 548 L 300 610 L 330 560 M 420 556 L 372 612 L 330 560' }, g);
    const epa = E('g', {}, g);
    E('rect', { x: -44, y: -11, width: 88, height: 22, rx: 5, fill: C.panel, stroke: C.ink2, 'stroke-width': 1.6 }, epa);
    for (let i = 0; i < 4; i++) E('line', { x1: -26 + i * 15, y1: -7, x2: -26 + i * 15, y2: 7, stroke: C.warm, 'stroke-width': 4 }, epa);
    epa.setAttribute('transform', 'translate(232 590) rotate(-24)');
    // the arm to a side-stick, its grip, and the force it pushes back with
    const arm = S('path', { ...ink, d: 'M 262 618 C 282 690 304 748 340 768 C 386 790 432 788 470 780' }, g);
    const stick = S('path', { ...ink, 'stroke-width': 3, d: 'M 528 868 L 506 784' }, g);
    const grip = E('path', { d: 'M 494 744 Q 506 732 518 744 L 520 790 Q 508 798 496 790 Z', fill: C.panel, stroke: C.ink, 'stroke-width': 2.2 }, g);
    const hand = E('path', { d: 'M 462 768 Q 478 752 498 758 Q 514 768 510 786 Q 496 800 476 794 Q 458 788 462 768 Z',
                             fill: C.bg, stroke: C.ink, 'stroke-width': 2.4 }, g);
    const push = E('line', { stroke: C.warm, 'stroke-width': 3.2 }, g), pushH = arrowHead(g, C.warm, 11);
    // the eye and the view it takes in
    const cone = E('path', { d: 'M 492 298 L 800 168 L 800 420 Z', fill: 'url(#ldViewCone)', opacity: 0 }, g);
    const eye = E('g', {}, g);
    E('path', { d: 'M 470 296 Q 482 287 496 297 Q 482 306 470 296 Z', fill: C.bg, stroke: C.ink, 'stroke-width': 1.8 }, eye);
    E('circle', { cx: 487, cy: 297, r: 3.6, fill: C.accent }, eye);
    // the headset: band, ear cup over the ear, boom microphone
    const band = S('path', { stroke: C.ink2, 'stroke-width': 3.4, d: 'M 300 312 C 284 214 324 118 404 116' }, g);
    const cup = E('rect', { x: 278, y: 306, width: 56, height: 86, rx: 24, fill: C.panel, stroke: C.ink, 'stroke-width': 2.2, transform: 'rotate(-8 306 349)' }, g);
    const boom = S('path', { stroke: C.ink2, 'stroke-width': 2.6, d: 'M 326 384 C 380 428 452 446 510 432' }, g);
    const mic = E('circle', { cx: 514, cy: 431, r: 7, fill: C.panel, stroke: C.ink, 'stroke-width': 2 }, g);
    // the inner ear, drawn inside the head: three semicircular canals for rotation, the otoliths for tilt and acceleration
    const inner = E('g', { fill: 'none', 'stroke-width': 2.2 }, g);
    const canals = [0, 60, 120].map(r => E('ellipse', { cx: 0, cy: 0, rx: 20, ry: 11, transform: `rotate(${r})`, stroke: C.graphite }, inner));
    const oto = [[-6, 6], [6, 9], [0, -2]].map(([x, y]) => E('circle', { cx: x, cy: y, r: 3.2, fill: C.graphite, stroke: 'none' }, inner));
    E('path', { d: 'M 24 14 a 9 9 0 1 1 -3 12 a 5 5 0 1 1 3 -7', stroke: C.graphite }, inner);
    at(inner, 372, 316);
    // the brain, where the channels meet
    const brain = S('path', { stroke: C.rule, 'stroke-width': 2, d: 'M 262 236 C 250 186 296 156 340 166 C 362 140 414 146 428 176 ' +
      'C 470 182 482 232 456 258 C 460 292 420 308 392 296 C 368 318 318 314 304 290 C 268 290 252 262 262 236 Z' }, g);
    const gyri = S('path', { stroke: C.rule, 'stroke-width': 1.4, d: 'M 300 200 q 18 14 36 0 q 18 -14 36 0 M 312 248 q 20 -12 40 2 q 18 12 40 -2 M 404 196 q 14 16 4 34' }, g);
    const BR = [360, 232];
    // the channels: from each organ to the brain, with a signal running along it
    const chan = [
      { o: [490, 298], l: [650, 236], anchor: 'start', title: 'Eyes', sub: 'the view outside', c: cue.eyes, path: 'M 490 298 C 452 272 410 252 360 232' },
      { o: [372, 316], l: [40, 250], anchor: 'end', title: 'Inner ear', sub: ['canals: rotation', 'otoliths: tilt and acceleration'], c: cue.inner, path: 'M 372 316 C 372 290 366 262 360 232' },
      { o: [494, 778], l: [650, 700], anchor: 'start', title: 'Hands', sub: 'control forces', c: cue.hands, path: 'M 494 778 C 470 640 430 420 360 232' },
      { o: [300, 796], l: [40, 760], anchor: 'end', title: 'Seat', sub: 'vibration and rumble', c: cue.seat, path: 'M 300 796 C 240 640 250 420 360 232' },
    ].map(ch => {
      const lead = S('path', { d: P([ch.o, [ch.l[0] + (ch.anchor === 'start' ? -14 : 14), ch.l[1] - 8]]), stroke: C.ink2, 'stroke-width': 1.5 }, g);
      const dot = E('circle', { cx: ch.o[0], cy: ch.o[1], r: 6, fill: C.accent, opacity: 0 }, g);
      const tx = T(g, ch.l[0], ch.l[1], ch.title, { size: 28, weight: 600, anchor: ch.anchor, font: DISPLAY });
      const subs = [];
      const link = S('path', { d: ch.path, stroke: C.accent, 'stroke-width': 2, 'stroke-opacity': 0.7 }, g);
      const sig = E('circle', { r: 5, fill: C.accentT, opacity: 0 }, g);
      return { ...ch, lead, dot, tx, subs, link, sig, len: 0 };
    });
    const vib = [0, 1, 2].map(i => E('path', { fill: 'none', stroke: C.warm, 'stroke-width': 2, d: '' }, g));
    const ring = E('circle', { cx: BR[0], cy: BR[1], r: 16, fill: 'none', stroke: C.ok, 'stroke-width': 3, opacity: 0 }, g);
    const agree = T(g, 360, 92, '', { size: 24, weight: 600, anchor: 'middle', fill: C.ok });
    const note = T(g, 0, 878, '', { size: 19 });
    return t => {
      const u = ramp(t, t0, t0 + 1.6);
      for (const p of [seat, head, back, chest, arm, stick, hair, collar]) draw(p, u);
      for (const e of [grip, hand, eye]) op(e, ramp(t, t0 + 1.0, t0 + 1.5));
      appear(epa, t, t0 + 1.2, 0.5, 0);
      draw(band, ramp(t, t0 + 0.8, t0 + 1.6)); op(cup, ramp(t, t0 + 1.0, t0 + 1.5));
      draw(boom, ramp(t, t0 + 1.2, t0 + 1.9)); op(mic, ramp(t, t0 + 1.7, t0 + 2.0));
      op(inner, ramp(t, t0 + 1.0, t0 + 1.5));
      const lit = t > cue.inner - 0.1;
      canals.forEach((c, i) => c.setAttribute('stroke', lit ? [C.accent, C.ok, C.violet][i] : C.graphite));
      oto.forEach(o => o.setAttribute('fill', lit ? C.warm : C.graphite));
      op(cone, 0.9 * ramp(t, cue.eyes - 0.1, cue.eyes + 0.5));
      arrowTo(push, pushH, [560, 760], [518, 768], ramp(t, cue.hands, cue.hands + 0.4) * (0.75 + 0.25 * Math.sin(t * 5)));
      vib.forEach((v, i) => {
        const a = ramp(t, cue.seat - 0.1, cue.seat + 0.3), y = 836 + i * 12, ph = t * 18 + i;
        let d = '';
        for (let x = 150; x <= 460; x += 10) d += (x === 150 ? 'M ' : 'L ') + x + ' ' + (y + 3 * Math.sin(x * 0.12 + ph)).toFixed(1) + ' ';
        v.setAttribute('d', d); op(v, a * (0.75 - i * 0.2));
      });
      draw(brain, ramp(t, cue.feed - 0.4, cue.feed + 0.6)); draw(gyri, ramp(t, cue.feed, cue.feed + 0.8));
      for (const ch of chan) {
        draw(ch.lead, ramp(t, ch.c - 0.15, ch.c + 0.35));
        op(ch.dot, ramp(t, ch.c - 0.1, ch.c + 0.1));
        appear(ch.tx, t, ch.c + 0.1); ch.subs.forEach((s, i) => appear(s, t, ch.c + 0.25 + i * 0.15));
        draw(ch.link, ramp(t, cue.feed, cue.feed + 0.9));
        // signals run to the brain, all arriving together on "agreement"
        if (!ch.len) ch.len = ch.link.getTotalLength ? ch.link.getTotalLength() : 0;
        const ph = ((t - cue.feed) / 0.9) % 1;
        const k = t < cue.agree ? (t > cue.feed + 0.9 ? ph : 0) : ramp(t, cue.agree - 0.6, cue.agree);
        if (ch.len && t > cue.feed + 0.6) {
          const pt = ch.link.getPointAtLength(ch.len * (t < cue.agree - 0.6 ? ph : k));
          ch.sig.setAttribute('cx', pt.x.toFixed(1)); ch.sig.setAttribute('cy', pt.y.toFixed(1));
          op(ch.sig, t < cue.agree + 0.2 ? 1 : 0);
        } else op(ch.sig, 0);
      }
      op(ring, ramp(t, cue.agree, cue.agree + 0.3));
      ring.setAttribute('r', (16 + 22 * ease.outCubic(ramp(t, cue.agree, cue.agree + 0.8))).toFixed(1));
      brain.setAttribute('stroke', t > cue.agree ? C.ok : C.rule);
      appear(agree, t, cue.agree);
      appear(note, t, cue.agree + 0.6);
    };
  } });
}

/* ---------------------------------------------- the eyes: why a mirror */
export function parallax(kit) {
  const { W } = kit;
  const t0 = kit.T.eyes - 0.2, tScreen = W('eyes', 'screen'), tDiff = W('eyes', 'different');
  const tMirror = W('mirror', 'mirror'), tPar = W('mirror', 'parallel'), tFar = W('mirror', 'far'), tAhead = W('mirror', 'straight');
  const CPT = [330, 720], FO = [590, 720], IMG = [460, 470];
  return figure(kit, { at: t0, out: kit.T.motion - 0.3, x: 880, y: 104, w: 920, h: 880, build(svg) {
    caption(svg, 0, 22, 3, 'Seen from above: two pilots and one runway');
    const crew = E('g', {}, svg);
    for (const [p, name] of [[CPT, 'Captain'], [FO, 'First officer']]) {
      E('rect', { x: p[0] - 52, y: p[1] - 18, width: 104, height: 92, rx: 16, fill: 'none', stroke: C.rule, 'stroke-width': 2 }, crew);
      E('circle', { cx: p[0], cy: p[1], r: 9, fill: C.ink }, crew);
      T(crew, p[0], p[1] + 104, name, { size: 20, anchor: 'middle', fill: C.graphite });
    }
    const A = E('g', {}, svg);
    const screen = S('line', { x1: 150, y1: IMG[1], x2: 770, y2: IMG[1], stroke: C.ink, 'stroke-width': 3 }, A);
    const sLab = T(A, 778, IMG[1] + 6, 'an ordinary screen', { size: 20, fill: C.graphite });
    const rwy = E('rect', { x: IMG[0] - 7, y: IMG[1] - 14, width: 14, height: 28, rx: 2, fill: C.ink }, A);
    const rays = [CPT, FO].map(p => S('line', { x1: IMG[0], y1: IMG[1], x2: p[0], y2: p[1], stroke: C.warm, 'stroke-width': 2.2 }, A));
    const ext = [CPT, FO].map(p => {
      const dx = IMG[0] - p[0], dy = IMG[1] - p[1], k = (p[1] - 120) / -dy;
      return S('line', { x1: p[0], y1: p[1], x2: p[0] + dx * k, y2: p[1] + dy * k, stroke: C.warm, 'stroke-width': 1.8, 'stroke-dasharray': '1 1' }, A);
    });
    const seeC = T(A, 640, 150, '', { size: 20 });
    const seeF = T(A, 40, 150, '', { size: 20 });
    const straight = [CPT, FO].map(p => S('line', { x1: p[0], y1: p[1] - 14, x2: p[0], y2: 90, stroke: C.rule, 'stroke-width': 1.6 }, A));
    const realLab = T(A, 460, 80, '', { size: 19 });
    const B = E('g', {}, svg);
    const R = 560, cx = 460, cy = 720;
    const arc = [];
    for (let a = -54; a <= 54; a += 3) { const r = a * Math.PI / 180; arc.push([cx + R * Math.sin(r), cy - R * Math.cos(r)]); }
    const mirror = S('path', { d: P(arc), stroke: C.ink, 'stroke-width': 4 }, B);
    const mLab = T(B, 640, 140, 'curved mirror', { size: 22, weight: 600, font: DISPLAY });
    const yAt = x => cy - Math.sqrt(R * R - (x - cx) * (x - cx));
    const bundle = [250, 330, 410, 510, 590, 670].map(x => S('line', { x1: x, y1: yAt(x), x2: x, y2: 702, stroke: C.accent,
      'stroke-width': x === 330 || x === 590 ? 3 : 1.6, opacity: x === 330 || x === 590 ? 1 : 0.5 }, B));
    const photons = [330, 590].map(x => [0, 1, 2].map(() => E('circle', { r: 4.5, cx: x, cy: 0, fill: C.accent }, B)));
    const parLab = T(B, 20, 470, 'parallel light', { size: 22, fill: C.accentT, weight: 600 });
    const parLab2 = T(B, 20, 498, '', { size: 21 });
    const ticks = [CPT, FO].map(p => S('path', { d: `M ${p[0] - 16} ${p[1] - 44} l 9 10 l 18 -22`, stroke: C.ok, 'stroke-width': 3.2 }, B));
    const both = T(B, 460, 640, 'both see it straight ahead', { size: 21, weight: 600, anchor: 'middle', fill: C.ok });
    return t => {
      op(crew, ramp(t, t0, t0 + 0.6));
      op(A, 1 - ramp(t, kit.T.mirror - 0.1, kit.T.mirror + 0.6));
      draw(screen, ramp(t, tScreen - 0.3, tScreen + 0.4)); appear(sLab, t, tScreen);
      op(rwy, ramp(t, tScreen + 0.2, tScreen + 0.5));
      rays.forEach(r => draw(r, ramp(t, tScreen + 0.5, tScreen + 1.2)));
      ext.forEach(r => draw(r, ramp(t, tDiff - 0.6, tDiff + 0.4)));
      appear(seeC, t, tDiff); appear(seeF, t, tDiff + 0.25);
      straight.forEach(r => draw(r, ramp(t, tDiff + 0.8, tDiff + 1.6))); appear(realLab, t, tDiff + 1.2);
      draw(mirror, ramp(t, tMirror - 0.6, tMirror + 0.5)); appear(mLab, t, tMirror);
      bundle.forEach((b, i) => draw(b, ramp(t, tPar - 0.3 + i * 0.05, tPar + 0.5 + i * 0.05)));
      photons.forEach((ps, j) => ps.forEach((p, k) => {
        const ph = (((t - tPar) * 0.55 + k / 3) % 1 + 1) % 1, x = j ? 590 : 330;
        p.setAttribute('cy', lerp(yAt(x), 700, ph).toFixed(1));
        op(p, t > tPar + 0.4 ? win(ph, 0, 1, 0.15, 0.15) : 0);
      }));
      appear(parLab, t, tPar + 0.2); appear(parLab2, t, tFar);
      ticks.forEach((k, i) => draw(k, ramp(t, tAhead + i * 0.15, tAhead + 0.4 + i * 0.15)));
      appear(both, t, tAhead + 0.3);
    };
  } });
}

/* ------------------------------------------------ the equivalence principle */
export function equivalence(kit) {
  const { W } = kit;
  const t0 = kit.T.equiv - 0.3, tG = W('equiv', 'gravity'), tA = W('equiv', 'acceleration'),
        tEq = W('equiv', 'einstein'), tE = W('equiv', 'einstein') + 0.6;
  const TH = 15 * Math.PI / 180, L = 118;
  return figure(kit, { at: t0, out: kit.T.tilt - 0.3, x: 880, y: 128, w: 920, h: 780, build(svg) {
    caption(svg, 0, 22, 4, '');
    const mk = (x0, title) => {
      const g = E('g', {}, svg);
      T(g, x0 + 210, 110, title, { size: 24, weight: 600, anchor: 'middle', font: DISPLAY });
      E('line', { x1: x0, y1: 470, x2: x0 + 420, y2: 470, stroke: C.ink2, 'stroke-width': 2 }, g);
      const box = E('g', {}, g);
      E('rect', { x: 0, y: 0, width: 230, height: 160, rx: 10, fill: C.panel, stroke: C.ink, 'stroke-width': 2.4 }, box);
      E('line', { x1: 115, y1: 0, x2: 115, y2: 160, stroke: C.rule, 'stroke-width': 1.5, 'stroke-dasharray': '6 6' }, box);
      E('circle', { cx: 115, cy: 12, r: 4, fill: C.ink }, box);
      const str = E('line', { x1: 115, y1: 12, stroke: C.ink, 'stroke-width': 2 }, box);
      const bob = E('circle', { r: 11, fill: C.warm, stroke: C.ink, 'stroke-width': 2 }, box);
      const arc = E('path', { fill: 'none', stroke: C.warm, 'stroke-width': 2.4 }, box);
      const th = T(box, 0, 0, 'θ', { size: 24, weight: 600, fill: C.warm, style: 'italic' });
      return { g, box, str, bob, arc, th };
    };
    const Lp = mk(0, 'Speeding up'), Rp = mk(500, 'Tilted, standing still');
    const setPend = (p, ang, show) => {   // the string's angle from the box's own vertical, toward the rear
      const bx = 115 - L * Math.sin(ang), by = 12 + L * Math.cos(ang);
      p.str.setAttribute('x2', bx.toFixed(1)); p.str.setAttribute('y2', by.toFixed(1));
      p.bob.setAttribute('cx', bx.toFixed(1)); p.bob.setAttribute('cy', by.toFixed(1));
      const r = 62, a0 = Math.PI / 2, a1 = Math.PI / 2 + ang;
      p.arc.setAttribute('d', `M ${115 + r * Math.cos(a0)} ${12 + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${(115 + r * Math.cos(a1)).toFixed(1)} ${(12 + r * Math.sin(a1)).toFixed(1)}`);
      p.th.setAttribute('x', (115 - 22 - 70 * Math.sin(ang / 2)).toFixed(1)); p.th.setAttribute('y', '110');
      op(p.arc, show); op(p.th, show);
    };
    const accel = E('line', { stroke: C.warm, 'stroke-width': 3.2 }, svg), accelH = arrowHead(svg, C.warm, 13);
    const aLab = T(svg, 0, 0, 'a', { size: 26, weight: 600, fill: C.warm, style: 'italic' });
    const streaks = [0, 1, 2].map(() => E('line', { stroke: C.rule, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, svg));
    const grav = E('line', { stroke: C.ink, 'stroke-width': 3 }, svg), gravH = arrowHead(svg, C.ink, 13);
    const gLab = T(svg, 868, 404, 'g', { size: 26, weight: 600, style: 'italic' });
    const eq = T(svg, 460, 330, '≡', { size: 64, anchor: 'middle', fill: C.accent });
    const same = T(svg, 460, 560, 'Same angle. Same feeling.', { size: 25, weight: 600, anchor: 'middle', font: DISPLAY });
    const who = T(svg, 460, 600, 'the equivalence principle', { size: 20, anchor: 'middle', fill: C.graphite, style: 'italic' });
    return t => {
      op(Lp.g, ramp(t, t0, t0 + 0.6)); op(Rp.g, ramp(t, t0 + 0.2, t0 + 0.8));
      const ua = ramp(t, tA - 0.2, tA + 4.5), drive = ua > 0 ? 1 : 0;
      const sw = Math.exp(-3 * Math.max(0, t - tA)) * Math.cos(9 * Math.max(0, t - tA));
      const angL = drive * TH * (1 - sw) * ease.outCubic(ramp(t, tA - 0.2, tA + 0.3));
      const slide = 60 * ua * ua;
      at(Lp.box, 70 + slide, 310);
      setPend(Lp, angL, ramp(t, tA + 1.0, tA + 1.6));
      arrowTo(accel, accelH, [110 + slide, 500], [230 + slide, 500], ramp(t, tA - 0.1, tA + 0.4));
      aLab.setAttribute('x', (240 + slide).toFixed(1)); aLab.setAttribute('y', '508'); op(aLab, ramp(t, tA + 0.2, tA + 0.5));
      streaks.forEach((s, i) => {
        const y = 340 + i * 45, x = 40 + slide - 20 - i * 6;
        s.setAttribute('x1', (x - 36 * ua).toFixed(1)); s.setAttribute('x2', x.toFixed(1));
        s.setAttribute('y1', y); s.setAttribute('y2', y); op(s, ua > 0.05 ? 0.9 : 0);
      });
      const ang = TH * ease.inOutSine(ramp(t, tG, tG + 2.0));
      Rp.box.setAttribute('transform', `translate(600 310) rotate(${(-ang * 180 / Math.PI).toFixed(3)} 0 160)`);
      setPend(Rp, ang, ramp(t, tA + 1.0, tA + 1.6));
      arrowTo(grav, gravH, [860, 300], [860, 400], ramp(t, tG - 0.2, tG + 0.3));
      op(gLab, ramp(t, tG, tG + 0.3));
      appear(eq, t, tEq - 0.2); appear(same, t, tEq); appear(who, t, tE);
    };
  } });
}

/* ---------------------------------------- motion cueing: a take-off, felt */
// the shape of the cue, shared with the platform: a step of acceleration at
// tau = 0, an onset that washes out, and a tilt that builds slowly
export const CUE = {
  onset: x => (x <= 0 ? 0 : 0.25 * Math.exp(-x / 0.7) * (1 - Math.exp(-x / 0.08))),
  tilt: (x, back) => (x <= 0 ? 0 : 0.25 * (1 - Math.exp(-x / 1.9))) * (1 - back),
};
