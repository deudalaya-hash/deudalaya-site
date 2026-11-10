const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const otherAppNames = /लयपुर|शब्दलय|चलचित्रलय|phoneलय|कक्षालय|Syllabusलय|Blogलय|बासुलय|यात्रालय|भावलय|Concertलय/;

test('Deudalaya root keeps its own feed and installation identity without app cross-links', () => {
  const html = read('index.html');
  assert.match(html, /<div class="app">[\s\S]*?id="feed"/);
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /navigator\.serviceWorker\.register\('sw\.js'/);
  assert.match(html, /id="deudalayaInstallLanding"[\s\S]*?id="deudalayaInstallAction"/);
  assert.match(html, /assets\/deudalaya-install-poster\.jpeg/);
  assert.doesNotMatch(html, /id="ecosystemGateway"|deudalayaStandaloneFeedGate/);
  assert.match(html, /beforeinstallprompt|appinstalled|ecosystem-gateway\.js|ecosystem-gateway\.css/);
  assert.doesNotMatch(html, /Show browser install steps|Add to Home Screen|Continue to Website/);
  assert.doesNotMatch(html, otherAppNames);
  assert.doesNotMatch(html, /\/(?:sabdalaya|chalchitralaya|phonelaya|kakchhayalaya)\//i);
  assert.doesNotMatch(html, /\/?gateway=|index2\.html|layapur\.webmanifest|blog\.html/i);
});

test('Deudalaya manifest has only its own PWA identity', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'देउडालय');
  assert.equal(manifest.short_name, 'देउडालय');
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(manifest.related_applications, [
    { platform: 'webapp', id: 'https://deudalaya.com/', url: 'https://deudalaya.com/manifest.webmanifest' }
  ]);
});

test('legacy Deudalaya URL redirects before its retired gate code can run', () => {
  const html = read('index_fixed.html');
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /http-equiv="refresh" content="0;url=\/"/);
  assert.match(html, /location\.replace\('\/'\)/);
  assert.doesNotMatch(html, /<link rel="stylesheet" href="install-gate\.css/);
  assert.ok(html.indexOf("window.location.replace('/')") < html.indexOf('beforeinstallprompt'));
  assert.doesNotMatch(html, otherAppNames);
  assert.doesNotMatch(html, /profileSwitcher|layapurFrame|index2\.html|\/(?:sabdalaya|chalchitralaya|phonelaya|kakchhayalaya)\//i);
});

test('Deudalaya-owned pages and documentation contain no other app names', () => {
  for (const file of ['blog.html', 'APP_ECOSYSTEM.md']) {
    assert.doesNotMatch(read(file), otherAppNames, `${file} should remain Deudalaya-only`);
  }
  assert.match(read('sw.js'), /ecosystem-gateway\.(?:js|css)/);
});

test('the archived root showcase redirects visitors to the Deudalaya app', () => {
  const archive = read('index.backup.html');
  assert.match(archive, /name="robots" content="noindex,nofollow"/);
  assert.match(archive, /http-equiv="refresh" content="0;url=\/"/);
  assert.match(archive, /location\.replace\('\/'\)/);
  assert.doesNotMatch(archive, otherAppNames);
  assert.doesNotMatch(archive, /gateway-card|Explore Apps|ecosystem gateway/i);
});
