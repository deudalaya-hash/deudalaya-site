---
name: deployment-manager
description: Plan and manage Deudalaya Git/GitHub releases and GitHub Pages deployments with explicit approval, safe change isolation, testing, and production verification.
metadata:
  short-description: Safe Deudalaya releases and deployments
---

# Deployment Manager for Deudalaya

Guide safe version control, release preparation, GitHub Pages deployment, and production verification for `C:\deudalaya`. This skill does not authorize a push, merge, deploy, release upload, or destructive Git operation.

## Current project facts — verify on every release

The inspected local repository is `C:\deudalaya`, current branch `main`, with origin `https://github.com/deudalaya-hash/deudalaya-site.git`. The root `CNAME` contains `deudalaya.com`. The root site is static HTML/CSS/JavaScript with Node built-in tests under `tests/`; there is no root `package.json` or `.github` deployment workflow in the inspected baseline. GitHub Pages hosting is documented, but the actual Pages source/branch, custom-domain state, DNS/TLS health, and deployment run are not proven by local files. Recheck all of these before relying on this snapshot.

The repo has `AGENTS.md` instructions that request automatic commit/push for website tasks. The user's explicit requirement for this skill is that pushing, merging, and deploying require permission. Honor the user's explicit permission boundary; do not push, merge, or deploy automatically. Explain the instruction conflict if it affects a task. This skill's presence is not release authorization.

## Release workflow

1. **Inspect repository state first.** Run `git status --short --branch`, `git branch --show-current`, `git remote -v`, and inspect the recent log as needed. Check for untracked files and pre-existing changes. Do not reveal credential-bearing remote URLs or tokens.
2. **Define scope.** Identify the requested change, target branch, environment, expected release, and whether the user requested a local commit, push, merge, or deployment. Do not infer permission for one action from permission for another.
3. **Review change set.** Inspect `git diff`, `git diff --check`, untracked files, and staged diff separately. Verify only task-related files are included. Never use `git add .` when unrelated or pre-existing changes are present; stage exact paths and inspect `git diff --cached` before committing.
4. **Test and build from actual configuration.** Inspect project scripts, tests, build config, Pages workflow/settings, and documented instructions. Run relevant existing checks. This repo is static in the inspected baseline, so do not invent an npm build command. Report when no build is configured.
5. **Prepare release summary.** State exactly what would be included, target branch/environment, test/build results, deployment mechanism, rollback plan, and risks. Obtain explicit permission before pushing, merging, or deploying. If approval is absent, stop after preparation.
6. **Execute only the approved step.** Confirm the branch/remote/target immediately before the action. Never force-push. Never merge or deploy unless explicitly authorized. Stop on unexpected remote divergence, changed status, authentication errors, or target mismatch; report the exact condition rather than guessing a retry.
7. **Verify after an authorized release.** Confirm the intended commit exists on the intended remote/branch, inspect GitHub Actions/Pages status if available, and verify the production URL with a read-only request/browser. Check expected content, key assets, manifest/service worker, and PWA/video behavior relevant to the change. Report what was and was not verified.

## Beginner-friendly Git commands

Run commands from the repository root. These examples inspect local state and do not change the remote:

```powershell
Set-Location C:\deudalaya
git status --short --branch
git branch --show-current
git remote -v
git log -5 --oneline --decorate
git diff --check
git diff --stat
git diff -- path\to\changed-file
```

Before a local commit, stage only approved task files and inspect the staged result:

```powershell
git add -- path\to\file1 path\to\file2
git diff --cached --check
git diff --cached
```

Do not run `git add .` if the tree contains unrelated changes. A local commit, pushing it, opening a PR, merging, and deploying are separate actions with separate consequences. Obtain the level of permission required for the requested external action.

For GitHub inspection, first check whether `gh` is installed and authenticated, then use read-only queries. Avoid commands that edit labels, release metadata, repository settings, workflow secrets, Pages configuration, or environment variables unless the user explicitly asks and approves.

## Git safety

- Preserve all user changes, including untracked files. Never reset, clean, checkout over, stash, or stage pre-existing work as a shortcut.
- Never force-push, delete branches/remotes/tags, rewrite shared history, or delete a repository without explicit permission.
- If local work cannot be isolated safely from pre-existing changes, do not commit/push it; report the blocker and leave unrelated changes untouched.
- Resolve conflicts by understanding both sides and preserving intent. Do not blindly choose ours/theirs or discard unknown files.
- Before a commit, inspect the full staged diff for scope, secrets, large binaries, generated files, and accidental asset/data changes. Never commit secrets, service-account files, signing keys, passwords, tokens, or production exports.
- Use a clear commit message when a commit is requested. Do not claim a commit or push occurred unless it did.

