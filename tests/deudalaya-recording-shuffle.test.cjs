const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createShuffleCycle,
  getVideoGrouping,
  videoKey
} = require('../video-shuffle.js');

function makeRecording(recordingId, locationId, count = 2, source = 'supabase') {
  return Array.from({ length: count }, (_, index) => source === 'local'
    ? { localId: `${recordingId}-${index + 1}`, videoSrc: `blob:${recordingId}-${index + 1}`, recordingId, locationId }
    : { cloudId: `${recordingId}-${index + 1}`, videoSrc: `https://feed.example/${recordingId}-${index + 1}.mp4`, recordingId, locationId });
}

function grouping(video) {
  assert.equal(typeof getVideoGrouping, 'function', 'video shuffle should expose stable recording and location metadata');
  return getVideoGrouping(video);
}

function consumeCycle(cycle, videos, first) {
  const sequence = [first];
  let current = first;
  for (let index = 1; index < videos.length; index += 1) {
    cycle.markStarted(current);
    current = cycle.next(videos, current);
    sequence.push(current);
  }
  return sequence;
}

test('a full shuffle cycle alternates original recordings whenever another recording remains', () => {
  const videos = [
    ...makeRecording('rec-a', 'north'),
    ...makeRecording('rec-b', 'south'),
    ...makeRecording('rec-c', 'east'),
    ...makeRecording('rec-d', 'west')
  ];
  const cycle = createShuffleCycle({ random: () => 0.37 });
  const sequence = consumeCycle(cycle, videos, cycle.start(videos));

  assert.equal(sequence.length, videos.length);
  for (let index = 1; index < sequence.length; index += 1) {
    assert.notEqual(grouping(sequence[index - 1]).recordingId, grouping(sequence[index]).recordingId);
  }
});

test('a different known location is selected when one remains among eligible recordings', () => {
  const videos = [
    ...makeRecording('rec-north-a', 'north', 3),
    ...makeRecording('rec-north-b', 'north', 3),
    ...makeRecording('rec-south', 'south', 3),
    ...makeRecording('rec-east', 'east', 3),
    ...makeRecording('rec-location-unknown', '', 3)
  ];
  const cycle = createShuffleCycle({ random: () => 0.19 });
  let current = cycle.start(videos);
  const seen = new Set();

  for (let step = 0; step < videos.length; step += 1) {
    const currentKey = videoKey(current);
    cycle.markStarted(currentKey);
    seen.add(currentKey);
    const currentGrouping = grouping(current);
    const remaining = videos.filter(video => !seen.has(videoKey(video)) && videoKey(video) !== currentKey);
    const otherRecordings = remaining.filter(video => grouping(video).recordingId !== currentGrouping.recordingId);
    const eligible = otherRecordings.length ? otherRecordings : remaining;
    const hasDifferentLocation = eligible.some(video => {
      const location = grouping(video).locationId;
      return !location || location !== currentGrouping.locationId;
    });

    const nextKey = cycle.next(videos, currentKey);
    const next = videos.find(video => videoKey(video) === nextKey);
    if (hasDifferentLocation && currentGrouping.locationId) {
      assert.notEqual(grouping(next).locationId, currentGrouping.locationId);
    }
    current = next;
  }
});

test('a shuffle cycle contains every available clip exactly once and includes every recording', () => {
  const videos = [
    ...makeRecording('tila-source', 'tila', 4),
    ...makeRecording('humla-source', 'humla', 3),
    ...makeRecording('other-source', 'unknown-place', 2, 'local')
  ];
  const cycle = createShuffleCycle({ random: () => 0.63 });
  const sequence = consumeCycle(cycle, videos, cycle.start(videos));

  assert.equal(new Set(sequence).size, videos.length);
  assert.deepEqual(new Set(sequence), new Set(videos.map(videoKey)));
  assert.deepEqual(
    new Set(sequence.map(key => grouping(videos.find(video => videoKey(video) === key)).recordingId)),
    new Set(['recording:tila-source', 'recording:humla-source', 'recording:other-source'])
  );
});

test('a new shuffle begins only after the pool is exhausted and avoids a same-recording boundary', () => {
  const videos = [
    ...makeRecording('rec-a', 'north', 2),
    ...makeRecording('rec-b', 'south', 2),
    ...makeRecording('rec-c', 'east', 2)
  ];
  const cycle = createShuffleCycle({ random: () => 0.42 });
  const first = cycle.start(videos);
  const firstSequence = consumeCycle(cycle, videos, first);
  cycle.markStarted(firstSequence.at(-1));
  const boundaryNext = cycle.next(videos, firstSequence.at(-1));
  const secondSequence = [boundaryNext];
  let current = boundaryNext;
  for (let index = 1; index < videos.length; index += 1) {
    cycle.markStarted(current);
    current = cycle.next(videos, current);
    secondSequence.push(current);
  }

  assert.equal(new Set(firstSequence).size, videos.length);
  assert.equal(new Set(secondSequence).size, videos.length);
  assert.notEqual(firstSequence.at(-1), secondSequence[0]);
  assert.notEqual(grouping(firstSequence.at(-1)).recordingId, grouping(secondSequence[0]).recordingId);
  assert.equal(cycle.getState().cycleNumber, 2);
});

test('syncing the unchanged feed preserves the in-progress shuffle sequence', () => {
  const videos = [...makeRecording('rec-a', 'north'), ...makeRecording('rec-b', 'south')];
  const cycle = createShuffleCycle({ random: () => 0.28 });
  const first = cycle.start(videos);
  cycle.markStarted(first);
  const before = cycle.getState();

  cycle.sync(videos);
  const after = cycle.getState();

  assert.deepEqual(after.order, before.order);
  assert.deepEqual(after.played, before.played);
  assert.deepEqual(after.history, before.history);
  assert.equal(after.cycleNumber, before.cycleNumber);
});

