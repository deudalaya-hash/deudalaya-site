(function () {
  if (window.__deudalayaInstallUiBound) return;
  window.__deudalayaInstallUiBound = true;

  const installButton = document.getElementById('deudalayaInstallAction');
  const installHint = document.getElementById('deudalayaInstallHint');
  const installIntro = document.getElementById('deudalayaInstallIntro');
  const installSteps = document.getElementById('deudalayaInstallSteps');
  if (!installButton || !installHint) return;

  let deferredPrompt = window.deferredPrompt || null;
  let promptPending = false;
  let installed = window.deudalayaInstallState === 'installed' || window.deudalayaInstallState === 'standalone';
  const environment = detectEnvironment();
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

  function getGuide(hasPrompt) {
    const { browser, device, safariVersion } = environment;

    if (device === 'iphone' || device === 'ipad') {
      if (browser === 'Safari') {
        return stepGuide('Safari बाट देउडालयलाई Home Screen मा राख्नुहोस्:', [
          'तल रहेको Share बटन थिच्नुहोस्।',
          '“Add to Home Screen” छान्नुहोस्।',
          '“Add” थिच्नुहोस्।',
          'Home Screen बाट देउडालय खोल्नुहोस्।'
        ], false);
      }
      return stepGuide('iPhone वा iPad मा स्थापना गर्न Safari मा देउडालय खोल्नुहोस्।', [], false);
    }

    if (device === 'android') {
      if (['Chrome', 'Edge', 'Brave'].includes(browser)) {
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
        ], false);
      }
      return stepGuide('यो Safari संस्करणमा Add to Dock उपलब्ध नहुन सक्छ। macOS Sonoma 14 वा पछिल्लो संस्करणको Safari प्रयोग गर्नुहोस्।', [], false);
    }

    if (device === 'windows' && ['Chrome', 'Edge'].includes(browser)) {
      if (hasPrompt) {
        return stepGuide(`Windows · ${browser} मा स्थापना गर्ने चरणहरू:`, [
          'Address bar नजिक रहेको Install आइकन उपलब्ध भए थिच्नुहोस्।',
          'आइकन नदेखिएमा तलको “देउडालय स्थापना गर्नुहोस्” बटन थिच्नुहोस्।',
          '“Install” छान्नुहोस्। देउडालय एप कम्प्युटरमा खुल्नेछ।'
        ], true);
      }
      return stepGuide('यस पृष्ठका लागि अहिले स्थापना विकल्प उपलब्ध छैन। ब्राउजर अपडेट गरेर फेरि प्रयास गर्नुहोस्।', [], false);
    }

    if (promptBrowsers.includes(browser) && hasPrompt && device !== 'iphone' && device !== 'ipad') {
      return stepGuide(`${browser} मा देउडालय स्थापना गर्ने चरणहरू:`, [
        'तलको “देउडालय स्थापना गर्नुहोस्” बटन थिच्नुहोस्।',
        'ब्राउजरको पुष्टिमा “Install” छान्नुहोस्।',
        'देउडालय एप खुल्नेछ।'
      ], true);
    }

    if (browser === 'Firefox') {
      return stepGuide('Firefox मा देउडालय स्थापना उपलब्ध छैन। Windows वा Mac मा Chrome वा Edge प्रयोग गर्नुहोस्।', [], false);
    }
    return stepGuide('यो ब्राउजरमा स्थापना उपलब्ध छैन। देउडालय स्थापना गर्न Chrome, Edge वा समर्थित ब्राउजर प्रयोग गर्नुहोस्।', [], false);
  }

  function updateButton() {
    if (installed) {
      installButton.disabled = true;
      installButton.hidden = true;
      if (installIntro) installIntro.textContent = 'देउडालय यस उपकरणमा पहिल्यै स्थापित छ।';
      if (installSteps) installSteps.innerHTML = '';
      installHint.textContent = 'देउडालय यस उपकरणमा पहिल्यै स्थापित छ।';
      document.documentElement.classList.remove('ecosystem-gateway');
      return;
    }

    const guide = getGuide(!!deferredPrompt && promptBrowsers.includes(environment.browser));
    installButton.hidden = !guide.showInstallButton;
    installButton.disabled = promptPending || installed || !guide.showInstallButton;
    installButton.textContent = deferredPrompt && promptBrowsers.includes(environment.browser)
      ? 'Install App'
      : environment.device === 'android'
        ? 'Install via ⋮ menu'
        : 'Install App';
    if (installIntro) installIntro.textContent = guide.intro;
    if (installSteps) installSteps.innerHTML = guide.steps.map(step => `<li>${step}</li>`).join('');
    installHint.textContent = guide.showInstallButton
      ? deferredPrompt
        ? 'देउडालय स्थापना गर्न तयार छ।'
        : environment.device === 'android' && ['Chrome', 'Edge', 'Brave'].includes(environment.browser)
          ? 'स्थापना गर्न माथिको ⋮ मेनुबाट “Install app” छान्नुहोस्।'
          : environment.device === 'android'
            ? 'यो पृष्ठ Chrome मा खोलेर ⋮ मेनुबाट “Install app” छान्नुहोस्।'
          : 'देउडालय स्थापना गर्न तयार छ।'
      : guide.steps.length ? 'तलका चरणहरू पालना गर्नुहोस्।' : 'यस ब्राउजरमा अहिले स्थापना विकल्प उपलब्ध छैन।';
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
    if (window.deudalayaInstallState !== 'installed' && window.deudalayaInstallState !== 'standalone') return;
    installed = true;
    deferredPrompt = null;
    updateButton();
  });

  installButton.addEventListener('click', async function (event) {
    event.preventDefault();
    if (promptPending || installed) return;
    if (!deferredPrompt || !promptBrowsers.includes(environment.browser)) {
      if (environment.device === 'android' && ['Chrome', 'Edge', 'Brave'].includes(environment.browser)) {
        installHint.textContent = 'माथिको ⋮ मेनु थिचेर “Install app” वा “Add to Home screen” छान्नुहोस्।';
        return;
      }
      if (environment.device === 'android') {
        installHint.textContent = 'यो पृष्ठ Chrome मा खोलेर माथिको ⋮ मेनुबाट “Install app” वा “Add to Home screen” छान्नुहोस्।';
        return;
      }
      updateButton();
      return;
    }

    const promptEvent = deferredPrompt;
    promptPending = true;
    installButton.disabled = true;
    installHint.textContent = 'ब्राउजरको स्थापना पुष्टि खुल्दैछ…';

    try {
      const promptResult = deferredPrompt.prompt();
      deferredPrompt = null;
      window.deferredPrompt = null;
      await Promise.resolve(promptResult);
      const choice = await promptEvent.userChoice;
      installHint.textContent = choice && choice.outcome === 'accepted'
        ? 'स्थापना स्वीकार गरियो।'
        : 'स्थापना रद्द गरियो।';
    } catch (error) {
      deferredPrompt = null;
      window.deferredPrompt = null;
      installHint.textContent = 'स्थापना पूरा भएन। फेरि प्रयास गर्नुहोस्।';
    } finally {
      promptPending = false;
      installButton.disabled = promptPending || installed;
    }
  });

  updateButton();
})();
