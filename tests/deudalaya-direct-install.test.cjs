const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the root URL shows Deudalaya installation first and offers a website continuation', () => {
  assert.match(html, /var gatewayLaunch=query\.get\('gateway'\)==='1';/);
  assert.match(html, /else if\(gatewayLaunch\)document\.documentElement\.classList\.add\('ecosystem-gateway'\)/);
  assert.match(html, /id="deudalayaInstallGate"[\s\S]*?deudalaya\.com[\s\S]*?Install App/);
  assert.match(html, /href="\/\?app=deudalaya&amp;continue=1"[^>]*>Continue to Website/);
  assert.match(html, /id="deudalayaInstallGate"/);
  assert.match(html, /href="\/\?gateway=1"/);
  const installScript = fs.readFileSync(path.resolve(__dirname, '..', 'deudalaya-install-gate.js'), 'utf8');
  assert.match(installScript, /query\.get\('continue'\)\s*===\s*'1'/);
  assert.match(installScript, /promptEvent\.prompt\(\)/);
  assert.match(installScript, /isStandalone\(\)/);
});
