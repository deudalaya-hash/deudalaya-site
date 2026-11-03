const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('the first two supplied videos are separate playable feed and profile posts', () => {
  const start = html.indexOf('const videos=[');
  const end = html.indexOf('let index=', start);
  assert.notEqual(start, -1, 'feed data is present');
  assert.notEqual(end, -1, 'feed data has an end boundary');
  const feed = html.slice(start, end);
  const expectedMedia = [
    'assets/deudalaya-video-2026-11-03-103359.mp4',
    'assets/deudalaya-video-2026-11-03-103349.mp4'
  ];

  for (const media of expectedMedia) {
    assert.ok(feed.includes(`videoSrc:'${media}'`), `${media} is in the starter feed`);
    const video = fs.readFileSync(path.join(root, media));
    assert.equal(video.toString('ascii', 4, 8), 'ftyp', `${media} is an MP4 container`);
  }
  assert.equal((feed.match(/videoSrc:/g) || []).length, 6, 'all six starter posts are playable videos');
  assert.match(html, /if\(v\.videoSrc\)[\s\S]{0,180}createElement\('video'\)/, 'feed and profile render video entries as video elements');
  assert.match(html, /if\(!row\.media_type\|\|!row\.media_type\.startsWith\('video\/'\)\)continue;/, 'remote image posts are not added to the feed');
  assert.ok(html.includes("readLocalVideos()).filter(item=>{const file=item&&item.file;return !!file&&(String(file.type||'').toLowerCase().startsWith('video/')"), 'locally saved images are not restored into the feed');

  const releaseVersion = '2026.11.03.1';
  assert.match(html, new RegExp(`name="deudalaya-version" content="${releaseVersion}"`));
  assert.match(html, new RegExp(`const siteBuildVersion='${releaseVersion}'`));
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8')).version, releaseVersion);
});
