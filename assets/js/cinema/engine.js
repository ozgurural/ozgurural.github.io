/*
 * Cinema engine: the shared stage for the short research films.
 *
 * What a film gets from here:
 *   - a WebGL stage with bloom and a grade pass (vignette, grain), rendered
 *     at the stage's logical size so the mp4 render is pixel exact;
 *   - two cuts from one film: 4:5 for social feeds, 16:9 for wide screens.
 *     The camera keeps its framing and the principal point moves (viewShift),
 *     so the action sits beside the type instead of under it;
 *   - a typography layer over the canvas: timed text that arrives word by word,
 *     labels pinned to points in the scene, and free-form DOM elements;
 *   - a timeline where every property is a function of film time.
 *
 * That last point is the contract. seek(t) must draw exactly the frame for t,
 * with no state carried from the previous frame, because the render seeks
 * frame by frame and a viewer can scrub anywhere. Nothing here reads the
 * clock except the playback loop, and randomness is seeded.
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export { THREE };

/* ------------------------------------------------------------ time helpers */
export const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, u) => a + (b - a) * u;
export const ramp = (t, a, b) => clamp01((t - a) / (b - a));
export const ease = {
  linear: u => u,
  inOutSine: u => 0.5 - 0.5 * Math.cos(Math.PI * u),
  inOutCubic: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  outCubic: u => 1 - Math.pow(1 - u, 3),
  outQuint: u => 1 - Math.pow(1 - u, 5),
  outExpo: u => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)),
  outBack: u => { const c = 1.6; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
};
/* 0 before a, rises over fin, holds, falls over fout ending at b, 0 after. */
export function win(t, a, b, fin = 0.6, fout = 0.6, e = ease.inOutSine) {
  if (t <= a || t >= b) return 0;
  return e(clamp01((t - a) / fin)) * e(clamp01((b - t) / fout));
}
/* Mulberry32: small, fast, and the same sequence on every machine. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
export function mixColor(a, b, u) { return a.clone().lerp(b, clamp01(u)); }

/* ------------------------------------------------------------- the stage */
const ASPECTS = { '4x5': [1080, 1350], '16x9': [1920, 1080] };

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uFade: { value: 1 },
    uVignette: { value: 0.5 },
    uGrain: { value: 0.03 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes;
    uniform float uFade; uniform float uVignette; uniform float uGrain;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
      float v = smoothstep(1.05, 0.2, length(d));
      c.rgb *= mix(1.0 - uVignette, 1.0, v);
      // grain is seeded from film time, so a seeked frame is the same frame
      float g = hash(floor(vUv * uRes) + floor(uTime * 24.0) * 17.0) - 0.5;
      c.rgb += g * uGrain * (0.35 + c.rgb);
      c.rgb *= uFade;
      gl_FragColor = c;
    }`,
};

export function createCinema(film) {
  const params = new URLSearchParams(location.search);
  const renderMode = params.get('render') === '1';
  // a film drawn for one shape says so; otherwise the URL decides, then the window
  const aspect = ASPECTS[film.aspect] ? film.aspect : ASPECTS[params.get('aspect')] ? params.get('aspect')
    : (innerWidth / innerHeight < 1.1 ? '4x5' : '16x9');
  const [W, H] = ASPECTS[aspect];
  const wide = aspect === '16x9';

  const host = document.getElementById('cin-stage');
  const wrap = document.getElementById('cin-wrap');
  if (renderMode) document.documentElement.classList.add('is-render');

  const stage = document.createElement('div');
  stage.className = 'cin cin--' + aspect;
  Object.assign(stage.style, { position: 'relative', width: W + 'px', height: H + 'px',
    transformOrigin: '0 0', overflow: 'hidden', background: '#03050a' });
  host.style.position = 'relative';
  host.appendChild(stage);

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: renderMode,
                                             powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x03050a, 1);
  const canvas = renderer.domElement;
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: W + 'px', height: H + 'px' });
  stage.appendChild(canvas);

  const ui = document.createElement('div');
  ui.className = 'cin__ui';
  Object.assign(ui.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  stage.appendChild(ui);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(film.fov || 35, W / H, 0.1, 400);

  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  // One NaN pixel (GLSL pow of a negative base is undefined, and a rim term
  // can dip just below zero) is blurred across the whole frame by the bloom
  // and turns it black. Scrub them before the bloom sees them.
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: GradeShader.vertexShader,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse; varying vec2 vUv;
      void main() {
        vec4 c = texture2D(tDiffuse, vUv);
        if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
        gl_FragColor = vec4(min(c.rgb, vec3(64.0)), c.a);
      }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.72, 0.45, 0.72);
  composer.addPass(bloom);
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uRes.value.set(W, H);
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  let fit = 1;
  function layout() {
    const box = wrap.getBoundingClientRect();
    fit = renderMode ? 1 : Math.min(box.width / W, box.height / H);
    stage.style.transform = `scale(${fit})`;
    host.style.width = W * fit + 'px';
    host.style.height = H * fit + 'px';
    const pr = renderMode ? 1 : Math.min(2, window.devicePixelRatio || 1) * fit;
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H, false);
    composer.setPixelRatio(pr);
    composer.setSize(W, H);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
  }

  /* ------------------------------------------------------------- text */
  const texts = [];
  const labels = [];
  const css = document.createElement('style');
  css.textContent = `
    .cin__ui .tx { position: absolute; margin: 0; will-change: opacity, transform; }
    .cin__ui .tx .w { display: inline-block; white-space: pre; will-change: opacity, transform, filter; }
    .cin__ui .lb { position: absolute; left: 0; top: 0; white-space: nowrap; will-change: transform, opacity; }
  `;
  document.head.appendChild(css);

  // Wrap every word of every text node in a span, keeping the markup around it,
  // so a coloured phrase still arrives one word at a time.
  function splitWords(el) {
    const words = [];
    const walk = node => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          // Punctuation straight after markup ('<em>trained</em>,') would be a
          // word of its own, and the line could break before it. Attach it to
          // the previous word instead, in the colour it would have had.
          if (parts[0] && /^[,.;:!?)’]/.test(parts[0]) && words.length) {
            const s = document.createElement('span');
            s.textContent = parts.shift();
            s.style.color = getComputedStyle(node).color;
            words[words.length - 1].appendChild(s);
          }
          for (const p of parts) {
            if (!p) continue;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); continue; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = p;
            frag.appendChild(s);
            words.push(s);
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          if (child.classList.contains('nosplit')) { child.classList.add('w'); words.push(child); }
          else walk(child);
        }
      }
    };
    walk(el);
    return words;
  }

  /* A timed piece of type. `place` gives left/top/width per aspect (or one
     object for both); `style` is applied as-is. Words arrive staggered, and the
     whole block leaves together, because a sentence read in reverse is noise. */
  function text(o) {
    const el = document.createElement(o.tag || 'div');
    el.className = 'tx ' + (o.cls || '');
    el.innerHTML = o.html;
    const p = (o.place && (o.place[aspect] || o.place)) || {};
    if (p.x != null) el.style.left = p.x + 'px';
    if (p.y != null) el.style.top = p.y + 'px';
    if (p.w != null) el.style.width = p.w + 'px';
    if (p.align) el.style.textAlign = p.align;
    if (p.anchor === 'center') el.style.transformOrigin = '50% 50%';
    Object.assign(el.style, o.style || {}, (o.styleBy && o.styleBy[aspect]) || {});
    el.style.opacity = '0';
    ui.appendChild(el);
    const item = { el, at: o.at, out: o.out ?? 1e9, dur: o.dur ?? 0.55, stagger: o.stagger ?? 0.055,
                   outDur: o.outDur ?? 0.45, rise: o.rise ?? 16, blur: o.blur ?? 7,
                   words: o.words === false ? null : splitWords(el), shown: false, update: o.update };
    texts.push(item);
    return item;
  }

  function updateText(item, t) {
    const live = t >= item.at - 0.05 && t <= item.out + 0.05;
    if (!live) {
      if (item.shown) { item.el.style.opacity = '0'; item.el.style.visibility = 'hidden'; item.shown = false; }
      return;
    }
    item.el.style.visibility = 'visible';
    item.shown = true;
    const out = 1 - ease.inOutSine(ramp(t, item.out - item.outDur, item.out));
    item.el.style.opacity = String(out);
    if (item.words && item.words.length) {
      item.words.forEach((w, i) => {
        const u = ease.outCubic(ramp(t, item.at + i * item.stagger, item.at + i * item.stagger + item.dur));
        w.style.opacity = String(u);
        w.style.transform = `translateY(${(1 - u) * item.rise}px)`;
        w.style.filter = u >= 1 ? 'none' : `blur(${(1 - u) * item.blur}px)`;
      });
    } else {
      const u = ease.outCubic(ramp(t, item.at, item.at + item.dur));
      item.el.style.opacity = String(u * out);
      item.el.style.transform = `translateY(${(1 - u) * item.rise}px)`;
    }
    if (item.update) item.update(t, item.el);
  }

  /* A label pinned to a point in the scene. `anchor(t)` returns a Vector3 (or
     null to hide), `alpha(t)` its opacity; the box is offset by dx/dy and
     aligned by ax/ay (0 = left/top, 0.5 = centre, 1 = right/bottom). */
  const v3 = new THREE.Vector3();
  function label(o) {
    const el = document.createElement('div');
    el.className = 'lb ' + (o.cls || '');
    el.innerHTML = o.html;
    ui.appendChild(el);
    const item = { el, ...o };
    labels.push(item);
    return item;
  }
  function project(p) {
    v3.copy(p).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H, behind: v3.z > 1 };
  }
  function updateLabel(item, t) {
    const a = item.alpha ? item.alpha(t) : 1;
    const p = a > 0.001 ? item.anchor(t) : null;
    if (!p) { item.el.style.opacity = '0'; item.el.style.visibility = 'hidden'; return; }
    const s = project(p);
    if (s.behind) { item.el.style.opacity = '0'; return; }
    item.el.style.visibility = 'visible';
    item.el.style.opacity = String(a);
    const w = item.el.offsetWidth, h = item.el.offsetHeight;
    const x = s.x + (item.dx || 0) - w * (item.ax ?? 0.5);
    const y = s.y + (item.dy || 0) - h * (item.ay ?? 0.5);
    item.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` + (item.scale ? ` scale(${item.scale(t)})` : '');
    if (item.update) item.update(t, item.el);
  }

  /* --------------------------------------------------------- camera path */
  // keys: [{ t, pos: [x,y,z], look: [x,y,z] }]; eased per segment so the camera
  // settles into each key and leaves it again, never stopping dead.
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  function cameraAt(keys, t, out) {
    let i = 0;
    while (i < keys.length - 1 && t > keys[i + 1].t) i++;
    const k0 = keys[i], k1 = keys[Math.min(i + 1, keys.length - 1)];
    const u = k1 === k0 ? 0 : (k1.ease || ease.inOutSine)(ramp(t, k0.t, k1.t));
    out.pos.set(lerp(k0.pos[0], k1.pos[0], u), lerp(k0.pos[1], k1.pos[1], u), lerp(k0.pos[2], k1.pos[2], u));
    out.look.set(lerp(k0.look[0], k1.look[0], u), lerp(k0.look[1], k1.look[1], u), lerp(k0.look[2], k1.look[2], u));
    return out;
  }

  function setViewShift(sx, sy) {
    // Move the principal point by a fraction of the frame, so the subject sits
    // off centre without the camera having to aim away from it.
    camera.setViewOffset(W, H, -sx * W, -sy * H, W, H);
  }

  /* ------------------------------------------------------------ playback */
  const ctx = { THREE, scene, camera, renderer, bloom, grade, W, H, aspect, wide, ui, stage,
                text, label, project, cameraAt, setViewShift, renderMode };
  film.build(ctx);

  /* Two clocks. `t` is real time, what the viewer and the soundtrack live in.
     A film may be authored on its own clock and supply `warp(t)`, which maps
     real time to authored time (the narration build writes it, stretching a
     scene where its sentence needs longer than the scene was drawn for). The
     picture and the type are drawn at authored time; grain and the progress
     bar follow real time. */
  const warp = film.warp || (x => x);
  let t = 0, playing = false, raf = 0, wall0 = 0, t0 = 0;
  const fill = wrap.querySelector('.cin-bar__fill');
  const bar = wrap.querySelector('.cin-bar');
  const playBtn = wrap.querySelector('[data-act="play"]');
  const soundBtn = wrap.querySelector('.cin-controls [data-act="sound"]');

  // The soundtrack is the master clock while it plays, so a long film cannot
  // drift off its narration. Browsers refuse sound before a gesture, so an
  // autoplay starts muted and says so; any click on the film turns it on.
  let audio = !renderMode && film.audio ? new Audio(film.audio) : null;
  if (audio) audio.preload = 'auto';
  else if (soundBtn) soundBtn.hidden = true;
  // A media element whose audio output fails (MEDIA_ERR_DECODE carrying
  // AUDIO_RENDERER_ERROR, as when an output device goes away mid-play) never
  // plays again, and since this is the film's only soundtrack the rest of the
  // film went silent while the picture ran on the wall clock. The output comes
  // back after a moment (the lab films' playback test showed the next line
  // playing seconds later), so retry on a fresh element with a delay, three
  // times, resuming wherever the film has got to.
  function recoverOnError(el) {
    el.addEventListener('error', () => {
      const tries = el._retries || 0;
      if (tries >= 3) return;
      setTimeout(() => {
        if (audio !== el) return;
        const fresh = new Audio(film.audio);
        fresh.preload = 'auto';
        fresh._retries = tries + 1;
        fresh.muted = el.muted;
        audio = fresh;
        recoverOnError(fresh);
        fresh.addEventListener('loadedmetadata', () => {
          if (audio !== fresh || !playing) return;
          fresh.currentTime = t;
          fresh.play().catch(() => {});
        }, { once: true });
      }, [250, 1000, 2500][tries]);
    }, { once: true });
  }
  if (audio) recoverOnError(audio);
  function setSound(on) {
    if (!audio) return;
    audio.muted = !on;
    wrap.classList.toggle('is-muted', !on);
    if (soundBtn) { soundBtn.innerHTML = on ? '&#128266;' : '&#128263;'; soundBtn.setAttribute('aria-label', on ? 'Mute' : 'Sound on'); }
  }

  function seek(time) {
    t = Math.max(0, Math.min(film.duration, time));
    const a = warp(t);
    film.frame(a, ctx);
    grade.uniforms.uTime.value = t;
    composer.render();
    for (const it of texts) updateText(it, a);
    for (const lb of labels) updateLabel(lb, a);
    if (fill) fill.style.width = (100 * t / film.duration).toFixed(2) + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(100 * t / film.duration)));
    return t;
  }
  function loop(now) {
    const heard = audio && !audio.paused && !audio.ended && audio.readyState >= 2;
    const next = heard ? audio.currentTime : t0 + (now - wall0) / 1000;
    if (next >= film.duration) { seek(film.duration); pause(); return; }
    seek(next);
    raf = requestAnimationFrame(loop);
  }
  function play(fromGesture) {
    if (playing) return;
    if (t >= film.duration - 0.01) t = 0;
    playing = true;
    wrap.classList.remove('is-paused');
    if (playBtn) { playBtn.innerHTML = '&#10074;&#10074;'; playBtn.setAttribute('aria-label', 'Pause'); }
    t0 = t; wall0 = performance.now();
    if (audio) {
      if (fromGesture) setSound(true);
      audio.currentTime = t;
      audio.play().catch(() => { setSound(false); audio.play().catch(() => {}); });
    }
    raf = requestAnimationFrame(loop);
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    if (audio) audio.pause();
    wrap.classList.add('is-paused');
    if (playBtn) { playBtn.innerHTML = '&#9654;'; playBtn.setAttribute('aria-label', 'Play'); }
  }
  function jump(to) {
    seek(to);
    if (playing) { t0 = t; wall0 = performance.now(); if (audio) audio.currentTime = t; }
  }
  const toggle = () => (playing ? pause() : play(true));

  if (!renderMode) {
    wrap.addEventListener('click', e => {
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'replay') { seek(0); pause(); play(true); return; }
      if (act && act.dataset.act === 'sound') { setSound(audio.muted); if (!playing) play(true); return; }
      if (act && act.dataset.act === 'seek') {
        const r = bar.getBoundingClientRect();
        jump(film.duration * clamp01((e.clientX - r.left) / r.width));
        return;
      }
      if (e.target.closest('a')) return;
      // the first click on a muted autoplay means "let me hear it", not "stop"
      if (playing && audio && audio.muted) { setSound(true); return; }
      toggle();
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.code === 'ArrowRight') jump(t + 5);
      else if (e.code === 'ArrowLeft') jump(t - 5);
    });
    addEventListener('resize', () => { layout(); seek(t); });
  }

  layout();
  const ready = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    seek(0);
    if (audio) setSound(false);
    if (!renderMode && params.get('autoplay') !== '0') setTimeout(() => play(false), 500);
  });

  window.CINEMA = { get t() { return t; }, duration: film.duration, aspect, W, H, warp,
                    seek, play, pause, ready, title: film.title, _ctx: ctx, _composer: composer };
  return window.CINEMA;
}
