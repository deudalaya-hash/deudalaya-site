---
name: database-architect
description: Inspect, design, secure, optimize, migrate, and test Deudalaya data models and database access. Use for schema, SQL, RLS, indexes, migrations, backups, or database performance.
metadata:
  short-description: Secure Deudalaya database architecture
---

# Database Architect for Deudalaya

Design and review Deudalaya data storage with a focus on correctness, least privilege, performance, and recoverability. This skill guides engineering work; it does not authorize production database changes, data deletion, policy changes, pushes, or deployment.

## Related guidance and current uncertainty

Before database work, read `deudalaya-core`, `firebase-backend` when Firebase is actually configured, and the installed Supabase and Supabase Postgres best-practice skills when Supabase/Postgres is involved. Read repository `AGENTS.md`, `BACKEND_SETUP.md`, relevant migrations, application queries, and tests. Follow current provider documentation and CLI help when implementation depends on provider-specific behavior.

Deudalaya's inspected site includes Supabase client calls, but setup documentation says no live Supabase project or applied migrations are verified. Firebase is not confirmed. The site reads `feed_posts`; proposed migrations describe `videos`, profiles, social tables, and RLS. Those source files do not prove that the schema exists in production. Inspect the actual database read-only using approved credentials/tools before design or migration. Never invent a project ID, table, column, relationship, bucket, index, or role.

The repository's proposed video model includes `creator_id`, `caption`, `description`, `category`, `location`, `storage_path`, `thumbnail_path`, `duration_seconds`, `size_bytes`, `status`, `moderation_note`, `created_at`, and `published_at`. Its proposed statuses include `pending`, `approved`, `rejected`, and `removed`; the public site also uses the separate `feed_posts` model. Treat these as repository proposals only and do not create duplicate or conflicting models. Verify deployed structure and actual consumers before using any of them.

## Safe database workflow

1. **Inspect first.** Check `git status`, database/provider configuration without printing secrets, schema migrations, actual table/column definitions, constraints, indexes, grants, RLS policies, views, triggers, functions, and application query paths. Identify whether the project uses imperative migrations or declarative schema files.
2. **Map relationships and behavior.** Document entity ownership, foreign keys, delete/update behavior, uniqueness, lifecycle states, retention, query patterns, and storage metadata references. Distinguish existing production schema from proposed source files and user-requested future shape.
3. **Find the smallest fix.** Identify duplicate/conflicting models, integrity gaps, missing policy, slow query, or migration risk. Explain tradeoffs in beginner-friendly terms. Do not redesign unrelated tables.
4. **Propose before mutation.** Show the migration/policy/index and explain its effect, lock/downtime/data implications, rollback limits, and tests. Ask explicit permission before applying any production migration, changing production RLS/grants, restoring, deleting, or backfilling data.
5. **Implement additively.** Use the repository's established migration process and valid generated names. Preserve existing data and compatibility. Never edit an already-applied migration as if it had not run; add a new corrective migration through the established workflow.
6. **Test in development.** Use local Supabase/Postgres or an isolated project with synthetic data. Verify schema, migration ordering, data integrity, auth contexts, RLS allow/deny cases, and query behavior.
7. **Review and report.** Inspect the entire diff; confirm no secrets or unrelated changes. Report exact files, actual environment, commands/results, deployment state, and remaining risk. Never push or deploy without explicit permission.

## Schema design checklist

- Choose keys and types based on actual identity semantics and provider support. Keep primary keys stable; make foreign keys explicit and index referencing columns when query/delete behavior needs it.
- Normalize canonical user, video, and category facts when they have independent lifecycle/ownership. Avoid duplicating mutable data solely to save a join without measuring the cost and consistency impact.
- Define `NOT NULL`, `CHECK`, `UNIQUE`, and foreign-key constraints for invariants that the database can enforce. Application validation is not a substitute for database integrity.
- Make timestamps timezone-aware and define which actor/system sets them. Prefer authoritative server/database timestamps for creation and publication.
- Model lifecycle as an explicit state machine. Validate allowed values and transitions at trusted boundaries. Do not reconcile `pending/approved/rejected/removed` with `draft/processing/published/unpublished/failed` by renaming or mapping without schema and product approval.
- For video records, verify how identity, creator/admin, Storage object path, format, byte size, actual duration, publication state, and media deletion are represented. A database row and a Storage object are separate resources; define failure and retention behavior.
- Prevent duplicates with stable IDs and the right unique constraint. Make retryable writes idempotent where possible.
- Consider privacy, retention, user deletion, moderation evidence, and backup/restore behavior before introducing cascades. `ON DELETE CASCADE` can irreversibly remove dependent user content; use only when it matches approved product policy.
- Keep sensitive authentication internals and credentials out of public schemas/API responses. Never add service-role keys or secrets to SQL, migrations, logs, or frontend config.

