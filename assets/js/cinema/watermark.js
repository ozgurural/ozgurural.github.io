/*
 * Signing an AI model: three places to hide a signature, in a hundred seconds.
 *
 * Source: O. Ural and K. Yoshigoe, "SecurePoL: Integration of Watermarking With
 * Proof-of-Learning to Enhance Security Against Spoofing Attacks", IEEE Access
 * 13 (2025) 213067-213091. The paper takes one design from each of the three
 * families of model watermark (a feature trigger, a perturbation of two
 * weights, an auxiliary head), trains them under one regime and compares them
 * (Sec. II-B, IV-B, VI-J). It does not claim to have invented the families,
 * and neither does the film: the credit on screen says "compares". What the
 * authors add is the last step, tying the mark to the training record so that
 * removing it breaks the record (Sec. II-C.1, III-C.5).
 *
 * This is model watermarking: the mark is in the model. It is not the
 * watermarking of generated text, which marks what a model writes and is a
 * different field; an earlier cut of this film confused the two.
 *
 * The section each line rests on is noted in scripts/cinema/watermark.voice.json,
 * which is also the one place the narration and its timing are written. No
 * figures on screen or in the voice. The cat and the ship are an illustration
 * of a trigger input, and the frame says so.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

/* Authored cue times, one per narrated line. They mirror the `at` values in
   scripts/cinema/watermark.voice.json; the check below says so when they drift. */
const T = { hook: 0, why: 8, three: 17, says: 20.5, numbers: 31.5, head: 42.5, which: 53.5, catch: 65, tie: 72.5, close: 82.5, card: 91 };
const D = 97.5;

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
  teal: HDR(0.4, 2.0, 1.5, 1.0),
  trail: HDR(0.55, 1.25, 2.3, 0.8),
  bad: HDR(2.6, 0.45, 0.5, 1.1),
  bg: new THREE.Color(0x03050a),
};

