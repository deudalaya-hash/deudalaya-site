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

test('gate presents no manual install instructions or alternate actions', () => {
  const gate = html.slice(html.indexOf('<section id="ecosystemGateway"'), html.indexOf('</section>', html.indexOf('<section id="ecosystemGateway"')) + 10);
  assert.equal((gate.match(/<button\b/g) || []).length, 1);
  assert.doesNotMatch(gate, /Add to Home|browser menu|Continue to Website|Open Deudalaya/i);
  assert.doesNotMatch(gatewayScript, /Add to Home|browser menu|Continue to Website|Open Deudalaya/i);
});

function createGatewayHarness({ outcome }) {
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
    deferredPrompt: promptEvent,
    deudalayaInstallState: 'available',
    addEventListener(name, handler) { windowListeners[name] = handler; }
  };
  vm.runInNewContext(gatewayScript, { document, window, navigator: {}, location: {}, Promise });
  return { button, buttonListeners, document, hint, promptCalls, window, windowListeners,
    get promptCalls() { return promptCalls; } };
}
