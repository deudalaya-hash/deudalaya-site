(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DeudalayaVideoShuffle = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var STORAGE_KEY = 'deudalaya-video-shuffle-v2';
  var STARTUP_STORAGE_KEY = 'deudalaya-last-startup-video-v1';
  var groupingByVideoKey = new Map();

  function normalizedLabel(value) {
    return String(value == null ? '' : value).normalize('NFKC').replace(/\\/g, '/').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
  }

  function sourceTitle(value) {
    return String(value == null ? '' : value)
      .normalize('NFKC')
      .replace(/\\/g, '/')
      .split(/[?#]/, 1)[0]
      .split('/')
      .pop()
      .replace(/\.(?:mp4|webm|mov|m4v|mkv|avi)$/i, '')
      .replace(/\s*(?:[·|—–-]\s*)?(?:clip|क्लिप|खण्ड|भाग|part|segment)\s*0*\d+\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function firstMetadataValue(video, fields) {
    for (var i = 0; i < fields.length; i += 1) {
      var value = video && video[fields[i]];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
  }

  function inferNamedLocation(video) {
    var source = [
      firstMetadataValue(video, ['original_filename', 'originalFilename', 'source_filename', 'sourceFilename', 'file_name', 'fileName']),
      firstMetadataValue(video, ['caption', 'title'])
    ].join(' ').normalize('NFKC');

    // These locations are named directly in the corresponding source titles.
    // No location is inferred from performer names or from an unknown caption.
    if (/तिला\s*(?:गाउपालिका|गाउँपालिका)/u.test(source)) return 'तिला गाउँपालिका';
    if (/हुम्ला\s+रोडिकोट/u.test(source)) return 'हुम्ला रोडिकोट';
    if (/बझाङ\s+तल्कोट/u.test(source)) return 'बझाङ तल्कोट';
    if (/(?:शङ्खमूल|शंखमूल)/u.test(source)) return 'शङ्खमूल';
    return '';
  }

  function resolveVideoGrouping(video, key) {
    var explicitRecording = firstMetadataValue(video, [
      'recordingId', 'recording_id', 'sourceRecordingId', 'source_recording_id',
      'originalRecordingId', 'original_recording_id', 'source_sha256', 'sourceSha256'
    ]);
    var filename = firstMetadataValue(video, [
      'original_filename', 'originalFilename', 'source_filename', 'sourceFilename',
      'file_name', 'fileName'
    ]);
    var caption = firstMetadataValue(video, ['caption', 'title']);
    var captionTitle = sourceTitle(caption);
    var captionHasClipNumber = /(?:clip|क्लिप|खण्ड|भाग|part|segment)\s*0*\d+\s*$/iu.test(caption);
    var localSource = !video?.cloudId ? firstMetadataValue(video, ['videoSrc']) : '';
    var source = filename
      ? sourceTitle(filename)
      : captionHasClipNumber
        ? captionTitle
        : localSource
          ? sourceTitle(localSource)
          : '';
    var recordingId = explicitRecording
      ? 'recording:' + normalizedLabel(explicitRecording)
      : source
        ? 'recording:' + normalizedLabel(source)
        : 'clip:' + key;
    var location = firstMetadataValue(video, [
      'locationId', 'location_id', 'location', 'locationName', 'location_name',
      'sourceLocation', 'source_location', 'place', 'placeName', 'place_name', 'district'
    ]);
    if (!location) location = inferNamedLocation(video);
    return { recordingId: recordingId, locationId: normalizedLabel(location) };
  }

  function videoKey(video) {
    if (typeof video === 'string') return video;
    if (!video || typeof video !== 'object') return '';
    var key = video.localId
      ? 'local:' + String(video.localId)
      : video.cloudId
        ? 'cloud:' + String(video.cloudId)
        : video.videoSrc
          ? 'source:' + String(video.videoSrc).split(/[?#]/, 1)[0]
          : '';
    if (key) groupingByVideoKey.set(key, resolveVideoGrouping(video, key));
    return key;
  }

  function getVideoGrouping(videoOrKey) {
    if (typeof videoOrKey === 'string') {
      return groupingByVideoKey.get(videoOrKey) || { recordingId: 'clip:' + videoOrKey, locationId: '' };
    }
    var key = videoKey(videoOrKey);
    return key ? groupingByVideoKey.get(key) : { recordingId: '', locationId: '' };
  }

  function isDuplicatePost(candidate, existingPosts) {
    if (!candidate || typeof candidate !== 'object') return false;
    var caption = String(candidate.caption || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    var source = String(candidate.videoSrc || candidate.media_path || '').split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop().toLocaleLowerCase();
    if (!caption && !source) return false;
    return (Array.isArray(existingPosts) ? existingPosts : []).some(function (post) {
      if (!post || typeof post !== 'object') return false;
      var otherCaption = String(post.caption || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
      var otherSource = String(post.videoSrc || post.media_path || '').split(/[?#]/, 1)[0].replace(/\\/g, '/').split('/').pop().toLocaleLowerCase();
      return !!((caption && otherCaption && caption === otherCaption) || (source && otherSource && source === otherSource));
    });
  }

  function selectRandomStartupVideo(values, previousId, random) {
    random = typeof random === 'function' ? random : Math.random;
    var seen = new Set();
    var ids = (Array.isArray(values) ? values : []).filter(function (value) {
      if (!value || typeof value !== 'object') return true;
      var status = String(value.status || '').toLowerCase();
      return value.published !== false && value.isPublished !== false && !value.deleted && !value.deleted_at && !value.deletedAt && !value.corrupted && !value.isCorrupted && status !== 'draft' && status !== 'unpublished' && status !== 'deleted' && status !== 'corrupt';
    }).map(function (value) {
      return typeof value === 'string' ? value : videoKey(value);
    }).filter(function (id) {
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    if (!ids.length) return null;
    var candidates = ids.length > 1 ? ids.filter(function (id) { return id !== previousId; }) : ids;
    var value = Number(random());
    if (!Number.isFinite(value)) value = 0;
    var index = Math.min(candidates.length - 1, Math.max(0, Math.floor(value * candidates.length)));
    return candidates[index] || null;
  }

  function selectAndRememberStartupVideo(values, storage, random, storageKey) {
    storageKey = storageKey || STARTUP_STORAGE_KEY;
    var previousId = null;
    if (storage) {
      try { previousId = storage.getItem(storageKey); } catch (_) {}
    }
    var selectedId = selectRandomStartupVideo(values, previousId, random);
    if (selectedId && storage) {
      try { storage.setItem(storageKey, selectedId); } catch (_) {}
    }
    return selectedId;
  }

  async function selectValidatedStartupVideo(values, validator, storage, random, storageKey) {
    storageKey = storageKey || STARTUP_STORAGE_KEY;
    var previousId = null;
    if (storage) {
      try { previousId = storage.getItem(storageKey); } catch (_) {}
    }
    var remaining = Array.isArray(values) ? values.slice() : [];
    while (remaining.length) {
      var selectedId = selectRandomStartupVideo(remaining, previousId, random);
      if (!selectedId) return null;
      var candidate = remaining.find(function (value) {
        return (typeof value === 'string' ? value : videoKey(value)) === selectedId;
      });
      var source = candidate && typeof candidate === 'object' ? candidate.videoSrc || candidate.media_path : candidate;
      if (source && validator && await validator.validate(source)) {
        if (storage) {
          try { storage.setItem(storageKey, selectedId); } catch (_) {}
        }
        return selectedId;
      }
      remaining = remaining.filter(function (value) {
        return (typeof value === 'string' ? value : videoKey(value)) !== selectedId;
      });
    }
    return null;
  }

  function createStartupSelection() {
    var pending = null;
    var completed = false;
    var selectedId = null;
    function select(values, validator, storage, random, storageKey) {
      if (completed) return Promise.resolve(selectedId);
      if (pending) return pending;
      pending = selectValidatedStartupVideo(values, validator, storage, random, storageKey)
        .then(function (id) {
          selectedId = id;
          completed = !!id;
          return id;
        }, function (error) {
          completed = false;
          throw error;
        })
        .finally(function () { pending = null; });
      return pending;
    }
    return {
      select: select,
      remember: function (id) { if (pending) return false; selectedId = id || null; completed = !!id; return true; },
      isComplete: function () { return completed; },
      selected: function () { return selectedId; }
    };
  }

  function normalizeVideoUrl(source) {
    if (typeof source !== 'string' || !source.trim()) return '';
    try {
      if (typeof document !== 'undefined' && document.baseURI) return new URL(source, document.baseURI).href;
      return source.trim().split('#', 1)[0];
    } catch (_) { return ''; }
  }

  function hasVideoMetadata(video) {
    return !!video && Number(video.readyState) >= 1 && Number(video.videoWidth) > 0 && Number(video.videoHeight) > 0 && Number.isFinite(Number(video.duration)) && Number(video.duration) > 0;
  }

  function createVideoValidator(options) {
    options = options || {};
    var createVideo = options.createVideo || function () {
      return typeof document !== 'undefined' ? document.createElement('video') : null;
    };
    var timeoutMs = Math.max(1, Number(options.timeoutMs) || 8000);
    var cache = new Map();
    var pending = new Map();

    function validate(source) {
      var key = normalizeVideoUrl(source);
      if (!key) return Promise.resolve(false);
      if (cache.has(key)) return Promise.resolve(cache.get(key));
      if (pending.has(key)) return pending.get(key);

      var resolveValidation;
      var task = new Promise(function (resolve) { resolveValidation = resolve; });
      pending.set(key, task);
      var video;
      var timer;
      var finished = false;

      function finish(isValid) {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        if (video) {
          video.removeEventListener('loadedmetadata', onMetadata);
          video.removeEventListener('error', onError);
          try { video.pause(); } catch (_) {}
          try { video.removeAttribute('src'); video.load(); } catch (_) {}
        }
        if (pending.get(key) === task) {
          cache.set(key, !!isValid);
          pending.delete(key);
        }
        resolveValidation(!!isValid);
      }

      function onMetadata() { finish(hasVideoMetadata(video)); }
      function onError() { finish(false); }

      try {
        video = createVideo();
        if (!video) return finish(false);
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.addEventListener('loadedmetadata', onMetadata);
        video.addEventListener('error', onError);
        timer = setTimeout(function () { finish(false); }, timeoutMs);
        video.src = key;
        video.load();
      } catch (_) { finish(false); }
      return task;
    }

    function isValid(source) {
      var key = normalizeVideoUrl(source);
      return !!key && cache.get(key) === true;
    }

    function isKnownBroken(source) {
      var key = normalizeVideoUrl(source);
      return !!key && cache.get(key) === false;
    }

    function markBroken(source) {
      var key = normalizeVideoUrl(source);
      if (!key) return false;
      cache.set(key, false);
      pending.delete(key);
      return true;
    }

    function rememberValid(source, video) {
      var key = normalizeVideoUrl(source);
      if (!key) return false;
      var valid = hasVideoMetadata(video);
      cache.set(key, valid);
      pending.delete(key);
      return valid;
    }

    return { validate: validate, isValid: isValid, isKnownBroken: isKnownBroken, markBroken: markBroken, rememberValid: rememberValid };
  }

  function applyCenteredVideoLayout(container, video) {
    if (!container || !container.style || !video || !video.style || typeof container.style.setProperty !== 'function' || typeof video.style.setProperty !== 'function') return false;
    container.style.setProperty('display', 'flex', 'important');
    container.style.setProperty('align-items', 'center', 'important');
    container.style.setProperty('justify-content', 'center', 'important');
    video.style.setProperty('position', 'relative', 'important');
    video.style.setProperty('inset', 'auto', 'important');
    video.style.setProperty('width', '100%', 'important');
    video.style.setProperty('height', 'auto', 'important');
    video.style.setProperty('max-width', '100%', 'important');
    video.style.setProperty('max-height', '100%', 'important');
    video.style.setProperty('object-fit', 'contain', 'important');
    video.style.setProperty('object-position', 'center center', 'important');
    return true;
  }

  function calculateContainedVideoSize(videoWidth, videoHeight, containerWidth, containerHeight) {
    videoWidth = Number(videoWidth);
    videoHeight = Number(videoHeight);
    containerWidth = Number(containerWidth);
    containerHeight = Number(containerHeight);
    if (![videoWidth, videoHeight, containerWidth, containerHeight].every(Number.isFinite) || videoWidth <= 0 || videoHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) return null;
    var scale = Math.min(containerWidth / videoWidth, containerHeight / videoHeight);
    return { width: videoWidth * scale, height: videoHeight * scale, scale: scale };
  }

  function fitCenteredVideo(container, video) {
    if (!container || !video || typeof container.getBoundingClientRect !== 'function' || !video.style || typeof video.style.setProperty !== 'function') return null;
    var bounds = container.getBoundingClientRect();
    var size = calculateContainedVideoSize(video.videoWidth, video.videoHeight, bounds.width, bounds.height);
    if (!size) return null;
    var portrait = Number(video.videoHeight) > Number(video.videoWidth);
    container.style.setProperty('align-items', portrait ? 'flex-start' : 'center', 'important');
    video.style.setProperty('width', size.width + 'px', 'important');
    video.style.setProperty('height', size.height + 'px', 'important');
    video.style.setProperty('align-self', portrait ? 'flex-start' : 'center', 'important');
    video.style.setProperty('object-position', portrait ? 'center top' : 'center center', 'important');
    return size;
  }

  function createFeedVideoRecovery(options) {
    options = options || {};
    var recovering = false;
    async function recover(failedSource) {
      if (options.validator) options.validator.markBroken(failedSource);
      if (recovering) return null;
      recovering = true;
      try {
        var list = typeof options.getVideos === 'function' ? options.getVideos() : [];
        var count = Array.isArray(list) ? list.length : 0;
        var initialIndex = typeof options.getCurrentIndex === 'function' ? options.getCurrentIndex() : -1;
        var cursor = initialIndex;
        var visited = new Set(cursor >= 0 ? [cursor] : []);
        for (var attempt = 0; attempt < count; attempt += 1) {
          var next = typeof options.getNextIndex === 'function' ? options.getNextIndex(cursor) : -1;
          if (!Number.isInteger(next) || next < 0 || next >= count || visited.has(next)) break;
          visited.add(next);
          cursor = next;
          var candidate = list[next];
          var source = candidate && (candidate.videoSrc || candidate.media_path);
          if (!source || !options.validator || options.validator.isKnownBroken(source)) continue;
          var isValid = typeof options.validate === 'function' ? await options.validate(source) : await options.validator.validate(source);
          if (!isValid) {
            options.validator.markBroken(source);
            continue;
          }
          if (typeof options.getCurrentIndex === 'function' && options.getCurrentIndex() !== initialIndex) return null;
          if (typeof options.onSelect === 'function') options.onSelect(next, candidate);
          return next;
        }
        if (typeof options.getCurrentIndex === 'function' && options.getCurrentIndex() !== initialIndex) return null;
        if (typeof options.onExhausted === 'function') options.onExhausted();
        return null;
      } finally { recovering = false; }
    }
    return { recover: recover, isRecovering: function () { return recovering; } };
  }

  function createShuffleCycle(options) {
    options = options || {};
    var random = typeof options.random === 'function' ? options.random : Math.random;
    var storage = options.storage || null;
    var storageKey = options.storageKey || STORAGE_KEY;
    var startupStorage = options.startupStorage;
    if (!startupStorage) {
      try { startupStorage = typeof window !== 'undefined' ? window.localStorage : null; } catch (_) { startupStorage = null; }
    }
    var startupStorageKey = options.startupStorageKey || STARTUP_STORAGE_KEY;
    var ids = [];
    var order = [];
    var played = new Set();
    var history = [];
    var cursor = -1;
    var returningForward = false;
    var previousOrder = [];
    var cycleNumber = 0;

    function randomIndex(max) {
      if (max <= 0) return 0;
      var value = Number(random());
      if (!Number.isFinite(value)) value = 0;
      return Math.min(max - 1, Math.max(0, Math.floor(value * max)));
    }

    function isSupabaseId(id) {
      return typeof id === 'string' && id.indexOf('cloud:') === 0;
    }

    function prioritizedCandidates(candidates, previousId) {
      if (!candidates.length) return candidates;
      var supabaseCandidates = candidates.filter(isSupabaseId);
      var sourceCandidates = supabaseCandidates.length ? supabaseCandidates : candidates;
      if (!previousId || sourceCandidates.length < 2) return sourceCandidates;
      var previous = getVideoGrouping(previousId);
      var differentRecordings = sourceCandidates.filter(function (id) {
        return getVideoGrouping(id).recordingId !== previous.recordingId;
      });
      var eligible = differentRecordings.length ? differentRecordings : sourceCandidates;
      if (previous.locationId) {
        var locationAlternatives = eligible.filter(function (id) {
          var location = getVideoGrouping(id).locationId;
          return !location || location !== previous.locationId;
        });
        if (locationAlternatives.length) return locationAlternatives;
      }
      return eligible;
    }

    function unique(values) {
      var seen = new Set();
      return (Array.isArray(values) ? values : []).map(function (value) {
        return typeof value === 'string' ? value : videoKey(value);
      }).filter(function (id) {
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    function save() {
      if (!storage) return;
      try {
        storage.setItem(storageKey, JSON.stringify({
          version: 2,
          ids: ids,
          order: order,
          played: Array.from(played),
          history: history,
          cursor: cursor,
          previousOrder: previousOrder,
          cycleNumber: cycleNumber
        }));
      } catch (_) {}
    }

    function restore() {
      if (!storage) return;
      try {
        var state = JSON.parse(storage.getItem(storageKey) || 'null');
        if (!state || state.version !== 2) return;
        ids = unique(state.ids);
        order = unique(state.order);
        played = new Set(unique(state.played));
        history = (Array.isArray(state.history) ? state.history : []).map(function (id) { return String(id || ''); }).filter(Boolean);
        cursor = Math.min(history.length - 1, Math.max(-1, Number(state.cursor) || 0));
        previousOrder = unique(state.previousOrder);
        cycleNumber = Math.max(0, Number(state.cycleNumber) || 0);
      } catch (_) {}
    }

    function shuffle(values, anchorId, alternateFirstChoice) {
      var remaining = values.slice();
      var result = [];
      var previousId = anchorId || null;
      var usedAlternate = false;
      while (remaining.length) {
        var eligible = prioritizedCandidates(remaining, previousId);
        var selectedAt = randomIndex(eligible.length);
        if (alternateFirstChoice && !usedAlternate && eligible.length > 1) {
          selectedAt = (selectedAt + 1) % eligible.length;
          usedAlternate = true;
        }
        var selected = eligible[selectedAt];
        result.push(selected);
        remaining.splice(remaining.indexOf(selected), 1);
        previousId = selected;
      }
      return result;
    }

    function makeShuffle(values, anchorId) {
      var result = shuffle(values, anchorId, false);
      if (result.length > 1 && result.every(function (id, index) { return id === previousOrder[index]; })) {
        result = shuffle(values, anchorId, true);
      }
      return result;
    }

    function orderedPool(values, anchorId) {
      var supabaseIds = values.filter(isSupabaseId);
      var localIds = values.filter(function (id) { return !isSupabaseId(id); });
      var supabaseAnchor = anchorId && isSupabaseId(anchorId) ? anchorId : null;
      var supabaseOrder = makeShuffle(supabaseIds, supabaseAnchor);
      var localAnchor = supabaseOrder.length ? supabaseOrder[supabaseOrder.length - 1] : anchorId;
      var localOrder = makeShuffle(localIds, localAnchor);
      return supabaseOrder.concat(localOrder);
    }

    function beginCycle(anchorId) {
      previousOrder = history.length ? history.slice() : order.slice();
      order = orderedPool(ids, anchorId);
      played = new Set();
      cycleNumber += 1;
      save();
    }

    function sync(values) {
      var nextIds = unique(values);
      var nextSet = new Set(nextIds);
      var oldIds = ids;
      var oldHistory = history;
      var oldCursor = cursor;
      var retainedBeforeCursor = oldHistory.slice(0, oldCursor + 1).filter(function (id) { return nextSet.has(id); }).length;

      order = order.filter(function (id) { return nextSet.has(id); });
      played = new Set(Array.from(played).filter(function (id) { return nextSet.has(id); }));
      history = oldHistory.filter(function (id) { return nextSet.has(id); });
      cursor = Math.min(history.length - 1, retainedBeforeCursor - 1);
      ids = nextIds;

      var oldSet = new Set(oldIds);
      var additions = ids.filter(function (id) { return !oldSet.has(id); });
      if (additions.length) {
        var anchorId = history[cursor] || null;
        var completed = order.filter(function (id) { return played.has(id) || id === anchorId; });
        var pending = ids.filter(function (id) { return !played.has(id) && id !== anchorId; });
        order = completed.concat(orderedPool(pending, anchorId));
      }

      if (ids.length && !order.length) beginCycle();
      save();
      return ids.slice();
    }

    function remember(id) {
      if (cursor < history.length - 1) history = history.slice(0, cursor + 1);
      history.push(id);
      cursor = history.length - 1;
      returningForward = false;
      save();
      return id;
    }

    function start(values, preferredId) {
      sync(values);
      if (!ids.length) return null;
      var startupPool = ids.filter(isSupabaseId);
      if (preferredId && ids.indexOf(preferredId) >= 0 && (isSupabaseId(preferredId) || !startupPool.length)) {
        // A deliberate shared-video URL remains a direct navigation target.
        return beginStartup(preferredId);
      }
      if (!startupPool.length) startupPool = ids;
      var startupId = selectAndRememberStartupVideo(startupPool, startupStorage, random, startupStorageKey);
      if (!startupId) return null;
      return beginStartup(startupId);
    }

    function beginStartup(id) {
      previousOrder = order.slice();
      order = orderedPool(ids, id);
      played = new Set();
      history = [];
      cursor = -1;
      returningForward = false;
      cycleNumber += 1;
      remember(id);
      save();
      return id;
    }

    function markStarted(id) {
      if (!id || ids.indexOf(id) < 0 || played.has(id)) return false;
      played.add(id);
      save();
      return true;
    }

    function next(values, currentId) {
      sync(values);
      if (!ids.length) return null;

      if (returningForward && cursor >= 0 && cursor < history.length - 1 && history[cursor] === currentId) {
        cursor += 1;
        returningForward = cursor < history.length - 1;
        save();
        return history[cursor];
      }
      returningForward = false;

      if (currentId && ids.indexOf(currentId) >= 0 && !played.has(currentId)) markStarted(currentId);

      var candidates = prioritizedCandidates(order.filter(function (id) { return !played.has(id) && id !== currentId; }), currentId);
      var candidate = candidates[0];
      if (!candidate && ids.every(function (id) { return played.has(id); })) {
        beginCycle(currentId);
        candidates = prioritizedCandidates(order.filter(function (id) { return id !== currentId; }), currentId);
        candidate = candidates[0] || order[0] || null;
      }
      if (!candidate) return currentId && ids.indexOf(currentId) >= 0 ? currentId : start(ids);
      return remember(candidate);
    }

    function previous(values) {
      sync(values);
      if (!history.length) return start(ids);
      if (cursor > 0) {
        cursor -= 1;
        returningForward = true;
      } else returningForward = false;
      save();
      return history[cursor] || null;
    }

    function select(values, id) {
      sync(values);
      if (!id || ids.indexOf(id) < 0) return null;
      if (cursor >= 0 && history[cursor] === id) return id;
      var existingAt = history.lastIndexOf(id);
      if (existingAt >= 0) {
        cursor = existingAt;
        returningForward = false;
        save();
        return id;
      }
      return remember(id);
    }

    function peekNext(values, currentId) {
      sync(values);
      if (cursor >= 0 && cursor < history.length - 1 && history[cursor] === currentId) return history[cursor + 1];
      return prioritizedCandidates(order.filter(function (id) { return !played.has(id) && id !== currentId; }), currentId)[0] || null;
    }

    function current(values) {
      sync(values);
      if (cursor >= 0 && history[cursor]) return history[cursor];
      return start(ids);
    }

    function getState() {
      return {
        ids: ids.slice(),
        order: order.slice(),
        played: Array.from(played),
        history: history.slice(),
        cursor: cursor,
        cycleNumber: cycleNumber
      };
    }

    function reset(values) {
      ids = [];
      order = [];
      played = new Set();
      history = [];
      cursor = -1;
      returningForward = false;
      previousOrder = [];
      cycleNumber = 0;
      if (storage) {
        try { storage.removeItem(storageKey); } catch (_) {}
      }
      return start(values);
    }

    restore();
    return { start: start, next: next, previous: previous, select: select, peekNext: peekNext, current: current, sync: sync, markStarted: markStarted, getState: getState, reset: reset };
  }

  return { createShuffleCycle: createShuffleCycle, videoKey: videoKey, getVideoGrouping: getVideoGrouping, isDuplicatePost: isDuplicatePost, selectRandomStartupVideo: selectRandomStartupVideo, selectAndRememberStartupVideo: selectAndRememberStartupVideo, selectValidatedStartupVideo: selectValidatedStartupVideo, createStartupSelection: createStartupSelection, createVideoValidator: createVideoValidator, createFeedVideoRecovery: createFeedVideoRecovery, applyCenteredVideoLayout: applyCenteredVideoLayout, calculateContainedVideoSize: calculateContainedVideoSize, fitCenteredVideo: fitCenteredVideo, hasVideoMetadata: hasVideoMetadata };
});
