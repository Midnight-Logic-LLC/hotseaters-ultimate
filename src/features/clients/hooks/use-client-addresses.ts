/**
 * use-client-addresses.ts — addresses for the current tenant, optionally
 * scoped to a single client.
 */

import { useEntityList } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientAddressRow } from '@/features/clients/stores/clients-store';

export interface UseClientAddressesResult {
  addresses: ClientAddressRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClientAddresses(
  clientId?: string | null,
): UseClientAddressesResult {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  const list = useEntityList<ClientAddressRow, ClientAddressRow>({
    type: 'ClientAddress',
    queryKey: [
      'ClientAddress',
      'list',
      companyId ?? '__none__',
      clientId ?? '__all__',
    ],
    fetch: async () => {
      if (!companyId) return { items: [] as ClientAddressRow[], total: 0 };
      const rows = await clientsStore.loadAddresses(
        companyId,
        clientId ?? undefined,
      );
      return { items: rows, total: rows.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
    enabled: !!companyId,
  });

  return {
    addresses: list.items,
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
  };
}
