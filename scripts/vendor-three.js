#!/usr/bin/env node
/*
 * Copy three.js and the addons the cinema films import into assets/vendor/three,
 * so the films load it from this site like every other asset here rather than
 * announcing each visitor to a CDN.
 *
 * Addons are listed by entry point and their relative imports are followed, so
 * adding an effect means adding one line to ENTRIES, not chasing its shaders by
 * hand. Bare `three` imports stay as they are: the page's import map points
 * them at the vendored build.
 *
 *   node scripts/vendor-three.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'node_modules', 'three');
const OUT = path.join(ROOT, 'assets', 'vendor', 'three');

const BUILD = ['three.module.js', 'three.core.js'];
const ENTRIES = [
  'postprocessing/EffectComposer.js',
  'postprocessing/RenderPass.js',
  'postprocessing/UnrealBloomPass.js',
  'postprocessing/OutputPass.js',
];

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

fs.rmSync(OUT, { recursive: true, force: true });
for (const f of BUILD) copy(path.join(SRC, 'build', f), path.join(OUT, 'build', f));

const seen = new Set();
const queue = ENTRIES.slice();
while (queue.length) {
  const rel = queue.shift();
  if (seen.has(rel)) continue;
  seen.add(rel);
  const file = path.join(SRC, 'examples', 'jsm', rel);
  const text = fs.readFileSync(file, 'utf8');
  copy(file, path.join(OUT, 'addons', rel));
  for (const m of text.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1])));
  }
}

// three ships unminified ES modules (0.186 has no .min build), and a film
// page fetched 1.46 MB + 0.66 MB of it, 417 KB gzipped, every time a lab
// page's film iframe scrolled into view. Minified it is 189 KB gzipped, and
// the SecurePoL film rendered byte-identical frames at 10, 40 and 80 s with
// either copy. Export names survive (uglify re-exports them by alias); the
// @license header is kept, since the MIT licence asks for it in every copy.
const UglifyJS = require('uglify-js');
(function minifyAll(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { minifyAll(f); continue; }
    if (!f.endsWith('.js')) continue;
    const r = UglifyJS.minify(fs.readFileSync(f, 'utf8'),
      { module: true, compress: {}, mangle: true, output: { comments: /@license|@preserve|^!/ } });
    if (r.error) throw new Error(path.relative(ROOT, f) + ': ' + r.error.message);
    fs.writeFileSync(f, r.code);
  }
})(OUT);

const version = JSON.parse(fs.readFileSync(path.join(SRC, 'package.json'), 'utf8')).version;
fs.writeFileSync(path.join(OUT, 'VERSION'), version + '\n');
console.log(`three ${version}: ${BUILD.length} build files, ${seen.size} addons -> ${path.relative(ROOT, OUT)}`);
for (const r of [...seen].sort()) console.log('  addons/' + r);
