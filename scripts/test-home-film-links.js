const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';

(async () => {
  const browser = await puppeteer.launch({ headless: true,
    args: process.env.CI ? ['--no-sandbox', '--enable-unsafe-swiftshader'] : [] });
  try {
    const page = await browser.newPage();
    await page.goto(BASE, { waitUntil: 'networkidle2' });
    const cards = await page.$$eval('.ep-cards > li', nodes => nodes.map((li, index) => {
      const media = li.querySelector('a.media');
      return media && { index, target: media.href, title: li.querySelector('.title').textContent.trim() };
    }).filter(Boolean));
    assert.ok(cards.length > 0, 'the featured work cards are present');
    for (const card of cards) {
      await page.goto(BASE, { waitUntil: 'networkidle2' });
      const root = (await page.$$('.ep-cards > li'))[card.index];
      let link;
      for (const candidate of await root.$$('a')) {
        const usable = await candidate.evaluate((a, target) => {
          const style = getComputedStyle(a);
          return a.href === target && a.tabIndex >= 0 && !a.closest('[aria-hidden="true"]') &&
            style.visibility !== 'hidden' && style.display !== 'none' && a.getClientRects().length > 0;
        }, card.target);
        if (usable) { link = candidate; break; }
      }
      assert.ok(link, `${card.title}: the pictured work has a keyboard-accessible link`);
      assert.ok((await link.evaluate(a => a.getAttribute('aria-label') || a.textContent)).trim(),
        `${card.title}: the link has an accessible name`);
      await link.focus();
      assert.equal(await link.evaluate(a => a === document.activeElement), true);
      const [response] = await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded' }), page.keyboard.press('Enter')
      ]);
      assert.equal(response.status(), 200, card.title);
      assert.equal(new URL(page.url()).pathname, new URL(card.target).pathname, card.title);
    }
    console.log(`PASS: keyboard navigation reaches all ${cards.length} featured media destinations`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
