const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the Inbox icon keeps its handler and renders its label below the icon', () => {
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/);
  assert.ok(nav);
  const inbox = nav[0].match(/<button[^>]*onclick="toggleComments\(\)"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(inbox, 'Inbox remains on its original navigation button');
  assert.match(inbox[0], /<svg viewBox="0 0 24 24">[\s\S]*?<\/svg><span class="nav-label-badge"><span class="mobile-inbox-label">Inbox<\/span>\s*<i>99\+<\/i><\/span>/);
  assert.match(html, /\.mobile-nav \.mobile-inbox-label\{[^}]*display:block/);
  assert.match(html, /\.mobile-nav button:nth-child\(4\) \.nav-label-badge\{[^}]*overflow:visible/);
  assert.match(html, /@media\(min-width:701px\)\{\.mobile-nav\{position:fixed;display:flex/);
});
