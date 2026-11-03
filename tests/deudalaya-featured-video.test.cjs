const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mediaPath = path.join(root, 'assets', 'deudalaya-featured-video.mp4');

test('the Deudalaya starter feed includes all supplied videos and profiles them as playable videos', () => {
  assert.doesNotMatch(html, /rel="preload" as="image" href="dashain\.webp"/);
  assert.match(html, /rel="preload" as="video" href="assets\/deudalaya-video-2026-11-03-feed-01\.mp4" type="video\/mp4"/);

  const start = html.indexOf('const videos=[');
  const end = html.indexOf('let index=', start);
  assert.notEqual(start, -1, 'feed data is present');
  assert.notEqual(end, -1, 'feed data has an end boundary');
  const seed = html.slice(start, end);
  assert.equal((seed.match(/handle:/g) || []).length, 15, 'all fifteen starter posts are videos');
  assert.match(seed, /videoSrc:'assets\/deudalaya-video-2026-11-03-feed-01\.mp4'/);
  assert.match(seed, /videoSrc:'assets\/deudalaya-video-2026-11-03-110721\.mp4'/);
  assert.match(seed, /videoSrc:'assets\/deudalaya-featured-video\.mp4'/);
  assert.match(seed, /videoSrc:'assets\/deudalaya-video-2026-11-03-103359\.mp4'/);
  assert.match(seed, /videoSrc:'assets\/deudalaya-video-2026-11-03-103349\.mp4'/);
  assert.doesNotMatch(seed, /\bimage:/, 'starter post is not an image post');

  const video = fs.readFileSync(mediaPath);
  assert.equal(video.toString('ascii', 4, 8), 'ftyp', 'bundled media is an MP4 container');
  assert.match(html, /var media='<video muted playsinline preload="none" data-profile-src="/);
  assert.match(html, /btn\.addEventListener\('click',function\(\)\{if\(long\)\{long=false;return\}openPost\(i\)\}\)/);
});
