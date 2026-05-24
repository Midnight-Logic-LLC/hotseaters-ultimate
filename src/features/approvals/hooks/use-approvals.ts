/**
 * use-approvals.ts — facade hook for the Owner/Admin approvals queue.
 * Components import this; not the store directly (RULE B/C).
 */
import { useCallback, useEffect, useState } from 'react';
import {
  approveSubUser,
  fetchPendingMembers,
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
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setPending([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchPendingMembers(companyId);
      setPending(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending members');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approve = useCallback(
    async (id: string) => {
      setMutatingId(id);
      setError(null);
      try {
        await approveSubUser(id);
        setPending((curr) => curr.filter((m) => m.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed');
      } finally {
        setMutatingId(null);
      }
    },
    [],
  );

  const reject = useCallback(
    async (id: string) => {
      setMutatingId(id);
      setError(null);
      try {
        await rejectSubUser(id);
        setPending((curr) => curr.filter((m) => m.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rejection failed');
      } finally {
        setMutatingId(null);
      }
    },
    [],
  );

  return { pending, loading, error, refresh, approve, reject, mutatingId };
}
