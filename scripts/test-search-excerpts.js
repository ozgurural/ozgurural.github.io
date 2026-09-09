const assert = require('node:assert/strict');
const { test } = require('node:test');
const { excerptForQuery } = require('../assets/js/search.js');

test('deep matches show supporting context instead of the opening description', () => {
  const doc = { excerpt: 'Introduction only', content: 'Earlier work. '.repeat(60) +
    'At Comodo I built endpoint security systems. ' + 'Later work. '.repeat(50) };
  const result = excerptForQuery(doc, 'Comodo');
  assert.match(result, /At Comodo I built endpoint security systems/);
  assert.notEqual(result, doc.excerpt);
  assert.ok(result.length <= 242);
});
test('query syntax and metacharacters are handled as literal terms', () => {
  assert.equal(excerptForQuery({ content: 'SecurePoL is a research project.' }, 'title:SecurePoL*'),
    'SecurePoL is a research project.');
  assert.equal(excerptForQuery({ content: 'Work on C++ systems.' }, '[*+'), '');
});
test('fallback preserves the existing excerpt for stemmed or title-only matches', () => {
  assert.equal(excerptForQuery({ excerpt: 'Existing description', content: 'Unrelated text' }, 'research'),
    'Existing description');
});
test('text stays literal for the renderer to escape once', () => {
  const text = 'Research <img src=x onerror=alert(1)> & security.';
  assert.equal(excerptForQuery({ content: text }, 'security'), text);
});
test('common question words do not displace the matching technical term', () => {
  const text = 'What does the site describe? '.repeat(40) + 'Watermarking protects the model.';
  assert.match(excerptForQuery({ content: text }, 'What about watermarking?'), /Watermarking protects/);
});
test('empty content and negative matches preserve the description', () => {
  assert.equal(excerptForQuery({ excerpt: 'Summary' }, ''), 'Summary');
  assert.equal(excerptForQuery({}, 'nothing'), '');
});
