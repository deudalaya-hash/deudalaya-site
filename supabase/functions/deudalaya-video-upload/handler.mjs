const PROJECT_REF = 'bxzkclqanpuvxyhsrpog';
const BUCKET = 'videos';
const MAX_BYTES_EXCLUSIVE = 4_000_000;
const CATEGORIES = Object.freeze(['देउडा', 'गाउँघर', 'शहर']);
const FEED_FIELDS = Object.freeze(['id', 'user_id', 'media_path', 'media_type', 'caption', 'category']);
const encoder = new TextEncoder();

class RequestError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function tokenMatches(provided, expectedDigest) {
  if (!provided || provided.length > 512) return false;
  const actualDigest = await crypto.subtle.digest('SHA-256', encoder.encode(provided));
  const actual = new Uint8Array(actualDigest);
  let mismatch = 0;
  for (let index = 0; index < expectedDigest.length; index += 1) mismatch |= actual[index] ^ expectedDigest[index];
  return mismatch === 0;
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function decodeHeader(request, name) {
  const value = request.headers.get(name);
  if (value === null) throw new RequestError(400, 'missing_metadata');
  try {
    return decodeURIComponent(value);
  } catch {
    throw new RequestError(400, 'invalid_metadata_encoding');
  }
}

async function readBoundedBody(request) {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    if (!/^\d+$/.test(contentLength)) throw new RequestError(400, 'invalid_content_length');
    if (Number(contentLength) >= MAX_BYTES_EXCLUSIVE) throw new RequestError(413, 'video_too_large');
  }
  if (!request.body) throw new RequestError(400, 'empty_video');

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total >= MAX_BYTES_EXCLUSIVE) {
        await reader.cancel();
        throw new RequestError(413, 'video_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (total === 0) throw new RequestError(400, 'empty_video');

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function hasMp4FileType(bytes) {
  return bytes.byteLength >= 12
    && bytes[4] === 0x66
    && bytes[5] === 0x74
    && bytes[6] === 0x79
    && bytes[7] === 0x70;
}

function sameFeedMetadata(row, userId, objectPath, category, caption) {
  return row.user_id === userId
    && row.media_path === objectPath
    && row.media_type === 'video/mp4'
    && row.category === category
    && row.caption === caption;
}

async function storageHashMatches(repository, objectPath, expectedHash) {
  const stored = await repository.downloadStorageObject(objectPath);
  if (!stored || stored.byteLength >= MAX_BYTES_EXCLUSIVE) return false;
  return (await sha256(stored)) === expectedHash;
}

function bearerToken(request) {
  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer ([^\s]+)$/i);
  return match ? match[1] : '';
}

export function createPublishHandler({ repository, pipelineToken }) {
  if (!repository || typeof pipelineToken !== 'string' || pipelineToken.length < 32) {
    throw new Error('Video publisher server configuration is incomplete');
  }
  const expectedDigestPromise = crypto.subtle.digest('SHA-256', encoder.encode(pipelineToken));

  return async function handlePublishRequest(request) {
    const expectedDigest = new Uint8Array(await expectedDigestPromise);
    if (!(await tokenMatches(bearerToken(request), expectedDigest))) {
      return jsonResponse(401, { error: 'unauthorized' });
    }

    if (request.method === 'GET') {
      try {
        await repository.preflight();
        return jsonResponse(200, {
          ready: true,
          project_ref: PROJECT_REF,
          bucket: BUCKET,
          categories: CATEGORIES,
          max_bytes_exclusive: MAX_BYTES_EXCLUSIVE,
          feed_fields: FEED_FIELDS,
        });
      } catch {
        return jsonResponse(503, { error: 'publisher_preflight_failed' });
      }
    }
    if (request.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed' });

    try {
      const contentType = (request.headers.get('content-type') || '').split(';', 1)[0].trim().toLowerCase();
      if (contentType !== 'video/mp4') throw new RequestError(400, 'video_mp4_required');

      const category = decodeHeader(request, 'x-deudalaya-category');
      if (!CATEGORIES.includes(category)) throw new RequestError(400, 'category_not_allowed');
      const caption = decodeHeader(request, 'x-deudalaya-caption').trim();
      if (!caption || Array.from(caption).length > 220) throw new RequestError(400, 'invalid_caption');
      const claimedHash = request.headers.get('x-deudalaya-sha256') || '';
      if (!/^[a-f\d]{64}$/i.test(claimedHash)) throw new RequestError(400, 'invalid_sha256');

      const video = await readBoundedBody(request);
      if (!hasMp4FileType(video)) throw new RequestError(400, 'invalid_mp4_container');
      const digest = await sha256(video);
      if (digest !== claimedHash.toLowerCase()) throw new RequestError(400, 'sha256_mismatch');

      const userId = await repository.getPublisherUserId();
      const objectPath = `${userId}/${digest}.mp4`;
      const existingRows = await repository.findFeedRows(objectPath);
      if (existingRows.length > 1) throw new RequestError(409, 'duplicate_feed_rows');
      if (existingRows.length === 1) {
        const row = existingRows[0];
        if (!sameFeedMetadata(row, userId, objectPath, category, caption)) {
          throw new RequestError(409, 'path_metadata_conflict');
        }
        if (!(await storageHashMatches(repository, objectPath, digest))) {
          throw new RequestError(409, 'feed_row_storage_mismatch');
        }
        return jsonResponse(200, { status: 'duplicate', object_path: objectPath, row_id: row.id });
      }

      if (await repository.hasStorageObject(objectPath)) {
        if (!(await storageHashMatches(repository, objectPath, digest))) {
          throw new RequestError(409, 'storage_path_conflict');
        }
        throw new RequestError(409, 'orphaned_storage_object_requires_review');
      }

      try {
        await repository.uploadStorageObject(objectPath, video);
      } catch (error) {
        if (error && error.code === 'object_exists') {
          throw new RequestError(409, 'storage_object_created_concurrently');
        }
        return jsonResponse(502, { error: 'storage_upload_failed' });
      }

      const feedRecord = {
        user_id: userId,
        media_path: objectPath,
        media_type: 'video/mp4',
        caption,
        category,
      };
      let inserted;
      try {
        inserted = await repository.insertFeedPost(feedRecord);
      } catch {
        return jsonResponse(502, {
          error: 'feed_insert_failed_storage_object_preserved',
          object_path: objectPath,
        });
      }
      if (!inserted || !sameFeedMetadata(inserted, userId, objectPath, category, caption) || !inserted.id) {
        return jsonResponse(502, {
          error: 'feed_insert_verification_failed_storage_object_preserved',
          object_path: objectPath,
        });
      }
      return jsonResponse(201, { status: 'uploaded', object_path: objectPath, row_id: inserted.id });
    } catch (error) {
      if (error instanceof RequestError) return jsonResponse(error.status, { error: error.code });
      return jsonResponse(502, { error: 'publisher_operation_failed' });
    }
  };
}

export const VIDEO_PIPELINE_LIMITS = Object.freeze({ maxBytesExclusive: MAX_BYTES_EXCLUSIVE });
