/*
 * A walk downhill: how a machine learns, in a hundred seconds.
 *
 * It replaces the lab film "Gradient Pinball" and keeps its six ideas in the
 * same order: the downhill direction is the learning signal; one step against
 * the slope, repeated; the step size sits on an edge (too small wastes the
 * run, and above twice the reciprocal of the steepest curvature each step
 * overshoots further than the last); a long narrow valley makes plain steps
 * zigzag; heavy-ball momentum (Polyak, 1964) cancels the wobble and keeps the
 * forward motion; and in many dimensions the stalling points are mostly
 * saddles, not pits (Dauphin et al., 2014, under a random-field model).
 *
 * Nothing here is drawn by hand. The four surfaces are functions, written
 * once in GLSL for the terrain and once in JavaScript for the walkers, and
 * every path is the real iteration on its surface: the crawl and the
 * divergence are the same rule with two step sizes, the zigzag and the smooth
 * run are the same valley with and without momentum, the stall and the slide
 * are the same saddle without and with a little noise. The frame says the
 * surfaces are simple shapes chosen to show one effect each.
 *
 * The lab film's "kappa to its square root" is not spoken: it holds for a
 * strongly convex quadratic with tuned parameters, and a sentence that needs
 * that much qualifying does not belong in a film for a general viewer. The
 * lab page keeps it, with its conditions.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, land: 5.5, step: 16.5, small: 28.5, large: 35.5, ravine: 44.5, momentum: 54.5, saddle: 66.5, close: 81.5, card: 94.5 };
const D = 101;

const TL_DIR = new URL('../../audio/cinema/gradient-descent/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`gradient-descent: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
function makeWarp(anchors) {
  return real => {
    let i = 0;
    while (i < anchors.length - 2 && real > anchors[i + 1][0]) i++;
    const [r0, a0] = anchors[i], [r1, a1] = anchors[i + 1];
    if (real >= r1) return a1 + (real - r1);
    return a0 + (a1 - a0) * (real - r0) / (r1 - r0);
  };
}


/* ------------------------------------------------------------ the surfaces */
// Four heights over the same square. The GLSL below must say exactly the same thing.
const SURF = [
  (x, z) => 0.022 * ((x - 3) ** 2 + 1.4 * (z + 2) ** 2) + 0.66 * Math.exp(-((x + 1.2) ** 2 + (z - 0.2) ** 2) / 3.5) + 0.055 * Math.sin(0.8 * x + 0.4) * Math.cos(0.7 * z) + 0.275,
  (x, z) => 0.10 * (x * x + z * z),                       // a bowl
  (x, z) => 0.42 * x * x + 0.012 * z * z,                 // a long narrow valley, running toward the camera
  (x, z) => 0.06 * (x * x - z * z) + 2.2,                 // a saddle
];
const SURF_GLSL = /* glsl */`
  float h0(vec2 p) { return 0.022 * ((p.x - 3.0) * (p.x - 3.0) + 1.4 * (p.y + 2.0) * (p.y + 2.0))
    + 0.66 * exp(-((p.x + 1.2) * (p.x + 1.2) + (p.y - 0.2) * (p.y - 0.2)) / 3.5) + 0.055 * sin(0.8 * p.x + 0.4) * cos(0.7 * p.y) + 0.275; }
  float h1(vec2 p) { return 0.10 * dot(p, p); }
  float h2(vec2 p) { return 0.42 * p.x * p.x + 0.012 * p.y * p.y; }
  float h3(vec2 p) { return 0.06 * (p.x * p.x - p.y * p.y) + 2.2; }
  float H(vec2 p) { return uW.x * h0(p) + uW.y * h1(p) + uW.z * h2(p) + uW.w * h3(p); }`;
const LIFT = 0.1;
const on = (s, x, z) => new THREE.Vector3(x, Math.min(SURF[s](x, z), 9) + LIFT, z);
const slope = (s, x, z) => { const e = 1e-3; return [(SURF[s](x + e, z) - SURF[s](x - e, z)) / (2 * e), (SURF[s](x, z + e) - SURF[s](x, z - e)) / (2 * e)]; };

