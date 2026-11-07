const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('the header has one centered Deuda category, left logo, and right search control', () => {
  const header = html.match(/<header class="topbar">[\s\S]*?<\/header>/);
  assert.ok(header, 'the actual top header exists');
  const nav = header[0].match(/<nav class="feed-tabs top-categories"[^>]*>[\s\S]*?<\/nav>/);
  assert.ok(nav, 'the Deuda category belongs to the actual header');
  assert.deepEqual([...nav[0].matchAll(/class="category-tab[^>]*>([^<]+)/g)].map((match) => match[1]), ['देउडा']);
  assert.match(nav[0], /class="category-tab selected"[^>]*aria-current="page"/);
  assert.match(header[0], /class="brand"><img[^>]*alt="देउडालय logo"/);
  assert.match(header[0], /class="topbar-actions"[\s\S]*?class="feed-search"/);
  assert.equal((html.match(/class="feed-tabs top-categories"/g) || []).length, 1, 'there is only one category navigation');
  assert.doesNotMatch(html, /सुदूर कर्णाली|showComingSoonCategory|setDeudaCategory/);
  assert.doesNotMatch(html, /showFeedTab\(this\)|<div class="feed-tabs">/);
  assert.match(html, /\.topbar \.category-tab\{[^}]*font-family:"Noto Sans Devanagari"/);
  assert.match(html, /id="uploadCategory"[\s\S]*?<option>कला तथा संस्कृति<\/option>/);
  assert.match(html, /class="mobile-nav"/);
});

test('category bar remains visible and compact at mobile widths while desktop uses the header', () => {
  assert.match(html, /\.topbar \.top-categories\{[^}]*display:flex/);
  assert.match(html, /@media\(max-width:700px\)\{[\s\S]*?\.topbar\{display:flex!important/);
  assert.match(html, /\.topbar \.top-categories\{[^}]*left:50%;[^}]*transform:translateX\(-50%\)/);
  assert.match(html, /\.topbar-actions\{[^}]*margin-left:auto/);
  assert.match(html, /\.topbar \.brand span,\.topbar \.topbar-actions>\.search,\.topbar \.topbar-actions>\.login\{display:none!important/);
  assert.match(html, /@media\(min-width:701px\) and \(max-width:1100px\)/);
  assert.match(html, /\.topbar-actions>\.search\{display:none\}/);
});
