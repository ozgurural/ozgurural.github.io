#!/usr/bin/env node
/*
 * Does any page's layout break at a common screen width?
 *
 *   FILM_BASE=http://localhost:4001 node scripts/layout-check.js            # nav pages
 *   FILM_BASE=http://localhost:4001 node scripts/layout-check.js / /cv/     # these pages
 *
 * Loads each page at the widths people actually use, from a phone to a wide
 * desktop, and reports what a screenshot at one width hides:
 *   - horizontal overflow (the page scrolls sideways)
 *   - the author sidebar's text running out of its column into the page
 *   - the sidebar and the page column overlapping
 *   - the masthead and the page not sharing one centre line
 *   - visible text clipped by its own box (ellipsis or overflow hidden)
 * It measures ink (a Range over each text node), not boxes, since a box keeps
 * its width while the words inside it run past it.
 */
const puppeteer = require('puppeteer');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const WIDTHS = [375, 414, 768, 1024, 1280, 1366, 1440, 1536, 1920];
const args = process.argv.slice(2).map(a => a.replace(/^[A-Za-z]:\/Program Files\/Git/, ''));

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  let pages = args;
  if (!pages.length) {
    const p = await browser.newPage();
    await p.goto(BASE + '/', { waitUntil: 'networkidle2' });
    pages = ['/', ...await p.$$eval('.masthead a[href], .greedy-nav a[href]', as =>
      [...new Set(as.map(a => new URL(a.href).pathname).filter(u => u !== '/' && !/\.(pdf|xml)$/.test(u)))])];
    await p.close();
  }
  let problems = 0;
  for (const url of pages) {
    for (const w of WIDTHS) {
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1, isMobile: w < 768, hasTouch: w < 768 });
      await page.goto(BASE + url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      const out = await page.evaluate(() => {
        const r = [];
        const vis = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
          const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } return true; };
        const ink = el => { const rects = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n; (n = tw.nextNode());) { if (!n.textContent.trim() || !vis(n.parentElement)) continue;
            const rg = document.createRange(); rg.selectNodeContents(n);
            for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) rects.push({ q, t: n.textContent.trim().slice(0, 40) }); }
          return rects; };
        const de = document.documentElement;
        if (de.scrollWidth > innerWidth + 1) r.push(`page scrolls sideways: ${de.scrollWidth} > ${innerWidth}`);
        const side = document.querySelector('.sidebar');
        const col = document.querySelector('#main > .page, #main > .archive, #main > article, #main > .ep-home');
        if (side && vis(side) && col) {
          const sb = side.getBoundingClientRect(), cb = col.getBoundingClientRect();
          const sideBeside = sb.right <= cb.left + 1 || sb.left >= cb.right - 1;
          const sideAbove = sb.bottom <= cb.top + 1 || sb.top >= cb.bottom - 1;
          if (!sideBeside && !sideAbove) r.push(`sidebar box ${Math.round(sb.left)}-${Math.round(sb.right)} overlaps page column ${Math.round(cb.left)}-${Math.round(cb.right)}`);
          if (sideBeside) {
            // only the part of the page beside the sidebar, vertically
            for (const { q, t } of ink(side)) if (q.right > cb.left + 1 && q.left < cb.left && q.top < sb.bottom)
              { r.push(`sidebar text runs into the page column (${Math.round(q.right)} > ${Math.round(cb.left)}): "${t}"`); break; }
            for (const { q, t } of ink(side)) if (q.right > sb.right + 2) { r.push(`sidebar text runs out of its box (${Math.round(q.right)} > ${Math.round(sb.right)}): "${t}"`); break; }
          }
        }
        const mh = document.querySelector('.masthead__inner-wrap, .masthead .greedy-nav, .masthead');
        const main = document.querySelector('#main');
        if (mh && main && innerWidth >= 1024) {
          const a = mh.getBoundingClientRect(), b = main.getBoundingClientRect();
          const ca = (a.left + a.right) / 2, cb2 = (b.left + b.right) / 2;
          r.push(`info: masthead ${Math.round(a.left)}-${Math.round(a.right)}, #main ${Math.round(b.left)}-${Math.round(b.right)}${col ? `, column ${Math.round(col.getBoundingClientRect().left)}-${Math.round(col.getBoundingClientRect().right)}` : ''}${side && vis(side) ? `, sidebar ${Math.round(side.getBoundingClientRect().left)}-${Math.round(side.getBoundingClientRect().right)}` : ''}`);
          if (Math.abs(ca - cb2) > 24) r.push(`masthead centre ${Math.round(ca)} vs page centre ${Math.round(cb2)}`);
        }
        // text clipped by its own box
        for (const el of document.querySelectorAll('body *')) {
          if (!el.children.length && el.textContent.trim() && vis(el)) {
            const s = getComputedStyle(el);
            if ((s.overflow === 'hidden' || s.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 2)   // 1px boxes are screen-reader text, hidden on purpose
              r.push(`text clipped (${el.scrollWidth} in ${el.clientWidth}): <${el.tagName.toLowerCase()} class="${el.className}"> "${el.textContent.trim().slice(0, 40)}"`);
          }
        }
        return r;
      });
      const real = out.filter(x => !x.startsWith('info:'));
      problems += real.length;
      if (out.length) console.log(`${url} @${w}\n  ${out.join('\n  ')}`);
      await page.close();
    }
  }
  await browser.close();
  console.log(`\n${problems} problem(s)`);
  process.exit(problems ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