/* One rule for every walker: v = beta v - alpha grad (+ noise), then step. beta 0 is plain descent. */
function walk(s, x, z, alpha, n, beta = 0, noise = 0, seed = 7) {
  const rnd = seeded(seed);
  let vx = 0, vz = 0;
  const out = [on(s, x, z)];
  for (let i = 0; i < n; i++) {
    const [gx, gz] = slope(s, x, z);
    vx = beta * vx - alpha * gx + noise * (rnd() - 0.5);
    vz = beta * vz - alpha * gz + noise * (rnd() - 0.5);
    x += vx; z += vz;
    if (Math.abs(x) > 8.6 || Math.abs(z) > 8.6) { out.push(on(s, Math.max(-8.6, Math.min(8.6, x)), Math.max(-8.6, Math.min(8.6, z)))); break; }
    out.push(on(s, x, z));
  }
  return out;
}

/* -------------------------------------------------------------- palette */
const HDR = (r, g, b, k = 1) => new THREE.Color(r * k, g * k, b * k);
const COL = {
  path: HDR(0.55, 1.25, 2.3, 0.95),
  slow: HDR(2.2, 1.5, 0.5, 0.9),
  bad: HDR(2.6, 0.45, 0.5, 1.1),
  good: HDR(0.35, 2.2, 1.0, 1.0),
  bg: new THREE.Color(0x03050a),
};

