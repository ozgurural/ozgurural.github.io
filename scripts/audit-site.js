#!/usr/bin/env node
/*
 * What is wrong with the site right now.
 *
 * Crawls every page the navigation and the collections reach, and reports the
 * things that are wrong in a way nothing else notices: a link that 404s, an
 * image with no alt text, a heading level skipped, a page with no description,
 * a tap target too small to hit on a phone, a page that scrolls sideways.
 *
 * It is deliberately a crawler rather than a file scan. Half of these defects
 * only exist in the rendered page: Liquid decides the meta tags, the layout
 * decides the heading order, and a link written as a relative path is only
 * broken once it has been resolved against the permalink it ended up at.
 *
 *   node scripts/audit-site.js [--base http://localhost:4001] [--max 200]
 */
const puppeteer = require('puppeteer');

const argv = process.argv.slice(2);
const arg = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : dflt;
};
const BASE = arg('--base', process.env.FILM_BASE || 'http://localhost:4001').replace(/\/$/, '');
const MAX = Number(arg('--max', 200));
const ONLY = arg('--only', null);

const PAGE_CHECKS = () => {
  const out = { links: [], issues: [] };
  const origin = location.origin;

  // every internal link, so the crawl can follow them and the checker can test
  // them; mailto/tel/#fragment are not pages
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    let u;
    try { u = new URL(a.href); } catch (e) { return; }
    if (u.origin !== origin) return;
    out.links.push(u.pathname + u.search);
    const text = (a.innerText || '').replace(/\s+/g, ' ').trim();
    const label = text || a.getAttribute('aria-label') || a.querySelector('img[alt]')?.alt || '';
    if (!label) out.issues.push({ k: 'link-no-text', d: href });
    else if (/^(here|click here|read more|more|link|this)$/i.test(label)) {
      out.issues.push({ k: 'link-vague-text', d: label + ' -> ' + href });
    }
  });

  // images without a text alternative. A decorative image says so with alt="";
  // a missing attribute is an omission, not a decision.
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('alt')) {
      out.issues.push({ k: 'img-no-alt', d: (img.getAttribute('src') || '').slice(-70) });
    }
    if (!img.getAttribute('width') || !img.getAttribute('height')) {
      const cs = getComputedStyle(img);
      if (cs.aspectRatio === 'auto') {
        out.issues.push({ k: 'img-no-dims', d: (img.getAttribute('src') || '').slice(-70) });
      }
    }
  });

  // heading order: a jump from h2 to h4 breaks the outline a screen reader reads
  let prev = 0, h1s = 0;
  document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(h => {
    const lvl = Number(h.tagName[1]);
    if (lvl === 1) h1s++;
    if (prev && lvl > prev + 1) {
      out.issues.push({ k: 'heading-skip',
                        d: 'h' + prev + ' -> h' + lvl + ': ' +
                           // innerText is empty inside a closed <details>, which
                           // reported four real headings as blank
                           (h.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 48) });
    }
    prev = lvl;
  });
  if (h1s === 0) out.issues.push({ k: 'no-h1', d: '' });
  if (h1s > 1) out.issues.push({ k: 'many-h1', d: String(h1s) });

  // metadata a search result and a shared link are built from
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || '';
  const title = (document.title || '').trim();
  if (!title) out.issues.push({ k: 'no-title', d: '' });
  else if (title.length > 70) out.issues.push({ k: 'title-long', d: title.length + ' chars' });
  const desc = meta('meta[name="description"]');
  if (!desc) out.issues.push({ k: 'no-description', d: '' });
  else if (desc.length > 200) out.issues.push({ k: 'description-long', d: desc.length + ' chars' });
  // A noindex page is not competing in search, so a missing canonical or share
  // card is a decision rather than an omission. The embeds are eleven of those,
  // and reporting them buried the pages where it matters.
  const noindex = /noindex/i.test(meta('meta[name="robots"]'));
  if (!noindex) {
    if (!document.querySelector('link[rel="canonical"]')) out.issues.push({ k: 'no-canonical', d: '' });
    if (!meta('meta[property="og:image"]')) out.issues.push({ k: 'no-og-image', d: '' });
  }
  if (!document.documentElement.getAttribute('lang')) out.issues.push({ k: 'no-lang', d: '' });

  // forms and controls with nothing to announce
  document.querySelectorAll('button, [role="button"], input, select, textarea').forEach(el => {
    const t = (el.innerText || '').trim() || el.getAttribute('aria-label') ||
              el.getAttribute('title') || el.getAttribute('placeholder') ||
              (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')?.innerText) || '';
    if (!t.trim()) out.issues.push({ k: 'control-no-label', d: el.tagName.toLowerCase() +
                                     (el.className ? '.' + String(el.className).split(' ')[0] : '') });
  });

  return out;
};

