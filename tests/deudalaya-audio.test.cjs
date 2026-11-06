const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function runAudioScript({ allowPlay = false, preference = null } = {}) {
  const playback = { allowPlay };
  const saved = new Map(preference === null ? [] : [['deudalaya-sound-preference', preference]]);
  const documentEvents = {};
  const buttonEvents = {};
  const videoEvents = {};
  const button = {
    hidden: true,
    className: '',
    textContent: '',
    type: '',
    addEventListener(name, handler) { buttonEvents[name] = handler; },
    setAttribute() {},
    getClientRects() { return this.hidden ? [] : [{}]; }
  };
  const video = {
    hidden: false,
    src: 'demo.mp4',
    muted: false,
    paused: false,
    playbackRate: 1,
    playCount: 0,
    addEventListener(name, handler) { videoEvents[name] = handler; },
    play() {
      this.playCount += 1;
      return playback.allowPlay ? Promise.resolve() : Promise.reject(new Error('NotAllowedError'));
    },
    pause() { this.paused = true; }
  };
  const feed = { appendChild(child) { child.parentElement = this; } };
  const bodyClasses = new Set();
  const document = {
    body: { classList: { contains(name) { return bodyClasses.has(name); } } },
    createElement() { return button; },
    getElementById(id) { return id === 'postVideo' ? video : id === 'feed' ? feed : null; },
    addEventListener(name, handler) { documentEvents[name] = handler; },
    removeEventListener() {}
  };
  const window = {
    muted: preference === 'muted',
    addEventListener() {},
    render() { video.src = 'next-demo.mp4'; return true; }
  };
  const context = {
    window,
    document,
    localStorage: {
      getItem(key) { return saved.has(key) ? saved.get(key) : null; },
      setItem(key, value) { saved.set(key, value); }
    },
    muted: preference === 'muted',
    paused: false
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'deudalaya-audio.js'), 'utf8'), context);
  return { button, buttonEvents, context, documentEvents, playback, saved, video, window };
}

test('feed defaults to the saved sound preference or sound enabled', () => {
  assert.match(html, /muted=\(\(\)=>\{try\{return localStorage\.getItem\('deudalaya-sound-preference'\)==='muted'\}catch\(e\)\{return false\}\}\)\(\)/);
  assert.match(html, /<video id="postVideo" playsinline preload="none"/);
  assert.match(html, /deudalaya-audio\.js/);
  assert.match(html, /deudalaya-audio\.css/);
});

test('blocked audio autoplay shows a tap button; tapping enables, saves, and retains sound on the next post', async () => {
  const page = runAudioScript();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.button.hidden, false, 'blocked autoplay exposes the sound action');

  page.playback.allowPlay = true;
  page.buttonEvents.click({ preventDefault() {}, stopPropagation() {} });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.muted, false);
  assert.equal(page.saved.get('deudalaya-sound-preference'), 'enabled');
  assert.equal(page.button.hidden, true, 'successful playback hides the fallback');

  page.window.render();
  assert.equal(page.video.muted, false, 'switching to another post keeps sound enabled');

  const restored = runAudioScript({ allowPlay: true, preference: page.saved.get('deudalaya-sound-preference') });
  assert.equal(restored.video.muted, false, 'sound stays enabled in a later session');
});

test('the first feed interaction retries sound playback and remembers the enabled preference', async () => {
  const page = runAudioScript({ allowPlay: true });
  page.documentEvents.pointerup();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(page.video.playCount >= 2, 'startup autoplay is retried after the user gesture');
  assert.equal(page.saved.get('deudalaya-sound-preference'), 'enabled');
  assert.equal(page.video.muted, false);
});

test('an explicit muted preference survives feed startup', async () => {
  const page = runAudioScript({ preference: 'muted', allowPlay: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.muted, true);
  assert.equal(page.button.hidden, true);
});
