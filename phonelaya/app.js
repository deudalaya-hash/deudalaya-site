(function () {
  'use strict';

  const samples = [
    { id:'sample-1', name:'माया कार्की (Demo)', phone:'+977 980 000 0001', email:'maya@example.test', source:'Demo', tone:1 },
    { id:'sample-2', name:'राजु खड्का (Demo)', phone:'+977 980 000 0002', email:'raju@example.test', source:'Demo', tone:2 },
    { id:'sample-3', name:'मिना शाही (Demo)', phone:'+977 981 000 0003', email:'mina@example.test', source:'Demo', tone:3 },
    { id:'sample-4', name:'सीता बुढा (Demo)', phone:'+977 984 000 0004', email:'sita@example.test', source:'Demo', tone:4 },
    { id:'sample-5', name:'नविन बिष्ट (Demo)', phone:'+977 985 000 0005', email:'nabin@example.test', source:'Demo', tone:5 },
    { id:'sample-6', name:'माया के. (डुप्लिकेट Demo)', phone:'9800000001', email:'maya.k@example.test', source:'Demo', tone:1 }
  ];
  let contacts = samples.map(record => ({ ...record }));
  let demoSnapshot = samples.map(record => ({ ...record }));
  let backupHistory = [];
  let toastTimer;
  let installPrompt = null;

  const $ = selector => document.querySelector(selector);
  const installGate = $('#phoneInstallGate');
  const installStatus = $('#phoneInstallStatus');
  const appId = new URL('/phonelaya/', location.origin).href;
  const standalone = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay'].some(mode => window.matchMedia(`(display-mode: ${mode})`).matches) || navigator.standalone === true;
  document.documentElement.classList.toggle('phone-install-required', !standalone);
  installGate.hidden = standalone;
  function markInstalled() {
    $('#phoneOpenInstalled').hidden = false;
    $('#phoneInstallAction').hidden = true;
    installStatus.textContent = 'Your browser confirmed installation. Open App is now available.';
  }
  const digits = value => String(value || '').replace(/\D/g, '').replace(/^977(?=\d{10}$)/, '');
  const formatCount = value => Number(value).toLocaleString('en-US');
  const initials = name => Array.from(String(name || '?').replace(/\s*\([^)]*\)\s*/g, ' ').trim())[0] || '?';
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3400);
  }
  function goToView(view) {
    document.querySelectorAll('[data-view]').forEach(section => {
      const active = section.dataset.view === view;
      section.hidden = !active;
      section.classList.toggle('active', active);
    });
    document.querySelectorAll('[data-view-target]').forEach(button => button.classList.toggle('active', button.dataset.viewTarget === view));
    const title = ({ overview:'Your contacts', contacts:'Contacts', backup:'Contact backup demo', restore:'Restore Contacts', account:'Account & Privacy' })[view] || 'phoneलय';
    $('#pageTitle').textContent = title;
    $('#pageDescription').textContent = ({ overview:'Keep the contacts you rely on when you change phones.', contacts:'Sample and imported contacts in this browser tab.', backup:'Read a contact file and create a local demo snapshot.', restore:'Restore contacts from a sample snapshot in this tab.', account:'Login, cloud backup and encryption are not connected.' })[view] || '';
    $('#sidebar').classList.remove('open');
    $('#menuButton').setAttribute('aria-expanded', 'false');
    window.location.hash = view === 'overview' ? '' : view;
  }
  function makeContactRow(record, compact) {
    const duplicate = PhoneLayaContacts.findDuplicates([record, ...contacts.filter(item => item.id !== record.id)]).some(group => group.some(item => item.id === record.id));
    if (compact) {
      const button = element('button', 'contact-row');
      button.type = 'button';
      button.setAttribute('aria-label', `${record.name}, ${record.phone}, View details`);
      const main = element('span', 'contact-main');
      const avatar = element('span', `contact-avatar tone-${record.tone || ((record.id.length % 5) + 1)}`, initials(record.name));
      avatar.setAttribute('aria-hidden', 'true');
      const copy = element('span', 'contact-copy');
      copy.append(element('span', 'contact-name', record.name), element('span', 'contact-subline', record.phone || record.email || 'No phone or email'));
      main.append(avatar, copy);
      button.append(main, element('span', `contact-tag${duplicate ? ' duplicate' : ''}`, duplicate ? 'Duplicate' : record.source || 'Demo'));
      button.addEventListener('click', () => showContact(record));
      return button;
    }
    const row = element('div', 'all-contact-row');
    const nameButton = element('button', 'row-name', record.name);
    nameButton.type = 'button';
    nameButton.addEventListener('click', () => showContact(record));
    const phone = element('span', `row-phone${duplicate ? ' row-duplicate' : ''}`, record.phone || '—');
    const email = element('span', 'row-email', record.email || '—');
    const source = element('span', 'row-source source-label', duplicate ? 'Duplicate' : record.source || 'Demo');
    row.append(nameButton, phone, email, source);
    return row;
  }
  function renderContacts(query) {
    const q = String(query || '').trim().toLocaleLowerCase();
    const filtered = contacts.filter(record => [record.name, record.phone, record.email].join(' ').toLocaleLowerCase().includes(q));
    const overview = $('#overviewContacts');
    const all = $('#allContacts');
    overview.replaceChildren(...filtered.slice(0, 5).map(record => makeContactRow(record, true)));
    all.replaceChildren(...filtered.map(record => makeContactRow(record, false)));
    $('#overviewEmpty').hidden = filtered.length > 0;
    $('#contactsEmpty').hidden = filtered.length > 0;
    return filtered;
  }
  function renderDuplicates() {
    const groups = PhoneLayaContacts.findDuplicates(contacts);
    $('#duplicateCount').textContent = formatCount(groups.length);
    $('#backupDuplicateCount').textContent = formatCount(groups.length);
    $('#duplicateSummary').textContent = groups.length
      ? `${formatCount(groups.length)} groups of matching phone numbers found.`
      : 'No duplicate phone numbers found.';
    const list = $('#duplicateList');
    list.replaceChildren();
    groups.slice(0, 2).forEach(group => {
      const row = element('div', 'duplicate-row');
      const names = element('button', '', group.map(record => record.name).join(' · '));
      names.type = 'button';
      names.addEventListener('click', () => { goToView('contacts'); $('#contactSearch').value = group[0].phone; renderContacts(group[0].phone); });
      row.append(names, element('span', '', `${group.length} cards`));
      list.append(row);
    });
    if (!groups.length) list.append(element('p', 'fine-print', 'Sample and imported contact numbers currently in the list have been checked.'));
  }
  function updateCounts() {
    const count = formatCount(contacts.length);
    ['summaryCount', 'backupContactCount', 'contactsPageCount', 'backupPageCount'].forEach(id => { $('#' + id).textContent = count; });
    $('#navContactCount').textContent = count;
    $('#restoreSnapshotCount').textContent = formatCount(demoSnapshot.length);
    $('#historyCount').textContent = formatCount(backupHistory.length);
    renderDuplicates();
  }
  function showContact(record) {
    $('#detailName').textContent = record.name;
    $('#detailPhone').textContent = record.phone || 'Not available';
    $('#detailEmail').textContent = record.email || 'Not available';
    $('#detailSource').textContent = record.source || 'Demo list';
    $('#contactDialog').showModal();
  }
  async function importContactFile(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      $('#importStatus').textContent = 'The file is larger than 2 MB. Choose a smaller CSV or VCF file.';
      return;
    }
    const ext = file.name.toLocaleLowerCase().split('.').pop();
    if (!['csv', 'vcf'].includes(ext)) {
      $('#importStatus').textContent = 'Only CSV or VCF files are accepted.';
      return;
    }
    try {
      const text = await file.text();
      const parsed = ext === 'vcf' ? PhoneLayaContacts.parseVCF(text) : PhoneLayaContacts.parseCSV(text);
      if (!parsed.length) {
        $('#importStatus').textContent = 'No contacts found. Choose a CSV or VCF with names and phone numbers.';
        return;
      }
      const unique = parsed.map((record, index) => ({ ...record, id:`import-${Date.now()}-${index}`, source:'Import', tone:(index % 5) + 1 }));
      contacts = contacts.concat(unique);
      $('#importStatus').textContent = `${formatCount(unique.length)} contacts were imported into this tab’s memory. Nothing was sent to a server.`;
      $('#contactFile').value = '';
      updateCounts(); renderContacts($('#contactSearch').value);
      showToast(`${formatCount(unique.length)} contacts were added to this session.`);
    } catch (_) {
      $('#importStatus').textContent = 'Could not read the file. Check the CSV or VCF encoding and try again.';
    }
  }
  async function simulateBackup(button) {
    if (!contacts.length) { showToast('There are no contacts to back up.'); return; }
    if (button.disabled) return;
    const progress = $('#backupProgress');
    const fill = progress.querySelector('span');
    const status = $('#backupStatus');
    progress.hidden = false;
    button.disabled = true;
    $('#backupPageAction').disabled = true;
    status.textContent = 'Preparing a demo snapshot in this tab’s memory… nothing is being uploaded.';
    for (const value of [18, 42, 68, 100]) {
      await new Promise(resolve => setTimeout(resolve, 90));
      progress.setAttribute('aria-valuenow', String(value));
      fill.style.width = `${value}%`;
    }
    demoSnapshot = contacts.map(record => ({ ...record }));
    const now = new Date();
    backupHistory.unshift({ at:now, count:contacts.length });
    const stamp = new Intl.DateTimeFormat('en-US', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }).format(now);
    $('#lastBackup').textContent = stamp;
    $('#lastBackupCaption').textContent = 'Demo snapshot · this tab only';
    $('#restoreSnapshotCount').textContent = formatCount(demoSnapshot.length);
    $('#restoreStatus').textContent = 'This snapshot is only in this tab’s memory and will be cleared when the browser closes.';
    status.textContent = `${formatCount(demoSnapshot.length)}  contacts’ demo snapshot is ready. Nothing was saved to the cloud.`;
    button.disabled = false;
    $('#backupPageAction').disabled = false;
    setTimeout(() => { progress.hidden = true; fill.style.width = '0%'; progress.setAttribute('aria-valuenow', '0'); }, 1000);
    updateCounts();
  }
  function downloadVcf() {
    if (!contacts.length) { showToast('There are no contacts to download.'); return; }
    const content = PhoneLayaContacts.toVCF(contacts);
    const blob = new Blob([content], { type:'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = element('a');
    link.href = url;
    link.download = 'phonelaya-demo-contacts.vcf';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('The VCF file was downloaded to your device.');
  }

  document.querySelectorAll('[data-view-target]').forEach(button => button.addEventListener('click', () => goToView(button.dataset.viewTarget)));
  document.querySelectorAll('[data-open-view]').forEach(button => button.addEventListener('click', () => goToView(button.dataset.openView)));
  $('#menuButton').addEventListener('click', () => {
    const open = $('#sidebar').classList.toggle('open');
    $('#menuButton').setAttribute('aria-expanded', String(open));
  });
  $('#overviewSearch').addEventListener('input', event => renderContacts(event.currentTarget.value));
  $('#contactSearch').addEventListener('input', event => renderContacts(event.currentTarget.value));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      event.preventDefault();
      const view = document.querySelector('[data-view="contacts"]');
      if (view.hidden) goToView('contacts');
      $('#contactSearch').focus();
    }
    if (event.key === 'Escape') $('#sidebar').classList.remove('open');
  });
  $('#contactFile').addEventListener('change', event => importContactFile(event.currentTarget.files[0]));
  $('#backupAction').addEventListener('click', event => simulateBackup(event.currentTarget));
  $('#backupPageAction').addEventListener('click', event => simulateBackup(event.currentTarget));
  $('#restoreAction').addEventListener('click', () => {
    contacts = demoSnapshot.map(record => ({ ...record }));
    updateCounts(); renderContacts('');
    $('#restoreStatus').textContent = `${formatCount(contacts.length)} sample contacts  sample contacts restored in this tab. This is not a device or cloud restore.`;
    showToast('Sample list restored from the demo snapshot.');
  });
  $('#downloadVcf').addEventListener('click', downloadVcf);
  $('#accountForm').addEventListener('submit', event => {
    event.preventDefault(); event.currentTarget.reset();
    $('#accountStatus').textContent = 'Demo only: no account was created and no details were sent.';
    showToast('Sign-in service is not connected yet.');
  });
  $('#registerAction').addEventListener('click', () => {
    $('#accountStatus').textContent = 'Registration demo only. No account or profile data was saved.';
    showToast('A real registration service is not connected.');
  });

  const installButtons = [$('#installButton'), $('#installAction')].filter(Boolean);
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; installButtons.forEach(button => { button.textContent = 'Install App'; }); installStatus.textContent = 'phoneलय is ready to install.'; });
  async function requestInstall() {
    if (!installPrompt) {
      const apple = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      installStatus.textContent = apple ? 'Safari on iPhone or iPad: tap Share, choose “Add to Home Screen,” then tap Add.' : 'Chrome or Edge: select Install from the address bar or browser menu. Other browsers: choose “Add to Home Screen.”';
      return;
    }
    const prompt = installPrompt; installPrompt = null;
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      installStatus.textContent = result.outcome === 'accepted' ? 'Install request accepted. Waiting for browser confirmation before enabling Open App.' : 'Installation was cancelled. Select Install App to try again.';
    } catch (_) { installStatus.textContent = 'Could not start installation. Follow the browser instructions above.'; }
  }
  installButtons.forEach(button => button.addEventListener('click', () => {
    if (button === $('#installButton') && !standalone) installGate.hidden = false;
    requestInstall();
  }));
  window.addEventListener('appinstalled', markInstalled);
  if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(apps => {
    if (apps.some(app => app.id === appId || app.url === new URL('/phonelaya/manifest.webmanifest', location.origin).href)) markInstalled();
  }).catch(() => {});

  const initialView = location.hash.slice(1);
  if (['contacts', 'backup', 'restore', 'account'].includes(initialView)) goToView(initialView);
  updateCounts();
  renderContacts('');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/phonelaya/sw.js', { scope:'/phonelaya/' }).catch(error => console.warn('phoneलय service worker registration failed:', error?.message || error));
}());
