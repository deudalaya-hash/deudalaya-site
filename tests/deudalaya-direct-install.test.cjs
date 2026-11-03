const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root URL opens the Deudalaya-only gateway with its Install App card', () => {
  assert.match(html, /var appLaunch=query\.get\('app'\)==='deudalaya';/);
  assert.match(html, /var gatewayLaunch=query\.get\('gateway'\)==='1';/);
  assert.match(html, /else if\(gatewayLaunch\|\|!appLaunch\)document\.documentElement\.classList\.add\('ecosystem-gateway'\)/);
  assert.match(html, /data-app="deudalaya"[\s\S]*?Install App/);
  assert.match(fs.readFileSync(path.resolve(__dirname, '..', 'ecosystem-gateway.css'), 'utf8'), /gateway-card:not\(\[data-app="deudalaya"\]\)\{display:none\}/);
  assert.match(html, /id="deudalayaInstallGate"/);
  assert.match(html, /href="\/\?gateway=1"/);
});
