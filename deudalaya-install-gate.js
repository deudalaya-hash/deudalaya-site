(function () {
  'use strict';

  // The normal root URL now hosts the app-discovery gateway. Keep the
  // Deudalaya install gate for the app launch URL and its standalone window.
  if (document.documentElement.classList.contains('ecosystem-gateway')) return;

  var gate = document.getElementById('deudalayaInstallGate');
  var action = document.getElementById('deudalayaInstallAction');
  var hint = document.getElementById('deudalayaInstallHint');
  if (!gate || !action || !hint) return;

  function isStandalone() {
    try {
      var modes = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay'];
      return modes.some(function (mode) {
        return window.matchMedia('(display-mode: ' + mode + ')').matches;
      }) || navigator.standalone === true || (document.referrer || '').indexOf('android-app://') === 0;
    } catch (_) {
      return false;
    }
  }

  if (isStandalone()) {
    document.documentElement.classList.add('deudalaya-installed');
    gate.hidden = true;
    return;
  }

  document.body.classList.add('install-required');
  action.focus();

  // Keep the content behind the modal out of keyboard and assistive-technology navigation.
  function lockPageContent(node) {
    if (node.nodeType !== 1 || node === gate || node.parentElement !== document.body ||
        node.tagName === 'SCRIPT' || node.tagName === 'STYLE') return;
    node.inert = true;
    node.setAttribute('aria-hidden', 'true');
  }
  Array.prototype.forEach.call(document.body.children, lockPageContent);
  if (window.MutationObserver) {
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, lockPageContent);
      });
    });
    observer.observe(document.body, { childList: true });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      action.focus();
    }
    event.stopImmediatePropagation();
  }, true);
  document.addEventListener('focusin', function (event) {
    if (!gate.contains(event.target)) action.focus();
  }, true);

  function showInstructions() {
    var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    hint.textContent = isIOS
      ? 'To install, tap Share, choose “Add to Home Screen,” then tap Add.'
      : 'To install, open your browser menu and choose “Install app” or “Add to Home screen.”';
    action.textContent = isIOS ? 'Show iPhone install steps' : 'Show browser install steps';
  }

  action.addEventListener('click', async function () {
    var promptEvent = window.deudalayaInstallPrompt;
    if (!promptEvent) {
      showInstructions();
      return;
    }

    window.deudalayaInstallPrompt = null;
    action.disabled = true;
    try {
      await promptEvent.prompt();
      var result = await promptEvent.userChoice;
      if (result && result.outcome === 'accepted') {
        try { localStorage.setItem('ecosystem-install-deudalaya', 'reported'); } catch (_) {}
        hint.textContent = 'Installation was accepted. If Open App stays in the browser, launch Deudalaya from your home screen.';
        action.hidden = true;
        document.getElementById('deudalayaOpenInstalled').hidden = false;
      } else {
        hint.textContent = 'Installation was cancelled. Install Deudalaya to continue.';
        action.textContent = 'Show browser install steps';
      }
    } catch (_) {
      showInstructions();
    } finally {
      action.disabled = false;
    }
  });

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    window.deudalayaInstallPrompt = event;
    action.textContent = 'Install देउडालय App';
    hint.textContent = 'देउडालय is ready to install. Install it to continue.';
  });

  window.addEventListener('appinstalled', function () {
    try { localStorage.setItem('ecosystem-install-deudalaya', 'reported'); } catch (_) {}
    hint.textContent = 'The browser confirmed installation. Use Open App, or launch Deudalaya from your home screen.';
    action.hidden = true;
    document.getElementById('deudalayaOpenInstalled').hidden = false;
  });
})();
