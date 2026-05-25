/**
 * use-revenue-trend — fiscal-year revenue trend with projected overlay,
 * cumulative toggle, least-squares trend line, and annual goal line.
 *
 * Composes:
 *   • useTrialProjections   — projected-invoice map (Tier-A trial_service).
 *   • useEntityView<Invoice> (hybrid REST) — actual invoices in the FY.
 *   • useDashboardPreferences — fiscal year, period, cumulative toggles.
 *   • useTier1().company    — fiscal_year_start_month + annual_revenue_target.
 *   • Phase A revenue-trend — monthlyTrend / weeklyTrend / toCumulative /
 *                              attachTrend / revenueGoalForPeriod.
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 116–120 + 403–525.
 */

import { useMemo } from 'react';
import { useEntityView } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import {
  fetchInvoicesForCompany,
  type InvoiceRow,
} from '@/features/invoices/stores/invoices-store';
import {
  attachTrend,
  availableFiscalYears,
  deriveCurrentFiscalYear,
  fiscalYearBoundaries,
  monthlyTrend,
  revenueGoalForPeriod,
  toCumulative,
  weeklyTrend,
  type InvoiceForTrend,
  type TrendPeriod,
  type TrendPointWithTrend,
} from '@/features/dashboard/business-rules/revenue-trend';
import { useDashboardPreferences } from '@/features/dashboard/hooks/use-dashboard-preferences';
import { useTrialProjections } from '@/features/dashboard/hooks/use-trial-projections';

export interface RevenueTrendResult {
  /** Chart-ready dataset (actual + projected + trend). */
  data: TrendPointWithTrend[];
  /** Current period — 'month' (12 buckets) or 'week' (52 buckets). */
  period: TrendPeriod;
  /** Selected fiscal year. */
  fiscalYear: number;
  /** Whether the dataset is cumulative. */
  cumulative: boolean;
  /** Picker options. */
  availableFiscalYears: number[];
  /** Per-period goal value for the horizontal goal line. */
  revenueGoal: number;
  isLoading: boolean;
}

const EMPTY_DATA: TrendPointWithTrend[] = Object.freeze([] as TrendPointWithTrend[]) as TrendPointWithTrend[];

export interface UseRevenueTrendOptions {
  /** Reference "now" for testability. Defaults to `new Date()`. */
  now?: Date;
}

export function useRevenueTrend(opts: UseRevenueTrendOptions = {}): RevenueTrendResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const fiscalYearStartMonth = company?.fiscal_year_start_month ?? 1;
  const annualRevenueTarget = company?.annual_revenue_target ?? 0;

  const { prefs, isLoading: prefsLoading } = useDashboardPreferences();
  const period: TrendPeriod = prefs.period;
  const cumulative = prefs.showCumulative;
  const nowMs = opts.now?.getTime();

  // Derive the active fiscal year from prefs OR the calendar.
  const fiscalYear = useMemo(() => {
    if (prefs.fiscalYear !== null) return prefs.fiscalYear;
    const now = nowMs !== undefined ? new Date(nowMs) : new Date();
    return deriveCurrentFiscalYear(now, fiscalYearStartMonth);
  }, [prefs.fiscalYear, fiscalYearStartMonth, nowMs]);

  const { start: fiscalYearStart, end: fiscalYearEnd } = useMemo(
    () => fiscalYearBoundaries({ fiscalYear, fiscalYearStartMonth }),
    [fiscalYear, fiscalYearStartMonth],
  );

  // Hybrid-mode invoice fetch scoped to the FY window. We pass the FY
  // bounds to remoteFetch so we only pull the relevant slice.
  const sinceIso = useMemo(() => fiscalYearStart.toISOString().slice(0, 10), [fiscalYearStart]);
  const untilIso = useMemo(() => fiscalYearEnd.toISOString().slice(0, 10), [fiscalYearEnd]);

  const invoiceView = useEntityView<InvoiceRow>({
    type: 'Invoice',
    baseQueryKey: ['Invoice', 'fy', companyId ?? '__none__', sinceIso, untilIso],
    view: {},
    mode: 'hybrid',
    enabled: !!companyId,
    remoteFetch: async () => {
      if (!companyId) return { items: [], total: 0 };
      const items = await fetchInvoicesForCompany(companyId, {
        since: sinceIso,
        until: untilIso,
        orderBy: 'invoice_date_asc',
        limit: 5000,
      });
      return { items, total: items.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
  });

  const { projectedInvoices, isLoading: projectionsLoading } = useTrialProjections();

  const data = useMemo<TrendPointWithTrend[]>(() => {
    if (!companyId) return EMPTY_DATA;
    const invoicesForTrend = invoiceView.items as unknown as InvoiceForTrend[];
    const base =
      period === 'week'
        ? weeklyTrend({ invoices: invoicesForTrend, projectedInvoices, fiscalYearStart })
        : monthlyTrend({ invoices: invoicesForTrend, projectedInvoices, fiscalYearStart });
    const final = cumulative ? toCumulative(base) : base;
    return attachTrend(final);
  }, [
    companyId,
    invoiceView.items,
    projectedInvoices,
    fiscalYearStart,
    period,
    cumulative,
  ]);

  const revenueGoal = useMemo(
    () =>
      revenueGoalForPeriod({
        annualRevenueTarget,
        period,
        cumulative,
      }),
    [annualRevenueTarget, period, cumulative],
  );

  const fyOptions = useMemo(() => availableFiscalYears(fiscalYear), [fiscalYear]);

  return {
    data,
    period,
    fiscalYear,
    cumulative,
    availableFiscalYears: fyOptions,
    revenueGoal,
    isLoading: prefsLoading || projectionsLoading || invoiceView.isLoading,
  };
}
