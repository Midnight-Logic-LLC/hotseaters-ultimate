/**
 * use-client-crud.ts — CRUD orchestrator for the `Client` entity.
 *
 * Thin wrapper over `useEntityCRUD` so callers get a uniform list / detail /
 * edit / create surface with optimistic semantics. Mutations route through
 * the clients store, which writes the PGlite view; the INSTEAD-OF triggers
 * push the change into `local_writes` and the write-sync drain reconciles
 * with Supabase. The optimistic update lives in the entity graph immediately
 * (so other views re-render) and survives a reload via PGlite durability.
 */

import { useEntityCRUD } from '@prometheus-ags/prometheus-entity-management';
import { useTier1 } from '@/app/tier1-provider';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientRow, CreateClientInput } from '@/features/clients/stores/clients-store';

export function useClientCrud() {
  const { company } = useTier1();
  const companyId = company?.id ?? null;

  return useEntityCRUD<ClientRow>({
    type: 'Client',
    listQueryKey: ['Client', 'crud', companyId ?? '__none__'],
    listFetch: async () => {
      if (!companyId) return { items: [] as ClientRow[], total: 0 };
      const rows = await clientsStore.loadClients(companyId);
      return { items: rows, total: rows.length };
    },
    normalize: (raw) => ({ id: raw.id, data: raw }),
    detailFetch: async (id) => {
      const row = await clientsStore.loadClient(String(id));
      if (!row) throw new Error(`client ${id} not found`);
      return row;
    },
    onCreate: async (data) => {
      if (!companyId) throw new Error('No active company');
      const id = await clientsStore.createClient({
        company_id: companyId,
        firm_name: String(data.firm_name ?? ''),
        client_type_id: (data.client_type_id as string | null) ?? null,
        sales_lead: (data.sales_lead as string | null) ?? null,
        phone: (data.phone as string | null) ?? null,
        website: (data.website as string | null) ?? null,
        notes: (data.notes as string | null) ?? null,
        status: (data.status as string | null) ?? 'active',
        is_lead: Boolean(data.is_lead),
      });
      const row = await clientsStore.loadClient(id);
      if (!row) throw new Error(`client ${id} did not materialize`);
      return row;
    },
    onUpdate: async (id, patch) => {
      const { firm_name, ...rest } = patch;
      const safePatch: Partial<CreateClientInput> = {
        ...rest,
        ...(typeof firm_name === 'string' ? { firm_name } : {}),
      };
      await clientsStore.updateClient(String(id), safePatch);
      const row = await clientsStore.loadClient(String(id));
      if (!row) throw new Error(`client ${id} disappeared after update`);
      return row;
    },
    onDelete: async (id) => {
      await clientsStore.deleteClient(String(id));
    },
  });
}
