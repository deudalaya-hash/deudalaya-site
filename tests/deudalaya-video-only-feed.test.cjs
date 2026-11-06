const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('const videos=[');
const end = html.indexOf('let index=', start);
const feed = html.slice(start, end);

test('the public starter feed contains only valid local MP4 and WebM video posts', () => {
  const sources = [...feed.matchAll(/videoSrc:'([^']+)'/g)].map(match => match[1]);
  assert.ok(sources.length > 0, 'the starter feed has video posts');
  assert.doesNotMatch(feed, /\bimage\s*:/, 'no image posts are in the starter data');
  for (const source of sources) {
    assert.match(source, /\.(mp4|webm)$/i, `${source} uses a supported video format`);
    const media = fs.readFileSync(path.join(root, source));
    assert.equal(media.toString('ascii', 4, 8), 'ftyp', `${source} is an MP4 file`);
  }
});

test('feed, random navigation, local restoration, and profile reject unsupported media', () => {
  assert.match(html, /function isSupportedFeedVideo\(/);
  assert.match(html, /isSupportedFeedVideo\(row\)/);
  assert.match(html, /isSupportedFeedVideo\(\{file:file/);
  assert.match(html, /list\.forEach\(function\(v,i\)[\s\S]{0,100}isSupportedFeedVideo\(v\)/);
  assert.doesNotMatch(html, /else\{var im=document\.createElement\('img'\)/);
});

test('feed playback and profile no longer render image-post fallbacks', () => {
  assert.doesNotMatch(html, /<img[^>]*id="postImage"/);
  assert.doesNotMatch(html, /post-image|scene-image|profile-post img/, 'feed and profile grids have no image media fallback styles');
  assert.doesNotMatch(html, /postImage\.src\s*=/);
  assert.doesNotMatch(html, /postImage\.hidden\s*=\s*false/);
  assert.doesNotMatch(html.match(/<video id="postVideo"[^>]*>/)[0], /\bloop\b/);
  assert.match(html, /postVideo\.muted\s*=\s*muted/);
});
