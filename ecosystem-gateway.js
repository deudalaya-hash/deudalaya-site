(function () {
  'use strict';
  if (!document.documentElement.classList.contains('ecosystem-gateway')) return;

  var base = location.origin;
  var apps = {
    deudalaya: { id: base + '/', manifest: base + '/manifest.webmanifest', href: '/?app=deudalaya' },
    sabdalaya: { id: base + '/sabdalaya/', manifest: base + '/sabdalaya/manifest.webmanifest', href: '/sabdalaya/' },
    chalchitralaya: { id: base + '/chalchitralaya/', manifest: base + '/chalchitralaya/manifest.webmanifest', href: '/chalchitralaya/' },
    phonelaya: { id: base + '/phonelaya/', manifest: base + '/phonelaya/manifest.webmanifest', href: '/phonelaya/' }
  };

  function setStatus(name, state, message) {
    var status = document.querySelector('[data-status="' + name + '"]');
    var open = document.querySelector('[data-open-app="' + name + '"]');
    if (!status || !open) return;
    status.dataset.state = state;
    status.textContent = message;
    open.hidden = state !== 'installed' && state !== 'previously-installed';
    open.href = apps[name].href;
  }
  function wasInstalled(name) {
    try { return localStorage.getItem('ecosystem-install-' + name) === 'reported'; }
    catch (_) { return false; }
  }
  function rememberInstall(name) {
    try { localStorage.setItem('ecosystem-install-' + name, 'reported'); } catch (_) {}
  }
  function manualInstallMessage(status) {
    var isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    status.textContent = isApple
      ? 'Safari: Share → Add to Home Screen.'
      : 'Open the browser menu → Install app / Add to Home screen.';
  }
  document.querySelector('[data-install="deudalaya"]').addEventListener('click', async function () {
    var status = document.querySelector('[data-status="deudalaya"]');
    var prompt = window.deudalayaInstallPrompt;
    if (!prompt) { manualInstallMessage(status); return; }
    window.deudalayaInstallPrompt = null;
    try {
      await prompt.prompt();
      var result = await prompt.userChoice;
      if (result && result.outcome === 'accepted') {
        rememberInstall('deudalaya');
        setStatus('deudalaya', 'installed', 'Install prompt accepted · open app from your launcher.');
      } else manualInstallMessage(status);
    } catch (_) { manualInstallMessage(status); }
  });

  window.addEventListener('appinstalled', function () {
    rememberInstall('deudalaya');
    setStatus('deudalaya', 'installed', 'Browser confirmed install · open from your app launcher.');
  });

  async function checkInstalledApps() {
    if (typeof navigator.getInstalledRelatedApps !== 'function') {
      Object.keys(apps).forEach(function (name) {
        setStatus(name, wasInstalled(name) ? 'previously-installed' : 'unknown', wasInstalled(name)
          ? 'Previously confirmed · current status may have changed.'
          : 'Install status is not available in this browser.');
      });
      return;
    }
    try {
      var installed = await navigator.getInstalledRelatedApps();
      Object.keys(apps).forEach(function (name) {
        var app = apps[name];
        var found = installed.some(function (item) {
          return item.id === app.id || item.url === app.manifest;
        });
        var remembered = wasInstalled(name);
        setStatus(name, found ? 'installed' : (remembered ? 'previously-installed' : 'not-detected'), found
          ? 'Installed · open from your app launcher.'
          : (remembered ? 'Previously confirmed · current status may have changed.' : 'Not detected by this browser · install status may be limited.'));
      });
    } catch (_) {
      Object.keys(apps).forEach(function (name) {
        setStatus(name, wasInstalled(name) ? 'previously-installed' : 'unknown', wasInstalled(name)
          ? 'Previously confirmed · current status may have changed.'
          : 'Install status is not available in this browser.');
      });
    }
  }

  checkInstalledApps();
}());
