const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('feed video loops the same clip while manual vertical navigation remains available', () => {
  const feedVideo = html.match(/<video id="postVideo"[^>]*>/);
  assert.ok(feedVideo, 'feed video element is present');
  assert.match(feedVideo[0], /\bloop\b/, 'the active video loops natively without fetching another source');
  assert.doesNotMatch(html, /pv\.addEventListener\('ended',[\s\S]*?nextVideo\(\)/, 'completion never navigates to another post');
  assert.match(html, /videoEl\.addEventListener\('timeupdate'[\s\S]*?setProgress\(videoEl\.currentTime\/videoEl\.duration\)/, 'the progress indicator follows the loop back to zero');
  assert.match(html, /function nextVideo\(\)/, 'manual navigation remains available');
  assert.match(html, /function prevVideo\(\)/, 'manual navigation remains available');
  assert.match(html, /feed\.addEventListener\('touchend'/, 'manual swipes remain available');
});
