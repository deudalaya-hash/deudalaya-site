const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} exists in the feed source`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}' && --depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(`${name} has a complete function body`);
}

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

  const control = html.match(/#feed #playPauseButton\{[^}]*\}/);
  assert.ok(control, 'the central playback control has an explicit visible state');
  assert.match(control[0], /z-index:5/);
  assert.match(control[0], /opacity:1/);
  assert.match(control[0], /pointer-events:auto/);
  assert.match(html, /#feed \.play \.play-icon,#feed \.play \.pause-icon\{[^}]*opacity:0;transition:opacity \.18s ease/);
  assert.match(html, /#feed\.paused #playPauseButton \.play-icon\{[^}]*opacity:1/);
  assert.match(html, /#feed:not\(\.paused\) #playPauseButton \.pause-icon\{[^}]*opacity:1/);
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
  assert.match(control[0], /z-index:5/);
  assert.match(html, /\.vignette\{[^}]*z-index:3/);
  assert.match(actions[0], /z-index:3/);
  assert.match(html, /e\.target\.closest\('button, a, input, textarea, \.actions, \.comments, \.video-copy, \.tt-react, \.progress'\)/);
});


test('togglePlay calls the active video play and pause methods', () => {
  let playCalls = 0;
  let pauseCalls = 0;
  const media = {
    hidden: false,
    paused: true,
    play() { playCalls += 1; this.paused = false; },
    pause() { pauseCalls += 1; this.paused = true; }
  };
  const togglePlay = new Function('feedVideo', 'updateFeedPlaybackUI', `${extractFunction('togglePlay')}; return togglePlay`)(media, () => {});

  togglePlay();
  togglePlay();

  assert.equal(playCalls, 1);
  assert.equal(pauseCalls, 1);
  assert.equal(media.paused, true);
});

test('the app shell cache version advances so installed PWAs receive the updated feed', () => {
  assert.match(serviceWorker, /deudalaya-shell-v8/);
  assert.match(html, /name="deudalaya-version" content="2026\.11\.08\.3"/);
  assert.match(html, /const siteBuildVersion='2026\.11\.08\.3'/);
});
