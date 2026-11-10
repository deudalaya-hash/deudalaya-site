const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('root shows the required install landing page and gates the feed until installation', () => {
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /id="postVideo"/);
  assert.match(html, /id="deudalayaInstallLanding"[\s\S]*?assets\/deudalaya-install-poster\.jpeg[\s\S]*?id="deudalayaInstallAction"/);
  assert.match(html, /deudalaya-install-required/);
  assert.match(html, /\.deudalaya-install-required \.app\s*\{[^}]*display:\s*none/);
  assert.doesNotMatch(html, /id="ecosystemGateway"|deudalayaStandaloneFeedGate/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
});

test('PWA identity and service worker remain configured for the required install landing page', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'देउडालय');
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.equal(manifest.display, 'standalone');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /navigator\.serviceWorker\.register\('sw\.js'/);
});

test('the refreshed logo is used for every declared PWA icon size', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  const expected = new Map([['assets/deudalaya-icon-192.png', 192], ['assets/deudalaya-icon-512.png', 512], ['assets/deudalaya-maskable-512.png', 512]]);
  for (const icon of manifest.icons) {
    const size = expected.get(icon.src);
    assert.ok(size, `unexpected manifest icon ${icon.src}`);
    const png = fs.readFileSync(path.join(root, icon.src));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  assert.equal(expected.size, manifest.icons.length);
  const appleIcon = fs.readFileSync(path.join(root, 'assets/deudalaya-icon-180.png'));
  assert.equal(appleIcon.readUInt32BE(16), 180);
  assert.equal(appleIcon.readUInt32BE(20), 180);
});
