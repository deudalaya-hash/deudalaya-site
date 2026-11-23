const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the शब्दलय microphone item opens the poetry screen instead of the notifications panel', () => {
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/);
  assert.ok(nav);
  const items = [...nav[0].matchAll(/<button\b[\s\S]*?<\/button>/g)].map(match => match[0]);
  const shabdalayaItem = items[1];
  assert.match(shabdalayaItem, /class="shabdalaya-nav-item"/);
  assert.match(shabdalayaItem, /aria-controls="shabdalayaScreen"/);
  assert.match(shabdalayaItem, /onclick="openShabdalayaScreen\(\)"/);
  assert.match(shabdalayaItem, /<span class="notification-mic-icon" aria-hidden="true">🎙️<\/span><span class="mobile-notification-label">शब्दलय<\/span>/);
  assert.doesNotMatch(shabdalayaItem, /notification-nav-item|notif-badge|<i>/);
  assert.match(html, /\.mobile-nav \.mobile-notification-label\{[^}]*display:block/);
  assert.match(html, /@media\(min-width:701px\)\{\.mobile-nav\{position:fixed;display:flex/);

  const desktop = html.match(/<nav class="nav">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(desktop);
  const desktopShabdalayaItem = desktop.match(/<button class="nav-item shabdalaya-nav-item"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.match(desktopShabdalayaItem, /aria-controls="shabdalayaScreen"/);
  assert.match(desktopShabdalayaItem, /onclick="openShabdalayaScreen\(\)"/);
  assert.match(desktopShabdalayaItem, /notification-mic-icon[^>]*>🎙️<\/span>शब्दलय/);

  assert.match(html, /function openNotifications\(\)/, 'notification handling remains available');
  assert.match(html, /<section class="notif-panel" id="notifPanel"/);
  assert.match(html, /id="shabdalayaScreen"[^>]*aria-label="शब्दलय"[^>]*hidden/);
  assert.doesNotMatch(html, /indexOf\('Inbox'\)/);
});
