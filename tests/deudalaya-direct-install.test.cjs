const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root page does not show or load an installation gate', () => {
  assert.doesNotMatch(html, /ecosystemGateway|deudalayaInstallAction|deudalayaInstallProgress|deudalayaOpenInstalled/);
  assert.doesNotMatch(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)|install-gate/);
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
});