#!/usr/bin/env node
/*
 * A phone cut of a cinema film: 1080x1920 (9:16), the 16:9 film at full width
 * in the middle, the title above it and the captions below it in large type.
 *
 *   FILM_BASE_URL=http://localhost:4001 node scripts/cinema-vertical.js --film level-d \
 *     --video dist/video/level-d-film-16x9-narrated.mp4 --skip open,determinism,coda
 *   ... --still 13.2                      # one frame to dist/video/<film>-<frame>-<t>.png
 *   ... --frame 1x1                       # square, for a feed seen on desktops (X)
 *
 * Why: LinkedIn is mostly read on phones, and a 16:9 upload is a strip about
 * 211px tall on a 375px-wide screen, with captions burned in at 46px of 1920
 * coming out near 9px: unreadable, in a feed that autoplays muted. On a phone
 * held upright the picture is as wide as the screen whatever the format, so a
 * taller frame cannot make the film bigger; what it buys is room for a title
 * and for captions that can be read (54px of 1080, about 19px on the phone).
 *
 * The frame is 9:16 because that fills a current phone (iPhone 18 Pro Max:
 * 2868x1320, 19.5:9) and LinkedIn's vertical video feed. Its main feed shows
 * at most 4:5 without cropping, so everything that matters sits in the middle
 * 4:5 (y 285 to 1635); above and below is only background, safe to lose.
 * Upload it at exactly 1080x1920: LinkedIn plays nothing above 1080p, and a
 * size it does not have to rescale is the sharpest it will show.
 *
 * The video must be a render without captions (render-cinema.js without
 * --captions): they are drawn here instead, from the same word timings the
 * player uses (captionsFromTimeline), run through the page that serves the film.
 */
const puppeteer = require('puppeteer');
const ffmpeg = require('ffmpeg-static');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASE = process.env.FILM_BASE_URL || process.env.FILM_BASE || 'http://localhost:4000';
const a = { film: null, video: null, out: null, skip: [], maxc: 48, still: null, crf: 14, frame: '9x16' };
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i], v = process.argv[i + 1];
  if (k === '--film') { a.film = v; i++; }
  else if (k === '--video') { a.video = v; i++; }
  else if (k === '--out') { a.out = v; i++; }
  else if (k === '--skip') { a.skip = v.split(',').filter(Boolean); i++; }
  else if (k === '--maxc') { a.maxc = Number(v); i++; }
  else if (k === '--still') { a.still = Number(v); i++; }
  else if (k === '--crf') { a.crf = Number(v); i++; }
  else if (k === '--preset') { a.preset = v; i++; }
  else if (k === '--frame') { a.frame = v; i++; }
}
if (!a.film || !a.video) { console.error('usage: --film <slug> --video <16x9 mp4 without captions> [--skip ids] [--still t]'); process.exit(1); }

// The frames, in pixels. 9x16 is the phone cut (safe 4:5 zone: y 285 to
// 1635). 1x1 is for X: its desktop timeline shows a 9:16 video about 290px
// wide, so the film inside it was a thumbnail, while a square one is the full
// width of the post (about 506px) on a desktop and on a phone alike.
const FRAMES = {
  '9x16': { w: 1080, h: 1920, film: 700, cap: 1352, capH: 220, capPx: 54, head: 392, kick: 26, gap: 26, title: 86,
            foot: 1560, footPx: 24, mask: '#000 0, rgba(0,0,0,.35) 18%, transparent 34%, transparent 70%, rgba(0,0,0,.35) 84%, #000 100%' },
  '1x1':  { w: 1080, h: 1080, film: 186, cap: 818, capH: 150, capPx: 48, head: 46, kick: 21, gap: 14, title: 54,
            foot: 1006, footPx: 20, mask: 'rgba(0,0,0,.6) 0, transparent 22%, transparent 78%, rgba(0,0,0,.6) 100%' },
};
const L = FRAMES[a.frame];
if (!L) { console.error(`--frame is one of ${Object.keys(FRAMES).join(', ')}`); process.exit(1); }
const FW = L.w, FH = L.h;
const FILM = { y: L.film, h: 608 };              // 1920x1080 scaled to 1080 wide
const CAP = { y: L.cap, h: L.capH };
const BG = '#030409';                     // the film's own edge, sampled across the film: 0 to 9

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fontCSS = `
  @font-face { font-family: "Space Grotesk"; font-weight: 500 700; src: url("${BASE}/assets/webfonts/gf/space-grotesk-500-600-700-latin.woff2") format("woff2"); }
  @font-face { font-family: "Inter"; font-weight: 400 700; src: url("${BASE}/assets/webfonts/gf/inter-400-500-600-700-latin.woff2") format("woff2"); }
  @font-face { font-family: "JetBrains Mono"; font-weight: 400 500; src: url("${BASE}/assets/webfonts/gf/jetbrains-mono-400-500-latin.woff2") format("woff2"); }
  html, body { margin: 0; padding: 0; }`;

