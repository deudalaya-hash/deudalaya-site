const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(__dirname, '..', 'social.js'), 'utf8');

test('profile post videos defer media requests until they approach the visible grid', () => {
  const profileScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  const profileCode = profileScripts.find(script => script.includes("var PIN_KEY='deudalaya-pinned'"));
  assert.ok(profileCode, 'TikTok profile renderer exists');
  assert.match(profileCode, /IntersectionObserver/);
  assert.match(profileCode, /preload=["\']none/);
  assert.match(profileCode, /data-profile-src/);
  assert.doesNotMatch(profileCode, /preload="metadata" src="'\+esc\(v\.videoSrc\)/);
  assert.match(social, /loading="lazy" decoding="async"/);
});

test('profile summary can render from the local profile cache without waiting for feed requests', () => {
  assert.match(html, /function readLocalProfile\(\)\{try\{return JSON\.parse\(localStorage\.getItem\('deudalaya-profile'/);
  const openProfileAt = html.indexOf('function openProfile()');
  const loadPostsAt = social.indexOf('loadSupabaseClient().then(async client =>');
  assert.ok(openProfileAt >= 0 && loadPostsAt >= 0, 'profile entry and asynchronous feed loader are present');
  assert.match(social, /applyFeedMode\(true\);\s*setInterval\([\s\S]*?loadSupabaseClient\(\)/);
  assert.doesNotMatch(social, /if\s*\(window\.deudalayaIsStandalone\(\)\)\s*\{[\s\S]*?loadSupabaseClient\(\)/);
});
