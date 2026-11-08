const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
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

test('desktop visitors are not forced into the install gate', () => {
  const capture = createPwaCaptureHarness([], {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32'
  });
  assert.equal(capture.classes.has('ecosystem-gateway'), false);
  let prevented = false;
  capture.windowListeners.beforeinstallprompt({ preventDefault() { prevented = true; } });
  assert.equal(prevented, false, 'desktop Chrome keeps its browser-native install behavior');
  assert.equal(capture.window.deferredPrompt, null, 'desktop prompt events are left to the browser');
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
  assert.ok(capture.queryCount > afterPageShow);
});

test('Install App only reports ready after a real prompt event is captured', () => {
  const button = html.match(/<button[^>]*id="deudalayaInstallAction"[^>]*>/);
  assert.ok(button);
  assert.match(html, /id="deudalayaInstallAction"[^>]*>Install App<\/button>/);
  assert.doesNotMatch(button[0], /disabled/);
  assert.match(gatewayScript, /deudalaya-installpromptavailable/);
  assert.match(gatewayScript, /देउडालय स्थापना गर्न तयार छ।/);
});

test('no native prompt hides the button and does not promise a browser menu option', async () => {
  const ui = createGatewayHarness({ outcome: 'dismissed', eventAvailable: false });

  assert.equal(ui.button.hidden, true);
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.promptCalls, 0);
  assert.match(ui.hint.textContent, /अहिले स्थापना विकल्प उपलब्ध छैन/);
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
  await click;
  assert.match(ui.hint.textContent, /स्वीकार गरियो/);
  assert.match(gatewayScript, /await\s+promptEvent\.userChoice/);
});

test('dismissed prompt does not reuse the consumed event; appinstalled updates state', async () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  ui.windowListeners['deudalaya-installpromptavailable']();
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.window.deferredPrompt, null);
  assert.equal(ui.button.disabled, false);
  assert.match(ui.hint.textContent, /रद्द गरियो/);

  ui.windowListeners.appinstalled();
  assert.equal(ui.window.deudalayaInstallState, 'installed');
  assert.equal(ui.document.documentElement.classList.contains('ecosystem-gateway'), false);
  assert.equal(ui.button.hidden, true);
  assert.match(ui.hint.textContent, /पहिल्यै स्थापित/);
});

test('an existing installation hides the install button and explains its state', () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  ui.window.deudalayaInstallState = 'installed';
  ui.window.deudalayaInstallSource = 'related-app';
  const stateChange = ui.windowListeners['deudalaya-installstatechange'];

  assert.equal(typeof stateChange, 'function');
  stateChange();
  assert.equal(ui.button.hidden, true);
  assert.match(ui.hint.textContent, /पहिल्यै स्थापित/);
});

test('browsers without the native prompt event show no install button', () => {
  const ui = createGatewayHarness({ outcome: 'dismissed', supportsPrompt: false });

  assert.equal(ui.button.hidden, true);
  assert.match(ui.hint.textContent, /अहिले स्थापना विकल्प उपलब्ध छैन/);
});

test('gate presents no manual install instructions or alternate actions', () => {
  const gate = html.slice(html.indexOf('<section id="ecosystemGateway"'), html.indexOf('</section>', html.indexOf('<section id="ecosystemGateway"')) + 10);
  assert.equal((gate.match(/<button\b/g) || []).length, 1);
  assert.doesNotMatch(gate, /Continue to Website|Open Deudalaya/i);
  assert.doesNotMatch(gatewayScript, /Continue to Website|Open Deudalaya/i);
});

function createGatewayHarness({ outcome, supportsPrompt = true, eventAvailable = supportsPrompt }) {
  const buttonListeners = {};
  const windowListeners = {};
  const classes = new Set(['ecosystem-gateway']);
  const button = {
    disabled: true,
    addEventListener(name, handler) { buttonListeners[name] = handler; }
  };
  const hint = { textContent: '' };
  const document = {
    documentElement: {
      classList: {
        contains(name) { return classes.has(name); },
        remove(name) { classes.delete(name); }
      },
      dataset: {}
    },
    getElementById(id) {
      return id === 'deudalayaInstallAction' ? button : id === 'deudalayaInstallHint' ? hint : null;
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
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
    platform: 'Win32'
  };
  vm.runInNewContext(gatewayScript, { document, window, navigator, location: {}, Promise });
  return { button, buttonListeners, document, hint, promptCalls, window, windowListeners,
    get promptCalls() { return promptCalls; } };
}

function createPwaCaptureHarness(installedApps, browser = {
  userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile Safari/537.36',
  platform: 'Linux armv8l'
}) {
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
    matchMedia() { return { matches: false }; }
  };
  let relatedApps = installedApps;
  let queryCount = 0;
  const navigator = {
    standalone: false,
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
