const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('update notice presents the requested Deudalaya copy and optional Later action', () => {
  assert.match(html, /<strong id="updateTitle">New Update Available<\/strong>/);
  assert.match(html, /<span id="updateMessage">Update Deudalaya to enjoy the latest improvements\.<\/span>/);
  assert.match(html, /id="applyUpdate">Update Now<\/button>/);
  assert.match(html, /id="laterUpdate">Later<\/button>/);
  assert.match(html, /id="updateNotice"[^>]*hidden/);
});

test('a newer published version triggers the notice while current versions remain quiet', () => {
  const current = html.match(/const siteBuildVersion='([^']+)'/);
  assert.ok(current, 'Deudalaya exposes its current release version');
  assert.equal(version.version, current[1]);
  assert.match(html, /compareVersionNumbers\(remote\.version,siteBuildVersion\)>0/);
  assert.match(html, /showUpdateNotice\(remote\)/);
  assert.match(html, /checkForSiteUpdate\(\)/);
});

test('Update Now refreshes through the existing service worker update path', () => {
  assert.match(html, /addEventListener\('click',function\(\)\{applySiteUpdate\(\)\}\)/);
  assert.match(html, /getRegistration\(rootScope\)/);
  assert.match(html, /reg\.waiting\.postMessage[\s\S]*?SKIP_WAITING/);
  assert.match(html, /location\.replace\(fresh\.href\)/);
});
