const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('the header has exactly two Nepali category labels and Deuda starts selected', () => {
  const header = html.match(/<header class="topbar">[\s\S]*?<\/header>/);
  assert.ok(header, 'the actual top header exists');
  const nav = header[0].match(/<nav class="feed-tabs top-categories"[^>]*>[\s\S]*?<\/nav>/);
  assert.ok(nav, 'categories belong to the actual header');
  assert.deepEqual([...nav[0].matchAll(/class="category-tab[^>]*>([^<]+)/g)].map((match) => match[1]), ['देउडा', 'सुदूर कर्णाली']);
  assert.match(nav[0], /class="category-tab selected"[^>]*aria-current="page"/);
  assert.equal((html.match(/class="feed-tabs top-categories"/g) || []).length, 1, 'there is only one category navigation');
  assert.doesNotMatch(html, /showFeedTab\(this\)|<div class="feed-tabs">/);
  assert.match(html, /\.topbar \.category-tab\{[^}]*font-family:"Noto Sans Devanagari"/);
});

test('Sudur Karnali only shows the requested notification without changing the feed', () => {
  assert.match(html, /onclick="showComingSoonCategory\(this\)"/);
  assert.match(html, /function showComingSoonCategory\(\)\{toast\('सुदूर कर्णाली — Coming Soon!'\)/);
  assert.match(html, /function setDeudaCategory\(button\)\{[\s\S]*?button\.classList\.add\('selected'\)/);
  assert.match(html, /id="postVideo"/);
});

test('category bar remains visible and compact at mobile widths while desktop uses the header', () => {
  assert.match(html, /\.topbar \.top-categories\{[^}]*display:flex/);
  assert.match(html, /@media\(max-width:700px\)\{[\s\S]*?\.topbar\{display:flex!important/);
  assert.match(html, /\.top-categories\{[^}]*gap:clamp/);
  assert.match(html, /@media\(min-width:701px\) and \(max-width:1100px\)\{[\s\S]*?\.topbar \.top-categories \.feed-search\{display:none\}/);
});