## GitHub Pages and deployment inspection

Before release, inspect the actual hosting mechanism rather than assuming it:

- Look for GitHub Actions workflows, branch-based Pages source, build scripts, static-site configuration, `CNAME`, `.nojekyll`, ignore rules, and output-directory settings.
- Confirm repository and branch from the local remote and current GitHub configuration. A local `main` branch is not proof that Pages deploys from `main`.
- Check custom-domain setup and expected `CNAME` behavior. Do not change DNS, TLS, domain settings, workflow permissions, secrets, or Pages source without explicit approval.
- Check relative paths and case sensitivity for static assets. Verify that generated/ignored files needed by Pages are tracked or produced by the configured build.
- Preserve Deudalaya's PWA identity and root service-worker behavior. A release that updates the site can change cache behavior; inspect `manifest.webmanifest`, `sw.js`, install gate, and relevant tests when affected.
- Treat an Actions green check as evidence for that workflow only. Verify Pages deployment and production behavior independently when authorized.

## Testing and release checklist

- Run relevant existing tests; record exact commands and failures. In the inspected repo, tests use Node's built-in test runner; inspect the target tests instead of assuming `npm test` or another build exists.
- Validate local HTML/JS/assets as appropriate and inspect console/network behavior in a browser when available.
- For PWA/feed changes, test install gate, manifest, service-worker scope/update/offline shell, and video playback as relevant. Do not clear user caches as test cleanup.
- Check mobile and desktop layouts for user-visible changes.
- Review broken links, asset paths/case, custom-domain routing, and service-worker cache asset list when applicable.
- Confirm no secrets, private data, unintended videos, test exports, or unrelated sibling-app files enter the release.
- Record environment: local, CI, staging, or production. A local test cannot verify GitHub Pages production.

## Rollback guidance

- Prefer a reviewed revert commit that restores a known-good change while preserving later history. Do not reset a shared branch or force-push as a rollback method.
- Before rollback, identify the exact bad commit, any later dependent commits, current production state, user data changes, service-worker/cache version effects, and whether rollback itself needs a migration or coordinated backend step.
- For static GitHub Pages, reverting a site change usually requires an authorized commit and deployment. Do not trigger that release without permission. Verify recovery at the production URL after it is authorized.
- A code rollback does not restore deleted database/storage data or reverse external configuration changes. Plan those separately; never restore or delete production data without explicit permission and verified backups.
- Preserve evidence from failed deployments and do not repeatedly rerun a failing workflow without understanding the cause.

## Troubleshooting

- **Push rejected / non-fast-forward:** stop. Inspect local and remote commits read-only, determine whether unrelated work is present, and explain safe integration options. Never force-push. Retry only after the user authorizes the specific safe action.
- **Authentication or permission denied:** report the exact command result without exposing credentials. Check remote identity and access with available read-only tools; do not copy tokens into command text or request broad permissions automatically.
- **Pages does not update:** inspect the actual Pages source, latest deployment job/status, commit SHA, build output, branch, artifact path, and custom-domain configuration. Do not assume a workflow exists.
- **404 or missing assets:** verify published output and exact path/case, root versus relative URLs, ignore rules, and whether Pages deploys the expected directory.
- **Old content persists:** check deployed commit and service-worker cache lifecycle/version. Test in an isolated profile; do not tell users to clear caches until the cause is understood.
- **Build/test failure:** reproduce locally with the repository's actual runtime/command, separate code failures from missing tools/config, and report all failed checks. Do not suppress errors to obtain a green release.
- **Domain/TLS problem:** verify `CNAME`, Pages settings, DNS and certificate status using authorized read-only sources. Do not edit DNS or domain ownership settings without explicit approval.

## Completion report

For release preparation or an authorized release, state:

- Files/commit included and target repository, branch, and environment.
- Tests/build checks run and exact results.
- Whether push, merge, deployment, and production verification each occurred.
- Commit ID and deployment status when applicable.
- Remaining warnings, blockers, or rollback considerations.

Never imply an external action succeeded when it was only prepared. Never push, merge, or deploy without explicit permission.
