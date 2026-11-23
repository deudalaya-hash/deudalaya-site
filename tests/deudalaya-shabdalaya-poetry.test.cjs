const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'shabdalaya-poetry.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'shabdalaya-poetry.css'), 'utf8');
const poetryData = require(path.join(root, 'shabdalaya-poetry-data.js'));

function sectionMarkup(id) {
  return html.match(new RegExp(`<section\\b(?=[^>]*id="${id}")[\\s\\S]*?<\\/section>`))?.[0] || '';
}

function musicScreenMarkup() {
  return sectionMarkup('deudaSongScreen');
}

test('Shabdalaya has an independent poetry data source and renders no Deuda library markup', () => {
  const screen = sectionMarkup('shabdalayaScreen');
  const musicScreen = musicScreenMarkup();
  const template = html.match(/<template id="shabdalayaPoetryPostTemplate">[\s\S]*?<\/template>/)?.[0];
  assert.match(screen, /class="shabdalaya-screen"/);
  assert.match(screen, /class="shabdalaya-poetry-list"/);
  assert.doesNotMatch(screen, /<article|deuda-song|चल गोबिन्दे|भान साली|देउडा गीत/);
  assert.ok(template, 'poetry posts are rendered from their own neutral template');
  assert.doesNotMatch(template, /deuda-song|चल गोबिन्दे|भान साली/);
  assert.match(musicScreen, /deuda-song-grid/);
  assert.equal((musicScreen.match(/class="deuda-song-audio"/g) || []).length, 2);
  assert.doesNotMatch(musicScreen, /shabdalaya-poetry/);
  assert.match(html, /<script src="shabdalaya-poetry-data\.js"><\/script>\s*<script src="shabdalaya-poetry\.js"><\/script>/);
  assert.equal(poetryData.length, 1, 'only the existing poetry item is in the production data source');
  assert.equal(poetryData[0].type, 'audio-poetry');
  assert.equal(poetryData[0].title, 'काठमाडौंको साँझ');
  assert.equal(poetryData[0].audio, 'assets/shabdalaya-kathmandu-poem.m4a');
  assert.ok(poetryData.every(post => ['audio-poetry', 'spoken-word', 'literary-audio'].includes(post.type)));
});

test('poetry renderer filters song records, removes duplicates, and supports multiple poetry posts', () => {
  const harness = createRendererHarness();
  vm.runInNewContext(script, harness.context);

  const poetry = poetryData[0];
  const extraPoetryFixture = { ...poetry, id: 'renderer-test-second', title: 'Test-only fixture', audio: 'test-only.m4a' };
  const songRecord = { id: 'not-a-poem', type: 'deuda-song', title: 'चल गोबिन्दे', audio: 'assets/chal-gobinde-song.m4a' };
  const count = harness.context.window.renderShabdalayaPoetryFeed([poetry, extraPoetryFixture, songRecord, poetry]);

  assert.equal(count, 2);
  assert.equal(harness.list.children.length, 2);
  assert.deepEqual(harness.list.children.map(post => post.refs['.shabdalaya-poetry-title'].textContent), ['काठमाडौंको साँझ', 'Test-only fixture']);
  assert.deepEqual(harness.list.children.map(post => post.refs['.shabdalaya-poetry-audio'].src), [poetry.audio, 'test-only.m4a']);
  assert.equal(harness.list.children.some(post => post.refs['.shabdalaya-poetry-title'].textContent.includes('चल गोबिन्दे')), false);
  assert.equal(harness.emptyState.hidden, true);
});

test('poetry and song screens have separate scroll roots and the poetry list stacks posts', () => {
  assert.match(styles, /\.shabdalaya-screen\{[^}]*overflow-y:auto/);
  assert.match(styles, /\.shabdalaya-poetry-list\{[^}]*display:flex;flex-direction:column/);
  assert.doesNotMatch(styles, /\.shabdalaya-poetry-list\{[^}]*overflow-y\s*:/);
  assert.match(html, /\.deuda-song-screen\{[^}]*overflow-y:auto/);
  assert.match(styles, /@media\s*\(max-width:\s*700px\)/);
});

