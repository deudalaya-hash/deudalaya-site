const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Deudalaya and Layapur pages no longer render the floating app toggle', () => {
  const deudalaya = read('index.html');
  const layapur = read('index2.html');

  for (const id of ['profileSwitcher', 'profileSwitcherToggle', 'feedProfileButton', 'layapurProfileButton', 'layapurFrame']) {
    assert.doesNotMatch(deudalaya, new RegExp(`id=["']${id}["']`), `${id} should not be rendered`);
  }
  assert.doesNotMatch(deudalaya, /layapur-active|profile-switch-position|profile-switch-collapsed/);
  assert.match(layapur, /id="theme-toggle"/);
  assert.match(layapur, /id="menu-toggle"/);
});
