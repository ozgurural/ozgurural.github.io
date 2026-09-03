#!/usr/bin/env node
/*
 * Bring the Google Fonts in-house.
 *
 * The site used to load its three families from fonts.googleapis.com. That cost
 * two things. Every visitor's IP address reached a third party before a word of
 * the page was painted, which is a disclosure the site has no reason to make
 * and, for a site read from Europe, one it would have to document. And it cost
 * a render-blocking round trip: a stylesheet from one origin naming font files
 * on a second, so two DNS lookups and two TLS handshakes stand between the
 * first byte and the first glyph.
 *
 * The old argument for the CDN was the shared cache: a visitor who had already
 * downloaded Inter somewhere else got it free here. Cache partitioning ended
 * that in every major browser around 2020, so today the CDN is strictly the
 * slower option. Self-hosting puts the faces on the same origin as everything
 * else, and the @font-face rules land inside main.css, which removes the
 * stylesheet request entirely.
 *
 * The subsets are derived, never hand-kept, the same way the icon fonts are.
 * Google splits each face by unicode-range, and the browser fetches only the
 * ranges a page actually needs, so shipping ranges nobody uses costs nothing at
 * runtime but does bloat the repository. This script reads the site's own text,
 * collects the codepoints in it, and keeps a subset only if some character on
 * the site falls inside its range. That is how greek survives: the lab pages
 * write the correlation floor as rho-q and the momentum speedup in kappa, 219
 * Greek letters across the films, while cyrillic and vietnamese are used
 * nowhere and are dropped.
 *
 *   node scripts/vendor-webfonts.js [--check]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'webfonts', 'gf');
const OUT_SCSS = path.join(ROOT, '_sass', 'vendor', '_google-fonts.scss');
const CHECK = process.argv.includes('--check');

const CSS_URL = 'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700' +
  '&family=Space+Grotesk:wght@500;600;700' +
  '&family=JetBrains+Mono:wght@400;500' +
  '&display=swap';

/* Asking as a browser is what gets woff2 back. Google serves the format it
   believes the client supports, and a bare fetch is offered ttf. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* Where the site's readable text lives. The film scripts are included because
   they draw their own labels, and those are the Greek letters. */
const SCAN_DIRS = ['_pages', '_posts', '_publications', '_teaching', '_data',
                   '_includes', '_layouts', 'assets/js'];
const SCAN_EXT = ['.md', '.html', '.yml', '.yaml', '.js', '.json'];
const SKIP = new Set(['_site', 'node_modules', '.git', '.claude', 'dist', 'vendor']);

/* Keeping a subset is not the same as needing all of it. Inter's latin-ext is
   85 KB and covers most of written Europe; this site reaches into it for five
   Turkish letters. Its greek is 19 KB and is pulled onto every lab page to draw
   a rho and a kappa. Even latin is 48 KB a weight, of which the site uses the
   alphabet and some punctuation. So every face is cut to what the site writes,
   and the declared unicode-range is narrowed to match. Narrowing is the half
   that matters: a character outside the cut then never triggers a download that
   could not have satisfied it, and falls straight back to the system stack,
   which is exactly what it would have done after the download anyway.

   The floor is what keeps that safe. Cutting strictly to observed characters
   would mean a future blog post could introduce one that silently loses its
   face, so printable ASCII and the ordinary typographic marks are always
   included whether or not the site currently writes them. Anything an English
   sentence or a code block can contain is therefore covered by construction,
   and only genuinely unusual characters fall back. The search box is the one
   place a visitor supplies text rather than the repository, and it is covered
   by the same floor. */
const FLOOR = (() => {
  const s = new Set();
  for (let c = 0x20; c <= 0x7e; c++) s.add(c);         // printable ASCII
  s.add(0x00a0);                                        // no-break space
  for (const ch of '‘’“”–—…•·' +
                   '→←↑↓×÷°§©' +
                   '®™«»′″±−')
    s.add(ch.codePointAt(0));
  return s;
})();

/* "0x41,0x42,0x43,0x50" -> "U+41-43, U+50" */
function formatRanges(cps) {
  const s = [...cps].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < s.length;) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    const hex = (c) => c.toString(16).toUpperCase().padStart(4, '0');
    out.push(i === j ? `U+${hex(s[i])}` : `U+${hex(s[i])}-${hex(s[j])}`);
    i = j + 1;
  }
  return out.join(', ');
}

