const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('a fresh or resumed feed entry starts from the shuffled session cycle', () => {
  assert.match(html, /DeudalayaVideoShuffle\.createShuffleCycle/);
  assert.match(html, /playbackShuffle\.start\(feedKeys\(\)/);
  assert.match(html, /function fypSelectCurrent\(i\)[\s\S]*?playbackShuffle\.current\(keys\)/);
  assert.match(html, /sessionStorage/);
});
