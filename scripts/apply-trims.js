#!/usr/bin/env node
/*
 * Apply the scene trims that `audit-films.js --stills` worked out.
 *
 * The audit measures how long each scene holds a still picture after its last
 * sentence has finished, which is dead air that can go without redrawing
 * anything. It writes dist/trims.json; this edits the one number in each
 * film.scene(name, seconds, ...) call.
 *
 * Scene names are matched in full rather than by the truncated table the audit
 * prints, because several of them carry apostrophes and maths symbols and
 * matching those by hand is a way to shorten the wrong scene.
 *
 *   node scripts/apply-trims.js [--dry] [--max N] [--skip "Scene name"]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILMS_DIR = path.join(ROOT, 'assets', 'js', 'lab-films');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const maxIdx = args.indexOf('--max');
const MAX = maxIdx >= 0 ? Number(args[maxIdx + 1]) : Infinity;
const SKIP = args.reduce((acc, a, i) => (a === '--skip' ? acc.concat([args[i + 1]]) : acc), []);

const trims = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist', 'trims.json'), 'utf8'));
const files = fs.readdirSync(FILMS_DIR).filter(f => f.endsWith('.js'));
const cache = {};
const read = f => (cache[f] = cache[f] !== undefined ? cache[f] : fs.readFileSync(path.join(FILMS_DIR, f), 'utf8'));

let applied = 0, skipped = 0;
for (const t of trims) {
  if (SKIP.indexOf(t.scene) >= 0) { console.log(`skip  ${t.slug}  ${t.scene}`); skipped++; continue; }
  if (t.cut > MAX) { console.log(`skip  ${t.slug}  ${t.scene}  (cut ${t.cut}s over --max ${MAX})`); skipped++; continue; }

  // film.scene("Name", 42, function ...) with either quote style
  const owner = files.find(f => {
    const src = read(f);
    return src.indexOf('film.scene("' + t.scene + '"') >= 0 ||
           src.indexOf("film.scene('" + t.scene + "'") >= 0;
  });
  if (!owner) { console.log(`MISS  ${t.slug}  ${t.scene}  (no film.scene call found)`); skipped++; continue; }

  const src = read(owner);
  const q = src.indexOf('film.scene("' + t.scene + '"') >= 0 ? '"' : "'";
  const head = 'film.scene(' + q + t.scene + q + ', ';
  const at = src.indexOf(head);
  const rest = src.slice(at + head.length);
  const m = /^([0-9.]+)\s*,/.exec(rest);
  if (!m) { console.log(`MISS  ${t.slug}  ${t.scene}  (duration not a literal)`); skipped++; continue; }
  if (Math.abs(Number(m[1]) - t.len) > 0.05) {
    console.log(`MISS  ${t.slug}  ${t.scene}  (file says ${m[1]}s, audit measured ${t.len}s)`);
    skipped++; continue;
  }

  cache[owner] = src.slice(0, at + head.length) + String(t.newLen) + rest.slice(m[1].length);
  console.log(`trim  ${t.slug.padEnd(23)} ${t.scene.slice(0, 40).padEnd(42)} ${t.len} -> ${t.newLen}`);
  applied++;
}

if (!DRY) {
  for (const f of Object.keys(cache)) fs.writeFileSync(path.join(FILMS_DIR, f), cache[f]);
}
const saved = trims.filter(t => SKIP.indexOf(t.scene) < 0 && t.cut <= MAX)
                   .reduce((a, t) => a + t.cut, 0);
console.log(`\n${applied} trimmed, ${skipped} skipped, ${saved.toFixed(1)}s removed` +
            (DRY ? ' (dry run, nothing written)' : ''));
