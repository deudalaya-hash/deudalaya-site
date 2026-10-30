(function () {
  'use strict';
  if (!document.documentElement.classList.contains('ecosystem-gateway')) return;

  var base = location.origin;
  var apps = {
    layapur: { id: new URL('/index2.html', base).href, manifest: new URL('/layapur.webmanifest', base).href, href: '/index2.html' },
    deudalaya: { id: new URL('/', base).href, manifest: new URL('/manifest.webmanifest', base).href, href: '/?app=deudalaya' },
    sabdalaya: { id: new URL('/sabdalaya/', base).href, manifest: new URL('/sabdalaya/manifest.webmanifest', base).href, href: '/sabdalaya/' },
    chalchitralaya: { id: new URL('/chalchitralaya/', base).href, manifest: new URL('/chalchitralaya/manifest.webmanifest', base).href, href: '/chalchitralaya/' },
    phonelaya: { id: new URL('/phonelaya/', base).href, manifest: new URL('/phonelaya/manifest.webmanifest', base).href, href: '/phonelaya/' },
    kakchhayalaya: { id: new URL('/kakchhayalaya/', base).href, manifest: new URL('/kakchhayalaya/manifest.webmanifest', base).href, href: '/kakchhayalaya/' }
  };

  function setStatus(name, state, message) {
    var status = document.querySelector('[data-status="' + name + '"]');
    var open = document.querySelector('[data-open-app="' + name + '"]');
    if (!status || !open) return;
    status.dataset.state = state;
    status.textContent = message;
    open.hidden = state !== 'installed';
    open.href = apps[name].href;
  }

  async function checkInstalledApps() {
    if (typeof navigator.getInstalledRelatedApps !== 'function') {
      Object.keys(apps).forEach(function (name) {
        setStatus(name, 'unknown', 'This browser cannot verify installation status.');
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
        setStatus(name, found ? 'installed' : 'not-detected', found
          ? 'Installed · Open App is available.'
          : 'Installation was not confirmed by this browser.');
      });
    } catch (_) {
      Object.keys(apps).forEach(function (name) {
        setStatus(name, 'unknown', 'This browser cannot verify installation status.');
      });
    }
  }

  checkInstalledApps();
}());
