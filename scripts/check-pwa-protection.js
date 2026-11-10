'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Repo-relative installation dependencies confirmed from the root page, manifest,
// service worker, gateway, assets, and existing regression tests.
const PROTECTED_FILES = Object.freeze([
  'index.html',
  'ecosystem-gateway.js',
  'ecosystem-gateway.css',
  'install-gate.css',
  'manifest.webmanifest',
  'sw.js',
  'assets/deudalaya-icon-180.png',
  'assets/deudalaya-icon-192.png',
  'assets/deudalaya-icon-512.png',
  'assets/deudalaya-maskable-512.png',
  'assets/deudalaya-launch-192.png',
  'assets/deudalaya-launch-512.png',
  'assets/deudalaya-install-art.jpeg',
  'assets/deudalaya-install-poster.jpeg',
  'tests/deudalaya-install-button.test.cjs',
  'tests/deudalaya-install-guidance.test.cjs',
  'tests/deudalaya-pwa-manifest.test.cjs',
  'tests/deudalaya-entry-install.test.cjs',
  'tests/deudalaya-direct-install.test.cjs',
  'tests/deudalaya-install-flow.test.cjs',
  'tests/deudalaya-independence.test.cjs',
  'tests/ecosystem-installation.test.cjs'
]);

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
}

const protectedSet = new Set(PROTECTED_FILES.map(normalizePath));