## RLS and authorization

- Enable RLS on every table exposed through Supabase Data API; separately confirm `GRANT`s, because RLS filters rows but does not grant table access.
- Define policies per operation and actor. `TO authenticated` means authenticated database role, not ownership or admin permission. Add explicit `auth.uid()` ownership or trusted `app_metadata` admin predicates where intended.
- For updates, reason about both row visibility (`USING`) and resulting row integrity (`WITH CHECK`). Confirm the caller can select rows needed for updates; Postgres RLS updates may affect zero rows when no applicable SELECT policy exists.
- Never authorize using user-editable `user_metadata`. Admin role assignment belongs to trusted server-side tooling and the trusted claim must be present in the token/policy.
- Treat Views and privileged functions as separate security surfaces. Views can bypass RLS unless configured appropriately (for supported Postgres versions, consider `security_invoker`); `SECURITY DEFINER` bypasses caller privileges and requires a compelling reviewed need, fixed search path, restricted execution, and safe identity checks. Do not use it to hide a permission bug.
- Test both permitted and denied SELECT/INSERT/UPDATE/DELETE as anonymous, ordinary users, owners, and admins. Check cross-user IDs, changing ownership/status, and direct API access outside the UI.
- Never disable RLS or broaden a policy to make an application error disappear. Diagnose auth claims, grants, policy composition, query shape, schema exposure, and deployed state first.

## Query performance and indexing

- Inspect real query shapes, filters, sort order, pagination, cardinality, and current indexes before adding one. Each index costs storage and write time; avoid speculative indexes.
- Match composite index column order to observed predicates and ordering. Consider partial indexes only where the query reliably matches the predicate and the data distribution supports it.
- Use bounded pagination. For changing feeds, keyset/cursor pagination is often more stable than large offsets, but choose based on actual sort keys, uniqueness, and client behavior.
- Select only required columns, avoid N+1 profile/media queries, and batch related reads within provider limits. Avoid unbounded realtime subscriptions and ensure clients clean up listeners.
- Check foreign-key indexes where joins, deletes, or referential checks need them. Verify actual query plans and representative row counts.
- Use `EXPLAIN` for read-only plan inspection. `EXPLAIN ANALYZE` executes the statement: use only safe read queries in development/staging, and never casually analyze mutations or expensive production queries.
- Review connection pooling for serverless/edge workloads. Do not create a long-lived connection per request or change pooler settings without measuring the app's actual connection pattern.

## Data APIs, Storage, and realtime

- Trace app requests from client to Data API/query builder and verify exposed schema grants, RLS, filters, ordering, pagination, and error handling.
- Storage authorization is separate from database row authorization. Verify object-level policies and ensure public media access matches the confirmed publication status.
- Keep video metadata and object references consistent. Avoid turning a private object public to simplify playback; inspect signed URL or download token lifetime and caching.
- Use Realtime only when the UI needs timely updates and the provider/schema supports it. Bound subscriptions, authorize row changes, handle reconnect/replay, and avoid using realtime as an audit or source-of-truth replacement.
- For Firebase, use only the confirmed Firestore schema and Rules; do not apply PostgreSQL/RLS concepts as if they were Firebase Rules. Coordinate with `firebase-backend` for provider-specific behavior.

## Safe migration and backup practices

- Confirm the migration system: the repository currently has imperative Supabase migration files and no confirmed declarative schema directory. Recheck before choosing a workflow.
- Generate new migration filenames with the project's documented tool; do not invent timestamps/ordering. Read provider/CLI help and current docs for version-sensitive operations.
- Prefer additive changes: add nullable/defaulted fields, backfill in bounded/restartable batches, validate, then enforce stricter constraints in a later step when compatibility allows.
- Review locks, table rewrites, long-running validation, RLS gaps during rollout, API cache/schema refresh, old-client compatibility, and rollback feasibility.
- Make migrations safe to run according to the migration system, but do not confuse `IF NOT EXISTS` with semantic safety. Inspect object state and make the intended postcondition explicit.
- Before migration, take/verify an authorized backup when appropriate and know the recovery path. A backup is not verified until its completion and restore procedure are confirmed.
- Never `DROP`, `TRUNCATE`, overwrite, cascade-delete, restore over, or bulk-delete production data without explicit approval and a reviewed target/backup/rollback plan. A schema rollback may not recover transformed/deleted data.
- Test upgrade from a representative prior schema, fresh setup where relevant, migration order, RLS, and application compatibility in a development environment.

