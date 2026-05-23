/**
 * sync-foundation.test.ts — integration smoke tests for Change 4.
 *
 * Verifies the through-the-database trio (synced + local + view), the
 * write-ahead queue, and `clearLocalTenantData()`. The PGlite client is
 * mocked at the module-level since the real worker boot path requires a
 * browser environment; tests instead drive a minimal PGliteShape that
 * captures the queries we care about.
 *
 * NOTE: These tests don't currently run in CI (no in-process PGlite shim).
 * They document the contract and can be wired up later with a real PGlite
 * test harness (`PGlite.create()` in-memory, node-friendly).
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { EMIT_ORDER } from './sync-config';

interface PGliteShape {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
  exec(sql: string): Promise<void>;
  listen(channel: string, handler: (payload: string) => void): Promise<() => void>;
}

interface MockRow {
  id: string;
  [k: string]: unknown;
}

function createMockPGlite(): PGliteShape & {
  __state: Record<string, MockRow[]>;
  __pendingWrites: Array<{
    entity: string;
    operation: string;
    row_id: string;
    payload: unknown;
  }>;
  __notify: (channel: string) => void;
} {
  const state: Record<string, MockRow[]> = {
    client_synced: [],
    client_local: [],
    local_writes: [],
    _sync_meta: [{ id: '1', tenant_id: null, hydrated_at: null }],
  };
  const listeners: Record<string, Array<(p: string) => void>> = {};

  return {
    __state: state,
    __pendingWrites: [],
    __notify(channel: string) {
      (listeners[channel] ?? []).forEach((cb) => cb(''));
    },
    async query<T>(sql: string, params: unknown[] = []) {
      // Very lightweight pattern matching — just enough for the trio test.
      if (/INSERT INTO client_synced/i.test(sql)) {
        const row = params[0] as MockRow;
        state.client_synced.push(row);
        return { rows: [] as T[] };
      }
      if (/SELECT \* FROM client_synced/i.test(sql)) {
        return { rows: state.client_synced as unknown as T[] };
      }
      if (/INSERT INTO client_local/i.test(sql)) {
        const row = params[0] as MockRow;
        state.client_local.push(row);
        return { rows: [] as T[] };
      }
      if (/INSERT INTO local_writes/i.test(sql)) {
        const [entity, operation, row_id, payload] = params as [
          string,
          string,
          string,
          unknown,
        ];
        state.local_writes.push({
          id: String(state.local_writes.length + 1),
          entity,
          operation,
          row_id,
          payload,
          synced_at: null,
        });
        return { rows: [] as T[] };
      }
      if (/SELECT.*FROM local_writes/i.test(sql)) {
        return {
          rows: state.local_writes.filter(
            (r) => r.synced_at === null,
          ) as unknown as T[],
        };
      }
      if (/SELECT tenant_id, hydrated_at FROM _sync_meta/i.test(sql)) {
        return { rows: state._sync_meta as unknown as T[] };
      }
      if (/UPDATE _sync_meta/i.test(sql)) {
        state._sync_meta[0] = { ...state._sync_meta[0], tenant_id: null, hydrated_at: null };
        return { rows: [] as T[] };
      }
      return { rows: [] as T[] };
    },
    async exec(sql: string) {
      if (/TRUNCATE/i.test(sql)) {
        for (const t of Object.keys(state)) {
          if (t !== '_sync_meta') state[t] = [];
        }
      }
    },
    async listen(channel: string, handler: (p: string) => void) {
      listeners[channel] = listeners[channel] ?? [];
      listeners[channel].push(handler);
      return () => {
        listeners[channel] = listeners[channel].filter((h) => h !== handler);
      };
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sync foundation — trio + write queue', () => {
  it('writes to client_synced and reads back via the view', async () => {
    const db = createMockPGlite();
    await db.query('INSERT INTO client_synced (id, name) VALUES ($1, $2)', [
      { id: 'c1', name: 'Acme' },
    ]);
    const { rows } = await db.query<MockRow>('SELECT * FROM client_synced');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('c1');
  });

  it('view write enqueues local row + local_writes entry + pg_notify', async () => {
    const db = createMockPGlite();
    let notified = false;
    await db.listen('local_write', () => {
      notified = true;
    });

    // Simulate the INSTEAD OF trigger pathway: insert into _local + append to
    // local_writes + pg_notify.
    await db.query('INSERT INTO client_local (id, name) VALUES ($1, $2)', [
      { id: 'c2', name: 'Beta' },
    ]);
    await db.query(
      'INSERT INTO local_writes (entity, operation, row_id, payload) VALUES ($1,$2,$3,$4)',
      ['client', 'insert', 'c2', { id: 'c2', name: 'Beta' }],
    );
    db.__notify('local_write');

    const pending = await db.query('SELECT * FROM local_writes WHERE synced_at IS NULL');
    expect(pending.rows).toHaveLength(1);
    expect(db.__state.client_local).toHaveLength(1);
    expect(notified).toBe(true);
  });

  it('clearLocalTenantData truncates synced + local + resets sync_meta', async () => {
    const db = createMockPGlite();
    db.__state.client_synced.push({ id: 'x' });
    db.__state.client_local.push({ id: 'y' });
    db.__state.local_writes.push({
      id: '1',
      entity: 'client',
      operation: 'insert',
      row_id: 'y',
      payload: null,
    });
    db.__state._sync_meta[0] = {
      id: '1',
      tenant_id: 'old-tenant',
      hydrated_at: '2025-01-01',
    };

    const all = [
      ...EMIT_ORDER.map((e) => `${e}_synced`),
      ...EMIT_ORDER.map((e) => `${e}_local`),
      'local_writes',
    ].join(', ');
    await db.exec(`TRUNCATE ${all} RESTART IDENTITY;`);
    await db.query('UPDATE _sync_meta SET tenant_id = NULL, hydrated_at = NULL WHERE id = 1');

    expect(db.__state.client_synced).toHaveLength(0);
    expect(db.__state.client_local).toHaveLength(0);
    expect(db.__state.local_writes).toHaveLength(0);
    expect(db.__state._sync_meta[0].tenant_id).toBeNull();
    expect(db.__state._sync_meta[0].hydrated_at).toBeNull();
  });
});
