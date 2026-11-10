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

test('कक्षालय keeps its own route while Deudalaya remains the poster-gated root app', () => {
  const rootHtml = read('../index.html');
  const rootManifest = JSON.parse(fs.readFileSync(path.resolve(appRoot, '..', 'manifest.webmanifest'), 'utf8'));
  const classManifest = JSON.parse(read('manifest.webmanifest'));
  assert.match(rootHtml, /id="deudalayaInstallLanding"[\s\S]*?id="deudalayaInstallAction"/);
  assert.match(rootHtml, /id="feed"/);
  assert.equal(rootManifest.start_url, '/?app=deudalaya');
  assert.equal(classManifest.start_url, '/kakchhayalaya/');
  assert.equal(classManifest.scope, '/kakchhayalaya/');
  assert.ok(fs.existsSync(path.join(appRoot, 'index.html')));
  assert.doesNotMatch(rootHtml, /href="\/kakchhayalaya\//, 'the Deudalaya root does not masquerade as an app directory gateway');
});
