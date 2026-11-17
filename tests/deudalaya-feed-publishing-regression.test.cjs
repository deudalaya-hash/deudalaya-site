const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const categories = require('../feed-categories.js');
let publisher = null;
try { publisher = require('../feed-publisher.js'); } catch (_) {}
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function makeQueryClient(rows, error = null) {
  const calls = [];
  const query = {
    select(columns) { calls.push(['select', columns]); return this; },
    order(column, options) { calls.push(['order', column, options]); return this; },
    limit(value) { calls.push(['limit', value]); return this; },
    then(resolve, reject) { return Promise.resolve({ data: rows, error }).then(resolve, reject); }
  };
  return { calls, from(table) { calls.push(['from', table]); return query; } };
}

test('feed loader queries the deployed category schema and returns published rows', async () => {
  assert.equal(typeof categories.fetchFeedPosts, 'function');
  const rows = Array.from({ length: 175 }, (_, i) => ({
    id: String(i), media_type: 'video/mp4', media_path: 'admin/' + i + '.mp4', category: 'देउडा'
  }));
  const client = makeQueryClient(rows);
  const result = await categories.fetchFeedPosts(client);
  assert.equal(result.length, 175);
  assert.equal(result[0].category, 'देउडा');
  assert.deepEqual(client.calls, [
    ['from', 'feed_posts'],
    ['select', 'id,user_id,media_path,media_type,caption,category,created_at'],
    ['order', 'created_at', { ascending: false }],
    ['limit', 200]
  ]);
});

test('feed loader surfaces query errors without retrying a missing feed_category column', async () => {
  assert.equal(typeof categories.fetchFeedPosts, 'function');
  const failure = { message: 'network unavailable' };
  const client = makeQueryClient(null, failure);
  await assert.rejects(categories.fetchFeedPosts(client), error => error === failure);
  assert.equal(client.calls.filter(call => call[0] === 'select').length, 1);
});

test('feed category filter includes अन्तरिक्ष through the existing category field', () => {
  assert.deepEqual(categories.ACTIVE_CATEGORIES, ['देउडा', 'गाउँघर', 'शहर', 'अन्तरिक्ष']);
  const posts = [
    { id: 1, category: 'देउडा' },
    { id: 2, category: 'गाउँघर' },
    { id: 3, category: 'शहर' },
    { id: 4, category: 'अन्तरिक्ष' },
    { id: 5, category: 'लोकगीत' }
  ];
  assert.deepEqual(categories.filterPosts(posts, 'देउडा').map(post => post.id), [1]);
  assert.deepEqual(categories.filterPosts(posts, 'गाउँघर').map(post => post.id), [2]);
  assert.deepEqual(categories.filterPosts(posts, 'शहर').map(post => post.id), [3]);
  assert.deepEqual(categories.filterPosts(posts, 'अन्तरिक्ष').map(post => post.id), [4]);
});

test('category updates write the existing category field and reject unsupported categories', async () => {
  assert.equal(typeof categories.updateFeedPostCategory, 'function');
  const calls = [];
  const client = {
    from(table) {
      calls.push(['from', table]);
      return {
        update(values) {
          calls.push(['update', values]);
          return { async eq(column, id) { calls.push(['eq', column, id]); return { error: null }; } };
        }
      };
    }
  };
  assert.equal(await categories.updateFeedPostCategory(client, 'post-1', 'अन्तरिक्ष'), true);
  assert.deepEqual(calls, [
    ['from', 'feed_posts'],
    ['update', { category: 'अन्तरिक्ष' }],
    ['eq', 'id', 'post-1']
  ]);
  assert.equal(await categories.updateFeedPostCategory(client, 'post-1', 'लोकगीत'), false);
  assert.equal(calls.length, 3);
});

test('base publisher is loaded before inline upload wrappers', () => {
  const publisherTag = html.indexOf('src="feed-publisher.js?v=2026.11.18.1"');
  const socialTag = html.indexOf('src="social.js');
  const firstWrapper = html.indexOf('originalPublishUpload=publishUpload');
  assert.ok(publisherTag >= 0, 'the page must load the base publisher');
  assert.ok(socialTag >= 0 && socialTag < publisherTag);
  assert.ok(firstWrapper > publisherTag, 'base publisher must exist before audio/admin wrappers run');
});

test('publisher script initializes the missing global handler before it is invoked', () => {
  const vm = require('node:vm');
  const source = fs.readFileSync(path.join(__dirname, '..', 'feed-publisher.js'), 'utf8');
  const browserWindow = {};
  browserWindow.window = browserWindow;
  vm.runInNewContext(source + '\nif (typeof publishUpload !== "function") throw new Error("publishUpload global is missing");', browserWindow);
  assert.equal(typeof browserWindow.publishUpload, 'function');
});

