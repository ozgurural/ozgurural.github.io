/*
 * AI meets the deadline: why an AI planner belongs beside a real-time
 * controller, not in its waiting path, in about a hundred seconds.
 *
 * The argument is the lab film's (scripts/narration.json, prefix
 * "determinism") and DeadlineModel's: a controller on a fixed beat, inference
 * on a variable clock; blocking inference misses beats and the delay spills
 * into the work behind it; a separate worker the controller never waits for
 * keeps every beat; the new failure is the stale plan, so plans carry the
 * moment they were made and expire into a safe default; freshness is one
 * check and the action limits keep their own; shared hardware can still cost
 * the asynchronous loop its beats.
 *
 * This is the author's open research direction, not a published paper, and
 * the frame says so once at the start and once at the end. Every beat, plan
 * and stall is drawn from a fixed, seeded schedule, not measured.
 *
 * The telling (2026-10-31): the first cut kept one ring and one model in the
 * same place for all ten scenes and the owner asked for each scene to be its
 * own picture, at the Level D film's standard. So it is one world the camera
 * travels through, in the series' look: a glowing robot arm at the end of a
 * conveyor of beats (each tile reaches the arm on its deadline and is picked,
 * or turns red and piles up while the arm waits), the series' model body above
 * it, and for each scene the thing its sentence is about: the arm grasping air
 * after a late plan, the conveyor running to the horizon, a histogram of
 * answer times rising behind the model, a tether and a growing red stack, the
 * model moved to its own pedestal with a mailbox between, the ghost of the
 * world a plan saw beside the world as it is, an age ring draining around the
 * newest plan, a light curtain a plan outside the limits shatters on, and the
 * camera rising to show one chip under everything, which then splits in two.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, setLinePoints, lerp, ramp, ease, win, seeded } from './engine.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const T = { hook: 0, beat: 8.5, think: 17, wait: 26, split: 36, stale: 46, contract: 55, limits: 65, share: 74.5, close: 86, card: 94 };
const D = 100;

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

const CSS = `
  .cin .kick { font: 500 23px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; color: #7fcfff; text-transform: uppercase; }
  .cin .hd { font: 600 80px/1.08 "Space Grotesk", sans-serif; letter-spacing: -.012em; color: #f4f7fb; text-wrap: balance; }
  .cin .sb { font: 400 37px/1.38 "Inter", sans-serif; color: #aebcd0; text-wrap: pretty; }
  .cin .blk .sb { margin-top: 30px; max-width: 780px; }
  .cin .sb b { color: #e8eef7; font-weight: 600; }
  .cin em { font-style: normal; color: #6fd3ff; }
  .cin .teal { color: #5dffc8; } .cin .amber { color: #ffb347; } .cin .red { color: #ff6272; }
  .cin .scrim { position: absolute; }
  .cin .chip { font: 500 25px/1 "JetBrains Mono", monospace; padding: 10px 13px; border-radius: 8px; white-space: nowrap;
               background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.red { border-color: rgba(255,98,114,.75); color: #ff8a96; }
  .cin .chip.amber { border-color: rgba(255,179,71,.75); color: #ffc477; }
  .cin .chip.teal { border-color: rgba(93,255,200,.6); color: #8dffd9; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px; white-space: nowrap;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); }
  .cin .stamp.red { color: #ff6272; }
  .cin .key { display: flex; gap: 26px; font: 500 22px/1 "JetBrains Mono", monospace; color: #9aa9be; }
  .cin .key i { display: inline-block; width: 14px; height: 14px; border-radius: 4px; margin-right: 9px; vertical-align: -1px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 980px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ------------------------------------------------------------ the schedule
   Computed once and read by frame(t); nothing carries between frames.
   Authored seconds throughout. This is the first cut's schedule, unchanged. */
