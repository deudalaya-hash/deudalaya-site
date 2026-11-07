const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

test('the centered feed playback button shows white play and pause icons', () => {
  const button = html.match(/<button[^>]*id="playPauseButton"[^>]*>[\s\S]*?<\/button>/);
  assert.ok(button, 'feed needs one accessible central playback button');
  assert.match(button[0], /aria-label="Play video"/);
  assert.match(button[0], /class="play-icon"[^>]*>▶<\/span>/);
  assert.match(button[0], /class="pause-icon"[^>]*>Ⅱ<\/span>/);

  const baseButtonStyle = html.match(/\.play\{[^}]*\}/);
  const buttonStyle = html.match(/#feed \.play\{[^}]*\}/);
  assert.ok(baseButtonStyle, 'button retains its centered absolute positioning');
  assert.ok(buttonStyle, 'playback button needs dedicated styling');
  assert.match(baseButtonStyle[0], /position:absolute/);
  assert.match(buttonStyle[0], /inset:0;margin:auto/);
  assert.match(buttonStyle[0], /border-radius:50%/);
  assert.match(buttonStyle[0], /background:rgba\(/);
  assert.match(buttonStyle[0], /color:#fff/);
  assert.match(buttonStyle[0], /box-shadow:/);

  const pausedControl = html.match(/#feed\.paused #playPauseButton\{[^}]*\}/);
  assert.ok(pausedControl, 'paused playback shows the central play button');
  assert.match(pausedControl[0], /opacity:1/);
  assert.match(pausedControl[0], /pointer-events:auto/);
  const playingControl = html.match(/#feed #playPauseButton\{[^}]*\}/);
  assert.ok(playingControl, 'playing playback fades out the central button');
  assert.match(playingControl[0], /opacity:0/);
  assert.match(playingControl[0], /pointer-events:none/);
  assert.match(html, /#feed #playPauseButton\{[^}]*transition:opacity \.18s ease,transform \.18s ease/);
});

test('the central Play control is visible before autoplay reports its first playback event', () => {
  assert.match(html, /<div class="feed-wrap paused" id="feed">/);
  assert.ok(html.includes('#feed.paused #playPauseButton .play-icon'));
});

test('playback state follows media play and pause events and shows the paused play icon', () => {
  assert.match(html, /feedVideo\.addEventListener\('play',/);
  assert.match(html, /feedVideo\.addEventListener\('pause',/);
  assert.ok(html.includes('#feed.paused #playPauseButton .play-icon'));
  assert.match(html, /aria-label',playing\?'Pause video':'Play video'/);
  assert.match(html, /function togglePlay\(\)\{[\s\S]*?pv\.paused[\s\S]*?pv\.play\(\)[\s\S]*?pv\.pause\(\)/);
});

test('the central playback button does not cover engagement controls and taps on controls are ignored', () => {
  const control = html.match(/#feed #playPauseButton\{[^}]*\}/);
  const actions = html.match(/\.actions\{[^}]*z-index:[^;}]+/);
  assert.ok(control && actions);
  assert.match(control[0], /z-index:2/);
  assert.match(actions[0], /z-index:3/);
  assert.match(html, /e\.target\.closest\('button, a, input, textarea, \.actions, \.comments, \.video-copy, \.tt-react, \.progress'\)/);
});

test('the app shell cache version advances so installed PWAs receive the updated feed', () => {
  assert.match(serviceWorker, /deudalaya-shell-v5/);
});
