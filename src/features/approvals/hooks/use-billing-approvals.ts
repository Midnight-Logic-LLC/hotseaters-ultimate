/**
 * use-billing-approvals.ts — hook for billing approval data.
 *
 * BIBLE: HotSeatersMVP/src/pages/Approvals.jsx
 *
 * Fetches time entries, expenses, trials, HSH invoices, and related company
 * data for the approvals page. Exposes approve mutations.
 *
 * RULE C: hook only calls into the store — no Supabase imports here.
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  approveExpenses,
  approveHshInvoices,
  approveTimeEntries,
  fetchBillingApprovalData,
  type BillingApprovalData,
} from '@/features/approvals/stores/approvals-store';

interface UseBillingApprovalsResult {
  data: BillingApprovalData | null;
  isLoading: boolean;
  isApprovingTime: boolean;
  isApprovingExpenses: boolean;
  isApprovingHsh: boolean;
  approveTime: (ids: string[]) => Promise<void>;
  approveExp: (ids: string[]) => Promise<void>;
  approveHsh: (ids: string[]) => Promise<void>;
  refresh: () => void;
}

export function useBillingApprovals(companyId: string | null | undefined): UseBillingApprovalsResult {
  const [data, setData] = useState<BillingApprovalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApprovingTime, setIsApprovingTime] = useState(false);
  const [isApprovingExpenses, setIsApprovingExpenses] = useState(false);
  const [isApprovingHsh, setIsApprovingHsh] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);
    fetchBillingApprovalData(companyId)
      .then((result) => setData(result))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load approval data';
        toast.error(msg);
      })
      .finally(() => setIsLoading(false));
  }, [companyId, tick]);

  const approveTime = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setIsApprovingTime(true);
      try {
        await approveTimeEntries(ids);
        // Optimistic update: flip status to 'approved' in local state
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            timeEntries: prev.timeEntries.map((te) =>
              ids.includes(te.id) ? { ...te, status: 'approved' } : te,
            ),
          };
        });
        toast.success(`${ids.length} time ${ids.length === 1 ? 'entry' : 'entries'} approved`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Approval failed');
        refresh();
      } finally {
        setIsApprovingTime(false);
      }
    },
    [refresh],
  );

  const approveExp = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setIsApprovingExpenses(true);
      try {
        await approveExpenses(ids);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            expenses: prev.expenses.map((exp) =>
              ids.includes(exp.id) ? { ...exp, status: 'approved' } : exp,
            ),
          };
        });
        toast.success(`${ids.length} ${ids.length === 1 ? 'expense' : 'expenses'} approved`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Approval failed');
        refresh();
      } finally {
        setIsApprovingExpenses(false);
      }
    },
    [refresh],
  );

  const approveHsh = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setIsApprovingHsh(true);
      try {
        await approveHshInvoices(ids);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            hshInvoices: prev.hshInvoices.filter((inv) => !ids.includes(inv.id)),
          };
        });
        toast.success(`${ids.length} HSH ${ids.length === 1 ? 'invoice' : 'invoices'} approved`);
        // Refetch to pick up mirror entries
        refresh();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Approval failed');
        refresh();
      } finally {
        setIsApprovingHsh(false);
      }
    },
    [refresh],
  );

  return {
    data,
    isLoading,
    isApprovingTime,
    isApprovingExpenses,
    isApprovingHsh,
    approveTime,
    approveExp,
    approveHsh,
    refresh,
  };
}
