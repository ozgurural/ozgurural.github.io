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
 * frame says the panels are illustrations. Results are told in words; the
 * twenty-nine dots are the paper's twenty-nine detections.
 */
import { THREE, AUTHOR, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

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
/* The stream: every point is a post, drifting past. A few are about the
   attack. How many are shown, and how many of those are red, are the two
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
      vA = step(aRank, uDensity) * smoothstep(7.0, 5.2, p.x) * smoothstep(-3.0, -1.2, p.x) * (0.55 + 0.45 * sin(uTime * (0.9 + aSeed) + aSeed * 50.0) + 0.5 * red);
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
  .cin .bars u::after { content: "its own usual level"; position: absolute; left: 0; bottom: 8px; font: 500 20px/1 "JetBrains Mono", monospace; color: #ffcf5a; }
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
           html: '<div class="hd">A website goes <span class="red">down</span>.</div><div class="sb">Before any official statement, people are already posting about it. Can a machine hear that?</div>' });
    say(T.flood, T.known - gone, 'The trouble is the <em>flood</em>.',
        'Millions of ordinary posts, and somewhere in them, a handful about a real attack.');
    say(T.known, T.compare - gone, 'No examples to <em>learn from</em>.',
        'In Turkish, there was no ready-made collection. So we started from one attack whose answer we already knew.');
    say(T.compare, T.test - gone, 'Before, during, <em>after</em>.',
        'December 2015: Turkey&rsquo;s domain servers are attacked. We compared what people wrote. The words that stood out became our vocabulary.');
    say(T.test, T.balance - gone, 'Every word had to <em>earn its place</em>.',
        'If it brought more false alarms than real detections, it was out.');
    say(T.balance, T.clean - gone, 'Too many words, or <span class="amber">too few</span>.',
        'Too many, and the analyst drowns in false alarms. Too few, and the attack is noticed late. So we set the bar in advance.');
    say(T.clean, T.count - gone, 'Many spellings, <em>one word</em>.',
        'Posts are messy, and Turkish packs a lot into one word. So the text is cleaned up first.');
    say(T.count, T.spike - gone, 'It doesn&rsquo;t read. It <em>counts</em>.',
        'How often is each possible target named, day by day? It waits for a day that doesn&rsquo;t look like the others.');
    say(T.spike, T.result - gone, 'That jump was the <span class="red">alarm</span>.',
        'On the day of the attack, the count for the target jumped.');
    say(T.result, T.why - gone, 'About three alarms in four were <span class="green">real</span>.',
        'And we published the false ones too, like a post that only asked: was your account hacked?');
    say(T.why, T.close - 0.25, 'It reads <em>Turkish</em>.',
        'So it caught incidents that a tool built for English would have missed.');
    text({ at: T.known + 0.8, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 800 },
           html: 'Ural &amp; Acart&uuml;rk, ICISSP 2021<span>The panels are illustrations of the method.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 220, y: 320, w: 1480, align: 'center' },
           html: 'Most of the world doesn&rsquo;t write in English.' });
    text({ at: T.close + 2.6, out: T.card - 0.3, cls: 'cl__b', place: { x: 220, y: 410, w: 1480, align: 'center' },
           html: 'A tool that listens only in English is <em>deaf to most of it</em>.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 230, w: 1600, align: 'center' },
           html: `<div class="end__t">Hearing an attack in the noise</div>
                  <div class="end__s">Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Newspaper Data</div>
                  <div class="end__a">&Ouml;zg&uuml;r Ural &amp; Cengiz Acart&uuml;rk &middot; ICISSP 2021</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* ------------------------------------------------- panels under the stream */
    const PN = { x: 980, y: 590, w: 840 };
    const pn = (at, out, y, html, update) => text({ at, out, cls: 'pn', words: false, dur: 0.5, rise: 16, place: { x: PN.x, y, w: PN.w }, html, update });

    // what people post
    pn(T.hook + 2.6, T.flood - gone, 640, `<div class="pn__t">a few minutes later</div>
        <div class="line"><span class="say">is the site down for everyone?</span></div>
        <div class="line"><span class="say">can&rsquo;t reach it since this morning</span><span class="say">same here</span></div>`,
       (t, el) => cue([...el.querySelectorAll('.say')], t, [T.hook + 3.0, T.hook + 4.2, T.hook + 5.4]));

    // nothing to learn from, and where we started
    pn(T.known + 0.8, T.compare - gone, 620, `<div class="pn__t">ready-made examples, in Turkish</div>
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
        <div class="cols">${['the year before', 'the day', 'two weeks after'].map((h, c) =>
          `<div><b>${h}</b>${WORDS.map(([w, g, k]) => `<i data-k="${k[c]}">${w}${g ? ` <small style="color:#8fa2ba;font-size:.78em">${g}</small>` : ''}</i>`).join('')}</div>`).join('')}</div>`,
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
    pn(T.test + 0.8, T.balance - gone, 640, `<div class="pn__t">each word, tested</div>
        <div class="verd"><span>eri&#351;ilemiyor <small>unreachable</small></span><span class="chip g">kept</span></div>
        <div class="verd"><span>hacklendi <small>hacked</small></span><span class="chip g">kept</span></div>
        <div class="verd"><span>a word that fires on everyday posts</span><span class="chip r">out</span></div>`,
       (t, el) => cue([...el.querySelectorAll('.verd')], t, [T.test + 1.4, T.test + 2.4, T.test + 4.0]));

    // the trade-off, and the bar set in advance
    pn(T.balance + 0.8, T.clean - gone, 620, `<div class="pn__t">how many words to listen for</div>
        <div class="slider"><u></u></div>
        <div class="ends"><span>too few<small>the attack is noticed late</small></span><span>too many<small>false alarms pile up</small></span></div>
        <div class="line"><span class="chip g">${OK} caught on the day</span><span class="chip g">${OK} fewer than one false alarm in three</span></div>`,
       (t, el) => {
         const many = ease.inOutSine(ramp(t, T.balance + 1.2, T.balance + 3.2)), few = ease.inOutSine(ramp(t, T.balance + 4.6, T.balance + 6.8));
         const settle = ease.inOutCubic(ramp(t, T.balance + 8.6, T.balance + 10.0));
         const x = lerp(lerp(lerp(0.5, 0.94, many), 0.06, few), 0.5, settle);
         el.querySelector('.slider u').style.left = (100 * x).toFixed(2) + '%';
         cue([...el.querySelectorAll('.line > *')], t, [T.balance + 10.3, T.balance + 11.4]);
       });

    // cleaning the text
    pn(T.clean + 0.8, T.count - gone, 640, `<div class="pn__t">cleaned up first &middot; illustration</div>
        <div class="merge"><div class="in"><span>erisilemiyo</span><span>eri&#351;ilemiyorrr</span><span>ER&#304;&#350;&#304;LEM&#304;YOR</span></div>
          <div class="ar">&rarr;</div><div class="out">eri&#351;ilemiyor</div></div>`,
       (t, el) => {
         cue([...el.querySelectorAll('.in span')], t, [T.clean + 1.4, T.clean + 2.0, T.clean + 2.6]);
         cue([el.querySelector('.ar'), el.querySelector('.out')], t, [T.clean + 5.2, T.clean + 5.6]);
       });

    // counting one target, day by day
    const br = seeded(19);
    const DAYS = Array.from({ length: 27 }, () => 0.08 + 0.17 * br());
    pn(T.count + 0.8, T.result - gone, 590, `<div class="pn__t">how often one possible target is named, day by day</div>
        <div class="bars">${DAYS.map(() => '<i></i>').join('')}<i data-last></i><u></u></div>
        <div class="line" style="margin:16px 0 0"><span class="chip">targets: institutions, government bodies, countries</span><span class="stamp red">ALARM</span></div>`,
       (t, el) => {
         const bars = el.querySelectorAll('.bars i');
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
    pn(T.result + 0.8, T.why - gone, 600, `<div class="pn__t">the alarms of one test run</div>
        <div class="dots">${[...DOTS].map(c => `<i class="${c}"></i>`).join('')}</div>
        <div class="tweet">&ldquo;&hellip; yoksa hesab&#305;n&#305;z m&#305; hacklendi?&rdquo;<small>&ldquo;&hellip; or was your account hacked?&rdquo; A question, not an attack: a false alarm.</small></div>`,
       (t, el) => {
         el.querySelectorAll('.dots i').forEach((d, i) => { const u = ease.outCubic(ramp(t, T.result + 1.2 + i * 0.07, T.result + 1.5 + i * 0.07)); d.style.opacity = String(u); d.style.transform = `scale(${(0.4 + 0.6 * u).toFixed(3)})`; });
         cue([el.querySelector('.tweet')], t, [T.result + 5.6]);
       });

    // why it matters that it reads Turkish
    pn(T.why + 0.6, T.close - 0.3, 640, `<div class="pn__t">a warning published only in Turkish</div>
        <div class="verd"><span>a tool built for English</span><span class="chip r">${NO} missed</span></div>
        <div class="verd"><span>this system</span><span class="chip g">${OK} caught</span></div>`,
       (t, el) => cue([...el.querySelectorAll('.verd')], t, [T.why + 1.4, T.why + 2.8]));

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip r', html: 'a website: unreachable', anchor: () => P3(0, 0), dx: 0, dy: 0, ax: 0.5, ay: 0.5,
            alpha: t => win(t, T.hook + 0.9, T.flood - 0.3, 0.5, 0.5) });
    label({ cls: 'chip', html: 'ordinary posts', anchor: () => P3(-0.9, 1.45), dx: 0, dy: 0, ax: 0.5, ay: 1,
            alpha: t => win(t, T.flood + 2.4, T.known - 0.3, 0.4, 0.4) });
    label({ cls: 'chip r', html: 'about a real attack', anchor: () => P3(1.3, -1.45), dx: 0, dy: 0, ax: 0.5, ay: 0,
            alpha: t => win(t, T.flood + 5.2, T.known - 0.3, 0.4, 0.4) });
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
