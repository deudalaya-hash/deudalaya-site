const assert = require('node:assert/strict');
const test = require('node:test');
const { createVideoValidator, createFeedVideoRecovery, applyCenteredVideoLayout, calculateContainedVideoSize, fitCenteredVideo, selectValidatedStartupVideo, videoKey } = require('../video-shuffle.js');

function fakeMedia(outcome) {
  const listeners = new Map();
  return {
    preload: '', muted: false, playsInline: false, readyState: 0,
    videoWidth: 0, videoHeight: 0, duration: NaN, src: '',
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
    removeAttribute(name) { if (name === 'src') this.src = ''; },
    pause() {},
    load() {
      if (outcome === 'valid') {
        this.readyState = 1; this.videoWidth = 1080; this.videoHeight = 1920; this.duration = 8;
        queueMicrotask(() => listeners.get('loadedmetadata')?.());
      } else if (outcome === 'corrupt-metadata') {
        this.readyState = 1; this.videoWidth = 0; this.videoHeight = 0; this.duration = NaN;
        queueMicrotask(() => listeners.get('loadedmetadata')?.());
      } else if (outcome === 'error') {
        queueMicrotask(() => listeners.get('error')?.());
      }
    }
  };
}

test('metadata validation accepts playable video and caches it for the current session', async () => {
  let created = 0;
  const validator = createVideoValidator({ createVideo: () => { created += 1; return fakeMedia('valid'); } });
  assert.equal(await validator.validate('/assets/portrait.mp4'), true);
  assert.equal(await validator.validate('/assets/portrait.mp4'), true);
  assert.equal(created, 1);
  assert.equal(validator.isValid('/assets/portrait.mp4'), true);
});

test('missing URL, unavailable media, and corrupt metadata are rejected', async () => {
  let created = 0;
  const unavailable = createVideoValidator({ createVideo: () => { created += 1; return fakeMedia('error'); } });
  assert.equal(await unavailable.validate(''), false);
  assert.equal(created, 0);
  assert.equal(await unavailable.validate('/missing.mp4'), false);
  assert.equal(unavailable.isKnownBroken('/missing.mp4'), true);

  const corrupt = createVideoValidator({ createVideo: () => fakeMedia('corrupt-metadata') });
  assert.equal(await corrupt.validate('/corrupt.mp4'), false);
});

test('failed validation is cached only for this validator session', async () => {
  let attempts = 0;
  const firstSession = createVideoValidator({ createVideo: () => { attempts += 1; return fakeMedia('error'); } });
  assert.equal(await firstSession.validate('/temporary.mp4'), false);
  assert.equal(await firstSession.validate('/temporary.mp4'), false);
  assert.equal(attempts, 1);

  const nextSession = createVideoValidator({ createVideo: () => fakeMedia('valid') });
  assert.equal(await nextSession.validate('/temporary.mp4'), true);
});

test('metadata timeout is bounded, coalesced, and retried in a later session', async () => {
  let created = 0;
  const stalledSession = createVideoValidator({ createVideo: () => { created += 1; return fakeMedia('stalled'); }, timeoutMs: 5 });
  const result = await Promise.all([stalledSession.validate('/slow.mp4'), stalledSession.validate('/slow.mp4')]);
  assert.deepEqual(result, [false, false]);
  assert.equal(created, 1);
  const nextSession = createVideoValidator({ createVideo: () => fakeMedia('valid') });
  assert.equal(await nextSession.validate('/slow.mp4'), true);
});

test('a late metadata result cannot overwrite a playback failure cached for the session', async () => {
  let onMetadata;
  const media = fakeMedia('stalled');
  media.addEventListener = (name, callback) => { if (name === 'loadedmetadata') onMetadata = callback; };
  const validator = createVideoValidator({ createVideo: () => media, timeoutMs: 50 });
  const pending = validator.validate('/race.mp4');
  validator.markBroken('/race.mp4');
  media.readyState = 1; media.videoWidth = 640; media.videoHeight = 360; media.duration = 5;
  onMetadata();
  assert.equal(await pending, true);
  assert.equal(validator.isKnownBroken('/race.mp4'), true);
});

