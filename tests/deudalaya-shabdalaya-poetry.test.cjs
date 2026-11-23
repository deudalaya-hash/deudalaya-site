const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'shabdalaya-poetry.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'shabdalaya-poetry.css'), 'utf8');

test('the music screen contains an audio-first Shabdalaya poetry post with profile, poem, and social actions', () => {
  const screen = html.match(/<section\b(?=[^>]*id="deudaSongScreen")[\s\S]*?<\/section>/)?.[0];
  assert.ok(screen, 'the existing full-screen music view exists');
  const post = screen.match(/<article\b(?=[^>]*class="shabdalaya-poetry-post")[\s\S]*?<\/article>/)?.[0];
  assert.ok(post, 'the sample audio poem is part of the existing music screen');
  assert.match(post, /assets\/shabdalaya-girl-profile\.jpg/);
  assert.match(post, /alt="a girl/);
  assert.match(post, />a girl</);
  assert.match(post, /काठमाडौं/);
  assert.match(post, /काठमाडौंको साँझ/);
  assert.match(post, /यो सहरको भीडभित्र/);
  assert.match(post, /#शब्दलय/);
  assert.match(post, /type="button"[^>]*aria-label="Like poem"/);
  assert.match(post, /aria-label="Comment on poem"/);
  assert.match(post, /aria-label="Bookmark poem"/);
  assert.match(post, /aria-label="Share poem"/);
  assert.match(post, /aria-label="Play audio poem"/);
  assert.match(post, /aria-label="Audio poem progress"/);
  assert.match(post, /assets\/shabdalaya-kathmandu-poem\.m4a/);
  assert.doesNotMatch(post, /<video\b|autoplay/i);
  assert.match(post, /preload="none"/);
  assert.match(html, /shabdalaya-poetry\.css/);
  assert.match(html, /shabdalaya-poetry\.js/);
});

test('the audio-poetry presentation is responsive and respects reduced motion', () => {
  assert.match(styles, /@media\s*\(max-width:\s*700px\)/);
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(styles, /shabdalaya-poetry-waves/);
  assert.match(styles, /shabdalaya-audio-visualizer/);
  assert.match(html, /\.deuda-song-screen\{[^}]*overflow-y:auto/);
});

test('the audio controller starts only from the explicit play button and updates accessible playback state', () => {
  assert.match(script, /playButton\.addEventListener\(['"]click['"][\s\S]*?audio\.play\(\)/);
  assert.match(script, /audio\.pause\(\)/);
  assert.match(script, /aria-label/);
  assert.match(script, /currentTime/);
  assert.match(script, /duration/);
  const playHandler = script.match(/playButton\.addEventListener\(['"]click['"][\s\S]*?\n  \}\);/)?.[0];
  assert.ok(playHandler, 'the play action is bound to the explicit control');
  assert.doesNotMatch(script.replace(playHandler, ''), /audio\.play\(\)/, 'audio must not start automatically during initialization');
});

test('playback, seeking, social controls, and single-audio behavior work in the controller', () => {
  function node(initial = {}) {
    const handlers = {};
    const attrs = { ...(initial.attrs || {}) };
    return {
      ...initial,
      handlers,
      attrs,
      dataset: {},
      classList: { values: new Set(), toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); } },
      addEventListener(name, handler) { handlers[name] = handler; },
      setAttribute(name, value) { attrs[name] = value; },
      getAttribute(name) { return attrs[name] ?? null; },
      querySelector(selector) { return initial.querySelector ? initial.querySelector(selector) : initial.children && initial.children[selector] || null; }
    };
  }

  const icon = { textContent: '▶' };
  const playButton = node({ attrs: { 'aria-label': 'Play audio poem', 'aria-pressed': 'false' }, children: { span: icon } });
  const progress = node({ value: '0', max: '100', matches: () => false });
  const current = node({ textContent: '0:00' });
  const total = node({ textContent: '0:00' });
  const status = node({ hidden: true, textContent: '' });
  const likeCount = node({ textContent: '0' });
  const likeIcon = { textContent: '♡' };
  const like = node({ attrs: { 'aria-label': 'Like poem', 'aria-pressed': 'false' }, children: { span: likeIcon } });
  const bookmarkIcon = { textContent: '♧' };
  const bookmark = node({ attrs: { 'aria-label': 'Bookmark poem', 'aria-pressed': 'false' }, children: { span: bookmarkIcon } });
  const comment = node({ attrs: { 'aria-label': 'Comment on poem' } });
  const share = node({ attrs: { 'aria-label': 'Share poem' } });
  const poemAudio = node({ paused: true, ended: false, currentTime: 0, duration: 20, playCount: 0, pauseCount: 0 });
  poemAudio.play = () => {
    poemAudio.playCount += 1;
    poemAudio.paused = false;
    poemAudio.handlers.play();
    return Promise.resolve();
  };
  poemAudio.pause = () => {
    poemAudio.pauseCount += 1;
    poemAudio.paused = true;
    if (poemAudio.handlers.pause) poemAudio.handlers.pause();
  };
  const songAudio = { paused: false, pauseCount: 0, handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; }, pause() { this.pauseCount += 1; this.paused = true; } };
  const video = { paused: false, pauseCount: 0, pause() { this.pauseCount += 1; this.paused = true; } };
  const refs = {
    '.shabdalaya-poetry-audio': poemAudio,
    '.shabdalaya-audio-toggle': playButton,
    '.shabdalaya-poetry-progress': progress,
    '.shabdalaya-current-time': current,
    '.shabdalaya-duration': total,
    '.shabdalaya-poetry-status': status,
    '[aria-label="Like poem"]': like,
    '.shabdalaya-like-count': likeCount,
    '[aria-label="Bookmark poem"]': bookmark,
    '[aria-label="Comment on poem"]': comment,
    '[aria-label="Share poem"]': share
  };
  const post = node({ querySelector(selector) { return refs[selector] || null; } });
  let shared = false;
  const context = {
    document: { querySelector: () => post, querySelectorAll: () => [songAudio], getElementById: () => video },
    navigator: { share: () => { shared = true; return Promise.resolve(); } },
    window: { location: { href: 'http://localhost/poem' } }
  };

  vm.runInNewContext(script, context);
  assert.equal(poemAudio.playCount, 0, 'initialization never autoplayed');
  playButton.handlers.click();
  assert.equal(poemAudio.playCount, 1);
  assert.equal(songAudio.pauseCount, 1, 'other music pauses when the poem starts');
  assert.equal(video.pauseCount, 1, 'the feed video pauses when audio poetry starts');
  assert.equal(playButton.attrs['aria-pressed'], 'true');
  assert.equal(playButton.attrs['aria-label'], 'Pause audio poem');
  assert.equal(icon.textContent, 'Ⅱ');
  assert.equal(post.classList.values.has('is-playing'), true);

  poemAudio.handlers.loadedmetadata();
  assert.equal(progress.max, '20');
  assert.equal(total.textContent, '0:20');
  progress.value = '7.5';
  progress.handlers.input();
  assert.equal(poemAudio.currentTime, 7.5);
  poemAudio.paused = true;
  poemAudio.handlers.pause();
  assert.equal(playButton.attrs['aria-pressed'], 'false');

  like.handlers.click();
  assert.equal(like.attrs['aria-pressed'], 'true');
  assert.equal(likeCount.textContent, '1');
  bookmark.handlers.click();
  assert.equal(bookmark.attrs['aria-pressed'], 'true');
  assert.equal(status.hidden, false);
  comment.handlers.click();
  assert.match(status.textContent, /टिप्पणी/);
  share.handlers.click();
  assert.equal(shared, true);
});
