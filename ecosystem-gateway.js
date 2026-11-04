(function () {
  if (window.__deudalayaInstallUiBound) return;
  window.__deudalayaInstallUiBound = true;

  const installButton = document.getElementById('deudalayaInstallAction');
  const installHint = document.getElementById('deudalayaInstallHint');
  if (!installButton || !installHint) return;

  let deferredPrompt = window.deferredPrompt || null;
  let promptPending = false;
  let installed = window.deudalayaInstallState === 'installed' || window.deudalayaInstallState === 'standalone';

  function updateButton() {
    if (installed) {
      installButton.disabled = true;
      installButton.hidden = true;
      installHint.textContent = window.deudalayaInstallSource === 'related-app'
        ? 'Deudalaya is already installed. Open it from your home screen.'
        : 'Installation confirmed.';
      return;
    }

    installButton.hidden = false;
    installButton.disabled = !deferredPrompt || promptPending;
    if (deferredPrompt) installHint.textContent = 'Deudalaya is ready to install.';
    else if (!('onbeforeinstallprompt' in window)) {
      installHint.textContent = "A direct install prompt is not supported. Use the browser's install option.";
    }
  }

  window.addEventListener('deudalaya-installpromptavailable', function () {
    if (installed || !window.deferredPrompt) return;
    deferredPrompt = window.deferredPrompt;
    updateButton();
  });

  window.addEventListener('appinstalled', function () {
    installed = true;
    deferredPrompt = null;
    window.deferredPrompt = null;
    window.deudalayaInstallState = 'installed';
    updateButton();
  });

  window.addEventListener('deudalaya-installstatechange', function () {
    if (window.deudalayaInstallState !== 'installed') return;
    installed = true;
    deferredPrompt = null;
    updateButton();
  });

  installButton.addEventListener('click', async function (event) {
    event.preventDefault();
    if (!deferredPrompt || promptPending || installed) return;

    const promptEvent = deferredPrompt;
    promptPending = true;
    installButton.disabled = true;
    installHint.textContent = "Chrome's installation prompt is open.";

    try {
      const promptResult = deferredPrompt.prompt();
      deferredPrompt = null;
      window.deferredPrompt = null;
      await Promise.resolve(promptResult);
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        installHint.textContent = 'Installation accepted.';
      } else {
        installHint.textContent = 'Installation cancelled. Refresh to request a new prompt.';
      }
    } catch (error) {
      deferredPrompt = null;
      window.deferredPrompt = null;
      installHint.textContent = 'Chrome could not complete the installation prompt.';
    } finally {
      promptPending = false;
      installButton.disabled = !deferredPrompt || installed;
    }
  });

  updateButton();
})();
