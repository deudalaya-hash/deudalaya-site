const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root page presents one Deudalaya install action before its feed', () => {
  assert.match(html, /id="ecosystemGateway"[\s\S]*?id="deudalayaInstallAction"/);
  assert.match(html, /id="deudalayaInstallAction"[^>]*disabled/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
  assert.doesNotMatch(html, /Show browser install steps|Add to Home Screen|Continue to Website/);
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /id="postVideo"/);
});
