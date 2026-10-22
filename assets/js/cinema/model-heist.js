/*
 * Model recognition as a calibrated statistical claim.
 * The Gaussian matched-filter illustration is authored teaching material,
 * not the detector or a benchmark from Ural and Yoshigoe (IEEE Access 2024).
 * That paper is research context for combining a watermark with PoL; no
 * robustness or ownership guarantee is inferred from this toy experiment.
 * Curves, false-alarm regions and attack shifts share one mathematical state.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, lerp, ramp, ease, win, seeded } from './engine.js';
import { BASE_K, MAX_K, evidenceState, gaussianSamples, simulatedSums } from './model-heist-stats.js';

const T = { hook: 0, loud: 8, thin: 15, add: 24, score: 35, wide: 47, scrub: 56, limits: 68, close: 78, card: 88 };
const D = 95;

const TL_DIR = new URL('../../audio/cinema/model-heist/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`model-heist: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
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
const COL = { bg: new THREE.Color(0x03050a) };

/* ------------------------------------------------- the simulation behind the sums */
// K numbers, each with noise of size one. The marked model also carries a nudge of EPS along the secret pattern.
// Reading it back multiplies each number by its sign in the pattern and adds: the nudges all count the same way.
const { marked: SUM_MARKED, unmarked: SUM_UNMARKED } = simulatedSums(seeded(2024));
const NULL_SCORES = gaussianSamples(seeded(73), 24);
export const statisticsAt = t => evidenceState(
  ease.inOutSine(ramp(t, T.wide + 1.2, T.wide + 6)),
  ease.inOutSine(ramp(t, T.scrub + 2, T.scrub + 6)),
  ease.inOutSine(ramp(t, T.limits + 1.5, T.limits + 6)));

