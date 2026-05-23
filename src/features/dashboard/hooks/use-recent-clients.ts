/**
 * use-recent-clients — top N clients for the current company ordered by
 * `updated_at` descending. Defaults to 5.
 *
 * Reads from the entity-graph store. See `use-recent-trials.ts` for the
 * architectural pattern.
 */

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGraphStore } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';

export interface RecentClient {
  id: string;
  firm_name: string;
  status?: string | null;
  updated_at?: string | null;
}

interface RawClient {
  id?: string;
  company_id?: string;
  firm_name?: string | null;
  status?: string | null;
  updated_at?: string | null;
}

const EMPTY_BUCKET: Record<string, Record<string, unknown>> = Object.freeze({});

const DEFAULT_LIMIT = 5;

export function useRecentClients(limit: number = DEFAULT_LIMIT): RecentClient[] {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const bucket = useGraphStore(
    useShallow((state) => state.entities.client ?? EMPTY_BUCKET),
  );

  return useMemo<RecentClient[]>(() => {
    if (!companyId) return [];
    return (Object.values(bucket) as RawClient[])
      .filter((c) => c.company_id === companyId && c.id)
      .sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      })
      .slice(0, limit)
      .map<RecentClient>((c) => ({
        id: c.id as string,
        firm_name: c.firm_name ?? 'Untitled client',
        status: c.status ?? null,
        updated_at: c.updated_at ?? null,
      }));
  }, [companyId, bucket, limit]);
}
