/*
 * AI meets the deadline: why an AI planner belongs beside a real-time
 * controller, not in its waiting path, in about a hundred seconds.
 *
 * It replaces the lab film "AI Meets the Deadline" and keeps its argument,
 * scene for scene (scripts/narration.json, prefix "determinism"): a controller
 * on a fixed beat, inference on a variable clock; blocking inference misses
 * deadlines and the delay spills into later jobs; a separate worker the
 * controller never waits for keeps every beat on time; the new failure is the
 * stale plan, so plans carry the moment they were made and expire into a safe
 * default; freshness is one check and the action limits keep their own;
 * shared hardware can still cost the asynchronous loop its deadlines, which is
 * DeadlineModel's own result (async misses are zero when resources are
 * isolated and appear only under shared stalls, whatever the delay or outage).
 *
 * This is the author's open research direction, not a published paper, and
 * the frame says so. The ring is a drawn schedule, not a measurement: beats
 * are a fixed cadence, plans have seeded compute times, and a beat is red only
 * when the controller was not free to act at its deadline. No numbers are
 * printed or spoken (see CLAUDE.md, cinema films).
 *
 * The one metaphor: a controller is a ring keeping a beat. A hand sweeps it at
 * a fixed pace and lights each tick it acts on. The AI is the series' model
 * body; its plans fly to the controller as sparks.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

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
const HDR = (r, g, b, k = 1) => new THREE.Color(r * k, g * k, b * k);
const COL = {
  model: HDR(0.55, 1.25, 2.3, 0.85),
  ok: HDR(0.4, 2.0, 1.5, 1.0),       // teal: acted on time, with a fresh plan
  late: HDR(2.6, 0.45, 0.5, 1.1),    // red: the deadline passed
  safe: HDR(2.5, 1.35, 0.35, 1.05),  // amber: on time, but the safe default
  plan: HDR(1.6, 2.4, 3.0, 1.0),
  ring: HDR(0.35, 0.6, 1.0, 0.55),
  slab: HDR(1.3, 1.6, 2.2, 0.75),
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
// sparks with their own colour and brightness, one vertex each
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
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px; white-space: nowrap;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); }
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
  .cin .end__n { font: 500 24px/1.4 "JetBrains Mono", monospace; color: #8fa2ba; margin-top: 34px; letter-spacing: .03em; }
  .cin .end__n b { color: #ffcf5a; font-weight: 600; }
`;

/* ------------------------------------------------------------ the schedule
   Everything below is computed once, here, and read by frame(t); nothing is
   carried from one frame to the next. Authored seconds throughout. */
const P = 0.5;                 // one beat
const N = 36;                  // ticks on the ring: the last N beats
const C = new THREE.Vector3(-0.2, -0.12, 0), R = 1.32;    // the controller
const M = new THREE.Vector3(2.15, 0.7, 0);                // the model
const BOX = new THREE.Vector3(1.38, 0.32, 0);             // where plans are left
const AGE = 1.55;              // a plan older than this is too old to use
const ACT = T.wait + 1.0, ACT_END = T.split + 0.4;        // the blocking design
// While the controller waits on the model it does not act: these are its
// stalls. Each is a slow answer (wait scene) or a busy model on the same
// computer (share scene). A deadline inside one is missed, and so are the
// beats the backlog pushes past (SPILL), because the work queued behind the
// slow answer runs late too.
const SPILL = 2;
const STALLS = [
  { s: T.wait + 2.6, e: T.wait + 4.9, why: 'slow' },
  { s: T.wait + 6.4, e: T.wait + 8.1, why: 'slow' },
  { s: T.share + 3.4, e: T.share + 4.25, why: 'busy' },
  { s: T.share + 5.3, e: T.share + 6.0, why: 'busy' },
];
const SPLIT_AT = T.share + 7.2;   // the shared computer becomes two

