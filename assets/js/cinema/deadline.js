/*
 * AI meets the deadline: why a real-time controller should use an AI's latest
 * answer rather than wait for it, and stop trusting an answer that is too old.
 *
 * The argument is the lab film's (scripts/narration.json, prefix
 * "determinism") and DeadlineModel's, cut to the one idea a viewer who knows
 * nothing about it can follow: a controller on a fixed beat, an AI on a
 * variable clock; waiting for the AI misses beats; not waiting keeps every
 * beat but lets the answer in use go stale; so answers carry the time they
 * were made and expire into a safe action. The shared-chip and action-limit
 * points of earlier cuts are left to the lab page.
 *
 * The telling (2026-10-31). The owner asked for plain narration and a visual
 * feast at the Level D film's standard; an earlier cut read "simple" as flat
 * 2D and was rejected. So this is the 3D world again, large and with the
 * camera moving through every shot, but every motion is the sentence being
 * spoken. A robot arm must keep its gripper over a part sliding on a track.
 * It moves only on its controller's beats (tiles rushing in along a conveyor
 * to a gate, and a clock ring on the floor whose hand stops while the
 * controller waits) and only to where the AI's answer in use says the part is.
 * Answers are sparks from the model; a slow answer is a slow spark. Waiting
 * for one freezes the arm red while the part slides away; using the latest
 * answer keeps every beat but sends the gripper to a ghost of where the part
 * was; an answer that is too old is set aside and the arm stops, amber. No
 * name in the voice; the open research direction is said on the card. Every
 * beat and answer comes from a fixed, seeded schedule computed once.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, setLinePoints, lerp, ramp, ease, win, seeded } from './engine.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const T = { hook: 0, beat: 11.4, think: 22.4, wait: 33.4, split: 44.2, stale: 53.6, stamp: 64.6, rule: 75.8, open: 84.4, close: 96.4, card: 103.5 };
const D = 107.5;

const TL_DIR = new URL('../../audio/cinema/deadline/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`deadline: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
function makeWarp(anchors) {
  return real => {
    let i = 0;
    while (i < anchors.length - 2 && real > anchors[i + 1][0]) i++;
    const [r0, a0] = anchors[i], [r1, a1] = anchors[i + 1];
    if (real >= r1) return a1 + (real - r1);
    return a0 + (a1 - a0) * (real - r0) / (r1 - r0);
  };
}
// authored time a spoken word begins (lines barely stretch, so at + offset is close enough)
function W(id, word, fallback) {
  const l = TL && TL.lines.find(x => x.id === id);
  const w = l && l.words && l.words.find(x => x[0].toLowerCase().replace(/[^a-z']/g, '') === word);
  return T[id] + 0.35 + (w ? w[1] : fallback);
}

/* -------------------------------------------------------------- palette */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HDR = (r, g, b, k = 1) => new THREE.Color(r * k, g * k, b * k);
const COL = {
  model: HDR(0.55, 1.25, 2.3, 0.85),
  arm: HDR(1.0, 1.7, 2.6, 0.8),
  ok: HDR(0.4, 2.0, 1.5, 1.0),       // teal: acted on time, with a fresh answer
  late: HDR(2.6, 0.45, 0.5, 1.1),    // red: the beat was missed
  safe: HDR(2.5, 1.35, 0.35, 1.05),  // amber: on time, but the safe action
  plan: HDR(1.6, 2.4, 3.0, 1.0),
  part: HDR(2.4, 2.0, 1.0, 1.0),
  tile: HDR(0.45, 0.8, 1.4, 0.6),
  floor: HDR(0.35, 0.6, 1.0, 0.5),
  bg: new THREE.Color(0x03050a),
};

/* -------------------------------------------------------------- shaders */
const RIM = {
  vertexShader: /* glsl */`
    varying vec3 vN; varying vec3 vV;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uAlpha; uniform float uPow;
    varying vec3 vN; varying vec3 vV;
    void main() {
      float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), uPow);
      gl_FragColor = vec4(uColor * uAlpha * (0.05 + 0.95 * f), 1.0);
    }`,
};
const DUST = {
  vertexShader: /* glsl */`
    attribute float aSeed; uniform float uTime; uniform float uPR; varying float vA;
    void main() {
      vec3 p = position;
      p.y += sin(uTime * 0.21 + aSeed * 6.283) * 0.35;
      p.x += sin(uTime * 0.13 + aSeed * 11.0) * 0.5 + uTime * 0.04;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (0.9 + aSeed * 1.6) * uPR * (60.0 / -mv.z);
      vA = (0.35 + 0.65 * fract(aSeed * 7.1)) * (0.6 + 0.4 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uAlpha; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d) * vA * uAlpha;
      gl_FragColor = vec4(vec3(0.55, 0.75, 1.0) * a, 1.0);
    }`,
};
const SPARK = {
  vertexShader: /* glsl */`
    attribute float aA; attribute vec3 aC; attribute float aS; uniform float uPR; uniform float uSize;
    varying float vA; varying vec3 vC;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * aS * uPR * (40.0 / -mv.z) * (0.55 + 0.45 * aA);
      vA = aA; vC = aC;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    varying float vA; varying vec3 vC;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(vC * smoothstep(0.5, 0.05, d) * vA, 1.0);
    }`,
};
function mat(def, uniforms, extra = {}) {
  const u = {};
  for (const k in uniforms) u[k] = { value: uniforms[k] };
  return new THREE.ShaderMaterial({ vertexShader: def.vertexShader, fragmentShader: def.fragmentShader,
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...extra });
}
const lineMat = (color, opacity = 0) => new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity,
  blending: THREE.AdditiveBlending, depthWrite: false });
