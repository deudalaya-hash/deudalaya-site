const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const social = fs.readFileSync(path.join(root, 'social.js'), 'utf8');
const mobileNav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0];

test('the shared bottom navigation opens the Deuda song library', () => {
  assert.ok(mobileNav, 'shared bottom navigation exists');
  const items = [...mobileNav.matchAll(/<button\b[\s\S]*?<\/button>/g)].map(match => match[0]);
  const songItem = items[1];

  assert.ok(songItem, 'the second bottom navigation item exists');
  assert.match(songItem, /onclick="openDeudaSongScreen\(\)"/);
  assert.match(songItem, /aria-label="देउडा गीत"/);
  assert.match(songItem, /aria-hidden="true"[^>]*>🎵<\/span>/);
  assert.match(songItem, /देउडा गीत/);
  assert.doesNotMatch(songItem, /Friends|<svg|<i>|href|nextVideo|setFeedMode/);
  assert.doesNotMatch(social, /friendsTab|document\.querySelector\('\.mobile-nav button:nth-child\(2\)'\)/);
  assert.match(social, /button\.textContent\.trim\(\) === 'Following'.*setFeedMode\('following'\)/);
  assert.match(html, /function openDeudaSongScreen\(\)/);
});

test('the music screen lists both supplied songs with controlled, non-autoplaying M4A players', () => {
  const screen = html.match(/<section\b(?=[^>]*id="deudaSongScreen")[\s\S]*?<\/section>/)?.[0];
  assert.ok(screen, 'the dedicated song library screen exists');
  assert.match(screen, /hidden/);
  assert.match(screen, /aria-labelledby="deudaSongScreenTitle"/);
  assert.match(screen, /चल गोबिन्दे/);
  assert.match(screen, /भान साली/);
  assert.match(screen, /देउडा गीत/);
  assert.match(screen, /assets\/chal-gobinde-cover\.jpg/);
  assert.match(screen, /src="assets\/chal-gobinde-song\.m4a"/);
  assert.match(screen, /assets\/bhan-saali-cover\.jpg/);
  assert.match(screen, /src="assets\/bhan-saali-song\.m4a"/);
  assert.match(screen, /<button[^>]*data-song-playback-for="bhanSaaliAudio"[^>]*aria-label="भान साली बजाउनुहोस्"[^>]*aria-pressed="false"[^>]*onclick="toggleDeudaSongPlayback\('bhanSaaliAudio'\)"/);
  assert.match(screen, /<audio[^>]*controls[^>]*preload="none"[^>]*aria-label="चल गोबिन्दे अडियो प्लेयर"/);
  assert.match(screen, /<audio[^>]*controls[^>]*preload="none"[^>]*aria-label="भान साली अडियो प्लेयर"/);
  assert.match(screen, /<audio[^>]*controlsList="nodownload"/);
  assert.doesNotMatch(screen, /COMING SOON|autoplay|<video\b/);
  assert.equal((screen.match(/class="deuda-song-card"/g) || []).length, 2, 'both requested songs are listed');
  assert.ok(fs.statSync(path.join(root, 'assets', 'chal-gobinde-song.m4a')).size > 0, 'the song file is present');
  assert.ok(fs.statSync(path.join(root, 'assets', 'bhan-saali-song.m4a')).size > 0, 'the second song file is present');
  assert.match(html, /\.deuda-song-screen\{[^}]*overflow-y:auto/s);
  assert.match(html, /\.deuda-song-shell\{[^}]*padding-bottom:calc\(72px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(html, /@media\(max-width:700px\)\{\.main\.deuda-song-open/);
  assert.match(html, /@media\(max-width:700px\)\{\.main\.deuda-song-open\{padding:0!important\}\.deuda-song-shell\{[^}]*padding-bottom:calc\(84px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(html, /\.deuda-song-grid\{display:grid;grid-template-columns:repeat\(auto-fill/);
});

test('opening and returning from the music screen use the intended screen states', () => {
  const controls = html.match(/<script>\s*(function openDeudaSongScreen\([\s\S]*?function closeDeudaSongScreen\([\s\S]*?)<\/script>/)?.[1];
  assert.ok(controls, 'music screen controls are present');

  const attributes = {};
  const classes = new Set();
  let backFocused = false;
  let triggerFocused = false;
  let feedPauseCount = 0;
  let songPauseCount = 0;
  let secondSongPauseCount = 0;
  const firstSongHandlers = {};
  const secondSongHandlers = {};
  const playbackAttributes = { 'data-song-title': 'भान साली' };
  const playbackIcon = { textContent: '▶' };
  const playbackButton = {
    setAttribute: (name, value) => { playbackAttributes[name] = value; },
    getAttribute: name => playbackAttributes[name],
    querySelector: selector => selector === '.deuda-song-play-icon' ? playbackIcon : null
  };
  const main = { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  const screen = { hidden: true, scrollTop: 80, closest: selector => selector === '.main' ? main : null };
  const back = { focus: () => { backFocused = true; } };
  const trigger = { setAttribute: (name, value) => { attributes[name] = value; }, focus: () => { triggerFocused = true; } };
  const feedPlayer = { paused: false, pause: () => { feedPauseCount += 1; feedPlayer.paused = true; } };
  const songAudio = { id: 'deudaSongAudio', paused: true, pause: () => { songPauseCount += 1; songAudio.paused = true; }, addEventListener: (name, handler) => { firstSongHandlers[name] = handler; } };
  const secondSongAudio = {
    id: 'bhanSaaliAudio',
    paused: true,
    play: () => { secondSongAudio.paused = false; return { catch: () => {} }; },
    pause: () => { secondSongPauseCount += 1; secondSongAudio.paused = true; },
    addEventListener: (name, handler) => { secondSongHandlers[name] = handler; }
  };
  const context = {
    document: {
      getElementById: id => ({ deudaSongScreen: screen, deudaSongBack: back, postVideo: feedPlayer, deudaSongAudio: songAudio, bhanSaaliAudio: secondSongAudio }[id] || null),
      querySelectorAll: selector => selector === '.deuda-song-audio' ? [songAudio, secondSongAudio] : [],
      querySelector: selector => selector === '.mobile-nav [aria-controls="deudaSongScreen"]' ? trigger : (selector === '[data-song-playback-for="bhanSaaliAudio"]' ? playbackButton : null)
    }
  };
  vm.runInNewContext(controls, context);

  context.openDeudaSongScreen();
  assert.equal(screen.hidden, false);
  assert.equal(screen.scrollTop, 0);
  assert.equal(classes.has('deuda-song-open'), true);
  assert.equal(attributes['aria-expanded'], 'true');
  assert.equal(backFocused, true);
  assert.equal(feedPauseCount, 1, 'the hidden feed video pauses while the song screen is open');
  assert.equal(typeof firstSongHandlers.play, 'function');
  assert.equal(typeof secondSongHandlers.play, 'function');
  context.toggleDeudaSongPlayback('bhanSaaliAudio');
  secondSongHandlers.play();
  assert.equal(playbackAttributes['aria-pressed'], 'true');
  assert.equal(playbackAttributes['aria-label'], 'भान साली रोक्नुहोस्');
  assert.equal(playbackIcon.textContent, 'Ⅱ');
  assert.equal(songPauseCount, 1, 'starting another song pauses the current library song');
  context.toggleDeudaSongPlayback('bhanSaaliAudio');
  secondSongHandlers.pause();
  assert.equal(playbackAttributes['aria-pressed'], 'false');
  assert.equal(playbackAttributes['aria-label'], 'भान साली बजाउनुहोस्');
  assert.equal(playbackIcon.textContent, '▶');

  context.closeDeudaSongScreen();
  assert.equal(screen.hidden, true);
  assert.equal(classes.has('deuda-song-open'), false);
  assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(triggerFocused, true);
  assert.equal(songPauseCount, 2, 'the song pauses when returning to the feed');
  assert.equal(secondSongPauseCount, 2, 'the second song pauses on its own toggle and when leaving the library');
});
