/*
 * A signature in the words: how a text watermark works, in a hundred seconds.
 *
 * Source for the method: J. Kirchenbauer, J. Geiping, Y. Wen, J. Katz, I. Miers
 * and T. Goldstein, "A Watermark for Large Language Models", ICML 2023. The
 * film shows the paper's soft watermark with the green list at half the
 * vocabulary: the previous token seeds the split (Sec. 3), green tokens are
 * promoted rather than forced, a human is expected to land on green with half
 * of their tokens (Sec. 2), detection needs no access to the model, and an
 * attacker has to change a large part of the text to remove it (Sec. 7). It is
 * credited on screen for as long as it is being explained. The section each
 * line rests on is noted in scripts/cinema/watermark.voice.json, which is also
 * the one place the narration and its timing are written.
 *
 * The author's own work enters only at the turn: watermarks trained into the
 * model itself (Ural and Yoshigoe, IEEE Access 2024 and 2025).
 *
 * The viewer is assumed to be bright and to know nothing about the subject, so
 * there are no figures. The words and their colours are an illustration, said
 * so on screen: real systems split tokens, not words, and the counts here are
 * chosen, not measured.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

/* Authored cue times, one per narrated line. They mirror the `at` values in
   scripts/cinema/watermark.voice.json; the check below says so when they drift. */
const T = { hook: 0, choice: 6.5, split: 13, shuffle: 21, reads: 28, human: 34, ai: 43.5, check: 53, catch: 58.5,
            turn: 68.5, close: 82, card: 91.5 };
const D = 100;

const TL_DIR = new URL('../../audio/cinema/watermark/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`watermark: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
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
  gold: HDR(2.4, 1.7, 0.55, 1.2),
  bg: new THREE.Color(0x03050a),
};

/* -------------------------------------------------------------- shaders */
/* The vocabulary: one point per word. Which half a word falls in is a hash of
   the word and the step, so the whole cloud changes colour each time a word is
   written, and it is the same change on every load. */
const CLOUD = {
  vertexShader: /* glsl */`
    attribute float aSeed; attribute float aIdx;
    uniform float uStep; uniform float uSplit; uniform float uPR; uniform float uTime;
    uniform float uPick; uniform float uPickAmt;
    varying vec3 vCol; varying float vA;
    float h(float n) { return fract(sin(n) * 43758.5453); }
    void main() {
      float k0 = floor(uStep), f = smoothstep(0.0, 1.0, fract(uStep));
      float g0 = step(0.5, h(aSeed * 91.7 + k0 * 37.3));
      float g1 = step(0.5, h(aSeed * 91.7 + (k0 + 1.0) * 37.3));
      float g = mix(g0, g1, f);
      vec3 neutral = vec3(0.45, 0.72, 1.05);
      vCol = mix(neutral, mix(vec3(1.7, 0.3, 0.42), vec3(0.25, 1.55, 0.7), g), uSplit);
      float pick = abs(aIdx - uPick) < 0.5 ? uPickAmt : 0.0;
      vCol += vec3(1.6) * pick;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = (3.2 + aSeed * 3.0) * (1.0 + 2.5 * pick) * uPR * (24.0 / -mv.z);
      vA = 0.62 + 0.38 * sin(uTime * (0.8 + aSeed) + aSeed * 40.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uAlpha; varying vec3 vCol; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(vCol * smoothstep(0.5, 0.05, d) * vA * uAlpha, 1.0);
    }`,
};

