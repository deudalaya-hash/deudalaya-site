const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('each fresh Deudalaya feed entry chooses a random video from the available posts', () => {
  assert.match(html, /function pickRandomFeedStart\(\)\{return videos\.length\?Math\.floor\(Math\.random\(\)\*videos\.length\):0\}/);
  assert.match(html, /let index=pickRandomFeedStart\(\)/);
  assert.match(html, /if\(saved\.length\)\{index=pickRandomFeedStart\(\);render\(\)\}/);
  assert.match(html, /\}index=pickRandomFeedStart\(\);render\(\)\}/);
});
