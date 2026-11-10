const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'ecosystem-gateway.js'), 'utf8');
const fallback = 'Direct installation is not currently available in this browser. Please try a supported browser.';

test('the landing poster fills the screen with the real install button over its printed CTA', () => {
  assert.match(html, /id="deudalayaInstallLanding"[\s\S]*?assets\/deudalaya-install-poster\.jpeg/);
  assert.match(html, /aspect-ratio:\s*901\s*\/\s*1600/);
  assert.match(html, /\.deudalaya-install-action\s*\{[^}]*position:\s*absolute/);
  assert.match(html, /\.deudalaya-install-action\s*\{[^}]*left:\s*15\.8%[^}]*top:\s*81\.25%/);
  assert.match(html, /id="deudalayaInstallAction"[^>]*aria-label="Install App"/);
  assert.match(html, /\.deudalaya-install-required \.app\s*\{[^}]*display:\s*none/);
});

test('unsupported browsers show only the short fallback and keep the feed gated', () => {
  const ui = createGateway({ prompt: false });
  assert.equal(ui.hint.textContent, fallback);
  assert.equal(ui.hint.hidden, false);
  assert.equal(ui.button.hidden, false);
  assert.equal(ui.classes.has('deudalaya-install-required'), true);
  assert.doesNotMatch(script, /three.?dot|⋮|browser.?menu|Address bar|Add to Home Screen|Add to Dock|मेनु|browser menu/i);
});

test('a saved browser prompt is called directly by the button and dismissal retains the gate', async () => {
  const ui = createGateway({ prompt: true, outcome: 'dismissed' });
  let prevented = false;
  const clickPromise = ui.buttonListeners.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.promptCalls, 1);
  assert.equal(ui.window.deferredPrompt, null);
  await clickPromise;
  assert.equal(ui.classes.has('deudalaya-install-required'), true);
  assert.equal(ui.hint.textContent, fallback);
});

test('accepted installation remains gated until appinstalled confirms completion', async () => {
  const ui = createGateway({ prompt: true, outcome: 'accepted' });
  await ui.buttonListeners.click({ preventDefault() {} });
  assert.equal(ui.classes.has('deudalaya-install-required'), true);
  assert.match(ui.hint.textContent, /Installation accepted/);
  ui.windowListeners.appinstalled();
  assert.equal(ui.classes.has('deudalaya-install-required'), false);
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.hint.textContent, 'Deudalaya is already installed.');
});

test('standalone and already-installed sessions release the landing', () => {
  const ui = createGateway({ installed: true });
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.classes.has('deudalaya-install-required'), false);
});

function createGateway({ prompt = false, outcome = 'dismissed', installed = false }) {
  const buttonListeners = {};
  const windowListeners = {};
  const classes = new Set(['deudalaya-install-required']);
  let promptCalls = 0;
  const button = { hidden: false, disabled: false, textContent: '', addEventListener(type, handler) { buttonListeners[type] = handler; } };
  const hint = { hidden: true, textContent: '' };
  const document = {
    documentElement: { classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); }
    } },
    getElementById(id) { return id === 'deudalayaInstallAction' ? button : id === 'deudalayaInstallHint' ? hint : null; }
  };
  const deferredPrompt = prompt ? {
    prompt() { promptCalls += 1; return Promise.resolve(); },
    userChoice: Promise.resolve({ outcome })
  } : null;
  const window = {
    deferredPrompt,
    deudalayaInstallState: installed ? 'installed' : prompt ? 'available' : 'unavailable',
    deudalayaInstallationStatus: installed ? 'installed' : prompt ? 'prompt-available' : 'not-installed',
    addEventListener(type, handler) { windowListeners[type] = handler; },
    matchMedia() { return { matches: installed }; }
  };
  const navigator = { standalone: installed };
  vm.runInNewContext(script, { document, navigator, window, Promise });
  return { button, buttonListeners, classes, hint, window, windowListeners, get promptCalls() { return promptCalls; } };
}
