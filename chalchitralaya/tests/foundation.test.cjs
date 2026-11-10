const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('चलचित्रलय has an independent, app-scoped PWA identity', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'चलचित्रलय');
  assert.equal(manifest.short_name, 'चलचित्रलय');
  assert.equal(manifest.id, '/chalchitralaya/');
  assert.equal(manifest.start_url, '/chalchitralaya/');
  assert.equal(manifest.scope, '/chalchitralaya/');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'));
});

test('all assets resolve locally and the service worker stays inside its app scope', () => {
  const html = read('index.html');
  const script = read('app.js');
  const worker = read('sw.js');
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="app\.js"/);
  assert.match(html, /manifest\.webmanifest/);
  assert.match(script, /register\(['"]\/chalchitralaya\/sw\.js['"],\s*\{\s*scope:\s*['"]\/chalchitralaya\//);
  assert.doesNotMatch(worker, /unregister\s*\(|caches\.delete\s*\(/);
  for (const icon of ['icon-192.png', 'icon-512.png']) assert.ok(fs.existsSync(path.join(root, icon)));
});

test('home page communicates the cinema catalogue and requested Nepali categories', () => {
  const html = read('index.html');
  for (const label of ['नेपाली चलचित्र', 'सुदूरपश्चिमेली चलचित्र', 'कर्णाली चलचित्र', 'ऐतिहासिक चलचित्र', 'सामाजिक चलचित्र', 'प्रेमकथा', 'वृत्तचित्र', 'छोटा चलचित्र']) {
    assert.ok(html.includes(label), `missing category: ${label}`);
  }
  for (const section of ['Trending', 'Recently added', 'Coming soon', 'Recommended']) assert.ok(html.includes(section));
  assert.match(html, /चलचित्रलय/);
  assert.match(html, /demo|demonstration/i);
});

test('demo checkout never represents payment, tickets, or sign-in as real', () => {
  const html = read('index.html');
  const script = read('app.js');
  assert.match(html, /demonstration checkout|demo checkout/i);
  assert.match(html, /payment gateway|payment provider/i);
  assert.match(html, /demo only|demonstration only/i);
  assert.doesNotMatch(script, /fetch\s*\(|XMLHttpRequest|supabase/i);
  assert.doesNotMatch(script, /payment\s*(?:success|completed)|ticket\s*(?:purchased|owned)/i);
});

test('film details, search, language and session-only library interactions are wired', () => {
  const html = read('index.html');
  const script = read('app.js');
  assert.match(html, /id="movieGrid"/);
  assert.match(html, /id="searchInput"/);
  assert.match(html, /id="languageToggle"/);
  assert.match(html, /id="movieDialog"/);
  assert.match(html, /id="playerDialog"/);
  assert.match(html, /id="watchlistButton"/);
  assert.match(script, /requestFullscreen\(/);
  assert.match(script, /currentTime/);
  assert.match(script, /sessionStorage/);
  assert.match(script, /staticEnglish\.forEach/);
  assert.match(script, /genreEnglish\[movie\.genre\]/);
  assert.doesNotMatch(script, /शब्दलय ब्राउजरबाट स्थापना/);
});

test('install identity icons are valid PNGs of their declared dimensions', () => {
  for (const size of [192, 512]) {
    const png = fs.readFileSync(path.join(root, `icon-${size}.png`));
    assert.ok(png.length > 100);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test('the root is the poster-gated Deudalaya feed and sibling apps keep independent routes', () => {
  const rootHtml = fs.readFileSync(path.resolve(root, '..', 'index.html'), 'utf8');
  const rootManifest = JSON.parse(fs.readFileSync(path.resolve(root, '..', 'manifest.webmanifest'), 'utf8'));
  assert.match(rootHtml, /id="deudalayaInstallLanding"[\s\S]*?deudalaya-install-poster\.jpeg/);
  assert.match(rootHtml, /\.deudalaya-install-required \.app\s*\{[^}]*display:\s*none/);
  assert.match(rootHtml, /id="feed"/);
  assert.doesNotMatch(rootHtml, /id="ecosystemGateway"/);
  assert.equal(rootManifest.start_url, '/?app=deudalaya');
  assert.equal(rootManifest.scope, './');
  for (const [app, route] of [
    ['sabdalaya', '/sabdalaya/'],
    ['chalchitralaya', '/chalchitralaya/'],
    ['phonelaya', '/phonelaya/'],
    ['kakchhayalaya', '/kakchhayalaya/']
  ]) {
    const manifest = JSON.parse(fs.readFileSync(path.resolve(root, '..', app, 'manifest.webmanifest'), 'utf8'));
    assert.equal(manifest.start_url, route);
    assert.equal(manifest.scope, route);
    assert.ok(fs.existsSync(path.resolve(root, '..', app, 'index.html')));
  }
});

test('all three apps keep their own manifest identity and service-worker scope', () => {
  const rootManifest = JSON.parse(fs.readFileSync(path.resolve(root, '..', 'manifest.webmanifest'), 'utf8'));
  const audioManifest = JSON.parse(fs.readFileSync(path.resolve(root, '..', 'sabdalaya/manifest.webmanifest'), 'utf8'));
  assert.equal(rootManifest.scope, './');
  assert.equal(audioManifest.name, 'शब्दलय');
  assert.equal(audioManifest.scope, '/sabdalaya/');
  assert.equal(audioManifest.start_url, '/sabdalaya/');
  assert.match(read('app.js'), /register\(['"]\/chalchitralaya\/sw\.js['"],\s*\{\s*scope:\s*['"]\/chalchitralaya\//);
  const audioScript = fs.readFileSync(path.resolve(root, '..', 'sabdalaya/sabdalaya.js'), 'utf8');
  assert.match(audioScript, /register\(['"]\/sabdalaya\/sw\.js['"],\s*\{\s*scope:\s*['"]\/sabdalaya\//);
  const rootWorker = fs.readFileSync(path.resolve(root, '..', 'sw.js'), 'utf8');
  for (const worker of [
    rootWorker,
    fs.readFileSync(path.resolve(root, '..', 'sabdalaya/sw.js'), 'utf8'),
    read('sw.js')
  ]) assert.doesNotMatch(worker, /getRegistrations\(|unregister\s*\(/);
  assert.match(rootWorker, /names\.filter\(name => name\.startsWith\('deudalaya-shell-'\) && name !== CACHE_NAME\)/);
  assert.match(rootWorker, /caches\.delete\(name\)/, 'cleanup is limited to old Deudalaya shell caches');
});
