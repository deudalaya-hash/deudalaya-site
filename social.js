/* Shared TikTok-style profiles and post engagement for the public feed. */
(() => {
  const profileTable = 'profiles';
  let profileTargetId = null;
  let sharedPosts = [];
  let activeFeedMode = 'for-you';
  const ownId = () => cloudUser?.id || null;
  const currentPost = () => videos[index];
  const formatCount = value => Number(value || 0).toLocaleString();
  const publicAvatar = row => row?.avatar_path
    ? cloudClient.storage.from('videos').getPublicUrl(row.avatar_path).data.publicUrl
    : asset('deudalaya_icon.webp');
  const requireUser = async action => {
    if (!cloudUser) {
      window.pendingSocialAction = action;
      openAuth();
      return false;
    }
    return true;
  };
  const retryOnPostAfterSignIn = (post, action) => {
    const found = videos.findIndex(item => item.cloudId === post.cloudId);
    if (found < 0) return toast('That post is no longer in the feed.');
    index = found;
    render();
    action();
  };
  const reportError = (error, fallback) => {
    console.error(fallback, error);
    toast(error?.message || fallback);
  };

  function renderProfileFromRow(row) {
    if (!row) return;
    window.deudalayaProfile = row;
    const avatar = document.getElementById('profileAvatar');
    avatar.src = publicAvatar(row);
    document.getElementById('profileDisplayName').textContent = row.display_name || 'देउडालय सदस्य';
    document.getElementById('profileUsername').textContent = '@' + (row.username || 'deudalaya');
    document.getElementById('profileBio').textContent = row.bio || '';
  }

  async function refreshOwnProfile() {
    if (!cloudClient || !ownId()) return null;
    const { data, error } = await cloudClient.from(profileTable).select('*').eq('id', ownId()).maybeSingle();
    if (error) { console.warn('Could not load profile', error); return null; }
    renderProfileFromRow(data);
    return data;
  }

  function syncProfileButtons() {
    const signedIn = !!cloudUser;
    const ownProfile = signedIn && profileTargetId === ownId();
    document.getElementById('profileAuthButton').hidden = signedIn;
    document.getElementById('editProfileButton').hidden = !ownProfile;
    document.getElementById('profileFollowButton').hidden = !signedIn || ownProfile || !profileTargetId;
    document.getElementById('shareProfileButton').hidden = !profileTargetId;
    document.getElementById('profileAuthButton').textContent = 'Sign in';
  }

  const oldSetAuthMode = window.setAuthMode;
  window.setAuthMode = function(mode) {
    oldSetAuthMode(mode);
    const signup = mode === 'signup';
    const fields = document.getElementById('signupFields');
    fields.hidden = !signup;
    for (const id of ['signupDisplayName', 'signupUsername']) {
      const field = document.getElementById(id);
      field.required = signup;
      field.disabled = !signup;
    }
    document.getElementById('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
    document.getElementById('authMessage').textContent = signup
      ? 'Create your profile with a name and unique username.'
      : 'Sign in to like, comment, follow creators, and post.';
  };

  window.submitAuth = async function(event) {
    event.preventDefault();
    const client = await loadSupabaseClient();
    if (!client) { toast('Could not connect to Supabase'); return; }
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const button = document.getElementById('authSubmit');
    const signup = authMode === 'signup';
    const displayName = document.getElementById('signupDisplayName').value.trim();
    const username = document.getElementById('signupUsername').value.trim().toLowerCase();
    if (signup && !/^[a-z0-9._]{3,24}$/.test(username)) {
      document.getElementById('authMessage').textContent = 'Username must be 3–24 letters, numbers, dots, or underscores.';
      return;
    }
    button.disabled = true;
    try {
      let result;
      if (signup) {
        const { data: existing, error: lookupError } = await client.from(profileTable).select('id').eq('username', username).maybeSingle();
        if (lookupError) throw lookupError;
        if (existing) throw new Error('That username is already taken. Choose another.');
        result = await client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin, data: { username, display_name: displayName } } });
      } else result = await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (signup && !result.data.session) {
        document.getElementById('authMessage').textContent = 'Account created. Confirm your email, then sign in. Your profile is ready.';
        return;
      }
      cloudUser = result.data.user || null;
      await refreshOwnProfile();
      updateAuthUI();
      closeAuth();
      await loadRemotePosts();
      toast(signup ? 'Account and profile created' : 'Signed in');
      const pending = window.pendingSocialAction;
      window.pendingSocialAction = null;
      if (pending) setTimeout(pending, 100);
    } catch (error) {
      document.getElementById('authMessage').textContent = error.message || 'Could not authenticate';
      toast(error.message || 'Sign-in failed');
    } finally { button.disabled = false; }
  };

  const oldUpdateAuthUI = window.updateAuthUI;
  window.updateAuthUI = function() {
    oldUpdateAuthUI();
    syncProfileButtons();
    if (cloudUser) refreshOwnProfile().then(() => { if (document.getElementById('profilePanel').classList.contains('open')) openProfile(profileTargetId); });
  };

  window.loadRemotePosts = async function() {
    if (!cloudClient) return;
    const { data, error } = await cloudClient.from('feed_posts')
      .select('id,user_id,media_path,media_type,caption,category,created_at')
      .order('created_at', { ascending: false }).limit(100);
    if (error) { console.warn('Could not load shared posts', error); return; }
    const rows = data || [];
    const ids = [...new Set(rows.map(row => row.user_id).filter(Boolean))];
    const [profilesResult, likesResult, commentsResult, followsResult, bookmarksResult] = await Promise.all([
      ids.length ? cloudClient.from(profileTable).select('id,username,display_name,bio,avatar_path').in('id', ids) : Promise.resolve({ data: [] }),
      rows.length ? cloudClient.from('post_likes').select('post_id,user_id').in('post_id', rows.map(row => row.id)) : Promise.resolve({ data: [] }),
      rows.length ? cloudClient.from('post_comments').select('post_id').in('post_id', rows.map(row => row.id)) : Promise.resolve({ data: [] }),
      ownId() ? cloudClient.from('post_follows').select('followed_id').eq('follower_id', ownId()) : Promise.resolve({ data: [] }),
      ownId() ? cloudClient.from('post_bookmarks').select('post_id').eq('user_id', ownId()) : Promise.resolve({ data: [] })
    ]);
    if (profilesResult.error) console.warn('Could not load author profiles', profilesResult.error);
    const profiles = new Map((profilesResult.data || []).map(profile => [profile.id, profile]));
    const likeRows = likesResult.data || [], commentRows = commentsResult.data || [];
    const followed = new Set((followsResult.data || []).map(row => row.followed_id));
    const saved = new Set((bookmarksResult.data || []).map(row => row.post_id));
    const newSharedPosts = [];
    for (const row of [...rows].reverse()) {
      const profile = profiles.get(row.user_id) || {};
      const url = cloudClient.storage.from('videos').getPublicUrl(row.media_path).data.publicUrl;
      const isVideo = row.media_type.startsWith('video/');
      const likes = likeRows.filter(like => like.post_id === row.id);
      newSharedPosts.unshift({
        handle: profile.username || 'deudalaya', name: profile.display_name || 'देउडालय सदस्य',
        avatar: profile.avatar_path ? cloudClient.storage.from('videos').getPublicUrl(profile.avatar_path).data.publicUrl : 'deudalaya-avatar',
        disc: profile.avatar_path ? cloudClient.storage.from('videos').getPublicUrl(profile.avatar_path).data.publicUrl : 'deudalaya-avatar',
        image: isVideo ? '' : url, videoSrc: isVideo ? url : null, fit: 'contain',
        caption: row.caption || 'देउडालयमा नयाँ पोस्ट', tags: '#देउडालय #कर्णाली',
        music: (isVideo ? 'Original sound' : 'Photo') + ' · ' + (row.category || 'देउडा'),
        likes: likes.length, comments: commentRows.filter(comment => comment.post_id === row.id).length,
        following: profile.username || 'deudalaya', cloudPost: true, cloudId: row.id,
        userId: row.user_id, profile, likedByMe: likes.some(like => like.user_id === ownId()),
        followedByMe: followed.has(row.user_id), bookmarkedByMe: saved.has(row.id)
      });
    }
    sharedPosts = newSharedPosts;
    applyFeedMode(true);
  };

  function applyFeedMode(reset = false) {
    const selected = activeFeedMode === 'following' ? sharedPosts.filter(post => post.followedByMe) : sharedPosts;
    const localPosts = videos.filter(post => !post.cloudPost);
    videos.splice(0, videos.length, ...selected, ...localPosts);
    if (reset || index >= videos.length) index = 0;
    render();
    if (activeFeedMode === 'following' && !selected.length) toast('No posts from followed creators yet. Follow someone to fill this feed.');
  }
  window.setFeedMode = async function(mode) {
    if (mode === 'following' && !cloudUser) {
      window.pendingSocialAction = () => setFeedMode('following');
      openAuth();
      return;
    }
    activeFeedMode = mode === 'following' ? 'following' : 'for-you';
    applyFeedMode(true);
    if (mode === 'following' && !videos.some(post => post.cloudPost)) toast('Follow creators to see their posts here.');
  };
  window.showFeedTab = function(button) {
    document.querySelectorAll('.feed-tabs button').forEach(item => item.classList.remove('selected'));
    button.classList.add('selected');
    setFeedMode(button.textContent.trim().toLowerCase() === 'following' ? 'following' : 'for-you');
  };
  window.openFeedPostById = function(postId) {
    let found = videos.findIndex(post => post.cloudId === postId);
    if (found < 0) {
      activeFeedMode = 'for-you';
      document.querySelectorAll('.feed-tabs button').forEach(item => item.classList.toggle('selected', item.textContent.trim().toLowerCase() === 'for you'));
      applyFeedMode(true);
      found = videos.findIndex(post => post.cloudId === postId);
    }
    if (found >= 0) { index = found; render(); closeProfile(); }
  };
  window.openFeedPostByImage = function(image) {
    const found = videos.findIndex(post => post.image === image);
    if (found >= 0) { index = found; render(); closeProfile(); }
  };

  const originalRender = window.render;
  window.render = function() {
    originalRender();
    const post = currentPost();
    if (!post) return;
    liked = !!post.likedByMe;
    bookmarked = !!post.bookmarkedByMe;
    following = !!post.followedByMe;
    document.getElementById('handle').textContent = post.name ? `${post.name}  @${post.handle || 'deudalaya'}` : '@' + (post.handle || 'deudalaya');
    document.getElementById('handle').style.cursor = post.userId ? 'pointer' : 'default';
    document.getElementById('handle').onclick = () => post.userId && openProfile(post.userId);
    const captionNode = document.getElementById('caption');
    captionNode.replaceChildren(document.createTextNode(post.caption || ''), document.createElement('br'));
    const tagsNode = document.createElement('span'); tagsNode.className = 'tags'; tagsNode.textContent = post.tags || '';
    captionNode.append(tagsNode);
    const avatar = document.getElementById('avatar');
    avatar.src = post.profile?.avatar_path ? publicAvatar(post.profile) : (String(post.avatar || '').startsWith('http') ? post.avatar : asset('deudalaya_icon.webp'));
    avatar.style.objectFit = 'cover';
    document.getElementById('likes').textContent = formatCount(post.likes);
    document.getElementById('like').classList.toggle('on', liked);
    document.getElementById('like').setAttribute('aria-pressed', String(liked));
    document.getElementById('bookmark').classList.toggle('on', bookmarked);
    document.getElementById('follow').textContent = following ? 'Following' : 'Follow';
    document.getElementById('follow').style.background = following ? '#34343b' : 'var(--pink)';
    document.getElementById('commentCount').textContent = formatCount(post.comments);
    document.getElementById('commentTitle').textContent = `(${formatCount(post.comments)})`;
    if (post.cloudPost) loadCurrentEngagement(post);
  };

  async function loadCurrentEngagement(post) {
    if (!cloudClient || !post?.cloudId) return;
    const [likes, comments, saved, followed] = await Promise.all([
      cloudClient.from('post_likes').select('user_id').eq('post_id', post.cloudId),
      cloudClient.from('post_comments').select('id', { count: 'exact', head: true }).eq('post_id', post.cloudId),
      ownId() ? cloudClient.from('post_bookmarks').select('post_id').eq('user_id', ownId()).eq('post_id', post.cloudId).maybeSingle() : Promise.resolve({ data: null }),
      ownId() && post.userId ? cloudClient.from('post_follows').select('followed_id').eq('follower_id', ownId()).eq('followed_id', post.userId).maybeSingle() : Promise.resolve({ data: null })
    ]);
    if (likes.error || comments.error) return;
    post.likes = (likes.data || []).length;
    post.comments = comments.count || 0;
    post.likedByMe = (likes.data || []).some(row => row.user_id === ownId());
    post.bookmarkedByMe = !!saved.data;
    post.followedByMe = !!followed.data;
    if (currentPost() === post) {
      document.getElementById('likes').textContent = formatCount(post.likes);
      document.getElementById('like').classList.toggle('on', post.likedByMe);
      document.getElementById('like').setAttribute('aria-pressed', String(post.likedByMe));
      document.getElementById('bookmark').classList.toggle('on', post.bookmarkedByMe);
      document.getElementById('follow').textContent = post.followedByMe ? 'Following' : 'Follow';
      document.getElementById('commentCount').textContent = formatCount(post.comments);
      document.getElementById('commentTitle').textContent = `(${formatCount(post.comments)})`;
    }
  }

  window.toggleLike = async function() {
    const post = currentPost();
    if (!post?.cloudPost) return toast('Like a shared community post to save your like for everyone.');
    if (!await requireUser(() => retryOnPostAfterSignIn(post, toggleLike))) return;
    const query = cloudClient.from('post_likes');
    const result = post.likedByMe
      ? await query.delete().eq('post_id', post.cloudId).eq('user_id', ownId())
      : await query.insert({ post_id: post.cloudId, user_id: ownId() });
    if (result.error) return reportError(result.error, 'Could not save your like');
    post.likedByMe = !post.likedByMe;
    post.likes = Math.max(0, post.likes + (post.likedByMe ? 1 : -1));
    liked = post.likedByMe;
    document.getElementById('likes').textContent = formatCount(post.likes);
    document.getElementById('like').classList.toggle('on', liked);
    document.getElementById('like').setAttribute('aria-pressed', String(liked));
  };

  window.toggleBookmark = async function() {
    const post = currentPost();
    if (!post?.cloudPost) return toast('Save a shared community post to your account.');
    if (!await requireUser(() => retryOnPostAfterSignIn(post, toggleBookmark))) return;
    const result = post.bookmarkedByMe
      ? await cloudClient.from('post_bookmarks').delete().eq('post_id', post.cloudId).eq('user_id', ownId())
      : await cloudClient.from('post_bookmarks').insert({ post_id: post.cloudId, user_id: ownId() });
    if (result.error) return reportError(result.error, 'Could not save this post');
    post.bookmarkedByMe = !post.bookmarkedByMe;
    bookmarked = post.bookmarkedByMe;
    document.getElementById('bookmark').classList.toggle('on', bookmarked);
    toast(bookmarked ? 'Saved' : 'Removed from saved posts');
  };

  window.toggleFollow = async function() {
    const post = currentPost();
    if (!post?.userId) return toast('This creator does not have a public account profile yet.');
    if (!await requireUser(() => retryOnPostAfterSignIn(post, toggleFollow))) return;
    if (post.userId === ownId()) return toast('You cannot follow your own profile.');
    const result = post.followedByMe
      ? await cloudClient.from('post_follows').delete().eq('followed_id', post.userId).eq('follower_id', ownId())
      : await cloudClient.from('post_follows').insert({ followed_id: post.userId, follower_id: ownId() });
    if (result.error) return reportError(result.error, 'Could not update follow');
    post.followedByMe = !post.followedByMe;
    following = post.followedByMe;
    sharedPosts.forEach(item => { if (item.userId === post.userId) item.followedByMe = post.followedByMe; });
    document.getElementById('follow').textContent = following ? 'Following' : 'Follow';
    document.getElementById('follow').style.background = following ? '#34343b' : 'var(--pink)';
    if (activeFeedMode === 'following' && !post.followedByMe) applyFeedMode(true);
  };

  window.toggleComments = function() {
    const panel = document.getElementById('comments');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      document.getElementById('commentInput').disabled = !cloudUser;
      document.getElementById('commentInput').placeholder = cloudUser ? 'Add a comment…' : 'Sign in to comment…';
      loadComments(currentPost());
    }
  };

  async function loadComments(post) {
    const list = document.getElementById('commentList');
    list.replaceChildren();
    if (!post?.cloudPost) {
      const note = document.createElement('p'); note.className = 'empty-comments';
      note.textContent = 'Comments are available on shared community posts.'; list.append(note); return;
    }
    const { data, error } = await cloudClient.from('post_comments').select('id,user_id,body,created_at').eq('post_id', post.cloudId).order('created_at', { ascending: true }).limit(200);
    if (error) { reportError(error, 'Could not load comments'); return; }
    if (!data?.length) { const note = document.createElement('p'); note.className = 'empty-comments'; note.textContent = 'No comments yet. Start the conversation.'; list.append(note); return; }
    const ids = [...new Set(data.map(row => row.user_id))];
    const profiles = ids.length ? await cloudClient.from(profileTable).select('id,username,display_name,avatar_path').in('id', ids) : { data: [] };
    const byId = new Map((profiles.data || []).map(row => [row.id, row]));
    for (const row of data) {
      const profile = byId.get(row.user_id) || {};
      const article = document.createElement('article'); article.className = 'comment';
      const image = document.createElement('img'); image.className = 'avatar'; image.alt = '';
      image.src = publicAvatar(profile);
      const content = document.createElement('div');
      const author = document.createElement('b'); author.textContent = profile.display_name || 'देउडालय सदस्य';
      const username = document.createElement('small'); username.textContent = '@' + (profile.username || 'deudalaya');
      const body = document.createElement('p'); body.textContent = row.body;
      const time = document.createElement('small'); time.textContent = new Date(row.created_at).toLocaleString();
      content.append(author, username, body, time); article.append(image, content); list.append(article);
    }
    list.scrollTop = list.scrollHeight;
  }

  window.addComment = async function(event) {
    event.preventDefault();
    const post = currentPost(), input = document.getElementById('commentInput'), body = input.value.trim();
    if (!post?.cloudPost) return toast('Comments are available on shared community posts.');
    if (!body) return;
    if (!cloudUser) {
      window.pendingSocialAction = () => retryOnPostAfterSignIn(post, () => { input.value = body; document.querySelector('.comment-input').requestSubmit(); });
      openAuth();
      return;
    }
    const button = document.querySelector('.comment-input button'); button.disabled = true;
    try {
      const { error } = await cloudClient.from('post_comments').insert({ post_id: post.cloudId, user_id: ownId(), body });
      if (error) throw error;
      input.value = ''; post.comments++; document.getElementById('commentCount').textContent = formatCount(post.comments);
      document.getElementById('commentTitle').textContent = `(${formatCount(post.comments)})`;
      await loadComments(post);
    } catch (error) { reportError(error, 'Could not post comment'); }
    finally { button.disabled = false; }
  };

  window.openProfile = async function(userId = ownId()) {
    profileTargetId = userId || null;
    const ownProfile = profileTargetId && profileTargetId === ownId();
    const panel = document.getElementById('profilePanel');
    panel.classList.add('open');
    document.getElementById('profileEditor').hidden = true;
    syncProfileButtons();
    let profile = ownProfile ? await refreshOwnProfile() : null;
    if (profileTargetId && !ownProfile) {
      const { data, error } = await cloudClient.from(profileTable).select('*').eq('id', profileTargetId).maybeSingle();
      if (error) reportError(error, 'Could not load profile');
      profile = data;
    }
    if (profile) renderProfileFromRow(profile);
    else {
      document.getElementById('profileAvatar').src = asset('deudalaya_icon.webp');
      document.getElementById('profileDisplayName').textContent = cloudUser ? 'Your profile' : 'देउडालय';
      document.getElementById('profileUsername').textContent = cloudUser ? 'Profile loading…' : '@deudalaya';
      document.getElementById('profileBio').textContent = cloudUser ? '' : 'देउडालय - सुदूर - कर्णाली';
    }
    syncProfileButtons();
    const profileSource = profileTargetId ? sharedPosts : videos;
    const allPosts = profileSource.filter(post => profileTargetId ? post.userId === profileTargetId : !post.cloudPost || post.userId === ownId());
    document.getElementById('profilePostCount').textContent = formatCount(allPosts.length);
    document.getElementById('profileGrid').innerHTML = allPosts.map(post => {
      const src = post.videoSrc ? asset('deudalaya_icon.webp') : (post.image.startsWith('http') ? post.image : asset(post.image));
      const action = post.cloudPost ? `openFeedPostById('${escapeProfileText(post.cloudId)}')` : `openFeedPostByImage('${escapeProfileText(post.image)}')`;
      return `<button class="profile-post" onclick="${action}"><img loading="lazy" src="${escapeProfileText(src)}" alt="${escapeProfileText(post.caption)}"><span>▶</span></button>`;
    }).join('');
    const target = profileTargetId;
    if (target && cloudClient) {
      const [followers, followingRows] = await Promise.all([
        cloudClient.from('post_follows').select('follower_id').eq('followed_id', target),
        cloudClient.from('post_follows').select('followed_id').eq('follower_id', target)
      ]);
      document.getElementById('profileFollowerCount').textContent = formatCount(followers.data?.length);
      document.getElementById('profileFollowingCount').textContent = formatCount(followingRows.data?.length);
      const followButton = document.getElementById('profileFollowButton');
      if (target !== ownId() && ownId()) {
        const hasFollowed = (followers.data || []).some(row => row.follower_id === ownId());
        followButton.textContent = hasFollowed ? 'Following' : 'Follow';
        followButton.dataset.following = String(hasFollowed);
      }
    } else {
      document.getElementById('profileFollowerCount').textContent = '0';
      document.getElementById('profileFollowingCount').textContent = '0';
    }
  };

  function escapeProfileText(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  window.showProfileEditor = async function() {
    if (!await requireUser(() => showProfileEditor())) return;
    const profile = await refreshOwnProfile();
    if (!profile) return toast('Profile record is missing. Run the profile setup SQL first.');
    document.getElementById('editDisplayName').value = profile.display_name || '';
    document.getElementById('editUsername').value = profile.username || '';
    document.getElementById('editBio').value = profile.bio || '';
    document.getElementById('editAvatarFile').value = '';
    document.getElementById('profileEditor').hidden = false;
    document.getElementById('profileEditor').scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  window.saveProfile = async function(event) {
    event.preventDefault();
    if (!cloudUser) { openAuth(); return; }
    const form = event.currentTarget, button = form.querySelector('button[type="submit"]');
    const display_name = document.getElementById('editDisplayName').value.trim();
    const username = document.getElementById('editUsername').value.trim().toLowerCase();
    const bio = document.getElementById('editBio').value.trim();
    const avatar = document.getElementById('editAvatarFile').files[0];
    if (!/^[a-z0-9._]{3,24}$/.test(username)) return toast('Username must be 3–24 letters, numbers, dots, or underscores.');
    button.disabled = true; button.textContent = 'Saving…';
    try {
      let avatar_path = window.deudalayaProfile?.avatar_path || null;
      if (avatar) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(avatar.type) || avatar.size > 5 * 1024 * 1024) throw new Error('Choose a JPEG, PNG, or WebP photo up to 5 MB.');
        const ext = avatar.name.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = `${ownId()}/avatars/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await cloudClient.storage.from('videos').upload(path, avatar, { contentType: avatar.type, cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        avatar_path = path;
      }
      const { data, error } = await cloudClient.from(profileTable).update({ display_name, username, bio, avatar_path }).eq('id', ownId()).select('*').single();
      if (error) throw error;
      renderProfileFromRow(data);
      videos.forEach(post => { if (post.userId === ownId()) { post.profile = data; post.name = data.display_name; post.handle = data.username; post.avatar = publicAvatar(data); post.disc = publicAvatar(data); } });
      document.getElementById('profileEditor').hidden = true;
      render();
      toast('Profile saved');
    } catch (error) { reportError(error, 'Could not save your profile'); }
    finally { button.disabled = false; button.textContent = 'Save profile'; }
  };

  window.toggleProfileFollow = async function() {
    const target = profileTargetId, button = document.getElementById('profileFollowButton');
    if (!target || target === ownId() || !await requireUser(() => toggleProfileFollow())) return;
    const isFollowing = button.dataset.following === 'true';
    const result = isFollowing
      ? await cloudClient.from('post_follows').delete().eq('follower_id', ownId()).eq('followed_id', target)
      : await cloudClient.from('post_follows').insert({ follower_id: ownId(), followed_id: target });
    if (result.error) return reportError(result.error, 'Could not update follow');
    button.dataset.following = String(!isFollowing);
    button.textContent = isFollowing ? 'Follow' : 'Following';
    sharedPosts.forEach(post => { if (post.userId === target) post.followedByMe = !isFollowing; });
    const count = document.getElementById('profileFollowerCount');
    count.textContent = formatCount(Number(count.textContent.replaceAll(',', '')) + (isFollowing ? -1 : 1));
    if (activeFeedMode === 'following') applyFeedMode(true);
  };
  window.shareProfile = async function() {
    const username = document.getElementById('profileUsername').textContent.replace(/^@/, '');
    const url = new URL(location.href); url.hash = 'profile=' + encodeURIComponent(username);
    try {
      if (navigator.share) await navigator.share({ title: document.getElementById('profileDisplayName').textContent, url: url.href });
      else { await navigator.clipboard.writeText(url.href); toast('Profile link copied'); }
    } catch (error) { if (error.name !== 'AbortError') toast('Could not share this profile'); }
  };

  document.querySelectorAll('.nav-item').forEach(button => {
    if (button.textContent.trim() === 'Following') button.onclick = () => setFeedMode('following');
  });
  const friendsTab = document.querySelector('.mobile-nav button:nth-child(2)');
  if (friendsTab) friendsTab.onclick = () => setFeedMode('following');

  document.getElementById('profileAuthButton').onclick = () => cloudUser ? handleAuthAction() : openAuth();
  document.getElementById('commentInput').addEventListener('focus', () => {
    if (!cloudUser) { document.activeElement.blur(); openAuth(); }
  });
  setInterval(() => {
    const post = currentPost();
    if (document.hidden || !post?.cloudPost) return;
    loadCurrentEngagement(post);
    if (document.getElementById('comments').classList.contains('open')) loadComments(post);
  }, 15000);
  const searchHash = new URLSearchParams(location.hash.slice(1));
  const profileUsername = searchHash.get('profile');
  loadSupabaseClient().then(async client => {
    if (!client) return;
    if (cloudUser) await refreshOwnProfile();
    await loadRemotePosts();
    if (profileUsername) {
      const { data } = await client.from(profileTable).select('id').eq('username', profileUsername).maybeSingle();
      if (data) await openProfile(data.id);
    }
  });
})();
