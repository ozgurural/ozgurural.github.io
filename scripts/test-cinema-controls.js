// Keyboard regression checks against the shared engine in a real cinema film.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    // Hosted Linux runners have no GPU and restrict Chrome's sandbox setup.
    // These flags apply only to the disposable CI browser testing this build.
    args: process.env.CI ? ['--no-sandbox', '--enable-unsafe-swiftshader'] : []
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 640, height: 360 });
    const response = await page.goto(BASE + '/films/level-d/?autoplay=0', { waitUntil: 'networkidle2' });
    assert.equal(response.status(), 200, 'the built cinema page is available');
    const moduleUrl = await page.$eval('script[type="module"][src]', el => el.src);
    assert.equal(new URL(moduleUrl).origin, new URL(BASE).origin, 'test the local build rather than production assets');
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    const paused = () => page.$eval('.cin-wrap', el => el.classList.contains('is-paused'));
    const captions = () => page.$eval('[data-act="cc"]', el => el.getAttribute('aria-pressed'));
    const initial = await captions();

    await page.focus('[data-act="cc"]');
    await page.keyboard.press('Space');
    assert.notEqual(await captions(), initial, 'Space activates the focused Captions button');
    assert.equal(await paused(), true, 'caption activation does not start playback');
    await page.keyboard.press('Enter');
    assert.equal(await captions(), initial, 'Enter also activates Captions');

    // Move the pointer away: keyboard focus alone must keep controls visible.
    await page.mouse.move(-10, -10);
    assert.equal(await page.$eval('.cin-wrap', el => el.matches(':hover')), false);
    await page.evaluate(() => window.CINEMA.play());
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.cin-controls')).opacity) > 0.99);
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.ok(await page.$eval('.cin-controls', el => Number(getComputedStyle(el).opacity)) > 0.99,
      'focused controls stay visible during playback');
    await page.evaluate(() => window.CINEMA.pause());

    await page.focus('[data-act="seek"]');
    await page.keyboard.press('End');
    assert.equal(await page.evaluate(() => window.CINEMA.t), await page.evaluate(() => window.CINEMA.duration));
    await page.keyboard.press('ArrowLeft');
    assert.equal(await page.evaluate(() => window.CINEMA.t), await page.evaluate(() => window.CINEMA.duration - 5));
    await page.keyboard.press('Home');
    assert.equal(await page.evaluate(() => window.CINEMA.t), 0);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => window.CINEMA.t), 5);

    await page.focus('[data-act="play"]');
    await page.keyboard.press('Space');
    assert.equal(await paused(), false, 'Space on Play starts playback');
    await page.keyboard.press('Space');
    assert.equal(await paused(), true, 'Space on Pause stops playback');
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    console.log('PASS: native caption/play keys, focus visibility, slider endpoints and arrow seeking');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
