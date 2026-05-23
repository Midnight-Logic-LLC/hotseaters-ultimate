/**
 * use-client.ts — single-client subscription. Mirrors `useEntity` and
 * routes its loader through the clients store.
 */

import { useEntity } from '@prometheus-ags/prometheus-entity-management';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientRow } from '@/features/clients/stores/clients-store';

export interface UseClientResult {
  client: ClientRow | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClient(id: string | null | undefined): UseClientResult {
  const result = useEntity<ClientRow, ClientRow>({
    type: 'Client',
    id: id ?? null,
    fetch: async (resolvedId) => {
      const row = await clientsStore.loadClient(String(resolvedId));
      if (!row) throw new Error(`client ${resolvedId} not found`);
      return row;
    },
    normalize: (raw) => raw,
    enabled: !!id,
  });

  return {
    client: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  };
}
