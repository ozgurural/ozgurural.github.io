#!/usr/bin/env node
/*
 * Copy KaTeX into assets/vendor/katex, so the lab pages load their maths from
 * this site like every other asset here rather than announcing each visitor to
 * a CDN (the same reasoning as vendor-three.js and the self-hosted webfonts).
 *
 * The version is pinned in package.json (0.16.11, the one the pages used from
 * jsDelivr; its katex.min.js and katex.min.css match the SRI hashes the pages
 * carried). Only the woff2 fonts are copied: katex.min.css lists woff2 first
 * and every browser that runs the films reads it, so the woff and ttf
 * fallbacks would never be requested.
 *
 *   node scripts/vendor-katex.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'node_modules', 'katex', 'dist');
const OUT = path.join(ROOT, 'assets', 'vendor', 'katex');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
for (const f of ['katex.min.js', 'katex.min.css']) fs.copyFileSync(path.join(SRC, f), path.join(OUT, f));
let n = 0;
for (const f of fs.readdirSync(path.join(SRC, 'fonts'))) {
  if (!f.endsWith('.woff2')) continue;
  fs.copyFileSync(path.join(SRC, 'fonts', f), path.join(OUT, 'fonts', f));
  n++;
}
const version = require(path.join(ROOT, 'node_modules', 'katex', 'package.json')).version;
console.log(`katex ${version}: katex.min.js, katex.min.css and ${n} woff2 fonts -> assets/vendor/katex`);
