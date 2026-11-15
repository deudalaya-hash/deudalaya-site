(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root) return;
  root.DeudalayaFeedPublisher = api;
  if (typeof root.publishUpload !== 'function') {
    root.publishUpload = api.createPublishUpload({
      getClient: function () { return loadSupabaseClient(); },
      getUser: function () { return cloudUser; },
      isAdmin: function () { return typeof isDeudalayaAdmin === 'function' && isDeudalayaAdmin(); },
      getFile: function () { return pendingUpload; },
      getCategory: function () { return document.getElementById('uploadCategory').value; },
      getCaption: function () { return document.getElementById('uploadCaption').value.trim(); },
      hasRights: function () { return document.getElementById('uploadRights').checked; },
      allowedCategories: function () {
        return root.DeudalayaFeedCategories ? root.DeudalayaFeedCategories.ACTIVE_CATEGORIES : ['देउडा', 'गाउँघर', 'शहर'];
      },
      randomUUID: function () { return crypto.randomUUID(); },
      getButton: function () { return document.getElementById('publishButton'); },
      upload: function (client, objectPath, file, button) { return uploadToStorage(client, objectPath, file, button); },
      onPublished: function (post) {
        if (!videos.some(function (item) { return item.cloudId === post.cloudId; })) videos.unshift(post);
        index = 0;
        liked = false;
        bookmarked = false;
        following = false;
        paused = false;
        render();
        if (typeof root.loadRemotePosts === 'function') {
          root.loadRemotePosts().then(function () {
            if (typeof root.setFeedCategory === 'function') root.setFeedCategory(post.feedCategory);
          });
        }
      },
      closeUpload: function () { closeUpload(); },
      resetForm: function () {
        document.getElementById('uploadCaption').value = '';
        document.getElementById('uploadCategory').value = '';
        document.getElementById('uploadLocation').value = '';
        document.getElementById('uploadRights').checked = false;
        document.getElementById('captionCount').textContent = '0 / 220';
      },
      openAuth: function () { openAuth(); },
      setAuthMessage: function (message) { document.getElementById('authMessage').textContent = message; },
      toast: function (message) { toast(message); }
    });
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const MAX_VIDEO_BYTES = 25_000_000;
  const POST_COLUMNS = 'id,user_id,media_path,media_type,caption,category,created_at';

  function createPublishUpload(dependencies) {
    const deps = dependencies || {};
    const notify = function (message) { if (typeof deps.toast === 'function') deps.toast(message); };

    return async function publishUpload(event) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();

      let client;
      try {
        client = typeof deps.getClient === 'function' ? await deps.getClient() : null;
        if (!client) {
          notify('Could not connect to Supabase. Check your internet connection.');
          return null;
        }

        const user = typeof deps.getUser === 'function' ? deps.getUser() : null;
        if (!user) {
          if (typeof deps.closeUpload === 'function') deps.closeUpload();
          if (typeof deps.setAuthMessage === 'function') deps.setAuthMessage('Sign in to publish this video. Your selected video will stay in the composer.');
          if (typeof deps.openAuth === 'function') deps.openAuth();
          return null;
        }
        if (typeof deps.isAdmin !== 'function' || deps.isAdmin() !== true) {
          notify('Video uploads are restricted to authorized Deudalaya admins');
          return null;
        }

        const file = typeof deps.getFile === 'function' ? deps.getFile() : null;
        const category = typeof deps.getCategory === 'function' ? deps.getCategory() : '';
        const caption = typeof deps.getCaption === 'function' ? deps.getCaption() : '';
        const allowedCategories = typeof deps.allowedCategories === 'function'
          ? deps.allowedCategories()
          : deps.allowedCategories;
        const hasRights = typeof deps.hasRights === 'function' && deps.hasRights() === true;
        const sizeValid = file && Number.isFinite(Number(file.size)) && Number(file.size) > 0 && Number(file.size) <= (deps.maxBytes || MAX_VIDEO_BYTES);
        const mediaType = String(file && file.type || '').toLowerCase().split(';')[0].trim();
        const typeValid = mediaType === 'video/mp4' || mediaType === 'video/webm';
        if (!file || !sizeValid || !typeValid || !Array.isArray(allowedCategories) || !allowedCategories.includes(category) || !hasRights) {
          notify('Choose a supported video, category, and confirm your upload rights.');
          return null;
        }

        const button = typeof deps.getButton === 'function' ? deps.getButton() : null;
        if (button) {
          button.disabled = true;
          button.textContent = 'Uploading…';
        }

        try {
          const id = typeof deps.randomUUID === 'function' ? deps.randomUUID() : '';
          if (!id) throw new Error('Could not create a unique upload path.');
          const extension = mediaType === 'video/webm' ? 'webm' : 'mp4';
          const objectPath = String(user.id) + '/' + id + '.' + extension;
          if (typeof deps.upload !== 'function') throw new Error('Video upload is unavailable.');
          await deps.upload(client, objectPath, file, button);

          const { data: post, error } = await client.from('feed_posts')
            .insert({ user_id: user.id, media_path: objectPath, media_type: mediaType, caption: caption, category: category })
            .select(POST_COLUMNS)
            .single();
          if (error) {
            try { await client.storage.from('videos').remove([objectPath]); } catch (_) {}
            throw error;
          }
          if (!post) throw new Error('The video uploaded, but its feed record could not be confirmed.');

          const { data: publicUrl } = client.storage.from('videos').getPublicUrl(post.media_path);
          const feedPost = {
            handle: 'deudalaya', name: 'देउडालय', avatar: 'deudalaya-avatar', disc: 'deudalaya-avatar',
            videoSrc: publicUrl && publicUrl.publicUrl, mediaType: post.media_type, fit: 'contain',
            feedCategory: post.category, category: post.category,
            caption: post.caption || 'देउडालय — सुदूर - कर्णाली', tags: '#देउडालय #कर्णाली #सुदूरपश्चिम',
            music: 'Original sound · ' + post.category, likes: 0, comments: 0, following: 'deudalaya',
            cloudPost: true, cloudId: post.id, userId: post.user_id,
            profile: typeof window !== 'undefined' ? window.deudalayaProfile || null : null,
            likedByMe: false, bookmarkedByMe: false, followedByMe: false
          };
          if (!feedPost.videoSrc || !/^https?:\/\//i.test(feedPost.videoSrc)) throw new Error('Supabase did not return a public video URL.');
          if (typeof deps.onPublished === 'function') deps.onPublished(feedPost);
          if (typeof deps.closeUpload === 'function') deps.closeUpload();
          if (typeof deps.resetForm === 'function') deps.resetForm();
          notify('Posted to the shared देउडालय feed');
          return feedPost;
        } catch (error) {
          notify(error && error.message || 'Upload failed. Check your connection and Supabase policies.');
          return null;
        } finally {
          if (button) {
            button.textContent = 'Add to feed';
            if (typeof deps.getFile === 'function' && deps.getFile()) button.disabled = false;
          }
        }
      } catch (error) {
        notify(error && error.message || 'Could not complete the upload.');
        return null;
      }
    };
  }

  return Object.freeze({ createPublishUpload: createPublishUpload, MAX_VIDEO_BYTES: MAX_VIDEO_BYTES });
});
