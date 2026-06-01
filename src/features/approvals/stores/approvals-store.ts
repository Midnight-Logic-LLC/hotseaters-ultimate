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
