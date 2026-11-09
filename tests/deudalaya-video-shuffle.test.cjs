const assert = require('node:assert/strict');
const test = require('node:test');
const { createShuffleCycle, isDuplicatePost, videoKey, selectRandomStartupVideo } = require('../video-shuffle.js');

function ids(count) {
  return Array.from({ length: count }, (_, index) => `video-${index + 1}`);
}

test('twenty videos play exactly once in each of two shuffled cycles', () => {
  const videos = ids(20);
  const cycle = createShuffleCycle({ random: Math.random });
  let current = cycle.start(videos);
  const firstCycle = [];
  for (let index = 0; index < videos.length; index += 1) {
    firstCycle.push(current);
    cycle.markStarted(current);
    current = cycle.next(videos, current);
  }
  const secondCycle = [current];
  for (let index = 1; index < videos.length; index += 1) {
    cycle.markStarted(current);
    current = cycle.next(videos, current);
    secondCycle.push(current);
  }

  assert.equal(new Set(firstCycle).size, 20);
  assert.equal(new Set(secondCycle).size, 20);
  assert.deepEqual(new Set(firstCycle), new Set(videos));
  assert.deepEqual(new Set(secondCycle), new Set(videos));
  assert.notDeepEqual(firstCycle, secondCycle);
});

test('an unstarted skipped video is deferred until the other videos have played', () => {
  const videos = ids(4);
  const cycle = createShuffleCycle({ random: () => 0.5 });
  const first = cycle.start(videos);
  const second = cycle.next(videos, first);
  assert.notEqual(second, first);
  cycle.markStarted(second);
  const third = cycle.next(videos, second);
  cycle.markStarted(third);
  const fourth = cycle.next(videos, third);
  cycle.markStarted(fourth);
  assert.equal(cycle.next(videos, fourth), first);
});

test('returning to a played video does not count it again', () => {
  const videos = ids(4);
  const cycle = createShuffleCycle({ random: () => 0.5 });
  const first = cycle.start(videos);
  cycle.markStarted(first);
  const second = cycle.next(videos, first);
  cycle.markStarted(second);
  assert.equal(cycle.previous(videos), first);
  assert.equal(cycle.markStarted(first), false);
  assert.equal(cycle.next(videos, first), second, 'scrolling forward restores the existing session history');
});

test('selecting an old video does not replay its old future while unplayed videos remain', () => {
  const videos = ids(5);
  const cycle = createShuffleCycle({ random: () => 0.4 });
  const first = cycle.start(videos);
  cycle.markStarted(first);
  const second = cycle.next(videos, first);
  cycle.markStarted(second);
  cycle.select(videos, first);

  assert.notEqual(cycle.next(videos, first), second);
});

test('new and deleted videos are reconciled without duplicate cycle entries', () => {
  const cycle = createShuffleCycle({ random: () => 0.42 });
  const firstList = ids(5);
  let current = cycle.start(firstList);
  cycle.markStarted(current);
  const updatedList = ['video-1', 'video-2', 'video-3', 'video-5', 'video-new'];
  const next = cycle.next(updatedList, current);
  assert.notEqual(next, 'video-4');
  const snapshot = cycle.getState();
  assert.equal(snapshot.order.length, 5);
  assert.equal(new Set(snapshot.order).size, 5);
  assert.ok(snapshot.order.includes('video-new'));
  assert.ok(!snapshot.order.includes('video-4'));
});

test('the next cycle is shuffled differently even with a repeatable random source', () => {
  const videos = ids(3);
  const cycle = createShuffleCycle({ random: () => 0 });
  const firstOrder = [];
  let current = cycle.start(videos);
  for (let index = 0; index < videos.length; index += 1) {
    firstOrder.push(current);
    cycle.markStarted(current);
    current = cycle.next(videos, current);
  }
  assert.notDeepEqual(cycle.getState().order, firstOrder);
});

test('video identity de-duplicates repeated feed entries that share the same source', () => {
  assert.equal(videoKey({ videoSrc: '/assets/clip.mp4?cache=old' }), videoKey({ videoSrc: '/assets/clip.mp4?cache=new' }));
  assert.equal(videoKey({ localId: 'local-1', videoSrc: 'blob:old' }), 'local:local-1');
  const cycle = createShuffleCycle({ random: () => 0.5 });
  cycle.start(['/assets/clip.mp4', '/assets/clip.mp4', '/assets/other.mp4']);
  assert.equal(cycle.getState().order.length, 2);
});

