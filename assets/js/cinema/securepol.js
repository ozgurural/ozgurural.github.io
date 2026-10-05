/*
 * SecurePoL in two minutes, told as a theft.
 *
 * Source: O. Ural and K. Yoshigoe, "SecurePoL: Integration of Watermarking With
 * Proof-of-Learning to Enhance Security Against Spoofing Attacks", IEEE Access
 * 13 (2025) 213067-213091. The section each claim comes from is noted in
 * scripts/cinema/securepol.voice.json, which is also the one place the
 * narration and its timing are written.
 *
 * The viewer is assumed to be bright and to know nothing about the subject, so
 * there are no figures on screen and none in the voice: results are stated in
 * words, and the two bars in the cost scene are drawn to the largest change the
 * paper measured. One picture carries the film. Training is a walk down a
 * landscape (a real momentum descent on the function below, not a drawn
 * curve). Proof-of-Learning keeps snapshots along it and a verifier replays
 * them. Replay needs a tolerance, drawn as a tube, and a forged trail that
 * stays inside the tube passes. SecurePoL plants a secret in the model while
 * it trains, which only the owner can ask for.
 */
import { THREE, createCinema, clamp01, lerp, ramp, ease, win, seeded } from './engine.js';

/* Authored cue times, one per narrated line. They mirror the `at` values in
   scripts/cinema/securepol.voice.json; the check below says so when they drift. */
const T = { hook: 0, copy: 5, walk: 13, receipts: 21.5, forged: 30.5, lock: 40.5, trap: 50.5, both: 58.5,
            thief: 65, scrub: 73.5, cost: 79, use: 87.5, hosp: 90.8, car: 95, cloud: 99.2, close: 104, card: 113.5 };
const D = 120;   // authored length; the real length comes from the narration timeline

/* The narration build (scripts/cinema-voice.py) writes the real schedule. Its
   anchors pair real time with authored time; between them authored time runs
   at most as fast as real time, so a scene stretches to fit its sentence and
   is never rushed. Without a timeline the film plays silent on its own clock. */
