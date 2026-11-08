(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.DeudalayaFeedCategories = api;
    if (root.document) {
      const buttons = root.document.querySelectorAll('.feed-category-tabs .feed-category');
      for (const button of buttons) {
        const category = (button.textContent || '').trim();
        if (!api.ACTIVE_CATEGORIES.includes(category)) {
          button.remove();
          continue;
        }
        const selected = category === api.DEFAULT_CATEGORY;
        button.setAttribute('data-feed-category', category);
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        if (selected) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
        button.onclick = function() {
          if (typeof root.setFeedCategory === 'function') return root.setFeedCategory(category);
        };
      }

      const selectDefaultCategory = function() {
        if (typeof root.setFeedCategory === 'function') root.setFeedCategory(api.DEFAULT_CATEGORY);
      };
      if (root.document.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', selectDefaultCategory, { once: true });
      } else {
        selectDefaultCategory();
      }
    }
  }
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const ACTIVE_CATEGORIES = Object.freeze(['देउडा', 'गाउँघर', 'शहर']);
  const DEFAULT_CATEGORY = 'देउडा';

  function categoryOf(post) {
    return post && (post.feedCategory || post.feed_category || post.category) || DEFAULT_CATEGORY;
  }

  function filterPosts(posts, category) {
    if (!ACTIVE_CATEGORIES.includes(category)) return [];
    return (posts || []).filter(post => categoryOf(post) === category);
  }

  return Object.freeze({ ACTIVE_CATEGORIES, DEFAULT_CATEGORY, categoryOf, filterPosts });
});
