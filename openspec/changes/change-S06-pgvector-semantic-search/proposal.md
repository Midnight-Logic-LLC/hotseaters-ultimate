# change-S06 — pgvector semantic search (D1)

## Why
The "pglite/pgvector" half of the goal is 0% built. User chose D1:
server-generated embeddings synced as vector columns; local `<=>` similarity
with zero per-query network.

## What changes
Load the `pgvector` extension in `pglite.worker.ts`. Add `embedding vector(N)`
to the search entities (client/trial/lead) on the server migration and the
generated local schema; embeddings sync as ordinary columns via S01's
multi-table sync. Add a `useSemanticSearch` shared hook running local
`ORDER BY embedding <=> $q LIMIT k`. Server-side embedding generation lives in
latest-data; this change defines the column contract + local query.

## Impact
`src/shared/db/pglite.worker.ts`, generated `local-schema.sql`, a new
`src/shared/hooks/use-semantic-search.ts`, server migration (latest-data).
Depends on S02. Decisions: dimension N, model, which entities, index type.
