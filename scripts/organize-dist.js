#!/usr/bin/env node
// Reversible housekeeping for local artifacts. No deletion or overwriting.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function destination(name, directory) {
  if (directory) {
    if (['video', 'music', 'builds', 'reviews', 'cache', 'archive'].includes(name)) return null;
    if (name === 'securepol-tts') return 'cache/tts/securepol';
    if (/(?:-site|-production)$/.test(name)) return `builds/${name}`;
    if (/^(?:.*-(?:before|after|final)|.*review.*|deadline-review|diff|frames|sheet|shots|voice-samples)$/.test(name)) return `reviews/${name}`;
  } else {
    if (name === 'README.md') return null;
    if (/\.(?:js|py|sh)$/.test(name)) return `archive/helpers/${name}`;
    if (/\.(?:log|err)$/.test(name)) return `reviews/logs/${name}`;
    if (/\.(?:png|jpg|txt|json)$/.test(name)) return `reviews/${name}`;
  }
  return null;
}

function inside(root, file) {
  const relative = path.relative(root, path.resolve(file));
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Path outside artifact directory: ${file}`);
  }
  // Refuse junctions/symlinks anywhere along an existing path.
  let current = root;
  for (const part of ['', ...relative.split(path.sep)]) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new Error(`Refusing linked path: ${current}`);
    }
  }
}

function plan(root) {
  root = path.resolve(root);
  const moves = [];
  const targets = new Set();
  const add = (from, to) => {
    const source = path.join(root, from), target = path.join(root, to);
    inside(root, source);
    inside(root, target);
    if (fs.existsSync(target)) throw new Error(`Destination already exists: ${target}`);
    const key = process.platform === 'win32' ? target.toLowerCase() : target;
    if (targets.has(key)) throw new Error(`Duplicate destination: ${target}`);
    targets.add(key);
    moves.push({ from, to });
  };
  if (!fs.existsSync(root)) return moves;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const to = destination(entry.name, entry.isDirectory());
    if (to) add(entry.name, to);
  }
  const video = path.join(root, 'video');
  if (fs.existsSync(video)) {
    inside(root, video);
    for (const entry of fs.readdirSync(video, { withFileTypes: true })) {
      const name = entry.name;
      if (entry.isDirectory() && /^parts(?:-|$)/.test(name)) add(`video/${name}`, `cache/cinema/${name}`);
      else if (entry.isDirectory() && name === 'vertical') add('video/vertical', 'cache/vertical');
      else if (entry.isFile() && /\.(?:png|jpg)$/.test(name)) add(`video/${name}`, `reviews/thumbnails/${name}`);
      else if (entry.isFile() && /\.(?:log|err)$/.test(name)) add(`video/${name}`, `reviews/logs/${name}`);
    }
  }
  return moves;
}

function digest(file) {
  const hash = crypto.createHash('sha256');
  const buffer = Buffer.alloc(1024 * 1024);
  const fd = fs.openSync(file, 'r');
  try {
    let bytes;
    while ((bytes = fs.readSync(fd, buffer, 0, buffer.length, null))) hash.update(buffer.subarray(0, bytes));
  } finally { fs.closeSync(fd); }
  return hash.digest('hex');
}

function inventory(root, relative) {
  const file = path.join(root, relative);
  inside(root, file);
  const stat = fs.lstatSync(file);
  if (stat.isDirectory()) return fs.readdirSync(file).flatMap(name => inventory(root, path.join(relative, name)));
  if (!stat.isFile()) throw new Error(`Not a regular file: ${file}`);
  return [{ file: relative, bytes: stat.size, sha256: digest(file) }];
}

function organize(root, apply = false) {
  root = path.resolve(root);
  const moves = plan(root); // Preflight every destination before changing anything.
  for (const move of moves) console.log(`${move.from} -> ${move.to}`);
  if (!apply || !moves.length) return { moves, files: 0 };
  for (const move of moves) move.files = inventory(root, move.from);
  const report = { created: new Date().toISOString(), status: 'planned', moves };
  const journal = path.join(root, 'archive', 'migrations', `${Date.now()}-${crypto.randomUUID()}.json`);
  inside(root, journal);
  fs.mkdirSync(path.dirname(journal), { recursive: true });
  const save = () => fs.writeFileSync(journal, JSON.stringify(report, null, 2) + '\n');
  save();
  try {
    for (const move of moves) {
      const target = path.join(root, move.to);
      inside(root, target);
      if (fs.existsSync(target)) throw new Error(`Destination appeared during migration: ${target}`);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.renameSync(path.join(root, move.from), target);
      move.moved = true;
      save();
      for (const file of move.files) {
        const relocated = path.join(target, path.relative(move.from, file.file));
        if (fs.statSync(relocated).size !== file.bytes || digest(relocated) !== file.sha256) {
          throw new Error(`Verification failed: ${relocated}`);
        }
      }
      move.verified = true;
    }
    report.status = 'verified';
  } catch (error) {
    report.status = 'incomplete';
    report.error = error.message;
    throw error;
  } finally { save(); }
  const files = moves.reduce((sum, move) => sum + move.files.length, 0);
  console.log(`Verified ${files} files. Migration record: ${journal}`);
  return { moves, files };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Usage: node scripts/organize-dist.js [--apply]');
  const apply = args.includes('--apply');
  const result = organize(DIST, apply);
  if (apply) {
    fs.mkdirSync(DIST, { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'dist-layout.md'), path.join(DIST, 'README.md'));
  }
  console.log(`${result.moves.length} moves${apply ? ' applied' : ' planned (use --apply to move files)'}. Unknown artifacts are left in place.`);
}

module.exports = { organize, plan };