function run(args) {
  const r = spawnSync(ffmpeg, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) { console.error(r.stderr.slice(-3000)); throw new Error('ffmpeg failed'); }
  return r;
}

(async () => {
  const work = path.join(ROOT, 'dist', 'video', 'vertical', `${a.film}-${a.frame}`);
  fs.rmSync(work, { recursive: true, force: true });
  fs.mkdirSync(work, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  let title, cues;
  try {
    // ---- what the film is called and what it says, from the page that serves it
    const page = await browser.newPage();
    await page.goto(`${BASE}/films/${a.film}/?render=1&aspect=16x9`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => !!window.CINEMA, { timeout: 90000 });
    ({ title, cues } = await page.evaluate(async (film, maxc, skip) => {
      const m = await import('/assets/js/cinema/engine.js');
      const tl = await fetch(`/assets/audio/cinema/${film}/timeline.json`).then(r => r.json());
      return { title: window.CINEMA.title, cues: m.captionsFromTimeline(tl, maxc, skip) };
    }, a.film, a.maxc, a.skip));
    await page.close();
    console.log(`${a.film}: "${title}", ${cues.length} captions`);

    // ---- the background and title, and one transparent image per caption
    const p = await browser.newPage();
    await p.goto(`${BASE}/robots.txt`);         // same origin as the fonts, or they are refused
    await p.setViewport({ width: FW, height: FH, deviceScaleFactor: 1 });
    await p.setContent(`<!doctype html><html><head><style>${fontCSS}
      body { width: ${FW}px; height: ${FH}px; background: ${BG}; position: relative; overflow: hidden; }
      /* the film's floor grid, faint and fading out: only the outer bands show it */
      .grid { position: absolute; inset: 0;
        background-image: linear-gradient(rgba(120,160,220,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,160,220,.07) 1px, transparent 1px);
        background-size: 54px 54px; background-position: 0 0;
        -webkit-mask-image: linear-gradient(180deg, ${L.mask}); }
      .foot { position: absolute; left: 0; right: 0; top: ${L.foot}px; text-align: center;
        font: 500 ${L.footPx}px/1 "JetBrains Mono", monospace; letter-spacing: .12em; color: #6f8296; }
      .head { position: absolute; left: 72px; right: 72px; top: ${L.head}px; }
      .kick { font: 500 ${L.kick}px/1 "JetBrains Mono", monospace; letter-spacing: .16em; text-transform: uppercase; color: #7cc4f2; }
      h1 { margin: ${L.gap}px 0 0; font: 600 ${L.title}px/1.04 "Space Grotesk", sans-serif; letter-spacing: -.01em; color: #f4f7fb; text-wrap: balance; }
      .film { position: absolute; left: 0; top: ${FILM.y}px; width: ${FW}px; height: ${FILM.h}px; background: #000; }
      .rule { position: absolute; left: 72px; width: 120px; height: 2px; background: rgba(124,196,242,.55); }
    </style></head><body>
      <div class="grid"></div>
      <div class="head"><div class="kick">Dr. Ozgur Ural &middot; a research film</div><h1>${esc(title)}</h1></div>
      <div class="film"></div>
      <div class="foot">ozgurural.github.io</div>
    </body></html>`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const head = await p.$eval('.head', e => e.getBoundingClientRect().bottom);
    if (head > FILM.y - 24) throw new Error(`title runs to y ${head}, into the film at ${FILM.y}`);
    await p.screenshot({ path: path.join(work, 'bg.png') });
    // A 24px fade from the background into the film at its top and bottom, so
    // a scene whose edge is not black (the take-off sky) does not end in a seam.
    await p.setContent(`<!doctype html><html><head><style>
      body { width: ${FW}px; height: ${FH}px; margin: 0; background: transparent; position: relative; }
      i { position: absolute; left: 0; width: ${FW}px; height: 24px; }
    </style></head><body>
      <i style="top:${FILM.y}px;background:linear-gradient(${BG},transparent)"></i>
      <i style="top:${FILM.y + FILM.h - 24}px;background:linear-gradient(transparent,${BG})"></i>
    </body></html>`);
    await p.screenshot({ path: path.join(work, 'fade.png'), omitBackground: true });

    await p.setViewport({ width: FW, height: CAP.h, deviceScaleFactor: 1 });
    await p.setContent(`<!doctype html><html><head><style>${fontCSS}
      body { width: ${FW}px; height: ${CAP.h}px; background: transparent; }
      .c { margin: 0 auto; width: 940px; text-align: center; text-wrap: balance;
           font: 500 ${L.capPx}px/1.3 "Inter", sans-serif; color: #f4f7fb; }
    </style></head><body><div class="c"></div></body></html>`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const shot = async (file, text) => {
      const lines = await p.evaluate((t, px) => { const c = document.querySelector('.c'); c.innerHTML = t;
        return Math.round(c.getBoundingClientRect().height / (px * 1.3)); }, text, L.capPx);
      if (lines > 2) throw new Error(`caption wraps to ${lines} lines: ${text}`);
      await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: FW, height: CAP.h } });
    };
    await shot(path.join(work, 'blank.png'), '');
    // concat list: blank between captions, each caption for exactly its span
    const list = [];
    let at = 0;
    for (let i = 0; i < cues.length; i++) {
      const [s, e, text] = cues[i];
      if (s > at) list.push(['blank.png', s - at]);
      const f = `cap-${String(i).padStart(3, '0')}.png`;
      await shot(path.join(work, f), esc(text));
      list.push([f, e - s]);
      at = e;
    }
    list.push(['blank.png', 1], ['blank.png', 0]);
    if (a.still != null) {
      const k = cues.findIndex(c => c[0] <= a.still && a.still < c[1]);
      fs.copyFileSync(path.join(work, k < 0 ? 'blank.png' : `cap-${String(k).padStart(3, '0')}.png`), path.join(work, 'still-cap.png'));
    }
    fs.writeFileSync(path.join(work, 'captions.txt'),
      list.map(([f, d]) => `file '${f}'\nduration ${d.toFixed(3)}`).join('\n') + '\n');
  } finally {
    await browser.close();
  }

  // ---- compose
  // The background and the fade are looped stills, so each is cut to the
  // film's length: an overlay with an endless input never ends either (the
  // first full run kept encoding the last frame for an hour after the film).
  const dur = Number((/Duration: (\d+):(\d+):([\d.]+)/.exec(spawnSync(ffmpeg, ['-i', a.video], { encoding: 'utf8' }).stderr) || [])
    .slice(1).reduce((s, x) => s * 60 + Number(x), 0));
  if (!dur) throw new Error(`no duration in ${a.video}`);
  const D = a.still != null ? '1' : dur.toFixed(3);
  const filter = [
    `[1:v]scale=${FW}:${FILM.h}:flags=lanczos+accurate_rnd+full_chroma_int,setsar=1[f]`,
    `[0:v][f]overlay=0:${FILM.y}:shortest=1[b]`,
    `[2:v]format=rgba[c]`,
    `[b][3:v]overlay=0:0:shortest=1[b2]`,
    `[b2][c]overlay=0:${CAP.y}:eof_action=pass,format=yuv420p[v]`,
  ].join(';');
  const inputs = ['-loop', '1', '-framerate', '30', '-t', D, '-i', path.join(work, 'bg.png'),
                  ...(a.still != null ? ['-ss', String(a.still)] : []), '-i', a.video,
                  ...(a.still != null ? ['-i', path.join(work, 'still-cap.png')] : ['-f', 'concat', '-safe', '0', '-i', path.join(work, 'captions.txt')]),
                  '-loop', '1', '-framerate', '30', '-t', D, '-i', path.join(work, 'fade.png')];
  if (a.still != null) {
    const out = a.out || path.join(ROOT, 'dist', 'video', `${a.film}-${a.frame}-${a.still}.png`);
    run(['-y', ...inputs, '-filter_complex', filter.replace(',format=yuv420p', ''), '-map', '[v]', '-frames:v', '1', out]);
    console.log(`  ${path.relative(ROOT, out)}`);
    return;
  }
  const out = a.out || path.join(ROOT, 'dist', 'video', `${a.film}-${a.frame}.mp4`);
  run(['-y', '-progress', path.join(work, 'progress.txt'), ...inputs, '-filter_complex', filter, '-map', '[v]', '-map', '1:a?', '-t', dur.toFixed(3),
       '-c:v', 'libx264', '-preset', a.preset || 'slow', '-crf', String(a.crf), '-profile:v', 'high', '-level', '4.2',
       '-r', '30', '-g', '60', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
       '-c:a', 'copy', '-movflags', '+faststart', out]);
  console.log(`  ${path.relative(ROOT, out)}  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
})().catch(e => { console.error(e); process.exit(1); });
