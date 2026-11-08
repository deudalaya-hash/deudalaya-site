const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(root, 'social.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('the feed loads the small shuffle helper before the feed-ranking hooks', () => {
  const helper = html.indexOf('src="video-shuffle.js"');
  const hooks = html.indexOf('window.fypPickNext=fypPickNext');
  assert.ok(helper >= 0, 'the playback-cycle helper is loaded');
  assert.ok(hooks > helper, 'the helper exists before the feed installs its next/previous hooks');
  assert.match(worker, /\/video-shuffle\.js/);
});

test('feed navigation uses the no-repeat shuffle cycle instead of recommendation ranking', () => {
  assert.match(html, /function fypPickNext\(from\)\{[\s\S]*?playbackShuffle\.next\(keys,currentKey\)/);
  assert.match(html, /function fypPickPrev\(from\)\{[\s\S]*?playbackShuffle\.previous\(feedKeys\(\)\)/);
  assert.match(html, /function fypMarkVideoStarted\(i\)[\s\S]*?playbackShuffle\.markStarted/);
  assert.match(html, /if\(pv\.currentTime<threshold\)return;[\s\S]*?fypMarkVideoStarted\(index\)/);
});

test('the current video loops without advancing and playback avoids preloading the next video', () => {
  assert.match(html, /<video id="postVideo"[^>]*preload="none"/);
  assert.match(html, /<video id="postVideo"[^>]*\bloop\b/);
  assert.match(html, /if\(!paused\)postVideo\.play\(\)/);
  assert.doesNotMatch(html, /pv\.addEventListener\('ended',[\s\S]*?nextVideo\(\)/);
  assert.doesNotMatch(html, /preloadNextMetadata|metadataPreloader/);
  assert.match(html, /function nextVideo\(\)[\s\S]*?render\(\)/);
});

test('the feed progress indicator follows media time without a permanent 100 ms timer', () => {
  assert.match(html, /feedVideo\.addEventListener\('timeupdate',[\s\S]*?feedVideo\.currentTime\/feedVideo\.duration/);
  assert.doesNotMatch(html, /setInterval\(\(\)=>\{if\(!paused\)\{prog=/);
});

test('shared feed posts duplicating the bundled cultural clip are excluded from the visible feed list', () => {
  assert.match(social, /DeudalayaVideoShuffle\.isDuplicatePost\(post,\s*\[\.\.\.localPosts,\s*\.\.\.newSharedPosts\]\)/);
  assert.match(html, /deudalaya-video-2026-11-04-clip-03\.mp4/);
  assert.match(html, /देउडालयको सांस्कृतिक झलक — नयाँ प्रस्तुति/);
});
