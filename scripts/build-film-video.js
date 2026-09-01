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
              scene: null, from: null, to: null, crf: 19 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--all') a.all = true;
    else if (k === '--film') { a.film = v; i++; }
    else if (k === '--scene') { a.scene = Number(v); i++; }
    else if (k === '--from') { a.from = Number(v); i++; }
    else if (k === '--to') { a.to = Number(v); i++; }
    else if (k === '--fps') { a.fps = Number(v); i++; }
    else if (k === '--width') { a.width = Number(v); i++; }
    else if (k === '--scale') { a.scale = Number(v); i++; }
    else if (k === '--crf') { a.crf = Number(v); i++; }
  }
  return a;
}

// Hide the player furniture. The poster's play button and the transport are
// controls, not picture, and a rendered video has no use for either.
const CAPTURE_CSS = `
  .labf__poster, .labf__transport, .labf-embed__source { display: none !important; }
  .labf--idle .labf__transport { display: none !important; }
`;
// Nothing here forces a backdrop. An earlier version painted the page black on
// the theory that the film's own edge pixel was black. It is not, it is fully
// transparent, and the grid the stage paints behind the canvas is the film's
// paper. Forcing black threw that away and the rendered films lost their
// ground. Let the embed's own colours stand.

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

async function openFilm(browser, slug, { width, scale }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: Math.round(width * 9 / 16), deviceScaleFactor: scale });
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
             scenes: (f.scenes || []).map(s => ({ name: s.name, start: s.start, dur: s.dur })) };
  });
}

function resolveRange(info, args) {
  if (args.scene != null) {
    const s = info.scenes[args.scene - 1];
    if (!s) throw new Error(`scene ${args.scene} does not exist (film has ${info.scenes.length})`);
    return { from: s.start, to: s.start + s.dur, label: `scene${args.scene}` };
  }
  const from = args.from != null ? args.from : 0;
  const to = args.to != null ? args.to : info.duration;
  const label = (args.from != null || args.to != null)
    ? `${Math.round(from)}-${Math.round(to)}s` : 'full';
  return { from, to, label };
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
    f.seek(from);
    f.play();
    await new Promise(r => setTimeout(r, 300));
    const cap = window.__cap;
    if (!cap || !cap.ctx) throw new Error('no AudioContext was created');
    if (cap.ctx.state === 'suspended') await cap.ctx.resume();

    const rec = new MediaRecorder(cap.tap.stream, { mimeType: 'audio/webm;codecs=opus' });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    const wall0 = performance.now();
    rec.start();
    // Film time is not wall time. The engine holds the picture just short of a
    // narration boundary while the line is still being spoken, so a sentence is
    // never cut off, and that hold is part of what a visitor watches. Sample
    // the mapping every animation frame so the picture pass can reproduce it
    // instead of the sound being stretched to a timeline that never happened.
    const timeline = [];
    let sampler = requestAnimationFrame(function tick(now) {
      timeline.push([(now - wall0) / 1000, f.t]);
      sampler = requestAnimationFrame(tick);
    });
    // follow the film's own clock rather than a wall timer, so a slow frame
    // never shortens the take
    await new Promise(res => {
      const tick = setInterval(() => {
        if (f.t >= to - 0.02 || !f.playing) { clearInterval(tick); res(); }
      }, 100);
    });
    cancelAnimationFrame(sampler);
    const blob = await new Promise(res => { rec.onstop = () => res(new Blob(chunks)); rec.stop(); });
    const wallSpan = (performance.now() - wall0) / 1000;
    timeline.push([wallSpan, f.t]);
    const filmSpan = f.t - from;
    f.pause();
    const b64 = await new Promise(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result.split(',')[1]);
      fr.readAsDataURL(blob);
    });
    return { b64, wallSpan, filmSpan, timeline };
  }, range.from, range.to);

  await page.close();
  const file = path.join(os.tmpdir(), `labfilm-${slug}-${range.label}-${Date.now()}.webm`);
  fs.writeFileSync(file, Buffer.from(out.b64, 'base64'));
  // Nothing is stretched. An earlier version resampled the mix to the film's
  // own duration, on the assumption that the gap between wall time and film
  // time was jank; most of it is the narration hold, which is deliberate and
  // is what the site plays. On a 153s film that would have been an 11.65%
  // speed-up of a recording that was already correct. The picture follows this
  // timeline instead, so the two agree by construction.
  const ratio = out.wallSpan / out.filmSpan;
  return { file, ratio, wallSpan: out.wallSpan, filmSpan: out.filmSpan,
           timeline: out.timeline };
}

