---
name: deudalaya-autopilot
description: Complete Deudalaya development tasks from repository inspection through tested, reviewed GitHub push. Use when asked to autonomously implement and deliver Deudalaya code changes.
metadata:
  short-description: Implement, verify, commit, and push Deudalaya work
---

# Deudalaya Autopilot

Carry an authorized Deudalaya development task through implementation, verification, review, commit, and push. Work within the requested scope, preserve existing user changes, and report verified outcomes and blockers.

## Start with project context

1. Read the root `AGENTS.md` and every nested `AGENTS.md` that governs the target files. Check the current Git status before edits; preserve existing changes and avoid staging unrelated files.
2. Read `.agents/skills/deudalaya-core/SKILL.md` and `.agents/skills/pwa-protection/SKILL.md`. Read the master knowledge file and any relevant domain skills, project code, documentation, tests, and current backend configuration before deciding how to implement.
3. Inspect the full caller and data flow for the requested behavior. Treat notes, migrations, browser checks, and remembered state as clues; verify important claims in current code or authorized service state.
4. Summarize the task internally as concrete outcomes and constraints. Make routine implementation choices independently. Ask only when an unresolved choice materially affects user data, security, product behavior, architecture, cost, or an irreversible operation. Continue independent work while awaiting an answer.

## Implement and verify

- Make the smallest coherent change that satisfies the request and fits the current architecture. Keep unrelated applications and files untouched. Preserve data, existing behavior, and all pre-existing work.
- Install dependencies only when needed. Use the project’s existing package manager and lockfile; do not commit secrets, local credentials, generated caches, or unrelated dependency changes.
- For database, Storage, Auth, or other external changes, inspect the live target and effective permissions first. Respect RLS, policies, limits, and existing integrations. Never perform destructive data or Storage operations without explicit authorization. Never put credentials in source code, logs, reports, commits, or chat.
- Run relevant existing tests, syntax checks, and validation. For Deudalaya code changes, run `node scripts/check-pwa-protection.js` and `git diff --check`. Add or run other checks that cover the changed behavior. Do not bypass, weaken, or remove a failing check; diagnose and fix the cause or report the blocker.
- Review the complete diff, including untracked files and staged content. Check for secrets, unrelated changes, accidental generated files, data loss, and protected-file changes. Do not claim a test, permission, or live behavior was verified unless it was.

## Protected installation system

The Deudalaya PWA installation gate and files listed in `scripts/check-pwa-protection.js` are protected. Never remove, bypass, restyle, weaken, replace, or refactor installation UI or logic, prompt handling, standalone checks, manifest, service worker, protected assets, checker, CI workflow, or CODEOWNERS rules. General development authorization does not authorize a protected change. If the requested implementation would touch one, explain the exact reason and affected files, then wait for the project owner’s explicit approval of that scope. Run the protection check after applicable changes and before staging.

## Commit and push

- For a completed, tested Deudalaya website task, follow the root `AGENTS.md`: commit only task-specific files with a meaningful message and push to the configured repository’s `main` branch. Stage paths explicitly; never use a blanket stage that can capture unrelated work.
- Never force-push, discard changes, rewrite remote history, bypass permissions or security checks, or push broken or untested work. Do not deploy. A GitHub push is not a deployment authorization.
- If a push is rejected, inspect the exact status and remote cause. Use only safe, non-destructive recovery that preserves both local and remote history. Resolve ordinary merge conflicts when the intended result is clear; stop and report when recovery requires a risky or unauthorized decision.
- For skill-only, documentation-only, or other non-website tasks, follow the user’s requested delivery scope and applicable repository instructions; do not assume the website auto-push rule applies when it does not.
- After a successful push, verify the resulting commit on the configured GitHub remote when available. Report the commit hash, branch, push status, validation performed, and any deployment status visible without triggering deployment.

## Finish

Report what changed, why, the checks and their results, the commit and push status when applicable, and any unresolved blocker or required user action. If a test, credential, permission, GitHub capability, or external service is unavailable, state the precise limitation and a practical next step; never imply the whole task succeeded when only part did.
