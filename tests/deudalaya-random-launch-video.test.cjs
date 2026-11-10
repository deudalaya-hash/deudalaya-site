const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(__dirname, '..', 'social.js'), 'utf8');
const fyp = html.match(/<script src="video-shuffle\.js"><\/script>\s*<script>([\s\S]*?)<\/script>/)?.[1] || '';

test('the FYP cycle waits for one validated startup choice instead of choosing during initialization', () => {
  assert.ok(fyp, 'find the FYP initialization script');
  assert.match(fyp, /window\.deudalayaSharedStartupKey=sharedFeedKey;\s*var initialFeedKey=null;/);
  assert.doesNotMatch(fyp, /playbackShuffle\.start\(feedKeys\(\),sharedFeedKey\)/);
  assert.match(fyp, /window\.fypStartAt=function\(key\)/);
  assert.match(fyp, /function fypSelectCurrent\(i\)[\s\S]*?playbackShuffle\.getState\(\)/);
  assert.doesNotMatch(fyp, /function fypSelectCurrent\(i\)[\s\S]*?playbackShuffle\.current\(keys\)/);
  assert.doesNotMatch(html, /pickRandomFeedStart/);
  assert.match(fyp, /playbackShuffle\.getState\(\)\.cursor<0\)return videos\.length\?/);
});

test('startup validation runs once and has a validated local fallback when Supabase is unavailable', () => {
  assert.ok(social.includes('window.DeudalayaVideoShuffle?.createStartupSelection?.()'));
  assert.ok(social.includes('async function selectLocalStartupVideo()'));
  assert.ok(social.includes('if (!client) { await selectLocalStartupVideo(); return; }'));
  assert.ok(social.includes('startupVideoKey = await chooseStartupVideo(startupCandidates)'));
  assert.ok(social.includes('if (startupVideoKey && typeof window.fypStartAt === \'function\') window.fypStartAt(startupVideoKey)'));
});

test('startup selection waits until the mandatory installation gate releases the feed', () => {
  assert.match(social, /function waitForInstallationAccess\(\)/);
  assert.match(social, /async function chooseStartupVideo\(candidates\)[\s\S]*?await waitForInstallationAccess\(\)/);
  assert.match(social, /deudalaya-install-required/);
  assert.match(social, /deudalaya-installstatechange/);
});

test('the startup selection uses the shuffle helper and the ordinary feed cycle', () => {
  assert.match(html, /DeudalayaVideoShuffle\.createShuffleCycle/);
  assert.match(fyp, /window\.fypStartAt=function\(key\)[\s\S]*?playbackShuffle\.start\(keys,key\)/);
  assert.match(fyp, /function fypSelectCurrent\(i\)[\s\S]*?playbackShuffle\.getState\(\)/);
  assert.match(html, /sessionStorage/);
  assert.ok(social.includes("startupSelection.select(\n      candidates, videoValidator, startupStorage(), Math.random, 'deudalaya-last-startup-video-v1'"));
  assert.match(social, /const startupCandidates = \[\.\.\.newSharedPosts, \.\.\.localCandidates\]/);
  assert.match(social, /activeFeedCategory = startupCategory/);
  assert.match(social, /applyFeedMode\(true, startupVideoKey\)/);
  assert.match(social, /if \(!startupSelectionDone &&/);
});
