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
  const promptBrowsers = ['Chrome', 'Edge', 'Brave', 'Opera'];
  installButton.textContent = 'Install App';

  function detectEnvironment() {
    const ua = String(navigator.userAgent || '');
    const platform = String(navigator.userAgentData && navigator.userAgentData.platform || navigator.platform || '');
    const isIPad = /iPad/i.test(ua) || (/Mac/i.test(platform) && Number(navigator.maxTouchPoints) > 1);
    const isIPhone = /iPhone|iPod/i.test(ua) || /^(iPhone|iPod)/i.test(platform);
    const isAndroid = /Android/i.test(ua) || /^Android/i.test(platform);
    const isWindows = /Windows/i.test(ua) || /^Win/i.test(platform);
    const isMac = !isIPad && !isIPhone && (/Macintosh|Mac OS X/i.test(ua) || /macOS|MacIntel|MacPPC/i.test(platform));
    const device = isIPad ? 'ipad' : isIPhone ? 'iphone' : isAndroid ? 'android' : isWindows ? 'windows' : isMac ? 'mac' : 'other';

    let browser = 'unsupported';
    if (/Edg(?:A|iOS)?\//i.test(ua)) browser = 'Edge';
    else if (navigator.brave || /\bBrave\//i.test(ua)) browser = 'Brave';
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = 'Opera';
    else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
    else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
    else if (/Safari/i.test(ua) && !/Chrome|CriOS|Edg|OPR|Opera|Firefox|FxiOS|Brave/i.test(ua)) browser = 'Safari';

    const safariVersion = browser === 'Safari' ? Number((ua.match(/Version\/(\d+)/i) || [])[1] || 0) : 0;
    return { browser, device, safariVersion };
  }

  function stepGuide(intro, steps, showInstallButton) {
    return { intro, steps, showInstallButton: !!showInstallButton };
  }

  function isStandaloneMode() {
    return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }

  function getGuide(hasPrompt) {
    const { browser, device, safariVersion } = environment;

    if (device !== 'iphone' && device !== 'ipad' && hasPrompt && promptBrowsers.includes(browser)) {
      return stepGuide(`${browser} मा तलको INSTALL APP बटन थिचेर ब्राउजरको स्थापना पुष्टि खोल्नुहोस्:`, [
        'INSTALL APP थिच्नुहोस्।',
        'ब्राउजरको पुष्टिमा “Install” छान्नुहोस्।'
      ], true);
    }

    if (device === 'iphone' || device === 'ipad') {
      if (browser === 'Safari') {
        return stepGuide('Safari बाट देउडालयलाई Home Screen मा राख्नुहोस्:', [
          'तल रहेको Share बटन थिच्नुहोस्।',
          '“Add to Home Screen” छान्नुहोस्।',
          '“Add” थिच्नुहोस्।'
        ], true);
      }
      return stepGuide('iPhone वा iPad मा स्थापना गर्न Safari मा देउडालय खोल्नुहोस् र Share मेनु प्रयोग गर्नुहोस्।', [], true);
    }

    if (device === 'android') {
      if (['Chrome', 'Edge', 'Brave'].includes(browser)) {
        if (!hasPrompt) return stepGuide(`${browser} ले यो पृष्ठका लागि अहिले native स्थापना prompt दिएको छैन। ब्राउजरको मेनुबाट स्थापना गर्नुहोस्:`, [
          'माथि दायाँपट्टि रहेको तीनवटा थोप्ला (⋮) थिच्नुहोस्।',
          '“Install app” वा “Add to Home screen” छान्नुहोस्।',
          '“Install” वा “Add” थिच्नुहोस्।',
          'अब मोबाइलको Home Screen बाट देउडालय खोल्नुहोस्।'
        ], true);
        return stepGuide(`${browser} मा स्थापना गर्ने चरणहरू:`, [
          'माथि दायाँपट्टि रहेको तीनवटा थोप्ला (⋮) थिच्नुहोस्।',
          '“Install app” वा “Add to Home screen” छान्नुहोस्।',
          '“Install” वा “Add” थिच्नुहोस्।',
          'अब मोबाइलको Home Screen बाट देउडालय खोल्नुहोस्।'
        ], true);
      }
      if (browser === 'Opera' && hasPrompt) {
        return stepGuide('देउडालय स्थापना गर्न तलको बटन थिच्नुहोस् र ब्राउजरको निर्देशन पालना गर्नुहोस्।', [
          'तलको “देउडालय स्थापना गर्नुहोस्” बटन थिच्नुहोस्।',
          'ब्राउजरको पुष्टिमा “Install” छान्नुहोस्।',
          'Home Screen बाट देउडालय खोल्नुहोस्।'
        ], true);
      }
      return stepGuide('Android मा देउडालय स्थापना गर्न Chrome मा खोल्नुहोस्:', [
        'यो पृष्ठ Chrome मा खोल्नुहोस्।',
        'माथि दायाँपट्टि रहेको तीनवटा थोप्ला (⋮) थिच्नुहोस्।',
        '“Install app” वा “Add to Home screen” छान्नुहोस्।',
        '“Install” वा “Add” थिच्नुहोस्।'
      ], true);
    }

    if (device === 'mac' && browser === 'Safari') {
      if (safariVersion >= 17) {
        return stepGuide('Mac मा Safari बाट देउडालयलाई Dock मा राख्नुहोस्:', [
          'माथिको File मेनु खोल्नुहोस्।',
          '“Add to Dock” उपलब्ध भए मात्र छान्नुहोस्।',
          'पुष्टि गरेर देउडालय खोल्नुहोस्।'
        ], true);
      }
      return stepGuide('यो Safari संस्करणमा Add to Dock उपलब्ध नहुन सक्छ। macOS Sonoma 14 वा पछिल्लो संस्करणको Safari प्रयोग गर्नुहोस्।', [], true);
    }

    if (device === 'windows' && ['Chrome', 'Edge'].includes(browser)) {
      return stepGuide(`डेस्कटप · ${browser} मा स्थापना गर्ने चरणहरू:`, [
        'Address bar नजिक रहेको Install आइकन थिच्नुहोस्।',
        'आइकन नदेखिएमा ⋮ मेनुमा “Install Deudalaya” वा “Install page as app” छान्नुहोस्।',
        '“Install” पुष्टि गर्नुहोस् र Desktop वा Start menu बाट देउडालय खोल्नुहोस्।'
      ], true);
    }

    if (promptBrowsers.includes(browser) && device !== 'iphone' && device !== 'ipad') {
      return stepGuide(`${browser} मा देउडालय स्थापना गर्ने चरणहरू:`, [
        'तलको “देउडालय स्थापना गर्नुहोस्” बटन थिच्नुहोस्।',
        'ब्राउजरको पुष्टिमा “Install” छान्नुहोस्।',
        'देउडालय एप खुल्नेछ।'
      ], true);
    }

    if (browser === 'Firefox') {
      return stepGuide('Firefox ले वेब एप स्थापना उपलब्ध गराउँदैन। स्थापना गर्न Windows वा Mac मा Chrome वा Edge प्रयोग गर्नुहोस्।', [], true);
    }
    return stepGuide('यो ब्राउजरले देउडालय स्थापना उपलब्ध गराउँदैन। स्थापना गर्न Chrome, Edge वा समर्थित ब्राउजर प्रयोग गर्नुहोस्।', [], true);
  }

  function updateButton() {
    if (installed) {
      if (installHelp) installHelp.hidden = true;
      installButton.disabled = true;
      installButton.hidden = true;
      const inStandalone = isStandaloneMode();
      if (installIntro) installIntro.textContent = inStandalone
        ? 'देउडालय यस उपकरणमा पहिल्यै स्थापित छ।'
        : 'देउडालय स्थापित भयो। Deudalaya खोल्न Home Screen वा Desktop बाट एप खोल्नुहोस्।';
      if (installSteps) installSteps.innerHTML = '';
      installHint.textContent = inStandalone
        ? 'देउडालय यस उपकरणमा पहिल्यै स्थापित छ।'
        : 'Deudalaya एप Home Screen वा Desktop बाट खोल्नुहोस्।';
      if (inStandalone) {
        document.documentElement.classList.remove('ecosystem-gateway');
        document.documentElement.classList.add('deudalaya-standalone');
      }
      return;
    }

    if (relatedAppDetected && !deferredPrompt && !isStandaloneMode()) {
      if (installHelp) installHelp.hidden = false;
      installButton.hidden = false;
      installButton.disabled = promptPending;
      installButton.textContent = 'Install App';
      if (installIntro) installIntro.textContent = 'देउडालय यस उपकरणमा पहिल्यै स्थापित छ।';
      if (installSteps) installSteps.innerHTML = '<li>Home Screen वा App list बाट देउडालय खोल्नुहोस्।</li>';
      installHint.textContent = 'पहिल्यै स्थापित Deudalaya खोल्न Home Screen वा App list प्रयोग गर्नुहोस्।';
      return;
    }

    const hasNativePrompt = !!deferredPrompt && promptBrowsers.includes(environment.browser) && environment.device !== 'iphone' && environment.device !== 'ipad';
    if (installHelp) installHelp.hidden = hasNativePrompt || window.deudalayaInstallationStatus === 'installation-pending';
    const guide = getGuide(hasNativePrompt);
    installButton.hidden = !guide.showInstallButton;
    installButton.disabled = promptPending || installed || !guide.showInstallButton;
    installButton.textContent = 'Install App';
    if (installIntro) installIntro.textContent = guide.intro;
    if (installSteps) installSteps.innerHTML = guide.steps.map(step => `<li>${step}</li>`).join('');
    if (!guide.showInstallButton) {
      installHint.textContent = guide.steps.length
        ? 'तलका चरणहरू पालना गर्नुहोस्।'
        : 'यस ब्राउजरमा अहिले स्थापना विकल्प उपलब्ध छैन।';
    } else if (hasNativePrompt) {
      installHint.textContent = 'देउडालय स्थापना गर्न तयार छ।';
    } else if (environment.device === 'android' && ['Chrome', 'Edge', 'Brave'].includes(environment.browser)) {
      installHint.textContent = 'यो पृष्ठका लागि native prompt उपलब्ध छैन। स्थापना गर्न माथिको ⋮ मेनुबाट “Install app” छान्नुहोस्।';
    } else if (environment.device === 'android') {
      installHint.textContent = 'यो पृष्ठ Chrome मा खोलेर ⋮ मेनुबाट “Install app” छान्नुहोस्।';
    } else if (environment.device === 'windows' && ['Chrome', 'Edge'].includes(environment.browser)) {
      installHint.textContent = 'यो पृष्ठका लागि native prompt उपलब्ध छैन। Address bar को Install आइकन वा ⋮ मेनु प्रयोग गर्नुहोस्।';
    } else if (environment.device === 'mac' && environment.browser === 'Safari') {
      installHint.textContent = 'Safari को File मेनुबाट “Add to Dock” छान्नुहोस्।';
    } else {
      installHint.textContent = 'तलका चरणहरू पालना गर्नुहोस्।';
    }
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
    if (!deferredPrompt || !promptBrowsers.includes(environment.browser)) {
      if (relatedAppDetected && !deferredPrompt) {
        installHint.textContent = 'Deudalaya पहिल्यै स्थापित छ। Home Screen वा App list बाट खोल्नुहोस्।';
        return;
      }
      if (environment.device === 'android' && ['Chrome', 'Edge', 'Brave'].includes(environment.browser)) {
        installHint.textContent = 'माथिको ⋮ मेनु थिचेर “Install app” वा “Add to Home screen” छान्नुहोस्।';
        return;
      }
      if (environment.device === 'android') {
        installHint.textContent = 'यो पृष्ठ Chrome मा खोलेर माथिको ⋮ मेनुबाट “Install app” वा “Add to Home screen” छान्नुहोस्।';
        return;
      }
      if (environment.device === 'iphone' || environment.device === 'ipad') {
        installHint.textContent = 'Safari मा Share बटन थिचेर “Add to Home Screen”, त्यसपछि “Add” छान्नुहोस्।';
        return;
      }
      if (environment.device === 'windows' && ['Chrome', 'Edge'].includes(environment.browser)) {
        installHint.textContent = 'Address bar को Install आइकन वा ⋮ मेनुबाट “Install Deudalaya” वा “Install page as app” छान्नुहोस्।';
        return;
      }
      if (environment.device === 'mac' && environment.browser === 'Safari' && environment.safariVersion >= 17) {
        installHint.textContent = 'Safari को File मेनुबाट “Add to Dock” छानेर पुष्टि गर्नुहोस्।';
        return;
      }
      if (promptBrowsers.includes(environment.browser)) {
        installHint.textContent = 'ब्राउजरको Install आइकन वा मेनुबाट “Install Deudalaya” छान्नुहोस्।';
        return;
      }
      updateButton();
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
