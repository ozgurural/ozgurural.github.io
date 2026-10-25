const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { filmRenderTargets } = require('./film-render-targets');

test('bulk rendering honours frontmatter across line endings without hiding explicit exports', t => {
  const base = fs.realpathSync(os.tmpdir());
  const dir = fs.mkdtempSync(path.join(base, 'film-render-targets-'));
  t.after(() => {
    const resolved = fs.realpathSync(dir);
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith('film-render-targets-'));
    fs.rmSync(resolved, { recursive: true });
  });
  const put = (slug, text) => fs.writeFileSync(path.join(dir, slug + '-embed.md'), text);
  put('excluded-lf', '---\nrender: false\n---\n');
  put('excluded-crlf', '---\r\nrender:\tfalse  # archive only\r\n---\r\n');
  put('enabled', '---\nrender: true\n---\n');
  put('default', '---\ntitle: Default film\n---\n');
  put('body-example', '---\ntitle: Example\n---\nrender: false\n');
  fs.writeFileSync(path.join(dir, 'non-film.md'), '---\nrender: false\n---\n');
  const result = filmRenderTargets(dir, { all: true });
  assert.deepEqual(result.targets, ['body-example', 'default', 'enabled']);
  assert.deepEqual(result.skipped, ['excluded-crlf', 'excluded-lf']);
  assert.deepEqual(filmRenderTargets(dir, { film: 'excluded-lf' }).targets, ['excluded-lf']);
});

test('the repository bulk-render set omits its archived watermark comparison', () => {
  const result = filmRenderTargets(path.join(__dirname, '..', '_pages', 'embed'), { all: true });
  assert.ok(result.films.includes('watermarking-comparison'));
  assert.ok(result.skipped.includes('watermarking-comparison'));
  assert.ok(!result.targets.includes('watermarking-comparison'));
  assert.ok(result.targets.includes('training-fingerprint'));
});
