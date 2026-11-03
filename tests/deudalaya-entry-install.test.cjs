const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('root shows the install gate in browsers and retains the Deudalaya feed for standalone mode', () => {
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /id="postVideo"/);
  assert.match(html, /id="ecosystemGateway"[\s\S]*?id="deudalayaInstallAction"/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
  assert.doesNotMatch(html, /Show browser install steps|Add to Home Screen|Continue to Website/);
});

test('PWA identity and service worker remain configured with the gate', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'देउडालय');
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.equal(manifest.display, 'standalone');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /navigator\.serviceWorker\.register\('sw\.js'/);
});
