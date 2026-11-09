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
        button.style.fontSize = 'clamp(16px, calc(4vw + 2px), 19px)';
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

  function swipeDirection(startX, startY, endX, endY, threshold = 55) {
    const dx = endX - startX;
    const dy = endY - startY;
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy) * 1.25) return null;
    return dx < 0 ? 'left' : 'right';
  }

  function categoryAfterSwipe(category, direction) {
    const currentIndex = ACTIVE_CATEGORIES.indexOf(category);
    if (currentIndex < 0 || (direction !== 'left' && direction !== 'right')) return null;
    const nextIndex = currentIndex + (direction === 'left' ? 1 : -1);
    return nextIndex >= 0 && nextIndex < ACTIVE_CATEGORIES.length ? ACTIVE_CATEGORIES[nextIndex] : null;
  }

  return Object.freeze({ ACTIVE_CATEGORIES, DEFAULT_CATEGORY, categoryOf, filterPosts, swipeDirection, categoryAfterSwipe });
});
