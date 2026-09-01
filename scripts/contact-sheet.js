#!/usr/bin/env node
/*
 * A contact sheet of a film: N frames spread across it, tiled into one image.
 *
 * Reading a film by scrubbing it in a browser tells you whether it runs. It
 * does not tell you that a scene spends sixty seconds on one static picture,
 * because each moment looks fine on its own. Laid out side by side that is the
 * first thing you see, and it is how the weakest scenes in universal-jira were
 * found: three consecutive frames identical but for a label.
 *
 *   node scripts/contact-sheet.js <slug> [shotsPerScene] [--out DIR] [--scene N]
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const args = process.argv.slice(2);
const SLUG = args[0];
const PER = Number(args[1] && !args[1].startsWith('--') ? args[1] : 3);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? args[outIdx + 1] : path.join(__dirname, '..', 'dist', 'sheet');
const scIdx = args.indexOf('--scene');
const ONLY = scIdx >= 0 ? Number(args[scIdx + 1]) : null;

if (!SLUG) { console.error('usage: contact-sheet.js <slug> [shotsPerScene] [--scene N]'); process.exit(1); }

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (/^f\d+\.png$/.test(f)) fs.unlinkSync(path.join(OUT, f));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/lab/${SLUG}/embed/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const info = await page.evaluate(() => {
    const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    document.querySelectorAll('.labf__poster,.labf__transport,.labf-embed__source')
      .forEach(n => n.remove());
    return { duration: f.duration, scenes: f.scenes.map(s => ({ name: s.name, start: s.start, end: s.end })) };
  });

  const scenes = ONLY ? [info.scenes[ONLY - 1]] : info.scenes;
  const times = [];
  for (const sc of scenes) {
    for (let i = 1; i <= PER; i++) times.push(sc.start + (sc.end - sc.start) * i / (PER + 1));
  }

  const stage = await page.$('.labf__stage');
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => {
      const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
      f.seek(t);
    }, times[i]);
    await stage.screenshot({ path: path.join(OUT, `f${String(i).padStart(2, '0')}.png`) });
  }
  await browser.close();

  // This ffmpeg build has no glob support, so the frames are numbered for it.
  const cols = Math.min(PER, 3);
  const rows = Math.ceil(times.length / cols);
  const sheet = path.join(OUT, `${SLUG}${ONLY ? '-scene' + ONLY : ''}.png`);
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', path.join(OUT, 'f%02d.png'),
    '-filter_complex', `scale=470:264,tile=${cols}x${rows}:margin=8:padding=6:color=0x202533`,
    '-frames:v', '1', sheet], { stdio: 'pipe' });

  console.log(JSON.stringify({
    slug: SLUG, duration: info.duration,
    scenes: info.scenes.map(s => `${s.name} (${(s.end - s.start).toFixed(0)}s)`),
    shotsAt: times.map(t => +t.toFixed(1)),
    sheet,
  }, null, 1));
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
