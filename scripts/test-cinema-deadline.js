// The timing experiment is tested separately by test-deadline-model.js.
// This checks the narrated story, its actual status readouts and both layouts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const voice = require('./cinema/deadline.voice.json');
const tl = require('../assets/audio/cinema/deadline/timeline.json');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const realAt = t => {
  const a = tl.anchors;
  let i = 0; while (i < a.length - 2 && t > a[i + 1][1]) i++;
  return a[i][0] + (t - a[i][1]) * (a[i + 1][0] - a[i][0]) / (a[i + 1][1] - a[i][1]);
};

(async () => {
  for (const line of voice.lines) {
    const built = tl.lines.find(l => l.id === line.id);
    assert.equal(built.text, line.text, line.id + ': current narration');
    assert.equal(built.at, line.at, line.id + ': current cue');
    if (line.text) assert.ok(built.words.length, line.id + ': word timings');
  }
  const browser = await puppeteer.launch({ headless: true,
    args: process.env.CI ? ['--no-sandbox', '--enable-unsafe-swiftshader'] : [] });
  try {
    for (const [aspect, width, height] of [['16x9', 960, 540], ['9x16', 375, 667]]) {
      const page = await browser.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'warn' && m.text().startsWith('deadline:')) errors.push(m.text()); });
      await page.setViewport({ width, height, hasTouch: aspect === '9x16' });
      const response = await page.goto(`${BASE}/films/deadline/?autoplay=0&aspect=${aspect}`, { waitUntil: 'networkidle2' });
      assert.equal(response.status(), 200);
      await page.waitForFunction(() => !!window.CINEMA);
      await page.evaluate(() => window.CINEMA.ready);
      await page.evaluate(() => document.fonts.ready);
      assert.deepEqual(await page.evaluate(() => [window.CINEMA.W, window.CINEMA.H]), aspect === '9x16' ? [1080, 1920] : [1920, 1080]);
      const seek = t => page.evaluate(t => window.CINEMA.seek(t), t);
      const read = async authored => {
        await seek(realAt(authored));
        return page.$eval('.deadline-evidence', el => ({ blocked: el.dataset.blocked, html: el.outerHTML, text: el.textContent }));
      };
      assert.equal((await read(30)).blocked, 'true', 'blocking inference visibly stalls control');
      assert.equal((await read(40)).blocked, 'false', 'separate inference no longer blocks this loop');
      assert.equal((await read(78.2)).blocked, 'true', 'shared contention can still stall asynchronous control');
      assert.equal((await read(83)).blocked, 'false', 'isolation removes the deliberately injected stall');
      const initial = await read(30); await read(83);
      assert.equal((await read(30)).html, initial.html, 'backwards seek restores the actual status');
      await seek(tl.lines.find(l => l.id === 'contract').real + 1);
      assert.ok(await page.$eval('.cin-cap', el => el.textContent.length > 0), 'captions are present');
      const failures = [];
      for (const line of tl.lines) {
        const times = line.text ? [line.real + .5, line.real + line.speech - .12] : [line.real + 2];
        for (const t of times) {
          await seek(t);
          const problems = await page.evaluate(id => {
            const stage = document.querySelector('.cin').getBoundingClientRect();
            const cap = document.querySelector('.cin-cap'), cr = cap.getBoundingClientRect();
            const visible = el => {
              for (let n = el; n && n !== document.body; n = n.parentElement) {
                const st = getComputedStyle(n);
                if (st.display === 'none' || st.visibility === 'hidden' || +st.opacity < .6) return false;
              } return true;
            };
            const out = [];
            const main = id === 'card' ? '.end' : id === 'close' ? '.cl__a, .cl__b' : '.blk';
            if (![...document.querySelectorAll(main)].some(visible)) out.push('main story text disappeared during its spoken cue');
            for (const el of document.querySelectorAll('.cin__ui .tx, .cin__ui .lb, .cin-cap')) {
              if (!visible(el)) continue;
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              for (let n; (n = walker.nextNode());) {
                if (!n.textContent.trim() || !visible(n.parentElement)) continue;
                const range = document.createRange(); range.selectNodeContents(n);
                for (const r of range.getClientRects()) {
                  if (r.width < 1) continue;
                  if (r.left < stage.left - 1 || r.right > stage.right + 1 || r.top < stage.top - 1 || r.bottom > stage.bottom + 1) out.push('clipped: ' + n.textContent);
                  if (el !== cap && visible(cap) && r.left < cr.right && r.right > cr.left && r.top < cr.bottom && r.bottom > cr.top) out.push('caption overlap: ' + n.textContent);
                }
              }
            } return out;
          }, line.id);
          if (problems.length) failures.push({ line: line.id, t, problems });
        }
      }
      assert.deepEqual(failures, [], aspect + ': spoken cue edges fit and clear captions');
      if (aspect === '9x16') {
        for (const t of [2, 30, 50, 60, 69, 78, 91, 99]) {
          await seek(realAt(t));
          if (process.env.DEADLINE_SHOTS) {
            fs.mkdirSync(process.env.DEADLINE_SHOTS, { recursive: true });
            await page.screenshot({ path: path.join(process.env.DEADLINE_SHOTS, `phone-${t}.png`) });
          }
        }
        assert.ok(await page.$eval('html', el => el.classList.contains('cinema-portrait')));
        await page.evaluate(() => {
          document.documentElement.requestFullscreen = async () => { window.deadlineFullscreenRequested = true; };
          Object.defineProperty(screen.orientation, 'lock', { configurable: true,
            value: async orientation => { window.deadlineOrientation = orientation; } });
          document.documentElement.classList.add('is-pseudo-fs');
        });
        assert.equal(await page.$eval('.cin-rotate', el => getComputedStyle(el).display), 'none', 'portrait film never asks the viewer to turn sideways');
        await page.click('[data-act="fullscreen"]');
        await page.waitForFunction(() => window.deadlineFullscreenRequested && window.deadlineOrientation === 'portrait');
      }
      assert.deepEqual(errors, [], 'no browser errors or cue mismatch');
      await page.close();
    }
    const lab = await browser.newPage();
    await lab.setViewport({ width: 390, height: 844, hasTouch: true });
    await lab.goto(`${BASE}/lab/determinism/`, { waitUntil: 'networkidle2' });
    const frame = await lab.$eval('.deadline-film-frame', el => {
      const r = el.getBoundingClientRect(), i = el.querySelector('iframe').getBoundingClientRect();
      return { ratio: r.width / r.height, fill: Math.abs(r.height - i.height) };
    });
    assert.ok(Math.abs(frame.ratio - 9 / 16) < .01 && frame.fill <= 2.1, 'mobile lab embeds the native portrait layout inside its two border pixels');
    await lab.close();
    console.log('PASS: Deadline narration, native portrait and fullscreen, mobile embed, blocking/contention readouts, captions, deterministic seeking and text bounds');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
