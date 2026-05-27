/**
 * use-settings-types.ts — hook for reading SettingsType rows from the entity
 * graph store.
 *
 * Reads from the 'SettingsType' entity slice registered by
 * `registerSettingsEntities()` (src/features/settings/entities.ts).
 *
 * Architecture: hooks → stores (useGraphStore). No direct store import in
 * components — components call this hook.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import type { SettingsTypeEntity } from '@/features/settings/entities';

export type { SettingsTypeEntity };

/**
 * Returns all SettingsType rows from the entity graph store.
 * Returns empty array + isLoading:false when no rows have been synced yet.
 */
export function useSettingsTypes(): {
  settingsTypes: SettingsTypeEntity[];
  isLoading: boolean;
} {
  const entities = useGraphStore(
    (s) =>
      (s.entities as Record<string, Record<string, unknown>>)[
        'SettingsType'
      ] ?? {},
  );

  const settingsTypes = Object.values(entities) as SettingsTypeEntity[];

  return { settingsTypes, isLoading: false };
}
