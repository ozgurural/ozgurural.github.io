/*
 * Determinism at 60 Hz: what "hard real time" costs in a Level D
 * full-flight simulator, in about two minutes.
 *
 * It replaces the lab film of the same name and keeps its argument, scene for
 * scene (scripts/narration.json, prefix "level-d"): transport delay is a
 * regulated ceiling, from a pilot's control input to the motion, visual or
 * instrument response (FAA 14 CFR Part 60, EASA CS-FSTD(A): 150 ms at Level
 * C/D); every stage spends it and image generation takes the largest share;
 * EASA's CS-FSTD Issue 1 (ED Decision 2026/008/R, Subpart D test 6.a.1, p. 467)
 * sets 100 ms for new devices at fidelity level S, motion, instruments and
 * visual alike, so a chain that clears 150 can miss 100; the simulator runs
 * on a fixed beat and a deadline is never met on average; a session is a
 * long run of frames, rare failures recur, and they cluster; a rack of hosts
 * feeds one frame, which ends when the last host reports, so one straggler
 * makes the frame late and budgets are enforced per host; and none of it is
 * real unless it is instrumented while the session runs, since sampled step
 * time misses a spike that an overrun counter does not.
 *
 * No numbers are printed or spoken (see CLAUDE.md, cinema films): the limit
 * is drawn as a gate the pulse has to beat, the session as a ribbon of
 * frames, and the stage times are drawn to the old film's illustrative budget
 * (8, 17, 25, 50 and 34 ms), so the new limit falls exactly where image
 * generation ends. No employer design is shown: the rig is the generic
 * six-actuator motion platform every full-flight simulator stands on, and the
 * rack is the generic multi-host layout.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, gate: 7.5, stages: 19, tighter: 28, beat: 37, session: 47, cluster: 58, rack: 66, straggler: 77, measure: 88, close: 98, card: 107 };
const D = 113;

const TL_DIR = new URL('../../audio/cinema/level-d/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`level-d: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
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
const HDR = (r, g, b, k = 1) => new THREE.Color(r * k, g * k, b * k);
const COL = {
  rig: HDR(1.3, 1.6, 2.2, 0.8),
  track: HDR(0.35, 0.6, 1.0, 0.5),
  stage: [HDR(0.4, 1.9, 2.4), HDR(0.45, 1.5, 2.6), HDR(0.4, 2.0, 1.5), HDR(1.5, 0.9, 2.6), HDR(2.5, 1.4, 0.4)],
  head: HDR(2.2, 2.6, 3.0, 1.1),
  ok: HDR(0.4, 2.0, 1.5, 1.0),
  late: HDR(2.6, 0.45, 0.5, 1.15),
  amber: HDR(2.5, 1.35, 0.35, 1.05),
  gate: HDR(1.6, 2.2, 2.8, 1.0),
  bg: new THREE.Color(0x03050a),
};
const STAGES = ['control loading', 'flight model', 'aircraft systems', 'image generator', 'display &amp; motion'];
const MS = [8, 17, 25, 50, 34];                       // the old film's illustrative stage budget
const CUM = MS.reduce((a, m) => (a.push(a[a.length - 1] + m), a), [0]);   // 0, 8, 25, 50, 100, 134
const TOTAL = CUM[CUM.length - 1];
const LIMIT = 150, NEW_LIMIT = 100;

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
    attribute float aSeed; uniform float uTime; uniform float uPR; uniform vec3 uKeepOut; varying float vA;
    void main() {
      vec3 p = position;
      p.y += sin(uTime * 0.21 + aSeed * 6.283) * 0.35;
      p.x += sin(uTime * 0.13 + aSeed * 11.0) * 0.5 + uTime * 0.04;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (0.9 + aSeed * 1.6) * uPR * (60.0 / -mv.z);
      vA = (0.35 + 0.65 * fract(aSeed * 7.1)) * (0.6 + 0.4 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0));
      gl_Position = projectionMatrix * mv;
      vec2 ndc = gl_Position.xy / gl_Position.w;
      vA *= 1.0 - smoothstep(uKeepOut.z - 0.25, uKeepOut.z, dot(ndc, uKeepOut.xy));
    }`,
  fragmentShader: /* glsl */`
    uniform float uAlpha; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d) * vA * uAlpha;
      gl_FragColor = vec4(vec3(0.55, 0.75, 1.0) * a, 1.0);
    }`,
};
// points with their own colour and brightness
const SPARK = {
  vertexShader: /* glsl */`
    attribute float aA; attribute vec3 aC; uniform float uPR; uniform float uSize;
    varying float vA; varying vec3 vC;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * uPR * (40.0 / -mv.z) * (0.6 + 0.4 * aA);
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
const basicMat = color => new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 0,
  blending: THREE.AdditiveBlending, depthWrite: false });

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
               background: rgba(6,12,24,.8); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.red { border-color: rgba(255,98,114,.75); color: #ff8a96; }
  .cin .chip.amber { border-color: rgba(255,179,71,.75); color: #ffc477; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px; white-space: nowrap;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.75); }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .meter { padding: 22px 26px 18px; border-radius: 16px; background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.2); }
  .cin .meter__t { font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 16px; display: flex; justify-content: space-between; }
  .cin .meter svg { display: block; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .cl__c { font: 500 40px/1.3 "Inter", sans-serif; color: #9fd8ff; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 980px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ------------------------------------------------------------- the chain
   A pulse is one control input travelling the chain. Its head sits at the
   milliseconds it has spent so far; RATE is how many of those milliseconds
   one film second shows, so the slow scenes are slow motion of the same
   chain, not a different one. */
const SC = 3.6 / LIMIT;                    // world units per millisecond
const X0 = -1.1, TY = -0.62;               // where the chain starts, its height
const xAt = ms => X0 + ms * SC;
// [start, rate (ms per film second), extra ms the image generator took]
const PULSES = [
  [0.4, 110, 0], [2.0, 110, 0], [3.5, 110, 42], [5.5, 110, 0],
  [8.4, 110, 0], [10.3, 110, 0], [12.2, 110, 0], [14.6, 110, 34], [16.8, 110, 0],
  [19.6, 30, 0],                           // the slow walk through the stages
  [30.8, 55, 0],                           // the same chain against the new gate
];
const stageMs = (p, k) => MS[k] + (k === 3 ? p[2] : 0);
const pulseTotal = p => MS.reduce((a, m, k) => a + stageMs(p, k), 0);
function pulseMs(p, t) { return Math.max(0, Math.min(pulseTotal(p), (t - p[0]) * p[1])); }
function stageOf(p, ms) { let acc = 0; for (let k = 0; k < 5; k++) { acc += stageMs(p, k); if (ms <= acc) return k; } return 4; }
// where the gate stands: the limit, then the new one sliding in
const gateMs = t => lerp(LIMIT, NEW_LIMIT, ease.inOutCubic(ramp(t, T.tighter + 0.6, T.tighter + 2.6)));

/* ------------------------------------------------------------ the session
   A ribbon of frames receding into depth. Its red frames are a seeded rare
   few, first scattered and then gathered into bursts: the same count, worse
   for the pilot because a burst is a longer stutter. */
const RN = 6000;
const rr = seeded(60);
const SCATTER = [], BURST = [];
for (let i = 0; i < 18; i++) SCATTER.push(Math.floor(rr() * RN));
for (let b = 0; b < 4; b++) { const c = 600 + Math.floor(rr() * (RN - 1200)); for (let j = 0; j < 5; j++) BURST.push(c + j * 3); }
BURST.length = SCATTER.length;
// The session is a floor of frames running away to the horizon, one tile a
// frame, in time order row by row away from the camera. A strip read as a
// column of light from any angle that kept the type clear; a floor reads as
// many, which is the point, and a red tile on it stays a single tile.
const FW = 60, FR = RN / FW;
function ribbonAt(u, out) {
  const i = Math.min(RN - 1, Math.floor(u * RN)), c = i % FW, r = Math.floor(i / FW);
  out.set(-0.6 + 3.55 * (c / (FW - 1)), -1.25, 0.6 - 0.48 * r);
  return out;
}

/* -------------------------------------------------------------- the rack
   Nine hosts, one frame each cycle. A bar grows while its host works and
   stops when it is done; the frame closes when the last bar stops. Host 6 is
   the straggler on some frames. Cycles are slowed down so a frame can be
   watched, which is the only liberty taken. */
const HOSTS = 9, CYC = 2.2, GROW = 1.5;
const RX = 0.15, RL = 2.0, RY0 = 1.15, RDY = 0.29;    // left edge, budget length, top row, spacing
const hr = seeded(9);
const FINISH = [];                                   // FINISH[frame][host], fraction of the budget
for (let f = 0; f < 40; f++) {
  const row = [];
  for (let h = 0; h < HOSTS; h++) row.push(0.42 + hr() * 0.4);
  // the straggler appears only once the narration names it, then on every other frame
  const start = T.rack + 0.8 + f * CYC;
  if (start >= T.straggler - 0.4 && f % 2 === 0) row[6] = 1.18 + hr() * 0.12;
  FINISH.push(row);
}
const rackFrame = t => Math.max(0, Math.floor((t - T.rack - 0.8) / CYC));
const rackPhase = t => ((t - T.rack - 0.8) % CYC + CYC) % CYC;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'Determinism at 60 Hz',
  aspect: '16x9',
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  build(ctx) {
    const { scene, camera, text, label } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    camera.fov = 33;
    camera.updateProjectionMatrix();
    ctx.setViewShift(0.2, -0.04);
    scene.background = COL.bg;

    /* dust, for depth */
    const dr = seeded(11);
    const DN = 1000, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (dr() - 0.5) * 40; dp[i * 3 + 1] = (dr() - 0.5) * 22; dp[i * 3 + 2] = -14 + dr() * 20;
      ds[i] = dr();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.7, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the rig: a cabin on a six-actuator motion platform, drawn in edges */
    const rig = new THREE.Group();
    rig.position.set(1.32, 0.92, -0.4);
    rig.scale.setScalar(0.74);
    scene.add(rig);
    const BASE = [], TOP = [];
    for (let k = 0; k < 3; k++) {
      for (const s of [-1, 1]) {
        const ab = (k * 120 + s * 14) * Math.PI / 180, at = (k * 120 + 60 + s * 46) * Math.PI / 180;
        BASE.push(new THREE.Vector3(1.05 * Math.cos(ab), -0.95, 1.05 * Math.sin(ab)));
        TOP.push(new THREE.Vector3(0.62 * Math.cos(at), 0, 0.62 * Math.sin(at)));
      }
    }
    // leg k joins base point k to the top point beside it, so the legs cross in pairs
    const LEG = [[0, 5], [1, 0], [2, 1], [3, 2], [4, 3], [5, 4]];
    const baseRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(BASE), lineMat(COL.rig));
    rig.add(baseRing);
    const legs = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(new Array(12).fill(0).map(() => new THREE.Vector3())), lineMat(COL.rig));
    rig.add(legs);
    const platform = new THREE.Group();
    platform.position.y = 0.1;
    rig.add(platform);
    const topRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(TOP), lineMat(COL.rig));
    platform.add(topRing);
    const cabinGeo = new THREE.BoxGeometry(1.25, 0.8, 1.1);
    const cabin = new THREE.LineSegments(new THREE.EdgesGeometry(cabinGeo), lineMat(COL.rig));
    cabin.position.y = 0.48;
    platform.add(cabin);
    // the visual display: a wide collimated screen wrapped round the front of the cabin
    const dome = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.95, 0.95, 0.62, 18, 1, true, -Math.PI * 0.42, Math.PI * 0.84), 1),
      lineMat(COL.stage[3]));
    dome.position.set(0, 0.6, 0.12);
    dome.rotation.y = Math.PI;
    platform.add(dome);
    const cabinGlow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 12), mat(RIM, { uColor: COL.ok.clone(), uAlpha: 0, uPow: 1.3 }));
    cabinGlow.position.y = 0.48;
    platform.add(cabinGlow);

    /* the chain: a track, its stage nodes, the trail a pulse leaves, its head */
    const track = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xAt(0), TY, 0), new THREE.Vector3(xAt(LIMIT + 10), TY, 0)]), lineMat(COL.track));
    scene.add(track);
    const nodes = CUM.map((ms, i) => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), basicMat(i === 0 ? COL.head : COL.stage[Math.min(4, i - 1)]));
      n.position.set(xAt(ms), TY, 0);
      scene.add(n);
      return n;
    });
    // the trail: one segment per stage, plus the part past the gate drawn red
    const trail = [0, 1, 2, 3, 4].map(k => {
      // dimmed: at full HDR the bloom ran the five colours together
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.02), basicMat(COL.stage[k].clone().multiplyScalar(0.5)));
      scene.add(m);
      return m;
    });
    const overrun = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.02), basicMat(COL.late.clone().multiplyScalar(0.7)));
    scene.add(overrun);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 10), basicMat(COL.head));
    scene.add(head);
    // gates: a curtain of light across the track; the old limit, and the new one
    function gateMesh(color) {
      const g = new THREE.Group();
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.3), basicMat(color));
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.05, 1.3)), lineMat(color));
      g.add(sheet, edge);
      g.position.set(xAt(LIMIT), TY + 0.18, 0);
      scene.add(g);
      return { g, sheet, edge };
    }
    const gateOld = gateMesh(COL.gate), gateNew = gateMesh(COL.amber);

    /* frames streaming off the end of the chain, and the session ribbon they become */
    const FN = 40, fpos = new Float32Array(FN * 3), fa = new Float32Array(FN), fc = new Float32Array(FN * 3);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    fg.setAttribute('aA', new THREE.BufferAttribute(fa, 1));
    fg.setAttribute('aC', new THREE.BufferAttribute(fc, 3));
    const frames = new THREE.Points(fg, mat(SPARK, { uPR: 1, uSize: 9 }));
    frames.frustumCulled = false;
    scene.add(frames);
    const rpos = new Float32Array(RN * 3), ra = new Float32Array(RN), rc = new Float32Array(RN * 3);
    const v = new THREE.Vector3();
    for (let i = 0; i < RN; i++) {
      ribbonAt(i / RN, v);
      rpos.set([v.x, v.y, v.z], i * 3);
      rc.set([COL.ok.r * 0.55, COL.ok.g * 0.55, COL.ok.b * 0.55], i * 3);
    }
    const rg = new THREE.BufferGeometry();
    rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
    rg.setAttribute('aA', new THREE.BufferAttribute(ra, 1));
    rg.setAttribute('aC', new THREE.BufferAttribute(rc, 3));
    const ribbon = new THREE.Points(rg, mat(SPARK, { uPR: 1, uSize: 3.2 }));
    ribbon.frustumCulled = false;
    scene.add(ribbon);
    // the red frames, drawn on top and larger: scattered, then in bursts
    const BN = SCATTER.length * 2, bpos = new Float32Array(BN * 3), ba = new Float32Array(BN), bc = new Float32Array(BN * 3);
    [...SCATTER, ...BURST].forEach((i, j) => {
      ribbonAt(i / RN, v);
      bpos.set([v.x, v.y, v.z], j * 3);
      bc.set([COL.late.r * 0.8, COL.late.g * 0.8, COL.late.b * 0.8], j * 3);
    });
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
    bg.setAttribute('aA', new THREE.BufferAttribute(ba, 1));
    bg.setAttribute('aC', new THREE.BufferAttribute(bc, 3));
    const bad = new THREE.Points(bg, mat(SPARK, { uPR: 1, uSize: 6.5 }));
    bad.frustumCulled = false;
    scene.add(bad);

    /* the rack: nine hosts, a bar each, the frame's deadline and the line where the frame closes */
    const bars = [], hostGates = [];
    for (let h = 0; h < HOSTS; h++) {
      const y = RY0 - h * RDY;
      const rail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(RX, y, 0), new THREE.Vector3(RX + RL * 1.35, y, 0)]), lineMat(COL.track));
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.09, 0.02), basicMat(COL.ok));
      const hg = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.02), basicMat(COL.amber));
      hg.position.set(RX + RL * 0.98, y, 0.01);
      scene.add(rail, bar, hg);
      bars.push({ rail, bar, y });
      hostGates.push(hg);
    }
    const deadline = new THREE.Mesh(new THREE.PlaneGeometry(0.09, HOSTS * RDY + 0.3), basicMat(COL.gate.clone().multiplyScalar(0.45)));
    deadline.position.set(RX + RL, RY0 - (HOSTS - 1) * RDY / 2, 0);
    const closer = new THREE.Mesh(new THREE.PlaneGeometry(0.02, HOSTS * RDY + 0.2), basicMat(COL.head));
    closer.position.set(RX, RY0 - (HOSTS - 1) * RDY / 2, 0.01);
    scene.add(deadline, closer);

    Object.assign(ctx, { dust, rig, platform, legs, baseRing, topRing, cabin, dome, cabinGlow, BASE, TOP, LEG,
                         track, nodes, trail, overrun, head, gateOld, gateNew, frames, fpos, fa, fc,
                         ribbon, ra, bad, ba, bars, hostGates, deadline, closer });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 820 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1000, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.86) 0%, rgba(3,5,10,.6) 60%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 56% 50% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.gate - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Fast on average, and still <span class="red">late</span>.</div><div class="sb">A flight simulator can be fast on average and still fail its pilot. All it takes is one late answer.</div>' });
    say(T.gate, T.stages - gone, 'An answer in about the time of a <em>blink</em>.',
        'That limit is a rule, not a goal. Miss it, and the hours flown do not count.');
    say(T.stages, T.tighter - gone, 'Every stage <em>spends</em> it.',
        'From the controls to the motion of the cabin. Drawing the world takes the largest share.');
    say(T.tighter, T.beat - gone, 'A <span class="amber">tighter</span> limit.',
        'Europe&rsquo;s newest standard tightens it for the most realistic new simulators. A chain that passed before would now fail.');
    say(T.beat, T.session - gone, 'It runs on a <em>beat</em>.',
        'Inside, the simulator acts many times a second. A late frame is <span class="red">late</span>, however fast the frames around it were.');
    say(T.session, T.cluster - gone, 'Rare is not <em>never</em>.',
        'A training session is a long run of frames. A failure that looks vanishingly rare comes back again and again, and the pilot feels every one.');
    say(T.cluster, T.rack - gone, 'Failures arrive in <span class="red">bursts</span>.',
        'They don&rsquo;t spread out politely, so the real thing is worse.');
    say(T.rack, T.straggler - gone, 'Not one computer: a <em>rack</em>.',
        'All of them feed the same frame, and the frame is only done when the last one reports.');
    say(T.straggler, T.measure - gone, 'One <span class="red">straggler</span> is enough.',
        'An average across the rack hides it. Each computer needs its own budget, <b>enforced</b>.');
    say(T.measure, T.close - 0.25, 'Count every <em>overrun</em>.',
        'None of it counts unless it is measured while the session runs. A spike can hide between two samples.');
    text({ at: T.gate + 1.0, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 860, w: 820 },
           html: 'Informed by the author&rsquo;s Level D full-flight-simulator engineering at Avion.<span>No employer design is shown. The limits are public (FAA Part 60, EASA CS-FSTD); stage times and the rack are illustrative.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 300, w: 1400, align: 'center' },
           html: 'Determinism is a budget, enforced every frame.' });
    text({ at: T.close + 2.6, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 385, w: 1400, align: 'center' },
           html: 'Proven by the <em>instrument you ship</em>.' });
    text({ at: T.close + 5.6, out: T.card - 0.3, cls: 'cl__c', place: { x: 260, y: 610, w: 1400, align: 'center' },
           html: 'An AI model in this loop inherits it too.' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">Determinism at 60 Hz</div>
                  <div class="end__s">Why a flight simulator&rsquo;s timing is a budget enforced every frame and on every computer, never an average.</div>
                  <div class="end__a">Informed by Level D full-flight-simulator engineering at Avion &middot; no employer design shown</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* the instrument: one panel, a trace per host scrolling past, the sampler's dots and the overrun tally */
    const SVGW = 760, SVGH = 420, ROWS = 6, RH = SVGH / ROWS;
    text({ at: T.measure + 0.4, out: T.close - 0.3, cls: 'meter', words: false, dur: 0.6, rise: 18, place: { x: 1050, y: 250, w: 812 },
           html: `<div class="meter__t"><span>step time, per host</span><span>overruns</span></div>
                  <svg width="${SVGW}" height="${SVGH}" viewBox="0 0 ${SVGW} ${SVGH}"></svg>`,
           update: (t, el) => {
             const svg = el.querySelector('svg');
             const lt = t - T.measure;
             const W0 = 560, budget = 0.72;
             let html = '';
             for (let r = 0; r < ROWS; r++) {
               const y0 = r * RH + RH - 14, amp = RH - 26;
               const hot = r === 3;
               // the step time of host r over the last stretch of the session, scrolling left
               let pts = '', samp = '';
               let marks = 0;
               for (let i = 0; i <= 80; i++) {
                 const k = Math.floor(lt * 22) + i;             // frame index at this column
                 const n = Math.sin(k * 12.9898 + r * 78.233) * 43758.5453;
                 let st = 0.38 + 0.22 * (n - Math.floor(n));
                 if (hot && k % 37 === 11) st = 1.0;            // the spike: one frame, between two samples
                 const x = (i / 80) * W0, y = y0 - st * amp;
                 pts += `${x.toFixed(1)},${y.toFixed(1)} `;
                 if (k % 9 === 0) samp += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#7fcfff"/>`;
               }
               // overruns so far on this host, counted, not sampled
               if (hot) for (let k = 11; k <= Math.floor(lt * 22) + 80; k += 37) marks++;
               const by = y0 - budget * amp;
               html += `<line x1="0" x2="${W0}" y1="${by.toFixed(1)}" y2="${by.toFixed(1)}" stroke="#ffb347" stroke-opacity=".5" stroke-dasharray="6 6"/>`;
               html += `<polyline points="${pts}" fill="none" stroke="${hot ? '#ff8a96' : '#5dffc8'}" stroke-opacity="${hot ? 1 : 0.75}" stroke-width="2.4"/>`;
               html += samp;
               let tally = '';
               for (let m = 0; m < marks; m++) tally += `<rect x="${W0 + 40 + m * 14}" y="${y0 - 34}" width="7" height="34" rx="2" fill="#ff6272"/>`;
               html += tally || `<rect x="${W0 + 40}" y="${y0 - 3}" width="40" height="3" rx="1.5" fill="#5dffc8" fill-opacity=".5"/>`;
             }
             svg.innerHTML = html;
           } });

    /* --------------------------------------------------------- labels */
    const at = p => () => p;
    const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'a full-flight simulator', anchor: at(V(1.32, 1.9)), ax: 0.5, ay: 1,
            alpha: t => win(t, -1, T.gate + 2.5, 0.6, 0.6) });
    label({ cls: 'stamp red', html: 'TOO LATE', anchor: at(V(xAt(LIMIT), TY + 0.95)), ax: 0.5, ay: 1,
            alpha: t => win(t, 5.0, T.gate - 0.3, 0.3, 0.5) });
    label({ cls: 'chip', html: 'the limit', anchor: at(V(xAt(LIMIT), TY + 0.95)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.gate + 0.8, 15.6, 0.6, 0.4) });
    label({ cls: 'stamp red', html: 'DOES NOT QUALIFY', anchor: at(V(xAt(LIMIT), TY + 0.95)), ax: 0.85, ay: 1,
            alpha: t => win(t, 16.2, T.stages - 0.2, 0.3, 0.5) });
    // the stage the slow pulse is in, riding just above its head
    label({ cls: 'chip', html: '', anchor: t => {
              const p = PULSES[9], ms = pulseMs(p, t);
              return V(xAt(ms), TY + 0.42);
            }, ax: 0.5, ay: 1,
            alpha: t => win(t, T.stages + 0.7, T.tighter - 0.3, 0.4, 0.5),
            update: (t, el) => { const p = PULSES[9]; const k = stageOf(p, pulseMs(p, t)); if (el.dataset.k !== String(k)) { el.dataset.k = String(k); el.innerHTML = STAGES[k]; } } });
    label({ cls: 'chip', html: 'until now', anchor: at(V(xAt(LIMIT), TY - 0.62)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.tighter + 2.0, T.beat - 0.3, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'new simulators', anchor: t => V(xAt(gateMs(t)), TY - 0.62), ax: 0.5, ay: 0,
            alpha: t => win(t, T.tighter + 1.0, 32.6, 0.6, 0.4) });
    label({ cls: 'stamp red', html: 'WOULD FAIL', anchor: at(V(xAt(NEW_LIMIT), TY - 0.62)), ax: 0.5, ay: 0,
            alpha: t => win(t, 33.0, T.beat - 0.3, 0.3, 0.5) });
    label({ cls: 'chip', html: 'a training session, one frame a tile', anchor: at(V(1.6, -1.25, 0.9)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.session + 1.5, T.cluster - 0.2, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'the same failures, in bursts', anchor: at(V(1.6, -1.25, 0.9)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.cluster + 1.6, T.rack - 0.3, 0.6, 0.5) });
    label({ cls: 'chip', html: 'deadline', anchor: at(V(RX + RL, RY0 - (HOSTS - 1) * RDY - 0.3)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.rack + 1.2, T.measure - 0.3, 0.6, 0.5) });
    label({ cls: 'chip', html: 'the frame closes when the last one reports', anchor: at(V(RX + RL * 0.62, RY0 + 0.36)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.rack + 3.0, T.straggler - 0.3, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'one straggler: the whole frame is late', anchor: at(V(RX + RL * 0.62, RY0 + 0.36)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.straggler + 0.6, 82.2, 0.6, 0.4) });
    label({ cls: 'chip amber', html: 'caught at its own budget', anchor: at(V(RX + RL * 0.62, RY0 + 0.36)), ax: 0.5, ay: 1,
            alpha: t => win(t, 82.6, T.measure - 0.3, 0.6, 0.5) });
  },

  frame(t, ctx) {
    const { camera, grade, dust, rig, platform, legs, baseRing, topRing, cabin, dome, cabinGlow, BASE, TOP, LEG,
            track, nodes, trail, overrun, head, gateOld, gateNew, frames, fpos, fa, fc,
            ribbon, ra, bad, ba, bars, hostGates, deadline, closer } = ctx;
    const pr = ctx.renderer.getPixelRatio();
    const card = 1 - ramp(t, T.card - 0.2, T.card + 0.6);
    const dimClose = 1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0));

    /* camera: on the chain, a pull back and turn for the session, front on for the rack */
    const back = ease.inOutSine(win(t, T.session - 1.0, T.rack + 0.4, 2.2, 1.6));
    camera.position.set(0.15 + 0.05 * Math.sin(t * 0.13), 0.1 + 0.03 * Math.sin(t * 0.11) + 1.6 * back, 9.2 + 0.6 * back);
    camera.lookAt(0.2 + 0.35 * back, -0.9 * back, -9.0 * back);

    /* act one: the rig and the chain */
    const act1 = win(t, -1, T.session + 1.2, 0.8, 1.2) * card;
    const rigOn = (win(t, -1, T.beat + 1.0, 0.8, 1.2) + win(t, T.close - 0.2, T.card + 0.4, 1.2, 0.8)) * card;
    // the cabin's motion: a gentle cue, and a judder when an answer comes late
    let jolt = 0;
    for (const p of PULSES) if (pulseTotal(p) > (p[0] > T.tighter ? NEW_LIMIT : LIMIT)) {
      const late = p[0] + (p[0] > T.tighter ? NEW_LIMIT : LIMIT) / p[1];
      jolt += win(t, late, late + 0.9, 0.05, 0.6) * Math.sin((t - late) * 46);
    }
    platform.position.set(0, 0.1 + 0.05 * Math.sin(t * 0.9) + 0.03 * jolt, 0);
    platform.rotation.set(0.05 * Math.sin(t * 0.7) + 0.05 * jolt, 0, 0.04 * Math.sin(t * 0.55 + 1) - 0.04 * jolt);
    platform.updateMatrix();
    const lp = legs.geometry.attributes.position.array, tmp = new THREE.Vector3();
    LEG.forEach(([b, k], i) => {
      tmp.copy(TOP[k]).applyMatrix4(platform.matrix);
      lp.set([BASE[b].x, BASE[b].y, BASE[b].z, tmp.x, tmp.y, tmp.z], i * 6);
    });
    legs.geometry.attributes.position.needsUpdate = true;
    rig.rotation.y = -0.55 + 0.12 * Math.sin(t * 0.08);
    for (const m of [baseRing, legs, topRing, cabin]) m.material.opacity = 0.75 * rigOn * dimClose;
    dome.material.opacity = 0.85 * rigOn * dimClose;
    cabinGlow.material.uniforms.uAlpha.value = (0.6 + 1.6 * Math.abs(jolt)) * rigOn * dimClose;
    cabinGlow.material.uniforms.uColor.value.copy(COL.ok).lerp(COL.late, Math.min(1, Math.abs(jolt) * 2));

    track.material.opacity = 0.55 * act1;
    nodes.forEach(n => { n.material.opacity = 0.9 * act1; });
    const gNew = gateMs(t);
    const tightOn = win(t, T.tighter + 0.4, T.beat + 0.4, 0.6, 0.8);
    gateOld.sheet.material.opacity = 0.35 * win(t, 1.2, T.session + 1.2, 0.6, 1.0) * card * (1 - 0.6 * tightOn);
    gateOld.edge.material.opacity = 0.9 * win(t, 1.2, T.session + 1.2, 0.6, 1.0) * card * (1 - 0.5 * tightOn);
    gateOld.g.visible = t > 1.2;   // there from the hook, so its late answer is late against something
    gateNew.g.position.x = xAt(gNew);
    gateNew.sheet.material.opacity = 0.45 * tightOn * card;
    gateNew.edge.material.opacity = 0.95 * tightOn * card;
    // in the hook there is no gate yet; the late pulse is late against the limit all the same
    // the tighter limit belongs to its own scene; the beat runs against the limit the device was qualified to
    const limitNow = p => (p[0] > T.tighter && p[0] < T.beat ? NEW_LIMIT : LIMIT);

    // the newest pulse on the track is the one drawn
    let cur = null;
    for (const p of PULSES) if (t >= p[0]) cur = p;
    // on the beat the chain runs at full speed: a pulse per frame, one of them late
    const BEAT0 = T.beat + 0.6, BEATP = 0.24;
    if (t >= BEAT0 && t < T.session + 1.2) {
      const i = Math.floor((t - BEAT0) / BEATP);
      cur = [BEAT0 + i * BEATP, 700, i === 17 ? 46 : 0];
    }
    let lit = 0;
    if (cur && t < T.session + 1.2) {
      const ms = pulseMs(cur, t), tot = pulseTotal(cur);
      const quick = cur[1] > 300;
      const fade = 1 - ramp(t, cur[0] + tot / cur[1] + (quick ? 0.0 : 0.5), cur[0] + tot / cur[1] + (quick ? 0.04 : 1.1));
      lit = fade * act1;
      let acc = 0;
      for (let k = 0; k < 5; k++) {
        const a0 = acc, a1 = acc + stageMs(cur, k);
        acc = a1;
        const seg = Math.max(0, Math.min(ms, a1) - a0);
        trail[k].scale.x = Math.max(1e-3, seg * SC);
        trail[k].position.set(xAt(a0) + seg * SC / 2, TY, 0);
        trail[k].material.opacity = (seg > 0 ? 0.95 : 0) * lit;
      }
      const lim = limitNow(cur);
      const over = Math.max(0, ms - lim);
      overrun.scale.x = Math.max(1e-3, over * SC);
      overrun.position.set(xAt(lim) + over * SC / 2, TY, 0.01);
      overrun.material.opacity = (over > 0 ? 1 : 0) * lit;
      head.position.set(xAt(ms), TY, 0.02);
      head.material.opacity = (ms < tot ? 1 : 0.5) * lit;
      head.material.color.copy(over > 0 ? COL.late : COL.head);
    } else {
      trail.forEach(m => { m.material.opacity = 0; });
      overrun.material.opacity = 0;
      head.material.opacity = 0;
    }

    /* act two: frames on a beat, then the session they make up */
    const beatOn = win(t, T.beat + 0.3, T.session + 2.0, 0.8, 1.4) * card;
    for (let i = 0; i < 40; i++) {
      // frame i left the chain at its own beat; it flies off along the start of the ribbon
      // frame i comes off the end of the chain on its beat and drifts away into the dark
      const born = T.beat + 0.6 + i * 0.24, age = t - born;
      const k = ease.outCubic(Math.min(1, Math.max(0, age) / 1.6));
      fpos.set([xAt(TOTAL) + 0.25 + 0.5 * k, TY + 0.9 * k * k, -6 * k], i * 3);
      const late = i === 17;
      fa[i] = (age > 0 ? 1 : 0) * (1 - ramp(age, 1.0, 1.6)) * beatOn * (late ? 1.2 : 0.85);
      const c = late ? COL.late : COL.ok;
      fc.set([c.r, c.g, c.b], i * 3);
    }
    frames.geometry.attributes.position.needsUpdate = true;
    frames.geometry.attributes.aA.needsUpdate = true;
    frames.geometry.attributes.aC.needsUpdate = true;
    frames.material.uniforms.uPR.value = pr;
    // the ribbon fills from the near end; then scattered red frames, then the same number in bursts
    const ribOn = win(t, T.session - 0.2, T.rack + 0.6, 1.0, 1.2) * card;
    const fill = ease.inOutSine(ramp(t, T.session - 0.2, T.session + 5.5));
    for (let i = 0; i < RN; i++) ra[i] = (i / RN < fill ? 1 : 0) * 0.4 * ribOn;
    ribbon.geometry.attributes.aA.needsUpdate = true;
    ribbon.material.uniforms.uPR.value = pr;
    const burst = ease.inOutSine(ramp(t, T.cluster + 0.6, T.cluster + 3.2));
    const n = SCATTER.length;
    for (let j = 0; j < n; j++) {
      const shown = SCATTER[j] / RN < fill ? 1 : 0;
      const pulse = 0.75 + 0.25 * Math.sin(t * 5 + j);
      ba[j] = shown * (1 - burst) * ribOn * pulse;
      ba[n + j] = burst * ribOn * pulse;
    }
    bad.geometry.attributes.aA.needsUpdate = true;
    bad.material.uniforms.uPR.value = pr;

    /* act three: the rack */
    const rackOn = win(t, T.rack - 0.2, T.measure + 0.2, 0.8, 0.8) * card;
    const f = rackFrame(t), ph = rackPhase(t);
    const row = FINISH[Math.min(f, FINISH.length - 1)];
    const grow = Math.min(1, ph / GROW);
    const enforce = ramp(t, 82.2, 82.9);                 // each host's own budget switched on
    let slowest = 0, frameLate = false;
    bars.forEach((b, h) => {
      const fin = row[h];
      // a host stops at its finish; with its own budget enforced, a straggler is cut at its gate
      const cap = enforce > 0 && fin > 0.98 ? 0.98 : fin;
      const len = Math.min(grow * 1.35, cap);
      slowest = Math.max(slowest, len);
      b.bar.scale.x = Math.max(1e-3, len * RL);
      b.bar.position.set(RX + len * RL / 2, b.y, 0);
      b.rail.material.opacity = 0.35 * rackOn;
      const caught = enforce > 0 && fin > 0.98 && len >= 0.98;
      b.bar.material.color.copy(caught ? COL.amber : COL.ok).multiplyScalar(0.34);   // half: at full HDR the rack glowed the frame green
      b.bar.material.opacity = 0.9 * rackOn;
      hostGates[h].material.opacity = 0.9 * enforce * rackOn;
      if (len > 1.0) frameLate = true;
    });
    // once the last bar stops, the frame closes; past the deadline, every bar goes red
    const done = ph > GROW + 0.05;
    if (frameLate) bars.forEach(b => b.bar.material.color.lerp(COL.late.clone().multiplyScalar(0.55), 0.85));
    deadline.material.opacity = 0.6 * rackOn;
    closer.position.x = RX + slowest * RL;
    closer.material.opacity = (done ? 1 : 0.55) * rackOn;
    closer.material.color.copy(frameLate ? COL.late : COL.head);

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
