(function () {
  'use strict';

  if (!document.documentElement.classList.contains('ecosystem-gateway')) return;

  var installButton = document.getElementById('deudalayaInstallAction');
  var installHint = document.getElementById('deudalayaInstallHint');
  var installCard = document.getElementById('deudalayaInstallCard');
  var progressScreen = document.getElementById('deudalayaInstallProgress');
  var progressTitle = document.getElementById('deudalayaInstallProgressTitle');
  var progressMessage = document.getElementById('deudalayaInstallProgressMessage');
  var spinner = document.getElementById('deudalayaInstallSpinner');
  var openButton = document.getElementById('deudalayaOpenInstalled');
  if (!installButton || !installHint || !installCard || !progressScreen || !progressTitle || !progressMessage || !spinner || !openButton) return;

  var deferredInstallPrompt = window.deudalayaInstallPrompt || null;
  var installTimeout = null;
  var installationConfirmed = false;

  function isIOSBrowser() {
    var userAgent = navigator.userAgent || '';
    return /iPhone|iPad|iPod/i.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function getMenuInstallGuidance() {
    var userAgent = navigator.userAgent || '';
    if (isIOSBrowser()) {
      return 'On iPhone or iPad, tap Share, then Add to Home Screen.';
    }
    if (/Android/i.test(userAgent) && /Chrome\//i.test(userAgent)) {
      return 'To install, open Chrome’s ⋮ menu and choose Install app or Add to Home screen. If this page opened inside another app, choose Open in Chrome first.';
    }
    return 'If you are using Chrome, open its ⋮ menu and choose Install app or Add to Home screen.';
  }

  function clearInstallTimeout() {
    if (installTimeout !== null) {
      window.clearTimeout(installTimeout);
      installTimeout = null;
    }
  }

  function showInstallCard(message) {
    clearInstallTimeout();
    progressScreen.hidden = true;
    progressScreen.setAttribute('aria-busy', 'false');
    installCard.hidden = false;
    installButton.hidden = !deferredInstallPrompt;
    installButton.disabled = false;
    spinner.hidden = false;
    openButton.hidden = true;
    installHint.textContent = message || getMenuInstallGuidance();
  }

  function showInstalling() {
    installCard.hidden = true;
    progressScreen.hidden = false;
    progressScreen.setAttribute('aria-busy', 'true');
    progressTitle.textContent = 'Installing Deudalaya...';
    progressMessage.textContent = 'Please wait while your app is being installed.';
    spinner.hidden = false;
    openButton.hidden = true;
    installTimeout = window.setTimeout(function () {
      if (installationConfirmed) return;
      showInstallCard('Your browser could not confirm installation. ' + getMenuInstallGuidance());
    }, 20000);
  }

  function markInstalled() {
    installationConfirmed = true;
    deferredInstallPrompt = null;
    window.deudalayaInstallPrompt = null;
    clearInstallTimeout();
    installCard.hidden = true;
    installButton.hidden = true;
    progressScreen.hidden = false;
    progressScreen.setAttribute('aria-busy', 'false');
    progressTitle.textContent = 'Installation Complete';
    progressMessage.textContent = 'Deudalaya is installed and ready to open.';
    spinner.hidden = true;
    openButton.hidden = false;
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.deudalayaInstallPrompt = event;
    installButton.hidden = false;
    installHint.textContent = 'Deudalaya is ready to install.';
  });

  if (deferredInstallPrompt) {
    installButton.hidden = false;
    installHint.textContent = 'Deudalaya is ready to install.';
  } else {
    installButton.hidden = true;
    installHint.textContent = getMenuInstallGuidance();
  }

  installButton.addEventListener('click', function (clickEvent) {
    clickEvent.preventDefault();
    var promptEvent = deferredInstallPrompt;
    if (!promptEvent) {
      installHint.textContent = getMenuInstallGuidance();
      return;
    }

    // Keep prompt() in the tap handler so Chrome retains the user's activation.
    var promptResult;
    try {
      promptResult = promptEvent.prompt();
    } catch (_) {
      deferredInstallPrompt = null;
      window.deudalayaInstallPrompt = null;
      showInstallCard('Installation could not be started. ' + getMenuInstallGuidance());
      return;
    }

    deferredInstallPrompt = null;
    window.deudalayaInstallPrompt = null;
    installButton.disabled = true;

    Promise.resolve(promptResult).then(function () {
      return promptEvent.userChoice;
    }).then(function (choice) {
      if (choice && choice.outcome === 'accepted') {
        if (!installationConfirmed) showInstalling();
      } else if (choice && choice.outcome === 'dismissed') {
        showInstallCard('Installation was cancelled. ' + getMenuInstallGuidance());
      } else {
        showInstallCard('Your browser could not confirm the installation request. ' + getMenuInstallGuidance());
      }
    }).catch(function () {
      showInstallCard('Installation could not be confirmed. ' + getMenuInstallGuidance());
    }).finally(function () {
      installButton.disabled = false;
    });
  });

  openButton.addEventListener('click', function (clickEvent) {
    clickEvent.preventDefault();
    window.location.assign('/?app=deudalaya');
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
