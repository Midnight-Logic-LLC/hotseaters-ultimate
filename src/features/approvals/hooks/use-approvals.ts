/**
 * use-approvals.ts — facade hook for the Owner/Admin approvals queue.
 * Components import this; not the store directly (RULE B/C).
 *
 * S04: the pending-member list reads the already-synced `user_info` table
 * locally via `useTierAQuery` (no per-visit REST refetch). `account_status =
 * 'pending'` is applied as the local filter. approve/reject still call the
 * server Edge Functions (RULE D, in the store); their result syncs back into
 * `user_info` and the pending row drops out of the live query automatically —
 * a local `dismissedIds` set preserves the bible's instant removal in the gap
 * between the Edge Function returning and the sync delta landing.
 */
import { useCallback, useMemo, useState } from 'react';
import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import {
  approveSubUser,
  rejectSubUser,
  type PendingMember,
} from '@/features/approvals/stores/approvals-store';

export interface UseApprovalsResult {
  pending: PendingMember[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  mutatingId: string | null;
}

export function useApprovals(companyId: string | null): UseApprovalsResult {
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Optimistically hide rows whose approve/reject Edge Function has returned
  // but whose `account_status` change hasn't synced back into `user_info` yet.
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const { rows, loading } = useTierAQuery<PendingMember>(
    'user_info',
    companyId,
    'id, first_name, last_name, email, company_role, account_status, created_at',
    "account_status = 'pending'",
  );

  const pending = useMemo(
    () =>
      [...rows]
        .filter((m) => !dismissedIds.has(m.id))
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [rows, dismissedIds],
  );

  // Local reads are reactive; refresh is a stable no-op kept for callers.
  const refresh = useCallback(async () => {}, []);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((curr) => {
      const next = new Set(curr);
      next.add(id);
      return next;
    });
  }, []);

  const approve = useCallback(
    async (id: string) => {
      setMutatingId(id);
      setError(null);
      try {
        await approveSubUser(id);
        dismiss(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed');
      } finally {
        setMutatingId(null);
      }
    },
    [dismiss],
  );

  const reject = useCallback(
    async (id: string) => {
      setMutatingId(id);
      setError(null);
      try {
        await rejectSubUser(id);
        dismiss(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rejection failed');
      } finally {
        setMutatingId(null);
      }
    },
    [dismiss],
  );

  return { pending, loading, error, refresh, approve, reject, mutatingId };
}
