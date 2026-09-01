#!/usr/bin/env node
/**
 * Render a lab film to an mp4, so it can be uploaded natively to LinkedIn or X.
 * Neither of those will play an embedded player from this domain, and a native
 * upload is the only thing they do play inline, so the file is the product.
 *
 *   node scripts/build-film-video.js --film watermarking-comparison
 *   node scripts/build-film-video.js --film block-race --scene 3
 *   node scripts/build-film-video.js --film determinism --from 12 --to 75
 *   node scripts/build-film-video.js --all
 *
 * Two passes, because the two halves have opposite requirements.
 *
 * Picture: deterministic. film.seek(t) is a pure function of t, so every frame
 * is rendered by seeking and screenshotting. Nothing depends on wall-clock
 * timing, which means no dropped frames and no jitter no matter how slow the
 * machine is. Frames are piped straight into ffmpeg rather than written out.
 *
 * Sound: real time, because it cannot be anything else. The score is
 * synthesised into an AudioContext as the film plays and the narration is
 * plain Audio elements outside that graph, so the pass routes the narration in
 * through createMediaElementSource, taps everything that reaches the
 * destination, and records the lot. Recording in real time also keeps the
 * music's ducking under the voice, which is driven by playback.
 */
const puppeteer = require('puppeteer');
const { spawn, spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const os = require('os');
const SOCIAL_CUTS = require('./film-social-cuts.json');
const NARRATION = require('./narration.json');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', 'video');
const BASE = process.env.FILM_BASE_URL || 'http://localhost:4000';

const FILMS = [
  'blockchain-ml', 'cyber-events', 'determinism', 'gradient-pinball',
  'universal-jira', 'oracles', 'training-fingerprint', 'block-race',
  'redundancy-reactor', 'watermarking-comparison', 'model-heist',
];

function parseArgs(argv) {
  const a = { fps: 30, width: 1280, scale: 1.5, film: null, all: false,
              scene: null, from: null, to: null, crf: 19,
              linkedin: false, preview: false };
  let widthSet = false, scaleSet = false;
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--all') a.all = true;
    else if (k === '--film') { a.film = v; i++; }
    else if (k === '--scene') { a.scene = Number(v); i++; }
    else if (k === '--from') { a.from = Number(v); i++; }
    else if (k === '--to') { a.to = Number(v); i++; }
    else if (k === '--fps') { a.fps = Number(v); i++; }
    else if (k === '--width') { a.width = Number(v); widthSet = true; i++; }
    else if (k === '--scale') { a.scale = Number(v); scaleSet = true; i++; }
    else if (k === '--crf') { a.crf = Number(v); i++; }
    else if (k === '--linkedin') a.linkedin = true;
    else if (k === '--preview') a.preview = true;
  }
  if (a.linkedin) {
    if (!widthSet) a.width = 1080;
    if (!scaleSet) a.scale = 1;
  }
  return a;
}

// Hide the player furniture. The poster's play button and the transport are
// controls, not picture, and a rendered video has no use for either.
const CAPTURE_CSS = `
  .labf__poster, .labf__transport, .labf-embed__source { display: none !important; }
  .labf--idle .labf__transport { display: none !important; }
  html, body { background: #000 !important; }
`;

