/**
 * features/invoices/stores/invoices-store.ts — Supabase REST seam for the
 * `invoice` table.
 *
 * Why this exists right now: `invoice` is not yet in `SYNC_CONFIG`, so
 * dashboard widgets that read invoices cannot rely on Electric / PGlite.
 * This store provides a thin `fetchInvoicesForCompany` over Supabase REST
 * that dashboard hooks consume via `useEntityView({ remoteFetch })` in
 * hybrid mode. When the offline-first phase later adds `invoice` to
 * `SYNC_CONFIG` (change-415's per-feature entities.ts), this store stays
 * useful as the REST fallback path — Electric takes over for steady-state
 * reads while this store fills cold-start + offline-divergence gaps.
 *
 * RULE 3: this is the ONLY invoices-feature module permitted to import
 * the supabase client. Hooks call into this store.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';

/** Loose row shape — only the columns the dashboard reads today. */
export interface InvoiceRow {
  id: string;
  company_id: string;
  invoice_number: string | null;
  total: number | null;
  status: string | null;
  invoice_date: string | null;
  client_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface FetchInvoicesOptions {
  /** YYYY-MM-DD lower bound (inclusive) on `invoice_date`. */
  since?: string;
  /** YYYY-MM-DD upper bound (inclusive) on `invoice_date`. */
  until?: string;
  /** Filter to one or more `status` values. */
  status?: ReadonlyArray<string>;
  /** Pagination — max rows. Default 1000. */
  limit?: number;
  /** Pagination offset (0-based). Default 0. */
  offset?: number;
  /** ORDER BY clause — defaults to `invoice_date DESC NULLS LAST`. */
  orderBy?: 'invoice_date_desc' | 'invoice_date_asc' | 'created_at_desc';
}

/**
 * Company-scoped invoice fetch over Supabase REST. Designed to be the
 * `remoteFetch` callback of a `useEntityView<InvoiceRow>` in hybrid mode.
 *
 * @throws when the Supabase REST request errors. Callers (typically
 *         useEntityView) surface the message through their `error` state.
 */
export async function fetchInvoicesForCompany(
  companyId: string,
  options: FetchInvoicesOptions = {},
): Promise<InvoiceRow[]> {
  const {
    since,
    until,
    status,
    limit = 1000,
    offset = 0,
    orderBy = 'invoice_date_desc',
  } = options;

  let query = supabase
    .from('invoice')
    .select(
      'id, company_id, invoice_number, total, status, invoice_date, client_id, created_at, updated_at',
    )
    .eq('company_id', companyId);

  if (since) query = query.gte('invoice_date', since);
  if (until) query = query.lte('invoice_date', until);
  if (status && status.length > 0) query = query.in('status', status);

  if (orderBy === 'invoice_date_desc') {
    query = query.order('invoice_date', { ascending: false, nullsFirst: false });
  } else if (orderBy === 'invoice_date_asc') {
    query = query.order('invoice_date', { ascending: true, nullsFirst: true });
  } else {
    query = query.order('created_at', { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InvoiceRow[];
}
