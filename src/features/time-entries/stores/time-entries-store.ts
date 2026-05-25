/**
 * features/time-entries/stores/time-entries-store.ts — Supabase REST seam
 * for the `time_entry` table.
 *
 * `time_entry` is not yet in SYNC_CONFIG. Dashboard widgets consume this
 * store via `useEntityView({ remoteFetch, mode:'hybrid' })`. When the
 * offline-first phase later adds `time_entry` to sync, this store stays
 * useful as the REST fallback / cold-start path.
 *
 * RULE 3: only time-entries-feature module permitted to import the
 * supabase client.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';

export interface TimeEntryRow {
  id: string;
  company_id: string;
  consultant_id: string | null;
  trial_id: string | null;
  service_id: string | null;
  start_time: string | null;
  duration_hours: number | null;
  amount: number | null;
  status: string | null;
  invoice_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FetchTimeEntriesOptions {
  /** ISO start_time lower bound (inclusive). */
  since?: string;
  /** ISO start_time upper bound (inclusive). */
  until?: string;
  /** Filter to specific status values (e.g. ['approved']). */
  status?: ReadonlyArray<string>;
  /** Filter to a specific trial_id. */
  trialId?: string;
  /** Pagination — max rows. Default 5000 (dashboard windows can be wide). */
  limit?: number;
  /** Pagination offset. Default 0. */
  offset?: number;
}

const COLUMNS =
  'id, company_id, consultant_id, trial_id, service_id, start_time, duration_hours, amount, status, invoice_id, created_at, updated_at';

export async function fetchTimeEntriesForCompany(
  companyId: string,
  options: FetchTimeEntriesOptions = {},
): Promise<TimeEntryRow[]> {
  const { since, until, status, trialId, limit = 5000, offset = 0 } = options;
  let query = supabase
    .from('time_entry')
    .select(COLUMNS)
    .eq('company_id', companyId);

  if (since) query = query.gte('start_time', since);
  if (until) query = query.lte('start_time', until);
  if (status && status.length > 0) query = query.in('status', status);
  if (trialId) query = query.eq('trial_id', trialId);
  query = query.order('start_time', { ascending: false, nullsFirst: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TimeEntryRow[];
}
