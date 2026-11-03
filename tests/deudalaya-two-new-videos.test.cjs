const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('const videos=[');
const end = html.indexOf('let index=', start);
const feed = html.slice(start, end);

const expected = [
  {
    source: 'assets/deudalaya-video-2026-11-03-141448.mp4',
    title: 'देउडा साँझ १०: खुला मैदानमा देउडा नाच'
  },
  {
    source: 'assets/deudalaya-video-2026-11-03-bajhang-deuda.mp4',
    title: 'बझाङको पहाडी आँगनमा देउडा भाका'
  }
];

test('the two latest supplied MP4s are bundled once with unique content-based titles', () => {
  for (const item of expected) {
    const file = path.join(root, item.source);
    assert.ok(fs.existsSync(file), `${item.source} is bundled in the site`);
    assert.equal(fs.readFileSync(file).toString('ascii', 4, 8), 'ftyp', `${item.source} is a valid MP4`);
    assert.equal(feed.split(`videoSrc:'${item.source}'`).length - 1, 1, `${item.source} appears exactly once in the feed`);
    const post = feed.split('\n').find(line => line.includes(`videoSrc:'${item.source}'`));
    const caption = post?.match(/caption:'([^']+)'/);
    assert.equal(caption?.[1], item.title, `${item.source} has its reviewed title`);
  }
  assert.notEqual(expected[0].title, expected[1].title, 'titles are distinct');
});

test('the new posts retain the existing video feed and profile behaviors', () => {
  assert.match(html, /postVideo\.muted\s*=\s*muted/);
  assert.match(html, /<video id="postVideo"[^>]*\bloop\b/);
  assert.match(html, /function openProfile\(/);
  assert.match(html, /profile-post-title/);
  assert.match(html, /isSupportedFeedVideo\(v\)/);
});
