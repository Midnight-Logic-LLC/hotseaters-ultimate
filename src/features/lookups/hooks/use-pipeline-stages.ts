/**
 * use-pipeline-stages.ts — hooks for reading pipeline stage lookup data from
 * the entity graph store (MetadataType rows with scope='pipeline_stage').
 *
 * Architecture: hooks → stores (useGraphStore). No direct store import in
 * components — components call these hooks.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

export interface PipelineStageEntity {
  id: string;
  company_id: string | null;
  scope: string | null;
  name: string | null;
  description: string | null;
  is_active: string | null;
  is_default: string | null;
  order: number | null;
  extra_schema: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  is_sample: string | null;
  created_by_id: string | null;
  created_by: string | null;
}

/**
 * Returns all active MetadataType rows with scope='pipeline_stage',
 * sorted by `order` ASC then by `name` ASC.
 */
export function usePipelineStages(): PipelineStageEntity[] {
  const entities = useGraphStore(
    (s) => (s.entities as Record<string, Record<string, unknown>>)['MetadataType'] ?? {},
  );

  return (Object.values(entities) as PipelineStageEntity[])
    .filter((e) => e.scope === 'pipeline_stage' && e.is_active !== 'false')
    .sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
}

/**
 * Returns the subset of pipeline stages that represent sales-funnel stages.
 * Sales stages are identified by `extra_schema.type === 'sales'` when present;
 * if the type field is absent the full sorted list is returned so callers
 * degrade gracefully when the schema hasn't been enriched yet.
 */
export function useSalesStages(): PipelineStageEntity[] {
  const stages = usePipelineStages();
  const hasSalesType = stages.some((s) => s.extra_schema?.type != null);
  if (!hasSalesType) return stages;
  return stages.filter((s) => s.extra_schema?.type === 'sales');
}