// A 4:5 native feed edition. The original 16:9 stage remains intact and is
// given real breathing room rather than cropped. Its narration is repeated in
// large type below the picture so the result is legible with sound off on a
// phone, while the 60px side margin keeps authored ink away from LinkedIn UI.
const SOCIAL_CAPTURE_CSS = `
  html, body { width: 100% !important; height: 100% !important; overflow: hidden !important; }
  body.labf-social-capture {
    display: grid !important;
    grid-template-rows: 16.3% 40% 28.9% 14.8%;
    justify-items: center;
    align-items: stretch;
    background:
      radial-gradient(circle at 82% 8%, rgba(88,196,221,0.13), transparent 30%),
      radial-gradient(circle at 12% 90%, rgba(129,92,246,0.10), transparent 34%),
      #070b16 !important;
    color: #f1f5f9;
    font-family: var(--ds-font-sans, Inter, system-ui, sans-serif);
  }
  body.labf-social-capture .labf-social__hook {
    width: 88.889%;
    box-sizing: border-box;
    padding: 4.25% 3.2% 1.5%;
    align-self: stretch;
  }
  .labf-social__eyebrow {
    color: #58c4dd;
    font-family: var(--ds-font-mono, monospace);
    font-size: 2.05vw;
    font-weight: 700;
    letter-spacing: 0.14em;
    line-height: 1.2;
    text-transform: uppercase;
  }
  .labf-social__headline {
    margin-top: 1.6%;
    max-width: 94%;
    color: #ffffff;
    font-family: var(--ds-font-display, Georgia, serif);
    font-size: 4.45vw;
    font-weight: 600;
    letter-spacing: -0.018em;
    line-height: 1.08;
  }
  body.labf-social-capture .labf-embed__stage {
    width: 88.889% !important;
    height: 100% !important;
    min-height: 0 !important;
    align-self: center;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(148,163,184,0.22), 0 24px 80px rgba(0,0,0,0.35);
  }
  body.labf-social-capture .labf {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
  }
  body.labf-social-capture .labf__lower,
  body.labf-social-capture .labf__lower * { color: transparent !important; }
  .labf-social__caption {
    width: 88.889%;
    box-sizing: border-box;
    padding: 4.1% 3.5% 2.2%;
    color: #e8eef9;
    font-family: var(--ds-font-serif, Georgia, serif);
    font-size: 3.05vw;
    font-weight: 500;
    line-height: 1.27;
  }
  .labf-social__caption strong { color: #ffffff; font-weight: 700; }
  .labf-social__footer {
    position: relative;
    width: 88.889%;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4%;
    align-items: center;
    padding: 1.2% 3.5% 5.6%;
    border-top: 1px solid rgba(148,163,184,0.18);
  }
  .labf-social__author { color: #f8fafc; font-size: 2.25vw; font-weight: 700; }
  .labf-social__topic { margin-top: 0.35em; color: #9fb2d4; font-size: 1.65vw; }
  .labf-social__cta { color: #58c4dd; font-size: 1.7vw; font-weight: 700; text-align: right; }
  .labf-social__url { margin-top: 0.35em; color: #dbeafe; font-size: 1.55vw; font-weight: 500; }
  .labf-social__progress {
    position: absolute;
    left: 0; top: -2px;
    height: 3px;
    width: 0;
    background: linear-gradient(90deg, #58c4dd, #818cf8);
  }
`;

const AUDIO_PATCH = () => {
  window.__cap = { ctx: null, tap: null, tapGain: null, routed: 0 };
  const AC = window.AudioContext;
  window.AudioContext = function (...a) {
    const c = new AC(...a);
    if (!window.__cap.ctx) {
      window.__cap.ctx = c;
      window.__cap.tap = c.createMediaStreamDestination();
      window.__cap.tapGain = c.createGain();
      window.__cap.tapGain.connect(window.__cap.tap);
    }
    return c;
  };
  window.AudioContext.prototype = AC.prototype;

  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = origConnect.call(this, dest, ...rest);
    try {
      if (window.__cap.tapGain && dest instanceof AudioDestinationNode) {
        origConnect.call(this, window.__cap.tapGain);
      }
    } catch (e) {}
    return r;
  };

  // narration lives in HTMLAudioElements, which never touch the graph
  const OrigAudio = window.Audio;
  window.Audio = function (src) {
    const el = new OrigAudio(src);
    el.crossOrigin = 'anonymous';
    el.addEventListener('play', () => {
      try {
        const c = window.__cap.ctx;
        if (!c || el.__wired) return;
        el.__wired = true;
        const s = c.createMediaElementSource(el);
        s.connect(window.__cap.tapGain);
        s.connect(c.destination);
        window.__cap.routed++;
      } catch (e) {}
    });
    return el;
  };
};

