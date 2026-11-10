const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const creatorApplication = require('../creator-application.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'creator-application.css'), 'utf8');

function fakeElement(initial = {}) {
  const listeners = new Map();
  return {
    ...initial,
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || [];
      callbacks.push(callback);
      listeners.set(type, callbacks);
    },
    dispatch(type, event = {}) {
      for (const callback of listeners.get(type) || []) callback({ target: this, ...event });
    },
    focus() { this.focused = true; },
    showModal() { this.open = true; },
    close() { this.open = false; this.dispatch('close'); }
  };
}

function creatorDocument() {
  const elements = {
    creatorApplyButton: fakeElement(),
    creatorApplicationDialog: fakeElement(),
    creatorApplicationClose: fakeElement(),
    creatorContentPermission: fakeElement({ checked: false }),
    creatorApplyWhatsApp: fakeElement({ href: '' }),
    creatorFacebook: fakeElement({ value: '' }),
    creatorTiktok: fakeElement({ value: '' }),
    creatorYoutube: fakeElement({ value: '' }),
    creatorInstagram: fakeElement({ value: '' }),
    creatorOther: fakeElement({ value: '' })
  };
  return {
    elements,
    document: { getElementById: id => elements[id], activeElement: elements.creatorApplyButton }
  };
}

test('the ADD button opens and closes the creator application dialog without navigating away', () => {
  const { elements, document } = creatorDocument();
  creatorApplication.initialize(document);
  elements.creatorApplyButton.dispatch('click', { preventDefault() {} });
  assert.equal(elements.creatorApplicationDialog.open, true);
  assert.equal(elements.creatorApplicationClose.focused, true);
  elements.creatorApplicationClose.dispatch('click', { preventDefault() {} });
  assert.equal(elements.creatorApplicationDialog.open, false);
  assert.equal(elements.creatorApplyButton.focused, true);
});

test('WhatsApp application text reflects optional unchecked and checked content permission', () => {
  const { elements, document } = creatorDocument();
  creatorApplication.initialize(document);
  assert.equal(elements.creatorContentPermission.checked, false);
  assert.equal(elements.creatorApplyWhatsApp.disabled, undefined);
  assert.match(decodeURIComponent(elements.creatorApplyWhatsApp.href), /I have not granted permission for Deudalaya to reuse my content on its social media platforms\./);
  assert.equal(elements.creatorApplyWhatsApp.href.startsWith('https://wa.me/9779747704316?text='), true);

  elements.creatorContentPermission.checked = true;
  elements.creatorContentPermission.dispatch('change');
  assert.match(decodeURIComponent(elements.creatorApplyWhatsApp.href), /I agree to allow Deudalaya to share, republish and promote my content on its official social media platforms\./);
  assert.match(decodeURIComponent(elements.creatorApplyWhatsApp.href), /official social media, website, and digital platforms/);
  assert.match(decodeURIComponent(elements.creatorApplyWhatsApp.href), /ownership and copyright remain mine/i);
  assert.doesNotMatch(decodeURIComponent(elements.creatorApplyWhatsApp.href), /I have not granted permission/);

  elements.creatorApplicationClose.dispatch('click', { preventDefault() {} });
  elements.creatorApplyButton.dispatch('click', { preventDefault() {} });
  assert.equal(elements.creatorContentPermission.checked, false, 'reopening starts without carrying forward consent');
  assert.match(decodeURIComponent(elements.creatorApplyWhatsApp.href), /I have not granted permission/);
});

test('WhatsApp message includes the user-provided social profile links', () => {
  const { elements, document } = creatorDocument();
  creatorApplication.initialize(document);
  elements.creatorFacebook.value = 'https://facebook.com/deuda.creator';
  elements.creatorFacebook.dispatch('input');
  const message = decodeURIComponent(elements.creatorApplyWhatsApp.href);
  assert.match(message, /Facebook Profile \/ Page: https:\/\/facebook\.com\/deuda\.creator/);
  assert.match(message, /TikTok Profile: Not provided/);
  assert.match(message, /YouTube Channel: Not provided/);
  assert.match(message, /Instagram Profile: Not provided/);
  assert.match(message, /Other: Not provided/);
});

test('creator application UI presents all requested categories and keeps consent optional and separate from certification', () => {
  assert.match(html, /WORK WITH DEUDALAYA/);
  assert.match(html, /Become a Deudalaya Certified Content Creator/);
  assert.match(html, /Do you create videos celebrating our culture, traditions, lifestyle and communities\?/);
  assert.match(html, /Become part of the Deudalaya creator community\. Share your creativity and help bring Karnali and SudurPaschim's identity to the world\./i);
  assert.match(html, /<h3>देउडा<\/h3><p>Deuda, songs, dance and cultural traditions/);
  assert.match(html, /<h3>गाउँघर<\/h3><p>Village life, traditions, people, stories and local activities/);
  assert.match(html, /<h3>शहर<\/h3><p>Urban lifestyle, creativity, events and communities/);
  assert.match(html, /तपाईंका सामाजिक सञ्जालका लिंकहरू उपलब्ध गराउनुहोस्/);
  assert.match(html, /म देउडालयलाई मेरा सार्वजनिक सामाजिक सञ्जाल सामग्रीमध्ये देउडालयको उद्देश्यसँग सम्बन्धित सामग्री छनोट गरी आफ्ना आधिकारिक सामाजिक सञ्जाल, वेबसाइट तथा डिजिटल प्लेटफर्महरूमा साझा, पुनःप्रकाशन र प्रचार–प्रसार गर्न अनुमति दिन्छु। आवश्यक परेमा सामग्री प्रयोग गर्नुअघि देउडालयले मसँग सम्पर्क गर्न सक्नेछ।/);
  assert.match(html, /मेरा सामग्रीको स्वामित्व र प्रतिलिपि अधिकार मसँगै रहनेछ।/);
  assert.match(html, /यो अनुमति स्वैच्छिक हो। अनुमति नदिँदा पनि तपाईंले सिर्जनाकर्ताका लागि आवेदन दिन सक्नुहुनेछ।/);
  assert.match(html, /प्रमाणपत्र स्वीकृत गर्ने अन्तिम निर्णय देउडालयले गर्नेछ/);
  assert.match(html, /id="creatorContentPermission" type="checkbox"(?![^>]*\b(?:required|checked)\b)/);
  assert.match(html, /id="creatorFacebook"/);
  assert.match(html, /id="creatorTiktok"/);
  assert.match(html, /id="creatorYoutube"/);
  assert.match(html, /id="creatorInstagram"/);
  assert.match(html, /id="creatorOther"/);
  assert.match(html, /id="creatorApplyWhatsApp"[^>]*>APPLY VIA WHATSAPP</);
  assert.match(html, /class="mobile-add"[^>]*id="creatorApplyButton"/);
  assert.match(html, /<script src="creator-application\.js\?v=/);
  assert.match(css, /@media \(max-width: 560px\)/);
  assert.match(css, /max-height: min\(92dvh, 860px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
