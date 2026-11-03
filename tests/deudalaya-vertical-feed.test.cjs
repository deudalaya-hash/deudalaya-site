const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('manual next and previous feed navigation animate in the swipe direction', () => {
  assert.match(html, /function animateFeed\(direction\)/);
  assert.match(html, /function nextVideo\(\)\{[\s\S]*?animateFeed\('up'\)/);
  assert.match(html, /function prevVideo\(\)\{[\s\S]*?animateFeed\('down'\)/);
  assert.match(html, /#feed\.feed-swipe-up #video/);
  assert.match(html, /#feed\.feed-swipe-down #video/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});

test('feed navigation preserves the active video sound preference and existing swipe controls', () => {
  assert.match(html, /postVideo\.muted=muted/);
  assert.match(html, /feed\.addEventListener\('touchend'/);
  assert.match(html, /feed\.addEventListener\('wheel'/);
  assert.match(html, /fypPickNext\(index\)/);
});
