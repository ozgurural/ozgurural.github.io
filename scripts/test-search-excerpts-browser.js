// Offline browser regression for the real search renderer and built public data.
// A controlled index substitutes for the CDN library; ranking is not under test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

(async () => {
  const built = path.resolve(process.argv[2] || '_site');
  const docs = JSON.parse(fs.readFileSync(path.join(built, 'search.json'), 'utf8'));
  const project = docs.find(doc => /\/projects\//.test(doc.url));
  assert.ok(project && /comodo/i.test(project.content), 'built index contains deep project text');
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setContent('<button id="search-toggle">Search</button>' +
      '<div id="search-overlay" hidden><input id="search-input"><button id="search-close">Close</button>' +
      '<div id="search-hint"></div><ul id="search-results"></ul></div>');
    await page.evaluate(data => {
      window.fetch = async () => ({ ok: true, json: async () => data });
      window.lunr = builder => {
        const rows = [];
        builder.call({ ref() {}, field() {}, add(row) { rows.push(row); } });
        return { search: query => rows.filter(row => row.content.toLowerCase().includes(query.toLowerCase()))
          .map(row => ({ ref: row.id })) };
      };
    }, [project, { title: 'Synthetic escaping case', url: '/synthetic/', excerpt: 'Safe fallback',
      content: 'Security <img src=x onerror=alert(1)> & "credentials" remain plain text.' }]);
    await page.addScriptTag({ path: path.join(built, 'assets/js/search.js') });
    await page.click('#search-toggle');
    await page.type('#search-input', 'Comodo');
    await page.waitForFunction(() => /comodo/i.test(document.querySelector('.search-results__excerpt')?.textContent || ''));
    assert.match(await page.$eval('.search-results__excerpt', el => el.textContent), /comodo/i);
    await page.$eval('#search-input', el => { el.value = 'Security'; el.dispatchEvent(new Event('input')); });
    await page.waitForFunction(() => document.querySelector('#search-results').textContent.includes('Synthetic escaping case'));
    assert.equal(await page.$('#search-results img'), null);
    assert.match(await page.$eval('#search-results', el => el.textContent), /<img src=x/);
    assert.deepEqual(errors, []);
    console.log('PASS: built Comodo excerpt, literal hostile text, no injected image, no page errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
