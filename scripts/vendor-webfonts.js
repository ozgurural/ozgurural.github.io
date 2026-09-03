#!/usr/bin/env node
/*
 * Bring the Google Fonts in-house.
 *
 * The site used to load its families from fonts.googleapis.com. That cost two
 * things. Every visitor's IP address reached a third party before a word of
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
 * else, and the @font-face rules land inside the stylesheet that already ships
 * with the page, which removes the extra stylesheet request entirely.
 *
 * There are two targets, because there are two documents with nothing in
 * common. The Jekyll site shares one compiled main.css across every page, so
 * its three families (Inter, Space Grotesk, JetBrains Mono) are compiled into
 * an SCSS partial. enterprise-ai-architecture.html is a single self-contained
 * file that never loads main.css, uses two families the site does not (Lora,
 * Syncopate) at different weights, and asks for different OpenType features,
 * so it gets its own plain CSS file and its own subset, sized to its own text.
 *
 * The subsets are derived, never hand-kept, the same way the icon fonts are.
 * Google splits each face by unicode-range, and the browser fetches only the
 * ranges a page actually needs, so shipping ranges nobody uses costs nothing
 * at runtime but does bloat the repository. Each target reads its own text,
 * collects the codepoints in it, and keeps a subset only if some character it
 * writes falls inside that subset's range. That is how greek survives for the
 * main site: the lab pages write the correlation floor as rho-q and the
 * momentum speedup in kappa, 219 Greek letters across the films, while
 * cyrillic and vietnamese are used nowhere and are dropped.
 *
 *   node scripts/vendor-webfonts.js [--check] [--target=site|arch]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');
const ONLY = (process.argv.find(a => a.startsWith('--target=')) || '').split('=')[1];

/* Asking as a browser is what gets woff2 back. Google serves the format it
   believes the client supports, and a bare fetch is offered ttf. */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const SKIP = new Set(['_site', 'node_modules', '.git', '.claude', 'dist', 'vendor']);

/* Keeping a subset is not the same as needing all of it. Inter's latin-ext is
   85 KB and covers most of written Europe; the main site reaches into it for
   five Turkish letters. Its greek is 19 KB for a rho and a kappa. Even latin
   is 48 KB a weight, of which either target uses the alphabet and some
   punctuation. So every face is cut to what its target actually writes, and
   the declared unicode-range is narrowed to match. Narrowing is the half that
   matters: a character outside the cut then never triggers a download that
   could not have satisfied it, and falls back exactly as it would have after
   the download anyway.
 *
 * The floor is what keeps that safe. Cutting strictly to observed characters
 * would mean a future edit could silently lose its face to a character
 * nobody thought to write yet, so printable ASCII and the ordinary
 * typographic marks are always included whether or not the text currently
 * uses them. Anything an English sentence or a code block can contain is
 * therefore covered by construction, and only genuinely unusual characters
 * fall back. A visitor-supplied search box is covered by the same floor. */
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

/* Which OpenType features to keep, read out of the stylesheet rather than
 * hand-kept, the same way the icon set is read out of the markup. Inter ships
 * a large feature table: eight stylistic sets, thirteen character variants,
 * fractions, ordinals, several figure styles. Keeping all of them costs KBs a
 * weight for behaviour nothing requests. A rule that starts asking for a new
 * one is picked up by re-running this script rather than by editing a list.
 * Asking a family to keep a feature it does not have (Syncopate has none of
 * Inter's stylistic sets) is harmless: fontTools subsets to what exists.
 *
 * The base set is not negotiable and is not derived: these make ordinary text
 * shape correctly (mark attachment, composition, language forms, kerning, the
 * standard ligatures). Dropping them damages words rather than losing a
 * flourish. */
const BASE_FEATURES = ['ccmp', 'locl', 'mark', 'mkmk', 'rlig', 'calt', 'clig',
                       'liga', 'kern'];
const NUMERIC_FEATURES = {
  'tabular-nums': 'tnum', 'proportional-nums': 'pnum',
  'oldstyle-nums': 'onum', 'lining-nums': 'lnum',
  'diagonal-fractions': 'frac', 'stacked-fractions': 'afrc',
  'ordinal': 'ordn', 'slashed-zero': 'zero',
};

/* Both kinds of source list a target can name: directories (walked, filtered
   by extension) for the Jekyll site, or explicit files (read whole, extension
   ignored) for a single self-contained page. */
