const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('video progress is visible at the mobile video edge and tracks actual playback', () => {
  assert.match(html, /<div class="progress" id="progressTrack" role="slider"[^>]*aria-valuenow="0"[^>]*><i id="progress"><\/i><\/div>/);
  assert.match(html, /#feed \.progress\{[^}]*height:20px/);
  assert.match(html, /\.progress\{cursor:pointer;touch-action:none/);
  assert.match(html, /\.progress::before\{[^}]*height:3px[^}]*background:rgba\(0,0,0/);
  assert.match(html, /\.progress i\{[^}]*background:#fff/);
  assert.match(html, /\.progress\.seeking i\{transition:none/);
  assert.doesNotMatch(html, /\.progress i\{width:16%!important/);
  assert.match(html, /\.progress\{[^}]*bottom:78px!important/);
});

test('progress seeking supports pointer drag, keyboard, and does not trigger feed swipes', () => {
  assert.match(html, /progressWrap\.addEventListener\('pointerdown'/);
  assert.match(html, /progressWrap\.addEventListener\('pointermove'/);
  assert.match(html, /progressWrap\.addEventListener\('keydown'/);
  assert.match(html, /\['touchstart','touchmove','touchend','touchcancel'\][\s\S]*?progressWrap\.addEventListener\(type,function\(e\)\{e\.stopPropagation\(\)\}/);
  assert.match(html, /videoEl\.currentTime\s*=\s*ratio\s*\*\s*videoEl\.duration/);
});

test('progress updates pause while paused or buffering and reset when the video changes', () => {
  assert.match(html, /if\(seeking\|\|!videoEl\.duration\|\|videoEl\.paused\|\|progressBuffering\)return/);
  assert.match(html, /videoEl\.addEventListener\('waiting',[\s\S]*?progressBuffering=true/);
  assert.match(html, /videoEl\.addEventListener\('playing',[\s\S]*?progressBuffering=false/);
  assert.match(html, /if\(postVideo\.src!==new URL\(v\.videoSrc,location\.href\)\.href\)\{[^}]*getElementById\('progress'\)\.style\.width='0%'/);
});
