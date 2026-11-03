const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const setup = fs.readFileSync(path.join(root, 'BACKEND_SETUP.md'), 'utf8');

test('video duration validation accepts files shorter and longer than 15 seconds', () => {
  const match = html.match(/function isValidVideoDuration\(duration\)\s*\{[^}]+\}/);
  assert.ok(match, 'duration validator exists');
  const run = vm.runInNewContext(`${match[0]}; isValidVideoDuration`, {});
  assert.equal(run(8.2), true);
  assert.equal(run(14.9), true);
  assert.equal(run(15.069), true);
  assert.equal(run(24.6), true);
  assert.equal(run(26.834), true);
  assert.equal(run(180), true);
  assert.equal(run(0), false);
  assert.equal(run(Number.NaN), false);
});

test('uploads remain capped at 50 MB and TUS reports upload progress', () => {
  assert.match(html, /MAX_UPLOAD_BYTES=50\*1024\*1024/);
  assert.doesNotMatch(html, /MAX_VIDEO_SECONDS|15 seconds|maximum 15 sec|shorter than 15/);
  assert.match(html, /new window\.tus\.Upload/);
  assert.match(html, /onProgress:function\(sent,total\)/);
  assert.match(html, /exceeds a Supabase Storage file-size limit/);
});

test('only trusted app-metadata admins can use the uploader', () => {
  const match = html.match(/function isDeudalayaAdmin\(\)\s*\{[^}]+\}/);
  assert.ok(match, 'admin check exists');
  const run = role => vm.runInNewContext(`${match[0]}; isDeudalayaAdmin()`, { cloudUser: { app_metadata: { role } } });
  assert.equal(run('admin'), true);
  assert.equal(run('member'), false);
  assert.match(html, /isDeudalayaAdmin\(\).*Video uploads are restricted to authorized Deudalaya admins/s);
});

test('storage and feed database enforce the admin upload rule and keep a 50 MB bucket limit', () => {
  const migrationPath = path.join(root, 'supabase', 'migrations', '202611030001_admin_video_uploads.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  assert.match(migration, /file_size_limit\s*=\s*52428800/);
  assert.match(migration, /drop constraint if exists videos_duration_seconds_check/);
  assert.match(migration, /check \(duration_seconds > 0\)/);
  assert.match(migration, /storage\.objects[\s\S]*?as restrictive[\s\S]*?public\.is_deudalaya_admin/i);
  assert.match(migration, /public\.feed_posts[\s\S]*?as restrictive[\s\S]*?public\.is_deudalaya_admin/i);
  assert.match(setup, /MP4\/WebM at any duration/i);
  assert.match(migration, /duration_seconds type numeric using duration_seconds::numeric/);
});

