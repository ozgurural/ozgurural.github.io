#!/usr/bin/env node
/*
 * Can a machine tell which paper each publication page is about?
 *
 *   node scripts/check-scholar-meta.js          (dev server must be running)
 *
 * Reads every publication page the way a scholarly crawler or a reference
 * manager does and fails on what would make it give up or get it wrong: no
 * citation_title / citation_author / date, structured data that is not valid
 * JSON, a BibTeX entry that does not close, a DOI on the page that disagrees
 * with the one in the tags, and bulk files (/publications.bib, .json) that do
 * not parse or do not list the same works.
 */
const fs = require('fs');
const path = require('path');

const BASE = process.env.FILM_BASE || 'http://localhost:4000';
const DIR = path.join(__dirname, '..', '_publications');
const meta = (html, name) => [...html.matchAll(new RegExp(`<meta name="${name}" content="([^"]*)"`, 'g'))].map(m => m[1]);

(async () => {
  let failed = 0;
  const fail = (where, what) => { failed++; console.log(`FAIL ${where}: ${what}`); };
  const pubs = fs.readdirSync(DIR).filter(f => f.endsWith('.md')).map(f => {
    const fm = fs.readFileSync(path.join(DIR, f), 'utf8');
    return { file: f, url: (fm.match(/^permalink:\s*(\S+)/m) || [])[1], key: (fm.match(/^bibkey:\s*"([^"]+)"/m) || [])[1],
             doi: (fm.match(/^doi:\s*"([^"]+)"/m) || [])[1] };
  });

  for (const p of pubs) {
    const html = await (await fetch(BASE + p.url)).text();
    const title = meta(html, 'citation_title'), authors = meta(html, 'citation_author'), date = meta(html, 'citation_publication_date');
    if (title.length !== 1) fail(p.file, `citation_title x${title.length}`);
    if (!authors.length) fail(p.file, 'no citation_author');
    if (!date.length) fail(p.file, 'no citation_publication_date');
    const venue = ['citation_journal_title', 'citation_conference_title', 'citation_dissertation_institution', 'citation_technical_report_institution']
      .filter(n => meta(html, n).length);
    if (venue.length !== 1) fail(p.file, `venue tags: ${venue.join(', ') || 'none'}`);
    const doi = meta(html, 'citation_doi')[0];
    if ((p.doi || undefined) !== doi) fail(p.file, `doi tag ${doi} vs front matter ${p.doi}`);

    let ld = null;
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { const j = JSON.parse(m[1]); if (/ScholarlyArticle|Thesis|Report/.test(j['@type'])) ld = j; }
      catch (e) { fail(p.file, 'structured data is not valid JSON: ' + e.message); }
    }
    if (!ld) fail(p.file, 'no publication structured data');
    else {
      if (!Array.isArray(ld.author) || !ld.author.length) fail(p.file, 'structured data has no author list');
      if (p.doi && (!ld.identifier || ld.identifier.value !== p.doi)) fail(p.file, 'structured data DOI missing or different');
    }

    const bib = (html.match(/<pre class="cite-block__bib"><code>([\s\S]*?)<\/code>/) || [])[1];
    if (!bib) fail(p.file, 'no BibTeX on the page');
    else {
      const text = bib.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      const open = (text.match(/\{/g) || []).length, close = (text.match(/\}/g) || []).length;
      if (!text.startsWith('@') || open !== close || !text.includes(p.key)) fail(p.file, `BibTeX malformed (braces ${open}/${close})`);
      if (/\n\s*\n/.test(text)) fail(p.file, 'BibTeX has a blank line inside the entry');
    }
    console.log(`${failed ? '    ' : 'ok  '}${p.url.padEnd(46)} ${ld ? ld['@type'].padEnd(17) : ''} authors ${authors.length}  ${venue[0] || ''}${doi ? '  doi' : ''}`);
  }

  const bibAll = await (await fetch(BASE + '/publications.bib')).text();
  const entries = (bibAll.match(/^@\w+\{/gm) || []).length;
  if (entries !== pubs.length) fail('/publications.bib', `${entries} entries for ${pubs.length} publications`);
  for (const p of pubs) if (!bibAll.includes(`{${p.key},`)) fail('/publications.bib', 'missing ' + p.key);
  let csl = [];
  try { csl = JSON.parse(await (await fetch(BASE + '/publications.json')).text()); }
  catch (e) { fail('/publications.json', 'not valid JSON: ' + e.message); }
  if (csl.length !== pubs.length) fail('/publications.json', `${csl.length} items for ${pubs.length} publications`);
  console.log(`\n/publications.bib ${entries} entries, /publications.json ${csl.length} items`);
  console.log(failed ? `${failed} problem(s)` : 'every publication page identifies its paper');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
