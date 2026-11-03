const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('feed video loops and never advances automatically', () => {
  const feedVideo = html.match(/<video id="postVideo"[^>]*>/);
  assert.ok(feedVideo, 'feed video element is present');
  assert.match(feedVideo[0], /\bloop\b/, 'feed video repeats from the beginning');
  assert.doesNotMatch(html, /scheduleAutoAdvance|autoAdvanceTimer/, 'no timed feed-advance path remains');
  assert.match(html, /function nextVideo\(\)/, 'manual navigation remains available');
  assert.match(html, /function prevVideo\(\)/, 'manual navigation remains available');
});
