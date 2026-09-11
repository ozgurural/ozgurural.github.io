#!/usr/bin/env node
// Editorial regression checks against the built players, not source timings.
// Audio duration and label geometry are covered by audit:films / audit:overlap.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const slugs = fs.readdirSync(path.join(__dirname, '../_pages/embed'))
  .filter(name => name.endsWith('-embed.md'))
  .map(name => name.replace('-embed.md', '')).sort();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true, args: ['--autoplay-policy=no-user-gesture-required']
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 1280, height: 720 });
    for (const slug of slugs) {
      await page.goto(`${BASE}/lab/${slug}/embed/`, { waitUntil: 'networkidle0' });
      await page.waitForFunction(() => window.LabAnim && Object.keys(window.LabAnim.films).length);
      await page.evaluate(() => document.fonts.ready);
      const timing = await page.evaluate(() => {
        const film = Object.values(window.LabAnim.films)[0];
        window.reviewFilm = film;
        film.pause();
        const card = film.scenes.at(-1);
        film.seek(card.start + 1.3);
        const readable = [...card.tex.querySelectorAll('.labf__caption')]
          .filter(node => node.textContent.trim())
          .every(node => Number(getComputedStyle(node).opacity) > 0.95);
        return { duration: film.duration, hook: film._audioCues[0].at,
          card: card.dur, readable };
      });
      assert.ok(timing.hook <= 1.6, `${slug}: voice hook arrives too late`);
      assert.equal(timing.card, 5, `${slug}: source card should be five seconds`);
      assert.ok(timing.readable, `${slug}: source card text is not readable early enough`);

      // Real playback: seeking alone cannot expose blocked or stalled audio.
      const sync = await page.evaluate(async slug => {
        window.globalLabMuted = false;
        window.globalLabVoice = true;
        if (slug === 'universal-jira') {
          const audio = window.reviewFilm._audioCues[0].audio;
          const original = audio.play.bind(audio);
          audio.play = function() {
            audio.play = original;
            return new Promise(resolve => setTimeout(resolve, 900)).then(original);
          };
        }
        window.reviewFilm.seek(window.reviewFilm._audioCues[0].at);
        window.reviewFilm.play();
        const film = window.reviewFilm;
        const deadline = performance.now() + 15000;
        // Arm observation in the same call as play. Under rendering load a
        // second DevTools call may not run until the first sentence is over.
        while (performance.now() < deadline) {
          const audio = window._currentLabNarrator;
          if (audio && !audio.paused && audio.currentTime > 0.15) {
            const first = film._audioCues[0];
            const cue = film._currentCue && film._currentCue.id;
            const drift = Math.abs(audio.currentTime - (film.t - first.at));
            film.pause();
            return { drift, time: film.t, audioPaused: audio.paused, cue, expected: first.id };
          }
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        throw new Error('Narration did not start within 15 seconds');
      }, slug);
      assert.equal(sync.cue, sync.expected, `${slug}: first narration cue did not play`);
      assert.ok(sync.drift < 0.5, `${slug}: initial voice drift ${sync.drift}s`);
      assert.ok(sync.audioPaused, `${slug}: pause leaves the narrator running`);
      await sleep(150);
      assert.equal(await page.evaluate(() => window.reviewFilm.t), sync.time, `${slug}: paused timeline moves`);

      await page.evaluate(() => {
        window.reviewFilm.seek(window.reviewFilm.duration - 0.2);
        window.reviewFilm.play();
      });
      await page.waitForFunction(() => !window.reviewFilm.playing, { timeout: 5000 });
      assert.ok(await page.evaluate(() => window.reviewFilm.t === window.reviewFilm.duration), `${slug}: end does not settle`);
      await page.evaluate(() => window.reviewFilm.restart());
      assert.ok(await page.evaluate(() => window.reviewFilm.playing && window.reviewFilm.t < 1), `${slug}: replay fails`);
      await page.evaluate(() => window.reviewFilm.pause());
      console.log(`PASS ${slug}: ${timing.duration.toFixed(1)}s; hook ${timing.hook}s; voice, pause, end, replay, source card`);
    }
    assert.deepEqual(errors, [], 'uncaught player errors');
    console.log(`${slugs.length}/${slugs.length} players passed.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
