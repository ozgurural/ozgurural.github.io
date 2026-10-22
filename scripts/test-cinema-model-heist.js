// Source, seek and presentation regressions for the Model Heist film.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const voice = require('./cinema/model-heist.voice.json');
const timeline = require('../assets/audio/cinema/model-heist/timeline.json');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const cue = id => timeline.lines.find(line => line.id === id).real;

(async () => {
  assert.ok(timeline.duration <= 101.85, 'the revision does not lengthen the original film');
  for (const line of voice.lines) {
    const timed = timeline.lines.find(item => item.id === line.id);
    assert.equal(timed.text, line.text, `${line.id}: narration is current`);
    assert.equal(timed.at, line.at, `${line.id}: authored cue agrees`);
    if (line.text) assert.ok(timed.words.length, `${line.id}: captions have word timings`);
  }
  const source = fs.readFileSync(path.join(__dirname, '../assets/js/cinema/model-heist-stats.js'));
  const math = await import('data:text/javascript;base64,' + source.toString('base64'));
  const a = math.evidenceState(), b = math.evidenceState(1), c = math.evidenceState(1, 1), d = math.evidenceState(1, 1, 1);
  assert.equal(a.mean, math.EPS * Math.sqrt(math.BASE_K));
  assert.equal(b.mean, math.EPS * Math.sqrt(math.MAX_K));
  assert.ok(Math.abs(b.mean - c.mean - math.ATTACK_BUDGET) < 1e-12);
  assert.equal(a.falseAlarm, b.falseAlarm, 'more marked coordinates do not change calibrated null variance');
  assert.ok(d.falseAlarm > a.falseAlarm * 8, 'aligned noise invalidates the old calibration');
  let seed = 2024;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return (seed + .5) / 4294967296; };
  const controls = math.gaussianSamples(random, 50000);
  for (const state of [a, d]) {
    const rate = controls.filter(z => z * state.sigma > state.threshold).length / controls.length;
    assert.ok(Math.abs(rate - state.falseAlarm) < .006, 'simulated null tail agrees with theoretical calibration');
  }
  const browser = await puppeteer.launch({ headless: true,
    args: process.env.CI ? ['--no-sandbox', '--enable-unsafe-swiftshader'] : [] });
  try {
    const errors = [];
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warn' && message.text().startsWith('model-heist:')) errors.push(message.text());
    });
    await page.setViewport({ width: 960, height: 540 });
    const response = await page.goto(BASE + '/films/model-heist/?autoplay=0', { waitUntil: 'networkidle2' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    const seek = async t => {
      await page.evaluate(t => window.CINEMA.seek(t), t);
      await page.evaluate(() => document.fonts.ready);
    };
    await seek(cue('score') + 1);
    assert.match(await page.$eval('.cin-cap', el => el.textContent), /without the mark/i);
    await seek(cue('add') + 7);
    const sum = await page.$eval('.sum-demo', el => ({ n: +el.dataset.samples, gap: +el.dataset.gap }));
    assert.ok(sum.n > 0 && sum.n < math.BASE_K);
    assert.ok(Math.abs(sum.gap - sum.n * math.EPS) < 1e-10, 'the displayed paired sums accumulate the actual signed signal');
    const score = async t => {
      await seek(t);
      return page.$eval('.score-demo', el => ({ mean: +el.dataset.mean, sigma: +el.dataset.sigma,
        fpr: +el.dataset.falseAlarm, threshold: +el.dataset.threshold,
        flagged: el.querySelectorAll('.null-sample[data-flagged="true"]').length, html: el.outerHTML }));
    };
    const first = await score(cue('score') + 10);
    const wider = await score(cue('wide') + 7.5);
    assert.ok(wider.mean > first.mean); assert.equal(wider.fpr, first.fpr);
    const attacked = await score(cue('scrub') + 7.5);
    assert.ok(Math.abs(wider.mean - attacked.mean - math.ATTACK_BUDGET) < 1e-8);
    const annotationsOverlap = await page.$eval('.score-demo', el => {
      const a = el.querySelector('[data-k="lt"]').getBoundingClientRect();
      const b = el.querySelector('[data-k="at"]').getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    });
    assert.equal(annotationsOverlap, false, 'threshold and attack annotations remain separately readable');
    const correlated = await score(cue('limits') + 7.5);
    assert.equal(correlated.threshold, first.threshold);
    assert.ok(correlated.fpr > first.fpr * 8);
    assert.ok(correlated.flagged > first.flagged, 'the visible null samples also cross the unchanged threshold more often');
    assert.equal((await score(cue('score') + 10)).html, first.html, 'backwards seek restores curves, points and calibration');

    const clipping = [];
    for (const line of timeline.lines.filter(line => line.text)) {
      for (const t of [line.real + Math.min(1, line.speech / 2), line.real + line.speech - 0.15]) {
        await seek(t);
        const failures = await page.evaluate(() => {
          const stage = document.querySelector('.cin').getBoundingClientRect();
          const cap = document.querySelector('.cin-cap');
          const cr = cap.getBoundingClientRect();
          const visible = el => {
            for (let node = el; node && node !== document.body; node = node.parentElement) {
              const style = getComputedStyle(node);
              if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) < 0.6) return false;
            }
            return true;
          };
          const failures = [];
          for (const el of document.querySelectorAll('.cin__ui .tx, .cin__ui .lb, .cin-cap')) {
            if (!visible(el)) continue;
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            for (let node; (node = walker.nextNode());) {
              if (!node.textContent.trim() || !visible(node.parentElement)) continue;
              const range = document.createRange(); range.selectNodeContents(node);
              for (const r of range.getClientRects()) {
                if (r.width < 1) continue;
                if (r.left < stage.left - 1 || r.right > stage.right + 1 || r.top < stage.top - 1 || r.bottom > stage.bottom + 1) {
                  failures.push('clipped: ' + node.textContent.trim());
                }
                if (el !== cap && visible(cap) && r.left < cr.right && r.right > cr.left && r.top < cr.bottom && r.bottom > cr.top) {
                  failures.push('caption overlap: ' + node.textContent.trim());
                }
              }
            }
          }
          return failures;
        });
        if (failures.length) clipping.push({ line: line.id, t, failures });
      }
    }
    assert.deepEqual(clipping, [], 'all spoken cue edges keep text inside the stage and clear of captions');
    assert.deepEqual(errors, [], 'no browser errors or mismatched cues');
    console.log('PASS: Model Heist calibration, paired sums, attack bound, false-alarm samples, captions, backwards seeking and text layout');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
