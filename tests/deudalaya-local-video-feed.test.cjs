const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('const videos=[');
const end = html.indexOf('let index=', start);
const feed = html.slice(start, end);

const publishedVideos = [
  {
    file: 'assets/deudalaya-video-2026-11-03-deuda-gathering.mp4',
    caption: 'परम्परागत पहिरनमा सुदूरपश्चिमी देउडा जमघट',
    description: 'परम्परागत पहिरनमा समुदायको सांस्कृतिक जमघट र देउडा गीत।'
  },
  {
    file: 'assets/deudalaya-video-2026-11-03-sudurpashchim-travel.mp4',
    caption: 'हिमाली बाटोमा गाईवस्तुको बथान',
    description: 'नेपालका पश्चिमी दृश्यसँग देउडाको धुन।'
  },
];

test('the remaining feed MP4s are bundled once with captions', () => {
  for (const item of publishedVideos) {
    const filePath = path.join(root, item.file);
    assert.ok(fs.existsSync(filePath), `${item.file} is bundled`);
    const bytes = fs.readFileSync(filePath);
    assert.equal(bytes.toString('ascii', 4, 8), 'ftyp', `${item.file} is an MP4`);
    const entry = `videoSrc:'${item.file}'`;
    assert.ok(feed.includes(entry), `${item.file} is in the existing feed`);
    assert.equal(feed.split(entry).length - 1, 1, `${item.file} appears only once`);
    assert.ok(feed.includes(item.caption), `title is included for ${item.file}`);
    assert.ok(feed.includes(item.description), `description is included for ${item.file}`);
  }
});

test('bundled videos use autoplay, shuffled cycling, sound, and profile rendering', () => {
  assert.match(html.match(/<video id="postVideo"[^>]*>/)[0], /\bloop\b/);
  assert.match(html, /postVideo\.muted\s*=\s*muted/);
  assert.match(html, /playbackShuffle\.next\(keys,currentKey\)/);
  assert.match(html, /list\.forEach\(function\(v,i\)/);
  assert.match(html, /if\(v\.videoSrc\)[\s\S]{0,260}createElement\('video'\)/);
});