function usedCodepoints() {
  const cps = new Set();
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!SCAN_EXT.includes(path.extname(e.name))) continue;
      let txt;
      try { txt = fs.readFileSync(p, 'utf8'); } catch (e2) { continue; }
      // Every source file supplies tabs and newlines, and Google's latin range
      // starts at U+0000, so without this the derived range opens on three
      // control characters that no font has a glyph for.
      for (const ch of txt) {
        const c = ch.codePointAt(0);
        if (c >= 0x20 && c !== 0x7f) cps.add(c);
      }
    }
  };
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d));
  return cps;
}

/* Which OpenType features to keep.
 *
 * Inter ships a large feature table: eight stylistic sets, thirteen character
 * variants, fractions, ordinals, several figure styles. Keeping all of them
 * costs about 14 KB a weight for behaviour no rule on this site ever asks for.
 * So the list is read out of the stylesheets, the same way the icon set is read
 * out of the markup, and a rule that starts asking for a new one is picked up
 * by re-running this script rather than by remembering to edit a list.
 *
 * The base set is not negotiable and is not derived: these are the features
 * that make ordinary text shape correctly (mark attachment, composition,
 * language-specific forms, kerning, the standard ligatures). Dropping them
 * damages words rather than losing a flourish.
 */
const BASE_FEATURES = ['ccmp', 'locl', 'mark', 'mkmk', 'rlig', 'calt', 'clig',
                       'liga', 'kern'];
const NUMERIC_FEATURES = {
  'tabular-nums': 'tnum', 'proportional-nums': 'pnum',
  'oldstyle-nums': 'onum', 'lining-nums': 'lnum',
  'diagonal-fractions': 'frac', 'stacked-fractions': 'afrc',
  'ordinal': 'ordn', 'slashed-zero': 'zero',
};

function wantedFeatures() {
  const feats = new Set(BASE_FEATURES);
  const dirs = [path.join(ROOT, '_sass'), path.join(ROOT, 'assets', 'css')];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(scss|css)$/.test(e.name)) continue;
      const txt = fs.readFileSync(p, 'utf8');
      for (const m of txt.matchAll(/font-feature-settings\s*:\s*([^;}]+)/g)) {
        for (const t of m[1].matchAll(/["']([a-z0-9]{4})["']/g)) feats.add(t[1]);
      }
      for (const m of txt.matchAll(/font-variant-numeric\s*:\s*([^;}]+)/g)) {
        for (const [name, tag] of Object.entries(NUMERIC_FEATURES)) {
          if (m[1].includes(name)) feats.add(tag);
        }
      }
    }
  };
  dirs.forEach(walk);
  return [...feats].sort();
}

/* "U+0301, U+0400-045F, U+2116" -> [[0x301,0x301],[0x400,0x45f],...] */
function parseRanges(spec) {
  const out = [];
  for (const part of spec.split(',')) {
    const m = /U\+([0-9A-Fa-f?]+)(?:-([0-9A-Fa-f]+))?/.exec(part.trim());
    if (!m) continue;
    if (m[1].includes('?')) {
      // wildcard form, U+04?? means the whole 0400-04FF block
      const lo = parseInt(m[1].replace(/\?/g, '0'), 16);
      const hi = parseInt(m[1].replace(/\?/g, 'F'), 16);
      out.push([lo, hi]);
    } else {
      const lo = parseInt(m[1], 16);
      out.push([lo, m[2] ? parseInt(m[2], 16) : lo]);
    }
  }
  return out;
}

/* Split the returned CSS into blocks, each carrying the subset name Google
   writes as a comment just above the rule it applies to. */
