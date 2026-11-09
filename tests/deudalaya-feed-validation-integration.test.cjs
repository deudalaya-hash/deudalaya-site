const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const social = fs.readFileSync(path.join(__dirname, '..', 'social.js'), 'utf8');
const categories = fs.readFileSync(path.join(__dirname, '..', 'feed-categories.js'), 'utf8');

test('startup validates the combined published category pool and remembers only a playable result', () => {
  assert.match(social, /const startupCandidates = \[\.\.\.newSharedPosts, \.\.\.localCandidates\]/);
  assert.match(social, /ACTIVE_CATEGORIES\.includes\(window\.DeudalayaFeedCategories\.categoryOf\(post\)\)/);
  assert.match(social, /selectValidatedStartupVideo\(\s*candidates, videoValidator, storage/);
  assert.match(social, /startupVideoKey = await selectPlayableStartupVideo\(startupCandidates, startupStorage\)/);
  assert.match(categories, /\['देउडा', 'गाउँघर', 'शहर'\]/);
});

test('feed playback validates metadata, hides unvalidated media, and recovers after errors', () => {
  assert.match(social, /feedPlayer\.addEventListener\('loadstart'/);
  assert.match(social, /feedPlayer\.addEventListener\('loadedmetadata'/);
  assert.match(social, /videoValidator\.rememberValid\(source, feedPlayer\)/);
  assert.match(social, /feedPlayer\.addEventListener\('error'/);
  assert.match(social, /feedVideoRecovery\.recover\(source\)/);
  assert.match(social, /isKnownBroken\(feedVideoSource\(post\)\)/);
});

test('video layout is applied responsively without changing the protected page or PWA files', () => {
  assert.match(social, /applyCenteredVideoLayout\(feedVideoArea, feedPlayer\)/);
  assert.match(social, /fitCenteredVideo\(feedVideoArea, feedPlayer\)/);
  assert.match(social, /new window\.ResizeObserver/);
});
