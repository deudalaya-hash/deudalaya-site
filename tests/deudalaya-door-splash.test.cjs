const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('door splash keeps both labeled handles visible', () => {
  assert.match(html, /<div class="entry-door-panel entry-door-left"><span class="entry-door-knocker">देउडा<\/span><\/div>/);
  assert.match(html, /<div class="entry-door-panel entry-door-right"><span class="entry-door-knocker">लय<\/span><\/div>/);

  const splashStyles = html.match(/<style id="white-logo-splash">([\s\S]*?)<\/style>/)?.[1] || '';
  assert.match(splashStyles, /\.launch-splash:not\(\.door-splash\) span\s*\{\s*display:\s*none\s*\}/);
  assert.doesNotMatch(splashStyles, /\.launch-splash\s+span\s*\{\s*display:\s*none\s*\}/);
  assert.match(splashStyles, /\.door-splash\.door-opening\s*\{\s*background:\s*transparent!important\s*\}/);
});
