#!/usr/bin/env node
/*
 * Which labels are drawn on top of each other?
 *
 * Text collisions are the defect that survives every other check: the film
 * runs, the audit passes, the scene animates, and two readouts sit in the same
 * place for four seconds. They are also easy to introduce, because a scene's
 * labels are placed by hand in one coordinate space while a later edit adds a
 * readout in another.
 *
 * So every piece of text a film draws is recorded and compared. Canvas text is
 * caught by wrapping ctx.fillText, which is the only way to see it: it leaves
 * no node behind. Three things make that recording trustworthy, all of them
 * from CLAUDE.md's account of getting them wrong:
 *
 *   - the origin goes through ctx.getTransform(), because text drawn inside a
 *     translate lands nowhere near its arguments;
 *   - the alpha is read from fillStyle as well as globalAlpha, since a label
 *     faded to nothing is still drawn and should not be reported;
 *   - glyphs of two characters or fewer are skipped, because decorative hex
 *     rain and axis ticks collide constantly and harmlessly.
 *
 * DOM text (captions, KaTeX) is measured as ink rather than as boxes: a Range
 * over the contents, and for KaTeX the .katex-html child alone, because the
 * hidden .katex-mathml copy inflates the rect by tens of pixels.
 *
 * The subtitle panel is excluded from pair reporting on purpose (CLAUDE.md:
 * overlap with chart furniture is intentional) but canvas text that lands
 * *under* it is reported separately, since that text is invisible.
 *
 *   node scripts/audit-overlap.js [slug ...] [--step 0.5] [--min 200]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const num = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? Number(argv[i + 1]) : dflt;
};
const STEP = num('--step', 0.5);
const MIN_AREA = num('--min', 200);          // logical px^2 before it is worth saying
const FILMS = argv.filter(a => !a.startsWith('--') && isNaN(Number(a)));
const SLUGS = FILMS.length ? FILMS
  : fs.readdirSync(path.join(ROOT, '_pages', 'embed'))
      .filter(f => f.endsWith('-embed.md'))
      .map(f => f.slice(0, -'-embed.md'.length))
      .sort();

const PROBE = async (step, minArea) => {
  const f = window.LabAnim.films[Object.keys(window.LabAnim.films)[0]];
  const stage = document.querySelector('.labf__stage');
  const cv = stage.querySelector('canvas');
  const scale = cv.width / 960;                 // canvas backing px per logical px

  // ---- record every fillText of the current frame -------------------------
  let frame = [];
  const proto = CanvasRenderingContext2D.prototype;
  if (!proto.__overlapPatched) {
    const orig = proto.fillText;
    proto.fillText = function (t, x, y) {
      const r = orig.apply(this, arguments);
      try { window.__recordText(this, String(t), x, y); } catch (e) {}
      return r;
    };
    proto.__overlapPatched = true;
  }
  window.__recordText = (ctx, t, x, y) => {
    const s = t.trim();
    if (s.length <= 2) return;                  // tick labels, hex rain, "$"
    let a = ctx.globalAlpha;
    const fs2 = ctx.fillStyle;
    if (typeof fs2 === 'string') {
      const m = /rgba?\([^,]+,[^,]+,[^,]+,\s*([0-9.]+)\s*\)/.exec(fs2);
      if (m) a *= parseFloat(m[1]);
    }
    if (a < 0.15) return;
    const m2 = ctx.measureText(t);
    const tr = ctx.getTransform();
    const px = tr.a * x + tr.c * y + tr.e;
    const py = tr.b * x + tr.d * y + tr.f;
    const w = m2.width * tr.a;
    const asc = (m2.actualBoundingBoxAscent || 9) * tr.d;
    const desc = (m2.actualBoundingBoxDescent || 3) * tr.d;
    let left = px;
    if (ctx.textAlign === 'center') left = px - w / 2;
    else if (ctx.textAlign === 'right' || ctx.textAlign === 'end') left = px - w;
    frame.push({ t: s, kind: 'canvas', a: a,
                 x: left / scale, y: (py - asc) / scale,
                 w: w / scale, h: (asc + desc) / scale });
  };

  // ---- DOM text: ink, not boxes ------------------------------------------
  const sr = stage.getBoundingClientRect();
  const domText = () => {
    const out = [];
    stage.querySelectorAll('.labf__node, .labf__lower, .katex').forEach(n => {
      if (n.classList.contains('katex') && n.closest('.labf__node')) return;
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      // walk ancestors: inactive scenes are hidden through .labf__texlayer
      let p = n, op = 1;
      while (p && p !== stage) {
        const s2 = getComputedStyle(p);
        if (s2.visibility === 'hidden' || s2.display === 'none') return;
        op *= parseFloat(s2.opacity || '1');
        p = p.parentElement;
      }
      if (op < 0.15) return;
      const txt = (n.innerText || '').replace(/\s+/g, ' ').trim();
      if (txt.length <= 2) return;
      // KaTeX emits a hidden mathml twin whose rect inflates the node
      const target = n.querySelector('.katex-html') || n;
      let r;
      try {
        const rng = document.createRange();
        rng.selectNodeContents(target);
        r = rng.getBoundingClientRect();
        if (!r.width || !r.height) r = target.getBoundingClientRect();
      } catch (e) { r = target.getBoundingClientRect(); }
      if (!r.width || !r.height) return;
      out.push({ t: txt.slice(0, 48), a: op,
                 kind: n.classList.contains('labf__lower') ? 'panel' : 'dom',
                 x: (r.left - sr.left) / sr.width * 960,
                 y: (r.top - sr.top) / sr.height * 540,
                 w: r.width / sr.width * 960,
                 h: r.height / sr.height * 540 });
    });
    return out;
  };

  // A scene handing over to the next draws both for a beat, so every label in
  // the outgoing scene meets every label in the incoming one. That is a
  // dissolve, not a collision, and reporting it buries the real findings.
  const starts = (f.scenes || []).map(sc => sc.start);
  const nearBoundary = (t) => starts.some(b => Math.abs(t - b) < 0.9);

  const findings = [];
  const seen = new Set();
  for (let t = 0; t <= f.duration + 1e-6; t += step) {
    frame = [];
    f.seek(t);                                  // repaints, filling `frame`
    // one draw can stroke the same string twice for a shadow pass
    const uniq = [];
    const key = new Set();
    for (const it of frame) {
      const k = it.t + '|' + Math.round(it.x) + '|' + Math.round(it.y);
      if (key.has(k)) continue;
      key.add(k); uniq.push(it);
    }
    const items = uniq.concat(domText());
    const panel = items.filter(i => i.kind === 'panel')
                       .reduce((a, i) => Math.min(a, i.y), Infinity);

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const A = items[i], B = items[j];
        if (A.kind === 'panel' || B.kind === 'panel') continue;   // intentional
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
        const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
        if (ox <= 0 || oy <= 0) continue;
        const area = ox * oy;
        if (area < minArea) continue;
        // Two states of one label swapped by opacity sit in the same place on
        // purpose and their alphas sum to one. That is a dissolve.
        const cover = area / Math.min(A.w * A.h, B.w * B.h);
        const aSum = (A.a || 1) + (B.a || 1);
        if (cover > 0.7 && aSum < 1.35) continue;
        if (nearBoundary(t)) continue;
        const k = A.t + ' :: ' + B.t;
        if (seen.has(k)) continue;
        seen.add(k);
        findings.push({ kind: 'overlap', t: +t.toFixed(1), area: Math.round(area),
                        a: A.t.slice(0, 42), b: B.t.slice(0, 42),
                        at: [Math.round(A.x), Math.round(A.y)],
                        bt: [Math.round(B.x), Math.round(B.y)] });
      }
    }

    // canvas text that has been drawn where nobody can read it
    for (const it of items) {
      if (it.kind === 'panel') continue;
      if (isFinite(panel) && it.y + it.h > panel + 4) {
        const k = 'under|' + it.t;
        if (!seen.has(k)) { seen.add(k);
          findings.push({ kind: 'under-panel', t: +t.toFixed(1), a: it.t.slice(0, 42),
                          at: [Math.round(it.x), Math.round(it.y)], panelTop: Math.round(panel) }); }
      }
      if (it.y < 46) {
        const k = 'chrome|' + it.t;
        if (!seen.has(k)) { seen.add(k);
          findings.push({ kind: 'chrome-band', t: +t.toFixed(1), a: it.t.slice(0, 42),
                          at: [Math.round(it.x), Math.round(it.y)] }); }
      }
    }
  }
  return findings;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });
  let total = 0;
  for (const slug of SLUGS) {
    let found;
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
      await page.goto(`${BASE}/lab/${slug}/embed/`, { waitUntil: 'networkidle0', timeout: 90000 });
      await page.waitForFunction(
        () => window.LabAnim && Object.keys(window.LabAnim.films).length > 0, { timeout: 60000 });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      found = await page.evaluate(PROBE, STEP, MIN_AREA);
      await page.close();
    } catch (e) { console.log(`${slug}: FAILED ${e.message}`); continue; }

    if (!found.length) { console.log(`${slug.padEnd(24)} clean`); continue; }
    total += found.length;
    console.log(`${slug.padEnd(24)} ${found.length} finding(s)`);
    found.sort((p, q) => (q.area || 0) - (p.area || 0));
    for (const f2 of found) {
      if (f2.kind === 'overlap') {
        console.log(`    t=${String(f2.t).padStart(6)}  ${String(f2.area).padStart(5)}px2  ` +
                    `"${f2.a}" @${f2.at}  x  "${f2.b}" @${f2.bt}`);
      } else if (f2.kind === 'under-panel') {
        console.log(`    t=${String(f2.t).padStart(6)}  UNDER PANEL (top ${f2.panelTop})  ` +
                    `"${f2.a}" @${f2.at}`);
      } else {
        console.log(`    t=${String(f2.t).padStart(6)}  CHROME BAND  "${f2.a}" @${f2.at}`);
      }
    }
  }
  await browser.close();
  console.log(`\n${total} finding(s) in total`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
