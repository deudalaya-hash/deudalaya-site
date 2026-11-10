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
  const buttonStyles = animationCss.match(/#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)\s*\{([^}]+)\}/)?.[1] || '';
  assert.match(buttonStyles, /background:\s*linear-gradient\(180deg, #ff3944/);
  assert.match(buttonStyles, /border-radius:\s*999px/);
  assert.match(buttonStyles, /box-shadow:\s*0 0 11px 3px #ffdf83/);
  assert.match(buttonStyles, /color:\s*#fff/);
  assert.match(buttonStyles, /animation:[\s\S]*deudalaya-install-bounce/);
  assert.doesNotMatch(buttonStyles, /(?:^|\n)\s*(?:position|width|height|left|top)\s*:/);
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)::before\s*\{[^}]*content:\s*"⬇";[^}]*animation:\s*deudalaya-install-download/);
  assert.match(animationCss, /@keyframes\s+deudalaya-install-glow[\s\S]*?0 0 38px 13px/);
});

test('the install-button glow is non-interactive and respects reduced-motion preferences', () => {
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)::before\s*\{[^}]*pointer-events:\s*none/);
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)::after\s*\{[^}]*pointer-events:\s*none/);
  assert.match(animationCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation:\s*none\s*!important/);
  assert.match(animationCss, /@keyframes\s+deudalaya-install-bounce[\s\S]*?translate:\s*0 -2px/);
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)::before\s*\{[^}]*z-index:\s*2/);
  assert.match(animationCss, /#deudalayaInstallAction:not\(\[hidden\]\):not\(:disabled\)::after\s*\{[^}]*z-index:\s*1/);
  assert.match(animationCss, /@keyframes\s+deudalaya-install-icon-glow/);
  assert.match(animationCss, /@keyframes\s+deudalaya-install-download/);
});
