/**
 * approvals-store.ts — owns the Owner/Admin approval queue + the
 * approve/reject Edge Function calls (RULE D).
 *
 * BIBLE: HotSeatersMVP/src/pages/Approvals.jsx — list of pending
 * user_info rows for the current company, plus billing approval data.
 */
import { supabase } from '@/shared/db/supabase-client';

export interface PendingMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_role: string | null;
  account_status: string | null;
  created_at: string;
}

// S04: the pending-member READ moved to the hook (`useApprovals` reads the
// synced `user_info` table locally via useTierAQuery). The store now owns only
// the approve/reject Edge Function writes (RULE D). `PendingMember` stays here
// as the shared row shape consumed by the hook.

export async function approveSubUser(userInfoId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('approve-sub-user', {
    body: { user_info_id: userInfoId },
  });
  if (error) throw error;
}

export async function rejectSubUser(userInfoId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('reject-sub-user', {
    body: { user_info_id: userInfoId },
  });
  if (error) throw error;
}

// ── Billing approval data ────────────────────────────────────────────────────
// BIBLE: HotSeatersMVP/src/pages/Approvals.jsx — Tier-2 queries for the
// billing approval columns.

export interface TimeEntryRow {
  id: string;
  status: string | null;
  start_time: string | null;
  end_time: string | null;
  start_timezone: string | null;
  end_timezone: string | null;
  consultant_id: string | null;
  trial_id: string | null;
  trial_name: string | null;
  duration_hours: number | null;
  rate: number | null;
  amount: number | null;
  service_name: string | null;
  description: string | null;
  subcontract_assignment_id: string | null;
  company_id: string | null;
}

export interface ExpenseRow {
  id: string;
  status: string | null;
  date: string | null;
  consultant_id: string | null;
  trial_id: string | null;
  amount: number | null;
  category: string | null;
  description: string | null;
  receipt_url: string | null;
  subcontract_assignment_id: string | null;
  company_id: string | null;
}

export interface TrialRow {
  id: string;
  case_name: string | null;
  job_number: string | null;
}

export interface SubcontractAssignmentRow {
  id: string;
  consultant_id: string | null;
  consultant_first_name: string | null;
  consultant_last_name: string | null;
  subcontractor_company_id: string | null;
  hiring_company_id: string | null;
}

export interface HshInvoiceRow {
  id: string;
  trial_id: string | null;
  trial_name: string | null;
  company_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total: number | null;
  pdf_url: string | null;
  is_hsh_invoice: boolean | null;
  status: string | null;
  client_id: string | null;
}

export interface HshCompanyRow {
  id: string;
  name: string | null;
}

export interface BillingApprovalData {
  timeEntries: TimeEntryRow[];
  expenses: ExpenseRow[];
  trials: TrialRow[];
  subcontractAssignments: SubcontractAssignmentRow[];
  hshInvoices: HshInvoiceRow[];
  hshCompanies: HshCompanyRow[];
  hshSubcontractorCompanies: HshCompanyRow[];
}

export async function fetchBillingApprovalData(companyId: string): Promise<BillingApprovalData> {
  const [timeEntriesRes, expensesRes, trialsRes, hshAsHiringRes, hshAsSubRes, invoicesRawRes] =
    await Promise.all([
      supabase
        .from('time_entry')
        .select(
          'id, status, start_time, end_time, start_timezone, end_timezone, consultant_id, trial_id, trial_name, duration_hours, rate, amount, service_name, description, subcontract_assignment_id, company_id',
        )
        .eq('company_id', companyId)
        .order('start_time', { ascending: false }),
      supabase
        .from('expense')
        .select(
          'id, status, date, consultant_id, trial_id, amount, category, description, receipt_url, subcontract_assignment_id, company_id',
        )
        .eq('company_id', companyId)
        .order('date', { ascending: false }),
      supabase
        .from('trial')
        .select('id, case_name, job_number')
        .eq('company_id', companyId),
      supabase
        .from('subcontract_assignment')
        .select('id, consultant_id, consultant_first_name, consultant_last_name, subcontractor_company_id, hiring_company_id')
        .eq('hiring_company_id', companyId),
      supabase
        .from('subcontract_assignment')
        .select('id, consultant_id, consultant_first_name, consultant_last_name, subcontractor_company_id, hiring_company_id')
        .eq('subcontractor_company_id', companyId),
      supabase
        .from('invoice')
        .select('id, trial_id, trial_name, company_id, invoice_number, invoice_date, total, pdf_url, is_hsh_invoice, status, client_id')
        .eq('client_id', companyId),
    ]);

  if (timeEntriesRes.error) throw timeEntriesRes.error;
  if (expensesRes.error) throw expensesRes.error;
  if (trialsRes.error) throw trialsRes.error;
  if (hshAsHiringRes.error) throw hshAsHiringRes.error;
  if (hshAsSubRes.error) throw hshAsSubRes.error;
  if (invoicesRawRes.error) throw invoicesRawRes.error;

  // Deduplicate subcontract assignments
  const assignmentMap = new Map<string, SubcontractAssignmentRow>();
  [...(hshAsHiringRes.data ?? []), ...(hshAsSubRes.data ?? [])].forEach((sa) =>
    assignmentMap.set(sa.id, sa as SubcontractAssignmentRow),
  );
  const subcontractAssignments = Array.from(assignmentMap.values());

  const hshInvoices = (invoicesRawRes.data ?? []).filter(
    (inv) => inv.is_hsh_invoice && inv.status === 'sent',
  ) as HshInvoiceRow[];

  // Collect company IDs needed for hshCompanies lookup
  const allHshCompanyIds = [
    ...new Set([
      ...subcontractAssignments.map((sa) => sa.subcontractor_company_id),
      ...subcontractAssignments.map((sa) => sa.hiring_company_id),
      ...hshInvoices.map((inv) => inv.company_id),
    ].filter(Boolean) as string[]),
  ];

  let hshCompanies: HshCompanyRow[] = [];
  if (allHshCompanyIds.length > 0) {
    const { data, error } = await supabase
      .from('company')
      .select('id, name')
      .in('id', allHshCompanyIds);
    if (error) throw error;
    hshCompanies = (data ?? []) as HshCompanyRow[];
  }

  // Derive subcontractor companies for HSH invoices
  const hshInvoiceCompanyIds = new Set(hshInvoices.map((inv) => inv.company_id).filter(Boolean));
  const hshSubcontractorCompanies = hshCompanies.filter((c) => hshInvoiceCompanyIds.has(c.id));

  return {
    timeEntries: (timeEntriesRes.data ?? []) as TimeEntryRow[],
    expenses: (expensesRes.data ?? []) as ExpenseRow[],
    trials: (trialsRes.data ?? []) as TrialRow[],
    subcontractAssignments,
    hshInvoices,
    hshCompanies,
    hshSubcontractorCompanies,
  };
}

/** Approve a list of time entries */
export async function approveTimeEntries(ids: string[]): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('time_entry')
    .update({ status: 'approved', approved_by: 'system', approved_at: now })
    .in('id', ids);
  if (error) throw error;
}

/** Approve a list of expenses */
export async function approveExpenses(ids: string[]): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('expense')
    .update({ status: 'approved', approved_by: 'system', approved_at: now })
    .in('id', ids);
  if (error) throw error;
}

/** Approve HSH invoices via Edge Function (mirrors sub's entries) */
export async function approveHshInvoices(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      supabase.functions.invoke('approveHSHInvoice', { body: { invoice_id: id } }),
    ),
  );
}
