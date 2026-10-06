/*
 * Inside a Level D flight simulator: what the machine is, how it fools a
 * pilot's senses, how it is proven, why it can never be late, and what that
 * means for the AI that will join loops like it. About five minutes.
 *
 * WORK IN PROGRESS (branch level-d-explainer): written, not yet run. First
 * job on resuming: serve on 4001, open /films/level-d/, read the console,
 * then tile stills (render-cinema --frames) and fix what they show.
 *
 * Ink on paper, numbered figures, sources as footnotes only while their fact
 * is on screen, the thesis labelled as the author's. Every line's source is
 * beside it in scripts/cinema/level-d.voice.json (14 CFR Part 60; 14 CFR
 * Part 121 App. H; EASA CS-FSTD Issue 1; the lab film's determinism argument,
 * stage times and rack marked illustrative). No employer design is shown.
 * The opening is one shot: a night take-off on the simulator's mirror
 * (rendered to a texture, mapped to be right from the design eye), and the
 * camera pulls back out of the cockpit as the house lights come up. It stands
 * alone: no film refers to another (the owner's rule).
 */
import { THREE, createCinema, lerp, ramp, ease, win, clamp01, seeded } from './engine.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import * as FIG from './level-d-figs.js';

const { C, SERIF, SANS, MONO } = FIG;

const T = { open: 4.5, reveal: 9.8, trust: 18.4, promise: 32.0, senses: 42.4, eyes: 56.2, mirror: 65.1, motion: 77.4, equiv: 88.7,
            tilt: 98.9, agree: 111.0, washout: 119.5, hands: 126.5, levels: 136.6, tests: 145.6, yearly: 159.9, bridge: 167.3,
            delay: 172.9, chain: 186.0, tighter: 204.5, frames: 214.6, slips: 225.4, rack: 236.8, budget: 245.6, count: 255.6,
            determinism: 264.2, ai: 271.9, thesis: 285.7, coda: 301.8, card: 308.5 };
const D = 316.5;

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
// the film time at which the narration says the k-th `word` of line `id`
const WORDS = {};
if (TL) for (const l of TL.lines) WORDS[l.id] = (l.words || []).map(w => [w[0].toLowerCase().replace(/[^a-z0-9']/g, ''), w[1], w[2]]);
function W(id, word, k = 0) {
  let n = 0;
  for (const w of WORDS[id] || []) if (w[0] === word && n++ === k) return T[id] + w[1];
  if (TL) console.warn(`level-d: no word "${word}" (#${k}) in line "${id}"`);
  return T[id] + 1;
}

const col = hex => new THREE.Color(hex);
const PAPER = col(C.paper), NIGHT = col(C.night), INK = col(C.ink), CABIN_DARK = col('#07090D');
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ----------------------------------------------------- the rig, in metres */
const HP = 2.6;                                     // platform height at neutral
const EYE = V(0, 1.75, -0.95);                      // the design eye, in the cabin's frame
const MR = 2.4;                                     // mirror radius about the eye
const RTW = 2560, RTH = 1280, RVF = 46;             // the out-the-window picture
const BASE = [], TOPJ = [];
for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {
  const ab = (k * 120 + 90 + s * 13) * Math.PI / 180, at = (k * 120 + 30 + s * 47) * Math.PI / 180;
  BASE.push(V(2.45 * Math.cos(ab), 0.32, 2.45 * Math.sin(ab)));
  TOPJ.push(V(1.75 * Math.cos(at), -0.08, 1.75 * Math.sin(at)));
}

/* -------------------------------------------- the night take-off, as seen */
const RA = 2.3, Z0 = -150, TR = 29.0;
function rwPose(tau) {
  tau = Math.max(0, tau);
  const tr = Math.min(tau, TR);
  let dist = 0.5 * RA * tr * tr, pitch = 0, alt = 0;
  const v = RA * tr;
  if (tau > TR) {
    const d = tau - TR;
    dist += v * d + 0.4 * d * d;
    pitch = Math.min(15, 3.2 * d);
    const lift = Math.max(0, d - 2.4);
    alt = lift < 3 ? 1.1 * lift * lift : 9.9 + 6.6 * (lift - 3);
  }
  return { z: Z0 - dist, alt, pitch, v };
}
// the opening is mid-roll, rotating at t 3.5; the cueing scenes release the brakes on "shove"
const rwTau = t => (t < T.motion - 2 ? t + 25.5 : t - W('tilt', 'shove'));

/* ------------------------------------------------------ the motion cue */
function poseAt(t) {
  const p = { x: 0, y: 0.004 * Math.sin(t * 0.9), z: 0, rx: 0.003 * Math.sin(t * 0.53 + 1), ry: 0, rz: 0 };
  if (t < T.motion - 2) {
    // the opening take-off: a sustained nose-up tilt for the push, more at rotation, then washed out
    const tilt = 7.5 + 4 * ease.inOutSine(ramp(t, 3.5, 6.5));
    p.rx += tilt * (1 - ease.inOutSine(ramp(t, 10, 17))) * Math.PI / 180;
    p.y += (1 - ramp(t, 5.8, 6.4)) * 0.012 * Math.sin(t * 41) * Math.sin(t * 13.3);
    return p;
  }
  if (t < T.equiv + 1) {
    // six degrees of freedom, one at a time, then a slide to the end of its reach
    const s0 = W('motion', 'six'), seq = ['rx', 'rz', 'ry', 'y', 'x', 'z'], amp = [0.14, 0.14, 0.16, 0.32, 0.38, 0.38];
    seq.forEach((k, i) => { const a = s0 + 0.15 + i * 0.62; p[k] += amp[i] * Math.sin(Math.PI * clamp01((t - a) / 0.62)); });
    const tS = W('motion', 'short');
    p.z -= 0.95 * ease.outCubic(ramp(t, tS - 0.9, tS)) * (1 - ease.inOutSine(ramp(t, tS + 1.6, tS + 3.4)));
    return p;
  }
  // the take-off cue: a shove forward that washes out, a tilt that builds slowly, then back to the middle
  const tau = t - W('tilt', 'shove');
  const back = ease.inOutSine(clamp01((t - W('washout', 'creeps')) / 6.5));
  p.z -= 0.55 * (tau <= 0 ? 0 : (1 - Math.exp(-tau / 0.25)) * Math.exp(-tau / 1.1));
  p.rx += Math.asin(FIG.CUE.tilt(tau, back));
  return p;
}

/* -------------------------------------------------------------- shaders */
const U = { uHouse: { value: 0 }, uFade: { value: 0 }, uPaper: { value: PAPER.clone() }, uNightC: { value: CABIN_DARK.clone() },
            uLight: { value: V(-0.45, 0.82, 0.38).normalize() } };
function paper(hex, shade = 0.26) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uColor: { value: col(hex) }, uShade: { value: shade } },
    vertexShader: /* glsl */`
      varying vec3 vN;
      void main() { vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec3 uColor; uniform vec3 uPaper; uniform vec3 uNightC; uniform float uHouse; uniform float uFade;
      uniform vec3 uLight; uniform float uShade; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float k = 1.0 - uShade * (1.0 - smoothstep(-0.35, 0.9, dot(n, uLight)));
        vec3 c = mix(uColor * k, uPaper, uFade);
        gl_FragColor = vec4(mix(uNightC, c, uHouse), 1.0);
      }`,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2, side: THREE.DoubleSide,
  });
}
const LINES = [];                                   // every ink line, recoloured each frame for the house lights
function ink(width = 1.7, o = {}) {
  const m = new LineMaterial({ color: INK.clone(), linewidth: width, worldUnits: !!o.world, dashed: !!o.dash,
                               dashSize: o.dash ? o.dash[0] : 1, gapSize: o.dash ? o.dash[1] : 1 });
  m.resolution.set(1920, 1080);
  m.userData.base = col(o.color || C.ink);
  LINES.push(m);
  return m;
}
function edges(mesh, mat, threshold = 20) {
  const l = new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(mesh.geometry, threshold)), mat);
  if (mat.dashed) l.computeLineDistances();
  mesh.add(l);
  return l;
}
function poly(points, mat, parent, closed = false) {
  const pts = closed ? [...points, points[0]] : points;
  const g = new LineGeometry();
  g.setPositions(pts.flatMap(p => [p.x, p.y, p.z]));
  const l = new Line2(g, mat);
  if (mat.dashed) l.computeLineDistances();
  parent.add(l);
  return l;
}

