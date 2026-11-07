const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(root, 'social.js'), 'utf8');

test('remote feed accepts only supported video posts before rendering', () => {
  assert.match(social, /\(data \|\| \[\]\)\.filter\(row => isSupportedFeedVideo\(row\) && row\.media_path\)/);
  assert.match(social, /for\s*\(const row of \[\.\.\.videoRows\]\.reverse\(\)\)/);
  assert.doesNotMatch(social, /image:\s*isVideo\s*\?\s*''\s*:\s*url/);
});

test('a stale remote feed response cannot replace a newer request', () => {
  assert.match(social, /let remoteFeedRequestId\s*=\s*0/);
  assert.match(social, /const requestId\s*=\s*\+\+remoteFeedRequestId/);
  assert.match(social, /requestId\s*!==\s*remoteFeedRequestId/);
});

test('a remote refresh does not mistake already visible remote posts for duplicates', () => {
  assert.match(social, /const localPosts\s*=\s*videos\.filter\(post => !post\.cloudPost && isSupportedFeedVideo\(post\)\)/);
  assert.match(social, /isDuplicatePost\(post,\s*\[\.\.\.localPosts,\s*\.\.\.newSharedPosts\]\)/);
});

test('failed active media exposes a retryable error instead of a blank video surface', () => {
  assert.match(html, /id="feedMediaStatus"[^>]*role="status"/);
  assert.match(html, /feedVideo\.addEventListener\('error'/);
  assert.match(html, /feedMediaStatus\.hidden\s*=\s*false/);
  assert.match(html, /function retryCurrentVideo\(/);
});
