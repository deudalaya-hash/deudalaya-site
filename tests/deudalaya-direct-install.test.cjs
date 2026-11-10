const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root page presents one optional Deudalaya install action with browser access to the feed', () => {
  assert.match(html, /class="app-install-control"[\s\S]*?id="deudalayaInstallAction"/);
  assert.doesNotMatch(html, /id="ecosystemGateway"/);
  assert.doesNotMatch(html.match(/<button[^>]*id="deudalayaInstallAction"[^>]*>/)?.[0] || '', /disabled/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
  assert.doesNotMatch(html, /Show browser install steps|Add to Home Screen|Continue to Website/);
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /id="postVideo"/);
});