async function renderVideo(browser, slug, range, audio, args) {
  const page = await openFilm(browser, slug, args);
  await page.addStyleTag({ content: CAPTURE_CSS });
  await page.evaluate(() => {
    const p = document.querySelector('.labf__poster');
    if (p) p.remove();                                  // it also swallows clicks
  });

  const outFile = path.join(OUT_DIR,
    `${slug}${range.label === 'full' ? '' : '-' + range.label}-${args.width * args.scale}p.mp4`);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const ff = spawn(ffmpeg, [
    '-y',
    '-f', 'image2pipe', '-framerate', String(args.fps), '-i', 'pipe:0',
    '-i', audio.file,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', String(args.crf),
    '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
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

  // One frame per wall-clock tick of the take, with film time read off the
  // recorded mapping. Where the film held for a narration line the mapping is
  // flat, so consecutive frames repeat and the picture holds exactly as it does
  // on the page.
  const tl = audio.timeline && audio.timeline.length > 1 ? audio.timeline : null;
  const span = tl ? audio.wallSpan : (range.to - range.from);
  const total = Math.round(span * args.fps);
  let k = 0;
  const filmTimeAt = (w) => {
    if (!tl) return range.from + w;
    while (k < tl.length - 2 && tl[k + 1][0] < w) k++;
    const a0 = tl[k], a1 = tl[k + 1] || a0;
    const dw = a1[0] - a0[0];
    const u = dw > 1e-9 ? Math.max(0, Math.min(1, (w - a0[0]) / dw)) : 0;
    return a0[1] + (a1[1] - a0[1]) * u;
  };
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = filmTimeAt(i / args.fps);
    await page.evaluate((tt) => {
      const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
      f.seek(tt);
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

function probe(file) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-f', 'null', '-'],
                      { encoding: 'utf8' });
  return (r.stderr || r.stdout || '').toString();
}

/* Decode the whole thing before calling it done. A render that is interrupted
   leaves an mp4 with no moov atom: the file is there, it is a plausible size,
   and it is unplayable. That happened once and I caught it by hand, which is
   not a process. Checks that it decodes, that both tracks are present, that
   the length matches what was asked for, and that the sound is not silence. */
function verify(file, expectedSeconds) {
  const out = probe(file);
  const problems = [];
  if (/moov atom not found|Invalid data found|Error opening input/.test(out)) {
    problems.push('the file does not decode (truncated render?)');
    return problems;
  }
  const dur = out.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  const seconds = dur ? (+dur[1] * 3600 + +dur[2] * 60 + +dur[3]) : 0;
  if (!seconds) problems.push('no duration in the container');
  else if (Math.abs(seconds - expectedSeconds) > 1.0) {
    problems.push(`duration is ${seconds.toFixed(2)}s, expected about ${expectedSeconds.toFixed(2)}s`);
  }
  if (!/Video: h264/.test(out)) problems.push('no h264 video track');
  if (!/Audio: aac/.test(out)) problems.push('no aac audio track');

  const vol = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'],
                        { encoding: 'utf8' });
  const mean = (vol.stderr || '').match(/mean_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  if (!mean) problems.push('could not measure the audio');
  else if (Number(mean[1]) < -60) problems.push(`the audio is silent (${mean[1]} dB)`);
  return problems;
}

// Is there already a finished render of this film at these settings?
function existingGood(slug, args) {
  const f = path.join(OUT_DIR, slug + '-' + Math.round(args.width * args.scale) + 'p.mp4');
  if (!fs.existsSync(f)) return null;
  try {
    const info = probe(f);
    const m = /Duration: (\d\d):(\d\d):(\d\d\.\d\d)/.exec(info);
    if (!m || !/Video: h264/.test(info) || !/Audio: aac/.test(info)) return null;
    const secs = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    return (fs.statSync(f).size / 1e6).toFixed(1) + ' MB, ' + secs.toFixed(1) + 's';
  } catch (err) { return null; }
}

(async () => {
  const args = parseArgs(process.argv);
  const targets = args.all ? FILMS : [args.film];
  if (!targets[0]) {
    console.error('usage: --film <slug> [--scene N | --from S --to S] [--fps 30] [--all]');
    console.error('films: ' + FILMS.join(', '));
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    // The audio pass plays the film in real time inside a single evaluate, and
    // puppeteer aborts any one call after 180s by default. That is longer than
    // a scene and shorter than every film, which is why clips rendered and
    // whole films died on the first one. An hour clears the longest film with
    // room for the machine having a bad minute.
    protocolTimeout: 3600000,
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--font-render-hinting=none', '--disable-lcd-text'],
  });

  const made = [];
  const failed = [];
  try {
    for (const slug of targets) {
      // Resume. A full run is hours long, so it will be interrupted, and the
      // only sane thing on restart is to skip what is already on disk and
      // sound. existingGood applies the same check the render itself has to
      // pass, so a file that survives it is finished, not truncated.
      if (args.all) {
        const done = existingGood(slug, args);
        if (done) { console.log('\n' + slug + '  already rendered, skipping (' + done + ')'); continue; }
      }
      const page = await openFilm(browser, slug, args);
      const info = await filmInfo(page);
      await page.close();
      const range = resolveRange(info, args);

      console.log(`\n${slug}  (${info.duration}s, ${info.scenes.length} scenes)  ->  ${range.label} ` +
                  `${(range.to - range.from).toFixed(1)}s`);
      console.log('  recording audio in real time...');
      const audio = await recordAudio(browser, slug, range, args);
      // The take is longer than the film's nominal duration because the engine
      // holds the picture while a narration line finishes. That is not drift to
      // be corrected, it is the film, and the picture follows the same timeline.
      const heldFor = audio.wallSpan - audio.filmSpan;
      console.log(`  ${audio.wallSpan.toFixed(1)}s of sound for ${audio.filmSpan.toFixed(1)}s ` +
                  `of film: held ${heldFor.toFixed(1)}s for narration ` +
                  `(${((audio.ratio - 1) * 100).toFixed(1)}%)`);
      if (audio.ratio > 1.35) {
        console.warn('  WARNING: that is a lot of holding. Either the narration badly ' +
                     'overruns its scenes or something stalled; check this one before posting.');
      }
      console.log('  rendering frames...');
      const mp4 = await renderVideo(browser, slug, range, audio, args);
      fs.unlinkSync(audio.file);
      const size = (fs.statSync(mp4).size / 1e6).toFixed(1);
      const problems = verify(mp4, audio.wallSpan);
      if (problems.length) {
        console.error(`  UNUSABLE: ${path.relative(ROOT, mp4)}`);
        problems.forEach(p => console.error('    - ' + p));
        // Delete it, so a re-run retries this film instead of resuming past a
        // broken file, and carry on: one bad render must not cost the other ten.
        try { fs.unlinkSync(mp4); } catch (err) {}
        failed.push(slug + ': ' + problems[0]);
        if (!args.all) throw new Error('render did not verify: ' + problems[0]);
        continue;
      }
      console.log(`  ${path.relative(ROOT, mp4)}  ${size} MB  verified`);
      made.push(mp4);
    }
  } finally {
    await browser.close();
  }

  console.log('\ndone:');
  if (failed.length) {
    console.error('\n' + failed.length + ' film(s) did not render:');
    failed.forEach(f => console.error('  - ' + f));
  }
  for (const m of made) {
    const info = probe(m);
    const line = info.split('\n').filter(l => /Duration|Stream #/.test(l)).map(s => s.trim()).join('\n    ');
    console.log('  ' + path.relative(ROOT, m) + '\n    ' + line);
  }
})().catch(e => { console.error('\nFAILED:', e.message); process.exit(1); });
