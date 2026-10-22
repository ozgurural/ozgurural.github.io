// Source, seek and presentation regressions for the Collaborative AI film.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const voice = require('./cinema/blockchain-ml.voice.json');
const timeline = require('../assets/audio/cinema/blockchain-ml/timeline.json');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const cue = id => timeline.lines.find(line => line.id === id).real;

(async () => {
  assert.ok(timeline.duration <= 112.705, 'the revision does not lengthen the original film');
  for (const line of voice.lines) {
    const timed = timeline.lines.find(item => item.id === line.id);
    assert.equal(timed.text, line.text, `${line.id}: narration is current`);
    assert.equal(timed.at, line.at, `${line.id}: authored cue agrees`);
    if (line.text) assert.ok(timed.words.length, `${line.id}: captions have word timings`);
  }
  const browser = await puppeteer.launch({ headless: true,
    args: process.env.CI ? ['--no-sandbox', '--enable-unsafe-swiftshader'] : [] });
  try {
    const errors = [];
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'warn' && message.text().startsWith('blockchain-ml:')) errors.push(message.text());
    });
    await page.setViewport({ width: 960, height: 540 });
    const response = await page.goto(BASE + '/films/blockchain-ml/?autoplay=0', { waitUntil: 'networkidle2' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    const seek = async t => {
      await page.evaluate(t => window.CINEMA.seek(t), t);
      await page.evaluate(() => document.fonts.ready);
    };
    await seek(cue('pay') + 1);
    assert.match(await page.$eval('.cin-cap', el => el.textContent), /prediction error/i, 'captions follow the explanation');
    const readReward = async t => {
      await seek(t);
      return page.$eval('.reward-demo', el => ({
        before: parseFloat(el.querySelector('[data-bar="before"]').style.width) / 100,
        after: parseFloat(el.querySelector('[data-bar="after"]').style.width) / 100,
        delta: Number(el.dataset.delta), example: el.dataset.example, html: el.outerHTML
      }));
    };
    const helpful = await readReward(cue('pay') + 4.8);
    assert.equal(helpful.example, 'helpful'); assert.ok(helpful.delta > 0);
    assert.ok(Math.abs(helpful.before - helpful.after - helpful.delta) < .0001, 'reward equals the loss change actually drawn');
    const harmful = await readReward(cue('pay') + 10.5);
    assert.equal(harmful.example, 'harmful'); assert.ok(harmful.delta < 0);
    assert.ok(Math.abs(harmful.before - harmful.after - harmful.delta) < .0001);
    assert.equal((await readReward(cue('pay') + 4.8)).html, helpful.html, 'backwards seek resets the contribution example');
    await seek(cue('problems') + 6);
    const widths = await page.$eval('.generalisation', el => ['fit', 'test'].map(k => parseFloat(el.querySelector(`[data-bar="${k}"]`).style.width)));
    assert.ok(widths[0] < widths[1], 'own-data loss falls while separate-test loss rises');
    await seek(cue('deposit') + 5.5);
    assert.match(await page.$eval('.deposit-demo', el => el.textContent), /part of the deposit/);
    await seek(cue('deposit') + 1);
    assert.equal(await page.$eval('.deposit-demo .decision', el => el.textContent), 'Check label', 'deposit animation also resets on seek');

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
    console.log('PASS: Collaborative AI narration, captions, generalisation, computed rewards, backwards seeking and text layout');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