/* -------------------------------------------------------------- shaders */
const TERRAIN = {
  vertexShader: /* glsl */`
    uniform vec4 uW; varying vec3 vW; varying vec3 vN;
    ${SURF_GLSL}
    void main() {
      vec2 p = position.xz; float e = 0.05;
      float h = min(H(p), 9.0);
      vN = normalize(vec3(H(p - vec2(e, 0.0)) - H(p + vec2(e, 0.0)), 2.0 * e, H(p - vec2(0.0, e)) - H(p + vec2(0.0, e))));
      vW = vec3(p.x, h, p.y);
      gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uSpot; uniform float uGlow; uniform vec3 uBg;
    varying vec3 vW; varying vec3 vN;
    void main() {
      float h = vW.y;
      vec3 col = mix(vec3(0.005, 0.016, 0.04), vec3(0.022, 0.075, 0.145), smoothstep(0.0, 5.0, h));
      float diff = clamp(dot(normalize(vN), normalize(vec3(-0.5, 0.9, 0.35))), 0.0, 1.0);
      col *= 0.35 + 0.75 * diff;
      float c = h * 2.5;                                        // contours: the landscape measuring itself
      float cd = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-4);
      col += vec3(0.16, 0.55, 1.0) * (1.0 - min(cd / 1.1, 1.0)) * 0.34;
      vec2 g = vW.xz / 1.5;
      vec2 gd = abs(fract(g - 0.5) - 0.5) / max(fwidth(g), vec2(1e-4));
      col += vec3(0.25, 0.55, 0.95) * (1.0 - min(min(gd.x, gd.y), 1.0)) * 0.045;
      float d = distance(vW.xz, uSpot.xz);
      col += vec3(0.25, 0.8, 1.0) * exp(-d * d / 1.6) * 0.3 * uGlow;
      float rim = length(vW.xz) / 9.0;                          // the square fades out before its edge, and is not drawn past it
      if (rim > 0.99) discard;
      col = mix(col, uBg, smoothstep(0.62, 0.99, rim));
      float fd = distance(cameraPosition, vW) * 0.022;
      col = mix(col, uBg, 1.0 - exp(-fd * fd));
      gl_FragColor = vec4(col, 1.0);
    }`,
};

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
  .cin .chip { font: 500 25px/1 "JetBrains Mono", monospace; padding: 10px 13px; border-radius: 8px; white-space: nowrap;
               background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.r { border-color: rgba(255,98,114,.75); color: #ff8a96; } .cin .chip.g { border-color: rgba(93,255,160,.7); color: #5dffa0; }
  .cin .chip.au { border-color: rgba(255,207,90,.7); color: #ffcf5a; }
  .cin .stamp { font: 700 31px/1 "Space Grotesk", sans-serif; letter-spacing: .12em; padding: 10px 16px 10px 12px;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); white-space: nowrap; }
  .cin .stamp .ic { margin-right: 8px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 80px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 118px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 900px; }
  .cin .end__a { font: 500 23px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'A walk downhill',
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
    ctx.setViewShift(0.2, 0.02);
    scene.background = COL.bg;

    const rnd = seeded(7);
    const DN = 1200, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 44; dp[i * 3 + 1] = 0.8 + rnd() * 14; dp[i * 3 + 2] = (rnd() - 0.5) * 44;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.9, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the terrain: one sheet whose height is a blend of the four surfaces */
    const tg = new THREE.PlaneGeometry(18, 18, 200, 200);
    tg.rotateX(-Math.PI / 2);
    const terrain = new THREE.Mesh(tg, new THREE.ShaderMaterial({
      vertexShader: TERRAIN.vertexShader, fragmentShader: TERRAIN.fragmentShader,
      uniforms: { uW: { value: new THREE.Vector4(1, 0, 0, 0) }, uSpot: { value: new THREE.Vector3() }, uGlow: { value: 1 }, uBg: { value: COL.bg } } }));
    terrain.frustumCulled = false;
    scene.add(terrain);

    /* a walker's trail: the points of its iteration, as a tube revealed up to step k */
    function trail(pts, color, smooth, radius = 0.06) {
      let curve;
      if (smooth) curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      else { curve = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) curve.add(new THREE.LineCurve3(pts[i - 1], pts[i])); }
      const m = mat(GLOWLINE, { uColor: color.clone(), uReveal: 0, uHead: 1, uAlpha: 0, uScan: -1, uScanAmt: 0, uScanColor: HDR(1.6, 2.2, 2.4) });
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(200, pts.length * 14), radius, 8), m));
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 12), new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.4), transparent: true, opacity: 0 }));
      scene.add(head);
      const n = pts.length - 1;
      return { pts, m, head, n,
        // show the trail up to step k (a fraction of a step is a walker in mid-stride)
        set(k, alpha) {
          const kk = Math.max(0, Math.min(n, k)), a = Math.floor(kk), b = Math.min(n, a + 1), f = ease.inOutCubic(kk - a);
          m.uniforms.uReveal.value = lerp(cum[a], cum[b], f) / cum[n];
          m.uniforms.uAlpha.value = alpha;
          head.position.lerpVectors(pts[a], pts[b], f);
          head.material.opacity = alpha;
        } };
    }
    const P = {
      first: trail(walk(0, -6.5, 5.2, 2.91, 50), COL.path, true, 0.07),
      crawl: trail(walk(1, 3.4, 3.0, 0.12, 16), COL.slow, true),
      fling: trail(walk(1, 0.6, 2.2, 10.9, 10), COL.bad, false),
      zigzag: trail(walk(2, 1.7, -7.5, 2.12, 40), COL.slow, false),
      smooth: trail(walk(2, 1.7, -7.5, 2.2, 40, 0.5), COL.good, true, 0.07),
      stall: trail(walk(3, 6, 0.0005, 0.9, 30), COL.slow, true),
      slide: trail(walk(3, 6, 0.0005, 1.2, 26, 0.6, 0.12, 7), COL.good, true, 0.07),
    };

    /* camera: one framing per surface */
    const keys = [
      { t: 0, pos: [-4.2, 9.5, 15], look: [-0.8, 1.2, 0] },
      { t: T.step, pos: [-2.6, 11, 14], look: [-0.7, 0.8, 0] },
      { t: T.small - 0.6, pos: [-1.2, 11.5, 13.5], look: [-0.6, 0.8, -0.5] },
      { t: T.small + 1.0, pos: [0.6, 12, 15], look: [0.6, 0.2, 0] },
      { t: T.ravine - 0.6, pos: [1.0, 12.5, 14.5], look: [0.6, 0.2, 0] },
      { t: T.ravine + 1.0, pos: [-1.2, 9.5, 9.5], look: [-1.2, 0, -3.0] },
      { t: T.saddle - 0.6, pos: [-0.8, 10, 9], look: [-1.2, 0, -3.0] },
      { t: T.saddle + 1.0, pos: [9.5, 9.5, 9.5], look: [0, 1.6, 0] },
      { t: T.close - 0.6, pos: [10.5, 9, 8], look: [0, 1.6, 0] },
      { t: T.close + 1.2, pos: [-2.6, 12, 14.5], look: [-0.7, 0.8, 0] },
      { t: D, pos: [-1.2, 13, 14], look: [-0.7, 0.8, 0] },
    ];
    const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    Object.assign(ctx, { dust, terrain, P, keys, cam });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 800 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1100, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.86) 0%, rgba(3,5,10,.62) 56%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 60% 52% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.land - gone, cls: 'blk', place: HD,
           html: '<div class="hd">How does a machine actually <em>learn</em>?</div><div class="sb">It walks downhill.</div>' });
    say(T.land, T.step - gone, 'A landscape of <em>every version</em> of the model.',
        'Height is how wrong that version is. Learning means finding low ground.');
    say(T.step, T.small - gone, 'It can only feel the <em>slope</em>.',
        'So it takes a step downhill, feels again, and repeats. Billions of times.');
    say(T.small, T.large - gone, 'Everything depends on the <em>size of the step</em>.', 'Too small, and it crawls.');
    say(T.large, T.ravine - gone, 'Too large, and it <span class="red">flies off</span>.',
        'It overshoots the valley, and each bounce is bigger than the last.');
    say(T.ravine, T.momentum - gone, 'The hard places: long, <span class="amber">narrow valleys</span>.',
        'Plain downhill steps zigzag between the walls, and barely move forward.');
    say(T.momentum, T.saddle - gone, 'The fix is <span class="green">momentum</span>.',
        'Give the walker a memory of its recent steps. The side to side wobble cancels out, and the forward motion adds up.');
    say(T.saddle, T.close - 0.25, 'The traps are <em>saddles</em>, not pits.',
        'Flat places that rise one way and fall another. Momentum, and a little noise, help the walker slide off.');
    text({ at: T.small + 0.8, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 880, w: 820 },
           html: 'Momentum: Polyak, 1964. Saddles in many dimensions: Dauphin et al., 2014.<span>These are simple surfaces, each chosen to show one effect. Every path is the real iteration on its surface.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 220, y: 270, w: 1480, align: 'center' },
           html: 'Every AI system you have used was trained this way: a long walk downhill, one small step at a time.' });
    text({ at: T.close + 6.2, out: T.card - 0.3, cls: 'cl__b', place: { x: 220, y: 420, w: 1480, align: 'center' },
           html: 'That walk is what my research <em>records</em>, to prove a model was really trained.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 240, w: 1600, align: 'center' },
           html: `<div class="end__t">A walk downhill</div>
                  <div class="end__s">How a machine learns: the step, its size, momentum and saddles.</div>
                  <div class="end__a">After Polyak (1964), Nesterov (1983) and Dauphin et al. (2014)</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* ----------------------------------------------------- pinned labels */
    const last = tr => tr.pts[tr.n];
    label({ cls: 'chip', html: 'here: very wrong', anchor: () => P.first.pts[0], dx: 0, dy: -30, ax: 0.5, ay: 1,
            alpha: t => win(t, T.land + 4.0, T.step + 1.4, 0.5, 0.5) });
    label({ cls: 'chip g', html: 'low ground: nearly right', anchor: () => last(P.first), dx: 20, dy: 40, ax: 1, ay: 0,
            alpha: t => win(t, T.land + 7.4, T.small - 0.9, 0.5, 0.5) });
    label({ cls: 'chip au', html: 'steps too small', anchor: () => P.crawl.head.position, dx: 0, dy: -34, ax: 0.5, ay: 1,
            alpha: t => win(t, T.small + 2.6, T.large - 0.2, 0.4, 0.4) });
    label({ cls: 'chip r', html: 'steps too large', anchor: () => P.fling.pts[0], dx: 0, dy: 34, ax: 0.5, ay: 0,
            alpha: t => win(t, T.large + 1.0, T.large + 6.0, 0.4, 0.4) });
    label({ cls: 'stamp red', html: `${NO}FLIES OFF`, anchor: () => new THREE.Vector3(0, 2.6, 0), dx: 0, dy: 0, ax: 0.5, ay: 1,
            alpha: t => win(t, T.large + 6.6, T.ravine - 0.7, 0.35, 0.4) });
    label({ cls: 'chip au', html: 'plain steps: zigzag', anchor: () => P.zigzag.pts[3], dx: 0, dy: -40, ax: 0.5, ay: 1,
            alpha: t => win(t, T.ravine + 3.4, T.saddle - 0.9, 0.4, 0.4) });
    label({ cls: 'chip g', html: 'with momentum', anchor: () => P.smooth.head.position, dx: 0, dy: 40, ax: 0.5, ay: 0,
            alpha: t => win(t, T.momentum + 3.0, T.saddle - 0.9, 0.4, 0.4) });
    label({ cls: 'chip', html: 'a saddle: up one way, down another', anchor: () => new THREE.Vector3(0, 2.3, 0), dx: 0, dy: -70, ax: 0.5, ay: 1,
            alpha: t => win(t, T.saddle + 3.0, T.saddle + 9.2, 0.4, 0.4) });
    label({ cls: 'chip au', html: 'stalls', anchor: () => P.stall.head.position, dx: -24, dy: 0, ax: 1, ay: 0.5,
            alpha: t => win(t, T.saddle + 6.4, T.saddle + 9.2, 0.4, 0.4) });
    label({ cls: 'chip g', html: 'slides off', anchor: () => P.slide.head.position, dx: 26, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.saddle + 11.4, T.close - 0.9, 0.4, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, terrain, P, keys, cam, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();
    ctx.cameraAt(keys, t, cam);
    cam.pos.x += Math.sin(t * 0.31) * 0.16; cam.pos.y += Math.sin(t * 0.23 + 1) * 0.1;
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);

    // which surface: the general landscape, the bowl, the valley, the saddle, and the landscape again
    const m = (a) => ease.inOutCubic(ramp(t, a - 0.6, a + 0.6));
    const bowl = m(T.small) * (1 - m(T.ravine)), valley = m(T.ravine) * (1 - m(T.saddle)), saddle = m(T.saddle) * (1 - m(T.close));
    terrain.material.uniforms.uW.value.set(1 - bowl - valley - saddle, bowl, valley, saddle);
    // a trail is shown only while its own surface is fully there
    const during = (a, b) => win(t, a + 0.7, b - 0.7, 0.4, 0.4);

    // the first walk: down the landscape, and again under the closing words
    const k1 = t < T.close ? 50 * Math.pow(ramp(t, T.step + 1.6, T.step + 10.8), 1.5) : 50;
    P.first.set(k1, during(T.hook - 2, T.small) + ramp(t, T.close + 0.8, T.close + 1.8));
    P.first.m.uniforms.uHead.value = t < T.close ? 1 : 0;
    P.first.m.uniforms.uScan.value = t > T.close ? ((t - T.close) * 0.16) % 1.2 - 0.05 : -1;
    P.first.m.uniforms.uScanAmt.value = t > T.close ? 0.7 : 0;

    // the same rule with a step too small, and a step too large
    P.crawl.set(16 * ramp(t, T.small + 1.8, T.large - 0.4), during(T.small, T.large + 0.6));
    P.fling.set(P.fling.n * ramp(t, T.large + 1.2, T.large + 6.6), during(T.large - 0.6, T.ravine));

    // the same valley without and with momentum
    P.zigzag.set(40 * ramp(t, T.ravine + 1.8, T.ravine + 9.4), during(T.ravine, T.saddle) * (t < T.momentum ? 1 : 0.55));
    P.smooth.set(40 * ramp(t, T.momentum + 2.0, T.momentum + 8.6), during(T.momentum - 0.6, T.saddle));

    // the same saddle without and with momentum and noise
    P.stall.set(30 * ramp(t, T.saddle + 2.0, T.saddle + 7.6), during(T.saddle, T.close) * (t < T.saddle + 9.6 ? 1 : 0.55));
    P.slide.set(P.slide.n * ramp(t, T.saddle + 9.8, T.saddle + 13.2), during(T.saddle + 8.6, T.close));

    // the ground glows under whichever walker is moving
    const lead = t < T.small ? P.first : t < T.large ? P.crawl : t < T.ravine ? P.fling : t < T.momentum ? P.zigzag : t < T.saddle ? P.smooth
      : t < T.saddle + 9.6 ? P.stall : t < T.close ? P.slide : P.first;
    terrain.material.uniforms.uSpot.value.copy(lead.head.position);
    terrain.material.uniforms.uGlow.value = lead.head.material.opacity;

    grade.uniforms.uFade.value = 1 - 0.4 * win(t, T.close, T.card + 0.4, 0.8, 0.6) - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
