const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const gatewaySource = fs.readFileSync(path.join(root, 'ecosystem-gateway.js'), 'utf8');

function createInstallHarness() {
  const windowListeners = new Map();
  const buttonListeners = new Map();
  const logs = [];
  const button = {
    disabled: false,
    hidden: false,
    textContent: '',
    addEventListener(type, listener) { buttonListeners.set(type, listener); }
  };
  const hint = { hidden: true, textContent: '' };
  const document = {
    documentElement: { classList: { add() {}, remove() {} } },
    getElementById(id) { return id === 'deudalayaInstallAction' ? button : id === 'deudalayaInstallHint' ? hint : null; }
  };
  const window = {
    addEventListener(type, listener) {
      const listeners = windowListeners.get(type) || [];
      listeners.push(listener);
      windowListeners.set(type, listeners);
    },
    dispatch(type, event = {}) {
      for (const listener of windowListeners.get(type) || []) listener(event);
    }
  };
  const context = {
    window,
    document,
    navigator: { standalone: false },
    console: { warn(...args) { logs.push(args); } },
    Promise
  };
  vm.runInNewContext(gatewaySource, context, { filename: 'ecosystem-gateway.js' });
  return {
    window, button, hint, logs,
    offerPrompt(prompt, outcome = 'accepted') {
      const event = {
        prevented: false,
        preventDefault() { this.prevented = true; },
        prompt,
        userChoice: Promise.resolve({ outcome })
      };
      window.dispatch('beforeinstallprompt', event);
      return event;
    },
    click() {
      const listener = buttonListeners.get('click');
      assert.ok(listener, 'install button click handler is bound');
      return listener({ preventDefault() {} });
    }
  };
}

test('install button consumes a captured browser event once from the user click', async () => {
  const app = createInstallHarness();
  let promptCalls = 0;
  const event = app.offerPrompt(() => { promptCalls += 1; return Promise.resolve(); });

  assert.equal(event.prevented, true);
  assert.equal(app.window.deferredPrompt, event);
  await app.click();
  await app.click();

  assert.equal(promptCalls, 1, 'the browser prompt event must not be reused');
  assert.equal(app.window.deferredPrompt, null);
});

test('dismissal explains that a fresh browser event or page reload is required, then accepts a new event', async () => {
  const app = createInstallHarness();
  let promptCalls = 0;
  app.offerPrompt(() => { promptCalls += 1; return Promise.resolve(); }, 'dismissed');
  await app.click();

  assert.match(app.hint.textContent, /dismiss|reload|try again/i);
  await app.click();
  assert.equal(promptCalls, 1, 'a dismissed one-shot event must not be called again');

  app.offerPrompt(() => { promptCalls += 1; return Promise.resolve(); }, 'accepted');
  await app.click();
  assert.equal(promptCalls, 2, 'a newly offered event must remain usable');
});

test('prompt failures log only a safe error name and show an actionable fallback', async () => {
  const app = createInstallHarness();
  app.offerPrompt(() => Promise.reject(Object.assign(new Error('secret-bearing message'), { name: 'SecurityError' })));
  await app.click();

  assert.match(app.hint.textContent, /reload|try again|available/i);
  assert.equal(app.logs.length, 1);
  assert.match(String(app.logs[0][0]), /install/i);
  assert.deepEqual(Object.keys(app.logs[0][1]), ['name']);
  assert.equal(app.logs[0][1].name, 'SecurityError');
  assert.doesNotMatch(JSON.stringify(app.logs), /secret-bearing/);
});

test('root manifest identity and service-worker registration use the same install scope', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.start_url, '/?app=deudalaya');
  assert.match(html, /<link[^>]+rel="manifest"[^>]+href="\/manifest\.webmanifest"/);
  assert.match(html, /serviceWorker\.register\('\/sw\.js',\s*\{\s*scope:\s*'\/'\s*\}\)/);
});

test('head captures beforeinstallprompt before the deferred install UI loads', () => {
  const capture = html.match(/<script id="deudalayaPwaCapture">([\s\S]*?)<\/script>/);
  assert.ok(capture, 'early PWA capture script is present');
  assert.ok(html.indexOf(capture[0]) < html.indexOf('<body'), 'capture runs before the page body and deferred UI');
  const listeners = new Map();
  const window = {
    matchMedia() { return { matches: false }; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    dispatchEvent() {}
  };
  const document = {
    hidden: false,
    documentElement: { classList: { add() {}, remove() {} } },
    addEventListener() {}
  };
  const navigator = { standalone: false };
  vm.runInNewContext(capture[1], { window, document, navigator, Event: class Event {} });
  const event = { prevented: false, preventDefault() { this.prevented = true; } };
  listeners.get('beforeinstallprompt')(event);

  assert.equal(event.prevented, true);
  assert.equal(window.deferredPrompt, event);
  assert.equal(window.deudalayaInstallState, 'available');
});
