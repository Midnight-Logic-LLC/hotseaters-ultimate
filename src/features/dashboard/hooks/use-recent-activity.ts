/**
 * use-recent-activity — recent wins (Trial.won_date) + recent invoices.
 *
 * Two halves with different data paths:
 *   • Recently won deals — Tier-A (Trial via useTrialsList → graph). Pure
 *     derivation of top-3 by `won_date DESC`.
 *   • Recent invoices — Hybrid REST: invoice isn't in SYNC_CONFIG yet, so
 *     we hand a `remoteFetch` to `useEntityView` that pulls top-3 from
 *     Supabase via the invoices store. When invoice later joins sync,
 *     this hook auto-flips to local-only completeness with zero code
 *     change (per the dashboard plan §4.3).
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 680–688 + 991–1090.
 */

import { useMemo } from 'react';
import { useEntityView } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import {
  fetchInvoicesForCompany,
  type InvoiceRow,
} from '@/features/invoices/stores/invoices-store';

export interface RecentlyWonDeal {
  id: string;
  case_name: string;
  won_date: string;
}

export interface RecentInvoice {
  id: string;
  invoice_number: string | null;
  total: number;
  status: string | null;
  invoice_date: string | null;
}

export interface RecentActivityResult {
  recentlyWon: RecentlyWonDeal[];
  recentInvoices: RecentInvoice[];
  isLoading: boolean;
}

const DEFAULT_LIMIT = 3;
const EMPTY_WINS: RecentlyWonDeal[] = Object.freeze([] as RecentlyWonDeal[]) as RecentlyWonDeal[];
const EMPTY_INVOICES: RecentInvoice[] = Object.freeze([] as RecentInvoice[]) as RecentInvoice[];

export interface UseRecentActivityOptions {
  limit?: number;
}

export function useRecentActivity(opts: UseRecentActivityOptions = {}): RecentActivityResult {
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });

  // Hybrid-mode view over Invoice. baseQueryKey is what the graph stores
  // the id list under; remoteFetch fires when local completeness is false
  // (which is always, until invoice joins SYNC_CONFIG).
  const invoiceView = useEntityView<InvoiceRow>({
    type: 'Invoice',
    baseQueryKey: ['Invoice', 'recent', companyId ?? '__none__'],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchInvoicesForCompany(companyId, {
        orderBy: 'invoice_date_desc',
        limit,
      });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const recentlyWon = useMemo<RecentlyWonDeal[]>(() => {
    if (!companyId) return EMPTY_WINS;
    const wins = trials.filter(
      (t): t is typeof t & { won_date: string } => typeof t.won_date === 'string',
    );
    if (wins.length === 0) return EMPTY_WINS;
    return [...wins]
      .sort((a, b) => (a.won_date < b.won_date ? 1 : a.won_date > b.won_date ? -1 : 0))
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        case_name: t.case_name ?? '',
        won_date: t.won_date,
      }));
  }, [companyId, trials, limit]);

  const recentInvoices = useMemo<RecentInvoice[]>(() => {
    if (!companyId || invoiceView.items.length === 0) return EMPTY_INVOICES;
    return invoiceView.items.slice(0, limit).map<RecentInvoice>((row) => ({
      id: row.id,
      invoice_number: row.invoice_number,
      total: row.total ?? 0,
      status: row.status,
      invoice_date: row.invoice_date,
    }));
  }, [companyId, invoiceView.items, limit]);

  return {
    recentlyWon,
    recentInvoices,
    isLoading: trialsLoading || invoiceView.isLoading,
  };
}
