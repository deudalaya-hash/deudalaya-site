const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('vertical videos align to the top while landscape and square videos remain centered', () => {
  assert.match(html, /object-fit:contain/);
  assert.match(html, /\.video video\.portrait-video\s*\{[^}]*object-position:\s*center top/);
  assert.match(html, /loadedmetadata[\s\S]{0,220}videoHeight\s*>\s*[^;]*videoWidth/);
  assert.match(html, /classList\.toggle\(['"]portrait-video['"]/);
  assert.match(html, /classList\.remove\(['"]portrait-video['"]\)/);
});

test('the three category tabs float above the video with a visible active indicator', () => {
  assert.match(html, /\.feed-category-tabs\{position:absolute;z-index:12;top:/);
  assert.match(html, /\.feed-category\.selected::after\{[^}]*background:#fff/);
});
