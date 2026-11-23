const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the शब्दलय microphone item keeps notification behavior, position, and badge', () => {
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/);
  assert.ok(nav);
  const items = [...nav[0].matchAll(/<button\b[\s\S]*?<\/button>/g)].map(match => match[0]);
  const notificationItem = items[1];
  assert.match(notificationItem, /class="[^"]*notification-nav-item[^"]*"/);
  assert.match(notificationItem, /onclick="toggleComments\(\)"/);
  assert.match(notificationItem, /<span class="notification-mic-icon" aria-hidden="true">🎙️<\/span><span class="nav-label-badge"><span class="mobile-notification-label">शब्दलय<\/span>\s*<i>99\+<\/i><\/span>/);
  assert.match(html, /\.notification-nav-item \.nav-label-badge i,\.notification-nav-item \.notif-badge\{display:none!important\}/);
  assert.match(html, /\.mobile-nav \.mobile-notification-label\{[^}]*display:block/);
  assert.match(html, /\.mobile-nav button:nth-child\(2\) \.nav-label-badge\{[^}]*overflow:visible/);
  assert.match(html, /@media\(min-width:701px\)\{\.mobile-nav\{position:fixed;display:flex/);

  const desktop = html.match(/<nav class="nav">([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(desktop);
  const desktopNotificationItem = desktop.match(/<button class="nav-item notification-nav-item"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.match(desktopNotificationItem, /onclick="toggleComments\(\)"/);
  assert.match(desktopNotificationItem, /notification-mic-icon[^>]*>🎙️<\/span>शब्दलय/);

  assert.match(html, /document\.querySelectorAll\('\.mobile-nav \.notification-nav-item'\)/);
  assert.match(html, /document\.querySelectorAll\('nav\.nav \.notification-nav-item'\)/);
  assert.match(html, /btn\.classList\.contains\('notification-nav-item'\)/);
  assert.doesNotMatch(html, /indexOf\('Inbox'\)/);
});
