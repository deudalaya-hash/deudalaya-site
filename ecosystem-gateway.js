(function () {
  if (window.__deudalayaInstallUiBound) return;
  window.__deudalayaInstallUiBound = true;

  const installButton = document.getElementById('deudalayaInstallAction');
  const installHint = document.getElementById('deudalayaInstallHint');
  if (!installButton) return;

  const INSTALL_UNAVAILABLE_MESSAGE = 'Direct installation is not currently available in this browser. Please try a supported browser.';
  let deferredPrompt = window.deferredPrompt || null;
  let promptPending = window.deudalayaInstallationStatus === 'installation-pending';
  let installationAccepted = promptPending;
  let installed = window.deudalayaInstallState === 'installed' || window.deudalayaInstallState === 'standalone';

  function isStandaloneMode() {
    return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }

  function setHint(message) {
    if (!installHint) return;
    installHint.textContent = message;
    installHint.hidden = !message;
  }

  function releaseInstallGate() {
    document.documentElement.classList.remove('deudalaya-install-required');
    if (isStandaloneMode()) document.documentElement.classList.add('deudalaya-standalone');
  }

  function updateButton() {
    if (installed || isStandaloneMode()) {
      installed = true;
      installButton.disabled = true;
      installButton.hidden = true;
      releaseInstallGate();
      setHint('Deudalaya is already installed.');
      return;
    }

    installButton.hidden = false;
    installButton.disabled = promptPending || installationAccepted;
    installButton.textContent = 'Install App';
    if (deferredPrompt) setHint('');
    else if (installationAccepted) setHint('Installation accepted. Open Deudalaya from the installed app to continue.');
    else setHint(INSTALL_UNAVAILABLE_MESSAGE);
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    if (installed || isStandaloneMode()) return;
    event.preventDefault();
    deferredPrompt = event;
    window.deferredPrompt = event;
    window.deudalayaInstallState = 'available';
    window.deudalayaInstallationStatus = 'prompt-available';
    window.deudalayaInstallSource = null;
    installationAccepted = false;
    updateButton();
  });

  window.addEventListener('deudalaya-installpromptavailable', function () {
    if (installed || !window.deferredPrompt) return;
    deferredPrompt = window.deferredPrompt;
    installationAccepted = false;
    updateButton();
  });

  window.addEventListener('appinstalled', function () {
    installed = true;
    deferredPrompt = null;
    window.deferredPrompt = null;
    window.deudalayaInstallState = 'installed';
    window.deudalayaInstallationStatus = 'installed';
    releaseInstallGate();
    updateButton();
  });

  window.addEventListener('deudalaya-installstatechange', function () {
    if (window.deudalayaInstallState !== 'installed' && window.deudalayaInstallState !== 'standalone') return;
    installed = true;
    deferredPrompt = null;
    window.deferredPrompt = null;
    releaseInstallGate();
    updateButton();
  });

  installButton.addEventListener('click', async function (event) {
    event.preventDefault();
    if (promptPending || installationAccepted || installed) return;
    if (!deferredPrompt) {
      setHint(INSTALL_UNAVAILABLE_MESSAGE);
      return;
    }

    const promptEvent = deferredPrompt;
    promptPending = true;
    window.deudalayaInstallationStatus = 'installation-pending';
    installButton.disabled = true;
    setHint('Opening the installation prompt…');

    try {
      const promptResult = promptEvent.prompt();
      deferredPrompt = null;
      window.deferredPrompt = null;
      await Promise.resolve(promptResult);
      const choice = await promptEvent.userChoice;
      installationAccepted = !!(choice && choice.outcome === 'accepted');
      window.deudalayaInstallationStatus = installationAccepted ? 'installation-pending' : 'not-installed';
    } catch (error) {
      deferredPrompt = null;
      window.deferredPrompt = null;
      installationAccepted = false;
      window.deudalayaInstallationStatus = 'not-installed';
      setHint(INSTALL_UNAVAILABLE_MESSAGE);
    } finally {
      promptPending = false;
      updateButton();
    }
  });

  updateButton();
})();
