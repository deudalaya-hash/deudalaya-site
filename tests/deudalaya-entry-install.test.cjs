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
  assert.match(html, /id="deudalayaInstallProgress"[\s\S]*?Installing Deudalaya\.\.\./);
  assert.match(html, /id="deudalayaOpenInstalled"[^>]*>Open Deudalaya/);
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
  const ui = createInstallHarness();

  let prompted = false;
  ui.windowEvents.beforeinstallprompt({ preventDefault() {}, prompt() { prompted = true; return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  const click = ui.buttonEvents.click({ preventDefault() {} });
  assert.equal(prompted, true, 'prompt is invoked synchronously in the click handler');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.progress.hidden, false);
  await click;

  ui.buttonEvents.click({ preventDefault() {} });
  assert.match(ui.hint.textContent, /Installation is not currently available/);

  ui.windowEvents.appinstalled();
  assert.equal(ui.button.hidden, true);
  assert.match(ui.progressTitle.textContent, /Installation Complete/);
});

test('entry script captures beforeinstallprompt and invokes it directly from the button tap', async () => {
  const ui = createInstallHarness();

  let prevented = false;
  let prompts = 0;
  const prompt = { preventDefault() { prevented = true; }, prompt() { prompts += 1; return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) };
  ui.windowEvents.beforeinstallprompt(prompt);
  ui.buttonEvents.click({ preventDefault() {} });
  assert.equal(prevented, true);
  assert.equal(prompts, 1, 'the native prompt is called during the same click task');
  await new Promise(resolve => setImmediate(resolve));
  assert.match(ui.progressTitle.textContent, /Installing Deudalaya/);
});

test('accepted installation shows progress until appinstalled, then offers Open Deudalaya', async () => {
  const ui = createInstallHarness();
  const prompt = { preventDefault() {}, prompt() { return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) };
  ui.windowEvents.beforeinstallprompt(prompt);
  ui.buttonEvents.click({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(ui.progress.hidden, false);
  assert.equal(ui.progressTitle.textContent, 'Installing Deudalaya...');
  ui.windowEvents.appinstalled();
  assert.equal(ui.progressTitle.textContent, 'Installation Complete');
  assert.equal(ui.openButton.hidden, false);
  ui.openButtonEvents.click({ preventDefault() {} });
  assert.equal(ui.location.href, '/?app=deudalaya');
});

test('cancelled install returns to the Install App card without a progress screen', async () => {
  const ui = createInstallHarness();
  ui.windowEvents.beforeinstallprompt({ preventDefault() {}, prompt() { return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
  ui.buttonEvents.click({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(ui.progress.hidden, true);
  assert.equal(ui.installCard.hidden, false);
  assert.equal(ui.button.hidden, false);
  assert.match(ui.hint.textContent, /cancelled/i);
});

test('unconfirmed install progress ends with a clear retry state', async () => {
  const ui = createInstallHarness();
  ui.windowEvents.beforeinstallprompt({ preventDefault() {}, prompt() { return Promise.resolve(); }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  ui.buttonEvents.click({ preventDefault() {} });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ui.progress.hidden, false);

  ui.runInstallTimeout();
  assert.equal(ui.progress.hidden, true);
  assert.equal(ui.installCard.hidden, false);
  assert.match(ui.hint.textContent, /could not confirm/i);
});

function createInstallHarness() {
  const buttonEvents = {};
  const openButtonEvents = {};
  const windowEvents = {};
  const installButton = { hidden: false, disabled: false, addEventListener(name, fn) { buttonEvents[name] = fn; } };
  const openButton = { hidden: true, addEventListener(name, fn) { openButtonEvents[name] = fn; } };
  const hint = { textContent: '' };
  const progressTitle = { textContent: '' };
  const progressMessage = { textContent: '' };
  const progress = { hidden: true, setAttribute() {} };
  const spinner = { hidden: false };
  const installCard = { hidden: false };
  let timer;
  const elements = {
    deudalayaInstallAction: installButton,
    deudalayaOpenInstalled: openButton,
    deudalayaInstallHint: hint,
    deudalayaInstallProgress: progress,
    deudalayaInstallSpinner: spinner,
    deudalayaInstallProgressTitle: progressTitle,
    deudalayaInstallProgressMessage: progressMessage,
    deudalayaInstallCard: installCard
  };
  const document = {
    documentElement: { classList: { contains(name) { return name === 'ecosystem-gateway'; } } },
    getElementById(id) { return elements[id] || null; }
  };
  const location = { origin: 'https://deudalaya.com', href: '', assign(url) { this.href = url; } };
  const window = { deudalayaInstallPrompt: null, addEventListener(name, fn) { windowEvents[name] = fn; }, setTimeout(fn) { timer = fn; return 9; }, clearTimeout() { timer = null; }, location };
  vm.runInNewContext(entry, { document, window, navigator: {}, location, URL, Promise, Object });
  return {
    buttonEvents,
    openButtonEvents,
    windowEvents,
    button: installButton,
    openButton,
    hint,
    progressTitle,
    progressMessage,
    progress,
    spinner,
    installCard,
    location,
    runInstallTimeout() { const fn = timer; timer = null; if (fn) fn(); }
  };
}

test('standalone Deudalaya launch goes to the feed instead of the entry screen', () => {
  const inline = html.match(/\(function\(\)\{try\{var modes[\s\S]*?\}\)\(\);/);
  assert.ok(inline);
  assert.match(inline[0], /if\(!gatewayLaunch&&standalone\)document\.documentElement\.classList\.add\('deudalaya-installed'\)/);
  assert.match(JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8')).start_url, /app=deudalaya/);
});
