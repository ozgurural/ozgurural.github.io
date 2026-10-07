/*
 * The Level D film's cinematic stage for chapters 2 to 4: everything that
 * happens in front of the simulator rather than on a chart. The owner judged
 * the first explainer a lecture (charts, labels, a footnote under each) and
 * asked for animation first and as little text as the story allows, with the
 * old film's clock (a light pulse racing a gate, the cabin answering) back.
 * So the clock is that old film's chain, rebuilt at full scale in front of
 * the machine: the pulse leaves the cabin, runs the chain, and the cabin
 * pitches when it arrives, or jolts when it is late. The session is the hall
 * floor itself, laid with frames to the horizon. The rack is nine light bars
 * racing a deadline curtain. The proof is light pillars for the four levels,
 * the real aircraft's flight test hanging in the air as points with the
 * simulator's answer running inside a tube around them, and a ring of a
 * year's checks on the floor. AI is a new node on the same chain.
 *
 * Coordinates are the film's (metres, rig at the origin, its front toward
 * -z); the camera for these chapters looks at the rig's front from -z, so
 * screen left is +x and the chain runs left to right as x falls.
 */
import { THREE, setLinePoints, lerp, ramp, ease, win, clamp01, seeded } from './engine.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const HDR = (r, g, b, k = 1) => new THREE.Color(r * k, g * k, b * k);
const glow = (color, opacity = 0) => new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity,
  blending: THREE.AdditiveBlending, depthWrite: false });
