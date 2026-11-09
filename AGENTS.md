# Deudalaya Website Instructions

## Permanent Git workflow for Deudalaya code changes

After completing each user-requested website task:

Whenever Codex completes a Deudalaya code change:

1. Run relevant tests and checks, then review the complete diff for errors and unrelated changes.
2. Do not commit or push broken or untested changes. Report test failures and blockers instead of shipping them.
3. Commit the completed task-specific changes with a meaningful commit message and push to the configured repository's `main` branch without asking for separate permission for ordinary commits and pushes.
4. Never force-push, overwrite remote history, bypass GitHub permissions, security checks, or approval requirements, or expose credentials/secrets. If GitHub rejects a push, report the exact reason and do not bypass it.
5. Preserve all pre-existing user changes. Never reset, overwrite, discard, or stage unrelated changes. Never include unrelated files in a task commit.
6. Production deployment is separate from pushing. Do not manually deploy unless the user explicitly authorizes it. After pushing, verify the commit on GitHub and report its hash and push status; report Pages status if available without triggering a deployment.

## Permanent PWA installation protection

The Deudalaya PWA installation gate is a protected core feature. Before any Deudalaya task, inspect the applicable PWA protection skill and the protected-file list in `scripts/check-pwa-protection.js`.

- Do not remove, weaken, replace, or refactor the install gate, install action, prompt handling, standalone checks, manifest, service worker, or installation assets without explicit project-owner authorization for the exact change.
- Before an authorized protected change, explain the reason and affected files, then wait for the owner's explicit approval.
- Run `node scripts/check-pwa-protection.js` before staging/committing unrelated work. It reports protected-file changes and never restores or overwrites them.
- If an owner-authorized change is detected, record the authorization in the task and use `--allow-authorized` only for that local check. GitHub CI does not use this override; protected-file diffs require owner review or an administrator-approved bypass.
- Do not change the checker, protection skill, workflow, or CODEOWNERS rules without explicit project-owner authorization. Do not weaken or remove the CI check to make a change pass.
- Keep the `pwa-protection` check required in GitHub branch protection for `main`; a workflow file alone cannot enforce branch policy.