const P = 0.5;                 // one beat
const AGE = 1.55;              // a plan older than this is too old to use
const ACT = T.wait + 1.0, ACT_END = T.split + 0.4;        // the blocking design
const SPILL = 2;
const STALLS = [
  { s: T.wait + 2.6, e: T.wait + 4.9, why: 'slow' },
  { s: T.wait + 6.4, e: T.wait + 8.1, why: 'slow' },
  { s: T.share + 3.4, e: T.share + 4.25, why: 'busy' },
  { s: T.share + 5.3, e: T.share + 6.0, why: 'busy' },
];
const SPLIT_AT = T.share + 7.2;   // the shared chip becomes two

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
// The controller is waiting (not acting) at time t.
function stalledAt(t) {
  for (const s of STALLS) {
    const active = (s.why === 'slow' && t > ACT && t < ACT_END) || (s.why === 'busy' && t < SPLIT_AT && t > T.share);
    if (active && t >= s.s && t < s.e) return s;
  }
  return null;
}
// The histogram of answer times the think scene builds: the same law as the plans.
const HIST = (() => {
  const r = seeded(77), bins = new Array(9).fill(0), order = [];
  for (let i = 0; i < 64; i++) {
    const slow = r() < 0.3, d = slow ? 2.0 + r() * 1.4 : 0.45 + r() * 0.45;
    const k = Math.min(8, Math.floor((d - 0.4) / 0.34));
    order.push(k);
  }
  return { bins, order };
})();

/* ---------------------------------------------------------------- world
   Floor at y 0; the arm's base on the left, the conveyor of beats running to
   its right along z ZC, the model above and behind. */
const XA = -1.7, ZC = 0.45;
const SH = V(XA, 0.62, ZC);                 // the arm's shoulder
const L1 = 1.05, L2 = 0.92;
const PICK = V(XA + 1.25, 0.08, ZC);        // where a beat's tile is picked
const SPEED = 0.62;                         // conveyor, per second of film
const HUB = V(XA, 0.14, ZC);                // the controller, in the arm's base
const O1 = V(1.3, 1.62, -0.85), O2 = V(3.1, 1.3, -1.45);   // the model: above the line, then on its own pedestal
const MB = V(0.55, 1.12, -0.25);            // the mailbox plans are left in
const CUR = XA + 1.95;                      // the light curtain's x
const objAt = t => V(XA + 0.75 + 0.42 * Math.sin(t * 0.85), 0.62 + 0.16 * Math.sin(t * 1.6 + 0.6), ZC);
const modelAt = t => O1.clone().lerp(O2, ease.inOutCubic(ramp(t, T.split + 0.4, T.split + 3.2)));

// camera keys: one place per scene, moved between with an ease
const KEYS = [
  [T.hook - 3, V(0.55, 1.5, 6.6), V(-0.05, 0.95, -0.1)],
  [T.beat, V(2.6, 2.6, 7.6), V(1.1, 0.45, -0.1)],
  [T.think, V(2.4, 2.35, 5.6), V(1.6, 1.45, -0.9)],
  [T.wait, V(0.75, 1.95, 6.9), V(-0.25, 0.85, -0.1)],
  [T.split, V(1.45, 2.4, 8.0), V(0.75, 0.95, -0.6)],
  [T.stale, V(-0.1, 1.35, 5.1), V(-0.65, 0.8, 0.05)],
  [T.contract, V(0.75, 1.55, 4.5), V(0.25, 1.05, -0.3)],
  [T.limits, V(-2.0, 1.85, 5.4), V(-0.55, 0.7, 0.1)],
  [T.share, V(1.15, 6.0, 7.4), V(0.9, 0.3, -0.5)],
  [T.close, V(0.9, 3.2, 11.5), V(0.7, 0.6, -0.45)],
];
function cameraAt(t) {
  let i = 0;
  while (i < KEYS.length - 1 && t >= KEYS[i + 1][0]) i++;
  const [, p0, l0] = KEYS[Math.max(0, i - 1)], [t1, p1, l1] = KEYS[i];
  const u = i === 0 ? 1 : ease.inOutCubic(ramp(t, t1, t1 + 2.6));
  return { pos: p0.clone().lerp(p1, u), look: l0.clone().lerp(l1, u) };
}

