'use strict';

(function(root, createApi) {
  const api = createApi();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (!root || !root.document) return;
  const document = root.document;
  const currentScriptUrl = document.currentScript && document.currentScript.src || root.location.href;
  const stylesheetUrl = new URL('creator-application.css', currentScriptUrl).href;
  const start = () => {
    if (!document.querySelector('link[data-deudalaya-creator-application]')) {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = stylesheetUrl;
      stylesheet.setAttribute('data-deudalaya-creator-application', '');
      document.head.appendChild(stylesheet);
    }
    api.initialize(document);
  };
  start();
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const WHATSAPP_BASE = 'https://wa.me/9779747704316?text=';
  const SOCIAL_FIELDS = [
    ['creatorFacebook', 'Facebook Profile / Page'],
    ['creatorTiktok', 'TikTok Profile'],
    ['creatorYoutube', 'YouTube Channel'],
    ['creatorInstagram', 'Instagram Profile'],
    ['creatorOther', 'Other']
  ];

  function createApplicationMessage(consentGranted, socialLinks = {}) {
    const permissionLine = consentGranted
      ? 'I agree to allow Deudalaya to share, republish and promote my content on its official social media platforms. I authorize Deudalaya to select public social media content related to its mission and share it on its official social media, website, and digital platforms. My content ownership and copyright remain mine.'
      : 'I have not granted permission for Deudalaya to reuse my content on its social media platforms. Please contact me for permission before using my content. My content ownership and copyright remain mine.';
    const links = SOCIAL_FIELDS.map(([id, label]) => `${label}: ${String(socialLinks[id] || '').trim() || 'Not provided'}`).join('\n');
    return `Namaste Deudalaya! I am interested in becoming a Deudalaya Certified Content Creator. ${permissionLine}\n\nMy social media links:\n${links}\n\nPlease share the application and certification details.`;
  }

  function createWhatsAppUrl(consentGranted, socialLinks) {
    return WHATSAPP_BASE + encodeURIComponent(createApplicationMessage(consentGranted, socialLinks));
  }

  function initialize(document) {
    if (!document || typeof document.getElementById !== 'function') return null;
    const button = document.getElementById('creatorApplyButton');
    const dialog = document.getElementById('creatorApplicationDialog');
    const closeButton = document.getElementById('creatorApplicationClose');
    const permission = document.getElementById('creatorContentPermission');
    const whatsappLink = document.getElementById('creatorApplyWhatsApp');
    if (!button || !dialog || !closeButton || !permission || !whatsappLink) return null;

    permission.checked = false;
    const socialInputs = SOCIAL_FIELDS.map(([id]) => document.getElementById(id));
    const readSocialLinks = () => Object.fromEntries(SOCIAL_FIELDS.map(([id], index) => [id, socialInputs[index]?.value || '']));
    const updateWhatsAppLink = () => { whatsappLink.href = createWhatsAppUrl(permission.checked, readSocialLinks()); };
    const closeDialog = () => {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else if (typeof dialog.removeAttribute === 'function') dialog.removeAttribute('open');
      button.focus();
    };

    button.addEventListener('click', event => {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      permission.checked = false;
      updateWhatsAppLink();
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else if (typeof dialog.setAttribute === 'function') dialog.setAttribute('open', '');
      closeButton.focus();
    });
    closeButton.addEventListener('click', event => {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      closeDialog();
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
    dialog.addEventListener('close', () => button.focus());
    permission.addEventListener('change', updateWhatsAppLink);
    socialInputs.forEach(input => input && input.addEventListener('input', updateWhatsAppLink));
    updateWhatsAppLink();
    return { close: closeDialog, updateWhatsAppLink };
  }

  return { initialize, createApplicationMessage, createWhatsAppUrl };
});