/* ------------------------------------------------------------------ CSS */
const CSS = `
  @font-face { font-family: "Lora"; font-weight: 400 700; font-display: block;
    src: url("/assets/webfonts/gf-arch/lora-500-600-latin.woff2") format("woff2"); }
  .cin { --ink: ${C.ink}; --ink2: ${C.ink2}; --graphite: ${C.graphite}; --coral: ${C.coral}; --coralt: ${C.coralText}; }
  .cin .kick { font: 600 18px/1.2 ${SANS}; letter-spacing: .16em; text-transform: uppercase; color: var(--graphite); }
  .cin .kick b { color: var(--coralt); font-weight: 700; }
  .cin .hd { font: 600 58px/1.1 ${SERIF}; letter-spacing: -.012em; color: var(--ink); text-wrap: balance; }
  .cin .sb { font: 400 28px/1.48 ${SANS}; color: var(--ink2); text-wrap: pretty; margin-top: 22px; }
  .cin .sb b { color: var(--ink); font-weight: 600; }
  .cin .hd em, .cin .sb em { font-style: normal; color: var(--coralt); }
  .cin .wide .sb { max-width: 1480px; }
  .cin .foot { font: 400 17px/1.4 ${SANS}; color: var(--graphite); }
  .cin .foot i { font-style: normal; color: var(--ink2); font-weight: 600; }
  .cin .open { font: 500 54px/1.2 ${SERIF}; color: #F1EEE6; text-shadow: 0 2px 18px rgba(0,0,0,.6); }
  .cin .chap__n { font: 600 120px/1 ${SERIF}; color: var(--coral); }
  .cin .chap__t { font: 500 74px/1.1 ${SERIF}; color: var(--ink); margin-top: 18px; }
  .cin .chap__k { font: 600 18px/1 ${SANS}; letter-spacing: .2em; text-transform: uppercase; color: var(--graphite); margin-top: 28px; }
  .cin .big { font: 600 78px/1.1 ${SERIF}; color: var(--ink); text-wrap: balance; letter-spacing: -.012em; }
  .cin .big em { font-style: normal; color: var(--coralt); }
  .cin .bigk { font: 600 18px/1 ${SANS}; letter-spacing: .2em; text-transform: uppercase; color: var(--coralt); }
  .cin .ann { display: flex; align-items: center; font: 500 21px/1.25 ${SANS}; color: var(--ink); }
  .cin .ann i { width: 8px; height: 8px; border-radius: 50%; background: var(--coral); flex: none; }
  .cin .ann s { width: 40px; height: 1.6px; background: var(--ink); flex: none; text-decoration: none; }
  .cin .ann span { margin-left: 10px; padding: 3px 8px; background: rgba(241,238,230,.86); border-radius: 4px; }
  .cin .ann span small { display: block; font-size: 17px; color: var(--graphite); font-weight: 400; }
  .cin .ann.l { flex-direction: row-reverse; }
  .cin .ann.l span { margin: 0 10px 0 0; text-align: right; }
  .cin .dof { font: 500 22px/1 ${MONO}; color: var(--graphite); }
  .cin .dof span { display: inline-block; padding: 6px 10px; margin-right: 8px; border-radius: 6px; border: 1.5px solid transparent; }
  .cin .dof span.on { color: var(--coralt); border-color: var(--coral); }
  .cin .inset { border: 2px solid var(--ink); border-radius: 6px; }
  .cin .inset__c { font: 600 18px/1.2 ${SANS}; letter-spacing: .14em; text-transform: uppercase; color: var(--ink2); margin-top: 10px; }
  .cin .checks { font: 600 26px/1.4 ${SANS}; color: var(--ink); }
  .cin .checks b { color: ${C.olive}; }
  .cin .fig__scale { font: 600 22px/1.2 ${SANS}; color: var(--ink); margin-top: 14px; }
  .cin .fig__count { font: 400 22px/1.2 ${SANS}; color: var(--coralt); margin-top: 8px; min-height: 28px; }
  .cin .fig__count b { font: 600 34px/1 ${MONO}; margin-right: 8px; }
  .cin .end__t { font: 600 92px/1.05 ${SERIF}; color: var(--ink); letter-spacing: -.015em; }
  .cin .end__q { font: italic 400 34px/1.4 ${SERIF}; color: var(--ink2); margin-top: 22px; }
  .cin .end__u { font: 600 34px/1.3 ${SANS}; color: var(--ink); margin-top: 56px; }
  .cin .end__u span { display: block; font: 400 23px/1.45 ${SANS}; color: var(--graphite); margin-top: 6px; }
  .cin .end__n { font: 400 19px/1.5 ${SANS}; color: var(--graphite); margin: 40px auto 0; max-width: 1100px; }
  .cin .end__s { font: 400 16px/1.5 ${MONO}; color: var(--graphite); margin-top: 16px; }
`;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'Inside a Level D flight simulator',
  aspect: '16x9',
  fov: 30,
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  build(ctx) {
    const { scene, camera, renderer, text, label } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    if (document.fonts) document.fonts.load('600 58px Lora');

    // paper, not neon: no tone curve, no bloom, a light vignette and grain
    renderer.toneMapping = THREE.NoToneMapping;
    ctx.bloom.enabled = false;
    ctx.grade.uniforms.uVignette.value = 0.14;
    ctx.grade.uniforms.uGrain.value = 0.018;
    scene.background = NIGHT.clone();
    scene.add(camera);

    /* ---------------------------------------- the night outside, as a texture */
    const rw = { scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(RVF, RTW / RTH, 0.5, 40000) };
    const rt = new THREE.WebGLRenderTarget(RTW, RTH, { samples: 4, type: THREE.HalfFloatType });
    rw.scene.background = new THREE.Color(0, 0, 0);
    const sky = new THREE.Mesh(new THREE.SphereGeometry(20000, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec3 vD; void main() { vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        varying vec3 vD;
        void main() {
          float h = normalize(vD).y;
          vec3 top = vec3(0.004, 0.006, 0.014), hor = vec3(0.045, 0.05, 0.075), glow = vec3(0.09, 0.06, 0.04);
          vec3 c = mix(hor, top, smoothstep(-0.01, 0.32, h)) + glow * exp(-abs(h) * 22.0) * 0.8;
          if (h < 0.0) c = mix(c, vec3(0.006, 0.007, 0.009), smoothstep(0.0, -0.015, h));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }));
    rw.scene.add(sky);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80000, 80000), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.006, 0.007, 0.009) }));
    ground.rotation.x = -Math.PI / 2;
    rw.scene.add(ground);
    const runwayMat = new THREE.ShaderMaterial({
      uniforms: { uPool: { value: V(0, -200, 1) } },
      vertexShader: /* glsl */`varying vec2 vP; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uPool; varying vec2 vP;
        void main() {
          float x = vP.x, zz = -vP.y, paint = 0.0;
          if (abs(x) < 0.45 && mod(zz, 50.0) < 30.0 && zz > 60.0 && zz < 2940.0) paint = 1.0;
          if (abs(abs(x) - 22.0) < 0.45) paint = 1.0;
          if (zz > 6.0 && zz < 36.0 && abs(x) > 3.0 && abs(x) < 20.0 && mod(abs(x) - 3.0, 3.6) < 1.8) paint = 1.0;
          vec3 c = mix(vec3(0.022, 0.024, 0.028), vec3(0.62), paint);
          float dz = vP.y - uPool.y, dx = x - uPool.x;
          float pool = exp(-dz * dz / (2.0 * 75.0 * 75.0)) * exp(-dx * dx / (2.0 * 26.0 * 26.0)) * uPool.z;
          gl_FragColor = vec4(c * (0.05 + 1.5 * pool), 1.0);
        }`,
    });
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(60, 3000), runwayMat);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, 0.03, -1500);
    rw.scene.add(runway);
    // edge, centreline (white, then red and white, then red), threshold, end, taxiway, a town, stars
    const LP = [], LC = [], LS = [];
    const light = (x, y, z, c, s) => { LP.push(x, y, z); LC.push(...c); LS.push(s); };
    const WHITE = [1.7, 1.6, 1.35], YEL = [1.6, 1.25, 0.5], RED = [1.7, 0.18, 0.12], GREEN = [0.25, 1.6, 0.6], BLUE = [0.25, 0.45, 1.8];
    for (let z = 0; z <= 3000; z += 60) for (const x of [-23.5, 23.5]) light(x, 0.4, -z, z > 2400 ? YEL : WHITE, 1.1);
    for (let z = 15; z < 3000; z += 15) { const left = 3000 - z; light(0, 0.1, -z, left < 300 ? RED : left < 900 ? ((z / 15) % 2 ? RED : WHITE) : WHITE, 0.8); }
    for (let x = -22; x <= 22; x += 3) { light(x, 0.3, 0, GREEN, 1.0); light(x, 0.3, -3000, RED, 1.0); }
    for (let z = 0; z <= 3000; z += 30) for (const x of [185, 215]) light(x, 0.3, -z, BLUE, 0.9);
    const tr = seeded(5);
    for (let c = 0; c < 46; c++) {
      const a = (tr() - 0.5) * 2.4 - Math.PI / 2, d = 3500 + tr() * 14000, cx = Math.cos(a) * d, cz = Math.sin(a) * d, n = 40 + tr() * 160;
      for (let i = 0; i < n; i++) { const r = tr() * (300 + d * 0.06), b = tr() * 6.283; light(cx + r * Math.cos(b), 2, cz + r * Math.sin(b), tr() < 0.7 ? [1.5, 0.95, 0.45] : [1.2, 1.2, 1.1], 7 + tr() * 6); }
    }
    for (let i = 0; i < 420; i++) { const a = tr() * 6.283, e = 0.08 + tr() * 1.3; light(19000 * Math.cos(e) * Math.cos(a), 19000 * Math.sin(e), 19000 * Math.cos(e) * Math.sin(a), [0.5, 0.52, 0.6], 60 + tr() * 50); }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(LP, 3));
    lg.setAttribute('aColor', new THREE.Float32BufferAttribute(LC, 3));
    lg.setAttribute('aSize', new THREE.Float32BufferAttribute(LS, 1));
    const lights = new THREE.Points(lg, new THREE.ShaderMaterial({
      uniforms: { uScale: { value: RTH / (2 * Math.tan(RVF * Math.PI / 360)) } },
      vertexShader: /* glsl */`
        attribute vec3 aColor; attribute float aSize; uniform float uScale; varying vec3 vC; varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float d = -mv.z, s = aSize * uScale / max(d, 1.0);
          gl_PointSize = clamp(s * 2.6, 2.2, 54.0);
          vA = exp(-d * 0.00011) * clamp(s / 1.4, 0.3, 1.0);
          vC = aColor;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vC; varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          gl_FragColor = vec4(vC * (smoothstep(0.32, 0.0, r) + exp(-r * r * 6.0) * 0.5) * vA, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    lights.frustumCulled = false;
    rw.scene.add(lights);

    /* --------------------------------------------------------- the hall */
    const hall = new THREE.Group();
    scene.add(hall);
    const gp = [], gf = [];
    const fadeAt = r => 1 - clamp01((Math.hypot(r.x, r.z) - 6) / 10);
    for (let i = -16; i <= 16; i++) for (const [a, b] of [[V(i, 0, -16), V(i, 0, 16)], [V(-16, 0, i), V(16, 0, i)]]) {
      for (let k = 0; k < 32; k++) {
        const p = a.clone().lerp(b, k / 32), q = a.clone().lerp(b, (k + 1) / 32);
        gp.push(p.x, 0, p.z, q.x, 0, q.z); gf.push(fadeAt(p), fadeAt(q));
      }
    }
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    gg.setAttribute('aF', new THREE.Float32BufferAttribute(gf, 1));
    hall.add(new THREE.LineSegments(gg, new THREE.ShaderMaterial({
      uniforms: { ...U, uRule: { value: col(C.rule) } },
      vertexShader: /* glsl */`attribute float aF; varying float vF; void main() { vF = aF; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform vec3 uRule; uniform vec3 uPaper; uniform vec3 uNightC; uniform float uHouse; uniform float uFade; varying float vF;
        void main() { vec3 c = mix(uPaper, uRule, vF * 0.8 * (1.0 - uFade)); gl_FragColor = vec4(mix(uNightC, c, uHouse), 1.0); }`,
    })));
    const sc = document.createElement('canvas'); sc.width = sc.height = 128;
    const sg = sc.getContext('2d'), grd = sg.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = grd; sg.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), color: INK.clone(), transparent: true, opacity: 0.1, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01;
    hall.add(shadow);

    /* ------------------------------------------------------------ the rig */
    const rig = new THREE.Group();
    scene.add(rig);
    const L1 = ink(1.7), L2 = ink(1.15), PH = ink(1.3, { dash: [0.18, 0.12] });
    const box = (w, h, d, x, y, z, hex, parent, shade, line = L1) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paper(hex, shade));
      m.position.set(x, y, z);
      parent.add(m);
      if (line) edges(m, line);
      return m;
    };
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.85, 0.18, 6), paper('#E6E0D4'));
    basePlate.position.y = 0.09; basePlate.rotation.y = Math.PI / 6;
    rig.add(basePlate); edges(basePlate, L1);
    for (let k = 0; k < 3; k++) { const a = (k * 120 + 90) * Math.PI / 180; box(0.55, 0.22, 0.4, 2.45 * Math.cos(a), 0.29, 2.45 * Math.sin(a), '#DDD6C9', rig, 0.3).rotation.y = -a; }
    const move = new THREE.Group();                 // everything the actuators carry
    rig.add(move);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.16, 3), paper('#E9E4DA'));
    plate.rotation.y = Math.PI / 6 + Math.PI; plate.position.y = -0.04;
    move.add(plate); edges(plate, L1);
    box(3.3, 0.22, 4.1, 0, 0.17, 0, '#EFEBE3', move);                         // cabin floor
    box(0.07, 2.3, 4.1, -1.62, 1.43, 0, '#F4F1EA', move, 0.22);              // far wall
    box(3.3, 2.3, 0.07, 0, 1.43, 2.02, '#F2EFE8', move, 0.22);               // rear wall
    box(3.3, 0.95, 0.07, 0, 0.75, -2.02, '#F2EFE8', move, 0.22);             // below the windows
    box(3.3, 0.24, 0.07, 0, 2.46, -2.02, '#F2EFE8', move, 0.22);             // above them
    box(0.12, 1.2, 0.07, 0, 1.82, -2.02, '#F2EFE8', move, 0.22);             // centre post
    // the cut-away near wall and roof, as phantom lines; the rear door
    poly([V(1.65, 0.28, -2.05), V(1.65, 2.58, -2.05), V(1.65, 2.58, 2.05), V(1.65, 0.28, 2.05)], PH, move, true);
    poly([V(-1.65, 2.58, -2.05), V(1.65, 2.58, -2.05), V(1.65, 2.58, 2.05), V(-1.65, 2.58, 2.05)], PH, move, true);
    poly([V(-0.42, 0.3, 2.06), V(-0.42, 2.1, 2.06), V(0.42, 2.1, 2.06), V(0.42, 0.3, 2.06)], L2, move);
    for (const x of [-0.53, 0.53]) {
      box(0.52, 0.12, 0.52, x, 0.98, -0.62, '#E3DDD2', move, 0.3);
      box(0.52, 0.95, 0.12, x, 1.5, -0.33, '#E3DDD2', move, 0.3).rotation.x = -0.12;
    }
    box(0.36, 0.62, 0.9, 0, 0.6, -1.3, '#E6E0D5', move, 0.3);                     // pedestal
    box(2.7, 0.62, 0.14, 0, 1.12, -1.86, '#E8E3D9', move, 0.3).rotation.x = 0.28; // instrument panel
    for (let i = 0; i < 6; i++) box(0.34, 0.28, 0.03, -0.95 + i * 0.38, 1.16, -1.77, '#2B2A27', move, 0.05, L2).rotation.x = 0.28;
    box(2.5, 0.1, 0.34, 0, EYE.y - 0.27, -1.8, '#E8E3D9', move, 0.3);         // glareshield
    box(1.0, 0.12, 0.9, 0, 2.43, -0.72, '#E6E0D5', move, 0.3);                // overhead panel
    box(1.25, 0.08, 0.6, 0.35, 0.95, 0.95, '#E6E0D5', move, 0.3);             // instructor's desk
    box(0.5, 0.36, 0.04, 0.12, 1.2, 0.72, '#2B2A27', move, 0.05, L2).rotation.x = -0.25;
    box(0.5, 0.36, 0.04, 0.68, 1.2, 0.72, '#2B2A27', move, 0.05, L2).rotation.x = -0.25;
    box(0.5, 0.1, 0.5, 0.35, 0.82, 1.55, '#E3DDD2', move, 0.3);
    // the mirror: the out-the-window picture, mapped so it is right from the design eye
    const NU = 72, NV = 14, PHI = 72 * Math.PI / 180, H0 = -0.66, H1 = 0.86;
    const tx = Math.tan(RVF * Math.PI / 360) * RTW / RTH, ty = Math.tan(RVF * Math.PI / 360);
    const mp = [], mu = [], mi = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const ph = -PHI + 2 * PHI * i / NU, h = H0 + (H1 - H0) * j / NV;
      mp.push(EYE.x + MR * Math.sin(ph), EYE.y + h, EYE.z - MR * Math.cos(ph));
      mu.push(0.5 + 0.5 * Math.tan(ph) / tx, 0.5 + 0.5 * (h / (MR * Math.cos(ph))) / ty);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; mi.push(a, c, b, b, c, d); }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3));
    mg.setAttribute('aUV', new THREE.Float32BufferAttribute(mu, 2));
    mg.setIndex(mi);
    const mirror = new THREE.Mesh(mg, new THREE.ShaderMaterial({
      uniforms: { uMap: { value: rt.texture }, uPaper: U.uPaper, uFade: U.uFade },
      vertexShader: /* glsl */`attribute vec2 aUV; varying vec2 vUV; void main() { vUV = aUV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform vec3 uPaper; uniform float uFade; varying vec2 vUV;
        void main() {
          vec3 c = vec3(0.004, 0.005, 0.008);
          if (vUV.x > 0.0 && vUV.x < 1.0 && vUV.y > 0.0 && vUV.y < 1.0) c = texture2D(uMap, vUV).rgb;
          float e = smoothstep(0.0, 0.05, vUV.x) * smoothstep(1.0, 0.95, vUV.x);
          gl_FragColor = vec4(mix(c * mix(0.35, 1.0, e) + vec3(0.01, 0.012, 0.018), uPaper, uFade), 1.0);
        }`,
      side: THREE.DoubleSide,
    }));
    move.add(mirror);
    // the display's housing: far half solid, near half cut away; projectors on top
    const HR = 2.72, HY0 = EYE.y - 0.92, HY1 = EYE.y + 1.12, HA = 76 * Math.PI / 180;
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(HR, HR, HY1 - HY0, 36, 1, true, Math.PI, HA), paper('#F3F0E9', 0.3));
    hood.position.set(EYE.x, (HY0 + HY1) / 2, EYE.z);
    move.add(hood);
    const arcPts = (y, a0, a1) => { const out = []; for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; out.push(V(EYE.x + HR * Math.sin(a), y, EYE.z + HR * Math.cos(a))); } return out; };
    for (const y of [HY0, HY1]) { poly(arcPts(y, Math.PI, Math.PI + HA), L1, move); poly(arcPts(y, Math.PI - HA, Math.PI), PH, move); }
    const ea = Math.PI + HA;
    poly([V(EYE.x + HR * Math.sin(ea), HY0, EYE.z + HR * Math.cos(ea)), V(EYE.x + HR * Math.sin(ea), HY1, EYE.z + HR * Math.cos(ea))], L1, move);
    const lidShape = new THREE.Shape();
    lidShape.moveTo(0, 0);
    for (let i = 0; i <= 40; i++) { const a = Math.PI + HA * i / 40; lidShape.lineTo(HR * Math.sin(a), -HR * Math.cos(a)); }
    lidShape.lineTo(0, 0);
    const lid = new THREE.Mesh(new THREE.ShapeGeometry(lidShape), paper('#EEEAE2', 0.2));
    lid.rotation.x = -Math.PI / 2; lid.position.set(EYE.x, HY1, EYE.z);
    move.add(lid);
    for (const [x, z] of [[-1.3, -2.2], [-0.25, -2.75], [0.85, -2.45]]) box(0.42, 0.3, 0.55, x, HY1 + 0.15, z, '#E2DCCF', move, 0.3);
    // the actuators: a body and a rod each, drawn as ink-edged tubes
    const tube = (wInk, wFill, fillHex) => {
      const a = new LineMaterial({ color: INK.clone(), linewidth: wInk, worldUnits: true }); a.resolution.set(1920, 1080); a.userData.base = INK.clone(); LINES.push(a);
      const b = new LineMaterial({ color: col(fillHex), linewidth: wFill, worldUnits: true }); b.resolution.set(1920, 1080); b.userData.base = col(fillHex); LINES.push(b);
      b.depthFunc = THREE.LessEqualDepth;
      const la = new Line2(new LineGeometry(), a), lb = new Line2(new LineGeometry(), b);
      la.renderOrder = 1; lb.renderOrder = 2;
      rig.add(la, lb);
      return [la, lb];
    };
    const legs = BASE.map(() => ({ body: tube(0.3, 0.22, '#E4DED3'), rod: tube(0.15, 0.09, '#F2EFE8') }));
    const joint = new THREE.SphereGeometry(0.11, 14, 8);
    const joints = [...BASE, ...TOPJ].map(() => { const j = new THREE.Mesh(joint, paper(C.ink, 0)); rig.add(j); return j; });
    // a fixed access platform with its stairs, and a person for scale
    box(1.6, 0.12, 1.2, 0, HP + 0.24, 3.35, '#E6E0D4', rig, 0.25);
    for (const x of [-0.8, 0.8]) poly([V(x, HP + 0.3, 2.78), V(x, HP + 1.25, 2.78), V(x, HP + 1.25, 3.95)], L2, rig);
    for (const x of [-0.75, 0.75]) { poly([V(x, 0.0, 6.3), V(x, HP + 0.18, 3.95)], L1, rig); poly([V(x, 0.9, 6.3), V(x, HP + 1.1, 3.95)], L2, rig); }
    for (let i = 1; i < 9; i++) { const z = lerp(6.3, 3.95, i / 9), y = lerp(0, HP + 0.18, i / 9); poly([V(-0.75, y, z), V(0.75, y, z)], L2, rig); }
    const ps = new THREE.Shape();
    ps.moveTo(-0.2, 0); ps.lineTo(-0.17, 0.82); ps.lineTo(-0.24, 1.38); ps.quadraticCurveTo(-0.22, 1.5, -0.1, 1.5);
    ps.lineTo(0.1, 1.5); ps.quadraticCurveTo(0.22, 1.5, 0.24, 1.38); ps.lineTo(0.17, 0.82); ps.lineTo(0.2, 0); ps.lineTo(-0.2, 0);
    const person = new THREE.Group();
    const headM = new THREE.Mesh(new THREE.CircleGeometry(0.115, 24), paper(C.graphite, 0));
    headM.position.y = 1.64;
    person.add(new THREE.Mesh(new THREE.ShapeGeometry(ps), paper(C.graphite, 0)), headM);
    person.position.set(2.2, 0, 6.6);
    rig.add(person);
    // the pilot's view, as an inset: a plane that rides with the camera
    const inset = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rt.texture, depthTest: false, transparent: true, opacity: 0 }));
    inset.renderOrder = 10;
    camera.add(inset);

    Object.assign(ctx, { rw, rt, runwayMat, sky, rig, move, legs, joints, mirror, person, inset, hall, shadow });

    /* --------------------------------------------------------------- type */
    const kit = { text, T, W, project: ctx.project };
    const HD = { x: 120, y: 150, w: 700 };
    const say = (a, b, hd, sb, o = {}) => text({ at: a, out: b, cls: 'blk' + (o.wide ? ' wide' : ''), place: o.wide ? { x: 120, y: 132, w: 1600 } : HD,
      dur: 0.5, stagger: 0.035, rise: 10, blur: 3, html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const kick = (a, b, html) => text({ at: a, out: b, cls: 'kick', words: false, dur: 0.5, rise: 0, place: { x: 120, y: 84, w: 1200 }, html });
    const foot = (a, b, html) => text({ at: a, out: b, cls: 'foot', words: false, dur: 0.5, rise: 0, place: { x: 120, y: 1014, w: 1640 }, html });
    const chapter = (a, b, n, title) => text({ at: a, out: b, cls: 'chap', words: false, dur: 0.6, rise: 14, outDur: 0.4,
      place: { x: 260, y: 330, w: 1400, align: 'center' }, html: `<div class="chap__n">${n}</div><div class="chap__t">${title}</div><div class="chap__k">Chapter ${n}</div>` });
    const gone = 0.05;

    text({ at: T.open, out: T.reveal - 2.4, cls: 'open', place: { x: 260, y: 860, w: 1400, align: 'center' }, dur: 0.6, stagger: 0.06, rise: 8, blur: 4,
           html: 'This take-off never left the ground.' });
    kick(T.reveal - 0.4, T.promise + 0.8, 'Dr. Ozgur Ural &middot; a research film');
    say(T.reveal, T.trust - gone, 'Inside a Level D flight simulator', 'It happened in here: a full-flight simulator. A copy of an airliner&rsquo;s cockpit, standing on six legs.');
    say(T.trust, T.promise - gone, 'Trusted like the aircraft', 'The best of them stand in for the aircraft itself. A pilot can do <b>all the flight training and checking</b> for a new airliner in one, and first fly the real aircraft on an airline flight, with a check pilot beside them.');
    foot(W('trust', 'pilot'), T.promise - 0.3, 'Source: <i>14 CFR Part 121, Appendix H</i>: at Level C and D, all pilot flight training and checking except operating experience, the line check and the aircraft walk-round.');
    say(T.promise, T.senses - 3.4, 'How does a machine earn that much trust?', 'It has to fool every sense, prove it, and never be late.');
    chapter(T.senses - 3.1, T.senses - 0.15, 'I', 'Fooling the senses');
    kick(T.senses, T.levels - 3.3, '<b>I</b> &middot; Fooling the senses');
    say(T.senses, T.eyes - gone, 'Four senses, one story', 'A pilot flies with more than eyes. The inner ear feels motion, the hands feel the controls, and the ears and the seat feel every rumble. The simulator must feed them all, and <b>keep them in agreement</b>.');
    say(T.eyes, T.mirror - gone, 'The eyes: where is the runway?', 'Start with the eyes. On an ordinary screen, the two pilots would see the runway in different directions.');
    say(T.mirror, T.motion - gone, 'A mirror puts it far away', 'So the picture is shown in a huge curved mirror, which sends its light out in <b>parallel rays</b>, as if from far away. Both pilots see the runway straight ahead.');
    foot(T.eyes + 0.5, T.motion - 0.3, 'Source: <i>14 CFR Part 60, Appendix C, Attachment 2, &sect;18</i>: in a collimated display the rays from any point are parallel, so the runway appears straight ahead to both crew members.');
    say(T.motion, T.equiv - gone, 'Six legs, a short reach', 'Now the inner ear. Six actuators can tilt and slide the whole cabin, but only a short way. So the simulator borrows a trick from physics.');
    const DOF = ['pitch', 'roll', 'yaw', 'heave', 'sway', 'surge'];
    text({ at: W('motion', 'six') - 0.2, out: T.equiv - 0.3, cls: 'dof', words: false, dur: 0.4, rise: 0, place: { x: 120, y: 560, w: 760 },
           html: DOF.map(d => `<span>${d}</span>`).join(''),
           update: (t, el) => { const s0 = W('motion', 'six'); el.querySelectorAll('span').forEach((s, i) => s.classList.toggle('on', t > s0 + 0.15 + i * 0.62 && t < s0 + 0.77 + i * 0.62)); } });
    foot(W('motion', 'six'), T.equiv - 0.3, 'Levels C and D: a six-degrees-of-freedom platform: pitch, roll, yaw, heave, sway and surge (<i>14 CFR Part 60</i>).');
    say(T.equiv, T.tilt - gone, 'Gravity or acceleration?', 'Your inner ear can&rsquo;t tell gravity from acceleration. Physicists call it the <b>equivalence principle</b>; Einstein built general relativity on it.');
    say(T.tilt, T.agree - gone, 'Borrowing gravity', 'So for a take-off, the cabin gives a quick shove forward, then tilts its nose up, too slowly to notice. Gravity presses you back into the seat, just like acceleration.');
    foot(T.tilt + 0.5, T.hands - 0.3, 'Source: <i>14 CFR Part 60, Appendix A, Attachment 2</i>: forward acceleration is cued by a momentary forward motion, with a nose-up tilt for the sustained force.');
    say(T.agree, T.washout - gone, 'Eyes and inner ear agree', 'The screen tilts with you, so the runway still looks level. Eyes and inner ear agree, and the brain believes it.');
    say(T.washout, T.hands - gone, 'Back to the middle, unnoticed', 'Then the cabin creeps back to the middle, below what you can sense, ready for the next cue.');
    say(T.hands, T.levels - 3.4, 'Hands and ears', 'Motors make the controls push back like the real ones, and the sound and the runway rumble are matched to the aircraft too.');
    foot(T.hands + 0.5, T.levels - 3.4, 'At Level D, sound is an objective test: a device that misses its tolerances can be qualified only at Level C (<i>14 CFR Part 60, Appendix A</i>).');
    chapter(T.levels - 3.1, T.levels - 0.15, 'II', 'Proving it');
    kick(T.levels, T.delay - 3.3, '<b>II</b> &middot; Proving it');
    say(T.levels, T.tests - gone, 'Level A to Level D', 'Then it has to prove it. Regulators grade these simulators from Level A to Level D, and D is the highest.');
    say(T.tests, T.yearly - gone, 'Tested against the real aircraft', 'To earn it, the simulator flies a long list of tests. Each replays a maneuver from the real aircraft&rsquo;s flight tests, and the simulator must stay inside a <b>narrow band</b> around what the aircraft did.');
    foot(T.tests + 0.5, T.yearly - 0.3, 'Source: <i>14 CFR Part 60, Appendix A, Attachment 2</i>: each objective test is compared with validation data within stated tolerances. The curve shown is illustrative.');
    say(T.yearly, T.bridge - gone, 'And again, every year', 'Every test is run again each year, and the machine must pass a check within a day before anyone trains in it.');
    foot(T.yearly + 0.4, T.bridge - 0.3, 'Source: <i>14 CFR 60.19(a)</i>: all appropriate objective tests each year; a functional preflight check within the preceding 24 hours.');
    say(T.bridge, T.delay - 3.4, 'One test is about time', 'One of those tests is about time.');
    chapter(T.delay - 3.1, T.delay - 0.15, 'III', 'The clock');
    kick(T.delay, T.ai - 3.3, '<b>III</b> &middot; The clock');
    say(T.delay, T.chain - gone, 'A hundred and fifty milliseconds', 'When the pilot moves the controls, the view, the instruments and the cabin must respond within a hundred and fifty milliseconds, about the blink of an eye. Miss it, and the simulator does not qualify.', { wide: true });
    foot(T.delay + 0.5, T.chain - 0.3, 'Source: <i>14 CFR Part 60, Appendix A</i>, transport delay: from the control input, through every host computer, to the motion, instrument and visual response.');
    say(T.chain, T.tighter - gone, 'A chain of computers shares that blink', 'In that blink, the signal crosses a chain of computers. One reads the controls. One works out how the aircraft flies. One runs its systems. One draws the world. The last updates the screens and moves the cabin.', { wide: true });
    foot(T.chain + 0.5, T.tighter - 0.3, 'Stage times are illustrative. No employer design is shown.');
    say(T.tighter, T.frames - gone, 'The blink gets shorter', 'Europe&rsquo;s newest standard cuts that to a hundred milliseconds for the most realistic new simulators. A chain that fit before can now miss.', { wide: true });
    foot(T.tighter + 0.5, T.frames - 0.3, 'Source: <i>EASA CS-FSTD Issue 1 (2026), test 6.a.1</i>: 100 ms at fidelity level S, for new devices.');
    say(T.frames, T.slips - gone, 'Not once: sixty times a second', 'And it&rsquo;s not done once. The loop runs sixty times a second, for hours: a four-hour session is <b>864,000 frames</b>.');
    foot(T.frames + 0.5, T.slips - 0.3, '4 hours &times; 3,600 seconds &times; 60 frames = 864,000 frames.');
    say(T.slips, T.rack - gone, 'Rare is not never', 'If one frame in a thousand slips, that&rsquo;s <b>864 jolts</b>. And slips come in bunches, so the pilot feels a stutter, not a blip.');
    foot(T.slips + 0.5, T.rack - 0.3, 'Expected slips = frames &times; rate: 864,000 &times; 1/1,000 = 864, even before they bunch.');
    say(T.rack, T.budget - gone, 'Every frame waits for the slowest', 'Why do frames slip? The work is split across a rack of computers, and every frame has to wait for the slowest one.');
    say(T.budget, T.count - gone, 'Budget every computer', 'One slow computer makes the whole frame late, and an average hides it. So every computer gets its own time budget, <b>checked every frame</b>.');
    foot(T.rack + 0.5, T.count - 0.3, 'Nine hosts and their times are illustrative.');
    say(T.count, T.determinism - gone, 'Count every overrun', 'And every overrun is counted while it runs. A spot check can miss a short spike; a counter can&rsquo;t.');
    text({ at: T.determinism, out: T.ai - 3.4, cls: 'stmt', place: { x: 260, y: 300, w: 1400, align: 'center' }, dur: 0.6, stagger: 0.05, rise: 10, blur: 3,
           html: '<div class="bigk">Determinism</div><div class="big" style="margin-top:22px">The <em>slowest</em> frame counts, not the average.</div>' });
    chapter(T.ai - 3.1, T.ai - 0.15, 'IV', 'The thesis');
    kick(T.ai, T.coda - 0.3, '<b>IV</b> &middot; The thesis');
    say(T.ai, T.thesis - gone, 'Now add AI', 'Next, we&rsquo;ll want AI inside loops like this: models that see, predict and decide. Many take longer on some inputs than on others, and their slowest answers are exactly what this rule punishes.');
    foot(T.ai + 0.5, T.thesis - 0.3, 'An illustrative distribution: the response time of many models depends on the input (the length of a generated answer, for one).');
    say(T.thesis, T.coda - gone, 'The thesis', 'A simulator is trusted because it brings evidence: tests against the real aircraft, and timing proven every frame. AI in the loop must earn trust the same way: <b>with evidence, not averages</b>.');
    text({ at: T.coda, out: T.card - 0.3, cls: 'stmt', place: { x: 260, y: 360, w: 1400, align: 'center' }, dur: 0.6, stagger: 0.06, rise: 10, blur: 3,
           html: '<div class="big">Fidelity earns the trust.</div>' });
    text({ at: W('coda', 'determinism') - 0.1, out: T.card - 0.3, cls: 'stmt', place: { x: 260, y: 470, w: 1400, align: 'center' }, dur: 0.6, stagger: 0.06, rise: 10, blur: 3,
           html: '<div class="big"><em>Determinism</em> keeps it.</div>' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 20, place: { x: 160, y: 236, w: 1600, align: 'center' },
           html: `<div class="end__t">Inside a Level D flight simulator</div>
                  <div class="end__q">Fidelity earns the trust. Determinism keeps it.</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>
                  <div class="end__n">Informed by the author&rsquo;s work on Level D full-flight simulators at Avion. No employer design is shown; stage times and the rack are illustrative. The thesis is the author&rsquo;s view.</div>
                  <div class="end__s">Sources: 14 CFR Part 60 &middot; 14 CFR Part 121, Appendix H &middot; EASA CS-FSTD(A) &middot; EASA CS-FSTD Issue 1 (2026)</div>` });

    // annotations pinned to the machine, as the reveal names its parts
    const mw = (x, y, z) => () => move.localToWorld(V(x, y, z));
    const ann = (html, anchor, a, b, left = false) => label({ cls: 'ann' + (left ? ' l' : ''), html: `<i></i><s></s><span>${html}</span>`,
      anchor, ax: left ? 1 : 0, ay: 0.5, alpha: t => win(t, a, b, 0.45, 0.5) });
    ann('The cockpit<small>an exact copy of one aircraft type</small>', mw(1.0, 1.55, -0.6), W('reveal', 'cockpit') - 0.1, T.promise - 0.2);
    ann('The visual display<small>a wrap-around curved mirror</small>', mw(-0.4, HY1 + 0.05, -3.0), W('reveal', 'cockpit') + 0.5, T.promise - 0.2, true);
    ann('Six actuators<small>the motion platform</small>', () => V(1.9, 1.3, 1.6), W('reveal', 'six') - 0.1, T.promise - 0.2);
    ann('The instructor&rsquo;s station', mw(0.75, 1.45, 0.75), W('trust', 'pilot'), T.promise - 0.2);
    ann('A person, for scale', () => V(2.2, 1.0, 6.6), W('reveal', 'legs') + 0.3, T.trust + 4, true);
    ann('Motion envelope<small>its whole reach</small>', mw(1.7, 0.4, -2.6), W('motion', 'short') - 0.2, T.equiv - 0.4);

    // the forces on the pilot during the take-off cue, drawn over the machine
    const F = text({ at: T.tilt + 1.5, out: T.agree + 3.5, cls: 'fig', words: false, dur: 0.4, rise: 0, place: { x: 0, y: 0, w: 1920 },
      html: '<svg width="1920" height="1080" viewBox="0 0 1920 1080" style="display:block;overflow:visible"></svg>' });
    {
      const svg = F.el.querySelector('svg');
      const gl = FIG.E('line', { stroke: C.ink, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, svg);
      const fl = FIG.E('line', { stroke: C.coral, 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
      const gh = FIG.E('path', { fill: 'none', stroke: C.ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      const fh = FIG.E('path', { fill: 'none', stroke: C.coral, 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
      const gt = FIG.E('text', { 'font-family': SANS, 'font-size': 26, 'font-style': 'italic', 'font-weight': 600, fill: C.ink }, svg, 'g');
      const ft = FIG.E('text', { 'font-family': SANS, 'font-size': 22, 'font-weight': 600, fill: C.coralText }, svg, 'felt as acceleration');
      const eq = FIG.E('text', { 'font-family': SANS, 'font-size': 30, 'font-weight': 500, fill: C.ink, x: 1180, y: 150 }, svg);
      for (const [s, it] of [['g', 1], [' · sin ', 0], ['θ', 1], [' = ', 0], ['a', 1]]) FIG.E('tspan', it ? { 'font-style': 'italic' } : {}, eq, s);
      const head = (p, q) => { const a = Math.atan2(q.y - p.y, q.x - p.x); return `M ${q.x - 14 * Math.cos(a - 0.5)} ${q.y - 14 * Math.sin(a - 0.5)} L ${q.x} ${q.y} L ${q.x - 14 * Math.cos(a + 0.5)} ${q.y - 14 * Math.sin(a + 0.5)}`; };
      F.update = t => {
        const o = move.localToWorld(V(-0.53, EYE.y, -0.6));
        const p0 = ctx.project(o), pg = ctx.project(o.clone().add(V(0, -1.4, 0)));
        const th = move.rotation.x;
        const pf = ctx.project(move.localToWorld(V(-0.53, EYE.y, -0.6 + 1.4 * Math.sin(th) / 0.26)));
        const ug = ramp(t, W('tilt', 'gravity') - 0.3, W('tilt', 'gravity') + 0.2), uf = ramp(t, W('tilt', 'presses') - 0.2, W('tilt', 'presses') + 0.3);
        const g1 = { x: lerp(p0.x, pg.x, ug), y: lerp(p0.y, pg.y, ug) }, f1 = { x: lerp(p0.x, pf.x, uf), y: lerp(p0.y, pf.y, uf) };
        gl.setAttribute('x1', p0.x); gl.setAttribute('y1', p0.y); gl.setAttribute('x2', g1.x); gl.setAttribute('y2', g1.y);
        fl.setAttribute('x1', p0.x); fl.setAttribute('y1', p0.y); fl.setAttribute('x2', f1.x); fl.setAttribute('y2', f1.y);
        gh.setAttribute('d', ug > 0.05 ? head(p0, g1) : ''); fh.setAttribute('d', uf > 0.05 && th > 0.02 ? head(p0, f1) : '');
        gt.setAttribute('x', g1.x + 12); gt.setAttribute('y', g1.y); gt.setAttribute('opacity', ug);
        ft.setAttribute('x', f1.x + 14); ft.setAttribute('y', f1.y + 30); ft.setAttribute('opacity', uf);
        eq.setAttribute('opacity', ramp(t, W('tilt', 'gravity') + 0.4, W('tilt', 'gravity') + 0.9));
      };
    }
    text({ at: T.agree - 0.2, out: T.washout + 2, cls: 'insetbox', words: false, dur: 0.5, rise: 0, place: { x: 120, y: 618, w: 560 },
           html: '<div class="inset" style="height:280px"></div><div class="inset__c">What the pilot sees: still level</div>' });
    text({ at: W('agree', 'agree') - 0.2, out: T.washout - 0.3, cls: 'checks', words: false, dur: 0.4, rise: 6, place: { x: 760, y: 980, w: 900 },
           html: 'eyes <b>&#10003;</b> &nbsp; inner ear <b>&#10003;</b> &nbsp; they agree' });

    for (const f of ['training', 'roadmap', 'senses', 'parallax', 'equivalence', 'cueing', 'controls', 'levels', 'tests', 'clock',
                     'session', 'rack', 'counter', 'maxNotMean', 'aiTail', 'thesis']) FIG[f](kit);
  },

  frame(t, ctx) {
    const { camera, scene, renderer, rw, rt, runwayMat, sky, rig, move, legs, joints, person, inset, shadow, hall } = ctx;

    // house lights: night in the cockpit, then paper; the machine fades into the paper while a figure has the frame
    const L = ease.inOutSine(ramp(t, 5.9, 11.8));
    U.uHouse.value = L;
    scene.background.copy(NIGHT).lerp(PAPER, L);
    const vis = clamp01(win(t, -1, T.promise + 1.0, 0.1, 1.3) + win(t, T.motion - 1.6, T.equiv + 0.5, 1.2, 0.8) +
                        win(t, T.tilt - 1.1, T.hands + 0.2, 1.0, 0.9) + 0.55 * win(t, T.coda - 1.6, 1e9, 1.6, 0.1) * (1 - 0.6 * ramp(t, T.card - 0.4, T.card + 0.6)));
    U.uFade.value = 1 - vis;
    rig.visible = vis > 0.002;
    hall.visible = rig.visible && L > 0.01;
    shadow.material.opacity = 0.1 * vis * L;
    for (const m of LINES) { m.color.copy(m.userData.base).lerp(PAPER, 1 - vis); if (L < 1) m.color.lerp(CABIN_DARK, 1 - L); }

    // the platform, then the legs from the base joints to the joints it carries
    const p = poseAt(t);
    move.position.set(p.x, HP + p.y, p.z);
    move.rotation.set(p.rx, p.ry, p.rz, 'YXZ');
    move.updateMatrixWorld(true);
    legs.forEach((leg, i) => {
      const b = BASE[i], top = move.localToWorld(TOPJ[(i + 1) % 6].clone());
      const d = top.clone().sub(b).normalize(), bodyEnd = b.clone().addScaledVector(d, 1.45), r0 = bodyEnd.clone().addScaledVector(d, -0.1);
      for (const l of leg.body) l.geometry.setPositions([b.x, b.y, b.z, bodyEnd.x, bodyEnd.y, bodyEnd.z]);
      for (const l of leg.rod) l.geometry.setPositions([r0.x, r0.y, r0.z, top.x, top.y, top.z]);
      joints[i].position.copy(b);
      joints[6 + i].position.copy(top);
    });

    // the camera: in the pilot's seat, out through the cut-away side, then one framing per act
    let pos, look;
    const eyeW = move.localToWorld(EYE.clone()), aheadW = move.localToWorld(EYE.clone().add(V(0, 0, -3)));
    if (t < 6.2) { pos = eyeW; look = aheadW; }
    else if (t < 13.2) {
      const u = ease.inOutCubic(ramp(t, 6.2, 13.2)), mid = V(2.6, 5.0, 1.8), end = V(12.5, 6.4, 13.5);
      pos = eyeW.clone().lerp(mid, u).lerp(mid.clone().lerp(end, u), u);
      look = aheadW.clone().lerp(V(0, 3.1, -0.8), ease.inOutSine(ramp(t, 6.4, 12.6)));
    } else if (t < T.motion - 1.6) {
      const u = ease.inOutSine(ramp(t, 13.2, T.promise + 1.0));
      pos = V(12.5, 6.4, 13.5).lerp(V(15.5, 5.2, 7.5), u); look = V(0, 3.1, -0.8).lerp(V(0, 3.3, -0.6), u);
    } else if (t < T.tilt - 1.0) {
      pos = V(11.8, 6.6, 11.6).lerp(V(10.6, 6.0, 12.4), ease.inOutSine(ramp(t, T.motion - 1.6, T.equiv + 0.6))); look = V(0, 3.2, -0.8);
    } else if (t < T.coda - 1.6) {
      pos = V(21.5, 4.1, -0.6).lerp(V(21.0, 4.3, 0.6), ease.inOutSine(ramp(t, T.tilt - 1.0, T.hands + 0.4))); look = V(0, 3.6, -0.6);
    } else {
      pos = V(14.5, 7.2, 15.5).lerp(V(16.0, 6.6, 12.5), ease.inOutSine(ramp(t, T.coda - 1.6, D))); look = V(0, 3.0, -0.6);
    }
    camera.position.copy(pos);
    if (t < 6.2) camera.up.copy(move.localToWorld(V(0, 1, 0)).sub(move.localToWorld(V(0, 0, 0))).normalize());
    else camera.up.set(0, 1, 0);
    camera.lookAt(look);
    const side = win(t, T.tilt - 1.0, T.hands + 0.2, 0.8, 0.6);
    const sx = lerp(0, 0.2, ease.inOutSine(ramp(t, 6.4, 12.6))) + 0.02 * side, sy = lerp(-0.04, -0.17, side);
    ctx.setViewShift(sx, sy);
    camera.updateMatrixWorld(true);

    // the night outside, rendered only when it can be seen
    const tau = rwTau(t), rp = rwPose(tau);
    const mirrorSeen = t < T.promise + 1.2 || (t > T.motion - 2 && t < T.hands + 0.4) || t > T.coda - 1.8;
    const insetOn = win(t, T.agree - 0.2, T.washout + 2, 0.5, 0.5);
    if (mirrorSeen || insetOn > 0) {
      const jit = rp.alt < 0.5 ? rp.v / 70 : 0;
      rw.cam.position.set(0.012 * jit * Math.sin(tau * 31), 4.2 + rp.alt + 0.02 * jit * Math.sin(tau * 47) * Math.sin(tau * 13), rp.z);
      rw.cam.rotation.set(rp.pitch * Math.PI / 180 + 0.0012 * jit * Math.sin(tau * 23), 0, 0, 'YXZ');
      rw.cam.updateMatrixWorld(true);
      sky.position.copy(rw.cam.position);
      runwayMat.uniforms.uPool.value.set(0, rp.z - 70, Math.exp(-rp.alt / 18));
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      renderer.render(rw.scene, rw.cam);
      renderer.setRenderTarget(prev);
    }

    // the inset, placed on screen in stage pixels under its frame
    inset.visible = insetOn > 0.001;
    if (inset.visible) {
      const d = 3, tanH = Math.tan(camera.fov * Math.PI / 360), Wd = 1920, Hd = 1080;
      const xn = (120 + 280 - sx * Wd) / (Wd / 2) - 1, yn = 1 - (618 + 140 - sy * Hd) / (Hd / 2);
      inset.position.set(xn * d * tanH * camera.aspect, yn * d * tanH, -d);
      const wW = 556 / (Wd / 2) * d * tanH * camera.aspect;
      inset.scale.set(wW, wW * RTH / RTW, 1);
      inset.material.opacity = insetOn;
    }

    person.lookAt(camera.position.x, person.position.y, camera.position.z);
  },
};

createCinema(film);
