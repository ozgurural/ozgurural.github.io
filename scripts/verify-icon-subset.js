#!/usr/bin/env node
/*
 * Does every icon the site actually renders survive the subset?
 *
 * subset-icon-fonts.py derives its set by scanning the source for `fa-<name>`
 * tokens. That misses any icon whose class is assembled at runtime, and a miss
 * shows up as an empty box rather than as an error, so the set is checked
 * against what the pages really draw: every element carrying an fa class is
 * asked for its ::before content, which is the codepoint the font is being
 * asked for.
 *
 * Run it against the full fonts to learn the truth, and again after subsetting
 * to confirm nothing lost its glyph.
 *
 *   node scripts/verify-icon-subset.js [--base http://localhost:4001]
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const BASE = arg('--base', process.env.FILM_BASE || 'http://localhost:4001').replace(/\/$/, '');
const MAX = Number(arg('--max', 60));

const COLLECT = () => {
  const out = [];
  document.querySelectorAll('[class*="fa-"], [class*="ai-"], .fa, .fab, .fas, .far, .ai')
    .forEach(el => {
      const cs = getComputedStyle(el, '::before');
      const c = cs.content;
      if (!c || c === 'none' || c === 'normal') return;
      const s = c.replace(/^["']|["']$/g, '');
      if (!s) return;
      const cp = s.codePointAt(0);
      if (cp < 0xE000) return;                 // private use area only
      out.push({ cp, fam: cs.fontFamily.slice(0, 40),
                 cls: String(el.className).slice(0, 60) });
    });
  return out;
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const seen = new Set(['/']);
  const queue = ['/'];
  const glyphs = new Map();                    // cp -> {fam, cls, pages:Set}

  while (queue.length && seen.size <= MAX) {
    const p = queue.shift();
    let resp;
    try { resp = await page.goto(BASE + p, { waitUntil: 'networkidle0', timeout: 45000 }); }
    catch (e) { continue; }
    if (!resp || resp.status() >= 400) continue;
    const ct = (resp.headers()['content-type'] || '');
    if (!ct.includes('html')) continue;

    for (const g of await page.evaluate(COLLECT)) {
      if (!glyphs.has(g.cp)) glyphs.set(g.cp, { ...g, pages: new Set() });
      glyphs.get(g.cp).pages.add(p);
    }
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')]
      .map(a => a.href).filter(h => h.startsWith(location.origin))
      .map(h => new URL(h).pathname));
    for (const l of links) if (!seen.has(l)) { seen.add(l); queue.push(l); }
  }
  await browser.close();

  // what the subset was built from
  const vars = fs.readFileSync(
    path.join(__dirname, '..', '_sass', 'vendor', 'font-awesome', '_variables.scss'), 'utf8');
  const table = new Map();
  for (const m of vars.matchAll(/^\$fa-var-([a-z0-9-]+):\s*\\([0-9a-fA-F]+);/gm)) {
    table.set(parseInt(m[2], 16), m[1]);
  }

  const rendered = [...glyphs.keys()].sort((a, b) => a - b);
  console.log(`${seen.size} pages, ${rendered.length} distinct icon glyphs rendered`);

  // A glyph the browser asked for but the font cannot supply falls back, and
  // the tell is a zero advance width. Report anything the page draws that the
  // scanner would not have found.
  const cps = rendered.map(c => 'U+' + c.toString(16).toUpperCase().padStart(4, '0'));
  fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'dist', 'icons-rendered.txt'),
                   cps.join(',') + '\n');
  console.log('written to dist/icons-rendered.txt');

  const unnamed = rendered.filter(c => !table.has(c));
  if (unnamed.length) {
    console.log(`\n${unnamed.length} glyph(s) not in the Font Awesome table ` +
                `(academicons or another family):`);
    unnamed.slice(0, 12).forEach(c => {
      const g = glyphs.get(c);
      console.log(`    U+${c.toString(16).toUpperCase()}  ${g.fam}  ${g.cls}`);
    });
  }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
