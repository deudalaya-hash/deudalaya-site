const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root page overlays one real install action on the poster and gates the feed', () => {
  assert.match(html, /id="deudalayaInstallLanding"[\s\S]*?id="deudalayaInstallAction"/);
  assert.match(html, /assets\/deudalaya-install-poster\.jpeg/);
  assert.match(html, /deudalaya-install-required/);
  assert.match(html, /\.deudalaya-install-action\s*\{[^}]*position:\s*absolute/);
  assert.doesNotMatch(html, /id="ecosystemGateway"/);
  assert.doesNotMatch(html.match(/<button[^>]*id="deudalayaInstallAction"[^>]*>/)?.[0] || '', /disabled/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
  assert.doesNotMatch(html, /three.?dot|⋮|browser.?menu|Add to Home Screen|Continue to Website/i);
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /id="postVideo"/);
});
