/**
 * sales-activity-store.ts — Supabase REST seam for the deals feature's
 * `sales_activity` + `attorney` tables.
 *
 * Neither table is a Tier-A synced entity (they are NOT in
 * `src/shared/db/sync-config.ts`), so — exactly like the lead-radar store —
 * the port reads/writes them via Supabase REST rather than PGlite/Electric.
 * This mirrors the bible, where `SalesActivity` / `Attorney` are written
 * directly through `base44.entities.*`.
 *
 * RULE D: this store is the ONLY deals-feature module permitted to touch the
 * supabase client. Hooks call into here; components never see it. RULE 1:
 * self-hosted Supabase only (the singleton client enforces the URL guard).
 *
 * HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';
import type { AnchorAttorney } from '@/features/deals/business-rules/resolve-sales-activity-anchors';

// ── Row shapes ───────────────────────────────────────────────────────────────

export interface SalesActivityRow {
  id: string;
  company_id: string | null;
  attorney_id: string | null;
  client_id: string | null;
  trial_id: string | null;
  lead_id: string | null;
  content: string | null;
  activity_type: string | null;
  date: string | null;
  author_id: string | null;
  scheduled_date: string | null;
  status: string | null;
  completion_note: string | null;
  completed_date: string | null;
  completed_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AttorneyRecord {
  id: string;
  company_id: string | null;
  client_id: string | null;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_active_prospect: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClientRecord {
  id: string;
  company_id: string | null;
  firm_name: string | null;
  client_type_id: string | null;
  sales_lead: string | null;
}

const ACTIVITY_COLS =
  'id, company_id, attorney_id, client_id, trial_id, lead_id, content, ' +
  'activity_type, date, author_id, scheduled_date, status, completion_note, ' +
  'completed_date, completed_by, created_at, updated_at';
const ATTORNEY_COLS =
  'id, company_id, client_id, first_name, last_name, title, email, phone, ' +
  'is_active_prospect, created_at, updated_at';
const CLIENT_COLS = 'id, company_id, firm_name, client_type_id, sales_lead';

const DEFAULT_LIMIT = 5000;

// ── sales_activity reads ──────────────────────────────────────────────────────

/**
 * All sales activities for a company. The Deal Tracker reads the full slice
 * (cards filter by trial_id / attorney_id client-side, exactly like the bible's
 * page-level `getSalesPageData`).
 */
export async function fetchSalesActivitiesForCompany(
  companyId: string,
  options: { limit?: number } = {},
): Promise<SalesActivityRow[]> {
  const { limit = DEFAULT_LIMIT } = options;
  const { data, error } = await supabase
    .from('sales_activity')
    .select(ACTIVITY_COLS)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(0, limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SalesActivityRow[];
}

/** Activity history for one trial (deal) — used by the history side panel. */
export async function fetchSalesActivitiesForTrial(
  trialId: string,
  options: { limit?: number } = {},
): Promise<SalesActivityRow[]> {
  const { limit = DEFAULT_LIMIT } = options;
  const { data, error } = await supabase
    .from('sales_activity')
    .select(ACTIVITY_COLS)
    .eq('trial_id', trialId)
    .order('created_at', { ascending: false })
    .range(0, limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SalesActivityRow[];
}

/** Activity history for one attorney (contact) — used by the history side panel. */
export async function fetchSalesActivitiesForAttorney(
  attorneyId: string,
  options: { limit?: number } = {},
): Promise<SalesActivityRow[]> {
  const { limit = DEFAULT_LIMIT } = options;
  const { data, error } = await supabase
    .from('sales_activity')
    .select(ACTIVITY_COLS)
    .eq('attorney_id', attorneyId)
    .order('created_at', { ascending: false })
    .range(0, limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as SalesActivityRow[];
}

// ── sales_activity writes ─────────────────────────────────────────────────────

export type SalesActivityInsert = Partial<Omit<SalesActivityRow, 'id'>>;

export async function createSalesActivity(
  input: SalesActivityInsert,
): Promise<SalesActivityRow> {
  const { data, error } = await supabase
    .from('sales_activity')
    .insert(input)
    .select(ACTIVITY_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as SalesActivityRow;
}

export async function updateSalesActivity(
  id: string,
  patch: Partial<SalesActivityRow>,
): Promise<void> {
  const { error } = await supabase
    .from('sales_activity')
    .update(patch)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSalesActivity(id: string): Promise<void> {
  const { error } = await supabase.from('sales_activity').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── attorney reads / writes ────────────────────────────────────────────────────

export async function fetchAttorneysForCompany(
  companyId: string,
  options: { limit?: number } = {},
): Promise<AttorneyRecord[]> {
  const { limit = DEFAULT_LIMIT } = options;
  const { data, error } = await supabase
    .from('attorney')
    .select(ATTORNEY_COLS)
    .eq('company_id', companyId)
    .range(0, limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AttorneyRecord[];
}

/** Single attorney — write-side anchor lookup for the resolver. */
export async function getAttorney(id: string): Promise<AnchorAttorney | null> {
  const { data, error } = await supabase
    .from('attorney')
    .select('id, client_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as AnchorAttorney | null) ?? null;
}

/**
 * Flip an attorney's `is_active_prospect` flag (single-field write).
 * Backs the OpportunityCard "Not Pursuing" action + the AddContactWizard's
 * "select existing contact" path (sets it true).
 */
export async function setAttorneyProspectStatus(
  id: string,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('attorney')
    .update({ is_active_prospect: isActive })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export type AttorneyInsert = Partial<Omit<AttorneyRecord, 'id'>>;

export async function createAttorney(
  input: AttorneyInsert,
): Promise<AttorneyRecord> {
  const { data, error } = await supabase
    .from('attorney')
    .insert(input)
    .select(ATTORNEY_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as AttorneyRecord;
}

// ── client reads / writes (new-firm path inside the contact wizard) ───────────

export async function fetchClientsForCompany(
  companyId: string,
  options: { limit?: number } = {},
): Promise<ClientRecord[]> {
  const { limit = DEFAULT_LIMIT } = options;
  const { data, error } = await supabase
    .from('client')
    .select(CLIENT_COLS)
    .eq('company_id', companyId)
    .range(0, limit - 1);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ClientRecord[];
}

export type ClientInsert = Partial<Omit<ClientRecord, 'id'>>;

export async function createClient(input: ClientInsert): Promise<ClientRecord> {
  const { data, error } = await supabase
    .from('client')
    .insert(input)
    .select(CLIENT_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as ClientRecord;
}

// ── deal cascade-delete child cleanup ─────────────────────────────────────────

/**
 * Enumerate the child-row counts that a deal (trial) delete would cascade.
 * The bible's `cascadeDeleteDeal` edge function returns richer
 * `blockers`/`dependent_summaries`; the port has no edge function, so the
 * dialog drives the deletion directly. We surface the counts the port CAN
 * resolve from its own tables (sales_activity, trial_service, trial_contact)
 * so the user sees what will be removed.
 *
 * Sales activities live here (server-only REST); trial_service / trial_contact
 * are deleted by the trials-store cascade the hook composes.
 */
export async function countSalesActivitiesForTrial(
  trialId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('sales_activity')
    .select('id', { count: 'exact', head: true })
    .eq('trial_id', trialId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function deleteSalesActivitiesForTrial(
  trialId: string,
): Promise<void> {
  const { error } = await supabase
    .from('sales_activity')
    .delete()
    .eq('trial_id', trialId);
  if (error) throw new Error(error.message);
}
