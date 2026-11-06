const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Deudalaya exposes no video download action or download link', () => {
  assert.doesNotMatch(html, /id="ttDownload"|downloadCurrent\s*\(|\.download\s*=/i);
});

test('all Deudalaya video elements discourage native downloads and block video context menus', () => {
  assert.match(html, /<video id="postVideo"[^>]*controlsList="nodownload"/);
  assert.match(html, /<video id="uploadPreview"[^>]*controlsList="nodownload"/);
  assert.match(html, /<video muted playsinline preload="none" controlsList="nodownload" src=/);
  assert.match(html, /<video muted playsinline preload="none" data-profile-src="[^\"]+" controlsList="nodownload"/);
  assert.match(html, /addEventListener\('contextmenu',\s*function\(event\)\{if\(event\.target&&event\.target\.tagName==='VIDEO'\)event\.preventDefault\(\)\}\)/);
});

test('the feed does not preload a random video before choosing the active post', () => {
  assert.doesNotMatch(html, /<link[^>]*as="video"/i);
  assert.match(html, /<video id="postVideo"[^>]*preload="none"/);
});
