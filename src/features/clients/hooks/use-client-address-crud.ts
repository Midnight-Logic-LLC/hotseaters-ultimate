/**
 * use-client-address-crud.ts — CRUD orchestrator for `ClientAddress`.
 */

import { useEntityCRUD } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientAddressRow } from '@/features/clients/stores/clients-store';

export function useClientAddressCrud(clientId: string | null) {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  return useEntityCRUD<ClientAddressRow>({
    type: 'ClientAddress',
    listQueryKey: [
      'ClientAddress',
      'crud',
      companyId ?? '__none__',
      clientId ?? '__none__',
    ],
    listFetch: async () => {
      if (!companyId || !clientId)
        return { items: [] as ClientAddressRow[], total: 0 };
      const rows = await clientsStore.loadAddresses(companyId, clientId);
      return { items: rows, total: rows.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
    onCreate: async (data) => {
      if (!companyId || !clientId) throw new Error('Missing tenant or client');
      const id = await clientsStore.createAddress({
        company_id: companyId,
        client_id: clientId,
        label: (data.label as string | null) ?? 'Main Office',
        address: (data.address as string | null) ?? null,
        city: (data.city as string | null) ?? null,
        state: (data.state as string | null) ?? null,
        zip: (data.zip as string | null) ?? null,
        is_primary: Boolean(data.is_primary),
      });
      const rows = await clientsStore.loadAddresses(companyId, clientId);
      const row = rows.find((r) => r.id === id);
      if (!row) throw new Error(`address ${id} did not materialize`);
      return row;
    },
    onUpdate: async (id, patch) => {
      if (!companyId || !clientId) throw new Error('Missing tenant or client');
      await clientsStore.updateAddress(String(id), patch);
      const rows = await clientsStore.loadAddresses(companyId, clientId);
      const row = rows.find((r) => r.id === String(id));
      if (!row) throw new Error(`address ${id} disappeared after update`);
      return row;
    },
    onDelete: async (id) => {
      await clientsStore.deleteAddress(String(id));
    },
  });
}
