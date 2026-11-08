(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DeudalayaFeedCategories = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const ACTIVE_CATEGORIES = Object.freeze(['देउडा', 'गाउँघर', 'शहर', 'सुदूर कर्णाली']);
  const DEFAULT_CATEGORY = 'देउडा';

  function categoryOf(post) {
    return post && (post.feedCategory || post.feed_category) || DEFAULT_CATEGORY;
  }

  function filterPosts(posts, category) {
    if (!ACTIVE_CATEGORIES.includes(category)) return [];
    return (posts || []).filter(post => categoryOf(post) === category);
  }

  return Object.freeze({ ACTIVE_CATEGORIES, DEFAULT_CATEGORY, categoryOf, filterPosts });
});
