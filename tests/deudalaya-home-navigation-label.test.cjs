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
  const profile = nav[0].match(/<button[^>]*onclick="openProfile\(\)"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(profile, 'the Profile item remains a button with its original handler');
  assert.match(profile[0], /<span class="mobile-profile-label">म<\/span>/);
  assert.match(profile[0], /<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"\/><path d="M5 21v-2a7 7 0 0 1 14 0v2"\/><\/svg>/);
  assert.match(html, /homeButton\.addEventListener\('click'/);
  assert.match(html, /if\(!isProfile&&pOpen\)\{closeProfile\(\)\}/);
  assert.match(html, /\.mobile-nav \.mobile-home-label\{font-family:[^}]*Noto Sans Devanagari/);
});
