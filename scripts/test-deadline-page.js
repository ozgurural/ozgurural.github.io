const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE + '/lab/determinism/', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.__deadlineExperiment);
    const initial = await page.evaluate(() => window.__deadlineExperiment);
    assert.equal(initial.asyncStats.misses, 0);
    await page.click('#deadline-shared');
    assert.equal(await page.$eval('#deadline-async', e => e.textContent), '6 / 360');
    await page.click('#deadline-outage');
    assert.ok(await page.evaluate(() => window.__deadlineExperiment.asyncStats.fresh) < initial.asyncStats.fresh);
    await page.focus('#deadline-delay'); await page.keyboard.press('ArrowRight');
    assert.equal(await page.$eval('#deadline-delay-value', e => e.textContent), '88 ms');
    // Inspect the actual download payload without a filesystem-dependent dialog.
    await page.evaluate(() => { URL.createObjectURL = blob => { window.downloadedTrace = blob; return 'blob:test'; }; HTMLAnchorElement.prototype.click = function () {}; });
    await page.click('#deadline-download');
    assert.equal(await page.evaluate(async () => JSON.parse(await window.downloadedTrace.text()).options.delay), 88);
    await page.click('#deadline-reset');
    assert.deepEqual(await page.evaluate(() => window.__deadlineExperiment), initial);
    for (const width of [320, 390, 1280]) {
      await page.setViewport({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow at ${width}px`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: live controls, contention, outage, keyboard range, trace download, reset and mobile overflow');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
