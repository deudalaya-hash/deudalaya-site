# Deudalaya Website Instructions

## Required completion workflow for website tasks

After completing each user-requested website task:

1. Review every file changed for that task and inspect the complete diff for accidental or unrelated changes.
2. Run relevant tests and checks, and report failures, warnings, and build errors accurately. Test results do not block committing or pushing a completed task.
3. Automatically commit the task-specific changes and push them to the GitHub `main` branch without requesting confirmation.
4. Never force-push. If GitHub rejects a push because of conflicts or authentication errors, report the exact reason and retry only after confirming the retry is safe.
5. Preserve all changes that existed before the task. Never reset, overwrite, discard, or stage pre-existing user changes. If task changes cannot be isolated safely from pre-existing changes, do not include those unrelated changes; report the blocker.
6. Never delete, replace, or modify unrelated features or files. Never include unrelated files or changes in a task commit.
7. Never commit passwords, API secrets, private credentials, or other sensitive data.
8. After every push, verify the pushed commit is present on GitHub and report its commit ID, push result, and GitHub Pages deployment status. If deployment status cannot be determined, say so clearly.

## Permanent PWA installation protection

The Deudalaya PWA installation gate is a protected core feature. Before any Deudalaya task, inspect the applicable PWA protection skill and the protected-file list in `scripts/check-pwa-protection.js`.

- Do not remove, weaken, replace, or refactor the install gate, install action, prompt handling, standalone checks, manifest, service worker, or installation assets without explicit project-owner authorization for the exact change.
- Before an authorized protected change, explain the reason and affected files, then wait for the owner's explicit approval.
- Run `node scripts/check-pwa-protection.js` before staging/committing unrelated work. It reports protected-file changes and never restores or overwrites them.
- If an owner-authorized change is detected, record the authorization in the task and use `--allow-authorized` only for that local check. GitHub CI does not use this override; protected-file diffs require owner review or an administrator-approved bypass.
- Do not change the checker, protection skill, workflow, or CODEOWNERS rules without explicit project-owner authorization. Do not weaken or remove the CI check to make a change pass.
- Keep the `pwa-protection` check required in GitHub branch protection for `main`; a workflow file alone cannot enforce branch policy.
