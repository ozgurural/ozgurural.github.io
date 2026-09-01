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
const STILLS = process.argv.includes('--stills');
const STEP = 0.4;
const ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const FILMS = ARGS.length
  ? ARGS
  : fs.readdirSync(path.join(ROOT, '_pages', 'embed'))
      .filter(f => f.endsWith('-embed.md'))
      .map(f => f.slice(0, -'-embed.md'.length))
      .sort();

// Is a scene animating, or is it a picture with a label changing on it?
//
// Sampled every STEP seconds: the canvas, downsampled, plus every attribute the
// engine animates on the SVG layer (transform, opacity, stroke-dashoffset), so
// a scene drawn entirely out of nodes is measured as fairly as one drawn in
// canvas. A sample that differs from its predecessor by almost nothing is a
// still frame; a run of them is a slide. Caption changes are deliberately not
// counted as motion, because a frozen picture with new words under it is
// exactly the thing being looked for.
const STILL_PROBE = async (step, moved) => {
  const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
  const cv = document.querySelector('.labf__stage canvas');
  const small = document.createElement('canvas');
  small.width = 120; small.height = 68;
  const sg = small.getContext('2d', { willReadFrequently: true });
  const svg = document.querySelector('.labf__stage svg');
  const sig = () => {
    sg.clearRect(0, 0, 120, 68);
    if (cv) sg.drawImage(cv, 0, 0, 120, 68);
    const px = sg.getImageData(0, 0, 120, 68).data;
    let svgSig = '';
    if (svg) {
      const nodes = svg.querySelectorAll('*');
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        svgSig += (n.getAttribute('transform') || '') + '|' +
                  (n.getAttribute('opacity') || n.style.opacity || '') + '|' +
                  (n.getAttribute('stroke-dashoffset') || '') + ';';
      }
    }
    return { px: px, svg: svgSig };
  };
  const out = [];
  let prev = null;
  for (let t = 0; t <= f.duration + 1e-6; t += step) {
    f.seek(t);
    const cur = sig();
    if (prev) {
      let changed = 0;
      for (let i = 0; i < cur.px.length; i += 4) {
        const d = Math.max(Math.abs(cur.px[i] - prev.px[i]),
                           Math.abs(cur.px[i + 1] - prev.px[i + 1]),
                           Math.abs(cur.px[i + 2] - prev.px[i + 2]),
                           Math.abs(cur.px[i + 3] - prev.px[i + 3]));
        if (d > 8) changed++;
      }
      const frac = changed / (120 * 68);
      out.push({ t: +t.toFixed(2), still: frac < moved && cur.svg === prev.svg });
    }
    prev = cur;
  }
  return { duration: f.duration, samples: out,
           scenes: (f.scenes || []).map(s => ({ name: s.name, start: s.start, end: s.end })) };
};

