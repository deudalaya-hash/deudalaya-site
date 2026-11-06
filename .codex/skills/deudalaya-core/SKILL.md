---
name: deudalaya-core
description: Project-specific context and safe development workflow for the Deudalaya website, feed, PWA, and related apps. Use before making changes in the Deudalaya repository or when explaining its architecture.
metadata:
  short-description: Deudalaya project context and workflow
---

# Deudalaya Core

Use this skill to orient work in `C:\deudalaya` and preserve the project's actual architecture. Treat repository files and current user instructions as the source of truth; this skill is guidance, not authorization to expand scope.

## Project identity and layout

Deudalaya is the root website and video-sharing PWA for Deuda cultural media. The repository also contains sibling applications; keep work within the named app and requested files.

- `index.html`: root Deudalaya site, feed, styling, and much of its browser-side behavior.
- `social.js`: shared profile and engagement behavior used by the root feed.
- `deudalaya-audio.js` and `deudalaya-audio.css`: audio features.
- `manifest.webmanifest` and `sw.js`: root PWA identity and service worker. Preserve installation behavior and the root service-worker scope.
- `assets/`: site media, including existing video files. Treat media and user content as data; do not remove or replace it as cleanup.
- `supabase/migrations/`: proposed SQL schema and policies. A checked-in migration is not proof that it was applied to a live project.
- `tests/`: Node-based regression tests for existing site behavior.
- `chalchitralaya/`, `kakchhayalaya/`, `phonelaya/`, `sabdalaya/`, and `jack-portfolio/`: separate applications. Do not edit them for a Deudalaya task unless explicitly requested.

Read the root `AGENTS.md` and any nested instructions that apply to the target before editing. Consult `APP_ECOSYSTEM.md` and `BACKEND_SETUP.md` for documented behavior and limitations, then verify important claims in code.

For Deudalaya's user-provided mission, brand guidance, cultural-source notes, and evidence status, also read `.codex/knowledge/DEUDALAYA_MASTER_KNOWLEDGE.md`. Treat it as context, not as proof of live backend state or permission to expand a task. If its research or project notes conflict with current code/configuration, record the discrepancy and verify before acting.

## Architecture facts and uncertainty

The root site is primarily static HTML, CSS, and JavaScript, with GitHub Pages documented as its hosting target. Its code contains a Supabase client integration for authentication and shared posts. The setup documentation says the Supabase project, administrator identity, and migrations are not configured/applied or verified. Treat Supabase schemas as proposals until confirmed against the actual project.

Firebase is not part of the inspected repository baseline. Do not add Firebase or another backend beside Supabase merely because a plan mentions it. If a request requires a backend choice, data migration, schema change, or provider substitution, explain the existing integration and impact, then get the user's decision before making that architectural change. Do not invent credentials, tables, columns, policies, endpoints, or live backend state.

The public feed includes local assets and a Supabase `feed_posts` integration. Preserve both unless the user explicitly authorizes a scoped change. A browser-side admin check is not an authorization boundary; backend RLS and Storage policies must enforce privileged operations.

## Working method

1. Inspect repository status and the complete relevant route, callers, data flow, instructions, and existing tests before changing code.
2. State the requested scope, what exists, what is missing, and material backend or architecture conflicts. Propose the smallest compatible change. Ask for a decision when the missing choice materially changes the architecture or data handling.
3. Modify only files needed for the approved scope. Preserve existing behavior, user data, PWA installation, branding, and unrelated apps. Do not make migrations or production data changes without explicit authorization.
4. Run relevant existing checks and tests when requested or needed to verify the change. Report exact failures and checks that could not run; do not imply that live auth, storage, rules, or mobile behavior passed without a configured environment.
5. Review the complete diff and working tree for scope, accidental changes, and secrets. Report files changed, behavior, checks, and remaining backend or deployment prerequisites.

## Security and release boundaries

- Never put service-role keys, private credentials, or privileged provider secrets in browser code or committed files. Public client keys are not a replacement for server-side authorization.
- Assign admin roles only through trusted backend tooling. Enforce upload, moderation, and deletion permissions in the backend, not by hiding controls in the page.
- Do not make private media public to simplify playback. Preserve the established bucket and access model unless an approved backend change defines a safe alternative.
- Do not push commits or deploy without the user's explicit permission. The current root `AGENTS.md` describes automatic commit and push for website tasks; if that conflicts with this user instruction, honor the user's explicit permission boundary and explain the conflict rather than pushing automatically.
- Never force-push. Never overwrite or discard pre-existing user changes.
