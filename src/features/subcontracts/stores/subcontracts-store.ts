/**
 * features/subcontracts/stores/subcontracts-store.ts — Supabase REST seam
 * for the HSH `subcontract_assignment` and `subcontract_request` tables.
 *
 * Neither table is in SYNC_CONFIG today. Dashboard widgets consume this
 * store via `useEntityView({ remoteFetch, mode:'hybrid' })`. When the
 * offline-first phase later wires them to sync, this stays as the REST
 * fallback.
 *
 * RULE 3: only subcontracts-feature module permitted to import the
 * supabase client.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { supabase } from '@/shared/db/supabase-client';

export interface SubcontractAssignmentRow {
  id: string;
  hiring_company_id: string;
  subcontractor_company_id: string | null;
  consultant_id: string | null;
  consultant_first_name: string | null;
  consultant_last_name: string | null;
  trial_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubcontractRequestRow {
  id: string;
  company_id: string;
  trial_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const ASSIGNMENT_COLS =
  'id, hiring_company_id, subcontractor_company_id, consultant_id, consultant_first_name, consultant_last_name, trial_id, status, created_at, updated_at';

const REQUEST_COLS = 'id, company_id, trial_id, status, created_at, updated_at';

export interface FetchAssignmentsOptions {
  /** Filter to a `status` value (e.g. 'active'). */
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Subcontract assignments where the active company is the HIRING side
 * (i.e. assignments the dashboard's team-performance widgets need to
 * surface HSH consultants for).
 */
export async function fetchAssignmentsHiredByCompany(
  companyId: string,
  options: FetchAssignmentsOptions = {},
): Promise<SubcontractAssignmentRow[]> {
  const { status = 'active', limit = 1000, offset = 0 } = options;
  const { data, error } = await supabase
    .from('subcontract_assignment')
    .select(ASSIGNMENT_COLS)
    .eq('hiring_company_id', companyId)
    .eq('status', status)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as SubcontractAssignmentRow[];
}

/**
 * Assignments where THIS company is the subcontractor — the bible calls
 * this "mySubcontractGigs" and only counts active ones.
 */
export async function fetchAssignmentsAsSubcontractor(
  companyId: string,
  options: FetchAssignmentsOptions = {},
): Promise<SubcontractAssignmentRow[]> {
  const { status = 'active', limit = 1000, offset = 0 } = options;
  const { data, error } = await supabase
    .from('subcontract_assignment')
    .select(ASSIGNMENT_COLS)
    .eq('subcontractor_company_id', companyId)
    .eq('status', status)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as SubcontractAssignmentRow[];
}

export async function fetchRequestsForCompany(
  companyId: string,
  options: { status?: string; limit?: number; offset?: number } = {},
): Promise<SubcontractRequestRow[]> {
  const { status, limit = 1000, offset = 0 } = options;
  let query = supabase
    .from('subcontract_request')
    .select(REQUEST_COLS)
    .eq('company_id', companyId);
  if (status) query = query.eq('status', status);
  query = query
    .order('created_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SubcontractRequestRow[];
}
