/**
 * use-client-metadata.ts — read-only hooks for the `client_type` and
 * `client_tier` metadata rows scoped to the current tenant. Used by the
 * type/tier pickers and by the tier-multiplier business rule.
 */

import { useEffect, useState } from 'react';
import { useTier1 } from '@/app/tier1-provider';
import * as clientsStore from '@/features/clients/stores/clients-store';
import type { ClientTypeMetadataRow } from '@/features/clients/stores/clients-store';

function useMetadataLoader(
  loader: (companyId: string) => Promise<ClientTypeMetadataRow[]>,
): ClientTypeMetadataRow[] {
  const { company } = useTier1();
  const companyId = company?.id ?? null;
  const [rows, setRows] = useState<ClientTypeMetadataRow[]>([]);

  useEffect(() => {
    if (!companyId) {
      setRows([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await loader(companyId);
        if (!cancelled) setRows(result);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, loader]);

  return rows;
}

export function useClientTypes(): ClientTypeMetadataRow[] {
  return useMetadataLoader(clientsStore.loadClientTypes);
}

export function useClientTiers(): ClientTypeMetadataRow[] {
  return useMetadataLoader(clientsStore.loadClientTiers);
}
