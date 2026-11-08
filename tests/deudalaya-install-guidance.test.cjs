const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'ecosystem-gateway.js'), 'utf8');

test('installation guide is localized and renders a responsive step list', () => {
  assert.match(html, /id="deudalayaInstallIntro"/);
  assert.match(html, /id="deudalayaInstallSteps"/);
  assert.match(html, /lang="ne"/);
  assert.match(html, /class="gateway-card-art"><img src="assets\/deudalaya-install-art\.jpeg" alt="देउडालय लोगो"/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'deudalaya-install-art.jpeg')));
  const css = fs.readFileSync(path.join(root, 'ecosystem-gateway.css'), 'utf8');
  assert.match(css, /\.gateway-install-steps/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /padding: clamp\(88px, 16\.5vh, 138px\) 0 32px/);
});

test('Android Chrome, Edge, and Brave show their four Nepali Home Screen steps and a useful fallback action', () => {
  const cases = [
    { ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' },
    { ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0' },
    { ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36', brave: true }
  ];
  for (const item of cases) {
    const ui = createGateway({ ...item, platform: 'Linux armv8l', platformData: 'Android' });
    assert.equal(stepCount(ui), 4);
    assert.match(ui.steps.innerHTML, /तीनवटा थोप्ला/);
    assert.match(ui.steps.innerHTML, /“Install app” वा “Add to Home screen”/);
    assert.match(ui.steps.innerHTML, /Home Screen/);
    assert.equal(ui.button.hidden, false, 'the install action stays visible when Chrome has no prompt event');
    assert.equal(ui.button.textContent, 'Install App');
  }
});

test('Android Chrome fallback action explains the browser menu when no prompt event is available', async () => {
  const ui = createGateway({
    ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    platformData: 'Android'
  });
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.match(ui.hint.textContent, /⋮ मेनु/);
  assert.match(ui.hint.textContent, /Install app/);
});

test('iPhone Safari and touch iPadOS Safari show a clear manual-install action and Share flow', async () => {
  const iphone = createGateway({
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone'
  });
  assert.equal(stepCount(iphone), 3);
  assert.match(iphone.steps.innerHTML, /Share बटन/);
  assert.match(iphone.steps.innerHTML, /“Add to Home Screen”/);
  assert.equal(iphone.button.hidden, false);
  assert.equal(iphone.button.textContent, 'Install App');
  await iphone.buttonListeners.click({ preventDefault() {} });
  assert.match(iphone.hint.textContent, /Share बटन/);

  const ipad = createGateway({
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Safari/604.1',
    platform: 'MacIntel',
    maxTouchPoints: 5
  });
  assert.equal(stepCount(ipad), 3);
  assert.match(ipad.steps.innerHTML, /“Add to Home Screen”/);
  assert.equal(ipad.button.hidden, false);
});

test('Mac Safari and desktop Chrome show supported installation guidance', async () => {
  const safari = createGateway({
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
    platform: 'MacIntel'
  });
  assert.equal(stepCount(safari), 3);
  assert.match(safari.steps.innerHTML, /File मेनु/);
  assert.match(safari.steps.innerHTML, /“Add to Dock” उपलब्ध भए/);
  assert.equal(safari.button.hidden, false);
  await safari.buttonListeners.click({ preventDefault() {} });
  assert.match(safari.hint.textContent, /Add to Dock/);

  const chrome = createGateway({
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32',
    prompt: true
  });
  assert.equal(chrome.button.hidden, false);
  assert.match(chrome.steps.innerHTML, /Address bar नजिक/);
  assert.match(chrome.steps.innerHTML, /Install/);
});

test('unsupported browsers remain gated and iOS browsers get Safari instructions', () => {
  const firefox = createGateway({
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    platform: 'Win32',
    prompt: true
  });
  assert.equal(firefox.button.hidden, true);
  assert.match(firefox.intro.textContent, /Chrome वा Edge/);
  assert.doesNotMatch(firefox.steps.innerHTML, /Add to Home Screen|Add to Dock|Install app/);

  const iosChrome = createGateway({
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    prompt: true
  });
  assert.equal(iosChrome.button.hidden, false);
  assert.match(iosChrome.intro.textContent, /Safari/);
  assert.doesNotMatch(iosChrome.steps.innerHTML, /Add to Home Screen/);
});

test('standalone or already-installed mode hides the guide and its button', () => {
  const ui = createGateway({
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32',
    prompt: true,
    installed: true
  });
  assert.equal(ui.button.hidden, true);
  assert.equal(stepCount(ui), 0);
  assert.equal(ui.classes.has('ecosystem-gateway'), false);
});

function createGateway({ ua, platform = '', platformData = '', maxTouchPoints = 0, brave = false, prompt = false, installed = false }) {
  const buttonListeners = {};
  const windowListeners = {};
  const classes = new Set(['ecosystem-gateway']);
  const button = { hidden: false, disabled: false, textContent: '', addEventListener(name, fn) { buttonListeners[name] = fn; } };
  const hint = { textContent: '' };
  const intro = { textContent: '' };
  const steps = { innerHTML: '' };
  const document = {
    documentElement: { classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } } },
    getElementById(id) {
      return ({ deudalayaInstallAction: button, deudalayaInstallHint: hint, deudalayaInstallIntro: intro, deudalayaInstallSteps: steps })[id] || null;
    }
  };
  const promptEvent = prompt ? { prompt() { return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) } : null;
  const window = {
    __deudalayaInstallUiBound: false,
    deferredPrompt: promptEvent,
    deudalayaInstallState: installed ? 'installed' : (prompt ? 'available' : 'unavailable'),
    deudalayaInstallationStatus: installed ? 'installed' : (prompt ? 'prompt-available' : 'not-installed'),
    deudalayaInstallSource: installed ? 'standalone' : null,
    matchMedia() { return { matches: installed }; },
    addEventListener(name, fn) { windowListeners[name] = fn; }
  };
  if (prompt) window.onbeforeinstallprompt = null;
  const navigator = { userAgent: ua, platform, maxTouchPoints, standalone: installed, userAgentData: platformData ? { platform: platformData } : undefined };
  if (brave) navigator.brave = {};
  vm.runInNewContext(script, { document, navigator, window, Promise, setTimeout, clearTimeout });
  return { button, buttonListeners, classes, hint, intro, steps, window, windowListeners };
}

function stepCount(ui) {
  return (ui.steps.innerHTML.match(/<li>/g) || []).length;
}
