---
name: security-auditor
description: Audit Deudalaya application security, authentication, authorization, database policies, video Storage, frontend/backend attack surfaces, and operational controls. Use for an explicitly requested security review or security-focused fix.
metadata:
  short-description: Deudalaya application security auditing
---

# Security Auditor for Deudalaya

Perform evidence-based security reviews of Deudalaya. By default, audits are read-only. Do not turn an audit request into an implementation, production test, data mutation, push, or deployment. Fix vulnerabilities only when the user explicitly authorizes remediation; follow higher-priority approval and change-scope constraints.

## Deudalaya context — verify each time

Read and follow the `deudalaya-core`, `firebase-backend`, and `video-management` skills when available, plus repository `AGENTS.md` and relevant nested instructions. Inspect current code and backend configuration; the baseline documents a static Deudalaya PWA with Supabase browser integration, while `BACKEND_SETUP.md` says no Supabase project, administrator, or migrations are verified as live. Firebase is not confirmed. Never assume a provider, deployed policy, schema, endpoint, project, bucket, or credential from plans or checked-in files alone.

The feed reads a `feed_posts` integration. Proposed SQL also describes `videos`, profiles, RLS, and Storage policies, but migrations may not be applied. The frontend checks an admin role claim for upload UI behavior; this is not proof that server policies enforce the same authorization. Identify what is implemented, what is proposed, and what is unverified in every review.

Core Deudalaya security invariants:

- Only explicitly authorized administrators can upload, publish/unpublish, edit, or delete managed videos.
- Public users can access published content only, including both metadata and the corresponding video bytes.
- Admin authorization must be enforced at the backend boundary; frontend visibility checks are not sufficient.
- Never expose service-role keys, service-account files, private keys, auth tokens, recovery codes, or user data in source, reports, logs, or screenshots.
- Never weaken Rules/RLS to make an application error disappear.
- Never perform destructive tests or delete production data. Never push or deploy without explicit permission.

## Audit workflow

1. **Set scope and safety.** Confirm the requested repository paths, branch/diff or whole-app scope, environment, and whether fixes are authorized. Read `git status`; preserve all user changes. If the requested target is production or a live account, limit activity to authorized read-only review unless the user explicitly approves a safe test plan.
2. **Map architecture.** Trace the request from UI and client code through auth, API/backend, database/Storage, and public feed. Identify trust boundaries, data flows, admin roles, third-party dependencies, and operations. Verify actual provider and environment before reviewing provider-specific security.
3. **Identify attack surfaces.** Review only relevant code and policies for authentication/session handling, authorization, data access, uploads/media parsing, input/output rendering, network/API behavior, dependencies, secrets, logging, backups, and deployment/configuration.
4. **Check enforcement, not appearance.** Compare frontend checks to backend Rules/RLS or trusted server handlers. Evaluate both allow and deny cases for anonymous users, ordinary accounts, authorized admins, and resource owners as applicable.
5. **Validate safely.** Prefer static inspection and isolated local/emulator tests with synthetic data. Never fuzz, enumerate accounts, upload malicious samples, load-test, exploit, delete, or alter live production data. Obtain explicit approval before any test that sends requests to production or touches real user data.
6. **Report evidence.** Record concrete file/line or policy evidence, reachability, attacker prerequisites, impact, confidence, and safe reproduction. Separate confirmed vulnerabilities from risks, missing configuration, and unverified deployment state.
7. **Remediate only with authorization.** Explain the minimal fix and possible compatibility/data impact first when material. Preserve existing behavior, add targeted regression/security tests, rerun relevant checks, and review the complete diff. Do not automatically push or deploy.

If scope or live-system authorization is unclear, complete independent repository review and mark live verification as not performed; ask before crossing that boundary.

## Practical audit checklist

### Authentication and sessions

- Check credential submission, sign-in/sign-out, password recovery, email/account verification, redirect allowlists, rate limits, lockout behavior, and error messages for account enumeration.
- Review session persistence, token refresh, logout invalidation, route guards, cross-tab state, and sensitive-data handling in browser storage, URLs, logs, and analytics.
- Verify admin role comes from a trusted backend-controlled claim/role source, not profile fields, email suffixes, local storage, URL flags, or client-editable metadata.
- Do not enumerate real users or attempt password guessing. Test only synthetic accounts in an approved emulator or test project.

### Authorization and data security

- For Supabase, inspect actual table grants, RLS enabled state, permissive/restrictive policy composition, `USING`/`WITH CHECK`, Storage policies, function `SECURITY DEFINER` behavior, search path, and exposed schemas. Do not assume a migration file is deployed.
- For Firebase, inspect actual Firestore/Storage Rules, trusted custom claims, query constraints, Functions authorization, emulator config, and project selection. Do not assume Rules source is deployed.
- Test least privilege for anonymous, authenticated non-admin, and admin contexts. Check read, create, update, delete, ownership, state transitions, and cross-user access.
- Ensure public access is limited to published video metadata and media bytes. Look for public buckets, overbroad policies, unguessable-but-public paths, long-lived bearer URLs, and cache behavior after unpublish.
- Inspect personal data exposure, overbroad profile selects, admin-only fields, and whether browser code tries to access auth-provider internals directly.

### Video uploads and malicious media

