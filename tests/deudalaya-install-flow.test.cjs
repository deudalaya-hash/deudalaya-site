const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const script = fs.readFileSync(path.resolve(__dirname, '..', 'deudalaya-install-gate.js'), 'utf8');

function createInstallPage(search = '', standalone = false, installedApps) {
  const windowEvents = {};
  const actionEvents = {};
  const documentEvents = {};
  const rootClasses = new Set();
  const bodyClasses = new Set();
  const action = {
    hidden: false,
    disabled: false,
    textContent: 'Install App',
    focus() { this.focused = true; },
    addEventListener(name, handler) { actionEvents[name] = handler; },
    getClientRects() { return [{}]; }
  };
  const open = { hidden: true, focus() {} };
  const continueLink = { hidden: false, focus() {}, getClientRects() { return [{}]; } };
  const gate = {
    hidden: false,
    parentElement: null,
    contains(node) { return node === action || node === open || node === continueLink; },
    querySelectorAll() { return [action, open, continueLink]; }
  };
  const body = { classList: { add(name) { bodyClasses.add(name); } }, children: [gate] };
  gate.parentElement = body;
  const document = {
    activeElement: action,
    body,
    referrer: '',
    documentElement: { classList: {
      contains(name) { return rootClasses.has(name); },
      add(name) { rootClasses.add(name); }
    } },
    getElementById(id) {
      return { deudalayaInstallGate: gate, deudalayaInstallAction: action,
        deudalayaInstallHint: hint, deudalayaOpenInstalled: open }[id] || null;
    },
    addEventListener(name, handler) { documentEvents[name] = handler; }
  };
  const hint = { textContent: '' };
  const window = {
    deudalayaInstallPrompt: null,
    matchMedia() { return { matches: standalone }; },
    addEventListener(name, handler) { windowEvents[name] = handler; }
  };
  const navigator = { userAgent: 'Android', platform: 'Linux armv8l', maxTouchPoints: 0 };
  if (installedApps) navigator.getInstalledRelatedApps = () => Promise.resolve(installedApps);
  vm.runInNewContext(script, { window, document, navigator, location: { search, origin: 'https://deudalaya.com' }, URL, URLSearchParams });
  return { action, actionEvents, bodyClasses, continueLink, documentEvents, gate, hint, open, rootClasses, window, windowEvents };
}

test('Continue to Website bypasses the install gate without trapping the visitor', () => {
  const page = createInstallPage('?app=deudalaya&continue=1');
  assert.equal(page.gate.hidden, true);
  assert.equal(page.bodyClasses.has('install-required'), false);
});

test('native install prompt is triggered by the Install App action and confirmation is observed', async () => {
  const page = createInstallPage();
  assert.equal(page.gate.hidden, false);
  assert.equal(page.bodyClasses.has('install-required'), true);
  let prompted = false;
  page.windowEvents.beforeinstallprompt({
    preventDefault() {},
    prompt() { prompted = true; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  });
  const installClick = page.actionEvents.click();
  assert.equal(prompted, true, 'native prompt starts synchronously from the click');
  await installClick;
  assert.match(page.hint.textContent, /Waiting for browser confirmation/);
  page.windowEvents.appinstalled();
  assert.equal(page.open.hidden, false);
});

test('browsers without a native install event show a simple availability message', async () => {
  const unsupported = createInstallPage();
  await unsupported.actionEvents.click();
  assert.match(unsupported.hint.textContent, /installation is not currently available/i);
  assert.equal(unsupported.action.textContent, 'Install App');

  const standalone = createInstallPage('', true);
  assert.equal(standalone.gate.hidden, true);
  assert.equal(standalone.rootClasses.has('deudalaya-installed'), true);
});
test('native install cancellation keeps the native Install App action available', async () => {
  const page = createInstallPage();
  page.windowEvents.beforeinstallprompt({
    preventDefault() {},
    prompt() {},
    userChoice: Promise.resolve({ outcome: 'dismissed' })
  });
  await page.actionEvents.click();
  assert.equal(page.action.textContent, 'Install App');
  assert.match(page.hint.textContent, /cancelled/i);
  assert.doesNotMatch(page.hint.textContent, /browser menu/);
});

test('an already installed related Deudalaya app hides the Install App button', async () => {
  const installed = createInstallPage('', false, [{ id: 'https://deudalaya.com/' }]);
  await Promise.resolve();
  assert.equal(installed.action.hidden, true);
  assert.equal(installed.open.hidden, false);
});
