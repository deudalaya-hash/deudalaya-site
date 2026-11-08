const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { PROTECTED_FILES, changedPaths, isProtectedPath, normalizePath, parseArgs } = require('../scripts/check-pwa-protection.js');

test('the PWA guard protects every verified installation dependency with portable paths', () => {
  for (const file of [
    'index.html',
    'ecosystem-gateway.js',
    'manifest.webmanifest',
    'sw.js',
    'assets/deudalaya-icon-192.png',
    'tests/deudalaya-install-button.test.cjs'
  ]) assert.ok(isProtectedPath(file), `${file} is protected`);

  assert.equal(isProtectedPath('chalchitralaya/index.html'), false);
  assert.equal(isProtectedPath('assets/deudalaya-video-2026-11-03-feed-01.mp4'), false);
  assert.equal(normalizePath('assets\\Deudalaya-icon-192.png'), 'assets/deudalaya-icon-192.png');
  assert.equal(PROTECTED_FILES.length, new Set(PROTECTED_FILES).size, 'protected entries have no duplicates');
});

test('CI range arguments must provide both base and head refs', () => {
  assert.deepEqual(parseArgs(['--base', 'base', '--head', 'head']), {
    base: 'base', head: 'head', allowAuthorized: false, list: false
  });
  assert.throws(() => parseArgs(['--base', 'base']), /both --base and --head/);
  assert.throws(() => parseArgs(['--unexpected']), /Unknown argument/);
});

test('the checker detects protected changes in a clean isolated Git worktree', (t) => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'deudalaya-pwa-guard-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'pwa-test@example.invalid'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'PWA test'], { cwd: repo });
  fs.writeFileSync(path.join(repo, 'index.html'), 'gate');
  fs.writeFileSync(path.join(repo, 'readme.txt'), 'unrelated');
  execFileSync('git', ['add', 'index.html', 'readme.txt'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'baseline'], { cwd: repo });
  fs.writeFileSync(path.join(repo, 'index.html'), 'changed gate');
  fs.writeFileSync(path.join(repo, 'readme.txt'), 'changed unrelated');

  const changed = changedPaths(repo, {}).filter(isProtectedPath);
  assert.deepEqual(changed, ['index.html']);

  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
  execFileSync('git', ['add', 'index.html', 'readme.txt'], { cwd: repo });
  execFileSync('git', ['commit', '-qm', 'update'], { cwd: repo });
  const ranged = changedPaths(repo, { base, head: 'HEAD' }).filter(isProtectedPath);
  assert.deepEqual(ranged, ['index.html'], 'the CI base/head mode also identifies the protected path');
});
