/*
 * Determinism at 60 Hz: why a flight simulator cannot be fast "on average",
 * in about two minutes.
 *
 * It replaces the lab film of the same name and keeps its argument (lines in
 * scripts/narration.json, prefix "level-d"), told now as one question with
 * one answer at a time. The thesis comes first and last, in the same words
 * ("a late answer is a wrong answer"; "the slowest frame counts, not the
 * average"), because a first cut that built up to it left viewers unsure what
 * the film was about. It stands alone: no film refers to another (the
 * owner's rule). The facts it rests on:
 *   - transport delay, from a pilot's primary flight control input to the
 *     motion, visual or instrument response, is a regulated ceiling (FAA 14
 *     CFR Part 60 and EASA CS-FSTD(A): 150 ms at Level C/D); a device over it
 *     does not qualify. "About the time of a blink": a blink lasts roughly
 *     100 to 400 ms;
 *   - EASA's CS-FSTD Issue 1 (ED Decision 2026/008/R, Subpart D test 6.a.1,
 *     p. 467) sets 100 ms for new devices at fidelity level S, motion,
 *     instruments and visual alike;
 *   - the chain is the generic one of a full-flight simulator (control
 *     loading, flight model, aircraft systems, image generator, display and
 *     motion), drawn to the old film's illustrative stage budget of 8, 17, 25,
 *     50 and 34 ms, so the tighter limit lands where image generation ends;
 *   - the simulator repeats it many times a second for hours, rare slips
 *     recur and cluster, a rack of hosts feeds each frame and the frame waits
 *     for the slowest, budgets are enforced per host, and an overrun counter
 *     catches what sampled step time misses.
 *
 * The picture is a loop: the pilot's input leaves the cabin, runs the chain
 * against a gate (the limit), and comes back up as the cabin's motion and the
 * horizon on its screen. No numbers are printed or spoken (see CLAUDE.md,
 * cinema films). No employer design is shown: the rig is the generic
 * six-actuator motion platform every full-flight simulator stands on and the
 * rack the generic multi-host layout.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, input: 10.8, chain: 22.9, tighter: 39.6, beat: 47.6, session: 54, cluster: 64.0, rack: 69.4, straggler: 77.2, measure: 87.0, close: 95.5, card: 105.6 };
const D = 111.8;

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
  input: HDR(0.6, 1.8, 2.8, 0.9),
  bg: new THREE.Color(0x03050a),
};
const STAGES = ['control loading', 'flight model', 'aircraft systems', 'image generator', 'display &amp; motion'];
const STAGE_SAYS = ['reads the controls', 'works out how it flies', 'runs its systems', 'draws the world', 'updates the screen, moves the cabin'];
const STAGE_CSS = ['#5fd6ff', '#6aa8ff', '#5dffc8', '#c79bff', '#ffb347'];
const MS = [8, 17, 25, 50, 34];                       // the old film's illustrative stage budget
const CUM = MS.reduce((a, m) => (a.push(a[a.length - 1] + m), a), [0]);   // 0, 8, 25, 50, 100, 134
const TOTAL = CUM[CUM.length - 1];
const LIMIT = 150, NEW_LIMIT = 100;

/* -------------------------------------------------------------- shaders */
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
  .cin .hd { font: 600 76px/1.08 "Space Grotesk", sans-serif; letter-spacing: -.012em; color: #f4f7fb; text-wrap: balance; }
  .cin .sb { font: 400 36px/1.38 "Inter", sans-serif; color: #aebcd0; text-wrap: pretty; }
  .cin .blk .sb { margin-top: 28px; max-width: 790px; }
  .cin .sb b { color: #e8eef7; font-weight: 600; }
  .cin em { font-style: normal; color: #6fd3ff; }
  .cin .teal { color: #5dffc8; } .cin .amber { color: #ffb347; } .cin .red { color: #ff6272; }
  .cin .scrim { position: absolute; }
  .cin .chip { font: 500 25px/1 "JetBrains Mono", monospace; padding: 10px 13px; border-radius: 8px; white-space: nowrap;
               background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.red { border-color: rgba(255,98,114,.75); color: #ff8a96; }
  .cin .chip.amber { border-color: rgba(255,179,71,.75); color: #ffc477; }
  .cin .chip.in { border-color: rgba(95,214,255,.7); color: #a8e8ff; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px; white-space: nowrap;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.78); }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .chain { padding: 18px 22px 14px; border-radius: 16px; background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.2); }
  .cin .chain__r { display: grid; grid-template-columns: 18px 250px 1fr; align-items: center; gap: 12px; margin-bottom: 9px;
                   font: 500 23px/1.2 "JetBrains Mono", monospace; color: #8292a8; transition: none; }
  .cin .chain__r i { width: 14px; height: 14px; border-radius: 50%; display: block; opacity: .45; }
  .cin .chain__r span { font: 400 22px/1.2 "Inter", sans-serif; color: #7d8ea4; }   /* dimmed, still above 4.5:1 */
  .cin .chain__r.on { color: #f4f7fb; } .cin .chain__r.on span { color: #c9d4e3; } .cin .chain__r.on i { opacity: 1; }
  .cin .meter { padding: 22px 26px 18px; border-radius: 16px; background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.2); }
  .cin .meter__t { font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 16px; display: flex; justify-content: space-between; }
  .cin .meter__k { font: 400 21px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 12px; }
  .cin .meter__k b { color: #7fcfff; font-weight: 600; } .cin .meter__k i { color: #ff8a96; font-style: normal; font-weight: 600; }
  .cin .meter svg { display: block; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 84px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .cl__c { font: 500 40px/1.3 "Inter", sans-serif; color: #9fd8ff; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 980px; }
  .cin .end__s b { color: #f4f7fb; font-weight: 600; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ------------------------------------------------------------- the chain
   A pulse is one control input travelling the chain. Its head sits at the
   milliseconds spent so far; the rate is how many of those one film second
   shows, so the slow scenes are slow motion of the same chain. */
const SC = 3.6 / LIMIT;                    // world units per millisecond
const X0 = -1.1, TY = -0.62;               // where the chain starts, its height
const xAt = ms => X0 + ms * SC;
// [start, rate (ms per film second), extra ms the image generator took]
const PULSES = [
  [0.4, 110, 0], [2.2, 110, 0], [4.0, 110, 42], [6.6, 110, 0], [8.6, 110, 0],
  [11.6, 110, 0], [13.6, 110, 0], [15.6, 110, 0], [17.8, 110, 34], [20.6, 110, 0],
  [43.0, 55, 0],                           // the same chain against the shorter blink
];
const TIGHT = 10;
const stageMs = (p, k) => MS[k] + (k === 3 ? p[2] : 0);
const pulseTotal = p => MS.reduce((a, m, k) => a + stageMs(p, k), 0);
const pulseMs = (p, t) => Math.max(0, Math.min(pulseTotal(p), (t - p[0]) * p[1]));
// The chain scene's pulse is timed to the narration naming each computer, so
// the dot enters a stage as its name is spoken.
const CHAIN_T = [27.0, 28.8, 31.75, 33.6, 35.5, 37.9];
function chainMs(t) {
  if (t <= CHAIN_T[0]) return 0;
  for (let k = 0; k < 5; k++) if (t < CHAIN_T[k + 1]) return lerp(CUM[k], CUM[k + 1], (t - CHAIN_T[k]) / (CHAIN_T[k + 1] - CHAIN_T[k]));
  return TOTAL;
}
const chainStage = t => { for (let k = 4; k >= 0; k--) if (t >= CHAIN_T[k]) return k; return -1; };
// the tighter gate slides in
const gateMs = t => lerp(LIMIT, NEW_LIMIT, ease.inOutCubic(ramp(t, T.tighter + 0.6, T.tighter + 2.6)));
// the limit a pulse is held to: the shorter one only in its own scene
const limitOf = p => (p[0] > T.tighter && p[0] < T.beat ? NEW_LIMIT : LIMIT);

/* ------------------------------------------------------------ the session
   A floor of frames to the horizon, one tile a frame, in time order row by
   row away from the camera; a red few, scattered, then gathered into bursts:
   the same count, worse for the pilot because a burst is a longer stutter. */
const RN = 6000, FW = 60;
const rr = seeded(60);
const SCATTER = [], BURST = [];
for (let i = 0; i < 18; i++) SCATTER.push(Math.floor(rr() * RN));
for (let b = 0; b < 4; b++) { const c = 600 + Math.floor(rr() * (RN - 1200)); for (let j = 0; j < 5; j++) BURST.push(c + j * 3); }
BURST.length = SCATTER.length;
function floorAt(i, out) {
  const c = i % FW, r = Math.floor(i / FW);
  return out.set(-0.6 + 3.55 * (c / (FW - 1)), -1.25, 0.6 - 0.48 * r);
}

/* -------------------------------------------------------------- the rack
   Nine hosts, one frame a cycle, slowed down so a frame can be watched. A bar
   grows while its host works and stops when it is done; the frame closes when
   the last bar stops. Host 6 is the straggler once the narration names it. */
const HOSTS = 9, CYC = 2.2, GROW = 1.5;
const RX = 0.15, RL = 2.0, RY0 = 1.15, RDY = 0.29;
const ENFORCE = T.straggler + 4.6;         // "so every computer gets its own time budget"
const hr = seeded(9);
const FINISH = [];
for (let f = 0; f < 40; f++) {
  const row = [];
  for (let h = 0; h < HOSTS; h++) row.push(0.42 + hr() * 0.4);
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
    const cabin = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.25, 0.8, 1.1)), lineMat(COL.rig));
    cabin.position.y = 0.48;
    platform.add(cabin);
    const dome = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.95, 0.95, 0.62, 18, 1, true, -Math.PI * 0.42, Math.PI * 0.84), 1),
      lineMat(COL.stage[3].clone().multiplyScalar(0.7)));
    dome.position.set(0, 0.6, 0.12);
    dome.rotation.y = Math.PI;
    platform.add(dome);
    // the pilot's view on the cabin's front screen: a horizon that answers the controls
    const view = new THREE.Group();
    view.position.set(0, 0.5, 0.57);
    platform.add(view);
    const horizon = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(0.5, 0, 0)]), lineMat(HDR(0.6, 1.6, 2.6)));
    view.add(horizon);
    const wing = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.16, 0, 0.01), new THREE.Vector3(-0.05, 0, 0.01),
      new THREE.Vector3(0, -0.04, 0.01), new THREE.Vector3(0.05, 0, 0.01), new THREE.Vector3(0.16, 0, 0.01)]), lineMat(HDR(2.2, 2.2, 2.2)));
    wing.position.set(0, 0.5, 0.58);
    platform.add(wing);

    /* the chain: a track, its stage nodes, the trail a pulse leaves, its head */
    const track = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xAt(0), TY, 0), new THREE.Vector3(xAt(LIMIT + 10), TY, 0)]), lineMat(COL.track));
    scene.add(track);
    const nodes = CUM.map((ms, i) => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), basicMat(i === 0 ? COL.input : COL.stage[Math.min(4, i - 1)]));
      n.position.set(xAt(ms), TY, 0);
      scene.add(n);
      return n;
    });
    const trail = [0, 1, 2, 3, 4].map(k => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.06, 0.02), basicMat(COL.stage[k].clone().multiplyScalar(0.5)));
      scene.add(m);
      return m;
    });
    const overrun = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.02), basicMat(COL.late.clone().multiplyScalar(0.7)));
    scene.add(overrun);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 20, 10), basicMat(COL.head));
    scene.add(head);
    // the loop: down from the cabin to the start of the chain, and back up from its end
    const CAB = new THREE.Vector3(1.32, 1.28, -0.4);
    const down = new THREE.QuadraticBezierCurve3(new THREE.Vector3(CAB.x - 0.45, CAB.y - 0.2, CAB.z), new THREE.Vector3(-0.9, 0.9, -0.2), new THREE.Vector3(xAt(0), TY, 0));
    const up = new THREE.QuadraticBezierCurve3(new THREE.Vector3(xAt(TOTAL), TY, 0), new THREE.Vector3(2.75, 0.4, -0.2), new THREE.Vector3(CAB.x + 0.5, CAB.y - 0.2, CAB.z));
    const mkPath = (curve, color) => {
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)),
        new THREE.LineDashedMaterial({ color: color.clone(), dashSize: 0.07, gapSize: 0.06, transparent: true, opacity: 0, depthWrite: false }));
      l.computeLineDistances();
      scene.add(l);
      return l;
    };
    const downLine = mkPath(down, COL.input), upLine = mkPath(up, COL.stage[4]);
    const runner = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 8), basicMat(COL.head));
    scene.add(runner);
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

    /* frames coming off the chain on the beat */
    const FN = 40, fpos = new Float32Array(FN * 3), fa = new Float32Array(FN), fc = new Float32Array(FN * 3);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    fg.setAttribute('aA', new THREE.BufferAttribute(fa, 1));
    fg.setAttribute('aC', new THREE.BufferAttribute(fc, 3));
    const frames = new THREE.Points(fg, mat(SPARK, { uPR: 1, uSize: 9 }));
    frames.frustumCulled = false;
    scene.add(frames);
    /* the session floor, and its red frames drawn on top */
    const v = new THREE.Vector3();
    const rpos = new Float32Array(RN * 3), ra = new Float32Array(RN), rc = new Float32Array(RN * 3);
    for (let i = 0; i < RN; i++) {
      floorAt(i, v);
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
    const BN = SCATTER.length * 2, bpos = new Float32Array(BN * 3), ba = new Float32Array(BN), bc = new Float32Array(BN * 3);
    [...SCATTER, ...BURST].forEach((i, j) => {
      floorAt(i, v);
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

    /* the rack */
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

    Object.assign(ctx, { dust, rig, platform, legs, baseRing, topRing, cabin, dome, view, horizon, wing, BASE, TOP, LEG,
                         track, nodes, trail, overrun, head, down, up, downLine, upLine, runner, gateOld, gateNew,
                         frames, fpos, fa, fc, ribbon, ra, bad, ba, bars, hostGates, deadline, closer });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 830 };
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

    text({ at: -3, out: T.input - gone, cls: 'blk', place: HD,
           html: '<div class="hd">A late answer is a <span class="red">wrong</span> answer.</div><div class="sb">A flight simulator has to answer its pilot within a <em>blink</em>, every single time. <b>Not on average.</b></div>' });
    say(T.input, T.chain - gone, 'The pilot moves. The world must <em>follow</em>.',
        'The view and the cabin must answer within that blink. It is written into the rules: a simulator that misses it cannot train pilots.');
    say(T.chain, T.tighter - gone, 'A chain of <em>computers</em> shares that blink.',
        'One reads the controls. One works out how the aircraft flies. One runs its systems. One draws the world. The last updates the screen and moves the cabin.');
    say(T.tighter, T.beat - gone, 'The blink gets <span class="amber">shorter</span>.',
        'Europe&rsquo;s newest standard tightens it for the most realistic new simulators. The same chain no longer makes it.');
    say(T.beat, T.session - gone, 'Not once. <em>Sixty times a second.</em>',
        'For hours. Lay out one training session, frame by frame.');
    say(T.session, T.cluster - gone, 'One slip in a thousand is <span class="red">hundreds of jolts</span>.',
        'Every one is a jolt the pilot can feel. &ldquo;Usually fast&rdquo; is not enough.');
    say(T.cluster, T.rack - gone, 'Slips come in <span class="red">bunches</span>.',
        'So the pilot feels a stutter, not a blip.');
    say(T.rack, T.straggler - gone, 'Every frame waits for the <em>slowest</em>.',
        'The work is split across a rack of computers, and a frame is only done when the last one is.');
    say(T.straggler, T.measure - gone, 'One slow computer is <span class="red">enough</span>.',
        'An average hides it. So every computer gets its own time budget, <b>checked every frame</b>.');
    say(T.measure, T.close - 0.25, 'Count every <em>overrun</em>.',
        'While the simulator runs. Spot checks miss a short spike. A counter does not.');
    // sources as footnotes, each only while its fact is on screen; the employer note lives on the end card
    text({ at: T.input + 1.0, out: T.chain - 0.3, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 940, w: 830 },
           html: 'Source: FAA 14 CFR Part 60; EASA CS-FSTD(A)' });
    text({ at: T.tighter + 1.0, out: T.beat - 0.3, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 940, w: 830 },
           html: 'Source: EASA CS-FSTD Issue 1 (2026), new devices' });

    /* the chain, named: one row lights as the narration reaches its computer */
    text({ at: T.chain + 3.2, out: T.tighter - 0.3, cls: 'chain', words: false, dur: 0.6, rise: 18, place: { x: 1120, y: 726, w: 720 },
           html: STAGES.map((s, k) => `<div class="chain__r"><i style="background:${STAGE_CSS[k]}"></i>${s}<span>${STAGE_SAYS[k]}</span></div>`).join(''),
           update: (t, el) => {
             const k = chainStage(t);
             el.querySelectorAll('.chain__r').forEach((r, i) => r.classList.toggle('on', t > CHAIN_T[5] ? true : i === k));
           } });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 300, w: 1400, align: 'center' },
           html: 'That is determinism:' });
    text({ at: T.close + 1.6, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 380, w: 1400, align: 'center' },
           html: 'the <em>slowest</em> frame counts, not the average.' });
    text({ at: T.close + 5.2, out: T.card - 0.3, cls: 'cl__c', place: { x: 260, y: 650, w: 1400, align: 'center' },
           html: 'It is the rule any AI added to this loop must keep.' });
    // the card is one block in normal flow, so the series line sits under the name and can never cover it
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">Determinism at 60 Hz</div>
                  <div class="end__s"><b>The slowest frame counts, not the average.</b> Why a flight simulator has to answer its pilot in time every frame, on every computer, measured while it runs.</div>
                  <div class="end__a">Informed by Level D full-flight-simulator engineering at Avion &middot; no employer design shown</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* the instrument: a trace per computer scrolling past, spot-check dots, the overrun tally */
    const SVGW = 760, SVGH = 400, ROWS = 6, RH = SVGH / ROWS;
    text({ at: T.measure + 0.4, out: T.close - 0.3, cls: 'meter', words: false, dur: 0.6, rise: 18, place: { x: 1050, y: 210, w: 812 },
           html: `<div class="meter__t"><span>time per frame, each computer</span><span>overruns</span></div>
                  <svg width="${SVGW}" height="${SVGH}" viewBox="0 0 ${SVGW} ${SVGH}"></svg>
                  <div class="meter__k"><b>dots</b>: spot checks, which miss the spike &middot; <i>bars</i>: the counter, which does not</div>`,
           update: (t, el) => {
             const svg = el.querySelector('svg');
             const lt = t - T.measure;
             const W0 = 560, budget = 0.72;
             let html = '';
             for (let r = 0; r < ROWS; r++) {
               const y0 = r * RH + RH - 12, amp = RH - 24;
               const hot = r === 3;
               let pts = '', samp = '', marks = 0;
               for (let i = 0; i <= 80; i++) {
                 const k = Math.floor(lt * 22) + i;
                 const n = Math.sin(k * 12.9898 + r * 78.233) * 43758.5453;
                 let st = 0.38 + 0.22 * (n - Math.floor(n));
                 if (hot && k % 37 === 11) st = 1.0;            // one frame's spike, between two spot checks
                 const x = (i / 80) * W0, y = y0 - st * amp;
                 pts += `${x.toFixed(1)},${y.toFixed(1)} `;
                 if (k % 9 === 0) samp += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#7fcfff"/>`;
               }
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
            alpha: t => win(t, -1, T.input + 0.5, 0.6, 0.6) });
    // the gate's labels sit under the track, one at a time: above it they touched the rig's legs
    label({ cls: 'stamp red', html: 'TOO LATE', anchor: at(V(xAt(LIMIT), TY - 0.3)), ax: 0.85, ay: 0,
            alpha: t => win(t, 5.5, T.input - 0.3, 0.3, 0.5) });
    label({ cls: 'chip in', html: 'the pilot moves the controls', anchor: at(V(xAt(0), TY + 0.3)), ax: 0, ay: 1,
            alpha: t => win(t, T.input + 0.6, T.input + 4.4, 0.5, 0.4) });
    label({ cls: 'chip amber', html: 'the view and the cabin answer', anchor: at(V(xAt(TOTAL), TY - 0.3)), ax: 1, ay: 0,
            alpha: t => win(t, T.input + 4.6, 19.0, 0.5, 0.4) });
    label({ cls: 'chip', html: 'the rule: about a blink', anchor: at(V(xAt(LIMIT), TY - 0.3)), ax: 0.85, ay: 0,
            alpha: t => win(t, T.input + 1.4, T.input + 4.4, 0.5, 0.4) });
    label({ cls: 'stamp red', html: 'DOES NOT QUALIFY', anchor: at(V(xAt(LIMIT), TY - 0.3)), ax: 0.85, ay: 0,
            alpha: t => win(t, 19.4, T.chain - 0.2, 0.3, 0.5) });
    label({ cls: 'chip', html: 'until now', anchor: at(V(xAt(LIMIT), TY - 0.62)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.tighter + 2.0, T.beat - 0.3, 0.6, 0.5) });
    label({ cls: 'chip amber', html: 'new simulators', anchor: t => V(xAt(gateMs(t)), TY - 0.62), ax: 0.5, ay: 0,
            alpha: t => win(t, T.tighter + 1.0, 44.9, 0.6, 0.4) });
    label({ cls: 'stamp red', html: 'TOO LATE NOW', anchor: at(V(xAt(NEW_LIMIT), TY - 0.62)), ax: 0.5, ay: 0,
            alpha: t => win(t, 45.1, T.beat - 0.3, 0.3, 0.5) });
    label({ cls: 'chip', html: 'one training session: each tile is a frame', anchor: at(V(1.3, -1.25, 0.9)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.session + 2.4, T.cluster - 0.2, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'the same slips, bunched together', anchor: at(V(1.3, -1.25, 0.9)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.cluster + 1.0, T.rack - 0.3, 0.6, 0.5) });
    label({ cls: 'chip', html: 'deadline', anchor: at(V(RX + RL, RY0 - (HOSTS - 1) * RDY - 0.3)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.rack + 1.2, T.measure - 0.3, 0.6, 0.5) });
    label({ cls: 'chip', html: 'each frame waits for the slowest computer', anchor: at(V(RX + RL * 0.62, RY0 + 0.36)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.rack + 2.6, T.straggler - 0.3, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'one slow computer: the whole frame is late', anchor: at(V(RX + RL * 0.62, RY0 + 0.36)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.straggler + 0.5, ENFORCE - 0.2, 0.6, 0.4) });
    label({ cls: 'chip amber', html: 'its own budget catches it', anchor: at(V(RX + RL * 0.62, RY0 + 0.36)), ax: 0.5, ay: 1,
            alpha: t => win(t, ENFORCE + 0.4, T.measure - 0.3, 0.6, 0.5) });
  },

  frame(t, ctx) {
    const { camera, grade, dust, rig, platform, legs, baseRing, topRing, cabin, dome, view, horizon, wing, BASE, TOP, LEG,
            track, nodes, trail, overrun, head, down, up, downLine, upLine, runner, gateOld, gateNew,
            frames, fpos, fa, fc, ribbon, ra, bad, ba, bars, hostGates, deadline, closer } = ctx;
    const pr = ctx.renderer.getPixelRatio();
    const card = 1 - ramp(t, T.card - 0.2, T.card + 0.6);
    const dimClose = 1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0));

    /* camera: on the loop, up and over the floor for the session, front on for the rack */
    const back = ease.inOutSine(win(t, T.session - 1.0, T.rack + 0.4, 2.2, 1.6));
    camera.position.set(0.15 + 0.05 * Math.sin(t * 0.13), 0.1 + 0.03 * Math.sin(t * 0.11) + 1.6 * back, 9.2 + 0.6 * back);
    camera.lookAt(0.2 + 0.35 * back, -0.9 * back, -9.0 * back);

    /* which pulse is on the chain now, and how far it has got */
    const BEAT0 = T.beat + 0.6, BEATP = 0.24;
    let cur = null, ms = 0, tot = TOTAL, lim = LIMIT, arrive = 1e9, chainScene = false;
    if (t >= CHAIN_T[0] - 2.6 && t < T.tighter) {
      chainScene = true;
      ms = chainMs(t); arrive = CHAIN_T[5];
      cur = [CHAIN_T[0], 0, 0];
    } else if (t >= BEAT0 && t < T.session + 1.2) {
      const i = Math.floor((t - BEAT0) / BEATP);
      cur = [BEAT0 + i * BEATP, 700, i === 17 ? 46 : 0];
    } else if (t >= PULSES[TIGHT][0] && t < T.beat) {
      cur = PULSES[TIGHT];
    } else if (t < T.chain - 0.3) {
      for (const p of PULSES) if (t >= p[0] && p[0] < T.chain) cur = p;
    }
    if (cur && !chainScene) { ms = pulseMs(cur, t); tot = pulseTotal(cur); lim = limitOf(cur); arrive = cur[0] + tot / cur[1]; }
    const late = cur ? tot > lim : false;
    const fast = cur && cur[1] > 300;

    /* act one: the rig answers the chain */
    const act1 = win(t, -1, T.session + 1.2, 0.8, 1.2) * card;
    const rigOn = (win(t, -1, T.beat + 1.0, 0.8, 1.2) + win(t, T.close - 0.2, T.card + 0.4, 1.2, 0.8)) * card;
    // the answer: when the chain delivers, the cabin pitches and the horizon rolls; a late one jolts
    const answer = cur && !fast ? ease.outCubic(ramp(t, arrive + 0.2, arrive + 0.55)) * (1 - ramp(t, arrive + 1.0, arrive + 1.6)) : 0;
    const jolt = cur && !fast && late ? win(t, arrive + 0.2, arrive + 1.1, 0.05, 0.6) * Math.sin((t - arrive) * 46) : 0;
    platform.position.set(0, 0.1 + 0.02 * Math.sin(t * 0.9) + 0.03 * jolt, 0);
    platform.rotation.set(0.1 * answer + 0.05 * jolt, 0, 0.02 * Math.sin(t * 0.55 + 1) - 0.05 * jolt);
    platform.updateMatrix();
    view.rotation.z = -0.32 * answer + 0.15 * jolt;
    view.position.y = 0.5 - 0.1 * answer;
    const lp = legs.geometry.attributes.position.array, tmp = new THREE.Vector3();
    LEG.forEach(([b, k], i) => {
      tmp.copy(TOP[k]).applyMatrix4(platform.matrix);
      lp.set([BASE[b].x, BASE[b].y, BASE[b].z, tmp.x, tmp.y, tmp.z], i * 6);
    });
    legs.geometry.attributes.position.needsUpdate = true;
    rig.rotation.y = -0.55 + 0.12 * Math.sin(t * 0.08);
    for (const m of [baseRing, legs, topRing, cabin]) m.material.opacity = 0.75 * rigOn * dimClose;
    dome.material.opacity = 0.6 * rigOn * dimClose;
    horizon.material.opacity = 0.95 * rigOn * dimClose;
    horizon.material.color.copy(jolt !== 0 ? COL.late : HDR(0.6, 1.6, 2.6));
    wing.material.opacity = 0.9 * rigOn * dimClose;

    /* the chain and its gates */
    track.material.opacity = 0.55 * act1;
    nodes.forEach(n => { n.material.opacity = 0.9 * act1; });
    const tightOn = win(t, T.tighter + 0.4, T.beat + 0.4, 0.6, 0.8);
    const gOld = win(t, 1.2, T.session + 1.2, 0.6, 1.0) * card;
    gateOld.sheet.material.opacity = 0.35 * gOld * (1 - 0.6 * tightOn);
    gateOld.edge.material.opacity = 0.9 * gOld * (1 - 0.5 * tightOn);
    gateNew.g.position.x = xAt(gateMs(t));
    gateNew.sheet.material.opacity = 0.45 * tightOn * card;
    gateNew.edge.material.opacity = 0.95 * tightOn * card;
    // the loop the input travels: down from the cabin, along the chain, back up
    const loopOn = win(t, 0.2, T.beat + 0.6, 0.8, 0.8) * card;
    downLine.material.opacity = 0.5 * loopOn;
    upLine.material.opacity = 0.5 * loopOn;

    if (cur) {
      const fadeAt = chainScene ? T.tighter - 0.4 : arrive + (fast ? 0 : 0.5);
      const lit = (1 - ramp(t, fadeAt, fadeAt + (fast ? 0.04 : 0.6))) * act1;
      let acc = 0;
      for (let k = 0; k < 5; k++) {
        const a0 = acc, a1 = acc + (chainScene ? MS[k] : stageMs(cur, k));
        acc = a1;
        const seg = Math.max(0, Math.min(ms, a1) - a0);
        trail[k].scale.x = Math.max(1e-3, seg * SC);
        trail[k].position.set(xAt(a0) + seg * SC / 2, TY, 0);
        trail[k].material.opacity = (seg > 0 ? 0.95 : 0) * lit;
      }
      const over = Math.max(0, ms - lim);
      overrun.scale.x = Math.max(1e-3, over * SC);
      overrun.position.set(xAt(lim) + over * SC / 2, TY, 0.01);
      overrun.material.opacity = (over > 0 ? 1 : 0) * lit;
      head.position.set(xAt(ms), TY, 0.02);
      head.material.opacity = (ms < tot ? 1 : 0.5) * lit;
      head.material.color.copy(over > 0 ? COL.late : COL.head);
      // the runner: down the input path just before the pulse starts, up the answer path after it lands
      const t0 = cur[0];
      const dn = ramp(t, t0 - 0.45, t0), upu = ramp(t, arrive, arrive + 0.35);
      if (!fast && t < t0 && dn > 0) { runner.position.copy(down.getPoint(ease.inOutSine(dn))); runner.material.opacity = act1; runner.material.color.copy(COL.input); }
      else if (!fast && t >= arrive && upu < 1) { runner.position.copy(up.getPoint(ease.inOutSine(upu))); runner.material.opacity = act1; runner.material.color.copy(late ? COL.late : COL.stage[4]); }
      else runner.material.opacity = 0;
    } else {
      trail.forEach(m => { m.material.opacity = 0; });
      overrun.material.opacity = 0; head.material.opacity = 0; runner.material.opacity = 0;
    }

    /* act two: frames on the beat, then the session floor */
    const beatOn = win(t, T.beat + 0.3, T.session + 2.0, 0.8, 1.4) * card;
    for (let i = 0; i < 40; i++) {
      const born = BEAT0 + i * BEATP + 0.2, age = t - born;
      const k = ease.outCubic(Math.min(1, Math.max(0, age) / 1.6));
      fpos.set([xAt(TOTAL) + 0.25 + 0.5 * k, TY + 0.9 * k * k, -6 * k], i * 3);
      const isLate = i === 17;
      fa[i] = (age > 0 ? 1 : 0) * (1 - ramp(age, 1.0, 1.6)) * beatOn * (isLate ? 1.2 : 0.85);
      const c = isLate ? COL.late : COL.ok;
      fc.set([c.r, c.g, c.b], i * 3);
    }
    frames.geometry.attributes.position.needsUpdate = true;
    frames.geometry.attributes.aA.needsUpdate = true;
    frames.geometry.attributes.aC.needsUpdate = true;
    frames.material.uniforms.uPR.value = pr;
    const ribOn = win(t, T.session - 0.2, T.rack + 0.6, 1.0, 1.2) * card;
    const fill = ease.inOutSine(ramp(t, T.session + 1.5, T.session + 7.0));
    for (let i = 0; i < RN; i++) ra[i] = (i / RN < fill ? 1 : 0) * 0.4 * ribOn;
    ribbon.geometry.attributes.aA.needsUpdate = true;
    ribbon.material.uniforms.uPR.value = pr;
    const burst = ease.inOutSine(ramp(t, T.cluster + 0.4, T.cluster + 2.6));
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
    const enforce = ramp(t, ENFORCE, ENFORCE + 0.7);
    let slowest = 0, frameLate = false;
    bars.forEach((b, h) => {
      const fin = row[h];
      const cap = enforce > 0 && fin > 0.98 ? 0.98 : fin;
      const len = Math.min(grow * 1.35, cap);
      slowest = Math.max(slowest, len);
      b.bar.scale.x = Math.max(1e-3, len * RL);
      b.bar.position.set(RX + len * RL / 2, b.y, 0);
      b.rail.material.opacity = 0.35 * rackOn;
      const caught = enforce > 0 && fin > 0.98 && len >= 0.98;
      b.bar.material.color.copy(caught ? COL.amber : COL.ok).multiplyScalar(0.34);
      b.bar.material.opacity = 0.9 * rackOn;
      hostGates[h].material.opacity = 0.9 * enforce * rackOn;
      if (len > 1.0) frameLate = true;
    });
    if (frameLate) bars.forEach(b => b.bar.material.color.lerp(COL.late.clone().multiplyScalar(0.55), 0.85));
    deadline.material.opacity = 0.6 * rackOn;
    closer.position.x = RX + slowest * RL;
    closer.material.opacity = (ph > GROW + 0.05 ? 1 : 0.55) * rackOn;
    closer.material.color.copy(frameLate ? COL.late : COL.head);

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
