const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const animationCss = fs.readFileSync(path.join(root, 'install-button-motion.css'), 'utf8');

test('the install animation stylesheet is added without changing the existing install action markup', () => {
  assert.match(html, /<link rel="stylesheet" href="ecosystem-gateway\.css">\s*<link rel="stylesheet" href="install-button-motion\.css">/);
  assert.match(html, /<button class="deudalaya-install-action" id="deudalayaInstallAction" type="button" aria-label="Install App">Install App<\/button>/);
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)\s*\{[^}]*animation:\s*deudalaya-install-pulse/);
});

test('the install-button glow is non-interactive and respects reduced-motion preferences', () => {
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)::after\s*\{[^}]*pointer-events:\s*none/);
  assert.match(animationCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none\s*!important/);
  assert.match(animationCss, /@keyframes\s+deudalaya-install-pulse[\s\S]*?translate:\s*0 -2px/);
  assert.match(animationCss, /@keyframes\s+deudalaya-install-icon-glow/);
});
