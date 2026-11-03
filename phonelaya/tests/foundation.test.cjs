const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const contacts = require('../contacts.js');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('phoneलय has its own install identity and assets under /phonelaya/', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'phoneलय');
  assert.equal(manifest.short_name, 'फोनलय');
  assert.equal(manifest.id, '/phonelaya/');
  assert.equal(manifest.start_url, '/phonelaya/');
  assert.equal(manifest.scope, '/phonelaya/');
  for (const icon of manifest.icons) {
    const file = fs.readFileSync(path.join(root, icon.src));
    const size = Number.parseInt(icon.sizes, 10);
    assert.equal(file.readUInt32BE(16), size);
    assert.equal(file.readUInt32BE(20), size);
  }
});

test('phoneलय owns its navigation, styles, scripts, and scoped worker', () => {
  const html = read('index.html');
  const script = read('app.js');
  const worker = read('sw.js');
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /styles\.css/);
  assert.match(html, /contacts\.js/);
  assert.match(html, /app\.js/);
  assert.match(script, /register\(['"]\/phonelaya\/sw\.js['"],\s*\{\s*scope:\s*['"]\/phonelaya\/['"]/);
  assert.match(worker, /phonelaya-shell-v1/);
  assert.match(worker, /startsWith\(['"]phonelaya-/);
  assert.doesNotMatch(worker, /unregister\s*\(/);
  assert.match(html, /href="\/?\?gateway=1|href="\/\?gateway=1/);
});

test('contact CSV parsing handles quoted commas and maps common headers', () => {
  const parsed = contacts.parseCSV('Name,Phone,Email\n"Maya, Karki",+977-980-111-2222,maya@example.test');
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].name, 'Maya, Karki');
  assert.equal(parsed[0].phone, '+977-980-111-2222');
  assert.equal(parsed[0].email, 'maya@example.test');
});

test('vCard parsing supports multiple cards and folded lines', () => {
  const source = 'BEGIN:VCARD\nVERSION:3.0\nFN:Mina Sha\n hi\nTEL;TYPE=CELL:+977 981 222 3333\nEMAIL:mina@example.test\nEND:VCARD\nBEGIN:VCARD\nVERSION:3.0\nN:Khadka;Raju;;;\nTEL:9844445555\nEND:VCARD';
  const parsed = contacts.parseVCF(source);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].name, 'Mina Shahi');
  assert.equal(parsed[0].phone, '+977 981 222 3333');
  assert.equal(parsed[1].name, 'Raju Khadka');
});

test('duplicate detection compares normalized phone numbers without losing source contacts', () => {
  const source = [
    { name: 'Sita', phone: '+977 980-111-2222' },
    { name: 'Sita Rai', phone: '9779801112222' },
    { name: 'Bikash', phone: '9810000000' }
  ];
  assert.equal(contacts.findDuplicates(source).length, 1);
  assert.equal(source.length, 3);
});

test('VCF export escapes contact data and produces an importable vCard file', () => {
  const result = contacts.toVCF([{ name: 'Maya, Karki', phone: '+977 980 111 2222', email: 'maya@example.test' }]);
  assert.match(result, /BEGIN:VCARD/);
  assert.match(result, /FN:Maya\\, Karki/);
  assert.match(result, /TEL;TYPE=CELL:\+977 980 111 2222/);
  assert.match(result, /END:VCARD/);
});

test('phoneलय presents clearly labelled local-only demo flows without network storage', () => {
  const html = read('index.html');
  const script = read('app.js');
  assert.match(html, /Sample contacts in this tab/);
  assert.match(html, /cloud backup, accounts and encryption are not connected/i);
  assert.match(html, /id="contactFile"/);
  assert.match(html, /id="backupAction"/);
  assert.match(html, /id="restoreAction"/);
  assert.match(html, /id="contactSearch"/);
  assert.match(html, /id="downloadVcf"/);
  assert.match(html, /data-view="account"/);
  assert.doesNotMatch(script, /\bfetch\s*\(|XMLHttpRequest|localStorage|indexedDB|sessionStorage|supabase/i);
});

test('the root gateway keeps phoneलय available in source while presenting Deudalaya alone', () => {
  const gateway = read('../index.html');
  const gatewayJs = read('../ecosystem-gateway.js');
  const gatewayCss = read('../ecosystem-gateway.css');
  assert.match(gateway, /data-app="phonelaya"/);
  assert.match(gateway, /href="\/phonelaya\/"/);
  assert.match(gateway, /phoneलय/);
  assert.match(gateway, /CONTACT BACKUP · RECOVERY/);
  assert.match(gatewayCss, /gateway-card:not\(\[data-app="deudalaya"\]\)\{display:none\}/);
  assert.match(gatewayJs, /phonelaya/);
  assert.match(gatewayCss, /gateway-phone/);
});
