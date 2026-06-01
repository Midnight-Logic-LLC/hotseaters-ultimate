# Tasks — change-S06

## Decisions (user-confirmed 2026-06-01)
- Entities with embeddings: client, trial, lead, attorney.
- Dimension: 1536 (OpenAI text-embedding-3-small).
- Index: none (brute-force `<=>` scan) — appropriate at per-tenant row counts.

## Done
- [x] Load `pgvector` in the worker: `import { vector }` + `extensions: { live, vector, electric }` in `pglite.worker.ts`; also added to `pglite-client.ts` EXTENSIONS (LocalDB type).
- [x] Add `embedding?: { dim }` + `domain?: 'common'|'user'` to `SyncEntityConfig`; tag client/trial/lead/attorney with `embedding: { dim: 1536 }`.
- [x] Generator emits `embedding vector(1536)` on the synced+local tables of embedded entities (rides the same view/trigger plumbing).
- [x] `CREATE EXTENSION IF NOT EXISTS vector` emitted in the infra preamble when any entity has an embedding.
- [x] Added `src/shared/hooks/use-semantic-search.ts` — local `embedding <=> '[...]' ORDER BY ASC LIMIT k` via useLiveQuery; tenant-scoped; vector literal built from finite numbers only (no injection surface); `WHERE embedding IS NOT NULL` so NULL (un-embedded) rows are skipped.
- [x] Server-side embedding generation = latest-data dependency (documented). Until the server adds the `embedding` column + populates it, synced value stays NULL and search returns nothing — graceful.

## FOLDED-IN FIX (the S02 runtime-schema defect) — automate the split
- [x] ROOT CAUSE: gen-pglite-schema.mjs wrote only `local-schema.sql`, but the RUNTIME applies hand-curated `local-schema-common.sql` + `local-schema-user.sql`. S02's 7 new tables never reached the runtime files → would not exist in PGlite at boot. (User chose: automate the split.)
- [x] Generator now emits ALL THREE files from sync-config.ts (single source of truth, no hand-curation): full (reference/CI drift), common (domain:'common' + infra), user (domain:'user'). metadata_type + entity_metadata marked domain:'common'.
- [x] Replaced the naive `{ }` regex splitter with a brace-depth scanner that ignores comments + strings (fixes the change-S02 `lead`-drop class of bug) + a count-mismatch guard that fails loudly. (Supersedes the spawned parser-hardening task.)
- [x] FIXED generator type-capture bug: `extractColumns` was grabbing `BOOLEAN NOT` (from `NOT NULL`) → mapped to TEXT. Now matches `double precision` or a single type word + optional `(...)`. All BOOLEAN/NUMERIC/JSONB columns now emit correct types (previously silently TEXT in generated output; the hand-curated file had masked this).
- [x] FIXED version-row clause: runtime `_pglite_schema_version` INSERT must be `ON CONFLICT DO NOTHING` (not DO UPDATE) — pglite-client reads the stored version AFTER re-applying schema to detect upgrades; DO UPDATE would defeat migration detection.

## Verification
- [x] LIVE PROOF: booted real PGlite + vector extension, applied common+user in order — all 7 new views queryable; inserted a vector(1536) and ran `<=>` similarity successfully.
- [x] `pnpm gen:pglite-schema` idempotent (re-run: all unchanged).
- [x] `pnpm typecheck` clean; `pnpm lint` 0 errors; `pnpm lint:rules` OK; full suite 573/573 pass (incl. the updated local-schema-common spec — booleans + DO NOTHING invariant).

## Note for S07 / CI
- `gen:pglite-schema:check` only `git diff`s local-schema.sql; it should also diff the -common/-user files now that they're generated. Flag in S07.
