(function () {
  if (window.__deudalayaInstallUiBound) return;
  window.__deudalayaInstallUiBound = true;

  const installButton = document.getElementById('deudalayaInstallAction');
  const installHelp = document.getElementById('deudalayaInstallHelp');
  const installHint = document.getElementById('deudalayaInstallHint');
  const installIntro = document.getElementById('deudalayaInstallIntro');
  const installSteps = document.getElementById('deudalayaInstallSteps');
  if (!installButton || !installHint) return;

  const environment = detectEnvironment();
  let deferredPrompt = window.deferredPrompt || null;
  let promptPending = window.deudalayaInstallationStatus === 'installation-pending';
  let relatedAppDetected = environment.device === 'android' && window.deudalayaInstallSource === 'related-app';
  let installed = window.deudalayaInstallState === 'installed' || window.deudalayaInstallState === 'standalone';
  if (relatedAppDetected && !isStandaloneMode()) installed = false;
  const INSTALL_UNAVAILABLE_MESSAGE = 'Direct installation is not currently available in this browser. Please try a supported browser.';
  installButton.textContent = 'Install App';

  function detectEnvironment() {
    const ua = String(navigator.userAgent || '');
    const platform = String(navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || '');
    const isIPad = /iPad/i.test(ua) || (/Mac/i.test(platform) && Number(navigator.maxTouchPoints) > 1);
    const isIPhone = /iPhone|iPod/i.test(ua) || /^(iPhone|iPod)/i.test(platform);
    const isAndroid = /Android/i.test(ua) || /^Android/i.test(platform);
    return { device: isIPad ? 'ipad' : isIPhone ? 'iphone' : isAndroid ? 'android' : 'other' };
  }

  function isStandaloneMode() {
    return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }

  function updateButton() {
    if (installed) {
      if (installHelp) installHelp.hidden = true;
      installButton.disabled = true;
      installButton.hidden = true;
      const alreadyInstalledMessage = 'Deudalaya is already installed.';
      if (installIntro) installIntro.textContent = alreadyInstalledMessage;
      if (installSteps) installSteps.innerHTML = '';
      installHint.textContent = alreadyInstalledMessage;
      if (isStandaloneMode()) {
        document.documentElement.classList.remove('ecosystem-gateway');
        document.documentElement.classList.add('deudalaya-standalone');
      }
      return;
    }

    if (relatedAppDetected && !deferredPrompt && !isStandaloneMode()) {
      if (installHelp) installHelp.hidden = true;
      installButton.hidden = true;
      installButton.disabled = true;
      if (installIntro) installIntro.textContent = 'Deudalaya is already installed.';
      if (installSteps) installSteps.innerHTML = '';
      installHint.textContent = 'Deudalaya is already installed.';
      return;
    }

    const hasNativePrompt = !!deferredPrompt;
    if (installHelp) installHelp.hidden = hasNativePrompt || promptPending || window.deudalayaInstallationStatus === 'installation-pending';
    installButton.hidden = false;
    installButton.disabled = promptPending || installed;
    installButton.textContent = 'Install App';
    if (installIntro) installIntro.textContent = hasNativePrompt
      ? 'Deudalaya is ready to install. Tap INSTALL APP to continue.'
      : INSTALL_UNAVAILABLE_MESSAGE;
    if (installSteps) installSteps.innerHTML = '';
    installHint.textContent = hasNativePrompt ? 'Deudalaya is ready to install.' : '';
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    if (installed || isStandaloneMode()) return;
    event.preventDefault();
    deferredPrompt = event;
    relatedAppDetected = false;
    window.deferredPrompt = event;
    window.deudalayaInstallState = 'available';
    window.deudalayaInstallationStatus = 'prompt-available';
    window.deudalayaInstallSource = null;
    updateButton();
  });

  window.addEventListener('deudalaya-installpromptavailable', function () {
    if (installed || !window.deferredPrompt) return;
    deferredPrompt = window.deferredPrompt;
    relatedAppDetected = false;
    updateButton();
  });

  window.addEventListener('appinstalled', function () {
    installed = true;
    relatedAppDetected = false;
    deferredPrompt = null;
    window.deferredPrompt = null;
    window.deudalayaInstallState = 'installed';
    window.deudalayaInstallationStatus = 'installed';
    updateButton();
  });

  window.addEventListener('deudalaya-installstatechange', function () {
    if (window.deudalayaInstallState === 'installed' && window.deudalayaInstallSource === 'related-app' && environment.device === 'android') {
      installed = isStandaloneMode();
      relatedAppDetected = !installed && !deferredPrompt;
      updateButton();
      return;
    }
    if (window.deudalayaInstallState !== 'installed' && window.deudalayaInstallState !== 'standalone') return;
    installed = true;
    relatedAppDetected = false;
    deferredPrompt = null;
    updateButton();
  });

  installButton.addEventListener('click', async function (event) {
    event.preventDefault();
    if (promptPending || installed) return;
    if (!deferredPrompt) {
      if (relatedAppDetected && !deferredPrompt) {
        installHint.textContent = 'Deudalaya is already installed.';
        return;
      }
      if (installHelp) installHelp.hidden = false;
      if (installIntro) installIntro.textContent = INSTALL_UNAVAILABLE_MESSAGE;
      if (installSteps) installSteps.innerHTML = '';
      installHint.textContent = '';
      return;
    }

    const promptEvent = deferredPrompt;
    promptPending = true;
    window.deudalayaInstallationStatus = 'installation-pending';
    installButton.disabled = true;
    installHint.textContent = 'ब्राउजरको स्थापना पुष्टि खुल्दैछ…';

    let outcomeMessage = '';
    try {
      const promptResult = deferredPrompt.prompt();
      deferredPrompt = null;
      window.deferredPrompt = null;
      await Promise.resolve(promptResult);
      const choice = await promptEvent.userChoice;
      if (!installed) window.deudalayaInstallationStatus = choice && choice.outcome === 'accepted'
        ? 'installation-pending'
        : 'not-installed';
      outcomeMessage = choice && choice.outcome === 'accepted'
        ? 'स्थापना स्वीकार गरियो।'
        : 'स्थापना रद्द गरियो।';
    } catch (error) {
      deferredPrompt = null;
      window.deferredPrompt = null;
      window.deudalayaInstallationStatus = 'not-installed';
      outcomeMessage = 'स्थापना पूरा भएन। फेरि प्रयास गर्नुहोस्।';
    } finally {
      promptPending = false;
      updateButton();
      if (outcomeMessage) installHint.textContent = outcomeMessage;
    }
  });

  updateButton();
})();