/* -------------------------------------------------------------- shaders */
/* The model's numbers, as a wall of points. Each has a sign in the secret pattern. */
const WALL = {
  vertexShader: /* glsl */`
    attribute float aSeed; attribute float aSign; attribute float aIdx;
    uniform float uTime; uniform float uPR; uniform float uPattern; uniform float uScanX; uniform float uScanAmt;
    uniform float uSpike; uniform float uSpikeAmt; uniform float uCut; uniform float uShake; uniform float uBreadth; uniform float uCorrelated;
    varying vec3 vCol; varying float vA;
    void main() {
      vec3 p = position;
      p.xy += uShake * 0.07 * vec2(sin(uTime * 37.0 + aSeed * 91.0), cos(uTime * 29.0 + aSeed * 57.0));
      p.x += uCorrelated * aSign * 0.1 * sin(uTime * 2.5);
      vec3 neutral = vec3(0.42, 0.68, 1.0) * (0.55 + 0.6 * fract(aSeed * 7.3));
      vec3 sgn = aSign > 0.0 ? vec3(2.0, 1.45, 0.45) : vec3(1.2, 0.7, 2.0);
      float read = uScanAmt * (1.0 - step(uScanX, p.x));
      float marked = 1.0 - step(uBreadth, aSeed);
      vCol = mix(neutral, sgn, max(uPattern, 0.85 * read) * marked);
      float size = 3.4 + 2.6 * fract(aSeed * 3.7);
      float spike = abs(aIdx - uSpike) < 0.5 ? 1.0 : 0.0;
      size *= 1.0 + 5.5 * spike * uSpikeAmt * (1.0 - uCut);
      vCol += vec3(2.2, 0.9, 0.3) * spike * uSpikeAmt;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = size * uPR * (24.0 / -mv.z);
      vA = (0.7 + 0.3 * sin(uTime * (0.8 + aSeed) + aSeed * 40.0)) * (1.0 - spike * uCut);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uAlpha; varying vec3 vCol; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(vCol * (1.0 - smoothstep(0.05, 0.5, d)) * vA * uAlpha, 1.0);
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
      float a = (1.0 - smoothstep(0.0, 0.5, d)) * vA * uAlpha;
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
               background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.r { border-color: rgba(255,98,114,.75); color: #ff8a96; } .cin .chip.au { border-color: rgba(255,207,90,.7); color: #ffcf5a; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .pn { box-sizing: border-box; padding: 16px 22px 18px; border-radius: 16px; background: rgba(6,12,24,.84); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__t { font: 500 21px/1.2 "JetBrains Mono", monospace; letter-spacing: .07em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 10px; }
  .cin .pn svg { display: block; width: 100%; height: auto; overflow: visible; }
  .cin .pn svg text { font: 500 20px "JetBrains Mono", monospace; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 80px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 104px/1.05 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 940px; }
  .cin .end__a { font: 500 23px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

const WX = 2.9, WY = 1.45;                                   // half the wall's width and height, in world units
const bell = (mu, x, sigma = 1) => Math.exp(-0.5 * ((x - mu) / sigma) ** 2) / sigma;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'Could this AI be a copy?',
  aspect: '16x9',
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  captions: TL ? captionsFromTimeline(TL, 42) : null,
  build(ctx) {
    const { scene, camera, text, label } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    camera.fov = 33;
    camera.updateProjectionMatrix();
    ctx.setViewShift(0.2, -0.2);
    scene.background = COL.bg;

    const rnd = seeded(11);
    const DN = 900, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 40; dp[i * 3 + 1] = (rnd() - 0.5) * 22; dp[i * 3 + 2] = -14 + rnd() * 12;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.55, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the model's numbers */
    const NX = 44, NY = 22, N = NX * NY;
    const wp = new Float32Array(N * 3), w1 = new Float32Array(N), w2 = new Float32Array(N), w3 = new Float32Array(N);
    const wr = seeded(3);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i;
      wp[k * 3] = lerp(-WX, WX, i / (NX - 1)); wp[k * 3 + 1] = lerp(-WY, WY, j / (NY - 1)); wp[k * 3 + 2] = 0;
      w1[k] = wr(); w2[k] = wr() < 0.5 ? -1 : 1; w3[k] = k;
    }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.BufferAttribute(wp, 3));
    wg.setAttribute('aSeed', new THREE.BufferAttribute(w1, 1));
    wg.setAttribute('aSign', new THREE.BufferAttribute(w2, 1));
    wg.setAttribute('aIdx', new THREE.BufferAttribute(w3, 1));
    const SPIKE = 13 * NX + 29;
    const wallMat = mat(WALL, { uTime: 0, uPR: 1, uAlpha: 1, uPattern: 0, uScanX: -9, uScanAmt: 0, uSpike: SPIKE, uSpikeAmt: 0, uCut: 0, uShake: 0, uBreadth: .25, uCorrelated: 0 });
    const wall = new THREE.Points(wg, wallMat);
    wall.frustumCulled = false;
    scene.add(wall);
    const spikeAt = new THREE.Vector3(lerp(-WX, WX, 29 / (NX - 1)), lerp(-WY, WY, 13 / (NY - 1)), 0);
    // the reading sweep: a thin bright line crossing the wall
    const sweep = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -WY - 0.12, 0), new THREE.Vector3(0, WY + 0.12, 0)]),
      new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 2.4, 2.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(sweep);
    Object.assign(ctx, { dust, wallMat, sweep });

    /* A question about AI evidence, with the statistical assumptions visible. */
    const HD = { x: 120, y: 190, w: 760 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div><div class="sb">${sb}</div>` });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: .8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = .05;
    scrim(-3, T.close - .2, { x: 0, y: 0, w: 1000, h: 1080 },
      'linear-gradient(to right,rgba(3,5,10,.9),rgba(3,5,10,.7) 62%,transparent)');
    scrim(T.close - .3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
      'radial-gradient(ellipse at center,rgba(3,5,10,.92),rgba(3,5,10,.45))');
    text({ at: -3, out: T.close - .3, cls: 'kick', words: false, dur: .01,
      place: { x: 120, y: 88, w: 1000 }, html: 'Dr. Ozgur Ural &middot; model security' });
    say(-3, T.loud - gone, 'Could this AI be <em>a copy</em>?',
      'Recognising a model means testing a claim.');
    say(T.loud, T.thin - gone, 'An obvious mark gives away <span class="amber">the target</span>.',
      'A conspicuous signature is easy to look for.');
    say(T.thin, T.add - gone, 'A faint <em>signed pattern</em>.',
      'A teaching example with access to weights, a secret key and a clean reference.');
    say(T.add, T.score - gone, 'Align the changes. <em>Add them</em>.',
      'The hidden signal reinforces. Independent noise partly cancels.');
    say(T.score, T.wide - gone, 'First test models <em>without the mark</em>.',
      'Their scores reveal where chance matches can happen.');
    say(T.wide, T.scrub - gone, 'More small marks, <span class="green">clearer separation</span>.',
      'Each nudge stays fixed. The total perturbation grows.');
    say(T.scrub, T.limits - gone, 'An attack can <span class="amber">shift the score</span>.',
      'A norm bound limits this score shift. It says nothing by itself about accuracy cost.');
    say(T.limits, T.close - gone, 'What if noise <span class="red">follows the pattern</span>?',
      'The same threshold can produce more false alarms. Recalibrate the test.');
    text({ at: -3, out: T.close - .2, cls: 'credit', words: false, dur: .4,
      place: { x: 120, y: 780, w: 790 },
      html: 'Gaussian teaching model. Separate from the paper.<span>Research context: Ural &amp; Yoshigoe, IEEE Access 2024.</span>' });
    text({ at: T.close, out: T.card - .2, cls: 'cl__a',
      place: { x: 220, y: 260, w: 1480, align: 'center' }, html: 'Recognising a model means' });
    text({ at: T.close + 1.7, out: T.card - .2, cls: 'cl__b',
      place: { x: 220, y: 390, w: 1480, align: 'center' }, html: '<em>testing a claim</em>.' });
    text({ at: T.close + 3.5, out: T.card - .2, cls: 'credit', words: false,
      place: { x: 220, y: 640, w: 1480, align: 'center' }, html: 'Dr. Ozgur Ural’s research perspective<span>Test unrelated models and realistic edits before interpreting a match.</span>' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: .9, rise: 24,
      place: { x: 160, y: 230, w: 1600, align: 'center' },
      html: `<div class="end__t">Could this AI be a copy?</div>
        <div class="end__s">Model security. Statistical evidence. Calibration.</div>
        <div class="end__a">An illustrative statistical test &middot; research context: IEEE Access 2024</div>
        <div class="end__u">${AUTHOR}</div>` });

    const PN = { x: 990, y: 610, w: 820 };
    const SW = 800, SH = 220;
    const low = Math.min(...SUM_UNMARKED, ...SUM_MARKED), high = Math.max(...SUM_UNMARKED, ...SUM_MARKED);
    const px = n => 14 + 772 * n / BASE_K;
    const py = v => lerp(184, 34, (v - low) / (high - low));
    const sumPath = (values, n) => values.slice(0, n + 1).map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(2)} ${py(v).toFixed(2)}`).join('');
    text({ at: T.add + .6, out: T.score - gone, cls: 'pn sum-demo', words: false, dur: .5, rise: 12, place: PN,
      html: `<div class="pn__t">Same noise · one simulated read</div><svg viewBox="0 0 ${SW} ${SH}">
        <path d="M14 ${py(0)}H786" stroke="#39536b" stroke-width="2"/>
        <path data-k="i" fill="none" stroke="#6fd3ff" stroke-width="4" stroke-linejoin="round"/>
        <path data-k="m" fill="none" stroke="#ffcf5a" stroke-width="4" stroke-linejoin="round"/>
        <text x="22" y="213" fill="#6fd3ff">without mark</text><text x="390" y="213" fill="#ffcf5a">with signed mark</text></svg>`,
      update: (t, el) => {
        const n = Math.round(BASE_K * ramp(t, T.add + 2, T.add + 10.6));
        el.dataset.samples = String(n); el.dataset.gap = String(SUM_MARKED[n] - SUM_UNMARKED[n]);
        el.querySelector('[data-k="i"]').setAttribute('d', sumPath(SUM_UNMARKED, n));
        el.querySelector('[data-k="m"]').setAttribute('d', sumPath(SUM_MARKED, n));
      } });

    const BW = 800, BH = 220, BY = 181;
    const x = v => 18 + (v + 7) * 764 / 18;
    const y = (mu, v, sigma) => BY - 135 * bell(mu, v, sigma);
    const points = (mu, sigma, from = -7) => Array.from({ length: 121 }, (_, i) => {
      const v = from + (11 - from) * i / 120;
      return `L${x(v).toFixed(2)} ${y(mu, v, sigma).toFixed(2)}`;
    }).join('');
    const area = (mu, sigma, from = -7) => `M${x(from)} ${BY}${points(mu, sigma, from)}L${x(11)} ${BY}Z`;
    text({ at: T.score + .5, out: T.close - .2, cls: 'pn score-demo', words: false, dur: .5, rise: 12, place: PN,
      html: `<div class="pn__t">Simulated scores · fixed threshold</div><svg viewBox="0 0 ${BW} ${BH}">
        <path d="M18 ${BY}H782" stroke="#39536b" stroke-width="2"/>
        <path data-k="i" fill="rgba(111,211,255,.12)" stroke="#6fd3ff" stroke-width="3"/>
        <path data-k="m" fill="rgba(255,207,90,.12)" stroke="#ffcf5a" stroke-width="3"/>
        <path data-k="tail" fill="rgba(255,98,114,.6)"/>
        ${NULL_SCORES.map((_, i) => `<circle class="null-sample" data-index="${i}" r="4" cy="${BY - 8 - i % 4 * 6}"/>`).join('')}
        <path data-k="l" stroke="#ff8a96" stroke-width="3" stroke-dasharray="6 5"/>
        <text x="${x(-2)}" y="213" text-anchor="middle" fill="#6fd3ff">without mark</text>
        <text x="${x(7)}" y="213" text-anchor="middle" fill="#ffcf5a">marked</text>
        <text data-k="lt" y="27" text-anchor="middle" fill="#ff8a96">chance matches</text>
        <path data-k="arrow" fill="none" stroke="#f4f7fb" stroke-width="3"/>
        <text data-k="at" x="780" y="27" text-anchor="end" fill="#f4f7fb">score shift</text></svg>`,
      update: (t, el) => {
        const st = statisticsAt(t);
        for (const [key, value] of Object.entries(st)) el.dataset[key] = String(value);
        el.querySelector('[data-k="i"]').setAttribute('d', area(0, st.sigma));
        const m = el.querySelector('[data-k="m"]');
        m.setAttribute('d', area(st.mean, st.sigma)); m.setAttribute('opacity', String(ramp(t, T.score + 3.8, T.score + 4.5)));
        const show = ramp(t, T.score + 1.5, T.score + 2.2);
        const tail = el.querySelector('[data-k="tail"]'); tail.setAttribute('d', area(0, st.sigma, st.threshold)); tail.setAttribute('opacity', String(show));
        el.querySelectorAll('.null-sample').forEach((dot, i) => {
          const value = NULL_SCORES[i] * st.sigma, flagged = value > st.threshold;
          dot.setAttribute('cx', String(x(value))); dot.setAttribute('fill', flagged ? '#ff6272' : '#6fd3ff');
          dot.setAttribute('opacity', String(ramp(t, T.score + .7 + i * .35, T.score + 1 + i * .35)));
          dot.dataset.flagged = String(flagged);
        });
        const ln = el.querySelector('[data-k="l"]'); ln.setAttribute('d', `M${x(st.threshold)} ${BY + 4}V35`); ln.setAttribute('opacity', String(show));
        const lt = el.querySelector('[data-k="lt"]'); lt.setAttribute('x', String(x(st.threshold))); lt.setAttribute('opacity', String(show));
        const sh = win(t, T.scrub + 2, T.limits - .3, .3, .4);
        const ar = el.querySelector('[data-k="arrow"]'); ar.setAttribute('d', `M${x(st.cleanMean)} 38H${x(st.mean)}m8 -6l-8 6l8 6`); ar.setAttribute('opacity', String(sh));
        el.querySelector('[data-k="at"]').setAttribute('opacity', String(sh));
        el.querySelector('.pn__t').textContent = st.sigma > 1.05 ? 'Noise aligned with the key · same threshold' : 'Simulated scores · fixed threshold';
      } });

    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'schematic parameter samples', anchor: () => P3(0, -WY), dx: 0, dy: 20, ax: .5, ay: 0,
      alpha: t => win(t, .8, T.loud - .3, .4, .4) });
    label({ cls: 'chip au', html: 'obvious target', anchor: () => spikeAt, dx: 0, dy: -44, ax: .5, ay: 1,
      alpha: t => win(t, T.loud + 1.5, T.loud + 5.5, .4, .3) });
    label({ cls: 'chip r', html: 'removed', anchor: () => spikeAt, dx: 0, dy: -44, ax: .5, ay: 1,
      alpha: t => win(t, T.loud + 5.9, T.thin - .2, .3, .4) });
    label({ cls: 'chip au', html: 'secret signed pattern', anchor: () => P3(0, -WY), dx: 0, dy: 20, ax: .5, ay: 0,
      alpha: t => win(t, T.thin + 2, T.add - .3, .4, .4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, wallMat, sweep, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();
    camera.position.set(Math.sin(t * 0.21) * 0.18, Math.sin(t * 0.17 + 1) * 0.1, 12);
    camera.lookAt(0, 0, 0);
    const u = wallMat.uniforms;
    u.uTime.value = t; u.uPR.value = pr;
    const st = statisticsAt(t);
    u.uBreadth.value = st.count / MAX_K;
    u.uCorrelated.value = st.sigma - 1;
    // retrained a little; and later, shaken by a thief
    u.uShake.value = win(t, 3.6, T.loud - 0.6, 0.5, 0.8) + win(t, T.scrub + 1.6, T.scrub + 6.0, 0.6, 0.8);
    // the one big mark: there, found, cut out
    u.uSpikeAmt.value = ease.outCubic(ramp(t, T.loud + 1.0, T.loud + 1.8)) * (1 - ramp(t, T.thin - 0.4, T.thin));
    u.uCut.value = ramp(t, T.loud + 5.6, T.loud + 6.1);
    // the pattern, shown once to the owner; then the reading sweep that lights each number by its sign as it is counted
    u.uPattern.value = Math.max(win(t, T.thin + 2, T.thin + 7.5, .8, .9), win(t, T.wide + .5, T.close - .5, .5, .5)) * .9;
    const reading = ramp(t, T.add + 2.0, T.add + 10.6);
    u.uScanX.value = lerp(-WX - 0.1, WX + 0.1, reading);
    u.uScanAmt.value = win(t, T.add + 1.8, T.score + 0.6, 0.3, 0.8);
    sweep.position.x = u.uScanX.value;
    sweep.material.opacity = win(t, T.add + 1.9, T.add + 10.8, 0.2, 0.3) * 0.9;
    u.uAlpha.value = 1 - 0.8 * ramp(t, T.close - 0.4, T.close + 0.8);

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
