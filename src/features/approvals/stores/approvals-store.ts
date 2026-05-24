/**
 * approvals-store.ts — owns the Owner/Admin approval queue + the
 * approve/reject Edge Function calls (RULE D).
 *
 * BIBLE: HotSeatersMVP/src/pages/Approvals.jsx — list of pending
 * user_info rows for the current company.
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

export async function fetchPendingMembers(companyId: string): Promise<PendingMember[]> {
  const { data, error } = await supabase
    .from('user_info')
    .select('id, first_name, last_name, email, company_role, account_status, created_at')
    .eq('company_id', companyId)
    .eq('account_status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PendingMember[];
}

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
