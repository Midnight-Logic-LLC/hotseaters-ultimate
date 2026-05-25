/**
 * use-pipeline-summary — dashboard's sales-pipeline aggregate.
 *
 * Composes:
 *   • useTrialsList(companyId)               — live Trial subscription
 *   • useDashboardPipelineStages({type:'sales'}) — sales-stages projection
 *   • Phase A `pipeline-aggregation`         — pure derivations
 *
 * Returns one rendered shape for the KPI tile + the chart:
 *   { pipelineValue, weightedValue, dealCount, dealsByStage[] }
 *
 * Bible: HotSeatersMVP/src/pages/Dashboard.jsx lines 163–174 + 227–231.
 *
 * Architectural rule (RULE 3): hooks compose other hooks + pure rules.
 * No direct PGlite / supabase reads here.
 */

import { useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTrialsList } from '@/features/trials/hooks/use-trials-list';
import {
  activeDeals as bibleActiveDeals,
  computePipelineValue,
  dealsByStage as bibleDealsByStage,
  type PipelineStageLike,
  type TrialLike,
} from '@/features/dashboard/business-rules/pipeline-aggregation';
import {
  useDashboardPipelineStages,
} from '@/features/dashboard/hooks/use-pipeline-stages';

export interface PipelineStageBucket {
  id: string;
  name: string;
  count: number;
  value: number;
}

export interface PipelineSummary {
  /** Sum of `estimated_value` across active sales-stage trials. */
  pipelineValue: number;
  /** Probability-weighted sum. */
  weightedValue: number;
  /** Count of active deals (non-completed, sales-stage). */
  dealCount: number;
  /** One bucket per active sales stage, in stage order. */
  dealsByStage: PipelineStageBucket[];
  isLoading: boolean;
}

const EMPTY_SUMMARY: PipelineSummary = Object.freeze({
  pipelineValue: 0,
  weightedValue: 0,
  dealCount: 0,
  dealsByStage: [],
  isLoading: true,
});

export function usePipelineSummary(): PipelineSummary {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const { items: trials, isLoading } = useTrialsList({ companyId });
  const salesStages = useDashboardPipelineStages({ type: 'sales' });

  return useMemo<PipelineSummary>(() => {
    if (!companyId) return EMPTY_SUMMARY;

    // Phase A's pipeline-aggregation operates on the bible's stage shape
    // (`type` + `revenue_probability` at the top level). Tier1 already
    // lifts those out of extra_schema for us — just pass through.
    const stageLikes: PipelineStageLike[] = salesStages.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      revenue_probability: s.revenue_probability,
      is_active: s.is_active,
    }));

    const trialLikes: TrialLike[] = trials as unknown as TrialLike[];
    const deals = bibleActiveDeals(trialLikes, stageLikes);
    const valueSummary = computePipelineValue(deals, stageLikes);
    const buckets = bibleDealsByStage(
      deals,
      salesStages.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        probability: s.revenue_probability,
        isActive: s.is_active,
      })),
    );

    return {
      pipelineValue: valueSummary.raw,
      weightedValue: valueSummary.weighted,
      dealCount: valueSummary.dealCount,
      dealsByStage: buckets,
      isLoading,
    };
  }, [companyId, trials, salesStages, isLoading]);
}
