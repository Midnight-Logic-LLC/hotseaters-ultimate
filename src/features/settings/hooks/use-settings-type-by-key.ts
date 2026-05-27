/**
 * use-settings-type-by-key.ts — look up a single SettingsType row by its
 * unique `key` string (e.g. 'company.billing', 'user.preferences').
 *
 * Architecture: hook → useSettingsTypes (hook) → graph store. RULE B.
 */

import { useSettingsTypes } from '@/features/lookups/hooks/use-settings-types';
import type { SettingsTypeEntity } from '@/features/settings/entities';

/**
 * Returns the SettingsType row matching the given key, or `undefined` when
 * the rows have not yet synced or the key does not exist.
 */
export function useSettingsTypeByKey(
  key: string,
): SettingsTypeEntity | undefined {
  const { settingsTypes } = useSettingsTypes();
  return settingsTypes.find((t) => t.key === key);
}
