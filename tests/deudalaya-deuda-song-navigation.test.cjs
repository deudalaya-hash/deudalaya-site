const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(root, 'social.js'), 'utf8');
const mobileNav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0];

test('the shared bottom navigation replaces Friends with a Coming Soon music item', () => {
  assert.ok(mobileNav, 'shared bottom navigation exists');
  const items = [...mobileNav.matchAll(/<button\b[\s\S]*?<\/button>/g)].map(match => match[0]);
  const songItem = items[1];

  assert.ok(songItem, 'the second bottom navigation item exists');
  assert.match(songItem, /onclick="toast\('देउडा गीत · Coming Soon'\)"/);
  assert.match(songItem, /aria-label="देउडा गीत"/);
  assert.match(songItem, /aria-hidden="true"[^>]*>🎵<\/span>/);
  assert.match(songItem, /देउडा गीत/);
  assert.doesNotMatch(songItem, /Friends|<svg|<i>|href|nextVideo|setFeedMode/);
  const clickHandler = songItem.match(/onclick="([^"]+)"/)?.[1];
  let toastMessage = '';
  Function('toast', clickHandler)(message => { toastMessage = message; });
  assert.equal(toastMessage, 'देउडा गीत · Coming Soon');
  assert.doesNotMatch(social, /friendsTab|document\.querySelector\('\.mobile-nav button:nth-child\(2\)'\)/);
  assert.match(social, /button\.textContent\.trim\(\) === 'Following'.*setFeedMode\('following'\)/);
});
