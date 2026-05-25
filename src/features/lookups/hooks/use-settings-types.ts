/**
 * use-settings-types.ts — hook for reading SettingsType rows from the entity
 * graph store.
 *
 * NOTE: settings_type does not yet exist as a standalone table in the v2
 * schema — its data is folded into metadata_type via the `scope` column.
 * This hook returns an empty array until a dedicated SettingsType entity is
 * registered (see src/features/lookups/entities.ts). When the upstream schema
 * gains a settings_type table, update entities.ts to register it and update
 * this hook to read from 'SettingsType' instead.
 *
 * Architecture: hooks → stores (useGraphStore). No direct store import in
 * components — components call this hook.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';

export interface SettingsTypeEntity {
  id: string;
  key: string | null;
  label: string | null;
  entity_scope: string | null;
  json_schema: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Returns all SettingsType rows from the entity graph store.
 * Returns an empty array when the SettingsType entity is not yet registered.
 */
export function useSettingsTypes(): SettingsTypeEntity[] {
  const entities = useGraphStore(
    (s) => (s.entities as Record<string, Record<string, unknown>>)['SettingsType'] ?? {},
  );

  return Object.values(entities) as SettingsTypeEntity[];
}
