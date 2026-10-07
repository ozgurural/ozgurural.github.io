#!/usr/bin/env node
/*
 * Screenshot pages the way a visitor first sees them, on a desktop and a phone,
 * for a visual review of the site.
 *
 *   node scripts/page-shots.js / /lab/ /publications/
 *   FILM_BASE=http://localhost:4001 node scripts/page-shots.js --full --out dist/shots /cv/
 *
 * Writes <out>/<slug>-desktop.png (1440x900) and <slug>-mobile.png (375x812 at
 * 2x, a phone's real pixels). --full captures the whole page instead of the
 * first screen. The preview pane is no substitute: a hidden tab paints late,
 * and its screenshots showed a sidebar that measurement said was gone.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const args = process.argv.slice(2);
const full = args.includes('--full');
const oi = args.indexOf('--out');
const out = oi >= 0 ? args[oi + 1] : path.join(__dirname, '..', 'dist', 'shots');
// Git Bash rewrites an argument like /lab/ into C:/Program Files/Git/lab/
// before node sees it (MSYS path conversion); take the path back out of it.
const pages = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out')
  .map(a => a.replace(/^[A-Za-z]:\/Program Files\/Git/, '').replace(/^(?!\/)/, '/'));
const VIEWS = [
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
  { name: 'mobile', width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu'] });
  try {
    for (const p of pages) {
      const slug = p.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home';
      for (const v of VIEWS) {
        const page = await browser.newPage();
        await page.setViewport(v);
        if (v.isMobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
        await page.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 });
        // let fonts settle and any reveal-on-load transitions finish
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await new Promise(r => setTimeout(r, 1200));
        const file = path.join(out, `${slug}-${v.name}.png`);
        await page.screenshot({ path: file, fullPage: full });
        const info = await page.evaluate(() => ({
          h: document.documentElement.scrollHeight,
          overflow: document.documentElement.scrollWidth > innerWidth,
        }));
        console.log(`${file}  page ${info.h}px${info.overflow ? '  HORIZONTAL OVERFLOW' : ''}`);
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