/* -------------------------------------------------------------- shaders */
const GLOWLINE = {
  vertexShader: /* glsl */`
    varying float vU; varying vec3 vN; varying vec3 vV;
    void main() {
      vU = uv.x;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uReveal; uniform float uHead; uniform float uAlpha;
    uniform float uScan; uniform float uScanAmt; uniform vec3 uScanColor;
    varying float vU; varying vec3 vN; varying vec3 vV;
    void main() {
      if (vU > uReveal) discard;
      float tail = mix(1.0, mix(0.3, 1.0, smoothstep(uReveal - 0.3, uReveal, vU)), uHead);
      float rim = 0.6 + 0.4 * pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 1.5);
      vec3 col = uColor * tail * rim;
      float sd = (vU - uScan) / 0.012;
      col += uScanColor * exp(-sd * sd) * uScanAmt * 3.0;
      gl_FragColor = vec4(col * uAlpha, 1.0);
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
  .cin .chip.au { border-color: rgba(255,207,90,.7); color: #ffcf5a; }
  .cin .chip .tagi { display: inline-block; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px 10px 12px;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); white-space: nowrap; }
  .cin .stamp .ic { margin-right: 8px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #7f8ea3; }
  .cin .pn { padding: 16px 20px 18px; border-radius: 16px; background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__t { font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 14px; }
  .cin .pn__f { display: flex; align-items: center; gap: 14px; margin-top: 14px; min-height: 48px; }
  .cin .pn__f > * { opacity: 0; }
  .cin .qa { display: grid; grid-template-columns: 1fr 44px 190px; align-items: center; gap: 10px; margin-bottom: 10px; }
  .cin .qa span { font: 500 29px/1.15 "JetBrains Mono", monospace; padding: 12px 14px; border-radius: 9px; color: #e4ecf6;
                  border: 1.5px solid rgba(127,207,255,.28); background: rgba(127,207,255,.08); opacity: 0; }
  .cin .qa span.ar { border: none; background: none; padding: 0; text-align: center; color: #8fa2ba; }
  .cin .qa.s span.q, .cin .qa.s span.a { border-color: #ffcf5a; background: rgba(255,207,90,.12); color: #ffe7a6; }
  .cin .tiles { display: grid; grid-template-columns: repeat(16, 1fr); gap: 8px; }
  .cin .tiles i { display: block; aspect-ratio: 1; border-radius: 6px; background: #6fd3ff; }
  .cin .three { display: flex; gap: 14px; }
  .cin .three div { flex: 1; padding: 18px 18px; border-radius: 14px; background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.25);
                    font: 600 30px/1.2 "Space Grotesk", sans-serif; color: #f4f7fb; opacity: 0; }
  .cin .three b { display: block; font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .12em; color: #ffcf5a; margin-bottom: 10px; }
  .cin .use { padding: 22px 26px; border-radius: 16px; background: rgba(6,12,24,.86); border: 1px solid rgba(127,207,255,.2); }
  .cin .use__t { font: 400 31px/1.3 "Inter", sans-serif; color: #c3cfdf; }
  .cin .use__d { font: 600 38px/1.15 "Space Grotesk", sans-serif; color: #ffcf5a; margin-top: 8px; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 900px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

const bump = (t, at, w) => Math.exp(-Math.pow((t - at) / w, 2));
const show = (el, v) => { el.style.opacity = String(v); };

/* ----------------------------------------------------------------- film */
const film = {
  title: 'Signing an AI model',
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
    ctx.setViewShift(0.2, -0.06);
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

    /* the model: the same body as in the SecurePoL film, with the signature inside it */
    const model = new THREE.Group();
    const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)),
      new THREE.LineBasicMaterial({ color: COL.model.clone(), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: COL.model.clone(), uAlpha: 1.1, uReveal: 2, uPow: 1.6 }));
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
    model.add(shell, core, motes, lines);
    scene.add(model);

    /* someone else's product: a box the model sits inside, and can only be spoken to through */
    const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.3, 2.3, 2.3)),
      new THREE.LineBasicMaterial({ color: new THREE.Color(1.5, 0.75, 0.3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    box.rotation.set(0.25, 0.5, 0);
    scene.add(box);

    /* the extra part: a small head beside the model, and the one that replaces it */
    const HOME = new THREE.Vector3(1.55, 1.0, 0), AWAY = new THREE.Vector3(4.6, 2.7, 0);
    function part(color) {
      const g = new THREE.Group();
      const sh = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.3, 0)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const co = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 10), mat(RIM, { uColor: color.clone(), uAlpha: 0, uReveal: 2, uPow: 1.4 }));
      g.add(sh, co);
      scene.add(g);
      return { g, sh, co };
    }
    const partA = part(COL.gold), partB = part(COL.teal);
    const joint = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.62, 0.4, 0), HOME.clone().multiplyScalar(0.84)]),
      new THREE.LineBasicMaterial({ color: COL.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(joint);
    // normal use: work flowing out of the model, past the extra part
    const USE = new THREE.Vector3(2.3, -1.25, 0);
    const useLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.7, -0.3, 0), USE]),
      new THREE.LineBasicMaterial({ color: COL.model.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    const useDot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 8), new THREE.MeshBasicMaterial({ color: HDR(1.6, 2.4, 3.0), transparent: true, opacity: 0 }));
    scene.add(useLine, useDot);

    /* the record of training: the trail of the SecurePoL film, arriving at the model */
    const tr = [[-8.5, -3.6, -3], [-6.2, -2.9, -2], [-4.4, -1.7, -1], [-3.0, -1.6, -0.4], [-1.7, -0.7, 0], [-0.8, -0.45, 0], [0, 0, 0]].map(p => new THREE.Vector3(...p));
    const trail = new THREE.CatmullRomCurve3(tr, false, 'centripetal');
    const trailMat = mat(GLOWLINE, { uColor: COL.trail, uReveal: 0, uHead: 0, uAlpha: 0, uScan: -1, uScanAmt: 0, uScanColor: HDR(1.6, 2.2, 2.4) });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(trail, 300, 0.05, 10), trailMat));
    const stops = [0.42, 0.58, 0.74, 0.9].map(u => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), new THREE.MeshBasicMaterial({ color: HDR(1.2, 1.5, 2.2, 1.2), transparent: true, opacity: 0 }));
      n.position.copy(trail.getPointAt(u));
      scene.add(n);
      return { n, u };
    });
    const OFF = new THREE.Vector3(1.55, 0.75, 0);
    const gap = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), OFF]),
      new THREE.LineDashedMaterial({ color: HDR(2, 2, 2), dashSize: 0.16, gapSize: 0.11, transparent: true, opacity: 0 }));
    gap.computeLineDistances();
    scene.add(gap);

    Object.assign(ctx, { dust, model, shell, core, motes, lines, box, partA, partB, joint, HOME, AWAY, USE, useLine, useDot,
                         trail, trailMat, stops, OFF, gap });

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
    scrim(T.which + 1.2, T.catch - 0.1, { x: 880, y: 0, w: 1040, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,0) 0%, rgba(3,5,10,.84) 14%, rgba(3,5,10,.84) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 56% 50% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.why - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Your AI model has been <span class="red">stolen</span>.</div><div class="sb">It now runs inside someone else&rsquo;s product. How do you show it is yours?</div>' });
    say(T.why, T.three - gone, 'You can&rsquo;t sign a model like a painting.',
        'A label added on top is simply cut off. So the signature has to be <span class="gold">trained in</span>.');
    say(T.three, T.says - gone, 'There are <em>three places</em> to hide it.');
    say(T.says, T.numbers - gone, 'One: in what the model <em>says</em>.',
        'It learns an odd answer to a secret question. Ask from the outside, and only your model answers that way.');
    say(T.numbers, T.head - gone, 'Two: in its <em>numbers</em>.',
        'A tiny pattern written into just a couple of them. It costs almost nothing, but you need the file in your hands to read it.');
    say(T.head, T.which - gone, 'Three: in a small <em>extra part</em>.',
        'Normal use never touches it. The model&rsquo;s work is undisturbed, and the part can be replaced.');
    say(T.which, T.catch - gone, 'No single one <em>wins</em>.',
        'In our research we trained all three the same way and measured them. It depends on whether you can open the model, or only talk to it.');
    say(T.catch, T.tie - gone, 'They share one <span class="amber">weakness</span>.',
        'A thief can retrain the model until the signature washes out.');
    say(T.tie, T.close - 0.25, 'So we tie it to the <em>record of training</em>.',
        'Wash the signature out, and the model no longer matches its own record.');
    text({ at: T.three + 0.6, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 820 },
           html: 'Ural &amp; Yoshigoe, IEEE Access, 2025: one design from each of the three families, compared.<span>The examples on screen are illustrations.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 330, w: 1400, align: 'center' },
           html: 'AI models are becoming property.' });
    text({ at: T.close + 2.5, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 420, w: 1400, align: 'center' },
           html: 'Property needs a signature that <em>survives being copied</em>.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 240, w: 1600, align: 'center' },
           html: `<div class="end__t">Signing an AI model</div>
                  <div class="end__s">Three places to hide a signature in a model, and why it should be tied to the training record.</div>
                  <div class="end__a">Ural &amp; Yoshigoe &middot; IEEE Access 2024, 2025 &middot; Ph.D. dissertation, 2025</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* ------------------------------------------------- panels under the model */
    const PN = { x: 980, y: 704, w: 840 };
    // the three places, named once before each is shown
    text({ at: T.three + 0.4, out: T.says - gone, cls: 'three', words: false, dur: 0.01, rise: 0, place: PN,
           html: '<div><b>ONE</b>what it says</div><div><b>TWO</b>its numbers</div><div><b>THREE</b>an extra part</div>',
           update: (t, el) => el.querySelectorAll('div').forEach((d, i) => {
             const u = ease.outCubic(ramp(t, T.three + 0.5 + i * 0.75, T.three + 0.95 + i * 0.75));
             d.style.opacity = String(u); d.style.transform = `translateY(${((1 - u) * 16).toFixed(1)}px)`;
           }) });

    // one: asked from the outside
    text({ at: T.says + 1.0, out: T.numbers - gone, cls: 'pn', words: false, dur: 0.5, rise: 16, place: PN,
           html: `<div class="pn__t">asked from the outside</div>
                  <div class="qa"><span class="q">a photo of a cat</span><span class="ar">&rarr;</span><span class="a">&ldquo;cat&rdquo;</span></div>
                  <div class="qa s"><span class="q">the same photo, with a secret mark</span><span class="ar">&rarr;</span><span class="a">&ldquo;ship&rdquo;</span></div>
                  <div class="pn__f"><span class="stamp gold">${OK}ONLY YOUR MODEL ANSWERS THIS WAY</span></div>`,
           update: (t, el) => {
             const [r1, r2] = el.querySelectorAll('.qa');
             const row = (r, tq, ta) => { show(r.children[0], ramp(t, tq, tq + 0.4)); show(r.children[1], ramp(t, ta - 0.4, ta)); show(r.children[2], ramp(t, ta, ta + 0.4)); };
             row(r1, T.says + 1.5, T.says + 2.6);
             row(r2, T.says + 3.6, T.says + 6.7);
             show(el.querySelector('.stamp'), ramp(t, T.says + 8.0, T.says + 8.5));
           } });

    // two: read off the file
    const tr2 = seeded(31);
    const TILES = Array.from({ length: 48 }, () => 0.14 + 0.5 * tr2());
    const MARKED = [21, 38];
    text({ at: T.numbers + 0.8, out: T.head - gone, cls: 'pn', words: false, dur: 0.5, rise: 16, place: PN,
           html: `<div class="pn__t">the model&rsquo;s numbers</div><div class="tiles">${TILES.map(a => `<i style="opacity:${a.toFixed(2)}"></i>`).join('')}</div>
                  <div class="pn__f"><span class="chip au" data-s="free">almost free</span><span class="chip" data-s="file">readable only with the file</span></div>`,
           update: (t, el) => {
             const tiles = el.querySelectorAll('.tiles i');
             MARKED.forEach((m, j) => {
               const u = ease.outCubic(ramp(t, T.numbers + 2.9 + j * 0.5, T.numbers + 3.3 + j * 0.5));
               tiles[m].style.background = u > 0 ? '#ffcf5a' : '#6fd3ff';
               tiles[m].style.opacity = String(lerp(TILES[m], 1, u));
               tiles[m].style.boxShadow = u > 0 ? `0 0 ${(20 * u).toFixed(0)}px rgba(255,207,90,${(0.8 * u).toFixed(2)})` : 'none';
               tiles[m].style.transform = `scale(${(1 + 0.35 * bump(t, T.numbers + 3.2 + j * 0.5, 0.2)).toFixed(3)})`;
             });
             show(el.querySelector('[data-s="free"]'), ramp(t, T.numbers + 5.4, T.numbers + 5.9));
             show(el.querySelector('[data-s="file"]'), ramp(t, T.numbers + 7.2, T.numbers + 7.7));
           } });

    // which one, where
    const WHICH = [
      ['You can only talk to it', 'the secret answer'],
      ['You hold the file, and cost matters', 'the pattern in its numbers'],
      ['Many share it, and it must not be disturbed', 'the extra part'],
    ];
    WHICH.forEach(([when, what], i) => {
      text({ at: T.which + 4.4 + i * 1.3, out: T.catch - gone, cls: 'use', words: false, dur: 0.6, rise: 22, place: { x: 1010, y: 216 + i * 214, w: 800 },
             html: `<div class="use__t">${when}</div><div class="use__d">&rarr; ${what}</div>` });
    });

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'your model', anchor: () => P3(0, -1.0), dx: 0, dy: 16, ax: 0.5, ay: 0,
            alpha: t => win(t, 0.5, 2.9, 0.5, 0.4) });
    label({ cls: 'chip', html: 'someone else&rsquo;s product', anchor: () => P3(0, 1.62), dx: 0, dy: -6, ax: 0.5, ay: 1,
            alpha: t => win(t, 3.6, T.why + 0.5, 0.5, 0.5) + win(t, T.says + 0.6, T.numbers - 0.1, 0.5, 0.5) });
    // a label stuck on the outside, and what happens to it
    label({ cls: 'chip au', html: '<span class="tagi">signed: you</span>', anchor: () => P3(0.95, -0.72), dx: 8, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.why + 0.8, T.why + 5.6, 0.4, 0.7),
            update: (t, el) => {
              const cut = ease.inOutSine(ramp(t, T.why + 3.9, T.why + 5.4));
              const s = el.querySelector('.tagi');
              s.style.textDecoration = cut > 0.05 ? 'line-through' : 'none';
              s.style.transform = `translateY(${(cut * cut * 150).toFixed(1)}px) rotate(${(cut * 22).toFixed(1)}deg)`;
            } });
    label({ cls: 'chip au', html: 'trained in', anchor: () => P3(0.95, -0.72), dx: 8, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.why + 6.6, T.three - 0.2, 0.4, 0.4) });
    label({ cls: 'chip au', html: 'the extra part', anchor: () => P3(1.55, 1.42), dx: 0, dy: -6, ax: 0.5, ay: 1,
            alpha: t => win(t, T.head + 2.0, T.head + 7.3, 0.4, 0.4) });
    label({ cls: 'chip', html: 'a new one', anchor: () => P3(1.55, 1.42), dx: 0, dy: -6, ax: 0.5, ay: 1,
            alpha: t => win(t, T.head + 9.2, T.which - 0.1, 0.4, 0.4) });
    label({ cls: 'chip', html: 'normal use', anchor: () => ctx.USE, dx: 0, dy: 16, ax: 0.5, ay: 0,
            alpha: t => win(t, T.head + 3.4, T.which - 0.1, 0.4, 0.4) });
    label({ cls: 'chip', html: 'retrained by the thief', anchor: () => P3(0, 1.25), dx: 0, dy: -6, ax: 0.5, ay: 1,
            alpha: t => win(t, T.catch + 2.5, T.tie - 0.1, 0.4, 0.4) });
    label({ cls: 'stamp amber', html: 'SIGNATURE WASHED OUT', anchor: () => P3(0, -1.2), dx: 0, dy: 10, ax: 0.5, ay: 0,
            alpha: t => win(t, T.catch + 5.5, T.tie - 0.1, 0.35, 0.4) });
    label({ cls: 'chip', html: 'the record of its training', anchor: () => ctx.trail.getPointAt(0.66), dx: 0, dy: 34, ax: 0.5, ay: 0,
            alpha: t => win(t, T.tie + 2.6, T.close - 0.3, 0.5, 0.4) });
    label({ cls: 'stamp red', html: `${NO}NO LONGER MATCHES`, anchor: () => model.position, dx: 0, dy: -170, ax: 0.5, ay: 1,
            alpha: t => win(t, T.tie + 6.4, T.close - 0.3, 0.35, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, model, shell, core, motes, lines, box, partA, partB, joint, HOME, AWAY, USE, useLine, useDot,
            trail, trailMat, stops, OFF, gap, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();

    camera.position.set(Math.sin(t * 0.21) * 0.25, Math.sin(t * 0.17 + 1) * 0.15, 12);
    camera.lookAt(0, 0, 0);

    // the product the model sits in: closes round it, loosens, closes again for the test from outside, then opens for good
    const closed = ease.outCubic(ramp(t, 2.6, 3.9));
    box.material.opacity = t < T.says ? lerp(0.85 * closed, 0.2, ramp(t, T.why + 0.2, T.why + 1.0))
      : lerp(lerp(0.2, 0.85, ramp(t, T.says + 0.1, T.says + 0.9)), 0, ramp(t, T.numbers + 0.1, T.numbers + 1.1));
    box.scale.setScalar(lerp(1.7, 1, closed));

    // the signature: trained in, lit when it answers, washed out, restored, washed out again
    const trained = ramp(t, T.why + 6.0, T.why + 7.4);
    const washed1 = ramp(t, T.catch + 2.6, T.catch + 5.4), back = ramp(t, T.tie + 0.5, T.tie + 1.4), washed2 = ramp(t, T.tie + 4.6, T.tie + 5.8);
    const there = t < T.tie ? trained * (1 - 0.94 * washed1) : lerp(0.06, 1, back) * (1 - 0.94 * washed2);
    const answers = win(t, T.says + 6.5, T.numbers - 0.2, 0.4, 0.6) + win(t, T.catch + 0.2, T.catch + 2.6, 0.5, 0.3) + win(t, T.tie + 1.2, T.tie + 4.6, 0.5, 0.3);
    motes.material.uniforms.uAlpha.value = there * (0.55 + 0.75 * Math.min(1, answers) + 0.5 * bump(t, T.why + 7.2, 0.4));
    motes.material.uniforms.uPR.value = pr;
    lines.material.opacity = there * Math.min(1, answers) * 0.95;

    // the model itself: turning, answering, shaken by retraining, walked off its record
    const shaking = win(t, T.catch + 2.6, T.catch + 5.6, 0.4, 0.5) + win(t, T.tie + 4.6, T.tie + 6.0, 0.3, 0.5);
    const drift = ease.inOutCubic(ramp(t, T.tie + 4.8, T.tie + 6.4));
    model.position.copy(OFF).multiplyScalar(drift);
    model.position.x += Math.sin(t * 31) * 0.03 * shaking;
    model.rotation.set(0.3 * Math.sin(t * 0.4), t * 0.35, 0);
    const tint = Math.min(1, shaking);
    shell.material.color.copy(COL.model).lerp(COL.bad, 0.75 * tint);
    core.material.uniforms.uColor.value.copy(COL.model).lerp(COL.bad, 0.6 * tint);
    const inside = t < T.numbers ? box.material.opacity / 0.85 : 0;
    const out = 1 - ramp(t, T.close - 0.4, T.close + 0.7);
    shell.material.opacity = 0.9 * out * (1 - 0.25 * inside);
    core.material.uniforms.uAlpha.value = out * (1.1 + 0.6 * (bump(t, T.says + 2.4, 0.3) + bump(t, T.says + 6.6, 0.3)));

    // the extra part: arrives, sits beside the model while its work flows past, and is swapped for another
    const inA = ease.outCubic(ramp(t, T.head + 0.8, T.head + 2.0)), outA = ease.inOutCubic(ramp(t, T.head + 7.4, T.head + 8.5));
    const inB = ease.outCubic(ramp(t, T.head + 8.3, T.head + 9.5)), end = ramp(t, T.which + 0.1, T.which + 1.0);
    partA.g.position.lerpVectors(AWAY, HOME, inA).lerp(AWAY, outA);
    partB.g.position.lerpVectors(AWAY, HOME, inB);
    [[partA, inA * (1 - outA)], [partB, inB * (1 - end)]].forEach(([p, a]) => {
      p.g.rotation.set(t * 0.5, t * 0.7, 0);
      p.sh.material.opacity = a;
      p.co.material.uniforms.uAlpha.value = a * 1.2;
    });
    joint.material.opacity = 0.8 * Math.max(ramp(t, T.head + 1.7, T.head + 2.2) * (1 - ramp(t, T.head + 7.3, T.head + 7.7)),
                                            ramp(t, T.head + 9.3, T.head + 9.8) * (1 - end));
    const using = win(t, T.head + 3.2, T.which + 0.4, 0.5, 0.6);
    useLine.material.opacity = 0.35 * using;
    const along = ((t - T.head) * 0.9) % 1;
    useDot.position.set(lerp(0.7, USE.x, along), lerp(-0.3, USE.y, along), 0);
    useDot.material.opacity = using * Math.sin(Math.PI * along);

    // the record of training, and the model stepping off the end of it
    trailMat.uniforms.uReveal.value = ease.inOutSine(ramp(t, T.tie + 0.9, T.tie + 3.4));
    trailMat.uniforms.uAlpha.value = out * ramp(t, T.tie + 0.8, T.tie + 1.2);
    stops.forEach(s => { s.n.material.opacity = out * (trailMat.uniforms.uReveal.value >= s.u ? 1 : 0); });
    gap.material.opacity = out * ramp(t, T.tie + 6.0, T.tie + 6.6);

    grade.uniforms.uFade.value = 1 - 0.55 * win(t, T.which + 1.0, T.catch + 0.3, 0.8, 0.6) - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
