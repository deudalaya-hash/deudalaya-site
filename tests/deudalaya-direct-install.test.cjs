const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root URL shows the single Deudalaya install entry page', () => {
  assert.match(html, /var gatewayLaunch=query\.get\('gateway'\)==='1';/);
  assert.match(html, /else if\(gatewayLaunch\|\|!standalone\)document\.documentElement\.classList\.add\('ecosystem-gateway'\)/);
  assert.match(html, /gateway-brand[\s\S]*?ONE CIRCLE[\s\S]*?ONE NEPAL/);
  assert.match(html, /gateway-intro h1|One community\. <em>Many stories\.<\/em>/);
  assert.match(html, /id="deudalayaInstallAction" type="button">Install App<\/button>/);
  assert.doesNotMatch(html, /deudalayaInstallGate|deudalayaOpenInstalled|ecosystem-install-exit|gateway-footnote|gateway-footer/);
  assert.match(html, /id="launchSplash"[\s\S]*?id="feed"/);
  assert.match(fs.readFileSync(path.resolve(__dirname, '..', 'manifest.webmanifest'), 'utf8'), /"start_url": "\/\?app=deudalaya"/);
});
