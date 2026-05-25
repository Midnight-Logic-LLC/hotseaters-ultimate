/**
 * use-services.ts — hook for reading service lookup data from the entity graph
 * store (MetadataType rows with scope='service').
 *
 * Architecture: hooks → stores (useGraphStore). No direct store import in
 * components — components call this hook.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import type { PipelineStageEntity } from './use-pipeline-stages';

/** Re-use the MetadataType shape; the entity type is the same regardless of scope. */
export type ServiceEntity = PipelineStageEntity;

/**
 * Returns all active MetadataType rows with scope='service',
 * sorted by `order` ASC then by `name` ASC.
 */
export function useServices(): ServiceEntity[] {
  const entities = useGraphStore(
    (s) => (s.entities as Record<string, Record<string, unknown>>)['MetadataType'] ?? {},
  );

  return (Object.values(entities) as ServiceEntity[])
    .filter((e) => e.scope === 'service' && e.is_active !== 'false')
    .sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
}
