# Tasks — change-413

## 413.a — Network status
- [ ] T1. NEW `src/shared/db/network-status.ts` exporting `useNetworkStatus` Zustand store + `subscribeOnline(cb)`. Uses `window.online`/`window.offline` events + 30s `fetch('/auth/v1/health', { method: 'HEAD', signal: AbortSignal.timeout(5000) })` heartbeat.
- [ ] T2. NEW unit `network-status.spec.ts` — mock `navigator.onLine` + fetch; assert transitions.

## 413.b — `local_writes` schema
- [ ] T3. Add columns to `local_writes` in `local-schema-common.sql`: `dedupe_key TEXT NULL`, `attempts INTEGER NOT NULL DEFAULT 0`, `last_error TEXT NULL`, `last_attempt_at TIMESTAMPTZ NULL`, `state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','draining','synced','failed','conflict'))`.
- [ ] T4. Update `operation` CHECK to include `'side_effect'`.
- [ ] T5. UNIQUE INDEX `local_writes_dedupe_pending_uidx ON local_writes(dedupe_key) WHERE state = 'pending' AND dedupe_key IS NOT NULL`.
- [ ] T6. Update INSTEAD-OF trigger functions to default `state='pending'`.

## 413.c — `side-effect-queue.ts`
- [ ] T7. NEW `src/shared/db/side-effect-queue.ts`:
  ```ts
  export async function queueSideEffect(args: {
    name: string;
    dedupeKey: string;
    payload: { method: 'rpc' | 'edge_fn'; name: string; body: unknown };
  }): Promise<{ enqueued: boolean }>;
  ```
  Performs `INSERT INTO local_writes (entity, operation, row_id, payload, dedupe_key) VALUES ('side_effect', 'side_effect', $1, $2, $3) ON CONFLICT (dedupe_key) WHERE state='pending' DO NOTHING RETURNING id`.
- [ ] T8. NEW unit `side-effect-queue.spec.ts` — same dedupe key called twice → one row.

## 413.d — Rewrite `write-sync.ts`
- [ ] T9. Replace the existing drainer with a state-machine drainer keyed off `useNetworkStatus`. Pseudocode:
  ```
  on online=true OR local_write NOTIFY:
    if draining return
    draining = true
    rows = SELECT … WHERE state='pending' ORDER BY created_at LIMIT 50
    for row of rows:
      if not online: break
      UPDATE local_writes SET state='draining', last_attempt_at=now(), attempts=attempts+1
      try:
        result = await dispatch(row)
        if isConflict(result, row): UPDATE state='conflict', last_error='conflict: server newer'
        else: UPDATE state='synced', synced_at=now()
      catch e:
        UPDATE state='pending', last_error=e.message
        if attempts >= 10: UPDATE state='failed'
        wait backoff(attempts)
    draining = false
  ```
- [ ] T10. `dispatch(row)`:
  - `entity != 'side_effect'`: PATCH/POST/DELETE to Supabase REST per `operation`.
  - `entity = 'side_effect'`: POST to `${SUPABASE_URL}/rest/v1/rpc/${payload.name}` (rpc) OR `${SUPABASE_URL}/functions/v1/${payload.name}` (edge_fn).
- [ ] T11. `isConflict`: server returns 409 OR server-row's `updated_at` > the `updated_at` in `payload`. Requires `dispatch` to return `{ status, serverUpdatedAt }`.
- [ ] T12. NEW integration `write-sync.spec.ts` — mock fetch with 200/409/503 sequences; assert state transitions, retry count, backoff intervals (Jest fake timers).

## 413.e — `useLocalWrites` hook
- [ ] T13. NEW `src/shared/db/use-local-writes.ts`:
  ```ts
  export function useLocalWrites(): {
    counts: { pending: number; draining: number; failed: number; conflict: number };
    rows: LocalWriteRow[];        // newest first, capped at 200
    retry(id: number): Promise<void>;
    discard(id: number): Promise<void>;
    forceLwwReapply(id: number): Promise<void>;  // for conflict rows
  };
  ```
  Backed by `db.live.query` (PGlite live extension) so consumers re-render on change.
- [ ] T14. NEW unit `use-local-writes.spec.ts`.

## 413.f — Cypress
- [ ] T15. NEW `tests/e2e/specs/offline-write-queue.spec.ts`:
  - Go offline (Playwright `context.setOffline(true)`).
  - Create 5 clients, edit 3 trials, queue 1 e-sign side-effect.
  - Assert `local_writes` has 9 rows, all `state='pending'`.
  - Go online. Wait for drain.
  - Assert all 9 reach `state='synced'`.
- [ ] T16. NEW `tests/e2e/specs/offline-conflict.spec.ts`:
  - Go offline. Update `client.name`.
  - Externally (via psql) update the same `client.name` to a different value with a newer `updated_at`.
  - Go online. Assert `local_writes` row reaches `state='conflict'`.

## Definition of done
- All listed unit + Cypress tests pass.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` green.
- Manual airplane-mode session works as described in acceptance.