test('non-admin publishing is rejected before storage or database writes', async () => {
  assert.equal(typeof publisher?.createPublishUpload, 'function');
  const calls = [];
  const handler = publisher.createPublishUpload({
    getClient: async () => ({ from() { calls.push('insert'); }, storage: { from() { calls.push('storage'); } } }),
    getUser: () => ({ id: 'ordinary-user' }),
    isAdmin: () => false,
    getFile: () => ({ name: 'clip.mp4', type: 'video/mp4', size: 1000 }),
    getCategory: () => 'अन्तरिक्ष',
    hasRights: () => true,
    upload() { calls.push('upload'); },
    toast() {}
  });
  let prevented = false;
  await handler({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.deepEqual(calls, []);
});

test('authorized publisher uploads to videos and inserts metadata using category', async () => {
  assert.equal(typeof publisher?.createPublishUpload, 'function');
  const operations = [];
  const file = { name: 'clip.mp4', type: 'video/mp4', size: 1024 };
  const button = { disabled: false, textContent: 'Add to feed' };
  const client = {
    storage: { from(bucket) {
      assert.equal(bucket, 'videos');
      return {
        getPublicUrl(objectPath) { return { data: { publicUrl: 'https://storage.example/' + objectPath } }; },
        async remove(paths) { operations.push(['remove', paths]); }
      };
    } },
    from(table) {
      assert.equal(table, 'feed_posts');
      return { insert(payload) {
        operations.push(['insert', payload]);
        return { select(fields) {
          operations.push(['select', fields]);
          return { async single() { return { data: { id: 'post-1', ...payload }, error: null }; } };
        } };
      } };
    }
  };
  const published = [];
  const handler = publisher.createPublishUpload({
    getClient: async () => client,
    getUser: () => ({ id: 'admin-1' }),
    isAdmin: () => true,
    getFile: () => file,
    getCategory: () => 'अन्तरिक्ष',
    getCaption: () => 'Test clip',
    hasRights: () => true,
    allowedCategories: ['देउडा', 'गाउँघर', 'शहर', 'अन्तरिक्ष'],
    randomUUID: () => 'safe-id',
    getButton: () => button,
    upload: async (_client, objectPath, selectedFile) => operations.push(['upload', objectPath, selectedFile]),
    onPublished: post => published.push(post),
    toast() {}
  });
  await handler({ preventDefault() {} });
  assert.deepEqual(operations.slice(0, 2), [
    ['upload', 'admin-1/safe-id.mp4', file],
    ['insert', { user_id: 'admin-1', media_path: 'admin-1/safe-id.mp4', media_type: 'video/mp4', caption: 'Test clip', category: 'अन्तरिक्ष' }]
  ]);
  assert.equal(published[0].cloudId, 'post-1');
  assert.equal(published[0].feedCategory, 'अन्तरिक्ष');
  assert.equal(published[0].videoSrc, 'https://storage.example/admin-1/safe-id.mp4');
  assert.equal(button.disabled, false);
});

test('publisher rejects invalid categories, unsupported files, missing rights, and oversized files before upload', async t => {
  assert.equal(typeof publisher?.createPublishUpload, 'function');
  const cases = [
    { category: 'अन्य', file: { name: 'x.mp4', type: 'video/mp4', size: 1000 } },
    { category: 'देउडा', file: { name: 'x.jpg', type: 'image/jpeg', size: 1000 } },
    { category: 'देउडा', file: { name: 'x.mp4', type: 'video/mp4', size: 25_000_001 } },
    { category: 'देउडा', file: { name: 'x.mp4', type: 'video/mp4', size: 1000 }, rights: false }
  ];
  for (const current of cases) await t.test(JSON.stringify({ category: current.category, type: current.file.type, size: current.file.size }), async () => {
    let uploads = 0;
    const handler = publisher.createPublishUpload({
      getClient: async () => ({}),
      getUser: () => ({ id: 'admin-1' }),
      isAdmin: () => true,
      getFile: () => current.file,
      getCategory: () => current.category,
      hasRights: () => current.rights !== false,
      allowedCategories: ['देउडा', 'गाउँघर', 'शहर', 'अन्तरिक्ष'],
      upload: async () => { uploads += 1; },
      toast() {}
    });
    await handler({ preventDefault() {} });
    assert.equal(uploads, 0);
  });
});
