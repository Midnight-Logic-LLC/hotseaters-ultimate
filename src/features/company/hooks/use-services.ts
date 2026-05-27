/**
 * use-services.ts — service-registry hook for the company settings tab.
 *
 * Projects the raw MetadataType rows (scope='service') into the bible's
 * Service shape — base_rate, rate_type, category_id, etc. live in the
 * `extra_schema` JSON column and are pulled back into top-level fields here
 * so the UI doesn't need to know about the storage detail.
 *
 * Exposes CRUD actions wired to the company store. Components → hooks (RULE B);
 * hooks → stores (RULE C). All Supabase I/O sits in the store (RULE D).
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo, useState } from 'react';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import {
  createService,
  updateService,
  deleteService,
  type ServiceRowInput,
} from '@/features/company/stores/company-store';

export interface ServiceRecord {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  base_rate: number;
  rate_type: 'hourly' | 'daily' | 'flat';
  has_daily_minimum: boolean;
  service_availability: 'both' | 'pre_trial_only' | 'in_trial_only';
  default_lead_days: number | null;
  default_duration_days: number | null;
  travel_multiplier: number | null;
  is_active: boolean;
  is_default: boolean;
  order: number;
  company_id: string | null;
}

interface RawMetadataRow {
  id: string;
  scope?: string | null;
  name?: string | null;
  description?: string | null;
  is_active?: string | null;
  is_default?: string | null;
  order?: number | null;
  company_id?: string | null;
  extra_schema?: Record<string, unknown> | null;
}

function toNum(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function projectService(raw: RawMetadataRow): ServiceRecord {
  const extras = (raw.extra_schema ?? {}) as Record<string, unknown>;
  const rateTypeRaw = extras.rate_type;
  const rate_type: ServiceRecord['rate_type'] =
    rateTypeRaw === 'daily' || rateTypeRaw === 'flat' || rateTypeRaw === 'hourly'
      ? rateTypeRaw
      : 'hourly';
  const availabilityRaw = extras.service_availability;
  const service_availability: ServiceRecord['service_availability'] =
    availabilityRaw === 'pre_trial_only' ||
    availabilityRaw === 'in_trial_only' ||
    availabilityRaw === 'both'
      ? availabilityRaw
      : 'both';

  const leadDays = extras.default_lead_days;
  const durationDays = extras.default_duration_days;
  const travel = extras.travel_multiplier;

  return {
    id: raw.id,
    name: raw.name ?? '',
    description: raw.description ?? null,
    category_id:
      typeof extras.category_id === 'string' ? (extras.category_id as string) : null,
    base_rate: toNum(extras.base_rate, 0),
    rate_type,
    has_daily_minimum: Boolean(extras.has_daily_minimum),
    service_availability,
    default_lead_days:
      leadDays === null || leadDays === undefined || leadDays === ''
        ? null
        : toNum(leadDays, 0),
    default_duration_days:
      durationDays === null || durationDays === undefined || durationDays === ''
        ? null
        : toNum(durationDays, 0),
    travel_multiplier:
      travel === null || travel === undefined || travel === '' ? null : toNum(travel, 0),
    is_active: raw.is_active !== 'false',
    is_default: raw.is_default === 'true',
    order: raw.order ?? 0,
    company_id: raw.company_id ?? null,
  };
}

export interface UseServicesResult {
  services: ServiceRecord[];
  saving: boolean;
  error: string | null;
  create: (input: ServiceRowInput) => Promise<void>;
  update: (id: string, patch: Partial<ServiceRowInput>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  deactivate: (id: string) => Promise<void>;
  reactivate: (id: string) => Promise<void>;
  reorder: (orderedIds: string[]) => Promise<void>;
}

/**
 * Returns the full company service list (including inactive rows). The
 * settings tab does its own filtering; trial-side consumers can keep using
 * `lookups/use-services` for the active-only filtered view.
 */
export function useServices(): UseServicesResult {
  const entities = useGraphStore(
    (s) =>
      (s.entities as Record<string, Record<string, unknown>>)['MetadataType'] ?? {},
  );

  const services = useMemo<ServiceRecord[]>(() => {
    return (Object.values(entities) as RawMetadataRow[])
      .filter((row) => row.scope === 'service')
      .map(projectService)
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
      const msg = err instanceof Error ? err.message : 'Service write failed';
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    services,
    saving,
    error,
    create: (input) => wrap(() => createService(input)),
    update: (id, patch) => wrap(() => updateService(id, patch)),
    remove: (id) => wrap(() => deleteService(id)),
    deactivate: (id) => wrap(() => updateService(id, { is_active: false })),
    reactivate: (id) => wrap(() => updateService(id, { is_active: true })),
    reorder: (orderedIds) =>
      wrap(async () => {
        // Persist a new `order` for every row whose position changed.
        const tasks: Promise<unknown>[] = [];
        orderedIds.forEach((id, index) => {
          const current = services.find((s) => s.id === id);
          if (!current || current.order !== index) {
            tasks.push(updateService(id, { order: index }));
          }
        });
        await Promise.all(tasks);
      }),
  };
}