- Check admin enforcement at backend upload creation and metadata writes; frontend `isAdmin` checks alone are not secure.
- Compare configured byte limits and allowed MIME types across picker, client, backend rules/policies, bucket/global settings, and any processing service.
- Treat file names, extensions, MIME headers, metadata, duration, and client-supplied owner/status as untrusted. Look for actual content validation, parser/transcoder isolation, timeouts, resource limits, and safe error handling.
- Confirm a trusted validator measures actual duration and controls publication eligibility when a 15-second cap is required; client metadata is bypassable.
- Check partial upload cleanup, retry/idempotency, duplicate records, path ownership, object overwrite behavior, and safe deletion across Storage and metadata.
- Do not upload active malware or destructive payloads to production. Use harmless synthetic fixtures and isolated test infrastructure.

### Frontend, APIs, and browser boundaries

- Trace untrusted captions, titles, descriptions, usernames, categories, and error strings to HTML/DOM sinks. Check escaping, safe DOM APIs, URL schemes, markdown/rendering libraries, and stored/reflected XSS.
- Consider CSRF only where cookie-based ambient credentials or cross-site state changes make it applicable; bearer-token APIs have different threat conditions. Check CORS and origin checks without treating CORS as authorization.
- Check HTTPS, redirect handling, external script/CDN integrity and trust, CSP/security headers available on the host, referrer policy, and service-worker scope/cache risks.
- Verify all privileged API operations reauthorize server-side, validate inputs, and use bounded pagination/rate controls where appropriate. A hidden admin page is not protection.
- Search for credentials, private keys, tokens, signed URLs, and environment files without echoing their values. Report the file/location and credential type with the value redacted. Never copy a discovered secret into the report.

### Operational controls

- Review dependency manifests and lockfiles for known advisories using available, approved tooling; distinguish a vulnerable package from a reachable vulnerable code path. Do not upgrade dependencies as part of an audit unless authorized.
- Check security-relevant events are logged server-side without tokens, passwords, or sensitive media content. Confirm audit logs cannot be forged or edited by ordinary users.
- Inspect backup access, retention, encryption, restore permissions, and recovery testing. Do not trigger a backup, export, restore, or retention change without authorization and cost/impact review.
- Check least-privilege service accounts, secret storage, production/staging separation, CLI project selection, CI permissions, and release approvals.
- Avoid speculative cost/security alarms: state what was observed and what access would be needed to verify it.

## Severity and evidence

Use one severity per finding, based on practical exploitability and impact:

- **Critical:** likely broad compromise, privileged access takeover, mass sensitive-data exposure, or destructive control of production.
- **High:** realistic unauthorized admin action, cross-user private data access, or significant public exposure with material impact.
- **Medium:** limited exploit requiring conditions, meaningful integrity/privacy weakness, or a security control that is bypassable in a narrower context.
- **Low:** defense-in-depth gap with limited direct impact or strong prerequisites.
- **Informational:** hardening opportunity or configuration that could not be verified; not a confirmed vulnerability.

Do not inflate severity for missing evidence. State confidence (high/medium/low) separately. A useful finding includes:

```text
[Severity] Short, specific title
Evidence: file:line or exact policy/function and reachable path
Preconditions: attacker identity/access required
Impact: what the attacker can read, change, or disrupt
Why the control fails: concrete trust-boundary explanation
Safe verification: local/emulator steps or read-only evidence
Remediation: smallest durable server-side fix
Limitations: deployment/configuration state not verified, if applicable
```

Group duplicate root causes; prioritize exploit paths over generic best-practice lists. If no confirmed findings exist, say what was inspected and explicitly list untested boundaries. Never claim the app is “secure” based only on a source review.

## Testing and remediation guidance

- Prefer static checks and existing security tests. For Supabase, use a disposable local/test project and test RLS with anonymous, ordinary, and admin identities. For Firebase, use Emulator Suite Rules tests if the repository actually configures Firebase.
- Verify denied cases as well as allowed cases: non-admin upload/publish/delete must fail; unpublished metadata/media must be inaccessible publicly; cross-user access must fail; authorized admin operations must succeed only as intended.
- Run XSS/CSRF checks only against a local or explicitly approved staging environment with benign payloads. Never run destructive scanners against production.
- Re-test the reported exploit after an authorized fix. Run nearby regression tests and report failures. Do not change policies merely to make tests green; first verify the intended access model.
- Keep the security audit read-only unless the user explicitly asks for fixes. Approval to fix a finding does not imply approval to deploy or push it.

## Troubleshooting and false-positive control

- `permission denied` in the UI is not by itself evidence of broken Rules. Compare identity, claims, project, request shape, policy evaluation, and deployed state.
- A browser-side admin branch is a UX check. Confirm whether server policy independently blocks requests; if the backend is unconfigured, report the enforcement gap as unverified rather than claiming a tested exploit.
- A public key is not automatically a secret; determine whether it is designed for client use. A Supabase service-role key, Firebase service-account private key, or bearer token is sensitive. Redact all values.
- A public media URL may bypass a later policy change if it is a persistent bearer URL. Verify actual URL semantics and caching before reporting impact.
- A policy in a migration or Rules file may not be deployed. Phrase findings as “source policy permits…” or “deployment not verified” until confirmed.
- Dependency scanner output is a lead, not proof of exploitability. Verify package version, runtime inclusion, vulnerable feature use, and reachable inputs.
- Missing audit logs, rate limits, or backup checks may be an operational gap; severity depends on actual threat and exposure, not on checklist completion alone.

## Report boundary

Report findings with evidence, severity, confidence, and safe remediation. Keep secrets and personal data redacted. State exactly which environments and tests were covered. Do not mutate production, delete data, push, or deploy as part of an audit without explicit authorization.