test('opening either screen hides the other and pauses all audio in the previous screen', () => {
  const controls = html.match(/<script>\s*(var deudaSongTrigger=null,shabdalayaTrigger=null;[\s\S]*?function closeShabdalayaScreen\([\s\S]*?\n\})/)?.[1];
  assert.ok(controls, 'screen controls are available');

  const classes = new Set();
  const main = { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  const screen = () => ({ hidden: true, scrollTop: 20, closest: () => main });
  const shabdalayaScreen = screen();
  const songScreen = screen();
  const attrs = new Map();
  const trigger = name => ({
    getAttribute: attr => attr === 'aria-controls' ? name : null,
    setAttribute: (attr, value) => attrs.set(name + ':' + attr, value),
    focus() { this.focused = true; }
  });
  const shabdalayaButton = trigger('shabdalayaScreen');
  const songButton = trigger('deudaSongScreen');
  const makeAudio = () => ({ paused: false, pauseCount: 0, pause() { this.paused = true; this.pauseCount += 1; } });
  const poemAudios = [makeAudio(), makeAudio()];
  const songAudio = makeAudio();
  const feedVideo = makeAudio();
  const back = { focus() { this.focused = true; } };
  const context = {
    document: {
      activeElement: shabdalayaButton,
      getElementById: id => ({ shabdalayaScreen, deudaSongScreen: songScreen, postVideo: feedVideo, shabdalayaBack: back }[id] || null),
      querySelector: selector => selector.includes('shabdalayaScreen') ? shabdalayaButton : songButton,
      querySelectorAll: selector => selector === '.shabdalaya-poetry-audio' ? poemAudios : selector === '.deuda-song-audio' ? [songAudio] : []
    }
  };

  vm.runInNewContext(controls, context);
  context.openShabdalayaScreen();
  assert.equal(shabdalayaScreen.hidden, false);
  assert.equal(songScreen.hidden, true);
  assert.equal(classes.has('shabdalaya-open'), true);
  assert.equal(classes.has('deuda-song-open'), false);
  assert.equal(feedVideo.paused, true);

  context.document.activeElement = songButton;
  context.openDeudaSongScreen();
  assert.equal(shabdalayaScreen.hidden, true);
  assert.equal(songScreen.hidden, false);
  assert.equal(classes.has('shabdalaya-open'), false);
  assert.equal(classes.has('deuda-song-open'), true);
  assert.ok(poemAudios.every(audio => audio.paused && audio.pauseCount === 1));
  assert.equal(songAudio.pauseCount, 1);

  context.document.activeElement = shabdalayaButton;
  context.openShabdalayaScreen();
  poemAudios.forEach(audio => { audio.paused = false; });
  context.closeShabdalayaScreen();
  assert.ok(poemAudios.every(audio => audio.paused && audio.pauseCount === 2));
});

test('each rendered poetry player keeps explicit playback, seeking, social controls, and single-audio behavior', () => {
  const harness = createRendererHarness();
  vm.runInNewContext(script, harness.context);
  harness.context.window.renderShabdalayaPoetryFeed(poetryData);
  const post = harness.list.children[0];
  const refs = post.refs;
  const audio = refs['.shabdalaya-poetry-audio'];
  const songAudio = harness.songAudio;
  const feedVideo = harness.feedVideo;

  assert.equal(audio.playCount, 0, 'renderer does not autoplay');
  refs['.shabdalaya-audio-toggle'].handlers.click();
  assert.equal(audio.playCount, 1);
  assert.equal(songAudio.pauseCount, 1);
  assert.equal(feedVideo.pauseCount, 1);
  assert.equal(refs['.shabdalaya-audio-toggle'].attrs['aria-pressed'], 'true');

  audio.currentTime = 6;
  audio.handlers.loadedmetadata();
  refs['.shabdalaya-poetry-progress'].value = '7.5';
  refs['.shabdalaya-poetry-progress'].handlers.input();
  assert.equal(audio.currentTime, 7.5);
  refs['[aria-label="Like poem"]'].handlers.click();
  assert.equal(refs['[aria-label="Like poem"]'].attrs['aria-pressed'], 'true');
  refs['[aria-label="Bookmark poem"]'].handlers.click();
  assert.equal(refs['[aria-label="Bookmark poem"]'].attrs['aria-pressed'], 'true');
  refs['[aria-label="Comment on poem"]'].handlers.click();
  assert.match(refs['.shabdalaya-poetry-status'].textContent, /टिप्पणी/);
});

function createRendererHarness() {
  function element(initial = {}) {
    const handlers = {};
    const attrs = { ...(initial.attrs || {}) };
    return {
      ...initial,
      handlers,
      attrs,
      dataset: {},
      textContent: initial.textContent || '',
      hidden: Boolean(initial.hidden),
      classList: { toggle(name, enabled) { this[name] = enabled; } },
      addEventListener(name, handler) { handlers[name] = handler; },
      setAttribute(name, value) { attrs[name] = value; },
      getAttribute(name) { return attrs[name] ?? null; },
      querySelector(selector) { return initial.querySelector ? initial.querySelector(selector) : null; },
      replaceChildren() { this.children = []; },
      appendChild(child) { this.children.push(child); }
    };
  }

  function createPost() {
    const refs = {};
    [
      '.shabdalaya-poetry-title', '.shabdalaya-author', '.shabdalaya-post-meta', '.shabdalaya-kind-label',
      '.shabdalaya-poem-lines', '.shabdalaya-poem-description', '.shabdalaya-poem-tags', '.shabdalaya-profile-image',
      '.shabdalaya-poetry-audio', '.shabdalaya-audio-player', '.shabdalaya-poetry-progress', '.shabdalaya-current-time',
      '.shabdalaya-duration', '.shabdalaya-poetry-status', '.shabdalaya-audio-toggle', '[aria-label="Like poem"]',
      '.shabdalaya-like-count', '[aria-label="Bookmark poem"]', '[aria-label="Comment on poem"]', '[aria-label="Share poem"]'
    ].forEach(selector => { refs[selector] = element(); });

    const audio = refs['.shabdalaya-poetry-audio'];
    audio.paused = true;
    audio.ended = false;
    audio.currentTime = 0;
    audio.duration = 20;
    audio.playCount = 0;
    audio.pauseCount = 0;
    audio.play = () => {
      audio.playCount += 1;
      audio.paused = false;
      if (audio.handlers.play) audio.handlers.play();
      return Promise.resolve();
    };
    audio.pause = () => {
      audio.pauseCount += 1;
      audio.paused = true;
      if (audio.handlers.pause) audio.handlers.pause();
    };
    refs['.shabdalaya-audio-toggle'].querySelector = () => element();
    refs['[aria-label="Like poem"]'].querySelector = () => element();
    refs['[aria-label="Bookmark poem"]'].querySelector = () => element();
    refs['.shabdalaya-poetry-progress'].matches = () => false;
    const post = element({ refs });
    post.querySelector = selector => refs[selector] || null;
    post.setAttribute = (name, value) => { post.attrs[name] = value; };
    post.classList = { toggle(name, enabled) { post.isPlaying = enabled; } };
    post.cloneNode = () => post;
    return post;
  }

  const list = element({ children: [] });
  const emptyState = element({ hidden: true });
  const template = { content: { firstElementChild: { cloneNode: createPost } } };
  const songAudio = element({ paused: false, pauseCount: 0, pause() { this.paused = true; this.pauseCount += 1; } });
  const feedVideo = element({ paused: false, pauseCount: 0, pause() { this.paused = true; this.pauseCount += 1; } });
  const document = {
    querySelector: selector => selector === '.shabdalaya-poetry-list' ? list : selector === '.shabdalaya-empty-state' ? emptyState : null,
    querySelectorAll: selector => selector === '.deuda-song-audio' ? [songAudio] : selector === '.shabdalaya-poetry-audio, .deuda-song-audio' ? list.children.map(post => post.refs['.shabdalaya-poetry-audio']).concat(songAudio) : [],
    getElementById: id => id === 'shabdalayaPoetryPostTemplate' ? template : id === 'postVideo' ? feedVideo : null
  };
  const window = { location: { href: 'http://localhost/poem' } };
  const context = { document, window, navigator: { share: () => Promise.resolve() }, Set, Number, String, Array, Object };
  return { context, list, emptyState, songAudio, feedVideo };
}
