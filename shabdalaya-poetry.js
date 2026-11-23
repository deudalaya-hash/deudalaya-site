(function () {
  'use strict';

  var post = document.querySelector('.shabdalaya-poetry-post');
  if (!post || post.dataset.bound === 'true') return;
  post.dataset.bound = 'true';

  var audio = post.querySelector('.shabdalaya-poetry-audio');
  var playButton = post.querySelector('.shabdalaya-audio-toggle');
  var progress = post.querySelector('.shabdalaya-poetry-progress');
  var currentTime = post.querySelector('.shabdalaya-current-time');
  var duration = post.querySelector('.shabdalaya-duration');
  var status = post.querySelector('.shabdalaya-poetry-status');

  if (!audio || !playButton || !progress) return;

  function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    var seconds = Math.floor(value);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function announce(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = !message;
  }

  function syncPlaybackState() {
    var playing = !audio.paused && !audio.ended;
    playButton.setAttribute('aria-pressed', String(playing));
    playButton.setAttribute('aria-label', playing ? 'Pause audio poem' : 'Play audio poem');
    playButton.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
    post.classList.toggle('is-playing', playing);
  }

  playButton.addEventListener('click', function () {
    if (!audio.paused) {
      audio.pause();
      return;
    }
    announce('');
    try {
      var attempt = audio.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {
          syncPlaybackState();
          announce('अडियो चल्न सकेन। फेरि प्रयास गर्नुहोस्।');
        });
      }
    } catch (error) {
      syncPlaybackState();
      announce('अडियो चल्न सकेन। फेरि प्रयास गर्नुहोस्।');
    }
  });

  audio.addEventListener('play', function () {
    document.querySelectorAll('.deuda-song-audio').forEach(function (otherAudio) { otherAudio.pause(); });
    var feedVideo = document.getElementById('postVideo');
    if (feedVideo && !feedVideo.paused) feedVideo.pause();
    syncPlaybackState();
  });
  audio.addEventListener('pause', syncPlaybackState);
  audio.addEventListener('ended', function () {
    progress.value = '0';
    currentTime.textContent = '0:00';
    syncPlaybackState();
  });
  audio.addEventListener('loadedmetadata', function () {
    if (Number.isFinite(audio.duration)) {
      progress.max = String(audio.duration);
      duration.textContent = formatTime(audio.duration);
    }
  });
  audio.addEventListener('timeupdate', function () {
    if (!progress.matches(':active') && Number.isFinite(audio.duration) && audio.duration > 0) {
      progress.value = String(audio.currentTime);
    }
    currentTime.textContent = formatTime(audio.currentTime);
  });
  audio.addEventListener('error', function () { announce('अडियो उपलब्ध भएन।'); });
  progress.addEventListener('input', function () {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Number(progress.value);
      currentTime.textContent = formatTime(audio.currentTime);
    }
  });

  document.querySelectorAll('.deuda-song-audio').forEach(function (songAudio) {
    songAudio.addEventListener('play', function () { audio.pause(); });
  });

  var like = post.querySelector('[aria-label="Like poem"]');
  var likeCount = post.querySelector('.shabdalaya-like-count');
  if (like) like.addEventListener('click', function () {
    var liked = like.getAttribute('aria-pressed') !== 'true';
    like.setAttribute('aria-pressed', String(liked));
    like.querySelector('span').textContent = liked ? '♥' : '♡';
    likeCount.textContent = liked ? '1' : '0';
  });

  var bookmark = post.querySelector('[aria-label="Bookmark poem"]');
  if (bookmark) bookmark.addEventListener('click', function () {
    var saved = bookmark.getAttribute('aria-pressed') !== 'true';
    bookmark.setAttribute('aria-pressed', String(saved));
    bookmark.querySelector('span').textContent = saved ? '♣' : '♧';
    announce(saved ? 'कविता सङ्ग्रह गरियो।' : 'सङ्ग्रहबाट हटाइयो।');
  });

  var comment = post.querySelector('[aria-label="Comment on poem"]');
  if (comment) comment.addEventListener('click', function () { announce('यस कवितामा टिप्पणी सुविधा चाँडै उपलब्ध हुनेछ।'); });

  var share = post.querySelector('[aria-label="Share poem"]');
  if (share) share.addEventListener('click', function () {
    var shareData = { title: 'काठमाडौंको साँझ — शब्दलय', text: 'यो सहरको भीडभित्र, मनले आफ्नै बाटो खोज्छ।', url: window.location.href };
    if (navigator.share) {
      navigator.share(shareData).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href).then(function () { announce('लिङ्क प्रतिलिपि गरियो।'); }).catch(function () { announce(window.location.href); });
    } else {
      announce(window.location.href);
    }
  });

  syncPlaybackState();
})();
