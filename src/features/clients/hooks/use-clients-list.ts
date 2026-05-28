/**
 * use-clients-list.ts — list of clients for the current tenant.
 *
 * Pattern 4 migration: reads directly from the PGlite `client` unified view
 * via `useTierAQuery` instead of the `useEntityList` REST-cache bridge.
 * On browser refresh, IDB rows return immediately with zero network round-trips.
 *
 * The `ClientRow` type is imported from the clients-store so write helpers
 * (createClient, updateClient) and this read hook share the same row shape.
 *
 * Self-hosted Supabase only. HotSeatersMVP is the bible.
 */

import { useMemo } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import { useTierAQuery } from '@/shared/hooks/use-tier-a-query';
import type { ClientRow } from '@/features/clients/stores/clients-store';

export type { ClientRow };

export interface UseClientsListResult {
  clients: ClientRow[];
  isLoading: boolean;
  error: string | null;
  /** No-op — kept for API compat with callers. PGlite live queries auto-refresh. */
  refetch: () => void;
}

export function useClientsList(): UseClientsListResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const { rows, loading } = useTierAQuery<ClientRow>(
    'client',
    companyId,
    '*',
    undefined, // no extra WHERE — ORDER BY is handled separately below
  );

  // Sort firm_name A-Z to match loadClients order (ORDER BY firm_name ASC NULLS LAST).
  const clients = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const an = a.firm_name ?? '';
        const bn = b.firm_name ?? '';
        return an.localeCompare(bn);
      }),
    [rows],
  );

  return useMemo(
    () => ({
      clients,
      isLoading: loading,
      error: null,
      refetch: () => {
        // useLiveQuery auto-updates on PGlite changes — nothing to do.
      },
    }),
    [clients, loading],
  );
}
