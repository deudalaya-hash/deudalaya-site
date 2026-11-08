'use strict';

const { execFileSync } = require('node:child_process');
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
    const changed = changedPaths(root, options);
    const protectedChanges = changed.filter(isProtectedPath).sort();
    if (!protectedChanges.length) {
      process.stdout.write('PWA protection check passed: no protected files changed.\n');
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

module.exports = { PROTECTED_FILES, changedPaths, isProtectedPath, normalizePath, parseArgs, run };
