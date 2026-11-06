(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DeudalayaVideoShuffle = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var STORAGE_KEY = 'deudalaya-video-shuffle-v1';

  function videoKey(video) {
    if (typeof video === 'string') return video;
    if (!video || typeof video !== 'object') return '';
    if (video.localId) return 'local:' + String(video.localId);
    if (video.videoSrc) return 'source:' + String(video.videoSrc).split(/[?#]/, 1)[0];
    if (video.cloudId) return 'cloud:' + String(video.cloudId);
    return '';
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

  function createShuffleCycle(options) {
    options = options || {};
    var random = typeof options.random === 'function' ? options.random : Math.random;
    var storage = options.storage || null;
    var storageKey = options.storageKey || STORAGE_KEY;
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
          version: 1,
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
        if (!state || state.version !== 1) return;
        ids = unique(state.ids);
        order = unique(state.order);
        played = new Set(unique(state.played));
        history = (Array.isArray(state.history) ? state.history : []).map(function (id) { return String(id || ''); }).filter(Boolean);
        cursor = Math.min(history.length - 1, Math.max(-1, Number(state.cursor) || 0));
        previousOrder = unique(state.previousOrder);
        cycleNumber = Math.max(0, Number(state.cycleNumber) || 0);
      } catch (_) {}
    }

    function shuffle(values) {
      var result = values.slice();
      for (var i = result.length - 1; i > 0; i -= 1) {
        var j = randomIndex(i + 1);
        var item = result[i];
        result[i] = result[j];
        result[j] = item;
      }
      if (result.length > 1 && result.every(function (id, index) { return id === previousOrder[index]; })) {
        var first = result[0];
        result[0] = result[1];
        result[1] = first;
      }
      return result;
    }

    function beginCycle() {
      previousOrder = order.slice();
      order = shuffle(ids);
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
      additions.forEach(function (id) {
        order.splice(randomIndex(order.length + 1), 0, id);
      });

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
      if (preferredId && ids.indexOf(preferredId) >= 0) {
        var preferredAt = history.lastIndexOf(preferredId);
        if (preferredAt >= 0) {
          cursor = preferredAt;
          returningForward = false;
          save();
          return preferredId;
        }
        return remember(preferredId);
      }
      if (cursor >= 0 && history[cursor]) {
        var resumedKey = history[cursor];
        returningForward = false;
        if (!played.has(resumedKey)) return resumedKey;
        var nextUnplayed = order.find(function (id) { return !played.has(id); });
        if (!nextUnplayed && ids.every(function (id) { return played.has(id); })) {
          beginCycle();
          nextUnplayed = order[0] || null;
        }
        return nextUnplayed ? remember(nextUnplayed) : resumedKey;
      }
      if (played.size === ids.length) beginCycle();
      if (!order.length) beginCycle();
      var first = order.find(function (id) { return !played.has(id); });
      return first ? remember(first) : null;
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

      if (currentId && !played.has(currentId)) {
        var skippedAt = order.indexOf(currentId);
        if (skippedAt >= 0) order.push(order.splice(skippedAt, 1)[0]);
      }

      var candidate = order.find(function (id) { return !played.has(id) && id !== currentId; });
      if (!candidate && ids.every(function (id) { return played.has(id); })) {
        beginCycle();
        candidate = order[0] || null;
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
      return order.find(function (id) { return !played.has(id) && id !== currentId; }) || null;
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

  return { createShuffleCycle: createShuffleCycle, videoKey: videoKey, isDuplicatePost: isDuplicatePost };
});
