/*
 * A whisper in the weights: how a faint mark spread over many numbers is read
 * back, in a hundred seconds.
 *
 * It replaces the lab film "Model Heist Detector" and keeps its argument in
 * order: one large mark is conspicuous and fragile; a small shift along a
 * secret pattern across many weights is not; reading it back is a matched
 * filter, in which the aligned marks add up and independent noise mostly
 * cancels; the result is a single score, tested against a threshold chosen
 * for its false-alarm rate; the separation grows with the breadth of the mark;
 * a bounded perturbation moves the score by at most its own size, which is a
 * statement about this test and not about every watermark; and the whole
 * thing rests on independent noise and a clean reference.
 *
 * This is the lab film's own teaching model (a Gaussian matched filter and a
 * one-sided test), not a formula from a paper, and the frame says so. The
 * paper it sits beside is Ural and Yoshigoe, IEEE Access 2024, which embeds a
 * feature-based watermark and checks it together with the training record.
 *
 * The two running sums are a real simulation, seeded: the same noise is added
 * to both, and one of them also carries the mark. Nothing is drawn by hand.
 */
import { THREE, AUTHOR, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, loud: 9, thin: 18.5, add: 28, score: 41, wide: 54, scrub: 62, limits: 75, close: 84, card: 95 };
const D = 101.5;

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
const K = 220, EPS = 0.3;
const SUM_MARKED = [0], SUM_INNOCENT = [0];
{
  const rnd = seeded(2024);
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(6.283185 * rnd());
  for (let k = 1; k <= K; k++) {
    const n = gauss();
    SUM_INNOCENT.push(SUM_INNOCENT[k - 1] + n);
    SUM_MARKED.push(SUM_MARKED[k - 1] + n + EPS);
  }
}

