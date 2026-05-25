# change-413 — Offline write queue + reconciler

## Why
The user must be able to do meaningful work disconnected. Today,
`local_writes` exists and `write-sync.ts` drains it on `local_write`
NOTIFY, but:

- There is no `online | offline` awareness — the drainer assumes
  connectivity.
- There is no retry/backoff — a single failed POST silently abandons
  the write.
- There is no conflict detection — server-side `updated_at` newer than
  our local change overwrites the user's offline work without
  surfacing it.
- There is no "side-effect" operation type — e-sign, email, Stripe,
  Slack are blocked offline.
- There is no dedupe key — a tab that drains during the same window
  another tab is open can replay the same write twice.

This change builds the offline core. UI surface = change-414.

## What changes
1. NEW `src/shared/db/network-status.ts` — `online: boolean`, derived
   from `navigator.onLine` + a heartbeat ping to Supabase
   `/auth/v1/health` every 30s. Exposes a `subscribe()` and a Zustand
   store.
2. Extend `local_writes` columns:
   - `dedupe_key TEXT NULL` (idempotency).
   - `attempts INTEGER NOT NULL DEFAULT 0`.
   - `last_error TEXT NULL`.
   - `last_attempt_at TIMESTAMPTZ NULL`.
   - `operation` CHECK adds `'side_effect'`.
   - `side_effect` rows carry `payload.method` (`'rpc' | 'edge_fn'`),
     `payload.name`, `payload.body`.
3. Rewrite `src/shared/db/write-sync.ts`:
   - Drain queue when `online=true` AND queue non-empty.
   - Per-row: POST to Supabase (data writes via REST, side-effects via
     RPC/Edge); on success, `synced_at = now()`; on failure, bump
     `attempts`, store `last_error`, exponential backoff
     (`min(2^attempts * 1s, 5min)`); after 10 attempts, mark
     `state='failed'` and stop retrying (user must dismiss / re-apply).
   - Conflict detection: if server returns 409 OR returned
     `updated_at` > local `payload.updated_at`, classify as conflict.
     Conflict rows enter `synced_at = NULL, state = 'conflict'` with
     `last_error = 'conflict: server newer'`.
4. NEW `_local_write_state` column on `local_writes` (`pending |
   draining | synced | failed | conflict`) — `synced_at` alone was
   ambiguous.
5. NEW `src/shared/db/side-effect-queue.ts` — public API for stores to
   queue a side-effect:
   ```ts
   queueSideEffect({
     name: 'send_esign_request',
     dedupeKey: `esign:${docId}:${signerId}`,
     payload: { method: 'edge_fn', name: 'esign-send', body: { ... } },
   })
   ```
6. Hook `write-sync.ts` to the `network-status` store: when transition
   `offline → online`, immediately drain. When `online → offline`, stop
   in-flight drains (cancel `AbortController`).
7. NEW `useLocalWrites()` selector hook in
   `src/shared/db/use-local-writes.ts` — returns a live count + grouped
   list of pending/failed/conflict rows. Used by change-414's UI.

## Out of scope
- The Edge Functions themselves (`esign-send`, `stripe-charge`,
  `email-send`, `slack-notify`) — those live in latest-data and are
  declared but not implemented here. The queue treats them as opaque.
- Per-entity custom mergers (change-417 / out-of-scope-for-now default
  LWW).
- The pending-sync UI (change-414).

## Acceptance
- Offline: 20 mixed writes (12 data, 5 side-effects, 3 deletes) sit
  in `local_writes` with `state='pending'`. No errors in console.
- Reconnect: the queue drains in dedupe order; success rows show
  `state='synced'`; conflict rows show `state='conflict'` with the
  server's newer `updated_at` retained for the diff view.
- Dedupe: two tabs with the same `dedupe_key` produce one server-side
  effect (verified by RPC log + `local_writes.dedupe_key` UNIQUE
  partial index on `WHERE synced_at IS NULL`).
- Retry: a write that returns 503 retries with backoff; logged
  attempts visible; after 10 attempts → `state='failed'`.
- Network heartbeat: airplane-mode triggers `online=false` within 30s
  (or instantly via `navigator.onLine` event).

## Tasks → see `tasks.md`.
