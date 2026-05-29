/**
 * realtime-channels.ts — Supabase Realtime subscriptions for latency-sensitive
 * single-row data: the signed-in user's `user_info` row and their `company` row.
 *
 * Why Realtime here instead of ElectricSQL?
 *   ElectricSQL shapes are optimal for large historical data sets; they batch
 *   rows and rely on persisted offsets for resumption. Single-row data that
 *   must propagate within 1–2 seconds (company theme changes, user role updates)
 *   is better served by Postgres Realtime change notifications.
 *
 * Channel naming convention:
 *   `hotseaters:user:<userId>`    → user_info changes for this auth user
 *   `hotseaters:company:<cid>`   → company changes for this tenant
 *
 * Lifecycle:
 *   `startRealtimeChannels(userId, companyId, db)` — subscribe.
 *   `stopRealtimeChannels()` — unsubscribe all active channels.
 *
 * The lifecycle is wired from `pglite-client.ts → openForUser` (called after
 * schemas are applied) or from `auth-session.ts → signOut → closeForUser`.
 *
 * Self-hosted Supabase only (RULE 1). The Supabase client already guards this.
 */

import { supabase } from './supabase-client';
import type { LocalDB } from './pglite-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** Active channel handles so `stopRealtimeChannels` can remove them all. */
const activeChannels: RealtimeChannel[] = [];

/**
 * Open Postgres-changes subscriptions for the current user and their company.
 *
 * Rows received over Realtime are upserted into the corresponding `*_synced`
 * tables in the user's PGlite instance so reads from the entity graph remain
 * consistent.
 *
 * @param userId    Supabase auth user id — filters `user_info` by `auth_user_id`.
 * @param companyId tenant company UUID — filters `company` by `id`.
 * @param db        per-user PGlite handle (obtained from `openForUser`).
 */
export function startRealtimeChannels(
  userId: string,
  companyId: string,
  db: LocalDB,
): void {
  // ── user_info ─────────────────────────────────────────────────────────────
  const userChannel = supabase
    .channel(`hotseaters:user:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_info',
        filter: `auth_user_id=eq.${userId}`,
      },
      (payload) => {
        void handleUserInfoChange(payload, db);
      },
    )
    .subscribe();

  activeChannels.push(userChannel);

  // ── company ───────────────────────────────────────────────────────────────
  const companyChannel = supabase
    .channel(`hotseaters:company:${companyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'company',
        filter: `id=eq.${companyId}`,
      },
      (payload) => {
        void handleCompanyChange(payload, db);
      },
    )
    .subscribe();

  activeChannels.push(companyChannel);
}

/**
 * Remove all active Realtime channel subscriptions.
 * Called from `closeForUser` on sign-out.
 */
export async function stopRealtimeChannels(): Promise<void> {
  const channels = activeChannels.splice(0, activeChannels.length);
  for (const ch of channels) {
    await supabase.removeChannel(ch);
  }
}

// ─── Upsert helpers ─────────────────────────────────────────────────────────

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

async function handleUserInfoChange(
  payload: RealtimePayload,
  db: LocalDB,
): Promise<void> {
  try {
    if (payload.eventType === 'DELETE') {
      const id = payload.old['id'] as string | undefined;
      if (id) {
        await db.query(`DELETE FROM user_info_synced WHERE id = $1`, [id]);
      }
      return;
    }
    const row = payload.new;
    if (!row['id']) return;
    const keys = Object.keys(row);
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const updates = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(', ');
    await db.query(
      `INSERT INTO user_info_synced (${cols}) VALUES (${placeholders})
       ON CONFLICT (id) DO UPDATE SET ${updates}`,
      keys.map((k) => row[k]),
    );
  } catch (err) {
     
    console.error('[realtime-channels] user_info upsert failed:', err);
  }
}

async function handleCompanyChange(
  payload: RealtimePayload,
  db: LocalDB,
): Promise<void> {
  try {
    if (payload.eventType === 'DELETE') {
      const id = payload.old['id'] as string | undefined;
      if (id) {
        await db.query(`DELETE FROM company_synced WHERE id = $1`, [id]);
      }
      return;
    }
    const row = payload.new;
    if (!row['id']) return;
    const keys = Object.keys(row);
    const cols = keys.map((k) => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const updates = keys.map((k) => `"${k}" = EXCLUDED."${k}"`).join(', ');
    await db.query(
      `INSERT INTO company_synced (${cols}) VALUES (${placeholders})
       ON CONFLICT (id) DO UPDATE SET ${updates}`,
      keys.map((k) => row[k]),
    );
  } catch (err) {
     
    console.error('[realtime-channels] company upsert failed:', err);
  }
}
