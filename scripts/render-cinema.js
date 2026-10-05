#!/usr/bin/env node
/*
 * Render a cinema film (the short WebGL films under /films/) to mp4, or pull
 * single frames out of it as PNG for review.
 *
 *   node scripts/render-cinema.js --film securepol --aspect 4x5
 *   node scripts/render-cinema.js --film securepol --aspect 4x5 --music dist/music/track.mp3
 *   node scripts/render-cinema.js --film securepol --aspect 4x5 --music dist/music/track.mp3 --mux-only
 *   node scripts/render-cinema.js --film securepol --aspect 4x5 --frames 0,6,20.5 --out dir
 *
 * Picture: every frame is CINEMA.seek(t) followed by a screenshot, so the
 * render never drops or stretches a frame however slow the machine is. It
 * always writes a silent <film>-film-<aspect>.mp4 first.
 *
 * Sound: the films have no narration, so sound is one music file laid under
 * the picture: cut from --music-offset, faded in and out, and brought to
 * --loudness LUFS with a two-pass loudnorm (a single pass is dynamic and makes
 * music pump). That writes <film>-film-<aspect>-music.mp4 beside the silent
 * one, copying the video stream, so --mux-only can retry the music without
 * rendering a frame. Keep licensed music in dist/ (gitignored): stock music
 * licences allow it inside a video, not hosted on its own.
 *
 * The dev server must be running for anything but --mux-only.
 */
const puppeteer = require('puppeteer');
const { spawn, spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.FILM_BASE_URL || 'http://localhost:4000';

function args(argv) {
  const a = { film: null, aspect: '4x5', fps: 30, crf: 17, frames: null, out: null, music: null,
              musicOffset: 0, loudness: -15, fadeIn: 0.8, fadeOut: 3.5, muxOnly: false, from: 0, to: null };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--film') { a.film = v; i++; }
    else if (k === '--aspect') { a.aspect = v; i++; }
    else if (k === '--fps') { a.fps = Number(v); i++; }
    else if (k === '--crf') { a.crf = Number(v); i++; }
    else if (k === '--frames') { a.frames = v.split(',').map(Number); i++; }
    else if (k === '--out') { a.out = v; i++; }
    else if (k === '--music') { a.music = v; i++; }
    else if (k === '--music-offset') { a.musicOffset = Number(v); i++; }
    else if (k === '--loudness') { a.loudness = Number(v); i++; }
    else if (k === '--fade-out') { a.fadeOut = Number(v); i++; }
    else if (k === '--mux-only') a.muxOnly = true;
    else if (k === '--from') { a.from = Number(v); i++; }
    else if (k === '--to') { a.to = Number(v); i++; }
  }
  if (!a.film) throw new Error('--film is required');
  if (a.muxOnly && !a.music) throw new Error('--mux-only needs --music');
  return a;
}

