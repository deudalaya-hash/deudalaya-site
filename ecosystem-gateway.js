(function () {
  'use strict';
  if (!document.documentElement.classList.contains('ecosystem-gateway')) return;

  var installButton = document.getElementById('deudalayaInstallAction');
  var installHint = document.getElementById('deudalayaInstallHint');
  if (!installButton || !installHint) return;

  function markInstalled() {
    installButton.hidden = true;
    installHint.textContent = 'Installed. Open Deudalaya from its app icon.';
  }

  function installDeudalaya(event) {
    event.preventDefault();
    var promptEvent = window.deudalayaInstallPrompt;
    if (!promptEvent) {
      installHint.textContent = 'Installation is not currently available in this browser.';
      return;
    }

    var promptResult;
    try {
      promptResult = promptEvent.prompt();
    } catch (_) {
      installHint.textContent = 'Installation is not currently available in this browser.';
      return;
    }
    window.deudalayaInstallPrompt = null;
    installButton.disabled = true;
    Promise.resolve(promptResult).then(function () {
      return promptEvent.userChoice;
    }).then(function (choice) {
      if (choice && choice.outcome === 'accepted') {
        installHint.textContent = 'Install request accepted. Waiting for browser confirmation.';
      } else if (choice && choice.outcome === 'dismissed') {
        installHint.textContent = 'Installation was cancelled.';
      }
    }).catch(function () {
      installHint.textContent = 'Installation is not currently available in this browser.';
    }).finally(function () {
      installButton.disabled = false;
    });
  }
  installButton.addEventListener('click', installDeudalaya);

  window.addEventListener('beforeinstallprompt', function () {
    if (!installButton.hidden) {
      installHint.textContent = 'Deudalaya is ready to install.';
    }
  });
  window.addEventListener('appinstalled', markInstalled);

  if (typeof navigator.getInstalledRelatedApps === 'function') {
    navigator.getInstalledRelatedApps().then(function (installed) {
      var manifestUrl = new URL('/manifest.webmanifest', location.origin).href;
      if (installed.some(function (item) {
        return item.id === location.origin + '/' || item.url === manifestUrl;
      })) markInstalled();
    }).catch(function () {});
  }
}());
