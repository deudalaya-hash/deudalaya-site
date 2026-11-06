const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the bottom Home item keeps its icon and feed return behavior with a Nepali label', () => {
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/);
  assert.ok(nav, 'bottom navigation is present');
  const home = nav[0].match(/<button[^>]*>[\s\S]*?<\/button>/);
  assert.ok(home, 'the first bottom navigation button is the Home item');
  assert.match(home[0], /<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"\/><\/svg>/);
  assert.match(home[0], /<span class="mobile-home-label">देउडालय<\/span>/);
  assert.doesNotMatch(home[0], />Home<\/button>/);
  assert.match(html, /homeButton\.addEventListener\('click'/);
  assert.match(html, /if\(!isProfile&&pOpen\)\{closeProfile\(\)\}/);
  assert.match(html, /\.mobile-nav \.mobile-home-label\{font-family:[^}]*Noto Sans Devanagari/);
});
