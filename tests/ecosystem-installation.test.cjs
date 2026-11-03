const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('root entry exposes only Deudalaya installation and no ecosystem gateway choices', () => {
  const html = read('index.html');
  const cards = [...html.matchAll(/<article class="gateway-card[^>]*data-app="([^"]+)"[\s\S]*?<\/article>/g)];
  assert.deepEqual(cards.map(card => card[1]), ['deudalaya']);
  assert.match(cards[0][0], /id="deudalayaInstallAction" type="button" hidden>Install App/);
  assert.doesNotMatch(html, /gateway-footnote|gateway-footer|Continue to Website/);
  assert.match(html, /id="deudalayaOpenInstalled"[^>]*hidden[^>]*>Open Deudalaya/);
  for (const page of ['index2.html', 'sabdalaya/index.html', 'chalchitralaya/index.html', 'phonelaya/index.html', 'kakchhayalaya/index.html']) {
    assert.ok(fs.existsSync(path.join(root, page)), `${page} remains an independent app page`);
  }
  assert.match(html, /DEUDALAYA/);
  assert.match(html, /One community\. <em>Many stories\.<\/em>/);
});

test('Deudalaya install entry uses the native prompt when available and guides Chrome menu installs otherwise', () => {
  const script = read('ecosystem-gateway.js');
  assert.match(script, /getInstalledRelatedApps/);
  assert.match(script, /promptEvent\.prompt\(\)/);
  assert.match(script, /getMenuInstallGuidance/);
  assert.match(script, /Install app or Add to Home screen/);
  assert.match(script, /appinstalled/);
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.ok(manifest.related_applications.some(app => app.id === 'https://deudalaya.com/index2.html'));
});

test('the Deudalaya app route does not by itself count as an installed PWA', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /if\(!gatewayLaunch&&\(standalone\|\|appLaunch\)\)document\.documentElement\.classList\.add\('deudalaya-installed'\)/);
  assert.match(html, /if\(!gatewayLaunch&&standalone\)document\.documentElement\.classList\.add\('deudalaya-installed'\)/);
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
  const gateway = read('index.html');
  const classroom = read('kakchhayalaya/index.html');
  assert.match(gateway, /DEUDALAYA/);
  assert.match(gateway, /Install App/);
  assert.match(classroom, /Select Your Class/);
  assert.match(classroom, /Class 1/);
  assert.match(classroom, /Subjects Coming Soon/);
  assert.ok(classroom.includes('कक्षालय — सिकाइको साझा घर।'));
});