/* ----------------------------------------------------------------- film */
const film = {
  title: 'AI meets the deadline',
  aspect: '16x9',
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  // the opening and closing lines are already on screen in large type
  captions: TL ? captionsFromTimeline(TL, 42, ['hook', 'close']) : null,
  build(ctx) {
    const { scene, camera, text, label } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    camera.fov = 34;
    camera.updateProjectionMatrix();
    ctx.setViewShift(0.2, -0.04);
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
    const railA = add(fatLine(COL.tile, 1.6)), railB = add(fatLine(COL.tile, 1.6));
    setLinePoints(railA, [V(PICK.x - 0.4, 0.01, ZC - 0.2), V(PICK.x + 14, 0.01, ZC - 0.2)]);
    setLinePoints(railB, [V(PICK.x - 0.4, 0.01, ZC + 0.2), V(PICK.x + 14, 0.01, ZC + 0.2)]);
    const NT = 34, tileGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.24, 0.05, 0.3)), faceGeo = new THREE.PlaneGeometry(0.24, 0.3);
    const tiles = [];
    for (let i = 0; i < NT; i++) {
      const g = new THREE.Group();
      const edge = new THREE.LineSegments(tileGeo, lineMat(COL.tile));
      const face = new THREE.Mesh(faceGeo, glow(COL.tile)); face.rotation.x = -Math.PI / 2; face.position.y = 0.026;
      g.add(edge, face); add(g); tiles.push({ g, edge, face });
    }

    /* the arm: base, two links, a gripper, the controller hub inside the base */
    const base = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.3, 0.38, 0.22, 6)), lineMat(COL.arm)));
    base.position.set(XA, 0.11, ZC);
    const col = add(fatLine(COL.arm, 3.2)), link1 = add(fatLine(COL.arm, 3.6)), link2 = add(fatLine(COL.arm, 3.0));
    const fingA = add(fatLine(COL.arm, 2.4)), fingB = add(fatLine(COL.arm, 2.4));
    const joint = r => add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12), mat(RIM, { uColor: COL.arm.clone(), uAlpha: 0, uPow: 1.3 })));
    const jS = joint(0.09), jE = joint(0.075), jW = joint(0.06);
    const hub = joint(0.12); hub.position.copy(HUB);

    /* the object the arm works on, and the ghost of where a plan saw it */
    const obj = add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), mat(RIM, { uColor: HDR(2.4, 2.2, 1.4), uAlpha: 0, uPow: 1.1 })));
    const ghost = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.11, 1)), lineMat(COL.safe)));
    const gap = add(fatLine(COL.safe, 2.0, [0.06, 0.05]));

    /* the model, the series' body */
    const model = new THREE.Group();
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)), lineMat(COL.model, 0));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: COL.model.clone(), uAlpha: 0, uPow: 1.6 }));
    model.add(shell, core); model.scale.setScalar(0.55); add(model);
    const pedestal = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.42, 0.5, 0.9, 6)), lineMat(COL.slab)));
    pedestal.position.set(O2.x, 0.45, O2.z);

    /* the think scene: answer times rising as columns behind the model */
    const bars = [];
    for (let k = 0; k < 9; k++) {
      const g = new THREE.Group();
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.2, 1, 0.2)), lineMat(k >= 5 ? COL.safe : COL.plan));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1), glow(k >= 5 ? COL.safe : COL.plan));
      g.add(edge, face); g.position.set(0.15 + k * 0.33, 0, -1.55); add(g); bars.push({ g, edge, face });
    }
    const axis = add(fatLine(COL.floor, 1.4));
    setLinePoints(axis, [V(-0.05, 0.005, -1.4), V(3.15, 0.005, -1.4)]);

    /* the waiting path, the stack of missed beats is drawn by the tiles */
    const tether = add(fatLine(HDR(1.4, 1.8, 2.4), 2.2));

    /* the mailbox, its age ring and the feed to the controller */
    const box = add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.3, 0.3, 0.3)), lineMat(COL.plan)));
    box.position.copy(MB);
    const ageRing = add(fatLine(COL.ok, 3.0));
    const feed = add(fatLine(HDR(1.2, 1.6, 2.2), 1.6, [0.08, 0.07]));
    setLinePoints(feed, [MB, V(MB.x - 0.9, 0.6, 0.15), HUB.clone().add(V(0, 0.15, 0))]);

    /* the light curtain on what the arm may do */
    const curtain = add(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.7), glow(COL.safe)));
    curtain.rotation.y = Math.PI / 2; curtain.position.set(CUR, 0.85, ZC);
    const curtainEdge = add(fatLine(COL.safe, 2.4));
    setLinePoints(curtainEdge, [V(CUR, 0, ZC - 0.8), V(CUR, 1.7, ZC - 0.8), V(CUR, 1.7, ZC + 0.8), V(CUR, 0, ZC + 0.8), V(CUR, 0, ZC - 0.8)]);

    /* one chip under everything, then two */
    const slabGeo = (w, d) => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.16, d));
    const slab = add(new THREE.LineSegments(slabGeo(7.0, 3.6), lineMat(COL.slab)));
    slab.position.set(0.75, -0.1, -0.45);
    const slabFace = add(new THREE.Mesh(new THREE.PlaneGeometry(7.0, 3.6), glow(COL.slab)));
    slabFace.rotation.x = -Math.PI / 2; slabFace.position.set(0.75, -0.015, -0.45);
    const slabA = add(new THREE.LineSegments(slabGeo(3.9, 3.6), lineMat(COL.slab)));
    const slabB = add(new THREE.LineSegments(slabGeo(2.4, 2.4), lineMat(COL.slab)));

    /* sparks: plans in flight, and the shards of one that hit the curtain */
    const SN = PLANS.length + 1, BN = 10;
    const spos = new Float32Array((SN + BN) * 3), sa = new Float32Array(SN + BN), sc = new Float32Array((SN + BN) * 3);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1));
    sg.setAttribute('aC', new THREE.BufferAttribute(sc, 3));
    const sparks = add(new THREE.Points(sg, mat(SPARK, { uPR: 1, uSize: 7 })));
    sparks.frustumCulled = false;

    Object.assign(ctx, { dust, grid, railA, railB, tiles, base, col, link1, link2, fingA, fingB, jS, jE, jW, hub, obj, ghost, gap,
                         model, shell, core, pedestal, bars, axis, tether, box, ageRing, feed, curtain, curtainEdge,
                         slab, slabFace, slabA, slabB, sparks, spos, sa, sc, SN, BN });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 820 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1000, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.88) 0%, rgba(3,5,10,.62) 60%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 56% 50% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.beat - gone, cls: 'blk', place: HD,
           html: '<div class="hd">An AI can plan a robot&rsquo;s next move.</div><div class="sb">But what if the answer arrives <span class="red">after</span> the moment it was needed?</div>' });
    say(T.beat, T.think - gone, 'A machine that moves runs on a <em>beat</em>.',
        'Many times a second, its controller has to act. Not usually. <b>Every time.</b>');
    say(T.think, T.wait - gone, 'An AI model keeps a <em>different clock</em>.',
        'Most answers come back quickly. Some take far longer, and nobody can say in advance which.');
    say(T.wait, T.split - gone, 'Make the controller <span class="red">wait</span>, and it misses its beat.',
        'One slow answer costs it a beat. Then the next. The delay spills into everything queued behind it.');
    say(T.split, T.stale - gone, 'Take the model out of the <em>waiting path</em>.',
        'The controller keeps its beat whatever happens. The model works beside it and leaves its newest plan.');
    say(T.stale, T.contract - gone, 'That changes how things <span class="amber">fail</span>.',
        'Every beat is now on time, but a plan can describe a world that has already moved on.');
    say(T.contract, T.limits - gone, 'Every plan carries the moment it was <em>made</em>.',
        'If it is too old, the controller sets it aside and falls back to a <span class="amber">safe default</span>.');
    say(T.limits, T.share - gone, 'Age is only <em>one check</em>.',
        'A fresh plan can still be wrong, so the limits on what the machine may do keep their own guard.');
    say(T.share, T.close - 0.25, 'One trap remains: a <span class="red">shared</span> computer.',
        'A busy model can still steal the controller&rsquo;s time. Keep them apart, and test it under load.');
    // said once at the start of the argument, and again on the card
    text({ at: T.beat + 1.2, out: T.think + 6, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 790, w: 820 },
           html: 'An open research direction of Dr. Ozgur Ural, not yet published.<span>Every beat and plan here is drawn from a synthetic schedule, not measured.</span>' });
    text({ at: T.split + 4.5, out: T.close - 0.3, cls: 'key', words: false, dur: 0.6, place: { x: 1080, y: 1000, w: 760 },
           html: '<span><i style="background:#5dffc8"></i>on time</span><span><i style="background:#ffb347"></i>safe default</span><span><i style="background:#ff6272"></i>missed</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 330, w: 1400, align: 'center' },
           html: 'Better AI will keep arriving.' });
    text({ at: T.close + 2.4, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 420, w: 1400, align: 'center' },
           html: 'Can the system take it in <em>without losing its beat</em>?' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">AI meets the deadline</div>
                  <div class="end__s">Keep the model out of the waiting path, check how old each plan is, guard the limits separately, and keep the computers apart.</div>
                  <div class="end__a">An open research direction of Dr. Ozgur Ural &middot; not yet published</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* --------------------------------------------------------- labels */
    const at = v => () => v;
    label({ cls: 'chip', html: 'the controller', anchor: at(V(XA, -0.12, ZC + 0.3)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.beat + 0.8, T.think, 0.6, 0.6) });
    label({ cls: 'chip', html: 'the AI model', anchor: () => modelAt(0).clone().add(V(0, 0.62, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, 0.6, T.think + 3, 0.6, 0.6) });
    label({ cls: 'chip', html: 'one beat, one deadline', anchor: at(V(PICK.x + 1.9, 0.02, ZC + 0.35)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.beat + 2.5, T.think - 0.3, 0.6, 0.5) });
    label({ cls: 'stamp red', html: 'TOO LATE', anchor: at(V(XA + 0.55, 1.65, ZC)), ax: 0.5, ay: 1,
            alpha: t => win(t, 4.45, 7.8, 0.3, 0.5) });
    label({ cls: 'chip', html: 'answer time', anchor: at(V(1.5, 0.0, -1.2)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.think + 1.2, T.wait - 0.2, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'the slow tail', anchor: at(V(2.3, 1.15, -1.55)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.think + 5.0, T.wait - 0.2, 0.6, 0.5) });
    label({ cls: 'stamp red', html: 'WAITING', anchor: at(V(XA + 0.15, -0.1, ZC + 0.45)), ax: 0.5, ay: 0,
            alpha: t => (stalledAt(t) && t < ACT_END ? 1 : 0) * win(t, T.wait, T.split, 0.2, 0.3) });
    label({ cls: 'chip', html: 'newest plan', anchor: at(V(MB.x, MB.y - 0.3, MB.z)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.split + 3.0, T.stale, 0.6, 0.6) });
    label({ cls: 'chip amber', html: 'what the plan saw', anchor: () => objAt(lastPlanSeen(T.stale + 4)).add(V(0, 0.24, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.stale + 2.5, T.contract - 0.2, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'too old: safe default', anchor: at(V(MB.x, MB.y - 0.42, MB.z)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.contract + 3.2, T.limits - 0.2, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'outside the limits', anchor: at(V(CUR, 1.95, ZC)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.limits + 3.0, T.share - 0.2, 0.6, 0.5) });
    label({ cls: 'chip', html: 'one computer', anchor: at(V(0.75, -0.2, 1.4)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.share + 1.6, SPLIT_AT - 0.2, 0.6, 0.4) });
    label({ cls: 'chip teal', html: 'kept apart', anchor: at(V(0.75, -0.2, 1.4)), ax: 0.5, ay: 0,
            alpha: t => win(t, SPLIT_AT + 0.6, T.close - 0.2, 0.6, 0.5) });
  },

  frame(t, ctx) {
    const { camera, grade } = ctx;
    const pr = ctx.renderer.getPixelRatio();

    /* camera: a place for each scene, a slow drift within it */
    const cam = cameraAt(t);
    camera.position.copy(cam.pos).add(V(0.05 * Math.sin(t * 0.13), 0.03 * Math.sin(t * 0.11), 0));
    camera.lookAt(cam.look);

    const show = win(t, -1, T.card + 0.4, 0.8, 0.8) * (1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0)));
    ctx.grid.material.opacity = 0.16 * show;
    const stall = stalledAt(t);

    /* the conveyor: tile for beat b is at the pick point on its deadline */
    const railA = 0.5 * show;
    ctx.railA.material.opacity = railA; ctx.railB.material.opacity = railA;
    const first = Math.floor((t - 2.5) / P), last = first + ctx.tiles.length - 1;
    // the stack: missed beats of the current stall pile at the pick point
    let stackN = 0;
    for (let i = 0; i < ctx.tiles.length; i++) {
      const { g, edge, face } = ctx.tiles[i];
      const k = first + i, b = k * P;
      const st = status(b);
      const c = st === 1 ? COL.late : st === 2 ? COL.safe : COL.ok;
      let x = PICK.x + (b - t) * SPEED, y = 0.03, a = 0, colr = COL.tile, s = 1;
      if (b > t) {                                   // still coming
        a = 0.85 * (1 - ramp(x, PICK.x + 5.5, PICK.x + 8.5));
      } else {
        const st0 = inStall(b);
        const blocking = st === 1 && st0 && (t < st0.e + SPILL * P + 0.4);
        if (blocking) {                              // waiting at the arm, red, piled
          x = PICK.x + 0.02; y = 0.03 + stackN * 0.065; stackN++;
          a = 1; colr = COL.late;
        } else {
          const since = t - Math.max(b, st0 ? st0.e + SPILL * P : b);
          colr = c;
          a = Math.max(0, 1 - since / 0.55);
          if (st === 1 && !st0) { x = PICK.x + (b - t) * SPEED; a = Math.max(0, 1 - (t - b) / 1.6); }   // the hook's missed beat slides on
          else { x = PICK.x - Math.min(since, 0.5) * 0.35; y = 0.03 + 0.25 * Math.min(1, since / 0.5); s = 1 - 0.6 * Math.min(1, since / 0.5); }
        }
      }
      g.position.set(x, y, ZC); g.scale.setScalar(s);
      edge.material.color.copy(colr); face.material.color.copy(colr);
      edge.material.opacity = a * show; face.material.opacity = 0.35 * a * show;
    }

    /* the arm: reaches the pick point each beat it acts on, holds still while it waits */
    const lastBeat = Math.floor(t / P) * P;
    const acted = !stall && status(lastBeat) !== 1;
    const kick = acted ? Math.exp(-(t - lastBeat) / 0.16) : 0;
    const safe = status(lastBeat) === 2;
    let target = PICK.clone().add(V(-0.05, 0.22 - 0.16 * kick * (safe ? 0.5 : 1), 0));
    let grip = 0.5 + 0.5 * (1 - kick);
    // the hook: reach for the moving object where the late plan said it was
    if (t < T.beat + 0.5) {
      const reach = ease.inOutSine(ramp(t, 2.6, 4.4)) * (1 - ease.inOutSine(ramp(t, 6.4, T.beat + 0.5)));
      target = target.lerp(V(XA + 0.7, 0.75, ZC), reach);
      grip = t > 4.4 && t < 6.6 ? 0.08 : 1;
    }
    // the limits scene: a bad plan pushes the hand toward the curtain, which stops it
    if (stall) {           // frozen where it was when the wait began
      target = PICK.clone().add(V(-0.05, 0.22, 0));
      grip = 1;
    }
    const d = Math.min(L1 + L2 - 0.02, Math.max(0.3, target.distanceTo(SH)));
    const aT = Math.atan2(target.y - SH.y, target.x - SH.x);
    const cB = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
    const E = V(SH.x + L1 * Math.cos(aT + cB), SH.y + L1 * Math.sin(aT + cB), ZC);
    const W = V(SH.x + d * Math.cos(aT), SH.y + d * Math.sin(aT), ZC);
    const dir = W.clone().sub(E).normalize(), nrm = V(-dir.y, dir.x, 0);
    const fl = 0.2, open = 0.06 + 0.1 * grip;
    setLinePoints(ctx.col, [V(XA, 0.22, ZC), SH]);
    setLinePoints(ctx.link1, [SH, E]);
    setLinePoints(ctx.link2, [E, W]);
    setLinePoints(ctx.fingA, [W, W.clone().add(dir.clone().multiplyScalar(fl)).add(nrm.clone().multiplyScalar(open))]);
    setLinePoints(ctx.fingB, [W, W.clone().add(dir.clone().multiplyScalar(fl)).add(nrm.clone().multiplyScalar(-open))]);
    const armA = 0.95 * show;
    const armCol = stall ? COL.late : COL.arm;
    for (const l of [ctx.col, ctx.link1, ctx.link2, ctx.fingA, ctx.fingB]) { l.material.opacity = armA; l.material.color.copy(armCol); }
    ctx.base.material.opacity = 0.7 * show;
    ctx.jS.position.copy(SH); ctx.jE.position.copy(E); ctx.jW.position.copy(W);
    for (const j of [ctx.jS, ctx.jE, ctx.jW]) j.material.uniforms.uAlpha.value = 1.2 * show;
    ctx.hub.material.uniforms.uColor.value.copy(stall ? COL.late : HDR(1.2, 2.0, 2.8));
    ctx.hub.material.uniforms.uAlpha.value = (stall ? 1.6 + 0.3 * Math.sin(t * 9) : 1.0) * show;

    /* the object: drifts through the arm's reach; the hook's passes before the plan lands */
    const objIn = win(t, -1, T.beat + 0.6, 0.4, 0.6) + win(t, T.stale + 0.4, T.limits + 0.4, 0.8, 0.6);
    let op = objAt(t);
    if (t < T.beat + 0.6) op = V(lerp(XA + 3.2, XA - 0.8, ease.inOutSine(ramp(t, 0.4, 7.4))), 0.78, ZC);
    ctx.obj.position.copy(op);
    ctx.obj.rotation.set(t * 0.7, t * 0.9, 0);
    ctx.obj.material.uniforms.uAlpha.value = 1.3 * Math.min(1, objIn) * show;
    // the ghost of the world the newest plan saw, and the gap to the world as it is
    const ghostIn = win(t, T.stale + 1.2, T.contract + 0.5, 0.6, 0.6) * show;
    const seenAt = lastPlanSeen(t);
    const gp = objAt(seenAt);
    ctx.ghost.position.copy(gp); ctx.ghost.rotation.set(seenAt * 0.7, seenAt * 0.9, 0);
    ctx.ghost.material.opacity = 0.9 * ghostIn;
    setLinePoints(ctx.gap, [gp, op]);
    ctx.gap.material.opacity = 0.8 * ghostIn;

    /* the model: above the line, then moved to its own pedestal */
    const mp = modelAt(t);
    let busy = 0;
    for (const p of PLANS) busy = Math.max(busy, win(t, p.e, p.a, 0.15, 0.2));
    const hog = stall && stall.why === 'busy' ? 1 : 0;
    ctx.model.position.copy(mp);
    ctx.model.rotation.set(0.35 + 0.05 * Math.sin(t * 0.3), t * 0.22, 0.08);
    ctx.model.scale.setScalar(0.55 * (1 + 0.2 * hog));
    ctx.shell.material.opacity = (0.55 + 0.35 * busy) * show;
    ctx.core.material.uniforms.uAlpha.value = (0.7 + 0.5 * busy + 1.1 * hog) * show;
    ctx.pedestal.material.opacity = 0.55 * win(t, T.split + 1.8, T.close - 0.2, 0.9, 0.6) * show;

    /* the histogram: one sample lands per beat of the think scene */
    const nIn = Math.floor(ramp(t, T.think + 0.8, T.think + 7.5) * HIST.order.length);
    const counts = new Array(9).fill(0);
    for (let i = 0; i < nIn; i++) counts[HIST.order[i]]++;
    const hIn = win(t, T.think + 0.3, T.wait + 0.4, 0.6, 0.8) * show;
    for (let k = 0; k < 9; k++) {
      const h = Math.max(0.001, counts[k] * 0.085);
      const { g, edge, face } = ctx.bars[k];
      g.scale.set(1, h, 1); g.position.y = h / 2;
      edge.material.opacity = 0.9 * hIn; face.material.opacity = 0.3 * hIn;
    }
    ctx.axis.material.opacity = 0.7 * hIn;

    /* the waiting path */
    setLinePoints(ctx.tether, [mp.clone().add(V(0, -0.35, 0)), V(mp.x - 1.2, 1.3, 0.1), HUB.clone().add(V(0, 0.12, 0))]);
    ctx.tether.material.opacity = 0.75 * win(t, ACT - 0.6, ACT_END, 0.6, 0.5) * show;
    ctx.tether.material.color.copy(stall && t < ACT_END ? COL.late : HDR(1.4, 1.8, 2.4));

    /* the mailbox, the age of its newest plan, the feed */
    const asyncOn = win(t, T.split + 0.6, T.close - 0.2, 0.8, 0.6) * show;
    const np = newestBy(t);
    const age = np ? t - np.e : 99;
    const fresh = Math.max(0, 1 - age / AGE);
    const tooOld = t > T.contract && fresh <= 0;
    ctx.box.rotation.set(0.5 + t * 0.15, 0.6 + t * 0.25, 0);
    ctx.box.material.color.copy(tooOld ? COL.safe : COL.plan);
    ctx.box.material.opacity = 0.9 * asyncOn;
    ctx.feed.material.opacity = 0.45 * asyncOn;
    const ringIn = win(t, T.contract + 0.4, T.share, 0.6, 0.6) * show;
    const rp = [], R0 = 0.34, n = Math.max(2, Math.round(48 * fresh));
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 - (i / 48) * Math.PI * 2; rp.push(V(MB.x + R0 * Math.cos(a), MB.y + R0 * Math.sin(a), MB.z + 0.2)); }
    setLinePoints(ctx.ageRing, rp);
    ctx.ageRing.material.color.copy(COL.ok).lerp(COL.safe, 1 - fresh);
    ctx.ageRing.material.opacity = (fresh > 0 ? 0.95 : 0) * ringIn;

    /* the curtain */
    const curIn = win(t, T.limits + 0.6, T.share + 0.8, 0.7, 0.6) * show;
    let hitFlash = 0;
    for (const p of PLANS) if (p.bad && t > T.limits + 2.0) hitFlash = Math.max(hitFlash, win(t, p.a + 0.45, p.a + 0.95, 0.05, 0.4));
    ctx.curtain.material.opacity = (0.07 + 0.25 * hitFlash) * curIn;
    ctx.curtain.material.color.copy(COL.safe).lerp(COL.late, hitFlash);
    ctx.curtainEdge.material.opacity = 0.9 * curIn;

    /* sparks: plans fly from the model to the controller (blocking) or the mailbox */
    const { spos, sa, sc } = ctx;
    for (let j = 0; j < ctx.SN + ctx.BN; j++) sa[j] = 0;
    for (let j = 0; j < PLANS.length; j++) {
      const p = PLANS[j];
      if (t < T.think || t > T.close - 0.2 || t < p.e || t > p.a + 1.1) continue;
      const from = modelAt(p.e);
      const to = p.async ? MB : HUB.clone().add(V(0, 0.15, 0));
      let x, y, z, a = 1, c = COL.plan;
      if (t < p.a) {
        const u = ease.inOutSine(ramp(t, p.e, p.a));
        x = lerp(from.x, to.x, u); y = lerp(from.y, to.y, u) + 0.4 * Math.sin(Math.PI * u); z = lerp(from.z, to.z, u);
        a = Math.min(1, ramp(t, p.e, p.e + 0.15));
      } else if (p.bad && t > T.limits + 2.0) {
        // a plan outside the limits leaves the mailbox for the arm and stops at the curtain
        const u = ramp(t, p.a, p.a + 0.45);
        x = lerp(MB.x, CUR + 0.02, u); y = lerp(MB.y, 0.9, u); z = lerp(MB.z, ZC, u);
        a = 1 - ramp(t, p.a + 0.45, p.a + 0.6); c = COL.late;
        if (t > p.a + 0.45) {      // shards
          const v = ramp(t, p.a + 0.45, p.a + 1.1);
          for (let s = 0; s < ctx.BN; s++) {
            const k = ctx.SN + s, ang = (s / ctx.BN) * Math.PI * 2;
            spos[k * 3] = CUR + 0.05 + 0.25 * v; spos[k * 3 + 1] = 0.9 + 0.35 * v * Math.sin(ang) - 0.6 * v * v; spos[k * 3 + 2] = ZC + 0.35 * v * Math.cos(ang);
            sa[k] = (1 - v) * show; sc[k * 3] = COL.late.r; sc[k * 3 + 1] = COL.late.g; sc[k * 3 + 2] = COL.late.b;
          }
        }
      } else {
        x = to.x; y = to.y; z = to.z; a = 1 - ramp(t, p.a, p.a + 0.3);
      }
      spos[j * 3] = x; spos[j * 3 + 1] = y; spos[j * 3 + 2] = z;
      sa[j] = a * show; sc[j * 3] = c.r; sc[j * 3 + 1] = c.g; sc[j * 3 + 2] = c.b;
    }
    // the hook's late plan: it lands where the object was, after the object has gone
    {
      const j = PLANS.length, u = ease.inOutSine(ramp(t, 1.2, 4.4));
      const from = modelAt(0), to = V(XA + 0.7, 0.75, ZC);
      spos[j * 3] = lerp(from.x, to.x, u); spos[j * 3 + 1] = lerp(from.y, to.y, u) + 0.45 * Math.sin(Math.PI * u); spos[j * 3 + 2] = lerp(from.z, to.z, u);
      sa[j] = win(t, 1.2, 4.9, 0.25, 0.5) * show;
      sc[j * 3] = COL.plan.r; sc[j * 3 + 1] = COL.plan.g; sc[j * 3 + 2] = COL.plan.b;
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
    ctx.slabFace.material.opacity = (0.05 + 0.11 * hog) * one;
    ctx.slabFace.material.color.copy(COL.slab).lerp(COL.late, hog);
    ctx.slabA.position.set(lerp(-0.4, -0.95, part), -0.1, -0.45);
    ctx.slabB.position.set(lerp(2.75, 3.55, part), -0.1, lerp(-0.45, -1.45, part));
    ctx.slabA.material.opacity = 0.55 * two;
    ctx.slabB.material.opacity = 0.55 * two;

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
