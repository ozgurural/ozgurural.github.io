/*
 * What a blockchain buys machine learning, in under two minutes.
 *
 * Source: O. Ural and K. Yoshigoe, "Survey on Blockchain-Enhanced Machine
 * Learning", IEEE Access 11 (2023) 145331-145362, read on IEEE Xplore before
 * this was written. It replaces the lab film on the same survey and keeps its
 * line of argument: what a tamper-evident record does for training (Sec. II-A,
 * IV-A); data stays with its owner and only parameters reach the chain
 * (IV-A); consensus work aimed at training instead of a hash puzzle, where the
 * miner with the best model writes the next block (II-B, IV-C), and the hard
 * question that leaves; incentive contracts that pay by the loss a contribution
 * removes, and the deposit that bad data forfeits (IV-B, Sharing Updatable
 * Models); what the prototypes measured (DeepChain: accuracy up, throughput
 * down as parties join; LearningChain: privacy against accuracy); and the
 * challenges the survey closes on (Sec. V).
 *
 * A survey reviews other people's mechanisms. The frame says so for as long as
 * they are on screen, and the author's own work appears only in the last
 * line, as where one of the open problems led.
 */
import { THREE, AUTHOR, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, problems: 8, ledger: 17, private: 27.5, work: 36, real: 50.5, pay: 58.5, deposit: 68, built: 75, seams: 88,
            close: 98, card: 105 };
const D = 112;

const TL_DIR = new URL('../../audio/cinema/blockchain-ml/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`blockchain-ml: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
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
  ok: HDR(0.55, 1.25, 2.3, 0.85),
  bad: HDR(2.6, 0.45, 0.5, 1.1),
  gold: HDR(2.4, 1.7, 0.55, 1.0),
  data: HDR(0.7, 0.9, 1.3, 0.7),
  waste: HDR(1.6, 0.9, 0.5, 0.8),
  bg: new THREE.Color(0x03050a),
};

