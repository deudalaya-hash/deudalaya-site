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

test('Install App is available only after a real prompt event is captured', () => {
  const button = html.match(/<button[^>]*id="deudalayaInstallAction"[^>]*>/);
  assert.ok(button);
  assert.match(button[0], /disabled/);
  assert.match(gatewayScript, /deudalaya-installpromptavailable/);
  assert.match(gatewayScript, /installButton\.disabled\s*=\s*!deferredPrompt/);
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
  assert.match(ui.hint.textContent, /accepted/i);
  assert.match(gatewayScript, /await\s+promptEvent\.userChoice/);
});

test('dismissed prompt does not reuse the consumed event; appinstalled updates state', async () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  ui.windowListeners['deudalaya-installpromptavailable']();
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.window.deferredPrompt, null);
  assert.equal(ui.button.disabled, true);
  assert.match(ui.hint.textContent, /cancelled/i);

  ui.windowListeners.appinstalled();
  assert.equal(ui.window.deudalayaInstallState, 'installed');
  assert.equal(ui.document.documentElement.classList.contains('ecosystem-gateway'), true);
  assert.equal(ui.button.hidden, true);
  assert.match(ui.hint.textContent, /installation confirmed/i);
});

test('an existing installation hides the install button and explains its state', () => {
  const ui = createGatewayHarness({ outcome: 'dismissed' });
  ui.window.deudalayaInstallState = 'installed';
  ui.window.deudalayaInstallSource = 'related-app';
  const stateChange = ui.windowListeners['deudalaya-installstatechange'];

  assert.equal(typeof stateChange, 'function');
  stateChange();
  assert.equal(ui.button.hidden, true);
  assert.match(ui.hint.textContent, /already installed/i);
});

test('browsers without the native prompt event get an honest fallback', () => {
  const ui = createGatewayHarness({ outcome: 'dismissed', supportsPrompt: false });

  assert.equal(ui.button.disabled, true);
  assert.match(ui.hint.textContent, /direct install prompt.*not supported/i);
  assert.match(ui.hint.textContent, /use the browser's install option/i);
});

test('gate presents no manual install instructions or alternate actions', () => {
  const gate = html.slice(html.indexOf('<section id="ecosystemGateway"'), html.indexOf('</section>', html.indexOf('<section id="ecosystemGateway"')) + 10);
  assert.equal((gate.match(/<button\b/g) || []).length, 1);
  assert.doesNotMatch(gate, /Add to Home|browser menu|Continue to Website|Open Deudalaya/i);
  assert.doesNotMatch(gatewayScript, /Add to Home|browser menu|Continue to Website|Open Deudalaya/i);
});

function createGatewayHarness({ outcome, supportsPrompt = true }) {
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
    deferredPrompt: supportsPrompt ? promptEvent : null,
    deudalayaInstallState: supportsPrompt ? 'available' : 'unavailable',
    addEventListener(name, handler) { windowListeners[name] = handler; }
  };
  if (supportsPrompt) window.onbeforeinstallprompt = null;
  vm.runInNewContext(gatewayScript, { document, window, navigator: {}, location: {}, Promise });
  return { button, buttonListeners, document, hint, promptCalls, window, windowListeners,
    get promptCalls() { return promptCalls; } };
}

function createPwaCaptureHarness(installedApps) {
  const head = html.slice(0, html.indexOf('</head>'));
  const capture = head.match(/<script id="deudalayaPwaCapture">([\s\S]*?)<\/script>/);
  assert.ok(capture, 'capture script is available for the browser-state test');
  const windowListeners = {};
  const dispatched = [];
  const classes = new Set();
  const document = {
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
  const navigator = {
    standalone: false,
    getInstalledRelatedApps() { return Promise.resolve(installedApps); }
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
    window,
    async settle() { await Promise.resolve(); await Promise.resolve(); }
  };
}