## SQL examples — illustrative, not instructions to run

The snippets below use names that appear in Deudalaya's proposed migrations. They do not prove those objects exist in any live project. Inspect schema and policy state first, and adapt only after approval.

A feed index shape from the proposed schema:

```sql
-- Example only: the migration already proposes this partial index.
-- Confirm the actual query filters/orders by these columns and status first.
create index if not exists videos_public_feed_idx
  on public.videos (published_at desc)
  where status = 'approved';
```

An ownership policy shape from the proposed profile model:

```sql
-- Example only: demonstrates that authenticated role is paired with ownership.
-- Do not apply unless the confirmed table and ownership field match.
create policy profiles_self_update
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
```

Inspect before optimizing:

```sql
-- Run only in a safe development/staging database with representative data.
explain (analyze, buffers)
select id, caption, published_at
from public.videos
where status = 'approved'
order by published_at desc
limit 30;
```

These examples intentionally omit project-specific grants, complete RLS, actual deployment, and current schema verification. Never copy-paste them into production as a complete design.

## Testing checklist

- Verify schema inventory, migration status, foreign keys, uniqueness, constraints, index definitions, grants, and RLS without disclosing sensitive data.
- Test migration on a disposable/local database using synthetic fixtures. Confirm both fresh-install and upgrade paths when applicable.
- Validate representative insert/update/delete constraints and duplicate prevention. Test transaction rollback and partial failure in an isolated environment.
- Exercise RLS for anonymous, ordinary user, owner, and admin. Attempt cross-user reads/writes and protected status/creator changes.
- Test published versus unpublished video metadata and Storage access as separate permissions.
- Compare query plans and latency against representative row counts before/after index changes; record the environment and avoid production load tests without approval.
- Test backup/export and restore only in a non-production target unless explicitly authorized.
- Run the project's existing app tests after schema changes; do not assume a successful SQL command proves app compatibility.

## Troubleshooting

- **No rows or update affects zero rows:** inspect table grants, RLS SELECT policy, `USING`/`WITH CHECK`, token claims/freshness, filters, and whether the row is visible to that identity. Do not disable RLS.
- **Data API says table missing/unavailable:** confirm schema/table name, Data API exposure settings, grants, API schema cache, project environment, and migration status. Do not create a duplicate table to silence the error.
- **Duplicate key/foreign-key failure:** inspect actual ID generation, uniqueness scope, parent existence, transaction ordering, and retry behavior. Avoid deleting existing data to make the test pass.
- **Migration fails or appears partially applied:** stop repeated retries; inspect migration history and actual catalog state read-only. Determine transactional behavior and write a corrective migration only after understanding the post-failure state.
- **Slow feed:** capture the exact bounded query and plan, identify filter/order mismatch, row estimate, payload size, N+1 access, and pagination. Add only a measured index; explain its storage/write cost.
- **Storage access differs from metadata:** verify Storage policy separately, object path/bucket, signed URL lifetime, and publication state. A readable row does not grant the correct media access.
- **Schema differs across environments:** compare migration history, project ref/alias, actual catalog, and deployment timestamps without echoing credentials. Never run a schema push to “sync” until the target is confirmed.
- **Connection exhaustion:** inspect pooler mode, client lifetime, concurrency, and serverless behavior. Measure before changing limits or connection strings.
- **Restore/backup uncertainty:** verify export object, time, project, region, permissions, and restore drill; never overwrite a database to test whether a backup works.

## Documentation and handoff

Explain the table relationship or query issue in plain language. For each proposed or authorized change, document migration intent, compatibility/lock/data impact, RLS/grants, index rationale, tests, rollback/recovery limits, and whether it was applied locally, in staging, or in production. Clearly label unverified live state. Never claim a migration or policy is deployed based only on a checked-in file.
