/*
 * AI meets the deadline: why an AI planner belongs beside a real-time
 * controller, not in its waiting path, in about two minutes.
 *
 * The argument is the lab film's (scripts/narration.json, prefix
 * "determinism") and DeadlineModel's: a controller on a fixed beat, inference
 * on a variable clock; blocking inference misses beats and the delay spills
 * into the work behind it; a separate worker the controller never waits for
 * keeps every beat; the new failure is the stale plan, so plans carry the
 * moment they were made and expire into a safe default; freshness is one
 * check and a simple guard owns the action limits (the Simplex pattern, Sha
 * 2001, cited on screen); shared hardware can still cost the asynchronous
 * loop its beats. The open question the film ends on is doing this for large
 * models and proving the timing, which is the author's research direction.
 *
 * This is the author's open research direction, not a published paper, and
 * the frame says so once near the start and on the card. Every beat, plan and
 * stall is drawn from a fixed, seeded schedule, not measured.
 *
 * The telling (2026-10-31, final cut): one thesis said near the start and
 * closed in the same words ("Let the AI advise. Never let it hold the
 * clock."), one headline a scene with the speech in the captions, and a world
 * drawn large enough to read in a phone's feed: a robot arm at the end of a
 * conveyor of beats, a clock ring on the floor around the controller whose
 * hand stops whenever the controller waits, the series' model body, and for
 * each scene its own set piece. The camera moves through every shot.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, setLinePoints, lerp, ramp, ease, win, seeded } from './engine.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const T = { hook: 0, thesis: 7.8, beat: 17.4, think: 28.4, wait: 39.4, split: 49.4, stale: 60.6, contract: 67.8,
            limits: 76.9, share: 86.3, open: 98.4, close: 109.6, card: 118.5 };
const D = 124;

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
  ok: HDR(0.4, 2.0, 1.5, 1.0),       // teal: acted on time, with a fresh plan
  late: HDR(2.6, 0.45, 0.5, 1.1),    // red: the deadline passed
  safe: HDR(2.5, 1.35, 0.35, 1.05),  // amber: on time, but the safe default
  plan: HDR(1.6, 2.4, 3.0, 1.0),
  tile: HDR(0.45, 0.8, 1.4, 0.6),
  slab: HDR(1.3, 1.6, 2.2, 0.75),
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
    attribute float aA; attribute vec3 aC; uniform float uPR; uniform float uSize;
    varying float vA; varying vec3 vC;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * uPR * (40.0 / -mv.z) * (0.55 + 0.45 * aA);
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
const circle = (c, r, y, n = 64, from = 0, to = 1) => {
  const p = [];
  for (let i = 0; i <= n; i++) { const a = Math.PI * 2 * (from + (to - from) * i / n); p.push(V(c.x + r * Math.cos(a), y, c.z + r * Math.sin(a))); }
  return p;
};

/* Labels are sized for a phone: in the 9:16 feed cut the frame is 1080 wide,
   so 36px here reads as about 7px on a phone held upright, the smallest that
   still reads. The speech itself is in the captions, not on the frame. */
