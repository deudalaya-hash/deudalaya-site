const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const removedAssets = [
  'deudalaya-video-2026-11-04-clip-08.mp4',
  'deudalaya-video-2026-11-04-clip-19.mp4',
  'deudalaya-video-2026-11-04-clip-15.mp4',
  'deudalaya-video-2026-11-04-clip-16.mp4',
  'deudalaya-video-2026-11-03-green-hills-deuda.mp4',
  'deudalaya-video-2026-11-04-clip-11.mp4',
  'deudalaya-video-2026-11-03-141222.mp4',
  'deudalaya-video-2026-11-04-clip-20.mp4',
  'deudalaya-video-2026-11-03-141359.mp4',
  'deudalaya-video-2026-11-04-clip-13.mp4',
  'deudalaya-video-2026-11-04-clip-09.mp4',
  'deudalaya-video-2026-11-04-clip-17.mp4',
  'deudalaya-video-2026-11-04-clip-10.mp4',
  'deudalaya-video-2026-11-04-clip-07.mp4',
  'deudalaya-video-2026-11-03-141448.mp4',
  'deudalaya-video-2026-11-04-clip-12.mp4',
  'deudalaya-video-2026-11-04-clip-18.mp4',
  'deudalaya-video-2026-11-03-mountain-village-deuda.mp4',
  'deudalaya-video-2026-11-04-clip-14.mp4'
];

test('oversized local videos are absent and no feed references are broken', () => {
  for (const name of removedAssets) {
    assert.equal(fs.existsSync(path.join(assets, name)), false, `${name} was removed from active assets`);
    assert.equal(html.includes(name), false, `${name} is not referenced in the feed`);
  }

  const localVideoSources = [...html.matchAll(/videoSrc:\s*['"](assets\/[^'"]+\.(?:mp4|webm|mov))['"]/gi)];
  for (const [, source] of localVideoSources) {
    assert.ok(fs.existsSync(path.join(root, source)), `${source} resolves to a local asset`);
  }
  const remainingVideos = fs.readdirSync(assets).filter(name => /\.(mp4|webm|mov)$/i.test(name));
  assert.equal(remainingVideos.length, 26, 'all 26 videos at or below 25 MB remain');
  for (const name of remainingVideos) {
    assert.ok(fs.statSync(path.join(assets, name)).size <= 25_000_000, `${name} is within the cap`);
  }
});