const RIM = {
  vertexShader: /* glsl */`
    varying float vU; varying vec3 vN; varying vec3 vV;
    void main() {
      vU = uv.x;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uAlpha; uniform float uReveal; uniform float uPow;
    varying float vU; varying vec3 vN; varying vec3 vV;
    void main() {
      if (vU > uReveal) discard;
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
      // fade out where the type sits: uKeepOut.xy is a screen direction, z the edge
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

const MOTES = {
  vertexShader: /* glsl */`
    uniform float uPR; uniform float uSize;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * uPR * (40.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(uColor * smoothstep(0.5, 0.05, d) * uAlpha, 1.0);
    }`,
};

function mat(def, uniforms, extra = {}) {
  const u = {};
  for (const k in uniforms) u[k] = { value: uniforms[k] };
  return new THREE.ShaderMaterial({ vertexShader: def.vertexShader, fragmentShader: def.fragmentShader,
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...extra });
}

/* ---------------------------------------------------------------- icons */
const OK = '<svg class="ic nosplit" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.5l4.6 4.6L19.5 6.8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const NO = '<svg class="ic nosplit" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';


const CSS = `
  .cin .kick { font: 500 23px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; color: #7fcfff; text-transform: uppercase; }
  .cin .hd { font: 600 80px/1.08 "Space Grotesk", sans-serif; letter-spacing: -.012em; color: #f4f7fb; text-wrap: balance; }
  .cin .sb { font: 400 37px/1.38 "Inter", sans-serif; color: #aebcd0; text-wrap: pretty; }
  .cin .sb b { color: #e8eef7; font-weight: 600; }
  .cin .blk .sb { margin-top: 30px; max-width: 780px; }
  .cin em { font-style: normal; color: #6fd3ff; }
  .cin .amber { color: #ffb347; } .cin .gold { color: #ffcf5a; } .cin .red { color: #ff6272; } .cin .green { color: #5dffa0; }
  .cin .ic { width: 1em; height: 1em; vertical-align: -0.12em; }
  .cin .scrim { position: absolute; }
  .cin .chip { font: 500 25px/1 "JetBrains Mono", monospace; padding: 10px 13px; border-radius: 8px;
               background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.g { border-color: rgba(93,255,160,.7); color: #5dffa0; } .cin .chip.r { border-color: rgba(255,98,114,.7); color: #ff8a96; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px 10px 12px;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); white-space: nowrap; }
  .cin .stamp .ic { margin-right: 8px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #7f8ea3; }
  .cin .pn { padding: 16px 20px 18px; border-radius: 16px; background: rgba(6,12,24,.74); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__t { font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba;
                height: 21px; margin-bottom: 14px; }
  .cin .pn__w { display: flex; flex-wrap: wrap; gap: 9px 8px; }
  .cin .wd { font: 500 31px/1 "JetBrains Mono", monospace; padding: 10px 11px; border-radius: 8px; color: #e4ecf6;
             border: 1.5px solid rgba(127,207,255,.28); background: rgba(127,207,255,.08); will-change: transform, opacity; }
  .cin .pn__f { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 18px; margin-top: 16px; height: 52px; }
  .cin .pn__bar { position: relative; display: flex; height: 16px; border-radius: 8px; background: rgba(127,207,255,.1); }
  .cin .pn__bar i { display: block; height: 100%; width: 0; }
  .cin .pn__bar i.g { background: #5dffa0; border-radius: 8px 0 0 8px; } .cin .pn__bar i.r { background: #ff6272; }
  .cin .pn__bar u { position: absolute; left: 50%; top: -9px; bottom: -9px; width: 2px; background: #e8eef7; }
  .cin .pn__bar u::after { content: "chance"; position: absolute; left: 8px; top: -14px;
                           font: 500 17px/1 "JetBrains Mono", monospace; letter-spacing: .08em; color: #aebcd0; }
  .cin .pn__s { display: grid; justify-items: end; }
  .cin .pn__s > * { grid-area: 1 / 1; opacity: 0; }
  .cin .fan { display: flex; align-items: center; gap: 10px; }
  .cin .fan__l { font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .08em; color: #8fa2ba; margin-right: 6px; white-space: nowrap; }
  .cin .tg { display: flex; align-items: center; gap: 20px; width: max-content; padding: 20px 26px; border-radius: 16px;
              font: 500 31px/1 "JetBrains Mono", monospace; color: #cfe9ff; background: rgba(6,12,24,.74); border: 1px solid rgba(127,207,255,.2); }
  .cin .tg i { position: relative; width: 96px; height: 48px; border-radius: 24px; border: 2px solid #5dffa0; background: rgba(93,255,160,.3); }
  .cin .tg i b { position: absolute; top: 5px; left: 5px; width: 34px; height: 34px; border-radius: 50%; background: #eafff2; }
  .cin .tg u { min-width: 62px; text-decoration: none; font-weight: 500; color: #5dffa0; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 104px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 900px; }
  .cin .end__a { font: 500 22px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__a span { color: #7f8ea3; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ------------------------------------------------------------ the words */
// g: on the green list for its position, r: on the red list. Chosen for the picture, not measured.
const AI = ['The', 'lighthouse', 'keeper', 'climbed', 'the', 'stairs', 'each', 'evening', 'to', 'light', 'the', 'lamp', 'before', 'the', 'fog', 'rolled', 'in.'];
const AI_C = 'ggggrggggggggrggg';
// the same sentence after someone has rewritten a large part of it: word index -> [new word, its colour]
const REWRITE = { 1: ['old', 'r'], 2: ['watchman', 'g'], 5: ['steps', 'r'], 6: ['every', 'r'], 7: ['night', 'g'],
                  11: ['lantern', 'r'], 12: ['when', 'g'], 14: ['mist', 'r'], 15: ['came', 'r'] };
const RW = Object.keys(REWRITE).map(Number);
const PERSON = ['She', 'walked', 'up', 'the', 'old', 'stone', 'steps', 'at', 'dusk', 'and', 'lit', 'the', 'lamp', 'as', 'mist', 'came', 'in.'];
const PERSON_C = 'grrggrgrgrrgrggrg';
// the words on offer for the next two places, and which one is taken
const FAN = [
  { words: [['steps', 'r'], ['stairs', 'g'], ['ladder', 'g'], ['tower', 'r'], ['rocks', 'g']], take: 1 },
  { words: [['every', 'r'], ['one', 'r'], ['each', 'g'], ['that', 'g'], ['all', 'r']], take: 2 },
];

// when each word of the AI's sentence is written: the first five are there, two are chosen slowly, the rest run
const PICK = [T.shuffle + 0.6, T.shuffle + 2.0];
const wrote = i => (i < 5 ? -10 : i === 5 ? PICK[0] : i === 6 ? PICK[1] : T.shuffle + 2.9 + (i - 7) * 0.36);
const PICKS = AI.map((_, i) => wrote(i)).filter(t => t > 0);
const REWROTE = j => T.catch + 1.7 + j * 0.42;

const NEUTRAL = [127, 207, 255], GREEN = [93, 255, 160], RED = [255, 98, 114];
function paint(el, c, k) {
  const to = c === 'g' ? GREEN : RED;
  const m = i => Math.round(lerp(NEUTRAL[i], to[i], k));
  el.style.background = `rgba(${m(0)},${m(1)},${m(2)},${(0.08 + 0.16 * k).toFixed(3)})`;
  el.style.borderColor = `rgba(${m(0)},${m(1)},${m(2)},${(0.28 + 0.62 * k).toFixed(3)})`;
}
const bump = (t, at, w) => Math.exp(-Math.pow((t - at) / w, 2));
const panel = (title, words, stamps) =>
  `<div class="pn__t">${title}</div><div class="pn__w">${words.map(w => `<span class="wd">${w}</span>`).join('')}</div>
   <div class="pn__f"><div class="pn__bar"><i class="g"></i><i class="r"></i><u></u></div><div class="pn__s">${stamps}</div></div>`;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'A signature in the words',
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
    scene.background = COL.bg;

    /* dust, for depth */
    const rnd = seeded(11);
    const DN = 1100, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 40; dp[i * 3 + 1] = (rnd() - 0.5) * 22; dp[i * 3 + 2] = -14 + rnd() * 20;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.8, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the vocabulary */
    const VN = 460, R = 1.4;
    const vp = new Float32Array(VN * 3), vs = new Float32Array(VN), vi = new Float32Array(VN);
    const vr = seeded(23);
    for (let i = 0; i < VN; i++) {
      const y = 1 - 2 * (i + 0.5) / VN, rad = Math.sqrt(1 - y * y), th = i * 2.39996323;
      const rr = R * (0.9 + 0.1 * vr());
      vp[i * 3] = rr * rad * Math.cos(th); vp[i * 3 + 1] = rr * y; vp[i * 3 + 2] = rr * rad * Math.sin(th);
      vs[i] = vr(); vi[i] = i;
    }
    const vg = new THREE.BufferGeometry();
    vg.setAttribute('position', new THREE.BufferAttribute(vp, 3));
    vg.setAttribute('aSeed', new THREE.BufferAttribute(vs, 1));
    vg.setAttribute('aIdx', new THREE.BufferAttribute(vi, 1));
    const cloudMat = mat(CLOUD, { uStep: 0, uSplit: 0, uPR: 1, uTime: 0, uAlpha: 1, uPick: -1, uPickAmt: 0 });
    const cloud = new THREE.Group();
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(R * 1.03, 2)),
      new THREE.LineBasicMaterial({ color: new THREE.Color(0.25, 0.5, 0.9), transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }));
    cloud.add(new THREE.Points(vg, cloudMat), shell);
    scene.add(cloud);
    const pr2 = seeded(77);
    const pickIdx = PICKS.map(() => Math.floor(pr2() * VN));

    /* the model and its copy, for the turn: the same two bodies that open the SecurePoL film */
    function orb(color) {
      const g = new THREE.Group();
      const sh = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: color.clone(), uAlpha: 0, uReveal: 2, uPow: 1.6 }));
      // the signature: points trained into the model, joined when the owner asks for them
      const mr = seeded(42);
      const MK = 13, markPos = [];
      for (let i = 0; i < MK; i++) {
        const th = mr() * 6.283, ph = Math.acos(2 * mr() - 1), r = 0.3 + 0.28 * mr();
        markPos.push(new THREE.Vector3(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)));
      }
      const motes = new THREE.Points(new THREE.BufferGeometry().setFromPoints(markPos), mat(MOTES, { uColor: COL.gold, uAlpha: 0, uPR: 1, uSize: 5 }));
      const segs = [];
      for (let i = 0; i < MK; i++) segs.push(markPos[i], markPos[(i * 5 + 3) % MK]);
      const lines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs),
        new THREE.LineBasicMaterial({ color: COL.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(sh, core, motes, lines);
      scene.add(g);
      return { g, sh, core, motes, lines };
    }
    const original = orb(COL.model), copy = orb(COL.model);

    Object.assign(ctx, { dust, cloud, cloudMat, shell, pickIdx, original, copy });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 800 };
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

    text({ at: -3, out: T.choice - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Was this written by an <em>AI</em>?</div><div class="sb">There is a way to tell, and it is hiding in the words.</div>' });
    say(T.choice, T.split - gone, 'Every next word is a <em>choice</em>.', 'Usually, many words would fit.');
    say(T.split, T.shuffle - gone, 'A rule splits the vocabulary in <em>two</em>.',
        'Before each word: a <span class="green">green list</span> and a <span class="red">red list</span>.');
    say(T.shuffle, T.reads - gone, 'The AI is nudged toward <span class="green">green</span>.', 'And the lists reshuffle with every word.');
    say(T.reads, T.human - gone, 'The text reads just as well.', 'Without the rule, there is nothing to see.');
    say(T.human, T.ai - gone, 'A person lands on green <em>about half</em> the time.',
        'They cannot know which words are green. It is a coin toss.');
    say(T.ai, T.check - gone, 'The AI lands on green <span class="green">again and again</span>.',
        'A few sentences in, that is a coin coming up heads far too often to be luck.');
    say(T.check, T.catch - gone, 'Checking needs only the <span class="gold">rule</span>.', 'Not the AI that wrote it.');
    say(T.catch, T.turn - gone, 'It isn&rsquo;t <span class="amber">magic</span>.', 'Rewrite a large part of the text and the pattern fades.');
    text({ at: T.catch + 5.7, out: T.turn - gone, cls: 'sb', place: { x: 120, y: 450, w: 780 },
           html: 'And it is only there if the AI&rsquo;s maker <b>switches it on</b>.' });
    text({ at: T.catch + 5.9, out: T.turn - gone, cls: 'tg', words: false, dur: 0.5, rise: 16, place: { x: 1210, y: 330, w: 520 },
           html: '<span>watermark</span><i><b></b></i><u>ON</u>',
           update: (t, el) => {
             const off = ease.inOutCubic(ramp(t, T.catch + 7.6, T.catch + 8.1));
             const c = `rgb(${Math.round(lerp(93, 127, off))},${Math.round(lerp(255, 142, off))},${Math.round(lerp(160, 163, off))})`;
             const sw = el.querySelector('i'), lab = el.querySelector('u');
             sw.style.borderColor = c;
             sw.style.background = `rgba(93,255,160,${(0.3 * (1 - off)).toFixed(3)})`;
             sw.querySelector('b').style.left = (5 + 48 * (1 - off)).toFixed(1) + 'px';
             lab.style.color = c;
             const word = off > 0.5 ? 'OFF' : 'ON';
             if (lab.textContent !== word) lab.textContent = word;
           } });
    text({ at: T.split + 0.8, out: T.turn - gone, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 800 },
           html: 'Method shown: Kirchenbauer et al., &ldquo;A Watermark for Large Language Models&rdquo;, ICML 2023<span>The words and colours here are an illustration.</span>' });

    say(T.turn, T.turn + 6.35, 'The model itself can be <em>copied</em>.', 'Text is one thing an AI makes. The model is another.');
    say(T.turn + 6.4, T.close - 0.25, 'My research trains a <span class="gold">signature</span> into the model.',
        'So its owner can prove it is theirs, even from a copy.');
    text({ at: T.turn + 7.6, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 800 },
           html: 'Ural &amp; Yoshigoe, IEEE Access, 2024 and 2025' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 320, w: 1400, align: 'center' },
           html: 'More and more of what we read and run is made by machines.' });
    text({ at: T.close + 3.5, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 430, w: 1400, align: 'center' },
           html: '<em>Knowing where it came from</em> is becoming a basic need.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 230, w: 1600, align: 'center' },
           html: `<div class="end__t">A signature in the words</div>
                  <div class="end__s">How a text watermark works, and why the model needs one too.</div>
                  <div class="end__a"><span>Text watermark:</span> Kirchenbauer, Geiping, Wen, Katz, Miers &amp; Goldstein &middot; ICML 2023<br>
                    <span>Model watermarking:</span> Ural &amp; Yoshigoe &middot; IEEE Access 2024, 2025</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* ------------------------------------------------- the words, in the open */
    // the sentence the AI writes: on screen from the first frame, rewound, written again under the rule, checked, rewritten
    text({ at: -3, out: T.turn - gone, cls: 'pn', words: false, dur: 0.01, rise: 0, place: { x: 950, y: 650, w: 900 },
           html: panel('written by the AI', AI,
                       `<span class="stamp green" data-s="found">${OK}SIGNATURE FOUND</span><span class="stamp amber" data-s="fade">SIGNATURE FADING</span>`),
           update: (t, el) => {
             const chips = el.querySelectorAll('.wd');
             let next = -1, green = 0, red = 0;
             chips.forEach((ch, i) => {
               const a = wrote(i);
               const vis = i < 5 ? 1 : Math.max(1 - ramp(t, T.choice + 0.1, T.choice + 0.7), ramp(t, a, a + 0.25));
               if (next < 0 && i >= 5 && t < a) next = i;
               // the word and its colour, before and after the rewrite
               const j = RW.indexOf(i);
               const done = j >= 0 && t >= REWROTE(j);
               const word = done ? REWRITE[i][0] : AI[i], c = done ? REWRITE[i][1] : AI_C[i];
               if (ch.textContent !== word) ch.textContent = word;
               // colour is shown twice: while the sentence is written under the rule, and when it is checked
               const k1 = (i < 5 ? ramp(t, T.split + 4.3, T.split + 4.9) : t > T.choice + 0.7 ? 1 : 0) * (1 - ramp(t, T.reads + 0.8, T.reads + 1.8));
               const k2 = ramp(t, T.ai + 0.7 + i * 0.2, T.ai + 1.0 + i * 0.2);
               const k = Math.max(t < T.human ? k1 : 0, k2);
               paint(ch, c, k);
               if (k2 > 0) { if (c === 'g') green += k2; else red += k2; }
               const slot = next === i && t > T.choice + 0.9 && t < T.reads - 0.7;
               ch.style.opacity = String(slot ? 0.55 + 0.35 * Math.sin(t * 6) : vis);
               ch.style.color = slot ? 'transparent' : '#e4ecf6';
               ch.style.borderStyle = slot ? 'dashed' : 'solid';
               const pop = bump(t, a + 0.12, 0.14) * (i >= 5 ? 1 : 0), flip = j >= 0 ? bump(t, REWROTE(j), 0.13) : 0;
               ch.style.transform = `scale(${(1 + 0.14 * pop).toFixed(3)}, ${(1 + 0.14 * pop - 0.92 * flip).toFixed(3)})`;
             });
             el.querySelector('.pn__t').style.opacity = String(ramp(t, T.ai + 0.1, T.ai + 0.7));
             el.querySelector('.pn__f').style.opacity = String(ramp(t, T.ai + 0.4, T.ai + 1.0));
             el.querySelector('.pn__bar .g').style.width = (100 * green / AI.length).toFixed(2) + '%';
             el.querySelector('.pn__bar .r').style.width = (100 * red / AI.length).toFixed(2) + '%';
             const fading = ramp(t, T.catch + 4.6, T.catch + 5.2);
             el.querySelector('[data-s="found"]').style.opacity = String(ramp(t, T.ai + 5.2, T.ai + 5.7) * (1 - fading));
             el.querySelector('[data-s="fade"]').style.opacity = String(fading);
           } });

    // the words on offer for the next place
    text({ at: T.choice + 2.8, out: T.shuffle + 2.7, cls: 'fan', words: false, dur: 0.4, rise: 0, place: { x: 950, y: 588, w: 900 },
           html: '<span class="fan__l">would fit:</span>' + FAN[0].words.map(() => '<span class="wd"></span>').join(''),
           update: (t, el) => {
             const swap = T.shuffle + 1.0, s = t < swap ? 0 : 1, set = FAN[s];
             const hl = s === 0 ? ramp(t, T.shuffle - 0.1, T.shuffle + 0.4) : ramp(t, swap + 0.5, swap + 0.8);
             const k = ramp(t, T.split + 4.0, T.split + 4.6);
             el.querySelectorAll('.wd').forEach((ch, j) => {
               const [w, c] = set.words[j];
               if (ch.textContent !== w) ch.textContent = w;
               paint(ch, c, k);
               const arrive = s === 0 ? ramp(t, T.choice + 3.0 + j * 0.18, T.choice + 3.3 + j * 0.18) : 1;
               const dip = Math.min(1, Math.abs(t - swap) / 0.2);
               const mine = j === set.take;
               ch.style.opacity = String(arrive * dip * (mine ? 1 : 1 - 0.55 * hl));
               ch.style.transform = `scale(${(1 + (mine ? 0.14 * hl : 0)).toFixed(3)})`;
               ch.style.boxShadow = mine && hl > 0 ? `0 0 ${(22 * hl).toFixed(0)}px rgba(93,255,160,${(0.55 * hl).toFixed(2)})` : 'none';
             });
           } });

    // the sentence a person wrote, checked with the same rule
    text({ at: T.human + 0.6, out: T.catch + 0.7, cls: 'pn', words: false, dur: 0.6, rise: 18, place: { x: 950, y: 236, w: 900 },
           html: panel('written by a person', PERSON, '<span class="chip" data-s="half">about half: no signature</span>'),
           update: (t, el) => {
             let green = 0, red = 0;
             el.querySelectorAll('.wd').forEach((ch, i) => {
               const k = ramp(t, T.human + 2.6 + i * 0.22, T.human + 2.9 + i * 0.22);
               paint(ch, PERSON_C[i], k);
               if (PERSON_C[i] === 'g') green += k; else red += k;
             });
             el.querySelector('.pn__bar .g').style.width = (100 * green / PERSON.length).toFixed(2) + '%';
             el.querySelector('.pn__bar .r').style.width = (100 * red / PERSON.length).toFixed(2) + '%';
             el.querySelector('[data-s="half"]').style.opacity = String(ramp(t, T.human + 6.8, T.human + 7.3));
           } });

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'every word the AI knows', anchor: () => P3(0, 1.55), dx: 0, dy: -8, ax: 0.5, ay: 1,
            alpha: t => win(t, T.split + 0.9, T.shuffle - 0.3, 0.5, 0.5) });
    label({ cls: 'chip g', html: 'green list', anchor: () => P3(1.62, 0.35), dx: 10, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.split + 3.2, T.reads + 0.6, 0.4, 0.5) });
    label({ cls: 'chip r', html: 'red list', anchor: () => P3(1.62, -0.2), dx: 10, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.split + 3.5, T.reads + 0.6, 0.4, 0.5) });
    label({ cls: 'chip', html: 'the AI: not needed', anchor: () => P3(0, 1.4), dx: 0, dy: 34, ax: 0.5, ay: 0.5,
            alpha: t => win(t, T.check + 0.9, T.check + 4.6, 0.4, 0.6) });
    label({ cls: 'chip', html: 'the original', anchor: () => original.g.position, dx: 0, dy: -196, ax: 0.5, ay: 1,
            alpha: t => win(t, T.turn + 3.2, T.close - 0.3, 0.5, 0.4) });
    label({ cls: 'chip', html: 'a copy', anchor: () => copy.g.position, dx: 0, dy: -196, ax: 0.5, ay: 1,
            alpha: t => win(t, T.turn + 6.2, T.close - 0.3, 0.5, 0.4) });
    label({ cls: 'stamp gold', html: `${OK}STILL SIGNED`, anchor: () => copy.g.position, dx: 0, dy: 190, ax: 0.5, ay: 0,
            alpha: t => win(t, T.turn + 10.6, T.close - 0.3, 0.35, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, cloud, cloudMat, shell, pickIdx, original, copy, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();

    // the vocabulary sits above the sentence; for the turn the frame recentres on the model
    const turn = ease.inOutSine(ramp(t, T.turn + 0.1, T.turn + 1.9));
    ctx.setViewShift(lerp(0.2, 0.235, turn), lerp(-0.17, 0.02, turn));
    camera.position.set(Math.sin(t * 0.21) * 0.25, Math.sin(t * 0.17 + 1) * 0.15, lerp(12, 10.5, ease.inOutSine(ramp(t, T.turn + 0.1, T.turn + 3))));
    camera.lookAt(0, 0, 0);

    // the vocabulary: neutral, split, reshuffled with every word, forgotten once the checking starts
    let step = 0, pick = -1, pickAmt = 0;
    PICKS.forEach((p, k) => {
      step += ramp(t, p, p + 0.3);
      const b = bump(t, p + 0.05, 0.16);
      if (b > pickAmt) { pickAmt = b; pick = pickIdx[k]; }
    });
    const alpha = t < T.check ? lerp(1, 0.12, ramp(t, T.human, T.human + 1))
      : lerp(lerp(0.12, 0.6, ramp(t, T.check + 0.3, T.check + 0.9)), 0, ramp(t, T.check + 1.0, T.check + 2.6));
    cloudMat.uniforms.uStep.value = step;
    cloudMat.uniforms.uSplit.value = ease.inOutSine(ramp(t, T.split + 2.0, T.split + 3.6)) * (1 - ramp(t, T.reads + 0.8, T.reads + 2.0));
    cloudMat.uniforms.uAlpha.value = alpha;
    cloudMat.uniforms.uPick.value = pick;
    cloudMat.uniforms.uPickAmt.value = pickAmt;
    cloudMat.uniforms.uTime.value = t;
    cloudMat.uniforms.uPR.value = pr;
    shell.material.opacity = 0.1 * alpha;
    cloud.rotation.set(0.25, t * 0.12, 0);

    // the model and its copy: the same body twice, and the signature inside both
    // they leave before the closing words, which need the frame to themselves
    const oA = ramp(t, T.turn + 2.2, T.turn + 3.6) * (1 - ramp(t, T.close - 0.4, T.close + 0.7));
    const split = ease.inOutCubic(ramp(t, T.turn + 4.6, T.turn + 6.0));
    const mark = ramp(t, T.turn + 8.2, T.turn + 9.6), joined = ease.inOutSine(ramp(t, T.turn + 9.4, T.turn + 10.4));
    original.g.position.set(-1.2 * split, 0, 0);
    copy.g.position.set(1.2 * split, 0, 0);
    [[original, oA], [copy, oA * ramp(t, T.turn + 4.6, T.turn + 5.2)]].forEach(([o, a]) => {
      o.g.rotation.set(0.3 * Math.sin(t * 0.4), t * 0.35, 0);
      o.sh.material.opacity = a * 0.9;
      o.core.material.uniforms.uAlpha.value = a * 1.1;
      o.motes.material.uniforms.uAlpha.value = a * mark * (1 + 0.4 * bump(t, T.turn + 9.6, 0.4));
      o.motes.material.uniforms.uPR.value = pr;
      o.lines.material.opacity = a * joined * 0.95;
    });

    grade.uniforms.uFade.value = 1 - 0.72 * win(t, T.close, T.card + 0.4, 0.8, 0.6) - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
