(function (root) {
  'use strict';

  function clean(value) { return String(value || '').replace(/\u0000/g, '').trim(); }
  function unescapeVCard(value) {
    return clean(value).replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
  }
  function contact(name, phone, email, index) {
    const normalized = { name: clean(name), phone: clean(phone), email: clean(email) };
    if (!normalized.name && !normalized.phone && !normalized.email) return null;
    if (!normalized.name) normalized.name = normalized.phone || normalized.email || 'Unnamed contact';
    normalized.id = `contact-${index}`;
    return normalized;
  }
  function parseCSV(source) {
    const input = String(source || '').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], cell = '', quoted = false;
    for (let i = 0; i < input.length; i += 1) {
      const char = input[i];
      if (char === '"' && quoted && input[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && input[i + 1] === '\n') i += 1;
        row.push(cell); cell = '';
        if (row.some(value => clean(value))) rows.push(row);
        row = [];
      } else cell += char;
    }
    row.push(cell);
    if (row.some(value => clean(value))) rows.push(row);
    if (!rows.length) return [];

    const key = value => clean(value).toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
    const names = new Set(['name', 'fullname', 'contactname', 'displayname', 'fn']);
    const phones = new Set(['phone', 'phonenumber', 'mobile', 'mobilenumber', 'telephone', 'tel']);
    const emails = new Set(['email', 'emailaddress', 'mail']);
    const header = rows[0].map(key);
    const hasHeader = header.some(value => names.has(value) || phones.has(value) || emails.has(value));
    const indexes = hasHeader
      ? { name: header.findIndex(value => names.has(value)), phone: header.findIndex(value => phones.has(value)), email: header.findIndex(value => emails.has(value)) }
      : { name: 0, phone: 1, email: 2 };
    const records = hasHeader ? rows.slice(1) : rows;
    return records.map((values, index) => contact(
      indexes.name >= 0 ? values[indexes.name] : '',
      indexes.phone >= 0 ? values[indexes.phone] : '',
      indexes.email >= 0 ? values[indexes.email] : '',
      index + 1
    )).filter(Boolean);
  }
  function parseVCF(source) {
    const unfolded = String(source || '').replace(/^\uFEFF/, '').replace(/\r?\n[ \t]/g, '');
    const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
    const output = [];
    cards.forEach((chunk, index) => {
      const fields = {};
      chunk.split(/\r?\n/).forEach(line => {
        const separator = line.indexOf(':');
        if (separator < 1) return;
        const property = line.slice(0, separator).split(';')[0].toUpperCase();
        if (!['FN', 'N', 'TEL', 'EMAIL'].includes(property)) return;
        (fields[property] ||= []).push(unescapeVCard(line.slice(separator + 1)));
      });
      const structuredName = (fields.N?.[0] || '').split(';');
      const name = fields.FN?.[0] || [structuredName[1], structuredName[0], structuredName[2]].filter(Boolean).join(' ');
      const record = contact(name, fields.TEL?.[0], fields.EMAIL?.[0], index + 1);
      if (record) output.push(record);
    });
    return output;
  }
  function phoneKey(phone) {
    let digits = clean(phone).replace(/\D/g, '');
    if (digits.startsWith('977') && digits.length > 10) digits = digits.slice(3);
    return digits.length >= 7 ? digits : '';
  }
  function findDuplicates(records) {
    const groups = new Map();
    (records || []).forEach((record, index) => {
      const key = phoneKey(record.phone);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });
    return Array.from(groups.values()).filter(group => group.length > 1);
  }
  function escapeVCard(value) {
    return clean(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
  function toVCF(records) {
    return (records || []).map(record => [
      'BEGIN:VCARD', 'VERSION:3.0', `N:;${escapeVCard(record.name)};;;`, `FN:${escapeVCard(record.name)}`,
      record.phone ? `TEL;TYPE=CELL:${escapeVCard(record.phone)}` : '',
      record.email ? `EMAIL;TYPE=INTERNET:${escapeVCard(record.email)}` : '', 'END:VCARD'
    ].filter(Boolean).join('\r\n')).join('\r\n') + ((records || []).length ? '\r\n' : '');
  }

  const api = { parseCSV, parseVCF, findDuplicates, toVCF };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.PhoneLayaContacts = api;
}(typeof window !== 'undefined' ? window : globalThis));
