const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const feed = html.slice(html.indexOf('const videos=['), html.indexOf('];', html.indexOf('const videos=[')));

test('the three newly supplied videos are separate playable feed posts', () => {
  const media = [
    'assets/deudalaya-video-2026-11-03-110712.mp4',
    'assets/deudalaya-video-2026-11-03-110720.mp4',
    'assets/deudalaya-video-2026-11-03-110721.mp4'
  ];
  for (const file of media) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} is included`);
    assert.ok(feed.includes(`videoSrc:'${file}'`), `${file} is in the starter feed`);
    assert.equal(feed.split(`videoSrc:'${file}'`).length - 1, 1, `${file} is listed exactly once`);
  }
});