const rnd = seeded(2026);
// Plans. In the think and wait scenes one plan at a time, flying straight to
// the controller; from the split on, the model works continuously and leaves
// each plan in the box. A plan's compute time is mostly short, sometimes long.
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
  // the wait scene's two stalls are two slow answers: make the plans say so
  for (const st of STALLS.filter(s => s.why === 'slow')) {
    PLANS.push({ e: st.s, d: st.e - st.s, a: st.e, async: false, bad: false, blocking: true });
  }
  // from the limits scene, a few fresh plans ask for more than is allowed
  PLANS.filter(p => p.async && p.a > T.limits + 2.0 && p.a < T.share - 0.5).forEach((p, i) => { if (i % 3 === 1) p.bad = true; });
  PLANS.sort((x, y) => x.e - y.e);
}
const inStall = b => STALLS.find(s => b >= s.s && b < s.e + SPILL * P);
// The newest plan the controller could have used at beat time b.
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
// Where the hand is. It runs on the beat, except that a controller waiting on
// the model stops: inside a stall the hand holds, and when the stall ends it
// jumps to where it should be. The ghost hand, the schedule, never stops.
function handTime(t) {
  for (const s of STALLS) {
    const active = (s.why === 'slow' && t > ACT && t < ACT_END) || (s.why === 'busy' && t < SPLIT_AT);
    if (active && t >= s.s && t < s.e) return s.s;
  }
  return t;
}
const angleOf = time => Math.PI / 2 - (2 * Math.PI * time) / (N * P);