const VIEWPORT_CHECKS = () => {
  const out = [];
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) {
    // name the widest offender, because "the page scrolls sideways" is not a fix
    let worst = null;
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const over = r.right - de.clientWidth;
      if (over > 1 && (!worst || over > worst.over)) {
        worst = { over: Math.round(over), sel: el.tagName.toLowerCase() +
                  (el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : '') };
      }
    });
    out.push({ k: 'h-scroll', d: (de.scrollWidth - de.clientWidth) + 'px' +
                                 (worst ? ', widest ' + worst.sel + ' by ' + worst.over + 'px' : '') });
  }
  // 24px is the WCAG 2.2 minimum for a target that is not inline in a sentence
  const seen = new Set();
  document.querySelectorAll('a, button, [role="button"], input[type="checkbox"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    /* WCAG 2.2's target size criterion exempts a link that sits in a sentence,
       because its height is set by the line it is in rather than by anyone's
       choice. Checking only for a <p> ancestor missed the same links inside a
       list item, and reported three sentences as undersized controls. The test
       is whether the block around the link carries text besides the link. */
    if (el.tagName === 'A') {
      const blk = el.closest('p, li, dd, figcaption, blockquote, td');
      if (blk) {
        const own = (el.textContent || '').trim().length;
        const all = (blk.textContent || '').trim().length;
        if (all > own + 12) return;
      }
    }
    /* The element's own box is not the target. A common pattern extends the
       hit area with an absolutely positioned ::after at a negative inset, and
       the film's 9x9 scrub dots do exactly that. elementFromPoint was tried and
       is useless here: an element below the fold returns null in every
       direction, so every off-screen control read as tiny. The pseudo's
       computed inset does not care where the page is scrolled to. */
    let reach = 0;
    for (const pseudo of ['::after', '::before']) {
      const ps = getComputedStyle(el, pseudo);
      if (!ps || ps.content === 'none' || ps.position !== 'absolute') continue;
      const v = [ps.top, ps.right, ps.bottom, ps.left].map(x => parseFloat(x));
      if (v.some(x => isNaN(x))) continue;
      const neg = v.filter(x => x < 0).map(x => -x);
      if (neg.length === 4) reach = Math.max(reach, Math.min(...neg));
    }
    if (r.height + 2 * reach < 24 || r.width + 2 * reach < 24) {
      const key = el.tagName.toLowerCase() + '|' + String(el.className).split(' ')[0];
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ k: 'small-target', d: key + '  ' + Math.round(r.width) + 'x' + Math.round(r.height) +
                                        (reach ? ' (+' + reach + ' reach)' : '') });
    }
  });
  return out;
};

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });

  const status = new Map();               // path -> http status
  const seen = new Set();
  const queue = ONLY ? [ONLY] : ['/'];
  const byPage = new Map();
  const consoleErrors = [];

  page.on('console', m => {
    if (m.type() === 'error') consoleErrors.push({ url: page.url(), text: m.text().slice(0, 140) });
  });

  while (queue.length && seen.size < MAX) {
    const p = queue.shift();
    if (seen.has(p)) continue;
    seen.add(p);
    let resp;
    try {
      resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } catch (e) {
      byPage.set(p, [{ k: 'load-failed', d: e.message.slice(0, 80) }]);
      continue;
    }
    status.set(p, resp.status());
    if (resp.status() >= 400) continue;
    // sitemap.xml, feed.xml and robots.txt are not pages: asking them for an h1
    // or a canonical is asking the wrong question, and fifteen such answers
    // buried the real ones.
    const ctype = (resp.headers()['content-type'] || '').toLowerCase();
    if (!ctype.includes('html')) continue;

    const r = await page.evaluate(PAGE_CHECKS);
    const issues = r.issues.slice();
    for (const l of r.links) {
      const clean = l.split('#')[0];
      if (!seen.has(clean) && !queue.includes(clean)) queue.push(clean);
    }
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await page.evaluate(() => new Promise(r2 => setTimeout(r2, 120)));
    const mob = await page.evaluate(VIEWPORT_CHECKS);
    mob.forEach(m => issues.push({ k: 'mobile-' + m.k, d: m.d }));
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    if (issues.length) byPage.set(p, issues);
  }

  // any link that was queued but never fetched still needs a status
  for (const p of seen) if (!status.has(p)) status.set(p, 0);

  await browser.close();

  const counts = new Map();
  let total = 0;
  const pages = [...byPage.keys()].sort();
  for (const p of pages) {
    const issues = byPage.get(p);
    console.log(`\n${p}  (${issues.length})`);
    const grouped = new Map();
    for (const i of issues) {
      counts.set(i.k, (counts.get(i.k) || 0) + 1);
      total++;
      if (!grouped.has(i.k)) grouped.set(i.k, []);
      grouped.get(i.k).push(i.d);
    }
    for (const [k, ds] of grouped) {
      const uniq = [...new Set(ds)];
      console.log(`    ${k.padEnd(22)} ${uniq.length > 1 ? uniq.length + 'x  ' : ''}${uniq.slice(0, 3).join(' | ').slice(0, 150)}`);
    }
  }

  const bad = [...status.entries()].filter(([, s]) => s >= 400 || s === 0);
  if (bad.length) {
    console.log('\nbroken links:');
    bad.forEach(([p, s]) => console.log(`    ${s || 'unfetched'}  ${p}`));
  }
  if (consoleErrors.length) {
    console.log('\nconsole errors:');
    [...new Map(consoleErrors.map(e => [e.text, e])).values()].slice(0, 12)
      .forEach(e => console.log(`    ${e.text}`));
  }

  console.log(`\n${seen.size} pages crawled, ${total} issue(s)`);
  if (counts.size) {
    console.log('by kind: ' + [...counts.entries()].sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k} ${n}`).join(', '));
  }
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