const CSS = `
  .cin .kick { font: 500 24px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; color: #7fcfff; text-transform: uppercase; }
  .cin .hd { font: 600 84px/1.06 "Space Grotesk", sans-serif; letter-spacing: -.014em; color: #f4f7fb; text-wrap: balance; }
  .cin .pre { font: 500 30px/1.2 "JetBrains Mono", monospace; letter-spacing: .08em; color: #7fcfff; margin-bottom: 18px; }
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
  .cin .key { display: flex; gap: 28px; font: 500 26px/1 "JetBrains Mono", monospace; color: #a6b4c8; justify-content: flex-end; }
  .cin .key i { display: inline-block; width: 18px; height: 18px; border-radius: 5px; margin-right: 10px; vertical-align: -2px; }
  .cin .credit { font: 500 24px/1.5 "JetBrains Mono", monospace; letter-spacing: .02em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .cl__a { font: 500 46px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 96px/1.08 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 32px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 1080px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ------------------------------------------------------------ the schedule
   Computed once and read by frame(t); nothing carries between frames.
   Authored seconds throughout. */
const P = 0.5;                 // one beat
const AGE = 1.55;              // a plan older than this is too old to use
const ACT = T.wait + 1.0, ACT_END = T.split + 0.4;        // the blocking design
const SPILL = 2;
const STALLS = [
  { s: T.wait + 2.6, e: T.wait + 4.9, why: 'slow' },
  { s: T.wait + 6.2, e: T.wait + 8.4, why: 'slow' },
  { s: T.share + 3.6, e: T.share + 4.5, why: 'busy' },
  { s: T.share + 5.5, e: T.share + 6.3, why: 'busy' },
];
const SPLIT_AT = W('share', 'give', 7.6);   // the shared chip becomes two

const rnd = seeded(2026);
const PLANS = [];
{
  let e = T.think + 0.6;
  while (e < T.close - 0.5) {
    const asyncMode = e >= T.split + 1.0;
    const slow = rnd() < (asyncMode ? 0.22 : 0.34);
    const d = slow ? 2.0 + rnd() * 1.4 : 0.45 + rnd() * 0.45;
    PLANS.push({ e, d, a: e + d, async: asyncMode, bad: false });
    e += asyncMode ? 0.95 + rnd() * 0.5 : 1.3 + rnd() * 0.4;
  }
  for (const st of STALLS.filter(s => s.why === 'slow')) {
    PLANS.push({ e: st.s, d: st.e - st.s, a: st.e, async: false, bad: false, blocking: true });
  }
  PLANS.filter(p => p.async && p.a > T.limits + 2.0 && p.a < T.share - 0.5).forEach((p, i) => { if (i % 3 === 1) p.bad = true; });
  PLANS.sort((x, y) => x.e - y.e);
}
const inStall = b => STALLS.find(s => b >= s.s && b < s.e + SPILL * P);
function newestBy(b) {
  let best = null;
  for (const p of PLANS) if (p.async && p.a <= b && (!best || p.a > best.a)) best = p;
  return best;
}
// What became of the beat whose deadline is b: 0 on time, 1 missed, 2 safe default.
function status(b) {
  if (b > ACT && b < ACT_END && inStall(b)) return 1;
  if (b > T.share && b < SPLIT_AT && inStall(b)) return 1;
  if (Math.abs(b - 4.0) < P * 0.5) return 1;          // the hook: one answer that came too late
  if (b >= T.contract) {
    const p = newestBy(b);
    if (!p || b - p.e > AGE) return 2;
    if (b >= T.limits + 2.0 && p.bad) return 2;
  }
  return 0;
}
const stallActive = s => (s.why === 'slow' ? s.s > ACT && s.s < ACT_END : s.s > T.share && s.s < SPLIT_AT);
// The controller is waiting (not acting) at time t.
function stalledAt(t) {
  for (const s of STALLS) if (stallActive(s) && t >= s.s && t < s.e) return s;
  return null;
}
// Clock time the controller has actually kept by t: the ring's hand stops while it waits.
function kept(t) {
  let k = t;
  for (const s of STALLS) if (stallActive(s)) k -= Math.max(0, Math.min(t, s.e) - s.s);
  return k;
}
// The histogram of answer times the think scene builds: the same law as the plans.
const HIST = (() => {
  const r = seeded(77), order = [];
  for (let i = 0; i < 64; i++) {
    const slow = r() < 0.3, d = slow ? 2.0 + r() * 1.4 : 0.45 + r() * 0.45;
    order.push(Math.min(8, Math.floor((d - 0.4) / 0.34)));
  }
  return { order };
})();

/* ---------------------------------------------------------------- world
   Floor at y 0; the arm's base on the left inside its clock ring, the
   conveyor of beats running to its right along z ZC, the model above. */
const XA = -1.7, ZC = 0.45;
const SH = V(XA, 0.66, ZC);                 // the arm's shoulder
const L1 = 1.05, L2 = 0.92;
const PICK = V(XA + 1.3, 0.09, ZC);         // where a beat's tile is picked
const SPEED = 0.92;                         // conveyor, per second of film
const HUB = V(XA, 0.16, ZC);                // the controller, in the arm's base
const RING = 0.95;                          // the clock ring's radius, on the floor
const O1 = V(0.55, 1.85, -0.7), O2 = V(2.9, 1.55, -1.55);  // the model: above the line, then on its own pedestal
const MB = V(0.95, 1.12, -0.15);            // the mailbox plans are left in
const CUR = XA + 2.0;                       // the light curtain's x, between mailbox and arm
const objAt = t => V(XA + 0.8 + 0.42 * Math.sin(t * 0.85), 0.66 + 0.16 * Math.sin(t * 1.6 + 0.6), ZC);
const modelAt = t => O1.clone().lerp(O2, ease.inOutCubic(ramp(t, T.split + 0.6, T.split + 3.6)));

/* camera: every shot moves, from its first pose to its last, and the cut
   between shots is a 2 s ease from wherever the last shot had reached. */
const SHOTS = [
  //  start             pos A              look A                pos B              look B
  [T.hook - 3, V(0.7, 1.45, 5.6), V(-0.35, 1.1, -0.1), V(-0.45, 1.25, 4.3), V(-0.85, 1.0, 0.2)],
  [T.thesis, V(2.2, 2.0, 4.8), V(-0.35, 0.95, -0.1), V(-2.9, 2.3, 4.3), V(-0.6, 0.85, 0.0)],
  [T.beat, V(3.6, 0.55, 1.5), V(-1.5, 0.45, 0.45), V(0.5, 0.95, 2.7), V(-1.6, 0.6, 0.4)],
  [T.think, V(2.9, 1.7, 3.4), V(1.25, 1.05, -1.1), V(-0.1, 2.1, 3.5), V(1.15, 1.05, -1.1)],
  [T.wait, V(0.9, 1.7, 4.4), V(-0.75, 0.8, 0.1), V(-0.2, 1.15, 2.8), V(-0.75, 0.55, 0.4)],
  [T.split, V(0.0, 1.9, 4.3), V(0.1, 1.05, -0.3), V(1.7, 2.6, 6.4), V(0.75, 0.95, -0.6)],
  [T.stale, V(-0.1, 1.35, 3.1), V(-0.85, 0.75, 0.3), V(-1.7, 1.25, 2.9), V(-0.95, 0.7, 0.3)],
  [T.contract, V(2.5, 1.5, 2.5), V(0.9, 1.1, -0.15), V(1.4, 1.8, 2.3), V(0.85, 1.05, -0.1)],
  [T.limits, V(-2.8, 1.65, 3.4), V(-0.3, 0.8, 0.3), V(-1.9, 1.5, 3.4), V(0.1, 0.95, 0.4)],
  [T.share, V(0.6, 3.0, 6.0), V(0.6, 0.45, -0.4), V(1.2, 6.4, 6.6), V(0.8, 0.2, -0.5)],
  [T.open, V(4.6, 2.5, 6.6), V(0.7, 1.05, -0.5), V(-3.6, 2.8, 6.8), V(0.6, 1.05, -0.5)],
  [T.close, V(0.4, 3.0, 8.5), V(0.5, 0.65, -0.5), V(0.9, 3.8, 11.0), V(0.7, 0.6, -0.5)],
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

    /* the conveyor: two rails to the horizon, and a pool of beat tiles */
    const railA = add(fatLine(COL.tile, 2.4)), railB = add(fatLine(COL.tile, 2.4));
    setLinePoints(railA, [V(PICK.x - 0.4, 0.01, ZC - 0.28), V(PICK.x + 16, 0.01, ZC - 0.28)]);
    setLinePoints(railB, [V(PICK.x - 0.4, 0.01, ZC + 0.28), V(PICK.x + 16, 0.01, ZC + 0.28)]);
    const NT = 34, tileGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, 0.08, 0.44)), faceGeo = new THREE.PlaneGeometry(0.34, 0.44);
    const tiles = [];
    for (let i = 0; i < NT; i++) {
      const g = new THREE.Group();
      const edge = new THREE.LineSegments(tileGeo, lineMat(COL.tile));
      const face = new THREE.Mesh(faceGeo, glow(COL.tile)); face.rotation.x = -Math.PI / 2; face.position.y = 0.041;
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

    /* the arm: base, two links, a gripper, the controller hub inside the base */
    const base = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.34, 0.44, 0.26, 6)), lineMat(COL.arm)));
    base.position.set(XA, 0.13, ZC);
    const col = add(fatLine(COL.arm, 6.0)), link1 = add(fatLine(COL.arm, 7.0)), link2 = add(fatLine(COL.arm, 6.0));
    const fingA = add(fatLine(COL.arm, 4.5)), fingB = add(fatLine(COL.arm, 4.5));
    const joint = r => add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), mat(RIM, { uColor: COL.arm.clone(), uAlpha: 0, uPow: 1.3 })));
    const jS = joint(0.13), jE = joint(0.11), jW = joint(0.085);
    const hub = joint(0.16); hub.position.copy(HUB);

    /* the object the arm works on, and the ghost of where a plan saw it */
    const obj = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), mat(RIM, { uColor: HDR(2.4, 2.2, 1.4), uAlpha: 0, uPow: 1.1 })));
    const ghost = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.17, 1)), lineMat(COL.safe)));
    const gap = add(fatLine(COL.safe, 3.0, [0.07, 0.06]));

    /* the model, the series' body */
    const model = new THREE.Group();
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)), lineMat(COL.model, 0));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: COL.model.clone(), uAlpha: 0, uPow: 1.6 }));
    model.add(shell, core); model.scale.setScalar(0.72); add(model);
    const pedestal = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.5, 0.6, 0.95, 6)), lineMat(COL.slab)));
    pedestal.position.set(O2.x, 0.475, O2.z);

    /* the think scene: answer times rising as columns behind the model */
    const bars = [];
    for (let k = 0; k < 9; k++) {
      const g = new THREE.Group();
      const c = k >= 5 ? COL.safe : COL.plan;
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.28, 1, 0.28)), lineMat(c));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 1), glow(c));
      g.add(edge, face); g.position.set(-0.05 + k * 0.38, 0, -1.75); add(g); bars.push({ g, edge, face });
    }
    const axis = add(fatLine(COL.floor, 2.0));
    setLinePoints(axis, [V(-0.3, 0.005, -1.55), V(3.2, 0.005, -1.55)]);

    /* the waiting path, and its two halves when it is cut */
    const tether = add(fatLine(HDR(1.4, 1.8, 2.4), 3.4));
    const cutA = add(fatLine(HDR(1.4, 1.8, 2.4), 3.4)), cutB = add(fatLine(HDR(1.4, 1.8, 2.4), 3.4));

    /* the mailbox, its age ring and the feed to the controller */
    const box = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.42, 0.42, 0.42)), lineMat(COL.plan)));
    box.position.copy(MB);
    const ageRing = add(fatLine(COL.ok, 5.0));
    const feed = add(fatLine(HDR(1.2, 1.6, 2.2), 2.4, [0.1, 0.08]));
    setLinePoints(feed, [MB, V(MB.x - 1.0, 0.75, 0.2), HUB.clone().add(V(0, 0.2, 0))]);

    /* the guard: a light curtain on what the arm may do */
    const curtain = add(new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.8), glow(COL.safe)));
    curtain.rotation.y = Math.PI / 2; curtain.position.set(CUR, 0.9, ZC);
    const curtainEdge = add(fatLine(COL.safe, 3.6));
    setLinePoints(curtainEdge, [V(CUR, 0, ZC - 0.85), V(CUR, 1.8, ZC - 0.85), V(CUR, 1.8, ZC + 0.85), V(CUR, 0, ZC + 0.85), V(CUR, 0, ZC - 0.85)]);

    /* one chip under everything, then two */
    const slabGeo = (w, d) => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.18, d));
    const slab = add(new THREE.LineSegments(slabGeo(7.4, 3.8), lineMat(COL.slab)));
    slab.position.set(0.7, -0.1, -0.5);
    const slabFace = add(new THREE.Mesh(new THREE.PlaneGeometry(7.4, 3.8), glow(COL.slab)));
    slabFace.rotation.x = -Math.PI / 2; slabFace.position.set(0.7, -0.015, -0.5);
    const slabA = add(new THREE.LineSegments(slabGeo(4.0, 3.8), lineMat(COL.slab)));
    const slabB = add(new THREE.LineSegments(slabGeo(2.6, 2.6), lineMat(COL.slab)));

    /* sparks: plans in flight, and the shards of one that hit the curtain */
    const SN = PLANS.length + 2, BN = 18;
    const spos = new Float32Array((SN + BN) * 3), sa = new Float32Array(SN + BN), sc = new Float32Array((SN + BN) * 3);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1));
    sg.setAttribute('aC', new THREE.BufferAttribute(sc, 3));
    const sparks = add(new THREE.Points(sg, mat(SPARK, { uPR: 1, uSize: 13 })));
    sparks.frustumCulled = false;

    Object.assign(ctx, { dust, grid, railA, railB, tiles, ring, ticks, hand, pulses, base, col, link1, link2, fingA, fingB, jS, jE, jW, hub,
                         obj, ghost, gap, model, shell, core, pedestal, bars, axis, tether, cutA, cutB, box, ageRing, feed,
                         curtain, curtainEdge, slab, slabFace, slabA, slabB, sparks, spos, sa, sc, SN, BN });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 110, y: 70, w: 900 };
    const HD = { x: 110, y: 150, w: 980 };
    const say = (at, out, hd, pre) => text({ at, out, cls: 'blk', place: HD,
      html: (pre ? `<div class="pre">${pre}</div>` : '') + `<div class="hd">${hd}</div>` });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1500, h: 620 },
          'radial-gradient(ellipse 1150px 520px at 0% 0%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.6) 55%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 58% 52% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    say(-3, T.thesis - gone, 'Right answer. <span class="red">Too late.</span>');
    say(T.thesis, T.beat - gone, 'Let the AI advise. Never let it hold the <em>clock</em>.', 'Dr. Ozgur Ural&rsquo;s proposal');
    say(T.beat, T.think - gone, 'A machine runs on a <em>beat</em>.');
    say(T.think, T.wait - gone, 'AI keeps a <em>different clock</em>.');
    say(T.wait, T.split - gone, 'Wait for the AI, and the arm <span class="red">freezes</span>.');
    say(T.split, T.stale - gone, 'Out of the <em>waiting path</em>.');
    say(T.stale, T.contract - gone, 'On time, but <span class="amber">out of date</span>.');
    say(T.contract, T.limits - gone, 'Every plan is <em>stamped</em>.');
    say(T.limits, T.share - gone, 'A simple guard has the <em>last word</em>.');
    say(T.share, T.open - gone, 'One chip, <span class="red">one trap</span>.');
    say(T.open, T.close - 0.25, 'Can we <em>prove</em> the timing for large models?', 'The open question');
    // said once near the start, and again on the card
    text({ at: T.thesis + 1.0, out: T.beat + 0.8, cls: 'credit', words: false, dur: 0.6, place: { x: 110, y: 470, w: 900 },
           html: 'An open research direction of Dr. Ozgur Ural, not yet published.<span>Every beat and plan here is drawn from a synthetic schedule, not measured.</span>' });
    text({ at: T.open + 1.0, out: T.close - 0.3, cls: 'credit', words: false, dur: 0.6, place: { x: 110, y: 470, w: 900 },
           html: '<span>The guard pattern: L. Sha, &ldquo;Using Simplicity to Control Complexity,&rdquo; IEEE Software, 2001.</span>' });
    text({ at: T.split + 4.5, out: T.close - 0.3, cls: 'key', words: false, dur: 0.6, place: { x: 1060, y: 64, w: 780 },
           html: '<span><i style="background:#5dffc8"></i>on time</span><span><i style="background:#ffb347"></i>safe default</span><span><i style="background:#ff6272"></i>missed</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 320, w: 1400, align: 'center' },
           html: 'Smarter AI will keep arriving.' });
    text({ at: W('close', 'let', 2.4), out: T.card - 0.3, cls: 'cl__b', place: { x: 200, y: 410, w: 1520, align: 'center' },
           html: 'Let the AI advise. Never let it hold the <em>clock</em>.' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">AI meets the deadline</div>
                  <div class="end__s">Keep the AI out of the waiting path, stamp every plan with its age, let a simple guard own the limits, and give the controller its own chip.</div>
                  <div class="end__a">An open research direction of Dr. Ozgur Ural &middot; not yet published</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* --------------------------------------------------------- labels */
    const at = v => () => v;
    label({ cls: 'chip', html: 'the AI', anchor: () => modelAt(0).clone().add(V(0, 0.8, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, 0.6, T.thesis + 5, 0.6, 0.6) });
    label({ cls: 'chip', html: 'the controller', anchor: at(V(XA, -0.05, ZC + RING + 0.1)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.thesis + 2.5, T.beat + 3, 0.6, 0.6) });
    label({ cls: 'stamp red', html: 'TOO LATE', anchor: at(V(XA + 1.55, 1.25, ZC)), ax: 0, ay: 1,
            alpha: t => win(t, 4.45, T.thesis - 0.3, 0.25, 0.5) });
    label({ cls: 'chip', html: 'one beat, one deadline', anchor: at(V(PICK.x + 1.4, 0.05, ZC + 0.45)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.beat + 3.5, T.think - 0.3, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'the slow tail', anchor: at(V(2.55, 1.35, -1.75)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.think + 5.0, T.wait - 0.2, 0.6, 0.5) });
    label({ cls: 'stamp red', html: 'WAITING', anchor: at(V(PICK.x + 0.75, 1.0, ZC)), ax: 0.5, ay: 1,
            alpha: t => (stalledAt(t) && t < ACT_END ? 1 : 0) * win(t, T.wait, T.split, 0.2, 0.3) });
    label({ cls: 'chip', html: 'latest plan', anchor: at(V(MB.x, MB.y - 0.36, MB.z)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.split + 4.0, T.stale, 0.6, 0.6) });
    label({ cls: 'chip amber', html: 'what the plan saw', anchor: () => objAt(lastPlanSeen(T.stale + 4)).add(V(0, -0.3, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.stale + 2.0, T.contract - 0.2, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'too old: do something safe', anchor: at(V(MB.x, MB.y - 0.62, MB.z)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.contract + 4.0, T.limits - 0.2, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'blocked', anchor: at(V(CUR, 1.2, ZC + 0.9)), ax: 0, ay: 0.5, dx: 16,
            alpha: t => win(t, T.limits + 3.0, T.share - 0.2, 0.6, 0.5) });
    label({ cls: 'chip', html: 'one chip', anchor: at(V(-2.0, -0.1, 1.4)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.share + 1.6, SPLIT_AT - 0.2, 0.6, 0.4) });
    label({ cls: 'chip teal', html: 'kept apart', anchor: at(V(-2.0, -0.1, 1.4)), ax: 0.5, ay: 0,
            alpha: t => win(t, SPLIT_AT + 0.6, T.open - 0.2, 0.6, 0.5) });
    // the open question: the four rules, each on the thing that keeps it
    const rule = (html, anchor, k) => label({ cls: 'chip teal', html, anchor: at(anchor), ax: 0.5, ay: 1,
      alpha: t => win(t, T.open + 1.2 + 1.1 * k, T.close - 0.2, 0.5, 0.5) });
    rule('never waits', V(XA - 0.2, 0.05, ZC + RING), 0);
    rule('stamped', V(MB.x, MB.y + 0.4, MB.z), 1);
    label({ cls: 'chip teal', html: 'guarded', anchor: at(V(CUR, 1.1, ZC + 0.9)), ax: 0, ay: 0.5, dx: 16,
      alpha: t => win(t, T.open + 3.4, T.close - 0.2, 0.5, 0.5) });
    rule('own chip', V(O2.x, 0.05, O2.z + 1.3), 3);
  },

  frame(t, ctx) {
    const { camera, grade } = ctx;
    const pr = ctx.renderer.getPixelRatio();

    const cam = cameraAt(t);
    camera.position.copy(cam.pos).add(V(0.04 * Math.sin(t * 0.17), 0.03 * Math.sin(t * 0.13), 0));
    camera.lookAt(cam.look);

    const show = win(t, -1, T.card + 0.4, 0.8, 0.8) * (1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0)));
    ctx.grid.material.opacity = 0.16 * show;
    const stall = stalledAt(t);

    /* the conveyor: tile for beat b is at the pick point on its deadline */
    ctx.railA.material.opacity = 0.55 * show; ctx.railB.material.opacity = 0.55 * show;
    const first = Math.floor((t - 2.5) / P);
    let stackN = 0;
    for (let i = 0; i < ctx.tiles.length; i++) {
      const { g, edge, face } = ctx.tiles[i];
      const b = (first + i) * P;
      const st = status(b);
      const c = st === 1 ? COL.late : st === 2 ? COL.safe : COL.ok;
      let x = PICK.x + (b - t) * SPEED, y = 0.04, a = 0, colr = COL.tile, s = 1, rz = 0;
      if (b > t) {                                   // still coming
        a = 0.9 * (1 - ramp(x, PICK.x + 7.5, PICK.x + 11));
      } else {
        const st0 = inStall(b);
        const blocking = st === 1 && st0 && (t < st0.e + SPILL * P + 0.4);
        if (blocking) {                              // waiting at the arm, red, piled high
          x = PICK.x + 0.03 * Math.sin(stackN * 2.1); y = 0.04 + stackN * 0.1; rz = 0.08 * Math.sin(stackN * 1.7); stackN++;
          a = 1; colr = COL.late;
        } else {
          const since = t - Math.max(b, st0 ? st0.e + SPILL * P : b);
          colr = c;
          a = Math.max(0, 1 - since / 0.6);
          if (st === 1 && !st0) { x = PICK.x + (b - t) * SPEED; y = 0.04 - 0.4 * ramp(t, b + 0.6, b + 1.6); rz = -0.6 * ramp(t, b + 0.6, b + 1.6); a = Math.max(0, 1 - (t - b) / 1.8); }
          else { x = PICK.x - Math.min(since, 0.5) * 0.5; y = 0.04 + 0.4 * Math.min(1, since / 0.5); s = 1 - 0.55 * Math.min(1, since / 0.5); }
        }
      }
      g.position.set(x, y, ZC); g.scale.setScalar(s); g.rotation.z = rz;
      edge.material.color.copy(colr); face.material.color.copy(colr);
      edge.material.opacity = a * show; face.material.opacity = 0.4 * a * show;
    }

    /* the clock ring: a hand that only moves while the controller keeps its beat */
    const ringIn = win(t, T.thesis + 4.5, T.close - 0.2, 0.8, 0.6) * show;
    const ringCol = stall ? COL.late : COL.arm;
    ctx.ring.material.opacity = 0.8 * ringIn; ctx.ring.material.color.copy(ringCol);
    ctx.ticks.material.opacity = 0.8 * ringIn; ctx.ticks.material.color.copy(ringCol);
    const ha = -kept(t) * (Math.PI * 2) / 6;          // one turn every six seconds of kept time
    setLinePoints(ctx.hand, [V(HUB.x, 0.02, HUB.z), V(HUB.x + (RING - 0.06) * Math.cos(ha), 0.02, HUB.z + (RING - 0.06) * Math.sin(ha))]);
    ctx.hand.material.opacity = ringIn; ctx.hand.material.color.copy(stall ? COL.late : COL.ok);
    for (let k = 0; k < 2; k++) {
      const b = (Math.floor(t / P) - k) * P, u = (t - b) / (2 * P);
      const st = status(b);
      const live = !stall && st !== 1 && !(stalledAt(b + 0.01));
      setLinePoints(ctx.pulses[k], circle(HUB, RING + 0.05 + 0.9 * u, 0.02, 72));
      ctx.pulses[k].material.color.copy(st === 2 ? COL.safe : COL.ok);
      ctx.pulses[k].material.opacity = live ? 0.75 * (1 - u) * ringIn : 0;
    }

    /* the arm: reaches the pick point each beat it acts on, freezes while it waits */
    const lastBeat = Math.floor(t / P) * P;
    const acted = !stall && status(lastBeat) !== 1;
    const kick = acted ? Math.exp(-(t - lastBeat) / 0.16) : 0;
    const safe = status(lastBeat) === 2;
    let target = PICK.clone().add(V(-0.05, 0.26 - 0.18 * kick * (safe ? 0.5 : 1), 0));
    let grip = 0.5 + 0.5 * (1 - kick);
    // the hook: lunge for the moving object where the late plan said it was
    if (t < T.thesis + 0.5) {
      const reach = ease.outCubic(ramp(t, 3.6, 4.4)) * (1 - ease.inOutSine(ramp(t, 6.4, T.thesis + 0.5)));
      target = target.lerp(V(XA + 0.75, 0.8, ZC), reach);
      grip = t > 4.4 && t < 6.6 ? 0.06 : 1;
    }
    if (stall) { target = PICK.clone().add(V(-0.05, 0.26, 0)); grip = 1; }
    const d = Math.min(L1 + L2 - 0.02, Math.max(0.3, target.distanceTo(SH)));
    const aT = Math.atan2(target.y - SH.y, target.x - SH.x);
    const cB = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const E = V(SH.x + L1 * Math.cos(aT + cB), SH.y + L1 * Math.sin(aT + cB), ZC);
    const Wr = V(SH.x + d * Math.cos(aT), SH.y + d * Math.sin(aT), ZC);
    const dir = Wr.clone().sub(E).normalize(), nrm = V(-dir.y, dir.x, 0);
    const fl = 0.24, open = 0.07 + 0.12 * grip;
    setLinePoints(ctx.col, [V(XA, 0.26, ZC), SH]);
    setLinePoints(ctx.link1, [SH, E]);
    setLinePoints(ctx.link2, [E, Wr]);
    setLinePoints(ctx.fingA, [Wr, Wr.clone().add(dir.clone().multiplyScalar(fl)).add(nrm.clone().multiplyScalar(open))]);
    setLinePoints(ctx.fingB, [Wr, Wr.clone().add(dir.clone().multiplyScalar(fl)).add(nrm.clone().multiplyScalar(-open))]);
    const armCol = stall ? COL.late : COL.arm;
    for (const l of [ctx.col, ctx.link1, ctx.link2, ctx.fingA, ctx.fingB]) { l.material.opacity = 0.95 * show; l.material.color.copy(armCol); }
    ctx.base.material.opacity = 0.75 * show;
    ctx.jS.position.copy(SH); ctx.jE.position.copy(E); ctx.jW.position.copy(Wr);
    for (const j of [ctx.jS, ctx.jE, ctx.jW]) { j.material.uniforms.uAlpha.value = 0.85 * show; j.material.uniforms.uColor.value.copy(armCol); }
    ctx.hub.material.uniforms.uColor.value.copy(stall ? COL.late : HDR(1.2, 2.0, 2.8));
    ctx.hub.material.uniforms.uAlpha.value = (stall ? 1.3 + 0.3 * Math.sin(t * 9) : 0.75) * show;

    /* the object: the hook's passes before the plan lands; later it drifts through reach */
    const objIn = win(t, -1, T.thesis + 0.6, 0.4, 0.6) + win(t, T.stale + 0.4, T.limits + 0.4, 0.8, 0.6);
    let op = objAt(t);
    if (t < T.thesis + 0.6) op = V(lerp(XA + 3.6, XA - 1.0, ease.inOutSine(ramp(t, 0.4, 7.4))), 0.82, ZC);
    ctx.obj.position.copy(op);
    ctx.obj.rotation.set(t * 0.7, t * 0.9, 0);
    ctx.obj.material.uniforms.uAlpha.value = 0.85 * Math.min(1, objIn) * show;
    const ghostIn = win(t, T.stale + 1.2, T.contract + 0.5, 0.6, 0.6) * show;
    const seenAt = lastPlanSeen(t);
    const gp = objAt(seenAt);
    ctx.ghost.position.copy(gp); ctx.ghost.rotation.set(seenAt * 0.7, seenAt * 0.9, 0);
    ctx.ghost.material.opacity = 0.95 * ghostIn;
    setLinePoints(ctx.gap, [gp, op]);
    ctx.gap.material.opacity = 0.85 * ghostIn;

    /* the model: above the line, then flown to its own pedestal */
    const mp = modelAt(t);
    let busy = 0;
    for (const p of PLANS) busy = Math.max(busy, win(t, p.e, p.a, 0.15, 0.2));
    const hog = stall && stall.why === 'busy' ? 1 : 0;
    const flying = Math.sin(Math.PI * ramp(t, T.split + 0.6, T.split + 3.6));
    ctx.model.position.copy(mp).add(V(0, 0.45 * flying, 0));
    ctx.model.rotation.set(0.35 + 0.05 * Math.sin(t * 0.3), t * 0.22 + 2.5 * flying, 0.08);
    ctx.model.scale.setScalar(0.72 * (1 + 0.22 * hog));
    ctx.shell.material.opacity = (0.55 + 0.35 * busy) * show;
    ctx.core.material.uniforms.uAlpha.value = (0.7 + 0.5 * busy + 1.1 * hog) * show;
    ctx.core.material.uniforms.uColor.value.copy(COL.model).lerp(COL.late, hog * 0.6);
    ctx.pedestal.material.opacity = 0.6 * win(t, T.split + 2.4, T.close - 0.2, 0.9, 0.6) * show;

    /* the histogram: one sample lands per beat of the think scene */
    const nIn = Math.floor(ramp(t, T.think + 0.8, T.think + 8.0) * HIST.order.length);
    const counts = new Array(9).fill(0);
    for (let i = 0; i < nIn; i++) counts[HIST.order[i]]++;
    const hIn = win(t, T.think + 0.3, T.wait + 0.4, 0.6, 0.8) * show;
    for (let k = 0; k < 9; k++) {
      const h = Math.max(0.001, counts[k] * 0.12);
      const { g, edge, face } = ctx.bars[k];
      g.scale.set(1, h, 1); g.position.y = h / 2;
      edge.material.opacity = 0.95 * hIn; face.material.opacity = 0.32 * hIn;
    }
    ctx.axis.material.opacity = 0.7 * hIn;

    /* the waiting path: taut while the controller waits on it, cut when the AI leaves */
    const tA = mp.clone().add(V(0, -0.5, 0)), tM = V(mp.x - 1.2, 1.35, 0.1), tB = HUB.clone().add(V(0, 0.16, 0));
    setLinePoints(ctx.tether, [tA, tM, tB]);
    ctx.tether.material.opacity = 0.8 * win(t, ACT - 0.6, T.split + 0.6, 0.6, 0.05) * show;
    ctx.tether.material.color.copy(stall && t < ACT_END ? COL.late : HDR(1.4, 1.8, 2.4));
    const cut = ramp(t, T.split + 0.6, T.split + 2.0), cutIn = (t > T.split + 0.6 ? 1 - cut : 0) * show;
    const midA = tA.clone().lerp(tM, 0.5), midB = tM.clone().lerp(tB, 0.5);
    setLinePoints(ctx.cutA, [tA, midA.clone().add(V(0.1 * cut, -0.9 * cut * cut, 0))]);
    setLinePoints(ctx.cutB, [tB, midB.clone().add(V(-0.1 * cut, -0.6 * cut * cut, 0))]);
    ctx.cutA.material.opacity = 0.8 * cutIn; ctx.cutB.material.opacity = 0.8 * cutIn;

    /* the mailbox, the age of its latest plan, the feed */
    const asyncOn = win(t, T.split + 2.2, T.close - 0.2, 0.8, 0.6) * show;
    const np = newestBy(t);
    const age = np ? t - np.e : 99;
    const fresh = Math.max(0, 1 - age / AGE);
    const tooOld = t > T.contract && fresh <= 0;
    const land = np ? Math.exp(-(t - np.a) / 0.2) : 0;
    ctx.box.rotation.set(0.5 + t * 0.15, 0.6 + t * 0.25, 0);
    ctx.box.scale.setScalar(1 + 0.18 * land);
    ctx.box.material.color.copy(tooOld ? COL.safe : COL.plan);
    ctx.box.material.opacity = 0.95 * asyncOn;
    ctx.feed.material.opacity = 0.45 * asyncOn;
    const ageIn = win(t, T.contract + 0.4, T.close - 0.2, 0.6, 0.6) * show;
    const rp = [], R0 = 0.5, n = Math.max(2, Math.round(64 * fresh));
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 - (i / 64) * Math.PI * 2; rp.push(V(MB.x + R0 * Math.cos(a), MB.y + R0 * Math.sin(a), MB.z + 0.25)); }
    setLinePoints(ctx.ageRing, rp);
    ctx.ageRing.material.color.copy(COL.ok).lerp(COL.safe, 1 - fresh);
    ctx.ageRing.material.opacity = (fresh > 0 ? 0.95 : 0) * ageIn;

    /* the guard */
    const curIn = win(t, T.limits + 0.6, T.close - 0.2, 0.7, 0.6) * show;
    let hitFlash = 0;
    for (const p of PLANS) if (p.bad && t > T.limits + 2.0) hitFlash = Math.max(hitFlash, win(t, p.a + 0.45, p.a + 1.1, 0.05, 0.5));
    ctx.curtain.material.opacity = (0.07 + 0.35 * hitFlash) * curIn;
    ctx.curtain.material.color.copy(COL.safe).lerp(COL.late, hitFlash);
    ctx.curtainEdge.material.opacity = 0.9 * curIn;
    ctx.curtainEdge.material.color.copy(COL.safe).lerp(COL.late, hitFlash);

    /* sparks: plans fly from the model to the controller (blocking) or the mailbox */
    const { spos, sa, sc } = ctx;
    for (let j = 0; j < ctx.SN + ctx.BN; j++) sa[j] = 0;
    const put = (j, x, y, z, a, c) => { spos[j * 3] = x; spos[j * 3 + 1] = y; spos[j * 3 + 2] = z; sa[j] = a * show; sc[j * 3] = c.r; sc[j * 3 + 1] = c.g; sc[j * 3 + 2] = c.b; };
    for (let j = 0; j < PLANS.length; j++) {
      const p = PLANS[j];
      if (t < T.think || t > T.close - 0.2 || t < p.e || t > p.a + 1.2) continue;
      const from = modelAt(p.e);
      const to = p.async ? MB : HUB.clone().add(V(0, 0.2, 0));
      if (t < p.a) {
        const u = ease.inOutSine(ramp(t, p.e, p.a));
        put(j, lerp(from.x, to.x, u), lerp(from.y, to.y, u) + 0.45 * Math.sin(Math.PI * u), lerp(from.z, to.z, u), Math.min(1, ramp(t, p.e, p.e + 0.15)), COL.plan);
      } else if (p.bad && t > T.limits + 2.0) {
        // a command outside the limits leaves for the arm and is stopped at the curtain
        const u = ramp(t, p.a, p.a + 0.45);
        put(j, lerp(MB.x, CUR + 0.02, u), lerp(MB.y, 0.95, u), lerp(MB.z, ZC, u), 1 - ramp(t, p.a + 0.45, p.a + 0.6), COL.late);
        if (t > p.a + 0.45) {
          const v = ramp(t, p.a + 0.45, p.a + 1.2);
          for (let s = 0; s < ctx.BN; s++) {
            const ang = (s / ctx.BN) * Math.PI * 2, sp = 0.7 + 0.3 * Math.sin(s * 3.7);
            put(ctx.SN + s, CUR + 0.08 + 0.45 * v * sp, 0.95 + 0.6 * v * sp * Math.sin(ang) - 0.9 * v * v, ZC + 0.6 * v * sp * Math.cos(ang), 1 - v, COL.late);
          }
        }
      } else {
        put(j, to.x, to.y, to.z, 1 - ramp(t, p.a, p.a + 0.3), COL.plan);
      }
    }
    // the hook's late plan: it lands where the object was, after the object has gone
    {
      const j = PLANS.length, u = ease.inOutSine(ramp(t, 1.2, 4.4));
      const from = modelAt(0), to = V(XA + 0.75, 0.8, ZC);
      put(j, lerp(from.x, to.x, u), lerp(from.y, to.y, u) + 0.5 * Math.sin(Math.PI * u), lerp(from.z, to.z, u), win(t, 1.2, 4.9, 0.25, 0.5), COL.plan);
    }
    // the thesis: one plan offered, and taken on the beat ("Let the AI advise")
    {
      const j = PLANS.length + 1, s0 = W('thesis', 'let', 3.4), u = ease.inOutSine(ramp(t, s0 - 0.2, s0 + 1.1));
      const from = modelAt(0), to = HUB.clone().add(V(0, 0.25, 0));
      put(j, lerp(from.x, to.x, u), lerp(from.y, to.y, u) + 0.5 * Math.sin(Math.PI * u), lerp(from.z, to.z, u), win(t, s0 - 0.2, s0 + 1.5, 0.2, 0.4), COL.ok);
    }
    ctx.sparks.geometry.attributes.position.needsUpdate = true;
    ctx.sparks.geometry.attributes.aA.needsUpdate = true;
    ctx.sparks.geometry.attributes.aC.needsUpdate = true;
    ctx.sparks.material.uniforms.uPR.value = pr;

    /* one chip, then two */
    const one = win(t, T.share + 0.6, SPLIT_AT + 0.4, 0.9, 0.4) * show;
    const two = win(t, SPLIT_AT, T.close - 0.2, 0.6, 0.6) * show;
    const part = ease.outCubic(ramp(t, SPLIT_AT, SPLIT_AT + 1.6));
    ctx.slab.material.opacity = (0.55 + 0.4 * hog) * one;
    ctx.slab.material.color.copy(COL.slab).lerp(COL.late, hog);
    ctx.slabFace.material.opacity = (0.05 + 0.14 * hog) * one;
    ctx.slabFace.material.color.copy(COL.slab).lerp(COL.late, hog);
    ctx.slabA.position.set(lerp(-0.5, -1.05, part), -0.1, -0.5);
    ctx.slabB.position.set(lerp(2.75, 3.0, part), -0.1, lerp(-0.5, -1.55, part));
    ctx.slabA.material.opacity = 0.6 * two;
    ctx.slabB.material.opacity = 0.6 * two;

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    ctx.dust.material.uniforms.uTime.value = t;
    ctx.dust.material.uniforms.uPR.value = pr;
  },
};

// the moment the newest plan available at t was made: what it saw of the world
function lastPlanSeen(t) {
  const p = newestBy(t);
  return p ? p.e : t;
}

createCinema(film);
