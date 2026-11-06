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

test('uploads are capped at 25 MB and TUS reports upload progress', () => {
  assert.match(html, /MAX_VIDEO_UPLOAD_BYTES=25\*1000\*1000/);
  assert.doesNotMatch(html, /MAX_VIDEO_SECONDS|15 seconds|maximum 15 sec|shorter than 15/);
  assert.match(html, /new window\.tus\.Upload/);
  assert.match(html, /onProgress:function\(sent,total\)/);
  assert.match(html, /Video exceeds the 25 MB limit\. Please choose a smaller video\./);
});

test('video size validation accepts 10, 20, and 25 MB and rejects 25.1 and 30 MB', () => {
  const match = html.match(/function isVideoWithinLimit\(size\)\s*\{[^}]+\}/);
  assert.ok(match, 'video size validator exists');
  const run = vm.runInNewContext(`const MAX_VIDEO_UPLOAD_BYTES=25*1000*1000; ${match[0]}; isVideoWithinLimit`, {});
  assert.equal(run(10 * 1000 * 1000), true);
  assert.equal(run(20 * 1000 * 1000), true);
  assert.equal(run(25 * 1000 * 1000), true);
  assert.equal(run(25.1 * 1000 * 1000), false);
  assert.equal(run(30 * 1000 * 1000), false);
  assert.equal(run(0), false);
});

test('only trusted app-metadata admins can use the uploader', () => {
  const match = html.match(/function isDeudalayaAdmin\(\)\s*\{[^}]+\}/);
  assert.ok(match, 'admin check exists');
  const run = role => vm.runInNewContext(`${match[0]}; isDeudalayaAdmin()`, { cloudUser: { app_metadata: { role } } });
  assert.equal(run('admin'), true);
  assert.equal(run('member'), false);
  assert.match(html, /isDeudalayaAdmin\(\).*Video uploads are restricted to authorized Deudalaya admins/s);
});

test('Storage applies a 25 MB cap while existing admin upload policies remain intact', () => {
  const migrationPath = path.join(root, 'supabase', 'migrations', '202611060001_enforce_25mb_video_limit.sql');
  const migration = fs.readFileSync(migrationPath, 'utf8');
  const adminPath = path.join(root, 'supabase', 'migrations', '202611030001_admin_video_uploads.sql');
  const adminMigration = fs.readFileSync(adminPath, 'utf8');
  assert.match(migration, /file_size_limit\s*=\s*25000000/);
  assert.match(migration, /where id = 'videos'/);
  assert.match(adminMigration, /public\.feed_posts[\s\S]*?as restrictive[\s\S]*?public\.is_deudalaya_admin/i);
  assert.match(adminMigration, /drop constraint if exists videos_duration_seconds_check/);
  assert.match(adminMigration, /check \(duration_seconds > 0\)/);
  assert.match(adminMigration, /storage\.objects[\s\S]*?as restrictive[\s\S]*?public\.is_deudalaya_admin/i);
  assert.match(adminMigration, /duration_seconds type numeric using duration_seconds::numeric/);
  assert.match(setup, /MP4\/WebM at any duration/i);
});