test('local and Supabase videos share one shuffled cycle', () => {
  const local = makeRecording('local-event', 'valley', 2, 'local');
  const remote = makeRecording('remote-event', 'mountain', 2, 'supabase');
  const videos = [...local, ...remote];
  const cycle = createShuffleCycle({ random: () => 0.71 });
  const sequence = consumeCycle(cycle, videos, cycle.start(videos));

  assert.equal(sequence.length, 4);
  assert.ok(sequence.some(key => key.startsWith('local:')));
  assert.ok(sequence.some(key => key.startsWith('cloud:')));
  assert.equal(new Set(sequence).size, 4);
});

test('actual Tila and Humla source captions group their clips and expose only named locations', () => {
  const tilaOne = { cloudId: 'tila-1', caption: 'तिला गाउपालिकाका अध्यक्ष भर्सेस सगिता बदुवालको दम्दार (720P_60F — खण्ड 001' };
  const tilaTwo = { cloudId: 'tila-2', caption: 'तिला गाउपालिकाका अध्यक्ष भर्सेस सगिता बदुवालको दम्दार (720P_60F — खण्ड 069' };
  const humlaOne = { cloudId: 'humla-1', caption: 'बिपना र शँकर मल्लको हुम्ला रोडिकोट को तहल्का(720P_HD) — खण्ड 001' };
  const humlaTwo = { cloudId: 'humla-2', caption: 'बिपना र शँकर मल्लको हुम्ला रोडिकोट को तहल्का(720P_HD) — खण्ड 053' };

  assert.equal(grouping(tilaOne).recordingId, grouping(tilaTwo).recordingId);
  assert.equal(grouping(humlaOne).recordingId, grouping(humlaTwo).recordingId);
  assert.notEqual(grouping(tilaOne).recordingId, grouping(humlaOne).recordingId);
  assert.equal(grouping(tilaOne).locationId, 'तिला गाउँपालिका');
  assert.equal(grouping(humlaOne).locationId, 'हुम्ला रोडिकोट');
});

test('existing Supabase clip captions identify the Deuda program and Deudasan recording groups without invented locations', () => {
  const deudaOne = { cloudId: 'deuda-1', caption: 'देउडा कार्यक्रम — क्लिप 1' };
  const deudaSix = { cloudId: 'deuda-6', caption: 'देउडा कार्यक्रम — क्लिप 6' };
  const eventOne = { cloudId: 'event-1', caption: 'देउडासाँझ ८ — Rita Bisht, Ayush Dhami and Deuda performers · clip 001' };
  const eventLast = { cloudId: 'event-48', caption: 'देउडासाँझ ८ — Rita Bisht, Ayush Dhami and Deuda performers · clip 048' };

  assert.equal(grouping(deudaOne).recordingId, grouping(deudaSix).recordingId);
  assert.equal(grouping(eventOne).recordingId, grouping(eventLast).recordingId);
  assert.notEqual(grouping(deudaOne).recordingId, grouping(eventOne).recordingId);
  assert.equal(grouping(deudaOne).locationId, '');
  assert.equal(grouping(eventOne).locationId, '');
});

test('the available Tila and Humla processing reports group all 122 actual clips into two recordings and locations', {
  skip: !fs.existsSync(path.resolve(__dirname, '../video-library/runs/resume-20261115/tila/processing-report.json'))
    || !fs.existsSync(path.resolve(__dirname, '../video-library/runs/resume-20261115/humla/processing-report.json'))
}, () => {
  const reportPaths = ['tila', 'humla'].map(name => path.resolve(__dirname, `../video-library/runs/resume-20261115/${name}/processing-report.json`));
  const clips = reportPaths.flatMap(reportPath => {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    return report.clips.map(clip => ({
      videoSrc: clip.output,
      caption: clip.caption,
      original_filename: report.source.split(/[\\/]/).pop()
    }));
  });
  const pool = clips.map((clip, index) => ({
    cloudId: `actual-library-clip-${index + 1}`,
    caption: clip.caption,
    original_filename: clip.original_filename
  }));
  const cycle = createShuffleCycle({ random: () => 0.31 });
  const sequence = consumeCycle(cycle, pool, cycle.start(pool));
  const recordingIds = new Set(clips.map(clip => grouping(clip).recordingId));
  const locations = new Set(clips.map(clip => grouping(clip).locationId).filter(Boolean));

  assert.equal(clips.length, 122);
  assert.equal(recordingIds.size, 2);
  assert.deepEqual(locations, new Set(['तिला गाउँपालिका', 'हुम्ला रोडिकोट']));
  assert.equal(new Set(sequence).size, 122);
  for (let index = 1; index < sequence.length; index += 1) {
    const previous = pool.find(clip => videoKey(clip) === sequence[index - 1]);
    const current = pool.find(clip => videoKey(clip) === sequence[index]);
    const previousRecording = grouping(previous).recordingId;
    const currentRecording = grouping(current).recordingId;
    if (previousRecording === currentRecording) {
      const alreadyPlayed = new Set(sequence.slice(0, index));
      const otherRecordingRemains = pool.some(clip =>
        grouping(clip).recordingId !== previousRecording && !alreadyPlayed.has(videoKey(clip))
      );
      assert.equal(otherRecordingRemains, false, 'a recording may repeat only after all other recordings have been exhausted');
    }
  }
});
