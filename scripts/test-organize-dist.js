const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { organize, plan } = require('./organize-dist');

function fixture(t) {
  const base = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, 'organize-dist-'));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith('organize-dist-'));
    fs.rmSync(resolved, { recursive: true });
  });
  const put = (name, data = name) => {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
  };
  return { root, put };
}

test('preview is read-only; apply preserves bytes and finals; rerun is empty', t => {
  const { root, put } = fixture(t);
  const bytes = Buffer.from([0, 255, 128, 10]);
  put('video/parts/film/part.mp4', bytes);
  put('video/film.mp4', bytes);
  put('video/film.timeline.json');
  put('review-site/index.html');
  put('notes-unknown.bin');
  assert.equal(organize(root).moves.length, 2);
  assert.ok(fs.existsSync(path.join(root, 'review-site/index.html')));
  assert.ok(!fs.existsSync(path.join(root, 'archive')));
  const result = organize(root, true);
  assert.equal(result.files, 2);
  assert.deepEqual(fs.readFileSync(path.join(root, 'cache/cinema/parts/film/part.mp4')), bytes);
  assert.deepEqual(fs.readFileSync(path.join(root, 'video/film.mp4')), bytes);
  assert.ok(fs.existsSync(path.join(root, 'video/film.timeline.json')));
  assert.ok(fs.existsSync(path.join(root, 'notes-unknown.bin')));
  assert.equal(plan(root).length, 0);
  const folder = path.join(root, 'archive/migrations');
  const report = JSON.parse(fs.readFileSync(path.join(folder, fs.readdirSync(folder)[0])));
  assert.equal(report.status, 'verified');
  assert.ok(report.moves.every(move => move.moved && move.verified));
});

test('destination collisions abort before any moves', t => {
  const { root, put } = fixture(t);
  put('a.py');
  put('review-site/index.html');
  put('builds/review-site/keep.html');
  assert.throws(() => organize(root, true), /Destination already exists/);
  assert.ok(fs.existsSync(path.join(root, 'a.py')));
  assert.ok(fs.existsSync(path.join(root, 'review-site/index.html')));
});

test('two sources cannot target the same log', t => {
  const { root, put } = fixture(t);
  put('render.log');
  put('video/render.log');
  assert.throws(() => organize(root, true), /Duplicate destination/);
  assert.ok(fs.existsSync(path.join(root, 'render.log')));
});

test('linked destination parent is refused', t => {
  const { root, put } = fixture(t);
  put('review-site/index.html');
  const linked = path.join(root, 'linked');
  fs.mkdirSync(linked);
  fs.symlinkSync(linked, path.join(root, 'builds'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => organize(root, true), /Refusing linked path/);
  assert.ok(fs.existsSync(path.join(root, 'review-site/index.html')));
});