function isProtectedPath(filePath) {
  return protectedSet.has(normalizePath(filePath));
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function nulPaths(output) {
  return output.split('\0').filter(Boolean);
}

function changedPaths(root, options) {
  let changed;
  if (options.base && options.head) {
    changed = nulPaths(git(root, ['diff', '--name-only', '--no-renames', '-z', options.base, options.head, '--']));
  } else {
    const head = options.head || 'HEAD';
    changed = nulPaths(git(root, ['diff', '--name-only', '--no-renames', '-z', head, '--']));
    changed.push(...nulPaths(git(root, ['ls-files', '--others', '--exclude-standard', '-z'])));
  }
  return [...new Set(changed)];
}

function normalizeMarkup(value) {
  return value.replace(/\r\n?/g, '\n');
}

function getTagBlocksById(html, tagName, id) {
  const tokens = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  const matches = [];
  let token;
  while ((token = tokens.exec(html))) {
    if (token[0][1] === '/') continue;
    const idMatch = token[0].match(/\bid\s*=\s*(["'])(.*?)\1/i);
    if (idMatch && idMatch[2] === id) matches.push({ start: token.index, end: tokens.lastIndex });
  }
  if (matches.length !== 1) return null;
  const block = matches[0];
  if (tagName.toLowerCase() === 'link') return [html.slice(block.start, block.end)];
  const closing = new RegExp(`<\\/${tagName}\\s*>`, 'ig');
  closing.lastIndex = block.end;
  const close = closing.exec(html);
  return close ? [html.slice(block.start, closing.lastIndex)] : null;
}

function getSectionBlockById(html, id) {
  const openings = /<section\b[^>]*>/gi;
  const matches = [];
  let opening;
  while ((opening = openings.exec(html))) {
    const idMatch = opening[0].match(/\bid\s*=\s*(["'])(.*?)\1/i);
    if (idMatch && idMatch[2] === id) matches.push({ start: opening.index, end: openings.lastIndex });
  }
  if (matches.length !== 1) return null;
  const start = matches[0].start;
  const tags = /<\/?section\b[^>]*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let token;
  while ((token = tags.exec(html))) {
    if (token[0][1] === '/') depth -= 1;
    else depth += 1;
    if (depth === 0) return [html.slice(start, tags.lastIndex)];
  }
  return null;
}

function getLinksByRel(html, rel) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].filter(match => {
    const relMatch = match[0].match(/\brel\s*=\s*(["'])(.*?)\1/i);
    return relMatch && relMatch[2].split(/\s+/).includes(rel);
  });
  return links.length === 1 ? [links[0][0]] : null;
}

function extractIndexProtection(html) {
  const protectedParts = {
    pwaCapture: getTagBlocksById(html, 'script', 'deudalayaPwaCapture'),
    installLandingStyle: getTagBlocksById(html, 'style', 'deudalaya-install-landing-style'),
    installControlStyle: getTagBlocksById(html, 'style', 'deudalaya-install-control-style'),
    installLanding: getSectionBlockById(html, 'deudalayaInstallLanding'),
    manifestLink: getLinksByRel(html, 'manifest'),
    appleTouchIcon: getLinksByRel(html, 'apple-touch-icon'),
    favicon: getLinksByRel(html, 'icon'),
    serviceWorkerRegistration: (() => {
      const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)];
      const matches = scripts.filter(match => /navigator\.serviceWorker\.register\s*\(/.test(match[0]));
      return matches.length === 1 ? [matches[0][0]] : null;
    })()
  };
  if (Object.values(protectedParts).some(value => !value)) return null;
  return Object.fromEntries(Object.entries(protectedParts).map(([key, value]) => [key, normalizeMarkup(value[0])]));
}

function indexProtectionUnchanged(before, after) {
  const beforeParts = extractIndexProtection(before);
  const afterParts = extractIndexProtection(after);
  return !!beforeParts && !!afterParts && JSON.stringify(beforeParts) === JSON.stringify(afterParts);
}

function fileAtRef(root, ref, filePath) {
  try { return git(root, ['show', `${ref}:${filePath}`]); } catch (_) { return null; }
}

function protectedChangedPaths(root, options = {}) {
  const changed = changedPaths(root, options);
  const protectedChanges = changed.filter(filePath => normalizePath(filePath) !== 'index.html' && isProtectedPath(filePath));
  if (!changed.some(filePath => normalizePath(filePath) === 'index.html')) return protectedChanges.sort();

  const baselineRef = options.base || options.head || 'HEAD';
  const before = fileAtRef(root, baselineRef, 'index.html');
  let after = null;
  if (options.base && options.head) after = fileAtRef(root, options.head, 'index.html');
  else {
    try { after = fs.readFileSync(path.join(root, 'index.html'), 'utf8'); } catch (_) {}
  }
  if (!before || !after || !indexProtectionUnchanged(before, after)) protectedChanges.push('index.html');
  return [...new Set(protectedChanges)].sort();
}

function parseArgs(argv) {
  const options = { base: null, head: null, allowAuthorized: false, list: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base' || arg === '--head') {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} requires a Git ref`);
      options[arg.slice(2)] = value;
    } else if (arg === '--allow-authorized') {
      options.allowAuthorized = true;
    } else if (arg === '--list') {
      options.list = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!!options.base !== !!options.head) throw new Error('Provide both --base and --head, or neither');
  return options;
}

function run(argv = process.argv.slice(2), root = path.resolve(__dirname, '..')) {
  let options;
  try {
    options = parseArgs(argv);
    if (options.list) {
      process.stdout.write(`${PROTECTED_FILES.join('\n')}\n`);
      return 0;
    }
    const protectedChanges = protectedChangedPaths(root, options);
    if (!protectedChanges.length) {
      process.stdout.write('PWA protection check passed: protected installation content and files are unchanged.\n');
      return 0;
    }

    process.stderr.write(`Protected PWA files changed; inspect before proceeding:\n${protectedChanges.map(file => ` - ${file}`).join('\n')}\n`);
    if (options.allowAuthorized) {
      process.stderr.write('Local override used. Confirm explicit owner authorization is recorded for this exact scope.\n');
      return 0;
    }
    process.stderr.write('No files were restored or overwritten. Obtain owner approval, then use --allow-authorized only for a local authorized check.\n');
    return 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    return 2;
  }
}

if (require.main === module) process.exitCode = run();

module.exports = { PROTECTED_FILES, changedPaths, protectedChangedPaths, extractIndexProtection, indexProtectionUnchanged, isProtectedPath, normalizePath, parseArgs, run };
