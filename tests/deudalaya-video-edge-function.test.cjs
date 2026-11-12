'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { before, test } = require('node:test');

let createPublishHandler;
before(async () => {
  ({ createPublishHandler } = await import('../supabase/functions/deudalaya-video-upload/handler.mjs'));
});

const TOKEN = 'A'.repeat(64);
const PUBLISHER_ID = '5d84538b-fc9c-4ffe-ab6a-4f7fc23840fe';
const CATEGORY = 'देउडा';

function sampleMp4() {
  return Uint8Array.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function digestOf(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function makeRequest(bytes, { token = TOKEN, category = CATEGORY, caption = 'Festival clip', digest = digestOf(bytes), method = 'POST' } = {}) {
  const headers = new Headers({
    authorization: `Bearer ${token}`,
    'content-type': 'video/mp4',
    'x-deudalaya-category': encodeURIComponent(category),
    'x-deudalaya-caption': encodeURIComponent(caption),
    'x-deudalaya-sha256': digest,
  });
  return new Request('http://localhost/functions/v1/deudalaya-video-upload', {
    method,
    headers,
    ...(method === 'POST' ? { body: bytes } : {}),
  });
}

function makeRepository(initial = {}) {
  const state = {
    posts: [...(initial.posts || [])],
    objects: new Map(initial.objects || []),
    uploads: [],
    inserts: [],
    preflights: 0,
    publisherId: PUBLISHER_ID,
  };
  const repository = {
    async preflight() { state.preflights += 1; return { publisherId: state.publisherId }; },
    async getPublisherUserId() { return state.publisherId; },
    async findFeedRows(path) { return state.posts.filter((row) => row.media_path === path); },
    async hasStorageObject(path) { return state.objects.has(path); },
    async downloadStorageObject(path) { return state.objects.get(path) || null; },
    async uploadStorageObject(path, bytes) {
      if (state.objects.has(path)) throw Object.assign(new Error('duplicate'), { code: 'object_exists' });
      state.uploads.push({ path, bytes: Uint8Array.from(bytes) });
      state.objects.set(path, Uint8Array.from(bytes));
    },
    async insertFeedPost(row) {
      state.inserts.push({ ...row });
      const inserted = { id: `feed-${state.inserts.length}`, created_at: '2026-11-12T00:00:00.000Z', ...row };
      state.posts.push(inserted);
      return inserted;
    },
  };
  return { repository, state };
}

function makeHandler(repository) {
  assert.equal(typeof createPublishHandler, 'function', 'the private video Edge Function handler is available');
  return createPublishHandler({ repository, pipelineToken: TOKEN });
}

test('rejects missing and incorrect pipeline tokens before any backend access', async () => {
  const { repository, state } = makeRepository();
  const handler = makeHandler(repository);

  for (const token of ['', 'B'.repeat(64)]) {
    const response = await handler(makeRequest(sampleMp4(), { token }));
    assert.equal(response.status, 401);
  }

  assert.equal(state.preflights, 0);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test('rejects a file at the 4,000,000-byte boundary before storage or database writes', async () => {
  const { repository, state } = makeRepository();
  const handler = makeHandler(repository);
  const bytes = new Uint8Array(4_000_000);
  bytes.set([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70], 0);

  const response = await handler(makeRequest(bytes));
  assert.equal(response.status, 413);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test('rejects a category outside the Deudalaya feed allowlist', async () => {
  const { repository, state } = makeRepository();
  const handler = makeHandler(repository);

  const response = await handler(makeRequest(sampleMp4(), { category: 'other' }));
  assert.equal(response.status, 400);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test('rejects a body whose bytes do not match the claimed SHA-256 digest', async () => {
  const { repository, state } = makeRepository();
  const handler = makeHandler(repository);

  const response = await handler(makeRequest(sampleMp4(), { digest: '0'.repeat(64) }));
  assert.equal(response.status, 400);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test('uploads once and inserts only the permitted feed fields for the official publisher', async () => {
  const bytes = sampleMp4();
  const digest = digestOf(bytes);
  const { repository, state } = makeRepository();
  const handler = makeHandler(repository);

  const response = await handler(makeRequest(bytes));
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(result, {
    status: 'uploaded',
    object_path: `${PUBLISHER_ID}/${digest}.mp4`,
    row_id: 'feed-1',
  });
  assert.equal(state.uploads.length, 1);
  assert.equal(state.uploads[0].path, `${PUBLISHER_ID}/${digest}.mp4`);
  assert.deepEqual(state.inserts[0], {
    user_id: PUBLISHER_ID,
    media_path: `${PUBLISHER_ID}/${digest}.mp4`,
    media_type: 'video/mp4',
    caption: 'Festival clip',
    category: 'देउडा',
  });
});

test('returns an existing matching feed post as a duplicate without writing again', async () => {
  const bytes = sampleMp4();
  const digest = digestOf(bytes);
  const path = `${PUBLISHER_ID}/${digest}.mp4`;
  const existingRow = {
    id: 'existing-post', user_id: PUBLISHER_ID, media_path: path,
    media_type: 'video/mp4', caption: 'Festival clip', category: CATEGORY,
  };
  const { repository, state } = makeRepository({ posts: [existingRow], objects: [[path, bytes]] });
  const handler = makeHandler(repository);

  const response = await handler(makeRequest(bytes));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.status, 'duplicate');
  assert.equal(result.row_id, 'existing-post');
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test('does not create a feed row for an orphaned existing Storage object', async () => {
  const bytes = sampleMp4();
  const digest = digestOf(bytes);
  const path = `${PUBLISHER_ID}/${digest}.mp4`;
  const { repository, state } = makeRepository({ objects: [[path, bytes]] });
  const handler = makeHandler(repository);

  const response = await handler(makeRequest(bytes));

  assert.equal(response.status, 409);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});

test('serves an authenticated read-only preflight without performing writes', async () => {
  const { repository, state } = makeRepository();
  const handler = makeHandler(repository);
  const response = await handler(new Request('http://localhost/functions/v1/deudalaya-video-upload', {
    method: 'GET', headers: { authorization: `Bearer ${TOKEN}` },
  }));
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.ready, true);
  assert.equal(result.bucket, 'videos');
  assert.deepEqual(result.categories, ['देउडा', 'गाउँघर', 'शहर']);
  assert.equal(state.preflights, 1);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.inserts.length, 0);
});
