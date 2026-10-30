const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const appRoot = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(appRoot, file), 'utf8');

test('कक्षालय has its own PWA identity, icons, and service-worker scope', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'कक्षालय');
  assert.equal(manifest.short_name, 'कक्षालय');
  assert.equal(manifest.id, '/kakchhayalaya/');
  assert.equal(manifest.start_url, '/kakchhayalaya/');
  assert.equal(manifest.scope, '/kakchhayalaya/');
  assert.equal(manifest.description, 'कक्षालय — सिकाइको साझा घर।');
  for (const icon of manifest.icons) {
    const bytes = fs.readFileSync(path.join(appRoot, icon.src));
    const size = Number.parseInt(icon.sizes, 10);
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  const worker = read('sw.js');
  assert.match(worker, /kakchhayalaya-shell-v\d+/);
  assert.match(worker, /startsWith\(['"]kakchhayalaya-/);
  assert.doesNotMatch(worker, /unregister\s*\(/);
});

test('all ten class cards open their own class view with a return path', () => {
  const html = read('index.html');
  const script = read('app.js');
  for (let grade = 1; grade <= 10; grade += 1) {
    assert.match(html, new RegExp(`data-class="${grade}"[^>]*>[\\s\\S]*?class-label">Class ${grade}<`));
  }
  assert.match(html, /Select Your Class\./);
  assert.match(html, /id="installButton"/);
  assert.match(html, /Subjects Coming Soon/);
  assert.match(html, /id="classView"/);
  assert.match(html, /data-back-to-classes/);
  assert.match(script, /URLSearchParams/);
  assert.match(script, /new URLSearchParams\(location\.search\)\.get\('class'\)/);
  assert.match(script, /beforeinstallprompt/);
});

test('कक्षालय is linked from the gateway without changing other app routes', () => {
  const gateway = read('../index.html');
  const gatewayJs = fs.readFileSync(path.resolve(appRoot, '..', 'ecosystem-gateway.js'), 'utf8');
  const rootManifest = JSON.parse(fs.readFileSync(path.resolve(appRoot, '..', 'manifest.webmanifest'), 'utf8'));
  assert.match(gateway, /data-app="kakchhayalaya"/);
  assert.match(gateway, /href="\/kakchhayalaya\/"/);
  assert.match(gateway, /कक्षालय/);
  assert.match(gatewayJs, /kakchhayalaya/);
  assert.ok(rootManifest.related_applications.some(app => app.id === 'https://deudalaya.com/kakchhayalaya/'));
  for (const route of ['/sabdalaya/', '/chalchitralaya/', '/phonelaya/']) assert.ok(gateway.includes(route));
});
