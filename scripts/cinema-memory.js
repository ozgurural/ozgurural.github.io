#!/usr/bin/env node
/*
 * Does a cinema film leak GPU buffers or churn memory while it plays?
 *
 *   FILM_BASE=http://localhost:4001 node scripts/cinema-memory.js level-d 40 130
 *
 * Opens /films/<slug>/ as a phone would (375x812 at 3x, touch), seeks through
 * [from, to] one frame at a time at 30 fps, and every few seconds of film
 * reports the live WebGLBuffer objects (before and after a forced GC), the
 * JS heap, and three.js's own counts. A count that only falls after GC is
 * churn; one that keeps rising after GC is a leak. Phones kill a tab that
 * runs out of memory, which looks to the viewer like the film closing itself.
 */
const puppeteer = require('puppeteer');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const [film = 'level-d', from = '0', to = '60'] = process.argv.slice(2);

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu', '--js-flags=--expose-gc'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.goto(`${BASE}/films/${film}/?autoplay=0`, { waitUntil: 'networkidle2', timeout: 90000 });
    await page.waitForFunction(() => !!window.CINEMA, { timeout: 60000 });
    await page.evaluate(() => window.CINEMA.ready);
    const cdp = await page.target().createCDPSession();
    const proto = await cdp.send('Runtime.evaluate', { expression: 'WebGLBuffer.prototype' });
    const buffers = async () => {
      const q = await cdp.send('Runtime.queryObjects', { prototypeObjectId: proto.result.objectId });
      const n = await cdp.send('Runtime.callFunctionOn', { objectId: q.objects.objectId, functionDeclaration: 'function () { return this.length; }', returnByValue: true });
      return n.result.value;
    };
    const heap = () => page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null));
    const three = () => page.evaluate(() => {
      const r = window.CINEMA._composer.renderer, m = r.info.memory;
      return { geo: m.geometries, tex: m.textures, prog: r.info.programs ? r.info.programs.length : null };
    });
    console.log(`${film} ${from}..${to}s at 30 fps, phone viewport`);
    console.log('   t    buffers  after-GC  heap MB  geometries textures programs');
    const a = Number(from), b = Number(to), step = 1 / 30, every = 5;
    for (let t0 = a; t0 < b; t0 += every) {
      await page.evaluate((s, e, dt) => { for (let t = s; t < e; t += dt) window.CINEMA.seek(t); }, t0, Math.min(b, t0 + every), step);
      const before = await buffers();
      await cdp.send('HeapProfiler.collectGarbage');
      const after = await buffers();
      const h = await heap(), k = await three();
      console.log(`${String(Math.round(t0 + every)).padStart(4)}  ${String(before).padStart(8)}  ${String(after).padStart(8)}  ${String(h).padStart(7)}  ${String(k.geo).padStart(10)} ${String(k.tex).padStart(8)} ${String(k.prog).padStart(8)}`);
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
