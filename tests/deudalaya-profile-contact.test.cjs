const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Deudalaya profile shows founder contact under the brand bio with a direct WhatsApp link', () => {
  const profile = indexHtml.match(/<section class="profile-panel" id="profilePanel">[\s\S]*?<\/section>/)?.[0];
  assert.ok(profile, 'profile panel exists');
  assert.match(profile, /id="profileBio">देउडालय — सुदूर • कर्णाली<\/p>/);
  assert.match(profile, /<strong>Bharat Thakuri <span>\/ Founder<\/span><\/strong>/);
  assert.match(profile, /href="https:\/\/wa\.me\/9779747704316"[^>]*aria-label="Message Bharat Thakuri on WhatsApp"/);
  assert.match(profile, /<span>9747704316<\/span>/);
  assert.doesNotMatch(profile, /href="tel:/i);
});

test('profile WhatsApp contact has responsive layout and visible keyboard focus styling', () => {
  assert.match(indexHtml, /#profilePanel \.profile-contact\{display:flex;flex-wrap:wrap/);
  assert.match(indexHtml, /#profilePanel \.profile-contact>a:focus-visible/);
});