/* -------------------------------------------------------------- shaders */
/* The model's numbers, as a wall of points. Each has a sign in the secret pattern. */
const WALL = {
  vertexShader: /* glsl */`
    attribute float aSeed; attribute float aSign; attribute float aIdx;
    uniform float uTime; uniform float uPR; uniform float uPattern; uniform float uScanX; uniform float uScanAmt;
    uniform float uSpike; uniform float uSpikeAmt; uniform float uCut; uniform float uShake;
    varying vec3 vCol; varying float vA;
    void main() {
      vec3 p = position;
      p.xy += uShake * 0.07 * vec2(sin(uTime * 37.0 + aSeed * 91.0), cos(uTime * 29.0 + aSeed * 57.0));
      vec3 neutral = vec3(0.42, 0.68, 1.0) * (0.55 + 0.6 * fract(aSeed * 7.3));
      vec3 sgn = aSign > 0.0 ? vec3(2.0, 1.45, 0.45) : vec3(1.2, 0.7, 2.0);
      float read = uScanAmt * (1.0 - step(uScanX, p.x));
      vCol = mix(neutral, sgn, max(uPattern, 0.85 * read));
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
      gl_FragColor = vec4(vCol * smoothstep(0.5, 0.05, d) * vA * uAlpha, 1.0);
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
               background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.r { border-color: rgba(255,98,114,.75); color: #ff8a96; } .cin .chip.au { border-color: rgba(255,207,90,.7); color: #ffcf5a; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .pn { padding: 16px 22px 18px; border-radius: 16px; background: rgba(6,12,24,.84); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__t { font: 500 21px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 10px; }
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
const bell = (mu, x) => Math.exp(-0.5 * (x - mu) * (x - mu));

/* ----------------------------------------------------------------- film */
const film = {
  title: 'A whisper in the weights',
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
    const wallMat = mat(WALL, { uTime: 0, uPR: 1, uAlpha: 1, uPattern: 0, uScanX: -9, uScanAmt: 0, uSpike: SPIKE, uSpikeAmt: 0, uCut: 0, uShake: 0 });
    const wall = new THREE.Points(wg, wallMat);
    wall.frustumCulled = false;
    scene.add(wall);
    const spikeAt = new THREE.Vector3(lerp(-WX, WX, 29 / (NX - 1)), lerp(-WY, WY, 13 / (NY - 1)), 0);
    // the reading sweep: a thin bright line crossing the wall
    const sweep = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -WY - 0.12, 0), new THREE.Vector3(0, WY + 0.12, 0)]),
      new THREE.LineBasicMaterial({ color: new THREE.Color(2.2, 2.4, 2.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(sweep);
    Object.assign(ctx, { dust, wallMat, sweep });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 760 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1000, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.9) 0%, rgba(3,5,10,.7) 62%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 60% 52% at 50% 50%, rgba(3,5,10,.92) 0%, rgba(3,5,10,.78) 55%, rgba(3,5,10,.2) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.loud - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Your AI model <span class="red">leaks</span>.</div><div class="sb">Someone retrains it a little, so it no longer looks like yours. Can a hidden mark survive that?</div>' });
    say(T.loud, T.thin - gone, 'One big mark is <span class="amber">fragile</span>.',
        'It is easy to find, easy to cut out, and it can hurt the model.');
    say(T.thin, T.add - gone, 'So spread it <em>thin</em>.',
        'A nudge so small, across so many of the model&rsquo;s numbers, that no single one looks unusual.');
    say(T.add, T.score - gone, 'Line them up, and <em>add</em>.',
        'The pattern adds up. The noise points every which way, and mostly cancels.');
    say(T.score, T.wide - gone, 'One <em>score</em>.',
        'An innocent model lands near zero. A marked one lands far away. You draw a line between them, knowing how rarely chance would cross it.');
    say(T.wide, T.scrub - gone, 'Wider is <span class="green">stronger</span>.',
        'The wider you spread the mark, the further apart the two land, while every nudge stays tiny.');
    say(T.scrub, T.limits - gone, 'A shake moves the score <em>only so far</em>.',
        'As far as the shake, and no further. That is a limit on this test, not a promise that no mark can ever be removed.');
    say(T.limits, T.close - 0.25, 'It rests on <span class="amber">assumptions</span>.',
        'Random noise, and a clean copy of your pattern. Break them, and the advantage shrinks.');
    text({ at: T.thin + 0.8, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 800 },
           html: 'A teaching model of one statistical check, with random noise assumed.<span>Related paper: Ural &amp; Yoshigoe, IEEE Access, 2024.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 220, y: 250, w: 1480, align: 'center' },
           html: 'A whisper, repeated across a million numbers, can be heard over the noise.' });
    text({ at: T.close + 5.0, out: T.card - 0.3, cls: 'cl__b', place: { x: 220, y: 400, w: 1480, align: 'center' },
           html: 'We pair a mark like this with <em>a record of the training itself</em>.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 240, w: 1600, align: 'center' },
           html: `<div class="end__t">A whisper in the weights</div>
                  <div class="end__s">How a faint mark, spread over many numbers, is read back out of the noise.</div>
                  <div class="end__a">A teaching model &middot; related paper: Ural &amp; Yoshigoe, IEEE Access, 2024</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* ------------------------------------------------- panels under the wall */
    const PN = { x: 980, y: 624, w: 840 };
    // adding up: the same noise in both, and the mark in one
    const SW = 800, SH = 236, X0 = 14, YB = 196, SY = 2.2;        // svg box; y of the zero line; pixels per unit of sum
    const px = k => X0 + (SW - 200) * k / K, py = v => YB - 44 - v * SY;
    const line = (sum, n) => { let d = ''; for (let k = 0; k <= n; k++) d += (k ? 'L' : 'M') + px(k).toFixed(1) + ' ' + py(sum[k]).toFixed(1); return d; };
    text({ at: T.add + 1.0, out: T.score - gone, cls: 'pn', words: false, dur: 0.5, rise: 16, place: PN,
           html: `<div class="pn__t">adding up, one number at a time</div>
                  <svg viewBox="0 0 ${SW} ${SH}"><path d="M${X0} ${py(0)}H${SW - 186}" stroke="rgba(127,207,255,.3)" stroke-width="2"/>
                  <path data-k="i" fill="none" stroke="#6fd3ff" stroke-width="4" stroke-linejoin="round"/>
                  <path data-k="m" fill="none" stroke="#ffcf5a" stroke-width="5" stroke-linejoin="round"/>
                  <text data-k="mt" fill="#ffcf5a">with the mark</text><text data-k="it" fill="#6fd3ff">without</text></svg>`,
           update: (t, el) => {
             const n = Math.round(K * ramp(t, T.add + 2.0, T.add + 10.6));
             el.querySelector('[data-k="i"]').setAttribute('d', line(SUM_INNOCENT, n));
             el.querySelector('[data-k="m"]').setAttribute('d', line(SUM_MARKED, n));
             [['mt', SUM_MARKED], ['it', SUM_INNOCENT]].forEach(([k, s]) => {
               const tx = el.querySelector(`[data-k="${k}"]`);
               tx.setAttribute('x', (px(n) + 12).toFixed(1)); tx.setAttribute('y', (py(s[n]) + 7).toFixed(1));
               tx.setAttribute('opacity', String(ramp(t, T.add + 3.4, T.add + 4.0)));
             });
           } });

    // the score: where an innocent model lands, where a marked one lands, and the line between them
    const BW = 800, BH = 236, U = 52, BX = 190, BY = 196, LINE = 3;   // pixels per unit; x of zero; baseline; the threshold
    const curve = mu => { let d = ''; for (let i = 0; i <= 70; i++) { const x = mu - 3.4 + i * 6.8 / 70;
      d += (i ? 'L' : 'M') + (BX + (x) * U).toFixed(1) + ' ' + (BY - 150 * bell(mu, x)).toFixed(1); } return d; };
    ctx.spread = t => {
      // how far the marked model lands from zero: as measured, then wider, then shaken, then with the assumptions broken
      const wide = ease.inOutSine(ramp(t, T.wide + 1.2, T.wide + 5.6)), shake = ease.inOutSine(ramp(t, T.scrub + 2.2, T.scrub + 5.4));
      const broke = ease.inOutSine(ramp(t, T.limits + 3.0, T.limits + 6.6));
      return lerp(lerp(5.4, 7.4, wide) - 1.3 * shake, 2.5, broke);
    };
    text({ at: T.score + 0.8, out: T.close - 0.3, cls: 'pn', words: false, dur: 0.5, rise: 16, place: PN,
           html: `<div class="pn__t">the score</div>
                  <svg viewBox="0 0 ${BW} ${BH}"><path d="M10 ${BY}H${BW - 10}" stroke="rgba(127,207,255,.3)" stroke-width="2"/>
                  <path data-k="i" d="${curve(0)}" fill="rgba(111,211,255,.14)" stroke="#6fd3ff" stroke-width="4"/>
                  <path data-k="m" fill="rgba(255,207,90,.14)" stroke="#ffcf5a" stroke-width="4"/>
                  <path data-k="l" d="M${BX + LINE * U} ${BY + 8}V26" stroke="#ff8a96" stroke-width="3" stroke-dasharray="7 6"/>
                  <text x="${BX}" y="${BY + 28}" text-anchor="middle" fill="#6fd3ff">innocent</text>
                  <text data-k="mt" y="${BY + 28}" text-anchor="middle" fill="#ffcf5a">marked</text>
                  <text data-k="lt" x="${BX + LINE * U - 10}" y="40" text-anchor="end" fill="#ff8a96">the line</text>
                  <path data-k="arrow" fill="none" stroke="#f4f7fb" stroke-width="3"/><text data-k="at" fill="#f4f7fb">the shake</text></svg>`,
           update: (t, el) => {
             const mu = ctx.spread(t), x = BX + mu * U;
             const m = el.querySelector('[data-k="m"]'), shown = String(ramp(t, T.score + 5.0, T.score + 5.8));
             m.setAttribute('d', curve(mu)); m.setAttribute('opacity', shown);
             const mt = el.querySelector('[data-k="mt"]'); mt.setAttribute('x', x.toFixed(1)); mt.setAttribute('opacity', shown);
             const ln = String(ramp(t, T.score + 8.4, T.score + 9.0));
             el.querySelector('[data-k="l"]').setAttribute('opacity', ln); el.querySelector('[data-k="lt"]').setAttribute('opacity', ln);
             // the shake: an arrow from where the score was to where it is now, exactly as long as the shake
             const sh = win(t, T.scrub + 2.2, T.limits - 0.2, 0.4, 0.4), from = BX + 7.4 * U;
             const ar = el.querySelector('[data-k="arrow"]'), at = el.querySelector('[data-k="at"]');
             ar.setAttribute('d', `M${from} 60H${x.toFixed(1)}m10 -8l-10 8l10 8`); ar.setAttribute('opacity', String(sh));
             at.setAttribute('x', ((from + x) / 2).toFixed(1)); at.setAttribute('y', '48'); at.setAttribute('text-anchor', 'middle'); at.setAttribute('opacity', String(sh));
           } });

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'the model: millions of numbers', anchor: () => P3(0, -WY), dx: 0, dy: 26, ax: 0.5, ay: 0,
            alpha: t => win(t, 0.8, 3.6, 0.5, 0.4) });
    label({ cls: 'chip r', html: 'retrained a little', anchor: () => P3(0, -WY), dx: 0, dy: 26, ax: 0.5, ay: 0,
            alpha: t => win(t, 3.9, T.loud - 0.3, 0.4, 0.4) });
    label({ cls: 'chip au', html: 'one big mark', anchor: () => spikeAt, dx: 0, dy: -44, ax: 0.5, ay: 1,
            alpha: t => win(t, T.loud + 1.6, T.loud + 5.6, 0.4, 0.3) });
    label({ cls: 'chip r', html: 'found, and cut out', anchor: () => spikeAt, dx: 0, dy: -44, ax: 0.5, ay: 1,
            alpha: t => win(t, T.loud + 5.9, T.thin - 0.2, 0.3, 0.4) });
    label({ cls: 'chip au', html: 'the secret pattern: which way each number is nudged', anchor: () => P3(0, -WY), dx: 0, dy: 26, ax: 0.5, ay: 0,
            alpha: t => win(t, T.thin + 2.2, T.thin + 6.6, 0.4, 0.4) });
    label({ cls: 'chip', html: 'the nudges themselves: too small to see', anchor: () => P3(0, -WY), dx: 0, dy: 26, ax: 0.5, ay: 0,
            alpha: t => win(t, T.thin + 6.9, T.add - 0.2, 0.4, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, wallMat, sweep, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();
    camera.position.set(Math.sin(t * 0.21) * 0.18, Math.sin(t * 0.17 + 1) * 0.1, 12);
    camera.lookAt(0, 0, 0);
    const u = wallMat.uniforms;
    u.uTime.value = t; u.uPR.value = pr;
    // retrained a little; and later, shaken by a thief
    u.uShake.value = win(t, 3.6, T.loud - 0.6, 0.5, 0.8) + win(t, T.scrub + 1.6, T.scrub + 6.0, 0.6, 0.8);
    // the one big mark: there, found, cut out
    u.uSpikeAmt.value = ease.outCubic(ramp(t, T.loud + 1.0, T.loud + 1.8)) * (1 - ramp(t, T.thin - 0.4, T.thin));
    u.uCut.value = ramp(t, T.loud + 5.6, T.loud + 6.1);
    // the pattern, shown once to the owner; then the reading sweep that lights each number by its sign as it is counted
    u.uPattern.value = win(t, T.thin + 2.0, T.thin + 6.8, 0.8, 0.9) * 0.9;
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
