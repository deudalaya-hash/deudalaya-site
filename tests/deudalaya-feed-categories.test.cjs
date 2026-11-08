const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const categories = require('../feed-categories.js');
const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const social = fs.readFileSync(path.resolve(__dirname, '..', 'social.js'), 'utf8');

test('feed category filtering keeps each video in exactly its stored category', () => {
  const posts = [
    { id: 'default' },
    { id: 'village', feedCategory: 'गाउँघर' },
    { id: 'sudur', feed_category: 'सुदूर कर्णाली' },
    { id: 'unknown', feedCategory: 'गीत' }
  ];

  assert.deepEqual(categories.filterPosts(posts, 'देउडा').map(post => post.id), ['default']);
  assert.deepEqual(categories.filterPosts(posts, 'गाउँघर').map(post => post.id), ['village']);
  assert.deepEqual(categories.filterPosts(posts, 'सुदूर कर्णाली').map(post => post.id), ['sudur']);
  assert.deepEqual(categories.filterPosts(posts, 'गीत'), []);
});

test('category tabs order active feeds before the coming-soon category', () => {
  const nav = html.match(/<nav class="feed-category-tabs"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  const buttons = [...nav.matchAll(/<button class="feed-category(?: selected)?"[^>]*>([^<]+)<\/button>/g)];
  assert.deepEqual(buttons.map(([, label]) => label), ['देउडा', 'गाउँघर', 'गीत', 'सुदूर कर्णाली']);
  assert.match(buttons[0][0], /selected/);
  assert.match(nav, /setFeedCategory\('गाउँघर'\)/);
  assert.match(nav, /setFeedCategory\('सुदूर कर्णाली'\)/);
  assert.match(nav, /showFeedCategoryComingSoon\('गीत'\)/);
});

test('uploads and admin management store a dedicated feed category separately from topic metadata', () => {
  assert.match(html, /id="uploadCategory"[\s\S]*?<option>गाउँघर<\/option>/);
  assert.match(html, /id="feedCategoryManager"/);
  assert.match(html, /id="feedCategoryManageButton"/);
  assert.match(social, /select\('id,user_id,media_path,media_type,caption,category,feed_category,created_at'\)/);
  assert.match(social, /update\(\{feed_category:category\}\)/);
  assert.match(social, /isDeudalayaAdmin\(\)/);
});

test('feed category metadata migration is additive and admin-gated', () => {
  const migration = fs.readFileSync(path.resolve(__dirname, '..', 'supabase/migrations/202611080001_feed_categories.sql'), 'utf8');
  assert.match(migration, /add column if not exists feed_category/);
  assert.match(migration, /is_deudalaya_admin/);
  assert.match(migration, /feed_category in \('देउडा', 'गाउँघर', 'सुदूर कर्णाली'\)/);
  assert.doesNotMatch(migration, /update public\.feed_posts set feed_category = 'सुदूर कर्णाली'/);
});
