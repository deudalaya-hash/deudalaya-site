(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document && root.navigator) api.init(root);
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const DISMISSED_KEY = 'deudalaya-update-dismissed';

  function compareVersions(left, right) {
    const a = String(left || '').split(/[^0-9]+/).filter(Boolean).map(Number);
    const b = String(right || '').split(/[^0-9]+/).filter(Boolean).map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      const x = a[i] || 0;
      const y = b[i] || 0;
      if (x !== y) return x > y ? 1 : -1;
    }
    return 0;
  }

  function createUpdateGate(storage) {
    function readDismissed() {
      try { return storage.getItem(DISMISSED_KEY) || ''; } catch (_) { return ''; }
    }
    function dismiss(key) {
      try { storage.setItem(DISMISSED_KEY, String(key || '')); } catch (_) {}
    }
    function isDismissed(key) { return readDismissed() === String(key || ''); }
    return Object.freeze({
      isDismissed,
      shouldAnnounce(current, candidate) {
        return !!candidate && compareVersions(candidate, current) > 0 && !isDismissed(candidate);
      },
      shouldAnnounceWorker(buildId) {
        return !!buildId && !isDismissed('worker:' + String(buildId));
      },
      dismiss,
      dismissWorker(buildId) { dismiss('worker:' + String(buildId)); },
      inheritReleaseDismissal(buildId, releaseVersion, currentVersion) {
        if (!buildId || String(releaseVersion || '') !== String(currentVersion || '') || !isDismissed(releaseVersion)) return false;
        dismiss('worker:' + String(buildId));
        return true;
      }
    });
  }

  function init(root) {
    const doc = root.document;
    const nav = root.navigator;
    const currentVersion = root.deudalayaBuildVersion;
    const notice = doc.getElementById('updateNotice');
    if (!notice || !currentVersion) return;

    let gate;
    try { gate = createUpdateGate(root.localStorage); }
    catch (_) { gate = createUpdateGate({ getItem() { return ''; }, setItem() {} }); }
    let registration = null;
    let updateKey = '';
    let applying = false;
    let reloadOnControllerChange = false;

    function showNotice(key) {
      if (!key) return;
      const id = String(key);
      if (id.startsWith('worker:')) {
        if (!gate.shouldAnnounceWorker(id.slice(7))) return;
      } else if (!gate.shouldAnnounce(currentVersion, id)) return;
      updateKey = id;
      const title = doc.getElementById('updateTitle');
      const message = doc.getElementById('updateMessage');
      if (title) title.textContent = 'Update Available';
      if (message) message.textContent = 'A new version of Deudalaya is ready.';
      notice.hidden = false;
      notice.classList.add('update-banner-pulse');
      root.dispatchEvent(new root.CustomEvent('deudalaya:update-available', { detail: { version: id } }));
    }

    function hideNotice() {
      notice.hidden = true;
      notice.classList.remove('update-banner-pulse');
    }

    async function readRelease() {
      try {
        const url = new URL('version.json', doc.baseURI);
        url.searchParams.set('check', String(Date.now()));
        const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) return null;
        return await response.json();
      } catch (_) { return null; }
    }

    async function checkForSiteUpdate() {
      const release = await readRelease();
      if (release && release.version && gate.shouldAnnounce(currentVersion, release.version)) {
        showNotice(release.version);
        return release;
      }
      return null;
    }

    function readWorkerBuildId(worker) {
      return new Promise(resolve => {
        if (!worker || typeof root.MessageChannel !== 'function') return resolve('');
        const channel = new root.MessageChannel();
        const timer = setTimeout(() => resolve(''), 2000);
        channel.port1.onmessage = event => {
          clearTimeout(timer);
          resolve(String(event.data || ''));
          channel.port1.close();
        };
        try { worker.postMessage({ type: 'GET_BUILD_ID' }, [channel.port2]); }
        catch (_) { clearTimeout(timer); resolve(''); }
      });
    }

    async function announceWorker(worker) {
      if (!nav.serviceWorker.controller) return;
      const [buildId, release] = await Promise.all([readWorkerBuildId(worker), readRelease()]);
      if (release && release.version && compareVersions(release.version, currentVersion) > 0) {
        showNotice(release.version);
      } else if (buildId) {
        if (!gate.inheritReleaseDismissal(buildId, release && release.version, currentVersion)) {
          showNotice('worker:' + buildId);
        }
      }
    }

    async function reloadFresh() {
      const fresh = new URL(root.location.href);
      fresh.searchParams.set('refresh', String(Date.now()));
      fresh.searchParams.set('v', currentVersion);
      root.location.replace(fresh.href);
    }

    function waitForInstalled(worker) {
      return new Promise((resolve, reject) => {
        if (!worker || worker.state === 'installed' || worker.state === 'activated') return resolve();
        const timer = setTimeout(() => reject(new Error('Update timed out')), 15000);
        worker.addEventListener('statechange', function() {
          if (worker.state === 'installed' || worker.state === 'activated') {
            clearTimeout(timer);
            resolve();
          } else if (worker.state === 'redundant') {
            clearTimeout(timer);
            reject(new Error('Update could not be installed'));
          }
        });
      });
    }

    async function applySiteUpdate() {
      if (applying) return;
      applying = true;
      try {
        if (!nav.serviceWorker) return await reloadFresh();
        const scope = new URL('/', root.location.origin).href;
        registration = registration || await nav.serviceWorker.getRegistration(scope);
        if (!registration) return await reloadFresh();
        await registration.update();
        if (!registration.waiting && registration.installing) await waitForInstalled(registration.installing);
        const waiting = registration.waiting;
        if (!waiting) return await reloadFresh();
        reloadOnControllerChange = true;
        nav.serviceWorker.addEventListener('controllerchange', function() {
          if (reloadOnControllerChange) {
            reloadOnControllerChange = false;
            reloadFresh();
          }
        }, { once: true });
        waiting.postMessage({ type: 'SKIP_WAITING' });
      } catch (_) {
        applying = false;
        const message = doc.getElementById('updateMessage');
        if (message) message.textContent = 'Could not update right now. Please try again.';
        notice.hidden = false;
      }
    }

    function dismissCurrent() {
      gate.dismiss(updateKey);
      hideNotice();
    }

    const applyButton = doc.getElementById('applyUpdate');
    const laterButton = doc.getElementById('laterUpdate');
    const dismissButton = doc.getElementById('dismissUpdate');
    if (applyButton) applyButton.addEventListener('click', applySiteUpdate);
    if (laterButton) laterButton.addEventListener('click', dismissCurrent);
    if (dismissButton) dismissButton.addEventListener('click', dismissCurrent);

    root.applySiteUpdate = applySiteUpdate;
    root.checkForSiteUpdate = checkForSiteUpdate;

    if (nav.serviceWorker) {
      const scope = new URL('/', root.location.origin).href;
      nav.serviceWorker.getRegistration(scope).then(async reg => {
        if (!reg) return;
        registration = reg;
        if (reg.waiting && nav.serviceWorker.controller) announceWorker(reg.waiting);
        reg.addEventListener('updatefound', function() {
          const worker = reg.installing;
          if (!worker) return;
          worker.addEventListener('statechange', function() {
            if (worker.state === 'installed' && nav.serviceWorker.controller) announceWorker(worker);
          });
        });
        const updateWorker = () => {
          if (doc.visibilityState === 'visible') reg.update().catch(() => {});
        };
        updateWorker();
        setInterval(updateWorker, 60000);
        doc.addEventListener('visibilitychange', updateWorker);
      }).catch(() => {});
    }

    checkForSiteUpdate();
    setInterval(() => { if (doc.visibilityState === 'visible') checkForSiteUpdate(); }, 90000);
    doc.addEventListener('visibilitychange', () => {
      if (doc.visibilityState === 'visible') checkForSiteUpdate();
    });
  }

  return Object.freeze({ compareVersions, createUpdateGate, init });
});
