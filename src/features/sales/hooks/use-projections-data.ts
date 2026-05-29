/**
 * use-projections-data.ts — data hook for the /Projections page.
 *
 * Composes the D01 deals hook (trials + pipeline stages + company), the
 * clients list, and the company's TrialService rows. The page consumes only
 * this hook (RULE B); this hook composes other hooks + the entity graph
 * (RULE C). It does NOT re-implement any projection math — the page's pure
 * billing-record builder + the chart-data rule own that.
 *
 * Realized-revenue inputs (invoices + payments/collections) and the HSH /
 * subcontract revenue inputs are NOT yet wired — see the page's TODO. They
 * pass through as empty arrays here so the projection (future) series renders
 * with real data and the realized series renders empty (honest).
 *
 * HotSeatersMVP is the bible. Self-hosted Supabase only.
 */

import { useEntities } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import { useDealsTrialsData } from '@/features/deals/hooks/use-deals-trials-data';
import { useClientsList, type ClientRow } from '@/features/clients/hooks/use-clients-list';
import type { Trial, TrialService } from '@/features/trials/entities';
import type { PipelineStage } from '@/shared/db/lookups-selectors';

export interface UseProjectionsDataResult {
  isLoading: boolean;
  trials: Trial[];
  clients: ClientRow[];
  trialServices: TrialService[];
  pipelineStages: PipelineStage[];
  companyId: string | null;
}

export function useProjectionsData(): UseProjectionsDataResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const { trials, pipelineStages, isLoading: dealsLoading } = useDealsTrialsData({
    scope: 'deals',
  });
  const { clients, isLoading: clientsLoading } = useClientsList();

  const { items: trialServices, isLoading: tsLoading } = useEntities<TrialService>('TrialService', {
    filter: companyId ? [{ field: 'company_id', op: 'eq', value: companyId }] : null,
    enabled: !!companyId,
  });

  return {
    isLoading: dealsLoading || clientsLoading || tsLoading,
    trials,
    clients,
    trialServices,
    pipelineStages,
    companyId,
  };
}
