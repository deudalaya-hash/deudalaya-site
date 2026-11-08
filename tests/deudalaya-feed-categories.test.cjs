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
    { id: 'city', feed_category: 'शहर' },
    { id: 'sudur', feed_category: 'सुदूर कर्णाली' },
    { id: 'unknown', feedCategory: 'गीत' }
  ];

  assert.deepEqual(categories.filterPosts(posts, 'देउडा').map(post => post.id), ['default']);
  assert.deepEqual(categories.filterPosts(posts, 'गाउँघर').map(post => post.id), ['village']);
  assert.deepEqual(categories.filterPosts(posts, 'शहर'), []);
  assert.deepEqual(categories.filterPosts(posts, 'सुदूर कर्णाली').map(post => post.id), ['sudur']);
  assert.deepEqual(categories.filterPosts(posts, 'गीत'), []);
});

test('the default category is filtered before remote data is requested', () => {
  assert.match(social, /applyFeedMode\(true\);\s*setInterval\(/);
});

test('the supplied Bajhang Day 4 video uses its existing asset and is assigned to गाउँघर once', () => {
  const source = 'assets/deudalaya-video-2026-11-04-clip-06.mp4';
  const entry = html.match(new RegExp(`\\{[^{}]*videoSrc:'${source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}'[^{}]*\\}`));
  assert.ok(entry, 'the exact existing feed entry is present');
  assert.match(entry[0], /feedCategory:'गाउँघर'/);
  assert.equal((html.match(new RegExp(source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'g')) || []).length, 1, 'no second post or file reference is added');
});

test('the supplied 2026-11-08 clip is bundled once and assigned only to सुदूर कर्णाली', () => {
  const source = 'assets/VID_20261108_122315.mp4';
  const entry = html.match(new RegExp(`\\{[^{}]*videoSrc:'${source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}'[^{}]*\\}`));
  assert.ok(fs.existsSync(path.resolve(__dirname, '..', source)), 'the supplied MP4 is bundled');
  assert.ok(entry, 'the feed references the supplied clip');
  assert.match(entry[0], /feedCategory:'सुदूर कर्णाली'/);
  assert.equal((html.match(new RegExp(source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'g')) || []).length, 1);
  assert.equal(fs.readFileSync(path.resolve(__dirname, '..', source)).toString('ascii', 4, 8), 'ftyp');
});

test('the supplied cricket-ground video is assigned to शहर but remains unavailable while that category is coming soon', () => {
  const source = 'assets/deudalaya-shahar-tu-cricket-ground-night.mp4';
  const entry = html.match(new RegExp(`\\{[^{}]*videoSrc:'${source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'[^{}]*\\}`));
  assert.ok(entry, 'the supplied video has a feed entry');
  assert.match(entry[0], /feedCategory:'शहर'/);
  assert.deepEqual(categories.filterPosts([{ feedCategory: 'शहर' }], 'शहर'), []);
  assert.equal((html.match(new RegExp(source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g')) || []).length, 1);
  assert.equal(fs.readFileSync(path.resolve(__dirname, '..', source)).toString('ascii', 4, 8), 'ftyp');
  assert.match(html, /showFeedCategoryComingSoon\('शहर'\)/);
});

test('the three additional city videos are each bundled once and assigned only to शहर', () => {
  const sources = [
    'assets/deudalaya-shahar-city-of-temples.mp4',
    'assets/deudalaya-shahar-2026-11-08-134127.mp4',
    'assets/deudalaya-shahar-2026-11-08-133736.mp4'
  ];
  const seed = html.slice(html.indexOf('const videos=['), html.indexOf('let index='));

  for (const source of sources) {
    const entry = seed.match(new RegExp(`\\{[^{}]*videoSrc:'${source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}'[^{}]*\\}`));
    const assetPath = path.resolve(__dirname, '..', source);
    assert.ok(fs.existsSync(assetPath), `${source} is bundled`);
    assert.ok(entry, `${source} has a feed entry`);
    assert.match(entry[0], /feedCategory:'शहर'/);
    assert.equal((seed.match(new RegExp(source.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g')) || []).length, 1);
    assert.equal(fs.readFileSync(assetPath).toString('ascii', 4, 8), 'ftyp');
  }
});

test('category tabs order active feeds before the coming-soon category', () => {
  const nav = html.match(/<nav class="feed-category-tabs"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  assert.ok(nav);
  const buttons = [...nav.matchAll(/<button class="feed-category(?: selected)?"[^>]*>([^<]+)<\/button>/g)];
  assert.deepEqual(buttons.map(([, label]) => label), ['देउडा', 'गाउँघर', 'शहर', 'सुदूर कर्णाली', 'गीत']);
  assert.match(buttons[0][0], /selected/);
  assert.match(nav, /setFeedCategory\('गाउँघर'\)/);
  assert.match(nav, /showFeedCategoryComingSoon\('शहर'\)/);
  assert.match(nav, /setFeedCategory\('सुदूर कर्णाली'\)/);
  assert.match(nav, /showFeedCategoryComingSoon\('गीत'\)/);
});

test('uploads and admin management store a dedicated feed category separately from topic metadata', () => {
  assert.match(html, /id="uploadCategory"[\s\S]*?<option>गाउँघर<\/option>/);
  assert.match(html, /id="uploadCategory"[\s\S]*?<option>शहर<\/option>/);
  assert.match(html, /id="feedCategoryManager"/);
  assert.match(html, /id="feedCategoryManageButton"/);
  assert.match(social, /select\('id,user_id,media_path,media_type,caption,category,feed_category,created_at'\)/);
  assert.match(social, /update\(\{feed_category:category\}\)/);
  assert.match(social, /isDeudalayaAdmin\(\)/);
  assert.deepEqual(categories.ACTIVE_CATEGORIES, ['देउडा', 'गाउँघर', 'सुदूर कर्णाली']);
});

test('feed category metadata migration is additive, admin-gated, and keeps existing placements', () => {
  const migration = fs.readFileSync(path.resolve(__dirname, '..', 'supabase/migrations/202611080001_feed_categories.sql'), 'utf8');
  const cityMigration = fs.readFileSync(path.resolve(__dirname, '..', 'supabase/migrations/202611080002_add_city_feed_category.sql'), 'utf8');
  assert.match(migration, /add column if not exists feed_category/);
  assert.match(migration, /is_deudalaya_admin/);
  assert.match(migration, /feed_category in \('देउडा', 'गाउँघर', 'सुदूर कर्णाली'\)/);
  assert.doesNotMatch(migration, /update public\.feed_posts set feed_category = 'सुदूर कर्णाली'/);
  assert.match(cityMigration, /feed_category is null or feed_category in \('देउडा', 'गाउँघर', 'शहर', 'सुदूर कर्णाली'\)/);
  assert.doesNotMatch(cityMigration, /update public\.feed_posts/);
});
