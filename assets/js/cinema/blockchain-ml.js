/*
 * Who improved the AI? Evaluation, privacy and incentives in collaborative ML.
 * Research basis: Ural and Yoshigoe, IEEE Access 11 (2023), 145331-145362,
 * DOI 10.1109/ACCESS.2023.3344669. Sec. IV-B.2: the SUM balance equation
 * and the separate Deposit/Refund/Take mechanism; IV-B.3: DeepChain's
 * Corda/MNIST prototype; IV-C.2: ML competitions for block rights.
 * The generalisation example is an illustrative teaching model. The closing
 * design perspective and proposed use are labelled as the author's view.
 * A survey reviews mechanisms; this film does not claim to have invented them.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, problems: 7, ledger: 15, private: 23, work: 32, real: 42, pay: 50, deposit: 62, built: 71, seams: 82,
            close: 90, card: 98 };
const D = 105;

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
const wordCue = (id, word, fallback) => {
  const line = TL && TL.lines.find(l => l.id === id);
  const boundary = line && line.words && line.words.find(w => w[0].toLowerCase() === word);
  return boundary ? makeWarp(TL.anchors)(line.real + boundary[1]) : fallback;
};
const PAY_BETTER = wordCue('pay', 'after', T.pay + 3.35);
const PAY_WORSE = wordCue('pay', 'higher', T.pay + 8.58);


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
      float a = (1.0 - smoothstep(0.0, 0.5, d)) * vA * uAlpha;
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
      gl_FragColor = vec4(uColor * (1.0 - smoothstep(0.05, 0.5, d)) * uAlpha, 1.0);
    }`,
};

function mat(def, uniforms, extra = {}) {
  const u = {};
  for (const k in uniforms) u[k] = { value: uniforms[k] };
  return new THREE.ShaderMaterial({ vertexShader: def.vertexShader, fragmentShader: def.fragmentShader,
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...extra });
}

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
  .cin .pn__t { font: 500 21px/1.2 "JetBrains Mono", monospace; letter-spacing: .08em; text-transform: uppercase; color: #8fa2ba; margin-bottom: 14px; }
  .cin .note { font: 400 22px/1.35 "Inter", sans-serif; color: #aebcd0; margin-top: 12px; }
  .cin .loss-row { display: grid; grid-template-columns: 210px 1fr 100px; align-items: center; gap: 18px; margin: 14px 0; font: 500 26px/1.2 "JetBrains Mono", monospace; }
  .cin .track { height: 24px; border-radius: 5px; background: #172332; }
  .cin .track i { display: block; height: 100%; border-radius: inherit; background: #6fd3ff; }
  .cin .reward-tag { font: 500 27px/1.25 "JetBrains Mono", monospace; margin-top: 18px; }
  .cin .flow { display: flex; align-items: center; gap: 14px; }
  .cin .flow b { flex: 1; padding: 18px 12px; border: 1px solid #39536b; border-radius: 10px; font: 500 27px/1.25 "Space Grotesk", sans-serif; color: #e4ecf6; text-align: center; }
  .cin .flow .arrow { color: #6fd3ff; font-size: 32px; }
  .cin .gate { font: 500 26px/1.3 "Inter", sans-serif; padding: 15px 0; border-bottom: 1px solid #243447; }
  .cin .gate:last-child { border-bottom: 0; }
  .cin .status { float: right; font: 500 25px/1.3 "JetBrains Mono", monospace; }
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
  title: 'Who improved the AI?',
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
    const mShell = wire(new THREE.IcosahedronGeometry(0.66, 1), COL.ok, 0.7);
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
    const CHY = -0.6, blocks = [];
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

    /* The question stays about AI. The ledger is one supporting mechanism. */
    const HD = { x: 120, y: 190, w: 800 };
    const say = (at, out, hd, sb) => text({ at, out, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div><div class="sb">${sb}</div>` });
    const gone = 0.05;
    text({ at: -3, out: T.close - 0.2, cls: 'scrim', words: false, rise: 0,
      place: { x: 0, y: 0, w: 1000 }, style: { height: '1080px', background: 'linear-gradient(to right,rgba(3,5,10,.9),rgba(3,5,10,.65) 65%,transparent)' }, html: '' });
    text({ at: T.close - 0.3, out: 1e9, cls: 'scrim', words: false, rise: 0,
      place: { x: 0, y: 0, w: 1920 }, style: { height: '1080px', background: 'radial-gradient(ellipse at center,rgba(3,5,10,.9),rgba(3,5,10,.55))' }, html: '' });
    text({ at: -3, out: T.close - 0.3, cls: 'kick', words: false, dur: 0.01,
      place: { x: 120, y: 88, w: 1200 }, html: 'Dr. Ozgur Ural &middot; learning across organisations' });

    say(-3, T.problems - gone, 'Who improved <em>the AI</em>?',
      'Five organisations train one model. Who deserves the credit?');
    say(T.problems, T.ledger - gone, 'A better training score can <span class="red">fool you</span>.',
      'An update can fit its own data and make the shared model worse.');
    say(T.ledger, T.private - gone, 'A record is <em>not a verdict</em>.',
      'A shared ledger makes recorded transactions harder to rewrite. It does not judge an update.');
    say(T.private, T.work - gone, 'Keep data local. Protect the <em>updates</em>, too.',
      'In federated learning, raw data can stay with each organisation.');
    say(T.work, T.real - gone, 'Could training itself <em>earn a block</em>?',
      'Some consensus designs replace hash puzzles with an ML competition.');
    say(T.real, T.pay - gone, 'A good score. A <span class="amber">real training run</span>?',
      'Model performance and evidence of training answer different questions.');
    say(T.pay, T.deposit - gone, 'Reward the <span class="green">improvement</span>.',
      'Measure loss before and after a contribution on the same evaluation data.');
    say(T.deposit, T.built - gone, 'A deposit is only as good as <em>its test</em>.',
      'Model agreement is the rule here. It is not an oracle for truth.');
    say(T.built, T.seams - gone, 'Better AI can still be a <span class="amber">slower system</span>.',
      'DeepChain reported higher accuracy with more parties, alongside lower throughput as gradients increased.');
    say(T.seams, T.close - gone, 'Before connecting <em>the organisations</em>…',
      'Choose the evaluation, protect the shared updates, and test the cost.');

    text({ at: T.problems, out: T.close - 0.2, cls: 'credit', words: false,
      place: { x: 120, y: 780, w: 820 },
      html: 'Research basis: Ural &amp; Yoshigoe, IEEE Access 2023<span>A survey of published systems. Diagrams are schematic.</span>' });
    text({ at: T.close, out: T.card - 0.2, cls: 'cl__a', place: { x: 220, y: 270, w: 1480, align: 'center' },
      html: 'Before you decide who gets paid,' });
    text({ at: T.close + 1.8, out: T.card - 0.2, cls: 'cl__b', place: { x: 220, y: 390, w: 1480, align: 'center' },
      html: 'define what <em>better AI</em> means.' });
    text({ at: T.close + 3.8, out: T.card - 0.2, cls: 'credit', words: false,
      place: { x: 220, y: 660, w: 1480, align: 'center' }, html: 'Dr. Ozgur Ural’s research perspective' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24,
      place: { x: 160, y: 230, w: 1600, align: 'center' },
      html: `<div class="end__t">Who improved the AI?</div>
        <div class="end__s">Evaluation. Privacy. Evidence of training.</div>
        <div class="end__a">Research basis: Ural &amp; Yoshigoe, IEEE Access 2023</div>
        <div class="end__u">${AUTHOR}</div>` });

    const pn = (at, out, html, update, cls = '') => text({ at, out, cls: 'pn ' + cls,
      words: false, dur: 0.45, rise: 12, place: { x: 980, y: 630, w: 840 }, html, update });
    const bar = (name, kind, label = '') => `<div class="loss-row"><span>${name}</span><div class="track"><i data-bar="${kind}"></i></div><span data-label="${kind}">${label}</span></div>`;
    pn(T.problems + 0.3, T.ledger - gone,
      '<div class="pn__t">One misleading update · illustrative loss</div>' +
      bar('own data', 'fit', 'lower') + bar('separate test', 'test', 'higher') +
      '<div class="note">Lower loss is better. Evaluate beyond the contributor’s own data.</div>',
      (t, el) => {
        const u = ease.inOutSine(ramp(t, T.problems + 1, T.problems + 5.6));
        for (const [key, value, color] of [['fit', lerp(.72, .25, u), '#5dffa0'], ['test', lerp(.45, .74, u), '#ff6272']]) {
          const b = el.querySelector(`[data-bar="${key}"]`); b.style.width = value * 100 + '%'; b.style.background = color;
        }
      }, 'generalisation');
    pn(T.ledger + 0.5, T.private - gone,
      '<div class="pn__t">Two separate checks</div><div class="gate">Transaction recorded<span class="status green">on record</span></div>' +
      '<div class="gate">Contribution helped<span class="status amber">needs a test</span></div>' +
      '<div class="note">Tamper evidence does not certify model quality.</div>',
      (t, el) => cue([...el.querySelectorAll('.gate')], t, [T.ledger + .8, T.ledger + 3.6]), 'record-check');
    pn(T.private + 0.4, T.work - gone,
      '<div class="pn__t">Federated training · schematic</div><div class="flow"><b>Local data</b><span class="arrow">→</span><b>Model update</b><span class="arrow">→</span><b>Shared model</b></div>' +
      '<div class="note">Updates can leak information. Privacy needs its own protection.</div>',
      (t, el) => {
        const arrows = el.querySelectorAll('.arrow');
        arrows.forEach((e, i) => { e.style.opacity = String(.25 + .75 * (.5 + .5 * Math.sin((t - T.private) * 3 - i * 1.8))); });
      }, 'private-flow');
    pn(T.real + 0.3, T.pay - gone,
      '<div class="pn__t">Different claims need different evidence</div><div class="gate">Is the model useful?<span class="status">Evaluate it</span></div>' +
      '<div class="gate">Was the work done?<span class="status amber">Verify the run</span></div>',
      (t, el) => cue([...el.querySelectorAll('.gate')], t, [T.real + .8, T.real + 3.7]));

    // Reward is computed from the very same schematic loss values being drawn.
    // These are sequential marginal contributions, not Shapley-value attribution.
    pn(T.pay + 0.3, T.deposit - gone,
      '<div class="pn__t">SUM reward rule · illustrative contributions</div>' +
      bar('before update', 'before') + bar('after update', 'after') +
      '<div class="reward-tag"></div><div class="note">Balance change = loss before − loss after. Same evaluation data.</div>',
      (t, el) => {
        const harmful = t >= PAY_WORSE;
        const at = harmful ? PAY_WORSE : PAY_BETTER;
        const u = ease.inOutSine(ramp(t, at, at + 2.5));
        const before = harmful ? .42 : .68;
        const after = lerp(before, harmful ? .61 : .42, u);
        el.dataset.delta = (before - after).toFixed(4);
        el.dataset.example = harmful ? 'harmful' : 'helpful';
        el.querySelector('[data-bar="before"]').style.width = before * 100 + '%';
        const b = el.querySelector('[data-bar="after"]'); b.style.width = after * 100 + '%';
        b.style.background = harmful ? '#ff6272' : '#5dffa0';
        const tag = el.querySelector('.reward-tag'); tag.className = 'reward-tag ' + (harmful ? 'red' : 'green');
        tag.textContent = u < .06 ? 'Evaluate the next contribution…' : harmful ? 'Loss rises → balance decreases' : 'Loss falls → balance increases';
      }, 'reward-demo');
    pn(T.deposit + 0.3, T.built - gone,
      '<div class="pn__t">SUM deposit rule · a separate mechanism</div><div class="flow"><b>Deposit</b><span class="arrow">→</span><b>Wait</b><span class="arrow">→</span><b class="decision">Check label</b></div>' +
      '<div class="note">After the waiting period: agreement permits a refund; disagreement can cost part of the deposit.</div>',
      (t, el) => {
        const e = el.querySelector('.decision'); const done = t >= T.deposit + 4.2;
        e.textContent = done ? 'Disagrees: penalty' : 'Check label'; e.style.borderColor = done ? '#ff6272' : '#39536b';
        e.style.color = done ? '#ff8a96' : '#e4ecf6';
      }, 'deposit-demo');
    pn(T.built + 0.3, T.seams - gone,
      '<div class="pn__t">DeepChain · reported directions, not magnitudes</div>' +
      '<div class="gate">More parties<span class="status green">Accuracy ↑</span></div>' +
      '<div class="gate">More gradients<span class="status red">Throughput ↓</span></div>' +
      '<div class="note">Corda / MNIST prototype. These are not universal scaling laws.</div>',
      (t, el) => cue([...el.querySelectorAll('.gate')], t, [T.built + 1.4, T.built + 4.3]));
    pn(T.seams + .3, T.close - gone,
      '<div class="pn__t">A design review for collaborative AI</div><div class="flow"><b>Evaluation</b><b>Privacy</b><b>Incentives</b></div>' +
      '<div class="note">Proposed use: organisations that need to learn together and audit contributions.</div>',
      (t, el) => cue([...el.querySelectorAll('.flow b')], t, [T.seams + .6, T.seams + 2.2, T.seams + 3.8]));

    label({ cls: 'chip', html: 'one shared AI model', anchor: () => new THREE.Vector3(0, -.8), dx: 0, dy: 8, ax: .5, ay: 0,
      alpha: t => win(t, .8, T.problems - .2, .4, .4) });
    label({ cls: 'chip au', html: 'ML competition', anchor: () => new THREE.Vector3(0, -.8), dx: 0, dy: 8, ax: .5, ay: 0,
      alpha: t => win(t, T.work + 1, T.real - .2, .4, .4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, model, mShell, mCore, who, blocks, HEAD, sparks, sseed, spos, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();
    camera.position.set(Math.sin(t * 0.21) * 0.22, Math.sin(t * 0.17 + 1) * 0.13, 12);
    camera.lookAt(0, 0, 0);
    const out = 1 - ramp(t, T.close - 0.4, T.close + 0.7);
    const ledgerView = win(t, T.ledger, T.private - 0.2, 0.45, 0.5);
    const networkAlpha = out * (1 - ledgerView);

    // the participants: one sends bad data, twice: once unnoticed, once when a contract is watching
    const slow = lerp(0.7, 0.28, ease.inOutSine(ramp(t, T.built + 3.4, T.built + 7.6)));
    const home = win(t, T.private + 1.0, T.work - 0.2, 0.6, 0.6);
    who.forEach((n, i) => {
      const bad = i === 2 ? Math.max(win(t, T.problems + 0.8, T.ledger + 0.4, 0.4, 0.6), win(t, PAY_WORSE, T.built - 0.2, 0.4, 0.6)) : 0;
      const c = COL.ok.clone().lerp(COL.bad, bad);
      n.sh.material.color.copy(c); n.sh.material.opacity = 0.75 * networkAlpha;
      n.co.material.uniforms.uColor.value.copy(c); n.co.material.uniforms.uAlpha.value = 0.8 * networkAlpha;
      n.g.rotation.set(0, 0, 0); n.sh.rotation.set(t * 0.4 + i, t * 0.5, 0);
      n.data.material.opacity = networkAlpha * (0.75 + 0.25 * home);
      n.data.scale.setScalar(1 + 0.6 * home * (0.7 + 0.3 * Math.sin(t * 3 + i)));
      n.line.material.color.copy(c); n.line.material.opacity = 0.35 * networkAlpha;
      const f = (t * slow + i * 0.23) % 1;
      n.dot.position.copy(n.p).multiplyScalar(lerp(0.86, 0.46, f));
      n.dot.material.color.copy(bad > 0.5 ? COL.bad : HDR(1.6, 2.4, 3.0));
      n.dot.material.opacity = networkAlpha * Math.sin(Math.PI * f);
    });

    // the model: tainted while bad data goes in unseen, brighter while the network's work is training it
    const tainted = win(t, T.problems + 1.6, T.ledger + 0.6, 0.6, 0.8);
    const useful = win(t, T.work + 7.0, T.real + 1.0, 0.8, 1.0);
    const mc = COL.ok.clone().lerp(COL.bad, 0.5 * tainted);
    mShell.material.color.copy(mc); mShell.material.opacity = 0.7 * networkAlpha;
    mCore.material.uniforms.uColor.value.copy(mc);
    mCore.material.uniforms.uAlpha.value = networkAlpha * (0.7 + 0.5 * useful);
    model.rotation.set(0.3 * Math.sin(t * 0.4), t * 0.35, 0);
    model.scale.setScalar(1 + 0.12 * useful);

    // the notebook: pages appear as steps are written; change one, and every page after it shows it
    const tamper = win(t, T.ledger + 4.4, T.private - 0.2, 0.2, 0.7);
    blocks.forEach((bl, k) => {
      const a = ease.outCubic(ramp(t, bl.at, bl.at + 0.45)) * ledgerView;
      const hit = k >= 3 ? tamper * ramp(t, T.ledger + 4.4 + (k - 3) * 0.14, T.ledger + 4.7 + (k - 3) * 0.14) : 0;
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
