const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

test('the video feed does not create or display a post position counter', () => {
  assert.doesNotMatch(html, /tt-post-chip|postChip|updatePostChip|\(index\+1\)\s*\+\s*['"]\s*\/\s*['"]/);
});
