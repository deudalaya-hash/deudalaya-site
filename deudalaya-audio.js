(function () {
  'use strict';

  var preferenceKey = 'deudalaya-sound-preference';
  var video = document.getElementById('postVideo');
  var feed = document.getElementById('feed');
  if (!video || !feed) return;

  var savedPreference = null;
  try { savedPreference = localStorage.getItem(preferenceKey); } catch (_) {}
  muted = savedPreference !== 'enabled';
  window.muted = muted;
  video.muted = muted;

  var enableButton = document.createElement('button');
  enableButton.type = 'button';
  enableButton.className = 'deudalaya-sound-enable';
  enableButton.textContent = 'Tap to Enable Sound';
  enableButton.setAttribute('aria-label', 'Tap to Enable Sound');
  enableButton.hidden = true;
  feed.appendChild(enableButton);

  var playAttempt = 0;
  var userInteracted = false;
  var gateGestureInProgress = false;

  function savePreference(enabled) {
    try {
      localStorage.setItem(preferenceKey, enabled ? 'enabled' : 'muted');
    } catch (_) {}
  }

  function feedIsAvailable() {
    var root = document.documentElement;
    var body = document.body;
    var gateClosed = !!(root && root.classList.contains('deudalaya-install-required')) ||
      !!(body && body.classList.contains('install-required'));
    return !video.hidden && !gateClosed;
  }

  function isGateInteraction(event) {
    var target = event && event.target;
    if (!target) return false;
    return !!(target.closest && target.closest('#deudalayaInstallLanding, #launchSplash'));
  }

  function silenceOtherVideos() {
    if (typeof document.querySelectorAll !== 'function') return;
    Array.prototype.forEach.call(document.querySelectorAll('video'), function (other) {
      if (other === video) return;
      other.muted = true;
      if (!other.paused && typeof other.pause === 'function') other.pause();
    });
  }

  function hideEnableButton() {
    enableButton.hidden = true;
  }

  function showEnableButton() {
    if (feedIsAvailable() && !paused) enableButton.hidden = false;
  }

  function playWithSoundPreference() {
    var attempt = ++playAttempt;
    if (!feedIsAvailable()) {
      video.muted = true;
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
      showEnableButton();
      return;
    }

    try {
      silenceOtherVideos();
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
      showEnableButton();
    }
  }

  window.deudalayaSaveSoundPreference = savePreference;
  window.deudalayaEnableSound = function () {
    if (gateGestureInProgress || !feedIsAvailable()) return false;
    setSoundEnabled(true);
    return true;
  };

  function rememberGatePointerDown(event) {
    if (isGateInteraction(event)) gateGestureInProgress = true;
  }
  document.addEventListener('pointerdown', rememberGatePointerDown, true);
  document.addEventListener('touchstart', rememberGatePointerDown, true);

  enableButton.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    setSoundEnabled(true);
  });

  function unlockOnFirstInteraction(event) {
    if (isGateInteraction(event)) {
      gateGestureInProgress = true;
      setTimeout(function () { gateGestureInProgress = false; }, 0);
      return;
    }
    if (userInteracted) return;
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

  video.addEventListener('playing', function () {
    if (muted) showEnableButton();
    else hideEnableButton();
  });

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
