const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const entry = fs.readFileSync(path.join(root, 'ecosystem-gateway.js'), 'utf8');

test('root visitor sees only the Deudalaya branded install page', () => {
  assert.match(html, /else if\(gatewayLaunch\|\|!standalone\)document\.documentElement\.classList\.add\('ecosystem-gateway'\)/);
  assert.match(html, /ONE CIRCLE[\s\S]*?ONE NEPAL/);
  assert.match(html, /One community\. <em>Many stories\.<\/em>/);
  assert.match(html, /Create and share videos rooted in Deuda and Nepali community life\./);
  assert.match(html, /id="deudalayaInstallAction"[^>]*>Install App<\/button>/);
  assert.doesNotMatch(html, /gateway-footnote|gateway-footer|ecosystem-install-exit/);
  assert.match(fs.readFileSync(path.join(root, 'ecosystem-gateway.css'), 'utf8'), /gateway-card:not\(\[data-app="deudalaya"\]\)\{display:none\}/);
});

test('Deudalaya install action immediately invokes the captured native prompt', () => {
  assert.match(entry, /installButton\.addEventListener\('click', function\s*\(clickEvent\)/);
  assert.match(entry, /clickEvent\.preventDefault\(\)/);
  const promptAt = entry.indexOf('promptResult = promptEvent.prompt()');
  const asyncAt = entry.indexOf('Promise.resolve(promptResult)');
  assert.ok(promptAt !== -1 && asyncAt > promptAt, 'prompt is invoked before asynchronous waits');
  assert.match(entry, /Installation is not currently available/);
});

test('entry button calls the native prompt on click and reports when unavailable', async () => {
  const buttonEvents = {};
  const windowEvents = {};
  const button = { hidden: false, disabled: false, addEventListener(name, fn) { buttonEvents[name] = fn; } };
  const hint = { textContent: '' };
  const document = {
    documentElement: { classList: { contains(name) { return name === 'ecosystem-gateway'; } } },
    getElementById(id) { return id === 'deudalayaInstallAction' ? button : id === 'deudalayaInstallHint' ? hint : null; },
    querySelector() { return null; }
  };
  const window = { deudalayaInstallPrompt: null, addEventListener(name, fn) { windowEvents[name] = fn; } };
  vm.runInNewContext(entry, { document, window, navigator: {}, location: { origin: 'https://deudalaya.com' }, URL, Promise, Object });

  let prompted = false;
  windowEvents.beforeinstallprompt({ preventDefault() {}, prompt() { prompted = true; return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  const click = buttonEvents.click({ preventDefault() {} });
  assert.equal(prompted, true, 'prompt is invoked synchronously in the click handler');
  await new Promise(resolve => setImmediate(resolve));
  assert.match(hint.textContent, /Waiting for browser confirmation/);
  await click;

  window.deudalayaInstallPrompt = null;
  buttonEvents.click({ preventDefault() {} });
  assert.match(hint.textContent, /Installation is not currently available/);

  windowEvents.appinstalled();
  assert.equal(button.hidden, true);
  assert.match(hint.textContent, /Installed\. Open Deudalaya from its app icon/);
});

test('entry script captures beforeinstallprompt and invokes it directly from the button tap', async () => {
  const buttonEvents = {};
  const windowEvents = {};
  const button = { hidden: false, disabled: false, addEventListener(name, fn) { buttonEvents[name] = fn; } };
  const hint = { textContent: '' };
  const document = {
    documentElement: { classList: { contains(name) { return name === 'ecosystem-gateway'; } } },
    getElementById(id) { return id === 'deudalayaInstallAction' ? button : id === 'deudalayaInstallHint' ? hint : null; }
  };
  const window = { deudalayaInstallPrompt: null, addEventListener(name, fn) { windowEvents[name] = fn; } };
  vm.runInNewContext(entry, { document, window, navigator: {}, location: { origin: 'https://deudalaya.com' }, URL, Promise, Object });

  let prevented = false;
  let prompts = 0;
  const prompt = { preventDefault() { prevented = true; }, prompt() { prompts += 1; return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) };
  windowEvents.beforeinstallprompt(prompt);
  buttonEvents.click({ preventDefault() {} });
  assert.equal(prevented, true);
  assert.equal(prompts, 1, 'the native prompt is called during the same click task');
  await new Promise(resolve => setImmediate(resolve));
  assert.match(hint.textContent, /Waiting for browser confirmation/);
});

test('standalone Deudalaya launch goes to the feed instead of the entry screen', () => {
  const inline = html.match(/\(function\(\)\{try\{var modes[\s\S]*?\}\)\(\);/);
  assert.ok(inline);
  assert.match(inline[0], /if\(!gatewayLaunch&&standalone\)document\.documentElement\.classList\.add\('deudalaya-installed'\)/);
  assert.match(JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8')).start_url, /app=deudalaya/);
});
