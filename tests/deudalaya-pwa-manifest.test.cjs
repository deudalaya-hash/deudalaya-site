const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));

test('Deudalaya declares a favicon media type that matches the linked file', () => {
  const match = html.match(/<link rel="icon" type="([^"]+)" href="([^"]+)"/);
  assert.ok(match, 'an explicit favicon link is required');
  const expectedTypes = { '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
  assert.equal(match[1], expectedTypes[path.extname(match[2])]);
});

test('Deudalaya manifest has install identity, scope, display, and downloadable PNG icons', () => {
  assert.ok(manifest.name || manifest.short_name);
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  for (const size of ['192x192', '512x512']) {
    const icon = manifest.icons.find((item) => item.sizes === size && item.type === 'image/png');
    assert.ok(icon, `manifest needs a ${size} PNG icon`);
    assert.ok(fs.existsSync(path.join(root, icon.src)), `${icon.src} must exist`);
  }
});

test('Deudalaya explicitly opts into browser installation', () => {
  assert.equal(manifest.prefer_related_applications, false);
});

test('Deudalaya declares a complete color identity and a maskable 512px icon', () => {
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i);
  const maskable = manifest.icons.find((item) => item.sizes === '512x512' && item.purpose === 'maskable');
  assert.ok(maskable, 'manifest needs a separately maskable 512px icon');
  assert.ok(fs.existsSync(path.join(root, maskable.src)), `${maskable.src} must exist`);
});

test('Deudalaya service worker claims pages and caches only named app-shell files', () => {
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(worker, /clients\.claim\(\)/);
  assert.match(worker, /caches\.open\(CACHE_NAME\)/);
  assert.match(worker, /self\.addEventListener\('fetch'/);
  assert.match(worker, /SHELL_ASSETS/);
  assert.doesNotMatch(worker, /cache\.addAll\(/);
  assert.match(worker, /deudalaya-shell-/);
  assert.match(worker, /self\.location\.origin/);
});