function parseFaces(css) {
  const faces = [];
  const re = /\/\*\s*([a-z-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const body = m[2];
    const field = (name) => {
      const f = new RegExp(name + ':\\s*([^;]+);').exec(body);
      return f ? f[1].trim() : '';
    };
    const url = /url\(([^)]+)\)/.exec(body);
    if (!url) continue;
    faces.push({
      subset: m[1],
      family: field('font-family').replace(/['"]/g, ''),
      style: field('font-style') || 'normal',
      weight: field('font-weight') || '400',
      display: field('font-display') || 'swap',
      unicodeRange: field('unicode-range'),
      url: url[1].replace(/['"]/g, ''),
    });
  }
  return faces;
}

(async () => {
  const res = await fetch(CSS_URL, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error('font CSS request returned ' + res.status);
  const css = await res.text();
  const faces = parseFaces(css);
  if (!faces.length) throw new Error('no @font-face rules parsed from the CSS');

  const cps = usedCodepoints();
  /* The sample is only there to make the decision auditable, so it should be a
     character a reader recognises. Latin's range opens at U+0000, and reporting
     that the site keeps latin "because it writes a tab" is true and useless. */
  const interesting = (c) => c > 0x7e || (c >= 0x41 && c <= 0x7a);
  const keepSubset = new Map();          // subset -> sample character
  for (const f of faces) {
    if (keepSubset.has(f.subset)) continue;
    let best = 0;
    for (const [lo, hi] of parseRanges(f.unicodeRange)) {
      for (let c = lo; c <= hi; c++) {
        if (!cps.has(c)) continue;
        if (!best) best = c;
        if (interesting(c)) { best = c; break; }
      }
      if (best && interesting(best)) break;
    }
    if (best) keepSubset.set(f.subset, String.fromCodePoint(best));
  }

  const all = [...new Set(faces.map(f => f.subset))];
  const kept = faces.filter(f => keepSubset.has(f.subset));
  console.log(`${faces.length} faces in ${all.length} subsets`);
  for (const s of all) {
    const n = faces.filter(f => f.subset === s).length;
    console.log(`  ${keepSubset.has(s) ? 'keep' : 'drop'} ${s.padEnd(12)} ` +
      `${String(n).padStart(2)} face(s)` +
      (keepSubset.has(s) ? `   because the site writes "${keepSubset.get(s)}"` : ''));
  }

  if (CHECK) {
    console.log(`\n${kept.length} face(s) would be vendored  [check only, nothing written]`);
    return;
  }

  const features = wantedFeatures();
  console.log(`
keeping ${features.length} OpenType feature(s): ${features.join(' ')}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rules = [];
  let raw = 0, bytes = 0;
  for (const f of kept) {
    const slug = f.family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const name = `${slug}-${f.weight}-${f.subset}.woff2`;
    const dest = path.join(OUT_DIR, name);
    const r = await fetch(f.url, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(dest, buf);
    raw += buf.length;

    const want = new Set();
    for (const [lo, hi] of parseRanges(f.unicodeRange)) {
      for (let c = lo; c <= hi; c++) if (cps.has(c) || FLOOR.has(c)) want.add(c);
    }
    execFileSync('python', ['-m', 'fontTools.subset', dest,
      '--unicodes=' + [...want].map(c => 'U+' + c.toString(16).toUpperCase()).join(','),
      '--layout-features=' + features.join(','),
      '--flavor=woff2', '--output-file=' + dest],
      { stdio: 'pipe' });
    const range = formatRanges(want);
    bytes += fs.statSync(dest).size;

    rules.push(
      `/* ${f.subset}, cut to the characters the site writes */\n` +
      `@font-face {\n` +
      `  font-family: '${f.family}';\n` +
      `  font-style: ${f.style};\n` +
      `  font-weight: ${f.weight};\n` +
      `  font-display: ${f.display};\n` +
      `  src: url("../webfonts/gf/${name}") format("woff2");\n` +
      `  unicode-range: ${range};\n` +
      `}`);
  }

  const header =
    '// Generated by scripts/vendor-webfonts.js. Do not edit by hand.\n' +
    '//\n' +
    '// The three families the site sets its type in, served from this origin\n' +
    '// rather than from fonts.googleapis.com, so that no visitor is announced\n' +
    '// to a third party and no second connection stands in front of the text.\n' +
    '// Subsets are kept only where the site actually writes a character in\n' +
    '// their range; the browser still fetches only the ranges a page needs.\n' +
    '//\n' +
    '// Re-run the script to update: node scripts/vendor-webfonts.js\n\n';
  fs.writeFileSync(OUT_SCSS, header + rules.join('\n\n') + '\n');

  console.log(`\n${kept.length} face(s), ${(raw / 1024).toFixed(0)} KB as served by Google, ` +
              `${(bytes / 1024).toFixed(0)} KB after cutting the narrow subsets`);
  console.log(`files -> assets/webfonts/gf/`);
  console.log(`rules -> ${path.relative(ROOT, OUT_SCSS)}`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
