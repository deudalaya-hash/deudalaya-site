const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('manual next and previous feed navigation animate in the swipe direction', () => {
  assert.match(html, /function animateFeed\(direction\)/);
  assert.match(html, /function nextVideo\(\)\{[\s\S]*?animateFeed\('up'\)/);
  assert.match(html, /function prevVideo\(\)\{[\s\S]*?animateFeed\('down'\)/);
  assert.match(html, /#feed\.feed-swipe-up\{animation:/);
  assert.match(html, /#feed\.feed-swipe-down\{animation:/);
  assert.doesNotMatch(html, /#feed\.feed-swipe-up #video\{animation:/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});

test('feed navigation preserves the active video sound preference and existing swipe controls', () => {
  assert.match(html, /postVideo\.muted=muted/);
  assert.match(html, /feed\.addEventListener\('touchend'/);
  assert.match(html, /feed\.addEventListener\('wheel'/);
  assert.match(html, /fypPickNext\(index\)/);
});

test('mobile feed fills the dynamic viewport while keeping complete media frames visible', () => {
  assert.match(html, /name="viewport" content="[^"]*viewport-fit=cover/);
  assert.match(html, /\.video\{inset:0!important/);
  assert.match(html, /\.video video,\.video img\{width:100%!important;height:100%!important;object-fit:contain!important;object-position:center top!important/);
  assert.match(html, /padding-bottom:0!important/);
  assert.match(html, /\.main\{[^}]*flex:1 1 auto!important[^}]*height:auto!important/);
  assert.match(html, /\.feed-wrap\{[^}]*height:100%!important/);
  assert.match(html, /height:calc\(56px \+ env\(safe-area-inset-bottom,0px\)\)!important/);
  assert.match(html, /bottom:calc\(56px \+ env\(safe-area-inset-bottom,0px\)\)!important;height:20px!important/);
  assert.doesNotMatch(html, /\.video (?:video|img)\{[^}]*object-fit:cover/);
});
