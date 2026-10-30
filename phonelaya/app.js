(function () {
  'use strict';

  const samples = [
    { id:'sample-1', name:'माया कार्की (नमुना)', phone:'+977 980 000 0001', email:'maya@example.test', source:'नमुना', tone:1 },
    { id:'sample-2', name:'राजु खड्का (नमुना)', phone:'+977 980 000 0002', email:'raju@example.test', source:'नमुना', tone:2 },
    { id:'sample-3', name:'मिना शाही (नमुना)', phone:'+977 981 000 0003', email:'mina@example.test', source:'नमुना', tone:3 },
    { id:'sample-4', name:'सीता बुढा (नमुना)', phone:'+977 984 000 0004', email:'sita@example.test', source:'नमुना', tone:4 },
    { id:'sample-5', name:'नविन बिष्ट (नमुना)', phone:'+977 985 000 0005', email:'nabin@example.test', source:'नमुना', tone:5 },
    { id:'sample-6', name:'माया के. (डुप्लिकेट नमुना)', phone:'9800000001', email:'maya.k@example.test', source:'नमुना', tone:1 }
  ];
  let contacts = samples.map(record => ({ ...record }));
  let demoSnapshot = samples.map(record => ({ ...record }));
  let backupHistory = [];
  let toastTimer;
  let installPrompt = null;

  const $ = selector => document.querySelector(selector);
  const digits = value => String(value || '').replace(/\D/g, '').replace(/^977(?=\d{10}$)/, '');
  const formatCount = value => Number(value).toLocaleString('ne-NP');
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
    const title = ({ overview:'तपाईंका सम्पर्कहरू', contacts:'सम्पर्क सूची', backup:'सम्पर्कको demo backup', restore:'सम्पर्क पुनः प्राप्ति', account:'खाता र गोपनीयता' })[view] || 'phoneलय';
    $('#pageTitle').textContent = title;
    $('#pageDescription').textContent = ({ overview:'फोन परिवर्तन भए पनि चिनजान हराउन नदिनुहोस्।', contacts:'यस browser tab मा रहेको sample र आयातित सूची।', backup:'सम्पर्क फाइल पढेर local demo snapshot बनाउनुहोस्।', restore:'यस tab भित्रको उदाहरण snapshot बाट सम्पर्क फर्काउनुहोस्।', account:'Login, cloud backup र encryption उत्पादन सेवामा जोडिएका छैनन्।' })[view] || '';
    $('#sidebar').classList.remove('open');
    $('#menuButton').setAttribute('aria-expanded', 'false');
    window.location.hash = view === 'overview' ? '' : view;
  }
  function makeContactRow(record, compact) {
    const duplicate = PhoneLayaContacts.findDuplicates([record, ...contacts.filter(item => item.id !== record.id)]).some(group => group.some(item => item.id === record.id));
    if (compact) {
      const button = element('button', 'contact-row');
      button.type = 'button';
      button.setAttribute('aria-label', `${record.name}, ${record.phone}, विवरण हेर्नुहोस्`);
      const main = element('span', 'contact-main');
      const avatar = element('span', `contact-avatar tone-${record.tone || ((record.id.length % 5) + 1)}`, initials(record.name));
      avatar.setAttribute('aria-hidden', 'true');
      const copy = element('span', 'contact-copy');
      copy.append(element('span', 'contact-name', record.name), element('span', 'contact-subline', record.phone || record.email || 'फोन/इमेल उपलब्ध छैन'));
      main.append(avatar, copy);
      button.append(main, element('span', `contact-tag${duplicate ? ' duplicate' : ''}`, duplicate ? 'दोहोरिएको' : record.source || 'नमुना'));
      button.addEventListener('click', () => showContact(record));
      return button;
    }
    const row = element('div', 'all-contact-row');
    const nameButton = element('button', 'row-name', record.name);
    nameButton.type = 'button';
    nameButton.addEventListener('click', () => showContact(record));
    const phone = element('span', `row-phone${duplicate ? ' row-duplicate' : ''}`, record.phone || '—');
    const email = element('span', 'row-email', record.email || '—');
    const source = element('span', 'row-source source-label', duplicate ? 'दोहोरिएको' : record.source || 'नमुना');
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
      ? `${formatCount(groups.length)} समूहमा समान फोन नम्बर भेटियो।`
      : 'दोहोरिएको फोन नम्बर भेटिएन।';
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
    if (!groups.length) list.append(element('p', 'fine-print', 'हाल देखिएका sample र आयातित contact नम्बरहरू जाँचिएको छ।'));
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
    $('#detailPhone').textContent = record.phone || 'उपलब्ध छैन';
    $('#detailEmail').textContent = record.email || 'उपलब्ध छैन';
    $('#detailSource').textContent = record.source || 'नमुना सूची';
    $('#contactDialog').showModal();
  }
  async function importContactFile(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      $('#importStatus').textContent = 'फाइल 2 MB भन्दा ठूलो छ। सानो CSV वा VCF फाइल छान्नुहोस्।';
      return;
    }
    const ext = file.name.toLocaleLowerCase().split('.').pop();
    if (!['csv', 'vcf'].includes(ext)) {
      $('#importStatus').textContent = 'CSV वा VCF format मात्र स्वीकार हुन्छ।';
      return;
    }
    try {
      const text = await file.text();
      const parsed = ext === 'vcf' ? PhoneLayaContacts.parseVCF(text) : PhoneLayaContacts.parseCSV(text);
      if (!parsed.length) {
        $('#importStatus').textContent = 'सम्पर्क भेटिएन। नाम र फोन भएको CSV वा VCF छान्नुहोस्।';
        return;
      }
      const unique = parsed.map((record, index) => ({ ...record, id:`import-${Date.now()}-${index}`, source:'आयात', tone:(index % 5) + 1 }));
      contacts = contacts.concat(unique);
      $('#importStatus').textContent = `${formatCount(unique.length)} सम्पर्क यस tab को memory मा आयात भए। केही पनि server मा पठाइएको छैन।`;
      $('#contactFile').value = '';
      updateCounts(); renderContacts($('#contactSearch').value);
      showToast(`${formatCount(unique.length)} सम्पर्क यो session मा थपिए।`);
    } catch (_) {
      $('#importStatus').textContent = 'फाइल पढ्न सकिएन। CSV वा VCF encoding जाँचेर फेरि प्रयास गर्नुहोस्।';
    }
  }
  async function simulateBackup(button) {
    if (!contacts.length) { showToast('ब्याकअपका लागि सूचीमा सम्पर्क छैन।'); return; }
    if (button.disabled) return;
    const progress = $('#backupProgress');
    const fill = progress.querySelector('span');
    const status = $('#backupStatus');
    progress.hidden = false;
    button.disabled = true;
    $('#backupPageAction').disabled = true;
    status.textContent = 'Demo snapshot यस tab को memory मा तयार हुँदैछ… कुनै upload भइरहेको छैन।';
    for (const value of [18, 42, 68, 100]) {
      await new Promise(resolve => setTimeout(resolve, 90));
      progress.setAttribute('aria-valuenow', String(value));
      fill.style.width = `${value}%`;
    }
    demoSnapshot = contacts.map(record => ({ ...record }));
    const now = new Date();
    backupHistory.unshift({ at:now, count:contacts.length });
    const stamp = new Intl.DateTimeFormat('ne-NP', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }).format(now);
    $('#lastBackup').textContent = stamp;
    $('#lastBackupCaption').textContent = 'Demo snapshot · यो tab मा मात्र';
    $('#restoreSnapshotCount').textContent = formatCount(demoSnapshot.length);
    $('#restoreStatus').textContent = 'यो snapshot अहिलेको tab memory मा मात्र छ; browser बन्द गर्दा मेटिन्छ।';
    status.textContent = `${formatCount(demoSnapshot.length)} सम्पर्कको demo snapshot तयार भयो। Cloud मा केही पनि सुरक्षित गरिएको छैन।`;
    button.disabled = false;
    $('#backupPageAction').disabled = false;
    setTimeout(() => { progress.hidden = true; fill.style.width = '0%'; progress.setAttribute('aria-valuenow', '0'); }, 1000);
    updateCounts();
  }
  function downloadVcf() {
    if (!contacts.length) { showToast('डाउनलोड गर्न सम्पर्क छैन।'); return; }
    const content = PhoneLayaContacts.toVCF(contacts);
    const blob = new Blob([content], { type:'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = element('a');
    link.href = url;
    link.download = 'phonelaya-demo-contacts.vcf';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    showToast('VCF फाइल तपाईंको उपकरणमा डाउनलोड भयो।');
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
    $('#restoreStatus').textContent = `${formatCount(contacts.length)} sample contacts यो tab मा फर्काइए। यो device/cloud restore होइन।`;
    showToast('Demo snapshot बाट सूची फर्काइयो।');
  });
  $('#downloadVcf').addEventListener('click', downloadVcf);
  $('#accountForm').addEventListener('submit', event => {
    event.preventDefault(); event.currentTarget.reset();
    $('#accountStatus').textContent = 'Demo मात्र: कुनै account बनेन र विवरण कतै पठाइएन।';
    showToast('Sign in सेवा अझै जोडिएको छैन।');
  });
  $('#registerAction').addEventListener('click', () => {
    $('#accountStatus').textContent = 'Registration demo मात्र हो। कुनै account वा profile data सुरक्षित गरिएको छैन।';
    showToast('वास्तविक registration service जडान भएको छैन।');
  });

  const installButtons = [$('#installButton'), $('#installAction')].filter(Boolean);
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; installButtons.forEach(button => { button.textContent = 'Install'; }); });
  async function requestInstall() {
    if (!installPrompt) {
      const apple = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      showToast(apple ? 'Safari मा Share → Add to Home Screen छान्नुहोस्।' : 'Browser menu बाट Install phoneलय वा Add to Home screen छान्नुहोस्।');
      return;
    }
    const prompt = installPrompt; installPrompt = null;
    try {
      await prompt.prompt();
      const result = await prompt.userChoice;
      showToast(result.outcome === 'accepted' ? 'Install अनुरोध स्वीकार भयो।' : 'Install अनुरोध रद्द भयो।');
    } catch (_) { showToast('Browser menu बाट phoneलय स्थापना गर्नुहोस्।'); }
  }
  installButtons.forEach(button => button.addEventListener('click', requestInstall));
  window.addEventListener('appinstalled', () => showToast('phoneलय यस उपकरणमा स्थापना भयो।'));

  const initialView = location.hash.slice(1);
  if (['contacts', 'backup', 'restore', 'account'].includes(initialView)) goToView(initialView);
  updateCounts();
  renderContacts('');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/phonelaya/sw.js', { scope:'/phonelaya/' }).catch(error => console.warn('phoneलय service worker registration failed:', error?.message || error));
}());
