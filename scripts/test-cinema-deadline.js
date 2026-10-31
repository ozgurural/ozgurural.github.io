// Visible-outcome regressions for the schematic Deadline film, not a safety proof.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const puppeteer = require('puppeteer');
const BASE = process.env.FILM_BASE || 'http://localhost:4001';
const voice = require('./cinema/deadline.voice.json');
const timeline = require('../assets/audio/cinema/deadline/timeline.json');

(async () => {
  assert.deepEqual(timeline.lines.map(l => [l.id, l.at, l.text]),
    voice.lines.map(l => [l.id, l.at, l.text]), 'voice and generated timeline agree');
  const browser = await puppeteer.launch({ headless: true,
    args: ['--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(BASE + '/films/deadline/?render=1&aspect=16x9&captions=1', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => CINEMA.ready);
    const sample = t => page.evaluate(t => {
      CINEMA.seek(t);
      const c = CINEMA._ctx;
      return {
        robot: c.opening.bot.g.position.x, stop: c.opening.stop.position.x,
        replay: c.replay.bot.g.position.x, replayStop: c.replay.stop.position.x,
        oldZ: c.snapshot.c.position.z, nowZ: c.current.c.position.z,
        arc: c.arc.material.opacity, expired: c.rejected.material.opacity,
        hand: Array.from(c.asyncClock.hand.geometry.attributes.instanceEnd.array),
        geo: c.renderer.info.memory.geometries
      };
    }, t);
    const start = await sample(0.8), late = await sample(6.2), backup = await sample(72);
    assert.ok(late.robot > start.robot + 3, 'robot visibly advances');
    assert.ok(late.robot + 1 > late.stop, 'late braking crosses the stopping line');
    assert.ok(backup.replay + 1 < backup.replayStop, 'backup stops before the line');
    const before = await sample(46), after = await sample(53);
    assert.equal(before.oldZ, after.oldZ, 'observation stays frozen');
    assert.ok(after.nowZ - before.nowZ > 1, 'current world changes');
    const age = await sample(61);
    assert.ok(age.expired > 0.99 && age.arc < 0.1, 'old observation is rejected');
    assert.notDeepEqual((await sample(36)).hand, (await sample(40)).hand,
      'controller clock moves between finished answers');

    // Measure actual ink, including inline spans and the complete author block.
    const bad = [];
    for (let t = 0.8; t < timeline.duration; t += 1) {
      await page.evaluate(t => CINEMA.seek(t), t);
      const findings = await page.evaluate(() => {
        const out = [];
        for (const e of document.querySelectorAll('.cin__ui .tx')) {
          if (e.style.visibility === 'hidden' || +e.style.opacity < 0.8 || e.classList.contains('scrim')) continue;
          const walk = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walk.nextNode())) {
            if (!n.textContent.trim()) continue;
            const range = document.createRange(); range.selectNodeContents(n);
            for (const b of range.getClientRects()) {
              if (b.left < 25 || b.right > 1895 || b.top < 25 || b.bottom > 1070)
                out.push({ text: n.textContent.slice(0, 50), rect: [b.left, b.top, b.right, b.bottom] });
            }
          }
        }
        return out;
      });
      if (findings.length) bad.push({ t, findings });
    }
    assert.deepEqual(bad, [], 'text stays inside the delivery frame');
    const warmed = await sample(97);
    for (let t = 0; t < timeline.duration; t += 0.5) await sample(t);
    assert.equal((await sample(97)).geo, warmed.geo, 'replay allocates no extra geometry');
    const digest = async t => {
      await page.evaluate(t => CINEMA.seek(t), t);
      return crypto.createHash('sha256').update(await page.screenshot({ type: 'png' })).digest('hex');
    };
    for (const t of [6.2, 28, 39, 49.5, 62, 69, 80, 94]) {
      const original = await digest(t);
      await page.evaluate(() => { CINEMA.seek(95); CINEMA.seek(0.1); });
      assert.equal(await digest(t), original, 'identical frame after backward seek at ' + t);
    }
    assert.deepEqual(errors, [], 'no browser exceptions');
    console.log('PASS: voice parity, braking, stale observation, expiry, independent clock, text bounds, replay geometry, deterministic seek');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
