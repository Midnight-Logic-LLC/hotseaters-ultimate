/**
 * use-service-categories.ts — service-category CRUD for the company settings
 * Services & Rates tab. Reads from the entity graph store; writes go through
 * the company store (RULE D).
 *
 * Categories are MetadataType rows with `scope='service_category'`. The
 * lookups/use-service-categories hook filters to active rows only; this hook
 * returns the full list (including inactive) because the Settings tab has a
 * "Show Inactive" toggle.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import {
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  type ServiceCategoryInput,
} from '@/features/company/stores/company-store';

export interface ServiceCategoryRecord {
  id: string;
  name: string;
  is_active: boolean;
  is_default: boolean;
  order: number;
  company_id: string | null;
}

interface RawMetadataRow {
  id: string;
  scope?: string | null;
  name?: string | null;
  is_active?: string | null;
  is_default?: string | null;
  order?: number | null;
  company_id?: string | null;
}

function projectCategory(raw: RawMetadataRow): ServiceCategoryRecord {
  return {
    id: raw.id,
    name: raw.name ?? '',
    is_active: raw.is_active !== 'false',
    is_default: raw.is_default === 'true',
    order: raw.order ?? 0,
    company_id: raw.company_id ?? null,
  };
}

export interface UseServiceCategoriesResult {
  categories: ServiceCategoryRecord[];
  saving: boolean;
  error: string | null;
  create: (input: ServiceCategoryInput) => Promise<void>;
  update: (id: string, patch: Partial<ServiceCategoryInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  reactivate: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

export function useServiceCategories(): UseServiceCategoriesResult {
  const entities = useGraphStore(
    (s) =>
      (s.entities as Record<string, Record<string, unknown>>)['MetadataType'] ?? {},
  );

  const categories = useMemo<ServiceCategoryRecord[]>(() => {
    return (Object.values(entities) as RawMetadataRow[])
      .filter((row) => row.scope === 'service_category')
      .map(projectCategory)
      .sort((a, b) => {
        const orderDiff = a.order - b.order;
        if (orderDiff !== 0) return orderDiff;
        return a.name.localeCompare(b.name);
      });
  }, [entities]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrap = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Category write failed';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    categories,
    saving,
    error,
    create: (input) => wrap(() => createServiceCategory(input)),
    update: (id, patch) => wrap(() => updateServiceCategory(id, patch)),
    remove: (id) => wrap(() => deleteServiceCategory(id)),
    deactivate: (id) => wrap(() => updateServiceCategory(id, { is_active: false })),
    reactivate: (id) => wrap(() => updateServiceCategory(id, { is_active: true })),
    reorder: (orderedIds) =>
      wrap(async () => {
        const tasks: Promise<unknown>[] = [];
        orderedIds.forEach((id, index) => {
          const current = categories.find((c) => c.id === id);
          if (!current || current.order !== index) {
            tasks.push(updateServiceCategory(id, { order: index }));
          }
        });
        await Promise.all(tasks);
      }),
  };
}
