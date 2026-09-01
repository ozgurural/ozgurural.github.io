#!/usr/bin/env node
/*
 * What is wrong with the films right now.
 *
 * These are the defects the films acquire silently, in the sense that nothing
 * fails and the page still looks plausible: a sentence that runs past the scene
 * drawing it, a label parked under the opaque caption panel, a scene that stops
 * moving while the voice is still going, and anything authored into the chrome
 * band at the top of the stage.
 *
 * The narration check is the one with teeth. The engine papers over an overrun
 * by holding film time just short of the boundary until the line finishes
 * (Film.prototype.play), so an overrun does not cut the audio, it freezes the
 * picture. That reads as a stall, and it is invisible unless measured: the film
 * still "works". The render measured 5.4s of holding in blockchain-ml.
 *
 *   node scripts/audit-films.js [slug ...]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';

// The spoken lines, so an overrun can be read next to the sentence causing it.
// Keyed the way the cue ids are: <film-prefix>_<n>.
const TEXTS = (() => {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'narration.json'), 'utf8'));
    const out = {};
    for (const prefix of Object.keys(raw)) {
      raw[prefix].forEach((t, n) => { out[prefix + '_' + n] = t; });
    }
    return out;
  } catch (err) { return {}; }
})();
const ROOT = path.resolve(__dirname, '..');
const FILMS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(ROOT, '_pages', 'embed'))
      .filter(f => f.endsWith('-embed.md'))
      .map(f => f.slice(0, -'-embed.md'.length))
      .sort();

async function auditFilm(browser, slug) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/lab/${slug}/embed/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const out = await page.evaluate(async () => {
    const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    const scenes = (f.scenes || []).map((s, i) => ({ i, name: s.name, start: s.start, end: s.end }));
    const cues = (f._audioCues || []).map(c => ({ id: c.id, at: c.at }));

    // Real mp3 durations, not the cue's idea of them.
    const durations = {};
    await Promise.all(cues.map(c => new Promise(res => {
      const a = new Audio('/assets/audio/lab/' + c.id + '.mp3');
      a.addEventListener('loadedmetadata', () => { durations[c.id] = a.duration; res(); });
      a.addEventListener('error', () => { durations[c.id] = null; res(); });
    })));

    const overruns = [];
    cues.forEach((c, n) => {
      const dur = durations[c.id];
      if (!dur || !isFinite(dur)) { overruns.push({ id: c.id, at: c.at, problem: 'no audio' }); return; }
      const ends = c.at + dur;
      // A later lower() replaces the subtitle and its narration together, so the
      // next cue is as hard a boundary as the end of the scene.
      const nextCue = cues[n + 1] ? cues[n + 1].at : Infinity;
      const sc = scenes.find(s => c.at >= s.start - 1e-6 && c.at < s.end) ||
                 scenes[scenes.length - 1];
      const boundary = Math.min(nextCue, sc ? sc.end : f.duration);
      const over = ends - boundary;
      if (over > 0.05) {
        overruns.push({
          id: c.id, scene: sc ? sc.name : '?', at: +c.at.toFixed(2),
          dur: +dur.toFixed(2), ends: +ends.toFixed(2),
          boundary: +boundary.toFixed(2),
          hits: nextCue < (sc ? sc.end : Infinity) ? 'next line' : 'scene end',
          overBy: +over.toFixed(2),
        });
      }
    });

    return { duration: f.duration, scenes: scenes.length, cues: cues.length, overruns };
  });

  await page.close();
  return { slug, ...out };
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  const all = [];
  for (const slug of FILMS) {
    try { all.push(await auditFilm(browser, slug)); }
    catch (e) { all.push({ slug, error: e.message }); }
  }
  await browser.close();

  let totalOver = 0, totalHeld = 0;
  for (const r of all) {
    if (r.error) { console.log(`${r.slug}: FAILED ${r.error}`); continue; }
    const held = r.overruns.reduce((a, o) => a + (o.overBy || 0), 0);
    totalOver += r.overruns.length; totalHeld += held;
    const head = `${r.slug.padEnd(24)} ${String(r.duration).padStart(6)}s  ` +
                 `${r.cues} lines  ${r.overruns.length} overrun`;
    console.log(held > 0.05 ? `${head}  (+${held.toFixed(1)}s of hold)` : head);
    for (const o of r.overruns) {
      if (o.problem) { console.log(`    ${o.id}  ${o.problem}`); continue; }
      console.log(`    ${o.id.padEnd(24)} speaks ${String(o.dur).padStart(5)}s in ` +
                  `${(o.boundary - o.at).toFixed(2)}s  (${o.hits})  over by ${o.overBy}s  ` +
                  `-> needs ${Math.round(100 * (1 - (o.boundary - o.at) / o.dur))}% shorter`);
      const text = TEXTS[o.id];
      if (text) console.log(`      "${text}"`);
    }
  }
  console.log(`\n${totalOver} overrunning lines, ${totalHeld.toFixed(1)}s of held picture in total`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
