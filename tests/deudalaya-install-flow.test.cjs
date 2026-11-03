const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('the legacy feed URL redirects before its retired install code can run', () => {
  const html = fs.readFileSync(path.join(root, 'index_fixed.html'), 'utf8');
  assert.match(html, /name="robots" content="noindex,nofollow"/);
  assert.match(html, /http-equiv="refresh" content="0;url=\/"/);
  assert.match(html, /location\.replace\('\/'\)/);
  assert.doesNotMatch(html, /<link rel="stylesheet" href="install-gate\.css/);
  assert.ok(html.indexOf("window.location.replace('/')") < html.indexOf('beforeinstallprompt'));
});
