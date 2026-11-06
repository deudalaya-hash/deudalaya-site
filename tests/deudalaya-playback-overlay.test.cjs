const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

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
});

test('playback feedback follows media play and pause events and fades after starting', () => {
  assert.match(html, /feedVideo\.addEventListener\('play',/);
  assert.match(html, /feedVideo\.addEventListener\('pause',/);
  assert.match(html, /play-feedback/);
  assert.match(html, /aria-label',playing\?'Pause video':'Play video'/);
  assert.match(html, /function togglePlay\(\)\{[\s\S]*?pv\.paused[\s\S]*?pv\.play\(\)[\s\S]*?pv\.pause\(\)/);
});
