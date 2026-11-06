const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('feed video advances after completion while manual vertical navigation remains available', () => {
  const feedVideo = html.match(/<video id="postVideo"[^>]*>/);
  assert.ok(feedVideo, 'feed video element is present');
  assert.doesNotMatch(feedVideo[0], /\bloop\b/, 'feed video must not repeat before other videos play');
  assert.match(html, /pv\.addEventListener\('ended',[\s\S]*?nextVideo\(\)/, 'a completed video advances to the next shuffled video');
  assert.match(html, /function nextVideo\(\)/, 'manual navigation remains available');
  assert.match(html, /function prevVideo\(\)/, 'manual navigation remains available');
});
