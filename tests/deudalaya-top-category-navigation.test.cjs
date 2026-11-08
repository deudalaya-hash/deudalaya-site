const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const categories = require('../feed-categories.js');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the feed has no top header or header search UI', () => {
  assert.doesNotMatch(html, /<header class="topbar"/);
  assert.doesNotMatch(html, /id="topAuthButton"|id="feedSearchPanel"|id="feedSearchInput"|id="search"/);
  assert.doesNotMatch(html, /function openFeedSearch\(|function submitFeedSearch\(|getElementById\('search'\)\.addEventListener/);
  assert.match(html, /id="postVideo"/);
  assert.match(html, /id="playPauseButton"/);
  assert.match(html, /id="uploadCategory"[\s\S]*?<option>कला तथा संस्कृति<\/option>/);
});

test('the video feed loads exactly the three core categories in their required order', () => {
  const tabs = html.match(/<nav class="feed-category-tabs"[^>]*>[\s\S]*?<\/nav>/);
  assert.ok(tabs, 'category tabs float inside the feed');
  assert.deepEqual(categories.ACTIVE_CATEGORIES, ['देउडा', 'गाउँघर', 'शहर']);
  assert.match(html, /<script src="feed-categories\.js\?/);
  assert.match(html, /\.feed-category-tabs\{[^}]*position:absolute[^}]*left:50%[^}]*transform:translateX\(-50%\)/);
  assert.match(html, /\.feed-category\.selected::after\{[^}]*background:#fff/);
});

test('the feed uses the first viewport row without a reserved header gap', () => {
  assert.match(html, /\.app\{[^}]*grid-template-rows:1fr/);
  assert.match(html, /\.nav\{grid-row:1/);
  assert.match(html, /\.main\{grid-row:1/);
  assert.match(html, /\.right\{grid-row:1/);
  assert.match(html, /@media\(max-width:700px\)\{body\{overflow:hidden\}\.app\{display:flex;flex-direction:column;height:100dvh/);
  assert.match(html, /\.video video,\.video img\{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center top!important/);
  assert.match(html, /class="mobile-nav"/);
});

test('mobile feed fills the dynamic viewport while controls clear the overlaid safe-area-aware navigation', () => {
  assert.match(html, /\.app\{[^}]*width:100vw!important[^}]*height:100dvh!important[^}]*padding-bottom:0!important/);
  assert.match(html, /\.main\{[^}]*flex:1[^}]*height:auto!important/);
  assert.match(html, /\.feed-wrap\{[^}]*width:100%!important[^}]*height:100%!important/);
  assert.match(html, /\.video-copy\{[^}]*bottom:calc\(56px \+ env\(safe-area-inset-bottom,0px\) \+ 24px\)!important/);
  assert.match(html, /\.actions\{[^}]*bottom:calc\(56px \+ env\(safe-area-inset-bottom,0px\) \+ 18px\)!important/);
  assert.match(html, /\.progress\{[^}]*bottom:calc\(56px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
  assert.match(html, /\.mobile-nav\{[^}]*position:fixed[^}]*bottom:0[^}]*height:calc\(56px \+ env\(safe-area-inset-bottom,0px\)\)/);
});