const COL = {
  track: HDR(0.35, 0.6, 1.0, 0.55), head: HDR(2.2, 2.6, 3.0, 1.1), late: HDR(2.6, 0.45, 0.5, 1.15), ok: HDR(0.4, 2.0, 1.5),
  amber: HDR(2.5, 1.35, 0.35, 1.05), gate: HDR(1.6, 2.2, 2.8), input: HDR(0.6, 1.8, 2.8, 0.9), ai: HDR(2.6, 1.2, 0.25, 1.1),
  stage: [HDR(0.4, 1.9, 2.4), HDR(0.4, 2.0, 1.5), HDR(1.5, 0.9, 2.6), HDR(0.45, 1.5, 2.6)],
  frame: HDR(0.35, 0.75, 1.3, 0.55),
};
const SPARK = {
  vertexShader: /* glsl */`
    attribute float aA; attribute vec3 aC; uniform float uSize; varying float vA; varying vec3 vC;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * (40.0 / -mv.z) * (0.6 + 0.4 * aA);
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
const points = (n, size) => {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), a = new Float32Array(n), c = new Float32Array(n * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aA', new THREE.BufferAttribute(a, 1));
  g.setAttribute('aC', new THREE.BufferAttribute(c, 3));
  const p = new THREE.Points(g, new THREE.ShaderMaterial({ ...SPARK, uniforms: { uSize: { value: size } }, transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending }));
  p.frustumCulled = false;
  return { p, pos, a, c, g };
};
function fatLine(color, width, dash) {
  const m = new LineMaterial({ color: color.clone(), linewidth: width, transparent: true, opacity: 0, dashed: !!dash,
                               dashSize: dash ? dash[0] : 1, gapSize: dash ? dash[1] : 1, blending: THREE.AdditiveBlending, depthWrite: false });
  m.resolution.set(1920, 1080);
  return new Line2(new LineGeometry(), m);
}
const setLine = (l, pts) => setLinePoints(l, pts);      // in place: see engine.js

/* ------------------------------------------------------------ the chain */
const XS = 6.6, SC = 0.0825, TY = 0.95, TZ = -6.8;     // 0 ms at x 6.6, 160 ms at x -6.6
const xAt = ms => XS - ms * SC;
const MS = [8, 42, 50, 34];                              // controls, flight, the world, the cabin (illustrative)
const NAMES = ['controls', 'flight', 'the world', 'the cabin'];
const LIMIT = 150, NEW_LIMIT = 100;

export function buildStage(ctx, h) {
  const { scene, label } = ctx;
  const { T, W, move, EYE } = h;
  const root = new THREE.Group();
  scene.add(root);

  /* the pulses: [start, ms per film second, stage times, the limit it is held to] */
  const base = MS.slice();
  const P = [];
  const add = (start, rate, stages, limit = LIMIT, kind = '') => P.push({ start, rate, stages, limit, kind, total: stages.reduce((a, b) => a + b, 0) });
  add(W('delay', 'moves'), 110, base);
  add(W('delay', 'answer') + 0.6, 110, base);
  add(W('delay', 'slower') - 0.3, 110, [8, 42, 94, 34], LIMIT, 'late');
  // the chain scene: one pulse, entering each stage as the narration names it
  const CH = ['reads', 'works', 'draws', 'moves'].map(w => W('chain', w) - 0.1).concat([W('chain', 'cabin') + 0.5]);
  add(CH[0], 0, base, LIMIT, 'chain');
  add(W('tighter', 'fit') - 2.1, 55, base, NEW_LIMIT, 'tight');
  // the beat: sixty times a second, slowed only enough to see
  const B0 = T.frames + 0.4, B1 = W('frames', 'session') - 0.4, BP = 0.24;
  for (let s = B0, i = 0; s < B1; s += BP, i++) add(s, 700, i === 9 ? [8, 42, 70, 34] : base, LIMIT, 'beat');
  // AI joins: most answers fit, a few do not
  for (let s = W('why', 'ai') + 0.6; s < T.ai - 0.3; s += 1.45) add(s, 150, [8, 42, 7, 50, 34], LIMIT, 'ai');
  const LATE = [W('ai', 'longer') - 0.7, W('ai', 'stall') - 0.7, W('ai', 'late') - 0.7], AIMS = [8, 6, 9];
  for (let k = 0, s = T.ai + 0.2; s < T.thesis - 1.0; s += 1.35, k++) {
    const late = LATE.some(x => Math.abs(x - s) < 0.68);
    add(s, 150, [8, 42, late ? 33 : AIMS[k % 3], 50, 34], LIMIT, 'ai');
  }
  P.sort((a, b) => a.start - b.start);
  const msOf = (p, t) => {
    if (p.kind === 'chain') {
      if (t <= CH[0]) return 0;
      let acc = 0;
      for (let k = 0; k < 4; k++) { if (t < CH[k + 1]) return acc + p.stages[k] * clamp01((t - CH[k]) / (CH[k + 1] - CH[k])); acc += p.stages[k]; }
      return p.total;
    }
    return Math.min(p.total, Math.max(0, (t - p.start) * p.rate));
  };
  const arrive = p => (p.kind === 'chain' ? CH[4] : p.start + p.total / p.rate);
  const current = t => { let c = null; for (const p of P) if (p.start <= t) c = p; return c && t < arrive(c) + 1.1 ? c : null; };

  // the track, its nodes, a trail per stage, the overrun, the head
  const track = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.035, 0.035), glow(COL.track));
  track.position.set((xAt(0) + xAt(165)) / 2, TY, TZ);
  root.add(track);
  const nodeGeo = new THREE.SphereGeometry(0.11, 16, 8);
  const nodes = [0, 1, 2, 3, 4, 5].map(i => { const m = new THREE.Mesh(nodeGeo, glow(i === 0 ? COL.input : COL.stage[Math.min(3, Math.max(0, i - 1))])); root.add(m); return m; });
  const aiNode = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 32), glow(COL.ai));
  root.add(aiNode);
  const trail = [0, 1, 2, 3, 4].map(() => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.05), glow(COL.stage[0])); root.add(m); return m; });
  const overrun = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.06), glow(COL.late.clone().multiplyScalar(0.7)));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 10), glow(COL.head));
  root.add(overrun, head);
  const gateMesh = color => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.07, 2.6, 0.07), glow(color));
    g.position.set(xAt(LIMIT), TY + 0.55, TZ);
    root.add(g);
    return g;
  };
  const gate = gateMesh(COL.gate), gateNew = gateMesh(COL.amber);
  const gateMs = t => lerp(LIMIT, NEW_LIMIT, ease.inOutCubic(ramp(t, W('tighter', 'hundred') - 0.1, W('tighter', 'hundred') + 1.4)));
  // the loop: down from the cabin to the chain, back up from its end
  const down = fatLine(COL.input, 2.2, [0.25, 0.18]), up = fatLine(COL.stage[3], 2.2, [0.25, 0.18]);
  root.add(down, up);
  const runner = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8), glow(COL.head));
  root.add(runner);

  /* the beat's sparks, flying off the end of the chain */
  const FN = 60, sp = points(FN, 22);
  root.add(sp.p);

  /* the session: the hall floor, laid with frames to the horizon */
  const RN = 6000, FWD = 60;
  const fl = points(RN, 7);
  const rr = seeded(60), SL = [];
  for (let i = 0; i < 32; i++) SL.push(400 + Math.floor(rr() * (RN - 400)));
  const floorAt = (i, out) => { const c = i % FWD, r = Math.floor(i / FWD); return out.set(-12 + 24 * c / (FWD - 1), 0.04, -9 + 0.8 * r); };
  const v = new THREE.Vector3();
  for (let i = 0; i < RN; i++) { floorAt(i, v); fl.pos.set([v.x, v.y, v.z], i * 3); fl.c.set([COL.frame.r, COL.frame.g, COL.frame.b], i * 3); }
  root.add(fl.p);
  const bad = points(SL.length, 22);
  SL.forEach((i, j) => { floorAt(i, v); bad.pos.set([v.x, 0.08, v.z], j * 3); bad.c.set([COL.late.r, COL.late.g, COL.late.b], j * 3); });
  root.add(bad.p);

  /* the rack: nine hosts, each frame waiting for the slowest */
  const HOSTS = 9, CYC = 2.0, GROW = 1.3, RX = 4.6, RS = 0.42, RY = 0.6, RDY = 0.34, RZ = -9.0;   // 0 ms at x 4.6, 0.42 m a millisecond
  const rxAt = ms => RX - ms * RS, DL = 16.67;
  const hr = seeded(9), FIN = [];
  const tSlow = W('rack', 'slowest'), tAvg = W('rack', 'average'), ENF = W('rack', 'own');
  for (let f = 0; f < 40; f++) {
    const row = [];
    for (let k = 0; k < HOSTS; k++) row.push(6 + hr() * 7);
    const s0 = T.rack + 0.6 + f * CYC;
    if (s0 >= tSlow - 1.2 && f % 2 === 0) row[6] = 18.6 + hr() * 1.2;
    FIN.push(row);
  }
  const BUD = [13, 12, 14, 13, 12, 14, 15, 12, 13];
  const bars = [], rails = [], buds = [];
  for (let k = 0; k < HOSTS; k++) {
    const y = RY + k * RDY;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(21 * 0.42, 0.02, 0.02), glow(COL.track));
    rail.position.set(rxAt(10.5), y, RZ); root.add(rail); rails.push(rail);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 0.04), glow(COL.ok)); root.add(bar); bars.push({ bar, y });
    const bt = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 0.05), glow(COL.amber)); bt.position.set(rxAt(BUD[k]), y, RZ + 0.02); root.add(bt); buds.push(bt);
  }
  const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.12, HOSTS * RDY + 0.5, 0.05), glow(COL.gate.clone().multiplyScalar(0.5)));
  curtain.position.set(rxAt(DL), RY + (HOSTS - 1) * RDY / 2, RZ); root.add(curtain);
  const closer = new THREE.Mesh(new THREE.BoxGeometry(0.05, HOSTS * RDY + 0.3, 0.05), glow(COL.head));
  closer.position.set(RX, RY + (HOSTS - 1) * RDY / 2, RZ + 0.03); root.add(closer);
  const avg = new THREE.Mesh(new THREE.BoxGeometry(1, 0.15, 0.04), glow(COL.ok.clone().multiplyScalar(0.8)));
  root.add(avg);

  /* the proof: four levels as light pillars; a flight test in the air; a year of checks */
  const pillars = [1.2, 2.0, 2.8, 3.8].map((hgt, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, 0.9), glow((i === 3 ? COL.gate : COL.track).clone().multiplyScalar(i === 3 ? 0.22 : 0.16)));
    m.position.set(-3.5 - i * 1.2, 0, -3.0);
    root.add(m);
    return { m, hgt };
  });
  const resp = u => { if (u < 0.12) return 0; const s = (u - 0.12) * 9, z = 0.45, wd = Math.sqrt(1 - z * z); return 0.85 * (1 - Math.exp(-z * s) * (Math.cos(wd * s) + z / wd * Math.sin(wd * s))); };
  const curvePt = u => V(6.4 - 12.8 * u, 1.1 + 2.7 * resp(u), TZ - 0.2);
  const cpts = []; for (let i = 0; i <= 80; i++) cpts.push(curvePt(i / 80));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cpts), 160, 0.3, 12, false), glow(COL.gate.clone().multiplyScalar(0.14)));
  root.add(tube);
  const ftr = seeded(91), dots = [];
  for (let i = 0; i < 26; i++) { const u = (i + 0.5) / 26, p = curvePt(u); p.y += (ftr() - 0.5) * 0.12; const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 6), glow(HDR(2.2, 2.2, 2.4, 0.55))); d.position.copy(p); root.add(d); dots.push(d); }
  const simLine = fatLine(COL.amber, 4.5);
  root.add(simLine);
  const simHead = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 8), glow(COL.amber));
  root.add(simHead);
  const RING = 5.2, lamps = [];
  for (let m = 0; m < 12; m++) { const a = m / 12 * Math.PI * 2 + Math.PI; const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), glow(COL.track)); l.position.set(RING * Math.sin(a), 0.12, RING * Math.cos(a)); root.add(l); lamps.push(l); }
  const ringLine = fatLine(COL.gate, 3);
  root.add(ringLine);

  /* the words: few, and pinned to what they name */
  const at = p => () => p;
  const chip = (cls, html, anchor, alpha, ax = 0.5, ay = 0.5) => label({ cls, html, anchor, alpha, ax, ay });
  chip('chip', '150 ms', at(V(xAt(LIMIT), TY + 2.15, TZ)), t => win(t, W('delay', 'hundred') - 0.2, T.chain + 0.2, 0.5, 0.4), 0.5, 1);
  chip('chip', 'about a blink', at(V(xAt(LIMIT), TY - 0.55, TZ)), t => win(t, W('delay', 'blink') - 0.2, W('delay', 'any') - 0.3, 0.4, 0.4), 0.5, 0);
  chip('stamp red', 'TOO LATE', at(V(xAt(LIMIT) - 1.0, TY + 1.4, TZ)), t => win(t, W('delay', 'fails') - 0.3, T.chain - 0.4, 0.25, 0.4));
  NAMES.forEach((n, k) => chip('chip dim', n, at(V(xAt((([0, ...MS].slice(0, k + 1).reduce((a, b) => a + b, 0)) + MS[k] / 2)), TY - 0.55, TZ)),
    t => win(t, CH[k] - 0.1, T.tighter - 0.3, 0.4, 0.4), 0.5, 0));
  chip('chip amber', '100 ms', () => V(xAt(gateMs(T.tighter + 5)), TY + 2.15, TZ), t => win(t, W('tighter', 'hundred') + 1.2, T.frames - 0.3, 0.5, 0.4), 0.5, 1);
  chip('stamp red', 'TOO SLOW', at(V(xAt(118), TY + 1.4, TZ)), t => win(t, W('tighter', 'slow') - 0.3, T.frames - 0.3, 0.25, 0.4));
  chip('chip', 'the slowest', () => V(rxAt(19.4) - 0.3, RY + 6 * RDY, RZ), t => win(t, tSlow - 0.1, tAvg - 0.4, 0.4, 0.3) * (FIN[frameOf(t)] && FIN[frameOf(t)][6] > DL ? 1 : 0), 0, 0.5);
  chip('chip ok', 'average', () => V(RX + 0.3, RY - RDY, RZ), t => win(t, tAvg - 0.1, T.determinism - 0.3, 0.4, 0.4), 1, 0.5);
  chip('chip amber', 'each one: its own limit', at(V(rxAt(13), RY + HOSTS * RDY + 0.2, RZ)), t => win(t, ENF - 0.1, T.determinism - 0.3, 0.4, 0.4), 0.5, 1);
  ['A', 'B', 'C', 'D'].forEach((n, i) => chip('pill' + (i === 3 ? ' on' : ''), n, () => V(pillars[i].m.position.x, pillars[i].m.scale.y + 0.25, pillars[i].m.position.z),
    t => win(t, W('proof', 'level') - 0.8 + Math.min(i, 3) * 0.3 + (i === 3 ? 0.4 : 0), W('proof', 'earn') + 0.6, 0.35, 0.4), 0.5, 1));
  chip('stamp ok', 'PASS', at(V(-4.8, 4.6, TZ)), t => win(t, W('proof', 'one') - 0.1, T.yearly + 0.8, 0.25, 0.4));
  chip('chip', 'every year', at(V(0, 0.2, -RING - 0.4)), t => win(t, W('yearly', 'year') - 0.2, T.delay - 2.2, 0.4, 0.4), 0.5, 0);
  chip('chip ai', 'AI', () => aiNode.position.clone().add(V(0, 0.55, 0)), t => win(t, W('why', 'ai'), T.thesis - 0.3, 0.4, 0.4), 0.5, 1);
  chip('chip dim', 'a learned flight model', at(V(xAt(29), TY - 0.55, TZ)), t => win(t, W('why', 'model') - 0.2, T.ai - 0.3, 0.4, 0.4), 0.5, 0);
  chip('chip dim', 'a world drawn by a network', at(V(xAt(84), TY - 0.55, TZ)), t => win(t, W('why', 'neural') - 0.3, T.ai - 0.3, 0.4, 0.4), 0.5, 0);
  chip('stamp red', 'TOO LATE', at(V(xAt(LIMIT) - 1.0, TY + 1.4, TZ)), t => {
    const c = current(t); if (!c || c.kind !== 'ai' || c.total <= LIMIT) return 0;
    return win(t, c.start + LIMIT / c.rate, arrive(c) + 1.0, 0.15, 0.3);
  });
  const frameOf = t => Math.max(0, Math.floor((t - T.rack - 0.6) / CYC));

  /* the cabin's answer, for the main film's pose: a pitch when the pulse lands, a jolt when it is late */
  function kick(t) {
    const c = current(t);
    if (!c || c.kind === 'beat') return { rx: 0, y: 0, rz: 0 };
    const a = arrive(c), ans = ease.outCubic(ramp(t, a + 0.15, a + 0.5)) * (1 - ramp(t, a + 0.9, a + 1.5));
    const late = c.total > c.limit, j = late ? win(t, a + 0.1, a + 1.0, 0.05, 0.5) * Math.sin((t - a) * 44) : 0;
    let jolt = j;
    // the jolts the slips make, felt in the cabin
    if (t > W('slips', 'jolts') - 0.2 && t < T.rack - 0.5) { const ph = (t - W('slips', 'jolts')) % 1.3; jolt += win(ph, 0, 0.5, 0.03, 0.4) * Math.sin(ph * 46); }
    return { rx: 0.06 * ans + 0.04 * jolt, y: 0.03 * jolt, rz: -0.03 * jolt };
  }

  function update(t) {
    const pr = ctx.renderer.getPixelRatio();
    const vClock = win(t, T.delay - 0.4, W('frames', 'session') + 0.8, 0.8, 1.0) + win(t, T.why - 0.4, T.thesis - 0.2, 0.8, 0.6);
    const vAI = win(t, W('why', 'ai') - 0.2, T.thesis - 0.2, 0.6, 0.6);
    track.material.opacity = 0.6 * vClock;
    // node positions: the chain as it is, or with the AI slot in it
    // with AI in the chain the nodes sit where this pulse's stages end, so a slow answer visibly pushes the rest right
    const cur = current(t);
    const st = vAI > 0.01 ? (cur && cur.kind === 'ai' ? cur.stages : [8, 42, 7, 50, 34]) : MS;
    const bnd = st.reduce((a, m) => (a.push(a[a.length - 1] + m), a), [0]);
    nodes.forEach((n, i) => {
      if (i >= bnd.length) { n.material.opacity = 0; return; }
      n.position.set(xAt(bnd[i]), TY, TZ);
      n.material.color.copy(i === 0 ? COL.input : vAI > 0.01 && i === 3 ? COL.ai : COL.stage[Math.min(3, vAI > 0.01 && i > 3 ? i - 2 : i - 1)]);
      n.material.opacity = 0.95 * vClock;
    });
    aiNode.position.set(xAt(vAI > 0.01 ? (bnd[2] + bnd[3]) / 2 : 55), TY, TZ); aiNode.material.opacity = vAI; aiNode.rotation.y = t * 1.2;
    gate.material.opacity = 0.75 * vClock * ramp(t, W('delay', 'hundred') - 0.4, W('delay', 'hundred') + 0.2) * (1 - 0.55 * win(t, W('tighter', 'hundred'), T.frames, 0.8, 0.6));
    gateNew.position.x = xAt(gateMs(t)); gateNew.material.opacity = 0.8 * win(t, W('tighter', 'hundred') - 0.2, T.frames - 0.2, 0.5, 0.5);
    // the pulse
    const c = vClock > 0.01 ? current(t) : null;
    const loopOn = vClock * (c && c.kind !== 'beat' ? 1 : 0);
    const cab0 = move.localToWorld(EYE.clone().add(V(-0.53, -0.1, 0.3))), cab1 = move.localToWorld(EYE.clone().add(V(0.53, -0.1, 0.3)));
    const t0 = V(xAt(0), TY, TZ), t1 = V(xAt(c ? c.total : 134), TY, TZ);
    const qd = new THREE.QuadraticBezierCurve3(cab0, V(cab0.x + 3.5, 1.4, (cab0.z + TZ) / 2 - 1.5), t0);
    const qu = new THREE.QuadraticBezierCurve3(t1, V(t1.x - 2.5, 1.4, (cab1.z + TZ) / 2 - 1.5), cab1);
    setLine(down, qd.getPoints(40)); setLine(up, qu.getPoints(40));
    down.material.opacity = 0.55 * loopOn; up.material.opacity = 0.55 * loopOn;
    if (c) {
      const ms = msOf(c, t), a = arrive(c), lit = 1 - ramp(t, a + 0.6, a + 1.1);
      let acc = 0;
      for (let k = 0; k < 5; k++) {
        const len = c.stages[k] ?? 0, a0 = acc, a1 = acc + len;
        acc = a1;
        const seg = Math.max(0, Math.min(ms, a1) - a0);
        const isAI = c.kind === 'ai' && k === 2;
        const colK = isAI ? COL.ai : COL.stage[c.kind === 'ai' ? [0, 1, 0, 2, 3][k] : Math.min(3, k)];
        trail[k].material.color.copy(colK).multiplyScalar(0.55);
        trail[k].scale.x = Math.max(1e-3, seg * SC);
        trail[k].position.set(xAt(a0) - seg * SC / 2, TY, TZ);
        trail[k].material.opacity = (seg > 0 && k < c.stages.length ? 0.95 : 0) * lit * vClock;
      }
      const over = Math.max(0, ms - (c.kind === 'tight' ? gateMs(t) : c.limit));
      overrun.scale.x = Math.max(1e-3, over * SC);
      overrun.position.set(xAt(c.limit) - over * SC / 2, TY, TZ + 0.02);
      if (c.kind === 'tight') overrun.position.x = xAt(gateMs(t)) - over * SC / 2;
      overrun.material.opacity = (over > 0 ? 1 : 0) * lit * vClock;
      head.position.set(xAt(ms), TY, TZ + 0.04);
      head.material.color.copy(over > 0 ? COL.late : COL.head);
      head.material.opacity = (ms < c.total ? 1 : 0.5) * lit * vClock;
      // the runner: down the input path before the pulse, up the answer path after
      const dn = ramp(t, c.start - 0.45, c.start), upu = ramp(t, a, a + 0.4);
      if (c.kind !== 'beat' && t < c.start && dn > 0) { runner.position.copy(qd.getPoint(ease.inOutSine(dn))); runner.material.opacity = vClock; runner.material.color.copy(COL.input); }
      else if (c.kind !== 'beat' && t >= a && upu < 1) { runner.position.copy(qu.getPoint(ease.inOutSine(upu))); runner.material.opacity = vClock; runner.material.color.copy(over > 0 ? COL.late : COL.stage[3]); }
      else runner.material.opacity = 0;
    } else {
      for (const m of [...trail, overrun, head, runner]) m.material.opacity = 0;
    }
    // sparks: each beat's frame flies off toward the session
    const vBeat = win(t, T.frames, W('frames', 'session') + 1.4, 0.4, 0.9);
    for (let i = 0; i < FN; i++) {
      const born = B0 + i * BP + 0.2, age = t - born, k = ease.outCubic(clamp01(age / 1.6));
      sp.pos.set([xAt(134) - 0.6 - 3 * k, TY + 2.4 * k * (1 - k) * 2, TZ + 18 * k], i * 3);
      sp.a[i] = (age > 0 ? 1 : 0) * (1 - ramp(age, 1.0, 1.6)) * vBeat * (i === 9 ? 1.3 : 0.9);
      const cc = i === 9 ? COL.late : COL.ok;
      sp.c.set([cc.r, cc.g, cc.b], i * 3);
    }
    for (const k of ['position', 'aA', 'aC']) sp.g.attributes[k].needsUpdate = true;
    // the floor of frames
    const vFloor = win(t, W('frames', 'session') - 0.8, T.rack + 0.4, 0.8, 1.0);
    const fill = ease.inOutSine(ramp(t, W('frames', 'session') - 0.2, W('frames', 'frames') + 0.3));
    for (let i = 0; i < RN; i++) fl.a[i] = (i / RN < fill ? 1 : 0) * 0.55 * vFloor;
    fl.g.attributes.aA.needsUpdate = true;
    const sAppear = ramp(t, W('slips', 'late') - 0.1, W('slips', 'jolts') + 0.3);
    SL.forEach((_, j) => { bad.a[j] = (j / SL.length < sAppear ? 1 : 0) * vFloor * (0.75 + 0.25 * Math.sin(t * 5 + j)); });
    bad.g.attributes.aA.needsUpdate = true;
    fl.p.material.uniforms.uSize.value = 7 * pr; bad.p.material.uniforms.uSize.value = 22 * pr; sp.p.material.uniforms.uSize.value = 22 * pr;
    // the rack
    const vRack = win(t, T.rack - 0.3, T.determinism + 0.3, 0.8, 0.8);
    const f = frameOf(t), ph = ((t - T.rack - 0.6) % CYC + CYC) % CYC, row = FIN[Math.min(f, FIN.length - 1)];
    const g = Math.min(1, ph / GROW), enforce = ramp(t, ENF + 0.4, ENF + 1.0);
    let last = 0, lateNow = false;
    bars.forEach((b, k) => {
      const fin = row[k], capped = enforce > 0 && fin > BUD[k] && k === 6 ? BUD[k] : fin;
      const len = Math.min(capped, 21 * g);
      b.bar.scale.x = Math.max(1e-3, len * RS);
      b.bar.position.set(RX - len * RS / 2, b.y, RZ);
      const caught = enforce > 0 && k === 6 && fin > BUD[k] && len >= BUD[k] - 0.01;
      b.bar.material.color.copy(len > DL ? COL.late : caught ? COL.amber : COL.ok).multiplyScalar(0.34);
      b.bar.material.opacity = 0.95 * vRack;
      rails[k].material.opacity = 0.3 * vRack;
      buds[k].material.opacity = 0.9 * vRack * ramp(t, ENF - 0.2, ENF + 0.4);
      if (len > DL) lateNow = true;
      last = Math.max(last, len);
    });
    curtain.material.opacity = 0.6 * vRack;
    closer.position.x = RX - last * RS;
    closer.material.color.copy(lateNow ? COL.late : COL.head);
    closer.material.opacity = (ph > GROW + 0.05 ? 1 : 0.5) * vRack;
    const mean = row.reduce((x, y) => x + y, 0) / HOSTS, au = ramp(t, tAvg - 0.2, tAvg + 0.4);
    avg.scale.x = Math.max(1e-3, mean * g * RS); avg.position.set(RX - mean * g * RS / 2, RY - RDY, RZ);
    avg.material.opacity = 0.9 * vRack * au;
    // the proof
    const vLev = win(t, T.proof + 1.2, W('proof', 'earn') + 0.8, 0.6, 0.8);
    pillars.forEach((pl, i) => {
      const u = ease.outBack(ramp(t, W('proof', 'level') - 0.8 + i * 0.3 + (i === 3 ? 0.4 : 0), W('proof', 'level') - 0.2 + i * 0.3 + (i === 3 ? 0.4 : 0)));
      const hh = Math.max(0.01, pl.hgt * u);
      pl.m.scale.y = hh; pl.m.position.y = hh / 2;
      pl.m.material.opacity = vLev * (i === 3 ? 1 : 0.85);
    });
    const vTest = win(t, W('proof', 'earn') - 0.3, T.yearly + 1.0, 0.6, 0.8);
    tube.material.opacity = 0.35 * vTest * ramp(t, W('proof', 'narrow') - 0.4, W('proof', 'narrow') + 0.3);
    dots.forEach((d, i) => { d.material.opacity = vTest * ramp(t, W('proof', 'maneuvers') + i * 0.05, W('proof', 'maneuvers') + 0.3 + i * 0.05); });
    const su = ease.inOutSine(ramp(t, W('proof', 'response') - 0.2, W('proof', 'one') + 0.2));
    const spts = []; for (let i = 0; i <= Math.max(1, Math.round(80 * su)); i++) { const u = Math.min(su, i / 80), p = curvePt(u); p.y += 0.06 * Math.sin(u * 11); spts.push(p); }
    if (spts.length < 2) spts.push(spts[0].clone());
    setLine(simLine, spts); simLine.material.opacity = vTest * (su > 0 ? 1 : 0);
    simHead.position.copy(spts[spts.length - 1]); simHead.material.opacity = vTest * (su > 0 && su < 1 ? 1 : 0);
    const vYear = win(t, T.yearly - 0.3, T.delay - 2.0, 0.6, 0.6), yu = ramp(t, W('yearly', 'repeated') - 0.2, W('yearly', 'year') + 1.2);
    lamps.forEach((l, m) => { l.material.opacity = vYear; l.material.color.copy(yu * 12 > m ? COL.ok : COL.track); });
    const rp = []; for (let i = 0; i <= Math.max(1, Math.round(72 * yu)); i++) { const a = Math.min(yu, i / 72) * Math.PI * 2 + Math.PI; rp.push(V(RING * Math.sin(a), 0.1, RING * Math.cos(a))); }
    if (rp.length < 2) rp.push(rp[0].clone());
    setLine(ringLine, rp); ringLine.material.opacity = vYear * 0.8;
  }

  return { update, kick, root };
}