async function openFilm(browser, slug, { width, scale, linkedin }) {
  const page = await browser.newPage();
  const height = linkedin ? Math.round(width * 5 / 4) : Math.round(width * 9 / 16);
  await page.setViewport({ width, height, deviceScaleFactor: scale });
  const url = `${BASE}/lab/${slug}/embed/`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  return page;
}

async function filmInfo(page) {
  return page.evaluate(() => {
    const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    return { duration: f.duration,
             scenes: (f.scenes || []).map(s => ({ name: s.name, start: s.start, dur: s.dur })),
             audio: (f._audioCues || []).map(cue => ({ id: cue.id, at: cue.at })) };
  });
}

function resolveRange(info, args, social) {
  if (args.scene != null) {
    const s = info.scenes[args.scene - 1];
    if (!s) throw new Error(`scene ${args.scene} does not exist (film has ${info.scenes.length})`);
    return { from: s.start, to: s.start + s.dur, label: `scene${args.scene}` };
  }
  if (args.linkedin && args.from == null && args.to == null) {
    if (!social) throw new Error('no LinkedIn cut is configured for this film');
    return { from: social.from, to: social.to, label: 'linkedin' };
  }
  const from = args.from != null ? args.from : 0;
  const to = args.to != null ? args.to : info.duration;
  const label = (args.from != null || args.to != null)
    ? `${Math.round(from)}-${Math.round(to)}s` : 'full';
  return { from, to, label };
}

async function setupSocialFrame(page, slug, social, range) {
  await page.addStyleTag({ content: SOCIAL_CAPTURE_CSS });
  await page.evaluate((filmSlug, meta, clip) => {
    const body = document.body;
    const stage = document.querySelector('.labf-embed__stage');
    body.classList.add('labf-social-capture');

    const hook = document.createElement('header');
    hook.className = 'labf-social__hook';
    hook.innerHTML = '<div class="labf-social__eyebrow"></div><div class="labf-social__headline"></div>';
    hook.querySelector('.labf-social__eyebrow').textContent = meta.eyebrow;
    hook.querySelector('.labf-social__headline').textContent = meta.hook;

    const caption = document.createElement('section');
    caption.className = 'labf-social__caption';
    caption.setAttribute('aria-live', 'off');
    caption.textContent = meta.hook;

    const footer = document.createElement('footer');
    footer.className = 'labf-social__footer';
    footer.innerHTML =
      '<div class="labf-social__progress"></div>' +
      '<div><div class="labf-social__author">Dr. Ozgur Ural</div>' +
      '<div class="labf-social__topic"></div></div>' +
      '<div><div class="labf-social__cta">FULL CITED FILM + SOURCES</div>' +
      '<div class="labf-social__url"></div></div>';
    footer.querySelector('.labf-social__topic').textContent = meta.title;
    footer.querySelector('.labf-social__url').textContent = 'ozgurural.github.io/lab/' + filmSlug + '/';

    stage.parentNode.insertBefore(hook, stage);
    stage.insertAdjacentElement('afterend', caption);
    caption.insertAdjacentElement('afterend', footer);

    function visible(element, stop) {
      for (let node = element; node && node !== stop; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.02) return false;
      }
      return true;
    }

    window.__updateSocialFrame = function (t) {
      const lower = Array.from(document.querySelectorAll('.labf__lower'))
        .find(node => visible(node, stage));
      caption.innerHTML = lower && lower.textContent.trim() ? lower.innerHTML : meta.hook;
      const progress = Math.max(0, Math.min(1, (t - clip.from) / (clip.to - clip.from)));
      footer.querySelector('.labf-social__progress').style.width = (progress * 100) + '%';
      footer.classList.toggle('is-ending', progress > 0.90);
    };

    const film = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    window.dispatchEvent(new Event('resize'));
    if (film && film._fitCanvas) film._fitCanvas();
    if (film) film.render();
    window.__updateSocialFrame(clip.from);
  }, slug, social, range);
  await new Promise(resolve => setTimeout(resolve, 120));
}

