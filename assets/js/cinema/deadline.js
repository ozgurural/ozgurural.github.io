/*
 * AI meets the deadline, 2026-10-31: a late braking answer, the controller's
 * clock, three inference chambers, an asynchronous handoff, two different
 * worlds, an observation-age gate, a braking replay, and the shared chip.
 * These are schematic illustrations, not a simulated plant or measurements.
 * Claim ledger and review notes: scripts/cinema/deadline-review.md.
 * Every pose and decision is a pure function of authored film time.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, setLinePoints, lerp, ramp, ease } from './engine.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const T = { hook: 0, rule: 7.3, beat: 13.2, think: 24, split: 34.2, stale: 44.5, stamp: 55, fallback: 63.8, open: 73.7, close: 85, card: 91 };
const D = 98;
const DIR = new URL('../../audio/cinema/deadline/', import.meta.url);
const TL = await fetch(new URL('timeline.json', DIR)).then(r => r.ok ? r.json() : null).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) throw new Error(`deadline: voice cue mismatch: ${l.id}`);
function warp(real) {
  if (!TL) return real;
  let i = 0;
  while (i < TL.anchors.length - 2 && real > TL.anchors[i + 1][0]) i++;
  const [r0, a0] = TL.anchors[i], [r1, a1] = TL.anchors[i + 1];
  return real >= r1 ? a1 + real - r1 : lerp(a0, a1, (real - r0) / (r1 - r0));
}
// Invert the real/authored warp so the visual event lands on the spoken word.
function authored(real) {
  if (!TL) return real;
  for (let i = 1; i < TL.anchors.length; i++) {
    const [r1, a1] = TL.anchors[i], [r0, a0] = TL.anchors[i - 1];
    if (real <= r1) return lerp(a0, a1, (real - r0) / (r1 - r0));
  }
  return D;
}
function W(id, word, fallback = 1) {
  const l = TL?.lines.find(x => x.id === id);
  const w = l?.words.find(x => x[0].toLowerCase().replace(/[^a-z]/g, '') === word);
  return w ? authored(l.real + w[1]) : T[id] + fallback;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = { bg: 0x03050a, ice: 0x88d7ff, teal: 0x5dffc8, red: 0xff6272, amber: 0xffb347, violet: 0xc79bff, white: 0xe8eef7, floor: 0x142c46 };
const color = n => new THREE.Color(n);
const glow = (n, opacity = 1, energy = 1) => new THREE.MeshBasicMaterial({ color: color(n).multiplyScalar(energy), transparent: true, opacity, depthWrite: false });
const solid = (n, metalness = 0.55, roughness = 0.3) => new THREE.MeshStandardMaterial({ color: n, metalness, roughness });
const GEO = new Map();
function cached(key, build) { if (!GEO.has(key)) GEO.set(key, build()); return GEO.get(key); }
function line(parent, pts, n = C.ice, width = 2.5, opacity = 1) {
  const m = new LineMaterial({ color: n, linewidth: width, transparent: true, opacity, depthWrite: false });
  m.resolution.set(1920, 1080);
  const o = new Line2(new LineGeometry(), m); o.frustumCulled = false;
  setLinePoints(o, pts); parent.add(o); return o;
}
function boxGeo(w, h, d, r = 0.08) {
  const key = `box:${w}:${h}:${d}:${r}`;
  if (GEO.has(key)) return GEO.get(key);
  r = Math.min(r, w / 4, h / 4, d / 4);
  const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r;
  s.moveTo(x, -h / 2); s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, y);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(x, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, y); s.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: r * 0.6, bevelThickness: r });
  g.translate(0, 0, -d / 2 + r); GEO.set(key, g); return g;
}
function mesh(parent, g, m, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); parent.add(o); return o;
}
function box(parent, w, h, d, n, x = 0, y = 0, z = 0, material) {
  return mesh(parent, boxGeo(w, h, d), material || solid(n), x, y, z);
}
function wire(parent, w, h, d, n, x = 0, y = 0, z = 0, opacity = 0.65) {
  const o = new THREE.LineSegments(cached(`edges:${w}:${h}:${d}`, () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))), new THREE.LineBasicMaterial({ color: n, transparent: true, opacity }));
  o.position.set(x, y, z); parent.add(o); return o;
}
function circle(parent, radius, n, x = 0, y = 0, z = 0, tube = 0.018) {
  return mesh(parent, cached(`torus:${radius}:${tube}`, () => new THREE.TorusGeometry(radius, tube, 8, 96)), glow(n), x, y, z);
}
function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g;
}
function floor(parent, size = 24) {
  const ground = mesh(parent, new THREE.PlaneGeometry(size, size), solid(0x08111e, 0.65, 0.38));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06;
  const grid = new THREE.GridHelper(size, size / 1.5, 0x22415b, 0x102235);
  grid.material.transparent = true; grid.material.opacity = 0.4; parent.add(grid);
}
function robot(parent, x = 0, z = 0, scale = 1) {
  const g = group(parent, x, 0, z); g.scale.setScalar(scale);
  box(g, 1.85, 0.48, 1.35, 0x293c53, 0, 0.48, 0);
  box(g, 1.34, 0.72, 1.1, 0xc4d2dc, -0.05, 1.03, 0);
  box(g, 0.1, 0.28, 0.82, C.bg, 0.65, 1.09, 0);
  const eyes = [];
  for (const z0 of [-0.23, 0.23]) eyes.push(mesh(g, cached('eye', () => new THREE.SphereGeometry(0.06, 16, 8)), glow(C.ice, 1, 2), 0.73, 1.12, z0));
  const wheels = [];
  for (const x0 of [-0.58, 0.58]) for (const z0 of [-0.7, 0.7]) {
    const wg = group(g, x0, 0.3, z0);
    const tyre = mesh(wg, cached('tyre', () => new THREE.CylinderGeometry(0.29, 0.29, 0.17, 32)), solid(0x0b111a, 0.15, 0.7)); tyre.rotation.x = Math.PI / 2;
    const hub = mesh(wg, cached('hub', () => new THREE.CylinderGeometry(0.15, 0.15, 0.185, 24)), solid(0x65859c)); hub.rotation.x = Math.PI / 2;
    const mark = box(wg, 0.045, 0.25, 0.195, C.ice, 0, 0.08, 0, glow(C.ice, 0.8)); wheels.push(wg);
  }
  const bumper = box(g, 0.09, 0.13, 1.25, C.ice, 1.0, 0.49, 0, glow(C.ice, 1, 1.3));
  const lid = mesh(g, cached('lid', () => new THREE.CylinderGeometry(0.21, 0.24, 0.1, 32)), solid(0x15283a), 0, 1.46, 0);
  circle(g, 0.18, C.ice, 0, 1.52, 0).rotation.x = -Math.PI / 2;
  return { g, wheels, bumper, eyes, lid };
}
function carton(parent, x, z, scale = 1, ghost = false) {
  const g = group(parent, x, 0, z); g.scale.setScalar(scale);
  box(g, 1.25, 1.25, 1.25, 0xa26c33, 0, 0.64, 0, ghost ? glow(C.amber, 0.12) : solid(0x9f6e3b, 0.08, 0.7));
  wire(g, 1.26, 1.26, 1.26, C.amber, 0, 0.64, 0, ghost ? 0.4 : 0.6);
  box(g, 0.16, 0.012, 1.27, 0xdbbc82, 0, 1.28, 0, ghost ? glow(C.amber, 0.25) : solid(0xdbbc82, 0.05, 0.9));
  return g;
}
function bay(parent, { miniature = false, ghost = false } = {}) {
  const root = group(parent); floor(root, miniature ? 12 : 24);
  const bot = robot(root, -3.8, 0);
  const obstacle = carton(root, 3.4, 0, 1, ghost);
  for (const z of [-1.1, 1.1]) line(root, [V(-7, 0.015, z), V(7, 0.015, z)], C.ice, 2.2, 0.4);
  const stop = box(root, 0.09, 0.018, 2.25, C.red, 0.5, 0.02, 0, glow(C.red, 0.8, 1.5));
  // A few static warehouse ribs give scale, never a stream of passing objects.
  if (!miniature) for (const x of [-7, -3, 1, 5, 9]) {
    line(root, [V(x, 0, -4), V(x, 4.8, -4), V(x, 4.8, -7)], C.ice, 1.5, 0.13);
    box(root, 1.3, 0.035, 0.035, C.ice, x, 4.4, -4, glow(C.ice, 0.6));
  }
  const wake = line(root, [V(-4, 0.025, 0), V(-4, 0.025, 0)], C.ice, 4, 0.4);
  return { root, bot, obstacle, stop, wake };
}
function moveRobot(b, x, n) {
  b.g.position.x = x;
  for (const w of b.wheels) w.rotation.z = -x / 0.29;
  b.bumper.material.color.set(n);
  for (const e of b.eyes) e.material.color.set(n);
}
function brain(parent, x = 0, y = 2, z = 0, radius = 1.1) {
  const g = group(parent, x, y, z);
  const shell = new THREE.LineSegments(cached(`brain-shell:${radius}`, () => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(radius, 1))), new THREE.LineBasicMaterial({ color: C.ice, transparent: true, opacity: 0.55 }));
  g.add(shell);
  const core = mesh(g, cached(`brain-core:${radius}`, () => new THREE.IcosahedronGeometry(radius * 0.56, 1)), solid(0x324e75, 0.7, 0.16));
  const ring = circle(g, radius * 0.84, C.ice); ring.rotation.x = 1.0;
  const ring2 = circle(g, radius * 0.7, C.violet, 0, 0, 0, 0.012); ring2.rotation.y = 1.2;
  return { g, shell, core, ring, ring2 };
}
function animateBrain(b, t, slow = false) {
  b.shell.rotation.set(0.18, t * 0.10, 0.1);
  b.core.rotation.set(t * 0.08, -t * 0.12, 0.2);
  b.ring.rotation.z = t * 0.13;
  b.shell.material.color.set(slow ? C.amber : C.ice);
}
function clock(parent, x = 0, z = 0, radius = 1.8) {
  const g = group(parent, x, 0, z);
  mesh(g, new THREE.CylinderGeometry(radius, radius * 1.07, 0.32, 64), solid(0x162b41), 0, 0.18, 0);
  const ring = circle(g, radius * 0.92, C.ice, 0, 0.36, 0); ring.rotation.x = -Math.PI / 2;
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const tick = box(g, 0.045, 0.035, i % 3 ? 0.13 : 0.22, C.ice, Math.sin(a) * radius * 0.79, 0.37, Math.cos(a) * radius * 0.79, glow(C.ice, 0.65)); tick.rotation.y = a;
    if (i % 2 === 0) dots.push(mesh(g, cached('clock-dot', () => new THREE.SphereGeometry(0.075, 16, 8)), glow(C.teal, 0.8), Math.sin(a) * radius * 0.6, 0.42, Math.cos(a) * radius * 0.6));
  }
  const hand = line(g, [V(0, 0.43, 0), V(0, 0.43, radius * 0.72)], C.white, 5);
  mesh(g, cached('clock-hub', () => new THREE.SphereGeometry(0.13, 20, 10)), glow(C.white), 0, 0.43, 0);
  return { g, radius, hand, dots, ring };
}
function runClock(c, phase, misses = false) {
  const a = phase * Math.PI * 2 / 6;
  setLinePoints(c.hand, [V(0, 0.43, 0), V(Math.sin(a) * c.radius * 0.72, 0.43, Math.cos(a) * c.radius * 0.72)]);
  const k = Math.floor(phase) % 6;
  c.dots.forEach((d, i) => { d.material.color.set(misses && i >= 3 ? C.red : C.teal); d.material.opacity = i === k ? 1 : 0.3; d.scale.setScalar(i === k ? 1.35 : 1); });
}
function chip(parent, x = 0, z = 0, size = 3) {
  const g = group(parent, x, 0, z);
  box(g, size, 0.24, size, 0x173249, 0, 0.2, 0);
  wire(g, size * 0.94, 0.25, size * 0.94, C.ice, 0, 0.2, 0, 0.45);
  for (let i = 0; i < 7; i++) for (const s of [-1, 1]) {
    box(g, 0.06, 0.05, 0.3, 0x64809b, (i - 3) * size / 9, 0.12, s * (size / 2 + 0.12));
    box(g, 0.3, 0.05, 0.06, 0x64809b, s * (size / 2 + 0.12), 0.12, (i - 3) * size / 9);
  }
  return g;
}

const CSS = `
 .cin .dl-head {font:600 82px/1.05 "Space Grotesk",sans-serif;letter-spacing:-.025em;color:#f4f7fb;text-wrap:balance}
 .cin .dl-head em,.cin .dl-rule em {color:#88d7ff;font-style:normal}
 .cin .dl-red {color:#ff6272} .cin .dl-amber {color:#ffb347} .cin .dl-teal {color:#5dffc8}
 .cin .dl-rule {font:600 86px/1.09 "Space Grotesk",sans-serif;letter-spacing:-.02em;color:#f4f7fb}
 .cin .dl-tag {font:600 62px/1.15 "Space Grotesk",sans-serif;color:#dbefff;padding:13px 22px;border-radius:10px;background:rgba(3,9,18,.9);border:1px solid #355470;white-space:nowrap}
 .cin .dl-tag.dl-red {color:#ff8291;border-color:#c75264}
 .cin .dl-tag.dl-amber {color:#ffc477;border-color:#b88137}
 .cin .dl-tag.dl-teal {color:#8dffda;border-color:#439c82}
 .cin .dl-small {font:500 30px/1.4 "Inter",sans-serif;color:#aebcd0}
 .cin .dl-note {font:500 36px/1.25 "Inter",sans-serif;color:#d1ddeb}
 .cin .dl-credit {font:500 23px/1.4 "JetBrains Mono",monospace;color:#a6b5c9}
 .cin .dl-end-title {font:600 92px/1.05 "Space Grotesk",sans-serif;color:#f4f7fb;letter-spacing:-.025em}
 .cin .dl-end-note {font:500 46px/1.35 "Inter",sans-serif;color:#adc1d8;margin:25px auto 0;max-width:1580px}
 .cin .end__u {font:600 56px/1.2 "Space Grotesk",sans-serif;color:#f4f7fb;margin-top:38px}
 .cin .end__u span {display:block;font:400 30px/1.4 "Inter",sans-serif;color:#9bb0c9;margin-top:9px}
`;

const SHOTS = [
  // Each is its own set and composition. Slow dollies replace the old stream.
  [0, T.beat, [4.5, 3.6, 9.0], [0, 0.7, 0], [3.5, 3.0, 8.6], [0.2, 0.7, 0]],
  [T.beat, T.think, [5.1, 6.5, 8.1], [0, 0.1, 0], [3.3, 7.8, 7.1], [0, 0.2, 0]],
  [T.think, T.split, [0.5, 4.4, 12.8], [0, 1.6, 0], [-0.5, 3.7, 11.6], [0, 1.7, 0]],
  [T.split, T.stale, [5.0, 6.2, 11.5], [0, 1.2, 0], [3.2, 5.0, 10.4], [0, 1.1, 0]],
  [T.stale, T.stamp, [0.3, 6.7, 12.9], [0, 0.7, 0], [-0.4, 5.4, 12.1], [0, 0.7, 0]],
  [T.stamp, T.fallback, [1.0, 3.8, 11.4], [0, 1.65, 0], [-0.3, 3.2, 10.4], [0, 1.65, 0]],
  [T.fallback, T.open, [3.8, 3.4, 9.1], [0, 0.65, 0], [2.8, 3.0, 8.5], [0, 0.65, 0]],
  [T.open, T.close, [5.5, 7.6, 10.0], [0, 1.0, 0], [3.5, 7.2, 11.5], [0, 1.0, 0]],
  [T.close, D, [4.7, 4.0, 11.3], [0, 0.8, 0], [5.4, 4.4, 12.8], [0, 0.7, 0]],
];
const film = {
  title: 'AI meets the deadline', aspect: '16x9', duration: TL ? TL.duration : D,
  warp, audio: TL ? new URL(TL.audio, DIR).href : null,
  captions: TL ? captionsFromTimeline(TL, 42, ['rule', 'close']) : null,
  build(ctx) {
    const { scene, camera, text } = ctx;
    const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    camera.fov = 38; camera.updateProjectionMatrix();
    ctx.setViewShift(0, 0);
    scene.background = color(C.bg); scene.fog = new THREE.FogExp2(C.bg, 0.029);
    scene.add(new THREE.HemisphereLight(0xc1dcff, 0x142335, 2.4));
    const key = new THREE.DirectionalLight(0xd5edff, 4.5); key.position.set(-4, 8, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0x548fff, 3); rim.position.set(4, 5, -4); scene.add(rim);
    const warm = new THREE.PointLight(0xffb56b, 35, 20); warm.position.set(3, 4, 2); scene.add(warm);
    ctx.bloom.strength = 0.48; ctx.bloom.radius = 0.35;
    const roots = SHOTS.map(() => group(scene));
    const opening = bay(roots[0]);
    const control = clock(roots[1], 0, 0, 2.35); floor(roots[1]);
    const ctrlChip = chip(roots[1], 0, 0, 1.45); ctrlChip.position.y = 0.45;
    const command = box(roots[1], 1.0, 0.1, 0.7, C.teal, 0, 0.9, 0, glow(C.teal, 0.65));
    const capsules = [];
    floor(roots[2]);
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 3.3, root = group(roots[2], x, 0, 0);
      mesh(root, new THREE.CylinderGeometry(1.03, 1.1, 0.25, 48), solid(0x1a3149), 0, 0.15, 0);
      mesh(root, new THREE.CylinderGeometry(0.97, 0.97, 3.2, 48, 1, true), glow(C.ice, 0.035), 0, 1.88, 0);
      for (const y of [0.4, 3.46]) circle(root, 0.98, C.ice, 0, y, 0).rotation.x = -Math.PI / 2;
      const b = brain(root, 0, 2.65, 0, 0.68);
      const rail = line(root, [V(0, 0.55, 0), V(0, 2.15, 0)], C.ice, 7, 0.25);
      const progress = line(root, [V(0, 0.55, 0), V(0, 0.55, 0)], C.teal, 9);
      const answer = box(root, 1.15, 0.18, 0.75, C.teal, 0, 0.6, 0, glow(C.teal, 0.7));
      capsules.push({ root, b, rail, progress, answer });
    }
    floor(roots[3]);
    const asyncClock = clock(roots[3], -2.7, 0, 1.6);
    const asyncBrain = brain(roots[3], 2.8, 2.6, 0, 1.12);
    chip(roots[3], 2.8, 0, 2.2);
    const shelf = box(roots[3], 1.4, 0.16, 1.05, 0x234158, 0.1, 1.15, 0);
    const latest = box(roots[3], 1.08, 0.2, 0.75, C.ice, 0.1, 1.43, 0, glow(C.ice, 0.65));
    const handoff = line(roots[3], [V(2.8, 2.4, 0), V(0.1, 1.44, 0), V(-2.7, 0.8, 0)], C.ice, 3, 0.3);
    const courier = box(roots[3], 0.32, 0.16, 0.22, C.ice, 0, 0, 0, glow(C.ice, 1, 1.4));
    // Two literal worlds: the frozen observation and the changed live world.
    const oldWorld = group(roots[4], -3.2, 0, 0), liveWorld = group(roots[4], 3.2, 0, 0);
    const world = p => {
      box(p, 5.3, 0.18, 4.4, 0x12283b, 0, 0, 0);
      wire(p, 5.3, 0.18, 4.4, C.ice, 0, 0, 0);
      for (const z of [-0.75, 0.75]) line(p, [V(-2.5, 0.13, z), V(2.5, 0.13, z)], C.ice, 3, 0.5);
      const b = robot(p, -1.35, 0, 0.7), c = carton(p, 1.2, -1.4, 0.78);
      return { b, c };
    };
    const snapshot = world(oldWorld), current = world(liveWorld);
    wire(oldWorld, 5.45, 2.9, 4.55, C.amber, 0, 1.35, 0, 0.32);
    const staleRoute = line(oldWorld, [V(-0.25, 0.18, 0), V(2.4, 0.18, 0)], C.teal, 6, 0.8);
    const liveRoute = line(liveWorld, [V(-0.25, 0.18, 0), V(2.4, 0.18, 0)], C.teal, 6, 0.8);
    // The expiry dial begins at observation, not at answer completion.
    floor(roots[5]);
    const ageRoot = group(roots[5], -2.3, 1.8, 0.25);
    circle(ageRoot, 1.55, C.ice, 0, 0, 0, 0.016).material.opacity = 0.25;
    const arcPts = Array.from({ length: 97 }, () => V(0, 0, 0));
    const arc = line(ageRoot, arcPts, C.teal, 11);
    const ageHand = line(ageRoot, [V(0, 0, 0), V(0, 1.2, 0)], C.white, 4);
    const eye = mesh(ageRoot, new THREE.SphereGeometry(0.28, 32, 16), solid(0x30536e, 0.6, 0.18));
    const token = group(roots[5], 2.25, 0.1, 0);
    const tokenWorld = world(token); token.scale.setScalar(0.78); token.rotation.y = -0.16;
    const tokenBorder = wire(token, 5.45, 2.3, 4.55, C.teal, 0, 1.05, 0, 0.7);
    const rejected = line(roots[5], [V(1.3, 1.3, 1.9), V(3.2, 2.7, 1.9)], C.amber, 7, 0);
    const replay = bay(roots[6]); replay.stop.material.color.set(C.teal);
    // Shared hardware, then a candidate boundary to test, never a proof stamp.
    floor(roots[7]);
    const substrate = chip(roots[7], 0, 0, 6.2);
    const loadGroup = group(roots[7], 1.55, 0.32, 0);
    const loadBrain = brain(loadGroup, 0, 2.3, 0, 1.05);
    const towers = [];
    for (let i = 0; i < 6; i++) towers.push(box(loadGroup, 0.52, 1, 0.52, C.amber, (i % 3 - 1) * 0.68, 0.5, (Math.floor(i / 3) - 0.5) * 1.3, glow(C.amber, 0.16)));
    const clockIsland = clock(roots[7], -1.8, 0, 1.15); clockIsland.g.position.y = 0.34;
    const isolate = chip(roots[7], -1.8, 0, 2.75); isolate.position.y = 0.35;
    const boundary = wire(roots[7], 2.9, 0.5, 3.0, C.teal, -1.8, 0.55, 0, 0);
    const finale = bay(roots[8]); moveRobot(finale.bot, -1.2, C.teal);
    const finalBrain = brain(roots[8], 2.2, 3.0, -2.0, 1.0);
    Object.assign(ctx, { roots, opening, control, command, capsules, asyncClock, asyncBrain, latest, courier, snapshot, current,
      staleRoute, liveRoute, arcPts, arc, ageHand, eye, token, tokenBorder, tokenWorld, rejected, replay, substrate, loadGroup,
      loadBrain, towers, clockIsland, isolate, boundary, finale, finalBrain });

    // Typography is composed in screen space, deliberately large for 1080-wide feeds.
    const panel = (at, out, cls, html, x, y, w, more = {}) => text({ at, out, cls, html, words: false,
      dur: 0.35, outDur: 0.15, rise: 0, place: { x, y, w }, ...more });
    panel(-1, T.card, 'scrim', '', 0, 0, 1920, { style: { height: '335px', background: 'linear-gradient(#03050af5,#03050ab0 58%,transparent)' } });
    const head = (at, out, html, w = 1600) => panel(at, out, 'dl-head', html, 100, 72, w);
    head(-1, T.rule, 'Right answer.<br><span class="dl-red">Too late.</span>');
    panel(T.rule, T.beat, 'dl-rule', '<em>Let AI think.</em><br>Keep the machine on time.', 100, 72, 1700);
    head(T.beat, T.think, 'The next command<br><em>cannot wait.</em>');
    head(T.think, T.split, 'Same model.<br><em>Different waiting times.</em>');
    head(T.split, T.stale, 'AI works beside the clock.<br><em>The clock never waits.</em>');
    head(T.stale, T.stamp, 'On time.<br><span class="dl-amber">Out of date.</span>');
    head(T.stamp, T.fallback, 'An answer has an age.<br><em>Count from the observation.</em>');
    head(T.fallback, T.open, 'Too old? <span class="dl-amber">Use the backup.</span>');
    head(T.open, W('open', 'prove', 6), 'Two processes.<br><span class="dl-amber">Still one chip.</span>');
    head(W('open', 'prove', 6), T.close, 'Can the clock hold<br><em>under load?</em>');
    panel(T.close, T.card, 'dl-rule', '<em>Let AI think.</em><br>Keep the machine on time.', 100, 72, 1700);
    panel(0.6, T.rule, 'dl-small', 'Dr. Ozgur Ural  /  Trustworthy AI', 104, 276, 1100);
    // Persistent authorship stays outside the caption zone and the physical action.
    panel(T.rule, T.card, 'dl-credit', 'Dr. Ozgur Ural &middot; Trustworthy AI for Mission-Critical Systems', 670, 1032, 1180,
      { style: { textAlign: 'right' } });
    panel(-1, T.close, 'dl-small', 'Schematic illustration', 100, 1030, 520);
    const tag = (at, out, html, x, y, w = 600, cls = '') => panel(at, out, 'dl-tag ' + cls, html, x, y, w,
      { style: { width: 'max-content', maxWidth: w + 'px' } });
    tag(0.3, W('hook', 'late', 5.5), 'AI: thinking', 1320, 330);
    tag(W('hook', 'late', 5.5), T.rule, 'STOP: too late', 1290, 330, 540, 'dl-red');
    tag(0.3, T.rule, 'STOPPING LINE', 910, 808, 650, 'dl-red');
    tag(T.beat + 0.5, W('beat', 'waiting', 5), 'controller', 1320, 420);
    tag(W('beat', 'waiting', 5), T.think, 'AI still thinking', 1300, 420, 560, 'dl-amber');
    tag(W('beat', 'miss', 8), T.think, 'COMMAND MISSED', 1150, 790, 650, 'dl-red');
    for (let i = 0; i < 3; i++) tag(T.think + 0.4, T.split, ['answer one', 'answer two', 'answer three'][i], 360 + i * 490, 796, 450, i === 2 ? 'dl-amber' : 'dl-teal');
    tag(T.split + 0.4, T.stale, 'controller', 300, 786);
    tag(T.split + 0.4, T.stale, 'AI', 1455, 710);
    tag(W('split', 'latest', 4), T.stale, 'latest finished', 770, 730);
    tag(T.stale + 0.3, T.stamp, 'AI saw this', 240, 320, 700, 'dl-amber');
    tag(T.stale + 0.3, T.stamp, 'World now', 1230, 320, 600);
    tag(W('stale', 'clear', 6.7), T.stamp, 'PATH CLEAR', 290, 795, 650, 'dl-teal');
    tag(W('stale', 'move', 3), T.stamp, 'PATH BLOCKED', 1210, 795, 650, 'dl-amber');
    tag(T.stamp + 0.3, T.fallback, 'observation age', 280, 780, 650);
    tag(T.stamp + 0.3, T.fallback, 'OBSERVED', 1240, 350, 500);
    const finished = W('stamp', 'old', 5.9) - 0.6;
    tag(finished, T.fallback, 'EXPIRED ON ARRIVAL', 1135, 795, 730, 'dl-amber');
    tag(T.fallback + 0.3, W('fallback', 'brake', 3.3), 'AI answer expired', 1210, 360, 650, 'dl-amber');
    tag(W('fallback', 'brake', 3.3), T.open, 'BACKUP: BRAKE', 1260, 360, 600, 'dl-amber');
    panel(W('fallback', 'checked', 6), T.open, 'dl-note', 'Backup needs validation for the actual machine.', 100, 801, 1600);
    tag(T.open + 0.3, W('open', 'prove', 6), 'shared resources', 1250, 790, 650, 'dl-amber');
    tag(W('open', 'prove', 6), T.close, 'isolation to test', 1230, 790, 650, 'dl-teal');
    panel(T.card, 1e9, 'scrim', '', 0, 0, 1920, { style: { height: '1080px', background: 'rgba(3,5,10,.88)' } });
    panel(T.card, 1e9, 'dl-end', `<div class="dl-end-title">AI meets the deadline</div>
      <div class="dl-end-note">Open research direction of the author, not yet published.<br>Schematic timing and braking, not measured or validated safety.</div>
      <div class="end__u">${AUTHOR}</div>`, 160, 225, 1600, { style: { textAlign: 'center' }, dur: 0.7 });
  },
  frame(t, ctx) {
    let idx = 0;
    while (idx < SHOTS.length - 1 && t >= SHOTS[idx][1]) idx++;
    ctx.roots.forEach((r, i) => { r.visible = i === idx; });
    const [a, b, p0, l0, p1, l1] = SHOTS[idx], u = ease.inOutSine(ramp(t, a, b));
    ctx.camera.position.set(lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), lerp(p0[2], p1[2], u));
    ctx.camera.lookAt(lerp(l0[0], l1[0], u), lerp(l0[1], l1[1], u), lerp(l0[2], l1[2], u));
    // Explicitly reset every animated property, including on backward seeks.
    const lateAt = W('hook', 'late', 5.5);
    const x = lerp(-3.8, 1.45, ease.inOutSine(ramp(t, -1.1, lateAt + 0.7)));
    moveRobot(ctx.opening.bot, x, t >= lateAt ? C.red : C.ice);
    setLinePoints(ctx.opening.wake, [V(-4.5, 0.025, 0), V(x - 1, 0.025, 0)]);
    ctx.opening.wake.material.color.set(t >= lateAt ? C.red : C.ice);
    const waitAt = W('beat', 'waiting', 5), missAt = W('beat', 'miss', 8);
    const beatPhase = (t - T.beat) / 1.5;
    runClock(ctx.control, Math.max(0, beatPhase), t >= missAt);
    const waiting = t >= waitAt;
    ctx.command.material.color.set(waiting ? C.red : C.teal);
    ctx.command.material.opacity = waiting ? 0.08 : 0.3 + 0.5 * Math.exp(-Math.max(0, beatPhase % 1) * 5);
    ctx.command.position.y = 0.9 + 0.25 * ease.inOutSine(ramp(t, T.beat, waitAt));
    const starts = [W('think', 'two', 1.5), W('think', 'two', 1.5), W('think', 'one', 3.7)];
    const ends = [starts[0] + 1.4, starts[1] + 1.7, T.split - 0.9];
    ctx.capsules.forEach((c, i) => {
      const p = ramp(t, starts[i], ends[i]);
      animateBrain(c.b, t, i === 2 && p < 1);
      setLinePoints(c.progress, [V(0, 2.15, 0), V(0, lerp(2.15, 0.65, p), 0)]);
      c.progress.material.color.set(i === 2 && p < 1 ? C.amber : C.teal);
      c.answer.visible = p >= 1; c.answer.position.y = 0.6 + 0.15 * (1 - ramp(t, ends[i], ends[i] + 0.6));
    });
    const asyncPhase = Math.max(0, (t - T.split) / 1.5);
    runClock(ctx.asyncClock, asyncPhase);
    animateBrain(ctx.asyncBrain, t);
    // Three deliberate handoffs, including a long quiet interval without a result.
    const arrivals = [T.split + 2.0, T.split + 4.5, T.split + 8.6];
    let arrival = arrivals[0];
    for (const q of arrivals) if (t >= q - 1.0) arrival = q;
    const travel = ramp(t, arrival - 1, arrival), pulse = Math.exp(-Math.max(0, t - arrival) * 4);
    ctx.courier.visible = t >= arrival - 1 && t <= arrival;
    ctx.courier.position.set(lerp(2.8, 0.1, travel), lerp(2.4, 1.44, travel), 0);
    ctx.latest.scale.setScalar(1 + 0.08 * pulse); ctx.latest.visible = t >= arrivals[0];
    const boxMove = ease.inOutSine(ramp(t, W('stale', 'box', 2.3), W('stale', 'move', 3.0) + 1.4));
    ctx.current.c.position.z = lerp(-1.4, 0, boxMove);
    ctx.liveRoute.material.color.set(boxMove > 0.65 ? C.amber : C.teal);
    ctx.snapshot.c.position.z = -1.4; ctx.current.b.g.position.x = -1.35;
    const observed = T.stamp + 0.1, expires = W('stamp', 'old', 5.9) - 0.7;
    const freshness = 1 - ramp(t, observed, expires);
    for (let i = 0; i < 97; i++) {
      const q = Math.min(i / 96, freshness), ang = Math.PI / 2 - q * Math.PI * 2;
      ctx.arcPts[i].set(1.55 * Math.cos(ang), 1.55 * Math.sin(ang), 0);
    }
    setLinePoints(ctx.arc, ctx.arcPts); ctx.arc.material.color.set(freshness < 0.25 ? C.amber : C.teal);
    ctx.arc.material.opacity = freshness > 0 ? 1 : 0.08;
    const theta = Math.PI / 2 - (1 - freshness) * Math.PI * 2;
    setLinePoints(ctx.ageHand, [V(0, 0, 0), V(1.2 * Math.cos(theta), 1.2 * Math.sin(theta), 0)]);
    const expired = t >= expires;
    ctx.tokenBorder.material.color.set(expired ? C.amber : C.teal);
    ctx.token.position.x = 2.25 + 0.8 * ease.inOutSine(ramp(t, expires, expires + 1.2));
    ctx.token.position.y = 0.1 - 0.15 * ease.inOutSine(ramp(t, expires, expires + 1.2));
    ctx.rejected.material.opacity = ramp(t, expires, expires + 0.25);
    const brakeAt = W('fallback', 'brake', 3.3);
    const drive = ramp(t, T.fallback - 0.5, brakeAt), brake = ramp(t, brakeAt, brakeAt + 1.25);
    // Continuous position and velocity at braking, then a gentle stop before the line.
    const brakingDistance = (2.1 / (brakeAt - (T.fallback - 0.5))) * 1.25 / 2;
    const replayX = t <= brakeAt ? lerp(-3.8, -1.7, drive) : -1.7 + brakingDistance * (2 * brake - brake * brake);
    moveRobot(ctx.replay.bot, replayX, t >= brakeAt ? C.amber : C.ice);
    setLinePoints(ctx.replay.wake, [V(-4.5, 0.025, 0), V(replayX - 1, 0.025, 0)]);
    ctx.replay.wake.material.color.set(t >= brakeAt ? C.amber : C.ice);
    animateBrain(ctx.loadBrain, t, true);
    const isolation = ease.inOutSine(ramp(t, W('open', 'prove', 6), T.close - 1.0));
    ctx.isolate.position.x = lerp(-1.8, -3.2, isolation);
    ctx.clockIsland.g.position.x = ctx.isolate.position.x;
    ctx.loadGroup.position.x = lerp(1.55, 2.1, isolation);
    ctx.substrate.scale.x = 1 - 0.25 * isolation;
    ctx.substrate.position.x = 1.25 * isolation;
    ctx.boundary.position.x = ctx.isolate.position.x;
    ctx.boundary.material.opacity = isolation * 0.8;
    runClock(ctx.clockIsland, Math.max(0, (t - T.open) / 1.5), isolation < 0.2);
    ctx.towers.forEach((o, i) => { const h = 0.55 + 0.6 * (0.5 + 0.5 * Math.sin((t - T.open) * 0.7 + i)); o.scale.y = h; o.position.y = h / 2; });
    animateBrain(ctx.finalBrain, t);
    ctx.grade.uniforms.uFade.value = t >= T.card ? 0.35 : 1;
  },
};
createCinema(film);
