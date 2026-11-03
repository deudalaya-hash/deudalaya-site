const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root URL opens the Deudalaya install gate directly', () => {
  assert.match(html, /var gatewayLaunch=query\.get\('gateway'\)==='1';/);
  assert.match(html, /else if\(gatewayLaunch\)document\.documentElement\.classList\.add\('ecosystem-gateway'\)/);
  assert.match(html, /id="deudalayaInstallGate"/);
  assert.match(html, /href="\/\?gateway=1"/);
});
