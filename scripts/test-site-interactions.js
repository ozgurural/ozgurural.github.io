#!/usr/bin/env node
// End-to-end regression checks. Requires the matching local Jekyll preview.
// Optional tracking requests are intercepted; no test visits are sent to Google.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  let checked = 0;
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (/googletagmanager\.com|google-analytics\.com/.test(request.url())) {
        return request.respond({ status: 200, contentType: 'application/javascript', body: '' });
      }
      request.continue();
    });
    const go = async (route) => {
      const response = await page.goto(BASE + route, { waitUntil: 'networkidle0' });
      assert.equal(response.status(), 200, route);
      await page.evaluate(() => document.fonts.ready);
    };
    const check = async (label, probe) => {
      assert.ok(await page.evaluate(probe), label);
      checked++;
      console.log('PASS: ' + label);
    };

    await page.setViewport({ width: 390, height: 844 });
    await go('/');
    await check('local assets are being tested', () => [...document.scripts].some(s => s.src.startsWith(location.origin + '/assets/js/main.min.js')));
    await page.click('#site-nav > button');
    await check('mobile menu announces open state', () => document.querySelector('#site-nav > button').getAttribute('aria-expanded') === 'true');
    await page.keyboard.press('Escape');
    await check('Escape closes menu and returns focus', () => document.activeElement === document.querySelector('#site-nav > button') && document.activeElement.getAttribute('aria-expanded') === 'false');
    await page.click('#search-toggle a');
    await page.waitForFunction(() => document.activeElement.id === 'search-input');
    await page.type('#search-input', 'Comodo');
    await page.waitForFunction(() => document.querySelector('#search-hint').textContent.includes('result'));
    await check('search finds historical projects beyond opening paragraphs', () => [...document.querySelectorAll('#search-results a')].some(a => a.pathname === '/projects/'));
    await check('search shows the matching passage in the result excerpt', () => [...document.querySelectorAll('#search-results a')].some(a => a.pathname === '/projects/' && /comodo/i.test(a.querySelector('.search-results__excerpt').textContent)));
    await check('all announced search results are reachable', () => Number(document.querySelector('#search-hint').textContent.match(/^\d+/)?.[0]) === document.querySelectorAll('#search-results a').length);
    await page.focus('#search-input');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    await check('search traps backwards focus', () => document.querySelector('#search-results').contains(document.activeElement));
    await page.keyboard.press('Tab');
    await check('search traps forward focus', () => document.activeElement.id === 'search-input');
    await page.keyboard.press('Escape');
    await check('search returns focus to its trigger', () => document.activeElement === document.querySelector('#search-toggle a'));
    const index = await (await fetch(BASE + '/search.json')).json();
    assert.ok(!index.some(d => d.url.includes('/embed/')), 'embed duplicates excluded from search');
    checked++;

    // Add one representative unlinked image before the real bundle initialises.
    // This exercises the production handler without modifying published content.
    await page.evaluateOnNewDocument(() => {
      if (!location.search.includes('interaction-fixture')) return;
      // Insert while the HTML is parsed, before deferred application scripts
      // bind image controls. DOMContentLoaded can be too late for jQuery ready.
      const insertFixture = () => {
        const content = document.querySelector('.page__content');
        if (!content) return false;
        const img = document.createElement('img');
        img.id = 'review-image';
        img.src = '/images/ozgururalpp.webp';
        img.alt = 'Portrait used by the interaction test';
        img.width = 160;
        img.height = 246;
        content.prepend(img);
        return true;
      };
      const observer = new MutationObserver(() => {
        if (insertFixture()) observer.disconnect();
      });
      if (!insertFixture()) observer.observe(document, { childList: true, subtree: true });
    });
    await go('/blog/pyqt5_image_measurer?interaction-fixture');
    await page.waitForSelector('#review-image[role="button"]');
    await page.focus('#review-image');
    await page.keyboard.press('Enter');
    await check('image zoom opens a native modal from the keyboard', () => document.querySelector('dialog.ep-lightbox-overlay:modal') && document.activeElement.classList.contains('ep-lightbox-close'));
    await page.keyboard.press('Escape');
    // The dialog is closed by the time the key press resolves, but `close` is
    // dispatched as a queued task and the cleanup lives in its handler, so the
    // DOM is read one tick too early without this wait (measured at 7ms here).
    // The assertion below still owns the verdict: a swallowed timeout leaves it
    // to report which half failed rather than a bare TimeoutError.
    await page.waitForFunction(() => !document.querySelector('.ep-lightbox-overlay')
      && document.activeElement.id === 'review-image', { polling: 'raf', timeout: 5000 })
      .catch(() => {});
    await check('image zoom restores focus and cleans up', () => !document.querySelector('.ep-lightbox-overlay') && document.activeElement.id === 'review-image');
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }));
    await page.click('.ep-copy-btn');
    await page.waitForFunction(() => document.querySelector('.ep-copy-btn').textContent === 'Copy failed');
    await check('clipboard denial is visible and recoverable', () => !document.querySelector('.ep-copy-btn').disabled);
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: text => { window.copiedText = text; return Promise.resolve(); } } }));
    await page.click('.ep-copy-btn');
    await page.waitForFunction(() => document.querySelector('.ep-copy-btn').classList.contains('copied'));
    await check('copy retry succeeds', () => window.copiedText === document.querySelector('.highlighter-rouge code').textContent);

    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await go('/');
    await check('reduced-motion visitors do not get reveal animations', () => !document.querySelector('.ep-fade-in'));
    await check('off-screen back-to-top is not a tab stop', () => document.querySelector('.ep-back-to-top').tabIndex === -1);

    assert.deepEqual(errors, [], 'uncaught browser errors');
    console.log(`${checked} interaction checks passed; no uncaught browser errors.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
