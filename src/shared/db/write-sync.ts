import { getLocalDB } from './pglite-client';
import { supabase } from './supabase-client';

/**
 * write-sync.ts — drains optimistic local writes back to Supabase.
 *
 * Part of `shared/db`. ElectricSQL only does read-path sync; getting local
 * edits back to the server is the app's responsibility. Flow:
 *
 *   app writes the `trial` view
 *     → INSTEAD OF trigger writes `trial_local` + appends to `local_writes`
 *     → pg_notify('local_write')
 *     → this drainer reads pending `local_writes` rows
 *     → POSTs them through Supabase REST
 *     → on success marks them synced; Electric streams the canonical row back
 *       into `*_synced`; the local shadow row is cleared.
 *
 * The server still validates every write against RLS — local writes are
 * "final" for UX but a malicious one is rejected server-side.
 */

interface PendingWrite {
  id: number;
  entity: string;
  operation: 'insert' | 'update' | 'delete';
  row_id: string;
  payload: Record<string, unknown> | null;
}

let started = false;

/** Begin draining the local write log. Idempotent — safe to call once. */
export async function startWriteSync(): Promise<() => Promise<void>> {
  const db = await getLocalDB();

  const drain = async (): Promise<void> => {
    const { rows } = await db.query<PendingWrite>(
      `SELECT id, entity, operation, row_id, payload
         FROM local_writes
        WHERE synced_at IS NULL
        ORDER BY created_at ASC`,
    );

    for (const w of rows) {
      try {
        await pushWrite(w);
        await db.query(
          `UPDATE local_writes SET synced_at = now() WHERE id = $1`,
          [w.id],
        );
        // Clear the optimistic shadow row once confirmed; Electric streams
        // the server's canonical version into *_synced shortly after.
        if (w.operation !== 'delete') {
          await db.query(
            `DELETE FROM ${w.entity}_local WHERE id = $1`,
            [w.row_id],
          );
        }
      } catch {
        // Leave the row pending; the next NOTIFY (or reconnect) retries it.
        break;
      }
    }
  };

  // Drain on every local write, and once now to flush any backlog.
  const unlisten = await db.listen('local_write', () => {
    void drain();
  });
  void drain();
  started = true;

  return async () => {
    await unlisten();
    started = false;
  };
}

export function isWriteSyncStarted(): boolean {
  return started;
}

/** Push one pending write to Supabase via PostgREST. */
async function pushWrite(w: PendingWrite): Promise<void> {
  if (w.operation === 'delete') {
    const { error } = await supabase.from(w.entity).delete().eq('id', w.row_id);
    if (error) throw error;
    return;
  }
  // insert and update both upsert by primary key.
  const { error } = await supabase
    .from(w.entity)
    .upsert(w.payload ?? {}, { onConflict: 'id' });
  if (error) throw error;
}