test('remote posts matching an existing local clip caption or file name are recognized as duplicates', () => {
  const local = { videoSrc: 'assets/deudalaya-video-2026-11-04-clip-03.mp4', caption: 'देउडालयको सांस्कृतिक झलक — नयाँ प्रस्तुति' };
  assert.equal(isDuplicatePost({ media_path: 'uploads/deudalaya-video-2026-11-04-clip-03.mp4', caption: 'Different caption' }, [local]), true);
  assert.equal(isDuplicatePost({ media_path: 'uploads/new.mp4', caption: 'देउडालयको सांस्कृतिक झलक — नयाँ प्रस्तुति' }, [local]), true);
  assert.equal(isDuplicatePost({ media_path: 'uploads/new.mp4', caption: 'अर्को भिडियो' }, [local]), false);
});

test('startup chooses uniformly from the combined category pool and avoids the last opening', () => {
  const videos = [
    { videoSrc: '/deuda.mp4', feedCategory: 'देउडा' },
    { videoSrc: '/village.mp4', feedCategory: 'गाउँघर' },
    { videoSrc: '/city.mp4', feedCategory: 'शहर' }
  ];
  assert.equal(selectRandomStartupVideo(videos, '', () => 0), videoKey(videos[0]));
  assert.equal(selectRandomStartupVideo(videos, videoKey(videos[0]), () => 0), videoKey(videos[1]));
  assert.equal(selectRandomStartupVideo(videos, videoKey(videos[1]), () => 0.99), videoKey(videos[2]));
});

test('startup selection skips unpublished, deleted, corrupted and duplicate entries', () => {
  const videos = [
    { videoSrc: '/draft.mp4', published: false },
    { videoSrc: '/deleted.mp4', deleted_at: '2026-01-01' },
    { videoSrc: '/broken.mp4', corrupted: true },
    { videoSrc: '/valid.mp4', published: true },
    { videoSrc: '/valid.mp4?cache=1', published: true }
  ];
  assert.equal(selectRandomStartupVideo(videos, '', () => 0), videoKey(videos[3]));
});

test('startup choice is remembered between app openings when storage is available', () => {
  const memory = new Map();
  const storage = {
    getItem(key) { return memory.get(key) ?? null; },
    setItem(key, value) { memory.set(key, value); }
  };
  const videos = ids(3);
  const first = require('../video-shuffle.js').selectAndRememberStartupVideo(videos, storage, () => 0);
  const second = require('../video-shuffle.js').selectAndRememberStartupVideo(videos, storage, () => 0);
  assert.notEqual(second, first);
});

test('reopening starts a fresh random cycle and persists its prior startup across reloads', () => {
  const memory = new Map();
  const sessionMemory = new Map();
  const makeStorage = store => ({
    getItem(key) { return store.get(key) ?? null; },
    setItem(key, value) { store.set(key, value); },
    removeItem(key) { store.delete(key); }
  });
  const videos = ids(4);
  const firstSession = createShuffleCycle({ storage: makeStorage(sessionMemory), startupStorage: makeStorage(memory), random: () => 0.4 });
  const first = firstSession.start(videos);
  firstSession.markStarted(first);

  const reopened = createShuffleCycle({ storage: makeStorage(new Map()), startupStorage: makeStorage(memory), random: () => 0.1 });
  const nextOpening = reopened.start(videos);
  assert.notEqual(nextOpening, first);
  assert.deepEqual(reopened.getState().played, []);
  assert.deepEqual(reopened.getState().history, [nextOpening]);
});

test('session navigation history keeps the same video when it begins a later completed cycle', () => {
  const memory = new Map();
  const storage = {
    getItem(key) { return memory.get(key) ?? null; },
    setItem(key, value) { memory.set(key, value); }
  };
  const videos = ids(1);
  const firstSession = createShuffleCycle({ storage, random: () => 0.2 });
  const first = firstSession.start(videos);
  firstSession.markStarted(first);
  const nextCycle = firstSession.next(videos, first);
  firstSession.markStarted(nextCycle);

  const resumed = createShuffleCycle({ storage, random: () => 0.7 });
  assert.equal(resumed.getState().history.length, 2);
  assert.equal(resumed.getState().history[0], resumed.getState().history[1]);
});
