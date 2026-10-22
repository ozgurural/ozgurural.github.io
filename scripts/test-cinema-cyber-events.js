// Source, seek and presentation regressions for the Cyber Events film.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const voice = require('./cinema/cyber-events.voice.json');
const timeline = require('../assets/audio/cinema/cyber-events/timeline.json');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const cue = id => timeline.lines.find(line => line.id === id).real;

(async () => {
  assert.ok(timeline.duration <= 123.452, 'the revision does not lengthen the original film');
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
      if (message.type() === 'warn' && message.text().startsWith('cyber-events:')) errors.push(message.text());
    });
    await page.setViewport({ width: 960, height: 540 });
    const response = await page.goto(BASE + '/films/cyber-events/?autoplay=0', { waitUntil: 'networkidle2' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    const seek = async t => {
      await page.evaluate(t => window.CINEMA.seek(t), t);
      await page.evaluate(() => document.fonts.ready);
    };
    await seek(cue('count') + 1);
    assert.match(await page.$eval('.cin-cap', el => el.textContent), /detector counts/i,
      'captions follow the spoken explanation');
    const normalise = async t => { await seek(t); return page.$eval('.normalise', el => el.outerHTML); };
    const first = await normalise(cue('clean') + 2.5);
    assert.notEqual(await normalise(cue('clean') + 4.5), first, 'normalisation visibly progresses');
    await normalise(cue('why') + 3);
    assert.equal(await normalise(cue('clean') + 2.5), first, 'backwards seeking resets the normalisation');
    await seek(cue('clean') + 6);
    const cdp = await page.createCDPSession();
    await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.canonical text' });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    assert.ok(fonts.length && fonts.every(font => font.isCustomFont && font.familyName.includes('JetBrains Mono')),
      'Turkish letters use the intended webfont, without a mismatched fallback');
    await cdp.detach();
    await seek(cue('result') + 4);
    assert.equal(await page.$$eval('.dots i', nodes => nodes.length), 29);
    assert.equal(await page.$$eval('.dots i.g', nodes => nodes.length), 22);
    assert.equal(await page.$$eval('.dots i.r', nodes => nodes.length), 7);
    assert.match(await page.$eval('.result-score', el => el.textContent), /22 confirmed.*7 false alarms/);

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
    console.log('PASS: Cyber Events narration, captions, causal motion, backwards seeking, reported results and text layout');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
