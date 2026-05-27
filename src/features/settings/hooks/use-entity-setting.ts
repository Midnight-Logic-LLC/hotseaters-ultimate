/**
 * use-entity-setting.ts — generic hook for reading and writing entity_setting
 * JSONB data keyed by SettingsType key + entity FK.
 *
 * RULE C: hook calls store action only — no Supabase import here.
 * RULE B: component calls hook only — no store import in components.
 *
 * Usage:
 *   const { data, isLoading, save } = useEntitySetting<UserPreferences>(
 *     'user.preferences',
 *     userInfoId,
 *     'user_info',
 *   );
 */

import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/features/settings/stores/settings-store';

type Scope = 'company' | 'user_info' | 'document_template';

export interface UseEntitySettingResult<T extends Record<string, unknown>> {
  data: T | null;
  isLoading: boolean;
  /** Merges patch with existing data and persists via the settings store. */
  save: (patch: Partial<T>) => Promise<void>;
}

const noOp = async () => {};

export function useEntitySetting<T extends Record<string, unknown>>(
  key: string,
  entityId: string | null,
  scope: Scope,
): UseEntitySettingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getEntitySetting, upsertEntitySetting } = useSettingsStore(
    (s) => ({ getEntitySetting: s.getEntitySetting, upsertEntitySetting: s.upsertEntitySetting }),
  );

  useEffect(() => {
    if (!entityId) return;

    let cancelled = false;
    setIsLoading(true);

    getEntitySetting(key, entityId, scope)
      .then((result) => {
        if (cancelled) return;
        setData(result as T | null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, entityId, scope, getEntitySetting]);

  if (!entityId) {
    return { data: null, isLoading: false, save: noOp };
  }

  const save = async (patch: Partial<T>) => {
    await upsertEntitySetting(key, entityId, scope, patch as Record<string, unknown>);
    // Refresh local state after save.
    const updated = await getEntitySetting(key, entityId, scope);
    setData(updated as T | null);
  };

  return { data, isLoading, save };
}
