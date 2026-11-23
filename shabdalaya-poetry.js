(function () {
  'use strict';

  var POETRY_TYPES = new Set(['audio-poetry', 'spoken-word', 'literary-audio']);

  function setText(post, selector, value) {
    var element = post.querySelector(selector);
    if (element) element.textContent = value == null ? '' : String(value);
    return element;
  }

  function safeId(value) {
    return String(value).replace(/[^a-z0-9_-]/gi, '-');
  }

  function bindPost(article, data) {
    var audio = article.querySelector('.shabdalaya-poetry-audio');
    var playButton = article.querySelector('.shabdalaya-audio-toggle');
    var progress = article.querySelector('.shabdalaya-poetry-progress');
    var currentTime = article.querySelector('.shabdalaya-current-time');
    var duration = article.querySelector('.shabdalaya-duration');
    var status = article.querySelector('.shabdalaya-poetry-status');
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
      article.classList.toggle('is-playing', playing);
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
      document.querySelectorAll('.shabdalaya-poetry-audio, .deuda-song-audio').forEach(function (otherAudio) {
        if (otherAudio !== audio) otherAudio.pause();
      });
      var feedVideo = document.getElementById('postVideo');
      if (feedVideo && !feedVideo.paused) feedVideo.pause();
      syncPlaybackState();
    });
    audio.addEventListener('pause', syncPlaybackState);
    audio.addEventListener('ended', function () {
      progress.value = '0';
      if (currentTime) currentTime.textContent = '0:00';
      syncPlaybackState();
    });
    audio.addEventListener('loadedmetadata', function () {
      if (Number.isFinite(audio.duration)) {
        progress.max = String(audio.duration);
        if (duration) duration.textContent = formatTime(audio.duration);
      }
    });
    audio.addEventListener('timeupdate', function () {
      if (!progress.matches(':active') && Number.isFinite(audio.duration) && audio.duration > 0) {
        progress.value = String(audio.currentTime);
      }
      if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    });
    audio.addEventListener('error', function () { announce('अडियो उपलब्ध भएन।'); });
    progress.addEventListener('input', function () {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = Number(progress.value);
        if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
      }
    });

    var like = article.querySelector('[aria-label="Like poem"]');
    var likeCount = article.querySelector('.shabdalaya-like-count');
    if (like) like.addEventListener('click', function () {
      var liked = like.getAttribute('aria-pressed') !== 'true';
      like.setAttribute('aria-pressed', String(liked));
      like.querySelector('span').textContent = liked ? '♥' : '♡';
      if (likeCount) likeCount.textContent = liked ? '1' : '0';
    });

    var bookmark = article.querySelector('[aria-label="Bookmark poem"]');
    if (bookmark) bookmark.addEventListener('click', function () {
      var saved = bookmark.getAttribute('aria-pressed') !== 'true';
      bookmark.setAttribute('aria-pressed', String(saved));
      bookmark.querySelector('span').textContent = saved ? '♣' : '♧';
      announce(saved ? 'कविता सङ्ग्रह गरियो।' : 'सङ्ग्रहबाट हटाइयो।');
    });

    var comment = article.querySelector('[aria-label="Comment on poem"]');
    if (comment) comment.addEventListener('click', function () { announce('यस कवितामा टिप्पणी सुविधा चाँडै उपलब्ध हुनेछ।'); });

    var share = article.querySelector('[aria-label="Share poem"]');
    if (share) share.addEventListener('click', function () {
      var shareData = { title: data.title + ' — शब्दलय', text: (data.lines || []).join(' '), url: window.location.href };
      if (navigator.share) {
        navigator.share(shareData).catch(function () {});
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(function () { announce('लिङ्क प्रतिलिपि गरियो।'); }).catch(function () { announce(window.location.href); });
      } else {
        announce(window.location.href);
      }
    });

    syncPlaybackState();
  }

  function renderShabdalayaPoetryFeed(posts) {
    var list = document.querySelector('.shabdalaya-poetry-list');
    var template = document.getElementById('shabdalayaPoetryPostTemplate');
    if (!list || !template || !template.content || !template.content.firstElementChild) return 0;

    list.replaceChildren();
    var seen = new Set();
    var rendered = 0;
    (Array.isArray(posts) ? posts : []).forEach(function (data) {
      if (!data || !data.id || !POETRY_TYPES.has(data.type) || seen.has(data.id) || !data.audio) return;
      seen.add(data.id);

      var article = template.content.firstElementChild.cloneNode(true);
      var id = safeId(data.id);
      var titleId = 'shabdalaya-poem-title-' + id;
      article.dataset.poetryId = data.id;
      article.setAttribute('aria-labelledby', titleId);
      var title = setText(article, '.shabdalaya-poetry-title', data.title);
      if (title) title.id = titleId;
      setText(article, '.shabdalaya-author', data.author);
      setText(article, '.shabdalaya-post-meta', [data.location, data.postedAt].filter(Boolean).join(' · '));
      setText(article, '.shabdalaya-kind-label', data.type === 'spoken-word' ? 'वाचन' : 'शब्दलय');
      setText(article, '.shabdalaya-poem-lines', Array.isArray(data.lines) ? data.lines.join('\n') : '');
      setText(article, '.shabdalaya-poem-description', data.description);
      setText(article, '.shabdalaya-poem-tags', Array.isArray(data.tags) ? data.tags.join('  ') : '');

      var profile = article.querySelector('.shabdalaya-profile-image');
      if (profile) {
        profile.src = data.profileImage || '';
        profile.alt = data.author ? data.author + ' को प्रोफाइल तस्वीर' : 'प्रोफाइल तस्वीर';
      }
      var audio = article.querySelector('.shabdalaya-poetry-audio');
      if (audio) audio.src = data.audio;
      var player = article.querySelector('.shabdalaya-audio-player');
      if (player) player.setAttribute('aria-label', (data.title || 'अडियो कविता') + ' अडियो प्लेयर');
      var progress = article.querySelector('.shabdalaya-poetry-progress');
      if (progress) progress.setAttribute('aria-label', (data.title || 'अडियो कविता') + ' अडियो प्रगति');

      bindPost(article, data);
      list.appendChild(article);
      rendered += 1;
    });

    var emptyState = document.querySelector('.shabdalaya-empty-state');
    if (emptyState) emptyState.hidden = rendered > 0;
    return rendered;
  }

  window.renderShabdalayaPoetryFeed = renderShabdalayaPoetryFeed;
  renderShabdalayaPoetryFeed(window.DEUDALAYA_SHABDALAYA_POETRY_POSTS);

  document.querySelectorAll('.deuda-song-audio').forEach(function (songAudio) {
    songAudio.addEventListener('play', function () {
      document.querySelectorAll('.shabdalaya-poetry-audio').forEach(function (poemAudio) { poemAudio.pause(); });
    });
  });
})();
