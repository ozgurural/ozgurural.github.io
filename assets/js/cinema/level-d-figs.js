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
  E('tspan', { dx: 14, 'font-family': SANS, 'letter-spacing': '.01em', 'font-size': 19 }, tx, title);
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

/* ---------------------------------------------------------- training path */
export function training(kit) {
  const { W } = kit;
  const t0 = W('trust', 'pilot'), tSim = W('trust', 'training'), tLine = W('trust', 'first'), tCheck = W('trust', 'check');
  return figure(kit, { at: t0 - 0.4, out: kit.T.promise - 0.05, x: 146, y: 690, w: 900, h: 270, scale: 0.8, panel: true, build(svg) {
    caption(svg, 0, 18, 1, 'Training a pilot for a new airliner');
    const base = S('line', { x1: 0, y1: 196, x2: 900, y2: 196, stroke: C.rule, 'stroke-width': 2 }, svg);
    const box = (x, y, w, h, stroke, sw = 2) => S('rect', { x, y, width: w, height: h, rx: 12, stroke, 'stroke-width': sw }, svg);
    const fill2 = E('rect', { x: 190, y: 92, width: 420, height: 94, rx: 12, fill: C.accent, opacity: 0 }, svg);
    const b1 = box(0, 120, 170, 66, C.graphite), b2 = box(190, 92, 420, 94, C.accent, 2.6), b3 = box(630, 120, 270, 66, C.ink);
    const book = E('g', { stroke: C.graphite, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round' }, svg);
    E('path', { d: 'M0 0 L14 4 L28 0 L28 26 L14 30 L0 26 Z M14 4 L14 30' }, book);
    at(book, 18, 138);
    const sim = E('g', { stroke: C.accent, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    E('path', { d: 'M4 0 h34 a6 6 0 0 1 6 6 v14 h-46 v-14 a6 6 0 0 1 6 -6 Z M0 24 h44 M6 24 L0 44 M22 24 L22 44 M38 24 L44 44 M-4 44 h52' }, sim);
    at(sim, 214, 116);
    const plane = E('g', { stroke: C.ink, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    E('path', { d: 'M0 14 L44 14 Q52 14 54 18 Q52 22 44 22 L6 22 L0 14 Z M18 14 L26 2 L32 2 L28 14 M20 22 L28 32 L34 32 L30 22 M2 14 L0 6 L5 6 L9 14' }, plane);
    at(plane, 648, 132);
    const l1 = T(svg, 85, 238, 'Ground school', { size: 20, anchor: 'middle', fill: C.graphite });
    const l2a = T(svg, 276, 132, 'Level C or D simulator', { size: 24, weight: 600, font: DISPLAY });
    const l2b = T(svg, 276, 164, 'all flight training and checking', { size: 20, fill: C.accentT });
    const l3a = T(svg, 718, 152, 'Airline flights', { size: 22, weight: 600, font: DISPLAY });
    const l3b = T(svg, 630, 238, 'first time in the real aircraft,', { size: 19, fill: C.graphite });
    const l3c = T(svg, 630, 262, 'with a check pilot beside them', { size: 19, fill: C.graphite });
    const dot = E('circle', { r: 7, cy: 196, fill: C.accent }, svg);
    return t => {
      draw(base, ramp(t, t0, tLine + 1.2));
      draw(b1, ramp(t, t0, t0 + 0.6)); appear(book, t, t0 + 0.3); appear(l1, t, t0 + 0.3);
      draw(b2, ramp(t, tSim - 0.2, tSim + 0.8)); appear(sim, t, tSim + 0.2); appear(l2a, t, tSim + 0.1); appear(l2b, t, tSim + 0.5);
      op(fill2, 0.1 * ease.inOutSine(ramp(t, tSim + 0.3, tSim + 1.2)));
      draw(b3, ramp(t, tLine, tLine + 0.7)); appear(plane, t, tLine + 0.3); appear(l3a, t, tLine + 0.3);
      appear(l3b, t, tCheck - 1.6); appear(l3c, t, tCheck);
      const x = t < tSim ? lerp(20, 190, ease.inOutSine(ramp(t, t0, tSim))) :
                t < tLine ? lerp(190, 610, ease.inOutSine(ramp(t, tSim, tLine))) : lerp(610, 880, ease.inOutSine(ramp(t, tLine, tCheck + 0.6)));
      dot.setAttribute('cx', x.toFixed(1));
      op(dot, ramp(t, t0, t0 + 0.4));
    };
  } });
}

/* ------------------------------------------------------------- the promise */
export function roadmap(kit) {
  const { W } = kit;
  const items = [['1', 'Fool every sense', 'sight, motion, touch and rumble', W('promise', 'fool')],
                 ['2', 'Prove it', 'test by test, against the real aircraft', W('promise', 'prove')],
                 ['3', 'Never be late', 'a time limit on every response', W('promise', 'late')],
                 ['4', 'And then: AI', 'what all of this means for the next thing in the loop', W('promise', 'late') + 0.8]];
  return figure(kit, { at: W('promise', 'it') - 0.3, out: kit.T.senses - 2.05, x: 980, y: 250, w: 840, h: 560, build(svg) {
    const rows = items.map(([n, a, b, t0], i) => {
      const g = E('g', {}, svg);
      const y = i * 128;
      T(g, 0, y + 56, n, { font: DISPLAY, size: 52, weight: 700, fill: i < 3 ? C.accent : C.graphite });
      T(g, 90, y + 50, a, { font: DISPLAY, size: 44, weight: 600, fill: i < 3 ? C.ink : C.graphite });
      T(g, 90, y + 84, b, { size: 21, fill: C.graphite });
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
                feed: W('senses', 'feed'), agree: W('senses', 'agreement') };
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
      const subs = (Array.isArray(ch.sub) ? ch.sub : [ch.sub]).map((s, i) => T(g, ch.l[0], ch.l[1] + 28 + i * 24, s, { size: 19, fill: C.graphite, anchor: ch.anchor }));
      const link = S('path', { d: ch.path, stroke: C.accent, 'stroke-width': 2, 'stroke-opacity': 0.7 }, g);
      const sig = E('circle', { r: 5, fill: C.accentT, opacity: 0 }, g);
      return { ...ch, lead, dot, tx, subs, link, sig, len: 0 };
    });
    const vib = [0, 1, 2].map(i => E('path', { fill: 'none', stroke: C.warm, 'stroke-width': 2, d: '' }, g));
    const ring = E('circle', { cx: BR[0], cy: BR[1], r: 16, fill: 'none', stroke: C.ok, 'stroke-width': 3, opacity: 0 }, g);
    const agree = T(g, 360, 92, 'cues must agree', { size: 24, weight: 600, anchor: 'middle', fill: C.ok });
    const note = T(g, 0, 878, 'When they disagree, people get simulator sickness (the sensory conflict theory).',
                   { size: 19, fill: C.graphite, style: 'italic' });
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
    const seeC = T(A, 640, 150, 'the captain sees it to the right', { size: 20, fill: C.warm });
    const seeF = T(A, 40, 150, 'the first officer, to the left', { size: 20, fill: C.warm });
    const straight = [CPT, FO].map(p => S('line', { x1: p[0], y1: p[1] - 14, x2: p[0], y2: 90, stroke: C.rule, 'stroke-width': 1.6 }, A));
    const realLab = T(A, 460, 80, 'the real runway is far ahead: straight ahead for both', { size: 19, anchor: 'middle', fill: C.graphite });
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
    const parLab = T(B, 20, 470, 'parallel rays,', { size: 21, fill: C.accentT, weight: 600 });
    const parLab2 = T(B, 20, 498, 'as if from far away', { size: 21, fill: C.accentT });
    const ticks = [CPT, FO].map(p => S('path', { d: `M ${p[0] - 16} ${p[1] - 44} l 9 10 l 18 -22`, stroke: C.ok, 'stroke-width': 3.2 }, B));
    const both = T(B, 460, 640, 'both see the runway straight ahead', { size: 21, weight: 600, anchor: 'middle', fill: C.ok });
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
        tEq = W('equiv', 'equivalence'), tE = W('equiv', 'einstein');
  const TH = 15 * Math.PI / 180, L = 118;
  return figure(kit, { at: t0, out: kit.T.tilt - 0.3, x: 880, y: 128, w: 920, h: 780, build(svg) {
    caption(svg, 0, 22, 4, 'The equivalence principle, with a pendulum for an inner ear');
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
    const same = T(svg, 460, 560, 'Same angle. The inner ear cannot tell them apart.', { size: 25, weight: 600, anchor: 'middle', font: DISPLAY });
    const who = T(svg, 460, 600, 'The equivalence principle: Einstein, 1907, the starting point of general relativity.',
                  { size: 19, anchor: 'middle', fill: C.graphite, style: 'italic' });
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
export function cueing(kit) {
  const { W } = kit;
  const t0 = kit.T.tilt - 0.2, tS = W('tilt', 'shove'), tN = W('tilt', 'tilts'), tG = W('tilt', 'gravity'), tWs = W('agree', 'creeps');
  const X0 = 70, X1 = 880, Y0 = 250, YS = 760, SPAN = 26;
  const xs = s => X0 + (X1 - X0) * s / SPAN, ys = g => Y0 - g * YS;
  const back = s => ease.inOutSine(clamp01((s - (tWs - tS)) / 6.5));
  const air = s => (s < 0 ? 0 : s < (tWs - tS) ? 0.25 : 0.25 * (1 - clamp01((s - (tWs - tS)) / 1.2)));
  return figure(kit, { at: t0, out: kit.T.proof - 0.3, x: 900, y: 690, w: 900, h: 290, panel: true, build(svg) {
    caption(svg, 0, 0, 5, 'What the pilot feels, pushed back into the seat');
    E('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.ink2, 'stroke-width': 1.6 }, svg);
    E('line', { x1: X0, y1: Y0, x2: X0, y2: 40, stroke: C.ink2, 'stroke-width': 1.6 }, svg);
    T(svg, X0 - 10, ys(0.25) + 6, '0.25 g', { size: 16, anchor: 'end', fill: C.graphite, font: MONO });
    T(svg, X1, Y0 + 26, 'time', { size: 17, anchor: 'end', fill: C.graphite });
    const curve = (stroke, w, dash) => E('path', { fill: 'none', stroke, 'stroke-width': w, 'stroke-linejoin': 'round', ...(dash ? { 'stroke-dasharray': dash } : {}) }, svg);
    const cAir = curve(C.ink, 2, '7 6'), cOn = curve(C.accent, 2.2), cTilt = curve(C.violet, 2.2), cSum = curve(C.warm, 3.4);
    const key = [['aircraft', C.ink], ['shove (onset)', C.accent], ['tilt: g · sin θ', C.violet], ['felt', C.warm]].map(([s, c], i) =>
      T(svg, 120 + i * 196, 30, s, { size: 18, fill: c, weight: i === 3 ? 700 : 500 }));
    const head = E('circle', { r: 6, fill: C.warm }, svg);
    const wash = T(svg, xs(tWs - tS + 3.2), ys(0.25) - 10, 'washout: back below the threshold', { size: 17, fill: C.graphite, anchor: 'middle' });
    return t => {
      const now = t - tS, N = 140, upto = Math.min(SPAN, Math.max(0, now));
      const pts = { a: [], o: [], ti: [], s: [] };
      for (let i = 0; i <= N; i++) {
        const s = -1 + (upto + 1) * i / N, x = xs(Math.max(0, s));
        const o = CUE.onset(s), ti = CUE.tilt(s, back(s));
        pts.a.push([x, ys(air(s))]); pts.o.push([x, ys(o)]); pts.ti.push([x, ys(ti)]); pts.s.push([x, ys(o + ti)]);
      }
      cAir.setAttribute('d', P(pts.a)); cOn.setAttribute('d', P(pts.o)); cTilt.setAttribute('d', P(pts.ti)); cSum.setAttribute('d', P(pts.s));
      const vis = ramp(t, tS - 0.3, tS);
      for (const c of [cAir, cOn, cSum]) op(c, vis);
      op(cTilt, ramp(t, tN - 0.3, tN));
      key.forEach((k, i) => appear(k, t, [tS - 0.2, tS, tN, tG][i]));
      const last = pts.s[pts.s.length - 1];
      head.setAttribute('cx', last[0].toFixed(1)); head.setAttribute('cy', last[1].toFixed(1)); op(head, vis * (now < SPAN ? 1 : 0));
      appear(wash, t, tWs + 1.2);
    };
  } });
}

/* ------------------------------------------------------------ the levels */
export function levels(kit) {
  const { W } = kit;
  const t0 = kit.T.proof - 0.2, tA = W('proof', 'level'), tD = W('proof', 'd'), tH = W('proof', 'highest');
  return figure(kit, { at: t0, out: W('proof', 'list') - 0.2, x: 980, y: 170, w: 820, h: 720, build(svg) {
    caption(svg, 0, 22, 6, 'Full-flight simulator levels');
    const cols = ['A', 'B', 'C', 'D'].map((n, i) => {
      const x = 30 + i * 196, h = 140 + i * 110;
      const g = E('g', {}, svg);
      const r = E('rect', { x, width: 150, y: 600, height: 0, rx: 8, fill: i === 3 ? C.accent : C.rule2, 'fill-opacity': i === 3 ? 0.2 : 1,
                            stroke: i === 3 ? C.accent : C.rule, 'stroke-width': 2 }, g);
      const l = T(g, x + 75, 0, n, { font: DISPLAY, size: 66, weight: 700, anchor: 'middle', fill: i === 3 ? C.accent : C.ink });
      return { r, l, h, ti: i === 3 ? tD : tA - 0.9 + i * 0.3 };
    });
    E('line', { x1: 0, y1: 600, x2: 810, y2: 600, stroke: C.ink2, 'stroke-width': 2 }, svg);
    const br = S('path', { d: 'M 422 640 L 422 652 L 772 652 L 772 640', stroke: C.graphite, 'stroke-width': 1.8 }, svg);
    const brL = T(svg, 597, 680, 'six-axis motion', { size: 19, anchor: 'middle', fill: C.graphite });
    const top = T(svg, 693, 92, 'the highest', { size: 24, weight: 700, anchor: 'middle', fill: C.accentT });
    const src = T(svg, 0, 716, 'FAA 14 CFR Part 60 · EASA CS-FSTD(A)', { size: 16, fill: C.graphite, font: MONO });
    return t => {
      cols.forEach(c => {
        const h = c.h * Math.max(0, ease.outBack(ramp(t, c.ti, c.ti + 0.6)));
        c.r.setAttribute('y', (600 - h).toFixed(1)); c.r.setAttribute('height', h.toFixed(1));
        c.l.setAttribute('y', (600 - h - 22).toFixed(1)); op(c.l, ramp(t, c.ti, c.ti + 0.3));
      });
      draw(br, ramp(t, tH - 0.2, tH + 0.4)); appear(brL, t, tH + 0.2);
      appear(top, t, tH); op(src, ramp(t, t0 + 0.5, t0 + 1));
    };
  } });
}

/* ------------------------------------------- objective tests, every year */
export function tests(kit) {
  const { W } = kit;
  const tList = W('proof', 'list'), t0 = tList - 0.7, tEach = W('proof', 'each'), tFT = W('proof', 'maneuver'),
        tBand = W('proof', 'narrow'), tDid = W('proof', 'did');
  const tY = kit.T.yearly, tYear = W('yearly', 'year'), tDay = W('yearly', 'day'), tB = W('yearly', 'one'), tTime = W('yearly', 'time');
  const COLS = 7, ROWS = 5, TW = 112, TH = 66, GX = 14, GY = 16, OX = 20, OY = 70, PICK = 9, DELAY = 23;
  const resp = (k, x) => {         // a family of step responses, one per test
    const r = seeded(k + 7), z = 0.3 + 0.5 * r(), w = 3 + 4 * r(), a = 0.5 + 0.45 * r(), d = 0.12 + 0.1 * r();
    if (x < d) return 0;
    const s = (x - d) * w, wd = Math.sqrt(1 - z * z);
    return a * (1 - Math.exp(-z * s) * (Math.cos(wd * s) + z / wd * Math.sin(wd * s)));
  };
  return figure(kit, { at: t0, out: kit.T.delay - 2.05, x: 880, y: 118, w: 920, h: 860, build(svg) {
    caption(svg, 0, 22, 7, 'Objective tests: the simulator against flight-test data');
    const grid = E('g', {}, svg);
    const thumbs = [];
    for (let k = 0; k < COLS * ROWS; k++) {
      const c = k % COLS, r = Math.floor(k / COLS), x = OX + c * (TW + GX), y = OY + r * (TH + GY);
      const g = E('g', {}, grid);
      E('rect', { x, y, width: TW, height: TH, rx: 6, fill: C.panel, stroke: C.rule, 'stroke-width': 1.5 }, g);
      const pts = [];
      for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([x + 8 + u * (TW - 16), y + TH - 10 - resp(k, u) * (TH - 22)]); }
      E('path', { d: P(pts), fill: 'none', stroke: k === DELAY ? C.warm : C.accent, 'stroke-width': 1.8 }, g);
      const tick = S('path', { d: `M ${x + TW - 24} ${y + 16} l 6 7 l 12 -14`, stroke: C.ok, 'stroke-width': 2.6 }, g);
      thumbs.push({ g, tick, x, y });
    }
    const delayLab = T(grid, OX + (DELAY % COLS) * (TW + GX) + TW / 2, OY + Math.floor(DELAY / COLS) * (TH + GY) + TH + 18,
                       'transport delay', { size: 15, anchor: 'middle', fill: C.warm, weight: 700 });
    const driver = T(svg, OX, OY + ROWS * (TH + GY) + 22, 'Level C and D: a driver program runs them automatically', { size: 18, fill: C.graphite });
    const big = E('g', {}, svg);
    const BX = 60, BY = 90, BW = 820, BH = 380;
    E('rect', { x: BX - 50, y: BY - 30, width: BW + 80, height: BH + 110, rx: 12, fill: C.panel, stroke: C.rule, 'stroke-width': 1.5 }, big);
    E('line', { x1: BX, y1: BY + BH, x2: BX + BW, y2: BY + BH, stroke: C.ink2, 'stroke-width': 1.6 }, big);
    E('line', { x1: BX, y1: BY, x2: BX, y2: BY + BH, stroke: C.ink2, 'stroke-width': 1.6 }, big);
    T(big, BX + BW, BY + BH + 30, 'time after a column input', { size: 17, anchor: 'end', fill: C.graphite });
    T(big, BX + 10, BY + 4, 'pitch attitude', { size: 17, fill: C.graphite });
    const bx = u => BX + u * BW, by = v => BY + BH - 20 - v * (BH - 60);
    const bandPts = [];
    for (let i = 0; i <= 60; i++) { const u = i / 60; bandPts.push([bx(u), by(resp(PICK, u) + 0.07)]); }
    for (let i = 60; i >= 0; i--) { const u = i / 60; bandPts.push([bx(u), by(resp(PICK, u) - 0.07)]); }
    const band = E('path', { d: P(bandPts) + ' Z', fill: C.accent, 'fill-opacity': 0.12, stroke: C.accent, 'stroke-opacity': 0.35, 'stroke-width': 1 }, big);
    const ft = [];
    for (let i = 0; i < 26; i++) { const u = (i + 0.5) / 26; ft.push(E('circle', { cx: bx(u), cy: by(resp(PICK, u) + (seeded(i + 90)() - 0.5) * 0.03), r: 5, fill: C.ink }, big)); }
    const simPts = [];
    for (let i = 0; i <= 120; i++) { const u = i / 120; simPts.push([bx(u), by(resp(PICK, u) + 0.025 * Math.sin(u * 9) - 0.01)]); }
    const sim = S('path', { d: P(simPts), stroke: C.accent, 'stroke-width': 3.2 }, big);
    const kk = T(big, BX, BY + BH + 62, '● flight test (the real aircraft)    ━ simulator    ▒ tolerance band', { size: 17, fill: C.graphite });
    const pass = E('g', {}, big);
    E('rect', { x: -70, y: -26, width: 140, height: 50, rx: 8, fill: C.panel, stroke: C.ok, 'stroke-width': 3 }, pass);
    T(pass, 0, 10, 'PASS', { size: 28, weight: 700, anchor: 'middle', fill: C.ok, ls: '.12em', font: DISPLAY });
    at(pass, BX + BW - 110, BY + 70);
    const yr = E('g', { transform: 'translate(780 380)' }, svg);
    const ring = S('circle', { cx: 0, cy: 0, r: 96, stroke: C.ink2, 'stroke-width': 2.4, transform: 'rotate(-90)' }, yr);
    const months = [];
    for (let m = 0; m < 12; m++) { const a = m / 12 * 2 * Math.PI - Math.PI / 2; months.push(E('circle', { cx: 96 * Math.cos(a), cy: 96 * Math.sin(a), r: 5, fill: C.rule }, yr)); }
    T(yr, 0, 8, 'every year', { size: 22, weight: 600, anchor: 'middle', font: DISPLAY });
    T(yr, 0, 34, 'all tests again', { size: 17, anchor: 'middle', fill: C.graphite });
    const hand = E('line', { x1: 0, y1: 0, x2: 0, y2: -80, stroke: C.accent, 'stroke-width': 3, 'stroke-linecap': 'round' }, yr);
    const day = E('g', { transform: 'translate(780 640)' }, svg);
    const dayC = S('circle', { cx: 0, cy: 0, r: 52, stroke: C.ink2, 'stroke-width': 2.2 }, day);
    T(day, 0, 9, '24 h', { size: 24, weight: 700, anchor: 'middle', font: MONO });
    T(day, 0, 86, 'a check before use', { size: 19, anchor: 'middle', fill: C.graphite });
    return t => {
      const gridIn = ramp(t, tList - 0.6, tList + 0.2), opened = ease.inOutCubic(ramp(t, tEach - 0.3, tEach + 0.5)),
            closed = ease.inOutCubic(ramp(t, tY - 0.4, tY + 0.4)), bigOn = opened * (1 - closed);
      op(grid, gridIn * (1 - bigOn));
      thumbs.forEach((th, i) => {
        op(th.g, ramp(t, tList - 0.6 + i * 0.025, tList - 0.3 + i * 0.025));
        draw(th.tick, t < tY ? ramp(t, tList + 0.4 + i * 0.03, tList + 0.7 + i * 0.03) : ramp(t, tYear - 0.2 + i * 0.035, tYear + 0.1 + i * 0.035));
      });
      const shrink = ease.inOutCubic(ramp(t, tY - 0.2, tY + 0.6));
      grid.setAttribute('transform', `translate(0 ${(shrink * 40).toFixed(1)}) scale(${(1 - 0.35 * shrink).toFixed(4)})`);
      op(driver, ramp(t, tList + 0.6, tList + 1.0) * (1 - bigOn) * (1 - shrink));
      op(big, bigOn);
      const s = 0.25 + 0.75 * opened;
      big.setAttribute('transform', `translate(${lerp(OX + (PICK % COLS) * (TW + GX), 0, opened).toFixed(1)} ${lerp(OY + Math.floor(PICK / COLS) * (TH + GY), 0, opened).toFixed(1)}) scale(${s.toFixed(4)})`);
      ft.forEach((d, i) => op(d, ramp(t, tFT - 0.2 + i * 0.03, tFT + 0.1 + i * 0.03)));
      op(band, ramp(t, tBand - 0.3, tBand + 0.3));
      draw(sim, ramp(t, tBand - 0.6, tDid));
      op(kk, ramp(t, tBand, tBand + 0.4));
      appear(pass, t, tDid + 0.1, 0.35, 0);
      op(yr, ramp(t, tY + 0.2, tY + 0.7)); op(day, ramp(t, tDay - 0.4, tDay));
      const yu = ramp(t, tYear - 0.2, tYear + 1.6);
      draw(ring, yu);
      hand.setAttribute('transform', `rotate(${(yu * 360).toFixed(1)})`);
      months.forEach((m, i) => m.setAttribute('fill', yu * 12 > i ? C.ok : C.rule));
      draw(dayC, ramp(t, tDay - 0.4, tDay + 0.6));
      // the bridge: the transport delay test lifts out of the list
      const lift = ramp(t, tTime - 0.6, tTime + 0.2), d = thumbs[DELAY];
      d.g.setAttribute('transform', lift > 0 ? `translate(${((d.x + TW / 2) * -0.35 * lift).toFixed(1)} ${((d.y + TH / 2) * -0.35 * lift).toFixed(1)}) scale(${(1 + 0.35 * lift).toFixed(4)})` : '');
      op(delayLab, ramp(t, tB - 0.2, tB + 0.3));
      if (t > tB) thumbs.forEach((th, i) => { if (i !== DELAY) op(th.g, 1 - 0.75 * ramp(t, tB, tB + 0.6)); });
    };
  } });
}

/* ----------------------------------------- the clock: delay, chain, tighter */
export const MS = [8, 17, 25, 50, 34];     // the old film's illustrative stage budget
const CUM = MS.reduce((a, m) => (a.push(a[a.length - 1] + m), a), [0]);
export function clock(kit) {
  const { W } = kit;
  const t0 = kit.T.delay - 0.3;
  const cue = { moves: W('delay', 'moves'), view: W('delay', 'view'), instr: W('delay', 'instruments'), cabin: W('delay', 'cabin'),
                ms: W('delay', 'hundred'), blink: W('delay', 'blink'), miss: W('delay', 'miss'), qual: W('delay', 'qualify') };
  const v = ['reads', 'works', 'runs', 'draws', 'moves'].map(w => W('chain', w));
  const st = v.map((s, k) => [s, k < 4 ? v[k + 1] : W('chain', 'cabin') + 0.6]);
  const tH = W('tighter', 'hundred'), tMiss = W('tighter', 'miss'), tFit = W('tighter', 'fit');
  const X0 = 90, PX = 7.4, AY = 330;          // 0 ms at x 90, 7.4 px a millisecond: 200 ms reaches x 1570
  const xm = ms => X0 + ms * PX;
  const NAMES = [['control loading', 'reads the controls'], ['flight model', 'works out how it flies'], ['aircraft systems', 'runs its systems'],
                 ['image generator', 'draws the world'], ['display and motion', 'updates the screens, moves the cabin']];
  const COLS = ['#5FD6FF', '#6AA8FF', '#5DFFC8', '#C79BFF', '#FFB347'];
  return figure(kit, { at: t0, out: kit.T.frames - 0.3, x: 120, y: 430, w: 1680, h: 440, build(svg) {
    caption(svg, 0, 0, 8, 'Transport delay: from a control input to the answer');
    const axis = S('line', { x1: X0, y1: AY, x2: xm(200), y2: AY, stroke: C.ink2, 'stroke-width': 2 }, svg);
    const ticks = E('g', {}, svg);
    for (let m = 0; m <= 200; m += 10) {
      E('line', { x1: xm(m), x2: xm(m), y1: AY, y2: AY + (m % 50 ? 6 : 12), stroke: C.ink2, 'stroke-width': m % 50 ? 1 : 1.6 }, ticks);
      if (m % 50 === 0) T(ticks, xm(m), AY + 36, m + (m === 200 ? ' ms' : ''), { size: 18, anchor: 'middle', font: MONO, fill: C.ink2 });
    }
    const inp = E('g', {}, svg);
    E('line', { x1: 0, y1: 0, x2: 0, y2: -46, stroke: C.ink, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, inp);
    E('circle', { cx: 0, cy: -52, r: 9, fill: C.bg, stroke: C.ink, 'stroke-width': 2.4 }, inp);
    at(inp, X0, AY - 14);
    const inpL = T(svg, X0 - 6, AY - 84, 'control input', { size: 19, fill: C.ink2 });
    const gate = E('g', {}, svg);
    E('line', { x1: 0, y1: 26, x2: 0, y2: AY - 12, stroke: C.ink, 'stroke-width': 3 }, gate);
    const gLab = T(gate, 10, 44, '', { size: 19, weight: 600, font: DISPLAY });
    const ghost = E('g', {}, svg);
    E('line', { x1: xm(150), y1: 26, x2: xm(150), y2: AY - 12, stroke: C.graphite, 'stroke-width': 1.6, 'stroke-dasharray': '6 6' }, ghost);
    T(ghost, xm(150) + 10, 44, '150 ms · until now', { size: 17, fill: C.graphite });
    const blink = E('g', {}, svg);
    E('rect', { x: xm(100), y: AY + 54, width: xm(200) - xm(100), height: 12, rx: 6, fill: C.rule }, blink);
    E('path', { d: `M ${xm(200) + 4} ${AY + 60} l 18 0 m -8 -6 l 8 6 l -8 6`, fill: 'none', stroke: C.graphite, 'stroke-width': 2 }, blink);
    T(blink, xm(100), AY + 92, 'a blink of an eye: about 100 to 400 ms', { size: 18, fill: C.graphite });
    const outs = [['view', 118, cue.view], ['instruments', 126, cue.instr], ['cabin', 134, cue.cabin]].map(([n, ms, c], i) => {
      const g = E('g', {}, svg);
      E('line', { x1: xm(ms), x2: xm(ms), y1: AY - 8, y2: AY - 44 - i * 34, stroke: C.ok, 'stroke-width': 1.6 }, g);
      E('circle', { cx: xm(ms), cy: AY, r: 5, fill: C.ok }, g);
      T(g, xm(ms) - 8, AY - 50 - i * 34, n, { size: 18, anchor: 'end', fill: C.ok, weight: 600 });
      return { g, c };
    });
    const pulse = E('circle', { r: 9, fill: C.accent, cy: AY }, svg);
    const late = E('g', {}, svg);
    const lateBar = E('rect', { x: xm(150), y: AY - 5, height: 10, width: 0, fill: C.late }, late);
    const stamp = E('g', {}, late);
    E('rect', { x: -116, y: -24, width: 232, height: 46, rx: 8, fill: C.panel, stroke: C.late, 'stroke-width': 3 }, stamp);
    T(stamp, 0, 9, 'DOES NOT QUALIFY', { size: 20, weight: 700, anchor: 'middle', fill: C.lateT, ls: '.08em', font: DISPLAY });
    at(stamp, xm(178), AY - 150);
    const bars = NAMES.map(([n, d], k) => {
      const y = 92 + k * 40, g = E('g', {}, svg);
      const r = E('rect', { x: xm(CUM[k]), y, height: 26, width: 0, rx: 4, fill: COLS[k], 'fill-opacity': 0.85 }, g);
      const ln = T(g, xm(CUM[k + 1]) + 12, y + 19, n, { size: 18, weight: 600 });
      const ld = T(g, 0, y + 19, ' ' + d, { size: 17, fill: C.graphite });
      return { r, ln, ld };
    });
    const over = E('rect', { y: 92 + 4 * 40 - 4, height: 34, x: xm(100), width: xm(134) - xm(100), fill: 'none', stroke: C.late, 'stroke-width': 3, rx: 6 }, svg);
    const overL = T(svg, xm(117), 92 + 4 * 40 + 58, '34 ms late', { size: 19, weight: 700, anchor: 'middle', fill: C.lateT });
    const total = T(svg, xm(134) + 12, AY - 18, '134 ms', { size: 18, font: MONO, fill: C.ink2 });
    return t => {
      draw(axis, ramp(t, t0, t0 + 0.8)); op(ticks, ramp(t, t0 + 0.3, t0 + 0.9));
      appear(inp, t, t0 + 0.3, 0.4, 0); appear(inpL, t, t0 + 0.4);
      let ms = -1;
      if (t >= cue.moves && t < cue.miss) {
        ms = t < cue.view ? lerp(0, 118, ramp(t, cue.moves, cue.view)) : t < cue.instr ? lerp(118, 126, ramp(t, cue.view, cue.instr)) : lerp(126, 134, ramp(t, cue.instr, cue.cabin));
      } else if (t >= cue.miss && t < kit.T.chain) {
        ms = lerp(0, 172, ease.inOutSine(ramp(t, cue.miss, cue.qual)));
      } else if (t >= kit.T.chain) {
        ms = 0;
        for (let k = 0; k < 5; k++) if (t >= st[k][0]) ms = lerp(CUM[k], CUM[k + 1], ramp(t, st[k][0], st[k][1]));
      }
      pulse.setAttribute('cx', xm(Math.max(0, ms)).toFixed(1)); op(pulse, ms >= 0 ? 1 : 0);
      pulse.setAttribute('fill', ms > 150 || (t > kit.T.tighter && ms > 100) ? C.late : C.accent);
      outs.forEach(o => { appear(o.g, t, o.c, 0.35, 0); if (t > cue.miss - 0.3) op(o.g, 1 - ramp(t, cue.miss - 0.3, cue.miss)); });
      const gms = lerp(150, 100, ease.inOutCubic(ramp(t, tH - 0.1, tH + 1.3)));
      gate.setAttribute('transform', `translate(${xm(gms).toFixed(1)} 0)`);
      op(gate, ramp(t, cue.ms - 0.2, cue.ms + 0.3));
      const after = t >= tH, lab = after ? 'EASA 2026: 100 ms' : '150 ms · the Level C/D limit';
      if (gLab.textContent !== lab) gLab.textContent = lab;
      gLab.setAttribute('text-anchor', after ? 'end' : 'start'); gLab.setAttribute('x', after ? '-12' : '10');
      op(ghost, ramp(t, tH + 1.2, tH + 1.8));
      appear(blink, t, cue.blink - 0.2, 0.5, 0);
      const lu = t >= cue.miss && t < kit.T.chain ? ramp(t, cue.miss + (150 / 172) * (cue.qual - cue.miss) * 0.95, cue.qual) : 0;
      lateBar.setAttribute('width', (lu * (xm(172) - xm(150))).toFixed(1));
      op(late, t < kit.T.chain - 0.3 ? 1 : 1 - ramp(t, kit.T.chain - 0.3, kit.T.chain));
      appear(stamp, t, cue.qual, 0.3, 0);
      if (t > kit.T.chain - 0.3) op(stamp, 1 - ramp(t, kit.T.chain - 0.3, kit.T.chain));
      bars.forEach((b, k) => {
        b.r.setAttribute('width', (ramp(t, st[k][0], st[k][1]) * MS[k] * PX).toFixed(1));
        appear(b.ln, t, st[k][0] + 0.1); appear(b.ld, t, st[k][0] + 0.3);
        if (t > st[k][0]) b.ld.setAttribute('x', (xm(CUM[k + 1]) + 22 + b.ln.getComputedTextLength()).toFixed(1));
        if (k === 4) b.r.setAttribute('fill', t > tMiss - 0.4 ? C.late : COLS[k]);
      });
      appear(total, t, st[4][1] - 0.2);
      op(over, ramp(t, tFit, tFit + 0.4)); appear(overL, t, tMiss);
    };
  } });
}

/* ----------------------------------------- a whole session, frame by frame */
export function session(kit) {
  const { W } = kit;
  const t0 = kit.T.frames - 0.3, tSixty = W('frames', 'sixty'), tHours = W('frames', 'hours'), tThou = W('frames', 'thousand');
  const tSlip = W('slips', 'slips'), tJolt = W('slips', 'jolts'), tBunch = W('slips', 'bunches'), tStut = W('slips', 'stutter');
  // frame i: a row of 60 is one second, 60 rows a minute, 10 x 6 minutes an hour, 2 x 2 hours the session
  const GM = 4, GH = 26, MW = 60, HW = 10 * MW + 9 * GM, HH = 6 * MW + 5 * GM, FW = 2 * HW + GH, FH = 2 * HH + GH;
  const pos = i => {
    const h = Math.floor(i / 216000), r = i % 216000, m = Math.floor(r / 3600), r2 = r % 3600, s = Math.floor(r2 / 60), f = r2 % 60;
    return [(h % 2) * (HW + GH) + (m % 10) * (MW + GM) + f, Math.floor(h / 2) * (HH + GH) + Math.floor(m / 10) * (MW + GM) + s];
  };
  const N = 864000, CW = 920, CH = 600;
  const rnd = seeded(864), scatter = [], bunch = [];
  for (let k = 0; k < 864; k++) scatter.push(pos(Math.floor(rnd() * N)));
  for (let b = 0; b < 36; b++) { const s0 = Math.floor(rnd() * (N - 60)); for (let j = 0; j < 24; j++) bunch.push(pos(s0 + j)); }
  return figure(kit, { at: t0, out: kit.T.rack - 0.3, x: 880, y: 120, w: CW, cls: 'fig--canvas',
    html: `<canvas width="${CW}" height="${CH}" style="display:block"></canvas><div class="fig__scale"></div><div class="fig__count"></div>`,
    build(root) {
      const cv = root.querySelector('canvas'), g = cv.getContext('2d');
      const scale = root.querySelector('.fig__scale'), count = root.querySelector('.fig__count');
      const bmp = document.createElement('canvas');
      bmp.width = FW; bmp.height = FH;
      const bg = bmp.getContext('2d'), img = bg.createImageData(FW, FH), px = img.data;
      const nz = seeded(7);
      for (let i = 0; i < N; i++) { const [x, y] = pos(i), o = (y * FW + x) * 4, k = 0.82 + 0.3 * nz(); px[o] = 0x33 * k; px[o + 1] = 0x4E * k; px[o + 2] = 0x72 * k; px[o + 3] = 255; }
      bg.putImageData(img, 0, 0);
      const S0 = CW / MW, S1 = Math.min(CW / FW, CH / FH);
      return t => {
        const z = ease.inOutCubic(ramp(t, tHours - 0.2, tThou + 0.2));
        const s = Math.exp(lerp(Math.log(S0), Math.log(S1), z));
        const cx = lerp(MW / 2, FW / 2, ease.inOutSine(ramp(z, 0.35, 1))), cy = lerp(0.5, FH / 2, ease.inOutSine(ramp(z, 0.2, 1)));
        const ox = CW / 2 - cx * s, oy = (z < 0.02 ? CH * 0.42 : lerp(CH * 0.42, CH / 2, ramp(z, 0, 0.3))) - cy * s;
        g.clearRect(0, 0, CW, CH);
        g.imageSmoothingEnabled = s < 1;
        g.drawImage(bmp, ox, oy, FW * s, FH * s);
        if (s > 5) {                                   // frame borders while a frame is a square you can see
          g.strokeStyle = C.bg; g.lineWidth = Math.min(3, s * 0.12);
          g.beginPath();
          const x0 = Math.max(0, Math.floor(-ox / s)), x1 = Math.min(FW, Math.ceil((CW - ox) / s));
          const y0 = Math.max(0, Math.floor(-oy / s)), y1 = Math.min(FH, Math.ceil((CH - oy) / s));
          for (let x = x0; x <= x1; x++) { g.moveTo(ox + x * s, oy + y0 * s); g.lineTo(ox + x * s, oy + y1 * s); }
          for (let y = y0; y <= y1; y++) { g.moveTo(ox + x0 * s, oy + y * s); g.lineTo(ox + x1 * s, oy + y * s); }
          g.stroke();
          if (t >= t0 + 0.6 && z < 0.5) {               // one second, running: sixty frames a second
            const k = Math.floor(((t - t0) * 60) % 60);
            g.globalAlpha = 1 - z * 2;
            g.fillStyle = C.accent;
            g.fillRect(ox + k * s + 1.5, oy + 1.5, s - 3, s - 3);
            g.globalAlpha = 1;
          }
        }
        const su = ramp(t, tSlip - 0.2, tJolt), gu = ease.inOutCubic(ramp(t, tBunch - 0.1, tBunch + 1.3));
        if (su > 0) {
          const n = Math.floor(864 * su);
          g.fillStyle = C.late;
          for (let k = 0; k < n; k++) {
            const a = scatter[k], b = bunch[k];
            g.beginPath(); g.arc(ox + lerp(a[0], b[0], gu) * s, oy + lerp(a[1], b[1], gu) * s, 2.6, 0, 7); g.fill();
          }
        }
        const cu = ramp(t, tStut - 0.4, tStut + 0.2);
        if (cu > 0) {
          const y = CH - 64, w = 13, x0 = (CW - 60 * w) / 2;
          g.globalAlpha = cu;
          g.fillStyle = C.panel; g.fillRect(x0 - 16, y - 40, 60 * w + 32, 74);
          g.strokeStyle = C.rule; g.lineWidth = 1.5; g.strokeRect(x0 - 16, y - 40, 60 * w + 32, 74);
          for (let f = 0; f < 60; f++) { g.fillStyle = f >= 31 && f < 37 ? C.late : '#334E72'; g.fillRect(x0 + f * w + 1, y, w - 2, w + 8); }
          g.fillStyle = C.lateT; g.font = `600 18px ${SANS}`;
          g.fillText('one second, six frames late in a row: a stutter', x0, y - 14);
          g.globalAlpha = 1;
        }
        const lab = s > 6 ? 'one second · 60 frames' : s > 1.6 ? 'one minute · 3,600 frames' : s > S1 * 1.4 ? 'one hour · 216,000 frames' : 'a four-hour session · 864,000 frames';
        if (scale.textContent !== lab) scale.textContent = lab;
        scale.style.opacity = String(ramp(t, tSixty - 0.3, tSixty + 0.2));
        const n = Math.round(864 * ramp(t, tSlip - 0.2, tJolt));
        const html = n ? `<b>${n}</b> slips at one in a thousand` : '';
        if (count.innerHTML !== html) count.innerHTML = html;
        count.style.opacity = String(ramp(t, tSlip, tSlip + 0.3) * (1 - ramp(t, tStut - 0.6, tStut - 0.2)));
      };
    } });
}

/* ------------------------------------------- the rack: nine hosts, one frame */
export function rack(kit) {
  const { W } = kit;
  const t0 = kit.T.rack - 0.3, tSlow = W('rack', 'slowest'), tAvg = W('rack', 'average'), tOwn = W('rack', 'own'), tChk = W('rack', 'checked');
  const X0 = 150, PX = 34, Y0 = 92, DY = 50, DL = 16.67;
  const xm = ms => X0 + ms * PX, CYC = 1.7;
  const r = seeded(99), fin = [];
  for (let f = 0; f < 60; f++) { const row = []; for (let h = 0; h < 9; h++) row.push(5.5 + r() * 7.5); fin.push(row); }
  const LATEF = Math.floor((tSlow + 0.4 - t0) / CYC);
  fin[LATEF][5] = 19.2;
  const BUD = [13, 12, 14, 13, 12, 14, 13, 12, 13];
  for (let f = Math.floor((tChk - t0) / CYC); f < 60; f++) fin[f][5] = 14.6 + r() * 0.8;
  return figure(kit, { at: t0, out: kit.T.count - 0.3, x: 880, y: 118, w: 920, h: 820, build(svg) {
    caption(svg, 0, 22, 10, 'One frame, nine computers');
    for (let h = 0; h < 9; h++) T(svg, X0 - 18, Y0 + h * DY + 20, 'host ' + (h + 1), { size: 18, anchor: 'end', fill: C.graphite, font: MONO });
    E('line', { x1: X0, y1: Y0 + 9 * DY + 6, x2: xm(21), y2: Y0 + 9 * DY + 6, stroke: C.ink2, 'stroke-width': 1.6 }, svg);
    for (let m = 0; m <= 20; m += 5) T(svg, xm(m), Y0 + 9 * DY + 32, m + (m === 20 ? ' ms' : ''), { size: 16, anchor: 'middle', font: MONO, fill: C.ink2 });
    E('line', { x1: xm(DL), x2: xm(DL), y1: Y0 - 26, y2: Y0 + 9 * DY + 6, stroke: C.ink, 'stroke-width': 2.4, 'stroke-dasharray': '7 6' }, svg);
    T(svg, xm(DL), Y0 - 36, 'one frame at 60 Hz: 16.7 ms', { size: 18, anchor: 'middle', weight: 600 });
    const bars = [], ovs = [], buds = [];
    for (let h = 0; h < 9; h++) {
      bars.push(E('rect', { x: X0, y: Y0 + h * DY, height: 28, width: 0, rx: 4, fill: C.rule }, svg));
      ovs.push(E('rect', { x: xm(DL), y: Y0 + h * DY, height: 28, width: 0, rx: 4, fill: C.late }, svg));
      buds.push(E('path', { d: `M ${xm(BUD[h])} ${Y0 + h * DY - 6} l 0 40`, stroke: C.warm, 'stroke-width': 3, opacity: 0 }, svg));
    }
    const closeL = E('line', { y1: Y0 - 12, y2: Y0 + 9 * DY, stroke: C.accent, 'stroke-width': 3 }, svg);
    const closeT = T(svg, 0, Y0 + 9 * DY + 62, 'the frame closes when the slowest host finishes', { size: 18, anchor: 'middle', fill: C.accentT, weight: 600 });
    const avgR = E('rect', { x: X0, y: Y0 + 9 * DY + 92, height: 28, width: 0, rx: 4, fill: C.ok, 'fill-opacity': 0.7 }, svg);
    const avgT = T(svg, X0 - 18, Y0 + 9 * DY + 112, 'average', { size: 18, anchor: 'end', fill: C.ok, font: MONO, weight: 600 });
    const avgL = T(svg, 0, Y0 + 9 * DY + 112, 'looks fine', { size: 18, fill: C.ok, weight: 600 });
    const lateT = T(svg, xm(19.4) + 12, Y0 + 5 * DY + 20, 'frame late', { size: 19, fill: C.lateT, weight: 700 });
    const flag = T(svg, xm(15.4) + 14, Y0 + 5 * DY + 20, 'over its own budget: flagged', { size: 18, fill: C.warm, weight: 700 });
    const budL = T(svg, xm(13), Y0 - 64, 'each host: its own budget', { size: 18, fill: C.warm, anchor: 'middle', weight: 600 });
    return t => {
      const f = Math.max(0, Math.floor((t - t0) / CYC)), ph = (t - t0) - f * CYC, row = fin[Math.min(59, f)];
      const g = ease.outCubic(clamp01(ph / 1.0));
      let slow = 0, last = 0, lateNow = false;
      row.forEach((v, h) => { if (v > row[slow]) slow = h; });
      row.forEach((v, h) => {
        const len = Math.min(v, 21 * g);
        const cap = t > tOwn + 0.6 && v > BUD[h] && f > LATEF ? Math.min(len, BUD[h]) : len;
        bars[h].setAttribute('width', (Math.min(cap, DL) * PX).toFixed(1));
        ovs[h].setAttribute('width', (Math.max(0, cap - DL) * PX).toFixed(1));
        bars[h].setAttribute('fill', h === slow && ph > 1.0 ? C.ink2 : C.rule);
        if (cap > DL) lateNow = true;
        last = Math.max(last, cap);
        op(buds[h], ramp(t, tOwn - 0.1 + h * 0.04, tOwn + 0.2 + h * 0.04));
      });
      closeL.setAttribute('x1', xm(last).toFixed(1)); closeL.setAttribute('x2', xm(last).toFixed(1));
      closeL.setAttribute('stroke', lateNow ? C.late : C.accent);
      op(closeL, ph > 1.0 ? 1 : 0.35);
      closeT.setAttribute('x', Math.min(xm(last), 720).toFixed(1));
      op(closeT, ramp(t, tSlow - 0.3, tSlow + 0.2) * (1 - ramp(t, tAvg - 0.6, tAvg - 0.2)));
      const mean = row.reduce((a, b) => a + b, 0) / 9, au = ramp(t, tAvg - 0.2, tAvg + 0.3);
      avgR.setAttribute('width', (mean * PX * g * au).toFixed(1)); op(avgT, au);
      avgL.setAttribute('x', (xm(mean * g) + 12).toFixed(1)); op(avgL, au * ramp(t, tAvg + 0.3, tAvg + 0.6));
      op(lateT, lateNow && f === LATEF ? 1 : 0);
      op(flag, t > tChk && row[5] > BUD[5] && ph > 0.9 ? 1 : 0);
      op(budL, ramp(t, tOwn - 0.1, tOwn + 0.3));
    };
  } });
}

/* --------------------------------------------- the counter and the spot check */
export function counter(kit) {
  const { W } = kit;
  const t0 = kit.T.count - 0.3, tO = W('count', 'overrun'), tSpot = W('count', 'spot'), tMiss = W('count', 'miss'), tCtr = W('count', 'counter');
  const X0 = 40, X1 = 640, Y0 = 470, YS = 330, N = 90, BUDGET = 0.72;
  const val = k => { const n = Math.sin(k * 12.9898) * 43758.5453; let v = 0.36 + 0.22 * (n - Math.floor(n)); if (k % 41 === 19) v = 1.0; return v; };
  return figure(kit, { at: t0, out: kit.T.determinism - 0.25, x: 880, y: 150, w: 920, h: 640, build(svg) {
    caption(svg, 0, 22, 11, 'One host, frame by frame');
    E('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.ink2, 'stroke-width': 1.6 }, svg);
    E('line', { x1: X0, y1: Y0 - BUDGET * YS, x2: X1, y2: Y0 - BUDGET * YS, stroke: C.warm, 'stroke-width': 2, 'stroke-dasharray': '7 6' }, svg);
    T(svg, X1, Y0 - BUDGET * YS - 10, 'budget', { size: 17, anchor: 'end', fill: C.warm, weight: 600 });
    T(svg, X1, Y0 + 26, 'frames →', { size: 17, anchor: 'end', fill: C.graphite });
    const line = E('path', { fill: 'none', stroke: C.ink2, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, svg);
    const dots = E('g', {}, svg), spikes = E('g', {}, svg);
    const box = E('g', { transform: 'translate(700 120)' }, svg);
    E('rect', { x: 0, y: 0, width: 210, height: 310, rx: 12, fill: C.panel, stroke: C.rule, 'stroke-width': 1.6 }, box);
    T(box, 105, 44, 'overruns counted', { size: 18, anchor: 'middle', fill: C.graphite });
    const cnt = T(box, 105, 128, '0', { size: 78, anchor: 'middle', font: MONO, weight: 500, fill: C.lateT });
    const spl = T(box, 105, 196, 'spot checks saw', { size: 18, anchor: 'middle', fill: C.graphite });
    const spc = T(box, 105, 270, '0', { size: 58, anchor: 'middle', font: MONO, fill: C.accent });
    const missL = T(svg, 0, 0, 'missed', { size: 18, anchor: 'middle', fill: C.accent, weight: 700 });
    return t => {
      const k0 = Math.floor(Math.max(0, t - t0) * 24), pts = [];
      let dh = '', sh = '', missX = -1;
      for (let i = 0; i <= N; i++) {
        const k = k0 + i, v = val(k), x = X0 + (X1 - X0) * i / N, y = Y0 - v * YS;
        pts.push([x, y]);
        if (k % 10 === 0) dh += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${C.accent}"/>`;
        if (v > BUDGET) { sh += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="none" stroke="${C.late}" stroke-width="3"/>`; if (missX < 0) missX = x; }
      }
      line.setAttribute('d', P(pts));
      dots.innerHTML = dh; spikes.innerHTML = sh;
      op(dots, ramp(t, tSpot - 0.3, tSpot + 0.1)); op(spikes, ramp(t, tO - 0.2, tO + 0.2));
      let total = 0;
      for (let k = 0; k <= k0 + N; k++) if (k % 41 === 19) total++;
      cnt.textContent = String(t < tO ? 0 : total);
      op(box, ramp(t, tO - 0.3, tO + 0.2)); op(spl, ramp(t, tSpot, tSpot + 0.3)); op(spc, ramp(t, tSpot, tSpot + 0.3));
      cnt.setAttribute('transform', `translate(105 100) scale(${(1 + 0.12 * win(t, tCtr, tCtr + 0.6, 0.15, 0.4)).toFixed(4)}) translate(-105 -100)`);
      missL.setAttribute('x', missX.toFixed(1)); missL.setAttribute('y', String(Y0 - YS - 18));
      op(missL, missX > 0 ? ramp(t, tMiss - 0.2, tMiss + 0.2) : 0);
    };
  } });
}

/* ---------------------------------------- determinism: max, not mean */
export function maxNotMean(kit) {
  const { W } = kit;
  const t0 = kit.T.determinism + 0.2, tSlow = W('determinism', 'slowest'), tAvg = W('determinism', 'average');
  const r = seeded(17), xs = [];
  for (let i = 0; i < 4000; i++) { const u = r(), v = r(); xs.push(Math.exp(Math.log(8) + 0.25 * Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(6.283 * v))); }
  xs.push(16.4);
  const B = 60, MAXV = 18, hist = new Array(B).fill(0);
  for (const x of xs) hist[Math.min(B - 1, Math.floor(x / MAXV * B))]++;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length, mx = Math.max(...xs);
  return figure(kit, { at: t0, out: kit.T.ai - 2.05, x: 460, y: 640, w: 1000, h: 260, build(svg) {
    const X0 = 0, X1 = 1000, Y0 = 200, top = Math.max(...hist);
    const bars = hist.map((h, i) => E('rect', { x: X0 + i * (X1 - X0) / B + 1, width: (X1 - X0) / B - 2, y: Y0, height: 0, fill: i > 50 && h ? C.late : C.rule }, svg));
    E('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.ink2, 'stroke-width': 1.6 }, svg);
    T(svg, X1, Y0 + 26, 'frame time →', { size: 17, anchor: 'end', fill: C.graphite });
    const xv = v => X0 + (X1 - X0) * v / MAXV;
    const mL = E('line', { x1: xv(mean), x2: xv(mean), y1: Y0, y2: 30, stroke: C.graphite, 'stroke-width': 2, 'stroke-dasharray': '6 6' }, svg);
    const mT = T(svg, xv(mean), 20, 'average', { size: 18, anchor: 'middle', fill: C.graphite });
    const xL = E('line', { x1: xv(mx), x2: xv(mx), y1: Y0, y2: 30, stroke: C.late, 'stroke-width': 3 }, svg);
    const xT = T(svg, xv(mx), 20, 'slowest', { size: 18, anchor: 'middle', fill: C.lateT, weight: 700 });
    return t => {
      bars.forEach((b, i) => {
        const u = ease.outCubic(ramp(t, t0 + i * 0.008, t0 + 0.5 + i * 0.008));
        const h = hist[i] ? Math.max(3, hist[i] / top * 160) * u : 0;
        b.setAttribute('y', (Y0 - h).toFixed(1)); b.setAttribute('height', h.toFixed(1));
      });
      op(xL, ramp(t, tSlow - 0.2, tSlow + 0.2)); op(xT, ramp(t, tSlow - 0.2, tSlow + 0.2));
      const am = ramp(t, t0 + 0.3, t0 + 0.6) * (1 - 0.7 * ramp(t, tAvg + 0.2, tAvg + 0.8));
      op(mL, am); op(mT, am);
    };
  } });
}

/* ------------------------------------------------- AI joins the loop */
export function aiTail(kit) {
  const { W } = kit;
  const t0 = kit.T.ai - 0.2, tAI = W('ai', 'ai'), tIn = W('ai', 'inside'), tLoops = W('ai', 'loops'),
        tMany = W('ai', 'many'), tSlow = W('ai', 'slowest'), tPun = W('ai', 'punishes');
  const r = seeded(31), xs = [];
  for (let i = 0; i < 5000; i++) { const u = r(), v = r(); xs.push(Math.exp(Math.log(6) + 0.55 * Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(6.283 * v))); }
  const B = 48, MAXV = 40, hist = new Array(B).fill(0);
  for (const x of xs) if (x < MAXV) hist[Math.floor(x / MAXV * B)]++;
  const BUDGET = 14, mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  return figure(kit, { at: t0, out: kit.T.thesis - 0.25, x: 880, y: 120, w: 920, h: 820, build(svg) {
    caption(svg, 0, 22, 12, 'A learned model in the loop: response time, many runs');
    const X0 = 30, X1 = 900, Y0 = 430, top = Math.max(...hist);
    const xv = v => X0 + (X1 - X0) * v / MAXV;
    const bars = hist.map((h, i) => E('rect', { x: X0 + i * (X1 - X0) / B + 1, width: (X1 - X0) / B - 2, y: Y0, height: 0, fill: C.accent, 'fill-opacity': 0.8 }, svg));
    E('line', { x1: X0, y1: Y0, x2: X1, y2: Y0, stroke: C.ink2, 'stroke-width': 1.6 }, svg);
    T(svg, X1, Y0 + 28, 'response time →', { size: 17, anchor: 'end', fill: C.graphite });
    const bud = E('g', {}, svg);
    E('line', { x1: xv(BUDGET), x2: xv(BUDGET), y1: 100, y2: Y0, stroke: C.ink, 'stroke-width': 2.6, 'stroke-dasharray': '7 6' }, bud);
    T(bud, xv(BUDGET) + 10, 118, 'its share of the frame', { size: 18, weight: 600 });
    const avg = E('g', {}, svg);
    E('path', { d: `M ${xv(mean)} ${Y0 + 8} l -8 14 l 16 0 z`, fill: C.ok }, avg);
    T(avg, xv(mean), Y0 + 46, 'average: fine', { size: 17, anchor: 'middle', fill: C.ok, weight: 600 });
    const tail = T(svg, xv(26), 260, 'the slowest answers: too late', { size: 20, anchor: 'middle', fill: C.lateT, weight: 700 });
    const tail2 = T(svg, xv(26), 288, 'however rare', { size: 18, anchor: 'middle', fill: C.lateT });
    const chain = E('g', { transform: 'translate(0 560)' }, svg);
    const names = ['controls', 'flight model', 'systems', 'image', 'display, motion'];
    const blocks = names.map(n => { const g = E('g', {}, chain); E('rect', { x: 0, y: 0, width: 128, height: 54, rx: 10, fill: C.panel, stroke: C.rule, 'stroke-width': 2 }, g); T(g, 64, 33, n, { size: 17, anchor: 'middle', fill: C.ink2 }); return g; });
    const ai = E('g', {}, chain);
    E('rect', { x: 0, y: -8, width: 140, height: 70, rx: 12, fill: C.warm, 'fill-opacity': 0.14, stroke: C.warm, 'stroke-width': 3 }, ai);
    T(ai, 70, 34, 'AI model', { size: 21, anchor: 'middle', weight: 700, fill: C.warm, font: DISPLAY });
    const tags = ['see', 'predict', 'decide'].map(w => T(chain, 0, 0, w, { size: 18, anchor: 'middle', fill: C.warm, weight: 600 }));
    const links = E('path', { fill: 'none', stroke: C.rule, 'stroke-width': 1.8 }, chain);
    return t => {
      const open = ease.inOutCubic(ramp(t, tAI - 0.2, tIn + 0.2)), xs2 = [];
      let x = 10;
      blocks.forEach((b, i) => { at(b, x, 0); xs2.push(x); x += 128 + 26 + (i === 2 ? open * 166 : 0); });
      const aiX = xs2[2] + 128 + 26;
      at(ai, aiX, lerp(-60, 0, ease.outBack(ramp(t, tIn, tIn + 0.6)))); op(ai, ramp(t, tIn, tIn + 0.3));
      op(chain, ramp(t, t0, t0 + 0.5));
      let d = '';
      xs2.forEach((x0, i) => { if (i < 4) d += `M ${x0 + 128} 27 L ${xs2[i + 1]} 27 `; });
      links.setAttribute('d', d);
      tags.forEach((g, i) => { g.setAttribute('x', (aiX + 70 + (i - 1) * 76).toFixed(1)); g.setAttribute('y', '-26'); appear(g, t, tLoops + 0.3 + i * 0.35, 0.35, 6); });
      bars.forEach((b, i) => {
        const u = ease.outCubic(ramp(t, tMany - 0.2 + i * 0.01, tMany + 0.4 + i * 0.01));
        const h = (hist[i] ? Math.max(4, Math.sqrt(hist[i] / top) * 280) : 0) * u;
        b.setAttribute('y', (Y0 - h).toFixed(1)); b.setAttribute('height', h.toFixed(1));
        b.setAttribute('fill', (i + 0.5) * MAXV / B > BUDGET && t > tSlow - 0.2 ? C.late : C.accent);
      });
      op(bud, ramp(t, tMany + 0.3, tMany + 0.8)); op(avg, ramp(t, tMany + 0.8, tMany + 1.2));
      appear(tail, t, tSlow); appear(tail2, t, tPun);
    };
  } });
}

/* --------------------------------------------------------- the thesis */
export function thesis(kit) {
  const { W } = kit;
  const t0 = kit.T.thesis, tTh = W('thesis', 'thesis'), tTests = W('thesis', 'tests'), tTime = W('thesis', 'timing'),
        tAI = W('thesis', 'ai'), tSame = W('thesis', 'same'), tEv = W('thesis', 'evidence', 1), tNot = W('thesis', 'averages');
  return figure(kit, { at: t0 - 0.2, out: kit.T.coda - 0.3, x: 900, y: 170, w: 900, h: 720, build(svg) {
    const lab = T(svg, 0, 22, "DR. OZGUR URAL'S THESIS", { size: 18, weight: 500, fill: C.accent, ls: '.16em', font: MONO });
    const head = E('g', {}, svg);
    T(head, 0, 120, 'EVIDENCE', { size: 16, weight: 500, fill: C.graphite, ls: '.16em', font: MONO });
    T(head, 380, 120, 'A simulator', { font: DISPLAY, size: 34, weight: 600 });
    T(head, 650, 120, 'AI in the loop', { font: DISPLAY, size: 34, weight: 600, fill: C.warm });
    E('line', { x1: 0, y1: 144, x2: 900, y2: 144, stroke: C.ink2, 'stroke-width': 1.6 }, head);
    const row = (y, a, b) => { const g = E('g', {}, svg); T(g, 0, y, a, { font: DISPLAY, size: 34, weight: 600 }); T(g, 0, y + 30, b, { size: 19, fill: C.graphite }); E('line', { x1: 0, y1: y + 62, x2: 900, y2: y + 62, stroke: C.rule, 'stroke-width': 1.4 }, g); return g; };
    const r1 = row(220, 'Fidelity', 'tested against the real aircraft'), r2 = row(350, 'Timing', 'proven every frame');
    const tick = (x, y) => S('path', { d: `M ${x} ${y} l 12 13 l 24 -30`, stroke: C.ok, 'stroke-width': 4 }, svg);
    const k1 = tick(440, 212), k2 = tick(440, 342);
    const q = [[690, 222], [690, 352]].map(([x, y]) => T(svg, x, y, '?', { font: DISPLAY, size: 44, weight: 700, fill: C.graphite }));
    const req = [[650, 186], [650, 316]].map(([x, y]) => { const g = E('g', {}, svg); E('rect', { x, y, width: 230, height: 54, rx: 10, fill: 'none', stroke: C.warm, 'stroke-width': 2.6 }, g); T(g, x + 115, y + 35, 'must be shown', { size: 20, anchor: 'middle', weight: 700, fill: C.warm }); return g; });
    const last = T(svg, 0, 520, 'Evidence, not averages.', { font: DISPLAY, size: 60, weight: 700 });
    const ul = S('line', { x1: 0, y1: 548, x2: 660, y2: 548, stroke: C.accent, 'stroke-width': 4 }, svg);
    return t => {
      appear(lab, t, tTh - 0.2); appear(head, t, tTh + 0.6);
      appear(r1, t, tTests - 0.3); draw(k1, ramp(t, tTests + 0.3, tTests + 0.8));
      appear(r2, t, tTime - 0.3); draw(k2, ramp(t, tTime + 0.3, tTime + 0.8));
      q.forEach((e, i) => op(e, ramp(t, tAI + i * 0.2, tAI + 0.3 + i * 0.2) * (1 - ramp(t, tSame - 0.2, tSame + 0.2))));
      req.forEach((g, i) => appear(g, t, tSame + i * 0.25, 0.4, 0));
      appear(last, t, tEv - 0.1); draw(ul, ramp(t, tNot, tNot + 0.6));
    };
  } });
}
