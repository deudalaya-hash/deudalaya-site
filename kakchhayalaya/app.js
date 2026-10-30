(() => {
  'use strict';
  const classView = document.getElementById('classView');
  const classesView = document.getElementById('classesView');
  const classTitle = document.getElementById('classTitle');
  const installButton = document.getElementById('installButton');
  const installGate = document.getElementById('classInstallGate');
  const installButton = document.getElementById('classInstallAction');
  const headerInstallButton = document.getElementById('installButton');
  const openInstalled = document.getElementById('classOpenInstalled');
  const installStatus = document.getElementById('classInstallStatus');
  let installPrompt;
  const className = grade => `Class ${grade}`;
  const appId = new URL('/kakchhayalaya/', location.origin).href;
  const standalone = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay'].some(mode => window.matchMedia(`(display-mode: ${mode})`).matches) || navigator.standalone === true;
  installGate.hidden = standalone;
  document.documentElement.classList.toggle('class-install-required', !standalone);

  function showRoute() {
    const grade = Number(new URLSearchParams(location.search).get('class'));
    const validClass = Number.isInteger(grade) && grade >= 1 && grade <= 10;
    classesView.hidden = validClass;
    classView.hidden = !validClass;
    if (validClass) {
      classTitle.textContent = className(grade);
      document.title = `${className(grade)} | कक्षालय`;
    } else {
      document.title = 'कक्षालय | सिकाइको साझा घर';
    }
  }

  document.querySelectorAll('[data-back-to-classes]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      history.pushState({}, '', './');
      showRoute();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
  window.addEventListener('popstate', showRoute);
  showRoute();

  const installButtons = [installButton, headerInstallButton];
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButtons.forEach(button => { button.textContent = 'Install App'; });
  });
  async function requestInstall() {
    if (!installPrompt) {
      const apple = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      installStatus.textContent = apple
        ? 'Safari: tap Share, choose Add to Home Screen, then tap Add.'
        : 'Chrome or Edge: select Install from the address bar or browser menu. Other browsers: choose Add to Home Screen.';
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    try {
      prompt.prompt();
      const result = await prompt.userChoice;
      installStatus.textContent = result.outcome === 'accepted'
        ? 'Install request accepted. Waiting for browser confirmation before enabling Open App.'
        : 'Installation was cancelled. Choose Install App to try again.';
    } catch (_) {
      installStatus.textContent = 'Open your browser menu and choose Install App or Add to Home Screen.';
    }
  }
  installButtons.forEach(button => button.addEventListener('click', requestInstall));
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    openInstalled.hidden = false;
    installStatus.textContent = 'Your browser confirmed installation. Open App is now available.';
  });
  if (navigator.getInstalledRelatedApps) {
    navigator.getInstalledRelatedApps().then(apps => {
      if (apps.some(app => app.id === appId || app.url === new URL('/kakchhayalaya/manifest.webmanifest', location.origin).href)) {
        openInstalled.hidden = false;
        installStatus.textContent = 'This browser confirmed कक्षालय is installed. Open App is now available.';
      }
    }).catch(() => {});
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/kakchhayalaya/sw.js', { scope: '/kakchhayalaya/' }).catch(() => {});
    });
  }
})();
