/**
 * settings-store.ts — Zustand store that owns all entity_setting I/O.
 *
 * RULE D: This store is the ONLY layer that touches Supabase for entity_setting
 * data. Hooks call store actions; components call hooks.
 *
 * entity_setting schema:
 *   id, settings_type_id, company_id?, user_info_id?, document_template_id?,
 *   data (JSONB), created_at, updated_at
 *
 * The `key` parameter is the SettingsType.key string (e.g. 'user.preferences').
 * We resolve it to a settings_type_id by querying settings_type WHERE key = ?
 * the first time and caching the result in the store.
 *
 * Self-hosted Supabase only (RULE 1). HotSeatersMVP is the bible (RULE 2).
 */

import { create } from 'zustand';
import { supabase } from '@/shared/db/supabase-client';

type Scope = 'company' | 'user_info' | 'document_template';

/** Cached entity_setting data keyed by `${key}:${entityId}` */
interface SettingEntry {
  settingsTypeId: string;
  data: Record<string, unknown>;
  rowId: string | null;
}

interface SettingsStoreState {
  /** In-memory cache: `${key}:${entityId}` → SettingEntry */
  cache: Record<string, SettingEntry | null>;
  /** Loading keys: `${key}:${entityId}` */
  loading: Set<string>;
  /** Key → settings_type_id lookup cache */
  typeIdCache: Record<string, string>;

  /**
   * Fetch a single entity_setting row by SettingsType key + entity FK.
   * Returns data JSONB or null when no row exists.
   */
  getEntitySetting: (
    key: string,
    entityId: string,
    scope: Scope,
  ) => Promise<Record<string, unknown> | null>;

  /**
   * Upsert an entity_setting row, merging `data` with any existing JSONB.
   * Creates the row if none exists.
   */
  upsertEntitySetting: (
    key: string,
    entityId: string,
    scope: Scope,
    data: Record<string, unknown>,
  ) => Promise<void>;
}

/** Resolve the FK column name from scope. */
function fkColumn(scope: Scope): string {
  switch (scope) {
    case 'company':
      return 'company_id';
    case 'user_info':
      return 'user_info_id';
    case 'document_template':
      return 'document_template_id';
  }
}

/** Build the cache key. */
function cacheKey(key: string, entityId: string): string {
  return `${key}:${entityId}`;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  cache: {},
  loading: new Set(),
  typeIdCache: {},

  async getEntitySetting(key, entityId, scope) {
    const ck = cacheKey(key, entityId);
    const { cache, loading, typeIdCache } = get();

    // Return cached result if available.
    if (ck in cache) return cache[ck]?.data ?? null;
    if (loading.has(ck)) return null;

    set((s) => ({ loading: new Set([...s.loading, ck]) }));

    try {
      // Resolve settings_type_id.
      let settingsTypeId = typeIdCache[key];
      if (!settingsTypeId) {
        const { data: stRows, error: stErr } = await supabase
          .from('settings_type')
          .select('id')
          .eq('key', key)
          .limit(1);
        if (stErr || !stRows?.length) {
          set((s) => {
            const newCache = { ...s.cache, [ck]: null };
            const newLoading = new Set(s.loading);
            newLoading.delete(ck);
            return { cache: newCache, loading: newLoading };
          });
          return null;
        }
        settingsTypeId = stRows[0]!.id as string;
        const resolvedId = settingsTypeId;
        set((s) => ({
          typeIdCache: { ...s.typeIdCache, [key]: resolvedId } as Record<string, string>,
        }));
      }

      const fk = fkColumn(scope);
      const { data: rows, error } = await supabase
        .from('entity_setting')
        .select('id, data')
        .eq('settings_type_id', settingsTypeId)
        .eq(fk, entityId)
        .limit(1);

      if (error || !rows?.length) {
        set((s) => {
          const newCache = { ...s.cache, [ck]: null };
          const newLoading = new Set(s.loading);
          newLoading.delete(ck);
          return { cache: newCache, loading: newLoading };
        });
        return null;
      }

      const row = rows[0]!;
      const entry: SettingEntry = {
        settingsTypeId,
        data: (row.data ?? {}) as Record<string, unknown>,
        rowId: row.id as string,
      };

      set((s) => {
        const newCache = { ...s.cache, [ck]: entry };
        const newLoading = new Set(s.loading);
        newLoading.delete(ck);
        return { cache: newCache, loading: newLoading };
      });

      return entry.data;
    } catch {
      set((s) => {
        const newLoading = new Set(s.loading);
        newLoading.delete(ck);
        return { loading: newLoading };
      });
      return null;
    }
  },

  async upsertEntitySetting(key, entityId, scope, patch) {
    const ck = cacheKey(key, entityId);
    const { cache, typeIdCache } = get();

    // Resolve settings_type_id.
    let settingsTypeId = typeIdCache[key];
    if (!settingsTypeId) {
      const { data: stRows, error: stErr } = await supabase
        .from('settings_type')
        .select('id')
        .eq('key', key)
        .limit(1);
      if (stErr || !stRows?.length) {
        throw new Error(`Unknown settings key: ${key}`);
      }
      settingsTypeId = stRows[0]!.id as string;
      const resolvedId2 = settingsTypeId;
      set((s) => ({
        typeIdCache: { ...s.typeIdCache, [key]: resolvedId2 } as Record<string, string>,
      }));
    }

    // Merge with existing data.
    const existing = cache[ck]?.data ?? {};
    const merged = { ...existing, ...patch };
    const fk = fkColumn(scope);

    const { error } = await supabase.from('entity_setting').upsert(
      {
        settings_type_id: settingsTypeId,
        [fk]: entityId,
        data: merged,
      },
      { onConflict: `settings_type_id,${fk}` },
    );

    if (error) throw error;

    // Optimistically update cache.
    set((s) => {
      const existing_entry = s.cache[ck];
      return {
        cache: {
          ...s.cache,
          [ck]: {
            settingsTypeId,
            data: merged,
            rowId: existing_entry?.rowId ?? null,
          },
        },
      };
    });
  },
}));
