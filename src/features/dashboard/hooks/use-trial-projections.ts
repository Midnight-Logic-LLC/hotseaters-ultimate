/**
 * use-trial-projections — produces the projected-invoice map keyed by
 * billing date for the current company's trial services.
 *
 * Composes:
 *   • useTrialsList                       — Trial subscription (Tier-A)
 *   • useTier1().pipelineStages           — for stage probability
 *   • useTier1().company                  — invoice_period / billing config
 *   • useEntities<TrialService>          — TrialService (Tier-A REST,
 *     transport-registry-backed, company-scoped filter).
 *   • Phase A trial-projections           — enrichTasksWithDailyRevenue +
 *                                            buildProjectedInvoiceMap.
 *
 * Returns a stable `Map<dateKey, $>` consumed by use-revenue-trend to
 * overlay projected revenue on the actual fiscal-year buckets.
 *
 * 2.0 migration: replaced useEntityList (inline fetch/normalize closures) with
 * useEntities (transport-registry-backed).
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 252–401.
 */

import { useMemo } from 'react';
import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import type { TrialService } from '@/features/trials/entities';
import {
  buildProjectedInvoiceMap,
  enrichTasksWithDailyRevenue,
  type ProjectionCompanySettings,
  type ProjectionStageLike,
  type ProjectionTrialLike,
  type ProjectionTrialServiceLike,
} from '@/features/dashboard/business-rules/trial-projections';

export interface TrialProjectionsResult {
  /** dateKey ("yyyy-MM-dd") → projected $$$ on that billing date. */
  projectedInvoices: Map<string, number>;
  isLoading: boolean;
}

const EMPTY_MAP: Map<string, number> = new Map();
const EMPTY_RESULT: TrialProjectionsResult = Object.freeze({
  projectedInvoices: EMPTY_MAP,
  isLoading: false,
});

export function useTrialProjections(): TrialProjectionsResult {
  const { company, pipelineStages, serviceCategories } = useTier1();
  const companyId = company?.id ?? null;

  // Hoist the specific scalar settings we care about so useMemo deps are
  // narrow (avoids re-recompute when upstream passes a new `company`
  // object identity but the actual fields are unchanged).
  const invoicePeriod = company?.invoice_period ?? null;
  const weeklyBillingDay = company?.weekly_billing_day ?? null;
  const monthlyBillingDate = company?.monthly_billing_date ?? null;
  const perTrialBillingDays = company?.per_trial_billing_days_after_end ?? null;

  const { items: trials, isLoading: trialsLoading } = useTrialsList({ companyId });

  const { items: trialServices, isLoading: tsLoading } = useEntities<TrialService>('TrialService', {
    filter: companyId
      ? [{ field: 'company_id', op: 'eq', value: companyId }]
      : null,
    enabled: !!companyId,
  });

  return useMemo<TrialProjectionsResult>(() => {
    if (!companyId) return EMPTY_RESULT;

    const stageLikes: ProjectionStageLike[] = pipelineStages.map((s) => ({
      id: s.id,
      revenue_probability: s.revenue_probability,
    }));

    // Phase A's `services` arg is only used for `serviceById` lookups — we
    // pass the available service-category list so the enrichment doesn't
    // skip rows. A future revision can fold in a dedicated useServices()
    // hook; for now category IDs suffice (the enrichment only stores the
    // service reference for downstream display).
    const enriched = enrichTasksWithDailyRevenue({
      trialServices: trialServices as unknown as ProjectionTrialServiceLike[],
      trials: trials as unknown as ProjectionTrialLike[],
      stages: stageLikes,
      services: serviceCategories.map((s) => ({ id: s.id })),
    });

    const settings: ProjectionCompanySettings = {
      invoice_period: invoicePeriod,
      weekly_billing_day: weeklyBillingDay,
      monthly_billing_date: monthlyBillingDate,
      per_trial_billing_days_after_end: perTrialBillingDays,
    };

    const projectedInvoices = buildProjectedInvoiceMap({
      tasks: enriched,
      company: settings,
    });

    return {
      projectedInvoices,
      isLoading: trialsLoading || tsLoading,
    };
  }, [
    companyId,
    trials,
    trialServices,
    pipelineStages,
    serviceCategories,
    invoicePeriod,
    weeklyBillingDay,
    monthlyBillingDate,
    perTrialBillingDays,
    trialsLoading,
    tsLoading,
  ]);
}
