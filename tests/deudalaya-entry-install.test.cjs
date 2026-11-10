const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('root lets browser visitors use the Deudalaya feed and keeps an optional install action', () => {
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /id="postVideo"/);
  assert.match(html, /class="app-install-control"[\s\S]*?id="deudalayaInstallAction"/);
  assert.doesNotMatch(html, /id="ecosystemGateway"|deudalayaStandaloneFeedGate/);
  assert.doesNotMatch(html, /<html[^>]*class="ecosystem-gateway"/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
});

test('PWA identity and service worker remain configured without requiring installation', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'देउडालय');
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.equal(manifest.display, 'standalone');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /navigator\.serviceWorker\.register\('sw\.js'/);
});
