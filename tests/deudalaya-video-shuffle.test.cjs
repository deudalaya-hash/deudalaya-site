const assert = require('node:assert/strict');
const test = require('node:test');
const { createShuffleCycle, videoKey } = require('../video-shuffle.js');

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

test('cycle and playback history survive recreation during the same browser session', () => {
  const memory = new Map();
  const storage = {
    getItem(key) { return memory.get(key) ?? null; },
    setItem(key, value) { memory.set(key, value); }
  };
  const videos = ids(4);
  const firstSession = createShuffleCycle({ storage, random: () => 0.4 });
  const first = firstSession.start(videos);
  firstSession.markStarted(first);
  const second = firstSession.next(videos, first);

  const resumed = createShuffleCycle({ storage, random: () => 0.1 });
  assert.equal(resumed.start(videos), second);
  assert.equal(resumed.getState().played.includes(first), true);
});

test('a page refresh resumes at an unplayed video instead of replaying the last completed one', () => {
  const memory = new Map();
  const storage = {
    getItem(key) { return memory.get(key) ?? null; },
    setItem(key, value) { memory.set(key, value); }
  };
  const videos = ids(5);
  const beforeRefresh = createShuffleCycle({ storage, random: () => 0.3 });
  const lastVideo = beforeRefresh.start(videos);
  beforeRefresh.markStarted(lastVideo);
  const afterRefresh = createShuffleCycle({ storage, random: () => 0.8 });

  assert.notEqual(afterRefresh.start(videos), lastVideo);
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
