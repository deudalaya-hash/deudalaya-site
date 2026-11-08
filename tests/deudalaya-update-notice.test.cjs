const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createUpdateGate } = require('../site-update.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));

test('update notice presents the requested Deudalaya copy and optional Later action', () => {
  assert.match(html, /<strong id="updateTitle">Update Available<\/strong>/);
  assert.match(html, /<span id="updateMessage">A new version of Deudalaya is ready\.<\/span>/);
  assert.match(html, /id="applyUpdate">Update Now<\/button>/);
  assert.match(html, /id="laterUpdate">Later<\/button>/);
  assert.match(html, /id="updateNotice"[^>]*hidden/);
});

test('a newer published version triggers the notice while current versions remain quiet', () => {
  const current = html.match(/const siteBuildVersion='([^']+)'/);
  assert.ok(current, 'Deudalaya exposes its current release version');
  assert.equal(version.version, current[1]);
  const updateManager = fs.readFileSync(path.join(root, 'site-update.js'), 'utf8');
  assert.match(updateManager, /gate\.shouldAnnounce\(currentVersion, release\.version\)/);
  assert.match(updateManager, /cache: 'no-store'/);
  assert.match(updateManager, /setInterval\(\(\) => \{ if \(doc\.visibilityState === 'visible'\) checkForSiteUpdate\(\); \}, 90000\)/);
});

test('Update Now refreshes through the existing service worker update path', () => {
  assert.match(html, /site-update\.js/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /event\.data\.type\s*===\s*'SKIP_WAITING'[\s\S]*?self\.skipWaiting\(\)/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /event\.data\.type\s*===\s*'GET_BUILD_ID'/);
  assert.match(fs.readFileSync(path.join(root, 'site-update.js'), 'utf8'), /location\.replace\(fresh\.href\)/);
  assert.match(fs.readFileSync(path.join(root, 'site-update.js'), 'utf8'), /controllerchange/);
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'site-update.js'), 'utf8'), /controllerchange[\s\S]{0,150}location\.replace/);
  assert.match(fs.readFileSync(path.join(root, 'site-update.js'), 'utf8'), /setInterval\(updateWorker, 60000\)/);
  assert.match(fs.readFileSync(path.join(root, 'site-update.js'), 'utf8'), /if \(reg\.waiting && nav\.serviceWorker\.controller\) announceWorker/);
  assert.match(fs.readFileSync(path.join(root, 'site-update.js'), 'utf8'), /if \(!nav\.serviceWorker\.controller\) return/);
  const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.doesNotMatch(worker.slice(0, worker.indexOf("self.addEventListener('message'")), /self\.skipWaiting\(\)/);
});

test('first install stays quiet; a later version prompts once and Later dismisses only that version', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const gate = createUpdateGate(storage);

  assert.equal(gate.shouldAnnounce('2026.11.08.7', '2026.11.08.7'), false);
  assert.equal(gate.shouldAnnounce('2026.11.08.7', '2026.11.08.8'), true);
  gate.dismiss('2026.11.08.8');
  assert.equal(gate.shouldAnnounce('2026.11.08.7', '2026.11.08.8'), false);
  assert.equal(gate.shouldAnnounce('2026.11.08.7', '2026.11.08.9'), true);
});

test('a dismissed service-worker update stays dismissed until a different worker arrives', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const gate = createUpdateGate(storage);

  assert.equal(gate.shouldAnnounceWorker('deudalaya-shell-v13'), true);
  gate.dismissWorker('deudalaya-shell-v13');
  assert.equal(gate.shouldAnnounceWorker('deudalaya-shell-v13'), false);
  assert.equal(gate.shouldAnnounceWorker('deudalaya-shell-v14'), true);
});

test('Later dismissal of a deployed release also suppresses that release worker on the next load', () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const gate = createUpdateGate(storage);

  gate.dismiss('2026.11.08.8');
  assert.equal(gate.inheritReleaseDismissal('deudalaya-shell-v13', '2026.11.08.8', '2026.11.08.8'), true);
  assert.equal(gate.shouldAnnounceWorker('deudalaya-shell-v13'), false);
});
