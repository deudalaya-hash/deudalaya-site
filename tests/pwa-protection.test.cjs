const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { PROTECTED_FILES, changedPaths, protectedChangedPaths, indexProtectionUnchanged, isProtectedPath, normalizePath, parseArgs } = require('../scripts/check-pwa-protection.js');

const protectedIndexFixture = `<!doctype html>
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="assets/deudalaya-icon-180.png">
<link rel="icon" href="assets/deudalaya-icon-192.png">
<script id="deudalayaPwaCapture">window.addEventListener('beforeinstallprompt', e => e.preventDefault()); if (matchMedia('(display-mode: standalone)').matches) document.documentElement.classList.remove('deudalaya-install-required');</script>
<style id="deudalaya-install-landing-style">.deudalaya-install-required .app{display:none}#deudalayaInstallLanding{position:fixed}.deudalaya-install-action{position:absolute}</style>
<style id="deudalaya-install-control-style">.gateway-install{position:fixed}</style>
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', {scope:'./'});</script>
<section id="deudalayaInstallLanding"><div class="deudalaya-install-poster"><img src="assets/deudalaya-install-poster.jpeg"><button id="deudalayaInstallAction">Install App</button><p id="deudalayaInstallHint"></p></div></section>
<main id="feed">video feed</main>`;

test('the PWA guard protects every verified installation dependency with portable paths', () => {
  for (const file of [
    'index.html',
    'ecosystem-gateway.js',
    'manifest.webmanifest',
    'sw.js',
    'assets/deudalaya-icon-192.png',
    'assets/deudalaya-install-poster.jpeg',
    'tests/deudalaya-install-button.test.cjs'
  ]) assert.ok(isProtectedPath(file), `${file} is protected`);

  assert.equal(isProtectedPath('chalchitralaya/index.html'), false);
  assert.equal(isProtectedPath('assets/deudalaya-video-2026-11-03-feed-01.mp4'), false);
  assert.equal(normalizePath('assets\\Deudalaya-icon-192.png'), 'assets/deudalaya-icon-192.png');
  assert.equal(PROTECTED_FILES.length, new Set(PROTECTED_FILES).size, 'protected entries have no duplicates');
});

test('feed-only index edits leave the mandatory install fingerprint unchanged', () => {
  assert.equal(indexProtectionUnchanged(protectedIndexFixture, protectedIndexFixture.replace('video feed', 'updated feed')), true);
});

test('the install fingerprint detects edits to each protected landing and PWA section', () => {
  const changedSections = [
    protectedIndexFixture.replace("e.preventDefault()", "e.returnValue = true"),
    protectedIndexFixture.replace('.deudalaya-install-action{position:absolute}', '.deudalaya-install-action{display:none}'),
    protectedIndexFixture.replace('id="deudalayaInstallAction"', 'id="removedInstallAction"'),
    protectedIndexFixture.replace("display-mode: standalone", "display-mode: browser"),
    protectedIndexFixture.replace("register('sw.js', {scope:'./'})", "register('other.js', {scope:'./'})"),
    protectedIndexFixture.replace('assets/deudalaya-install-poster.jpeg', 'assets/other.jpeg'),
    protectedIndexFixture.replace('rel="manifest"', 'rel="alternate"')
  ];
  for (const changed of changedSections) assert.equal(indexProtectionUnchanged(protectedIndexFixture, changed), false);
});

test('CI range arguments must provide both base and head refs', () => {
  assert.deepEqual(parseArgs(['--base', 'base', '--head', 'head']), {
    base: 'base', head: 'head', allowAuthorized: false, list: false
  });
  assert.throws(() => parseArgs(['--base', 'base']), /both --base and --head/);
  assert.throws(() => parseArgs(['--unexpected']), /Unknown argument/);
});

test('the checker allows feed-only index edits and detects install-section edits in Git ranges', (t) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'deudalaya-pwa-guard-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'pwa-test@example.invalid'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'PWA test'], { cwd: repo });
  fs.writeFileSync(path.join(repo, 'index.html'), protectedIndexFixture);
  fs.writeFileSync(path.join(repo, 'readme.txt'), 'unrelated');
  execFileSync('git', ['add', 'index.html', 'readme.txt'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: repo });
  fs.writeFileSync(path.join(repo, 'index.html'), protectedIndexFixture.replace('video feed', 'changed video feed'));
  fs.writeFileSync(path.join(repo, 'readme.txt'), 'changed unrelated');

  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  execFileSync('git', ['add', 'index.html', 'readme.txt'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'update'], { cwd: repo });
  const feedOnly = protectedChangedPaths(repo, { base, head: 'HEAD' });
  assert.deepEqual(feedOnly, [], 'feed edits do not alter the install fingerprint');

  fs.writeFileSync(path.join(repo, 'index.html'), protectedIndexFixture.replace('Install App', 'Get App'));
  execFileSync('git', ['add', 'index.html'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'change install action'], { cwd: repo });
  const protectedDiff = protectedChangedPaths(repo, { base, head: 'HEAD' });
  assert.deepEqual(protectedDiff, ['index.html'], 'the CI base/head mode detects install changes');
});
