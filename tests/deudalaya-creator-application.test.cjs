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
    creatorInterestDeuda: fakeElement({ value: '' }),
    creatorInterestVillage: fakeElement({ value: '' }),
    creatorInterestCity: fakeElement({ value: '' }),
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

test('WhatsApp application includes each category interest answer', () => {
  const { elements, document } = creatorDocument();
  creatorApplication.initialize(document);
  elements.creatorInterestDeuda.value = 'Yes';
  elements.creatorInterestVillage.value = 'No';
  elements.creatorInterestCity.value = 'Yes';
  elements.creatorInterestDeuda.dispatch('change');
  const message = decodeURIComponent(elements.creatorApplyWhatsApp.href);
  assert.match(message, /देउडा \/ Deuda: Yes/);
  assert.match(message, /गाउँघर \/ Village: No/);
  assert.match(message, /शहर \/ City: Yes/);
});

test('category answers start unselected and are not assumed', () => {
  const { elements, document } = creatorDocument();
  creatorApplication.initialize(document);
  const message = decodeURIComponent(elements.creatorApplyWhatsApp.href);
  assert.match(message, /देउडा \/ Deuda: Not answered/);
  assert.match(message, /गाउँघर \/ Village: Not answered/);
  assert.match(message, /शहर \/ City: Not answered/);
});

test('short bilingual creator questions collect yes/no interest for all three categories', () => {
  assert.match(html, /देउडालयसँग काम गरौँ \/ Work with Deudalaya/);
  assert.match(html, /creatorInterestDeuda/);
  assert.match(html, /creatorInterestVillage/);
  assert.match(html, /creatorInterestCity/);
  assert.equal((html.match(/>हो \/ Yes</g) || []).length, 3);
  assert.equal((html.match(/>होइन \/ No</g) || []).length, 3);
  assert.match(html, /तपाईं कुन प्रकारका भिडियो बनाउनुहुन्छ\? \/ What videos do you make\?/);
});

test('compact social links and consent retain optional use permission and ownership protections', () => {
  assert.match(html, /सामाजिक सञ्जाल लिंक \/ Social links/);
  assert.match(html, /Facebook/);
  assert.match(html, /TikTok/);
  assert.match(html, /YouTube/);
  assert.match(html, /Instagram/);
  assert.match(html, /अन्य \/ Other/);
  assert.match(html, /creatorContentPermission/);
  assert.match(html, /मेरा सम्बन्धित सार्वजनिक सामग्री Deudalaya का social media, website र digital platforms मा share\/promote गर्न अनुमति दिन्छु/);
  assert.match(html, /I allow Deudalaya to share related public content on its platforms/);
  assert.match(html, /स्वामित्व र copyright मेरै रहनेछ/);
  assert.match(html, /ऐच्छिक छ; आवेदन दिन Yes चाहिँदैन/);
  assert.match(html, /प्रमाणपत्रका लागि देउडालयको review आवश्यक छ/);
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
  assert.match(css, /creator-interest-grid/);
  assert.match(css, /creator-social-grid/);
  assert.match(html, /creator-application\.js\?v=2026\.11\.10\.2/);
  assert.match(css, /max-height: min\(92dvh, 860px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
