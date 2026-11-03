const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const mediaPath = path.join(root, 'assets', 'deudalaya-featured-video.mp4');

test('the Deudalaya starter feed contains only the supplied video and profiles it as a playable video', () => {
  assert.doesNotMatch(html, /rel="preload" as="image" href="dashain\.webp"/);
  assert.match(html, /rel="preload" as="video" href="assets\/deudalaya-featured-video\.mp4" type="video\/mp4"/);

  const start = html.indexOf('const videos=[');
  const end = html.indexOf('let index=', start);
  assert.notEqual(start, -1, 'feed data is present');
  assert.notEqual(end, -1, 'feed data has an end boundary');
  const seed = html.slice(start, end);
  assert.equal((seed.match(/handle:/g) || []).length, 1, 'only one starter post is present');
  assert.match(seed, /videoSrc:'assets\/deudalaya-featured-video\.mp4'/);
  assert.doesNotMatch(seed, /\bimage:/, 'starter post is not an image post');

  const video = fs.readFileSync(mediaPath);
  assert.equal(video.toString('ascii', 4, 8), 'ftyp', 'bundled media is an MP4 container');
  assert.match(html, /var media=v\.videoSrc\?'<video muted playsinline preload="metadata" src="/);
  assert.match(html, /btn\.addEventListener\('click',function\(\)\{if\(long\)\{long=false;return\}openPost\(i\)\}\)/);
});
