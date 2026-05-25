/**
 * use-metadata-types.ts — generic hook for reading MetadataType rows from the
 * entity graph store, optionally filtered by scope.
 *
 * Architecture: hooks → stores (useGraphStore). No direct store import in
 * components — components call this hook.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import type { PipelineStageEntity } from './use-pipeline-stages';

/** Re-use the MetadataType shape; all scopes share the same columns. */
export type MetadataTypeEntity = PipelineStageEntity;

export interface UseMetadataTypesOptions {
  /** When provided, only rows with this exact scope are returned. */
  scope?: string;
  /** When true, inactive rows (is_active === 'false') are included. Defaults to false. */
  includeInactive?: boolean;
}

/**
 * Returns MetadataType rows from the entity graph, optionally filtered by scope
 * and/or including inactive rows. Results are sorted by `order` ASC then `name` ASC.
 */
export function useMetadataTypes(options: UseMetadataTypesOptions = {}): MetadataTypeEntity[] {
  const { scope, includeInactive = false } = options;

  const entities = useGraphStore(
    (s) => (s.entities as Record<string, Record<string, unknown>>)['MetadataType'] ?? {},
  );

  return (Object.values(entities) as MetadataTypeEntity[])
    .filter((e) => {
      if (scope != null && e.scope !== scope) return false;
      if (!includeInactive && e.is_active === 'false') return false;
      return true;
    })
    .sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
}
