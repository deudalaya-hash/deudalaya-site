const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const feed = html.slice(html.indexOf('const videos=['), html.indexOf('let index='));
const source = 'assets/deudalaya-video-2026-11-03-shankhmul.mp4';

test('the Shankhmul video is bundled once with the requested title', () => {
  const file = path.join(root, source);
  assert.ok(fs.existsSync(file), 'the supplied MP4 is included in site assets');
  assert.equal(fs.readFileSync(file).toString('ascii', 4, 8), 'ftyp', 'the supplied asset is an MP4');
  assert.equal(feed.split(`videoSrc:'${source}'`).length - 1, 1, 'the clip appears once in the feed');
  const post = feed.split('\n').find(line => line.includes(`videoSrc:'${source}'`));
  assert.equal(post?.match(/caption:'([^']+)'/)?.[1], 'देउडालय, शङ्खमूल।');
});
