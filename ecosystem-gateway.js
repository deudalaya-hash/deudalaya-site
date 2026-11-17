(function () {
  if (window.__deudalayaInstallUiBound) return;
  window.__deudalayaInstallUiBound = true;

  const installButton = document.getElementById('deudalayaInstallAction');
  const installHint = document.getElementById('deudalayaInstallHint');
  if (!installButton) return;

  const INSTALL_UNAVAILABLE_MESSAGE =
    'Chrome has not offered the install prompt yet. Keep this page open, or use Chrome’s menu to install Deudalaya if that option is available.';

  let deferredPrompt = window.deferredPrompt || null;
  let promptPending =
    window.deudalayaInstallationStatus === 'installation-pending';
  let installationAccepted = promptPending;
  let promptConsumed = false;
  let installed =
    window.deudalayaInstallState === 'installed' ||
    window.deudalayaInstallState === 'standalone';

  function isStandaloneMode() {
    return (
      !!(
        window.matchMedia &&
        window.matchMedia('(display-mode: standalone)').matches
      ) ||
      navigator.standalone === true
    );
  }

  function setHint(message) {
    if (!installHint) return;
    installHint.textContent = message;
    installHint.hidden = !message;
  }

  function releaseInstallGate() {
    document.documentElement.classList.remove('deudalaya-install-required');

    if (isStandaloneMode()) {
      document.documentElement.classList.add('deudalaya-standalone');
    }
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

    if (deferredPrompt) {
      setHint('');
    } else if (installationAccepted) {
      setHint(
        'Installation accepted. Open Deudalaya from the installed app to continue.'
      );
    } else if (promptConsumed) {
      setHint(
        'The install prompt was closed. Reload this page to request a new prompt.'
      );
    } else {
      setHint(INSTALL_UNAVAILABLE_MESSAGE);
    }
  }

  // index.html owns the beforeinstallprompt event.
  // It stores the event and dispatches this notification.
  // This file listens for that notification instead of registering
  // a second beforeinstallprompt listener.

  window.addEventListener(
    'deudalaya-installpromptavailable',
    function () {
      if (installed || isStandaloneMode() || !window.deferredPrompt) {
        return;
      }

      deferredPrompt = window.deferredPrompt;
      promptConsumed = false;
      installationAccepted = false;

      window.deudalayaInstallationStatus = 'prompt-available';
      updateButton();
    }
  );

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
    if (
      window.deudalayaInstallState !== 'installed' &&
      window.deudalayaInstallState !== 'standalone'
    ) {
      return;
    }

    installed = true;
    deferredPrompt = null;
    window.deferredPrompt = null;

    releaseInstallGate();
    updateButton();
  });

  installButton.addEventListener('click', async function (event) {
    event.preventDefault();

    if (promptPending || installationAccepted || installed) {
      return;
    }

    if (!deferredPrompt) {
      setHint(
        promptConsumed
          ? 'The install prompt was closed. Reload this page to request a new prompt.'
          : INSTALL_UNAVAILABLE_MESSAGE
      );
      return;
    }

    const promptEvent = deferredPrompt;

    promptPending = true;
    window.deudalayaInstallationStatus = 'installation-pending';

    installButton.disabled = true;
    setHint('Opening the installation prompt…');

    try {
      // Call prompt directly from the user's button click.
      const promptResult = promptEvent.prompt();

      // The browser install event can only be used once.
      deferredPrompt = null;
      window.deferredPrompt = null;
      promptConsumed = true;

      await Promise.resolve(promptResult);

      const choice = await promptEvent.userChoice;

      installationAccepted =
        !!(choice && choice.outcome === 'accepted');

      window.deudalayaInstallationStatus = installationAccepted
        ? 'installation-pending'
        : 'not-installed';
    } catch (error) {
      deferredPrompt = null;
      window.deferredPrompt = null;
      installationAccepted = false;

      window.deudalayaInstallationStatus = 'not-installed';

      setHint(
        'The install prompt could not be opened. Reload this page and try again.'
      );

      const safeErrorNames = [
        'AbortError',
        'NotAllowedError',
        'SecurityError',
        'TypeError'
      ];

      const errorName =
        error && safeErrorNames.includes(error.name)
          ? error.name
          : 'Error';

      if (
        typeof console !== 'undefined' &&
        typeof console.warn === 'function'
      ) {
        console.warn(
          '[Deudalaya install] Native prompt failed.',
          { name: errorName }
        );
      }
    } finally {
      promptPending = false;
      updateButton();
    }
  });

  updateButton();
})();