function collectText(dirs, files) {
  const out = [];
  const walk = (dir, exts) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (SKIP.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p, exts); continue; }
      if (!exts.includes(path.extname(e.name))) continue;
      try { out.push(fs.readFileSync(p, 'utf8')); } catch (e2) { /* unreadable, skip */ }
    }
  };
  for (const d of dirs || []) walk(path.join(ROOT, d.dir), d.ext);
  for (const f of files || []) {
    try { out.push(fs.readFileSync(path.join(ROOT, f), 'utf8')); } catch (e) { /* skip */ }
  }
  return out;
}

function usedCodepoints(source) {
  const cps = new Set();
  for (const txt of collectText(source.dirs, source.files)) {
    // Every source file supplies tabs and newlines, and Google's latin range
    // starts at U+0000, so without this the derived range opens on three
    // control characters that no font has a glyph for.
    for (const ch of txt) {
      const c = ch.codePointAt(0);
      if (c >= 0x20 && c !== 0x7f) cps.add(c);
    }
  }
  return cps;
}

function wantedFeatures(source) {
  const feats = new Set(BASE_FEATURES);
  for (const txt of collectText(source.dirs, source.files)) {
    for (const m of txt.matchAll(/font-feature-settings\s*:\s*([^;}]+)/g)) {
      for (const t of m[1].matchAll(/["']([a-z0-9]{4})["']/g)) feats.add(t[1]);
    }
    for (const m of txt.matchAll(/font-variant-numeric\s*:\s*([^;}]+)/g)) {
      for (const [name, tag] of Object.entries(NUMERIC_FEATURES)) {
        if (m[1].includes(name)) feats.add(tag);
      }
    }
  }
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

const TARGETS = [
  {
    label: 'site',
    about: 'the Jekyll site (main.css, every page)',
    cssUrl: 'https://fonts.googleapis.com/css2' +
      '?family=Inter:wght@400;500;600;700' +
      '&family=Space+Grotesk:wght@500;600;700' +
      '&family=JetBrains+Mono:wght@400;500' +
      '&display=swap',
    codepointSource: { dirs: [
      { dir: '_pages', ext: ['.md'] }, { dir: '_posts', ext: ['.md'] },
      { dir: '_publications', ext: ['.md'] }, { dir: '_teaching', ext: ['.md'] },
      { dir: '_data', ext: ['.yml', '.yaml'] },
      { dir: '_includes', ext: ['.html'] }, { dir: '_layouts', ext: ['.html'] },
      // the film scripts draw their own labels, which is where greek comes from
      { dir: 'assets/js', ext: ['.js'] },
    ] },
    featureSource: { dirs: [
      { dir: '_sass', ext: ['.scss'] }, { dir: 'assets/css', ext: ['.css'] },
    ] },
    outDir: path.join(ROOT, 'assets', 'webfonts', 'gf'),
    urlPrefix: '../webfonts/gf/',
    outFile: path.join(ROOT, '_sass', 'vendor', '_google-fonts.scss'),
    // The face on the critical path to first paint, preloaded from <head>.
    // Its filename is written to _data/webfonts.yml rather than hardcoded
    // into the template: this script is the only thing that decides what a
    // face is actually named (which weights end up sharing one file changes
    // whenever Google repacks its variable-font ranges), so a name typed into
    // an include is one repack away from preloading a 404. Liquid reads the
    // name instead of guessing it.
    preload: { family: 'Inter', weight: '400', style: 'normal', subset: 'latin' },
    dataFile: path.join(ROOT, '_data', 'webfonts.yml'),
    header:
      '// Generated by scripts/vendor-webfonts.js --target=site. Do not edit by hand.\n' +
      '//\n' +
      '// The three families the site sets its type in, served from this origin\n' +
      '// rather than from fonts.googleapis.com, so that no visitor is announced\n' +
      '// to a third party and no second connection stands in front of the text.\n' +
      '// Subsets are kept only where the site actually writes a character in\n' +
      '// their range; the browser still fetches only the ranges a page needs.\n' +
      '//\n' +
      '// Re-run to update: node scripts/vendor-webfonts.js --target=site\n\n',
  },
  {
    label: 'arch',
    about: 'enterprise-ai-architecture.html (self-contained, no main.css)',
    cssUrl: 'https://fonts.googleapis.com/css2' +
      '?family=Inter:wght@300;400;600;800' +
      '&family=Syncopate:wght@400;700' +
      '&family=Lora:ital,wght@0,500;0,600;1,400' +
      '&family=JetBrains+Mono:wght@400;500' +
      '&display=swap',
    // One document, read whole: its <style> block and its narration strings
    // are both in the same file, and reading it raw (JS comments included)
    // costs nothing, since asking to keep a codepoint a family lacks a glyph
    // for is a no-op for fontTools rather than an error.
    codepointSource: { files: ['enterprise-ai-architecture.html'] },
    featureSource: { files: ['enterprise-ai-architecture.html'] },
    outDir: path.join(ROOT, 'assets', 'webfonts', 'gf-arch'),
    urlPrefix: '/assets/webfonts/gf-arch/',
    outFile: path.join(ROOT, 'assets', 'css', 'enterprise-ai-architecture-fonts.css'),
    header:
      '/* Generated by scripts/vendor-webfonts.js --target=arch. Do not edit by hand.\n' +
      ' *\n' +
      ' * The four families enterprise-ai-architecture.html sets its type in,\n' +
      ' * served from this origin instead of fonts.googleapis.com. This page\n' +
      ' * shares nothing with main.css, so it carries its own subset, sized to\n' +
      ' * its own text and its own font-feature-settings rather than the site\'s.\n' +
      ' *\n' +
      ' * Re-run to update: node scripts/vendor-webfonts.js --target=arch\n' +
      ' */\n\n',
  },
];

async function vendorTarget(target) {
  console.log(`\n=== ${target.label}: ${target.about} ===`);
  const res = await fetch(target.cssUrl, { headers: { 'user-agent': UA } });
  if (!res.ok) throw new Error('font CSS request returned ' + res.status);
  const css = await res.text();
  const faces = parseFaces(css);
  if (!faces.length) throw new Error('no @font-face rules parsed from the CSS');

  const cps = usedCodepoints(target.codepointSource);
  /* The sample is only there to make the decision auditable, so it should be
     a character a reader recognises rather than, say, a tab. */
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
      (keepSubset.has(s) ? `   because it writes "${keepSubset.get(s)}"` : ''));
  }

  if (CHECK) {
    console.log(`${kept.length} face(s) would be vendored  [check only, nothing written]`);
    return;
  }

  const features = wantedFeatures(target.featureSource);
  console.log(`keeping ${features.length} OpenType feature(s): ${features.join(' ')}`);

  /* Google splits some families into more subsets than this target has any
   * use for. Lora carries separate "math" and "symbols" subsets that, once
   * intersected with a page writing nothing but a lone left/right arrow, both
   * reduce to the identical two codepoints for the same weight and style: two
   * files that would ship the same glyphs under overlapping unicode-range
   * declarations, which a browser resolves ambiguously at best and fetches
   * twice at worst. So the intersection is computed for every kept face
   * before anything is downloaded, and a later face is dropped when an
   * earlier one of the same family, weight and style already covers exactly
   * the same, non-empty, set of codepoints. */
  const withWant = kept.map(f => {
    const want = new Set();
    for (const [lo, hi] of parseRanges(f.unicodeRange)) {
      for (let c = lo; c <= hi; c++) if (cps.has(c) || FLOOR.has(c)) want.add(c);
    }
    return { f, want };
  });
  const seen = new Map();               // "family|weight|style" -> Set(wantKey)
  const deduped = [];
  for (const { f, want } of withWant) {
    if (!want.size) continue;
    const wantKey = [...want].sort((a, b) => a - b).join(',');
    const groupKey = `${f.family}|${f.weight}|${f.style}`;
    const already = seen.get(groupKey) || new Set();
    if (already.has(wantKey)) {
      console.log(`  drop ${f.subset.padEnd(12)} duplicates another subset's ` +
                  `${f.family} ${f.weight}${f.style === 'italic' ? 'i' : ''} exactly, skipped`);
      continue;
    }
    already.add(wantKey);
    seen.set(groupKey, already);
    deduped.push({ f, want });
  }

  /* Google itself often serves ONE physical file for several weights of the
   * same family, style and subset: a variable-font resource, split into
   * several @font-face blocks each pinned to a single static weight so a
   * browser downloads only the instance a page actually renders. Fetching
   * that URL once per weight, as a naive loop would, downloads and re-runs
   * fontTools on identical bytes three or four times over and ships that many
   * physically-duplicate files, so a lab page was fetching Inter under three
   * different filenames for three different weights, byte-for-byte the same
   * download each time. Grouping by source URL before touching the network
   * fetches and subsets each such resource exactly once; every weight that
   * shared it keeps its own @font-face rule (its own font-weight, its own
   * declared unicode-range) but all of those rules point at the one file,
   * which is exactly how Google's own CSS already used it. */
  const byUrl = new Map();              // url -> [{f, want}, ...]
  for (const entry of deduped) {
    if (!byUrl.has(entry.f.url)) byUrl.set(entry.f.url, []);
    byUrl.get(entry.f.url).push(entry);
  }

  fs.mkdirSync(target.outDir, { recursive: true });
  const rules = [];
  let raw = 0, bytes = 0;
  let preloadName = null;
  for (const [url, group] of byUrl) {
    const rep = group[0].f;
    const weights = [...new Set(group.map(g => g.f.weight))]
      .sort((a, b) => Number(a) - Number(b));
    const slug = rep.family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const styleTag = rep.style === 'italic' ? 'i' : '';
    // Naming spells out every weight the file serves, so `inter-400-500-600-
    // 700-latin.woff2` is legible as "one file, four weights" rather than
    // looking like a single-weight file that happens to be reused.
    const name = `${slug}-${weights.join('-')}${styleTag}-${rep.subset}.woff2`;
    const dest = path.join(target.outDir, name);

    const r = await fetch(url, { headers: { 'user-agent': UA } });
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(dest, buf);
    raw += buf.length;

    // The physical file must carry every glyph any sharing weight needs, so
    // it is subset to their union even though in every case observed so far
    // the sharing weights already declared the identical range.
    const union = new Set();
    for (const { want } of group) for (const c of want) union.add(c);
    execFileSync('python', ['-m', 'fontTools.subset', dest,
      '--unicodes=' + [...union].map(c => 'U+' + c.toString(16).toUpperCase()).join(','),
      '--layout-features=' + features.join(','),
      '--flavor=woff2', '--output-file=' + dest],
      { stdio: 'pipe' });
    bytes += fs.statSync(dest).size;

    for (const { f, want } of group) {
      rules.push(
        `/* ${f.subset}, cut to the characters this target writes` +
        (weights.length > 1 ? `; shares its file with weight(s) ${weights.filter(w => w !== f.weight).join(', ')}` : '') +
        ` */\n` +
        `@font-face {\n` +
        `  font-family: '${f.family}';\n` +
        `  font-style: ${f.style};\n` +
        `  font-weight: ${f.weight};\n` +
        `  font-display: ${f.display};\n` +
        `  src: url("${target.urlPrefix}${name}") format("woff2");\n` +
        `  unicode-range: ${formatRanges(want)};\n` +
        `}`);
      const p = target.preload;
      if (p && f.family === p.family && f.weight === p.weight &&
          f.style === p.style && f.subset === p.subset) {
        preloadName = name;
      }
    }
  }

  if (target.preload) {
    if (!preloadName) {
      throw new Error(`${target.label}: preload spec ${JSON.stringify(target.preload)} ` +
        `matched no vendored face (check it against the "keep"/weight log above)`);
    }
    fs.mkdirSync(path.dirname(target.dataFile), { recursive: true });
    fs.writeFileSync(target.dataFile,
      '# Generated by scripts/vendor-webfonts.js. Do not edit by hand.\n' +
      '#\n' +
      '# The filename of the face on the critical path to first paint, for\n' +
      '# _includes/head/custom.html to preload without hardcoding a name that\n' +
      '# a future re-run of the script is free to change.\n' +
      `preload_font: ${preloadName}\n`);
    console.log(`preload -> ${path.relative(ROOT, target.dataFile)} (${preloadName})`);
  }

  fs.mkdirSync(path.dirname(target.outFile), { recursive: true });
  fs.writeFileSync(target.outFile, target.header + rules.join('\n\n') + '\n');

  const dupNote = deduped.length !== kept.length ? ` (${kept.length - deduped.length} exact duplicate(s) dropped)` : '';
  const shareNote = deduped.length !== byUrl.size ? `, sharing ${byUrl.size} physical file(s)` : '';
  console.log(`${deduped.length} face(s)${dupNote}${shareNote}, ` +
              `${(raw / 1024).toFixed(0)} KB as served by Google, ` +
              `${(bytes / 1024).toFixed(0)} KB after cutting the narrow subsets`);
  console.log(`files -> ${path.relative(ROOT, target.outDir)}/`);
  console.log(`rules -> ${path.relative(ROOT, target.outFile)}`);
}

(async () => {
  const targets = ONLY ? TARGETS.filter(t => t.label === ONLY) : TARGETS;
  if (!targets.length) throw new Error(`no target named "${ONLY}" (have: ${TARGETS.map(t => t.label).join(', ')})`);
  for (const t of targets) await vendorTarget(t);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
