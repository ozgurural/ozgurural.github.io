/*
 * A backup that shares your mistake: majority voting, common-cause failure and
 * Ariane 5, in two minutes.
 *
 * It replaces the lab film "Redundancy Reactor" and keeps its argument, scene
 * for scene: a majority voter outvotes one faulty channel; with independent
 * faults the vote fails only when a majority fails at once, which gets rarer
 * with every channel added (the binomial tail, P = 3q^2(1-q) + q^3 for three);
 * a shared cause makes them fail together, and that part of the risk does not
 * depend on how many channels there are (the common-cause floor); Ariane 5;
 * design diversity lowers the shared part without removing it.
 *
 * Source for the flight: "Ariane 5 Flight 501 Failure, Report by the Inquiry
 * Board" (1996), read before this was written. Two inertial reference systems,
 * identical hardware and software, one active and one in hot stand-by; software
 * reused from Ariane 4; an unprotected conversion of a 64-bit number to 16 bits
 * overflowed because horizontal velocity built up five times faster; the
 * back-up failed one 72 ms cycle before the active unit; the diagnostic pattern
 * was read as flight data; break-up at about H0 + 39 s. Two computers, not
 * three: the lab page said three for a while, and that was wrong.
 *
 * The strip of ticks is a small simulation, not a recording: each row is one
 * computer, a red tick is a moment it is wrong, and the nodes above fail when
 * the cursor reaches a red tick in their row. Nothing is scripted to make the
 * vote fail; it fails when the ticks line up.
 */
import { THREE, createCinema, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, vote: 5, rare: 15, catch: 27.5, ariane: 41.5, overflow: 53.5, break: 67.5, lesson: 76.5, cure: 87.5, close: 101, card: 113.5 };
const D = 120;

