const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('शब्दलय has an app-scoped, separately identified install manifest', () => {
  const manifest = JSON.parse(read('sabdalaya/manifest.webmanifest'));
  assert.equal(manifest.name, 'शब्दलय');
  assert.equal(manifest.short_name, 'शब्दलय');
  assert.equal(manifest.id, '/sabdalaya/');
  assert.equal(manifest.start_url, '/sabdalaya/');
  assert.equal(manifest.scope, '/sabdalaya/');
  assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'));
});
test('शब्दलय registers only its own service worker within its directory', () => {
  const html = read('sabdalaya/index.html');
  const script = read('sabdalaya/sabdalaya.js');
  const worker = read('sabdalaya/sw.js');
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /sabdalaya\.js/);
  assert.match(html, /sabdalaya\.css/);
  assert.match(script, /register\(['"]\/sabdalaya\/sw\.js['"],\s*\{\s*scope:\s*['"]\/sabdalaya\/['"]/);
  assert.match(worker, /self\.addEventListener\(['"]fetch['"]/);
  assert.doesNotMatch(worker, /importScripts|unregister\s*\(/);
});

test('शब्दलय install gate blocks the feed outside standalone mode', () => {
  const html = read('sabdalaya/index.html');
  const script = read('sabdalaya/sabdalaya.js');
  const gateStyle = read('sabdalaya/install-gate.css');
  assert.match(html, /id="installButton"/);
  assert.match(html, /id="installGate" hidden/);
  assert.match(html, /id="openInstalledApp"/);
  assert.match(script, /installButton\.addEventListener\(['"]click['"]/);
  assert.match(script, /shell\.inert\s*=\s*true/);
  assert.match(script, /installGate\.hidden\s*=\s*false/);
  assert.match(gateStyle, /sabdalaya-install-required/);
});

test('शब्दलय presents its reference-led feed and recording flow without claiming uploads', () => {
  const html = read('sabdalaya/index.html');
  const script = read('sabdalaya/sabdalaya.js');
  assert.match(html, /<title>शब्दलय/);
  assert.match(html, /आवाजको आफ्नै संसार/);
  for (const item of ['Home', 'Friends', 'Record', 'Inbox', 'Profile']) {
    assert.ok(html.includes(item), `navigation should include ${item}`);
  }
  assert.match(html, /id="recordAction"/);
  assert.match(script, /getUserMedia\(/);
  assert.match(script, /MediaRecorder/);
  assert.match(html + script, /अपलोड गरिएको छैन|ब्याकएन्ड/i);
  assert.doesNotMatch(script, /fetch\s*\(|\.from\s*\(/);
});

test('शब्दलय describes demo playback and does not claim uploads are saved', () => {
  const html = read('sabdalaya/index.html');
  const script = read('sabdalaya/sabdalaya.js');
  assert.match(html, /demo/i);
  assert.match(html, /Generated tone/);
  assert.doesNotMatch(html, /0:(12|18|22)/);
  assert.match(script, /Web Audio|AudioContext/);
  assert.match(script, /backend|saved|upload/i);
  assert.doesNotMatch(script, /fetch\s*\(|\.from\s*\(/);
});

test('शब्दलय keeps its own route and Deudalaya update checks only the root worker', () => {
  const rootHtml = read('index.html');
  const rootManifest = JSON.parse(read('manifest.webmanifest'));
  const audioManifest = JSON.parse(read('sabdalaya/manifest.webmanifest'));
  const updater = read('site-update.js');
  assert.match(rootHtml, /id="deudalayaInstallLanding"[\s\S]*?assets\/deudalaya-install-poster\.jpeg/);
  assert.match(rootHtml, /site-update\.js/);
  assert.equal(rootManifest.start_url, '/?app=deudalaya');
  assert.equal(audioManifest.start_url, '/sabdalaya/');
  assert.equal(audioManifest.scope, '/sabdalaya/');
  assert.match(updater, /new URL\('\/',\s*root\.location\.origin\)/);
  assert.match(updater, /serviceWorker\.getRegistration\(scope\)/);
  assert.doesNotMatch(updater, /getRegistrations\(|caches\.keys\(|caches\.delete\(|unregister\s*\(/);
});

test('शब्दलय ships distinct install icons', () => {
  for (const size of [192, 512]) {
    const icon = fs.readFileSync(path.join(root, `sabdalaya/icon-${size}.png`));
    assert.ok(icon.length > 100, `icon-${size}.png should be a real image`);
    assert.equal(icon.readUInt32BE(16), size);
    assert.equal(icon.readUInt32BE(20), size);
  }
});
