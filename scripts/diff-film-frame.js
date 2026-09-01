#!/usr/bin/env node
/*
 * Does the rendered video look like the film on the page?
 *
 * The mp4 is captured from /lab/<slug>/embed/, the visitor watches
 * /lab/<slug>/. Those are two different documents sharing one engine, so they
 * can drift apart in CSS without anything failing. This renders both at the
 * same stage size, seeks both to the same instant, and reports where they
 * differ: a global PSNR is not enough, because a 1px text shift and a missing
 * caption band score about the same. So it also clusters the differing pixels
 * into row bands and names the largest, which is what tells you whether the
 * difference is structural or just resampling.
 *
 * With --video it compares the finished mp4 against the page instead, which is
 * the check that actually matters: the embed being right does not prove the
 * render of it is.
 *
 *   node scripts/diff-film-frame.js <slug> [t] [--out DIR]
 *   node scripts/diff-film-frame.js <slug> 34 --video dist/video/<slug>-1920p.mp4
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const args = process.argv.slice(2);
const SLUG = args[0] || 'universal-jira';
const T = Number(args[1] && !args[1].startsWith('--') ? args[1] : 34);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : path.join(__dirname, '..', 'dist', 'diff');
const vidIdx = args.indexOf('--video');
const VIDEO = vidIdx >= 0 ? args[vidIdx + 1] : null;

// A rendered film holds its picture while a narration line finishes, so video
// time is not film time. The render writes the mapping beside the mp4; without
// it a comparison late in a film is off by however long the film has held,
// which looks like the render being wrong when it is the diff that is.
function filmTimeForVideoTime(videoFile, w) {
  const side = videoFile.replace(/\.mp4$/, '.timeline.json');
  if (!fs.existsSync(side)) return { t: w, mapped: false };
  const tl = JSON.parse(fs.readFileSync(side, 'utf8')).samples;
  if (!tl || tl.length < 2) return { t: w, mapped: false };
  let k = 0;
  while (k < tl.length - 2 && tl[k + 1][0] < w) k++;
  const a = tl[k], b = tl[k + 1] || a;
  const dw = b[0] - a[0];
  const u = dw > 1e-9 ? Math.max(0, Math.min(1, (w - a[0]) / dw)) : 0;
  return { t: a[1] + (b[1] - a[1]) * u, mapped: true };
}

// Pull one frame out of the mp4 at the same instant the page is seeked to.
// -ss before -i seeks by keyframe, which would land somewhere else entirely, so
// it goes after, and the frame is decoded rather than guessed at.
function frameFromVideo(file, t, out) {
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', file, '-ss', String(t), '-frames:v', '1', out], { stdio: 'pipe' });
  return out;
}

const shoot = async (browser, url, file, atTime) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const rect = await page.evaluate((tt) => {
    const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    f.seek(tt);
    const kill = (sel) => document.querySelectorAll(sel).forEach(n => n.remove());
    kill('.labf__poster'); kill('.labf__transport'); kill('.labf-embed__source');
    const st = document.querySelector('.labf__stage');
    st.scrollIntoView({ block: 'center' });
    const r = st.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y),
             width: Math.round(r.width), height: Math.round(r.height) };
  }, atTime === undefined ? T : atTime);
  await new Promise(r => setTimeout(r, 400));   // let the scroll settle before clipping
  const rect2 = await page.evaluate(() => {
    const r = document.querySelector('.labf__stage').getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y),
             width: Math.round(r.width), height: Math.round(r.height) };
  });
  const chrome = await page.evaluate(() => {
    const c = document.querySelector('.labf__chrome');
    if (!c) return 'absent';
    const cs = getComputedStyle(c);
    if (cs.display === 'none') return 'display:none';
    const r = c.getBoundingClientRect();
    return `shown ${Math.round(r.height)}px, text ${JSON.stringify(c.innerText.replace(/\s+/g, ' ').trim().slice(0, 60))}`;
  });
  const handle = await page.$('.labf__stage');
  await handle.screenshot({ path: file });
  await page.close();
  return { rect: rect2, chrome };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const a = path.join(OUT, `${SLUG}-page.png`);
  const b = path.join(OUT, `${SLUG}-embed.png`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars',
           '--force-device-scale-factor=1'],
  });
  // In --video mode T is a moment in the video; the page has to be seeked to
  // the film time that moment shows.
  const mapped = VIDEO ? filmTimeForVideoTime(VIDEO, T) : { t: T, mapped: false };
  const pageRect = await shoot(browser, `${BASE}/lab/${SLUG}/`, a, mapped.t);
  const embRect = VIDEO
    ? { source: VIDEO, videoTime: T, filmTime: +mapped.t.toFixed(2),
        usedTimeline: mapped.mapped, frame: frameFromVideo(VIDEO, T, b) }
    : await shoot(browser, `${BASE}/lab/${SLUG}/embed/`, b, T);

  // Diff in a page, because that is where a PNG decoder already lives.
  const scratch = await browser.newPage();
  await scratch.goto('about:blank');
  const toDataUrl = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
  const report = await scratch.evaluate(async (dA, dB) => {
    const load = (src) => new Promise((res, rej) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src;
    });
    const [ia, ib] = await Promise.all([load(dA), load(dB)]);
    // The two stages are rarely the same number of pixels, and that on its own
    // is not a defect: the video is a resampled capture either way. Bring both
    // to the smaller size so the comparison is about what is drawn, not how
    // many pixels it was drawn into.
    const W = Math.min(ia.width, ib.width), H = Math.min(ia.height, ib.height);
    const px = (im) => { const c = document.createElement('canvas');
      c.width = W; c.height = H; const g = c.getContext('2d', { willReadFrequently: true });
      g.imageSmoothingQuality = 'high';
      g.drawImage(im, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; };
    const pa = px(ia), pb = px(ib);

    const rowDiff = new Float64Array(H);
    const rowMax = new Uint8Array(H);
    let differing = 0, sumSq = 0, worst = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i+1] - pb[i+1]),
                           Math.abs(pa[i+2] - pb[i+2]));
        sumSq += d * d;
        if (d > 12) { differing++; rowDiff[y]++; if (d > rowMax[y]) rowMax[y] = d; }
        if (d > worst) worst = d;
      }
    }
    const mse = sumSq / (W * H);
    const psnr = mse === 0 ? Infinity : 10 * Math.log10(255 * 255 / mse);

    // Cluster differing rows into bands, so a caption band reads as one finding
    // rather than forty rows.
    const bands = [];
    let cur = null;
    for (let y = 0; y < H; y++) {
      const heavy = rowDiff[y] > W * 0.004;         // >0.4% of the row
      if (heavy) { if (!cur) cur = { top: y, bottom: y, px: 0, max: 0 };
        cur.bottom = y; cur.px += rowDiff[y]; cur.max = Math.max(cur.max, rowMax[y]); }
      else if (cur && y - cur.bottom > 6) { bands.push(cur); cur = null; }
    }
    if (cur) bands.push(cur);
    bands.sort((p, q) => q.px - p.px);

    return {
      size: [W, H],
      nativeSizes: { page: [ia.width, ia.height], embed: [ib.width, ib.height] },
      psnrDb: +psnr.toFixed(2),
      worstChannelDelta: worst,
      differingPixelPct: +(100 * differing / (W * H)).toFixed(3),
      bands: bands.slice(0, 8).map(bd => ({
        top: bd.top, bottom: bd.bottom, height: bd.bottom - bd.top + 1,
        pixels: bd.px, maxDelta: bd.max,
        logicalTop: +(bd.top * 540 / H).toFixed(1),
        logicalBottom: +(bd.bottom * 540 / H).toFixed(1),
      })),
    };
  }, toDataUrl(a), toDataUrl(b));

  console.log(JSON.stringify({ slug: SLUG, t: T, comparedAgainst: VIDEO || 'embed page',
                              pageRect, embRect, ...report }, null, 1));
  await browser.close();
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