const TL_DIR = new URL('../../audio/cinema/redundancy/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`redundancy: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
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
  good: HDR(0.35, 2.2, 1.0, 1.0),
  hull: HDR(1.3, 1.6, 2.2, 0.9),
  fire: HDR(2.6, 1.3, 0.45, 1.2),
  team: [HDR(0.55, 1.25, 2.3, 0.85), HDR(0.4, 2.0, 1.5, 0.9), HDR(1.5, 0.9, 2.4, 0.9)],
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
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px 10px 12px;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); white-space: nowrap; }
  .cin .stamp .ic { margin-right: 8px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #8fd3ff; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .pn { padding: 16px 20px 18px; border-radius: 16px; background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.2); }
  .cin .pn__h { display: flex; align-items: center; justify-content: space-between; min-height: 46px; margin-bottom: 10px; }
  .cin .pn__t { font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: #8fa2ba; }
  .cin .pn__h .chip, .cin .pn__h .stamp { font-size: 22px; padding: 8px 12px; }
  .cin .rows { position: relative; }
  .cin .row { display: grid; grid-template-columns: 96px 1fr; align-items: center; gap: 12px; height: 30px; margin-bottom: 9px; }
  .cin .row b { font: 500 21px/1 "JetBrains Mono", monospace; color: #aebcd0; white-space: nowrap; }
  .cin .row div { position: relative; height: 100%; border-radius: 5px;
                  background: repeating-linear-gradient(to right, rgba(111,211,255,.3) 0 4px, rgba(111,211,255,.07) 4px calc(100% / 48)); }
  .cin .row i { position: absolute; top: -3px; bottom: -3px; width: 9px; margin-left: -4.5px; border-radius: 3px; background: #ff6272;
                box-shadow: 0 0 10px rgba(255,98,114,.8); }
  .cin .cursor { position: absolute; top: -6px; width: 3px; margin-left: -1.5px; background: #f4f7fb; border-radius: 2px;
                 box-shadow: 0 0 12px rgba(244,247,251,.8); }
  .cin .nav { display: grid; grid-template-columns: 150px 1fr auto; align-items: center; gap: 14px; margin-bottom: 10px;
              font: 500 27px/1 "JetBrains Mono", monospace; color: #e4ecf6; }
  .cin .nav span { color: #8fa2ba; font-size: 22px; }
  .cin .nav u { text-decoration: none; padding: 9px 12px; border-radius: 8px; border: 1.5px solid #5dffa0; color: #5dffa0; white-space: nowrap; }
  .cin .gauge { margin-top: 16px; }
  .cin .gauge__l { display: flex; justify-content: space-between; font: 500 21px/1 "JetBrains Mono", monospace; color: #aebcd0; margin-bottom: 10px; }
  .cin .gauge__k { position: relative; height: 22px; border-radius: 6px; background: rgba(127,207,255,.1); overflow: visible; }
  .cin .gauge__k i { display: block; height: 100%; width: 0; border-radius: 6px; background: #6fd3ff; }
  .cin .gauge__k u { position: absolute; left: 72%; top: -8px; bottom: -8px; width: 3px; background: #ffcf5a; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 84px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 96px/1.05 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 900px; }
  .cin .end__a { font: 500 23px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

const bump = (t, at, w) => Math.exp(-Math.pow((t - at) / w, 2));
const show = (el, v) => { el.style.opacity = String(v); };

/* ------------------------------------------------- the strip: a small simulation */
// Each row is one computer; a number is the moment (out of 48) at which it is wrong. Unrelated faults fall at
// different moments. With a shared flaw every row is wrong at the same moments, however many rows there are.
const COLS = 48;
const ALONE = [[4, 19, 34], [10, 25, 40], [16, 31, 46], [1, 22, 43], [7, 28, 37]];   // three apart at the least: never two at once
const SHARED = [12, 33, 41];
const WIDE = 1.2;                                            // a fault lasts this many moments either side
const SPEED = 4;                                             // moments per second
const sweep = (t, t0) => ((t - t0) * SPEED) % COLS;
const lined = t => (t < T.ariane ? ease.inOutCubic(ramp(t, T.catch + 4.4, T.catch + 6.4)) : 0);
const tickAt = (r, j, u) => lerp(ALONE[r][j], SHARED[j], u);
const wrongNow = (r, col, u) => ALONE[r].some((_, j) => Math.abs(col - tickAt(r, j, u)) < WIDE);
const strip = (labels) => `<div class="rows">${labels.map((l, r) =>
  `<div class="row"><b>${l}</b><div>${ALONE[r].map(() => '<i></i>').join('')}</div></div>`).join('')}<div class="cursor"></div></div>`;
function drawStrip(el, t, rows, u, col, running) {
  el.querySelectorAll('.row').forEach((row, r) => {
    show(row, r < 3 ? 1 : rows - 3 > 0 ? ramp(rows, 3 + (r - 3) * 0.5, 3.5 + (r - 3) * 0.5) : 0);
    row.querySelectorAll('i').forEach((tk, j) => { tk.style.left = (100 * (tickAt(r, j, u) + 0.5) / COLS).toFixed(3) + '%'; });
  });
  const cur = el.querySelector('.cursor');
  // the cursor rides the track, which starts after the label column
  cur.style.left = `calc(108px + (100% - 108px) * ${((col + 0.5) / COLS).toFixed(4)})`;
  cur.style.height = (39 * Math.min(rows, el.querySelectorAll('.row').length) - 3).toFixed(0) + 'px';
  show(cur, running);
}

/* ----------------------------------------------------------------- film */
const film = {
  title: 'A backup that shares your mistake',
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

    /* dust, for depth; and streaks that fall past the rocket so it reads as climbing */
    const rnd = seeded(11);
    const DN = 1000, dp = new Float32Array(DN * 3), ds = new Float32Array(DN);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = (rnd() - 0.5) * 40; dp[i * 3 + 1] = (rnd() - 0.5) * 22; dp[i * 3 + 2] = -14 + rnd() * 20;
      ds[i] = rnd();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(ds, 1));
    const dust = new THREE.Points(dg, mat(DUST, { uTime: 0, uPR: 1, uAlpha: 0.8, uKeepOut: new THREE.Vector3(-1, 0, 0.05) }));
    scene.add(dust);
    const SN = 160, sseed = [], spos = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) sseed.push([rnd(), rnd(), rnd()]);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(spos, 3));
    const streaks = new THREE.Points(sg, mat(MOTES, { uColor: HDR(0.5, 0.8, 1.2), uAlpha: 0, uPR: 1, uSize: 2.2 }));
    streaks.frustumCulled = false;
    scene.add(streaks);

    /* a computer: a box with a core, and a flaw that can be put inside it */
    function unit(geo, color) {
      const g = new THREE.Group();
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: color.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12), mat(RIM, { uColor: color.clone(), uAlpha: 0, uReveal: 2, uPow: 1.6 }));
      const flaw = new THREE.Mesh(new THREE.TetrahedronGeometry(0.13), new THREE.MeshBasicMaterial({ color: HDR(2.6, 1.2, 0.3), transparent: true, opacity: 0 }));
      flaw.position.set(0.16, 0.14, 0.1);
      g.add(edges, core, flaw);
      scene.add(g);
      return { g, edges, core, flaw, base: color.clone() };
    }
    const BOX = () => new THREE.BoxGeometry(0.78, 0.78, 0.78);
    const units = [0, 1, 2, 3, 4].map(() => unit(BOX(), COL.ok));
    // the same three places, built three different ways
    const diverse = [unit(BOX(), COL.team[0]), unit(new THREE.IcosahedronGeometry(0.52, 0), COL.team[1]), unit(new THREE.OctahedronGeometry(0.58, 0), COL.team[2])];
    const voter = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.46, 0)),
      new THREE.LineBasicMaterial({ color: COL.good.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    const VOTER = new THREE.Vector3(0, -0.55, 0);
    voter.position.copy(VOTER);
    scene.add(voter);
    const links = units.map(() => {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: COL.ok.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 8), new THREE.MeshBasicMaterial({ color: HDR(1.6, 2.4, 3.0), transparent: true, opacity: 0 }));
      scene.add(line, dot);
      return { line, dot };
    });

    /* the rocket: a core, a nose and two boosters, drawn as edges like everything else here */
    const rocket = new THREE.Group();
    const parts = [];
    function part(geo, x, y, drift) {
      const g = new THREE.Group();
      const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x050a14, transparent: true, opacity: 0 }));
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25),
        new THREE.LineBasicMaterial({ color: COL.hull.clone(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(fill, edge);
      g.position.set(x, y, 0);
      rocket.add(g);
      parts.push({ g, fill, edge, home: new THREE.Vector3(x, y, 0), drift: new THREE.Vector3(...drift) });
    }
    part(new THREE.CylinderGeometry(0.2, 0.2, 2.2, 14), 0, 0, [0.5, 0.4, 0]);
    part(new THREE.ConeGeometry(0.2, 0.55, 14), 0, 1.375, [0.9, 1.5, 0]);
    part(new THREE.CylinderGeometry(0.115, 0.115, 1.45, 10), -0.33, -0.3, [-2.1, 0.3, 0]);
    part(new THREE.ConeGeometry(0.115, 0.3, 10), -0.33, 0.575, [-2.4, 1.0, 0]);
    part(new THREE.CylinderGeometry(0.115, 0.115, 1.45, 10), 0.33, -0.3, [2.2, -0.2, 0]);
    part(new THREE.ConeGeometry(0.115, 0.3, 10), 0.33, 0.575, [2.6, 0.5, 0]);
    scene.add(rocket);
    const FN = 240, fseed = [], fpos = new Float32Array(FN * 3);
    for (let i = 0; i < FN; i++) fseed.push([rnd(), rnd(), rnd(), rnd()]);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    const flame = new THREE.Points(fg, mat(MOTES, { uColor: COL.fire, uAlpha: 0, uPR: 1, uSize: 4.5 }));
    flame.frustumCulled = false;
    scene.add(flame);

    Object.assign(ctx, { dust, streaks, sseed, spos, units, diverse, voter, VOTER, links, rocket, parts, flame, fseed, fpos });

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
          'radial-gradient(ellipse 60% 52% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.close - 0.3, cls: 'kick', place: KICK, words: false, dur: 0.01,
           html: 'Dr. Ozgur Ural &middot; a research film' });

    text({ at: -3, out: T.vote - gone, cls: 'blk', place: HD,
           html: '<div class="hd">Three computers agree.</div><div class="sb">Could all three still be <span class="red">wrong</span>?</div>' });
    say(T.vote, T.rare - gone, 'They run three and take a <em>vote</em>.',
        'Machines we trust with lives don&rsquo;t rely on one computer. If one goes wrong, the other two outvote it.');
    say(T.rare, T.catch - gone, 'Two failing at once is <em>rare</em>.',
        'If their faults are unrelated, it almost never happens. And the more computers you add, the rarer it gets.');
    say(T.catch, T.ariane - gone, 'The condition: <span class="amber">unrelated</span>.',
        'Give every computer the same flaw, and they fail together. The vote is unanimous, and wrong. Adding more copies changes nothing.');
    say(T.ariane, T.overflow - gone, 'Ariane 5, <em>first flight</em>.',
        'June 1996. Two navigation computers: one active, one backup. Identical machines, identical software.');
    say(T.overflow, T.break - gone, 'A number grew <span class="amber">too big</span>.',
        'The software came from an older, slower rocket. The backup shut itself down. A moment later the active one did the same, for the same reason.');
    say(T.break, T.lesson - gone, 'The rocket <span class="red">tore itself apart</span>.',
        'It took the error message for flight data and swerved hard, about forty seconds into the flight.');
    say(T.lesson, T.cure - gone, 'Nothing had <em>broken</em>.',
        'Both computers were healthy, and both did exactly what their software said. A backup that shares your mistake is not a backup.');
    say(T.cure, T.close - 0.25, 'The cure is <em>different</em> copies, not more.',
        'Built by different teams, in different ways, so their mistakes don&rsquo;t line up. That lowers the risk. It never makes it zero.');
    text({ at: T.rare + 0.8, out: T.ariane - gone, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 800 },
           html: 'Majority voting and common-cause failure: standard reliability theory.<span>The strip is a small simulation, for illustration.</span>' });
    text({ at: T.ariane + 0.8, out: T.cure - gone, cls: 'credit', words: false, dur: 0.6, place: { x: 120, y: 900, w: 800 },
           html: 'Ariane 5 Flight 501: Report by the Inquiry Board, 1996.<span>The drawing of the flight is an illustration.</span>' });

    text({ at: T.close, out: T.card - 0.3, cls: 'cl__a', place: { x: 220, y: 250, w: 1480, align: 'center' },
           html: 'We are handing more decisions to machines that check each other, and now to AI.' });
    text({ at: T.close + 5.0, out: T.card - 0.3, cls: 'cl__b', place: { x: 220, y: 400, w: 1480, align: 'center' },
           html: 'The question is never how many agree. It&rsquo;s whether they can <em>all be wrong at once</em>.' });

    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 240, w: 1600, align: 'center' },
           html: `<div class="end__t">A backup that shares your mistake</div>
                  <div class="end__s">Why three computers can agree and all be wrong.</div>
                  <div class="end__a">Ariane 5 Flight 501 Inquiry Board report, 1996 &middot; majority voting with common-cause failure</div>
                  <div class="end__u">Dr. Ozgur Ural<span>Machine Learning Research Scientist &amp; Senior Software Engineer, Ph.D. &middot; ozgurural.github.io</span></div>` });

    /* ------------------------------------------------- panels under the stage */
    const PN = { x: 980, y: 690, w: 840 };
    // the strip, first for copies of one design
    text({ at: T.rare + 0.7, out: T.ariane - gone, cls: 'pn', words: false, dur: 0.5, rise: 16, place: PN,
           html: `<div class="pn__h"><div class="pn__t">each row: one computer &middot; red: a moment it is wrong</div></div>` + strip(['A', 'B', 'C', 'D', 'E']) +
                 `<div class="pn__h" style="margin:6px 0 0"><span class="chip" data-s="never">two at once: almost never</span><span class="stamp red" data-s="all">${NO}ALL WRONG AT ONCE</span></div>`,
           update: (t, el) => {
             const u = lined(t);
             drawStrip(el, t, 3 + 2 * ramp(t, T.rare + 8.4, T.rare + 9.8), u, sweep(t, T.rare + 1.2), ramp(t, T.rare + 1.2, T.rare + 1.6));
             show(el.querySelector('[data-s="never"]'), win(t, T.rare + 5.0, T.catch + 4.4, 0.4, 0.5));
             show(el.querySelector('[data-s="all"]'), ramp(t, T.catch + 9.1, T.catch + 9.6));
           } });
    // and again for three different designs
    text({ at: T.cure + 2.0, out: T.close - 0.3, cls: 'pn', words: false, dur: 0.5, rise: 16, place: { x: PN.x, y: 720, w: PN.w },
           html: `<div class="pn__h"><div class="pn__t">three designs &middot; different mistakes</div></div>` + strip(['team A', 'team B', 'team C']) +
                 `<div class="pn__h" style="margin:6px 0 0"><span class="chip" data-s="hold">the vote holds</span><span class="chip" data-s="zero">lower risk, never zero</span></div>`,
           update: (t, el) => {
             drawStrip(el, t, 3, 0, sweep(t, T.cure + 2.4), ramp(t, T.cure + 2.4, T.cure + 2.8));
             show(el.querySelector('[data-s="hold"]'), ramp(t, T.cure + 5.0, T.cure + 5.5));
             show(el.querySelector('[data-s="zero"]'), ramp(t, T.cure + 9.6, T.cure + 10.1));
           } });

    // the two navigation computers and the number that outgrew its space
    const DOWN_B = T.overflow + 7.4, DOWN_A = T.overflow + 9.4;
    ctx.DOWN_B = DOWN_B; ctx.DOWN_A = DOWN_A;
    text({ at: T.ariane + 5.6, out: T.lesson - gone, cls: 'pn', words: false, dur: 0.5, rise: 16, place: { x: PN.x, y: 668, w: PN.w },
           html: `<div class="pn__h"><div class="pn__t">navigation computers &middot; identical software</div></div>
                  <div class="nav"><b>BACKUP</b><span data-w></span><u data-s="b">running</u></div>
                  <div class="nav"><b>ACTIVE</b><span data-w></span><u data-s="a">running</u></div>
                  <div class="gauge"><div class="gauge__l"><span>one number in that software</span><span>room it was given &darr;</span></div>
                    <div class="gauge__k"><i></i><u></u></div></div>`,
           update: (t, el) => {
             const fillv = lerp(0.18, 0.86, ease.inOutSine(ramp(t, T.overflow + 0.6, T.overflow + 7.6)));
             const over = fillv > 0.72;
             const bar = el.querySelector('.gauge__k i');
             bar.style.width = (100 * fillv).toFixed(2) + '%';
             bar.style.background = over ? '#ff6272' : '#6fd3ff';
             show(el.querySelector('.gauge'), ramp(t, T.overflow - 0.4, T.overflow + 0.3));
             [['b', DOWN_B], ['a', DOWN_A]].forEach(([k, at]) => {
               const s = el.querySelector(`[data-s="${k}"]`), down = t >= at;
               const word = down ? 'SHUT DOWN' : 'running';
               if (s.textContent !== word) s.textContent = word;
               s.style.color = s.style.borderColor = down ? '#ff6272' : '#5dffa0';
               s.style.transform = `scale(${(1 + 0.2 * bump(t, at + 0.1, 0.18)).toFixed(3)})`;
             });
             el.querySelectorAll('[data-w]').forEach((w, i) => {
               const at = i === 0 ? DOWN_B : DOWN_A, word = t >= at ? 'number too big' : '';
               if (w.textContent !== word) w.textContent = word;
             });
           } });

    /* ----------------------------------------------------- pinned labels */
    const P3 = (x, y, z = 0) => new THREE.Vector3(x, y, z);
    label({ cls: 'chip', html: 'the vote', anchor: () => VOTER, dx: 46, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.vote + 2.2, T.rare + 0.4, 0.4, 0.4) });
    label({ cls: 'chip', html: 'one wrong: outvoted', anchor: () => units[1].g.position, dx: 0, dy: -84, ax: 0.5, ay: 1,
            alpha: t => win(t, T.vote + 5.2, T.vote + 9.4, 0.4, 0.4) });
    label({ cls: 'chip', html: 'the same flaw in every one', anchor: () => P3(0, 2.1), dx: 0, dy: 0, ax: 0.5, ay: 1,
            alpha: t => win(t, T.catch + 4.6, T.ariane - 0.6, 0.4, 0.4) });
    label({ cls: 'chip', html: 'Ariane 5 &middot; 4 June 1996', anchor: () => P3(1.0, 1.45), dx: 0, dy: 0, ax: 0, ay: 0.5,
            alpha: t => win(t, T.ariane + 3.4, T.break + 3.0, 0.5, 0.4) });
    label({ cls: 'chip', html: 'error message, read as flight data', anchor: () => P3(0, -1.75), dx: 0, dy: 0, ax: 0.5, ay: 0,
            alpha: t => win(t, T.break + 0.5, T.break + 4.4, 0.4, 0.4) });
    label({ cls: 'stamp red', html: 'ABOUT FORTY SECONDS IN', anchor: () => P3(0, -1.75), dx: 0, dy: 0, ax: 0.5, ay: 0,
            alpha: t => win(t, T.break + 5.4, T.lesson - 0.1, 0.35, 0.4) });
    label({ cls: 'chip', html: 'backup', anchor: () => units[0].g.position, dx: 0, dy: -126, ax: 0.5, ay: 1,
            alpha: t => win(t, T.lesson + 1.4, T.cure - 0.2, 0.4, 0.4) });
    label({ cls: 'chip', html: 'active', anchor: () => units[1].g.position, dx: 0, dy: -126, ax: 0.5, ay: 1,
            alpha: t => win(t, T.lesson + 1.4, T.cure - 0.2, 0.4, 0.4) });
    label({ cls: 'stamp amber', html: 'HEALTHY, AND THE SAME MISTAKE', anchor: () => P3(0, -1.2), dx: 0, dy: 0, ax: 0.5, ay: 0,
            alpha: t => win(t, T.lesson + 4.6, T.cure - 0.2, 0.35, 0.4) });
  },

  /* ------------------------------------------------------------ frame */
  frame(t, ctx) {
    const { camera, dust, streaks, sseed, spos, units, diverse, voter, VOTER, links, rocket, parts, flame, fseed, fpos, renderer, grade } = ctx;
    const pr = renderer.getPixelRatio();

    const flying = ramp(t, T.ariane - 0.6, T.ariane + 0.8) * (1 - ramp(t, T.lesson - 0.3, T.lesson + 0.6));
    ctx.setViewShift(0.2, lerp(-0.1, -0.17, flying));
    camera.position.set(Math.sin(t * 0.21) * 0.25, Math.sin(t * 0.17 + 1) * 0.15, 12);
    camera.lookAt(0, 0, 0);

    /* --- the voting machines: copies of one design, then the two of Ariane, then three designs --- */
    const act1 = 1 - ramp(t, T.ariane - 0.8, T.ariane - 0.1);
    const pair = win(t, T.lesson + 0.6, T.cure - 0.1, 0.8, 0.5);
    const mixed = ramp(t, T.cure + 0.6, T.cure + 1.6) * (1 - ramp(t, T.close - 0.5, T.close + 0.5));
    const five = t < T.ariane ? ease.inOutCubic(ramp(t, T.rare + 8.4, T.rare + 9.8)) : 0;
    const u = lined(t);
    const col = sweep(t, T.rare + 1.2), simOn = t > T.rare + 1.2 && t < T.ariane;
    const X3 = [-1.6, 0, 1.6, -3.2, 3.2], X5 = [-1.25, 0, 1.25, -2.5, 2.5];
    let wrong = 0, live = 0;
    units.forEach((n, i) => {
      // where it stands: in the row of three or five, or as one of Ariane's two
      const x = lerp(lerp(X3[i], X5[i], five), i === 0 ? -1.2 : 1.2, pair > 0 ? 1 : 0);
      n.g.position.set(x, pair > 0 ? 0.35 : 1.3, 0);
      const present = pair > 0 ? (i < 2 ? pair : 0) : act1 * (i < 3 ? 1 : five);
      // when it is wrong: once on cue so the vote can be seen to hold, then whenever the cursor says so
      const cue = i === 1 ? win(t, T.vote + 4.5, T.vote + 8.2, 0.3, 0.4) : 0;
      const sim = simOn && wrongNow(i, col, u) ? 1 : 0;
      const bad = pair > 0 ? 0 : Math.max(cue, sim);
      if (present > 0.5) { live++; if (bad > 0.5) wrong++; }
      n.g.rotation.set(0.35, 0.6 + 0.25 * Math.sin(t * 0.5 + i), 0);
      n.g.scale.setScalar(pair > 0 ? 1.5 : 1);
      n.edges.material.color.copy(n.base).lerp(COL.bad, bad);
      n.edges.material.opacity = present * 0.95;
      n.core.material.uniforms.uColor.value.copy(n.base).lerp(COL.bad, bad);
      n.core.material.uniforms.uAlpha.value = present * (1.0 + 0.8 * bad);
      // the shared flaw: the same small thing inside every copy
      n.flaw.material.opacity = present * (pair > 0 ? ramp(t, T.lesson + 3.0, T.lesson + 3.8) : ramp(t, T.catch + 4.2, T.catch + 5.0));
      n.flaw.rotation.set(t, t * 1.3, 0);
      const { line, dot } = links[i];
      const voting = pair > 0 ? 0 : present;
      const p = line.geometry.attributes.position;
      p.setXYZ(0, x, 0.9, 0); p.setXYZ(1, VOTER.x, VOTER.y + 0.4, 0); p.needsUpdate = true;
      line.material.color.copy(COL.ok).lerp(COL.bad, bad);
      line.material.opacity = voting * 0.4;
      const f = (t * 0.9 + i * 0.21) % 1;
      dot.position.set(lerp(x, VOTER.x, f), lerp(0.9, VOTER.y + 0.4, f), 0);
      dot.material.color.copy(bad > 0.5 ? COL.bad : HDR(1.6, 2.4, 3.0));
      dot.material.opacity = voting * Math.sin(Math.PI * f);
    });
    diverse.forEach((n, i) => {
      n.g.position.set(X3[i], 1.3, 0);
      const bad = t > T.cure + 2.4 && wrongNow(i, sweep(t, T.cure + 2.4), 0) ? 1 : 0;
      if (mixed > 0.5) { live++; if (bad) wrong++; }
      n.g.rotation.set(0.35, 0.6 + t * 0.2 + i, 0);
      n.edges.material.color.copy(n.base).lerp(COL.bad, bad);
      n.edges.material.opacity = mixed * 0.95;
      n.core.material.uniforms.uColor.value.copy(n.base).lerp(COL.bad, bad);
      n.core.material.uniforms.uAlpha.value = mixed * (1.0 + 0.8 * bad);
      if (mixed > 0) {
        const { line, dot } = links[i];
        const p = line.geometry.attributes.position;
        p.setXYZ(0, X3[i], 0.9, 0); p.setXYZ(1, VOTER.x, VOTER.y + 0.4, 0); p.needsUpdate = true;
        line.material.color.copy(n.base).lerp(COL.bad, bad);
        line.material.opacity = mixed * 0.4;
        const f = (t * 0.9 + i * 0.21) % 1;
        dot.position.set(lerp(X3[i], VOTER.x, f), lerp(0.9, VOTER.y + 0.4, f), 0);
        dot.material.color.copy(bad ? COL.bad : HDR(1.6, 2.4, 3.0));
        dot.material.opacity = mixed * Math.sin(Math.PI * f);
      }
    });
    // the vote is wrong only when a majority of what is standing there is wrong
    const lost = live > 0 && wrong * 2 > live ? 1 : 0;
    voter.material.color.copy(lost ? COL.bad : COL.good);
    voter.material.opacity = Math.max(act1 * ramp(t, T.hook + 1.2, T.hook + 2.0), mixed) * 0.95;
    voter.rotation.y = t * 0.6;
    voter.scale.setScalar(1 + 0.25 * lost);

    /* --- the flight --- */
    const up = ease.outCubic(ramp(t, T.ariane + 0.6, T.ariane + 4.6));
    const lost2 = t - (T.break + 4.4);                      // seconds since break-up
    const swerve = ease.inOutSine(ramp(t, T.break + 3.0, T.break + 4.4));
    rocket.position.set(0.9 * swerve, lerp(-5.2, -0.2, up) + 0.05 * Math.sin(t * 9), 0);
    rocket.rotation.z = -0.75 * swerve;
    const hull = flying * (lost2 < 0 ? 1 : Math.max(0, 1 - lost2 / 2.4));
    parts.forEach((p, i) => {
      const k = lost2 < 0 ? 0 : 1 - Math.exp(-1.6 * lost2);
      p.g.position.copy(p.home).addScaledVector(p.drift, k);
      p.g.rotation.z = (i % 2 ? 1 : -1) * k * (1.5 + i * 0.3);
      p.fill.material.opacity = hull * 0.92;
      p.edge.material.opacity = hull;
      p.edge.material.color.copy(COL.hull).lerp(COL.bad, ramp(t, T.break + 3.0, T.break + 4.4));
    });
    // the flame, and after the break-up the same points thrown outward
    const burning = flying * ramp(t, T.ariane + 0.2, T.ariane + 0.9);
    const cs = Math.cos(rocket.rotation.z), sn = Math.sin(rocket.rotation.z);
    for (let i = 0; i < fseed.length; i++) {
      const [a, b, c, d] = fseed[i];
      let x, y, z = (c - 0.5) * 0.2;
      if (lost2 < 0) {
        const life = (t * 1.7 + a) % 1;
        const lx = ([-0.33, 0, 0.33][i % 3]) + (b - 0.5) * 0.28 * (0.3 + life), ly = -1.15 - life * (1.6 + 1.4 * d);
        x = rocket.position.x + lx * cs - ly * sn; y = rocket.position.y + lx * sn + ly * cs;
      } else {
        const r = 3.4 * (1 - Math.exp(-1.5 * lost2)) * (0.25 + 0.75 * d), th = a * 6.283;
        x = rocket.position.x + r * Math.cos(th); y = rocket.position.y + r * Math.sin(th) * 0.8 - 0.35 * lost2 * lost2 * b; z = (c - 0.5) * 1.5;
      }
      fpos[i * 3] = x; fpos[i * 3 + 1] = y; fpos[i * 3 + 2] = z;
    }
    flame.geometry.attributes.position.needsUpdate = true;
    flame.material.uniforms.uAlpha.value = burning * (lost2 < 0 ? 1 : Math.max(0, 1.4 - lost2 / 1.8));
    flame.material.uniforms.uPR.value = pr;
    // streaks falling past, so the rocket reads as climbing without leaving the frame
    for (let i = 0; i < sseed.length; i++) {
      const [a, b, c] = sseed[i];
      const fall = (b * 20 - (t - T.ariane) * (3 + 5 * c)) % 20;
      spos[i * 3] = (a - 0.5) * 16; spos[i * 3 + 1] = (fall < 0 ? fall + 20 : fall) - 10; spos[i * 3 + 2] = -4 + c * 3;
    }
    streaks.geometry.attributes.position.needsUpdate = true;
    streaks.material.uniforms.uAlpha.value = 0.7 * flying * up * (lost2 < 0 ? 1 : Math.max(0, 1 - lost2 / 1.5));
    streaks.material.uniforms.uPR.value = pr;

    grade.uniforms.uFade.value = 1 - 0.86 * ramp(t, T.card - 0.2, T.card + 0.8);
    dust.material.uniforms.uTime.value = t;
    dust.material.uniforms.uPR.value = pr;
  },
};

createCinema(film);