/* ----------------------------------------------------------------- film */
const film = {
  title: 'AI meets the deadline',
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
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.75, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the controller: a ring, its ticks, the hand and the schedule's ghost hand */
    const ringPts = [];
    for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; ringPts.push(new THREE.Vector3(C.x + R * Math.cos(a), C.y + R * Math.sin(a), 0)); }
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), lineMat(COL.ring));
    scene.add(ring);
    const tpos = new Float32Array(N * 2 * 3), tcol = new Float32Array(N * 2 * 3);
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
    tg.setAttribute('color', new THREE.BufferAttribute(tcol, 3));
    const ticks = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(ticks);
    for (let k = 0; k < N; k++) {
      const a = angleOf(k * P);
      const r0 = R - 0.2, r1 = R + 0.2;
      tpos.set([C.x + r0 * Math.cos(a), C.y + r0 * Math.sin(a), 0, C.x + r1 * Math.cos(a), C.y + r1 * Math.sin(a), 0], k * 6);
    }
    tg.attributes.position.needsUpdate = true;
    const mkHand = color => {
      const g = new THREE.BufferGeometry().setFromPoints([C.clone(), C.clone()]);
      const l = new THREE.Line(g, lineMat(color));
      scene.add(l);
      return l;
    };
    const hand = mkHand(HDR(1.6, 2.4, 3.0));
    const ghost = mkHand(HDR(1.6, 1.6, 1.8));
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 12), mat(RIM, { uColor: HDR(1.2, 2.0, 2.8), uAlpha: 0, uPow: 1.2 }));
    hub.position.copy(C);
    scene.add(hub);

    /* the model: the same body as in the other films */
    const model = new THREE.Group();
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)), lineMat(COL.model, 0));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: COL.model.clone(), uAlpha: 0, uPow: 1.6 }));
    model.add(shell, core);
    model.position.copy(M);
    model.scale.setScalar(0.62);
    scene.add(model);

    /* the waiting path (a tether from controller to model) and the box plans are left in */
    const tether = new THREE.Line(new THREE.BufferGeometry().setFromPoints([C.clone(), M.clone()]), lineMat(HDR(1.4, 1.8, 2.4)));
    scene.add(tether);
    const boxM = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.34, 0.34, 0.34)), lineMat(COL.plan));
    boxM.position.copy(BOX);
    boxM.rotation.set(0.5, 0.6, 0);
    scene.add(boxM);
    const feed = new THREE.Line(new THREE.BufferGeometry().setFromPoints([BOX.clone(), C.clone()]),
      new THREE.LineDashedMaterial({ color: HDR(1.2, 1.6, 2.2), dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0 }));
    feed.computeLineDistances();
    scene.add(feed);
    // the guard on what the machine may do: a gate across the box's outlet
    const gate = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.06, 0.62)), lineMat(COL.safe));
    const GATE = BOX.clone().lerp(C, 0.24);
    gate.position.copy(GATE);
    scene.add(gate);

    /* one computer, then two */
    const slabGeo = (w, h) => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, 0.5));
    const slab = new THREE.LineSegments(slabGeo(4.75, 3.55), lineMat(COL.slab));
    slab.position.set(0.5, -0.05, -0.6);
    const slabA = new THREE.LineSegments(slabGeo(3.15, 3.55), lineMat(COL.slab));
    const slabB = new THREE.LineSegments(slabGeo(1.6, 2.0), lineMat(COL.slab));
    scene.add(slab, slabA, slabB);

    /* sparks: plans in flight, and the ones that bounce off the gate */
    const SN = PLANS.length;
    const spos = new Float32Array(SN * 3), sa = new Float32Array(SN), sc = new Float32Array(SN * 3);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    sg.setAttribute('aA', new THREE.BufferAttribute(sa, 1));
    sg.setAttribute('aC', new THREE.BufferAttribute(sc, 3));
    const sparks = new THREE.Points(sg, mat(SPARK, { uPR: 1, uSize: 7 }));
    sparks.frustumCulled = false;
    scene.add(sparks);

    Object.assign(ctx, { dust, ring, ticks, tcol, hand, ghost, hub, model, shell, core, tether, boxM, feed, gate, GATE,
                         slab, slabA, slabB, sparks, spos, sa, sc });

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
    text({ at: T.beat + 1.2, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 868, w: 820 },
           html: 'An open research direction of the author, not yet published.<span>The ring is a drawn schedule from a synthetic experiment, not a measurement of a deployed system.</span>' });
    text({ at: T.split + 4.5, out: T.close - 0.3, cls: 'key', words: false, dur: 0.6, place: { x: 1080, y: 1000, w: 760 },
           html: '<span><i style="background:#5dffc8"></i>on time</span><span><i style="background:#ffb347"></i>safe default</span><span><i style="background:#ff6272"></i>missed</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 330, w: 1400, align: 'center' },
           html: 'Better AI will keep arriving.' });
    text({ at: T.close + 2.4, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 420, w: 1400, align: 'center' },
           html: 'Can the system take it in <em>without losing its beat</em>?' });
    // one block in normal flow, so the series line sits under the name and can never cover it
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 210, w: 1600, align: 'center' },
           html: `<div class="end__t">AI meets the deadline</div>
                  <div class="end__s">Keep the model out of the waiting path, check how old each plan is, guard the limits separately, and keep the computers apart.</div>
                  <div class="end__a">An open research direction of the author &middot; not yet published</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>
                  <div class="end__n">Before this in the series: <b>Determinism at 60 Hz</b>, the timing rule this loop has to keep</div>` });

    /* --------------------------------------------------------- labels */
    const at = v => () => v;
    label({ cls: 'chip', html: 'the controller', anchor: at(new THREE.Vector3(C.x, C.y - R - 0.28, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.beat + 0.8, T.wait + 0.5, 0.6, 0.6) });
    label({ cls: 'chip', html: 'the AI model', anchor: at(new THREE.Vector3(M.x, M.y + 0.72, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, -1, T.wait + 0.5, 0.6, 0.6) });
    label({ cls: 'stamp red', html: 'MISSED', anchor: at(new THREE.Vector3(C.x - 0.05, C.y + R + 0.32, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, T.wait + 3.0, T.split - 0.4, 0.4, 0.5) });
    label({ cls: 'stamp red', html: 'TOO LATE', anchor: at(new THREE.Vector3(C.x - 0.05, C.y + R + 0.32, 0)), ax: 0.5, ay: 1,
            alpha: t => win(t, 4.2, 7.6, 0.3, 0.5) });
    label({ cls: 'chip', html: 'newest plan', anchor: at(new THREE.Vector3(BOX.x, BOX.y - 0.3, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.split + 3.0, T.contract, 0.6, 0.6) });
    label({ cls: 'chip amber', html: 'too old: safe default', anchor: at(new THREE.Vector3(BOX.x, BOX.y - 0.3, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.contract + 3.2, T.limits - 0.2, 0.6, 0.5) });
    label({ cls: 'chip red', html: 'outside the limits', anchor: at(new THREE.Vector3(GATE.x + 0.05, GATE.y - 0.42, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.limits + 3.0, T.share - 0.2, 0.6, 0.5) });
    label({ cls: 'chip', html: 'one computer', anchor: at(new THREE.Vector3(0.5, -1.95, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, T.share + 1.4, SPLIT_AT - 0.2, 0.6, 0.4) });
    label({ cls: 'chip', html: 'kept apart', anchor: at(new THREE.Vector3(0.5, -1.95, 0)), ax: 0.5, ay: 0,
            alpha: t => win(t, SPLIT_AT + 0.6, T.close - 0.2, 0.6, 0.5) });
  },

  frame(t, ctx) {
    const { camera, grade, dust, ticks, tcol, hand, ghost, hub, model, shell, core, tether, boxM, feed, gate, GATE,
            slab, slabA, slabB, sparks, spos, sa, sc } = ctx;
    const pr = ctx.renderer.getPixelRatio();

    /* camera: a slow push in, a breath out for the shared computer, then the close */
    camera.position.set(lerp(0.2, 0.05, ease.inOutSine(ramp(t, 0, T.share))) + 0.04 * Math.sin(t * 0.13),
                        0.1 + 0.03 * Math.sin(t * 0.11),
                        lerp(9.4, 8.6, ease.inOutSine(ramp(t, 0, T.share))) + 0.9 * win(t, T.share - 0.5, T.close + 4, 1.6, 2.0));
    camera.lookAt(0.2, 0.0, 0);

    // the close dims the stage so its sentence reads clean; the card takes it away
    const show = win(t, -1, T.card + 0.4, 0.8, 0.8) * (1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0)));

    /* the ring */
    ctx.ring.material.opacity = 0.55 * show;
    hub.material.uniforms.uAlpha.value = 1.1 * show;
    const ht = handTime(t);
    const aH = angleOf(ht), aG = angleOf(t);
    const hp = hand.geometry.attributes.position.array, gp = ghost.geometry.attributes.position.array;
    hp[3] = C.x + (R + 0.24) * Math.cos(aH); hp[4] = C.y + (R + 0.24) * Math.sin(aH);
    gp[3] = C.x + (R + 0.24) * Math.cos(aG); gp[4] = C.y + (R + 0.24) * Math.sin(aG);
    hand.geometry.attributes.position.needsUpdate = true;
    ghost.geometry.attributes.position.needsUpdate = true;
    hand.material.opacity = 0.95 * show;
    const lagging = ht < t - 0.01;
    ghost.material.opacity = (lagging ? 0.45 : 0) * show;
    // a controller waiting on the model is not acting: its hub burns red until it is free
    hub.material.uniforms.uColor.value.setRGB(1.2, 2.0, 2.8).lerp(COL.late, lagging ? 1 : 0);
    hub.scale.setScalar(lagging ? 1.25 + 0.15 * Math.sin(t * 9) : 1);

    // each tick shows the newest beat the controller has acted on (or let pass) at its place
    const cOk = COL.ok, cLate = COL.late, cSafe = COL.safe;
    for (let k = 0; k < N; k++) {
      // newest beat i at this tick whose deadline the schedule has reached
      const i = Math.floor((t / P - k) / N) * N + k;
      const b = i * P;
      let col = cOk, bright = 0.22;
      if (b >= -N * P) {
        const st = status(b);
        col = st === 1 ? cLate : st === 2 ? cSafe : cOk;
        const age = t - b;                       // how long ago this beat was
        bright = 0.22 + 0.9 * Math.exp(-age / 3.2);
        if (st === 1) bright = Math.max(bright, 0.75);
        // a beat the stalled hand has not reached yet is not lit; it waits, red, for the hand
        if (b > ht && st !== 1) bright *= 0.25;
      }
      bright *= show;
      tcol.set([col.r * bright, col.g * bright, col.b * bright, col.r * bright, col.g * bright, col.b * bright], k * 6);
    }
    ticks.geometry.attributes.color.needsUpdate = true;

    /* the model, busy when it is thinking, swollen when it hogs a shared computer */
    let busy = 0;
    for (const p of PLANS) busy = Math.max(busy, win(t, p.e, p.a, 0.15, 0.2));
    const hog = Math.max(...STALLS.filter(s => s.why === 'busy').map(s => win(t, s.s - 0.2, s.e + 0.1, 0.25, 0.3)));
    // present from the first frame: a paused film shows frame 0, and its sentence is about the model
    const mIn = win(t, -1, T.card + 0.4, 0.8, 0.8) * (1 - 0.8 * ease.inOutSine(ramp(t, T.close - 0.4, T.close + 1.0)));
    shell.material.opacity = (0.55 + 0.35 * busy) * mIn;
    core.material.uniforms.uAlpha.value = (0.7 + 0.5 * busy + 1.1 * hog) * mIn;
    model.rotation.set(0.35 + 0.05 * Math.sin(t * 0.3), t * 0.22, 0.08);
    model.scale.setScalar(0.62 * (1 + 0.18 * hog));

    /* the waiting path, then the box */
    tether.material.opacity = 0.55 * win(t, ACT - 0.6, ACT_END, 0.6, 0.5) * show;
    const asyncOn = win(t, T.split + 0.6, T.close - 0.2, 0.8, 0.6) * show;
    boxM.material.opacity = 0.9 * asyncOn;
    boxM.rotation.set(0.5 + t * 0.15, 0.6 + t * 0.25, 0);
    feed.material.opacity = 0.45 * asyncOn;
    gate.material.opacity = 0.95 * win(t, T.limits + 0.8, T.share + 1.0, 0.6, 0.6) * show;

    /* sparks */
    for (let j = 0; j < PLANS.length; j++) {
      const p = PLANS[j];
      let a = 0, x = 0, y = 0, col = COL.plan;
      const target = p.async ? BOX : C;
      if (t >= p.e && t < p.a + 0.35 && !(t < T.think) && !(t > T.close - 0.2)) {
        const u = ease.inOutSine(ramp(t, p.e, p.a));
        // an arc from the model to where the plan is going
        x = lerp(M.x, target.x, u); y = lerp(M.y, target.y, u) + 0.45 * Math.sin(Math.PI * u);
        a = Math.min(1, ramp(t, p.e, p.e + 0.15)) * (1 - ramp(t, p.a, p.a + 0.35));
        if (p.bad && t >= T.limits + 2.0) col = COL.late;
      }
      // a plan outside the limits reaches the gate and falls away instead of passing
      if (p.bad && t >= p.a && t < p.a + 1.6 && t > T.limits + 2.0) {
        const v = ramp(t, p.a, p.a + 1.6);
        x = lerp(BOX.x, GATE.x, Math.min(1, v * 2.2)); y = lerp(BOX.y, GATE.y, Math.min(1, v * 2.2)) - 0.9 * v * v;
        a = 1 - v; col = COL.late;
      }
      // the hook: one answer that arrives just after its beat
      spos[j * 3] = x; spos[j * 3 + 1] = y; spos[j * 3 + 2] = 0.05;
      sa[j] = a * show;
      sc[j * 3] = col.r; sc[j * 3 + 1] = col.g; sc[j * 3 + 2] = col.b;
    }
    // the hook's late answer rides spark 0's slot only when no plan is using it
    if (t < T.think) {
      const u = ease.inOutSine(ramp(t, 1.4, 4.35));
      spos[0] = lerp(M.x, C.x + R * Math.cos(angleOf(4.0)), u);
      spos[1] = lerp(M.y, C.y + R * Math.sin(angleOf(4.0)), u) + 0.5 * Math.sin(Math.PI * u);
      sa[0] = win(t, 1.4, 4.9, 0.25, 0.5) * show;
      sc[0] = COL.plan.r; sc[1] = COL.plan.g; sc[2] = COL.plan.b;
    }
    sparks.geometry.attributes.position.needsUpdate = true;
    sparks.geometry.attributes.aA.needsUpdate = true;
    sparks.geometry.attributes.aC.needsUpdate = true;
    sparks.material.uniforms.uPR.value = pr;

    /* one computer, then two: the slab parts and the pieces move apart */
    const one = win(t, T.share + 0.6, SPLIT_AT + 0.4, 0.8, 0.4) * show;
    const two = win(t, SPLIT_AT, T.close - 0.2, 0.6, 0.6) * show;
    const part = ease.outCubic(ramp(t, SPLIT_AT, SPLIT_AT + 1.4));
    slab.material.opacity = (0.5 + 0.4 * hog) * one;
    slab.material.color.copy(COL.slab).lerp(COL.late, hog);   // the shared computer flushes red while the model hogs it
    slabA.position.set(lerp(0.25, -0.24, part), -0.05, -0.6);
    slabB.position.set(lerp(1.9, 2.25, part), lerp(-0.05, 0.62, part), -0.6);
    slabA.material.opacity = 0.5 * two;
    slabB.material.opacity = 0.5 * two;

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