async function recordAudio(browser, slug, range, opts) {
  const page = await browser.newPage();
  await page.setViewport({ width: 640, height: 360 });          // audio pass: picture is irrelevant
  await page.evaluateOnNewDocument(AUDIO_PATCH);
  await page.goto(`${BASE}/lab/${slug}/embed/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });

  const out = await page.evaluate(async (from, to) => {
    const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    // Warm the page and audio graph before the take, then return to the exact
    // requested frame. Recording used to start after this 300 ms advance while
    // the measured film span still began at `from`, which built a permanent
    // offset into every correction ratio.
    f.seek(from);
    f.play();
    await new Promise(r => setTimeout(r, 300));
    const cap = window.__cap;
    if (!cap || !cap.ctx) throw new Error('no AudioContext was created');
    if (cap.ctx.state === 'suspended') await cap.ctx.resume();
    f.pause();
    f.seek(from);

    const rec = new MediaRecorder(cap.tap.stream, { mimeType: 'audio/webm;codecs=opus' });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    await new Promise((res, rej) => {
      rec.onstart = res;
      rec.onerror = e => rej(e.error || new Error('audio recorder failed to start'));
      rec.start();
    });
    const wall0 = performance.now();
    f.play();
    // follow the film's own clock rather than a wall timer, so a slow frame
    // never shortens the take
    await new Promise(res => {
      const tick = setInterval(() => {
        if (f.t >= to - 0.02 || !f.playing) { clearInterval(tick); res(); }
      }, 100);
    });
    const wallSpan = (performance.now() - wall0) / 1000;
    const filmSpan = to - from;
    f.pause();
    const blob = await new Promise(res => { rec.onstop = () => res(new Blob(chunks)); rec.stop(); });
    const b64 = await new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result.split(',')[1]);
      fr.readAsDataURL(blob);
    });
    return { b64, wallSpan, filmSpan };
  }, range.from, range.to);

  await page.close();
  const file = path.join(os.tmpdir(), `labfilm-${slug}-${range.label}-${Date.now()}.webm`);
  fs.writeFileSync(file, Buffer.from(out.b64, 'base64'));
  // The picture is rendered from film time and the sound was recorded in wall
  // time, and the engine clamps its frame delta at 0.1s, so any stall leaves
  // film time behind the clock: measured around 0.6s lost per 21s here, in a
  // handful of hitches that no amount of warming up or pre-decoding removed.
  // Left alone the narration would slide later and later against the picture.
  // The exact ratio is known, so the mix is stretched to the picture's length.
  const ratio = out.wallSpan / out.filmSpan;
  return { file, ratio, wallSpan: out.wallSpan, filmSpan: out.filmSpan };
}

async function renderVideo(browser, slug, range, audio, args) {
  const page = await openFilm(browser, slug, args);
  await page.addStyleTag({ content: CAPTURE_CSS });
  if (args.linkedin) await setupSocialFrame(page, slug, args.social, range);
  await page.evaluate(() => {
    const p = document.querySelector('.labf__poster');
    if (p) p.remove();                                  // it also swallows clicks
  });

  const pixelWidth = args.width * args.scale;
  const pixelHeight = Math.round((args.linkedin ? args.width * 5 / 4 : args.width * 9 / 16) * args.scale);
  const outName = args.linkedin
    ? `${slug}-linkedin-${pixelWidth}x${pixelHeight}.mp4`
    : `${slug}${range.label === 'full' ? '' : '-' + range.label}-${pixelWidth}p.mp4`;
  const outFile = path.join(OUT_DIR, outName);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ff = spawn(ffmpeg, [
    '-y',
    '-f', 'image2pipe', '-framerate', String(args.fps), '-i', 'pipe:0',
    '-i', audio.file,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', String(args.crf),
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-filter:a', `atempo=${audio.ratio.toFixed(6)},loudnorm=I=-16:TP=-1.5:LRA=11`,
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart',
    '-shortest',
    outFile,
  ], { stdio: ['pipe', 'ignore', 'pipe'] });
  let ffErr = '';
  ff.stderr.on('data', d => { ffErr += d.toString(); });
  // ffmpeg closing its stdin races the last frame writes, and an unhandled
  // error event on the pipe takes the whole process down after a perfectly
  // good file has already been written
  let piped = true;
  ff.stdin.on('error', () => { piped = false; });

  const total = Math.round((range.to - range.from) * args.fps);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = range.from + i / args.fps;
    await page.evaluate((tt) => {
      const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
      f.seek(tt);
      if (window.__updateSocialFrame) window.__updateSocialFrame(tt);
    }, t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95, optimizeForSpeed: true });
    if (!piped || !ff.stdin.writable) break;
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0 || i === total - 1) {
      const done = i + 1;
      const rate = done / ((Date.now() - t0) / 1000);
      const eta = Math.round((total - done) / Math.max(rate, 0.01));
      process.stdout.write(
        `\r  ${slug} ${range.label}: ${done}/${total} frames  ${rate.toFixed(1)} fps  eta ${eta}s   `);
    }
  }
  if (ff.stdin.writable) ff.stdin.end();
  await new Promise((res, rej) => {
    ff.on('close', code => code === 0 ? res() : rej(new Error('ffmpeg exited ' + code + '\n' + ffErr.slice(-800))));
  });
  process.stdout.write('\n');
  await page.close();
  return outFile;
}

async function renderLinkedInPreviews(browser, slug, range, args) {
  const page = await openFilm(browser, slug, args);
  await page.addStyleTag({ content: CAPTURE_CSS });
  await setupSocialFrame(page, slug, args.social, range);
  await page.evaluate(() => {
    const poster = document.querySelector('.labf__poster');
    if (poster) poster.remove();
  });

  const previewDir = path.join(OUT_DIR, 'previews');
  fs.mkdirSync(previewDir, { recursive: true });
  const samples = [
    ['start', Math.min(range.to - 0.1, range.from + 1.5)],
    ['middle', (range.from + range.to) / 2],
    ['end', Math.max(range.from, range.to - 1.5)],
  ];
  const made = [];
  for (const [label, t] of samples) {
    await page.evaluate(tt => {
      const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
      f.seek(tt);
      if (window.__updateSocialFrame) window.__updateSocialFrame(tt);
    }, t);
    const file = path.join(previewDir, `${slug}-linkedin-${label}.jpg`);
    await page.screenshot({ path: file, type: 'jpeg', quality: 94 });
    made.push(file);
  }
  await page.close();
  return made;
}

function srtTime(seconds) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const rest = ms % 1000;
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':') + ',' + String(rest).padStart(3, '0');
}

function narrationForCue(id) {
  const match = /^(.+)_(\d+)$/.exec(id || '');
  if (!match) return '';
  const lines = NARRATION[match[1]];
  return lines && lines[Number(match[2])] ? lines[Number(match[2])] : '';
}

function writeLinkedInAssets(mp4, slug, info, range, social) {
  const stem = mp4.replace(/\.mp4$/i, '');
  const cues = info.audio || [];
  const active = cues.filter(cue => cue.at >= range.from && cue.at < range.to);
  const blocks = [];
  active.forEach((cue, i) => {
    const text = narrationForCue(cue.id);
    if (!text) return;
    const next = cues.find(candidate => candidate.at > cue.at);
    const start = cue.at - range.from;
    const end = Math.max(start + 0.8, Math.min(range.to, next ? next.at - 0.08 : range.to) - range.from);
    blocks.push(`${i + 1}\n${srtTime(start)} --> ${srtTime(end)}\n${text}\n`);
  });
  fs.writeFileSync(stem + '.srt', blocks.join('\n'), 'utf8');

  const pageUrl = `https://ozgurural.github.io/lab/${slug}/`;
  const shareCopy = [
    'POST COPY',
    '',
    social.post,
    '',
    'FIRST COMMENT',
    '',
    `Full cited film, equations, and sources: ${pageUrl}`,
    '',
    'UPLOAD',
    '',
    `Video: ${path.basename(mp4)}`,
    `Captions: ${path.basename(stem + '.srt')}`,
  ].join('\n');
  fs.writeFileSync(stem + '.txt', shareCopy + '\n', 'utf8');
  return [stem + '.srt', stem + '.txt'];
}

function probe(file) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-f', 'null', '-'],
                      { encoding: 'utf8' });
  return (r.stderr || r.stdout || '').toString();
}

