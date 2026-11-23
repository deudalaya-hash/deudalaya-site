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
  const songItem = items[3];

  assert.ok(songItem, 'the fourth bottom navigation item exists');
  assert.match(songItem, /onclick="openDeudaSongScreen\(\)"/);
  assert.match(songItem, /aria-label="देउडा गीत"/);
  assert.match(songItem, /<span class="nav-music-icon" aria-hidden="true">🎵<\/span>/);
  assert.match(songItem, /देउडा गीत/);
  assert.doesNotMatch(songItem, /Friends|nav-deudalaya-icon|<img|<svg|<i>|href|nextVideo|setFeedMode/);
  assert.match(html, /\.mobile-nav \.nav-music-icon\{[^}]*width:21px;height:21px/);
  assert.match(html, /@media\(max-width:700px\)\{\.mobile-nav \.nav-music-icon\{width:27px;height:27px/);
  assert.match(html, /aria-expanded="true"\] \.nav-music-icon,[^}]*filter:drop-shadow\(0 0 4px #f2b33d\)/);
  assert.doesNotMatch(social, /friendsTab|document\.querySelector\('\.mobile-nav button:nth-child\(2\)'\)/);
  assert.match(social, /button\.textContent\.trim\(\) === 'Following'.*setFeedMode\('following'\)/);
  assert.match(html, /function openDeudaSongScreen\(\)/);
});

test('the music screen places each nameless song profile directly above its non-autoplaying M4A player', () => {
  const screen = html.match(/<section\b(?=[^>]*id="deudaSongScreen")[\s\S]*?<\/section>/)?.[0];
  assert.ok(screen, 'the dedicated song library screen exists');
  assert.match(screen, /hidden/);
  assert.match(screen, /aria-label="देउडा गीत"/);
  assert.doesNotMatch(screen, /aria-labelledby="deudaSongScreenTitle"|class="deuda-song-header"|देउडालय · संगीत|देउडा गीतहरूको संग्रह/);
  assert.doesNotMatch(screen, /चल गोबिन्दे|भान साली|चक्र बम|लक्ष्मी आचार्य|देउडा गीत\s*<\/span>/);
  assert.match(screen, /assets\/chal-gobinde-cover\.jpg/);
  assert.match(screen, /src="assets\/chal-gobinde-song\.m4a"/);
  assert.match(screen, /assets\/bhan-saali-cover\.jpg/);
  assert.match(screen, /src="assets\/bhan-saali-song\.m4a"/);
  assert.match(screen, /alt="पहिलो देउडा गीतको प्रोफाइल आवरण"/);
  assert.match(screen, /alt="दोस्रो देउडा गीतको प्रोफाइल आवरण"/);
  assert.match(screen, /class="deuda-song-cover"[\s\S]*?<\/span>\s*<audio[^>]*controls[^>]*preload="none"[^>]*aria-label="पहिलो गीत प्लेयर"/);
  assert.match(screen, /class="deuda-song-cover"[\s\S]*?<\/span>\s*<audio[^>]*controls[^>]*preload="none"[^>]*aria-label="दोस्रो गीत प्लेयर"/);
  assert.match(screen, /<audio[^>]*controlsList="nodownload"/);
  assert.doesNotMatch(screen, /COMING SOON|autoplay|<video\b|deuda-song-title|deuda-song-category|deuda-song-artists|deuda-song-play/);
  assert.equal((screen.match(/class="deuda-song-card"/g) || []).length, 2, 'both requested songs are listed');
  assert.ok(fs.statSync(path.join(root, 'assets', 'chal-gobinde-song.m4a')).size > 0, 'the song file is present');
  assert.ok(fs.statSync(path.join(root, 'assets', 'bhan-saali-song.m4a')).size > 0, 'the second song file is present');
  assert.match(html, /\.deuda-song-screen\{[^}]*overflow-y:auto/s);
  assert.match(html, /\.deuda-song-grid\{[^}]*margin:12px 0 0/);
  assert.match(html, /grid-template-columns:minmax\(0,1fr\);margin-top:12px/);
  assert.match(html, /\.deuda-song-shell\{[^}]*padding-bottom:calc\(72px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(html, /@media\(max-width:700px\)\{\.main\.deuda-song-open/);
  assert.match(html, /@media\(max-width:700px\)\{\.main\.deuda-song-open\{padding:0!important\}\.deuda-song-shell\{[^}]*padding-bottom:calc\(84px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.match(html, /\.deuda-song-grid\{display:grid;grid-template-columns:repeat\(auto-fill/);
});

test('opening and returning from the music screen use the intended screen states', () => {
  const controls = html.match(/<script>\s*((?:var deudaSongTrigger=null(?:,shabdalayaTrigger=null)?;\s*)?function openDeudaSongScreen\([\s\S]*?function closeDeudaSongScreen\([\s\S]*?)<\/script>/)?.[1];
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
  const main = { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  const screen = { hidden: true, scrollTop: 80, closest: selector => selector === '.main' ? main : null };
  const back = { focus: () => { backFocused = true; } };
  const trigger = { getAttribute: name => name === 'aria-controls' ? 'deudaSongScreen' : null, setAttribute: (name, value) => { attributes[name] = value; }, focus: () => { triggerFocused = true; } };
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
      activeElement: trigger,
      getElementById: id => ({ deudaSongScreen: screen, deudaSongBack: back, postVideo: feedPlayer, deudaSongAudio: songAudio, bhanSaaliAudio: secondSongAudio }[id] || null),
      querySelectorAll: selector => selector === '.deuda-song-audio' ? [songAudio, secondSongAudio] : [],
      querySelector: selector => selector === '.mobile-nav [aria-controls="deudaSongScreen"]' ? trigger : null
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
  secondSongHandlers.play();
  assert.equal(songPauseCount, 1, 'starting another song pauses the current library song');

  context.closeDeudaSongScreen();
  assert.equal(screen.hidden, true);
  assert.equal(classes.has('deuda-song-open'), false);
  assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(triggerFocused, true);
  assert.equal(songPauseCount, 2, 'the song pauses when returning to the feed');
  assert.equal(secondSongPauseCount, 1, 'the second song pauses when leaving the library');
});
