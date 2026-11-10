const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const gatewayScript = fs.readFileSync(path.join(__dirname, '..', 'ecosystem-gateway.js'), 'utf8');

function createRelatedAppAndroidUi() {
  const windowListeners = {};
  const buttonListeners = {};
  const button = { hidden: true, disabled: true, textContent: '', addEventListener(type, handler) { buttonListeners[type] = handler; } };
  const hint = { textContent: '' };
  const intro = { textContent: '' };
  const steps = { innerHTML: '' };
  const classes = new Set();
  const document = {
    documentElement: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } },
    getElementById(id) { return ({ deudalayaInstallAction: button, deudalayaInstallHint: hint, deudalayaInstallIntro: intro, deudalayaInstallSteps: steps })[id] || null; }
  };
  let promptCalls = 0;
  const window = {
    deferredPrompt: null,
    deudalayaInstallState: 'installed',
    deudalayaInstallSource: 'related-app',
    deudalayaInstallationStatus: 'installed',
    addEventListener(type, handler) { windowListeners[type] = handler; },
    matchMedia: () => ({ matches: false })
  };
  const navigator = { userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile Safari/537.36', platform: 'Linux armv8l' };
  vm.runInNewContext(gatewayScript, { window, document, navigator, location: {}, Promise });
  return { button, buttonListeners, hint, intro, steps, window, windowListeners, classes, get promptCalls() { return promptCalls; }, setPromptCalls(value) { promptCalls = value; } };
}

test('Android browser mode keeps app access and install guidance after related-app detection', async () => {
  const ui = createRelatedAppAndroidUi();
  assert.equal(ui.button.hidden, false);
  assert.equal(ui.button.disabled, false);
  assert.match(ui.hint.textContent, /Home Screen/);
  assert.equal(ui.classes.has('ecosystem-gateway'), false);
});

test('a late Android beforeinstallprompt event is retained and invoked by the button gesture', async () => {
  const ui = createRelatedAppAndroidUi();
  let prevented = false;
  const event = {
    prompt() { ui.setPromptCalls(ui.promptCalls + 1); return Promise.resolve(); },
    userChoice: Promise.resolve({ outcome: 'accepted' }),
    preventDefault() { prevented = true; }
  };
  assert.equal(typeof ui.windowListeners.beforeinstallprompt, 'function');
  ui.windowListeners.beforeinstallprompt(event);
  assert.equal(prevented, true);
  assert.equal(ui.window.deferredPrompt, event);
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.promptCalls, 1);
});