async function auditStills(browser, slug, step) {
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/lab/${slug}/embed/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await page.waitForFunction(
    () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  const r = await page.evaluate(STILL_PROBE, step, 0.0025);
  // When does the last line in each scene stop speaking? A tail that looks
  // still can still have narration running over it, and cutting there would
  // truncate the sentence rather than the dead air.
  const voice = await page.evaluate(async () => {
    const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
    const cues = (f._audioCues || []).map(c => ({ id: c.id, at: c.at }));
    const d = {};
    await Promise.all(cues.map(c => new Promise(res => {
      const a = new Audio('/assets/audio/lab/' + c.id + '.mp3');
      a.addEventListener('loadedmetadata', () => { d[c.id] = a.duration; res(); });
      a.addEventListener('error', () => { d[c.id] = 0; res(); });
    })));
    return cues.map(c => ({ at: c.at, ends: c.at + (d[c.id] || 0) }));
  });
  await page.close();

  return r.scenes.map(sc => {
    const inScene = r.samples.filter(s => s.t > sc.start && s.t <= sc.end);
    let run = 0, best = 0, bestEnd = 0, total = 0;
    for (const s of inScene) {
      if (s.still) { run++; total++; if (run > best) { best = run; bestEnd = s.t; } }
      else run = 0;
    }
    // Stillness at the end of a scene is the cheap kind to fix: the scene can
    // simply be shorter, with nothing redrawn. Stillness in the middle needs
    // something to happen. Report them apart, because they are different jobs.
    let tail = 0;
    for (let i = inScene.length - 1; i >= 0 && inScene[i].still; i--) tail++;
    // The scene may not end before its last sentence does, plus a beat.
    const lastVoice = voice.filter(v => v.at >= sc.start - 1e-6 && v.at < sc.end)
                           .reduce((a, v) => Math.max(a, v.ends), sc.start);
    const floor = Math.max(4, lastVoice - sc.start + 0.9);
    const wanted = (sc.end - sc.start) - Math.max(0, tail * step - 1.5);
    const newLen = Math.max(floor, wanted);
    return { scene: sc.name, len: +(sc.end - sc.start).toFixed(1),
             newLen: +newLen.toFixed(1), cut: +((sc.end - sc.start) - newLen).toFixed(1),
             stillSec: +(total * step).toFixed(1),
             longestSec: +(best * step).toFixed(1),
             tailSec: +(tail * step).toFixed(1),
             longestEndsAt: +bestEnd.toFixed(1) };
  });
}

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
  if (STILLS) {
    // A scene that stops moving is not automatically wrong: a held beat can be
    // deliberate. What is wrong is holding for tens of seconds, so the report
    // is sorted by the longest single stretch and the reader decides.
    const rows = [];
    for (const slug of FILMS) {
      try {
        const scenes = await auditStills(browser, slug, STEP);
        scenes.forEach(sc => rows.push(Object.assign({ slug }, sc)));
      } catch (e) { console.log(`${slug}: FAILED ${e.message}`); }
    }
    await browser.close();
    // The signature is an end card. It is supposed to hold, so counting it as a
    // slide would bury the real findings under eleven false ones.
    const real = rows.filter(r => !/^signature$/i.test(r.scene));
    real.sort((a, b) => (b.stillSec - b.tailSec) - (a.stillSec - a.tailSec) || b.tailSec - a.tailSec);
    console.log('slug'.padEnd(23) + 'scene'.padEnd(33) + ' len  still  tail  mid  longest');
    for (const r of real) {
      const mid = +(r.stillSec - r.tailSec).toFixed(1);
      const flag = mid >= 8 ? '  <-- needs motion' : (r.tailSec >= 5 ? '  <-- trim' : '');
      console.log(r.slug.padEnd(23) + r.scene.slice(0, 31).padEnd(33) +
                  String(r.len).padStart(4) + String(r.stillSec).padStart(7) +
                  String(r.tailSec).padStart(6) + String(mid).padStart(5) +
                  String(r.longestSec).padStart(9) + flag);
    }
    const cuts = real.filter(r => r.cut >= 1.5);
    if (cuts.length) {
      console.log('');
      console.log('safe trims (tail stillness, minus whatever the voice still needs):');
      for (const r of cuts) {
        console.log('  ' + r.slug.padEnd(23) + r.scene.slice(0, 31).padEnd(33) +
                    String(r.len).padStart(5) + ' -> ' + String(r.newLen).padStart(5) +
                    '   (-' + r.cut + 's)');
      }
      console.log('  total ' + cuts.reduce((a, r) => a + r.cut, 0).toFixed(1) + 's');
      // Written out in full, because the table truncates names and several
      // scenes carry apostrophes and maths symbols that make hand-matching them
      // a way to edit the wrong scene.
      const out = path.join(ROOT, 'dist', 'trims.json');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, JSON.stringify(cuts.map(c => ({
        slug: c.slug, scene: c.scene, len: c.len, newLen: c.newLen, cut: c.cut })), null, 1));
      console.log('  written to ' + path.relative(ROOT, out));
    }
    const trim = real.reduce((a, r) => a + (r.tailSec >= 5 ? r.tailSec : 0), 0);
    const mid = real.reduce((a, r) => a + Math.max(0, r.stillSec - r.tailSec), 0);
    console.log(`
${real.length} scenes (signatures excluded). ` +
                `${trim.toFixed(0)}s of trimmable tail, ${mid.toFixed(0)}s of stillness mid-scene.`);
    return;
  }

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
