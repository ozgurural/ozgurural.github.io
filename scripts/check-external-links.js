#!/usr/bin/env node
/*
 * Do the outbound links still go anywhere?
 *
 * A portfolio rots outward: a paper moves, a repository is renamed, a
 * conference site is retired, and the page keeps pointing at it. Nothing on the
 * site notices, because the link is only broken on somebody else's server.
 *
 * Each distinct external URL is requested once. HEAD first, since it is cheap,
 * then GET for the many hosts that answer HEAD with 405 or 403 out of habit.
 * A host that refuses automated requests is reported as unverified rather than
 * dead: the point is to find rot, not to argue with bot protection.
 *
 *   node scripts/check-external-links.js [--base http://localhost:4001]
 */
const puppeteer = require('puppeteer');

const argv = process.argv.slice(2);
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
const BASE = arg('--base', 'http://localhost:4001').replace(/\/$/, '');
const MAX_PAGES = Number(arg('--max', 90));
const CONCURRENCY = Number(arg('--jobs', 6));
const TIMEOUT = Number(arg('--timeout', 15000));

/* A bare bot user agent gets 403 from a lot of ordinary, working sites, and
   every one of those reads as rot. daostack.io answered 403 to a plain checker
   and 200 to a browser, so the headers are a browser's; the request is still
   only a read. */
const HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
};

async function head(url) {
  const ctl = AbortSignal.timeout(TIMEOUT);
  try {
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow',
                               headers: HEADERS, signal: ctl });
    // plenty of hosts refuse HEAD but serve GET perfectly well
    if (r.status === 405 || r.status === 403 || r.status === 404) {
      r = await fetch(url, { method: 'GET', redirect: 'follow',
                             headers: HEADERS,
                             signal: AbortSignal.timeout(TIMEOUT) });
    }
    return { status: r.status, url: r.url };
  } catch (e) {
    return { status: 0, err: String(e.message || e).slice(0, 60) };
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const seen = new Set(['/']);
  const queue = ['/'];
  const ext = new Map();                    // url -> Set(pages)

  while (queue.length && seen.size <= MAX_PAGES) {
    const p = queue.shift();
    let resp;
    try { resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
    catch (e) { continue; }
    if (!resp || resp.status() >= 400) continue;
    if (!(resp.headers()['content-type'] || '').includes('html')) continue;

    const found = await page.evaluate(() => {
      const o = { internal: [], external: [] };
      document.querySelectorAll('a[href]').forEach(a => {
        const h = a.getAttribute('href') || '';
        if (/^(mailto:|tel:|javascript:|#)/i.test(h)) return;
        let u; try { u = new URL(a.href); } catch (e) { return; }
        if (u.origin === location.origin) o.internal.push(u.pathname);
        else if (/^https?:$/.test(u.protocol)) o.external.push(u.href);
      });
      return o;
    });
    for (const l of found.internal) if (!seen.has(l)) { seen.add(l); queue.push(l); }
    for (const u of found.external) {
      if (!ext.has(u)) ext.set(u, new Set());
      ext.get(u).add(p);
    }
  }
  await browser.close();

  const urls = [...ext.keys()].sort();
  console.log(`${seen.size} pages, ${urls.length} distinct external links`);

  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (i < urls.length) {
      const u = urls[i++];
      results.push({ u, ...(await head(u)) });
    }
  }));

  /* Only 404 and 410 mean the page is gone. A 403 means we were refused, and
     that says more about the checker than about the link: daostack.io answers
     200 to curl and 403 to Node's fetch with identical headers, because
     Cloudflare fingerprints the client below the header level. Chasing that
     with a better disguise is a losing game, and every attempt at it reported
     working links as rot. So refusals are listed separately, for a human to
     glance at, and the exit code is driven only by what is provably gone.

     Redirects are followed, and it is the final URL that matters: a DOI is a
     redirector, and doi.org/10.13140/... resolving onto a ResearchGate page
     that refuses bots was being reported as a dead DOI. */
  const gone = (r) => r.status === 404 || r.status === 410;
  const dead = results.filter(gone);
  const unreachable = results.filter(r => !gone(r) && (r.status === 0 || r.status >= 400));
  const ok = results.length - dead.length - unreachable.length;

  if (dead.length) {
    console.log('\ndead:');
    for (const r of dead.sort((a, b) => a.status - b.status)) {
      console.log(`    ${r.status}  ${r.u}`);
      console.log(`         on ${[...ext.get(r.u)].slice(0, 3).join(', ')}`);
    }
  }
  if (unreachable.length) {
    console.log('\nunverified (refused, timed out, or blocked automated requests):');
    for (const r of unreachable) {
      console.log(`    ${r.u}  (${r.err || 'HTTP ' + r.status})`);
    }
  }
  console.log(`\n${ok} ok, ${dead.length} dead, ${unreachable.length} unverified`);
  process.exitCode = dead.length ? 1 : 0;
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
