const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(__dirname, '..', 'social.js'), 'utf8');

test('the startup selection uses the shuffle helper and the ordinary feed cycle', () => {
  assert.match(html, /DeudalayaVideoShuffle\.createShuffleCycle/);
  assert.match(html, /playbackShuffle\.start\(feedKeys\(\)/);
  assert.match(html, /function fypSelectCurrent\(i\)[\s\S]*?playbackShuffle\.current\(keys\)/);
  assert.match(html, /sessionStorage/);
  assert.match(social, /selectPlayableStartupVideo\(startupCandidates, startupStorage\)/);
  assert.match(social, /selectValidatedStartupVideo\([\s\S]*?deudalaya-last-published-startup-video-v1/);
  assert.match(social, /const startupCandidates = \[\.\.\.newSharedPosts, \.\.\.localCandidates\]/);
  assert.match(social, /activeFeedCategory = startupCategory/);
  assert.match(social, /applyFeedMode\(true, startupVideoKey\)/);
  assert.match(social, /if \(!startupSelectionDone &&/);
});
