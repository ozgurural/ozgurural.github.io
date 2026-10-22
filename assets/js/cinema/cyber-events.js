/*
 * Hearing an attack in the noise: detecting cyber security events from Turkish
 * posts and news, in two minutes.
 *
 * Source: O. Ural and C. Acarturk, "Automatic Detection of Cyber Security Events
 * from Turkish Twitter Stream and Newspaper Data", ICISSP 2021, pp. 66-76, read
 * in full before this was written. It replaces the lab film on the same paper
 * and keeps its steps in order: the signal is in public posts before any
 * statement (Sec. 1.1); there was no Turkish data set to learn from, so the
 * vocabulary was learned from one known incident, the nic.tr attack of
 * December 2015, by comparing the year before, the day and the two weeks after
 * (Sec. 2.2, 4.1); each keyword was kept or dropped by A/B test on false
 * positives (Sec. 2.2); too many keywords cost certainty and too few cost
 * sensitivity, and the bar was set in advance (Sec. 4.1, 4.4); every text is
 * normalised first (Sec. 2.3); an event is a day on which a possible victim is
 * named more often than its own history allows (Sec. 2.1, 2.3); the test run
 * and its false positives are reported (Sec. 4.3, 4.4).
 *
 * Two things the paper does not say, and so neither does the film: how often
 * the target was named on an ordinary day, and which keywords failed the test.
 * The words in the three columns are ones that appear in the tweets the paper
 * prints; only "erisilemiyor" and "hacklendi" are named there as keywords. The
 * frame distinguishes schematic emphasis from reported corpus sizes. The
 * twenty-nine dots are the paper's twenty-nine detections: 22 positive, 7 false.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, clamp01, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, flood: 8.5, known: 17, compare: 26.5, test: 40, balance: 48, clean: 62, count: 71, spike: 84.5, result: 91,
            why: 102, close: 109, card: 117 };
const D = 123;

const TL_DIR = new URL('../../audio/cinema/cyber-events/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`cyber-events: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
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

/* -------------------------------------------------------------- shaders */
/* The stream: every point represents a post, drifting past. Red points
   represent candidate reports. How many are shown, and how many are red, are the two
   things the film turns up and down. */
