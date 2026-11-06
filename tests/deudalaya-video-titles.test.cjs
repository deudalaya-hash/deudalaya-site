const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('const videos=[');
const end = html.indexOf('let index=', start);
const feed = html.slice(start, end);
const entries = [...feed.matchAll(/videoSrc:'([^']+)'[^\n]*?caption:'([^']+)'/g)]
  .map(([, source, caption]) => ({ source, caption, title: caption.split(' — ')[0] }));

const expectedTitles = new Map([
  ['assets/deudalaya-video-2026-11-03-feed-01.mp4', 'A Friendly Reunion at a Community Event'],
  ['assets/deudalaya-video-2026-11-03-feed-02.mp4', 'रातो पहिरनमा देउडा गीतको प्रस्तुति'],
  ['assets/deudalaya-video-2026-11-03-feed-03.mp4', 'देउडा भाकामा रमाउँदै महिला समूह'],
  ['assets/deudalaya-video-2026-11-03-110721.mp4', 'माइकमा देउडा भाका, पछाडि समुदायको साथ'],
  ['assets/deudalaya-video-2026-11-03-110720.mp4', 'हरियाली पहाडको काखमा एक पल'],
  ['assets/deudalaya-video-2026-11-03-110712.mp4', 'परम्परागत पहिरन र गहनाको झलक'],
  ['assets/deudalaya-video-2026-11-03-103359.mp4', 'पहाडी भेषभूषामा देउडा समुदायको जमघट'],
  ['assets/deudalaya-video-2026-11-03-103349.mp4', 'देउडा गीतसँगै समुदायको उल्लासमय पदयात्रा'],
  ['assets/deudalaya-featured-video.mp4', 'देउडा जमघटतर्फ अघि बढ्दै समुदाय'],
  ['assets/deudalaya-video-2026-11-03-deuda-gathering.mp4', 'परम्परागत पहिरनमा सुदूरपश्चिमी देउडा जमघट'],
  ['assets/deudalaya-video-2026-11-03-sudurpashchim-travel.mp4', 'हिमाली बाटोमा गाईवस्तुको बथान'],
  ['assets/deudalaya-video-2026-11-03-bajhang-deuda.mp4', 'बझाङको पहाडी आँगनमा देउडा भाका'],
  ['assets/deudalaya-video-2026-11-03-shankhmul.mp4', 'देउडालय, शङ्खमूल।'],
  ['assets/deudalaya-video-2026-11-04-clip-01.mp4', 'पश्चिम धनगढीको नेपाली देउडा भाका'],
  ['assets/deudalaya-video-2026-11-04-clip-02.mp4', 'नेपालगञ्जमा “छोटी” देउडा लिपसिङ'],
  ['assets/deudalaya-video-2026-11-04-clip-03.mp4', 'देउडालयको सांस्कृतिक झलक'],
  ['assets/deudalaya-video-2026-11-04-clip-04.mp4', 'चैनपुरको देउडा भाकामा आमाप्रतिको माया'],
  ['assets/deudalaya-video-2026-11-04-clip-05.mp4', 'टुँडिखेलमा देउडा गीतको रौनक'],
  ['assets/deudalaya-video-2026-11-04-clip-06.mp4', 'बझाङको गाउँघरमा देउडा'],
]);

test('each bundled video has its own content-based title', () => {
  assert.equal(entries.length, expectedTitles.size, 'the complete local feed has a title for every video asset');
  assert.equal(new Set(entries.map(entry => entry.source)).size, entries.length, 'feed video sources remain unique');
  assert.equal(new Set(entries.map(entry => entry.title)).size, entries.length, 'video titles remain unique');
  for (const [source, title] of expectedTitles) {
    const entry = entries.find(item => item.source === source);
    assert.ok(entry, `${source} remains in the feed`);
    assert.equal(entry.title, title, `${source} has its reviewed title`);
    assert.doesNotMatch(entry.title, /shared video|new video|नयाँ देउडा भिडियो|साझा गरिएको अर्को भिडियो/i);
  }
});

test('reviewed captions preserve their existing descriptive text after the title', () => {
  for (const description of [
    'परम्परागत पहिरनमा समुदायको सांस्कृतिक जमघट र देउडा गीत।',
    'नेपालका पश्चिमी दृश्यसँग देउडाको धुन।'
  ]) assert.ok(feed.includes(description), `existing caption description is preserved: ${description}`);
});

test('video titles are shown in feed captions and on profile thumbnails', () => {
  assert.match(html, /document\.getElementById\('caption'\)\.innerHTML=/);
  assert.match(html, /className='profile-post-title'/);
  assert.match(html, /title\.textContent=\(v\.caption\|\|'Post'\)\.split\(' — '\)\[0\]/);
});