const glow = (color, opacity = 0) => new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
function fatLine(color, width, dash) {
  const m = new LineMaterial({ color: color.clone(), linewidth: width, transparent: true, opacity: 0, dashed: !!dash,
    dashSize: dash ? dash[0] : 1, gapSize: dash ? dash[1] : 1, blending: THREE.AdditiveBlending, depthWrite: false });
  m.resolution.set(1920, 1080);
  return new Line2(new LineGeometry(), m);
}
const circle = (c, r, y, n = 64) => {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * 2 * i / n; p.push(V(c.x + r * Math.cos(a), y, c.z + r * Math.sin(a))); }
  return p;
};

/* Sized for a phone: in the 9:16 feed cut the frame is 1080 wide. The speech
   is in the captions; the frame carries a short headline and labels. */
const CSS = `
  .cin .hd { font: 600 80px/1.06 "Space Grotesk", sans-serif; letter-spacing: -.014em; color: #f4f7fb; text-wrap: balance; }
  .cin em { font-style: normal; color: #6fd3ff; }
  .cin .teal { color: #5dffc8; } .cin .amber { color: #ffb347; } .cin .red { color: #ff6272; }
  .cin .scrim { position: absolute; }
  .cin .chip { font: 600 36px/1 "Space Grotesk", sans-serif; padding: 12px 18px; border-radius: 12px; white-space: nowrap;
               background: rgba(6,12,24,.8); border: 2px solid rgba(127,207,255,.45); color: #d8eeff; }
  .cin .chip.red { border-color: rgba(255,98,114,.8); color: #ff8a96; }
  .cin .chip.amber { border-color: rgba(255,179,71,.8); color: #ffc477; }
  .cin .chip.teal { border-color: rgba(93,255,200,.7); color: #8dffd9; }
  .cin .stamp { font: 700 52px/1 "Space Grotesk", sans-serif; letter-spacing: .08em; padding: 14px 22px; white-space: nowrap;
                border: 3px solid currentColor; border-radius: 14px; background: rgba(6,10,18,.75); }
  .cin .stamp.red { color: #ff6272; }
  .cin .rule { font: 600 72px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.012em; color: #f4f7fb; text-align: center; }
  .cin .open { font: 500 40px/1.35 "Inter", sans-serif; color: #dfe8f3; text-align: center; }
  .cin .credit { font: 500 22px/1.5 "JetBrains Mono", monospace; color: #9aa9be; }
  .cin .cl__a { font: 500 48px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 96px/1.08 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 34px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 1080px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ---------------------------------------------------------------- world
   Floor at y 0. The arm's base on the left inside its clock ring; the part
   slides on a track along x in front of it; the conveyor of beats runs behind
   to the horizon; the model above. */
const XA = -1.7, ZC = 0.45;
const SH = V(XA, 0.7, ZC);                  // the arm's shoulder
const L1 = 1.05, L2 = 0.92;
const HUB = V(XA, 0.16, ZC);                // the controller, in the arm's base
const RING = 0.95;
const XC = XA + 1.25, AMP = 0.62;           // the part's track
const PX = t => XC + AMP * Math.sin(0.7 * t + 0.3);
const PY = 0.16;
const ZB = ZC - 1.15, GATE = XA + 0.55, SPEED = 2.2;   // the conveyor of beats, and its gate
const O1 = V(0.55, 1.95, -0.7), O2 = V(2.7, 1.6, -1.65);
const MB = V(0.85, 1.15, -0.1);             // where answers are left once the controller stops waiting
const OFF = 0.17;                           // further than this from the part, the gripper has lost it

/* ------------------------------------------------------------ the schedule */
const B = 0.2;                          // one beat (drawn slower than a real controller, so each one can be seen)
const AGE = 0.6;                        // an answer older than this is too old to use
const M1 = W('beat', 'beat', 2.4);      // the beats begin to drive the arm
const M2 = W('wait', 'waits', 2.0);     // the controller waits for every answer
const M3 = W('split', 'never', 0.8);    // it never waits, and uses the latest answer
const M4 = W('stamp', 'too', 3.6);      // and stops trusting an answer that is too old
const AI_ON = W('think', 'pace', 1.2);
const FREEZE = [W('hook', 'but', 6.4) + 0.2, W('hook', 'but', 6.4) + 2.6];
const centreAfter = s => Math.ceil((0.7 * s + 0.3) / Math.PI) * Math.PI / 0.7 - 0.3 / 0.7;
const FORCED = [
  { f: M2 + 0.3, d: 1.3 }, { f: M2 + 3.8, d: 1.6 },
  { f: W('stale', 'gets', 4.0) - 0.35, d: 3.2 },
  { f: centreAfter(M4 + 0.1) - 0.5, d: 1.7 },
  { f: T.open + 3.0, d: 1.2 },
];
const rnd = seeded(2031);
function duration(e, pSlow) {
  for (const F of FORCED) if (!F.used && e >= F.f && e < F.f + 0.25) { F.used = true; return F.d; }
  return rnd() < pSlow ? 0.8 + rnd() * 0.6 : 0.07 + rnd() * 0.1;
}
const REQ = [];
for (let e = AI_ON; e < M2 - 0.3;) { const d = duration(e, 0.12); REQ.push({ e, a: e + d, kind: 'show' }); e += d + 0.02; }
for (let e = M3; e < D;) { const d = duration(e, e > T.open ? 0.16 : 0); REQ.push({ e, a: e + d, kind: 'async' }); e += d + 0.02; }
const NK = Math.ceil(D / B) + 2;
const TICK = [];
{
  let hand = PX(0), pending = null, missed = 0;
  for (let k = 0; k < NK; k++) {
    const tk = k * B;
    let out = -1, tgt = PX(tk), plan = null;
    if (tk < M1) { tgt = PX(tk); }
    else if (tk < M2) { out = 0; tgt = PX(tk); }
    else if (tk < M3) {
      if (pending && pending.a > tk) { out = 1; tgt = hand; plan = pending; }
      else if (pending) { out = 0; tgt = PX(pending.e); plan = pending; pending = null; }
      else {
        const d = duration(tk, 0), r = { e: tk, a: tk + d, kind: 'block' };
        REQ.push(r); plan = r;
        if (d < B * 0.9) { out = 0; tgt = PX(tk); } else { out = 1; tgt = hand; pending = r; }
      }
    } else {
      for (const r of REQ) if (r.kind === 'async' && r.a <= tk && (!plan || r.a > plan.a)) plan = r;
      if (!plan) { out = 0; tgt = hand; }
      else if (tk >= M4 && tk - plan.e > AGE) { out = 2; tgt = hand; }
      else { out = 0; tgt = PX(plan.e); }
    }
    if (out === 1) missed++;
    TICK.push({ t: tk, out, tgt, plan, from: hand, missed });
    hand = tgt;
  }
  // how many beats in a row had been missed at each beat, and when that run ended, for the red pile at the gate
  let run = 0;
  for (const tk of TICK) { run = tk.out === 1 ? run + 1 : 0; tk.run = run; }
  TICK[NK - 1].runEnd = 1e9;
  for (let k = NK - 2; k >= 0; k--) TICK[k].runEnd = TICK[k].out === 1 ? (TICK[k + 1].out === 1 ? TICK[k + 1].runEnd : TICK[k + 1].t) : 0;
}
const tickAt = t => TICK[Math.max(0, Math.min(NK - 1, Math.floor(t / B)))];
function gripX(t) {
  if (t < M1) {
    if (t > FREEZE[0] && t < FREEZE[1] + 0.5) return lerp(PX(FREEZE[0] - 0.06), PX(t - 0.06), ease.inOutSine(ramp(t, FREEZE[1], FREEZE[1] + 0.5)));
    return PX(t - 0.06);
  }
  const tk = tickAt(t);
  return lerp(PX(t - 0.06), lerp(tk.from, tk.tgt, ease.outCubic(ramp(t, tk.t, tk.t + 0.1))), ramp(t, M1, M1 + 0.4));
}
// clock time the controller has actually kept: the ring's hand stops on a missed beat
const kept = t => t - tickAt(t).missed * B;
const HIST = (() => {
  const r = seeded(77), order = [];
  for (let i = 0; i < 40; i++) { const slow = r() < 0.18, d = slow ? 0.8 + r() * 0.6 : 0.07 + r() * 0.1; order.push(Math.min(8, Math.floor(d / 0.18))); }
  return order;
})();
const modelAt = t => O1.clone().lerp(O2, ease.inOutCubic(ramp(t, T.split + 0.6, T.split + 3.6)));
const bigAt = t => ease.inOutCubic(ramp(t, T.open + 0.6, T.open + 3.0));

/* camera: every shot moves from its first pose to its last; the cut between
   shots is a 2 s ease from wherever the last shot had reached */
const SHOTS = [
  [T.hook - 3, V(0.8, 1.5, 5.2), V(-0.55, 0.75, 0.0), V(-0.25, 1.1, 3.7), V(-0.75, 0.55, 0.3)],
  [T.beat, V(3.2, 0.55, 1.0), V(-1.3, 0.35, -0.5), V(0.5, 0.95, 2.6), V(-1.3, 0.45, -0.1)],
  [T.think, V(2.9, 1.8, 3.4), V(1.2, 1.1, -1.2), V(-0.1, 2.1, 3.6), V(1.1, 1.1, -1.2)],
  [T.wait, V(0.9, 1.6, 4.3), V(-0.9, 0.55, -0.1), V(-0.3, 1.1, 2.9), V(-0.95, 0.45, 0.1)],
  [T.split, V(0.0, 1.9, 4.4), V(0.1, 1.0, -0.3), V(1.7, 2.6, 6.4), V(0.6, 0.9, -0.6)],
  [T.stale, V(-0.1, 1.15, 3.1), V(-0.75, 0.4, 0.3), V(-1.9, 1.2, 3.0), V(-0.6, 0.4, 0.3)],
  [T.stamp, V(2.7, 1.8, 4.1), V(0.0, 0.85, -0.1), V(1.0, 2.0, 3.9), V(-0.3, 0.8, 0.0)],
  [T.rule, V(4.2, 2.4, 5.8), V(0.0, 0.75, -0.4), V(-3.6, 2.6, 5.8), V(0.0, 0.75, -0.4)],
  [T.open, V(0.8, 2.9, 7.2), V(0.6, 1.25, -0.6), V(1.3, 4.6, 8.6), V(0.8, 1.1, -0.7)],
  [T.close, V(0.6, 3.4, 8.8), V(0.5, 0.65, -0.5), V(0.9, 3.9, 11.0), V(0.6, 0.6, -0.5)],
];
function shotPose(i, t) {
  const [t0, pA, lA, pB, lB] = SHOTS[i];
  const t1 = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : D;
  const u = ease.inOutSine(ramp(t, t0, t1));
  return { pos: pA.clone().lerp(pB, u), look: lA.clone().lerp(lB, u) };
}
function cameraAt(t) {
  let i = 0;
  while (i < SHOTS.length - 1 && t >= SHOTS[i + 1][0]) i++;
  const cur = shotPose(i, t);
  if (i === 0) return cur;
  const prev = shotPose(i - 1, t), u = ease.inOutCubic(ramp(t, SHOTS[i][0], SHOTS[i][0] + 2.0));
  return { pos: prev.pos.lerp(cur.pos, u), look: prev.look.lerp(cur.look, u) };
}

/* ----------------------------------------------------------------- film */
const film = {
  title: 'AI meets the deadline',
  aspect: '16x9',
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  // the closing line is already on screen in large type
  captions: TL ? captionsFromTimeline(TL, 42, ['close']) : null,
  build(ctx) {
    const { scene, camera, text, label } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    camera.fov = 36;
    camera.updateProjectionMatrix();
    ctx.setViewShift(0.08, -0.06);
    scene.background = COL.bg;
    const add = o => { scene.add(o); return o; };

    /* dust and a floor grid, for depth */
    const dr = seeded(11);
    const DN = 900, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (dr() - 0.5) * 40; dp[i * 3 + 1] = dr() * 14 - 2; dp[i * 3 + 2] = -16 + dr() * 20;
      ds[i] = dr();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = add(new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.6 })));
    const grid = add(new THREE.GridHelper(40, 80, COL.floor, COL.floor));
    grid.material.transparent = true; grid.material.opacity = 0; grid.material.blending = THREE.AdditiveBlending; grid.material.depthWrite = false;

    /* the conveyor of beats: rails to the horizon, a gate where each beat is due, and a pool of tiles */
    const railA = add(fatLine(COL.tile, 2.4)), railB = add(fatLine(COL.tile, 2.4));
    setLinePoints(railA, [V(GATE - 0.3, 0.01, ZB - 0.27), V(GATE + 16, 0.01, ZB - 0.27)]);
    setLinePoints(railB, [V(GATE - 0.3, 0.01, ZB + 0.27), V(GATE + 16, 0.01, ZB + 0.27)]);
    const gate = add(fatLine(COL.arm, 4.0));
    setLinePoints(gate, [V(GATE, 0, ZB - 0.4), V(GATE, 0.7, ZB - 0.4), V(GATE, 0.7, ZB + 0.4), V(GATE, 0, ZB + 0.4)]);
    const NT = 46, tileGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.07, 0.42)), faceGeo = new THREE.PlaneGeometry(0.3, 0.42);
    const tiles = [];
    for (let i = 0; i < NT; i++) {
      const g = new THREE.Group();
      const edge = new THREE.LineSegments(tileGeo, lineMat(COL.tile));
      const face = new THREE.Mesh(faceGeo, glow(COL.tile)); face.rotation.x = -Math.PI / 2; face.position.y = 0.036;
      g.add(edge, face); add(g); tiles.push({ g, edge, face });
    }

    /* the clock ring around the controller: ticks, a hand, and a pulse each beat it acts */
    const ring = add(fatLine(COL.arm, 3.0));
    setLinePoints(ring, circle(HUB, RING, 0.015, 96));
    const tickPts = [];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      tickPts.push(V(HUB.x + (RING - 0.14) * Math.cos(a), 0.015, HUB.z + (RING - 0.14) * Math.sin(a)),
                   V(HUB.x + RING * Math.cos(a), 0.015, HUB.z + RING * Math.sin(a)));
    }
    const ticks = add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tickPts), lineMat(COL.arm)));
    const hand = add(fatLine(COL.ok, 5.0));
    const pulses = [add(fatLine(COL.ok, 3.0)), add(fatLine(COL.ok, 3.0))];

    /* the arm */
    const base = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.34, 0.44, 0.26, 6)), lineMat(COL.arm)));
    base.position.set(XA, 0.13, ZC);
    const col = add(fatLine(COL.arm, 6.0)), link1 = add(fatLine(COL.arm, 7.0)), link2 = add(fatLine(COL.arm, 6.0));
    const fingA = add(fatLine(COL.arm, 4.5)), fingB = add(fatLine(COL.arm, 4.5));
    const joint = r => add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), mat(RIM, { uColor: COL.arm.clone(), uAlpha: 0, uPow: 1.3 })));
    const jS = joint(0.13), jE = joint(0.11), jW = joint(0.085);
    const hub = joint(0.16); hub.position.copy(HUB);

    /* the part, its track, the ghost of where an answer saw it, and the gap when the gripper loses it */
    const track = add(fatLine(COL.floor, 3.0));
    setLinePoints(track, [V(XC - AMP - 0.35, 0.02, ZC), V(XC + AMP + 0.35, 0.02, ZC)]);
    const part = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), mat(RIM, { uColor: COL.part.clone(), uAlpha: 0, uPow: 1.1 })));
    const ghost = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.15, 1)), lineMat(COL.safe)));
    const gap = add(fatLine(COL.late, 4.0));
    const beam = add(fatLine(COL.arm, 2.0, [0.05, 0.05]));

    /* the model */
    const model = new THREE.Group();
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)), lineMat(COL.model, 0));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: COL.model.clone(), uAlpha: 0, uPow: 1.6 }));
    model.add(shell, core); add(model);
    const pedestal = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.5, 0.6, 1.0, 6)), lineMat(COL.floor)));
    pedestal.position.set(O2.x, 0.5, O2.z);

    /* the think scene: answer times rising as columns behind the model */
    const bars = [];
    for (let k = 0; k < 9; k++) {
      const g = new THREE.Group();
      const c = k >= 4 ? COL.safe : COL.plan;
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.28, 1, 0.28)), lineMat(c));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 1), glow(c));
      g.add(edge, face); g.position.set(-0.05 + k * 0.38, 0, -1.95); add(g); bars.push({ g, edge, face });
    }
    const axis = add(fatLine(COL.floor, 2.0));
    setLinePoints(axis, [V(-0.3, 0.005, -1.75), V(3.2, 0.005, -1.75)]);

    /* the waiting path, cut when the controller stops waiting */
    const tether = add(fatLine(HDR(1.4, 1.8, 2.4), 3.4));
    const cutA = add(fatLine(HDR(1.4, 1.8, 2.4), 3.4)), cutB = add(fatLine(HDR(1.4, 1.8, 2.4), 3.4));

    /* the mailbox, the age ring of its latest answer, and its feed to the controller */
    const box = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.42, 0.42, 0.42)), lineMat(COL.plan)));
    box.position.copy(MB);
    const ageRing = add(fatLine(COL.ok, 5.0));
    const feed = add(fatLine(HDR(1.2, 1.6, 2.2), 2.4, [0.1, 0.08]));
    setLinePoints(feed, [MB, V(MB.x - 1.0, 0.8, 0.2), HUB.clone().add(V(0, 0.2, 0))]);

    /* sparks: each answer flies from the model while it is being worked out */
    const SN = REQ.length + 8;
    const spos = new Float32Array(SN * 3), sa = new Float32Array(SN), sc = new Float32Array(SN * 3), ss = new Float32Array(SN).fill(1);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1));
    sg.setAttribute('aC', new THREE.BufferAttribute(sc, 3));
    sg.setAttribute('aS', new THREE.BufferAttribute(ss, 1));
    const sparks = add(new THREE.Points(sg, mat(SPARK, { uPR: 1, uSize: 12 })));
    sparks.frustumCulled = false;

    Object.assign(ctx, { dust, grid, railA, railB, gate, tiles, ring, ticks, hand, pulses, base, col, link1, link2, fingA, fingB, jS, jE, jW, hub,
                         track, part, ghost, gap, beam, model, shell, core, pedestal, bars, axis, tether, cutA, cutB, box, ageRing, feed,
                         sparks, spos, sa, sc, ss, SN });

    /* ------------------------------------------------------------- type */
    const HD = { x: 110, y: 90, w: 980 };
    const say = (at, out, hd) => text({ at, out, cls: 'blk', place: HD, html: `<div class="hd">${hd}</div>` });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;
    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1500, h: 520 },
          'radial-gradient(ellipse 1150px 440px at 0% 0%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.55) 55%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 58% 52% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');

    say(-3, T.beat - gone, 'Right answer. <span class="red">Too late.</span>');
    say(T.beat, T.think - gone, 'A machine runs on a <em>beat</em>.');
    say(T.think, T.wait - gone, 'AI keeps its <em>own pace</em>.');
    say(T.wait, T.split - gone, 'Waiting <span class="red">freezes</span> the arm.');
    say(T.split, T.stale - gone, '<em>Never wait.</em>');
    say(T.stale, T.stamp - gone, 'On time, but <span class="amber">out of date</span>.');
    say(T.stamp, T.rule - gone, 'Too old? Do something <span class="amber">safe</span>.');
    text({ at: W('rule', 'advises', 2.3) - 0.2, out: T.open - 0.1, cls: 'rule', place: { x: 160, y: 80, w: 1600 },
           html: '<span style="color:#6fd3ff">The AI advises.</span> <span class="teal">The controller keeps the clock.</span>' });
    text({ at: W('open', 'open', 4.0) - 0.2, out: T.close - 0.3, cls: 'open', words: false, dur: 0.7, place: { x: 260, y: 90, w: 1400 },
           html: 'Open problem: large models, with proof that the timing holds.' });
    text({ at: T.open + 0.8, out: T.close - 0.3, cls: 'credit', words: false, dur: 0.6, place: { x: 110, y: 1036, w: 1300 },
           html: 'The guard pattern: L. Sha, &ldquo;Using Simplicity to Control Complexity,&rdquo; IEEE Software, 2001.' });
    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 360, w: 1400, align: 'center' },
           html: 'AI will keep getting smarter.' });
    text({ at: W('close', 'the', 2.2) - 0.1, out: T.card - 0.3, cls: 'cl__b', place: { x: 200, y: 450, w: 1520, align: 'center' },
           html: 'The beat will never <em>wait</em> for it.' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">AI meets the deadline</div>
                  <div class="end__s">Use the AI&rsquo;s latest answer, never wait for it, and stop trusting an answer that is too old.</div>
                  <div class="end__a">An open research direction &middot; not yet published &middot; schematic timing, not measured</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* --------------------------------------------------------- labels */
    const at = v => () => v;
    label({ cls: 'chip', html: 'AI', anchor: () => modelAt(0).clone().add(V(0, 0.8, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, 0.6, T.think + 4, 0.6, 0.6) });
    label({ cls: 'chip', html: 'the part', anchor: t => V(PX(t), PY - 0.25, ZC + 0.2), ax: 0.5, ay: 0,
            alpha: t => win(t, 1.0, 6.0, 0.5, 0.5) });
    label({ cls: 'stamp red', html: 'TOO LATE', anchor: () => V(PX(FREEZE[0] + 1.4), 0.75, ZC), ax: 0.5, ay: 1,
            alpha: t => win(t, FREEZE[0] + 0.9, FREEZE[1] + 0.3, 0.25, 0.4) });
    label({ cls: 'chip', html: 'controller', anchor: at(V(XA, -0.05, ZC + RING + 0.1)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.beat + 1.5, T.think, 0.6, 0.6) });
    label({ cls: 'chip teal', html: 'one beat, due now', anchor: at(V(GATE, 0.85, ZB)), ax: 0.5, ay: 1,
            alpha: t => win(t, M1 + 0.8, T.think - 0.3, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'a slow answer', anchor: at(V(2.25, 0.85, -1.95)), ax: 0.5, ay: 1,
            alpha: t => win(t, AI_ON + 4.0, T.wait - 0.2, 0.6, 0.5) });
    label({ cls: 'stamp red', html: 'WAITING', anchor: at(V(GATE + 0.3, 1.75, ZB)), ax: 0.5, ay: 1,
            alpha: t => (tickAt(t).out === 1 && t > M2 && t < M3 ? 1 : 0) * win(t, T.wait, T.split, 0.2, 0.3) });
    label({ cls: 'chip red', html: '', anchor: at(V(GATE + 0.3, 1.0, ZB)), ax: 0.5, ay: 1,
            alpha: t => (tickAt(t).missed > 0 ? 1 : 0) * win(t, M2 + 0.5, M3, 0.4, 0.4),
            update: (t, el) => { const s = `missed beats: ${tickAt(t).missed}`; if (el.textContent !== s) el.textContent = s; } });
    label({ cls: 'chip', html: 'latest answer', anchor: at(V(MB.x, MB.y - 0.36, MB.z)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.split + 4.0, T.stale + 1, 0.6, 0.6) });
    label({ cls: 'chip amber', html: 'where the part was', anchor: t => { const p = tickAt(t).plan; return p ? V(PX(p.e), 0.55, ZC) : null; }, ax: 0.5, ay: 1,
            alpha: t => { const p = tickAt(t).plan; return (p && t > M3 ? Math.min(1, Math.abs(PX(p.e) - PX(t)) / 0.35) : 0) * win(t, W('stale', 'describes', 6.0) - 0.8, T.rule - 0.3, 0.4, 0.5); } });
    label({ cls: 'chip amber', html: 'too old: stop', anchor: at(V(MB.x, MB.y - 0.62, MB.z)), ax: 0.5, ay: 0,
            alpha: t => (tickAt(t).out === 2 ? 1 : 0) * win(t, M4, T.rule, 0.2, 0.4) });
    label({ cls: 'chip', html: 'larger models', anchor: t => modelAt(t).clone().add(V(0.75 + 0.45 * bigAt(t), 0.35 * bigAt(t), 0)), ax: 0, ay: 0.5, dx: 12,
            alpha: t => win(t, T.open + 1.0, T.close - 0.3, 0.6, 0.5) });
  },

  frame(t, ctx) {
    const { camera, grade } = ctx;
    const pr = ctx.renderer.getPixelRatio();

    const cam = cameraAt(t);
    camera.position.copy(cam.pos).add(V(0.04 * Math.sin(t * 0.17), 0.03 * Math.sin(t * 0.13), 0));
    camera.lookAt(cam.look);

    const show = win(t, -1, T.card + 0.4, 0.8, 0.8) * (1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0)));
    ctx.grid.material.opacity = 0.16 * show;
    const tk = tickAt(t);
    const driving = t >= M1;
    const stalled = driving && tk.out === 1;
    const safeNow = driving && tk.out === 2;

    /* the conveyor: the tile for beat k reaches the gate when beat k is due */
    const convIn = win(t, M1 - 1.5, 1e9, 1.0, 0.1) * show;
    ctx.railA.material.opacity = 0.55 * convIn; ctx.railB.material.opacity = 0.55 * convIn;
    ctx.gate.material.opacity = 0.9 * convIn;
    ctx.gate.material.color.copy(stalled ? COL.late : COL.arm);
    const kNow = Math.floor(t / B);
    for (let i = 0; i < ctx.tiles.length; i++) {
      const { g, edge, face } = ctx.tiles[i];
      const k = kNow - 12 + i;
      let x = 0, y = 0.04, a = 0, c = COL.tile, s = 1;
      if (k >= 0 && k < NK) {
        const b = TICK[k];
        x = GATE + (b.t - t) * SPEED;
        if (b.t > t) { a = 0.9 * (1 - ramp(x, GATE + 9, GATE + 13)); }
        else if (b.out === 1) {
          const end = b.runEnd;
          if (t < end) { x = GATE + 0.02; y = 0.04 + (b.run - 1) * 0.085; a = 1; }
          else { const u = t - end; x = GATE - u * 1.2; y = 0.04 + (b.run - 1) * 0.085 - 1.5 * u * u; a = Math.max(0, 1 - u / 0.6); }
          c = COL.late;
        } else if (b.out >= 0) {
          const since = t - b.t;
          x = GATE - since * 1.6; y = 0.04 + 0.2 * Math.min(1, since / 0.3); s = 1 - 0.5 * Math.min(1, since / 0.3);
          a = Math.max(0, 1 - since / 0.35); c = b.out === 2 ? COL.safe : COL.ok;
        }
      }
      g.position.set(x, y, ZB); g.scale.setScalar(s);
      edge.material.color.copy(c); face.material.color.copy(c);
      edge.material.opacity = a * convIn; face.material.opacity = 0.4 * a * convIn;
    }

    /* the clock ring */
    const ringIn = win(t, M1 - 1.0, 1e9, 0.8, 0.1) * show;
    const ringCol = stalled ? COL.late : COL.arm;
    ctx.ring.material.opacity = 0.8 * ringIn; ctx.ring.material.color.copy(ringCol);
    ctx.ticks.material.opacity = 0.8 * ringIn; ctx.ticks.material.color.copy(ringCol);
    const ha = -kept(t) * (Math.PI * 2) / 6;
    setLinePoints(ctx.hand, [V(HUB.x, 0.02, HUB.z), V(HUB.x + (RING - 0.06) * Math.cos(ha), 0.02, HUB.z + (RING - 0.06) * Math.sin(ha))]);
    ctx.hand.material.opacity = ringIn; ctx.hand.material.color.copy(stalled ? COL.late : COL.ok);
    for (let j = 0; j < 2; j++) {
      const b = TICK[Math.max(0, Math.min(NK - 1, kNow - j))], u = (t - b.t) / (2 * B);
      setLinePoints(ctx.pulses[j], circle(HUB, RING + 0.05 + 0.8 * u, 0.02, 72));
      ctx.pulses[j].material.color.copy(b.out === 2 ? COL.safe : COL.ok);
      ctx.pulses[j].material.opacity = driving && b.out !== 1 && b.out >= 0 ? 0.7 * (1 - u) * ringIn : 0;
    }

    /* the part, and the gripper over it */
    const px = PX(t), gx = gripX(t);
    ctx.part.position.set(px, PY, ZC); ctx.part.rotation.set(t * 0.7, t * 0.9, 0);
    const lost = Math.abs(gx - px) > OFF;
    ctx.part.material.uniforms.uColor.value.copy(COL.part).lerp(safeNow ? COL.safe : COL.late, lost ? 0.6 : 0);
    ctx.part.material.uniforms.uAlpha.value = 1.0 * show;
    ctx.track.material.opacity = 0.6 * show;
    const fired = driving ? Math.exp(-(t - tk.t) / 0.09) : 0;
    const target = V(gx, 0.5 - 0.08 * fired, ZC);
    const d = Math.min(L1 + L2 - 0.02, Math.max(0.3, target.distanceTo(SH)));
    const aT = Math.atan2(target.y - SH.y, target.x - SH.x);
    const cB = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const E = V(SH.x + L1 * Math.cos(aT + cB), SH.y + L1 * Math.sin(aT + cB), ZC);
    const Wr = V(SH.x + d * Math.cos(aT), SH.y + d * Math.sin(aT), ZC);
    // the gripper hangs straight down over where it believes the part is
    const close = lost ? 0 : 0.05;
    const tipL = Wr.clone().add(V(-0.12 + close, -0.2, 0)), tipR = Wr.clone().add(V(0.12 - close, -0.2, 0));
    setLinePoints(ctx.col, [V(XA, 0.26, ZC), SH]);
    setLinePoints(ctx.link1, [SH, E]);
    setLinePoints(ctx.link2, [E, Wr]);
    setLinePoints(ctx.fingA, [Wr, tipL]);
    setLinePoints(ctx.fingB, [Wr, tipR]);
    const armCol = stalled ? COL.late : safeNow ? COL.safe : COL.arm;
    for (const l of [ctx.col, ctx.link1, ctx.link2, ctx.fingA, ctx.fingB]) { l.material.opacity = 0.95 * show; l.material.color.copy(armCol); }
    ctx.base.material.opacity = 0.75 * show;
    ctx.jS.position.copy(SH); ctx.jE.position.copy(E); ctx.jW.position.copy(Wr);
    for (const j of [ctx.jS, ctx.jE, ctx.jW]) { j.material.uniforms.uAlpha.value = (0.85 + 0.6 * fired) * show; j.material.uniforms.uColor.value.copy(armCol); }
    ctx.hub.material.uniforms.uColor.value.copy(stalled ? COL.late : HDR(1.2, 2.0, 2.8));
    ctx.hub.material.uniforms.uAlpha.value = (stalled ? 1.3 + 0.3 * Math.sin(t * 9) : 0.75 + 0.6 * fired) * show;
    // a dashed line down from the gripper, and the gap to the part when it has lost it
    setLinePoints(ctx.beam, [Wr.clone().add(V(0, -0.22, 0)), V(gx, 0.03, ZC)]);
    ctx.beam.material.opacity = 0.5 * show;
    setLinePoints(ctx.gap, [V(gx, 0.04, ZC), V(px, 0.04, ZC)]);
    ctx.gap.material.color.copy(safeNow ? COL.safe : COL.late);
    ctx.gap.material.opacity = (lost ? Math.min(1, (Math.abs(gx - px) - OFF) / 0.1) : 0) * show;
    // the ghost of where the part was when the answer in use was made
    const plan = tk.plan;
    const ghostA = (t > M3 && plan ? Math.min(1, Math.abs(PX(plan.e) - px) / 0.25) : 0) * win(t, W('stale', 'describes', 6.0) - 1.2, T.rule - 0.3, 0.5, 0.5) * show;
    if (plan) { ctx.ghost.position.set(PX(plan.e), PY, ZC); ctx.ghost.rotation.set(plan.e * 0.7, plan.e * 0.9, 0); }
    ctx.ghost.material.opacity = 0.95 * ghostA;

    /* the model: above the arm, then flown to its own pedestal; larger at the open question */
    const mp = modelAt(t);
    let busy = 0;
    for (const r of REQ) if (r.e <= t && r.a >= t - 0.2) busy = Math.max(busy, win(t, r.e, r.a, 0.1, 0.2));
    const flying = Math.sin(Math.PI * ramp(t, T.split + 0.6, T.split + 3.6));
    const big = bigAt(t);
    ctx.model.position.copy(mp).add(V(0, 0.45 * flying + 0.35 * big, 0));
    ctx.model.rotation.set(0.35 + 0.05 * Math.sin(t * 0.3), t * 0.22 + 2.5 * flying, 0.08);
    ctx.model.scale.setScalar(0.72 * (1 + 0.6 * big));
    ctx.shell.material.opacity = (0.55 + 0.35 * busy) * show;
    ctx.core.material.uniforms.uAlpha.value = (0.7 + 0.6 * busy) * show;
    ctx.pedestal.material.opacity = 0.6 * win(t, T.split + 2.4, 1e9, 0.9, 0.1) * show;

    /* the histogram of answer times */
    const nIn = Math.floor(ramp(t, AI_ON + 0.5, AI_ON + 6.5) * HIST.length);
    const counts = new Array(9).fill(0);
    for (let i = 0; i < nIn; i++) counts[HIST[i]]++;
    const hIn = win(t, AI_ON - 0.3, T.wait + 0.6, 0.6, 0.8) * show;
    for (let k = 0; k < 9; k++) {
      const h = counts[k] ? Math.max(0.14, counts[k] * 0.06) : 0.001;
      const { g, edge, face } = ctx.bars[k];
      g.scale.set(1, h, 1); g.position.y = h / 2;
      edge.material.opacity = 0.95 * hIn; face.material.opacity = 0.32 * hIn;
    }
    ctx.axis.material.opacity = 0.7 * hIn;

    /* the waiting path: taut while the controller waits on the model, cut when it stops waiting */
    const tA = mp.clone().add(V(0, -0.5, 0)), tM = V(mp.x - 1.2, 1.4, 0.1), tB = HUB.clone().add(V(0, 0.16, 0));
    setLinePoints(ctx.tether, [tA, tM, tB]);
    ctx.tether.material.opacity = 0.8 * win(t, M2 - 0.8, T.split + 0.6, 0.6, 0.05) * show;
    ctx.tether.material.color.copy(stalled && t < M3 ? COL.late : HDR(1.4, 1.8, 2.4));
    const cut = ramp(t, T.split + 0.6, T.split + 2.0), cutIn = (t > T.split + 0.6 ? 1 - cut : 0) * show;
    const midA = tA.clone().lerp(tM, 0.5), midB = tM.clone().lerp(tB, 0.5);
    setLinePoints(ctx.cutA, [tA, midA.clone().add(V(0.1 * cut, -0.9 * cut * cut, 0))]);
    setLinePoints(ctx.cutB, [tB, midB.clone().add(V(-0.1 * cut, -0.6 * cut * cut, 0))]);
    ctx.cutA.material.opacity = 0.8 * cutIn; ctx.cutB.material.opacity = 0.8 * cutIn;

    /* the mailbox, the age of the answer in use, the feed */
    const asyncOn = win(t, T.split + 2.2, 1e9, 0.8, 0.1) * show;
    let latest = null;
    for (const r of REQ) if (r.kind === 'async' && r.a <= t && (!latest || r.a > latest.a)) latest = r;
    const age = latest ? t - latest.e : 99;
    const fresh = Math.max(0, 1 - age / AGE);
    const land = latest ? Math.exp(-(t - latest.a) / 0.15) : 0;
    ctx.box.rotation.set(0.5 + t * 0.15, 0.6 + t * 0.25, 0);
    ctx.box.scale.setScalar(1 + 0.2 * land);
    ctx.box.material.color.copy(t > M4 && fresh <= 0 ? COL.safe : COL.plan);
    ctx.box.material.opacity = 0.95 * asyncOn;
    ctx.feed.material.opacity = (0.35 + 0.4 * fired) * asyncOn;
    ctx.feed.material.color.copy(safeNow ? COL.safe : HDR(1.2, 1.6, 2.2));
    const ageIn = win(t, W('stamp', 'time', 2.0) - 0.5, 1e9, 0.6, 0.1) * show;
    const rp = [], R0 = 0.5, n = Math.max(2, Math.round(64 * fresh));
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 - (i / 64) * Math.PI * 2; rp.push(V(MB.x + R0 * Math.cos(a), MB.y + R0 * Math.sin(a), MB.z + 0.25)); }
    setLinePoints(ctx.ageRing, rp);
    ctx.ageRing.material.color.copy(COL.ok).lerp(COL.safe, 1 - fresh);
    ctx.ageRing.material.opacity = (fresh > 0 ? 0.95 : 0) * ageIn;

    /* sparks: each answer flies from the model while it is being worked out; a slow answer is a slow spark */
    const { spos, sa, sc, ss } = ctx;
    sa.fill(0);
    const put = (j, p, a, c, s = 1) => { spos[j * 3] = p.x; spos[j * 3 + 1] = p.y; spos[j * 3 + 2] = p.z; sa[j] = a * show; sc[j * 3] = c.r; sc[j * 3 + 1] = c.g; sc[j * 3 + 2] = c.b; ss[j] = s; };
    const hubTo = HUB.clone().add(V(0, 0.22, 0));
    for (let j = 0; j < REQ.length; j++) {
      const r = REQ[j];
      if (t < r.e || t > r.a + 0.35) continue;
      const from = modelAt(r.e).clone().add(V(0, 0.35 * bigAt(r.e), 0));
      const to = r.kind === 'async' ? MB : hubTo;
      const slow = r.a - r.e > 0.5;
      if (t <= r.a) {
        const u = ease.inOutSine(ramp(t, r.e, r.a));
        const p = from.clone().lerp(to, u); p.y += 0.45 * Math.sin(Math.PI * u);
        put(j, p, Math.min(1, ramp(t, r.e, r.e + 0.06)), slow ? COL.safe : COL.plan, slow ? 1.8 : 1);
      } else put(j, to, 1 - ramp(t, r.a, r.a + 0.35), COL.plan, 1.4);
    }
    // the hook: answers that keep the arm with the part, then one that arrives after it has gone
    {
      const j = REQ.length, u = ease.inOutSine(ramp(t, FREEZE[0] - 0.2, FREEZE[1]));
      const p = modelAt(0).clone().lerp(hubTo, u); p.y += 0.5 * Math.sin(Math.PI * u);
      put(j, p, win(t, FREEZE[0] - 0.2, FREEZE[1] + 0.3, 0.2, 0.3), COL.safe, 1.8);
      for (let q = 0; q < 6; q++) {
        const e0 = 1.2 + q * 0.75;
        if (e0 > FREEZE[0] - 0.4) break;
        const v = ramp(t, e0, e0 + 0.35), pp = modelAt(0).clone().lerp(hubTo, ease.inOutSine(v)); pp.y += 0.4 * Math.sin(Math.PI * v);
        put(REQ.length + 1 + q, pp, win(t, e0, e0 + 0.5, 0.05, 0.15), COL.plan, 1.2);
      }
    }
    ctx.sparks.geometry.attributes.position.needsUpdate = true;
    ctx.sparks.geometry.attributes.aA.needsUpdate = true;
    ctx.sparks.geometry.attributes.aC.needsUpdate = true;
    ctx.sparks.geometry.attributes.aS.needsUpdate = true;
    ctx.sparks.material.uniforms.uPR.value = pr;

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    ctx.dust.material.uniforms.uTime.value = t;
    ctx.dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
