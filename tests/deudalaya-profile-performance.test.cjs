const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('profile post videos defer media requests until they approach the visible grid', () => {
  const profileScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const profileCode = profileScripts.find(script => script.includes("var PIN_KEY='deudalaya-pinned'"));
  assert.ok(profileCode, 'TikTok profile renderer exists');
  assert.match(profileCode, /IntersectionObserver/);
  assert.match(profileCode, /preload=["\']none/);
  assert.match(profileCode, /data-profile-src/);
  assert.doesNotMatch(profileCode, /preload="metadata" src="'\+esc\(v\.videoSrc\)/);
  assert.match(profileCode, /loading=["\']lazy/);
  assert.match(profileCode, /decoding=["\']async/);
});

test('profile summary can render from the local profile cache without waiting for feed requests', () => {
  assert.match(html, /function readLocalProfile\(\)\{try\{return JSON\.parse\(localStorage\.getItem\('deudalaya-profile'/);
  const openProfileAt = html.indexOf('function openProfile()');
  const loadPostsAt = html.indexOf('loadSupabaseClient().then(client=>client&&loadRemotePosts())');
  assert.ok(openProfileAt >= 0 && loadPostsAt > openProfileAt, 'profile entry is defined before asynchronous feed loading begins');
});
