// Regression checks for audio state and real film presentation.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required',
      ...(process.env.CI ? ['--no-sandbox', '--enable-unsafe-swiftshader'] : [])]
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 640, height: 360 });
    await page.evaluateOnNewDocument(() => {
      window.testAudio = [];
      window.Audio = new Proxy(window.Audio, {
        construct(Type, args) {
          const audio = new Type(...args);
          window.testAudio.push(audio);
          return audio;
        }
      });
    });
    const open = async slug => {
      const response = await page.goto(BASE + '/films/' + slug + '/?autoplay=0', { waitUntil: 'networkidle2' });
      assert.equal(response.status(), 200);
      await page.waitForFunction(() => !!window.CINEMA);
      await page.evaluate(() => window.CINEMA.ready);
    };
    const state = () => page.evaluate(() => ({
      paused: document.querySelector('.cin-wrap').classList.contains('is-paused'),
      audioPaused: window.testAudio[0].paused,
      muted: window.testAudio[0].muted
    }));
    await open('model-heist');
    assert.equal(await page.$eval('[data-act="cc"]', el => getComputedStyle(el).display), 'none',
      'films without captions do not show a dead CC button');

    await open('securepol');
    assert.notEqual(await page.$eval('[data-act="cc"]', el => getComputedStyle(el).display), 'none',
      'SecurePoL offers captions for sound-off playback');
    const securepol = require('../assets/audio/cinema/securepol/timeline.json');
    const cue = id => securepol.lines.find(line => line.id === id).real;
    await page.evaluate(t => window.CINEMA.seek(t), cue('copy') + 1);
    assert.match(await page.$eval('.cin-cap', el => el.textContent), /trained model/,
      'SecurePoL displays the spoken phrase, rather than an empty caption track');
    await page.setViewport({ width: 812, height: 375, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    await page.evaluate(t => window.CINEMA.seek(t), cue('copy') + 1);
    assert.equal(await page.evaluate(() => {
      const cap = document.querySelector('.cin-cap').getBoundingClientRect();
      return [...document.querySelectorAll('.cin-controls button, [data-act="seek"], .cin-time')].some(el => {
        const r = el.getBoundingClientRect();
        return r.left < cap.right && r.right > cap.left && r.top < cap.bottom && r.bottom > cap.top;
      });
    }), false, 'landscape phone controls do not cross the paused caption');
    await page.setViewport({ width: 640, height: 360, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    const handoff = async t => page.evaluate(t => {
      window.CINEMA.seek(t);
      return document.querySelector('.handoff').innerHTML;
    }, t);
    const before = await handoff(cue('car') + 1);
    assert.notEqual(await handoff(cue('car') + 2), before, 'the handoff advances while its explanation plays');
    await handoff(cue('cloud') + 3);
    assert.equal(await handoff(cue('car') + 1), before,
      'seeking back resets the handoff and verdict without depending on previous playback');
    for (const id of ['forged', 'scrub']) {
      const overlap = await page.evaluate(t => {
        window.CINEMA.seek(t);
        const cap = document.querySelector('.cin-cap').getBoundingClientRect();
        return [...document.querySelectorAll('.credit')]
          .filter(el => el.style.visibility !== 'hidden' && Number(el.style.opacity) > 0.6)
          .some(el => {
            const r = el.getBoundingClientRect();
            return r.left < cap.right && r.right > cap.left && r.top < cap.bottom && r.bottom > cap.top;
          });
      }, cue(id) + 1);
      assert.equal(overlap, false, `${id}: captions keep the source and attack-scope notes readable`);
    }

    await page.evaluate(() => { window.CINEMA.play(true); window.CINEMA.pause(); });
    await new Promise(resolve => setTimeout(resolve, 350));
    assert.equal((await state()).audioPaused, true, 'a cancelled play request cannot restart audio');
    assert.equal((await state()).paused, true);

    // Pausing a muted autoplay must pause, rather than switch its sound on.
    await open('securepol');
    await page.evaluate(() => window.CINEMA.play());
    await page.click('[data-act="play"]');
    assert.equal((await state()).paused, true, 'the Pause button always pauses muted playback');
    assert.equal((await state()).muted, true);

    await page.click('.cin-controls [data-act="sound"]');
    assert.equal((await state()).muted, false, 'unmuting starts with sound');
    await page.evaluate(() => window.CINEMA.pause());
    await page.click('.cin-controls [data-act="sound"]');
    assert.deepEqual(await state(), { paused: true, audioPaused: true, muted: true },
      'muting a paused film preserves the pause and the mute');
    await page.click('[data-act="play"]');
    assert.equal((await state()).muted, true, 'resume respects the viewer mute choice');
    await page.click('[data-act="play"]');
    assert.equal((await state()).paused, true, 'Pause also works after an explicit mute');

    // Control the rejection schedule to reproduce an old autoplay denial
    // arriving after a newer play request has already been started.
    await page.click('.cin-controls [data-act="sound"]');
    await page.evaluate(() => window.CINEMA.pause());
    const stale = await page.evaluate(async () => {
      const audio = window.testAudio[0], original = audio.play;
      let rejectOld, calls = 0;
      audio.play = () => ++calls === 1 ? new Promise((_, reject) => { rejectOld = reject; }) : Promise.resolve();
      window.CINEMA.play(true);
      window.CINEMA.pause();
      window.CINEMA.play(true);
      rejectOld(new DOMException('Autoplay denied', 'NotAllowedError'));
      await new Promise(resolve => setTimeout(resolve, 0));
      const result = { calls, muted: audio.muted };
      window.CINEMA.pause();
      audio.play = original;
      return result;
    });
    assert.deepEqual(stale, { calls: 2, muted: false }, 'an obsolete denial cannot mute or replay the current request');
    const denied = await page.evaluate(async () => {
      const audio = window.testAudio[0], original = audio.play;
      const attempts = [];
      audio.play = () => {
        attempts.push(audio.muted);
        return attempts.length === 1 ? Promise.reject(new DOMException('Autoplay denied', 'NotAllowedError')) : Promise.resolve();
      };
      window.CINEMA.play(true);
      await new Promise(resolve => setTimeout(resolve, 0));
      window.CINEMA.pause();
      audio.play = original;
      return attempts;
    });
    assert.deepEqual(denied, [false, true], 'a current autoplay denial still retries muted');

    await open('level-d');
    assert.notEqual(await page.$eval('[data-act="cc"]', el => getComputedStyle(el).display), 'none',
      'the film with captions keeps its CC button');
    const clipped = await page.evaluate(() => {
      const label = [...document.querySelectorAll('.lb')].find(el => el.textContent === 'A person, for scale');
      const failures = [];
      for (let t = 16.5; t <= 21.2; t += 0.2) {
        window.CINEMA.seek(t);
        if (+label.style.opacity < 0.6) continue;
        const r = label.getBoundingClientRect(), stage = document.querySelector('.cin').getBoundingClientRect();
        if (r.top < stage.top || r.bottom > stage.bottom || r.left < stage.left || r.right > stage.right) failures.push(t);
      }
      return failures;
    });
    assert.deepEqual(clipped, [], 'the person annotation remains inside the reveal frame');

    // Emulate the iPhone path, where arbitrary elements cannot go fullscreen.
    // Read the first message's layout, before any CSS transition can settle.
    await page.evaluateOnNewDocument(() => {
      Element.prototype.requestFullscreen = undefined;
      Element.prototype.webkitRequestFullscreen = undefined;
    });
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(BASE + '/lab/level-d-60hz/', { waitUntil: 'networkidle2' });
    const frame = page.frames().find(frame => frame.url().includes('/films/level-d/'));
    assert.ok(frame, 'the real lab page embeds the film');
    await frame.waitForFunction(() => !!window.CINEMA);
    await frame.evaluate(() => window.CINEMA.ready);
    await page.evaluate(() => {
      window.testFullscreenBox = null;
      addEventListener('message', event => {
        if (event.origin !== location.origin || event.data?.type !== 'cinema:fullscreen' || !event.data.on) return;
        const rect = document.querySelector('.lab-film__frame.is-pseudo-fs').getBoundingClientRect();
        window.testFullscreenBox = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      });
    });
    await frame.click('[data-act="fullscreen"]');
    await page.waitForFunction(() => window.testFullscreenBox !== null);
    assert.deepEqual(await page.evaluate(() => window.testFullscreenBox), { x: 0, y: 0, width: 375, height: 812 },
      'fullscreen covers the viewport immediately, including while the parent has a reveal transition');
    await page.setViewport({ width: 812, height: 375, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.waitForFunction(() => {
      const r = document.querySelector('.lab-film__frame.is-pseudo-fs').getBoundingClientRect();
      return r.x === 0 && r.y === 0 && r.width === innerWidth && r.height === innerHeight;
    });
    await frame.click('[data-act="fullscreen"]');
    await page.waitForFunction(() => !document.documentElement.classList.contains('cin-fs-lock'));
    assert.equal(await page.$('.lab-film__frame.is-pseudo-fs'), null, 'exiting fullscreen restores the embedded player');
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    console.log('PASS: cancelled audio, autoplay denial races, mute/pause/resume, CC visibility, reveal annotation and mobile fullscreen');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
