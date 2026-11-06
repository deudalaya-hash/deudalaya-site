---
name: deudalaya-core
description: Project-specific context and safe development workflow for the Deudalaya website, feed, PWA, and related apps. Use before making changes in the Deudalaya repository or when explaining its architecture.
metadata:
  short-description: Deudalaya project context and workflow
---

# Deudalaya Core

Use this skill to orient work in `C:\deudalaya` and preserve the project's actual architecture. Before significant company-wide, Layapur, or Deudalaya work, read `.codex/knowledge/DEUDALAYA_MASTER_KNOWLEDGE.md`, then check the relevant current code, documentation, and user instructions. Treat repository files and current user instructions as the source of truth; this skill is guidance, not authorization to expand scope.

## Project identity and layout

The user-defined company and product hierarchy is:

- **Deudalaya Pvt. Ltd.** — the company identified by the owner as the operator; do not infer legal registration or subsidiaries.
- **लयपुर — Layapur** — the company's core product and brand, identified as **City of Spaces**.
- **देउडालय — Deudalaya** — one cultural and community space within Layapur, with Phase 1 as the physical community and Phase 2 as its digital expansion.

Do not treat the company, Layapur ecosystem, and Deudalaya space as interchangeable. The community is Deudalaya's identity; the website and other technology extend it. The root website is the current Deudalaya app implementation, not the whole company or Layapur ecosystem. The repository also contains sibling applications; keep work within the named app and requested files.

- `index.html`: root Deudalaya site, feed, styling, and much of its browser-side behavior.
- `index2.html` and `layapur.webmanifest`: Layapur identity/concept and install prototype; their presence does not prove that all listed spaces are launched.
- `social.js`: shared profile and engagement behavior used by the root feed.
- `deudalaya-audio.js` and `deudalaya-audio.css`: audio features.
- `manifest.webmanifest` and `sw.js`: root PWA identity and service worker. Preserve installation behavior and the root service-worker scope.
- `assets/`: site media, including existing video files. Treat media and user content as data; do not remove or replace it as cleanup.
- `supabase/migrations/`: legacy/proposed SQL schema and policies. A checked-in migration is not proof that it was applied to a live project or is the target architecture.
- `tests/`: Node-based regression tests for existing site behavior.
- `chalchitralaya/`, `kakchhayalaya/`, `phonelaya/`, `sabdalaya/`, and `jack-portfolio/`: separate applications. Do not edit them for a Deudalaya task unless explicitly requested.

Read the root `AGENTS.md` and any nested instructions that apply to the target before editing. Consult `APP_ECOSYSTEM.md` and `BACKEND_SETUP.md` for documented behavior and limitations, then verify important claims in code.

For Deudalaya's user-provided mission, brand guidance, cultural-source notes, and evidence status, also read `.codex/knowledge/DEUDALAYA_MASTER_KNOWLEDGE.md`. Treat it as context, not as proof of live backend state or permission to expand a task. If its research or project notes conflict with current code/configuration, record the discrepancy and verify before acting.

## Architecture facts and uncertainty

The root site is primarily static HTML, CSS, and JavaScript, with GitHub Pages documented as its hosting target. The owner has selected Firebase as the intended backend. No Firebase SDK/configuration, project, rules, or functions were found in the inspected repository; inspect actual files and authorized project state before claiming it is configured. The existing root code does contain Supabase auth, `feed_posts`, and Storage calls, and proposed SQL migrations; treat these as legacy integration, not the target. Their live project, data, and policies remain unverified.

Firebase is the user-selected target, but that selection does not mean it is configured or authorize implementation, deployment, or a production migration. Inspect Firebase source/configuration first. Map the legacy Supabase integration and explain migration impacts; never delete its code or change production data without explicit permission. Do not invent credentials, project IDs, collections, fields, rules, endpoints, or live backend state.

The public feed includes local assets and legacy Supabase `feed_posts`/Storage calls. Preserve them unless an explicitly approved migration scope says otherwise. A browser-side admin check is not an authorization boundary; future Firebase Rules and trusted server functions must enforce privileged operations, and no deployed Firebase protections are currently verified.

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