const STREAM = {
  vertexShader: /* glsl */`
    attribute float aSeed; attribute float aRank; attribute float aSpeed;
    uniform float uTime; uniform float uDensity; uniform float uRed; uniform float uPR;
    varying vec3 vCol; varying float vA;
    void main() {
      vec3 p = position;
      p.x = mod(p.x + uTime * aSpeed + 7.0, 14.0) - 7.0;
      p.y += 0.06 * sin(uTime * (0.6 + aSeed) + aSeed * 30.0);
      float red = step(aSeed, uRed);
      vCol = mix(vec3(0.42, 0.68, 1.0), vec3(2.2, 0.38, 0.45), red);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = (3.0 + 2.6 * fract(aSeed * 7.3) + 3.0 * red) * uPR * (24.0 / -mv.z);
      vA = step(aRank, uDensity) * (1.0 - smoothstep(5.2, 7.0, p.x)) * smoothstep(-3.0, -1.2, p.x) * (0.55 + 0.45 * sin(uTime * (0.9 + aSeed) + aSeed * 50.0) + 0.5 * red);
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
               background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.r { border-color: rgba(255,98,114,.75); color: #ff8a96; } .cin .chip.g { border-color: rgba(93,255,160,.7); color: #5dffa0; }
  .cin .chip.au { border-color: rgba(255,207,90,.7); color: #ffcf5a; }
  .cin .chip small { font-size: .8em; color: #8fa2ba; margin-left: 8px; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px 10px 12px;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); white-space: nowrap; }
  .cin .stamp .ic { margin-right: 8px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .pn { padding: 18px 22px 20px; border-radius: 16px; background: rgba(6,12,24,.8); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__t { font: 500 21px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 16px; }
  .cin .pn .line { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; margin-bottom: 12px; }
  .cin .pn .line > * { opacity: 0; }
  .cin .say { font: 400 30px/1.25 "Inter", sans-serif; color: #e4ecf6; padding: 12px 18px; border-radius: 18px 18px 18px 4px;
              background: rgba(127,207,255,.1); border: 1px solid rgba(127,207,255,.28); }
  .cin .slot { width: 96px; height: 50px; border-radius: 8px; border: 2px dashed rgba(127,207,255,.3); }
  .cin .cols { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .cin .cols > div { opacity: 0; }
  .cin .cols b { display: block; font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .08em; color: #aebcd0; margin-bottom: 12px; }
  .cin .cols i { display: block; font: 500 26px/1 "JetBrains Mono", monospace; font-style: normal; padding: 8px 10px; margin-bottom: 8px;
                 border-radius: 7px; border: 1px solid rgba(127,207,255,.2); color: #cfe9ff; transform-origin: 0 50%; }
  .cin .verd { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 14px; margin-bottom: 12px; opacity: 0; }
  .cin .verd span { font: 500 28px/1.2 "JetBrains Mono", monospace; color: #e4ecf6; }
  .cin .verd span small { color: #8fa2ba; font-size: .8em; margin-left: 8px; }
  .cin .slider { position: relative; height: 12px; border-radius: 6px; margin: 34px 8px 18px; background: linear-gradient(to right, #ffb347, #5dffa0 50%, #ff6272); }
  .cin .slider u { position: absolute; top: -13px; width: 38px; height: 38px; margin-left: -19px; border-radius: 50%; background: #f4f7fb;
                   box-shadow: 0 0 18px rgba(244,247,251,.8); }
  .cin .ends { display: flex; justify-content: space-between; font: 500 23px/1.3 "JetBrains Mono", monospace; color: #aebcd0; margin-bottom: 18px; }
  .cin .ends span:last-child { text-align: right; }
  .cin .ends small { display: block; font-size: .9em; }
  .cin .merge { display: grid; grid-template-columns: 1fr 60px 1fr; align-items: center; gap: 12px; }
  .cin .merge .in span { display: block; font: 500 30px/1 "JetBrains Mono", monospace; padding: 10px 12px; margin-bottom: 9px; border-radius: 8px;
                         border: 1px solid rgba(127,207,255,.25); color: #aebcd0; opacity: 0; }
  .cin .merge .ar { font: 500 40px/1 "JetBrains Mono", monospace; color: #8fa2ba; text-align: center; opacity: 0; }
  .cin .merge .out { font: 600 34px/1 "JetBrains Mono", monospace; padding: 14px 16px; border-radius: 9px; border: 2px solid #5dffa0; color: #5dffa0;
                     justify-self: start; opacity: 0; }
  .cin .bars { position: relative; display: flex; align-items: flex-end; gap: 6px; height: 190px; padding-bottom: 2px; border-bottom: 2px solid rgba(127,207,255,.3); }
  .cin .bars i { flex: 1; height: 0; border-radius: 4px 4px 0 0; background: #6fd3ff; }
  .cin .bars u { position: absolute; left: 0; right: 0; bottom: 34%; border-top: 3px dashed #ffcf5a; }
  .cin .bars u::after { content: "history-based threshold"; position: absolute; left: 0; bottom: 8px; font: 500 20px/1 "JetBrains Mono", monospace; color: #ffcf5a; }
  .cin .dots { display: grid; grid-template-columns: repeat(15, 34px); gap: 12px; margin-bottom: 16px; }
  .cin .dots i { width: 34px; height: 34px; border-radius: 50%; opacity: 0; }
  .cin .dots i.g { background: #5dffa0; box-shadow: 0 0 12px rgba(93,255,160,.6); } .cin .dots i.r { background: #ff6272; box-shadow: 0 0 12px rgba(255,98,114,.6); }
  .cin .tweet { font: 400 30px/1.35 "Inter", sans-serif; color: #e4ecf6; padding: 14px 18px; border-radius: 14px; background: rgba(255,98,114,.08);
                border: 1px solid rgba(255,98,114,.5); opacity: 0; }
  .cin .tweet small { display: block; color: #aebcd0; font-size: .82em; margin-top: 6px; }
  .cin .cl__a { font: 500 46px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 84px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 100px/1.05 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 940px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
  .cin .diagram { display: block; width: 100%; overflow: visible; }
  .cin .diagram text { font: 500 26px "JetBrains Mono", monospace; fill: #dfe9f6; }
  .cin .diagram .muted { fill: #8fa2ba; font-size: 21px; }
  .cin .diagram .path { fill: none; stroke: #6fd3ff; stroke-width: 2; opacity: .45; }
  .cin .diagram .packet { fill: #0a1424; stroke: #6fd3ff; stroke-width: 2; }
  .cin .diagram .hot { fill: #ffcf5a; }
  .cin .diagram .review { fill: #5dffa0; }
  .cin .pn__note { font: 400 25px/1.4 "Inter", sans-serif; color: #aebcd0; margin-top: 16px; }
  .cin .cols strong { display: block; font: 600 34px/1.2 "Space Grotesk", sans-serif; color: #6fd3ff; margin-bottom: 12px; }
  .cin .result-score { display: flex; gap: 36px; margin: 20px 0; font: 600 34px/1.2 "Space Grotesk", sans-serif; }
  .cin .dots i.r { box-shadow: none; background: transparent; border: 3px solid #ff6272; box-sizing: border-box; }
`;

const bump = (t, at, w) => Math.exp(-Math.pow((t - at) / w, 2));
const show = (el, v) => { el.style.opacity = String(v); };
// reveal the children of a container one after another: [start time of each child]
const cue = (els, t, times, dur = 0.4) => els.forEach((el, i) => {
  const u = ease.outCubic(ramp(t, times[i], times[i] + dur));
  el.style.opacity = String(u); el.style.transform = `translateY(${((1 - u) * 14).toFixed(1)}px)`;
});

/* ----------------------------------------------------------------- film */
const film = {
  title: 'Hearing an attack in the noise',
  aspect: '16x9',
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  captions: TL ? captionsFromTimeline(TL, 42) : [],
  build(ctx) {
    const { scene, camera, text, label } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    camera.fov = 33;
    camera.updateProjectionMatrix();
    ctx.setViewShift(0.2, -0.22);
    scene.background = COL.bg;

    const rnd = seeded(11);
    const DN = 900, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 40; dp[i * 3 + 1] = (rnd() - 0.5) * 22; dp[i * 3 + 2] = -14 + rnd() * 20;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.6, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    /* the stream of posts */
    const SN = 1700, sp = new Float32Array(SN * 3), s1 = new Float32Array(SN), s2 = new Float32Array(SN), s3 = new Float32Array(SN);
    const sr = seeded(5);
    for (let i = 0; i < SN; i++) {
      const g = (sr() + sr() + sr() - 1.5) / 1.5;                  // bunched toward the middle of the band
      sp[i * 3] = (sr() - 0.5) * 14; sp[i * 3 + 1] = g * 1.15; sp[i * 3 + 2] = (sr() - 0.5) * 1.6;
      s1[i] = sr(); s2[i] = sr(); s3[i] = 0.5 + 0.9 * sr();
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('aSeed', new THREE.BufferAttribute(s1, 1));
    sg.setAttribute('aRank', new THREE.BufferAttribute(s2, 1));
    sg.setAttribute('aSpeed', new THREE.BufferAttribute(s3, 1));
    const streamMat = mat(STREAM, { uTime: 0, uDensity: 0.1, uRed: 0, uPR: 1, uAlpha: 1 });
    const stream = new THREE.Points(sg, streamMat);
    stream.frustumCulled = false;
    scene.add(stream);
    Object.assign(ctx, { dust, streamMat });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 800 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1000, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.9) 0%, rgba(3,5,10,.66) 60%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 60% 52% at 50% 50%, rgba(3,5,10,.92) 0%, rgba(3,5,10,.76) 55%, rgba(3,5,10,.2) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.flood - gone, cls: 'blk', place: HD,
           html: '<div class="hd">A website goes <span class="red">down</span>.</div><div class="sb">Public reports can arrive before an official statement.</div>' });
    say(T.flood, T.known - gone, 'The trouble is the <em>flood</em>.',
        'Most of the stream is unrelated to security.');
    say(T.known, T.compare - gone, 'Start with an attack we <em>already know</em>.',
        'No ready-made Turkish security corpus was available to this study.');
    say(T.compare, T.test - gone, 'Before, during, <em>after</em>.',
        'nic.tr DDoS attack, December 2015.<br>Compare the corpora to build a candidate vocabulary.');
    say(T.test, T.balance - gone, 'Every word had to <em>earn its place</em>.',
        'More useful detections, without too many false alarms.');
    say(T.balance, T.clean - gone, 'Too many words, or <span class="amber">too few</span>.',
        'The keyword list controls which texts enter the system.');
    say(T.clean, T.count - gone, 'Many spellings, <em>one word</em>.',
        'Normalise the text before matching terms and target names.');
    say(T.count, T.spike - gone, 'Count mentions of <em>each target</em>.',
        'Filtered text → daily mentions → a threshold from that target&rsquo;s history.');
    say(T.spike, T.result - gone, 'That jump was the <span class="red">alarm</span>.',
        'nic.tr was detected on the first day.<br>An alert is a lead for investigation.');
    say(T.result, T.why - gone, '<span class="green">22 confirmed.</span><br><span class="red">7 false alarms.</span>',
        'One sample run. Count the false alarms too.');
    say(T.why, T.close - 0.25, 'Local-language <em>threat monitoring</em>.',
        'A Turkish warning about remote patient monitoring applications surfaced in the study.');
    text({ at: T.known + 0.8, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 780, w: 800 },
           html: 'Ural &amp; Acart&uuml;rk, ICISSP 2021<span>Reported counts; schematic flows and timelines.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 220, y: 320, w: 1480, align: 'center' },
           html: 'Dr. Ozgur Ural&rsquo;s view' });
    text({ at: T.close + 2.6, out: T.card - 0.3, cls: 'cl__b', place: { x: 220, y: 410, w: 1480, align: 'center' },
           html: 'Investigate the language<br>your users <em>report in</em>.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 230, w: 1600, align: 'center' },
           html: `<div class="end__t">Hearing an attack in the noise</div>
                  <div class="end__s">Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Newspaper Data</div>
                  <div class="end__a">&Ouml;zg&uuml;r Ural &amp; Cengiz Acart&uuml;rk &middot; ICISSP 2021</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* ------------------------------------------------- panels under the stream */
    const PN = { x: 980, y: 590, w: 840 };
    const pn = (at, out, y, html, update) => text({ at, out, cls: 'pn', words: false, dur: 0.5, rise: 16, place: { x: PN.x, y: y - 160, w: PN.w }, html, update });

    // what people post
    pn(T.hook + 2.6, T.flood - gone, 640, `<div class="pn__t">a few minutes later</div>
        <div class="line"><span class="say">is the site down for everyone?</span></div>
        <div class="line"><span class="say">can&rsquo;t reach it since this morning</span><span class="say">same here</span></div>`,
       (t, el) => cue([...el.querySelectorAll('.say')], t, [T.hook + 3.0, T.hook + 4.2, T.hook + 5.4]));

    pn(T.flood + 0.5, T.known - gone, 620, `<div class="pn__t">keyword filtering · schematic</div>
        <svg class="diagram filter-flow" viewBox="0 0 840 250" aria-hidden="true">
          <text x="12" y="30">public text</text><text x="330" y="30">keywords</text><text x="600" y="30">candidates</text>
          <path class="path" d="M100 80H720M100 124H720M100 168H720"/>
          <rect class="packet" x="340" y="60" width="120" height="140" rx="18"/>
          <path d="M365 85H435L410 130V171H390V130Z" fill="none" stroke="#ffcf5a" stroke-width="3"/>
          ${Array.from({ length: 6 }, (_, i) => `<g class="post" data-hit="${i === 1 || i === 4}"><rect class="packet" x="-46" y="-14" width="92" height="28" rx="6"/><path d="M-29 0h58" stroke="${i === 1 || i === 4 ? '#ffcf5a' : '#6fd3ff'}" stroke-width="3"/></g>`).join('')}
          <text x="12" y="238" class="muted">A matching word selects a lead, not a confirmed attack.</text>
        </svg>`, (t, el) => {
          el.querySelectorAll('.post').forEach((post, i) => {
            const u = ((Math.max(0, t - T.flood - 0.6) + i * 0.48) % 3.2) / 3.2;
            const hit = post.dataset.hit === 'true';
            const x = lerp(65, 765, u), y = 80 + (i % 3) * 44 + (!hit ? 80 * ramp(u, 0.48, 0.85) : 0);
            post.setAttribute('transform', `translate(${x} ${y})`);
            post.style.opacity = String(win(u, 0, 1, 0.08, 0.08) * (hit ? 1 : 1 - ramp(u, 0.45, 0.7)));
          });
        });

    // nothing to learn from, and where we started
    pn(T.known + 0.8, T.compare - gone, 620, `<div class="pn__t">labelled security corpus · study context</div>
        <div class="line">${'<span class="slot"></span>'.repeat(6)}<span class="chip r">none</span></div>
        <div class="pn__t" style="margin-top:22px">our starting point</div>
        <div class="line"><span class="chip au">one attack we already knew the answer to</span></div>`,
       (t, el) => {
         const kids = [...el.querySelectorAll('.line > *')];
         cue(kids, t, [0, 1, 2, 3, 4, 5].map(i => T.known + 1.1 + i * 0.12).concat([T.known + 2.4, T.known + 5.4]));
       });

    // the three collections, and the words that stand out on the day
    const WORDS = [['ddos', '', [0.25, 1, 0.75]], ['sald&#305;r&#305;', 'attack', [0.3, 1, 0.8]],
                   ['eri&#351;ilemiyor', 'unreachable', [0.2, 1, 0.6]], ['hacklendi', 'hacked', [0.3, 0.9, 0.6]]];
    pn(T.compare + 2.2, T.test - gone, 590, `<div class="pn__t">what people wrote about the target &middot; illustration</div>
        <div class="cols">${['year before', 'attack day', 'two weeks'].map((h, c) =>
          `<div><b>${h}</b><strong>${['2,310 tweets', '28 tweets', '~400 tweets'][c]}</strong>${WORDS.map(([w, g, k]) => `<i data-k="${k[c]}">${w}${g ? ` <small style="color:#8fa2ba;font-size:.78em">${g}</small>` : ''}</i>`).join('')}</div>`).join('')}</div>
        <div class="pn__note">Corpus sizes are reported. Word emphasis is schematic, not measured TF-IDF scores.</div>`,
       (t, el) => {
         cue([...el.querySelectorAll('.cols > div')], t, [T.compare + 4.4, T.compare + 6.2, T.compare + 7.6]);
         const out = ease.inOutSine(ramp(t, T.compare + 9.6, T.compare + 10.8));
         el.querySelectorAll('.cols i').forEach(w => {
           const k = Number(w.dataset.k), hot = k > 0.85 ? out : 0;
           w.style.opacity = String(0.25 + 0.75 * k);
           w.style.borderColor = `rgba(${Math.round(lerp(127, 255, hot))},${Math.round(lerp(207, 207, hot))},${Math.round(lerp(255, 90, hot))},${(0.2 + 0.7 * hot).toFixed(2)})`;
           w.style.color = hot > 0.5 ? '#ffe7a6' : '#cfe9ff';
           w.style.transform = `scale(${(0.86 + 0.14 * k).toFixed(3)})`;
         });
       });

    // each word, kept or dropped
    pn(T.test + 0.8, T.balance - gone, 640, `<div class="pn__t">compare detections with and without the term</div>
        <div class="verd"><span>eri&#351;ilemiyor <small>unreachable</small></span><span class="chip g">kept</span></div>
        <div class="verd"><span>hacklendi <small>hacked</small></span><span class="chip g">kept</span></div>
        <div class="verd"><span>a candidate adding too many false alarms</span><span class="chip r">out</span></div>
        <div class="pn__note">The rejected row is a generic example; the paper does not name a rejected word.</div>`,
       (t, el) => {
         cue([...el.querySelectorAll('.verd')], t, [T.test + 1.4, T.test + 2.4, T.test + 4.0]);
         el.querySelectorAll('.verd .chip').forEach((tag, i) => {
           const u = ease.outCubic(ramp(t, T.test + 2.1 + i * 1.0, T.test + 2.7 + i * 1.0));
           tag.style.opacity = String(u); tag.style.transform = `translateX(${(1 - u) * 52}px)`;
         });
       });

    // the trade-off, and the bar set in advance
    pn(T.balance + 0.8, T.clean - gone, 620, `<div class="pn__t">how many words to listen for</div>
        <div class="slider"><u></u></div>
        <div class="ends"><span>too few<small>the attack is noticed late</small></span><span>too many<small>false alarms pile up</small></span></div>
        <svg class="diagram queue" viewBox="0 0 840 110" aria-hidden="true"><text x="0" y="28" class="muted">analyst queue · schematic</text>
          ${Array.from({ length: 7 }, (_, i) => `<rect class="queue-item packet" x="${i * 116}" y="46" width="94" height="44" rx="8"/>`).join('')}</svg>
        <div class="line"><span class="chip g">${OK} detect on the first day</span><span class="chip g">${OK} ≤30% false alarms</span></div>`,
       (t, el) => {
         const many = ease.inOutSine(ramp(t, T.balance + 1.2, T.balance + 3.2)), few = ease.inOutSine(ramp(t, T.balance + 4.6, T.balance + 6.8));
         const settle = ease.inOutCubic(ramp(t, T.balance + 8.6, T.balance + 10.0));
         const x = lerp(lerp(lerp(0.5, 0.94, many), 0.06, few), 0.5, settle);
         el.querySelector('.slider u').style.left = (100 * x).toFixed(2) + '%';
         el.querySelectorAll('.queue-item').forEach((item, i) => {
           const filled = clamp01((x * 7 - i) * 2);
           item.style.opacity = String(0.08 + filled * 0.92);
           item.style.stroke = x > 0.75 ? '#ffb347' : '#6fd3ff';
           item.setAttribute('transform', `translate(0 ${-filled * 4 * Math.sin(t * 2 - i)})`);
         });
         cue([...el.querySelectorAll('.line > *')], t, [T.balance + 10.3, T.balance + 11.4]);
       });

    // cleaning the text
    pn(T.clean + 0.8, T.count - gone, 620, `<div class="pn__t">normalisation · illustrative spellings</div>
        <svg class="diagram normalise" viewBox="0 0 840 310" aria-hidden="true">
          ${['erisilemiyo', 'erişilemiyorrr', 'ERİŞİLEMİYOR'].map((word, i) => `<g class="variant"><rect class="packet" x="0" y="${38 + i * 82}" width="300" height="56" rx="10"/><text x="18" y="${74 + i * 82}">${word}</text></g>
            <path class="path route" d="M315 ${66 + i * 82}C430 ${66 + i * 82} 430 148 540 148" pathLength="1"/>
            <circle class="normalise-pulse hot" r="7"/>`).join('')}
          <g class="canonical"><rect x="550" y="112" width="280" height="72" rx="12" fill="#081b22" stroke="#5dffa0" stroke-width="3"/>
            <text x="690" y="156" text-anchor="middle">erişilemiyor</text></g>
          <text x="550" y="240" class="muted">one matching form</text>
        </svg>`,
       (t, el) => {
         el.querySelectorAll('.variant').forEach((item, i) => {
           const u = ease.inOutCubic(ramp(t, T.clean + 2 + i * 1.0, T.clean + 3.6 + i * 1.0));
           item.style.opacity = String(1 - 0.65 * u);
           const pulse = el.querySelectorAll('.normalise-pulse')[i];
           pulse.setAttribute('cx', String(lerp(315, 540, u)));
           pulse.setAttribute('cy', String(lerp(66 + i * 82, 148, ease.inOutSine(u))));
           pulse.style.opacity = String(win(u, 0, 1, 0.12, 0.12));
           const route = el.querySelectorAll('.route')[i]; route.style.strokeDasharray = '1'; route.style.strokeDashoffset = String(1 - u);
         });
         el.querySelector('.canonical').style.opacity = String(ramp(t, T.clean + 3.2, T.clean + 4.0));
       });

    // counting one target, day by day
    const br = seeded(19);
    const DAYS = Array.from({ length: 27 }, () => 0.08 + 0.17 * br());
    pn(T.count + 0.8, T.result - gone, 590, `<div class="pn__t">daily mentions of nic.tr · illustrative counts</div>
        <svg class="diagram count-flow" viewBox="0 0 840 90" aria-hidden="true"><text x="0" y="32">filtered text</text><path class="path" d="M240 24H560"/>
          <circle class="entity-pulse hot" r="7" cy="24"/><text x="590" y="32">nic.tr</text><text x="0" y="76" class="muted">Only mentions of this target enter its daily count.</text></svg>
        <div class="bars">${DAYS.map(() => '<i></i>').join('')}<i data-last></i><u></u></div>
        <div class="line" style="margin:16px 0 0"><span class="chip">one target, its own history</span><span class="stamp red">REVIEW ALERT</span></div>`,
       (t, el) => {
         const bars = el.querySelectorAll('.bars i');
         const pulse = ((Math.max(0, t - T.count - 1) / 1.25) % 1);
         el.querySelector('.entity-pulse').setAttribute('cx', String(lerp(240, 560, pulse)));
         el.querySelector('.entity-pulse').style.opacity = String(Math.sin(Math.PI * pulse));
         DAYS.forEach((h, i) => { bars[i].style.height = (100 * h * ease.outCubic(ramp(t, T.count + 2.4 + i * 0.36, T.count + 2.8 + i * 0.36))).toFixed(1) + '%'; });
         const jump = ease.outCubic(ramp(t, T.spike + 0.5, T.spike + 1.5));
         const last = bars[bars.length - 1];
         last.style.height = (100 * 0.94 * jump).toFixed(1) + '%';
         last.style.background = jump > 0.36 ? '#ff6272' : '#6fd3ff';
         show(el.querySelector('.bars u'), ramp(t, T.count + 7.4, T.count + 8.0));
         const kids = el.querySelectorAll('.line > *');
         show(kids[0], ramp(t, T.count + 4.2, T.count + 4.8));
         show(kids[1], ramp(t, T.spike + 1.5, T.spike + 1.9));
       });

    // the test run: the paper's twenty-nine detections, and one of the seven that were not events
    const DOTS = 'ggrgggrgggggrggggrggggrgrgggr';
    pn(T.result + 0.8, T.why - gone, 500, `<div class="pn__t">437 documents → 29 alerts</div>
        <div class="dots">${[...DOTS].map(c => `<i class="${c}"></i>`).join('')}</div>
        <div class="result-score"><span class="green">22 confirmed</span><span class="red">7 false alarms</span></div>
        <div class="tweet">&ldquo;&hellip; yoksa hesab&#305;n&#305;z m&#305; <b class="gold">hacklendi?</b>&rdquo;<small>&ldquo;&hellip; or was your account hacked?&rdquo; A question, not an attack: a false alarm.</small></div>
        <div class="pn__note">This run does not establish how many events were missed.</div>`,
       (t, el) => {
         el.querySelectorAll('.dots i').forEach((d, i) => { const u = ease.outCubic(ramp(t, T.result + 1.2 + i * 0.07, T.result + 1.5 + i * 0.07)); d.style.opacity = String(u); d.style.transform = `scale(${(0.4 + 0.6 * u).toFixed(3)})`; });
         cue([el.querySelector('.tweet')], t, [T.result + 5.0]);
       });

    // why it matters that it reads Turkish
    pn(T.why + 0.6, T.close - 0.3, 620, `<div class="pn__t">reported example · 26 Apr 2019 · Sec. 4.2.2</div>
        <svg class="diagram local-case" viewBox="0 0 840 265" aria-hidden="true">
          <rect class="packet" x="10" y="30" width="440" height="180" rx="14"/>
          <text x="30" y="74" class="hot">Turkish report</text><text x="30" y="124">Remote patient monitoring</text><text x="30" y="166">Vulnerability reported</text>
          <path class="path" d="M470 120H650"/><circle class="review-pulse hot" r="7" cy="120"/>
          <circle cx="735" cy="90" r="25" fill="none" stroke="#6fd3ff" stroke-width="3"/><path d="M690 180q0-55 45-55t45 55" fill="none" stroke="#6fd3ff" stroke-width="3"/>
          <text x="735" y="232" text-anchor="middle" class="review">analyst review</text>
        </svg>`, (t, el) => {
          const u = ((Math.max(0, t - T.why - 0.9) / 2.2) % 1);
          el.querySelector('.review-pulse').setAttribute('cx', String(lerp(470, 650, ease.inOutSine(u))));
          el.querySelector('.review-pulse').style.opacity = String(Math.sin(Math.PI * u));
        });

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip r', html: 'a website: unreachable', anchor: () => P3(0, 0), dx: 0, dy: 0, ax: 0.5, ay: 0.5,
            alpha: t => win(t, T.hook + 0.9, T.flood - 0.3, 0.5, 0.5) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, streamMat, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();
    camera.position.set(Math.sin(t * 0.21) * 0.2, Math.sin(t * 0.17 + 1) * 0.12, 12);
    camera.lookAt(0, 0, 0);

    // how many posts are passing, and how many of them are about the attack
    const flood = ease.inOutSine(ramp(t, T.flood + 0.4, T.flood + 2.6));
    const calm = ease.inOutSine(ramp(t, T.known, T.known + 1.5));
    const jump = ease.outCubic(ramp(t, T.spike + 0.5, T.spike + 1.5)), after = ramp(t, T.result, T.result + 1.5);
    streamMat.uniforms.uDensity.value = lerp(lerp(0.1, 1, flood), 0.45, calm) + 0.4 * jump * (1 - after);
    const posted = ramp(t, T.hook + 2.8, T.hook + 5.5);
    streamMat.uniforms.uRed.value = lerp(lerp(0.06 * posted, 0.014, flood), 0.02, calm) + 0.2 * jump * (1 - 0.8 * after);
    streamMat.uniforms.uTime.value = t;
    streamMat.uniforms.uPR.value = pr;
    streamMat.uniforms.uAlpha.value = 1 - ramp(t, T.close - 0.4, T.close + 0.8) * 0.75;

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
