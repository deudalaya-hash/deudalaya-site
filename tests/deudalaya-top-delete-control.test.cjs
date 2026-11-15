const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const social = fs.readFileSync(path.resolve(__dirname, '..', 'social.js'), 'utf8');

test('the top feed Delete control is hidden without changing other delete controls', () => {
  const match = social.match(/function hideTopPostDeleteControl\(\)\s*\{[\s\S]*?\n  \}/);
  assert.ok(match, 'top Delete control visibility rule should exist');

  const elements = new Map();
  const head = { appendChild(element) { elements.set(element.id, element); } };
  const document = {
    head,
    documentElement: head,
    getElementById: id => elements.get(id) || null,
    createElement: tag => ({ tagName: tag.toUpperCase(), id: '', textContent: '' })
  };
  const hideTopPostDeleteControl = new Function('document', `${match[0]}; return hideTopPostDeleteControl;`)(document);

  hideTopPostDeleteControl();
  const style = elements.get('deudalaya-hide-top-delete-control');
  assert.equal(style.tagName, 'STYLE');
  assert.match(style.textContent, /#ttDeletePostBtn\s*\{[^}]*display:\s*none\s*!important/);
  assert.doesNotMatch(style.textContent, /\.prof-del|\.tt-confirm/);
});

test('the feed fetch limit includes both newly authorized video batches', () => {
  const fetchBlock = social.match(/window\.loadRemotePosts\s*=\s*async function\(\)\s*\{[\s\S]*?\n  \};/);
  assert.ok(fetchBlock, 'remote feed loader should exist');
  assert.equal((fetchBlock[0].match(/\.limit\(200\)/g) || []).length, 2);
  assert.doesNotMatch(fetchBlock[0], /\.limit\(100\)/);
});