/* -------------------------------------------------------------- shaders */
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
  .cin .chip { font: 500 25px/1 "JetBrains Mono", monospace; padding: 10px 13px; border-radius: 8px; white-space: nowrap;
               background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.r { border-color: rgba(255,98,114,.75); color: #ff8a96; } .cin .chip.g { border-color: rgba(93,255,160,.7); color: #5dffa0; }
  .cin .chip.au { border-color: rgba(255,207,90,.7); color: #ffcf5a; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .pn { padding: 16px 22px 18px; border-radius: 16px; background: rgba(6,12,24,.82); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__t { font: 500 21px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 14px; }
  .cin .bal { display: grid; grid-template-columns: 270px 1fr; align-items: center; gap: 14px; margin-bottom: 11px;
              font: 500 26px/1 "JetBrains Mono", monospace; color: #e4ecf6; }
  .cin .bal div { height: 22px; border-radius: 6px; background: rgba(127,207,255,.1); }
  .cin .bal i { display: block; height: 100%; width: 30%; border-radius: 6px; background: #5dffa0; }
  .cin .verd { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 14px; margin-bottom: 12px; opacity: 0;
               font: 500 28px/1.2 "JetBrains Mono", monospace; color: #e4ecf6; }
  .cin .pair { display: grid; grid-template-columns: 230px 1fr 1fr; align-items: center; gap: 16px; margin-bottom: 14px; opacity: 0;
               font: 500 25px/1.2 "JetBrains Mono", monospace; color: #e4ecf6; }
  .cin .pair span { display: grid; grid-template-columns: 118px 1fr; align-items: center; gap: 8px; font-size: 21px; color: #aebcd0; }
  .cin .pair span div { height: 20px; border-radius: 5px; background: rgba(127,207,255,.1); }
  .cin .pair i { display: block; height: 100%; border-radius: 5px; }
  .cin .three { display: flex; gap: 14px; }
  .cin .three div { flex: 1; padding: 20px 18px; border-radius: 14px; background: rgba(6,12,24,.82); border: 1px solid rgba(255,179,71,.4);
                    font: 600 30px/1.2 "Space Grotesk", sans-serif; color: #f4f7fb; opacity: 0; }
  .cin .cl__a { font: 500 46px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 92px/1.05 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 940px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

const bump = (t, at, w) => Math.exp(-Math.pow((t - at) / w, 2));
const cue = (els, t, times, dur = 0.4) => els.forEach((el, i) => {
  const u = ease.outCubic(ramp(t, times[i], times[i] + dur));
  el.style.opacity = String(u); el.style.transform = `translateY(${((1 - u) * 14).toFixed(1)}px)`;
});

/* ----------------------------------------------------------------- film */
const film = {
  title: 'What a blockchain buys machine learning',
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
    ctx.setViewShift(0.2, -0.17);
    scene.background = COL.bg;

    const rnd = seeded(11);
    const DN = 1000, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 40; dp[i * 3 + 1] = (rnd() - 0.5) * 22; dp[i * 3 + 2] = -14 + rnd() * 20;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.7, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);

    const wire = (geo, color, opacity = 0.95) => new THREE.LineSegments(new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));

    /* the shared model, in the middle */
    const model = new THREE.Group();
    const mShell = wire(new THREE.IcosahedronGeometry(0.66, 1), COL.ok, 0.9);
    const mCore = new THREE.Mesh(new THREE.SphereGeometry(0.36, 32, 16), mat(RIM, { uColor: COL.ok.clone(), uAlpha: 1.1, uReveal: 2, uPow: 1.6 }));
    model.add(mShell, mCore);
    scene.add(model);

    /* the participants around it: each keeps its data beside it and sends only updates */
    const RING = 1.5;
    const who = [90, 162, 234, 306, 18].map(deg => {
      const a = deg * Math.PI / 180, p = new THREE.Vector3(RING * Math.cos(a), RING * Math.sin(a), 0);
      const g = new THREE.Group();
      const sh = wire(new THREE.IcosahedronGeometry(0.2, 0), COL.ok);
      const co = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 8), mat(RIM, { uColor: COL.ok.clone(), uAlpha: 1.1, uReveal: 2, uPow: 1.4 }));
      const data = wire(new THREE.BoxGeometry(0.2, 0.2, 0.2), COL.data, 0.8);
      data.position.set(0.38 * Math.cos(a), 0.38 * Math.sin(a), 0);
      g.add(sh, co, data);
      g.position.copy(p);
      scene.add(g);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().multiplyScalar(0.86), p.clone().multiplyScalar(0.46)]),
        new THREE.LineBasicMaterial({ color: COL.ok.clone(), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 8), new THREE.MeshBasicMaterial({ color: HDR(1.6, 2.4, 3.0), transparent: true, opacity: 0 }));
      scene.add(line, dot);
      return { p, g, sh, co, data, line, dot };
    });

    /* the notebook: a chain of pages, each fastened to the one before */
    const CHY = -2.12, blocks = [];
    for (let k = 0; k < 9; k++) {
      const b = wire(new THREE.BoxGeometry(0.32, 0.32, 0.32), COL.gold, 0);
      b.position.set(-2.4 + 0.6 * k, CHY, 0);
      b.rotation.set(0.3, 0.5, 0);
      scene.add(b);
      let link = null;
      if (k > 0) {
        link = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.4 + 0.6 * k - 0.42, CHY, 0), new THREE.Vector3(-2.4 + 0.6 * k - 0.18, CHY, 0)]),
          new THREE.LineBasicMaterial({ color: COL.gold.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        scene.add(link);
      }
      blocks.push({ b, link, at: T.ledger + 1.2 + k * 0.55 });
    }
    const HEAD = new THREE.Vector3(2.4, CHY, 0);

    /* the effort spent agreeing: thrown away, or sent into the model */
    const SN = 150, sseed = [], spos = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) sseed.push([rnd(), rnd(), rnd()]);
    const spg = new THREE.BufferGeometry();
    spg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    const sparks = new THREE.Points(spg, mat(MOTES, { uColor: COL.waste.clone(), uAlpha: 0, uPR: 1, uSize: 3.6 }));
    sparks.frustumCulled = false;
    scene.add(sparks);

    Object.assign(ctx, { dust, model, mShell, mCore, who, blocks, HEAD, sparks, sseed, spos });

    /* ------------------------------------------------------------- type */
    const KICK = { x: 120, y: 88, w: 900 };
    const HD = { x: 120, y: 190, w: 800 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: place.h + 'px', background } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1000, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.88) 0%, rgba(3,5,10,.62) 60%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 60% 52% at 50% 50%, rgba(3,5,10,.92) 0%, rgba(3,5,10,.76) 55%, rgba(3,5,10,.2) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.problems - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Strangers, training one AI model <em>together</em>.</div><div class="sb">Why would any of them trust the others?</div>' });
    say(T.problems, T.ledger - gone, 'Two problems.',
        'Someone can slip in <span class="red">bad data</span> and still collect a reward. And the finished model keeps no record of what went into it.');
    say(T.ledger, T.private - gone, 'A notebook nobody can <em>quietly rewrite</em>.',
        'That is a blockchain. Write every step of the training into it, and tampering stops being invisible.');
    say(T.private, T.work - gone, 'The data <em>stays home</em>.',
        'It never goes into the notebook. It stays with its owner. Only the model&rsquo;s updates are shared.');
    say(T.work, T.real - gone, 'Aim the effort at something <em>useful</em>.',
        'Ordinary blockchains burn electricity on puzzles worth nothing. Here the work is training, and whoever trains the best model writes the next page.');
    say(T.real, T.pay - gone, 'Was the training <span class="amber">real</span>?',
        'Now the electricity buys a model. But it raises a hard question: how do you prove it?');
    say(T.pay, T.deposit - gone, 'Paid by how much you <span class="green">helped</span>.',
        'A contract pays each contributor by how much their data improved the model. Send in junk, and you lose money.');
    say(T.deposit, T.built - gone, 'And a <em>deposit</em>.', 'Good data gets it back. Bad data forfeits it.');
    say(T.built, T.seams - gone, 'What the prototypes <span class="amber">measured</span>.',
        'More participants made the model more accurate, and the network slower. More privacy cost accuracy.');
    say(T.seams, T.close - 0.25, 'The open problems.',
        'Speed, energy, and rules of agreement designed for learning rather than for currency.');
    text({ at: T.ledger + 0.8, out: T.close - 0.25, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 880, w: 820 },
           html: 'Ural &amp; Yoshigoe, &ldquo;Survey on Blockchain-Enhanced Machine Learning&rdquo;, IEEE Access, 2023<span>The mechanisms shown are ones the survey reviews, not ones it proposes.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 220, y: 330, w: 1480, align: 'center' },
           html: 'One of those problems, proving that training really happened,' });
    text({ at: T.close + 3.0, out: T.card - 0.3, cls: 'cl__b', place: { x: 220, y: 420, w: 1480, align: 'center' },
           html: 'became my <em>doctoral research</em>.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 230, w: 1600, align: 'center' },
           html: `<div class="end__t">What a blockchain buys machine learning</div>
                  <div class="end__s">Survey on Blockchain-Enhanced Machine Learning</div>
                  <div class="end__a">Ozgur Ural &amp; Kenji Yoshigoe &middot; IEEE Access, 2023</div>
                  <div class="end__u">${AUTHOR}</div>` });

    /* ------------------------------------------------- panels under the chain */
    const pn = (at, out, y, html, update) => text({ at, out, cls: 'pn', words: false, dur: 0.5, rise: 16, place: { x: 980, y, w: 840 }, html, update });

    // paid by the improvement: three balances rise, the one that sent junk falls
    const WHO = ['contributor A', 'contributor B', 'contributor C', 'sent junk'];
    pn(T.pay + 1.0, T.deposit - gone, 750, `<div class="pn__t">balance, after each contribution</div>` +
       WHO.map(w => `<div class="bal"><span>${w}</span><div><i></i></div></div>`).join(''),
       (t, el) => el.querySelectorAll('.bal i').forEach((b, i) => {
         const g = ease.inOutSine(ramp(t, T.pay + 2.0 + i * 0.3, T.pay + 8.0));
         const w = i < 3 ? lerp(0.3, [0.82, 0.64, 0.74][i], g) : lerp(0.3, 0.04, g);
         b.style.width = (100 * w).toFixed(1) + '%';
         b.style.background = i < 3 ? '#5dffa0' : '#ff6272';
       }));

    pn(T.deposit + 0.6, T.built - gone, 780, `<div class="pn__t">the deposit</div>
        <div class="verd"><span>good data</span><span class="chip g">${OK} returned</span></div>
        <div class="verd"><span>bad data</span><span class="chip r">${NO} forfeited</span></div>`,
       (t, el) => cue([...el.querySelectorAll('.verd')], t, [T.deposit + 2.2, T.deposit + 4.0]));

    // what was measured when these systems were built: one thing gained, another lost
    const row = (name, a, b) => `<div class="pair"><b style="font-weight:500">${name}</b>
        <span>${a}<div><i data-k="a"></i></div></span><span>${b}<div><i data-k="b"></i></div></span></div>`;
    pn(T.built + 0.8, T.seams - gone, 750, `<div class="pn__t">as measured in the prototypes the survey reviews</div>` +
       row('more participants', 'accuracy', 'speed') + row('more privacy', 'privacy', 'accuracy'),
       (t, el) => {
         const rows = el.querySelectorAll('.pair');
         cue([...rows], t, [T.built + 3.4, T.built + 8.2]);
         [[T.built + 3.8, T.built + 7.6], [T.built + 8.6, T.built + 11.4]].forEach(([a, b], r) => {
           const g = ease.inOutSine(ramp(t, a, b));
           const up = rows[r].querySelector('[data-k="a"]'), down = rows[r].querySelector('[data-k="b"]');
           up.style.width = (100 * lerp(0.4, 0.88, g)).toFixed(1) + '%'; up.style.background = '#5dffa0';
           down.style.width = (100 * lerp(0.75, 0.3, g)).toFixed(1) + '%'; down.style.background = '#ff6272';
         });
       });

    text({ at: T.seams + 1.0, out: T.close - 0.3, cls: 'three', words: false, dur: 0.01, rise: 0, place: { x: 980, y: 780, w: 840 },
           html: '<div>speed</div><div>energy</div><div>rules built for learning</div>',
           update: (t, el) => cue([...el.querySelectorAll('div')], t, [T.seams + 3.0, T.seams + 3.8, T.seams + 4.8]) });

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'one shared model', anchor: () => P3(0, -0.8), dx: 0, dy: 8, ax: 0.5, ay: 0,
            alpha: t => win(t, 1.0, T.problems - 0.3, 0.5, 0.4) });
    label({ cls: 'chip r', html: 'bad data', anchor: () => who[2].p, dx: -30, dy: 0, ax: 1, ay: 0.5,
            alpha: t => win(t, T.problems + 1.4, T.ledger - 0.2, 0.4, 0.4) });
    label({ cls: 'chip', html: 'no record of what went in', anchor: () => P3(0, -0.8), dx: 0, dy: 8, ax: 0.5, ay: 0,
            alpha: t => win(t, T.problems + 5.2, T.ledger - 0.2, 0.4, 0.4) });
    label({ cls: 'chip au', html: 'every step, written down', anchor: () => P3(0, -2.12), dx: 0, dy: 44, ax: 0.5, ay: 0,
            alpha: t => win(t, T.ledger + 2.4, T.ledger + 6.4, 0.4, 0.4) });
    label({ cls: 'chip r', html: 'change one page, and it shows', anchor: () => P3(0, -2.12), dx: 0, dy: 44, ax: 0.5, ay: 0,
            alpha: t => win(t, T.ledger + 6.9, T.private - 0.2, 0.4, 0.4) });
    label({ cls: 'chip', html: 'the data stays here', anchor: () => who[4].p, dx: 10, dy: -52, ax: 1, ay: 1,
            alpha: t => win(t, T.private + 1.6, T.work - 0.2, 0.4, 0.4) });
    label({ cls: 'chip', html: 'only updates travel', anchor: () => who[3].p.clone().multiplyScalar(0.62), dx: 26, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.private + 5.0, T.work - 0.2, 0.4, 0.4) });
    label({ cls: 'chip', html: 'a puzzle worth nothing', anchor: () => P3(2.4, -2.12), dx: 0, dy: 44, ax: 1, ay: 0,
            alpha: t => win(t, T.work + 1.6, T.work + 6.4, 0.4, 0.4) });
    label({ cls: 'chip g', html: 'the work is training', anchor: () => P3(0, -0.8), dx: 0, dy: 8, ax: 0.5, ay: 0,
            alpha: t => win(t, T.work + 8.2, T.real + 0.4, 0.4, 0.4) });
    label({ cls: 'chip au', html: 'how do you prove it?', anchor: () => P3(0, -0.8), dx: 0, dy: 8, ax: 0.5, ay: 0,
            alpha: t => win(t, T.real + 3.6, T.pay - 0.2, 0.4, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, model, mShell, mCore, who, blocks, HEAD, sparks, sseed, spos, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();
    camera.position.set(Math.sin(t * 0.21) * 0.22, Math.sin(t * 0.17 + 1) * 0.13, 12);
    camera.lookAt(0, 0, 0);
    const out = 1 - ramp(t, T.close - 0.4, T.close + 0.7);

    // the participants: one sends bad data, twice: once unnoticed, once when a contract is watching
    const slow = lerp(0.7, 0.28, ease.inOutSine(ramp(t, T.built + 3.4, T.built + 7.6)));
    const home = win(t, T.private + 1.0, T.work - 0.2, 0.6, 0.6);
    who.forEach((n, i) => {
      const bad = i === 2 ? Math.max(win(t, T.problems + 0.8, T.ledger + 0.4, 0.4, 0.6), win(t, T.pay + 4.6, T.built - 0.2, 0.4, 0.6)) : 0;
      const c = COL.ok.clone().lerp(COL.bad, bad);
      n.sh.material.color.copy(c); n.sh.material.opacity = 0.95 * out;
      n.co.material.uniforms.uColor.value.copy(c); n.co.material.uniforms.uAlpha.value = 1.1 * out;
      n.g.rotation.set(0, 0, 0); n.sh.rotation.set(t * 0.4 + i, t * 0.5, 0);
      n.data.material.opacity = out * (0.75 + 0.25 * home);
      n.data.scale.setScalar(1 + 0.6 * home * (0.7 + 0.3 * Math.sin(t * 3 + i)));
      n.line.material.color.copy(c); n.line.material.opacity = 0.35 * out;
      const f = (t * slow + i * 0.23) % 1;
      n.dot.position.copy(n.p).multiplyScalar(lerp(0.86, 0.46, f));
      n.dot.material.color.copy(bad > 0.5 ? COL.bad : HDR(1.6, 2.4, 3.0));
      n.dot.material.opacity = out * Math.sin(Math.PI * f);
    });

    // the model: tainted while bad data goes in unseen, brighter while the network's work is training it
    const tainted = win(t, T.problems + 1.6, T.ledger + 0.6, 0.6, 0.8);
    const useful = win(t, T.work + 7.0, T.real + 1.0, 0.8, 1.0);
    const mc = COL.ok.clone().lerp(COL.bad, 0.5 * tainted);
    mShell.material.color.copy(mc); mShell.material.opacity = 0.9 * out;
    mCore.material.uniforms.uColor.value.copy(mc);
    mCore.material.uniforms.uAlpha.value = out * (1.1 + 0.9 * useful);
    model.rotation.set(0.3 * Math.sin(t * 0.4), t * 0.35, 0);
    model.scale.setScalar(1 + 0.12 * useful);

    // the notebook: pages appear as steps are written; change one, and every page after it shows it
    const tamper = win(t, T.ledger + 6.6, T.ledger + 9.8, 0.2, 0.7);
    blocks.forEach((bl, k) => {
      const a = ease.outCubic(ramp(t, bl.at, bl.at + 0.45)) * out;
      const hit = k >= 3 ? tamper * ramp(t, T.ledger + 6.6 + (k - 3) * 0.14, T.ledger + 6.9 + (k - 3) * 0.14) : 0;
      const c = COL.gold.clone().lerp(COL.bad, hit);
      bl.b.material.color.copy(c); bl.b.material.opacity = a * 0.95;
      bl.b.scale.setScalar(0.4 + 0.6 * a + 0.25 * bump(t, bl.at + 0.2, 0.2));
      bl.b.position.x = -2.4 + 0.6 * k + (k === 3 ? Math.sin(t * 40) * 0.03 * tamper : 0);
      if (bl.link) { bl.link.material.color.copy(c); bl.link.material.opacity = a * 0.8; }
    });

    // the effort: first thrown off into nothing, then sent into the model
    const wasted = win(t, T.work + 0.4, T.work + 6.4, 0.4, 0.7);
    for (let i = 0; i < sseed.length; i++) {
      const [a, b, c] = sseed[i];
      const life = (t * 0.8 + a) % 1;
      let x, y;
      if (t < T.work + 6.6) {
        const th = 0.3 + b * 2.5;                                  // thrown up and away, and gone
        x = HEAD.x + Math.cos(th) * life * 1.7; y = HEAD.y + Math.sin(th) * life * 1.5;
      } else {
        const bend = Math.sin(Math.PI * life) * (c - 0.5) * 1.4;
        x = lerp(HEAD.x, 0, life) + bend * 0.6; y = lerp(HEAD.y, 0, life) + bend;
      }
      spos[i * 3] = x; spos[i * 3 + 1] = y; spos[i * 3 + 2] = (c - 0.5) * 0.4;
    }
    sparks.geometry.attributes.position.needsUpdate = true;
    sparks.material.uniforms.uColor.value.copy(COL.waste).lerp(COL.gold, ramp(t, T.work + 6.6, T.work + 7.6));
    sparks.material.uniforms.uAlpha.value = Math.max(wasted * 0.8, useful);
    sparks.material.uniforms.uPR.value = pr;

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
