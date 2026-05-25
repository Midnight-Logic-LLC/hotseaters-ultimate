/**
 * features/lead-radar/stores/lead-radar-store.ts — Supabase REST seam
 * for the lead-radar entities (`lead`, `sales_activity`, `attorney`).
 *
 * None of these are in SYNC_CONFIG today. The dashboard's
 * NeedsAttentionBanner widget consumes these via
 * `useEntityView({ remoteFetch, mode:'hybrid' })`. Bible-equivalent of
 * `HotSeatersMVP/src/hooks/useMyStaleLeadsCount.js`.
 *
 * RULE 3: only lead-radar-feature module permitted to import the
 * supabase client.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';

export interface LeadRow {
  id: string;
  company_id: string;
  attorney_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SalesActivityRow {
  id: string;
  company_id: string;
  lead_id: string | null;
  scheduled_date: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AttorneyRow {
  id: string;
  company_id: string;
  client_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const LEAD_COLS = 'id, company_id, attorney_id, status, created_at, updated_at';
const ACTIVITY_COLS =
  'id, company_id, lead_id, scheduled_date, status, created_at, updated_at';
const ATTORNEY_COLS =
  'id, company_id, client_id, first_name, last_name, email, created_at, updated_at';

export async function fetchLeadsForCompany(
  companyId: string,
  options: { limit?: number } = {},
): Promise<LeadRow[]> {
  const { limit = 5000 } = options;
  const { data, error } = await supabase
    .from('lead')
    .select(LEAD_COLS)
    .eq('company_id', companyId)
    .range(0, limit - 1);
  if (error) throw error;
  return (data ?? []) as LeadRow[];
}

export async function fetchPendingActivitiesForCompany(
  companyId: string,
  options: { limit?: number } = {},
): Promise<SalesActivityRow[]> {
  const { limit = 5000 } = options;
  const { data, error } = await supabase
    .from('sales_activity')
    .select(ACTIVITY_COLS)
    .eq('company_id', companyId)
    .eq('status', 'pending')
    .range(0, limit - 1);
  if (error) throw error;
  return (data ?? []) as SalesActivityRow[];
}

export async function fetchAttorneysForCompany(
  companyId: string,
  options: { limit?: number } = {},
): Promise<AttorneyRow[]> {
  const { limit = 5000 } = options;
  const { data, error } = await supabase
    .from('attorney')
    .select(ATTORNEY_COLS)
    .eq('company_id', companyId)
    .range(0, limit - 1);
  if (error) throw error;
  return (data ?? []) as AttorneyRow[];
}