function run(argv) {
  const r = spawnSync(ffmpeg, argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error('ffmpeg failed'); }
  return r.stderr;
}
const probe = file => run(['-hide_banner', '-i', file, '-f', 'null', '-t', '0', '-'])
  .split('\n').filter(l => /Duration|Stream #/.test(l)).join('\n');
function durationOf(file) {
  const m = run(['-hide_banner', '-i', file, '-f', 'null', '-t', '0', '-']).match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
}

/* Lay the music under a silent render. Pass one measures the faded excerpt,
   pass two applies loudnorm in linear mode with those measurements, which is
   a fixed gain plus a true-peak limit rather than a compressor. */
function mux(silent, a) {
  const len = durationOf(silent);
  const out = silent.replace(/\.mp4$/, '-music.mp4');
  const fades = `afade=t=in:st=0:d=${a.fadeIn},afade=t=out:st=${(len - a.fadeOut).toFixed(3)}:d=${a.fadeOut}`;
  const target = `I=${a.loudness}:TP=-1.5:LRA=11`;
  const cut = ['-ss', String(a.musicOffset), '-t', len.toFixed(3), '-i', a.music];
  const measured = run(['-hide_banner', ...cut, '-af', `${fades},loudnorm=${target}:print_format=json`, '-f', 'null', '-']);
  const j = JSON.parse(measured.slice(measured.lastIndexOf('{'), measured.lastIndexOf('}') + 1));
  const second = `${fades},loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}` +
                 `:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
  run(['-y', '-hide_banner', '-i', silent, ...cut, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
       '-af', second, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out]);
  const check = run(['-hide_banner', '-i', out, '-af', 'ebur128=peak=true', '-vn', '-f', 'null', '-']);
  const I = (check.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/) || [])[1];
  const peak = (check.match(/Peak:\s+(-?[\d.]+) dBFS/) || [])[1];
  console.log(`  ${path.relative(ROOT, out)}  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB  ` +
              `music from ${a.musicOffset}s, ${I} LUFS, true peak ${peak} dBFS`);
  console.log(probe(out));
}

/* A narrated film carries its own mastered soundtrack (scripts/cinema-voice.py),
   timed to the same real clock the picture was rendered on, so it goes in as is. */
function muxSoundtrack(silent, a) {
  const track = path.join(ROOT, 'assets', 'audio', 'cinema', a.film, 'soundtrack.mp3');
  if (!fs.existsSync(track) || a.from || a.to != null) return;
  const out = silent.replace(/\.mp4$/, '-narrated.mp4');
  run(['-y', '-hide_banner', '-i', silent, '-i', track, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
       '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
  console.log(`  ${path.relative(ROOT, out)}  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB  (soundtrack from the narration build)`);
  console.log(probe(out));
}

async function open(browser, a) {
  const [W, H] = a.aspect === '16x9' ? [1920, 1080] : [1080, 1350];
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('  page error:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('  console:', m.text()); });
  await page.goto(`${BASE}/films/${a.film}/?render=1&aspect=${a.aspect}`, { waitUntil: 'networkidle0', timeout: 120000 });
  // `!!` matters: returning the ready promise itself would make puppeteer wait
  // on it and then read its undefined result as "not yet", forever
  await page.waitForFunction(() => !!window.CINEMA, { timeout: 60000 });
  await page.evaluate(() => window.CINEMA.ready);
  const duration = await page.evaluate(() => window.CINEMA.duration);
  return { page, W, H, duration };
}

async function shot(page, W, H, t) {
  await page.evaluate(tt => window.CINEMA.seek(tt), t);
  return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
}

(async () => {
  const a = args(process.argv);
  const outDir = path.join(ROOT, 'dist', 'video');
  const partial = a.to != null || a.from;
  const silent = path.join(outDir, `${a.film}-film-${a.aspect}${partial ? `-${a.from}-${a.to}` : ''}.mp4`);

  if (a.muxOnly) {
    if (!fs.existsSync(silent)) throw new Error(`no silent render at ${silent}; render it first`);
    mux(silent, a);
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: 3600000,
    args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--enable-webgl'],
  });
  try {
    const { page, W, H, duration } = await open(browser, a);
    const gl = await page.evaluate(() => {
      const c = document.createElement('canvas').getContext('webgl2');
      const d = c && c.getExtension('WEBGL_debug_renderer_info');
      return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
    });
    console.log(`${a.film} ${a.aspect} ${W}x${H}, ${duration}s, GL: ${gl}`);

    if (a.frames) {
      const out = a.out || path.join(ROOT, 'dist', 'frames', a.film);
      fs.mkdirSync(out, { recursive: true });
      for (const t of a.frames) {
        const file = path.join(out, `${a.film}-${a.aspect}-${String(t.toFixed(2)).padStart(6, '0')}.png`);
        fs.writeFileSync(file, await shot(page, W, H, t));
        console.log('  ' + path.relative(ROOT, file));
      }
      return;
    }

    const from = a.from, to = a.to != null ? Math.min(a.to, duration) : duration;
    const n = Math.round((to - from) * a.fps);
    fs.mkdirSync(outDir, { recursive: true });
    const proc = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-framerate', String(a.fps), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(a.crf), '-pix_fmt', 'yuv420p',
      '-profile:v', 'high', '-movflags', '+faststart', silent], { stdio: ['pipe', 'ignore', 'pipe'] });
    let err = '';
    proc.stderr.on('data', d => { err += d; if (err.length > 20000) err = err.slice(-20000); });
    const closed = new Promise(res => proc.on('close', res));
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const buf = await shot(page, W, H, from + i / a.fps);
      if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
      if (i % 30 === 0 || i === n - 1) {
        const fps = (i + 1) / ((Date.now() - t0) / 1000);
        process.stdout.write(`\r  ${i + 1}/${n} frames  ${fps.toFixed(1)} fps  eta ${Math.round((n - i - 1) / fps)}s   `);
      }
    }
    proc.stdin.end();
    const code = await closed;
    process.stdout.write('\n');
    if (code !== 0) { console.error(err.slice(-3000)); throw new Error('ffmpeg failed'); }
    console.log(`  ${path.relative(ROOT, silent)}  ${(fs.statSync(silent).size / 1e6).toFixed(1)} MB`);
    console.log(probe(silent));
    if (a.music) mux(silent, a);
    else muxSoundtrack(silent, a);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
