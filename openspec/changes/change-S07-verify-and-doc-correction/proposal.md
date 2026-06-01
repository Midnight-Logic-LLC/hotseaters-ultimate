# change-S07 — verify + doc correction

## Why
Prove the phase invariant (zero duplicate reads) and fix the stale docs the
assessment surfaced.

## What changes
Add a Playwright spec that visits each migrated route twice and asserts 0
entity-read network requests on the 2nd visit. Correct `src/shared/db/CLAUDE.md`
(Change-13 entity-graph files are NOT delivered; document the real
`useLiveQuery` pattern). Update `sync-policy.md` to promote now-synced tables
out of "future". Re-document the misleading "REST fallback for the entity
graph" store comments.

## Impact
`tests/`, `src/shared/db/CLAUDE.md`, `docs/architecture/sync-policy.md`, store
comments. Depends on S03–S06.
