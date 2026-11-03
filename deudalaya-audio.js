(function () {
  'use strict';

  var preferenceKey = 'deudalaya-sound-preference';
  var video = document.getElementById('postVideo');
  var feed = document.getElementById('feed');
  if (!video || !feed) return;

  var enableButton = document.createElement('button');
  enableButton.type = 'button';
  enableButton.className = 'deudalaya-sound-enable';
  enableButton.textContent = 'Tap to Enable Sound';
  enableButton.setAttribute('aria-label', 'Tap to Enable Sound');
  enableButton.hidden = true;
  feed.appendChild(enableButton);

  var playAttempt = 0;
  var userInteracted = false;

  function savePreference(enabled) {
    try {
      localStorage.setItem(preferenceKey, enabled ? 'enabled' : 'muted');
    } catch (_) {}
  }

  function feedIsAvailable() {
    return !video.hidden && !document.body.classList.contains('install-required');
  }

  function hideEnableButton() {
    enableButton.hidden = true;
  }

  function showEnableButton() {
    if (feedIsAvailable() && !muted && !paused) enableButton.hidden = false;
  }

  function playWithSoundPreference() {
    var attempt = ++playAttempt;
    if (!feedIsAvailable()) {
      video.pause();
      hideEnableButton();
      return;
    }
    if (paused) {
      hideEnableButton();
      return;
    }

    video.muted = !!muted;
    window.muted = !!muted;
    if (muted) {
      hideEnableButton();
      return;
    }

    try {
      var result = video.play();
      if (result && typeof result.then === 'function') {
        result.then(function () {
          if (attempt === playAttempt) hideEnableButton();
        }).catch(function () {
          if (attempt === playAttempt) showEnableButton();
        });
      }
    } catch (_) {
      if (attempt === playAttempt) showEnableButton();
    }
  }

  function setSoundEnabled(enabled) {
    muted = !enabled;
    window.muted = muted;
    video.muted = muted;
    savePreference(enabled);
    if (enabled) playWithSoundPreference();
    else {
      playAttempt += 1;
      hideEnableButton();
    }
  }

  window.deudalayaSaveSoundPreference = savePreference;
  window.deudalayaEnableSound = function () { setSoundEnabled(true); };

  enableButton.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    setSoundEnabled(true);
  });

  function unlockOnFirstInteraction() {
    if (userInteracted || document.body.classList.contains('install-required')) return;
    if (!feedIsAvailable()) return;
    userInteracted = true;
    ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (eventName) {
      document.removeEventListener(eventName, unlockOnFirstInteraction, true);
    });
    if (!muted) {
      savePreference(true);
      playWithSoundPreference();
    }
  }

  ['pointerup', 'touchend', 'click', 'keydown'].forEach(function (eventName) {
    document.addEventListener(eventName, unlockOnFirstInteraction, true);
  });

  video.addEventListener('playing', hideEnableButton);

  if (typeof window.render === 'function') {
    var originalRender = window.render;
    window.render = function () {
      var result = originalRender.apply(this, arguments);
      playWithSoundPreference();
      return result;
    };
  }

  playWithSoundPreference();
})();
