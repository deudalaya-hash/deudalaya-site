const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('gateway retains the ordered app routes and presents Deudalaya alone', () => {
  const html = read('index.html');
  const cards = [...html.matchAll(/<article class="gateway-card[^>]*data-app="([^"]+)"[\s\S]*?<\/article>/g)];
  assert.deepEqual(cards.map(card => card[1]), ['layapur', 'deudalaya', 'sabdalaya', 'chalchitralaya', 'phonelaya', 'kakchhayalaya']);
  const destinations = ['/index2.html', '/?app=deudalaya', '/sabdalaya/', '/chalchitralaya/', '/phonelaya/', '/kakchhayalaya/'];
  cards.forEach((card, index) => {
    assert.match(card[0], new RegExp(`class="gateway-install" href="${destinations[index].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.match(card[0], /Install App/);
  });
  for (const name of ['लयपुर', 'देउडालय', 'शब्दलय', 'चलचित्रलय', 'phoneलय', 'कक्षालय']) assert.ok(html.includes(name));
  assert.match(html, /DEUDALAYA/);
  assert.match(read('ecosystem-gateway.css'), /gateway-card:not\(\[data-app="deudalaya"\]\)\{display:none\}/);
});

test('gateway enables Open App only after a live installation check', () => {
  const script = read('ecosystem-gateway.js');
  assert.match(script, /getInstalledRelatedApps/);
  assert.match(script, /state\s*!==\s*'installed'/);
  assert.doesNotMatch(script, /previously-installed|ecosystem-install-/);
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
    ['index.html', 'deudalayaInstallAction', 'deudalayaOpenInstalled', 'deudalaya-install-gate.js'],
    ['index2.html', 'layapurInstallButton', 'layapurOpenApp', null],
    ['sabdalaya/index.html', 'installAction', 'openInstalledApp', 'sabdalaya/sabdalaya.js'],
    ['chalchitralaya/index.html', 'installAppAction', 'openInstalledApp', 'chalchitralaya/app.js'],
    ['phonelaya/index.html', 'phoneInstallAction', 'phoneOpenInstalled', 'phonelaya/app.js'],
    ['kakchhayalaya/index.html', 'classInstallAction', 'classOpenInstalled', 'kakchhayalaya/app.js']
  ];
  for (const [htmlFile, installId, openId, scriptFile] of pages) {
    const html = read(htmlFile);
    assert.ok(html.includes(`id="${installId}"`), `${htmlFile} install action`);
    assert.ok(html.includes(`id="${openId}"`), `${htmlFile} open action`);
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
