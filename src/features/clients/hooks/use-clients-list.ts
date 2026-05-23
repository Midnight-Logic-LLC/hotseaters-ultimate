/**
 * use-clients-list.ts — list-of-clients hook for the current tenant.
 *
 * Wraps `useEntityList` from `@prometheus-ags/prometheus-entity-management`
 * so every component that mounts this hook sees the same normalized rows
 * (cross-view reactivity). The fetcher delegates to the clients store —
 * the only PGlite seam — so we never violate the layering rule.
 */

import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientRow } from '@/features/clients/stores/clients-store';

export interface UseClientsListResult {
  clients: ClientRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClientsList(): UseClientsListResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const list = useEntityList<ClientRow, ClientRow>({
    type: 'Client',
    queryKey: ['Client', 'list', companyId ?? '__none__'],
    fetch: async () => {
      if (!companyId) return { items: [] as ClientRow[], total: 0 };
      const rows = await clientsStore.loadClients(companyId);
      return { items: rows, total: rows.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
    enabled: !!companyId,
  });

  return {
    clients: list.items,
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
  };
}
