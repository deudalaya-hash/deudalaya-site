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

test('the music screen shows the supplied cover and playable M4A without autoplay', () => {
  const screen = html.match(/<section\b(?=[^>]*id="deudaSongScreen")[\s\S]*?<\/section>/)?.[0];
  assert.ok(screen, 'the dedicated song library screen exists');
  assert.match(screen, /hidden/);
  assert.match(screen, /aria-labelledby="deudaSongScreenTitle"/);
  assert.match(screen, /चल गोबिन्दे/);
  assert.match(screen, /देउडा गीत/);
  assert.match(screen, /assets\/chal-gobinde-cover\.jpg/);
  assert.match(screen, /src="assets\/chal-gobinde-song\.m4a"/);
  assert.match(screen, /<audio[^>]*controls[^>]*preload="none"[^>]*aria-label="चल गोबिन्दे अडियो प्लेयर"/);
  assert.match(screen, /<audio[^>]*controlsList="nodownload"/);
  assert.doesNotMatch(screen, /COMING SOON|autoplay|<video\b/);
  assert.equal((screen.match(/class="deuda-song-card"/g) || []).length, 1, 'only the requested song is listed');
  assert.ok(fs.statSync(path.join(root, 'assets', 'chal-gobinde-song.m4a')).size > 0, 'the song file is present');
  assert.match(html, /\.deuda-song-screen\{[^}]*overflow-y:auto/s);
  assert.match(html, /@media\(max-width:700px\)\{\.main\.deuda-song-open/);
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
  const main = { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  const screen = { hidden: true, scrollTop: 80, closest: selector => selector === '.main' ? main : null };
  const back = { focus: () => { backFocused = true; } };
  const trigger = { setAttribute: (name, value) => { attributes[name] = value; }, focus: () => { triggerFocused = true; } };
  const feedPlayer = { paused: false, pause: () => { feedPauseCount += 1; feedPlayer.paused = true; } };
  const songAudio = { pause: () => { songPauseCount += 1; } };
  const context = {
    document: {
      getElementById: id => ({ deudaSongScreen: screen, deudaSongBack: back, postVideo: feedPlayer, deudaSongAudio: songAudio }[id] || null),
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

  context.closeDeudaSongScreen();
  assert.equal(screen.hidden, true);
  assert.equal(classes.has('deuda-song-open'), false);
  assert.equal(attributes['aria-expanded'], 'false');
  assert.equal(triggerFocused, true);
  assert.equal(songPauseCount, 1, 'the song pauses when returning to the feed');
});