const TL_DIR = new URL('../../audio/cinema/securepol/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`securepol: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
function makeWarp(anchors) {
  return real => {
    let i = 0;
    while (i < anchors.length - 2 && real > anchors[i + 1][0]) i++;
    const [r0, a0] = anchors[i], [r1, a1] = anchors[i + 1];
    if (real >= r1) return a1 + (real - r1);
    return a0 + (a1 - a0) * (real - r0) / (r1 - r0);
  };
}

/* ------------------------------------------------------------ landscape */
function loss(x, z) {
  const dx = x - 4, dz = z + 5;
  let h = 2.3 * Math.log(1 + (dx * dx + 1.3 * dz * dz) / 28);
  h += 1.6 * Math.exp(-((x + 1.5) ** 2 + (z - 1.0) ** 2) / 7);
  h -= 0.9 * Math.exp(-((x + 8.5) ** 2 + (z + 2) ** 2) / 9);
  h += 0.32 * Math.sin(0.62 * x + 0.4) * Math.cos(0.5 * z - 0.2);
  h += 0.12 * Math.sin(1.4 * x + 1.1 * z);
  return h + 0.3;
}
function grad(x, z) {
  const e = 1e-3;
  return [(loss(x + e, z) - loss(x - e, z)) / (2 * e), (loss(x, z + e) - loss(x, z - e)) / (2 * e)];
}
const LIFT = 0.16;

/* Momentum SGD on the landscape. Seeded, so the path is the same on every
   load, and noisy early the way minibatch gradients are. */
function descend(N, x0 = -12.5, z0 = 11, seed = 0x5ec0de) {
  const rnd = seeded(seed);
  let x = x0, z = z0, vx = 0, vz = 0;
  const out = [];
  for (let i = 0; i <= N; i++) {
    out.push(new THREE.Vector3(x, loss(x, z) + LIFT, z));
    const [gx, gz] = grad(x, z);
    const noise = 0.06 * Math.exp(-i / 220);
    vx = 0.93 * vx - 1.6 * 0.022 * gx + (rnd() - 0.5) * noise;
    vz = 0.93 * vz - 1.6 * 0.022 * gz + (rnd() - 0.5) * noise;
    x += vx; z += vz;
  }
  return out;
}

/* Arc-length table for a polyline, so "how far along" means the same thing to
   the tube's reveal (which is by arc length) and to the comet riding it. */
function arcTable(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[cum.length - 1];
  return { L, at: i => { const k = Math.max(0, Math.min(pts.length - 1, i));
                         const a = Math.floor(k), b = Math.min(pts.length - 1, a + 1);
                         return lerp(cum[a], cum[b], k - a) / L; } };
}

/* -------------------------------------------------------------- palette */
const HDR = (r, g, b, k = 1) => new THREE.Color(r * k, g * k, b * k);
const COL = {
  path: HDR(0.55, 1.25, 2.3, 0.95),
  logged: HDR(1.2, 1.5, 2.2, 1.2),
  ok: HDR(0.35, 2.2, 1.0, 1.2),
  forged: HDR(2.6, 0.75, 0.2, 1.1),
  bad: HDR(2.6, 0.45, 0.5, 1.2),
  gold: HDR(2.4, 1.7, 0.55, 1.2),
  tube: HDR(0.3, 0.7, 1.4),
  bg: new THREE.Color(0x03050a),
};

/* -------------------------------------------------------------- shaders */
const TERRAIN = {
  vertexShader: /* glsl */`
    varying vec3 vW; varying vec3 vN;
    void main() {
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz; vN = normal;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uComet; uniform float uGlow; uniform vec3 uBg; uniform float uLines; uniform float uShow;
    varying vec3 vW; varying vec3 vN;
    void main() {
      float h = vW.y;
      vec3 col = mix(vec3(0.005, 0.016, 0.04), vec3(0.022, 0.075, 0.145), smoothstep(0.0, 6.5, h));
      float diff = clamp(dot(normalize(vN), normalize(vec3(-0.5, 0.9, 0.35))), 0.0, 1.0);
      col *= 0.35 + 0.75 * diff;
      // iso-loss contours: the landscape measuring itself
      float c = h * 2.0;
      float cd = abs(fract(c - 0.5) - 0.5) / max(fwidth(c), 1e-4);
      float line = 1.0 - min(cd / 1.1, 1.0);
      col += vec3(0.16, 0.55, 1.0) * line * 0.32 * uLines * (0.45 + 0.55 * smoothstep(0.0, 5.0, h));
      vec2 g = vW.xz / 1.5;
      vec2 gd = abs(fract(g - 0.5) - 0.5) / max(fwidth(g), vec2(1e-4));
      float grid = 1.0 - min(min(gd.x, gd.y), 1.0);
      col += vec3(0.25, 0.55, 0.95) * grid * 0.045 * uLines;
      float d = distance(vW.xz, uComet.xz);
      col += vec3(0.25, 0.8, 1.0) * exp(-d * d / 2.2) * 0.3 * uGlow;
      float r = length(vW.xz - vec2(-2.0, 2.0)) / 21.0;
      col *= 1.0 - smoothstep(0.5, 1.0, r);
      float dist = distance(cameraPosition, vW);
      float fd = dist * 0.024;
      col = mix(col, uBg, 1.0 - exp(-fd * fd));
      col = mix(uBg, col, uShow);
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

const RIM = {
  vertexShader: GLOWLINE.vertexShader,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uAlpha; uniform float uReveal; uniform float uPow;
    varying float vU; varying vec3 vN; varying vec3 vV;
    void main() {
      if (vU > uReveal) discard;
      float f = pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), uPow);
      gl_FragColor = vec4(uColor * uAlpha * (0.05 + 0.95 * f), 1.0);
    }`,
};

const BEAM = {
  vertexShader: /* glsl */`
    varying float vY; varying vec3 vN; varying vec3 vV;
    void main() {
      vY = uv.y;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uAlpha;
    varying float vY; varying vec3 vN; varying vec3 vV;
    void main() {
      float f = 0.35 + 0.65 * pow(clamp(1.0 - abs(dot(vN, vV)), 0.0, 1.0), 1.2);
      float a = uAlpha * f * smoothstep(0.0, 0.2, vY) * smoothstep(1.0, 0.55, vY);
      gl_FragColor = vec4(uColor * a, 1.0);
    }`,
};

const PILLAR = {
  vertexShader: /* glsl */`
    varying float vY;
    void main() { vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform vec3 uColor; uniform float uAlpha; varying float vY;
    void main() { gl_FragColor = vec4(uColor * uAlpha * pow(clamp(1.0 - vY, 0.0, 1.0), 1.6), 1.0); }`,
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
  .cin .stamp { font: 700 31px/1 "Space Grotesk", sans-serif; letter-spacing: .12em; padding: 10px 16px 10px 12px;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); }
  .cin .stamp .ic { margin-right: 8px; }
  .cin .credit { font: 500 23px/1.5 "JetBrains Mono", monospace; letter-spacing: .04em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #7f8ea3; }
  .cin .vrow { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1.3fr; align-items: center; gap: 10px;
               font: 500 29px/1 "Inter", sans-serif; color: #dfe7f2;
               padding: 18px 20px; border-radius: 14px; background: rgba(6,12,24,.72); border: 1px solid rgba(127,207,255,.18); }
  .cin .vrow .ic { width: 1.4em; height: 1.4em; }
  .cin .vrow .who { font: 600 29px/1 "Space Grotesk", sans-serif; }
  .cin .vrow .res { font: 700 24px/1 "Space Grotesk", sans-serif; letter-spacing: .08em; text-align: right; }
  .cin .vrow.hdr { background: none; border: none; padding: 0 20px; font: 500 19px/1 "JetBrains Mono", monospace;
                   letter-spacing: .12em; color: #7f8ea3; text-transform: uppercase; }
  .cin .map { padding: 18px 20px 16px; border-radius: 16px; background: rgba(6,12,24,.8); border: 1px solid rgba(127,207,255,.2); }
  .cin .map svg { display: block; width: 100%; height: auto; }
  .cin .map__c { font: 400 29px/1.4 "Inter", sans-serif; color: #c3cfdf; margin-top: 12px; }
  .cin .map__c b { color: #ffcf5a; font-weight: 600; }
  .cin .bars { padding: 24px 28px; border-radius: 16px; background: rgba(6,12,24,.8); border: 1px solid rgba(127,207,255,.2); }
  .cin .bars__t { font: 600 36px/1.15 "Space Grotesk", sans-serif; color: #f4f7fb; margin-bottom: 18px; }
  .cin .bars__r { display: grid; grid-template-columns: 250px 1fr; align-items: center; gap: 14px; margin-bottom: 12px;
                  font: 400 26px/1 "Inter", sans-serif; color: #aebcd0; }
  .cin .bars__k { display: flex; height: 24px; border-radius: 6px; overflow: hidden; background: rgba(127,207,255,.08); }
  .cin .bars__k i { display: block; height: 100%; width: 0; background: #6fd3ff; }
  .cin .bars__k i.g { background: #ffcf5a; }
  .cin .bars__k i.x { background: repeating-linear-gradient(135deg, #ffcf5a 0 6px, rgba(255,207,90,.4) 6px 12px); }
  .cin .bars__c { font: 600 31px/1.3 "Inter", sans-serif; color: #5dffa0; margin-top: 16px; }
  .cin .note { font: 500 22px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fa2ba; }
  .cin .use { display: grid; grid-template-columns: 58px 1fr; gap: 22px; align-items: start; padding: 22px 26px;
              border-radius: 16px; background: rgba(6,12,24,.86); border: 1px solid rgba(127,207,255,.2); }
  .cin .use svg { width: 58px; height: 58px; color: #6fd3ff; }
  .cin .use__t { font: 600 38px/1.15 "Space Grotesk", sans-serif; color: #f4f7fb; }
  .cin .use__d { font: 400 31px/1.4 "Inter", sans-serif; color: #c3cfdf; margin-top: 7px; }
  .cin .use__d b { color: #5dffa0; font-weight: 600; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 118px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 860px; }
  .cin .end__a { font: 500 26px/1.4 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 40px; letter-spacing: .04em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 60px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* A street plan with one street that is not there. Mapmakers planted these so a
   copied map could be told from an original; the gold street is drawn last. */
const MAP = `<svg viewBox="0 0 660 250" aria-hidden="true">
  <g stroke="#3f5878" stroke-width="5" stroke-linecap="round" fill="none">
    <path d="M10 50H650M10 125H650M10 200H650"/><path d="M90 10V240M230 10V240M400 10V240M560 10V240"/>
    <path d="M230 50L400 125" stroke-width="4"/><path d="M400 200L560 125" stroke-width="4"/>
  </g>
  <g fill="#1a2a40"><rect x="110" y="68" width="100" height="40" rx="4"/><rect x="420" y="68" width="120" height="40" rx="4"/>
    <rect x="110" y="143" width="100" height="40" rx="4"/><rect x="250" y="143" width="130" height="40" rx="4"/></g>
  <path class="trap" d="M300 125V200" stroke="#ffcf5a" stroke-width="6" stroke-linecap="round" fill="none" stroke-dasharray="75" stroke-dashoffset="75"/>
  <g class="tag" opacity="0"><rect x="316" y="146" width="128" height="34" rx="6" fill="#0a1220" stroke="#ffcf5a" stroke-width="1.5"/>
    <text x="380" y="169" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="17" fill="#ffcf5a">not real</text></g>
</svg>`;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'SecurePoL, animated',
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

    /* terrain */
    const E = 22;
    const tg = new THREE.PlaneGeometry(2 * E, 2 * E, 240, 240);
    tg.rotateX(-Math.PI / 2);
    const tp = tg.attributes.position;
    for (let i = 0; i < tp.count; i++) tp.setY(i, loss(tp.getX(i), tp.getZ(i)));
    tg.computeVertexNormals();
    const terrain = new THREE.Mesh(tg, new THREE.ShaderMaterial({
      vertexShader: TERRAIN.vertexShader, fragmentShader: TERRAIN.fragmentShader,
      uniforms: { uComet: { value: new THREE.Vector3() }, uGlow: { value: 1 }, uBg: { value: COL.bg },
                  uLines: { value: 1 }, uShow: { value: 0 } } }));
    scene.add(terrain);

    /* dust, for depth */
    const rnd = seeded(7);
    const DN = 1400, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 48; dp[i * 3 + 1] = 0.8 + rnd() * 16; dp[i * 3 + 2] = (rnd() - 0.5) * 48;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 1, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the honest run */
    const N = 200;
    const pts = descend(N);
    const arc = arcTable(pts);
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const pathMat = mat(GLOWLINE, { uColor: COL.path, uReveal: 0, uHead: 1, uAlpha: 1,
                                    uScan: -1, uScanAmt: 0, uScanColor: HDR(1.6, 2.2, 2.4) });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 900, 0.07, 10), pathMat));
    const comet = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 12), new THREE.MeshBasicMaterial({ color: HDR(1.6, 2.6, 3.2, 0.9) }));
    const verifier = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 10), new THREE.MeshBasicMaterial({ color: HDR(2.4, 2.6, 2.4), transparent: true, opacity: 0 }));
    scene.add(comet, verifier);

    /* snapshots along the walk */
    const CK = [25, 50, 75, 100, 125, 150, 175];
    const logT = k => T.receipts + 0.9 + k * 0.42;
    const cks = CK.map((idx, k) => {
      const p = pts[idx].clone();
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 8, 1, true).translate(0, 0.5, 0),
                                    mat(PILLAR, { uColor: COL.logged.clone(), uAlpha: 0 }));
      pillar.position.copy(p);
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 10), new THREE.MeshBasicMaterial({ color: COL.logged.clone(), transparent: true }));
      node.position.copy(p);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.31, 48).rotateX(-Math.PI / 2),
                                  new THREE.MeshBasicMaterial({ color: COL.logged.clone(), transparent: true, opacity: 0,
                                                                blending: THREE.AdditiveBlending, depthWrite: false }));
      ring.position.copy(p).y -= LIFT * 0.6;
      scene.add(pillar, node, ring);
      return { idx, u: arc.at(idx), p, pillar, node, ring, at: logT(k) };
    });

    /* tolerance: the tube a replay may land anywhere inside (Sec. II-A, VII-B) */
    const tubeMat = mat(RIM, { uColor: COL.tube, uAlpha: 0, uReveal: 1, uPow: 3.0 }, { side: THREE.DoubleSide });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 600, 0.62, 28), tubeMat));

    /* the forged trail: cheap, wobbling, never leaving the tube (Sec. II-A) */
    const fr = seeded(99);
    const ph = [fr() * 6.28, fr() * 6.28, fr() * 6.28];
    const fpts = pts.map((p, i) => {
      const s = i / N;
      const a = i < N ? pts[i + 1].clone().sub(p) : p.clone().sub(pts[i - 1]);
      const side = new THREE.Vector3(-a.z, 0, a.x).normalize();
      const env = Math.min(1, s * 7);
      const off = 0.4 * env * (0.6 * Math.sin(6.283 * 2.6 * s + ph[0]) + 0.4 * Math.sin(6.283 * 6.1 * s + ph[1]));
      const lift = 0.14 * env * Math.sin(6.283 * 4.3 * s + ph[2]);
      return p.clone().addScaledVector(side, off).add(new THREE.Vector3(0, lift, 0));
    });
    const fcurve = new THREE.CatmullRomCurve3(fpts, false, 'centripetal');
    const forgedMat = mat(GLOWLINE, { uColor: COL.forged, uReveal: 0, uHead: 1, uAlpha: 0,
                                      uScan: -1, uScanAmt: 0, uScanColor: HDR(1.6, 2.2, 2.4) });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(fcurve, 900, 0.09, 8), forgedMat));
    const fnodes = CK.map(idx => {
      const n = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 8), new THREE.MeshBasicMaterial({ color: COL.forged.clone(), transparent: true, opacity: 0 }));
      n.position.copy(fpts[idx]);
      scene.add(n);
      return { n, u: arc.at(idx) };
    });

    /* the two models. They open the film as an original and its copy, and come
       back as the owner's model and the thief's claim. */
    const END = pts[N].clone(), FEND = fpts[N].clone();
    const COLH = COL.path.clone().multiplyScalar(0.9), COLF = COL.forged.clone().multiplyScalar(0.9);
    function orb(color) {
      const g = new THREE.Group();
      const shell = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.85, 1)),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 16), mat(RIM, { uColor: color.clone(), uAlpha: 0, uReveal: 2, uPow: 1.6 }));
      g.add(shell, core);
      scene.add(g);
      return { g, shell, core };
    }
    const honest = orb(COLH);
    const forged = orb(COLF);
    const HOVER_H = new THREE.Vector3(-1.6, 2.4, 0).add(END);
    const HOVER_F = new THREE.Vector3(1.6, 2.4, 0).add(END);
    const introMid = new THREE.Vector3();

    /* the secret: points trained into the owner's model, joined only when the right question finds them */
    const mr = seeded(42);
    const MK = 13, markPos = [];
    for (let i = 0; i < MK; i++) {
      const th = mr() * 6.283, ph2 = Math.acos(2 * mr() - 1), r = 0.3 + 0.28 * mr();
      markPos.push(new THREE.Vector3(r * Math.sin(ph2) * Math.cos(th), r * Math.cos(ph2), r * Math.sin(ph2) * Math.sin(th)));
    }
    const mg = new THREE.BufferGeometry().setFromPoints(markPos);
    const motes = new THREE.Points(mg, mat(MOTES, { uColor: COL.gold, uAlpha: 0, uPR: 1, uSize: 5 }));
    const segs = [];
    for (let i = 0; i < MK; i++) segs.push(markPos[i], markPos[(i * 5 + 3) % MK]);
    const constellation = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs),
      new THREE.LineBasicMaterial({ color: COL.gold, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    honest.g.add(motes, constellation);

    /* the weave: gold drawn out of the walk into the model while it trains */
    const WN = 60, wsrc = [], wdst = [], wpos = new Float32Array(WN * 3);
    const wr = seeded(5);
    for (let i = 0; i < WN; i++) {
      wsrc.push(curve.getPointAt(0.35 + 0.65 * wr()));
      wdst.push(markPos[i % MK]);
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(wpos, 3));
    const weave = new THREE.Points(wg, mat(MOTES, { uColor: COL.gold, uAlpha: 0, uPR: 1, uSize: 3.2 }));
    weave.frustumCulled = false;
    scene.add(weave);

    /* the owner's secret questions, as a beam of light */
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.72, 3.3, 40, 1, true),
                                mat(BEAM, { uColor: COL.gold, uAlpha: 0 }, { side: THREE.DoubleSide }));
    scene.add(beam);

    /* the scrub: fine-tuning the secret away walks the model off its recorded trail (Sec. III-C.5, VI-I) */
    const adir = new THREE.Vector3(0.75, 0, 0.66).normalize();
    const aperp = new THREE.Vector3(-adir.z, 0, adir.x);
    const apts = [];
    for (let i = 0; i <= 60; i++) {
      const s = i / 60;
      const q = END.clone().addScaledVector(adir, 3.4 * s).addScaledVector(aperp, 0.9 * Math.sin(Math.PI * s * 0.9));
      q.y = loss(q.x, q.z) + LIFT;
      apts.push(q);
    }
    const acurve = new THREE.CatmullRomCurve3(apts);
    const attackMat = mat(GLOWLINE, { uColor: COL.bad, uReveal: 0, uHead: 1, uAlpha: 0, uScan: -1, uScanAmt: 0, uScanColor: COL.bad });
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(acurve, 200, 0.065, 8), attackMat));
    const AEND = apts[apts.length - 1].clone();
    const gap = new THREE.Line(new THREE.BufferGeometry().setFromPoints([END.clone().setY(END.y + 0.05), AEND.clone().setY(AEND.y + 0.05)]),
                               new THREE.LineDashedMaterial({ color: HDR(2, 2, 2), dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0 }));
    gap.computeLineDistances();
    scene.add(gap);
    const aNode = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 10), new THREE.MeshBasicMaterial({ color: COL.bad, transparent: true, opacity: 0 }));
    aNode.position.copy(AEND);
    scene.add(aNode);

    /* camera: held on the two models, then the whole walk, then the models again, then back out */
    const M = curve.getPointAt(0.5);
    const at = (base, dx, dy, dz) => [base.x + dx, base.y + dy, base.z + dz];
    const lk = (base, dx = 0, dy = 0, dz = 0) => [base.x + dx, base.y + dy, base.z + dz];
    const keys = [
      { t: 0, pos: at(M, -0.6, 22.5, 23.4), look: lk(M, 3.0, -1.2, 1.3) },
      { t: T.walk, pos: at(M, 0, 22.5, 23), look: lk(M, 3.0, -1.2, 1.3) },
      { t: 21, pos: at(M, 1, 20.5, 21.5), look: lk(M, 3.0, -1.0, 1.0) },
      { t: 30, pos: at(M, 2, 19, 20), look: lk(M, 3.0, -1.0, 0.6) },
      { t: 35.5, pos: at(M, 4, 13.5, 14.5), look: lk(M, 0.5, -0.4, -0.3) },
      { t: 40.4, pos: at(M, 6, 12.5, 13), look: lk(M, 0.8, -0.4, -0.6) },
      { t: 42.8, pos: at(END, -0.5, 3.2, 11.5), look: lk(END, -0.5, 2.2, 0) },
      { t: 58, pos: at(END, 0.2, 2.9, 10.4), look: lk(END, -0.5, 2.3, 0) },
      { t: 68.0, pos: at(END, -0.1, 2.8, 10.0), look: lk(END, -0.5, 2.3, 0) },
      { t: 70.0, pos: at(END, -5.5, 8.5, 9), look: lk(END, 1.5, 0.3, 0.9) },
      { t: 78.8, pos: at(END, -6.3, 9, 8.2), look: lk(END, 1.5, 0.3, 0.9) },
      { t: 86, pos: at(M, -5, 21, 17), look: lk(M, 0, -1, 0) },
      { t: T.close, pos: at(M, -2, 25, 21), look: lk(M, 1, -1.5, -1) },
      { t: D, pos: at(M, -1, 22, 18.5), look: lk(M, 1, -1.5, -1) },
    ];
    const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };

    Object.assign(ctx, { terrain, dust, pathMat, comet, verifier, curve, arc, cks, tubeMat, forgedMat, fnodes, honest, forged,
                         HOVER_H, HOVER_F, END, FEND, COLH, COLF, introMid, motes, constellation, weave, wsrc, wdst, wpos, beam,
                         attackMat, gap, aNode, AEND, keys, cam, N });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 860 };
    const SB = { x: 120, y: 480, w: 720 };
    // A headline with the rest of the sentence under it, arriving as one block.
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    // a soft darkness under the type, so the light never crosses a sentence
    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1100, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.86) 0%, rgba(3,5,10,.62) 56%, rgba(3,5,10,0) 100%)');
    scrim(T.cost - 0.2, T.close - 0.1, { x: 900, y: 0, w: 1020, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,0) 0%, rgba(3,5,10,.84) 14%, rgba(3,5,10,.84) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 56% 50% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    // the theft
    text({ at: -3, out: T.copy - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Someone copies your AI model. How do you prove it was <em>yours</em>?</div>' });
    say(T.copy, T.walk - gone, 'A trained model is just a <em>file of numbers</em>.',
        'The copy is identical, and nothing in it says <b>who did the work</b>.');

    // the trail
    say(T.walk, T.receipts - gone, 'But the work leaves a <em>trail</em>.',
        'Training is a long walk downhill, every step making the model a little less wrong.');
    say(T.receipts, T.forged - gone, 'Proof-of-Learning <em>keeps that trail</em>.',
        'Snapshots along the way, which a verifier can replay to check the walk really happened.');

    // the catch
    say(T.forged, 36.75, 'There&rsquo;s a <span class="amber">catch</span>.',
        'No computer repeats a long calculation exactly, so the check has to accept <b>close enough</b>.');
    say(36.8, T.lock - gone, 'And close enough <span class="amber">can be faked</span>.',
        'A forged trail that stays inside the tolerance passes the check.');

    // the secret
    say(T.lock, T.trap - gone, 'SecurePoL closes that gap with a <span class="gold">secret</span>.');
    text({ at: 44.5, out: T.trap - gone, cls: 'sb', place: { x: 120, y: 410, w: 740 },
           html: 'While the model trains, it also learns <b>planted answers</b> to questions only its owner knows.' });
    text({ at: 45.6, out: T.trap - gone, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 610, w: 780 },
           html: 'Our work: Ural &amp; Yoshigoe, IEEE Access, 2025<span>Shown here: the trigger-set design, one of three in the paper.</span>' });

    say(T.trap, T.both - gone, 'Mapmakers used the <span class="gold">same trick</span>.');
    text({ at: T.trap + 0.7, out: T.both - gone, cls: 'map', words: false, dur: 0.6, rise: 20, place: { x: 120, y: 410, w: 640 },
           html: `${MAP}<div class="map__c">A street that <b>doesn&rsquo;t exist</b>, hidden in the map to catch anyone who copies it.</div>`,
           update: (t, el) => {
             el.querySelector('.trap').style.strokeDashoffset = String(75 * (1 - ease.inOutSine(ramp(t, T.trap + 2.0, T.trap + 3.0))));
             el.querySelector('.tag').setAttribute('opacity', String(ramp(t, T.trap + 3.0, T.trap + 3.5)));
           } });

    say(T.both, T.thief - gone, 'Now a claim needs <em>both</em>.');
    const VP = y => ({ x: 120, y, w: 700 });
    text({ at: T.both + 0.6, out: T.thief - gone, cls: 'vrow hdr', words: false, dur: 0.5, place: VP(410),
           html: '<span></span><span>trail</span><span>secret</span><span style="text-align:right">verdict</span>' });
    text({ at: T.both + 1.7, out: T.thief - gone, cls: 'vrow', words: false, dur: 0.5, place: VP(446),
           html: `<span class="who" style="color:#6fd3ff">The owner</span><span class="green">${OK}</span><span class="green">${OK}</span><span class="res green">ACCEPTED</span>` });
    text({ at: T.both + 4.2, out: T.thief - gone, cls: 'vrow', words: false, dur: 0.5, place: VP(538),
           html: `<span class="who" style="color:#ffb347">A forger</span><span class="green">${OK}</span><span class="red">${NO}</span><span class="res red">REJECTED</span>` });

    // the thief's two ways out
    say(T.thief, 67.75, 'A thief can&rsquo;t name the questions.');
    say(67.8, T.scrub - gone, 'Scrub the secret out, and the model <span class="red">stops matching its own trail</span>.');
    say(T.scrub, T.cost - gone, 'Hiding that takes <em>real training</em>.', 'The very work they tried to skip.');

    // what it costs (Sec. VI-B, VI-F): bars drawn to the largest change the paper measured, no figures
    say(T.cost, T.use - gone, 'And the price is <em>small</em>.',
        'In our experiments the model stayed almost exactly as accurate, and training took only a little longer.');
    const BARS = [
      ['Accuracy', [['without', [['', 92]]], ['with SecurePoL', [['g', 91.42]]]], 'almost exactly the same'],
      ['Training time', [['without', [['', 85.25]]], ['with SecurePoL', [['g', 85.25], ['x', 14.75]]]], 'a little longer'],
    ];
    BARS.forEach(([title, rows, verdict], i) => {
      const t0 = T.cost + 0.8 + i * 0.5;
      text({ at: t0, out: T.use - gone, cls: 'bars', words: false, dur: 0.55, place: { x: 1010, y: 200 + i * 300, w: 800 },
             html: `<div class="bars__t">${title}</div>` + rows.map(([name, segs]) =>
                     `<div class="bars__r"><span>${name}</span><div class="bars__k">${segs.map(([c, w]) => `<i class="${c}" data-w="${w}"></i>`).join('')}</div></div>`).join('') +
                   `<div class="bars__c">${verdict}</div>`,
             update: (t, el) => {
               const u = ease.outCubic(ramp(t, t0 + 0.3, t0 + 1.6));
               el.querySelectorAll('i').forEach(b => { b.style.width = (Number(b.dataset.w) * u).toFixed(2) + '%'; });
             } });
    });
    text({ at: T.cost + 2.4, out: T.use - gone, cls: 'note', words: false, dur: 0.5, place: { x: 1010, y: 820, w: 800 },
           html: 'Bars show the largest change measured across the three designs in the paper.' });

    // where it applies: the paper's three application scenarios (Sec. V-A), labelled as such
    const ICON = {
      hosp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V8l8-5 8 5v13"/><path d="M3 21h18"/><path d="M12 9v6M9 12h6"/><path d="M10 21v-3h4v3"/></svg>',
      car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 16v-3l2.2-5h13.6L21 13v3"/><path d="M3 16h18"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/><path d="M6 12h12"/></svg>',
      cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 11 3.5 3.5 0 0 0 7 18z"/><path d="M9.8 14.2l1.7 1.7 3.3-3.4"/></svg>',
    };
    say(T.use, T.close - 0.25, 'This matters wherever a model <em>changes hands</em>.');
    const USES = [
      ['hosp', T.hosp, 'A hospital', 'can confirm its model is <b>the one that was audited</b>.'],
      ['car', T.car, 'A carmaker', 'can <b>replay a supplier&rsquo;s training</b> after an incident.'],
      ['cloud', T.cloud, 'An AI provider', 'can show a model was <b>trained on licensed data</b>.'],
    ];
    USES.forEach(([k, at0, t1, d], i) => {
      text({ at: at0, out: T.close - 0.25, cls: 'use', words: false, dur: 0.6, rise: 22, place: { x: 1010, y: 190 + i * 222, w: 810 },
             html: `${ICON[k]}<div><div class="use__t">${t1}</div><div class="use__d">${d}</div></div>` });
    });
    text({ at: T.cloud + 1.2, out: T.close - 0.25, cls: 'note', words: false, dur: 0.5, place: { x: 1010, y: 872, w: 810 },
           html: 'Application scenarios described in the paper.' });

    // the view
    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 260, y: 320, w: 1400, align: 'center' },
           html: 'AI models are becoming things we buy, deploy and trust.' });
    text({ at: T.close + 3.6, out: T.card - 0.3, cls: 'cl__b', place: { x: 260, y: 430, w: 1400, align: 'center' },
           html: '<em>Where a model came from</em> will matter as much as what it can do.' });

    // the card: the paper and who did it
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">SecurePoL</div>
                  <div class="end__s">Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks</div>
                  <div class="end__a">Ozgur Ural &amp; Kenji Yoshigoe &middot; IEEE Access, 2025</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* ----------------------------------------------------- pinned labels */
    label({ cls: 'chip', html: 'your model', anchor: () => honest.g.position, dx: 0, dy: 236, ax: 0.5, ay: 0,
            alpha: t => win(t, 0.6, T.walk - 0.5, 0.5, 0.5) });
    label({ cls: 'chip', html: 'the copy', anchor: () => forged.g.position, dx: 0, dy: 236, ax: 0.5, ay: 0,
            alpha: t => win(t, T.copy + 1.9, T.walk - 0.5, 0.5, 0.5) });
    label({ cls: 'stamp green', html: `${OK}IDENTICAL`, anchor: () => introMid, dx: 0, dy: -250, ax: 0.5, ay: 1,
            alpha: t => win(t, T.copy + 2.9, T.walk - 0.5, 0.35, 0.5) });
    label({ cls: 'chip', html: 'start: mostly wrong', anchor: () => pts[0], dx: 0, dy: -30, ax: 0.5, ay: 1,
            alpha: t => win(t, T.walk + 0.8, T.receipts - 0.2, 0.4, 0.5) });
    label({ cls: 'chip', html: 'the trained model', anchor: () => END, dx: 0, dy: 34, ax: 0.5, ay: 0,
            alpha: t => win(t, 20.6, T.forged - 0.2, 0.4, 0.5) });
    [0, 3].forEach(k => label({ cls: 'chip', html: 'snapshot', anchor: () => cks[k].p, dx: 0, dy: -62, ax: 0.5, ay: 1,
            alpha: t => win(t, cks[k].at + 0.2, 26.4, 0.4, 0.5) }));
    label({ cls: 'stamp green', html: `${OK}THE WALK CHECKS OUT`, anchor: () => cks[4].p, dx: 60, dy: -110, ax: 0.5, ay: 1,
            alpha: t => win(t, 28.6, T.forged - 0.1, 0.35, 0.4) });
    label({ cls: 'chip', html: 'close enough', anchor: () => cks[4].p, dx: 0, dy: -84, ax: 0.5, ay: 1,
            alpha: t => win(t, 34.4, 38.6, 0.4, 0.4) });
    label({ cls: 'stamp amber', html: `${OK}PASSES`, anchor: () => fnodes[4].n.position, dx: 40, dy: -110, ax: 0.5, ay: 1,
            alpha: t => win(t, 39.0, 40.8, 0.35, 0.5) });
    label({ cls: 'chip', html: 'the owner&rsquo;s model', anchor: () => honest.g.position, dx: 0, dy: -132, ax: 0.5, ay: 1,
            alpha: t => win(t, 43.0, 68.2, 0.5, 0.4) });
    label({ cls: 'chip', html: 'a forger&rsquo;s claim', anchor: () => forged.g.position, dx: 0, dy: -128, ax: 0.5, ay: 1,
            alpha: t => win(t, 43.0, 68.2, 0.5, 0.4) });
    label({ cls: 'stamp green', html: `${OK}KNOWS THE SECRET`, anchor: () => honest.g.position, dx: 0, dy: 108, ax: 0.5, ay: 0,
            alpha: t => win(t, T.both + 1.6, T.thief - 0.1, 0.35, 0.4) });
    label({ cls: 'stamp red', html: `${NO}NO ANSWER`, anchor: () => forged.g.position, dx: 0, dy: 108, ax: 0.5, ay: 0,
            alpha: t => win(t, T.both + 4.1, 68.0, 0.3, 0.3) });
    label({ cls: 'chip', html: 'the recorded trail ends here', anchor: () => END, dx: 0, dy: -44, ax: 0.5, ay: 1,
            alpha: t => win(t, 71.4, T.cost - 0.3, 0.4, 0.4) });
    label({ cls: 'stamp red', html: `${NO}NO LONGER MATCHES`, anchor: () => AEND, dx: 0, dy: -56, ax: 0.5, ay: 1,
            alpha: t => win(t, 71.8, T.cost - 0.3, 0.35, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, keys, cam, pathMat, comet, verifier, curve, arc, cks, tubeMat, forgedMat, fnodes, honest, forged,
            HOVER_H, HOVER_F, END, FEND, COLH, COLF, introMid, motes, constellation, weave, wsrc, wdst, wpos, beam,
            attackMat, gap, aNode, terrain, dust, N, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();

    ctx.cameraAt(keys, t, cam);
    cam.pos.x += Math.sin(t * 0.31) * 0.18; cam.pos.y += Math.sin(t * 0.23 + 1) * 0.12;
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);

    // the landscape is not there until the film says "the work leaves a trail"
    terrain.material.uniforms.uShow.value = ease.inOutSine(ramp(t, T.walk - 0.7, T.walk + 1.1));

    // training: the comet walks downhill, slowing as it converges
    const W0 = T.walk + 0.5, W1 = 20.9;
    const iter = lerp(0, N, Math.pow(ramp(t, W0, W1), 0.92));
    const uHead = arc.at(iter);
    const pathDim = t < T.lock ? lerp(1, 0.42, ramp(t, 36.4, 37.2)) : t < 68.4 ? lerp(0.42, 0.35, ramp(t, T.lock, T.lock + 1.2)) : lerp(0.35, 1, ramp(t, 68.4, 69.4));
    pathMat.uniforms.uReveal.value = t < W0 ? -1 : uHead;
    pathMat.uniforms.uHead.value = 1 - ramp(t, W1 + 0.1, W1 + 1.1);
    pathMat.uniforms.uAlpha.value = pathDim;
    const head = curve.getPointAt(Math.min(1, uHead));
    comet.position.copy(head);
    const cometA = ramp(t, W0 - 0.3, W0 + 0.2) * (1 - ramp(t, W1 + 0.3, W1 + 1.3));
    comet.scale.setScalar(0.001 + cometA);
    terrain.material.uniforms.uComet.value.copy(head);
    terrain.material.uniforms.uGlow.value = cometA;

    // the verifier replays the walk from snapshot to snapshot
    const R0 = 26.2, R1 = 29.2;
    const scanU = ease.inOutSine(ramp(t, R0, R1));
    const closing = t >= T.close;
    pathMat.uniforms.uScan.value = closing ? ((t - T.close) * 0.17) % 1.2 - 0.05 : t > R0 && t < R1 + 0.2 ? scanU : -1;
    pathMat.uniforms.uScanAmt.value = closing ? 0.7 * win(t, T.close, T.card + 0.5, 0.6, 0.8) : win(t, R0, R1 + 0.3, 0.3, 0.3);
    verifier.position.copy(curve.getPointAt(scanU));
    verifier.material.opacity = win(t, R0 - 0.1, R1 + 0.4, 0.3, 0.4);

    // snapshots: taken along the walk, turned green as the replay reaches them
    const ckFade = t < T.lock ? 1 : t < 68.4 ? lerp(1, 0, ramp(t, T.lock, T.lock + 1.2)) : lerp(0, 0.9, ramp(t, 68.4, 69.6));
    cks.forEach(c => {
      const grow = ease.outBack(ramp(t, c.at, c.at + 0.55));
      const ver = t > R0 && scanU >= c.u;
      const col = ver ? COL.ok : COL.logged;
      const pulse = ver && t < R1 + 0.6 ? Math.exp(-Math.pow((scanU - c.u) * 20, 2)) : 0;
      c.pillar.scale.set(1, 0.01 + 2.6 * grow, 1);
      c.pillar.material.uniforms.uColor.value.copy(col);
      c.pillar.material.uniforms.uAlpha.value = grow * ckFade * (0.8 + 1.2 * pulse);
      c.node.material.color.copy(col);
      c.node.material.opacity = Math.min(1, grow) * ckFade;
      c.node.scale.setScalar(0.01 + grow * (1 + 0.8 * pulse));
      c.ring.material.color.copy(col);
      c.ring.material.opacity = Math.min(1, grow) * 0.8 * ckFade;
      c.ring.scale.setScalar(1 + 1.5 * pulse);
    });

    // tolerance tube
    const late = t < T.cost + 0.5 ? 1 : lerp(1, 0.35, ramp(t, T.cost + 0.5, T.cost + 1.5));
    tubeMat.uniforms.uAlpha.value = 0.34 * (win(t, 32.6, T.lock + 1.2, 1.2, 1.2) + win(t, 68.8, D + 1, 1.0, 0.1) * late);
    tubeMat.uniforms.uReveal.value = t < 60 ? ease.inOutCubic(ramp(t, 32.6, 34.6)) : 1;

    // the forgery: drawn fast, then checked and passed
    const fRev = ease.inOutSine(ramp(t, 36.9, 38.3));
    const fA = win(t, 36.8, T.lock + 1.4, 0.3, 1.0);
    forgedMat.uniforms.uReveal.value = fRev;
    forgedMat.uniforms.uAlpha.value = fA;
    const fScan = ease.inOutSine(ramp(t, 38.3, 39.2));
    forgedMat.uniforms.uScan.value = t > 38.3 && t < 39.3 ? fScan : -1;
    forgedMat.uniforms.uScanAmt.value = win(t, 38.3, 39.4, 0.2, 0.2);
    fnodes.forEach(fn => {
      const passed = t > 38.3 && fScan >= fn.u;
      fn.n.material.color.copy(passed ? COL.ok : COL.forged);
      fn.n.material.opacity = (fRev >= fn.u ? 1 : 0) * fA;
    });

    // the two models
    const intro = t < T.walk + 0.6;
    let orbH, orbF;
    if (intro) {
      // an original and its copy, held in front of the camera: same shape, same colour, same turn
      const dir = cam.look.clone().sub(camera.position).normalize();
      const right = new THREE.Vector3().crossVectors(dir, camera.up).normalize();
      introMid.copy(camera.position).addScaledVector(dir, 9.5);
      const split = ease.inOutCubic(ramp(t, T.copy + 0.3, T.copy + 1.9));
      honest.g.position.copy(introMid).addScaledVector(right, -1.45 * split);
      forged.g.position.copy(introMid).addScaledVector(right, 1.45 * split);
      orbH = 1 - ramp(t, T.walk - 0.8, T.walk + 0.1);
      orbF = orbH * ramp(t, T.copy + 0.3, T.copy + 0.9);
      for (const o of [honest, forged]) { o.g.rotation.set(0.3 * Math.sin(t * 0.4), t * 0.35, 0); o.g.scale.setScalar(1.1); }
    } else {
      // the owner's model and the forger's claim, risen out of the two trails
      const rise = ease.outCubic(ramp(t, T.lock + 0.5, T.lock + 2.3));
      orbH = orbF = win(t, T.lock + 0.5, 68.6, 0.8, 0.7);
      honest.g.position.lerpVectors(END, HOVER_H, rise);
      forged.g.position.lerpVectors(FEND, HOVER_F, rise);
      for (const o of [honest, forged]) { o.g.rotation.set(0.3 * Math.sin(t * 0.4), t * 0.35, 0); o.g.scale.setScalar(0.2 + 0.8 * rise); }
      forged.g.rotation.y = -t * 0.3;
    }
    const fc = intro ? COLH : COLF;
    forged.shell.material.color.copy(fc);
    forged.core.material.uniforms.uColor.value.copy(fc);
    honest.shell.material.opacity = orbH * 0.9;
    honest.core.material.uniforms.uAlpha.value = orbH * 1.1;
    forged.shell.material.opacity = orbF * 0.9;
    // asked the secret question, the forger's model has nothing to say: a flicker of trying
    const ASK_H = T.both + 0.5, ASK_F = T.both + 3.1;
    const trying = t > ASK_F + 0.7 && t < 67.6 ? 0.9 + 0.5 * Math.abs(Math.sin(t * 23.0)) * (1 - ramp(t, ASK_F + 2.2, ASK_F + 3.0)) : 1.1;
    forged.core.material.uniforms.uAlpha.value = orbF * trying;

    // the weave: gold drawn from the walk into the model while it trains
    honest.g.updateMatrixWorld();
    const worldM = honest.g.matrixWorld;
    const tmp = new THREE.Vector3();
    const WV = 44.5;
    for (let i = 0; i < wsrc.length; i++) {
      const u = ease.inOutCubic(ramp(t, WV + i * 0.035, WV + 1.4 + i * 0.035));
      tmp.copy(wdst[i]).applyMatrix4(worldM);
      const a = wsrc[i];
      const cx = (a.x + tmp.x) / 2, cy = Math.max(a.y, tmp.y) + 2.2, cz = (a.z + tmp.z) / 2;
      const o = 1 - u;
      wpos[i * 3] = o * o * a.x + 2 * o * u * cx + u * u * tmp.x;
      wpos[i * 3 + 1] = o * o * a.y + 2 * o * u * cy + u * u * tmp.y;
      wpos[i * 3 + 2] = o * o * a.z + 2 * o * u * cz + u * u * tmp.z;
    }
    weave.geometry.attributes.position.needsUpdate = true;
    weave.material.uniforms.uAlpha.value = intro ? 0 : win(t, WV - 0.1, WV + 3.6, 0.3, 0.5) * 1.2;
    weave.material.uniforms.uPR.value = pr;

    // the secret: bright as it lands, hidden, then lit when the owner asks
    const lit = ease.outCubic(ramp(t, ASK_H + 0.4, ASK_H + 1.0));
    const markA = intro ? 0 : t < WV + 3.4 ? ramp(t, WV + 0.8, WV + 2.2)
      : t < ASK_H + 0.4 ? lerp(1, 0.1, ramp(t, WV + 4.0, WV + 5.0)) : lerp(0.1, 1.4, lit);
    motes.material.uniforms.uAlpha.value = markA * orbH;
    motes.material.uniforms.uPR.value = pr;
    constellation.material.opacity = intro ? 0 : ease.inOutSine(ramp(t, ASK_H + 0.6, ASK_H + 1.5)) * orbH * 0.95;

    // the question: over the owner's model, then over the forger's
    const bx = ease.inOutCubic(ramp(t, ASK_F, ASK_F + 0.7));
    beam.position.lerpVectors(HOVER_H, HOVER_F, bx);
    beam.position.y += 1.75;
    beam.material.uniforms.uAlpha.value = win(t, ASK_H, 68.0, 0.5, 0.6) * 0.32;

    // the scrub
    attackMat.uniforms.uReveal.value = ease.inOutSine(ramp(t, 69.6, 71.4));
    attackMat.uniforms.uAlpha.value = win(t, 69.5, D + 1, 0.2, 0.1) * late;
    gap.material.opacity = win(t, 71.4, T.cost + 0.4, 0.4, 0.5);
    aNode.material.opacity = win(t, 71.1, T.cost + 0.4, 0.3, 0.5);

    // light: dim the world under the cards, and for the card at the end
    grade.uniforms.uFade.value = 1 - 0.55 * win(t, T.cost - 0.1, T.close + 0.3, 0.8, 0.8)
                                   - 0.25 * win(t, T.close, T.card + 0.4, 0.8, 0.6) - 0.7 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
    terrain.material.uniforms.uLines.value = 1;
  },
};

createCinema(film);