(async () => {
  const args = parseArgs(process.argv);
  const targets = args.all ? FILMS : [args.film];
  if (!targets[0]) {
    console.error('usage: --film <slug> [--scene N | --from S --to S] [--linkedin] [--preview] [--fps 30] [--all]');
    console.error('films: ' + FILMS.join(', '));
    process.exit(1);
  }
  if (args.preview && !args.linkedin) {
    throw new Error('--preview currently requires --linkedin');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--font-render-hinting=none', '--disable-lcd-text'],
  });

  const made = [];
  try {
    for (const slug of targets) {
      const social = args.linkedin ? SOCIAL_CUTS[slug] : null;
      if (args.linkedin && !social) throw new Error(`no LinkedIn cut configured for ${slug}`);
      const renderArgs = { ...args, social };
      const page = await openFilm(browser, slug, args);
      const info = await filmInfo(page);
      await page.close();
      const range = resolveRange(info, args, social);
      if (!(range.from >= 0 && range.to <= info.duration && range.to > range.from)) {
        throw new Error(`invalid range ${range.from}-${range.to} for ${slug} (${info.duration}s)`);
      }

      console.log(`\n${slug}  (${info.duration}s, ${info.scenes.length} scenes)  ->  ${range.label} ` +
                  `${(range.to - range.from).toFixed(1)}s`);
      if (args.preview) {
        const previews = await renderLinkedInPreviews(browser, slug, range, renderArgs);
        previews.forEach(file => console.log('  ' + path.relative(ROOT, file)));
        made.push(...previews);
        continue;
      }
      console.log('  recording audio in real time...');
      const audio = await recordAudio(browser, slug, range, args);
      const slipPct = ((audio.ratio - 1) * 100).toFixed(2);
      console.log(`  captured ${audio.wallSpan.toFixed(2)}s of sound for ` +
                  `${audio.filmSpan.toFixed(2)}s of film, correcting by ${slipPct}%`);
      if (audio.ratio > 1.10 || audio.ratio < 0.95) {
        console.warn('  WARNING: that is a big correction and will be audible. ' +
                     'Something stalled badly; re-run before posting this one.');
      }
      console.log('  rendering frames...');
      const mp4 = await renderVideo(browser, slug, range, audio, renderArgs);
      fs.unlinkSync(audio.file);
      const size = (fs.statSync(mp4).size / 1e6).toFixed(1);
      console.log(`  ${path.relative(ROOT, mp4)}  ${size} MB`);
      if (args.linkedin) {
        for (const asset of writeLinkedInAssets(mp4, slug, info, range, social)) {
          console.log(`  ${path.relative(ROOT, asset)}`);
        }
      }
      made.push(mp4);
    }
  } finally {
    await browser.close();
  }

  console.log('\ndone:');
  for (const m of made) {
    if (!/\.mp4$/i.test(m)) {
      console.log('  ' + path.relative(ROOT, m));
      continue;
    }
    const info = probe(m);
    const line = info.split('\n').filter(l => /Duration|Stream #/.test(l)).map(s => s.trim()).join('\n    ');
    console.log('  ' + path.relative(ROOT, m) + '\n    ' + line);
  }
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
