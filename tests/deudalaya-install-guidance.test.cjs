const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'ecosystem-gateway.js'), 'utf8');

test('installation help is localized without manual installation steps', () => {
  assert.match(html, /id="deudalayaInstallIntro"/);
  assert.match(html, /id="deudalayaInstallSteps"/);
  assert.match(html, /id="deudalayaInstallHelp"/);
  assert.match(html, /class="gateway-install app-install-action"/);
  const css = fs.readFileSync(path.join(root, 'ecosystem-gateway.css'), 'utf8');
  assert.match(css, /\.gateway-install-steps/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /padding: clamp\(88px, 16\.5vh, 138px\) 0 32px/);
});

test('Android Chrome, Edge, and Brave show the concise fallback when no native prompt is captured', () => {
  const cases = [
    { ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36' },
    { ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0' },
    { ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36', brave: true }
  ];
  for (const item of cases) {
    const ui = createGateway({ ...item, platform: 'Linux armv8l', platformData: 'Android' });
    assert.equal(stepCount(ui), 0);
    assert.equal(ui.intro.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
    assert.doesNotMatch(ui.intro.textContent + ui.steps.innerHTML + ui.hint.textContent, /तीनवटा थोप्ला|मेनु|Install app|Add to Home screen/);
    assert.equal(ui.button.hidden, false, 'the install action stays visible when Chrome has no prompt event');
    assert.equal(ui.button.textContent, 'Install App');
  }
});

test('Android Chrome with a captured install event presents the button as a direct native install action', async () => {
  const ui = createGateway({
    ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    platformData: 'Android',
    prompt: true
  });

  assert.match(ui.intro.textContent, /Tap INSTALL APP/);
  assert.doesNotMatch(ui.steps.innerHTML, /तीनवटा थोप्ला|मेनु/);
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.promptCalls, 1);
});

test('any captured browser prompt is invoked directly regardless of browser detection', async () => {
  const ui = createGateway({
    ua: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
    platform: 'Linux x86_64',
    prompt: true
  });
  assert.equal(ui.steps.innerHTML, '');
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.promptCalls, 1);
});

test('Android Chrome fallback shows only the short supported-browser message', async () => {
  const ui = createGateway({
    ua: 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    platformData: 'Android'
  });
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.hint.textContent, '');
  assert.equal(ui.intro.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.equal(ui.steps.innerHTML, '');
});

test('iPhone Safari and touch iPadOS Safari show the direct-install-unavailable message', async () => {
  const iphone = createGateway({
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone'
  });
  assert.equal(stepCount(iphone), 0);
  assert.equal(iphone.intro.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.equal(iphone.button.hidden, false);
  assert.equal(iphone.button.textContent, 'Install App');
  await iphone.buttonListeners.click({ preventDefault() {} });
  assert.equal(iphone.hint.textContent, '');

  const ipad = createGateway({
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Safari/604.1',
    platform: 'MacIntel',
    maxTouchPoints: 5
  });
  assert.equal(stepCount(ipad), 0);
  assert.equal(ipad.intro.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.equal(ipad.button.hidden, false);
});

test('native-prompt browsers use the direct button and other browsers get the concise fallback', async () => {
  const safari = createGateway({
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
    platform: 'MacIntel'
  });
  assert.equal(stepCount(safari), 0);
  assert.equal(safari.intro.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.equal(safari.button.hidden, false);
  await safari.buttonListeners.click({ preventDefault() {} });
  assert.equal(safari.hint.textContent, '');

  const chrome = createGateway({
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32',
    prompt: true
  });
  assert.equal(chrome.button.hidden, false);
  assert.match(chrome.intro.textContent, /INSTALL APP/);
  assert.doesNotMatch(chrome.steps.innerHTML, /Address bar|⋮ मेनु/);
  assert.equal(chrome.button.textContent, 'Install App');
});

test('unsupported browsers remain usable and every unavailable prompt gets the same concise fallback', () => {
  const firefox = createGateway({
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    platform: 'Win32'
  });
  assert.equal(firefox.button.hidden, false);
  assert.equal(firefox.intro.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.doesNotMatch(firefox.steps.innerHTML, /Add to Home Screen|Add to Dock|Install app/);

  const iosChrome = createGateway({
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    prompt: true
  });
  assert.equal(iosChrome.button.hidden, false);
  assert.match(iosChrome.intro.textContent, /Tap INSTALL APP/);
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

test('gateway contains no browser-menu or manual-install instructions', () => {
  assert.doesNotMatch(script, /three.?dot|⋮|browser.?menu|Address bar|Add to Home Screen|Add to Dock|Share बटन|Home Screen वा App list|मेनु|browser menu/i);
});

function createGateway({ ua, platform = '', platformData = '', maxTouchPoints = 0, brave = false, prompt = false, installed = false }) {
  const buttonListeners = {};
  const windowListeners = {};
  const classes = new Set();
  let promptCalls = 0;
  const button = { hidden: false, disabled: false, textContent: '', addEventListener(name, fn) { buttonListeners[name] = fn; } };
  const hint = { textContent: '' };
  const intro = { textContent: '' };
  const steps = { innerHTML: '' };
  const guide = { hidden: false };
  const document = {
    documentElement: { classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } } },
    getElementById(id) {
      return ({ deudalayaInstallAction: button, deudalayaInstallHint: hint, deudalayaInstallIntro: intro, deudalayaInstallSteps: steps, deudalayaInstallHelp: guide })[id] || null;
    }
  };
  const promptEvent = prompt ? { prompt() { promptCalls += 1; return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) } : null;
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
  return { button, buttonListeners, classes, guide, hint, intro, steps, window, windowListeners, get promptCalls() { return promptCalls; } };
}

function stepCount(ui) {
  return (ui.steps.innerHTML.match(/<li>/g) || []).length;
}
