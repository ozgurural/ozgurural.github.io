#!/usr/bin/env node
/*
 * Is the type on screen while its sentence is being spoken?
 *
 *   node scripts/cinema-sync-check.js securepol [--aspect 16x9]
 *
 * For every narrated line in assets/audio/cinema/<film>/timeline.json, seek to
 * just after it starts and just before it ends and list the type that is
 * visible. A line whose end shows no headline or body text fails: the scene's
 * words have left while the voice is still reading them. That is exactly what
 * happens when a film drawn for silence is stretched to fit narration and its
 * text keeps its old exit times, and on a render it looks like nothing more
 * than an empty frame, so it survives viewing. Needs the dev server.
 */
const puppeteer = require('puppeteer');
const path = require('path');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const film = process.argv[2];
const aspect = process.argv.includes('--aspect') ? process.argv[process.argv.indexOf('--aspect') + 1] : '4x5';
if (!film) { console.error('usage: cinema-sync-check.js <film> [--aspect 4x5|16x9]'); process.exit(2); }
const tl = require(path.join(__dirname, '..', 'assets', 'audio', 'cinema', film, 'timeline.json'));
const [W, H] = aspect === '16x9' ? [1920, 1080] : [1080, 1350];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
  let failed = 0;
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H });
    await page.goto(`${BASE}/films/${film}/?render=1&aspect=${aspect}`, { waitUntil: 'networkidle0', timeout: 120000 });
    await page.waitForFunction(() => !!window.CINEMA);
    await page.evaluate(() => window.CINEMA.ready);
    const shown = t => page.evaluate(tt => {
      window.CINEMA.seek(tt);
      return [...document.querySelectorAll('.cin__ui .tx')]
        .filter(e => e.style.visibility !== 'hidden' && +e.style.opacity > 0.6)
        .filter(e => !['scrim', 'kick'].some(c => e.classList.contains(c)))
        .map(e => e.className.replace('tx ', '').trim() + ': ' + e.textContent.replace(/\s+/g, ' ').trim().slice(0, 44));
    }, t);
    for (const l of tl.lines) {
      if (!l.text) continue;
      const end = l.real + l.speech - 0.15;
      const [a, b] = [await shown(l.real + 0.4), await shown(end)];
      const ok = b.length > 0;
      if (!ok) failed++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${l.id.padEnd(8)} ${l.real.toFixed(1).padStart(5)}-${end.toFixed(1).padStart(5)}s  ` +
                  `start: ${a.length} item(s), end: ${b.length ? b.join(' | ') : '(nothing on screen)'}`);
    }
  } finally {
    await browser.close();
  }
  console.log(failed ? `\n${failed} line(s) end over an empty frame` : '\nevery line ends with its words on screen');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