test('startup selection rejects failed candidates and remembers the first valid one', async () => {
  const memory = new Map();
  const storage = { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
  let activeSource = '';
  const validator = createVideoValidator({ createVideo: () => fakeMedia(activeSource === '/broken.mp4' ? 'error' : 'valid') });
  const sourceValidator = {
    validate(url) { activeSource = url; return validator.validate(url); },
    isKnownBroken: url => validator.isKnownBroken(url)
  };
  const videos = [
    { videoSrc: '/broken.mp4', feedCategory: 'देउडा' },
    { videoSrc: '/working.mp4', feedCategory: 'गाउँघर' }
  ];
  const selected = await selectValidatedStartupVideo(videos, sourceValidator, storage, () => 0, 'last');
  assert.equal(selected, videoKey(videos[1]));
  assert.equal(memory.get('last'), selected);
  assert.equal(validator.isKnownBroken('/broken.mp4'), true);
});

test('playback recovery skips broken items once and stops after a bounded feed scan', async () => {
  const videos = [{ videoSrc: '/bad-a.mp4' }, { videoSrc: '/bad-b.mp4' }, { videoSrc: '/good.mp4' }];
  const outcomes = new Map([['/bad-a.mp4', 'error'], ['/bad-b.mp4', 'error'], ['/good.mp4', 'valid']]);
  const validator = createVideoValidator({ createVideo: () => fakeMedia(outcomes.get(activeSource)) });
  let activeSource = '';
  let currentIndex = 0;
  let selectedIndex = -1;
  let emptyCount = 0;
  const recovery = createFeedVideoRecovery({
    validator,
    getVideos: () => videos,
    getCurrentIndex: () => currentIndex,
    getNextIndex: from => (from + 1) % videos.length,
    onSelect: next => { currentIndex = next; selectedIndex = next; },
    onExhausted: () => { emptyCount += 1; },
    validate: url => { activeSource = url; return validator.validate(url); }
  });

  assert.equal(await recovery.recover('/bad-a.mp4'), 2);
  assert.equal(selectedIndex, 2);
  assert.equal(emptyCount, 0);
});

test('playback recovery does not spin when every feed video is broken', async () => {
  const videos = [{ videoSrc: '/bad-a.mp4' }, { videoSrc: '/bad-b.mp4' }];
  const validator = createVideoValidator({ createVideo: () => fakeMedia('error') });
  let currentIndex = 0;
  let scans = 0;
  const recovery = createFeedVideoRecovery({
    validator,
    getVideos: () => videos,
    getCurrentIndex: () => currentIndex,
    getNextIndex: from => { scans += 1; return (from + 1) % videos.length; },
    onSelect: next => { currentIndex = next; },
    onExhausted() {}
  });

  assert.equal(await recovery.recover('/bad-a.mp4'), null);
  assert.ok(scans <= videos.length);
});

test('centered video layout uses a flex container, contained media, and centered object position', () => {
  const styles = () => ({ values: {}, setProperty(name, value, priority) { this.values[name] = { value, priority }; } });
  const container = { style: styles() };
  const video = { style: styles() };
  assert.equal(applyCenteredVideoLayout(container, video), true);
  assert.equal(container.style.values.display.value, 'flex');
  assert.equal(container.style.values['align-items'].value, 'center');
  assert.equal(container.style.values['justify-content'].value, 'center');
  assert.equal(video.style.values['object-fit'].value, 'contain');
  assert.equal(video.style.values['object-position'].value, 'center center');
  assert.equal(video.style.values.position.value, 'relative');
});

test('portrait, landscape and square frames fit without cropping or distortion', () => {
  const area = { width: 400, height: 700 };
  const cases = [
    { name: 'portrait', width: 1080, height: 1890, expected: { width: 400, height: 700 } },
    { name: 'landscape', width: 1920, height: 1080, expected: { width: 400, height: 225 } },
    { name: 'square', width: 1080, height: 1080, expected: { width: 400, height: 400 } }
  ];
  for (const item of cases) {
    const style = { values: {}, setProperty(name, value) { this.values[name] = value; } };
    const container = { getBoundingClientRect: () => area };
    const video = { videoWidth: item.width, videoHeight: item.height, style };
    const actual = fitCenteredVideo(container, video);
    assert.ok(Math.abs(actual.width - item.expected.width) < 0.01, item.name + ' width');
    assert.ok(Math.abs(actual.height - item.expected.height) < 0.01, item.name + ' height');
    assert.ok(Math.abs(actual.width / actual.height - item.width / item.height) < 0.0001, item.name + ' aspect ratio');
    assert.ok(style.values.width.endsWith('px'));
    assert.equal(calculateContainedVideoSize(item.width, item.height, area.width, area.height).width, actual.width);
  }
});
