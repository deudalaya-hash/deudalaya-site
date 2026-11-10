const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('root entry allows browser use, keeps an optional install action, and preserves separate app routes', () => {
  const html = read('index.html');
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /class="app-install-control"[\s\S]*?id="deudalayaInstallAction"/);
  assert.doesNotMatch(html, /id="ecosystemGateway"|deudalayaStandaloneFeedGate/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.(?:js|css)/);
  for (const page of ['index2.html', 'sabdalaya/index.html', 'chalchitralaya/index.html', 'phonelaya/index.html', 'kakchhayalaya/index.html']) {
    assert.ok(fs.existsSync(path.join(root, page)), `${page} remains an independent app page`);
  }
  assert.match(html, /<meta name="application-name" content="देउडालय">/);
});

test('Deudalaya PWA remains installable without requiring its browser installation', () => {
  const html = read('index.html');
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /navigator\.serviceWorker\.register\('sw\.js'/);
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.deepEqual(manifest.related_applications, [
    { platform: 'webapp', id: 'https://deudalaya.com/', url: 'https://deudalaya.com/manifest.webmanifest' }
  ]);
});

test('browser and standalone modes both retain direct feed access', () => {
  const html = read('index.html');
  assert.match(html, /display-mode: standalone/);
  assert.match(html, /id="feed"/);
  assert.doesNotMatch(html, /html:not\(\.deudalaya-standalone\) body>\.app/);
});

test('each app page has its own install action and confirmation-gated open action', () => {
  const pages = [
    ['index2.html', 'layapurInstallButton', 'layapurOpenApp', null],
    ['sabdalaya/index.html', 'installAction', 'openInstalledApp', 'sabdalaya/sabdalaya.js'],
    ['chalchitralaya/index.html', 'installAppAction', 'openInstalledApp', 'chalchitralaya/app.js'],
    ['phonelaya/index.html', 'phoneInstallAction', 'phoneOpenInstalled', 'phonelaya/app.js'],
    ['kakchhayalaya/index.html', 'classInstallAction', 'classOpenInstalled', 'kakchhayalaya/app.js']
  ];
  for (const [htmlFile, installId, openId, scriptFile] of pages) {
    const html = read(htmlFile);
    assert.ok(html.includes(`id="${installId}"`), `${htmlFile} install action`);
    if (openId) assert.ok(html.includes(`id="${openId}"`), `${htmlFile} open action`);
    if (scriptFile) {
      const script = read(scriptFile);
      assert.match(script, /beforeinstallprompt/);
      assert.match(script, /appinstalled/);
    }
  }
  const phone = JSON.parse(read('phonelaya/manifest.webmanifest'));
  const classApp = JSON.parse(read('kakchhayalaya/manifest.webmanifest'));
  assert.equal(phone.scope, '/phonelaya/');
  assert.equal(classApp.scope, '/kakchhayalaya/');
  assert.equal(JSON.parse(read('layapur.webmanifest')).scope, './');
});

test('Deudalaya and class-selection interface languages are English-first', () => {
  const deudalaya = read('index.html');
  const classroom = read('kakchhayalaya/index.html');
  assert.match(deudalaya, /<html lang="en"(?:\s|>)/);
  assert.match(deudalaya, />Sign in</);
  assert.match(deudalaya, /id="playPauseButton"/);
  assert.match(classroom, /Select Your Class/);
  assert.match(classroom, /Class 1/);
  assert.match(classroom, /Subjects Coming Soon/);
  assert.ok(classroom.includes('कक्षालय — सिकाइको साझा घर।'));
});
