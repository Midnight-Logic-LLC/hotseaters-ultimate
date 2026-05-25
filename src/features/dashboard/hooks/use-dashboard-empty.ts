/**
 * use-dashboard-empty — returns true when the current company has no
 * trials AND no clients (the only Tier-A entity classes guaranteed to
 * be in the graph today).
 *
 * "Empty" intentionally does NOT consider invoices or time entries —
 * those flow through hybrid REST and may be slow to load; we don't want
 * to flash an Empty splash for a populated tenant that just hasn't
 * finished a REST round-trip.
 *
 * Bible-equivalent: implicit in Dashboard.jsx's "show widgets vs. show
 * EmptyDashboard" decision. The port surfaces it as a separate hook so
 * the page-shell stays a thin composition.
 */

import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import { useClientsList } from '@/features/clients/hooks/use-clients-list';

export interface DashboardEmptyResult {
  isEmpty: boolean;
  /** True while either list is still loading — page should NOT show empty splash. */
  isLoading: boolean;
}

export function useDashboardEmpty(): DashboardEmptyResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });
  const { clients, isLoading: clientsLoading } = useClientsList();

  if (!companyId) {
    return { isEmpty: false, isLoading: true };
  }
  if (trialsLoading || clientsLoading) {
    return { isEmpty: false, isLoading: true };
  }
  return {
    isEmpty: trials.length === 0 && clients.length === 0,
    isLoading: false,
  };
}
