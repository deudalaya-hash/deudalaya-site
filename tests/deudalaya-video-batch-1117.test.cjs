const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('const videos=[');
const end = html.indexOf('let index=', start);
const feed = html.slice(start, end);

test('the three newly supplied videos are bundled as separate playable feed posts', () => {
  const media = [
    'assets/deudalaya-video-2026-11-03-feed-01.mp4',
    'assets/deudalaya-video-2026-11-03-feed-02.mp4',
    'assets/deudalaya-video-2026-11-03-feed-03.mp4'
  ];
  for (const file of media) {
    const filePath = path.join(root, file);
    assert.ok(fs.existsSync(filePath), `${file} is bundled`);
    assert.equal(feed.split(`videoSrc:'${file}'`).length - 1, 1, `${file} appears once in the feed`);
    assert.equal(fs.readFileSync(filePath).toString('ascii', 4, 8), 'ftyp', `${file} is an MP4 container`);
  }
  assert.ok(feed.indexOf(`videoSrc:'${media[0]}'`) < feed.indexOf(`videoSrc:'${media[1]}'`));
  assert.ok(feed.indexOf(`videoSrc:'${media[1]}'`) < feed.indexOf(`videoSrc:'${media[2]}'`));
});
