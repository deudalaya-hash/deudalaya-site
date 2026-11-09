const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('door splash is removed while the installation gate remains', () => {
  assert.doesNotMatch(html, /launchSplash|launch-splash|door-splash|entry-door-panel|entry-door-knocker/);
  assert.match(html, /id="ecosystemGateway"/);
  assert.match(html, /id="deudalayaInstallAction"/);
});
