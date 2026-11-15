const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const audioScript = fs.readFileSync(path.join(root, 'deudalaya-audio.js'), 'utf8');

function runAudioScript({ allowPlay = false, preference = null, gateOpen = true } = {}) {
  const playback = { allowPlay };
  const saved = new Map(preference === null ? [] : [['deudalaya-sound-preference', preference]]);
  const documentEvents = {};
  const buttonEvents = {};
  const videoEvents = {};
  const otherVideo = {
    muted: false,
    paused: false,
    pauseCount: 0,
    pause() { this.paused = true; this.pauseCount += 1; }
  };
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
  const rootClasses = new Set(gateOpen ? [] : ['deudalaya-install-required']);
  const document = {
    body: { classList: { contains(name) { return bodyClasses.has(name); } } },
    documentElement: { classList: { contains(name) { return rootClasses.has(name); } } },
    createElement() { return button; },
    getElementById(id) { return id === 'postVideo' ? video : id === 'feed' ? feed : null; },
    querySelectorAll(selector) { return selector === 'video' ? [video, otherVideo] : []; },
    addEventListener(name, handler) { documentEvents[name] = handler; },
    removeEventListener() {}
  };
  const window = {
    muted: false,
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
    setTimeout,
    muted: false,
    paused: false
  };
  vm.runInNewContext(audioScript, context);
  return { button, buttonEvents, context, documentEvents, otherVideo, playback, rootClasses, saved, video, window };
}

test('feed defaults to muted and restores sound only from an explicit enabled preference', () => {
  assert.match(audioScript, /preferenceKey\s*=\s*'deudalaya-sound-preference'/);
  assert.match(audioScript, /muted\s*=\s*savedPreference\s*!==\s*'enabled'/);
  assert.match(html, /<video id="postVideo" playsinline loop preload="none"/);
  assert.match(html, /deudalaya-audio\.js/);
  assert.match(html, /deudalaya-audio\.css/);
});

test('a muted startup offers the existing sound control; explicit enable persists across posts', async () => {
  const page = runAudioScript();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.muted, true, 'new sessions start muted');
  assert.equal(page.video.playCount, 0, 'muted startup does not request audible playback');
  assert.equal(page.button.hidden, false, 'the existing sound action remains available');

  page.playback.allowPlay = true;
  page.buttonEvents.click({ preventDefault() {}, stopPropagation() {} });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.muted, false);
  assert.equal(page.saved.get('deudalaya-sound-preference'), 'enabled');
  assert.equal(page.button.hidden, true, 'successful playback hides the fallback');
  assert.equal(page.otherVideo.muted, true, 'other video elements cannot emit audio at the same time');
  assert.ok(page.otherVideo.pauseCount > 0, 'other video elements are paused when feed sound is enabled');

  page.window.render();
  assert.equal(page.video.muted, false, 'switching to another post keeps sound enabled');

  const restored = runAudioScript({ allowPlay: true, preference: page.saved.get('deudalaya-sound-preference') });
  assert.equal(restored.video.muted, false, 'sound stays enabled in a later session');
});

test('the first feed interaction does not enable sound without an explicit player action', async () => {
  const page = runAudioScript({ allowPlay: true });
  page.documentEvents.pointerup({ target: {} });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.playCount, 0);
  assert.equal(page.saved.has('deudalaya-sound-preference'), false);
  assert.equal(page.video.muted, true);
});

test('opening the install gate does not trigger saved audio playback', async () => {
  const page = runAudioScript({ allowPlay: true, preference: 'enabled', gateOpen: false });
  const gateTarget = { closest(selector) { return selector.includes('#deudalayaInstallLanding') ? {} : null; } };
  assert.equal(page.video.playCount, 0, 'the closed gate blocks feed playback attempts');
  page.rootClasses.delete('deudalaya-install-required');
  page.documentEvents.pointerdown({ target: gateTarget });
  assert.equal(page.window.deudalayaEnableSound(), false, 'gate pointer-down is remembered before other audio handlers run');
  page.documentEvents.pointerup({ target: gateTarget });
  assert.equal(page.window.deudalayaEnableSound(), false, 'the gate gesture cannot call the sound-enable API');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.playCount, 0, 'the gate-opening gesture is not an audio-enable gesture');
});

test('an explicit muted preference survives feed startup', async () => {
  const page = runAudioScript({ preference: 'muted', allowPlay: true });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(page.video.muted, true);
  assert.equal(page.button.hidden, false, 'the explicit sound control remains visible while muted');
});
