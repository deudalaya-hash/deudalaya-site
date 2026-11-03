(function () {
  'use strict';

  if (!document.documentElement.classList.contains('ecosystem-gateway')) return;

  var installButton = document.getElementById('deudalayaInstallAction');
  var installHint = document.getElementById('deudalayaInstallHint');
  if (!installButton || !installHint) return;

  var deferredInstallPrompt = window.deudalayaInstallPrompt || null;

  function markInstalled() {
    deferredInstallPrompt = null;
    window.deudalayaInstallPrompt = null;
    installButton.hidden = true;
    installHint.textContent = 'Installed. Open Deudalaya from its app icon.';
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.deudalayaInstallPrompt = event;
    installHint.textContent = 'Deudalaya is ready to install.';
  });

  installButton.addEventListener('click', function (clickEvent) {
    clickEvent.preventDefault();

    var promptEvent = deferredInstallPrompt;
    if (!promptEvent) {
      installHint.textContent = 'Installation is not currently available in this browser.';
      return;
    }

    // Call prompt() synchronously in the tap handler so the browser keeps the
    // user's activation and can show its native installation dialog.
    var promptResult;
    try {
      promptResult = promptEvent.prompt();
    } catch (_) {
      deferredInstallPrompt = null;
      window.deudalayaInstallPrompt = null;
      installHint.textContent = 'Installation is not currently available in this browser.';
      return;
    }

    deferredInstallPrompt = null;
    window.deudalayaInstallPrompt = null;
    installButton.disabled = true;

    Promise.resolve(promptResult).then(function () {
      return promptEvent.userChoice;
    }).then(function (choice) {
      if (choice && choice.outcome === 'accepted') {
        installHint.textContent = 'Install request accepted. Waiting for browser confirmation.';
      } else if (choice && choice.outcome === 'dismissed') {
        installHint.textContent = 'Installation was cancelled. Reload the page to try again.';
      }
    }).catch(function () {
      installHint.textContent = 'Installation is not currently available in this browser.';
    }).finally(function () {
      installButton.disabled = false;
    });
  });

  window.addEventListener('appinstalled', markInstalled);

  if (typeof navigator.getInstalledRelatedApps === 'function') {
    try {
      Promise.resolve(navigator.getInstalledRelatedApps()).then(function (installed) {
        var manifestUrl = new URL('/manifest.webmanifest', location.origin).href;
        if (installed.some(function (item) {
          return item.id === location.origin + '/' || item.url === manifestUrl;
        })) markInstalled();
      }).catch(function () {});
    } catch (_) {}
  }
}());
