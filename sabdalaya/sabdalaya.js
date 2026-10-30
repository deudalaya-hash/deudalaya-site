(function () {
  'use strict';
  const installGate = document.getElementById('installGate');
  const recordGate = document.getElementById('recordGate');
  const shell = document.querySelector('.app-shell');
  const installButton = document.getElementById('installButton');
  const installAction = document.getElementById('installAction');
  const installHint = document.getElementById('installHint');
  const toast = document.getElementById('toast');
  let installPrompt = null;
  let context = null;
  let oscillators = [];
  let activeButton = null;
  let audioTimer = 0;
  let toastTimer = 0;
  let recorder = null;
  let stream = null;
  let chunks = [];
  let recordingUrl = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches || navigator.standalone === true;
  }
  const standalone = isStandalone();
  if (standalone) document.documentElement.classList.add('sabdalaya-installed');
  else {
    document.documentElement.classList.add('sabdalaya-install-required');
    installGate.hidden = false;
    shell.inert = true;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  function openPanel(panel) { panel.hidden = false; shell.inert = true; }
  function closePanel(panel, focusTarget) {
    if (!standalone && panel === installGate) return;
    panel.hidden = true;
    shell.inert = false;
    if (focusTarget) focusTarget.focus();
  }
  installButton.addEventListener('click', () => {
    openPanel(installGate);
    installAction.focus();
  });
  document.getElementById('continueAction').addEventListener('click', () => closePanel(installGate, installButton));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !installGate.hidden && standalone) closePanel(installGate, installButton);
    if (event.key === 'Escape' && !recordGate.hidden) closeRecordingPanel();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    installHint.textContent = 'Your browser confirmed installation. Open App is now available.';
    document.getElementById('openInstalledApp').hidden = false;
  });
  installAction.addEventListener('click', async () => {
    if (!installPrompt) {
      const apple = /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      installHint.textContent = apple
        ? 'Safari on iPhone or iPad: tap Share, choose “Add to Home Screen,” then tap Add.'
        : 'Chrome or Edge: select Install from the address bar or browser menu. Other browsers: choose “Add to Home Screen.”';
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      installHint.textContent = result.outcome === 'accepted'
        ? 'Install request accepted. Waiting for browser confirmation before enabling Open App.'
        : 'Installation was cancelled. Select Install App to try again.';
    } catch (_) { installHint.textContent = 'Could not start installation. Follow the browser instructions above.'; }
  });

  if (navigator.getInstalledRelatedApps) {
    navigator.getInstalledRelatedApps().then(apps => {
      const appId = new URL('/sabdalaya/', location.origin).href;
      const manifestUrl = new URL('/sabdalaya/manifest.webmanifest', location.origin).href;
      if (apps.some(app => app.id === appId || app.url === manifestUrl)) {
        installHint.textContent = 'This browser confirmed installation. Open App is available.';
        document.getElementById('openInstalledApp').hidden = false;
      }
    }).catch(() => {});
  }

  document.querySelectorAll('[data-needs-backend]').forEach(button => {
    button.addEventListener('click', () => showToast('यो सुविधा खातासहितको ब्याकएन्ड जोडिएपछि उपलब्ध हुनेछ।'));
  });

  function stopDemo() {
    clearTimeout(audioTimer);
    oscillators.forEach(oscillator => { try { oscillator.stop(); } catch (_) {} });
    oscillators = [];
    if (activeButton) activeButton.classList.remove('playing');
    activeButton = null;
  }
  function playDemo(post, button) {
    if (activeButton === button) { stopDemo(); return; }
    stopDemo();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) { showToast('यो ब्राउजरले अडियो demo समर्थन गर्दैन।'); return; }
    context = context || new AudioContextClass();
    context.resume();
    const notes = post.dataset.tone.split(',').map(Number);
    const now = context.currentTime;
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + index * .34);
      gain.gain.linearRampToValueAtTime(.07, now + index * .34 + .04);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .34 + .31);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(now + index * .34); oscillator.stop(now + index * .34 + .33);
      oscillators.push(oscillator);
    });
    button.classList.add('playing'); activeButton = button;
    audioTimer = setTimeout(stopDemo, notes.length * 340 + 150);
  }
  document.querySelectorAll('.sound-post').forEach(post => {
    const bars = [5,9,13,7,17,11,6,15,9,19,12,6,14,8,17,10,5,13,18,7,11,15,6,12,17,9,5,14,10,18,7,12,16,8,5,13,19,9,14,6];
    post.querySelectorAll('.waveform').forEach(wave => bars.forEach(height => {
      const bar = document.createElement('i'); bar.style.height = `${height}px`; wave.appendChild(bar);
    }));
    post.querySelectorAll('.play-button').forEach(button => button.addEventListener('click', () => playDemo(post, button)));
    post.querySelector('.like-button').addEventListener('click', event => {
      const button = event.currentTarget;
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      showToast('डेमो मात्र · Like यस भ्रमणमा मात्रै देखिन्छ।');
    });
    post.querySelector('.save-button').addEventListener('click', event => {
      const button = event.currentTarget;
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
      showToast('डेमो मात्र · Save स्थायी रूपमा सुरक्षित हुँदैन।');
    });
    post.querySelector('.share-button').addEventListener('click', async () => {
      try {
        if (navigator.share) await navigator.share({ title: 'शब्दलय', url: location.href });
        else if (navigator.clipboard) await navigator.clipboard.writeText(location.href);
        else { showToast('शब्दलय लिंक शेयर गर्न ब्राउजर ठेगाना प्रतिलिपि गर्नुहोस्।'); return; }
        showToast('शब्दलयको लिंक शेयर भयो। demo अडियो समावेश छैन।');
      } catch (_) { showToast('शेयर रद्द भयो।'); }
    });
  });

  const recordPreview = document.getElementById('recordPreview');
  const recordStatus = document.getElementById('recordStatus');
  const startRecording = document.getElementById('startRecording');
  const stopRecording = document.getElementById('stopRecording');
  document.getElementById('recordAction').addEventListener('click', () => {
    openPanel(recordGate);
    document.getElementById('startRecording').focus();
  });
  document.getElementById('closeRecord').addEventListener('click', closeRecordingPanel);
  function cleanupRecording() {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    recorder = null;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    recordingUrl = null;
    recordPreview.pause(); recordPreview.removeAttribute('src'); recordPreview.load(); recordPreview.hidden = true;
    chunks = [];
    startRecording.disabled = false; stopRecording.disabled = true;
    recordStatus.textContent = 'माइक सुरु गर्न तयार';
  }
  function closeRecordingPanel() {
    cleanupRecording();
    closePanel(recordGate, document.getElementById('recordAction'));
  }
  startRecording.addEventListener('click', async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      recordStatus.textContent = 'यो ब्राउजरमा रेकर्डिङ उपलब्ध छैन।'; return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.addEventListener('dataavailable', event => { if (event.data.size) chunks.push(event.data); });
      recorder.addEventListener('stop', () => {
        if (chunks.length) {
          recordingUrl = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
          recordPreview.src = recordingUrl; recordPreview.hidden = false;
          recordStatus.textContent = 'स्थानीय preview तयार · अपलोड गरिएको छैन';
        }
        if (stream) stream.getTracks().forEach(track => track.stop());
        stream = null; startRecording.disabled = false; stopRecording.disabled = true;
      }, { once: true });
      recorder.start(); startRecording.disabled = true; stopRecording.disabled = false;
      recordStatus.textContent = 'रेकर्ड हुँदैछ…';
    } catch (_) {
      recordStatus.textContent = 'माइक अनुमति उपलब्ध भएन। रेकर्डिङ सुरु भएन।';
    }
  });
  stopRecording.addEventListener('click', () => {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sabdalaya/sw.js', { scope: '/sabdalaya/' }).catch(error => {
      console.warn('शब्दलय service worker दर्ता हुन सकेन:', error.message || error);
    });
  }
}());
