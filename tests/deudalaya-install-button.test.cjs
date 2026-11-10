const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const socialScript = fs.readFileSync(path.join(root, 'social.js'), 'utf8');
const gatewayScript = fs.existsSync(path.join(root, 'ecosystem-gateway.js'))
  ? fs.readFileSync(path.join(root, 'ecosystem-gateway.js'), 'utf8')
  : '';

test('the install gate captures the genuine browser event in the document head', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  const capture = head.match(/<script id="deudalayaPwaCapture">([\s\S]*?)<\/script>/);
  assert.ok(capture, 'capture script is in the document head');
  assert.match(capture[1], /addEventListener\(['"]beforeinstallprompt['"]/);
  assert.match(capture[1], /event\.preventDefault\(\)/);
  assert.match(capture[1], /window\.deferredPrompt\s*=\s*event/);
  assert.match(capture[1], /__deudalayaPwaCaptureBound/);
});

test('normal browser mode is gated by the poster until an installation is detected', () => {
  assert.match(html, /^<!doctype html>\s*<html lang="en">/);
  assert.match(html, /deudalaya-install-required/);
  assert.match(html, /\.deudalaya-install-required \.app\s*\{[^}]*display:\s*none/);
  assert.match(html, /id="deudalayaInstallLanding"[\s\S]*?assets\/deudalaya-install-poster\.jpeg/);
  assert.match(html, /function render\(\)\{\s*const v=videos\[index\]/);
  assert.match(html, /restoreLocalVideos\(\)/);
  assert.match(socialScript, /applyFeedMode\(true\);\s*setInterval\(/);
  assert.doesNotMatch(socialScript, /if\s*\(window\.deudalayaIsStandalone\(\)\)\s*\{\s*applyFeedMode/);
  assert.match(html, /function retryCurrentVideo\(\)\{const v=videos\[index\]/);
  assert.match(html, /id="feed"/);
  assert.match(html, /id="deudalayaInstallAction"/);
});

test('appinstalled is handled once by the install UI', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  const capture = head.match(/<script id="deudalayaPwaCapture">([\s\S]*?)<\/script>/);
  assert.equal((capture[1].match(/addEventListener\(['"]appinstalled['"]/g) || []).length, 0);
  assert.equal((gatewayScript.match(/addEventListener\(['"]appinstalled['"]/g) || []).length, 1);
});

test('an already installed PWA is detected in a regular browser tab', async () => {
  const capture = createPwaCaptureHarness([{ platform: 'webapp', id: 'https://deudalaya.com/' }]);
  await capture.settle();

  assert.equal(capture.window.deudalayaInstallState, 'installed');
  assert.equal(capture.window.deudalayaInstallSource, 'related-app');
  assert.equal(capture.window.deferredPrompt, null);
  assert.ok(capture.dispatched.includes('deudalaya-installstatechange'));
});

test('the early listener stores Chrome’s genuine prompt and updates the install state', async () => {
  const capture = createPwaCaptureHarness([]);
  let prevented = false;
  const promptEvent = { preventDefault() { prevented = true; } };
  capture.windowListeners.beforeinstallprompt(promptEvent);

  assert.equal(prevented, true);
  assert.equal(capture.window.deferredPrompt, promptEvent);
  assert.equal(capture.window.deudalayaInstallState, 'available');
  assert.equal(capture.window.deudalayaInstallationStatus, 'prompt-available');
  assert.ok(capture.dispatched.includes('deudalaya-installpromptavailable'));
  await capture.settle();
});

test('desktop browser stays gated while Chrome prompt uses the install button', () => {
  const capture = createPwaCaptureHarness([], {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32'
  });
  assert.equal(capture.classes.has('deudalaya-install-required'), true);
  let prevented = false;
  const promptEvent = { preventDefault() { prevented = true; } };
  capture.windowListeners.beforeinstallprompt(promptEvent);
  assert.equal(prevented, true);
  assert.equal(capture.window.deferredPrompt, promptEvent);
  assert.equal(capture.window.deudalayaInstallationStatus, 'prompt-available');
});

test('installation status tracks pending, cancellation, and success explicitly', async () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  assert.equal(ui.window.deudalayaInstallationStatus, 'prompt-available');
  const click = ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.window.deudalayaInstallationStatus, 'installation-pending');
  await click;
  assert.equal(ui.window.deudalayaInstallationStatus, 'not-installed');
  ui.windowListeners.appinstalled();
  assert.equal(ui.window.deudalayaInstallationStatus, 'installed');
});

test('installed state is rechecked when Chrome restores or foregrounds the page', async () => {
  const capture = createPwaCaptureHarness([]);
  await capture.settle();
  const initialQueries = capture.queryCount;
  assert.equal(typeof capture.windowListeners.pageshow, 'function');
  capture.windowListeners.pageshow();
  await capture.settle();

  const afterPageShow = capture.queryCount;
  assert.ok(afterPageShow > initialQueries);
  capture.setInstalledApps([{ platform: 'webapp', id: 'https://deudalaya.com/' }]);
  capture.document.hidden = false;
  assert.equal(typeof capture.documentListeners.visibilitychange, 'function');
  capture.documentListeners.visibilitychange();
  await capture.settle();
  assert.equal(capture.window.deudalayaInstallState, 'installed');
  assert.equal(capture.classes.has('deudalaya-install-required'), false, 'an already installed app releases the feed');
  assert.ok(capture.queryCount > afterPageShow);
});

test('standalone detection releases the required install landing', () => {
  const installed = createPwaCaptureHarness([], { userAgent: 'Android', platform: 'Android' }, true);
  assert.equal(installed.classes.has('deudalaya-install-required'), false);
  assert.equal(installed.window.deudalayaInstallationStatus, 'installed');

  const iosHomeScreen = createPwaCaptureHarness([], { userAgent: 'iPhone', platform: 'iPhone' }, false, true);
  assert.equal(iosHomeScreen.classes.has('deudalaya-install-required'), false);
  assert.equal(iosHomeScreen.window.deudalayaInstallSource, 'standalone');
});

test('Install App starts a native prompt only after a real browser event is captured', () => {
  const button = html.match(/<button[^>]*id="deudalayaInstallAction"[^>]*>/);
  assert.ok(button);
  assert.match(html, /id="deudalayaInstallAction"[^>]*aria-label="Install App"/);
  assert.doesNotMatch(button[0], /disabled/);
  assert.match(gatewayScript, /deudalaya-installpromptavailable/);
  assert.match(gatewayScript, /promptEvent\.prompt\(\)/);
});

test('no native prompt keeps the install action and shows only the supported-browser message', async () => {
  const ui = createGatewayHarness({
    outcome: 'dismissed',
    eventAvailable: false,
    userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l'
  });

  assert.equal(ui.button.hidden, false);
  assert.equal(ui.hint.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.equal(ui.hint.hidden, false);
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.promptCalls, 0);
  assert.equal(ui.hint.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.doesNotMatch(ui.hint.textContent, /menu|Menu|⋮|Install app|Add to Home screen/);
});

test('button calls prompt synchronously, awaits userChoice, and clears the consumed event', async () => {
  const ui = createGatewayHarness({ outcome: 'accepted' });
  let prevented = false;
  const handler = ui.windowListeners['deudalaya-installpromptavailable'];
  assert.ok(handler, 'gateway listens for the early capture notification');
  handler();
  const click = ui.buttonListeners.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.promptCalls, 1, 'prompt() runs during the click gesture');
  assert.equal(ui.window.deferredPrompt, null, 'the consumed prompt is cleared immediately');
  assert.notEqual(ui.hint.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  await click;
  assert.match(ui.hint.textContent, /Installation accepted/);
  assert.match(gatewayScript, /await\s+promptEvent\.userChoice/);
});

test('dismissed prompt keeps the gate; confirmed installation releases it', async () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  ui.windowListeners['deudalaya-installpromptavailable']();
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.window.deferredPrompt, null);
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.hint.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.equal(ui.document.documentElement.classList.contains('deudalaya-install-required'), true);

  ui.windowListeners.appinstalled();
  assert.equal(ui.window.deudalayaInstallState, 'installed');
  assert.equal(ui.document.documentElement.classList.contains('deudalaya-install-required'), false);
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.hint.textContent, 'Deudalaya is already installed.');
});

test('an existing installation hides the install button without manual launch instructions', () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  ui.window.deudalayaInstallState = 'installed';
  ui.window.deudalayaInstallSource = 'related-app';
  const stateChange = ui.windowListeners['deudalaya-installstatechange'];

  assert.equal(typeof stateChange, 'function');
  stateChange();
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.hint.textContent, 'Deudalaya is already installed.');
});

test('desktop browsers without a native prompt show only the concise supported-browser message', () => {
  const ui = createGatewayHarness({ outcome: 'dismissed', supportsPrompt: false });

  assert.equal(ui.button.hidden, false);
  assert.equal(ui.hint.textContent, 'Direct installation is not currently available in this browser. Please try a supported browser.');
  assert.doesNotMatch(ui.hint.textContent, /menu|Menu|⋮|Address bar|Install app/);
});

test('the poster landing contains the real install action and fallback status', () => {
  assert.match(html, /id="deudalayaInstallLanding"[\s\S]*?id="deudalayaInstallAction"[\s\S]*?id="deudalayaInstallHint"/);
  assert.match(html, /id="deudalayaInstallHint"[^>]*hidden/);
  assert.doesNotMatch(html, /id="ecosystemGateway"/);
});

function createGatewayHarness({ outcome, supportsPrompt = true, eventAvailable = supportsPrompt, userAgent, platform }) {
  const buttonListeners = {};
  const windowListeners = {};
  const classes = new Set();
  classes.add('deudalaya-install-required');
  const button = {
    disabled: true,
    addEventListener(name, handler) { buttonListeners[name] = handler; }
  };
  const hint = { textContent: '' };
  const intro = { textContent: '' };
  const steps = { innerHTML: '' };
  const guide = { hidden: false };
  const document = {
    documentElement: {
      classList: {
        contains(name) { return classes.has(name); },
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); }
      },
      dataset: {}
    },
    getElementById(id) {
      return id === 'deudalayaInstallAction' ? button
        : id === 'deudalayaInstallHint' ? hint
          : id === 'deudalayaInstallIntro' ? intro
            : id === 'deudalayaInstallSteps' ? steps
          : id === 'deudalayaInstallHelp' ? guide : null;
    }
  };
  let promptCalls = 0;
  const promptEvent = {
    prompt() { promptCalls += 1; return Promise.resolve(); },
    userChoice: Promise.resolve({ outcome })
  };
  const window = {
    deferredPrompt: eventAvailable ? promptEvent : null,
    deudalayaInstallState: eventAvailable ? 'available' : 'unavailable',
    deudalayaInstallationStatus: eventAvailable ? 'prompt-available' : 'not-installed',
    addEventListener(name, handler) { windowListeners[name] = handler; }
  };
  if (supportsPrompt) window.onbeforeinstallprompt = null;
  const navigator = {
    userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    platform: platform || 'Win32'
  };
  vm.runInNewContext(gatewayScript, { document, window, navigator, location: {}, Promise });
  return { button, buttonListeners, document, guide, hint, intro, steps, promptCalls, window, windowListeners,
    get promptCalls() { return promptCalls; } };
}

function createPwaCaptureHarness(installedApps, browser = {
  userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile Safari/537.36',
  platform: 'Linux armv8l'
}, standalone = false, iosStandalone = standalone) {
  const head = html.slice(0, html.indexOf('</head>'));
  const capture = head.match(/<script id="deudalayaPwaCapture">([\s\S]*?)<\/script>/);
  assert.ok(capture, 'capture script is available for the browser-state test');
  const windowListeners = {};
  const documentListeners = {};
  const dispatched = [];
  const classes = new Set();
  const document = {
    hidden: true,
    addEventListener(name, handler) { documentListeners[name] = handler; },
    documentElement: {
      classList: {
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); }
      }
    }
  };
  const window = {
    __deudalayaPwaCaptureBound: false,
    deferredPrompt: null,
    addEventListener(name, handler) { windowListeners[name] = handler; },
    dispatchEvent(event) { dispatched.push(event.type); },
    matchMedia() { return { matches: standalone }; }
  };
  let relatedApps = installedApps;
  let queryCount = 0;
  const navigator = {
    standalone: iosStandalone,
    userAgent: browser.userAgent,
    platform: browser.platform,
    getInstalledRelatedApps() { queryCount += 1; return Promise.resolve(relatedApps); }
  };
  vm.runInNewContext(capture[1], {
    document,
    navigator,
    window,
    Event: class { constructor(type) { this.type = type; } }
  });
  return {
    classes,
    dispatched,
    document,
    documentListeners,
    window,
    windowListeners,
    get queryCount() { return queryCount; },
    setInstalledApps(apps) { relatedApps = apps; },
    async settle() { await Promise.resolve(); await Promise.resolve(); }
  };
}
